/* Original broad-stride horse animation. Visual time never changes vehicle physics. */
(() => {
  const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const mix=(a,b,k)=>a+(b-a)*k;
  const cadence=speed=>.85+.7*clamp(speed/90,0,1);
  const offsets=[0,.11,.36,.49];
  function create(){return {phase:0,cycles:0,blend:0,rate:0,beats:[],air:0};}
  function advance(state,dt,speed,grounded,active=true){
    state.beats.length=0;
    if(!(dt>0))return state;
    dt=Math.min(dt,.1);
    const target=active&&grounded?smooth((speed-1)/9):0,k=1-Math.exp(-9*dt);
    state.blend=mix(state.blend,target,k);
    state.air=mix(state.air,active&&!grounded?1:0,k);
    state.rate=mix(state.rate,cadence(speed),k);
    if(target>.01){
      const before=state.cycles,after=before+state.rate*dt*target;
      // Three weighted hoof beats, followed by an unhurried suspension interval.
      for(const [beat,weight] of [[0,.8],[.36,.55],[.49,1]])
        if(Math.floor(after-beat)>Math.floor(before-beat))state.beats.push(weight);
      state.cycles=after;state.phase=after%1;
    }
    return state;
  }
  function pose(phase,blend){
    const a=phase*TAU;
    return {heave:(-.045+.035*Math.cos(a-.85*TAU))*blend,
      pitch:.025*Math.sin(a-.4)*blend,neck:.035*Math.sin(a-.6)*blend,
      riderY:.014*Math.sin(a-.9)*blend,riderPitch:(-.035+.025*Math.sin(a-1))*blend,
      tailX:-.12-.2*blend,tailZ:.06*Math.sin(a-.8)*blend};
  }
  function foot(phase,index,blend,air=0){
    const u=((phase-offsets[index])%1+1)%1,stance=u<.30;
    const swing=clamp((u-.30)/.70,0,1);
    const z=stance?mix(.48,-.48,u/.30):mix(-.48,.48,smooth(swing));
    const lift=stance?0:.38*Math.pow(Math.sin(Math.PI*swing),1.35);
    return {z:z*blend,y:.085+lift*blend+.12*air,stance:stance&&blend>.1&&air<.1};
  }
  function solve(front,footY,footZ,heave){
    const upperZ=front?-.07:.14,lowerZ=front?.09:-.1;
    const a=Math.hypot(.52,upperZ),b=Math.hypot(.59,lowerZ);
    const y=footY-1.1-heave,z=footZ;
    const d=clamp(Math.hypot(y,z),Math.abs(a-b)+.0001,a+b-.0001);
    const direction=Math.atan2(-z,-y),bend=Math.acos(clamp((d*d-a*a-b*b)/(2*a*b),-1,1));
    const upper=direction-Math.atan2(b*Math.sin(bend),a+b*Math.cos(bend));
    const leg=upper-Math.atan2(-upperZ,.52),knee=upper+bend-leg-Math.atan2(-lowerZ,.59);
    return {leg,knee};
  }
  globalThis.WindHorseGait=Object.freeze({cadence,create,advance,pose,foot,solve,offsets});
})();
