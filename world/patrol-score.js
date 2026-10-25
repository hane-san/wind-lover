/* A distant defence patrol draws a readable phrase across the sky, then yields to the bow. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function plan(cycle=0,ground=true,aspect=.5){
    const total=5+cycle%2,sentry=ground&&cycle>0&&cycle%3!==0,sky=total-(sentry?1:0);
    const skyScale=clamp(1/Math.max(.1,aspect),.58,1);
    return {total,sentry,sky,skyScale,altitude:76*skyScale,
      slots:Array.from({length:sky},(_,i)=>({side:[-42,0,42,-24,24,60][i],height:[-40,80,38,-26,104,54][i]*skyScale,depth:[-100,20,-36,-60,35,60][i]}))};
  }
  // Three separated readings overlap the bow, with clear recovery between permissions.
  const salvoGap=1.3,cueTime=.62,limit=3;
  function loft(flight,ground=false,index=0,scale=1){
    const height=(ground?120:70+(index%3)*16)*scale;
    return {lift:4*height/flight,gravity:-8*height/(flight*flight)};
  }
  function mayLaunch({ahead,salvos=0}){return ahead>220&&ahead<=515&&salvos<limit;}
  const gap=salvos=>salvos%2?-7:7;
  // Keep the complete incoming pattern visible, whilst the aiming point stays frozen.
  const tailFade=index=>clamp(1-index/12,0,1)**1.4;
  // A frozen cruise corridor rises, weaves and dives back to its exact launch-time aim.
  function cruise(age,flight,height,sway,out={}){
    const u=clamp(age/Math.max(.1,flight),0,1),h=16*u*u*(1-u)*(1-u);
    out.y=height*h;out.side=sway*Math.sin(u*Math.PI*2)*h;return out;
  }
  globalThis.WindPatrolScore=Object.freeze({plan,loft,cruise,mayLaunch,gap,tailFade,salvoGap,cueTime,limit});
})();
