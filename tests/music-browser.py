"""Check BGM inside the actual game, including shared SFX, menus, PCM output and driving."""
import argparse
import base64
import functools
import http.server
import json
from pathlib import Path
import subprocess
import threading
import numpy as np
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser',default='/usr/bin/chromium')
parser.add_argument('--three',type=Path)
parser.add_argument('--out',type=Path,default=Path('/tmp/wind-lover-music-qa'))
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*unused):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url) if '/assets/music/' in r.url else None)
    if args.three:page.route('**/three.min.js',lambda r:r.fulfill(path=str(args.three.resolve()),content_type='application/javascript'))
    page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
    page.add_init_script('''
      localStorage.setItem('windlover.shells','false');
      window.audioProbe={contexts:[],starts:[],renders:0,releases:[],holdRender:false};
      const nativeFetch=window.fetch;window.fetch=async(...args)=>{const response=await nativeFetch(...args);return audioProbe.holdRender&&String(args[0]).includes('glass-current.ogg')?new Promise(resolve=>audioProbe.releases.push(()=>resolve(response))):response;};
      const render=OfflineAudioContext.prototype.startRendering;OfflineAudioContext.prototype.startRendering=function(){audioProbe.renders++;const job=render.call(this);return audioProbe.holdRender?new Promise(resolve=>audioProbe.releases.push(()=>job.then(resolve))):job;};
      const Native=window.AudioContext,connect=AudioNode.prototype.connect,start=AudioBufferSourceNode.prototype.start;
      window.AudioContext=class extends Native{constructor(...args){super(...args);this.capture=this.createMediaStreamDestination();audioProbe.contexts.push(this);}createBuffer(...args){const b=super.createBuffer(...args);if(args[0]===1&&args[1]===this.sampleRate*2)this.noiseLoop=b;return b;}};
      AudioNode.prototype.connect=function(dest,...rest){const result=connect.call(this,dest,...rest);if(dest===this.context.destination&&this.context.capture)connect.call(this,this.context.capture);return result;};
      AudioBufferSourceNode.prototype.start=function(...args){if(this.loop&&this.buffer?.duration>30){audioProbe.starts.push(this.buffer.duration);if(audioProbe.wrapSeams)args[1]=this.buffer.duration-.55;}return start.apply(this,args);};
    ''')
    url=f'http://127.0.0.1:{server.server_port}/'
    page.goto(url,wait_until='load',timeout=120000)
    page.wait_for_function('window.__wl && window.__wlMusic',timeout=120000)
    assert page.evaluate('__wlMusic.state.enabled && audioProbe.contexts.length===0')
    assert len(requests)==0,'Default-on BGM must wait for a user gesture'
    assert page.locator('#musicTrack option').count()==29
    page.route('**/assets/music/quiet/*.ogg',lambda r:r.fulfill(body=b'invalid codec',content_type='audio/ogg') if any(id in r.request.url for id in ['rust-horizon']) else r.continue_())
    page.locator('#btnGo').click(timeout=120000)
    page.wait_for_function('__wl.P.dist>2',timeout=60000)
    page.locator('#btnMenu').click()
    assert not page.locator('#musicSettings').is_disabled()
    # Controls must not drive or start the game through keyboard shortcuts.
    before=page.evaluate('__wl.inp.ky')
    page.locator('#musicTrack').focus();page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
    assert page.evaluate('__wl.inp.ky')==before
    page.select_option('#musicTrack','rust-horizon')
    page.wait_for_function('__wlMusic.state.status==="playing"',timeout=60000)
    page.wait_for_timeout(1100)
    assert page.evaluate('audioProbe.renders>0'), 'Quiet arrangements must render before playback'
    assert requests and all('/assets/music/quiet/' in r for r in requests), 'The live arrangement fetched a driving archive mix'
    assert page.evaluate('audioProbe.contexts.length===1 && !__wlMusic.inspect().ownContext')
    assert page.evaluate('(()=>{const d=audioProbe.contexts[0].noiseLoop.getChannelData(0);return Math.abs(d[0]-d[d.length-1])<1e-6;})()'), 'The looping wind has an unmatched join'
    assert page.evaluate('__wlAudio.soundOn')
    page.locator('#menuSound').click()
    assert page.evaluate('!__wlAudio.soundOn && __wlMusic.inspect().voices===1')
    starts=page.evaluate('audioProbe.starts.length')
    page.locator('#menuClose').click();page.locator('#btnMenu').click()
    assert page.evaluate('audioProbe.starts.length')==starts,'Opening the menu restarted BGM'
    # The outgoing song must remain live while the requested arrangement render is held in flight.
    page.evaluate('audioProbe.holdRender=true')
    page.select_option('#musicTrack','glass-current');page.wait_for_function('__wlMusic.state.status==="switching"')
    page.wait_for_timeout(400)
    assert page.evaluate('__wlMusic.inspect().playingTrack==="rust-horizon" && __wlMusic.inspect().voices===1')
    assert page.evaluate('audioProbe.releases.length>0'), 'The requested loop download was not held'
    page.evaluate('audioProbe.holdRender=false;audioProbe.releases.splice(0).forEach(f=>f())')
    page.wait_for_function('__wlMusic.inspect().playingTrack==="glass-current"')
    page.wait_for_timeout(1100)
    page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000)

    page.evaluate('audioProbe.wrapSeams=true')
    page.evaluate('''()=>{const chunks=[];const r=new MediaRecorder(audioProbe.contexts[0].capture.stream,{mimeType:'audio/webm;codecs=opus'});r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};window.musicRecording={r,chunks,stopped:new Promise(resolve=>r.onstop=resolve)};r.start();}''')
    page.wait_for_timeout(600)
    page.evaluate('''()=>{const end=performance.now()+1600;while(performance.now()<end){};}''')
    for track in ['turquoise-cavalcade','pass-of-thunder','steppe-signal','seven-red-cliffs','cities-in-the-wind','saffron-riders','blue-viaduct','rust-horizon']:
      page.select_option('#musicTrack',track)
      page.wait_for_function('(id)=>__wlMusic.inspect().playingTrack===id',arg=track,timeout=60000)
      page.wait_for_timeout(1100)
      page.wait_for_function('__wlMusic.inspect().voices===1',timeout=15000)
      probe=page.evaluate('__wlMusic.inspect()');assert probe['voices']==1 and len(probe['cached'])<=2,probe
    # Accelerate only the age probe: use the real route playlist, asset loader and audio crossfade.
    page.select_option('#musicTrack','auto')
    page.wait_for_function('__wlMusic.state.status==="playing"',timeout=60000);page.wait_for_timeout(2600)
    page.evaluate("window.__originalMusicInspect=__wlMusic.inspect;__wlMusic.inspect=()=>({...__originalMusicInspect(),playingSeconds:65,duration:60})")
    before_auto=page.evaluate('__wlMusic.state.track');page.wait_for_timeout(3300)
    assert page.evaluate('(id)=>__wlMusic.state.track===id',before_auto),'A paused menu rotated the score'
    page.locator('#menuClose').click()
    page.wait_for_function('(id)=>__wlMusic.state.track!==id',arg=before_auto,timeout=20000)
    page.evaluate('__wlMusic.inspect=__originalMusicInspect')
    page.wait_for_function('__wlMusic.state.status==="playing"',timeout=60000)
    assert page.evaluate('__wlMusic.inspect().fadeSeconds>2.3'),'Automatic change lost its longer crossfade'
    page.wait_for_timeout(2600);page.wait_for_function('__wlMusic.inspect().voices===1')
    page.locator('#btnMenu').click()
    recording=page.evaluate('''async()=>{const p=musicRecording;p.r.stop();await p.stopped;const bytes=new Uint8Array(await new Blob(p.chunks).arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}''')
    webm=args.out/'game-bgm-stall.webm';webm.write_bytes(base64.b64decode(recording))
    pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(webm),'-f','f32le','-ac','2','-ar','24000','-']),dtype='<f4').reshape(-1,2)
    measured=pcm[24000:-4800]
    rms=[float(np.sqrt(np.mean(measured[i:i+2400]**2))) for i in range(0,len(measured)-2400,2400)]
    assert min(rms)>.001,{'minimumRMS':min(rms)}
    assert float(np.max(np.abs(np.diff(measured,axis=0))))<.3,'An abrupt click was present in the recorded output'
    # A cancelled request cannot restart the music after OFF.
    page.evaluate('audioProbe.holdRender=true')
    page.select_option('#musicTrack','glass-current');page.wait_for_function('__wlMusic.state.status==="switching"')
    page.wait_for_timeout(100);page.locator('#musicToggle').click()
    page.evaluate('audioProbe.holdRender=false;audioProbe.releases.splice(0).forEach(f=>f())')
    page.wait_for_timeout(1200)
    assert page.evaluate('!__wlMusic.state.enabled && __wlMusic.inspect().voices===0 && audioProbe.contexts[0].state==="running"')
    page.locator('#menuSound').click();assert page.evaluate('__wlAudio.soundOn')
    page.select_option('#musicTrack','blue-viaduct');page.locator('#musicToggle').click()
    page.wait_for_function('__wlMusic.inspect().playingTrack==="blue-viaduct"',timeout=60000)
    page.locator('#musicVolume').evaluate("e=>{e.value='34';e.dispatchEvent(new Event('input',{bubbles:true}));}")
    assert page.locator('#musicVolumeValue').text_content()=='34%'
    page.locator('#musicSettings').scroll_into_view_if_needed()
    assert page.locator('#musicSettings').bounding_box()['width']<=390
    page.screenshot(path=str(args.out/'game-music-menu.png'))
    page.reload(wait_until='load',timeout=120000);page.wait_for_function('window.__wlMusic && window.__wl',timeout=120000)
    assert page.evaluate('__wlMusic.state.enabled && __wlMusic.state.track==="blue-viaduct" && __wlMusic.state.volume===.34 && audioProbe.contexts.length===0')
    page.locator('#btnGo').click(timeout=120000)
    page.wait_for_function('__wlMusic.inspect().playingTrack==="blue-viaduct"',timeout=60000)
    assert page.evaluate('audioProbe.contexts.length===1')
    distance=page.evaluate('__wl.P.dist')
    page.wait_for_function('(distance)=>__wl.P.dist>distance+2',arg=distance,timeout=60000)
    assert page.evaluate('Number.isFinite(__wl.P.pos.x+__wl.P.pos.y+__wl.P.pos.z)')
    assert not errors,errors
    result={'automaticRotationInQuietJourney':True,'menuDoesNotRotate':True,'automaticFadeSeconds':2.4,'defaultOn':True,'loopWrapsRecorded':True,'windSeamMatched':True,'maximumOutputStep':float(np.max(np.abs(np.diff(measured,axis=0)))),'mixedJourneyArrangements':True,'sharedContext':True,'menuDoesNotRestart':True,'outgoingContinuesDuringLoad':True,'offDuringLoad':True,'persistentSettings':True,'drivingWithMusic':True,'recordedSeconds':len(pcm)/24000,'minimum100msRMS':min(rms),'mainThreadStallSeconds':1.6,'pageErrors':errors}
    (args.out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('PASS:',json.dumps(result),flush=True)
    browser.close()
finally:
  server.shutdown();server.server_close()

