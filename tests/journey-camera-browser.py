"""Verify real camera framing during an approach, a blocking wall, recovery and a tunnel."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--three',type=Path,required=True);parser.add_argument('--browser',default='/usr/bin/chromium');args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__cameraQA={camera,travelCam,updateVisuals,set threats(v){shellsOn=v},get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl')
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
    const w=__wl,q=__cameraQA,check=(v,m)=>{if(!v)throw Error(m)};q.paused=true;w.P.grounded=w.P.onRoad=true;w.P.invuln=0;
    w.P.vel.set(Math.sin(w.P.yaw)*64,0,Math.cos(w.P.yaw)*64);w.P.lean=w.P.assistLean=w.P.yawRate=0;w.inp.jx=w.inp.kx=0;w.forms.length=0;
    let maximumRoll=0;for(let i=0;i<60*60;i++){const side=i%60<30?8.6:-8.6,fx=Math.sin(w.P.yaw),fz=Math.cos(w.P.yaw);w.P.vel.set(fx*34-fz*side,0,fz*34+fx*side);q.updateVisuals(1/60);q.camera.updateMatrixWorld();maximumRoll=Math.max(maximumRoll,Math.abs(q.camera.matrixWorld.elements[1]));}check(maximumRoll<1e-7&&q.travelCam.side===0&&q.travelCam.pull===0,'Long sidesteps tilt or drift the camera');q.travelCam.clock=19;for(let i=0;i<120;i++)q.updateVisuals(1/60);check(Math.abs(q.travelCam.side)<.001,'Scenic camera drift');
    const forward=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));q.threats=true;w.forms.push({peace:false,pos:w.P.pos.clone().addScaledVector(forward,500)});
    for(let i=0;i<120;i++)q.updateVisuals(1/60);
    check(q.travelCam.focus>.99&&Math.abs(q.travelCam.side)<.01&&Math.abs(q.travelCam.pull)<.001,'Enemy approach did not frame the road');
    w.forms.length=0;q.threats=false;
    const p=w.P.pos.clone().addScaledVector(forward,-8),wall={x:p.x,z:p.z,c:Math.cos(w.P.yaw),s:Math.sin(w.P.yaw),hw:4,hd:1,bottom:p.y-1,top:p.y+12};w.colliders.push(wall);
    q.updateVisuals(1/60);const clipped=q.camera.position.distanceTo(w.P.pos),fraction=q.travelCam.boom;
    check(fraction<.6&&clipped<12,'Camera crossed the blocking wall '+JSON.stringify({clipped,fraction}));
    w.colliders.splice(w.colliders.indexOf(wall),1);for(let i=0;i<180;i++)q.updateVisuals(1/60);
    check(q.travelCam.boom>.99&&q.camera.position.distanceTo(w.P.pos)>14,'Camera failed to recover');
    const path=w.tours.paths.find(p=>p.id==='mountain'),seg=path.segments.find(s=>s.a.x>36700),a=w.tours.at(path,seg.s);
    w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx,a.tz),64);w.P.inTunnel=w.P.onRoad=w.P.grounded=true;w.P.invuln=0;
    for(let i=0;i<120;i++)q.updateVisuals(1/60);
    const road=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),off=(q.camera.position.x-road.cx)*road.nx+(q.camera.position.z-road.cz)*road.nz;
    check(Math.abs(off)<road.half-1&&q.camera.position.y<road.y+9.4,'Camera left the tunnel envelope');
    return {maximumRoll,enemyRecentring:true,blockedBoomFraction:fraction,blockedDistance:clipped,recovered:true,tunnelLateral:off,tunnelCameraHeight:q.camera.position.y-road.y};
  }''')
  assert not errors,errors;report['pageErrors']=errors;print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
