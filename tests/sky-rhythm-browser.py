"""Ride four real routes through three-salvo sky/ground patrols, then shoot whilst the third salvo is arriving."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--three',type=Path,required=True);ap.add_argument('--browser',default='/usr/bin/chromium');ap.add_argument('--out',type=Path,default=Path('/tmp/sky-rhythm-qa'));args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.add_init_script("localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__skyCapture){requestAnimationFrame(frame);return;}').replace('window.__wl = {','''window.__skyQA={camera,renderer,updateVisuals,updatePalette,updateArchery,releaseBow,updateEncounters,updateThreat,updateDrones,updateBullets,clearDrones,drawBowSight,saddleScreen,bowTargets,assaultVolley,sentryMesh,missileTailGeo,missileTailF,bGravity,bCurveT,bCurveAge,bTail,bLife,bKind,bPos,shoot,arrows,surfaceAt,forms,sfx,get time(){return t},set time(v){t=v},get paused(){return paused},set paused(v){paused=v}};window.__wl = {''');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000)
  report=page.evaluate('''()=>{
   window.__skyCapture=true;const w=__wl,q=__skyQA,out=[];q.paused=true;if(q.sfx.on)q.sfx.toggle();
   for(const [route,cycle] of [['desert',1],['mountain',1],['lake',2],['silk',2]]){
    w.travelFeatured(route);q.paused=true;q.clearDrones();Object.assign(w.combat.encounter,{phase:'warning',duration:2.6,elapsed:0,cycle});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),initial=f.drones.length,ground=f.drones.filter(d=>d.sentry),site=ground.map(d=>{const tour=w.tourAt(d.x,d.z),rail=w.railway(d.x,d.z),railMargin=rail.d-rail.half,hw=w.highway(d.x,d.z);return {position:d.toArray(),road:w.rideRoute(d.x,d.z,d.y).d,half:w.rideRoute(d.x,d.z,d.y).half,margins:[tour?tour.d-tour.half:1e9,railMargin,hw.d-14]};});
    for(const s of site)if(s.road<=s.half+5||s.margins.some(m=>m<=5))throw Error('Sentry blocks a road');
    w.P.invuln=1000;const startHits=w.archery.hits,salvos=[],shots=[];let old=0,lane=0,lastShot=-9,overlap=0,maxHeight=0,maxOff=0;
    for(let i=0;i<40*20;i++){
     const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),right=new THREE.Vector3(-Math.cos(w.P.yaw),0,Math.sin(w.P.yaw)),off=(w.P.pos.x-r.cx)*right.x+(w.P.pos.z-r.cz)*right.z;
     w.inp.jx=Math.max(-.8,Math.min(.8,(lane-off)*.4));const previous=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);
     q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,previous);q.updateArchery(.05);q.updateVisuals(.05);if(i%3===0)w.loadStep();
     if(f.salvos>old){salvos.push({time:i*.05,ahead:f.ahead});old=f.salvos;lane=old%2?6:-6;}
     const eligible=q.bowTargets().filter(v=>!v.hidden&&!v.reserved&&v.visible&&v.y<q.saddleScreen().y);
     if(eligible.length&&w.combat.bullets)overlap+=.05;
     for(const d of f.drones)if(!d.sentry)maxHeight=Math.max(maxHeight,d.y-q.surfaceAt(d.x,d.z));
     maxOff=Math.max(maxOff,w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d);
     if(old>=3&&i*.05>salvos[2].time+.5&&i*.05-lastShot>.65&&eligible.length){
      const target=eligible[0],horse=q.saddleScreen(),b=w.archery,before=b.shots;WindArchery.advance(b,1);q.paused=false;
      WindArchery.begin(b,71,target.x,target.y,horse,innerWidth,innerHeight);WindArchery.move(b,71,target.x+145,target.y-8,horse);if(WindArchery.end(b,71))q.releaseBow();q.paused=true;
      if(b.shots>before){shots.push({time:i*.05,ground:!!target.d.sentry,incoming:w.combat.bullets});lastShot=i*.05;}
     }
    }
    const result={route,cycle,initial,ground:site,salvos,shots,hits:w.archery.hits-startHits,overlapSeconds:overlap,maxHeight,maxOff};
    if(salvos.length!==3||salvos[1].time-salvos[0].time<1.8||overlap<.5||result.hits<2||maxOff>14||maxHeight<75)throw Error('Broken sky/bow phrase '+JSON.stringify(result));out.push(result);
   }w.inp.jx=0;
   if(!out.some(r=>r.ground.length&&r.shots.some(s=>s.ground)))throw Error('Ground sentries were never available to the bow');
   return {routes:out};}''')
  report['trajectoryDodges']=page.evaluate('''()=>{const w=__wl,q=__skyQA,out=[];q.paused=true;
   for(const fps of [20,60,120])for(const kind of ['direct','ballistic','cruise'])for(const dodge of [false,true]){
    q.clearDrones();w.P.pos.set(8000,1000,0);w.P.vel.set(34,0,0);Object.assign(w.P,{invuln:0,hull:3,dead:false,inTunnel:false,grounded:false});
    const T=3,origin=w.P.pos.clone().add(new THREE.Vector3(380,90,0)),target=w.P.pos.clone().addScaledVector(w.P.vel,T);target.y+=.45;
    const v=target.clone().sub(origin).multiplyScalar(1/T),arc=kind==='ballistic'?WindPatrolScore.loft(T):{lift:0,gravity:0};v.y+=arc.lift;
    q.shoot(origin,v,[1,.7,.4],2,arc.gravity,kind==='cruise'?{flight:T,height:36,sway:12,rx:0,rz:1}:null);
    for(let i=0;i<fps*4;i++){const previous=w.P.pos.clone();w.P.pos.x+=34/fps;if(dodge&&i>=fps*1.4&&i<fps*2)w.P.pos.z+=8.6/fps;q.updateBullets(1/fps,previous);}
    const result={fps,kind,dodge,hull:w.P.hull};if(w.P.hull!==(dodge?3:2))throw Error('Broken real missile trajectory dodge '+JSON.stringify(result));out.push(result);
   }return out;
  }''')
  print(json.dumps(report),flush=True)
  # A real render of the new high/low silhouettes and curved tails in each phone orientation.
  for width,height in [(390,844),(844,390),(320,568)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(180);page.evaluate('''()=>{window.__skyCapture=true;const w=__wl,q=__skyQA;w.travelFeatured('desert');q.paused=true;q.clearDrones();w.combat.encounter.cycle=1;w.spawnF('assault');const f=w.forms.find(f=>!f.peace),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));
    f.pos.copy(w.P.pos).addScaledVector(dir,330);f.pos.y=q.surfaceAt(f.pos.x,f.pos.z)+f.score.altitude;f.phase='hold';f.ahead=330;f.vel.copy(w.P.vel);
    f.drones.forEach((d,i)=>{if(d.sentry){d.copy(w.P.pos).addScaledVector(dir,310).add(new THREE.Vector3(-dir.z*36,0,dir.x*36));d.y=q.surfaceAt(d.x,d.z)+3.45;}else{const s=f.score.slots[d.slot];d.copy(f.pos).addScaledVector(dir,s.depth).add(new THREE.Vector3(-dir.z*s.side,s.height,dir.x*s.side));}});
    Object.assign(w.combat.encounter,{phase:'combat',fire:false,elapsed:1,duration:32});q.updateDrones(0);f.pat=7;q.assaultVolley(f);
    for(let i=0;i<170;i++){const previous=w.P.pos.clone();w.P.pos.addScaledVector(w.P.vel,1/120);q.updateBullets(1/120,previous);q.updateVisuals(1/120);}q.updatePalette(0,true);for(let i=0;i<100;i++)q.updateVisuals(1/60);
    document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.renderer.render(w.scene,q.camera);
    if(!q.missileTailGeo.drawRange.count||q.missileTailF[23]!==0)throw Error('Missing or opaque-ended missile tails');window.__skyCapture=false;}''');page.wait_for_timeout(150);page.screenshot(path=str(args.out/(str(width)+'-sky.png')))
  page.evaluate('''()=>{const q=__skyQA;q.clearDrones();q.updateDrones(0);if(q.sentryMesh.count||q.missileTailGeo.drawRange.count)throw Error('Ground/trails survived clearing');}''')
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: sky, grounded targets, mixed fire, evasion/shooting overlap and bounded trails.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
