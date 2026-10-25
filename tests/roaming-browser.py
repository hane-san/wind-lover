"""Audit the connected journey and drive both directions through the joined pass without warps."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/roaming-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__networkQA={camera,renderer,travelCam,updateVisuals,updatePalette,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl')
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__networkQA,out=[];q.paused=true;
   for(const path of w.tours.paths.filter(p=>p.roaming)){
    let error=0,grade=0;for(const seg of path.segments){const p=w.tours.at(path,seg.s+seg.length*.5),g=w.ground(p.x,p.z,p.y+1.3);error=Math.max(error,Math.abs(g.h-p.y-.14));grade=Math.max(grade,Math.abs(seg.grade));}
    if(error>.8||grade>.16)throw Error('Road surface/grade '+JSON.stringify({id:path.id,error,grade}));
    const start=w.tours.at(path,80);w.P.pos.set(start.x,start.y+1,start.z);w.rebuildAll();w.placeAt(start.x,start.z,Math.atan2(start.tx,start.tz),28);w.P.routeTrack=path.id;w.P.invuln=1000;w.inp.jx=w.inp.kx=0;
    let maxOff=0,reached=0;for(let i=0;i<45000;i++){
     w.stepPhysics(1/120);if(i%30===0)w.loadStep();if(i%12===0){const r=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id);if(r?.path.id===path.id){maxOff=Math.max(maxOff,r.d);reached=Math.max(reached,r.s);}if(reached>path.length-200)break;}
    }
    if(reached<path.length-220||maxOff>52||w.P.dead)throw Error('Cannot ride loop '+JSON.stringify({id:path.id,reached,length:path.length,maxOff}));
    out.push({id:path.id,length:path.length,grade,floorError:error,maxOff,reached,maxHalf:Math.max(...path.segments.map(s=>s.half))});
   }return out;}''');print(json.dumps(report),flush=True)
  for path in ['desert-roam','mountain-roam','lake-roam','silk-roam']:
   page.evaluate('''id=>{const w=__wl,q=__networkQA,p=w.tours.at(id,w.tours.paths.find(p=>p.id===id).length*.5);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),30);q.paused=true;document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<100;i++)q.updateVisuals(1/60);q.renderer.render(w.scene,q.camera);}''',path)
   page.wait_for_timeout(180);page.screenshot(path=str(args.out/(path+'.png')))
  assert not errors,errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: four physical riding loops and rendered panoramas.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
