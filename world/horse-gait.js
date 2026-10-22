/* Original four-beat transverse gallop. Visual time never changes vehicle physics. */
(() => {
  const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const mix=(a,b,k)=>a+(b-a)*k;
  const cadence=speed=>1.55+.57*clamp((speed-10)/80,0,1);
  // The close hind pair reads as one pickup, followed by two distinct fore contacts: pa-ka-ra, space.
  const offsets=[.07,0,.44,.26],weights=[.72,.82,1.1,1];
  function create(){return {phase:0,cycles:0,blend:0,rate:0,beats:[],air:0};}
  function advance(state,dt,speed,grounded,active=true){
    state.beats.length=0;if(!(dt>0))return state;dt=Math.min(dt,.1);
    const target=active&&grounded?smooth((speed-1)/9):0,k=1-Math.exp(-9*dt);
    state.blend=mix(state.blend,target,k);state.air=mix(state.air,active&&!grounded?1:0,k);state.rate=mix(state.rate,cadence(speed),k);
    if(target>.01){
      const before=state.cycles,after=before+state.rate*dt*target;
      for(let leg=0;leg<4;leg++){
        const beat=offsets[leg],cycle=Math.floor(after-beat);
        if(cycle>Math.floor(before-beat))state.beats.push({leg,weight:weights[leg],age:(after-cycle-beat)/(state.rate*target)});
      }
      state.beats.sort((a,b)=>b.age-a.age);state.cycles=after;state.phase=after%1;
    }return state;
  }
  function pose(phase,blend){
    const a=phase*TAU;
    return {heave:(-.055+.065*Math.cos(a-.82*TAU))*blend,
      pitch:.052*Math.sin(a-.09*TAU)*blend,neck:(.07+.055*Math.sin(a-.3))*blend,
      // Yield through the hips: the rider follows the saddle but absorbs part of its rise and pitch.
      riderY:(-.028*Math.cos(a-.82*TAU)+.01*Math.sin(a-1.1))*blend,
      riderPitch:(.05+.022*Math.sin(a-1.35)-.55*.052*Math.sin(a-.09*TAU))*blend,
      tailX:.12+.35*blend,tailZ:.055*Math.sin(a-1)*blend};
  }
  function foot(phase,index,blend,air=0){
    const u=((phase-offsets[index])%1+1)%1,front=index>=2,duty=front?.23:.27,stance=u<duty;
    const swing=clamp((u-duty)/(1-duty),0,1);
    const reach=front?.64:.66,push=front?-.58:-.68;
    const z=stance?mix(reach,push,smooth(u/duty)):mix(push,reach,smooth(swing));
    // Gather early under the belly, then reach forward before the next grounded stroke.
    const lift=stance?0:(front?.42:.34)*Math.pow(Math.sin(Math.PI*swing),1.3);
    return {z:z*blend,y:.085+lift*blend+.12*air,stance:stance&&blend>.1&&air<.1};
  }
  function solvePair(y,z,ay,az,by,bz,bendSign){
    const a=Math.hypot(ay,az),b=Math.hypot(by,bz),d=clamp(Math.hypot(y,z),Math.abs(a-b)+.0001,a+b-.0001);
    const direction=Math.atan2(-z,-y),bend=bendSign*Math.acos(clamp((d*d-a*a-b*b)/(2*a*b),-1,1));
    const upper=direction-Math.atan2(b*Math.sin(bend),a+b*Math.cos(bend));
    const leg=upper-Math.atan2(-az,-ay),knee=upper+bend-leg-Math.atan2(-bz,-by);
    return {leg,knee};
  }
  function solve(front,footY,footZ,heave,pitch=0){
    const hipZ=front?.69:-.67,Y=footY-heave,Z=hipZ+footZ;
    const y=Y*Math.cos(pitch)+Z*Math.sin(pitch)-1.1,z=-Y*Math.sin(pitch)+Z*Math.cos(pitch)-hipZ;
    if(front){const a=solvePair(y,z,-.58,-.03,-.59,.04,1);return {...a,hock:0};}
    // A real hind silhouette needs a forward stifle and a backward hock, not a second foreleg.
    const leg=Math.atan2(-z,-y)+Math.atan2(.22,.30),cy=-.30*Math.cos(leg)-.22*Math.sin(leg),cz=-.30*Math.sin(leg)+.22*Math.cos(leg);
    const dy=y-cy,dz=z-cz,ly=dy*Math.cos(leg)+dz*Math.sin(leg),lz=-dy*Math.sin(leg)+dz*Math.cos(leg);
    const a=solvePair(ly,lz,-.38,-.22,-.42,.07,-1);
    return {leg,knee:a.leg,hock:a.knee};
  }
  globalThis.WindHorseGait=Object.freeze({cadence,create,advance,pose,foot,solve,offsets});
})();
