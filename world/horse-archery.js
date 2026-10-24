/* A short steppe bow rewards a committed draw, then releases without an artificial holding timer. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const range=360,cooldown=.22,minPull=.78;
  function create(){return {id:null,x:0,y:0,dx:0,dy:0,pull:0,drawLength:78,span:70,radius:110,target:null,recoil:0,releasePull:0,releaseX:0,releaseY:0,releaseAngle:0,readyCue:false,flash:0,shots:0,hits:0,cooldown:0};}
  function begin(s,id,x,y,horse,width,height){
    if(s.id!==null||y>=horse.y)return false;
    const side=Math.min(width,height);
    Object.assign(s,{id,x,y,dx:0,dy:0,pull:0,drawLength:clamp(side*.2,64,88),span:clamp(side*.18,52,78),radius:clamp(side*.28,88,150),target:null,recoil:0,releasePull:0,readyCue:false});return true;
  }
  function move(s,id,x,y,horse){
    if(s.id!==id)return false;s.dx=x-s.x;s.dy=y-s.y;
    const hx=horse.x-s.x,hy=Math.max(20,horse.y-s.y),length=Math.hypot(hx,hy);
    s.pull=clamp((s.dx*hx+s.dy*hy)/length/s.drawLength,0,1);return true;
  }
  function end(s,id,cancel=false){
    if(s.id!==id)return false;
    const fire=!cancel&&s.pull>=minPull&&s.cooldown<=0;
    s.releasePull=fire?s.pull:0;s.id=null;s.pull=0;
    if(fire){s.shots++;s.recoil=1;s.cooldown=cooldown;}return fire;
  }
  function cancel(s){s.id=null;s.pull=0;s.target=null;s.recoil=0;s.releasePull=0;s.readyCue=false;}
  function available(v){return v.distance<=range&&v.distance>=10&&v.ahead>=.25&&v.z>=-1&&v.z<=1&&!v.reserved&&!v.hidden&&v.visible!==false;}
  function pick(s,targets,previous=s.target){
    let best=null,score=Infinity;
    for(const v of targets){
      if(!available(v))continue;
      const offset=Math.hypot(v.x-s.x,v.y-s.y),radius=s.radius+18;if(offset>radius)continue;
      const rank=offset/radius*.8+v.distance/range*.2;
      const sticky=previous?.d===v.d? .12:0;
      if(rank-sticky<score){score=rank-sticky;best=v;}
    }return best;
  }
  function lock(s,targets){
    // Follow the selected drone through the draw; riding and camera motion must not switch targets.
    const held=s.target&&targets.find(v=>v.d===s.target.d&&available(v));return held||pick(s,targets);
  }
  function advance(s,dt){s.cooldown=Math.max(0,s.cooldown-dt);s.recoil=Math.max(0,s.recoil-dt*6.5);s.flash=Math.max(0,s.flash-dt);}
  globalThis.WindArchery=Object.freeze({create,begin,move,end,cancel,pick,lock,advance,range,cooldown,minPull});
})();
