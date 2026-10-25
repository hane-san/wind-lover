/* One winged interceptor trades a readable cross/brake/dive for the patrol's usual missiles. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
  const windup=.95,flight=1.55,escape=1.7,radius=.95;
  function create(side=1){return {phase:'cross',age:0,clock:0,event:null,side:side<0?-1:1,locked:false,hit:false,ox:0,oy:0,oz:0,tx:0,ty:0,tz:0,ex:0,ey:0,ez:0,fx:1,fz:0};}
  function advance(s,dt,{active=true,permit=false,cancel=false}={}){
    if(!(dt>0))return s;s.event=null;
    if(cancel){s.phase='gone';s.event='gone';return s;}
    if(s.phase==='cross'){
      if(!active)return s;s.clock+=dt;
      if(s.clock>=2.2&&permit){s.phase='windup';s.age=0;s.event='lock';}
      return s;
    }
    s.age+=dt;
    if(s.phase==='windup'&&s.age>=windup){s.age-=windup;s.phase='dive';s.event='dive';}
    if(s.phase==='dive'&&s.age>=flight){s.age-=flight;s.phase='climb';s.ex=s.tx;s.ey=s.ty;s.ez=s.tz;s.event='climb';}
    if(s.phase==='climb'&&s.age>=escape){s.phase='gone';s.event='gone';}return s;
  }
  function lock(s,origin,target,forward){s.ox=origin.x;s.oy=origin.y;s.oz=origin.z;s.tx=target.x;s.ty=target.y;s.tz=target.z;s.fx=forward.x;s.fz=forward.z;s.locked=true;}
  function cross(s,out={}){const u=smooth((s.clock%4.4)/2.2),back=s.clock%4.4>2.2;
    out.side=s.side*(back?82-164*smooth((s.clock%4.4-2.2)/2.2):-82+164*u);out.height=70+Math.sin(s.clock*1.1)*16;out.depth=-55-20*Math.sin(s.clock*.7);out.bank=-s.side*Math.cos(s.clock*Math.PI/2.2)*.42;return out;
  }
  function position(s,out={}){
    if(s.phase==='windup'){out.x=s.ox;out.y=s.oy;out.z=s.oz;}
    else if(s.phase==='dive'){const u=smooth(s.age/flight);out.x=s.ox+(s.tx-s.ox)*u;out.y=s.oy+(s.ty-s.oy)*u;out.z=s.oz+(s.tz-s.oz)*u;}
    else{const t=s.age;out.x=s.ex+s.fx*t*35-s.fz*s.side*t*45;out.y=s.ey+t*55;out.z=s.ez+s.fz*t*35+s.fx*s.side*t*45;}return out;
  }
  function abortDive(s,p){s.phase='climb';s.age=0;s.ex=p.x;s.ey=p.y;s.ez=p.z;}
  globalThis.WindSweeper=Object.freeze({create,advance,lock,cross,position,abortDive,windup,flight,escape,radius});
})();
