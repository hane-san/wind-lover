"""Verify slow steering, a single visible aim filter, fair release and stationary recovery cues."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--browser',required=True);ap.add_argument('--three',type=Path,required=True);ap.add_argument('--out',type=Path,default=Path('/tmp/bow-response'));args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.add_init_script("localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__responseFreeze){requestAnimationFrame(frame);return;}').replace('window.__wl = {', '''window.__responseQA={camera,renderer,sfx,arrows,bowInk,updateArchery,updateVisuals,updateEncounters,updateThreat,updateDrones,clearDrones,clearArrows,bowTargets,saddleScreen,drawBowSight,get paused(){return paused},set paused(v){paused=v}};window.__wl = {''');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="desert"]').click(timeout=120000);page.evaluate('window.__responseFreeze=true')
  page.evaluate('''()=>{const q=__responseQA,c=q.renderer.domElement;
   window.__emitBow=(type,id,x,y)=>c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0}));
   window.__responseFixture=()=>{const w=__wl;q.paused=true;w.travelFeatured('desert');q.clearDrones();q.clearArrows();WindArchery.cancel(w.archery);WindArchery.advance(w.archery,1);w.spawnF('assault');const f=w.forms.find(f=>!f.peace),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));f.phase='hold';f.pos.copy(w.P.pos).addScaledVector(dir,250);f.pos.y=w.P.pos.y+45;f.vel.copy(w.P.vel);f.drones.forEach((d,i)=>d.copy(f.pos).add(new THREE.Vector3(-dir.z*(i-2)*27,i*5,dir.x*(i-2)*27)));for(let i=0;i<80;i++)q.updateVisuals(1/60);q.paused=false;return q.bowTargets().find(t=>!t.hidden&&t.visible&&t.y<q.saddleScreen().y);};
   window.__readySounds=0;const weapon=q.sfx.weapon;q.sfx.weapon=(name,o)=>{if(name==='bowdraw'&&o?.gain===.16)__readySounds++;return weapon(name,o)};
   window.__lastInk=null;const stroke=q.bowInk.stroke;q.bowInk.stroke=function(...a){const m=this.getTransform();if(!m.isIdentity&&this.lineWidth===2)__lastInk={angle:Math.atan2(m.b,m.a),x:m.e-24*m.c,y:m.f-24*m.d};return stroke.apply(this,a)};
  }''')
  report={'views':[]}
  for width,height in [(390,844),(844,390),(320,568)]:
   page.set_viewport_size({'width':width,'height':height})
   measured=page.evaluate('''()=>{const q=__responseQA,b=__wl.archery,t=__responseFixture();if(!t)throw Error('No visible fixture');
    __emitBow('pointerdown',81,t.x,t.y);__emitBow('pointermove',81,t.x,innerHeight-20);q.drawBowSight(0,false);const x=t.x,y=innerHeight-20;
    for(let i=1;i<=36;i++){__emitBow('pointermove',81,x+i,y);q.updateArchery(1/120);q.drawBowSight(1/120,false);}
    if(!b.steering||b.aimGoalX>=t.x)throw Error('Slow steering was swallowed');
    __emitBow('pointercancel',81,x+36,y);return {width:innerWidth,height:innerHeight,slowSteering:true};}''')
   report['views'].append(measured)
  page.set_viewport_size({'width':390,'height':844})
  report['response']=page.evaluate('''()=>{const q=__responseQA,b=__wl.archery,out=[];
   for(const fps of [20,60,120]){const t=__responseFixture();__emitBow('pointerdown',81,t.x,t.y);__emitBow('pointermove',81,t.x,innerHeight-20);__emitBow('pointermove',81,t.x+100,innerHeight-20);const start=b.aimX,goal=b.aimGoalX,grip={...b.grip};
    for(let i=0;i<fps*.1;i++){q.updateArchery(1/fps);q.drawBowSight(1/fps,false);}
    const residual=Math.abs(b.aimX-goal)/Math.abs(start-goal),angle=Math.atan2(b.aimX-grip.x,grip.y-b.aimY),ink=__lastInk;
    if(!(residual<.042&&Math.abs(angle-ink.angle)<1e-6&&Math.hypot(ink.x-grip.x,ink.y-grip.y)<.01))throw Error('Delayed or detached rendered aim '+JSON.stringify({residual,angle,ink}));out.push({fps,residual});__emitBow('pointercancel',81,t.x+100,innerHeight-20);
   }return out;}''')
  report['vanishedLock']=page.evaluate('''()=>{const q=__responseQA,w=__wl,b=w.archery,t=__responseFixture();__emitBow('pointerdown',81,t.x,t.y);__emitBow('pointermove',81,t.x,t.y+170);q.drawBowSight(.1);const shown=b.target,shots=b.shots;if(!shown)throw Error('Missing shown lock');
   shown.f.drones.splice(shown.f.drones.indexOf(shown.d),1);shown.f.n=shown.f.drones.length;__emitBow('pointerup',81,t.x,t.y+170);const a=q.arrows.find(a=>a.life>0);if(b.shots!==shots+1||!a||a.target||shown.f.drones.some(d=>d.bowIncoming))throw Error('Release secretly acquired a neighbour');
   const ray=new THREE.Vector3(b.aimX/innerWidth*2-1,1-b.aimY/innerHeight*2,.5).unproject(q.camera).sub(q.camera.position).normalize();if(a.dir.dot(ray)<.99999)throw Error('Free arrow ignored the last visible ray');return true;}''')
  report['recoveryCue']=page.evaluate('''()=>{const q=__responseQA,b=__wl.archery,t=__responseFixture();__emitBow('pointerdown',81,t.x,t.y);__emitBow('pointermove',81,t.x,t.y+170);q.drawBowSight(.1);__emitBow('pointerup',81,t.x,t.y+170);
   __emitBow('pointerdown',82,t.x,t.y);__emitBow('pointermove',82,t.x,t.y+170);__readySounds=0;q.updateArchery(.12);if(__readySounds)throw Error('Early recovery cue');q.updateArchery(.13);if(__readySounds!==1||!b.readyCue)throw Error('A stationary prepared draw never became ready');for(let i=0;i<30;i++)q.updateArchery(1/60);if(__readySounds!==1)throw Error('Repeated held-ready cue');
   const before=b.shots;__emitBow('pointermove',82,t.x,t.y);__emitBow('pointermove',82,t.x,t.y+170);if(__readySounds!==2)throw Error('Let-down could not rearm feedback');__emitBow('pointercancel',82,t.x,t.y+170);if(b.shots!==before)throw Error('Cancel fired a prepared shot');return true;}''')
  report['ridingDraws']=page.evaluate('''()=>{const w=__wl,q=__responseQA,out=[];if(q.sfx.on)q.sfx.toggle();
   for(const route of ['desert','mountain','lake','silk']){
    w.travelFeatured(route);q.paused=false;w.P.invuln=0;const startHits=w.archery.hits,startShots=w.archery.shots,start=w.P.pos.clone();let lane=0,lastCount=0,nextShot=0,draw=null,minHull=3,maxOff=0;
    for(let i=0;i<90*20;i++){
     const now=i*.05,r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),right=new THREE.Vector3(-Math.cos(w.P.yaw),0,Math.sin(w.P.yaw)),offset=(w.P.pos.x-r.cx)*right.x+(w.P.pos.z-r.cz)*right.z;
     w.inp.jx=Math.max(-.8,Math.min(.8,(lane-offset)*.35));w.inp.jy=0;const previous=w.P.pos.clone();for(let j=0;j<6;j++)w.stepPhysics(1/120);q.updateEncounters(.05);q.updateThreat(.05);q.updateDrones(.05,previous);q.updateArchery(.05);q.updateVisuals(.05);if(i%3===0)w.loadStep();
     const incoming=w.combat.bullets;if(incoming>lastCount+4)lane=lane>0?-7:7;lastCount=incoming;
     if(draw){const u=Math.min(1,(now-draw.time)/.25);__emitBow('pointermove',91,draw.x,draw.y+150*u);q.drawBowSight(.05);if(u>=1){__emitBow('pointerup',91,draw.x,draw.y+150);draw=null;nextShot=now+.3;}}
     else if(now>=nextShot){const t=q.bowTargets().find(t=>!t.hidden&&!t.reserved&&t.visible&&t.distance<360&&t.y<q.saddleScreen().y&&t.y+150<innerHeight-8);if(t){draw={x:t.x,y:t.y,time:now};__emitBow('pointerdown',91,t.x,t.y);}}
     minHull=Math.min(minHull,w.P.hull);maxOff=Math.max(maxOff,w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y).d);if(w.P.dead)throw Error('A held-draw riding run died '+route);
    }
    if(draw)__emitBow('pointercancel',91,draw.x,draw.y+150);const row={route,shots:w.archery.shots-startShots,hits:w.archery.hits-startHits,minHull,endHull:w.P.hull,maxOff,distance:w.P.pos.distanceTo(start)};
    if(!(row.hits>=3&&row.hits/row.shots>=.7&&row.maxOff<14&&row.distance>2500))throw Error('Held draws failed the riding loop '+JSON.stringify(row));out.push(row);
   }w.inp.jx=0;return out;}''')
  page.evaluate('''()=>{const q=__responseQA,t=__responseFixture();__emitBow('pointerdown',81,t.x,t.y);__emitBow('pointermove',81,t.x,innerHeight-20);for(let i=0;i<20;i++){__emitBow('pointermove',81,t.x+i*2,innerHeight-20);q.updateArchery(1/60);q.drawBowSight(1/60);}q.renderer.render(__wl.scene,q.camera);document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');}''');page.screenshot(path=str(args.out/'response-draw.png'))
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
