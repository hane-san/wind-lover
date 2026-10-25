import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/horse-archery.js');const A=globalThis.WindArchery;
test('a touch below the saddle remains a rein gesture; an upper draw releases once',()=>{
 const s=A.create(),horse={x:195,y:590};assert.equal(A.begin(s,1,180,700,horse,390,844),false);
 assert.equal(A.begin(s,2,170,350,horse,390,844),true);assert.ok(s.radius>100);
 A.move(s,3,195,490,horse);assert.equal(s.pull,0);A.move(s,2,195,530,horse);assert.equal(s.pull,1);
 assert.equal(A.end(s,2),true);assert.equal(A.end(s,2),false);assert.equal(s.shots,1);
 A.begin(s,3,170,350,horse,390,844);A.move(s,3,195,530,horse);assert.equal(A.end(s,3),false);A.advance(s,.25);
 A.begin(s,4,170,350,horse,390,844);A.move(s,4,195,530,horse);assert.equal(A.end(s,4,true),false);assert.equal(s.shots,1);
});
test('taps, shallow sideways strokes and steep upward drags cannot loose arrows',()=>{
 for(const delta of [[0,0],[35,0],[-35,0],[0,-90],[80,-40],[-80,-40]]){const s=A.create(),horse={x:195,y:590};A.begin(s,1,195,350,horse,390,844);A.move(s,1,195+delta[0],350+delta[1],horse);assert.equal(A.end(s,1),false);}
});
test('left, right and slightly upward sideways draws retain the full committed stroke',()=>{
 for(const [w,h]of [[320,568],[390,844],[844,390]])for(const x of [w*.12,w*.5,w*.88])for(const degrees of [-10,0,30,90])for(const side of [-1,1]){
  const s=A.create(),horse={x:w*.5,y:h*.8},y=h*.3,angle=degrees*Math.PI/180;
  A.begin(s,1,x,y,horse,w,h);const minimum=3+A.minPull*(s.drawLength-3);
  A.move(s,1,x+side*Math.cos(angle)*(minimum-.1),y+Math.sin(angle)*(minimum-.1),horse);assert.ok(s.pull<A.minPull);
  A.move(s,1,x+side*Math.cos(angle)*(minimum+.1),y+Math.sin(angle)*(minimum+.1),horse);assert.equal(A.end(s,1),true);
 }
});
test('directional forgiveness eases away smoothly and follows displacement rather than path length',()=>{
 const s=A.create(),horse={x:195,y:590};A.begin(s,1,195,350,horse,390,844);
 const pulls=[];for(const degrees of [-10,-12,-14,-16,-18,-20,-22]){const a=degrees*Math.PI/180;A.move(s,1,195+80*Math.cos(a),350+80*Math.sin(a),horse);pulls.push(s.pull);}
 assert.ok(Math.abs(pulls[0]-(80-3)/(s.drawLength-3))<1e-10);assert.equal(pulls.at(-1),0);for(let i=1;i<pulls.length;i++)assert.ok(pulls[i]<=pulls[i-1]);
 for(let i=0;i<10;i++){A.move(s,1,275,350,horse);A.move(s,1,195,350,horse);}assert.equal(s.pull,0);assert.equal(A.end(s,1),false);
});
test('generous screen-space locks exclude hidden, reserved, distant and rear targets',()=>{
 const s=A.create();s.x=195;s.y=350;const d={};const good={d,x:265,y:385,distance:290,ahead:1,z:.9};
 for(const invalid of [{distance:500},{ahead:-1},{ahead:-.01},{reserved:true},{hidden:true},{visible:false},{z:1.1},{x:500}])assert.equal(A.pick(s,[{...good,...invalid}]),null);
 assert.equal(A.pick(s,[good]),good);const slightlyWorse={...good,d:{},x:270};s.target=slightlyWorse;assert.equal(A.pick(s,[good,slightlyWorse]),slightlyWorse);
 A.cancel(s);assert.equal(s.target,null);assert.equal(s.id,null);
});
test('a visible lock survives from the forward quarter to directly alongside, but not behind',()=>{
 const s=A.create(),d={},v={d,x:195,y:350,distance:35,ahead:1,z:.8};s.x=195;s.y=350;
 s.target=A.lock(s,[v]);for(const ahead of [.2,.05,.001,0]){const next={...v,ahead};s.target=A.lock(s,[next]);assert.equal(s.target,next);}
 assert.equal(A.lock(s,[{...v,ahead:-.01}]),null);
});
test('a committed draw is required across phone sizes, but reaching it needs no holding timer',()=>{
 for(const [width,height]of [[390,844],[320,568],[844,390]]){
  const horse={x:width/2,y:height*.8},s=A.create(),x=horse.x,y=height*.3;
  A.begin(s,1,x,y,horse,width,height);A.move(s,1,x,y+s.drawLength*.65,horse);assert.equal(A.end(s,1),false);assert.equal(s.shots,0);assert.equal(s.cooldown,0);
  A.begin(s,2,x,y,horse,width,height);const distance=s.drawLength*(A.minPull+.02);A.move(s,2,x,y+distance,horse);
  assert.equal(A.end(s,2),true);assert.ok(s.releasePull>=A.minPull);assert.ok(distance>=100&&distance<=140);
 }
});
test('a tapped drone stays selected through the draw until it becomes unavailable',()=>{
 const s=A.create(),d={},other={},v={d,x:220,y:350,distance:270,ahead:1,z:.9};s.x=195;s.y=350;
 s.target=A.lock(s,[v]);assert.equal(s.target.d,d);
 const moved={...v,x:350},nearby={...v,d:other,x:196};s.target=A.lock(s,[moved,nearby]);assert.equal(s.target,moved);
 assert.equal(A.lock(s,[{...moved,reserved:true},nearby]),nearby);
 assert.equal(A.lock(s,[{...moved,hidden:true}]),null);
 A.cancel(s);assert.equal(s.recoil,0);assert.equal(s.releasePull,0);
});
test('bow layouts stay between saddle and lock, inside the screen, or yield to the physical bow',()=>{
 let shown=0,hidden=0;
 for(const [w,h]of [[320,568],[390,844],[844,390],[768,1024]])for(const horse of [{x:w*.5,y:h*.82},{x:w*.2,y:h*.5},{x:w*.8,y:h*.88}])for(let ix=0;ix<=10;ix++)for(let iy=0;iy<=10;iy++)for(const pull of [0,.5,1]){
  const target={x:w*ix/10,y:h*iy/10},span=Math.min(96,Math.max(70,Math.min(w,h)*.23)),q=A.layout(target,horse,w,h,span,pull);
  if(!q){hidden++;continue;}shown++;const dx=horse.x-target.x,dy=horse.y-target.y,length=Math.hypot(dx,dy);
  assert.ok(Math.abs((q.x-target.x)*dy-(q.y-target.y)*dx)<1e-6);assert.ok(q.distance>0&&q.distance<length);
  const c=Math.cos(q.angle),s=Math.sin(q.angle);
  for(const x of [-span-8,span+8])for(const y of [-40,96]){const px=q.x+(x*c-y*s)*q.scale,py=q.y+(x*s+y*c)*q.scale;assert.ok(px>=11.999&&px<=w-11.999&&py>=11.999&&py<=h-11.999);}
 }
 assert.ok(shown>1000&&hidden>10);assert.equal(A.layout({x:1,y:1},{x:1,y:1},390,844,70),null);assert.equal(A.layout({x:NaN,y:1},{x:100,y:700},390,844,70),null);
});
test('camera and saddle motion do not change the resistance of an existing draw',()=>{
 const s=A.create();A.begin(s,1,170,350,{x:195,y:590},390,844);
 A.move(s,1,190,415,{x:195,y:590});const pull=s.pull;
 A.move(s,1,190,415,{x:70,y:750});assert.equal(s.pull,pull);
 A.move(s,1,190,415,{x:320,y:410});assert.equal(s.pull,pull);
});
test('a follow-up draw can prepare during recovery and fires as soon as it recovers',()=>{
 const s=A.create(),horse={x:195,y:590};
 A.begin(s,1,195,350,horse,390,844);A.move(s,1,195,530,horse);assert.equal(A.end(s,1),true);
 A.begin(s,2,195,350,horse,390,844);A.move(s,2,195,530,horse);A.advance(s,A.cooldown/2);assert.equal(s.shots,1);A.advance(s,A.cooldown/2+.001);assert.equal(A.end(s,2),true);assert.equal(s.shots,2);
});

test('a drawn bow may reach the bottom, steer to a neighbour after hysteresis and let down',()=>{
 const s=A.create(),horse={x:195,y:590},a={d:{},x:130,y:280,distance:220,ahead:1,z:.8},b={...a,d:{},x:270};
 A.begin(s,1,130,280,horse,390,844);s.target=A.lock(s,[a,b]);A.move(s,1,130,820,horse);assert.equal(s.pull,1);assert.equal(s.drawn,true);
 for(const x of [134,127,140,130]){A.move(s,1,x,820,horse);A.advance(s,.05);s.target=A.lock(s,[a,b],.05);assert.equal(s.target,a);}
 const turn=s.aimAngle-Math.atan2(b.x-s.aimOriginX,s.aimOriginY-b.y),angle=s.drawAngle+turn+Math.sign(turn)*.025;
 A.move(s,1,s.controlX+Math.tan(angle)*(820-s.controlY),820,horse);const before=s.aimX;A.advance(s,0);assert.equal(s.aimX,before);
 A.advance(s,.15);s.target=A.lock(s,[a,b],.04);assert.equal(s.target,null);s.target=A.lock(s,[a,b],.04);assert.equal(s.target,b);assert.ok(s.pull>=A.minPull);
 A.move(s,1,130,280,horse);assert.equal(s.pull,0);assert.equal(A.end(s,1),false);
});
test('steering excludes hidden neighbours and cancellation resets its complete state',()=>{
 const s=A.create(),horse={x:195,y:590},a={d:{},x:130,y:280,distance:220,ahead:1,z:.8},b={...a,d:{},x:270,hidden:true};
 A.begin(s,1,130,280,horse,390,844);s.target=A.lock(s,[a,b]);A.move(s,1,130,460,horse);A.move(s,1,10,460,horse);A.advance(s,.2);
 s.target=A.lock(s,[a,b],.2);assert.equal(s.target,null);A.cancel(s);assert.equal(s.steering,false);assert.equal(s.drawn,false);assert.equal(s.pose,null);assert.equal(A.end(s,1),false);
});

test('smoothed bow poses remain inside every padded viewport during a turn',()=>{
 for(const [w,h]of [[320,568],[390,844],[844,390]])for(let i=0;i<500;i++){
  const span=90,p={x:12+(w-24)*(i%31)/30,y:64+(h-76)*(i%23)/22,angle:i*.17,scale:1.65};
  const fit=A.fitPose(p,w,h,span);if(!fit)continue;const c=Math.cos(fit.angle),s=Math.sin(fit.angle);
  for(const x of [-span-8,span+8])for(const y of [-40,96]){const px=fit.x+(x*c-y*s)*fit.scale,py=fit.y+(x*s+y*c)*fit.scale;assert.ok(px>=11.999&&px<=w-11.999&&py>=Math.min(64,h*.15)-.001&&py<=h-11.999);}
 }
});

test('an upper-right to lower-left draw aims upper-left when the hand moves right',()=>{
 for(const [width,height]of [[390,844],[844,390],[320,568]]){
  const s=A.create(),horse={x:width*.5,y:height*.75},right={d:{},x:width*.72,y:height*.25,distance:230,ahead:1,z:.8},left={...right,d:{},x:width*.28};
  A.begin(s,1,right.x,right.y,horse,width,height);s.target=A.lock(s,[right,left]);
  A.move(s,1,width*.18,height*.94,horse);assert.equal(s.target,right);assert.ok(s.pull>=A.minPull);
  const initial=A.layout(right,horse,width,height,s.span,1);assert.ok(Math.sin(initial.angle)>0);
  const desired=Math.atan2(left.x-s.aimOriginX,s.aimOriginY-left.y),turn=s.aimAngle-desired,dy=height*.94-s.controlY;
  let angle=s.drawAngle+turn;for(let i=0;i<8;i++)angle=s.drawAngle+turn+Math.sign(turn)*.025;
  A.move(s,1,s.controlX+Math.tan(angle)*dy,height*.94,horse);assert.ok(s.aimGoalX<s.grip.x);assert.ok(s.aimGoalY<s.grip.y);
  for(let i=0;i<30;i++){A.advance(s,1/120);s.target=A.lock(s,[right,left],1/120);}
  assert.equal(s.target,left);const aimed=A.layout({x:s.aimX,y:s.aimY},horse,width,height,s.span,1);assert.ok(Math.sin(aimed.angle)<0);
  assert.equal(A.end(s,1),true);
 }
});
test('lengthening a diagonal draw keeps its aim, then a lateral angle change turns oppositely',()=>{
 const s=A.create(),horse={x:195,y:650},target={d:{},x:285,y:250,distance:230,ahead:1,z:.8};A.begin(s,1,285,250,horse,390,844);s.target=target;
 A.move(s,1,225,400,horse);const aim={x:s.aimGoalX,y:s.aimGoalY};
 for(const k of [1.3,1.8,2.4,3]){A.move(s,1,285-60*k,250+150*k,horse);assert.equal(s.steering,false);assert.equal(s.aimGoalX,aim.x);assert.equal(s.aimGoalY,aim.y);}
 A.move(s,1,330,700,horse);assert.equal(s.steering,true);assert.ok(s.aimGoalX<horse.x);assert.ok(s.pull>=A.minPull);
});
test('a steered ray can acquire a target higher along the same direction without radial cursor bias',()=>{
 const s=A.create(),horse={x:195,y:650},right={d:{},x:270,y:350,distance:220,ahead:1,z:.8},left={...right,d:{},x:115,y:200};
 A.begin(s,1,270,350,horse,390,844);s.target=right;A.move(s,1,195,500,horse);A.move(s,1,330,800,horse);
 for(let i=0;i<30;i++){A.advance(s,1/120);s.target=A.lock(s,[right,left],1/120);}assert.equal(s.target,left);
});

test('lengthening an already steered ray keeps the same aim and resists camera movement',()=>{
 const s=A.create(),horse={x:195,y:650};A.begin(s,1,285,250,horse,390,844);A.move(s,1,225,400,horse);A.move(s,1,305,500,horse);
 assert.equal(s.steering,true);const aim={x:s.aimGoalX,y:s.aimGoalY},dx=s.x+s.dx-s.controlX,dy=s.y+s.dy-s.controlY;
 for(const k of [1.3,1.8,2.3]){A.move(s,1,s.controlX+dx*k,s.controlY+dy*k,{x:100,y:750});assert.ok(Math.abs(s.aimGoalX-aim.x)<1e-8&&Math.abs(s.aimGoalY-aim.y)<1e-8);}
});

test('the visible grip stays fixed through tension, aiming, target motion and fit changes',()=>{
 for(const [w,h]of [[320,568],[390,844],[844,390]]){
  const s=A.create(),horse={x:w*.5,y:h*.8};A.begin(s,1,w*.62,h*.28,horse,w,h);s.target={d:{},x:w*.62,y:h*.28,distance:230,ahead:1,z:.8};A.lock(s,[s.target]);const anchor={...s.grip};
  let shown=0;for(let i=0;i<90;i++){s.pull=Math.min(1,i/25);s.aimX=w*(.12+.76*i/89);s.aimY=h*.25;const p=A.pose(s,1/60);if(!p)continue;shown++;
   assert.ok(Math.abs(p.x+Math.sin(p.angle)*24*p.scale-anchor.x)<1e-8);assert.ok(Math.abs(p.y-Math.cos(p.angle)*24*p.scale-anchor.y)<1e-8);
  }assert.ok(shown>40);
 }
});
test('longer pulls rebase steering before the sweep, keeping the same usable hand range',()=>{
 const s=A.create(),horse={x:195,y:650};A.begin(s,1,285,250,horse,390,844);s.target={d:{},x:285,y:250,distance:230,ahead:1,z:.8};A.lock(s,[s.target]);A.move(s,1,225,400,horse);
 A.move(s,1,105,700,horse);assert.equal(s.steering,false);assert.ok(Math.abs(Math.hypot(105-s.controlX,700-s.controlY)-s.drawLength)<1e-8);
 A.move(s,1,330,700,horse);assert.equal(s.steering,true);assert.ok(s.aimGoalX<s.grip.x);
});
test('a moving locked enemy rotates the bow about its grip; deliberate off-ray aiming lets go',()=>{
 const s=A.create(),horse={x:195,y:650},a={d:{},x:240,y:260,distance:230,ahead:1,z:.8};A.begin(s,1,a.x,a.y,horse,390,844);s.target=A.lock(s,[a]);const grip={...s.grip};
 const moved={...a,x:280,y:220};s.target=A.lock(s,[moved]);assert.equal(s.aimGoalX,280);assert.deepEqual(s.grip,grip);
 A.move(s,1,195,500,horse);s.steering=true;s.aimX=16;s.aimY=grip.y-5;assert.equal(A.lock(s,[moved]),null);
});
test('every fitted grip pose keeps the complete rotated bow inside the padded viewport',()=>{
 for(const [w,h]of [[320,568],[390,844],[844,390]])for(const x of [w*.2,w*.5,w*.8])for(const y of [h*.35,h*.6,h*.8])for(let i=0;i<32;i++){
  const grip={x,y},p=A.fitGrip(grip,i*Math.PI/16,1.65,w,h,96);if(!p)continue;const c=Math.cos(p.angle),s=Math.sin(p.angle);
  for(const X of [-104,104])for(const Y of [-40,96]){const px=p.x+(X*c-Y*s)*p.scale,py=p.y+(X*s+Y*c)*p.scale;assert.ok(px>=11.999&&px<=w-11.999&&py>=Math.min(64,h*.15)-.001&&py<=h-11.999);}
 }
});

test('a direct touch on a distant silhouette beats a closer neighbouring enemy',()=>{
 const s=A.create();s.x=195;s.y=250;
 const tapped={d:{},x:195,y:250,distance:410,ahead:1,z:.9},near={...tapped,d:{},x:215,y:250,distance:40};
 assert.equal(A.pick(s,[near,tapped]),tapped);assert.equal(A.pick(s,[{...tapped,hidden:true},near]),near);
});
test('a displayed lock is validated at release without acquiring an unseen replacement',()=>{
 const s=A.create(),a={d:{},x:195,y:250,distance:220,ahead:1,z:.8},b={...a,d:{},x:200};s.target=a;
 assert.equal(A.releaseTarget(s,[{...a,x:220},b]).d,a.d);
 for(const invalid of [{hidden:true},{reserved:true},{ahead:-.01},{distance:421},{visible:false}])assert.equal(A.releaseTarget(s,[{...a,...invalid},b]),null);
 assert.equal(A.releaseTarget(s,[b]),null);s.target=null;assert.equal(A.releaseTarget(s,[b]),null);
});
test('one aiming filter reaches the new direction promptly and the graphic shares that ray',()=>{
 for(const fps of [20,60,120]){
  const s=A.create(),horse={x:195,y:650};A.begin(s,1,290,250,horse,390,844);s.target=A.lock(s,[{d:{},x:290,y:250,distance:230,ahead:1,z:.8}]);A.move(s,1,190,800,horse);A.pose(s,0);
  s.steering=true;s.aimGoalX=95;s.aimGoalY=250;const start=s.aimX;
  for(let i=0;i<fps*.1;i++){A.advance(s,1/fps);const p=A.pose(s,1/fps),ray=Math.atan2(s.aimX-s.grip.x,s.grip.y-s.aimY);assert.ok(Math.abs(p.angle-ray)<1e-9);}
  assert.ok(Math.abs(s.aimX-95)/Math.abs(start-95)<.042);
 }
});
test('a moving assisted target uses the same filter instead of snapping the bow',()=>{
 const s=A.create(),horse={x:195,y:650},a={d:{},x:240,y:250,distance:230,ahead:1,z:.8};A.begin(s,1,a.x,a.y,horse,390,844);s.target=A.lock(s,[a]);const old=s.aimX;
 s.target=A.lock(s,[{...a,x:290}]);assert.equal(s.aimX,old);A.advance(s,1/60);assert.ok(s.aimX>old&&s.aimX<290);
});
test('the steering onset is gradual and does not turn small hand jitter into a jump',()=>{
 const s=A.create(),horse={x:195,y:650};A.begin(s,1,195,250,horse,390,844);A.move(s,1,195,750,horse);const angles=[];
 for(let x=195;x<=235;x++){A.move(s,1,x,750,horse);angles.push(Math.atan2(s.aimGoalX-s.grip.x,s.grip.y-s.aimGoalY));}
 for(let i=1;i<angles.length;i++)assert.ok(Math.abs(angles[i]-angles[i-1])<.012);
 assert.ok(angles.at(-1)<-.12);
});
test('manual assistance distinguishes a close ray from a tempting off-angle foe',()=>{
 const s=A.create();Object.assign(s,{steering:true,aimOriginX:195,aimOriginY:600,aimRadius:300,aimX:195,aimY:300});
 const at=angle=>({d:{},x:195+Math.sin(angle)*300,y:600-Math.cos(angle)*300,distance:220,ahead:1,z:.8});
 const aligned=at(.1),stray=at(.4);assert.equal(A.pick(s,[stray]),null);assert.equal(A.pick(s,[stray,aligned]),aligned);
 s.target=stray;assert.equal(A.releaseTarget(s,[stray]),null);s.target=aligned;assert.equal(A.releaseTarget(s,[aligned]),aligned);
});
test('a low forward target keeps its angle when steering begins instead of hitting a sky-only clamp',()=>{
 const s=A.create(),horse={x:422,y:360},a={d:{},x:620,y:345,distance:45,ahead:.1,z:.8};A.begin(s,1,a.x,a.y,horse,844,390);s.target=A.lock(s,[a]);A.move(s,1,450,370,horse);
 const before=Math.atan2(s.aimX-s.grip.x,s.grip.y-s.aimY);assert.ok(before>1.6);
 A.move(s,1,480,385,horse);assert.equal(s.steering,true);const after=Math.atan2(s.aimGoalX-s.grip.x,s.grip.y-s.aimGoalY);assert.ok(after>1.3&&Math.abs(after-before)<.4);
});
