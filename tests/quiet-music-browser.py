"""Audit every live journey arrangement in Chromium, checking complete loops and headroom."""
import argparse,functools,http.server,threading,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',required=True);parser.add_argument('--recordings',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/music/')
  report=page.evaluate('''async recordings=>{
   const m=await import('./journey-music.mjs?v=20261022-quiet'),results=[],ctx=recordings?new AudioContext():null;
   if(recordings)OfflineAudioContext.prototype.startRendering=()=>{throw Error('Baked recording fell back to synthesis');};
   for(const t of m.TRACKS){const start=performance.now(),a=await (recordings?m.loadQuietTrack(t.id,ctx):m.renderTrack(t.id));let energy=0,peak=0,join=0,step=0,minRMS=1;
    for(let c=0;c<2;c++){const d=a.buffer.getChannelData(c);join=Math.max(join,Math.abs(d[0]-d.at(-1)));for(let i=0;i<d.length;i++){energy+=d[i]*d[i];peak=Math.max(peak,Math.abs(d[i]));if(i)step=Math.max(step,Math.abs(d[i]-d[i-1]));}
     for(let i=0;i+12000<d.length;i+=12000){let e=0;for(let k=i;k<i+12000;k++)e+=d[k]*d[k];minRMS=Math.min(minRMS,Math.sqrt(e/12000));}}
    const rms=Math.sqrt(energy/(a.buffer.length*2));
    if(rms<.04||rms>.08||peak>.7||join>.02||step>.13||minRMS<.002||Math.abs(a.buffer.duration-a.score.seconds)>.001||(!recordings&&a.buffer.sampleRate!==24000))throw Error('Invalid journey mix '+JSON.stringify({id:t.id,rms,peak,join,step,minRMS}));
    results.push({id:t.id,seconds:a.buffer.duration,rms,peak,join,maxStep:step,minHalfSecondRMS:minRMS,renderMs:performance.now()-start,bytes:a.bytes});
   }if(ctx)await ctx.close();return results;}''',args.recordings)
  assert len(report)==22;print(json.dumps(report),flush=True);browser.close();print('PASS: twenty-two journey mixes, continuous tails, no clipping, bounded stereo buffers.')
finally:server.shutdown();server.server_close()
