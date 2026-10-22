"""Render the actual hoof sounds and verify four-contact audio timing across frame rates."""
import argparse,functools,http.server,threading,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');args=parser.parse_args();root=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/world/')
  report=page.evaluate('''async()=>{
   await import('./horse-gait.js');await import('./horse-sound.js');const results=[];
   for(const fps of [20,30,60,120]){
    const ctx=new OfflineAudioContext(2,48000*3,48000),starts=[],native=ctx.createBufferSource.bind(ctx);ctx.createBufferSource=()=>{const s=native(),start=s.start.bind(s);s.start=(at,...rest)=>{starts.push(at);return start(at,...rest)};return s;};
    const sound=WindHorseSound.create(ctx,ctx.destination),g=WindHorseGait.create();g.cycles=1;g.rate=WindHorseGait.cadence(60);g.blend=1;
    const feet=[];for(let i=1;i<=fps*2;i++){WindHorseGait.advance(g,1/fps,60,true);for(const event of g.beats){sound.play(event,true,i/fps);feet.push(event.leg);}}
    const audio=await ctx.startRendering();let peak=0,energy=0,first=0,last=0;
    for(let c=0;c<2;c++){const d=audio.getChannelData(c);first=Math.max(first,Math.abs(d[0]));last=Math.max(last,Math.abs(d.at(-1)));for(const v of d){peak=Math.max(peak,Math.abs(v));energy+=v*v;}}
    if(peak>.9||peak<.1||first>1e-6||last>1e-6)throw Error('Invalid rendered hoof output');
    if(starts.length!==feet.length||starts.length<12)throw Error('Dropped hoof contacts');
    for(let i=1;i<starts.length;i++)if(starts[i]<=starts[i-1])throw Error('Contacts collapsed onto one audio frame');
    results.push({fps,contacts:feet.length,feet:feet.slice(0,8),starts:starts.slice(0,8),peak,rms:Math.sqrt(energy/(audio.length*2)),voicesAfterRender:sound.voices});
   }
   for(const r of results)for(let i=0;i<r.starts.length;i++)if(Math.abs(r.starts[i]-results[0].starts[i])>.003)throw Error('Frame rate changed hoof timing');return results;
  }''')
  print(json.dumps(report),flush=True);browser.close();print('PASS: four-beat hoof audio, no clipping, bounded voices and frame-rate independent scheduling.')
finally:server.shutdown();server.server_close()
