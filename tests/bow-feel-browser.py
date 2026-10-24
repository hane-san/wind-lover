"""Check immediate small locks, committed draws, bow recoil and persistent arrow wakes in real WebGL."""
import argparse,functools,http.server,json,math,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--browser',default='/usr/bin/chromium');p.add_argument('--three',type=Path,required=True);p.add_argument('--out',type=Path,default=Path('/tmp/bow-feel-qa'));args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.add_init_script("localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__freezeBowFrame){requestAnimationFrame(frame);return;}').replace('window.__wl = {', '''window.__feelQA={camera,renderer,updateVisuals,updateDrones,updateTurret,updateArchery,clearDrones,clearArrows,saddleScreen,bowTargets,drawBowSight,bowInk,arrowWake,arrowWakeGeo,arrowGeo,arrowWakeLines,arrows,bowShards,bowShardMesh,updateBowShards,breakBowTarget,get paused(){return paused},set paused(v){paused=v}};window.__wl = {''');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000)
  page.evaluate('window.__freezeBowFrame=true');report={'views':[]}
  # Real canvas rendering, not a screenshot-only mock: inspect the small marker and physical arrows too.
  for width,height in [(390,844),(844,390),(320,568)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_function('(size)=>innerWidth===size[0]&&innerHeight===size[1]',arg=[width,height])
   setup=page.evaluate('''()=>{const w=__wl,q=__feelQA;w.travelFeatured('desert');q.paused=false;w.P.grounded=w.P.onRoad=true;
    w.spawnF('assault');const f=w.forms.find(f=>!f.peace),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));f.phase='hold';f.pos.copy(w.P.pos).addScaledVector(dir,235);f.pos.y=w.P.pos.y+22;f.vel.copy(w.P.vel);f.drones.forEach((d,i)=>d.copy(f.pos).add(new THREE.Vector3(-dir.z*(i-1)*18,i*2,dir.x*(i-1)*18)));
    Object.assign(w.combat.encounter,{phase:'combat',elapsed:1,duration:32,fire:false});q.updateDrones(0);for(let i=0;i<100;i++)q.updateVisuals(1/60);
    document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.renderer.render(w.scene,q.camera);
    const target=q.bowTargets()[0];if(!target||target.hidden)throw Error('Presentation target is hidden');window.__feelTarget=target;
    window.__bowArcs=[];window.__bowCentres=[];if(!q.bowInk.__probe){const arc=q.bowInk.arc,translate=q.bowInk.translate,stroke=q.bowInk.stroke;window.__lockStrokes=[];q.bowInk.stroke=function(){if(this.getTransform().isIdentity)__lockStrokes.push(this.strokeStyle);return stroke.apply(this,arguments);};q.bowInk.arc=function(...args){__bowArcs.push(args[2]);return arc.apply(this,args)};q.bowInk.translate=function(...args){__bowCentres.push(args);return translate.apply(this,args)};q.bowInk.__probe=true;}
    return {target:{x:target.x,y:target.y},anchor:{x:target.x-37,y:target.y},horse:q.saddleScreen(),shots:w.archery.shots};}''')
   def pointer(kind,id,x,y):page.evaluate("([type,id,x,y])=>__feelQA.renderer.domElement.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0}))",[kind,id,x,y])
   x,y=setup['anchor']['x'],setup['anchor']['y'];horse=setup['horse']
   pointer('pointerdown',80,x,y)
   assert page.evaluate('__wl.archery.target?.d===__feelTarget.d'),'A nearby touch did not lock immediately'
   assert page.evaluate('''()=>{const q=__feelQA,b=__wl.archery,p=WindArchery.layout(__feelTarget,q.saddleScreen(),innerWidth,innerHeight,b.span),centre=__bowCentres.at(-1);return __bowArcs.length===0&&(!p||(Math.abs(centre[0]-p.x)<.1&&Math.abs(centre[1]-p.y)<.1&&Math.hypot(p.x-__feelTarget.x,p.y-__feelTarget.y)>25));}'''),'Lock and bow were not separated on the shot line'
   page.screenshot(path=str(args.out/(str(width)+'-nocked.png')))
   pointer('pointermove',80,x,y+35);page.evaluate('__feelQA.renderer.render(__wl.scene,__feelQA.camera)');page.screenshot(path=str(args.out/(str(width)+'-partial.png')))
   pointer('pointerup',80,x,y+35);assert page.evaluate('(before)=>__wl.archery.shots===before && __feelQA.arrows.every(a=>a.life<=0)',setup['shots']),'A shallow draw fired'
   # Both hands may draw sideways, including a slight upward slant, without a holding timer.
   for side in [-1,1]:
    for degrees in [0,-10]:
     length=page.evaluate('3+(Math.min(96,Math.max(70,Math.min(innerWidth,innerHeight)*.22))-3)*WindArchery.minPull+.5');a=math.radians(degrees)
     pointer('pointerdown',82,x,y);pointer('pointermove',82,x+side*length*math.cos(a),y+length*math.sin(a))
     assert page.evaluate('__wl.archery.pull>=WindArchery.minPull && __wl.archery.target?.d===__feelTarget.d'),'A lateral draw lost its weight or lock'
     pointer('pointercancel',82,x,y)
   pointer('pointerdown',81,x,y);end_x=x+(-1 if x>width/2 else 1)*80;end_y=y-10;pointer('pointermove',81,end_x,end_y)
   assert page.evaluate('__wl.archery.pull>=WindArchery.minPull && __wl.archery.target?.d===__feelTarget.d')
   page.evaluate('()=>{__feelQA.updateVisuals(.06);__feelQA.drawBowSight(0);__feelQA.renderer.render(__wl.scene,__feelQA.camera)}');page.screenshot(path=str(args.out/(str(width)+'-full.png')))
   speed=page.evaluate('__wl.P.vel.length()');page.evaluate('window.__lockStrokes=[]');pointer('pointerup',81,end_x,end_y)
   assert page.evaluate('__lockStrokes.length===0'),'The lock marker survived pointer-up'
   state=page.evaluate('''()=>{const w=__wl,q=__feelQA;q.drawBowSight(0);q.renderer.render(w.scene,q.camera);return {width:innerWidth,height:innerHeight,shots:w.archery.shots,fullDraw:w.archery.drawLength,minimumDraw:3+(w.archery.drawLength-3)*WindArchery.minPull,recoil:w.archery.recoil};}''');assert state['shots']==setup['shots']+1 and state['recoil']>0
   page.screenshot(path=str(args.out/(str(width)+'-release.png')))
   page.evaluate('()=>{const q=__feelQA;for(let i=0;i<3;i++)q.updateArchery(1/60);q.drawBowSight(0);q.renderer.render(__wl.scene,q.camera)}');assert page.evaluate('__feelQA.arrowWakeGeo.drawRange.count>0 && __feelQA.arrowGeo.drawRange.count>0');page.screenshot(path=str(args.out/(str(width)+'-flight.png')))
   hits=page.evaluate('__wl.archery.hits')
   page.evaluate('(before)=>{const q=__feelQA;for(let i=0;i<60&&__wl.archery.hits===before;i++)q.updateArchery(1/60);q.updateDrones(0);q.updateTurret(1/60);q.drawBowSight(0);q.renderer.render(__wl.scene,q.camera)}',hits)
   assert page.evaluate('(before)=>__wl.archery.hits===before+1 && __feelQA.arrowWakeGeo.drawRange.count>0',hits),'The impact lost its arrow wake'
   assert page.evaluate('__feelQA.bowShardMesh.count===6'),'The drone did not break into visible parts'
   page.screenshot(path=str(args.out/(str(width)+'-hit.png')))
   assert page.evaluate('(before)=>__wl.P.vel.length()===before',speed),'Bow changed the travelling speed'
   page.evaluate('__feelQA.updateArchery(.2)');assert page.evaluate('__feelQA.arrowWakeGeo.drawRange.count===0'),'Arrow wake outlived its short pool life'
   # Pause freezes the debris; the same pool clears on travel.
   page.evaluate('''()=>{const q=__feelQA,before=q.bowShards.filter(s=>s.life>0).map(s=>s.p.toArray());q.updateBowShards(0);const after=q.bowShards.filter(s=>s.life>0).map(s=>s.p.toArray());if(!before.length||JSON.stringify(before)!==JSON.stringify(after))throw Error('Paused fragments moved');}''')
   page.evaluate('''()=>{const q=__feelQA;for(let i=0;i<100;i++)q.breakBowTarget(__feelTarget.d,__feelTarget.f.vel,new THREE.Vector3(1,0,0));q.updateBowShards(0);if(q.bowShardMesh.count!==48||q.bowShards.length!==48)throw Error('Unbounded shatter pool');q.updateBowShards(1);if(q.bowShardMesh.count!==0)throw Error('Fragments did not expire');q.breakBowTarget(__feelTarget.d,__feelTarget.f.vel,new THREE.Vector3(1,0,0));q.updateBowShards(0);q.clearArrows();WindArchery.cancel(__wl.archery);if(q.bowShardMesh.count||q.bowShards.some(s=>s.life>0))throw Error('Fragments survived cleanup');}''')
   assert page.evaluate('__feelQA.arrowWake.every(s=>s.life===0) && __feelQA.arrowWakeGeo.drawRange.count===0')
   # Inspect actual overlay pixels at the viewport edges, keeping the reticle separate from the bow.
   page.evaluate('''()=>{const q=__feelQA,w=innerWidth,h=innerHeight,horse=q.saddleScreen(),b=__wl.archery;
    for(const target of [{x:3,y:h*.32},{x:w-3,y:h*.32},{x:w*.5,y:3},{x:horse.x,y:horse.y-36},{x:horse.x,y:horse.y-105}]){
     WindArchery.begin(b,91,w*.5,h*.2,horse,w,h);b.target={...__feelTarget,...target};b.pull=1;q.drawBowSight(0,false);
     const d=q.bowInk.getImageData(0,0,w,h).data;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((x<8||x>w-9||y<8||y>h-9)&&Math.hypot(x-target.x,y-target.y)>38&&d[(y*w+x)*4+3]>8)throw Error('Bow clipped at screen edge');WindArchery.cancel(b);
    }q.drawBowSight(0,false);
   }''')
   report['views'].append(state)
  # Move a real hostile from a forward quarter to the rider's side. A rear view still requires visibility.
  page.set_viewport_size({'width':844,'height':390})
  side_hits=page.evaluate('''()=>{const w=__wl,q=__feelQA;let hits=0;
   for(const side of [-1,1]){w.travelFeatured('desert');q.paused=false;w.spawnF('assault');const f=w.forms.find(f=>!f.peace);Object.assign(w.combat.encounter,{phase:'combat',elapsed:1,duration:32,fire:false});f.phase='hold';q.updateDrones(0);for(let i=0;i<100;i++)q.updateVisuals(1/60);
    const dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw)),right=new THREE.Vector3(dir.z,0,-dir.x),d=f.drones[0];d.copy(w.P.pos).addScaledVector(dir,1).addScaledVector(right,side*16);d.y=w.P.pos.y+5;
    const v=q.bowTargets().find(t=>t.d===d);if(!v||!v.visible||v.hidden||v.ahead>=.25)throw Error('Side presentation fixture is not a visible near-side enemy: '+JSON.stringify(v));
    const canvas=q.renderer.domElement,send=(type,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:88,pointerType:'touch',clientX:x,clientY:y,button:0}));
    WindArchery.advance(w.archery,1);send('pointerdown',v.x,v.y);if(w.archery.target?.d!==d)throw Error('Near-side enemy failed to lock');
    d.addScaledVector(dir,-1);q.drawBowSight(0);if(w.archery.target?.d!==d)throw Error('Lock disappeared at directly alongside');
    const x=v.x-side*80,y=v.y-10;send('pointermove',x,y);const before=w.archery.hits,shots=w.archery.shots;send('pointerup',x,y);if(w.archery.shots!==shots+1)throw Error('Side draw did not release');for(let i=0;i<60&&w.archery.hits===before;i++)q.updateArchery(1/60);
    if(w.archery.hits!==before+1)throw Error('Side draw did not hit the side enemy');hits++;
   }return hits;
  }''')
  assert not errors,errors;report.update(pageErrors=errors,sideHits=side_hits,lateralAndSlightlyUpwardDraw=True,separatedBow=True,shatteredDrones=True,immediateNearbyLock=True,noLargeCircle=True,committedDraw=True,releaseWithoutTimer=True,hitWake=True,travelSpeedPreserved=True);(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
