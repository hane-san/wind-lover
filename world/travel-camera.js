/* Quiet rear-follow variations. No orbit, cut or input/physics changes. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(){return {clock:0,side:0,pull:0,rise:0,look:0};}
  function reset(s){s.clock=s.side=s.pull=s.rise=s.look=0;return s;}
  function advance(s,dt,{speed=0,steer=0,yawRate=0,blocked=false}={}){
    if(!(dt>0))return s;dt=Math.min(dt,.1);
    const calm=!blocked&&speed>28&&Math.abs(steer)<.24&&Math.abs(yawRate)<.14;
    // A long centred view, then one slow glance from behind, then centred again.
    // Readiness resets on input/danger, so glances never resume halfway through an avoidance.
    if(calm)s.clock+=dt;else s.clock=0;
    const cycle=Math.floor(s.clock/38),phase=s.clock%38;
    const u=clamp((phase-14)/12,0,1),glance=calm&&phase<26?Math.sin(Math.PI*u)**2:0;
    const side=(cycle%2?-1:1)*2.2*glance-clamp(yawRate,-.10,.10)*5.5*(calm?1:0);
    const k=1-Math.exp(-(calm?.7:4.5)*dt);
    s.side+=(side-s.side)*k;s.pull+=(1.65*glance-s.pull)*k;s.rise+=(.28*glance-s.rise)*k;s.look+=(.22*side-s.look)*k;
    return s;
  }
  globalThis.WindTravelCamera=Object.freeze({create,reset,advance});
})();
