/* Position-led seasons and a lake journey that turns from clear morning to stars. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,k)=>a+(b-a)*k;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
  function mountain(x,z,height){
    if(x<32000||x>48700)return {region:0,snow:0};
    const p=WindRoutes.mountainAtX(x),region=smooth(32000,32800,x)*(1-smooth(47600,48700,x))*(1-smooth(1500,2600,Math.abs(z-p.z)));
    return {region,snow:region*smooth(330,560,height)};
  }
  function create(){return {lastS:null,distance:0,eveningStart:null,evening:0};}
  function advance(state,dt,route,vx,speed){
    if(!(dt>0)||route?.path.id!=='lake'){state.lastS=null;return state;}
    if(state.lastS!==null){let delta=route.s-state.lastS,L=route.path.length;
      if(delta<-L*.5)delta+=L;if(delta>L*.5)delta-=L;
      if(Math.abs(delta)<250)state.distance+=Math.max(0,delta);
    }
    state.lastS=route.s;
    if(state.eveningStart===null&&state.distance>1500&&vx<-.35*speed)state.eveningStart=state.distance;
    if(state.eveningStart!==null)state.evening=Math.max(state.evening,clamp((state.distance-state.eveningStart)/7800,0,1));
    return state;
  }
  const colours={day:{top:0x4f86b3,hor:0xc9e2ee,bot:0xb6d4d9,sun:0xffedc9},
    dusk:{top:0x4a527d,hor:0xe3a47b,bot:0xa8949e,sun:0xffb475},
    night:{top:0x101c35,hor:0x304963,bot:0x334954,sun:0x9eb7d1}};
  function sky(phase){
    const p=clamp(phase,0,1),sunset=smooth(.05,.52,p),night=smooth(.48,1,p);
    return {phase:p,sunset,night,stars:smooth(.60,.96,p),elevation:mix(.34,-.28,smooth(0,.87,p)),
      light:mix(1,.40,night),fog:mix(5200,6500,night)};
  }
  globalThis.WindJourneyClimate=Object.freeze({mountain,create,advance,sky,colours});
})();
