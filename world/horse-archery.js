/* Draw towards the saddle, release towards the horizon. CSS pixels keep touch and mouse alike. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const range=360,cooldown=.22;
  function create(){return {id:null,x:0,y:0,dx:0,dy:0,pull:0,radius:110,target:null,recoil:0,flash:0,shots:0,hits:0,cooldown:0};}
  function begin(s,id,x,y,horse,width,height){
    if(s.id!==null||y>=horse.y)return false;
    Object.assign(s,{id,x,y,dx:0,dy:0,pull:0,radius:clamp(Math.min(width,height)*.28,88,150),target:null});return true;
  }
  function move(s,id,x,y,horse){
    if(s.id!==id)return false;s.dx=x-s.x;s.dy=y-s.y;
    const hx=horse.x-s.x,hy=Math.max(20,horse.y-s.y),length=Math.hypot(hx,hy);
    s.pull=clamp((s.dx*hx+s.dy*hy)/length/80,0,1);return true;
  }
  function end(s,id,cancel=false){
    if(s.id!==id)return false;
    const fire=!cancel&&s.pull>=.22&&s.cooldown<=0;
    s.id=null;s.pull=0;if(fire){s.shots++;s.recoil=1;s.cooldown=cooldown;}return fire;
  }
  function cancel(s){s.id=null;s.pull=0;s.target=null;}
  function pick(s,targets,previous=s.target){
    let best=null,score=Infinity;
    for(const v of targets){
      if(v.distance>range||v.distance<10||v.ahead<.25||v.z<-1||v.z>1||v.reserved||v.hidden)continue;
      const offset=Math.hypot(v.x-s.x,v.y-s.y),radius=s.radius+18;
      if(offset>radius)continue;
      const rank=offset/radius*.8+v.distance/range*.2;
      const sticky=previous?.d===v.d? .12:0;
      if(rank-sticky<score){score=rank-sticky;best=v;}
    }return best;
  }
  function advance(s,dt){s.cooldown=Math.max(0,s.cooldown-dt);s.recoil=Math.max(0,s.recoil-dt*5);s.flash=Math.max(0,s.flash-dt);}
  globalThis.WindArchery=Object.freeze({create,begin,move,end,cancel,pick,advance,range,cooldown});
})();
