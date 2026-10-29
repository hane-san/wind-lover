"""Drive the northern link both ways, audit physical junctions and use both new departure buttons."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/voyage-view-qa'))
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
  report={}
  report['pace']=page.evaluate('''()=>{
   const w=__wl,q=__networkQA;w.travelFeatured('desert');q.paused=true;w.placeAt(75100,w.railZ(75100),Math.atan2(1,w.railZd(75100)),8);w.P.flow=.25;w.P.invuln=1000;
   let t28=null,t38=null,maxStep=0,prev=8;for(let i=0;i<120*22;i++){w.stepPhysics(1/120);if(i%15===0)w.loadStep();const v=w.P.vel.length();maxStep=Math.max(maxStep,Math.abs(v-prev));prev=v;if(t28===null&&v>=28)t28=i/120;if(t38===null&&v>=38)t38=i/120;}
   if(w.S.maxSpeed!==38||t28===null||t28>4.5||t38===null||t38>12||w.P.hull!==3||maxStep>1)throw Error('Unnatural acceleration '+JSON.stringify({t28,t38,maxStep,hull:w.P.hull}));
   return{cruise:w.S.cruise,max:w.S.maxSpeed,t28,t38,maxFrameSpeedStep:maxStep,exit:prev};
  }''');print('Pace:',json.dumps(report['pace']),flush=True)
  report['junctions']=page.evaluate('''()=>{
   const w=__wl,q=__networkQA,path=w.tours.paths.find(p=>p.id==='charyn'),out=[];
   for(const direction of [-1,1]){
    const s=direction===1?path.length-200:200,a=w.tours.at(path,s),look=w.guidance.ahead(path,s,650,direction);
    if(Math.hypot(look.x-a.x,look.z-a.z)<590)throw Error('Look-ahead clamped to junction');
    w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx*direction,a.tz*direction),30);w.P.routeTrack=path.id;w.P.invuln=1000;w.P.hull=3;w.P.dead=false;q.paused=true;
    let yaw=0,step=0,prevYaw=w.P.yaw,prevSpeed=w.P.vel.length();for(let i=0;i<120*22;i++){w.stepPhysics(1/120);if(i%15===0)w.loadStep();yaw=Math.max(yaw,Math.abs(Math.atan2(Math.sin(w.P.yaw-prevYaw),Math.cos(w.P.yaw-prevYaw))));step=Math.max(step,Math.abs(w.P.vel.length()-prevSpeed));prevYaw=w.P.yaw;prevSpeed=w.P.vel.length();}
    const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),expected=direction===1?'astana':'lake-pass';if(r.path?.id!==expected||w.P.hull!==3||yaw>.05||step>.8)throw Error('Junction jerk '+JSON.stringify({direction,route:r.path?.id,yaw,step}));
    out.push({direction,joined:r.path.id,maxYawStep:yaw,maxSpeedStep:step,lookDistance:Math.hypot(look.x-a.x,look.z-a.z)});
   }return out;
  }''');print('Junctions:',json.dumps(report['junctions']),flush=True)
  report['glance']=page.evaluate('''()=>{
   const w=__wl,q=__networkQA;w.travelFeatured('lake');q.paused=true;w.P.invuln=0;w.P.danger=0;w.P.yawRate=0;w.P.grind=null;w.P.grounded=true;w.P.onRoad=true;w.inp.jx=w.inp.kx=0;w.forms.length=0;WindTravelCamera.reset(q.travelCam);
   for(let i=0;i<600;i++)q.updateVisuals(1/60);const look=q.travelCam.look;
   if(Math.abs(look)<.2||Math.abs(look)>1.45||Math.abs(new THREE.Vector3(1,0,0).applyQuaternion(q.camera.quaternion).y)>.001)throw Error('Lake glance is missing or unstable '+look);
   w.archery.id=99;for(let i=0;i<30;i++)q.updateVisuals(1/60);w.archery.id=null;
   if(Math.abs(q.travelCam.look)>.015)throw Error('A draw did not cancel sightseeing');
   return{lookMetres:look,approxDegrees:Math.atan(Math.abs(look)/52)*180/Math.PI,afterDraw:q.travelCam.look,roll:new THREE.Vector3(1,0,0).applyQuaternion(q.camera.quaternion).y};
  }''');print('Glance:',json.dumps(report['glance']),flush=True)
  report['views']=[]
  for route,fraction in [('lake',.73),('mountain',.17),('silk',.25),('astana',.30),('charyn',.48)]:
   result=page.evaluate('''({id,fraction})=>{
    const w=__wl,q=__networkQA,path=w.tours.paths.find(p=>p.id===id),p=w.tours.at(path,path.length*fraction);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),32);q.paused=true;
    let scenic=0,colliders=0;w.scene.traverse(o=>{if(o.userData.scenicJourney)scenic+=o.userData.scenicJourney.count;});
    for(const c of w.colliders.filter(c=>c.scenic)){const radius=Math.hypot(c.hw,c.hd);for(const r of w.tours.candidates(c.x,c.z))if(r.d<r.half+radius)throw Error('Scenery collider enters road');colliders++;}
    const ray=new THREE.Raycaster(new THREE.Vector3(p.x,p.y+6,p.z),new THREE.Vector3(0,-1,0),0,20);w.scene.updateMatrixWorld(true);const roads=[];w.scene.traverse(o=>{if(o.userData.surface==='featured-road')roads.push(o);});const hits=ray.intersectObjects(roads,false);if(!hits.length||Math.abs(hits[0].point.y-p.y-.14)>.2)throw Error('Road rendering differs from its collider');
    document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<120;i++)q.updateVisuals(1/60);q.renderer.render(w.scene,q.camera);
    return{id,scenic,scenicColliders:colliders,styles:[...new Set(w.scenicJourney.sites.filter(s=>s.route===id).map(s=>s.style))]};
   }''',{'id':route,'fraction':fraction});report['views'].append(result);page.screenshot(path=str(args.out/(route+'.png')))
  assert sum(v['scenic']>0 for v in report['views'])>=4,report['views']
  assert not errors,errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: pace, physical junctions, quiet lake view, scenery clearance and road rays.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
