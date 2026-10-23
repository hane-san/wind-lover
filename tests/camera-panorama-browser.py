"""Compare the owner's framing with wider presets, full-screen pause and touch scrolling."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--browser',required=True);p.add_argument('--three',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print(str(e),flush=True)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script("if(!localStorage.getItem('panorama-test-seeded')){localStorage.setItem('windlover.settings.v11',JSON.stringify({horse:{camFov:24,camHeight:12,camTilt:-3,camDist:10.5,cruise:57,turn:1.25}}));localStorage.setItem('windlover.vehicle4',JSON.stringify('horse'));localStorage.setItem('windlover.shells','false');localStorage.setItem('windlover.journey-music.v1.enabled','false');localStorage.setItem('panorama-test-seeded','true');}")
  def probe(r):
   s=(root/'prototype/index.html').read_text().replace('window.__wl = {','window.__panoramaQA={camera,models,travelCam,updateVisuals,updatePalette,get paused(){return paused},get clock(){return t}};\nwindow.__wl = {');r.fulfill(body=s,content_type='text/html')
  page.route('**/prototype/',probe);page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wl');page.locator('#featuredTrips [data-journey-route="lake"]').click(timeout=120000);page.locator('#btnMenu').click();page.locator('#menuTune').click()
  def settle():page.evaluate('()=>{for(let i=0;i<100;i++)__panoramaQA.updateVisuals(0);}');page.wait_for_timeout(160)
  def snapshot():return page.evaluate('''()=>{const q=__panoramaQA,c=q.camera,w=__wl;c.updateMatrixWorld(true);const rider=new THREE.Vector3(0,2,0);q.models.horse.rider.localToWorld(rider);rider.project(c);return {position:w.P.pos.toArray(),phase:q.models.horse.motion.phase,clock:q.clock,light:JSON.stringify(w.lakeJourney),camera:c.position.toArray(),fov:c.fov,horizontal:2*Math.atan(Math.tan(c.fov*Math.PI/360)*c.aspect)*180/Math.PI,rider:rider.toArray(),hooves:q.models.horse.legs.map(leg=>leg.hoof.getWorldPosition(new THREE.Vector3()).project(c).y),settings:{camFrame:w.S.camFrame,camFov:w.S.camFov,camHeight:w.S.camHeight,camTilt:w.S.camTilt,camDist:w.S.camDist,cruise:w.S.cruise,turn:w.S.turn}};}''')
  settle();initial=snapshot();assert initial['settings']['camFov']==24 and initial['settings']['camHeight']==12 and initial['settings']['camDist']==10.5
  assert page.locator('[data-camera-preset="riding"]').get_attribute('aria-pressed')=='true';assert page.locator('#cameraCompare').is_disabled()
  assert page.locator('#tune-camFov').get_attribute('max')=='112';assert page.locator('#tune-camHeight').get_attribute('max')=='28';assert page.locator('#tune-camDist').get_attribute('max')=='36'
  views=[]
  for key in ['riding','scenic','panorama']:
   page.locator('[data-camera-preset="'+key+'"]').click();settle();view=snapshot();views.append({'preset':key,**view})
   assert view['settings']['cruise']==57 and view['settings']['turn']==1.25
   for field in ['position','phase','clock','light']:assert view[field]==initial[field],(key,field)
   assert abs(view['rider'][0])<.8 and -.97<view['rider'][1]<.97,(key,view['rider'])
   if key!='riding':assert min(view['hooves'])>-.98,(key,view['hooves'])
   page.locator('#cameraExpand').click();assert page.evaluate('__panoramaQA.paused && document.querySelector("#tuneSheet").classList.contains("previewing")');page.wait_for_timeout(150);page.screenshot(path=str(args.out/(key+'-full.png')))
   page.locator('#cameraCollapse').click();assert page.evaluate('__panoramaQA.paused && !document.querySelector("#tuneSheet").classList.contains("previewing")')
  assert views[1]['horizontal']>views[0]['horizontal']+8 and views[2]['horizontal']>views[1]['horizontal']+5,views
  # Composition shifts work independently of lens angle and physical camera position.
  framed=snapshot();page.locator('#tune-camFrame').evaluate('(el)=>{el.value=.12;el.dispatchEvent(new Event("input",{bubbles:true}));}');settle();shifted=snapshot();assert abs(shifted['fov']-framed['fov'])<.1 and abs(shifted['rider'][1]-framed['rider'][1]-.08)<.003,(framed,shifted)
  page.locator('[data-camera-preset="scenic"]').click();page.locator('[data-camera-preset="panorama"]').click();settle()
  # A/B swaps the complete view and remains reversible without touching handling.
  page.locator('#cameraCompare').click();settle();assert snapshot()['settings']==views[1]['settings']
  page.locator('#cameraCompare').click();settle();assert snapshot()['settings']==views[2]['settings']
  page.locator('#cameraExpand').click();page.locator('#cameraCycle').click();settle();assert snapshot()['settings']==views[0]['settings'];page.locator('#cameraCycle').click();settle();assert snapshot()['settings']==views[1]['settings'];page.locator('#cameraCollapse').click()
  page.set_viewport_size({'width':320,'height':568});page.wait_for_timeout(200);settle();assert page.locator('#tuneClose').is_visible()
  assert page.evaluate('document.querySelector("#tuneSheet").scrollWidth<=innerWidth')
  # Real touch input must scroll the card even though world controls disable body gestures.
  card=page.locator('#tuneSheet > .card');card.evaluate('(el)=>{el.scrollTop=0;}');rect=card.bounding_box();session=page.context.new_cdp_session(page);x=rect['x']+32;y=rect['y']+100;before_scroll=snapshot()['settings']
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for step in range(1,7):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-step*12}]});page.wait_for_timeout(25)
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(200);scroll=card.evaluate('(el)=>el.scrollTop');assert scroll>20,scroll;assert snapshot()['settings']==before_scroll,'Scrolling changed a camera slider'
  page.screenshot(path=str(args.out/'small-phone.png'));page.locator('#cameraExpand').click();page.wait_for_timeout(150);page.screenshot(path=str(args.out/'small-full.png'))
  # Returning from the large preview resumes the selected composition and clears that mode.
  page.locator('#cameraPreviewClose').click();assert page.evaluate('!__panoramaQA.paused && document.querySelector("#tuneSheet").hidden && !document.querySelector("#tuneSheet").classList.contains("previewing")');distance=page.evaluate('__wl.P.dist');page.wait_for_function('(d)=>__wl.P.dist>d+2',arg=distance,timeout=30000)
  page.locator('#btnMenu').click();page.locator('#menuTune').click();assert not page.evaluate('document.querySelector("#tuneSheet").classList.contains("previewing")');page.screenshot(path=str(args.out/'small-controls.png'))
  # All expanded endpoints stay finite; the high boom still respects the mountain tunnel.
  for key,value in [('camFov',112),('camHeight',28),('camTilt',-14),('camDist',36)]:page.locator('#tune-'+key).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',str(value))
  settle();extreme=snapshot();assert extreme['fov']<=120 and all(abs(v)<1e6 for v in extreme['camera'])
  tunnel=page.evaluate('''()=>{const w=__wl,q=__panoramaQA,path=w.tours.paths.find(p=>p.id==='mountain'),seg=path.segments.find(s=>s.a.x>36700),a=w.tours.at(path,seg.s);w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx,a.tz),164);w.P.inTunnel=w.P.onRoad=w.P.grounded=true;w.P.invuln=0;for(let i=0;i<100;i++)q.updateVisuals(0);const r=w.rideRoute(w.P.pos.x,w.P.pos.z,w.P.pos.y);return {height:q.camera.position.y-r.y,side:(q.camera.position.x-r.cx)*r.nx+(q.camera.position.z-r.cz)*r.nz,half:r.half};}''');assert tunnel['height']<9.4 and abs(tunnel['side'])<tunnel['half']-1,tunnel
  page.locator('[data-camera-preset="scenic"]').click();page.reload(timeout=120000);page.wait_for_function('window.__wl');assert page.evaluate('__wl.S.camFov===38 && __wl.S.camHeight===16 && __wl.S.camTilt===-4 && __wl.S.camDist===12 && __wl.S.camFrame===.06 && __wl.S.cruise===57')
  assert page.evaluate('(()=>{__wl.setVehicle("sidecar");return __wl.S.camFrame===0 && Math.abs(__panoramaQA.camera.view.offsetY+innerHeight*.095)<.001;})()')
  assert page.evaluate('(()=>{__wl.setVehicle("horse");return __wl.S.camFrame===.06 && Math.abs(__panoramaQA.camera.view.offsetY+innerHeight*(.095-.06))<.001;})()')
  # Compare the three compositions on one snowy mountain road as well as the lake.
  page.locator('#featuredTrips [data-journey-route="mountain"]').click(timeout=120000);page.locator('#btnMenu').click();page.locator('#menuTune').click();page.set_viewport_size({'width':390,'height':844})
  page.evaluate('''()=>{const w=__wl,q=__panoramaQA,path=w.tours.paths.find(p=>p.id==='mountain'),a=w.tours.at(path,path.length*.45);w.P.pos.set(a.x,a.y+1,a.z);w.rebuildAll();w.placeAt(a.x,a.z,Math.atan2(a.tx,a.tz),164);w.P.grounded=w.P.onRoad=true;w.P.invuln=0;q.updatePalette(0,true);document.querySelector('#toast').classList.remove('on');}''')
  for key in ['riding','scenic','panorama']:
   page.locator('[data-camera-preset="'+key+'"]').click();settle();page.locator('#cameraExpand').click();page.wait_for_timeout(150);page.screenshot(path=str(args.out/(key+'-mountain.png')));page.locator('#cameraCollapse').click()
  assert not errors,errors;report={'views':views,'touchScroll':scroll,'reversibleComparison':True,'pausedFullscreen':True,'savedAfterReload':True,'tunnel':tunnel,'pageErrors':errors};(args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);b.close()
finally:server.shutdown();server.server_close()
