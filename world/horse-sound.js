/* Original synthesised hoof impacts: shoe clop, hollow hoof and weight on the ground. */
(() => {
  const surfaces=Object.freeze({road:{edge:1,body:1,grit:.015},gravel:{edge:.73,body:.94,grit:.10},earth:{edge:.40,body:.82,grit:.035},snow:{edge:.22,body:.64,grit:.07},water:{edge:.30,body:.70,grit:.12}});
  function samples(rate,front,hard,variant=0){
    const surface=typeof hard==='string'?hard:hard?'road':'earth',material=surfaces[surface]||surfaces.earth;
    hard=surface==='road'||surface==='gravel';
    const out=new Float32Array(Math.ceil(rate*.16));let seed=9271+variant*131+(front?17:0),last=0;
    const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;};
    const shift=1+(variant%4-1.5)*.014;
    for(let i=0;i<out.length;i++){
      const t=i/rate,w=noise(),white=w-last;last=w;
      const attack=Math.min(1,t/.0008),end=Math.min(1,(out.length-1-i)/(rate*.008));
      let s=.26*Math.sin(2*Math.PI*(front?142:112)*t)*Math.exp(-t*48);
      for(const [hz,amp,decay] of [[360,.30,52],[590,.23,68],[960,.12,95],[1480,.055,130]])s+=amp*Math.sin(2*Math.PI*hz*shift*t)*Math.exp(-t*decay);
      s+=white*(.065+.095*material.edge)*Math.exp(-t*320);
      // A dry contact and a quieter irregular scrape have different envelopes.
      s+=w*material.grit*Math.exp(-t*64)*Math.min(1,t/.004);
      // Heel/toe give each hoof a short hollow double clop; this is one footfall, not another step.
      const u=t-.012;if(u>0)s+=(hard?.10:.055)*Math.sin(2*Math.PI*570*u)*Math.exp(-u*115)*Math.min(1,u/.001);
      out[i]=s*attack*end*material.body;
    }out[0]=out[out.length-1]=0;return out;
  }
  function create(context,destination){
    const bank=new Map(),live=new Set(),scheduled=new Map();let serial=0,epoch=null,lastCycles=null;
    const tone=context.createBiquadFilter();tone.type='lowpass';tone.frequency.value=3100;tone.Q.value=.5;tone.connect(destination);
    function buffer(surface,leg,variant){
      const key=`${surface}:${leg}:${variant}`;if(bank.has(key))return bank.get(key);
      const data=samples(context.sampleRate,leg>=2,surface,leg+variant*4),b=context.createBuffer(1,data.length,context.sampleRate);b.copyToChannel(data,0);bank.set(key,b);return b;
    }
    function strike(event,surface,at,rhythm=false){
      if(live.size>=24)return false;
      const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();
      const variant=serial++%3;
      source.buffer=buffer(surface,event.leg,variant);source.playbackRate.value=.98+event.leg*.008+variant*.006;
      const level=.265*event.weight;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.0015);
      gain.gain.setValueAtTime(level,at+.12);gain.gain.linearRampToValueAtTime(0,at+.16);
      pan.pan.value=event.leg%2?.13:-.13;
      source.connect(gain);gain.connect(pan);pan.connect(tone);
      const voice={source,gain,rhythm,at,level,cancelled:false};live.add(voice);
      source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();live.delete(voice);};
      source.start(at);return true;
    }
    function stop(rhythmOnly=false){
      const now=context.currentTime;
      for(const v of live){if(v.cancelled||(rhythmOnly&&!v.rhythm))continue;v.cancelled=true;
        v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.at>now?0:v.level,now);
        v.gain.gain.linearRampToValueAtTime(0,now+.008);v.source.stop(now+.009);
      }scheduled.clear();epoch=null;lastCycles=null;
    }
    function play(event,hard,at=context.currentTime){return strike(event,hard?'road':'earth',at+Math.max(.003,.06-event.age));}
    function sync(gait,{active=true,grounded=true,speed=0,surface='road',load=0}={}){
      if(!active||!grounded||speed<2||gait.rate<=0){stop(true);return;}
      const now=context.currentTime,rate=gait.stepRate||gait.rate,reference=now+.045;
      const predicted=epoch===null?gait.cycles:epoch.cycles+(reference-epoch.time)*epoch.rate;
      if(epoch===null||lastCycles===null||gait.cycles<lastCycles||Math.abs(predicted-gait.cycles)>rate*.10){stop(true);epoch={cycles:gait.cycles,time:reference,rate};}
      else epoch={cycles:predicted+(gait.cycles-predicted)*.12,time:reference,rate};
      lastCycles=gait.cycles;
      // Reserve contacts on the audio clock; a late render frame cannot collapse a close hind pair.
      for(let cycle=Math.floor(gait.cycles)-1;cycle<=Math.floor(gait.cycles)+1;cycle++)for(let leg=0;leg<4;leg++){
        const beat=cycle+WindHorseGait.offsets[leg],at=epoch.time+(beat-epoch.cycles)/rate,key=`${cycle}:${leg}`;
        if(at<now+.003||at>now+.24||scheduled.has(key))continue;
        const index=WindHorseGait.legIndex(leg,gait.lead||1);
        const pace=.78+.22*Math.min(1,Math.max(0,(speed-5)/30));
        if(strike({leg:index,weight:(leg<2?.77:1.02)*(1+.06*load)*pace},surface,at,true))scheduled.set(key,cycle);
      }
      for(const [key,cycle]of scheduled)if(cycle<Math.floor(gait.cycles)-1)scheduled.delete(key);
    }
    function lift(hard){stop(true);const at=context.currentTime+.004;strike({leg:0,weight:.55},hard?'road':'earth',at);strike({leg:1,weight:.47},hard?'road':'earth',at+.028);}
    function land(hard,impact){const at=context.currentTime+.004,weight=.55+Math.min(.4,impact/30);strike({leg:3,weight},hard?'road':'earth',at);strike({leg:2,weight:weight*.72},hard?'road':'earth',at+.042);}
    return {play,sync,stop,lift,land,get voices(){return live.size;},get cached(){return bank.size;}};
  }
  globalThis.WindHorseSound=Object.freeze({samples,create,surfaces});
})();
