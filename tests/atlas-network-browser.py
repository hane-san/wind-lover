"""Drive every atlas road in both directions and choose different exits with real rein input."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/atlas-network-qa'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false')")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('function frame(now) {','function frame(now) { if(window.__atlasFreeze){requestAnimationFrame(frame);return;}').replace('window.__wl = {','window.__atlasQA={get paused(){return paused},set paused(v){paused=v}};window.__wl = {');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl',timeout=120000);page.locator('#realmWarp').click(timeout=120000);page.evaluate('window.__atlasFreeze=true;__atlasQA.paused=true');report={'roads':[]}
  for index in range(24):
   rows=page.evaluate('''index=>{const w=__wl,path=w.monsoon.atlas.roads[index],out=[];
    for(const dir of [1,-1]){const s=dir>0?100:path.length-100,p=w.tours.at(path,s);w.placeAt(p.x,p.z,Math.atan2(p.tx*dir,p.tz*dir),24);w.P.routeTrack=path.id;w.P.hull=3;w.P.dead=false;w.P.invuln=0;let done=false,prev=w.P.pos.clone(),maxOff=0,maxYaw=0,yaw=w.P.yaw,travelled=0;
     for(let i=0;i<120*90;i++){w.stepPhysics(1/120);travelled+=w.P.pos.distanceTo(prev);prev.copy(w.P.pos);maxYaw=Math.max(maxYaw,Math.abs(Math.atan2(Math.sin(w.P.yaw-yaw),Math.cos(w.P.yaw-yaw))));yaw=w.P.yaw;if(i%24===0)w.loadStep();const r=w.tours.nearest(w.P.pos.x,w.P.pos.z,path.id,300);maxOff=Math.max(maxOff,r?.d||0);if(w.P.hull!==3||w.P.dead)throw Error('Road collision '+JSON.stringify({path:path.id,dir,pos:w.P.pos,hull:w.P.hull}));if(r?.path===path&&((dir>0&&r.s>path.length-112)||(dir<0&&r.s<112))){done=true;break;}if(travelled>path.length+300)break;}
     if(!done||maxOff>13||maxYaw>.035)throw Error('Unstable road '+JSON.stringify({path:path.id,dir,done,maxOff,maxYaw,travelled,pos:w.P.pos,track:w.P.routeTrack}));out.push({path:path.id,dir,travelled,maxOff,maxYaw,hull:w.P.hull});
    }return out;}''',index);report['roads']+=rows;print('Road:',json.dumps(rows),flush=True)
  report['forks']=page.evaluate('''()=>{const w=__wl,out=[];for(const id of ['crossroads','kanazawa','ainu'])for(const steer of [-.9,.9]){
   const node=w.monsoon.atlas.nodes.find(n=>n.id===id),incoming=node.edges[0],path=incoming.path,dir=-incoming.dir,s=dir>0?path.length-100:100,p=w.tours.at(path,s);w.placeAt(p.x,p.z,Math.atan2(p.tx*dir,p.tz*dir),24);w.P.routeTrack=path.id;w.P.hull=3;w.P.invuln=0;w.P.dead=false;let selected=null,maxYaw=0,yaw=w.P.yaw;
   for(let i=0;i<120*13;i++){w.inp.jx=selected?0:steer;w.stepPhysics(1/120);if(w.P.atlasTurn)selected=w.P.atlasTurn.edge.path.id;maxYaw=Math.max(maxYaw,Math.abs(Math.atan2(Math.sin(w.P.yaw-yaw),Math.cos(w.P.yaw-yaw))));yaw=w.P.yaw;if(i%24===0)w.loadStep();if(w.P.hull!==3)throw Error('Fork collision '+id);if(selected&&!w.P.atlasTurn&&Math.hypot(w.P.pos.x-node.x,w.P.pos.z-node.z)>100)break;}
   const road=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y),row={node:id,steer,selected,current:road.path?.id,d:road.d,maxYaw,hull:w.P.hull};if(!selected||selected===path.id||road.path?.id!==selected||road.d>17||maxYaw>.025)throw Error('Rein choice did not take a branch '+JSON.stringify(row));out.push(row);
  }w.inp.jx=0;return out;}''')
  report['exploration']=page.evaluate('''()=>{const w=__wl,path=w.monsoon.atlas.roads.find(p=>p.id==='atlas-cross-3'),out=[];
   for(const mode of ['held','brake-turn']){const p=w.tours.at(path,260);w.placeAt(p.x,p.z,Math.atan2(p.tx,p.tz),26);w.P.routeTrack=path.id;w.P.hull=3;w.P.invuln=0;w.P.dead=false;let maxOff=0;
    for(let i=0;i<120*9;i++){w.inp.jx=.9;w.inp.jy=mode==='brake-turn'&&i>240&&i<330?-.5:0;w.stepPhysics(1/120);if(i%24===0)w.loadStep();maxOff=Math.max(maxOff,w.monsoon.near(w.P.pos.x,w.P.pos.z).d);}
    if(maxOff<33||w.P.hull!==3||w.P.dead)throw Error('Open-country reins are trapped '+JSON.stringify({mode,maxOff,hull:w.P.hull}));out.push({mode,maxOff,hull:w.P.hull});
   }w.inp.jx=w.inp.jy=0;return out;}''')
  assert not errors,errors;report['pageErrors']=errors;(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS: 48 physical road rides, six held-rein junction choices and two open-country departures.',json.dumps(report['forks']),flush=True);browser.close()
finally:server.shutdown();server.server_close()
