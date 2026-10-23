"""Ride the live defence cycle, dodge both new weapons and inspect the actual render buffers."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/defence-qa'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];shaders=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:shaders.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','true');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   source=(root/'prototype/index.html').read_text().replace('window.__wl = {', '''window.__defenceQA={encounter,missiles,sfx,shoot,kineticVolley,missileVolley,assaultVolley,clearDrones,updateEncounters,updateThreat,updateDrones,updateBullets,updateVisuals,updatePalette,renderer,camera,slugLines,slugGeo,bulPts,bKind,bLife,shots:{},shellShots:0,
    get time(){return t},set time(v){t=v},get attack(){return shellsOn},set attack(v){shellsOn=v},set paused(v){paused=v},get paused(){return paused}};
    __defenceQA.takeHit=takeEnemyHit;
    const rawShot=shoot;shoot=(...args)=>{const key=encounter.phase+':'+(args[3]?'kinetic':'geometry');__defenceQA.shots[key]=(__defenceQA.shots[key]||0)+1;return rawShot(...args);};
    const rawShell=fireShell;fireShell=(...args)=>{__defenceQA.shellShots++;if(encounter.phase!=='combat')throw Error('Artillery fired into the scenic interval');return rawShell(...args);};
    window.__wl = {''');r.fulfill(body=source,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl && window.__defenceQA');page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000);page.locator('#btnMenu').click()
  report={'cycle':page.evaluate('''()=>{const w=__wl,q=__defenceQA;q.sfx.toggle();w.travelFeatured('desert');q.paused=true;q.attack=true;w.P.invuln=1000;const phases={},weapons=new Set(),events=[],stats={bullets:0,missiles:0,forms:0};
   for(let i=0;i<180*20;i++){const previous=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);q.time+=.05;q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,previous);if(i%3===0)w.loadStep();
    phases[q.encounter.phase]=(phases[q.encounter.phase]||0)+.05;if(q.encounter.weapon)weapons.add(q.encounter.weapon);if(q.encounter.event)events.push({at:i*.05,event:q.encounter.event});
    stats.bullets=Math.max(stats.bullets,w.combat.bullets);stats.missiles=Math.max(stats.missiles,q.missiles.active);stats.forms=Math.max(stats.forms,w.forms.length);
    if(q.encounter.phase==='scenic'&&(w.combat.bullets||q.missiles.active||w.shells.length))throw Error('The scenic interval still contains attacks');
    if(w.P.hull!==3||!Number.isFinite(w.P.pos.x))throw Error('Real journey failed during the encounter');
   }
   if(!(q.shots['combat:geometry']>200&&q.shots['combat:kinetic']>40&&q.missiles.launched>=4&&phases.scenic>phases.combat))throw Error('Missing encounter variety '+JSON.stringify({shots:q.shots,phases,missiles:q.missiles.launched,events}));
   return {phases,weapons:[...weapons],shots:q.shots,shells:q.shellShots,launched:q.missiles.launched,stats,hull:w.P.hull,events};}''')};print('Cycle:',json.dumps(report['cycle']),flush=True)
  report['dodges']=page.evaluate('''()=>{const w=__wl,q=__defenceQA,results=[];q.paused=true;
   for(const fps of [20,60,120])for(const weapon of ['kinetic','missile'])for(const dodge of [false,true]){
    q.clearDrones();w.P.pos.set(8000,1000,0);w.P.vel.set(100,0,0);Object.assign(w.P,{invuln:0,hull:3,dead:false,inTunnel:false,grounded:false});
    if(weapon==='kinetic')q.kineticVolley({pos:w.P.pos.clone().add(new THREE.Vector3(350,26,0)),pending:[]});
    else q.missiles.launch(w.P.pos.clone().add(new THREE.Vector3(550,30,0)),w.P.pos.clone().add(new THREE.Vector3(0,.45,0)),w.P.vel);
    for(let i=0;i<fps*3;i++){const previous=w.P.pos.clone();w.P.pos.x+=100/fps;if(dodge&&i>=fps*.5&&i<fps*1.1)w.P.pos.z+=8.6/fps;
      if(weapon==='kinetic')q.updateBullets(1/fps,previous);else q.missiles.update(1/fps,{position:w.P.pos,previous,velocity:w.P.vel});}
    const result={fps,weapon,dodge,hull:w.P.hull,offset:w.P.pos.z,committed:q.missiles.committed};results.push(result);
    if(w.P.hull!==(dodge?3:2))throw Error('New weapon is unavoidable or harmless '+JSON.stringify(result));
   }return results;}''');print('Dodges:',json.dumps(report['dodges']),flush=True)
  report['safety']=page.evaluate('''()=>{const w=__wl,q=__defenceQA;q.attack=true;w.P.inTunnel=false;w.P.dead=false;w.P.pos.set(8000,1000,0);w.P.vel.set(100,0,0);
   const origin=w.P.pos.clone().add(new THREE.Vector3(550,30,0));q.missiles.launch(origin,w.P.pos,w.P.vel);q.missiles.launch(origin,w.P.pos,w.P.vel);if(q.missiles.launch(origin,w.P.pos,w.P.vel))throw Error('Missile density exceeded its cap');
   w.P.inTunnel=true;q.updateEncounters(.05);q.updateDrones(.05);if(q.missiles.active||w.combat.bullets||w.forms.some(f=>!f.peace))throw Error('Roof left a live attack');
   w.P.inTunnel=false;q.attack=false;q.updateEncounters(.05);q.updateDrones(.05);if(q.encounter.fire||q.missiles.active)throw Error('Attack-off failed');
   w.P.hull=2;w.P.invuln=0;Object.assign(q.encounter,{phase:'combat',elapsed:5,duration:26});q.takeHit('実弾');if(w.P.hull!==1||q.encounter.duration>9)throw Error('Low health did not shorten the engagement');
   return {missileCapacity:q.missiles.capacity,maxSimultaneous:2,roofCancels:true,attackOffCancels:true,lowHealthRelief:true};}''')
  # Render all three actual weapon paths from the ordinary following camera.
  for weapon in ['geometry','kinetic','missile']:
   view=page.evaluate('''weapon=>{const w=__wl,q=__defenceQA;w.travelFeatured('desert');q.paused=true;q.attack=true;w.P.invuln=100;w.P.dead=false;w.P.inTunnel=false;w.P.grounded=w.P.onRoad=true;
    const dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw)),pos=w.P.pos.clone().addScaledVector(dir,weapon==='missile'?550:280);pos.y=w.P.pos.y+28;
    const f={pos,pat:7,pending:[]};if(weapon==='geometry')q.assaultVolley(f);else if(weapon==='kinetic')q.kineticVolley(f);else q.missiles.launch(pos,w.P.pos.clone().add(new THREE.Vector3(0,.45,0)),w.P.vel);
    const duration=weapon==='missile'?1.45:weapon==='kinetic'?1.1:1.15;
    for(let i=0;i<duration*120;i++){const previous=w.P.pos.clone();w.P.pos.addScaledVector(w.P.vel,1/120);q.time+=1/120;if(weapon==='missile')q.missiles.update(1/120,{position:w.P.pos,previous,velocity:w.P.vel});else q.updateBullets(1/120,previous);}
    document.querySelector('#menuSheet').hidden=true;document.querySelector('#toast').classList.remove('on');document.querySelector('#hint').hidden=true;q.updatePalette(0,true);for(let i=0;i<100;i++)q.updateVisuals(1/60);q.updateVisuals(0);
    return {bullets:w.combat.bullets,tracers:q.slugGeo.drawRange.count,missiles:q.missiles.active};}''',weapon)
   report.setdefault('views',{})[weapon]=view;page.wait_for_timeout(200);page.screenshot(path=str(args.out/(weapon+'.png')))
  assert not errors and not shaders,errors+shaders;report.update(pageErrors=errors,shaderErrors=shaders);(args.out/'result.json').write_text(json.dumps(report,indent=2));browser.close();print('PASS: real encounter cadence, distinct avoidable weapons, rendering and cancellation.',flush=True)
finally:server.shutdown();server.server_close()
