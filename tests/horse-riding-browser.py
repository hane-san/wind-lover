"""Ride real curved roads, reverse the reins, measure bounds and inspect the articulated horse."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True)
parser.add_argument('--out',type=Path,default=Path('/tmp/horse-riding-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   source=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__ridingQA={models,camera,renderer,updateVisuals,updatePalette,sfx,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {')
   r.fulfill(body=source,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000)
  page.wait_for_function('window.__wl && window.__wlMusic');page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000)
  page.locator('#btnMenu').click();report={'drives':[]}
  for route in ['desert','mountain','lake']:
   result=page.evaluate('''route=>{
    const w=__wl,q=__ridingQA,check=(v,s)=>{if(!v)throw Error(s)};q.paused=true;w.travelFeatured(route);q.paused=true;
    w.P.invuln=10000;w.P.hull=3;w.P.dead=false;w.P.stalled=false;w.P.flow=.25;
    Object.assign(w.inp,{jx:0,jy:0,kx:0,ky:0});
    const model=q.models.horse;let hops=0,maxHeight=0,maxOff=0,maxAir=0,air=0,landings=0,minSpeed=Infinity,slowestReverse=0,highPoint=null;
    // Establish contact, then alternate a short sidestep and a deliberate reversal.
    for(let i=0;i<120;i++)w.stepPhysics(1/120);
    const start=w.P.pos.clone(),initialSpeed=w.P.vel.length();
    const trace=[],anomalies=[];let lastGrounded=w.P.grounded,reverseAt=0;
    for(let i=0;i<120*28;i++){
      const sec=i/120,phase=sec%2.8;
      w.inp.jx=phase<.44?.82:phase<1.16?-.82:phase<1.44?.82:0;
      const previous=w.P.horse.lateral;w.stepPhysics(1/120);
      if(w.P.horse.launch){hops++;reverseAt=sec;}
      if(previous>0&&w.P.horse.lateral<0)slowestReverse=Math.max(slowestReverse,sec-(Math.floor(sec/2.8)*2.8+.44));
      if(!w.P.grounded)air+=1/120;else if(!lastGrounded){maxAir=Math.max(maxAir,air);air=0;landings++;}
      lastGrounded=w.P.grounded;
      const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),g=w.ground(w.P.pos.x,w.P.pos.z,w.P.pos.y);
      if(w.P.pos.y-1-g.h>2&&anomalies.length<5)anomalies.push({sec,pos:w.P.pos.toArray(),grounded:w.P.grounded,vel:w.P.vel.toArray(),floor:g.h,rail:w.railY(w.P.pos.x),route:r,colliders:w.colliders.filter(c=>Math.hypot(c.x-w.P.pos.x,c.z-w.P.pos.z)<Math.max(c.hw,c.hd)+3).slice(0,5)});
      maxOff=Math.max(maxOff,r.d);if(w.P.pos.y-1-g.h>maxHeight){maxHeight=w.P.pos.y-1-g.h;highPoint={sec,pos:w.P.pos.toArray(),floor:g.h,vel:w.P.vel.toArray(),off:r.d,hopping:w.P.hopping};}minSpeed=Math.min(minSpeed,w.P.vel.length());
      if(i%12===0){w.loadStep();q.updateVisuals(.1);}
      if(i%120===0)trace.push({sec,off:r.d,speed:w.P.vel.length(),grounded:w.P.grounded});
    }
    w.inp.jx=0;for(let i=0;i<240;i++)w.stepPhysics(1/120);
    check(hops>=2,'No lead-change bounds '+route+' '+JSON.stringify({hops,maxOff,trace,state:w.P.horse,tunnel:w.P.inTunnel}));check(maxHeight<1.4,'Horse launched too high '+JSON.stringify({route,maxHeight,maxOff,maxAir,highPoint,trace,anomalies}));
    check(maxAir<.7,'Long uncontrolled flight '+maxAir);check(maxOff<13.5,'Sidesteps left the road '+route+' '+maxOff);
    check(w.P.hull===3&&!w.P.dead,'Road collision during snaking '+route);check(minSpeed>initialSpeed*.85,'Reversal killed momentum');
    // Holding the rein must still let the player leave for the open country.
    const retained=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d;
    w.inp.jx=1;let departure=0;for(let i=0;i<120*4;i++){w.stepPhysics(1/120);departure=Math.max(departure,w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d);}
    const endDeparture=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d;check(departure>18,'Horse locked to the road '+JSON.stringify({route,departure,retained,yaw:w.P.yaw,held:w.P.hold}));
    return {route,hops,landings,maxHeight,maxAir,maxOff,minSpeed,initialSpeed,retainedOffset:retained,departure,endDeparture,travelled:w.P.pos.distanceTo(start),trace};
   }''',route)
   report['drives'].append(result);print('Ride:',json.dumps(result),flush=True)
  # Manual jump follows the same actual ground/air transition; holding does not repeatedly jump.
  page.evaluate("()=>{__wl.travelFeatured('lake');__ridingQA.paused=true;for(let i=0;i<120;i++)__wl.stepPhysics(1/120);}")
  page.locator('#menuClose').click();page.locator('body').click(position={'x':195,'y':200});page.keyboard.press('Space')
  page.wait_for_function('__wl.P.horse.pending>0 || __wl.P.hopping',timeout=10000)
  page.locator('#btnMenu').click()
  report['spaceJump']=True
  report['crossing']=page.evaluate('''()=>{const w=__wl,x=75623,z=w.railZ(x),rail=w.rideRoute(x,z,w.railY(x)+1.16),highway=w.highway(x,z);
   const lower=w.rideRoute(highway.cx,highway.cz,w.deckAt(highway.cx,highway.cz)+1.25);
   if(!('loop' in rail)||('loop' in lower))throw Error('Steering crossed between vertically separated decks');
   return {upper:'railway',lower:'highway'};}''')
  # Capture real rendering at take-off, in the air, and settled back on the road.
  for pose,steps in [('gather',8),('air',30),('landing',62)]:
   page.evaluate('''({steps})=>{const w=__wl,q=__ridingQA;w.travelFeatured('lake');q.paused=true;w.P.invuln=0;
    w.inp.jx=0;for(let i=0;i<120;i++)w.stepPhysics(1/120);
    w.inp.jx=1;for(let i=0;i<52;i++)w.stepPhysics(1/120);w.inp.jx=-1;
    for(let i=0;i<steps;i++){w.stepPhysics(1/120);q.updateVisuals(1/120);}
    document.querySelector('#menuSheet').hidden=true;document.querySelector('#toast').classList.remove('on');
    q.updatePalette(0,true);q.updateVisuals(0);
    window.__wlCam=c=>{const p=w.P.pos,f=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw)),right=new THREE.Vector3(f.z,0,-f.x);c.position.copy(p).addScaledVector(f,-5).addScaledVector(right,5);c.position.y+=2;c.lookAt(p.x,p.y+1.1,p.z);};
   }''',{'steps':steps})
   page.wait_for_timeout(250);page.screenshot(path=str(args.out/(pose+'.png')))
  assert not errors,errors;report['pageErrors']=errors
  (args.out/'result.json').write_text(json.dumps(report,indent=2));browser.close()
finally:server.shutdown();server.server_close()
