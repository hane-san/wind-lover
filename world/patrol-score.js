/* A distant defence patrol draws a readable phrase across the sky, then yields to the bow. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function plan(cycle=0,ground=true,aspect=.5,landscape='open'){
    const total=6+cycle%2,sentry=ground&&cycle>0&&cycle%3!==0,sky=total-(sentry?1:0);
    const skyScale=clamp(1/Math.max(.1,aspect),.58,1);
    const spread=landscape==='canyon'?.78:landscape==='mountain'?.86:landscape==='city'?.82:1;
    const altitude=({canyon:62,mountain:84,lake:82,city:88}[landscape]||76)*skyScale;
    return {total,sentry,sky,skyScale,altitude,
      slots:Array.from({length:sky},(_,i)=>({side:[-42,0,42,-24,24,-58,58][i]*spread,height:[-40,80,38,-26,104,54,4][i]*skyScale,depth:[-100,20,-36,-60,35,60,-10][i]}))};
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
  function flourish(pattern,gap=7){
    const points=[],add=(x,y,delay)=>{if(Math.abs(x-gap)>5.5||Math.abs(y)>2.5)points.push({x,y,delay});};
    if(pattern===9)for(let row=0;row<2;row++)for(let k=-8;k<=8;k++)add(k*5.8,Math.abs(k)*.55,row*.38+Math.abs(k)*.008);
    if(pattern===10)for(let arm=0;arm<2;arm++)for(let k=0;k<25;k++){const u=k/24;add((u-.5)*88,Math.sin(u*Math.PI*2+arm*Math.PI)*9,arm*.28+k*.009);}
    if(pattern===11)for(let row=0;row<3;row++)for(let k=-6;k<=6;k++)add(k*6.6,Math.abs(k%3)*2,row*.30+(k+6)*.008);
    return points;
  }
  globalThis.WindPatrolScore=Object.freeze({plan,loft,cruise,flourish,mayLaunch,gap,tailFade,salvoGap,cueTime,limit});
})();
