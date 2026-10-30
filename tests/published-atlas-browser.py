"""Verify published bytes, then exercise the published atlas and native controls."""
import argparse, concurrent.futures, json, mimetypes, subprocess, urllib.parse
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--commit',required=True)
parser.add_argument('--three',type=Path,required=True)
parser.add_argument('--base',default='https://hane-san.github.io/wind-lover/')
parser.add_argument('--out',type=Path,default=Path('/tmp/published-atmosphere-qa'))
args=parser.parse_args();root=Path(__file__).resolve().parents[1];args.out.mkdir(parents=True,exist_ok=True)
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==args.commit
files=['index.html','prototype/index.html','docs/FREE-REINS-AND-REGIONAL-SKIES.md']+[str(p.relative_to(root)) for folder,pattern in [('world','*.js'),('music','*.mjs'),('assets/music/quiet','*.ogg')] for p in sorted((root/folder).glob(pattern))]
def download(rel):
 data=subprocess.check_output(['curl','-fLsS','--retry','2',args.base+rel+'?verify='+args.commit])
 assert data==(root/rel).read_bytes(),'Published bytes differ: '+rel
 return rel,data
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:cache=dict(pool.map(download,files))
errors=[]
with sync_playwright()as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text)if m.type=='error'and'WebGLProgram'in m.text else None)
 page.add_init_script("localStorage.setItem('windlover.shells','false')")
 page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'))
 page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 def route(r):
  prefix=urllib.parse.urlsplit(args.base).path
  rel=urllib.parse.unquote(urllib.parse.urlsplit(r.request.url).path).removeprefix(prefix)
  if not rel or rel.endswith('/'):rel+='index.html'
  if rel not in cache:errors.append('Unexpected published dependency '+rel);r.abort();return
  mime='application/javascript'if rel.endswith(('.js','.mjs'))else mimetypes.guess_type(rel)[0]or'application/octet-stream'
  r.fulfill(body=cache[rel],content_type=mime)
 # Serve only bytes already fetched and verified from the public site, keeping the actual URL.
 page.route(args.base+'**',route);page.goto(args.base+'?verify='+args.commit,timeout=120000)
 page.wait_for_function('window.__wl&&window.__wlMusic',timeout=120000)
 page.locator('#realmWarp').click(timeout=120000)
 page.wait_for_function("__wl.realm==='monsoon'&&__wlMusic.state.status==='playing'",timeout=60000)
 assert page.evaluate('__wl.S.maxSpeed===38&&__wl.S.cruise===22&&__wl.combat.hitRadius===.32&&__wl.monsoon.path.length>9400&&__wl.monsoon.plots.length===84&&__wl.monsoon.path.segments[0].half===34')
 assert page.locator('#musicTrack option').count()==39
 visited=[]
 for zone in page.evaluate('__wl.monsoon.zones.map(z=>z.id)'):
  page.locator('#btnMenu').click();page.locator('#monsoonStops').evaluate('(e)=>e.open=true')
  page.locator('[data-monsoon-zone="'+zone+'"]').click()
  page.wait_for_function('zone=>__wl.monsoon.stage(__wl.P.pos.x,__wl.P.pos.z).id===zone',arg=zone)
  visited.append(zone)
  if zone=='edo':page.wait_for_function("__wl.scene.children.some(o=>o.userData.sceneryKind==='regional-birds'&&o.visible&&o.count<=48&&o.userData.birds?.crow>=13)",timeout=15000)
  if zone=='okinawa':page.wait_for_function("__wl.scene.children.some(o=>o.userData.sceneryKind==='regional-birds'&&o.visible&&o.userData.birds?.gull>=11)",timeout=15000)
 page.locator('#btnMenu').click();page.locator('#monsoonStops').evaluate('(e)=>e.open=true')
 assert page.locator('#atlasMap [data-atlas-warp]').count()==14
 page.locator('[data-atlas-warp="hagiang"]').focus();page.keyboard.press('Enter')
 page.wait_for_function("__wl.monsoon.stage(__wl.P.pos.x,__wl.P.pos.z).id==='hagiang'")
 assert page.evaluate('!__wl.inp.jumpHeld&&!__wl.inp.keys.Enter')
 page.keyboard.down('d');assert page.evaluate('__wl.inp.kx===1')
 page.keyboard.up('d');assert page.evaluate('__wl.inp.kx===0')
 page.locator('#btnMenu').click();page.locator('#realmWarp2').click()
 page.wait_for_function("__wl.realm==='central'&&__wlMusic.state.status==='playing'",timeout=60000)
 page.wait_for_function("__wl.scene.children.some(o=>o.userData.sceneryKind==='regional-birds'&&!o.visible)")
 assert page.evaluate('__wl.featured==="desert"&&__wl.P.hull===3&&!__wlMusic.inspect().ownContext')
 distance=page.evaluate('__wl.P.dist');page.wait_for_function('d=>__wl.P.dist>d+2',arg=distance,timeout=60000)
 assert not errors,errors
 report={'commit':args.commit,'verifiedPublishedFiles':len(cache),'recordings':len([s for s in cache if s.endswith('.ogg')]),'fourteenStops':visited,'crowsAndGullsRendered':True,'nativeMapKeyboardAndReins':True,'returnedToOriginalJourney':True,'defaultOnMusic':page.evaluate('__wlMusic.state.enabled'),'pageErrors':errors}
 (args.out/'result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);browser.close()
