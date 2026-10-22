"""Four clear departures, stronger horse flow, elevation snow, a travelling sunset and wide city roads."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/voyage-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];shaders=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:shaders.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   source=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__voyageQA={models,VEHICLES,renderer,camera,skyMat,horseWake,updateVisuals,updatePalette,tintLand,newW,biomeW,get vista(){return featuredVista},get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=source,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl')
  report={'menu':page.evaluate('''()=>{const buttons=[...document.querySelectorAll('#featuredTrips button')],r=buttons.map(b=>b.getBoundingClientRect());
   if(buttons.length!==4||buttons.some(b=>b.getAttribute('aria-pressed')!=='false')||buttons.some(b=>!b.querySelector('svg')))throw Error('Unclear initial route selection');
   if(Math.max(...r.map(x=>x.y))-Math.min(...r.map(x=>x.y))>1||r.at(-1).right>innerWidth)throw Error('Four icons do not fit the mobile row');
   return {icons:4,initiallyUnselected:true,row:r.map(x=>({x:x.x,y:x.y,width:x.width,height:x.height}))};}''')}
  page.screenshot(path=str(args.out/'menu.png'));page.locator('#featuredTrips [data-journey-route="silk"]').click(timeout=120000);page.locator('#btnMenu').click()
  report['geometry']=page.evaluate('''()=>{const w=__wl,q=__voyageQA,check=(v,s)=>{if(!v)throw Error(s)},results=[];
   check(w.featured==='silk'&&w.tours.definitions.length===4,'Fourth departure failed');
   check(document.querySelectorAll('#featuredTrips2 [aria-pressed="true"]').length===1,'Selection has no single visual state');
   for(const id of ['silk','astana']){const path=w.tours.paths.find(p=>p.id===id);let grade=0,error=0;
    for(const seg of path.segments){const p=w.tours.at(path,seg.s+seg.length*.5),g=w.ground(p.x,p.z,p.y+1.3);grade=Math.max(grade,Math.abs(seg.grade));error=Math.max(error,Math.abs(g.h-p.y-.14));}
    check(grade<.13&&error<.8,'New road has a bad floor '+JSON.stringify({id,grade,error}));results.push({id,length:path.length,halfWidth:path.segments[0].half,grade,error});
   }
   check(q.vista.children.some(o=>o.userData.astana?.towers>30),'No immense city skyline');
   return results;}''');print('Geometry:',json.dumps(report['geometry']),flush=True)
  report['acceleration']=page.evaluate('''()=>{const w=__wl,q=__voyageQA;w.travelFeatured('desert');q.paused=true;w.placeAt(75100,w.railZ(75100),Math.atan2(1,w.railZd(75100)),30);w.P.invuln=1000;w.P.flow=.25;
   let t80=null,t100=null;const trace=[];for(let i=0;i<120*22;i++){w.stepPhysics(1/120);if(i%12===0)w.loadStep();const v=w.P.vel.length();if(t80===null&&v>=80)t80=i/120;if(t100===null&&v>=100)t100=i/120;if(i%120===0)trace.push(v);}
   if(!(w.S.maxSpeed>=116&&t100<12&&w.P.vel.length()>125&&w.P.hull===3))throw Error('Faster horse failed '+JSON.stringify({t80,t100,speed:w.P.vel.length(),hull:w.P.hull}));
   return {maxSpeed:w.S.maxSpeed,cruise:w.S.cruise,t80,t100,exitSpeed:w.P.vel.length(),trace};}''');print('Acceleration:',json.dumps(report['acceleration']),flush=True)
  report['drives']=[]
  for route in ['silk','astana']:
   drive=page.evaluate('''id=>{const w=__wl,q=__voyageQA,path=w.tours.paths.find(p=>p.id===id),p=w.tours.at(path,500);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),68);q.paused=true;w.P.hull=3;w.P.dead=false;w.P.invuln=0;w.P.flow=.3;w.inp.jx=w.inp.kx=w.inp.jy=w.inp.ky=0;
    let distance=0,previous=500,maxOff=0,done=false;const trace=[];
    for(let i=0;i<65000;i++){w.stepPhysics(1/120);if(i%16===0){w.loadStep();const r=w.tourAt(w.P.pos.x,w.P.pos.z);if(r?.path.id===id){const d=r.s-previous;if(d>0&&d<200)distance+=d;previous=r.s;maxOff=Math.max(maxOff,r.d);if(r.s>path.length-140){done=true;break;}}
      trace.push({pos:w.P.pos.toArray(),route:r?.path.id,off:r?.d,hull:w.P.hull,speed:w.P.vel.length()});if(trace.length>8)trace.shift();
      if(!r||r.d>r.half+5||w.P.hull<3)throw Error('New scenic road is blocked '+JSON.stringify({id,distance,trace}));
    }}if(!done)throw Error('Could not finish '+JSON.stringify({id,distance,trace}));return {id,distance,maxOff,hull:w.P.hull};}''',route)
   report['drives'].append(drive);print('Drive:',json.dumps(drive),flush=True)
  report['flow']=page.evaluate('''()=>{const w=__wl,q=__voyageQA,fx=w.flowEffects,velocity=new THREE.Vector3(130,0,0),position=w.P.pos;
   fx.clear();for(let i=0;i<120;i++)fx.update(1/60,{position,velocity,active:true});
   if(!(fx.strength>.75&&fx.lines.visible))throw Error('High speed has no wind');const positions=fx.lines.geometry.attributes.position.array;let closest=Infinity;
   for(let i=0;i<positions.length;i+=6)closest=Math.min(closest,Math.abs(positions[i+2]-position.z));
   if(closest<5.49)throw Error('Wind covers the bullet reading corridor');
   for(let i=0;i<120;i++)fx.update(1/60,{position,velocity,active:true,reduced:true});
   if(fx.lines.visible)throw Error('Reduced motion retained wind threads');
   return {capacity:positions.length/6,clearCentre:closest,reducedMotionRespected:true};}''')
  # The lake clock follows the actual loop, not elapsed wall time or a twitch of the reins.
  report['lake']=page.evaluate('''()=>{const w=__wl,q=__voyageQA;w.travelFeatured('lake');q.paused=true;w.P.invuln=0;let previous=w.tourAt(w.P.pos.x,w.P.pos.z).s,distance=0,westStart=null;
   const path=w.tours.paths.find(p=>p.id==='lake');for(let i=0;i<65000&&distance<path.length;i++){
    w.stepPhysics(1/120);const r=w.tourAt(w.P.pos.x,w.P.pos.z);w.climate.advance(w.lakeJourney,1/120,r,w.P.vel.x,w.P.vel.length());
    if(i%16===0){w.loadStep();let d=r.s-previous;if(d<-path.length*.5)d+=path.length;if(d>0&&d<200)distance+=d;previous=r.s;}
    if(westStart===null&&w.lakeJourney.eveningStart!==null)westStart={distance,vx:w.P.vel.x};
    if(w.P.hull<3||!r||r.d>r.half+5)throw Error('Lake flow left the road');
   }
   q.updatePalette(0,true);if(!(distance>=path.length&&westStart?.vx<0&&w.lakeJourney.evening>.99&&q.skyMat.uniforms.stars.value>.99))throw Error('Lake sunset did not reach stars '+JSON.stringify({distance,westStart,state:w.lakeJourney}));
   return {distance,westStart,evening:w.lakeJourney.evening,stars:q.skyMat.uniforms.stars.value};}''');print('Lake:',json.dumps(report['lake']),flush=True)
  # Real ray intersections catch scenery that has no collider but still crosses the road.
  report['visibleCorridors']=[]
  for route,fraction in [('silk',.12),('silk',.55),('silk',.87),('astana',.22),('astana',.50),('astana',.77)]:
   audit=page.evaluate('''({id,fraction})=>{const w=__wl,q=__voyageQA,path=w.tours.paths.find(p=>p.id===id),centre=path.length*fraction,p=w.tours.at(path,centre);
    w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),90);q.paused=true;w.scene.updateMatrixWorld(true);
    const meshes=[];for(const chunk of w.chunks.values())chunk.group.traverse(o=>{if(o.isMesh)meshes.push(o)});q.vista.traverse(o=>{if(o.isMesh)meshes.push(o)});
    const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);let rays=0;
    for(let s=centre-350;s<centre+350;s+=20)for(const offset of [-20,-12,0,12,20]){const a=w.tours.at(path,s),x=a.x-a.tz*offset,z=a.z+a.tx*offset,floor=w.ground(x,z,a.y+1.3).h;
     ray.set(new THREE.Vector3(x,floor+3.9,z),down);ray.near=0;ray.far=3.15;const hits=ray.intersectObjects(meshes,false);
     if(hits.length)throw Error('Visible polygon in scenic road '+JSON.stringify({id,s,offset,hit:hits[0].point.toArray()}));rays++;
    }return {id,fraction,rays};}''',{'id':route,'fraction':fraction})
   report['visibleCorridors'].append(audit)
  # Actual rendered colour and particles, including several frames of the leg-obscuring wake.
  for name,route,fraction,phase in [('spring','mountain',.05,0),('snow','mountain',.54,0),('lake-day','lake',.53,0),('lake-dusk','lake',.15,.53),('lake-stars','lake',.34,1),('samarkand','silk',.85,0),('astana','astana',.48,0)]:
   page.evaluate('''({id,fraction,phase})=>{const w=__wl,q=__voyageQA,path=w.tours.paths.find(p=>p.id===id),p=w.tours.at(path,path.length*fraction);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),110);q.paused=true;w.P.invuln=0;w.P.dead=false;w.P.grounded=w.P.onRoad=true;w.lakeJourney.evening=phase;document.querySelector('#menuSheet').hidden=true;document.querySelector('#toast').classList.remove('on');document.querySelector('#hint').hidden=true;q.updatePalette(0,true);q.paused=false;for(let i=0;i<110;i++)q.updateVisuals(1/60);q.paused=true;q.updateVisuals(0);}''',{'id':route,'fraction':fraction,'phase':phase})
   page.wait_for_timeout(200);page.screenshot(path=str(args.out/(name+'.png')))
  assert not errors and not shaders,errors+shaders;report.update(pageErrors=errors,shaderErrors=shaders);(args.out/'result.json').write_text(json.dumps(report,indent=2));browser.close()
finally:server.shutdown();server.server_close()
