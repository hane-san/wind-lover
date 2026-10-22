"""Check contact-led wake emission, pause/air gating, resets and fixed GPU resources."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--browser',required=True);p.add_argument('--three',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   source=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__wakeQA={models,horseWake,updateVisuals,updatePalette,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=source,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl && window.__wlMusic');page.locator('#vehCards button').filter(has_text='キルギスの馬').click();page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__wakeQA,wake=q.horseWake,m=q.models.horse,check=(v,s)=>{if(!v)throw Error(s)},results=[];let calls=0,maxOriginError=0;const emit=wake.emit;
   wake.emit=(position,velocity,colour,weight,water,age,weather)=>{calls++;let min=Infinity;for(const leg of m.legs){const p=leg.hoof.getWorldPosition(new THREE.Vector3());min=Math.min(min,Math.hypot(p.x-position.x,p.z-position.z));}maxOriginError=Math.max(maxOriginError,min);emit(position,velocity,colour,weight,water,age,weather);};
   w.P.invuln=0;w.P.dead=false;w.P.grounded=w.P.onRoad=true;w.P.onWater=false;w.P.vel.set(Math.sin(w.P.yaw)*60,0,Math.cos(w.P.yaw)*60);w.forms.length=0;
   for(const fps of [20,30,60,120]){q.paused=false;wake.clear();m.motion=WindHorseGait.create();m.motion.cycles=1;m.motion.rate=WindHorseGait.cadence(60);m.motion.blend=1;calls=0;
    for(let i=0;i<fps*2;i++)q.updateVisuals(1/fps);results.push({fps,contacts:calls,active:wake.active});check(calls>=12&&wake.active>0&&wake.active<=240,'Missing or unbounded hoof wake');}
   check(results.every(r=>r.contacts===results[0].contacts),'Frame rate changed wake contacts');check(maxOriginError<1e-5,'Wake detached from hoof');
   for(const reason of ['paused','airborne','dead','stopped','zeroDelta']){wake.clear();calls=0;q.paused=reason==='paused';w.P.grounded=reason!=='airborne';w.P.dead=reason==='dead';w.P.vel.setLength(reason==='stopped'?0:60);for(let i=0;i<60;i++)q.updateVisuals(reason==='zeroDelta'?0:1/60);check(calls===0,reason+' emitted contacts');}
   w.P.dead=false;w.P.grounded=true;w.P.vel.set(Math.sin(w.P.yaw)*60,0,Math.cos(w.P.yaw)*60);q.paused=false;
   for(let i=0;i<60;i++)q.updateVisuals(1/60);q.paused=true;const before=Array.from(wake.points.geometry.attributes.position.array);q.updateVisuals(0);check(before.every((v,i)=>v===wake.points.geometry.attributes.position.array[i]),'Pause moved the wake');
   const p=w.P.pos.clone(),colour=new THREE.Color(0xffffff),geo=wake.points.geometry;for(let i=0;i<1000;i++)emit(p,w.P.vel,colour,1);check(wake.active===240&&geo.attributes.position.count===240,'Pool grew under load');wake.update(1);check(wake.active===0&&geo.attributes.wakeFade.array.every(v=>v===0),'Expired particles remain');
   emit(p,w.P.vel,colour,1);w.travelFeatured('mountain');check(wake.active===0,'World reset retained wake');emit(p,w.P.vel,colour,1);w.setVehicle('sidecar');check(wake.active===0,'Vehicle reset retained wake');w.setVehicle('horse');wake.emit=emit;
   check(!w.speedLines.visible,'Racing streaks returned');return {frameRates:results,maxOriginError,particleCapacity:240,gated:['paused','airborne','dead','stopped','zeroDelta'],resets:['world','vehicle']};}''')
  for region in ['lake','mountain','desert']:
   page.evaluate('''region=>{const w=__wl,q=__wakeQA;w.travelFeatured(region);w.P.invuln=0;w.P.dead=false;w.P.grounded=true;w.P.onRoad=true;w.P.vel.set(Math.sin(w.P.yaw)*60,0,Math.cos(w.P.yaw)*60);q.paused=false;document.querySelector('#menuSheet').hidden=true;document.querySelector('#flash').style.opacity=0;document.querySelector('#vignette').style.opacity=0;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<100;i++){w.P.pos.addScaledVector(w.P.vel,1/60);w.P.pos.y=w.ground(w.P.pos.x,w.P.pos.z,w.P.pos.y).h+1;q.updateVisuals(1/60);}q.paused=true;}''',region)
   page.wait_for_timeout(250);page.screenshot(path=str(args.out/(region+'.png')))
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);b.close()
finally:server.shutdown();server.server_close()
