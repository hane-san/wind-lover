"""Drive the northern link both ways, audit physical junctions and use both new departure buttons."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/northern-road-qa'))
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
  report={'menu':page.evaluate("() => ({count:document.querySelectorAll('#featuredTrips2 button').length,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})")}
  assert report['menu']['count']==6 and not report['menu']['overflow']
  report['departures']=[]
  for departure in ['astana','charyn']:
   page.locator(f'#featuredTrips2 [data-journey-route="{departure}"]').click(timeout=120000)
   page.wait_for_function('(id)=>__wl.featured===id',arg=departure,timeout=120000);page.locator('#btnMenu').click()
   result=page.evaluate("id=>{const w=__wl,p=w.P,r=w.tourAt(p.pos.x,p.pos.z);if(r.path.id!==id||r.d>.5||p.hull!==3)throw Error('New departure not on its road');return {id,route:r.path.id,offset:r.d,pressed:document.querySelectorAll('#featuredTrips2 [aria-pressed=true]').length}}",departure)
   assert result['pressed']==1;report['departures'].append(result)
  report['geometry']=page.evaluate('''()=>{
   const w=__wl,path=w.tours.paths.find(p=>p.id==='charyn'),west=w.tours.paths.find(p=>p.id==='lake-pass'),east=w.tours.paths.find(p=>p.id==='astana');
   const close=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)<.001&&Math.abs(a.y-b.y)<.001;
   if(!close(path.points[0],w.tours.at(west,west.length*.46))||!close(path.points.at(-1),w.tours.at(east,800)))throw Error('Northern road is detached');
   let error=0,grade=0,turn=0;for(let i=0;i<path.segments.length;i++){
    const seg=path.segments[i],p=w.tours.at(path,seg.s+seg.length*.5),g=w.ground(p.x,p.z,p.y+1.3);error=Math.max(error,Math.abs(g.h-p.y-.14));grade=Math.max(grade,Math.abs(seg.grade));
    const next=path.segments[i+1];if(next)turn=Math.max(turn,Math.acos(Math.min(1,seg.tx*next.tx+seg.tz*next.tz)));
   }
   if(error>.8||grade>.13||turn>.2)throw Error('Northern road is not smooth '+JSON.stringify({error,grade,turn}));
   return {length:path.length,error,grade,maxHeadingStep:turn,half:path.segments[0].half};
  }''');print('Geometry:',json.dumps(report),flush=True)
  report['drives']=[]
  for direction in [1,-1]:
   result=page.evaluate('''direction=>{
    const w=__wl,q=__networkQA,path=w.tours.paths.find(p=>p.id==='charyn');q.paused=true;
    const a=w.tours.at(path,direction===1?100:path.length-100);w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx*direction,a.tz*direction),28);w.P.routeTrack=path.id;w.P.invuln=10000;w.P.hull=3;w.P.dead=false;
    let maxOff=0,reached=direction===1?0:path.length,air=0,joined=null;for(let i=0;i<150000;i++){
     w.stepPhysics(1/60);if(i%15===0)w.loadStep();if(!w.P.grounded)air++;
     if(i%6===0){const r=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id);if(r?.path.id!==path.id){const expected=direction===1?'astana':'lake-pass';if(r?.path.id!==expected||(direction===1?reached<path.length-200:reached>200))throw Error('Left northern route '+JSON.stringify({direction,reached,pos:w.P.pos,route:r?.path.id}));joined=expected;const endpoint=direction===1?800:r.path.length*.46;if(Math.abs(r.s-endpoint)>180)break;}else{maxOff=Math.max(maxOff,r.d);reached=r.s;}}
    }
    if((direction===1?reached<path.length-200:reached>200)||!joined||maxOff>20||w.P.dead||w.P.hull!==3)throw Error('Incomplete ride '+JSON.stringify({direction,reached,maxOff,hull:w.P.hull}));
    return {direction,reached,maxOff,joined,hull:w.P.hull,airSeconds:air/60};
   }''',direction);report['drives'].append(result);print('Drive:',json.dumps(result),flush=True)
  report['views']=[]
  for fraction in [.25,.50,.78]:
   result=page.evaluate('''fraction=>{
    const w=__wl,q=__networkQA,path=w.tours.paths.find(p=>p.id==='charyn'),p=w.tours.at(path,path.length*fraction);w.P.pos.set(p.x,p.y+1,p.z);w.rebuildAll();w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),28);q.paused=true;
    document.querySelector('#menuSheet').hidden=true;document.querySelector('#hint').hidden=true;document.querySelector('#toast').classList.remove('on');q.updatePalette(0,true);for(let i=0;i<100;i++)q.updateVisuals(1/60);q.renderer.render(w.scene,q.camera);
    let river=0,rocks=0;w.scene.traverse(o=>{if(o.userData.surface==='canyon-river')river++;if(o.userData.surface==='canyon-rock')rocks++;});
    if(!river||!rocks)throw Error('Regional geometry missing');
    for(const mesh of w.scene.children)if(mesh.geometry?.attributes.position)for(const n of mesh.geometry.attributes.position.array)if(!Number.isFinite(n))throw Error('Bad geometry');
    return {fraction,river,rocks,region:w.musicRegion()};
   }''',fraction);report['views'].append(result);page.screenshot(path=str(args.out/f'canyon-{fraction}.png'))
  assert not errors,errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: six departures, continuous northern road, two-way riding and regional terrain.',flush=True);browser.close()
finally:server.shutdown();server.server_close()
