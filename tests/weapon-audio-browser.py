"""Render cached weapon sounds and cancellation on the actual Web Audio clock."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--browser',default='/usr/bin/chromium');args=p.parse_args();root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=b.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/world/')
  result=page.evaluate('''async()=>{await import('./weapon-audio.js');const reports=[];
   for(const kind of ['geometry','kinetic','launch','flyby','impact','acquire']){
    const context=new OfflineAudioContext(1,48000,48000),s=WindWeaponAudio.create(context,context.destination);s.play(kind,{at:.05});const buffer=await context.startRendering(),d=buffer.getChannelData(0);
    let peak=0,energy=0,tail=0,step=0;for(let i=1;i<d.length;i++){peak=Math.max(peak,Math.abs(d[i]));energy+=d[i]*d[i];step=Math.max(step,Math.abs(d[i]-d[i-1]));if(i>.8*48000)tail=Math.max(tail,Math.abs(d[i]));}
    if(peak<.02||peak>.85||tail>1e-6||Math.abs(d[2400])>1e-6||s.voices)throw Error('Broken weapon envelope '+JSON.stringify({kind,peak,tail,voices:s.voices}));reports.push({kind,peak,rms:Math.sqrt(energy/d.length),maximumSampleStep:step});
   }
   const context=new OfflineAudioContext(1,48000,48000),s=WindWeaponAudio.create(context,context.destination);s.warm();if(s.cached!==18)throw Error('Weapon cache did not warm');for(let i=0;i<80;i++)s.play('kinetic',{at:.10+i*.01});if(s.voices>24)throw Error('Unbounded weapon voices');s.stop();const d=(await context.startRendering()).getChannelData(0);if(d.some(v=>Math.abs(v)>1e-6)||s.voices)throw Error('Cancelled shots fired after stop');
   return {sounds:reports,voiceCap:24,cached:18,cancelledScheduledShots:true};}''');print(json.dumps(result),flush=True);b.close()
finally:server.shutdown();server.server_close()
