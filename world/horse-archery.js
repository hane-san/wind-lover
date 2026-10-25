/* A short steppe bow rewards a committed draw, then releases without an artificial holding timer. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const range=420,cooldown=.24,minPull=.8;
  function create(){return {id:null,x:0,y:0,dx:0,dy:0,axisX:0,axisY:1,pull:0,drawLength:86,span:70,radius:110,target:null,recoil:0,releasePull:0,releaseX:0,releaseY:0,releaseAngle:0,releaseScale:0,drawAngle:0,aimAngle:0,aimRadius:0,aimOriginX:0,aimOriginY:0,drawn:false,steering:false,steerX:0,steerY:0,aimBaseX:0,aimBaseY:0,aimX:0,aimY:0,aimGoalX:0,aimGoalY:0,width:0,height:0,retarget:null,retargetT:0,pose:null,grip:null,aimCaptured:false,controlX:0,controlY:0,readyCue:false,flash:0,shots:0,hits:0,cooldown:0};}
  function begin(s,id,x,y,horse,width,height){
    if(s.id!==null||y>=horse.y)return false;
    const side=Math.min(width,height),hx=horse.x-x,hy=Math.max(20,horse.y-y),length=Math.hypot(hx,hy);
    Object.assign(s,{id,x,y,dx:0,dy:0,axisX:hx/length,axisY:hy/length,pull:0,drawLength:clamp(side*.4,110,170),span:clamp(side*.23,70,96),radius:clamp(side*.28,88,150),target:null,recoil:0,releasePull:0,releaseScale:0,drawAngle:0,aimAngle:0,aimRadius:0,aimOriginX:0,aimOriginY:0,drawn:false,steering:false,aimBaseX:x,aimBaseY:y,aimX:x,aimY:y,aimGoalX:x,aimGoalY:y,width,height,retarget:null,retargetT:0,pose:null,grip:null,aimCaptured:false,controlX:0,controlY:0,readyCue:false});
    s.grip={x:clamp(horse.x+(x-horse.x)*.12,width*.35,width*.65),y:clamp(y+(horse.y-y)*.66,Math.max(72,height*.38),height-Math.min(120,height*.26))};
    return true;
  }
  function move(s,id,x,y,horse){
    if(s.id!==id)return false;s.dx=x-s.x;s.dy=y-s.y;
    // Keep the saddle draw; either sideways stroke also loads fully, up to 10 degrees upwards.
    // Ease out by 20 degrees rather than making readiness jump at the edge of that sector.
    const length=Math.hypot(s.dx,s.dy),edge=clamp((s.dy/Math.max(1,length)+Math.sin(Math.PI/9))/(Math.sin(Math.PI/9)-Math.sin(Math.PI/18)),0,1);
    const stroke=Math.max(s.dx*s.axisX+s.dy*s.axisY,length*edge*edge*(3-2*edge));
    s.pull=clamp((stroke-3)/(s.drawLength-3),0,1);
    if(!s.drawn&&s.pull>=minPull){
      s.drawn=true;s.steerX=x;s.steerY=y;if(!s.aimCaptured)captureAim(s,s.target||{x:s.x,y:s.y},horse);
      s.drawAngle=Math.atan2(s.dx,s.dy);s.controlX=x-Math.sin(s.drawAngle)*s.drawLength;s.controlY=y-Math.cos(s.drawAngle)*s.drawLength;
    }
    if(s.drawn){
      if(length<s.drawLength*.35){s.drawn=false;s.steering=false;s.retarget=null;s.retargetT=0;}
      else{
        s.pull=Math.max(minPull,s.pull);
        let cx=x-s.controlX,cy=y-s.controlY,lever=Math.hypot(cx,cy),delta=Math.atan2(Math.sin(Math.atan2(cx,cy)-s.drawAngle),Math.cos(Math.atan2(cx,cy)-s.drawAngle));
        // Let a longer straight pull settle without making sideways steering progressively heavier.
        if(!s.steering&&Math.abs(delta)<.04&&lever>s.drawLength){s.controlX=x-Math.sin(s.drawAngle)*s.drawLength;s.controlY=y-Math.cos(s.drawAngle)*s.drawLength;cx=x-s.controlX;cy=y-s.controlY;lever=s.drawLength;delta=0;}
        if(Math.abs(delta)>.04&&Math.abs(delta)*lever>20)s.steering=true;
        // Turn the nock around the original draw ray. Pulling farther along that ray cannot steer.
        if(s.steering){const turn=Math.sign(delta)*Math.max(0,Math.abs(delta)-.025),angle=clamp(s.aimAngle-turn,-1.3,1.3);
          s.aimGoalX=clamp(s.aimOriginX+Math.sin(angle)*s.aimRadius,16,s.width-16);
          s.aimGoalY=clamp(s.aimOriginY-Math.cos(angle)*s.aimRadius,32,s.height-24);}
      }
    }return true;
  }
  function end(s,id,cancel=false){
    if(s.id!==id)return false;
    const fire=!cancel&&s.pull>=minPull&&s.cooldown<=0;
    s.releasePull=fire?s.pull:0;s.id=null;s.pull=0;
    if(fire){s.shots++;s.recoil=1;s.cooldown=cooldown;}return fire;
  }
  function cancel(s){s.id=null;s.pull=0;s.target=null;s.recoil=0;s.releasePull=0;s.releaseScale=0;s.readyCue=false;s.drawn=false;s.steering=false;s.retarget=null;s.retargetT=0;s.pose=null;s.grip=null;s.aimCaptured=false;}
  function layout(target,horse,width,height,span,pull=0){
    if(![target?.x,target?.y,horse?.x,horse?.y,width,height,span].every(Number.isFinite)||width<80||height<80)return null;
    const dx=horse.x-target.x,dy=horse.y-target.y,length=Math.hypot(dx,dy);
    if(length<88)return null; // The physical bow still shows when the projected gap cannot hold an overlay.
    const ux=dx/length,uy=dy/length,angle=Math.atan2(dy,dx)-Math.PI/2,c=Math.cos(angle),s=Math.sin(angle),margin=12;
    for(const factor of [1,.85,.7,.55,.42,.32]){
      const scale=(1+clamp(pull,0,1)*.65)*factor;
      let lo=26+40*scale,hi=length-18-(96-68*clamp(pull,0,1))*scale;
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
  function captureAim(s,target,horse={x:s.x,y:s.y+150}){
    s.aimCaptured=true;s.aimBaseX=s.aimX=s.aimGoalX=target.x;s.aimBaseY=s.aimY=s.aimGoalY=target.y;
    s.aimOriginX=s.grip?.x??horse.x;s.aimOriginY=s.grip?.y??horse.y;
    s.aimAngle=Math.atan2(target.x-s.aimOriginX,s.aimOriginY-target.y);s.aimRadius=Math.max(64,Math.hypot(target.x-s.aimOriginX,target.y-s.aimOriginY));
  }
  function fitGrip(grip,angle,scale,width,height,span){
    if(!grip||![grip.x,grip.y,angle,scale,width,height,span].every(Number.isFinite))return null;
    const margin=12,top=Math.min(64,height*.15),c=Math.cos(angle),s=Math.sin(angle);
    if(grip.x<margin||grip.x>width-margin||grip.y<top||grip.y>height-margin)return null;
    for(const x of [-span-8,span+8])for(const y of [-16,120]){
      const dx=x*c-y*s,dy=x*s+y*c;
      if(dx>0)scale=Math.min(scale,(width-margin-grip.x)/dx);else if(dx<0)scale=Math.min(scale,(margin-grip.x)/dx);
      if(dy>0)scale=Math.min(scale,(height-margin-grip.y)/dy);else if(dy<0)scale=Math.min(scale,(top-grip.y)/dy);
    }
    return scale<.25?null:{x:grip.x-Math.sin(angle)*24*scale,y:grip.y+Math.cos(angle)*24*scale,angle,scale};
  }
  function pose(s,dt=0){
    if(!s.grip)return null;
    const x=s.aimCaptured?s.aimX:s.x,y=s.aimCaptured?s.aimY:s.y,goal=Math.atan2(x-s.grip.x,s.grip.y-y);
    const full=fitGrip(s.grip,goal,1.65,s.width,s.height,s.span),wanted=full?fitGrip(s.grip,goal,full.scale*(1+clamp(s.pull,0,1)*.65)/1.65,s.width,s.height,s.span):null;if(!wanted){s.pose=null;return null;}
    if(!s.pose)s.pose=wanted;else{
      const k=1-Math.exp(-16*Math.max(0,dt)),angle=s.pose.angle+Math.atan2(Math.sin(goal-s.pose.angle),Math.cos(goal-s.pose.angle))*k;
      const scale=s.pose.scale+(wanted.scale-s.pose.scale)*k;
      s.pose=fitGrip(s.grip,angle,scale,s.width,s.height,s.span);
    }return s.pose;
  }
  function available(v){return v.distance<=range&&v.distance>=10&&v.ahead>=-1e-6&&v.z>=-1&&v.z<=1&&!v.reserved&&!v.hidden&&v.visible!==false;}
  function fitPose(p,width,height,span){
    if(!p)return null;const top=Math.min(64,height*.15),margin=12,c=Math.cos(p.angle),s=Math.sin(p.angle);
    if(p.x<margin||p.x>width-margin||p.y<top||p.y>height-margin)return null;
    let scale=p.scale;
    for(const x of [-span-8,span+8])for(const y of [-40,96]){
      const dx=x*c-y*s,dy=x*s+y*c;
      if(dx>0)scale=Math.min(scale,(width-margin-p.x)/dx);else if(dx<0)scale=Math.min(scale,(margin-p.x)/dx);
      if(dy>0)scale=Math.min(scale,(height-margin-p.y)/dy);else if(dy<0)scale=Math.min(scale,(top-p.y)/dy);
    }
    if(scale<.25)return null;p.scale=scale;return p;
  }
  function pick(s,targets,previous=s.target){
    let best=null,score=Infinity;
    for(const v of targets){
      if(!available(v))continue;
      const offset=aimOffset(s,v),radius=s.radius+18;if(offset>radius)continue;
      const rank=offset/radius*.8+v.distance/range*.2;
      const sticky=previous?.d===v.d? .12:0;
      if(rank-sticky<score){score=rank-sticky;best=v;}
    }return best;
  }
  function aimOffset(s,v){
    if(!s.steering)return Math.hypot(v.x-s.x,v.y-s.y);
    const dx=s.aimX-s.aimOriginX,dy=s.aimY-s.aimOriginY,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
    const x=v.x-s.aimOriginX,y=v.y-s.aimOriginY,along=x*ux+y*uy;
    return along>8?Math.abs(x*uy-y*ux)*s.aimRadius/Math.max(64,along):Infinity;
  }
  function lock(s,targets,dt=0){
    const held=(s.target&&targets.find(v=>v.d===s.target.d&&available(v)&&(!s.steering||aimOffset(s,v)<=s.radius+36)))||null;
    if(!s.steering){s.retarget=null;s.retargetT=0;const chosen=held||pick(s,targets);if(chosen)captureAim(s,chosen);return chosen;}
    const next=pick(s,targets,null);
    // A closer neighbour must win by a clear margin for 65ms; small jitter cannot chatter locks.
    const margin=held&&next?clamp(Math.hypot(held.x-next.x,held.y-next.y)*.28,6,20):20;
    if(!next||next.d===held?.d||held&&aimOffset(s,held)<aimOffset(s,next)+margin){s.retarget=null;s.retargetT=0;return held||next;}
    if(s.retarget!==next.d){s.retarget=next.d;s.retargetT=0;}
    s.retargetT+=Math.max(0,dt);if(s.retargetT<.065)return held;
    s.retarget=null;s.retargetT=0;return next;
  }
  function advance(s,dt){const follow=1-Math.exp(-18*Math.max(0,dt));s.aimX+=(s.aimGoalX-s.aimX)*follow;s.aimY+=(s.aimGoalY-s.aimY)*follow;s.cooldown=Math.max(0,s.cooldown-dt);s.recoil=Math.max(0,s.recoil-dt*5.5);s.flash=Math.max(0,s.flash-dt);}
  globalThis.WindArchery=Object.freeze({create,begin,move,end,cancel,pick,lock,layout,fitGrip,pose,fitPose,advance,range,cooldown,minPull});
})();
