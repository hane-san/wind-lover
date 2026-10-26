"""Verify real camera framing during an approach, a blocking wall, recovery and a tunnel."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--three',type=Path,required=True);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--out',type=Path,default=Path('/tmp/region-qa'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__cameraQA={camera,renderer,travelCam,updateVisuals,updatePalette,featuredWalls,clearEnemyBody,defenceVisible,updateEncounters,updateDrones,skyMat,get clock(){return t},set clock(v){t=v},set threats(v){shellsOn=v},get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl')
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
   const w=__wl,q=__cameraQA,check=(x,m)=>{if(!x)throw Error(m)};q.paused=true;const path=w.tours.paths.find(p=>p.id==='mountain');let roofs=0,gaps=0,closed=0;
   for(const seg of path.segments.filter((s,i)=>i%4===0&&w.tours.tunnel((s.a.x+s.b.x)/2))){const p=w.tours.at(path,seg.s+seg.length/2);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),0);w.P.inTunnel=false;q.featuredWalls();const expected=w.tours.covered(seg);
    check(w.P.inTunnel===expected,'Shelter and roof disagree');const g=w.ground(p.x,p.z,p.y+1.3);check(Math.abs(g.h-p.y-.14)<.6,'Tunnel floor mismatch');
    const overhead=w.colliders.some(c=>Math.abs(c.bottom-p.y-26.05)<2&&WindTravelCamera.boomFraction({x:p.x,y:p.y+2,z:p.z},{x:p.x,y:p.y+30,z:p.z},[c])<1);
    check(overhead===expected,'Invisible or missing roof');if(w.tours.hasPanel(seg)&&w.tours.tunnel(p.x)==='gallery'){const side=-seg.half*.6;w.P.pos.set(p.x-seg.tz*side,p.y+1,p.z+seg.tx*side);q.featuredWalls();check(w.P.inTunnel,'Side canopy has no matching shelter');}if(expected)roofs++;else gaps++;if(w.tours.tunnel(p.x)==='tunnel')closed++;
   }check(gaps>0&&closed>0&&gaps>roofs,'Missing daylight openings');
   const column=path.segments.find(s=>w.tours.tunnel((s.a.x+s.b.x)/2)==='gallery'&&Math.floor(s.s/24)%3===0);
   for(const [u,hit]of [[.1,false],[.5,true]]){const p=w.tours.at(path,column.s+column.length*u),off=column.half+2.5;w.P.pos.set(p.x-column.tz*off,p.y+1,p.z+column.tx*off);const before=w.P.pos.clone();q.featuredWalls();check((w.P.pos.distanceTo(before)>.1)===hit,'Invisible gallery column wall');}
   w.travelFeatured('mountain');const box={x:w.P.pos.x+80,z:w.P.pos.z,c:1,s:0,hw:15,hd:15,bottom:w.P.pos.y,top:w.P.pos.y+100};w.colliders.push(box);const d=new THREE.Vector3(box.x,box.bottom+10,box.z);check(!q.defenceVisible(d),'Solid wall did not block enemy sight');q.clearEnemyBody(d);check(d.y>=box.top+9,'Enemy buried in structure');w.colliders.pop();
   const valley=w.tours.at(path,path.length*.86);w.P.pos.set(valley.x,valley.y+1,valley.z);w.rebuildAll();w.placeAt(valley.x,valley.z,Math.atan2(valley.tx,valley.tz),28);let river=0,grove=0;w.scene.traverse(o=>{if(o.userData.surface==='chychkan-river')river++;if(o.userData.surface==='chychkan-grove')grove++;});check(river>0&&grove>0,'Missing descent river and grove');
   const colours=[];for(const time of [0,45,90,135,180]){q.clock=time;q.updatePalette(0,true);colours.push(q.skyMat.uniforms.top.value.toArray());}check(Math.max(...colours.map(c=>Math.hypot(...c.map((v,i)=>v-colours[0][i]))))>.06,'Sky barely changes');
   w.travelFeatured('desert');q.paused=true;for(let i=0;i<100;i++)q.updateVisuals(1/60);w.spawnF('assault');const f=w.forms.find(f=>f.mode==='assault'),source=f.drones.find(d=>!d.sweeper),dir=new THREE.Vector3(Math.sin(w.P.yaw),0,Math.cos(w.P.yaw));source.copy(w.P.pos).addScaledVector(dir,180);source.y=w.P.pos.y+60;check(q.defenceVisible(source,true),'Queue fixture is outside view');
   const wall={x:(w.P.pos.x+source.x)/2,z:(w.P.pos.z+source.z)/2,c:1,s:0,hw:24,hd:24,bottom:w.P.pos.y-20,top:w.P.pos.y+200};w.colliders.push(wall);f.phase='hold';f.pending=[{p:source.clone(),v:new THREE.Vector3(-100,0,0),c:[1,1,1],kind:2,source,at:q.clock-.1}];Object.assign(w.combat.encounter,{phase:'combat',fire:false,turning:false});q.updateDrones(0);check(!w.combat.bullets&&!f.pending.length,'Hidden queued launcher fired through cover');w.colliders.splice(w.colliders.indexOf(wall),1);
   w.travelFeatured('lake');q.threats=true;Object.assign(w.combat.encounter,WindEncounters.create());q.updateEncounters(6);const scouts=w.forms.filter(f=>f.scout);check(scouts.length===1&&scouts[0].n===2,'Missing easy targets');q.updateDrones(.05);check(w.combat.bullets===0,'Scouts fire');
   const city=w.scene.children.flatMap(o=>o.children||[]).filter(o=>o.userData.astana).map(o=>o.userData.astana);check(city.length&&city[0].regionalForms.includes('sphere')&&city[0].regionalForms.includes('pyramid'),'Missing Kazakh landmarks');
   return {roofs,gaps,closed,sky:colours,scouts:scouts[0].n,lakeRest:WindEncounters.rest('lake',0,3),regionalForms:city[0].regionalForms};}''');print(json.dumps(report),flush=True)
  for name,route,x in [('gallery','mountain',35600),('short-tunnel','mountain',36810),('open-pass','mountain',37900),('astana','astana',None)]:
   page.evaluate('''([route,x])=>{const w=__wl,q=__cameraQA;let p;if(route==='astana'){const path=w.tours.paths.find(p=>p.id===route);p=w.tours.at(path,path.length*.4);}else{const path=w.tours.paths.find(p=>p.id===route),seg=path.segments.reduce((a,b)=>Math.abs(a.a.x-x)<Math.abs(b.a.x-x)?a:b);p=w.tours.at(path,seg.s);}
    w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),28);q.paused=true;w.P.inTunnel=false;q.featuredWalls();for(let i=0;i<100;i++)q.updateVisuals(1/60);q.updatePalette(0,true);document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.renderer.render(w.scene,q.camera);}''',[route,x]);page.wait_for_timeout(200);page.screenshot(path=str(args.out/(name+'.png')))
  assert not errors,errors;report['errors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: roofs, daylight gaps, terrain/structure clearance, sky and regional scenery.');browser.close()
finally:server.shutdown();server.server_close()
