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
   for(const kind of ['geometry','kinetic','launch','flyby','impact','acquire','bowdraw','bow','bowhit']){
    const context=new OfflineAudioContext(1,48000*4,48000),s=WindWeaponAudio.create(context,context.destination);for(let v=0;v<3;v++)s.play(kind,{at:.05+v*1.1});const buffer=await context.startRendering(),d=buffer.getChannelData(0);
    let peak=0,energy=0,tail=0,step=0;for(let i=1;i<d.length;i++){peak=Math.max(peak,Math.abs(d[i]));energy+=d[i]*d[i];step=Math.max(step,Math.abs(d[i]-d[i-1]));if(i>3.6*48000)tail=Math.max(tail,Math.abs(d[i]));}
    if(peak<.02||peak>.85||tail>1e-6||Math.abs(d[2400])>1e-6||s.voices)throw Error('Broken weapon envelope '+JSON.stringify({kind,peak,tail,voices:s.voices}));const variants=[];for(let v=0;v<3;v++){const start=Math.round((.05+v*1.1)*48000),end=start+Math.round(.95*48000);let p=0;for(let i=start;i<end;i++)p=Math.max(p,Math.abs(d[i]));if(p<.02||p>.85||Math.abs(d[start])>1e-5)throw Error('Invalid cached variant '+kind+v);variants.push(p);}reports.push({kind,peak,variants,rms:Math.sqrt(energy/d.length),maximumSampleStep:step});
   }
   const context=new OfflineAudioContext(1,48000,48000),s=WindWeaponAudio.create(context,context.destination);s.warm();if(s.cached!==27)throw Error('Weapon cache did not warm');for(let i=0;i<80;i++)s.play('kinetic',{at:.10+i*.01});if(s.voices>24)throw Error('Unbounded weapon voices');s.stop();const d=(await context.startRendering()).getChannelData(0);if(d.some(v=>Math.abs(v)>1e-6)||s.voices)throw Error('Cancelled shots fired after stop');
   const rapid=new OfflineAudioContext(1,48000*3,48000),master=rapid.createGain(),limiter=rapid.createDynamicsCompressor();master.gain.value=.7;limiter.threshold.value=-6;limiter.knee.value=8;limiter.ratio.value=8;limiter.attack.value=.004;limiter.release.value=.16;master.connect(limiter);limiter.connect(rapid.destination);const hits=WindWeaponAudio.create(rapid,master);
   for(let i=0;i<6;i++){hits.play('bow',{at:.05+i*.24});hits.play('bowhit',{at:.17+i*.24});}const samples=(await rapid.startRendering()).getChannelData(0);let rapidPeak=0;for(const v of samples)rapidPeak=Math.max(rapidPeak,Math.abs(v));if(rapidPeak>=.95||hits.voices)throw Error('Rapid impacts clip or retain voices '+rapidPeak);
   return {rapidImpactPeak:rapidPeak,sounds:reports,voiceCap:24,cached:27,cancelledScheduledShots:true};}''');print(json.dumps(result),flush=True);b.close()
finally:server.shutdown();server.server_close()
