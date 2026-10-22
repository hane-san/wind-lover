"""Check the restrained travel presentation in the real WebGL path without changing driving rules."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',required=True);parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];shader_errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:shader_errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__quietQA={models,camera,renderer,updateVisuals,updatePalette,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl && window.__wlMusic');page.locator('#vehCards button').filter(has_text='キルギスの馬').click();page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__quietQA;q.paused=true;const fovs=[];
   for(const speed of [40,98]){w.P.vel.set(Math.sin(w.P.yaw)*speed,0,Math.cos(w.P.yaw)*speed);for(let i=0;i<180;i++)q.updateVisuals(1/60);fovs.push(q.camera.fov);}
   if(fovs[1]-fovs[0]>3||fovs[1]>70)throw Error('Racing FOV expansion');
   if(w.speedLines.material.opacity!==0||w.trail.mesh.geometry.attributes.alpha.array.some(x=>x!==0))throw Error('Racing streaks remain');
   const pose=WindHorseGait.pose(.3,1);if(pose.riderPitch>.06||WindHorseGait.cadence(100)>1.75)throw Error('Rider still charging');
   if(w.scene.fog.far<3000)throw Error('Distant landmarks hidden');
   return{fovs,hoofCycleAtCruise:WindHorseGait.cadence(40),hoofCycleAtTop:WindHorseGait.cadence(98),fog:[w.scene.fog.near,w.scene.fog.far]};}''')
  for region in ['lake','mountain','desert']:
   page.evaluate('''r=>{const w=__wl,q=__quietQA;w.travelFeatured(r);q.paused=true;document.querySelector('#menuSheet').hidden=true;document.querySelector('#flash').style.opacity=0;document.querySelector('#vignette').style.opacity=0;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<120;i++)q.updateVisuals(1/60);}''',region)
   page.wait_for_timeout(300);page.screenshot(path=str(args.out/(region+'.png')))
  assert not errors and not shader_errors,errors+shader_errors
  report.update(pageErrors=errors,shaderErrors=shader_errors);(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
