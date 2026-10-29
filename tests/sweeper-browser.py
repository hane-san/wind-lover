"""Inspect the fixed bow grip and one crossing/braking/diving interceptor in the real WebGL game."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--three',type=Path,required=True);ap.add_argument('--browser',default='/usr/bin/chromium');ap.add_argument('--out',type=Path,default=Path('/tmp/sweeper-qa'));args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.add_init_script("localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__wingFreeze){requestAnimationFrame(frame);return;}').replace('window.__wl = {','''window.__wingQA={camera,renderer,sweeperMesh,updateVisuals,updateArchery,updateDrones,updateEncounters,updateThreat,updateSweeper,clearDrones,clearArrows,bowTargets,saddleScreen,drawBowSight,get time(){return t},set time(v){t=v},get paused(){return paused},set paused(v){paused=v}};window.__wl = {''');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000);page.evaluate('window.__wingFreeze=true');report={}
  report['contacts']=page.evaluate('''()=>{const w=__wl,q=__wingQA,out=[];q.paused=true;
   for(const fps of [20,60,120])for(const dodge of [false,true]){
    q.clearDrones();w.P.pos.set(8000,1000,0);w.P.vel.set(34,0,0);Object.assign(w.P,{dead:false,hull:3,invuln:0,inTunnel:false,grounded:false});Object.assign(w.combat.encounter,{phase:'combat',fire:false,turning:false});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),d=f.drones.find(d=>d.sweeper),s=d.sweeper;
    f.phase='hold';f.pos.copy(w.P.pos).add(new THREE.Vector3(380,90,0));f.vel.copy(w.P.vel);d.copy(f.pos);Object.assign(s,{phase:'windup',age:0});WindSweeper.lock(s,d,{x:8000+34*(WindSweeper.windup+WindSweeper.flight),y:1000.45,z:0},{x:1,z:0});
    for(let i=0;i<fps*4.4;i++){const previous=w.P.pos.clone();w.P.pos.x+=34/fps;if(dodge&&i>=fps*.9&&i<fps*1.5)w.P.pos.z+=8.6/fps;w.P.invuln=0;q.updateDrones(1/fps,previous);if(w.combat.bullets)throw Error('The interceptor added bullets');}
    const result={fps,dodge,hull:w.P.hull};if(w.P.hull!==(dodge?3:2))throw Error('Broken real interceptor contact '+JSON.stringify(result));out.push(result);
   }return out;
  }''')
  report['phrases']=page.evaluate('''()=>{const w=__wl,q=__wingQA,out=[];q.paused=true;
   for(const route of ['desert','mountain','lake','silk']){
    w.travelFeatured(route);q.clearDrones();Object.assign(w.combat.encounter,{phase:'combat',duration:32,elapsed:0,cycle:0});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),d=f.drones.find(d=>d.sweeper),s=d.sweeper;w.P.invuln=1000;let min=Infinity,max=-Infinity;const phases=[],events=[];
    if(!d||f.launchers.includes(d)||f.n!==6)throw Error('The wing did not replace one launcher');
    for(let i=0;i<30*20;i++){
     const previous=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,previous);q.updateArchery(.05);q.updateVisuals(.05);if(i%3===0)w.loadStep();
     if(['windup','dive'].includes(s.phase)&&f.cue)throw Error('A launcher tell overlapped the interceptor');if(!phases.includes(s.phase))phases.push(s.phase);if(s.event&&!events.some(e=>e.event===s.event))events.push({event:s.event,time:i*.05});
     if(s.phase==='cross'&&s.clock>0){const local=WindSweeper.cross(s);min=Math.min(min,local.side);max=Math.max(max,local.side);}
    }
    out.push({route,phases,events,crossSpan:max-min});
   }if(out.filter(r=>r.phases.includes('windup')&&r.phases.includes('dive')&&r.phases.includes('climb')&&r.crossSpan>120).length<2)throw Error('The real interceptor never completed its phrase '+JSON.stringify(out));return out;
  }''')
  for width,height in [(390,844),(844,390),(320,568)]:
   page.set_viewport_size({'width':width,'height':height});fixture=page.evaluate('''()=>{const w=__wl,q=__wingQA;w.travelFeatured('desert');q.clearDrones();Object.assign(w.combat.encounter,{phase:'combat',duration:32,elapsed:1,fire:false,turning:false});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),d=f.drones.find(d=>d.sweeper),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));f.pos.copy(w.P.pos).addScaledVector(dir,240);f.pos.y=w.P.pos.y+55;f.phase='hold';f.vel.copy(w.P.vel);d.copy(f.pos);Object.assign(d.sweeper,{phase:'windup',age:.15});WindSweeper.lock(d.sweeper,d,w.P.pos.clone().addScaledVector(w.P.vel,2.5),dir);
    q.paused=false;q.updateDrones(0);for(let i=0;i<100;i++)q.updateVisuals(1/60);const target=q.bowTargets().find(v=>v.d===d);if(!target?.visible||target.hidden)throw Error('Wing fixture is not visible');window.__wingVictim={f,d};WindArchery.advance(w.archery,1);document.querySelector('#toast').classList.remove('on');document.querySelector('#hint').hidden=true;
    return {x:target.x,y:target.y,hits:w.archery.hits};}''')
   page.evaluate('''([x,y])=>{const c=__wingQA.renderer.domElement,send=(type,Y)=>c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:91,pointerType:'touch',clientX:x,clientY:Y,button:0}));send('pointerdown',y);send('pointermove',y+150);window.__releaseWing=()=>send('pointerup',y+150);}''',[fixture['x'],fixture['y']])
   page.evaluate('''()=>{const q=__wingQA,b=__wl.archery;window.__fixedGrip={...b.grip};for(let i=0;i<12;i++){q.updateArchery(1/60);q.drawBowSight(1/60);}q.renderer.render(__wl.scene,q.camera);}''');page.screenshot(path=str(args.out/(str(width)+'-brake-and-draw.png')))
   assert page.evaluate('''()=>{const b=__wl.archery,p=b.pose;return __wingQA.sweeperMesh.count===1&&p&&Math.hypot(p.x+Math.sin(p.angle)*24*p.scale-__fixedGrip.x,p.y-Math.cos(p.angle)*24*p.scale-__fixedGrip.y)<.01}''')
   page.evaluate('window.__releaseWing();');page.evaluate('''()=>{const q=__wingQA;for(let i=0;i<60;i++){q.updateArchery(1/120);q.updateDrones(1/120);}q.drawBowSight(0);q.renderer.render(__wl.scene,q.camera);}''')
   assert page.evaluate('(before)=>__wl.archery.hits===before+1&&!__wingVictim.f.drones.includes(__wingVictim.d)&&__wingQA.sweeperMesh.count===0',fixture['hits']),'One arrow failed to interrupt the wing'
  report['noPhantomGunCue']=page.evaluate('''()=>{const w=__wl,q=__wingQA;w.travelFeatured('desert');q.clearDrones();Object.assign(w.combat.encounter,{phase:'combat',fire:true,turning:false});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),d=f.drones.find(d=>d.sweeper),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));f.phase='hold';f.pos.copy(w.P.pos).addScaledVector(dir,250);f.fireT=-1;f.drones=[d];f.n=1;d.copy(f.pos);d.y=w.P.pos.y+60;Object.assign(d.sweeper,{phase:'windup'});WindSweeper.lock(d.sweeper,d,w.P.pos,dir);q.updateDrones(.1);if(f.cue||w.combat.bullets)throw Error('A lone interceptor prepared a launcher salvo');return true;}''')
  # Shelter/withdrawal cancels a committed dive, and clearing removes its mesh.
  report['cancel']=page.evaluate('''()=>{const w=__wl,q=__wingQA;w.travelFeatured('desert');q.clearDrones();Object.assign(w.combat.encounter,{phase:'combat',fire:false,turning:false});w.spawnF('assault');const f=w.forms.find(f=>!f.peace),d=f.drones.find(d=>d.sweeper);f.phase='hold';Object.assign(d.sweeper,{phase:'windup'});WindSweeper.lock(d.sweeper,d,w.P.pos,{x:1,z:0});w.combat.encounter.turning=true;q.updateDrones(.05);if(d.sweeper.phase!=='climb')throw Error('A turn did not cancel the charge');q.clearDrones();q.updateDrones(0);if(q.sweeperMesh.count)throw Error('Wing survived clearing');return true;}''')
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
