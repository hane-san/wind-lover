"""Exercise horse selection, travel speeds, weapon exclusion, region music and scenery in WebGL."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path);parser.add_argument('--out',type=Path,default=Path('/tmp/wind-travel-qa'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if args.three:page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three.resolve()),content_type='application/javascript'))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {', '''window.__travelQA={models,VEHICLES,tracers,chainQ,updateEngine,crash,bulPts,geometricRoundTex,tintLand,biomeW,newW,updateTurret,updateVisuals,renderer,camera,get vista(){return featuredVista},get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {''');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe)
  page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl && window.__wlPlaylist')
  page.locator('#vehCards button').filter(has_text='キルギスの馬').click();assert page.evaluate('__wl.vehicle')=='horse'
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__travelQA,check=(v,m)=>{if(!v)throw Error(m)};
   check(q.VEHICLES.horse.defaults.maxSpeed>=116&&q.VEHICLES.horse.accel>q.VEHICLES.sidecar.accel,'Missing horse acceleration upgrade');
   w.setTurret(true);q.updateTurret(.05);check(w.TURRET.state===0&&w.TURRET.k===0,'Horse armed its turret');
   w.setVehicle('sidecar');w.setTurret(true);q.updateTurret(1);check(w.TURRET.state===2,'Existing turret no longer works');
   const target={incoming:2,doomed:true};q.tracers.push({d:target},{d:target});q.chainQ.push({d:target});w.P.stalled=true;
   w.setVehicle('horse');check(w.TURRET.state===0&&!w.P.stalled,'Switching left gun armed or engine stalled');check(target.incoming===0&&!target.doomed&&!q.tracers.length&&!q.chainQ.length,'Cancelled rounds left target reservations');
   const hull=w.P.hull;w.P.invuln=0;q.crash();check(!w.P.stalled&&w.P.hull===hull-1,'Horse crash started engine');w.P.hull=hull;
   w.P.vel.set(0,0,0);w.P.grounded=true;q.updateEngine(.1);check(!w.P.stalled,'Standing horse started cranking');w.travelFeatured('lake');
   const saved=Object.fromEntries(Object.entries(w.P).map(([k,v])=>[k,v instanceof THREE.Vector3?v.clone():v]));
   const restore=()=>{for(const[k,v]of Object.entries(saved)){if(v instanceof THREE.Vector3)w.P[k].copy(v);else w.P[k]=v;}Object.assign(w.inp,{jx:0,jy:0,kx:0,ky:0});};
   const drives=[];for(const kind of ['sidecar','horse']){w.setVehicle(kind);restore();for(let i=0;i<600;i++)w.stepPhysics(1/120);drives.push({kind,pos:w.P.pos.toArray(),speed:w.P.vel.length(),hull:w.P.hull});}
   check(drives[1].speed>drives[0].speed+3&&drives.every(d=>d.speed>60&&d.hull===3),'Horse lost its established travelling speed');
   check(q.models.horse.legs.length===4,'Missing horse legs');const rotations=q.models.horse.legs.map(l=>l.leg.rotation.x);q.updateVisuals(.05);w.P.dist+=2;q.updateVisuals(.05);check(q.models.horse.legs.some((l,i)=>Math.abs(l.leg.rotation.x-rotations[i])>.001),'Horse gait is static');
   const samples=[];for(const biome of ['steppe','snow']){const weights=Array(14).fill(0);weights[biome==='steppe'?3:5]=1;const colours=[];for(let x=0;x<3000;x+=100){const c=[.7,.7,.7];q.tintLand(c,0,x,800,weights);colours.push(c);}check(new Set(colours.map(c=>c.map(v=>v.toFixed(3)).join(','))).size>15,'Uniform land tint');samples.push({biome,colours:colours.slice(0,3)});}
   const wgt=q.biomeW(480,900,q.newW()),a=[.7,.7,.7],b=[.7,.7,.7];q.tintLand(a,0,480-.00001,900,wgt);q.tintLand(b,0,480+.00001,900,wgt);check(a.every((v,i)=>Math.abs(v-b[i])<1e-7),'Colour seam at chunk boundary');
   check(q.bulPts.material.map===q.geometricRoundTex&&q.bulPts.material.alphaTest===.4,'Fuzzy bullets remain');
   const sites=q.vista.children.filter(o=>o.userData.vista).map(o=>o.userData.vista);check(sites.length>=20,'Too few scenic reveals');check(['jailoo','balbal','caravan','aqueduct','palace','bluegate'].every(style=>sites.some(o=>o.style===style)),'Missing scenic silhouettes');
   let vertices=0;w.scene.traverse(o=>{const a=o.geometry?.attributes?.position?.array;if(a){for(const v of a)check(Number.isFinite(v),'Non-finite geometry');vertices+=a.length/3;}});
   const city=q.vista.children.find(o=>o.userData.astana)?.userData.astana;check(city?.towers>30&&city.crown&&city.tent,'Incomplete future city '+JSON.stringify(city));
   for(const path of w.tours.paths)for(const seg of path.segments){const p=city.tentSite,u=Math.max(0,Math.min(1,((p.x-seg.a.x)*seg.dx+(p.z-seg.a.z)*seg.dz)/(seg.length*seg.length)));check(Math.hypot(p.x-seg.a.x-seg.dx*u,p.z-seg.a.z-seg.dz*u)>310+seg.half,'Giant tent crosses a road');}
   return {drives,sites:sites.length,styles:[...new Set(sites.map(o=>o.style))],city,tintSamples:samples,vertices};}''')
  print(json.dumps(report,ensure_ascii=False),flush=True)
  # Automatic visits draw from each region, while repeated menu opens preserve the song.
  for region in ['desert','mountain','lake']:
   page.evaluate('(r)=>__wl.travelFeatured(r)',region)
   state=page.evaluate('({region:__wlPlaylist.region,track:__wlMusic.state.track})');assert state['region']==region,state
  original=page.evaluate('__wlMusic.state.track')
  page.locator('#menuClose').click();page.locator('#btnMenu').click();assert page.evaluate('__wlMusic.state.track')==original
  page.select_option('#musicTrack','felt-and-stars');page.evaluate("__wl.travelFeatured('desert')");assert page.evaluate('__wlMusic.state.track')=='felt-and-stars'
  page.select_option('#musicTrack','auto');assert page.evaluate('__wlPlaylist.automatic')
  # Still frames from the actual rendering path; the close view makes headwear and saddle legible.
  page.evaluate("()=>{document.querySelector('#menuSheet').hidden=true;__wl.travelFeatured('lake');__travelQA.paused=true;window.__wlCam=c=>{const p=__wl.P.pos;c.position.set(p.x+5,p.y+2.5,p.z-5);c.lookAt(p.x,p.y+1.2,p.z);};}")
  page.wait_for_timeout(500);page.screenshot(path=str(args.out/'horse-close.png'))
  for region in ['desert','mountain','lake']:
   page.evaluate('''r=>{delete window.__wlCam;__wl.travelFeatured(r);document.querySelector('#menuSheet').hidden=true;__travelQA.paused=true;}''',region);page.wait_for_timeout(500);page.screenshot(path=str(args.out/(region+'-horse.png')))
  page.reload(timeout=120000);page.wait_for_function('window.__wl');assert page.evaluate('__wl.vehicle')=='horse'
  assert not errors,errors
  report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close();print('PASS: horse, travel speeds, no turret, scenery, spatial tints, automatic/manual music and persistence.',flush=True)
finally:server.shutdown();server.server_close()
