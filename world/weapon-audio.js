/* Short cached weapon transients: sharp attacks, smooth edges and bounded audio-clock voices. */
(() => {
  const lengths={geometry:.18,kinetic:.13,launch:.55,flyby:.16,impact:.32,acquire:.24,bowdraw:.24,bow:.22,bowhit:.32};
  function create(context,destination){
    const cache=new Map(),voices=new Set();let serial=0,lastFly=-10;
    function buffer(kind,variant){
      const key=kind+variant;if(cache.has(key))return cache.get(key);
      const length=lengths[kind]||.18,b=context.createBuffer(1,Math.ceil(length*context.sampleRate),context.sampleRate),d=b.getChannelData(0);
      let seed=7291+variant*137+Object.keys(lengths).indexOf(kind)*1973,lo=0,phase=0,air=0,body=0;
      for(let i=0;i<d.length;i++){
        seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const n=(seed>>>0)/2147483648-1,t=i/context.sampleRate;
        lo+=.12*(n-lo);const hi=n-lo,attack=Math.min(1,t/.0018),release=Math.min(1,(length-t)/.009);
        let v=0;
        // Broad air and a dry string snap replace the old pitched, plucked note.
        if(kind==='bowdraw')v=(lo*.43+hi*.07)*Math.sin(Math.PI*t/length)**2*(.72+.28*Math.sin(t*160));
        else if(kind==='bow'){
          air+=(1-Math.exp(-2*Math.PI*(4200-2600*Math.min(1,t/length))/context.sampleRate))*(n-air);
          body+=(1-Math.exp(-2*Math.PI*280/context.sampleRate))*(n-body);
          v=(air-body)*1.6*Math.min(1,t/.008)*Math.exp(-t*18)+hi*.32*Math.exp(-t*100);
        }
        // A short broad crack, low body and breaking metal: bash, rather than an electronic chirp.
        else if(kind==='bowhit'){
          body+=.045*(n-body);
          v=hi*.88*Math.exp(-t*75)+(lo-body)*1.35*Math.exp(-t*27)+body*1.5*Math.exp(-t*18)
            +Math.sin(t*2*Math.PI*(90+variant*7))*.16*Math.exp(-t*31)+hi*.12*Math.exp(-t*15);
        }
        else if(kind==='kinetic')v=hi*.54*Math.exp(-t*75)+lo*.80*Math.exp(-t*32)+Math.sin(t*650)*.20*Math.exp(-t*48);
        else if(kind==='geometry')v=hi*.40*Math.exp(-t*49)+Math.sin(t*1740)*.19*Math.exp(-t*36)+lo*.65*Math.exp(-t*28);
        else if(kind==='launch')v=lo*1.1*Math.exp(-t*7)+hi*.23*Math.exp(-t*18);
        else if(kind==='impact')v=lo*1.15*Math.exp(-t*16)+hi*.37*Math.exp(-t*42)+Math.sin(t*380)*.22*Math.exp(-t*23);
        else if(kind==='flyby')v=hi*.34*Math.sin(Math.PI*t/length)**2*Math.exp(-t*10);
        else{phase+=2*Math.PI*(960-t*1800)/context.sampleRate;v=(lo*.3+Math.sin(phase)*.11)*Math.sin(Math.PI*t/length)**2;}
        d[i]=v*attack*release;
      }cache.set(key,b);return b;
    }
    function play(kind,{gain=1,pan=0,at=context.currentTime}={}){
      if(kind==='flyby'){if(at-lastFly<.09)return false;lastFly=at;}
      if(voices.size>=24)return false;
      const source=context.createBufferSource(),level=context.createGain(),panner=context.createStereoPanner?.(),b=buffer(kind,serial++%3),now=Math.max(context.currentTime,at);
      source.buffer=b;level.gain.setValueAtTime(Math.max(0,Math.min(1,gain))*.62,now);source.connect(level);
      if(panner){panner.pan.value=Math.max(-.85,Math.min(.85,pan));level.connect(panner);panner.connect(destination);}else level.connect(destination);
      const voice={source,level,panner};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();level.disconnect();panner?.disconnect();};
      source.start(now);source.stop(now+b.duration+.01);return true;
    }
    function stop(){const now=context.currentTime;for(const v of voices){v.level.gain.cancelScheduledValues(now);v.level.gain.setTargetAtTime(0,now,.002);try{v.source.stop(now+.009);}catch(_){}}}
    function warm(){for(const kind of Object.keys(lengths))for(let variant=0;variant<3;variant++)buffer(kind,variant);}
    return {play,stop,warm,get voices(){return voices.size;},get cached(){return cache.size;}};
  }
  globalThis.WindWeaponAudio=Object.freeze({create});
})();
