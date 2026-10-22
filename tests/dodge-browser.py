"""Check swept hits, dense but open patterns, atomic streaming and CPU work in the actual game."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser', default='/usr/bin/chromium')
parser.add_argument('--three', type=Path)
parser.add_argument('--vehicle', choices=['sidecar','horse','chopper','board'], default='sidecar')
parser.add_argument('--out', type=Path, default=Path('/tmp/wind-dodge-qa'))
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *unused):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.browser, headless=True, args=[
            '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        if args.three:
            page.route('**/three.min.js', lambda r: r.fulfill(path=str(args.three.resolve()), content_type='application/javascript'))
        page.route('https://fonts.googleapis.com/**', lambda r: r.abort())

        def instrument(route):
            source = (root / 'prototype/index.html').read_text()
            # Test access stays outside the published game. Gameplay functions and data are unchanged.
            access = '''window.__qa = { renderer, shoot, clearDrones, updateBullets, updateDrones, assaultVolley, adaptResolution, quality,
              get pendingChunk(){return streamingChunk}, get pendingFar(){return streamingFar}, get landmarkQueue(){return landmarkQueue},
              get buffers(){return {bPos,bVel,bLife,bGraze}}, get paused(){return paused}, set paused(v){paused=v},
              set attack(v){shellsOn=v}, set time(v){t=v}, get time(){return t},
              get rounds(){const a=[];for(let i=0;i<BUL;i++)if(bLife[i]>0)a.push({p:Array.from(bPos.subarray(i*3,i*3+3)),v:Array.from(bVel.subarray(i*3,i*3+3))});return a;}
            };'''
            source = source.replace('window.__wl = {', access + '\nwindow.__wl = {')
            route.fulfill(body=source, content_type='text/html')

        page.route('**/prototype/', instrument)
        page.add_init_script("localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.vehicle4',JSON.stringify("+json.dumps(args.vehicle)+"))")
        page.goto(f'http://127.0.0.1:{server.server_port}/', timeout=120000)
        page.wait_for_function('window.__qa && window.__wlMusic', timeout=120000)
        page.locator('#btnGo').click(timeout=120000)
        page.locator('#btnMenu').click()
        combat = page.evaluate('''() => {
          const w=__wl,q=__qa,P=w.P,check=(v,m)=>{if(!v)throw Error(m)};
          const reset=()=>{q.clearDrones();P.pos.set(8000,1000,0);P.vel.set(60,0,0);P.dead=false;P.invuln=0;P.inTunnel=false;P.hull=3;P.grounded=false;P.grazes=0;};
          reset();q.shoot(P.pos.clone().add(new THREE.Vector3(0,.45,.95)),new THREE.Vector3(),[1,.5,.2]);
          for(let i=0;i<30;i++)q.updateBullets(1/120);
          check(P.hull===3 && P.vel.x===60 && P.grazes===1,'A close pass damaged or repeatedly slowed the rider');
          reset();q.shoot(P.pos.clone().add(new THREE.Vector3(5,.45,0)),new THREE.Vector3(-200,0,0),[1,.5,.2]);q.updateBullets(.05);
          check(P.hull===2 && w.combat.bullets===0,'A fast round tunnelled through the rider');
          reset();const prev=P.pos.clone();q.shoot(P.pos.clone().add(new THREE.Vector3(5,.45,0)),new THREE.Vector3(),[1,.5,.2]);P.pos.x+=10;q.updateBullets(.05,prev);
          check(P.hull===2,'A moving rider tunnelled through a stationary round');
          reset();q.shoot(P.pos.clone().add(new THREE.Vector3(5,.45,1.1)),new THREE.Vector3(-200,0,0),[1,.5,.2]);q.updateBullets(.05);
          check(P.hull===3 && P.grazes===1,'A fast graze was missed');
          reset();P.inTunnel=true;q.shoot(P.pos.clone().add(new THREE.Vector3(5,.45,0)),new THREE.Vector3(-200,0,0),[1,.5,.2]);q.updateBullets(.05);
          check(P.hull===3 && P.grazes===0,'A sheltered rider was hit');
          reset();P.invuln=1;q.shoot(P.pos.clone().add(new THREE.Vector3(5,.45,0)),new THREE.Vector3(-200,0,0),[1,.5,.2]);q.updateBullets(.05);
          check(P.hull===3,'Invulnerability was ignored');
          const patterns=[];
          for(let pat=0;pat<w.combat.patternNames.length;pat++){
            reset();const x=17000;P.pos.set(x,w.railY(x)+1,w.railZ(x));
            const f={pos:P.pos.clone().add(new THREE.Vector3(230,26,0)),pat,pending:[]};q.assaultVolley(f);
            const rounds=q.rounds.map(b=>({p:b.p,v:b.v,delay:0})).concat(f.pending.map(b=>({p:b.p.toArray(),v:b.v.toArray(),delay:b.at-q.time})));
            check(rounds.length >= [44,41,40,40,36,80,120,100,140][pat],'Insufficient density in pattern '+pat);
            const targets=rounds.map(b=>{const flight=230/(60-b.v[0]);return {z:b.p[2]+b.v[2]*flight-P.pos.z,y:b.p[1]+b.v[1]*flight-P.pos.y-.45};}).filter(p=>Math.abs(p.y)<w.combat.hitRadius+.35).map(p=>p.z);
            const safe=[];let run=0,longest=0;for(let z=-12;z<=12;z+=.2){if(targets.every(a=>Math.abs(a-z)>w.combat.hitRadius+.3)){safe.push(z);run++;longest=Math.max(longest,run);}else run=0;}
            if(pat===0||pat===5||pat>=6)check(longest*.2>5,'A curtain closed every route through the road');
            patterns.push({pat,rounds:rounds.length,safeRoadMetres:safe.length*.2,longestRoadGap:longest*.2});
          }
          // Queued rows are cancelled by shelter and attack-off, including after a fire command.
          reset();q.attack=true;const f={mode:'assault',type:'ring',n:0,drones:[],pos:P.pos.clone().add(new THREE.Vector3(230,26,0)),vel:new THREE.Vector3(60,0,0),phase:'hold',age:0,t:0,fireT:100,gap:1,pat:5,pending:[],seq:0};
          q.assaultVolley(f);w.forms.push(f);q.clearDrones(); // clear also drops queued emissions
          check(w.forms.length===0 && w.combat.bullets===0,'Clearing combat left queued rounds');
          reset();q.attack=true;q.assaultVolley(f);w.forms.push(f);P.inTunnel=true;const initial=w.combat.bullets;q.time+=1;q.updateDrones(0);
          check(w.combat.bullets<=initial && !f.pending.length,'Delayed rows fired under a roof');
          q.clearDrones();q.attack=false;
          return {radius:w.combat.hitRadius,patterns,sweptHits:true,grazeKeepsSpeed:true,shelter:true};
        }''')
        print('Combat:', json.dumps(combat), flush=True)
        dodge = page.evaluate('''() => {
          const w=__wl,q=__qa,P=w.P,x=17000,z=w.railZ(x),dt=1/120;
          q.clearDrones();q.attack=false;w.P.pos.set(x,w.railY(x)+1,z);w.rebuildAll();w.placeAt(x,z,Math.atan2(1,w.railZd(x)),60);
          Object.assign(P,{dead:false,invuln:0,hull:3,stalled:false,lean:0,leanV:0,sway:0,hold:0,flow:.2});
          Object.assign(w.inp,{kx:0,ky:0,jx:0,jy:0});
          for(let i=0;i<60;i++)w.stepPhysics(dt);
          const saved=Object.fromEntries(Object.entries(P).map(([k,v])=>[k,v instanceof THREE.Vector3?v.clone():v]));
          const initial=P.pos.clone();for(let i=0;i<360;i++)w.stepPhysics(dt);const target=P.pos.clone().add(new THREE.Vector3(0,.45,0));
          const restore=()=>{w.placeAt(initial.x,initial.z,saved.yaw,60);for(const[k,v]of Object.entries(saved)){if(v instanceof THREE.Vector3)P[k].copy(v);else P[k]=v;}q.clearDrones();w.inp.kx=0;};
          const fire=()=>{const from=target.clone().add(new THREE.Vector3(30,8,0));q.shoot(from,target.clone().sub(from).multiplyScalar(1/3),[1,.5,.2]);};
          const run=dodge=>{restore();fire();for(let i=0;i<360;i++){w.inp.kx=dodge&&i<96?.8:0;const prev=P.pos.clone();w.stepPhysics(dt);q.updateBullets(dt,prev);}return{hull:P.hull,x:P.pos.x,z:P.pos.z,speed:P.vel.length()};};
          const straight=run(false),evaded=run(true);w.inp.kx=0;
          if(straight.hull!==2||evaded.hull!==3)throw Error('Riding dodge failed: '+JSON.stringify({straight,evaded}));
          return{straightHull:straight.hull,dodgedHull:evaded.hull,lateralDifference:Math.abs(straight.z-evaded.z),exitKmh:evaded.speed*3.6};
        }''')
        print('Driving dodge:', json.dumps(dodge), flush=True)
        performance = page.evaluate('''() => {
          const w=__wl,q=__qa,P=w.P,check=(v,m)=>{if(!v)throw Error(m)},stats=a=>{a.sort((x,y)=>x-y);return{n:a.length,median:a[a.length>>1],p95:a[Math.floor(a.length*.95)],max:a.at(-1),total:a.reduce((x,y)=>x+y,0)}};
          const render=q.renderer.render;q.renderer.render=()=>{}; // CPU timings exclude software GPU emulation.
          P.pos.set(17000,w.railY(17000)+1,w.railZ(17000));w.rebuildAll();
          const signature=()=>JSON.stringify([...w.chunks].map(([k,c])=>[k,c.colliders.map(o=>[o.x,o.z,o.hw,o.hd,o.bottom,o.top]),c.group.children.map(m=>m.geometry?.attributes.position.count||0)]).sort());
          P.pos.x+=480;P.pos.z=w.railZ(P.pos.x);const target=P.pos.clone(),frames=[];
          for(let i=0;i<250;i++){const at=performance.now();w.loadStep();frames.push(performance.now()-at);}
          check(!q.pendingChunk && !q.pendingFar && !q.landmarkQueue.length,'Streaming failed to finish ahead of the rider');
          const incremental=signature();w.rebuildAll();const forced=signature();
          // Incremental unloading keeps one trailing strip; compare the common target neighbourhood.
          const keys=new Set();for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)keys.add((Math.floor(P.pos.x/480)+x)+','+(Math.floor(P.pos.z/480)+z));
          const pick=s=>JSON.stringify(JSON.parse(s).filter(([k])=>keys.has(k)));
          check(pick(incremental)===pick(forced),'Incremental generation changed scenery or collision');
          // Cancellation must not commit a chunk from the previous world/position.
          P.pos.x+=480;w.loadStep();check(q.pendingChunk,'No incremental work was scheduled');const stale=q.pendingChunk;check(!stale.ch.group.parent && !w.chunks.has(stale.ch.key),'An incomplete chunk was published');w.rebuildAll();check(!q.pendingChunk && !q.pendingFar && stale.steps.next().done,'A forced rebuild left stale work');
          // Bounded buffers and terrain-query pacing under much denser fire.
          q.clearDrones();P.pos.set(28000,5000,0);P.vel.set(60,0,0);P.invuln=100;P.inTunnel=false;
          for(let i=0;i<800;i++)q.shoot(new THREE.Vector3(28080+i*.01,5100,10+i*.02),new THREE.Vector3(),[1,.5,.3]);
          const bullets=[];for(let i=0;i<120;i++){const at=performance.now();q.updateBullets(1/60);bullets.push(performance.now()-at);}
          check(w.combat.bullets===800,'The stress workload dropped live rounds');
          q.clearDrones();
          // Resolution can recover, and never changes handling or bullet count.
          q.paused=false;const before=q.quality.ratio;for(let i=0;i<240;i++)q.adaptResolution(1/60,35);const low=q.quality.ratio;
          check(low<before && low>=.75,'Sustained load did not reduce render resolution');
          for(let i=0;i<1000;i++)q.adaptResolution(1/60,16);check(q.quality.ratio>low,'Resolution did not recover');const recovered=q.quality.ratio;for(let i=0;i<120;i++)q.adaptResolution(.05,180);check(q.quality.ratio<recovered,'Very slow frames disabled adaptive resolution');q.quality.ratio=before;q.renderer.setPixelRatio(before);q.paused=true;
          q.renderer.render=render;return{streamingMs:stats(frames),bullet800Ms:stats(bullets),atomicScenery:true,cancelStaleWork:true,adaptiveResolution:true};
        }''')
        print('Performance:', json.dumps(performance), flush=True)
        # Render the real scene with a dense incoming curtain at a useful viewing distance.
        page.evaluate('''()=>{const w=__wl,q=__qa,x=17000,z=w.railZ(x);w.P.pos.set(x,w.railY(x)+1,z);w.rebuildAll();w.placeAt(x,z,Math.atan2(1,w.railZd(x)),60);w.P.grounded=false;
          q.clearDrones();q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(230,26,0)),pat:0,pending:[]});q.updateBullets(2.1);document.querySelector('#menuSheet').hidden=true;window.__wlCam=(c)=>{c.position.set(w.P.pos.x-15,w.P.pos.y+4,w.P.pos.z);c.lookAt(w.P.pos.x+110,w.P.pos.y+4,w.P.pos.z)};}''')
        page.wait_for_timeout(500)
        page.screenshot(path=str(args.out / 'incoming-curtain.png'))
        for pattern in [6,7,8]:
            page.evaluate('''pat=>{const w=__wl,q=__qa;q.clearDrones();w.P.grounded=false;q.assaultVolley({pos:w.P.pos.clone().add(new THREE.Vector3(280,26,0)),pat,pending:[]});const f=w.forms; q.updateBullets(1.7);}''',pattern)
            page.wait_for_timeout(250)
            page.screenshot(path=str(args.out / ('geometry-'+str(pattern)+'.png')))
        assert not errors, errors
        result = {'vehicle': args.vehicle, 'combat': combat, 'drivingDodge': dodge, 'performance': performance, 'pageErrors': errors}
        (args.out / 'dodge-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
        browser.close()
        print('PASS: small swept hit area, rewarding grazes, nine open patterns, streaming and bounded CPU work.', flush=True)
finally:
    server.shutdown()
    server.server_close()
