"""Render the runtime audio-clock scheduler, including a missed frame and cancellation."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=browser.new_page()
  page.goto(f'http://127.0.0.1:{server.server_port}/world/')
  result=page.evaluate('''async()=>{
   await import('./horse-gait.js');await import('./horse-sound.js');const reports=[];
   for(const mode of ['steady','accelerating'])for(const fps of [20,30,60,120]){
    const audio=new OfflineAudioContext(2,48000*3,48000),starts=[],stops=[];let clock=0;
    const context={sampleRate:48000,get currentTime(){return clock;}};
    for(const name of ['createBiquadFilter','createBuffer','createGain','createStereoPanner'])context[name]=audio[name].bind(audio);
    context.createBufferSource=()=>{const s=audio.createBufferSource(),start=s.start.bind(s),stop=s.stop.bind(s);s.start=at=>{starts.push(at);return start(at)};s.stop=at=>{stops.push(at);return stop(at)};return s;};
    const sound=WindHorseSound.create(context,audio.destination),g=WindHorseGait.create();g.cycles=mode==='steady'?1:2000;g.rate=WindHorseGait.cadence(mode==='steady'?60:40);g.blend=1;
    // Suppress one 150 ms update window: previously this collapsed close contacts onto a single frame.
    sound.sync(g,{active:true,grounded:true,speed:60,surface:'gravel'});
    for(let i=0;i<fps*2;i++){
      clock=(i+1)/fps;WindHorseGait.advance(g,1/fps,mode==='steady'?60:40+clock*40,true);
      if(clock>=.8&&clock<.95)continue;
      sound.sync(g,{active:true,grounded:true,speed:60,surface:'gravel'});
    }
    clock=2;sound.stop();const rendered=await audio.startRendering();
    let peak=0,step=0,tail=0;for(let c=0;c<2;c++){const d=rendered.getChannelData(c);for(let i=1;i<d.length;i++){peak=Math.max(peak,Math.abs(d[i]));step=Math.max(step,Math.abs(d[i]-d[i-1]));if(i>2.03*48000)tail=Math.max(tail,Math.abs(d[i]));}}
    const ordered=[...starts].sort((a,b)=>a-b),gaps=ordered.slice(1).map((v,i)=>v-ordered[i]);
    if(peak>.7||peak<.1||step>.22||tail>1e-5)throw Error('Audio level, discontinuity or cancellation failed '+JSON.stringify({peak,step,tail}));
    if(gaps.some(g=>g<.02)||gaps.some(g=>g>.34))throw Error('Clumped or missing hoof contacts '+JSON.stringify(gaps));
    if(sound.voices!==0||sound.cached>60)throw Error('Audio resources grew');
    reports.push({mode,fps,contacts:starts.length,peak,maximumSampleStep:step,tailAfterStop:tail,cache:sound.cached,starts:ordered.slice(2,10)});
   }return reports;
  }''')
  print(json.dumps(result),flush=True);browser.close()
finally:server.shutdown();server.server_close()
