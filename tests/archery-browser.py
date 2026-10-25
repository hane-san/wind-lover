"""Exercise mounted bow gestures, independent reins, one-hit kills and forward missile patrols in WebGL."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--browser',default='/usr/bin/chromium');ap.add_argument('--three',type=Path,required=True);ap.add_argument('--out',type=Path,default=Path('/tmp/archery-qa'));args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__bowCapture){requestAnimationFrame(frame);return;}').replace('window.__wl = {', '''window.__bowQA={camera,renderer,models,updateArchery,updateVisuals,updatePalette,updateDrones,updateEncounters,updateThreat,clearDrones,drawBowSight,saddleScreen,bowTargets,assaultVolley,kineticVolley,updateBullets,bLife,bKind,bPos,bVel,forms,sfx,barrageBodies,barrageExhaust,arrows,releaseBow,openSheet,closeSheet,get time(){return t},set time(v){t=v},get attack(){return shellsOn},set attack(v){shellsOn=v},get paused(){return paused},set paused(v){paused=v}};
    window.__wl = {''');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl',timeout=120000)
  assert page.evaluate("__wl.vehicle==='horse' && __wl.S.camFov===46 && __wl.S.camHeight===20 && __wl.S.camDist===17"),'Fresh departure is not the mounted panorama'
  page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000);page.locator('#btnMenu').click()
  report={}
  report['pace']=page.evaluate('''()=>{const w=__wl,q=__bowQA;w.travelFeatured('desert');q.paused=true;const trace=[];let max=0;
   for(let i=0;i<120*25;i++){w.stepPhysics(1/120);if(i%12===0)w.loadStep();max=Math.max(max,w.P.vel.length());if(i%120===0)trace.push(w.P.vel.length());}
   if(!(trace[4]>20&&max<48&&w.P.hull===3))throw Error('Gallop pace or acceleration '+JSON.stringify({trace,max}));
   return {trace,max,cruise:w.S.cruise,top:w.S.maxSpeed};}''');print('Pace:',json.dumps(report['pace']),flush=True)
  # Use real DOM PointerEvents (two separate captured pointers) against the ordinary canvas.
  page.evaluate('''()=>{const w=__wl,q=__bowQA;w.travelFeatured('desert');q.paused=true;for(let i=0;i<100;i++)q.updateVisuals(1/60);document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.renderer.render(w.scene,q.camera);}''')
  report['gestures']=page.evaluate('''()=>{const w=__wl,q=__bowQA,c=q.renderer.domElement,horse=q.saddleScreen(),b=w.archery;
   // Keep the browser frame paused whilst dispatching synchronously; the input itself is live.
   q.paused=false;const e=(type,id,x,y)=>c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',isPrimary:id===11,clientX:x,clientY:y,button:0}));
   const sx=100,sy=Math.min(innerHeight-70,horse.y+150),ax=195,ay=Math.max(140,horse.y-240);
   const before=b.shots;e('pointerdown',11,sx,sy);e('pointermove',11,sx+35,sy);if(w.inp.jx<.5)throw Error('Lower touch did not steer');
   e('pointerdown',12,ax,ay);e('pointermove',12,horse.x,ay+150);if(b.pull<.8||w.inp.jx<.5)throw Error('Bow consumed the reins');
   q.updateVisuals(.05);q.drawBowSight(.05);q.renderer.render(w.scene,q.camera);
   const locked={pull:b.pull,steer:w.inp.jx,radius:b.radius,horse,anchor:{x:ax,y:ay}};
   e('pointerup',12,horse.x,ay+150);if(b.shots!==before+1||w.inp.jx<.5)throw Error('Bow release changed movement');
   e('pointerup',11,sx+35,sy);if(w.inp.jx!==0)throw Error('Reins stuck');
   WindArchery.advance(b,1);e('pointerdown',13,ax,ay);e('pointermove',13,horse.x,ay+150);e('pointercancel',13,horse.x,ay+150);if(b.shots!==before+1)throw Error('Cancellation fired an arrow');
   e('pointerdown',14,ax,ay);e('pointermove',14,horse.x,ay+150);q.openSheet('#menuSheet');e('pointerup',14,horse.x,ay+150);if(b.shots!==before+1||b.id!==null||w.inp.jx!==0)throw Error('Menu left an armed gesture');
   return {...locked,shots:b.shots-before,cancelSafe:true,multitouch:true};}''')
  # Chromium's real multi-touch pipeline, including capture/release (rather than synthetic events alone).
  horse=page.evaluate("()=>{window.__bowCapture=true;__bowQA.paused=false;WindArchery.advance(__wl.archery,1);document.querySelector('#menuSheet').hidden=true;return __bowQA.saddleScreen();}")
  page.evaluate("()=>{window.__touchLog=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>__touchLog.push({type:e.type,id:e.pointerId,x:e.clientX,y:e.clientY,shots:__wl.archery.shots,draw:__wl.archery.id,pull:__wl.archery.pull,jx:__wl.inp.jx}));}")
  session=page.context.new_cdp_session(page);lower={'id':41,'x':130,'y':min(774,horse['y']+80)};upper={'id':42,'x':195,'y':horse['y']-230}
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[lower]})
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[lower,upper]})
  moved_lower={**lower,'x':165};moved_upper={**upper,'x':upper['x']+145,'y':upper['y']-10}
  session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[moved_lower,moved_upper]})
  assert page.evaluate('__wl.inp.jx>.5 && __wl.archery.pull>.8 && __wl.archery.id!==null'),'Native multi-touch did not keep independent controls'
  shots=page.evaluate('__wl.archery.shots');session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[moved_upper]})
  assert page.evaluate('(shots)=>__wl.archery.shots===shots+1 && __wl.inp.jx>.5',shots),page.evaluate('({shots:__wl.archery.shots,logs:__touchLog,cooldown:__wl.archery.cooldown})')
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert page.evaluate('__wl.inp.jx===0 && __wl.archery.id===null')
  page.evaluate('window.__bowCapture=false;__bowQA.paused=true');report['nativeMultitouch']=True
  # Set a real, visible front patrol within bow range; hit each distinct drone through the actual upper drag.
  report['kills']=page.evaluate('''()=>{const w=__wl,q=__bowQA,b=w.archery,c=q.renderer.domElement;w.travelFeatured('desert');q.paused=true;q.attack=true;
   w.spawnF('assault');const f=w.forms.find(f=>!f.peace),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));f.phase='hold';f.pos.copy(w.P.pos).addScaledVector(dir,230);f.pos.y=w.P.pos.y+22;f.vel.copy(w.P.vel);f.drones.forEach((d,i)=>d.copy(f.pos).add(new THREE.Vector3(-dir.z*(i-1)*18,i*2,dir.x*(i-1)*18)));
   for(let i=0;i<100;i++)q.updateVisuals(1/60);const before=b.hits,initial=f.n,speed=w.P.vel.length(),kills=[];
   const d=f.drones[0],wall={x:(w.P.pos.x+d.x)/2,z:(w.P.pos.z+d.z)/2,c:1,s:0,hw:8,hd:8,bottom:w.P.pos.y-2,top:w.P.pos.y+80};w.colliders.push(wall);
   if(!q.bowTargets().find(v=>v.d===d)?.hidden)throw Error('Bow locked through a building');w.colliders.pop();
   document.querySelector('#menuSheet').hidden=true;
   while(f.drones.length){
    const d=f.drones[0],sp=d.clone().project(q.camera),x=(sp.x*.5+.5)*innerWidth,y=(.5-sp.y*.5)*innerHeight;
    if(y>=q.saddleScreen().y)throw Error('Target below the bow/movement split');
    q.paused=false;const emit=(type,Y)=>c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:21,pointerType:'touch',clientX:x,clientY:Y,button:0}));
    WindArchery.advance(b,1);emit('pointerdown',y);emit('pointermove',y+150);q.drawBowSight(.02);
    if(b.target?.d!==d)throw Error('Sight failed to lock a visible drone '+JSON.stringify({x,y,targets:q.bowTargets()}));
    const n=f.n;emit('pointerup',y+150);q.paused=true;
    for(let i=0;i<80;i++)q.updateArchery(1/120);
    if(f.n!==n-1)throw Error('One arrow did not destroy exactly one drone');kills.push({x,y,remaining:f.n});
   }
   if(b.hits-before!==initial||w.P.vel.length()!==speed||w.TURRET.state!==0)throw Error('Bow interrupted the gallop');
   Object.assign(w.combat.encounter,{phase:'combat',elapsed:6,duration:32});q.updateEncounters(.05);if(w.combat.encounter.phase!=='release')throw Error('Victory did not earn scenery');
   return {hits:b.hits-before,speedBefore:speed,speedAfter:w.P.vel.length(),kills};}''');print('Bow:',json.dumps(report['kills']),flush=True)
  # Real contact/moving-rider sweeps at 20, 60 and 120 Hz: no dodge gets hit; a timed sidestep survives.
  report['dodges']=page.evaluate('''()=>{const w=__wl,q=__bowQA,out=[];q.paused=true;
   for(const fps of [20,60,120])for(const kind of ['missile','kinetic'])for(const dodge of [false,true]){
    q.clearDrones();w.P.pos.set(8000,1000,0);w.P.vel.set(34,0,0);Object.assign(w.P,{invuln:0,hull:3,dead:false,inTunnel:false,grounded:false});
    if(kind==='missile')q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(510,22,0)),pat:3,n:3,pending:[]});
    else q.kineticVolley({pos:w.P.pos.clone().add(new THREE.Vector3(150,22,0)),pending:[]});
    for(let i=0;i<fps*5;i++){const prev=w.P.pos.clone();w.P.pos.x+=34/fps;if(dodge&&i>=fps*.2&&i<fps*.8)w.P.pos.z+=8.6/fps;q.updateBullets(1/fps,prev);}
    out.push({fps,kind,dodge,hull:w.P.hull,offset:w.P.pos.z});if(w.P.hull!==(dodge?3:2))throw Error('Undodgeable or harmless '+JSON.stringify(out.at(-1)));
   }return out;}''');print('Dodges:',json.dumps(report['dodges']),flush=True)
  report['patrols']=page.evaluate('''()=>{const w=__wl,q=__bowQA;w.travelFeatured('desert');q.paused=true;q.attack=true;w.P.invuln=1000;let missile=0,kinetic=0,maxMissiles=0,maxHostiles=0,near=null,far=null;const phases={},events=[];
   for(let i=0;i<180*20;i++){const prev=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,prev);q.updateArchery(.05);q.updateVisuals(.05);if(i%3===0)w.loadStep();
    const phase=w.combat.encounter.phase;phases[phase]=(phases[phase]||0)+.05;if(w.combat.encounter.event)events.push({time:i*.05,event:w.combat.encounter.event});
    const hostiles=w.forms.filter(f=>!f.peace&&f.phase!=='leave');maxHostiles=Math.max(maxHostiles,hostiles.reduce((n,f)=>n+f.n,0));
    let current=0;for(let n=0;n<q.bLife.length;n++)if(q.bLife[n]>0){if(q.bKind[n]===2){missile++;current++;}if(q.bKind[n]===1)kinetic++;}
    maxMissiles=Math.max(maxMissiles,current);
    for(const f of hostiles){if(f.ahead<35&&f.cue)throw Error('Rearward attack');if(f.weapon==='kinetic'&&f.cue)near=f.ahead;if(f.weapon==='missile'&&f.cue)far=f.ahead;}
    if(phase==='scenic'&&(w.combat.bullets||w.shells.length))throw Error('Quiet interval contains enemy fire');
   }
   if(!(missile>100&&kinetic>10&&maxHostiles<=8&&phases.scenic>45&&near<155&&far>285&&maxMissiles<=256))throw Error('Wrong patrol loop '+JSON.stringify({missile,kinetic,maxHostiles,phases,near,far,maxMissiles,events}));
   return {phases,events,near,far,maxMissiles,maxHostiles,hull:w.P.hull};}''');print('Patrols:',json.dumps(report['patrols']),flush=True)
  report['ridingCombats']=page.evaluate('''()=>{const w=__wl,q=__bowQA,out=[];q.paused=true;if(q.sfx.on)q.sfx.toggle();
   for(const route of ['desert','mountain','lake','silk']){
    w.travelFeatured(route);q.paused=true;q.attack=true;w.P.invuln=0;const startHits=w.archery.hits,start=w.P.pos.clone();let targetLane=0,lastCount=0,shotAt=-1,minHull=3,maxOff=0;
    for(let i=0;i<20*100;i++){
     const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),right=new THREE.Vector3(-Math.cos(w.P.yaw),0,Math.sin(w.P.yaw));
     const offset=(w.P.pos.x-r.cx)*right.x+(w.P.pos.z-r.cz)*right.z;
     w.inp.jx=Math.max(-.8,Math.min(.8,(targetLane-offset)*.35));w.inp.jy=0;
     const prev=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,prev);q.updateArchery(.05);q.updateVisuals(.05);if(i%3===0)w.loadStep();
     const count=q.barrageBodies.count;if(count>lastCount+4)targetLane=targetLane>0?-7:7;lastCount=count;
     if(i*.05-shotAt>.6){const target=q.bowTargets().find(v=>!v.hidden&&!v.reserved&&v.distance<300&&v.y<q.saddleScreen().y);
      if(target){const b=w.archery,horse=q.saddleScreen();q.paused=false;WindArchery.begin(b,71,target.x,target.y,horse,innerWidth,innerHeight);b.target=WindArchery.lock(b,q.bowTargets());WindArchery.move(b,71,horse.x,target.y+150,horse);q.drawBowSight(0,false);if(WindArchery.end(b,71))q.releaseBow();q.paused=true;shotAt=i*.05;}}
     minHull=Math.min(minHull,w.P.hull);maxOff=Math.max(maxOff,w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d);
     if(w.P.dead)throw Error('Riding combat killed the horse '+JSON.stringify({route,time:i*.05,hits:w.archery.hits-startHits,minHull,maxOff}));
    }
    const result={route,hits:w.archery.hits-startHits,minHull,endHull:w.P.hull,maxOff,distance:w.P.pos.distanceTo(start)};
    if(!(result.hits>=3&&result.maxOff<14&&result.distance>2500))throw Error('The curved-road bow loop failed '+JSON.stringify(result));out.push(result);
   }w.inp.jx=0;return out;}''');print('Riding combat:',json.dumps(report['ridingCombats']),flush=True)
  report['cancellation']=page.evaluate('''()=>{const w=__wl,q=__bowQA;w.P.dead=false;w.P.inTunnel=false;q.attack=true;q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(500,22,0)),pat:3,n:3,pending:[]});
   w.P.inTunnel=true;q.updateEncounters(.05);q.updateDrones(.05);if(w.combat.bullets||q.barrageBodies.count||w.forms.some(f=>!f.peace))throw Error('Roof did not cancel');
   w.P.inTunnel=false;q.attack=false;q.updateEncounters(.05);q.updateDrones(.05);if(w.combat.encounter.fire||w.combat.bullets)throw Error('Attack-off failed');
   q.clearDrones();q.attack=true;w.P.pos.set(8000,1000,0);w.P.vel.set(34,0,0);w.P.grounded=false;
   for(let i=0;i<10;i++)q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(500,22,0)),pat:0,n:3,pending:[]});
   // More emissions than the mesh capacity: every accepted projectile must remain visible.
   for(let i=0;i<10;i++)q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(500,22,0)),pat:0,n:3,pending:[]});
   q.updateBullets(0);if(w.combat.bullets!==256||q.barrageBodies.count!==256)throw Error('Invisible missile overflow');
   q.clearDrones();w.spawnF('assault');const f=w.forms.find(f=>!f.peace);f.pending=[{p:f.pos.clone(),v:new THREE.Vector3(-100,0,0),c:[1,1,1],kind:2,at:q.time-.1}];f.phase='hold';w.P.vel.set(-34,0,0);Object.assign(w.combat.encounter,{phase:'combat',fire:true,weapon:'missile'});q.updateDrones(0);
   if(f.pending.length||w.combat.bullets)throw Error('A withdrawing patrol fired from behind');
   return {roof:true,attackOff:true,visibleMissileCap:256,rearQueueCancelled:true};}''')
  # Real panorama render: missile silhouettes and their trails, plus a fully drawn bow.
  for size in [(390,844),(844,390),(320,568)]:
   page.set_viewport_size({'width':size[0],'height':size[1]});page.evaluate('''()=>{const w=__wl,q=__bowQA;window.__bowCapture=true;w.travelFeatured('desert');q.paused=true;q.attack=true;w.P.dead=false;w.P.invuln=1000;w.P.grounded=w.P.onRoad=true;
    const dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));w.P.vel.copy(dir).multiplyScalar(34);w.spawnF('assault');const f=w.forms.find(f=>!f.peace);f.pos.copy(w.P.pos).addScaledVector(dir,290);f.pos.y=w.P.pos.y+22;f.phase='hold';f.drones.forEach((d,i)=>d.copy(f.pos).add(new THREE.Vector3(-dir.z*(i-1)*18,i*2,dir.x*(i-1)*18)));
    f.pat=7;q.assaultVolley(f);for(let i=0;i<120;i++){const prev=w.P.pos.clone();w.P.pos.addScaledVector(w.P.vel,1/120);q.updateBullets(1/120,prev);}
    for(let i=0;i<100;i++)q.updateVisuals(1/60);q.paused=false;const target=q.bowTargets().find(t=>!t.hidden),horse=q.saddleScreen();if(!target)throw Error('No visible bow target');
    WindArchery.begin(w.archery,91,target.x,target.y,horse,innerWidth,innerHeight);WindArchery.move(w.archery,91,horse.x,target.y+150,horse);
    q.updateVisuals(.1);q.drawBowSight(.1);q.renderer.render(w.scene,q.camera);q.paused=true;document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');}''')
   # RAF draws the same paused image; draw once in its callback for the visible aiming screenshot.
   page.evaluate('''()=>{const q=__bowQA;q.paused=false;q.updateVisuals(.01);q.drawBowSight(.01);q.renderer.render(__wl.scene,q.camera);q.paused=true;}''');page.screenshot(path=str(args.out/(str(size[0])+'-bow.png')))
  # An untouched old save migrates, whilst custom camera/handling and music fields survive.
  page.evaluate('''()=>{localStorage.removeItem('windlover.mounted-bow.v1');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.settings.v11',JSON.stringify({horse:{maxSpeed:116,cruise:48,tailwind:8,camFov:0,camHeight:4.8,camTilt:0,camFrame:0,camDist:15,turn:1.2},sidecar:{camDist:12,turn:1.4},bike:{maxSpeed:91,cruise:45,camFov:38,camHeight:16,camTilt:-4,camDist:12,camFrame:.06}}));}''')
  page.reload(timeout=120000);page.wait_for_function('window.__wl');assert page.evaluate('__wl.S.maxSpeed===34 && __wl.S.cruise===20 && __wl.S.tailwind===1.5 && __wl.S.camFov===46 && __wl.S.turn===1.2')
  assert page.evaluate('(()=>{__wl.setVehicle("sidecar");return __wl.S.camDist===12 && __wl.S.camFov===0 && __wl.S.camFrame===0 && __wl.S.turn===1.4;})()')
  assert page.evaluate('(()=>{__wl.setVehicle("bike");return __wl.S.maxSpeed===91 && __wl.S.cruise===45 && __wl.S.camFov===38 && __wl.S.camFrame===.06;})()');report['savedTuningPreserved']=True
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: mounted archery, simultaneous reins, decisive hits, forward patrols and avoidable missiles.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
