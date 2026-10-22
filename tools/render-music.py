"""Bake new Wind Lover scores to seamless Ogg/PCM loops (requires NumPy, SciPy, Node and FFmpeg)."""
import json,subprocess,wave,argparse
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('ids',nargs='*');args=parser.parse_args()
scores=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {TRACKS,buildScore} from './music/scores.mjs';console.log(JSON.stringify(TRACKS.slice(4).map(t=>buildScore(t.id))));"],cwd=root))
sr=24000
for score in scores:
 if args.ids and score['id'] not in args.ids:continue
 beat=60/score['bpm'];n=round(score['seconds']*sr);audio=np.zeros((n,2),np.float64);rng=np.random.default_rng(703)
 for event in score['events']:
  voice=event['voice'];dur=event['duration']*beat;pad=voice=='pad';drum=voice in ['kick','snare','tom','hat'];pluck=voice in ['pluck','glass','keys']
  release=1.6 if pad else .095 if voice=='bass' else .75 if pluck else .35
  if drum:dur=.035 if voice=='hat' else .08;release=.055 if voice=='hat' else .17
  length=round((dur+release)*sr);t=np.arange(length)/sr;attack=.65 if pad else .003 if drum else .008 if pluck else .045
  attack=min(attack,dur/3);a=np.clip(t/max(.001,attack),0,1)
  if pluck or drum:env=a*np.exp(-t/(max(.05,dur+release)*.19))
  else:env=a*np.where(t<dur,1-.18*np.clip((t-attack)/max(.001,dur-attack),0,1),.82*np.clip(1-(t-dur)/release,0,1))
  # Smooth every release to zero, including percussive and plucked tails.
  env*=np.minimum(1,np.maximum(0,(dur+release-t)/.015))
  hz=440*2**((event['midi']-69)/12)
  if voice in ['kick','tom']:
   f0,f1=(170,67) if voice=='tom' else (145,43);k=np.log(f1/f0)/.1;phase=2*np.pi*f0*(np.exp(k*np.minimum(t,.1))-1)/k+2*np.pi*f1*np.maximum(0,t-.1);sound=np.sin(phase)
  elif voice in ['hat','snare']:
   sound=sosfilt(butter(2,6500 if voice=='hat' else 1400,fs=sr,btype='high',output='sos'),rng.uniform(-1,1,length))
   if voice=='snare':sound+=.23*np.sin(2*np.pi*(112*t+83*(1-np.exp(-t*20))/20))
  else:
   phase=2*np.pi*hz*t
   if voice in ['glass','keys']:sound=.8*np.sin(phase+(0.32 if voice=='glass' else .7)*np.exp(-t*3)*np.sin(phase*(3.003 if voice=='glass' else 2.002)))+.1*np.sin(phase*2)
   elif voice=='air':sound=.85*np.sin(phase+.04*np.sin(2*np.pi*4.8*t))+.12*np.sin(phase*2)
   elif voice=='bass':sound=.78*np.sin(phase)+.22*(2/np.pi)*np.arcsin(np.sin(phase))
   elif pad:sound=.42*(2/np.pi)*(np.arcsin(np.sin(phase*2**(-7/1200)))+np.arcsin(np.sin(phase*2**(7/1200))))+.08*np.sin(phase*2)
   else:sound=.72*(2/np.pi)*np.arcsin(np.sin(phase))+.18*np.sin(phase*2)+.06*np.sin(phase*3)
   cutoff=1600 if pad else 500 if voice=='bass' else 3300 if voice=='pluck' else 6500
   sound=sosfilt(butter(2,cutoff,fs=sr,output='sos'),sound)
  sound*=env*event['velocity'];pan=event['pan'];stereo=sound[:,None]*np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])
  start=round(event['beat']*beat*sr)%n;first=min(length,n-start);audio[start:start+first]+=stereo[:first]
  if first<length:audio[:length-first]+=stereo[first:]
 dry=audio.copy()
 for delay,level,pan in [(.375,.16,-.48),(.75,.10,.48)]:
  for repeat in range(1,5):audio+=np.roll(dry,round(beat*delay*repeat*sr),axis=0)*(level*.27**(repeat-1))*np.array([1-pan*.4,1+pan*.4])
 # Circular high-pass: the retained second cycle already contains the first cycle's filter tail.
 audio=sosfilt(butter(2,28,fs=sr,btype='high',output='sos'),np.tile(audio,(2,1)),axis=0)[n:]
 peak=np.abs(audio).max();rms=np.sqrt(np.mean(audio**2));audio*=min(.8/max(peak,.0001),.115/max(rms,.0001))
 # Match the playback correction: repair the DC/slope join across 8 ms, keeping note tails audible.
 span=round(sr*.008);weight=1-3*np.linspace(0,1,span)**2+2*np.linspace(0,1,span)**3
 for c in range(2):
  d=audio[:,c];slope=((d[1]-d[0])+(d[-1]-d[-2]))/2;error=d[0]-d[-1]-slope;d[:span]-=error*.5*weight;d[-span:]+=error*.5*weight[::-1]
 out=root/'assets/music'/score['id']
 with wave.open(str(out.with_suffix('.wav')),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(out.with_suffix('.wav')),'-c:a','libvorbis','-q:a','4',str(out.with_suffix('.ogg'))],check=True)
 print(json.dumps({'id':score['id'],'seconds':n/sr,'rms':float(np.sqrt(np.mean(audio**2))),'peak':float(np.abs(audio).max())}),flush=True)
