"""Decode all twelve real audio assets, verify loop lengths, RMS, joins and new-track PCM fallback."""
import argparse,functools,http.server,threading,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',default='/usr/bin/chromium');args=parser.parse_args();root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=browser.new_page()
  page.route('**/snowlight.ogg',lambda r:r.fulfill(body=b'unsupported codec',content_type='audio/ogg'))
  page.goto(f'http://127.0.0.1:{server.server_port}/music/')
  report=page.evaluate('''async()=>{
   const m=await import('./journey-music.mjs'),ctx=new AudioContext(),results=[];
   for(const t of m.TRACKS){const a=await m.loadTrackAssets(t.id,ctx);let energy=0,peak=0,step=0,join=0;
    for(let c=0;c<2;c++){const d=a.buffer.getChannelData(c);join=Math.max(join,Math.abs(d[0]-d.at(-1)));for(let i=0;i<d.length;i++){energy+=d[i]*d[i];peak=Math.max(peak,Math.abs(d[i]));if(i)step=Math.max(step,Math.abs(d[i]-d[i-1]));}}
    const rms=Math.sqrt(energy/(a.buffer.length*2));if(rms<.05||peak>.95||join>.08||Math.abs(a.buffer.duration-a.score.seconds)>.02)throw Error('Invalid asset '+JSON.stringify({id:t.id,rms,peak,join}));results.push({id:t.id,seconds:a.buffer.duration,rms,peak,join,maxStep:step});
   }await ctx.close();return results;}''')
  print(json.dumps(report),flush=True);assert len(report)==12;browser.close();print('PASS: 12 real loop decodes, balanced output, seamless joins and new-track PCM fallback.')
finally:server.shutdown();server.server_close()
