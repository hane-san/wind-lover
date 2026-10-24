/* A distant defence patrol draws a readable phrase across the sky, then yields to the bow. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function plan(cycle=0,ground=true,aspect=.5){
    const total=3+cycle%2,sentry=ground&&cycle>0&&cycle%3!==0,sky=total-(sentry?1:0);
    const skyScale=clamp(1/Math.max(.1,aspect),.58,1);
    return {total,sentry,sky,skyScale,altitude:76*skyScale,
      slots:Array.from({length:sky},(_,i)=>({side:(i-(sky-1)/2)*40,height:[0,80,38,104][i]*skyScale,depth:[-68,12,-24,36][i]}))};
  }
  // The second reading is a little later than the first: two sidesteps, then clear drawing time.
  const salvoGap=1.55,cueTime=.68,limit=2;
  function loft(flight,ground=false,index=0,scale=1){
    const height=(ground?120:70+(index%3)*16)*scale;
    return {lift:4*height/flight,gravity:-8*height/(flight*flight)};
  }
  function mayLaunch({ahead,salvos=0}){return ahead>285&&ahead<=515&&salvos<limit;}
  const gap=salvos=>salvos%2?-7:7;
  // Keep the complete incoming pattern visible, whilst the aiming point stays frozen.
  const tailFade=index=>clamp(1-index/12,0,1)**1.4;
  globalThis.WindPatrolScore=Object.freeze({plan,loft,mayLaunch,gap,tailFade,salvoGap,cueTime,limit});
})();
