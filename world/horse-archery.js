/* A short steppe bow rewards a committed draw, then releases without an artificial holding timer. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const range=360,cooldown=.28,minPull=.8;
  function create(){return {id:null,x:0,y:0,dx:0,dy:0,axisX:0,axisY:1,pull:0,drawLength:86,span:70,radius:110,target:null,recoil:0,releasePull:0,releaseX:0,releaseY:0,releaseAngle:0,releaseScale:0,readyCue:false,flash:0,shots:0,hits:0,cooldown:0};}
  function begin(s,id,x,y,horse,width,height){
    if(s.id!==null||y>=horse.y)return false;
    const side=Math.min(width,height),hx=horse.x-x,hy=Math.max(20,horse.y-y),length=Math.hypot(hx,hy);
    Object.assign(s,{id,x,y,dx:0,dy:0,axisX:hx/length,axisY:hy/length,pull:0,drawLength:clamp(side*.22,70,96),span:clamp(side*.18,52,78),radius:clamp(side*.28,88,150),target:null,recoil:0,releasePull:0,releaseScale:0,readyCue:false});return true;
  }
  function move(s,id,x,y,horse){
    if(s.id!==id)return false;s.dx=x-s.x;s.dy=y-s.y;
    // Keep the saddle draw; either sideways stroke also loads fully, up to 10 degrees upwards.
    // Ease out by 20 degrees rather than making readiness jump at the edge of that sector.
    const length=Math.hypot(s.dx,s.dy),edge=clamp((s.dy/Math.max(1,length)+Math.sin(Math.PI/9))/(Math.sin(Math.PI/9)-Math.sin(Math.PI/18)),0,1);
    const stroke=Math.max(s.dx*s.axisX+s.dy*s.axisY,length*edge*edge*(3-2*edge));
    s.pull=clamp((stroke-3)/(s.drawLength-3),0,1);return true;
  }
  function end(s,id,cancel=false){
    if(s.id!==id)return false;
    const fire=!cancel&&s.pull>=minPull&&s.cooldown<=0;
    s.releasePull=fire?s.pull:0;s.id=null;s.pull=0;
    if(fire){s.shots++;s.recoil=1;s.cooldown=cooldown;}return fire;
  }
  function cancel(s){s.id=null;s.pull=0;s.target=null;s.recoil=0;s.releasePull=0;s.releaseScale=0;s.readyCue=false;}
  function layout(target,horse,width,height,span){
    if(![target?.x,target?.y,horse?.x,horse?.y,width,height,span].every(Number.isFinite)||width<80||height<80)return null;
    const dx=horse.x-target.x,dy=horse.y-target.y,length=Math.hypot(dx,dy);
    if(length<88)return null; // The physical bow still shows when the projected gap cannot hold an overlay.
    const ux=dx/length,uy=dy/length,angle=Math.atan2(dy,dx)-Math.PI/2,c=Math.cos(angle),s=Math.sin(angle),margin=12;
    for(const scale of [1,.85,.7,.55,.42,.32]){
      let lo=26+40*scale,hi=length-18-96*scale;
      const corners=[];
      for(const x of [-span-8,span+8])for(const y of [-40,96])corners.push({x:(x*c-y*s)*scale,y:(x*s+y*c)*scale});
      // Intersect a segment with the padded viewport; never clamp x/y independently off the shot line.
      for(const corner of corners)for(const [origin,axis,offset,limit,start]of [[target.x,ux,corner.x,width,margin],[target.y,uy,corner.y,height,Math.min(64,height*.15)]]){
        if(Math.abs(axis)<1e-8){if(origin+offset<start||origin+offset>limit-margin)hi=-1;}
        else{const a=(start-origin-offset)/axis,b=(limit-margin-origin-offset)/axis;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
      }
      if(lo>hi)continue;
      const distance=clamp(length*.36,lo,Math.min(hi,Math.max(lo,Math.min(width,height)*.34)));
      return {x:target.x+ux*distance,y:target.y+uy*distance,angle,scale,distance};
    }return null;
  }
  function available(v){return v.distance<=range&&v.distance>=10&&v.ahead>=-1e-6&&v.z>=-1&&v.z<=1&&!v.reserved&&!v.hidden&&v.visible!==false;}
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
  function advance(s,dt){s.cooldown=Math.max(0,s.cooldown-dt);s.recoil=Math.max(0,s.recoil-dt*5.5);s.flash=Math.max(0,s.flash-dt);}
  globalThis.WindArchery=Object.freeze({create,begin,move,end,cancel,pick,lock,layout,advance,range,cooldown,minPull});
})();
