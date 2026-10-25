/* Quiet rear-follow variations. No orbit, cut or input/physics changes. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(){return {clock:0,side:0,pull:0,rise:0,look:0,focus:0,bend:0,boom:1};}
  function reset(s){Object.assign(s,create());return s;}
  function advance(s,dt,{speed=0,steer=0,yawRate=0,blocked=false,threat=0,bend=0}={}){
    if(!(dt>0))return s;dt=Math.min(dt,.1);
    const calm=!blocked&&threat<.1&&speed>28&&Math.abs(steer)<.24&&Math.abs(yawRate)<.14;
    // A long centred view, then one slow glance from behind, then centred again.
    // Readiness resets on input/danger, so glances never resume halfway through an avoidance.
    if(calm)s.clock+=dt;else s.clock=0;
    // The mounted view stays centred through long journeys and encounter transitions.
    const k=1-Math.exp(-3*dt);
    s.focus+=(clamp(threat,0,1)-s.focus)*(1-Math.exp(-4*dt));
    s.bend+=(clamp(bend,-.08,.08)-s.bend)*(1-Math.exp(-1.8*dt));
    s.side+=(0-s.side)*k;s.pull+=(0-s.pull)*k;s.rise+=(0-s.rise)*k;s.look+=(0-s.look)*k;
    return s;
  }
  function boomFraction(target,eye,colliders){
    const dx=eye.x-target.x,dy=eye.y-target.y,dz=eye.z-target.z;let fraction=1;
    for(const c of colliders){
      if(Math.abs(c.x-target.x)>Math.abs(dx)+c.hw+c.hd+1||Math.abs(c.z-target.z)>Math.abs(dz)+c.hw+c.hd+1)continue;
      const x=(target.x-c.x)*c.c-(target.z-c.z)*c.s,z=(target.x-c.x)*c.s+(target.z-c.z)*c.c;
      const vx=dx*c.c-dz*c.s,vz=dx*c.s+dz*c.c;let enter=0,leave=1,hit=true;
      for(const [p,v,lo,hi]of [[x,vx,-c.hw-.35,c.hw+.35],[target.y,dy,c.bottom-.35,c.top+.35],[z,vz,-c.hd-.35,c.hd+.35]]){
        if(Math.abs(v)<1e-8){if(p<lo||p>hi){hit=false;break;}}
        else{const a=(lo-p)/v,b=(hi-p)/v;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));if(enter>leave){hit=false;break;}}
      }
      // Ignore a containing volume (for example a ramp under the rider), rather than jumping the view.
      if(hit&&enter>0&&enter<fraction)fraction=Math.max(.08,enter-.025);
    }return fraction;
  }
  globalThis.WindTravelCamera=Object.freeze({create,reset,advance,boomFraction});
})();
