"""Audit featured itineraries, physical road surfaces, complete loop, scenery and actual driving."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--vehicle',choices=['sidecar','horse'],default='sidecar');parser.add_argument('--views-only',action='store_true');parser.add_argument('--full-only',action='store_true');parser.add_argument('--three',type=Path);parser.add_argument('--out',type=Path,default=Path('/tmp/wind-featured-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*unused):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if args.three:page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three.resolve()),content_type='application/javascript'))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify("+json.dumps(args.vehicle)+"))")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__featuredQA={renderer,camera,roadMat,get paused(){return paused},set paused(v){paused=v},get sky(){return sky},get vista(){return featuredVista}};\nwindow.__wl = {')
   r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe)
  page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wlMusic && window.__wl',timeout=120000)
  assert page.evaluate('__wlMusic.state.enabled && __wlMusic.inspect().contextState==="none"')
  assert page.locator('#featuredTrips [data-journey-route]').count()==4
  page.screenshot(path=str(args.out/'menu.png'))
  geometry=page.evaluate('''()=>{
    const w=__wl,check=(v,m)=>{if(!v)throw Error(m)},results=[];
    for(const path of w.tours.paths){let grade=0,worst=0,samples=0;
      for(const seg of path.segments){grade=Math.max(grade,Math.abs(seg.grade));const p=w.tours.at(path,seg.s+seg.length*.5),g=w.ground(p.x,p.z,p.y+1.3),error=g.h-(p.y+.14);worst=Math.max(worst,Math.abs(error));
        check(!g.water&&Math.abs(error)<.6,'Road surface mismatch '+path.id+' '+JSON.stringify({p:{x:p.x,z:p.z,y:p.y},floor:g.h,water:g.water}));samples++;}
      check(grade<.13,'Sharp road grade '+path.id+':'+grade);results.push({route:path.id,length:path.length,samples,maxGrade:grade,worstSurfaceError:worst});
    }return results;}''')
  print('Geometry:',json.dumps(geometry),flush=True)
  drives=[];audits=[]
  for route in ([] if args.full_only or args.views_only else ['desert','mountain','lake']):
   selector=('#featuredTrips' if route=='desert' else '#featuredTrips2')+f' [data-journey-route="{route}"]'
   page.locator(selector).click(timeout=120000);page.wait_for_function('(id)=>__wl.featured===id',arg=route,timeout=120000)
   page.wait_for_function('__wlMusic.state.status==="playing"',timeout=60000)
   page.wait_for_function('__wl.P.grounded',timeout=60000)
   page.locator('#btnMenu').click()
   report=page.evaluate('''id=>{const w=__wl,q=__featuredQA;q.paused=true;const renderer=q.renderer.render;q.renderer.render=()=>{};
     const initial=w.P.pos.clone();w.P.invuln=100;w.P.hull=3;w.P.dead=false;w.P.stalled=false;Object.assign(w.inp,{kx:0,ky:0,jx:0,jy:0});
     let maxOff=0,air=0;for(let i=0;i<1200;i++){w.stepPhysics(1/120);if(i%12===0)w.loadStep();if(!w.P.grounded)air++;
       const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y);maxOff=Math.max(maxOff,r.d);}
     q.renderer.render=renderer;
     if(w.P.hull!==3||w.P.stalled||w.P.pos.distanceTo(initial)<450)throw Error('Unable to cruise '+id+JSON.stringify({hull:w.P.hull,stalled:w.P.stalled,travelled:w.P.pos.distanceTo(initial),maxOff}));
     return{route:id,travelled:w.P.pos.distanceTo(initial),maxOff,airSeconds:air/120,hull:w.P.hull};}''',route)
   drives.append(report);print('Drive:',json.dumps(report),flush=True)
   result=page.evaluate('''()=>{const w=__wl,q=__featuredQA;let vertices=0,triangles=0,duplicates=0;const seen=new Set();
     w.scene.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const pos=o.geometry.attributes.position.array;for(const x of pos)if(!Number.isFinite(x))throw Error('Non-finite mesh');vertices+=pos.length/3;
       if(o.material!==q.roadMat)return;const idx=o.geometry.index?.array;
       for(let i=0;i<(idx?idx.length:pos.length/3);i+=3){const ids=idx?[idx[i],idx[i+1],idx[i+2]]:[i,i+1,i+2],pts=ids.map(j=>[pos[j*3],pos[j*3+1],pos[j*3+2]]);
         if(pts.every(v=>Math.hypot(v[0]-w.P.pos.x,v[2]-w.P.pos.z)>1500))continue;
         const key=pts.map(p=>p.map(v=>v.toFixed(3)).join(',')).sort().join('|');if(seen.has(key))duplicates++;seen.add(key);triangles++;}
     });if(duplicates)throw Error('Duplicate road triangles: '+duplicates);return{vertices,roadTriangles:triangles,duplicates};}''')
   audits.append({'route':route,**result});print('Mesh audit:',json.dumps(audits[-1]),flush=True)
   page.evaluate('''()=>{document.querySelector('#menuSheet').hidden=true;const w=__wl,q=__featuredQA;window.__wlCam=c=>{const p=w.P,fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);c.position.set(p.pos.x-fx*23,p.pos.y+6,p.pos.z-fz*23);c.lookAt(p.pos.x+fx*130,p.pos.y+5,p.pos.z+fz*130);};}''')
   page.wait_for_timeout(500);page.screenshot(path=str(args.out/(route+'.png')))
   page.evaluate("delete window.__wlCam;document.querySelector('#menuSheet').hidden=false")
  if args.full_only or args.views_only:
   page.locator('#btnGo').click(timeout=120000);page.locator('#btnMenu').click()
  full_drives=[]
  if not args.views_only:
   full_drives=page.evaluate('''()=>{
     const w=__wl,q=__featuredQA,render=q.renderer.render;q.renderer.render=()=>{};const results=[];
     for(const id of ['mountain','lake']) {
       w.travelFeatured(id);q.paused=true;w.P.invuln=0;const path=w.tours.paths.find(p=>p.id===id);let previous=w.tourAt(w.P.pos.x,w.P.pos.z).s,travelled=0,maxOff=0;
       const target=id==='lake'?path.length+80:path.length-previous-120;
       const trace=[];let steps=0;for(;steps<90000&&travelled<target;steps++) {
         w.stepPhysics(1/120);if(steps%16===0) {
           w.loadStep();const r=w.tourAt(w.P.pos.x,w.P.pos.z);if(!r||r.d>r.half+6)throw Error('Left scenic road '+id+' '+JSON.stringify({p:w.P.pos.toArray(),travelled,trace}));
           trace.push({x:w.P.pos.x,y:w.P.pos.y,z:w.P.pos.z,off:r.d,expected:r.y,grounded:w.P.grounded,air:w.P.air,speed:w.P.vel.length(),yaw:w.P.yaw});if(trace.length>12)trace.shift();let delta=r.s-previous;if(path.closed&&delta<-path.length*.5)delta+=path.length;if(delta>0&&delta<200)travelled+=delta;previous=r.s;maxOff=Math.max(maxOff,r.d);
           if(w.P.stalled||w.P.hull<3)throw Error('Road obstruction on '+id+' '+JSON.stringify({p:w.P.pos.toArray(),travelled,hull:w.P.hull,stalled:w.P.stalled,trace,colliders:w.colliders.filter(c=>Math.hypot(c.x-w.P.pos.x,c.z-w.P.pos.z)<Math.max(c.hw,c.hd)+15&&c.bottom<w.P.pos.y+3&&c.top>w.P.pos.y-3)}));
         }
       }
       if(travelled<target)throw Error('Could not finish '+id+' '+travelled);
       results.push({id,travelled,maxOff,steps,hull:w.P.hull});
     }q.renderer.render=render;return results;
   }''')
   print('Full route drives:',json.dumps(full_drives),flush=True)
  # Inspect the tunnel interior, lake's four shores and close road/terrain alignment with actual ray intersections.
  views=[]
  for route,fraction in ([] if args.full_only else [('mountain',.20),('mountain',.26),('lake',.12),('lake',.38),('lake',.65),('lake',.87)]):
   view=page.evaluate('''({id,fraction})=>{const w=__wl,q=__featuredQA,path=w.tours.paths.find(p=>p.id===id),p=w.tours.at(path,path.length*fraction);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),60);w.stepPhysics(1/120);if(id==='mountain'&&w.tours.tunnel(p.x)&&!w.P.inTunnel)throw Error('Tunnel does not shelter');
     w.scene.updateMatrixWorld(true);const surfaces=[];w.scene.traverse(o=>{if(o.userData.surface==='featured-road')surfaces.push(o)});const hits=new THREE.Raycaster(new THREE.Vector3(p.x,p.y+3,p.z),new THREE.Vector3(0,-1,0),0,8).intersectObjects(surfaces,false);
     if(!hits.length||Math.abs(hits[0].point.y-p.y-.14)>.15)throw Error('Rendered road does not match physics '+id+' '+fraction);
     const blocked=w.colliders.filter(c=>{if(c.ramp||c.top<p.y+.5||c.bottom>p.y+2.5)return false;const dx=p.x-c.x,dz=p.z-c.z,lx=dx*c.c-dz*c.s,lz=dx*c.s+dz*c.c;return Math.abs(lx)<c.hw+.35&&Math.abs(lz)<c.hd+.35;});
     if(blocked.length)throw Error('Blocked road centre '+id+':'+JSON.stringify(blocked));
     document.querySelector('#menuSheet').hidden=true;window.__wlCam=c=>{c.position.set(p.x-p.tx*24,p.y+6,p.z-p.tz*24);c.lookAt(p.x+p.tx*160,p.y+8,p.z+p.tz*160);};return{x:p.x,z:p.z,y:p.y,roadY:hits[0].point.y};}''',{'id':route,'fraction':fraction})
   page.wait_for_timeout(300);page.screenshot(path=str(args.out/(route+'-'+str(fraction)+'.png')));views.append({'route':route,'fraction':fraction,**view})
  assert not errors,errors
  result={'geometry':geometry,'drives':drives,'fullDrives':full_drives,'meshAudits':audits,'views':views,'pageErrors':errors}
  (args.out/('views-result.json' if args.views_only else 'full-result.json' if args.full_only else 'result.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close();print('PASS: scenic views and physical road surfaces.' if args.views_only else 'PASS: full mountain and lake drives.' if args.full_only else 'PASS: three menu journeys, complete lake loop, curves, tunnel surfaces, visible roads and mesh audit.',flush=True)
finally:server.shutdown();server.server_close()

