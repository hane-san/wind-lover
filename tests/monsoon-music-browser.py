"""Record the six new songs through real warp gestures and the shared game audio output."""
import argparse,base64,functools,http.server,json,subprocess,threading
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');parser.add_argument('--three',type=Path,required=True);parser.add_argument('--out',type=Path,default=Path('/tmp/monsoon-music-qa'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True);root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three.min.js*',lambda r:r.fulfill(path=str(args.three),content_type='application/javascript'));page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.add_init_script('''localStorage.setItem('windlover.shells','false');window.audioProbe={contexts:[],starts:0};const Native=AudioContext,connect=AudioNode.prototype.connect,start=AudioBufferSourceNode.prototype.start;
   window.AudioContext=class extends Native{constructor(...a){super(...a);this.capture=this.createMediaStreamDestination();audioProbe.contexts.push(this)}};
   AudioNode.prototype.connect=function(dest,...args){const r=connect.call(this,dest,...args);if(dest===this.context.destination&&this.context.capture)connect.call(this,this.context.capture);return r};
   AudioBufferSourceNode.prototype.start=function(...a){if(this.loop&&this.buffer?.duration>30){audioProbe.starts++;a[1]=this.buffer.duration-.55;}return start.apply(this,a)};''')
  page.goto(f'http://127.0.0.1:{server.server_port}/',timeout=120000);page.wait_for_function('window.__wlMusic&&window.__wl');assert page.evaluate('__wlMusic.state.enabled&&audioProbe.contexts.length===0');page.locator('#realmWarp').click(timeout=120000);page.wait_for_function("__wlMusic.state.status==='playing'&&__wl.realm==='monsoon'",timeout=60000);page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000)
  assert page.evaluate("['bay-glass','straits-tide'].includes(__wlMusic.state.track)&&audioProbe.contexts.length===1&&!__wlMusic.inspect().ownContext")
  page.locator('#btnMenu').click();page.locator('#menuSound').click();page.evaluate('''()=>{const chunks=[],r=new MediaRecorder(audioProbe.contexts[0].capture.stream,{mimeType:'audio/webm;codecs=opus'});r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};window.recording={r,chunks,stopped:new Promise(resolve=>r.onstop=resolve)};r.start()}''');page.wait_for_timeout(1000)
  for track in ['bay-glass','sunset-reins','lotus-stone','khaosan-afterlight','runway-swallow','straits-tide']:
   page.select_option('#musicTrack',track);page.wait_for_function('id=>__wlMusic.inspect().playingTrack===id',arg=track,timeout=60000);page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000);page.wait_for_timeout(650);assert page.evaluate('__wlMusic.inspect().cached.length<=2')
  page.select_option('#musicTrack','auto');page.wait_for_function("__wlMusic.state.status==='playing'");page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000)
  # Use real menu warps across two very different scenes whilst the soundtrack is being recorded.
  for zone in ['khaosan','straits']:
   page.locator('#monsoonStops').evaluate('(el)=>el.open=true');page.locator('[data-monsoon-zone="'+zone+'"]').click();page.wait_for_function("__wlMusic.state.status==='playing'");page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000);page.locator('#btnMenu').click()
  page.locator('#realmWarp2').click();page.wait_for_function("__wl.realm==='central'&&__wlMusic.state.status==='playing'");page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000);page.wait_for_timeout(600)
  data=page.evaluate('''async()=>{const q=recording;q.r.stop();await q.stopped;const bytes=new Uint8Array(await new Blob(q.chunks).arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)}''');file=args.out/'warp-music.webm';file.write_bytes(base64.b64decode(data));pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','f32le','-ac','2','-ar','24000','-']),dtype='<f4').reshape(-1,2)[24000:-4800];rms=[float(np.sqrt(np.mean(pcm[i:i+2400]**2))) for i in range(0,len(pcm)-2400,2400)];step=float(np.max(np.abs(np.diff(pcm,axis=0))));assert min(rms)>.001 and step<.3,{'rms':min(rms),'step':step};assert not errors,errors
  report={'newSongsRecorded':6,'nativeWarpDefaultOn':True,'bothRealmsRecorded':True,'oneSharedContext':page.evaluate('audioProbe.contexts.length===1'),'seconds':len(pcm)/24000,'minimum100msRMS':min(rms),'maximumOutputStep':step,'pageErrors':errors};(args.out/'result.json').write_text(json.dumps(report,indent=2));print('PASS:',json.dumps(report),flush=True);browser.close()
finally:server.shutdown();server.server_close()
