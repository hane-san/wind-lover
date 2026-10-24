/* Road-relative riding, deliberate lead changes and a short gathered take-off. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const follow=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
  function create(){return {lateral:0,load:0,sign:0,held:0,cooldown:0,pending:0,kind:null,
    gather:0,flight:0,landing:0,lead:1,launch:null,wasGrounded:false};}
  function request(s,kind='bound'){
    if(s.pending>0||s.cooldown>0)return false;
    s.kind=kind;s.pending=kind==='bound'?.075:.095;s.cooldown=kind==='bound'?.95:.7;return true;
  }
  function advance(s,dt,{steer=0,speed=0,grounded=false,onRoad=false,active=true,canHop=true,yawRate=0}={}){
    s.launch=null;if(!(dt>0))return s;dt=Math.min(dt,.05);
    s.cooldown=Math.max(0,s.cooldown-dt);s.landing*=Math.exp(-12*dt);
    if(!active){s.pending=0;s.kind=null;s.sign=0;s.held=0;}
    const sign=Math.abs(steer)>.52?Math.sign(steer):0;
    // A real held bend followed by the opposite rein; stick noise cannot produce jumps.
    if(active&&sign&&sign!==s.sign){
      if(s.sign&&s.held>.18&&grounded&&onRoad&&speed>18&&canHop)request(s,'bound');
      s.sign=sign;s.held=0;
    }
    if(sign&&active)s.held+=dt;else{s.held=Math.max(0,s.held-dt*3);if(s.held===0)s.sign=0;}
    if(s.pending>0){
      if(!grounded||!active||!canHop){s.pending=0;s.kind=null;}
      else{s.pending=Math.max(0,s.pending-dt);if(!s.pending){s.launch=s.kind;s.lead=s.sign||-s.lead;s.flight=0;}}
    }
    const target=active&&(grounded||s.kind)?steer*8.6*clamp((speed-6)/14,0,1):0;
    const reversing=target*s.lateral<0;
    s.lateral=follow(s.lateral,target,reversing?15:Math.abs(target)>Math.abs(s.lateral)?10:12,dt);
    s.load=follow(s.load,active?clamp(steer*.72-yawRate*speed/140,-1,1):0,8,dt);
    s.gather=follow(s.gather,s.pending>0?1:0,s.pending>0?28:14,dt);
    if(!grounded){s.flight+=dt;}else if(!s.wasGrounded&&s.flight>0){s.landing=1;if(!s.pending)s.kind=null;s.flight=0;}
    s.wasGrounded=grounded;return s;
  }
  function pose(s,grounded,vertical=0){
    const air=grounded?0:clamp(s.flight/.11,0,1),rise=clamp(vertical/7,-1,1);
    return {heave:-.10*s.gather-.065*s.landing,pitch:-.035*s.gather-.075*rise*air,
      neckYaw:-.14*s.load,neckRoll:.035*s.load,riderRoll:-.055*s.load,
      fold:air*(.56+.28*Math.max(0,rise)),lead:s.lead,load:s.load};
  }
  globalThis.WindHorseRiding=Object.freeze({create,request,advance,pose});
})();
