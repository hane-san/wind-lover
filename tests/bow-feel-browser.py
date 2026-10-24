"""Check immediate small locks, committed draws, bow recoil and persistent arrow wakes in real WebGL."""
import argparse,functools,http.server,json,threading
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
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__freezeBowFrame){requestAnimationFrame(frame);return;}').replace('window.__wl = {', '''window.__feelQA={camera,renderer,updateVisuals,updateDrones,updateTurret,updateArchery,clearDrones,clearArrows,saddleScreen,bowTargets,drawBowSight,bowInk,arrowWake,arrowWakeGeo,arrowGeo,arrowWakeLines,arrows,get paused(){return paused},set paused(v){paused=v}};window.__wl = {''');r.fulfill(body=s,content_type='text/html')
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
    window.__bowArcs=[];window.__bowCentres=[];if(!q.bowInk.__probe){const arc=q.bowInk.arc,translate=q.bowInk.translate;q.bowInk.arc=function(...args){__bowArcs.push(args[2]);return arc.apply(this,args)};q.bowInk.translate=function(...args){__bowCentres.push(args);return translate.apply(this,args)};q.bowInk.__probe=true;}
    return {target:{x:target.x,y:target.y},anchor:{x:target.x-37,y:target.y},horse:q.saddleScreen(),shots:w.archery.shots};}''')
   def pointer(kind,id,x,y):page.evaluate("([type,id,x,y])=>__feelQA.renderer.domElement.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0}))",[kind,id,x,y])
   x,y=setup['anchor']['x'],setup['anchor']['y'];horse=setup['horse']
   pointer('pointerdown',80,x,y)
   assert page.evaluate('__wl.archery.target?.d===__feelTarget.d'),'A nearby touch did not lock immediately'
   assert page.evaluate('Math.max(...__bowArcs)<=18 && Math.abs(__bowCentres.at(-1)[0]-__feelTarget.x)<.1'),'A large circle remains or the bow is centred on the tap'
   page.screenshot(path=str(args.out/(str(width)+'-nocked.png')))
   pointer('pointermove',80,x,y+35);page.evaluate('__feelQA.renderer.render(__wl.scene,__feelQA.camera)');page.screenshot(path=str(args.out/(str(width)+'-partial.png')))
   pointer('pointerup',80,x,y+35);assert page.evaluate('(before)=>__wl.archery.shots===before && __feelQA.arrows.every(a=>a.life<=0)',setup['shots']),'A shallow draw fired'
   # Start a second draw; no timer/hold is needed once the string is pulled far enough.
   pointer('pointerdown',81,x,y);pointer('pointermove',81,horse['x'],y+100)
   assert page.evaluate('__wl.archery.pull>=WindArchery.minPull && __wl.archery.target?.d===__feelTarget.d')
   page.evaluate('()=>{__feelQA.updateVisuals(.06);__feelQA.drawBowSight(0);__feelQA.renderer.render(__wl.scene,__feelQA.camera)}');page.screenshot(path=str(args.out/(str(width)+'-full.png')))
   speed=page.evaluate('__wl.P.vel.length()');pointer('pointerup',81,horse['x'],y+100)
   state=page.evaluate('''()=>{const w=__wl,q=__feelQA;q.drawBowSight(0);q.renderer.render(w.scene,q.camera);return {width:innerWidth,height:innerHeight,shots:w.archery.shots,fullDraw:w.archery.drawLength,minimumDraw:w.archery.drawLength*WindArchery.minPull,recoil:w.archery.recoil};}''');assert state['shots']==setup['shots']+1 and state['recoil']>0
   page.screenshot(path=str(args.out/(str(width)+'-release.png')))
   page.evaluate('()=>{const q=__feelQA;for(let i=0;i<3;i++)q.updateArchery(1/60);q.drawBowSight(0);q.renderer.render(__wl.scene,q.camera)}');assert page.evaluate('__feelQA.arrowWakeGeo.drawRange.count>0 && __feelQA.arrowGeo.drawRange.count>0');page.screenshot(path=str(args.out/(str(width)+'-flight.png')))
   hits=page.evaluate('__wl.archery.hits')
   page.evaluate('(before)=>{const q=__feelQA;for(let i=0;i<60&&__wl.archery.hits===before;i++)q.updateArchery(1/60);q.updateDrones(0);q.updateTurret(1/60);q.drawBowSight(0);q.renderer.render(__wl.scene,q.camera)}',hits)
   assert page.evaluate('(before)=>__wl.archery.hits===before+1 && __feelQA.arrowWakeGeo.drawRange.count>0',hits),'The impact lost its arrow wake'
   page.screenshot(path=str(args.out/(str(width)+'-hit.png')))
   assert page.evaluate('(before)=>__wl.P.vel.length()===before',speed),'Bow changed the travelling speed'
   page.evaluate('__feelQA.updateArchery(.2)');assert page.evaluate('__feelQA.arrowWakeGeo.drawRange.count===0'),'Arrow wake outlived its short pool life'
   page.evaluate('()=>{__feelQA.clearArrows();WindArchery.cancel(__wl.archery)}');assert page.evaluate('__feelQA.arrowWake.every(s=>s.life===0) && __feelQA.arrowWakeGeo.drawRange.count===0')
   report['views'].append(state)
  assert not errors,errors;report.update(pageErrors=errors,immediateNearbyLock=True,noLargeCircle=True,committedDraw=True,releaseWithoutTimer=True,hitWake=True,travelSpeedPreserved=True);(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
