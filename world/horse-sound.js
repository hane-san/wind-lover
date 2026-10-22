/* Original synthesised hoof impacts: shoe clop, hollow hoof and weight on the ground. */
(() => {
  function samples(rate,front,hard,variant=0){
    const out=new Float32Array(Math.ceil(rate*.19));let seed=9271+variant*131+(front?17:0),last=0;
    const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;};
    const shift=1+(variant-1.5)*.014;
    for(let i=0;i<out.length;i++){
      const t=i/rate,w=noise(),white=w-last;last=w;
      const attack=Math.min(1,t/.0008),end=Math.min(1,(out.length-1-i)/(rate*.008));
      let s=.42*Math.sin(2*Math.PI*(front?116:92)*t)*Math.exp(-t*38);
      for(const [hz,amp,decay] of [[510,.24,42],[790,.16,58],[1230,.10,78],[1860,.055,105]])s+=amp*Math.sin(2*Math.PI*hz*shift*t)*Math.exp(-t*decay);
      s+=white*(hard?.25:.075)*Math.exp(-t*260);
      // Heel/toe give each hoof a short hollow double clop; this is one footfall, not another step.
      const u=t-.016;if(u>0)s+=(hard?.18:.09)*Math.sin(2*Math.PI*690*u)*Math.exp(-u*95)*Math.min(1,u/.001);
      out[i]=s*attack*end*(hard?1:.82);
    }out[0]=out[out.length-1]=0;return out;
  }
  function create(context,destination){
    const bank=new Map();let voices=0;
    for(const hard of [false,true])for(let leg=0;leg<4;leg++){
      const data=samples(context.sampleRate,leg>=2,hard,leg),buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);bank.set(`${hard}:${leg}`,buffer);
    }
    function play(event,hard,at=context.currentTime){
      if(voices>=24)return false;
      const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();
      source.buffer=bank.get(`${!!hard}:${event.leg}`);source.playbackRate.value=.985+event.leg*.01;
      gain.gain.value=.38*event.weight;pan.pan.value=event.leg%2?.13:-.13;
      source.connect(gain);gain.connect(pan);pan.connect(destination);voices++;
      source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();voices--;};
      source.start(at+Math.max(.003,.06-event.age));return true;
    }
    return {play,get voices(){return voices;}};
  }
  globalThis.WindHorseSound=Object.freeze({samples,create});
})();
