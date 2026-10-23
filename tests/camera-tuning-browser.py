"""Exercise saved camera controls and their paused preview in the real mobile game."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',required=True);parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  # An old save has no new camera keys; preserve its custom riding settings.
  page.add_init_script("if(!localStorage.getItem('camera-test-seeded')){localStorage.setItem('windlover.settings.v11',JSON.stringify({horse:{cruise:51,turn:1.3},sidecar:{camDist:12}}));localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false');localStorage.setItem('camera-test-seeded','true');}")
  def probe(r):
   src=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__tuneQA={camera,models,travelCam,updateVisuals,get paused(){return paused},get clock(){return t}};\nwindow.__wl = {');r.fulfill(body=src,content_type='text/html')
  page.route('**/prototype/',probe)
  def boot():
   page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click();page.locator('#menuTune').click();page.wait_for_function('document.querySelector("#tunePreview").width===320')
  def slider(key,value):page.locator('#tune-'+key).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',str(value))
  def settle():page.evaluate('()=>{for(let i=0;i<100;i++)__tuneQA.updateVisuals(0);}');page.wait_for_timeout(150)
  def sample():return page.evaluate('''()=>{const q=__tuneQA,dir=q.camera.getWorldDirection(new THREE.Vector3());return {fov:q.camera.fov,height:q.camera.position.y-__wl.P.pos.y,pitch:Math.asin(-dir.y)*180/Math.PI,position:__wl.P.pos.toArray(),clock:q.clock,phase:q.models.horse.motion.phase,light:JSON.stringify(__wl.lakeJourney)};}''')
  boot();settle();initial=sample();settings=page.evaluate('__wl.S');assert settings['camFov']==0 and settings['camHeight']==4.8 and settings['camTilt']==0 and settings['cruise']==51 and settings['turn']==1.3,settings
  assert page.locator('#tune-camFov').input_value()=='66'
  preview_before=page.locator('#tunePreview').evaluate('(c)=>c.toDataURL()')
  slider('camFov',84);slider('camHeight',9.6);slider('camTilt',6);slider('camDist',17);settle();changed=sample()
  assert abs(changed['fov']-initial['fov']-18)<.12,(initial,changed)
  assert changed['height']>initial['height']+3,(initial,changed)
  assert changed['pitch']>initial['pitch']+5,(initial,changed)
  for key in ['position','clock','phase','light']:assert changed[key]==initial[key],(key,initial[key],changed[key])
  assert page.locator('#tunePreview').evaluate('(c)=>c.toDataURL()')!=preview_before,'Preview did not change'
  page.screenshot(path=str(args.out/'phone-tuning.png'))
  # Keyboard arrows belong to the slider rather than steering.
  page.locator('#tune-camHeight').focus();page.keyboard.press('ArrowRight');assert page.evaluate('__wl.inp.kx')==0
  slider('camHeight',9.6);page.reload(timeout=120000);page.wait_for_function('window.__wl');saved=page.evaluate('__wl.S');assert saved['camFov']==18 and saved['camHeight']==9.6 and saved['camTilt']==6 and saved['camDist']==17,saved
  page.evaluate('__wl.setVehicle("sidecar")');assert page.evaluate('__wl.S.camFov===0 && __wl.S.camHeight===4.8 && __wl.S.camDist===12')
  page.evaluate('__wl.setVehicle("horse")');assert page.evaluate('__wl.S.camFov===18 && __wl.S.camHeight===9.6')
  page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click();page.locator('#menuTune').click();settle()
  page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(250);settle();assert page.locator('#tune-camFov').input_value()=='70';assert abs(sample()['fov']-(70+page.evaluate('__wl.P.vel.length()/__wl.S.maxSpeed*3.2*__wl.S.fovKick')))<.2
  page.screenshot(path=str(args.out/'landscape-tuning.png'))
  page.set_viewport_size({'width':320,'height':568});page.wait_for_timeout(250);settle();assert page.locator('#tune-camFov').input_value()=='84'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.querySelector("#tuneSheet").scrollWidth<=innerWidth')
  page.screenshot(path=str(args.out/'small-phone-tuning.png'))
  page.locator('#cameraReset').click();settle();reset=page.evaluate('__wl.S');assert reset['camFov']==0 and reset['camHeight']==4.8 and reset['camTilt']==0 and reset['camDist']==15 and reset['cruise']==51 and reset['turn']==1.3,reset
  # Extremes remain finite, and a high viewpoint still respects the tunnel ceiling.
  slider('camFov',90);slider('camHeight',12);slider('camTilt',12);slider('camDist',18);settle();assert page.evaluate('Number.isFinite(__tuneQA.camera.projectionMatrix.determinant())')
  tunnel=page.evaluate('''()=>{const w=__wl,q=__tuneQA,path=w.tours.paths.find(p=>p.id==='mountain'),seg=path.segments.find(s=>s.a.x>36700),a=w.tours.at(path,seg.s);w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx,a.tz),64);w.P.inTunnel=w.P.onRoad=w.P.grounded=true;w.P.invuln=0;for(let i=0;i<100;i++)q.updateVisuals(0);const road=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y);return {height:q.camera.position.y-road.y,side:(q.camera.position.x-road.cx)*road.nx+(q.camera.position.z-road.cz)*road.nz,half:road.half};}''')
  assert tunnel['height']<9.4 and abs(tunnel['side'])<tunnel['half']-1,tunnel
  page.locator('#cameraReset').click();page.locator('#tuneClose').click();assert page.evaluate('!__tuneQA.paused');distance=page.evaluate('__wl.P.dist');page.wait_for_function('(d)=>__wl.P.dist>d+2',arg=distance,timeout=30000)
  assert not errors,errors;report={'initial':initial,'changed':changed,'oldSavePreserved':True,'vehicleSettingsIndependent':True,'cameraResetPreservesHandling':True,'sizes':[[390,844],[844,390],[320,568]],'tunnel':tunnel,'resumed':True,'pageErrors':errors};(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
