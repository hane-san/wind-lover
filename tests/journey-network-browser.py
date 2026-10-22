"""Audit the connected journey and drive both directions through the joined pass without warps."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/journey-network-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__networkQA={camera,renderer,travelCam,updateVisuals,updatePalette,get paused(){return paused},set paused(v){paused=v}};\nwindow.__wl = {');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl')
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click()
  report=page.evaluate('''()=>{
    const w=__wl,q=__networkQA,check=(v,s)=>{if(!v)throw Error(s)},paths=w.tours.paths,connections=paths.filter(p=>p.connection),result=[];
    check(connections.length===2,'Missing physical connecting roads');
    const west=connections[0],east=connections[1],lake=paths.find(p=>p.id==='lake'),mountain=paths.find(p=>p.id==='mountain');
    const same=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)<.001&&Math.abs(a.y-b.y)<.001;
    check(same(west.points[0],lake.points[0])&&same(west.points.at(-1),mountain.points[0]),'Disconnected western junction');
    check(same(east.points[0],mountain.points.at(-1)),'Disconnected mountain exit');
    check(Math.abs(east.points.at(-1).y+.14-w.railY(52000)-.16)<.001,'Railway junction has a lip');
    for(const path of connections){let grade=0,error=0;
      for(const seg of path.segments){const p=w.tours.at(path,seg.s+seg.length*.5),g=w.ground(p.x,p.z,p.y+1.3);grade=Math.max(grade,Math.abs(seg.grade));error=Math.max(error,Math.abs(g.h-p.y-.14));}
      check(grade<.12&&error<.65,'Connection floor mismatch '+JSON.stringify({id:path.id,grade,error}));result.push({id:path.id,length:path.length,grade,error});
    }return {connections:result,junctions:w.tours.junctions.length};
  }''');print('Geometry:',json.dumps(report),flush=True)
  report['drives']=[]
  for direction in [1,-1]:
   result=page.evaluate('''direction=>{
    const w=__wl,q=__networkQA;w.travelFeatured('mountain');q.paused=true;const start=w.tours.at(direction>0?'lake-pass':'pass-line',direction>0?450:w.tours.paths.find(p=>p.id==='pass-line').length-450);
    w.P.pos.set(start.x,start.y+1,start.z);w.rebuildAll();w.placeAt(start.x,start.z,Math.atan2(start.tx*direction,start.tz*direction),64);
    w.P.hull=3;w.P.invuln=0;w.P.dead=false;w.P.stalled=false;w.inp.jx=w.inp.kx=w.inp.jy=w.inp.ky=0;w.P.flow=.25;
    const visited=new Set(),trace=[];let distance=0,maxOff=0,done=false;
    for(let i=0;i<65000;i++){
      const before=w.P.pos.clone();w.stepPhysics(1/120);distance+=w.P.pos.distanceTo(before);
      if(i%16===0){w.loadStep();const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y);if(r.path)visited.add(r.path.id);
        maxOff=Math.max(maxOff,r.d);trace.push({x:w.P.pos.x,z:w.P.pos.z,y:w.P.pos.y,route:r.path?.id,off:r.d,speed:w.P.vel.length(),hull:w.P.hull});if(trace.length>8)trace.shift();
        if(r.d>r.half+5||w.P.hull!==3||w.P.stalled)throw Error('Disconnected real drive '+JSON.stringify({direction,distance,trace,nearby:w.colliders.filter(c=>Math.hypot(c.x-w.P.pos.x,c.z-w.P.pos.z)<Math.max(c.hw,c.hd)+8).slice(0,10)}));
        if(direction>0?w.P.pos.x>52450:visited.has('lake')&&visited.has('mountain')){done=true;break;}
      }
    }
    if(!done)throw Error('Unable to finish connected journey '+JSON.stringify({direction,distance,visited:[...visited],trace}));
    return {direction,distance,maxOff,visited:[...visited],hull:w.P.hull};
   }''',direction);report['drives'].append(result);print('Connected drive:',json.dumps(result),flush=True)
  # Render the actual fork and pass exit, and exercise combat camera interruption.
  report['visibleCorridors']=[]
  for path_id in ['lake-pass','pass-line']:
   corridor=page.evaluate('''id=>{const w=__wl,q=__networkQA,p=w.tours.at(id,1000);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),64);q.paused=true;w.P.invuln=0;document.querySelector('#menuSheet').hidden=true;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<60;i++)q.updateVisuals(1/60);
     w.scene.updateMatrixWorld(true);const meshes=[];for(const chunk of w.chunks.values())chunk.group.traverse(o=>{if(o.isMesh)meshes.push(o)});
     let rays=0;const down=new THREE.Vector3(0,-1,0),ray=new THREE.Raycaster();
     for(let s=600;s<1600;s+=12){const a=w.tours.at(id,s);for(const offset of [-12,-8,-4,0,4,8,12]){
       const x=a.x-a.tz*offset,z=a.z+a.tx*offset,floor=w.ground(x,z,a.y+1.3).h;
       ray.set(new THREE.Vector3(x,floor+3.9,z),down);ray.near=0;ray.far=3.15;
       const hits=ray.intersectObjects(meshes,false);if(hits.length)throw Error('Visible scenery in rideable corridor '+JSON.stringify({id,s,offset,x,z,floor,hit:hits[0].point.toArray()}));rays++;
     }}return {id,rays};}''',path_id)
   report['visibleCorridors'].append(corridor)
   page.wait_for_timeout(200);page.screenshot(path=str(args.out/(path_id+'.png')))
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));browser.close()
finally:server.shutdown();server.server_close()
