"""Check the tall horse rig, rear-quarter camera, interruption and world resets in real WebGL."""
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
   s=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__quietQA={models,camera,renderer,updateVisuals,updatePalette,travelCam,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl && window.__wlMusic');page.locator('#vehCards button').filter(has_text='キルギスの馬').click();page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__quietQA,m=q.models.horse,check=(v,msg)=>{if(!v)throw Error(msg)};q.paused=true;
   w.P.invuln=0;w.P.dead=w.P.stalled=w.P.inTunnel=false;w.P.grounded=w.P.onRoad=true;w.P.yawRate=w.P.lean=w.P.assistLean=0;w.P.vel.set(Math.sin(w.P.yaw)*60,0,Math.cos(w.P.yaw)*60);w.forms.length=0;w.inp.jx=w.inp.kx=0;
   m.torso.geometry.computeBoundingBox();const box=m.torso.geometry.boundingBox,size=box.getSize(new THREE.Vector3());
   check(m.legs.every(l=>l.leg.position.y>1.4),'Horse has short legs');check(size.x<.90&&size.z>2.1,'Round pony barrel remains');
   let footError=0,headLow=Infinity,headHigh=-Infinity;const local=new THREE.Vector3();
   for(let i=0;i<120;i++){m.motion.phase=i/120;m.motion.blend=1;m.motion.air=0;q.updateVisuals(0);m.group.updateMatrixWorld(true);
    for(const leg of m.legs){leg.hoof.getWorldPosition(local);m.group.worldToLocal(local);const f=WindHorseGait.foot(m.motion.phase,leg.index,1),hipZ=leg.front?m.rig.foreZ:m.rig.hindZ;footError=Math.max(footError,Math.abs(local.y-f.y),Math.abs(local.z-hipZ-f.z));}
    local.set(0,m.rig.riderTop,.01);m.rider.localToWorld(local);m.group.worldToLocal(local);headLow=Math.min(headLow,local.y);headHigh=Math.max(headHigh,local.y);
   }
   check(footError<.025,'Taller hooves detached from their planted target');check(headHigh-headLow<.13,'Traveller is bouncing rigidly');
   WindTravelCamera.reset(q.travelCam);for(let i=0;i<240;i++)q.updateVisuals(1/60);check(Math.abs(q.travelCam.side)<.001,'Starting view is not directly behind');
   q.travelCam.clock=19;for(let i=0;i<120;i++)q.updateVisuals(1/60);check(q.travelCam.side>1.6&&q.travelCam.side<2.3,'Missing bounded rear-quarter glance');
   const f=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw)),offset=q.camera.position.clone().sub(w.P.pos);check(offset.dot(f)<-10,'Camera left the rear of the horse');
   w.inp.jx=1;for(let i=0;i<60;i++)q.updateVisuals(1/60);check(Math.abs(q.travelCam.side)<.03,'Steering did not recenter');w.inp.jx=0;
   for(const reason of ['tunnel','air','enemy']){q.travelCam.side=2;q.travelCam.clock=20;w.P.inTunnel=reason==='tunnel';w.P.grounded=reason!=='air';if(reason==='enemy')w.forms.push({peace:false,pos:w.P.pos.clone().addScaledVector(f,250)});
    for(let i=0;i<60;i++)q.updateVisuals(1/60);check(Math.abs(q.travelCam.side)<.03&&q.travelCam.clock===0,reason+' did not recenter');w.forms.length=0;w.P.inTunnel=false;w.P.grounded=true;}
   q.travelCam.clock=20;q.travelCam.side=2;w.travelFeatured('lake');check(q.travelCam.clock===0&&q.travelCam.side===0,'World change retained a camera excursion');q.updateVisuals(0);const right=new THREE.Vector3(Math.cos(w.P.yaw),0,-Math.sin(w.P.yaw));check(Math.abs(q.camera.position.clone().sub(w.P.pos).dot(right))<.01,'World change retained a sideways camera offset');
   check(!w.speedLines.visible,'Racing streaks returned');return {hipHeight:m.rig.hipY,torso:size.toArray(),riderTop:m.rig.riderTop,maximumHoofError:footError,headTravel:headHigh-headLow,rearGlanceMetres:2.2,centredOn:['steering','tunnel','air','enemy','worldChange']};}''')
  for region in ['lake','mountain','desert']:
   page.evaluate('''r=>{const w=__wl,q=__quietQA;w.travelFeatured(r);q.paused=true;w.P.invuln=0;document.querySelector('#menuSheet').hidden=true;document.querySelector('#flash').style.opacity=0;document.querySelector('#vignette').style.opacity=0;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<120;i++)q.updateVisuals(1/60);}''',region)
   page.wait_for_timeout(300);page.screenshot(path=str(args.out/(region+'.png')))
  page.evaluate('''()=>{const w=__wl,q=__quietQA;w.travelFeatured('lake');q.paused=true;w.P.invuln=0;w.P.onRoad=w.P.grounded=true;w.P.inTunnel=false;w.P.yawRate=0;w.forms.length=0;document.querySelector('#toast').classList.remove('on');WindTravelCamera.reset(q.travelCam);for(let i=0;i<120;i++)q.updateVisuals(1/60);}''')
  page.wait_for_timeout(200);page.screenshot(path=str(args.out/'camera-centre.png'))
  page.evaluate('''()=>{const q=__quietQA;q.travelCam.clock=19;for(let i=0;i<120;i++)q.updateVisuals(1/60);}''')
  page.wait_for_timeout(200);page.screenshot(path=str(args.out/'camera-quarter.png'))
  assert not errors and not shader_errors,errors+shader_errors
  report.update(pageErrors=errors,shaderErrors=shader_errors);(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
