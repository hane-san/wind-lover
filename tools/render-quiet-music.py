"""Bake the live WebAudio chamber scores to small, seamless Vorbis loops (Playwright and FFmpeg)."""
import argparse,base64,functools,http.server,json,subprocess,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--browser',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=root/'assets/music/quiet';out.mkdir(parents=True,exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True,args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/music/')
  ids=page.evaluate("async()=>{const m=await import('./journey-music.mjs?v=20261022-quiet');window.quietRenderer=m;return m.TRACKS.map(t=>t.id);}")
  for id in ids:
   data=page.evaluate('''async id=>{
    const a=await quietRenderer.renderTrack(id),b=a.buffer,pcm=new Uint8Array(b.length*4),v=new DataView(pcm.buffer),left=b.getChannelData(0),right=b.getChannelData(1);
    for(let i=0;i<b.length;i++){v.setInt16(i*4,Math.round(Math.max(-1,Math.min(1,left[i]))*32767),true);v.setInt16(i*4+2,Math.round(Math.max(-1,Math.min(1,right[i]))*32767),true);}
    let s='';for(let i=0;i<pcm.length;i+=8192)s+=String.fromCharCode(...pcm.subarray(i,i+8192));return{pcm:btoa(s),seconds:b.duration,rms:a.rms,peak:a.peak};}''',id)
   subprocess.run(['ffmpeg','-y','-v','error','-f','s16le','-ar','24000','-ac','2','-i','pipe:0','-c:a','libvorbis','-q:a','3',str(out/(id+'.ogg'))],input=base64.b64decode(data.pop('pcm')),check=True)
   print(json.dumps({'id':id,**data,'bytes':(out/(id+'.ogg')).stat().st_size}),flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
