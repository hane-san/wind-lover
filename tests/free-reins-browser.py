"""Measure deliberate heading changes, released reins and verge support with ordinary health."""
import argparse, functools, http.server, json, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--three',type=Path,required=True)
parser.add_argument('--out',type=Path,default=Path('/tmp/free-reins-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   source=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) {if(window.__freeFreeze){requestAnimationFrame(frame);return;}').replace('window.__wl = {','window.__freeQA={set paused(v){paused=v}};window.__wl = {')
   r.fulfill(body=source,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000)
  page.wait_for_function('window.__wl',timeout=120000);page.locator('#realmWarp').click(timeout=120000)
  page.evaluate('window.__freeFreeze=true;__freeQA.paused=true')
  report={'reins':[]}
  for route in ['lake','mountain','edo','okinawa']:
   rows=page.evaluate('''route=>{
    const w=__wl,out=[],angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
    if(['edo','okinawa'].includes(route))w.travelRealm('monsoon',route);else w.travelFeatured(route);
    const path=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).path;
    const base=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300).s;
    const place=(lane=0)=>{const p=w.tours.at(path,path.atlas?path.length*.4:base+100),x=p.x-p.tz*lane,z=p.z+p.tx*lane;
      w.P.pos.set(x,p.y+1,z);w.placeAt(x,z,Math.atan2(p.tx,p.tz),24);w.P.routeTrack=path.id;w.P.hull=3;w.P.invuln=0;w.P.dead=false;w.P.hold=0;w.P.lean=0;w.P.leanV=0;w.P.yawRate=0;};
    for(const fps of [30,60,120])for(const sign of [-1,1]){
      place();for(let i=0;i<fps*1.5;i++)w.stepPhysics(1/fps);const baselineRoad=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300),baseline=angle(w.P.yaw-Math.atan2(baselineRoad.tx,baselineRoad.tz));
      place();for(let i=0;i<fps*.5;i++)w.stepPhysics(1/fps);
      const yaw=w.P.yaw;w.inp.jx=sign*.65;
      for(let i=0;i<fps;i++)w.stepPhysics(1/fps);
      const r=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300),direction=Math.atan2(r.tx,r.tz),response=angle(w.P.yaw-direction-baseline);
      w.inp.jx=0;for(let i=0;i<fps*2;i++)w.stepPhysics(1/fps);
      const retained=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300),row={route,fps,sign,response,retained:retained.d,half:retained.half,hull:w.P.hull};
      if(Math.abs(response)<.025||Math.abs(response)>.55||retained.d>retained.half-1||w.P.hull!==3)throw Error('Free rein response failed '+JSON.stringify(row));out.push(row);
    }
    const half=path.segments[0].half;
    for(const sign of [-1,1]){place(sign*(half-3.5));let maxOff=0;
      for(let i=0;i<120*3;i++){w.inp.jx=i<90?sign*.75:0;w.stepPhysics(1/120);const r=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300);maxOff=Math.max(maxOff,r.d);}
      const row={route,edge:sign,maxOff,half,hull:w.P.hull};if(maxOff>half+.5||w.P.hull!==3)throw Error('A short edge input left the road '+JSON.stringify(row));out.push(row);
    }w.inp.jx=0;return out;
   }''',route)
   report['reins']+=rows;print('Reins:',json.dumps(rows),flush=True)
  assert not errors,errors;report['pageErrors']=errors
  (args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: heading freedom, release and soft verges across three frame rates.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
