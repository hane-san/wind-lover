import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/horse-archery.js');const A=globalThis.WindArchery;
test('a touch below the saddle remains a rein gesture; an upper draw releases once',()=>{
 const s=A.create(),horse={x:195,y:590};assert.equal(A.begin(s,1,180,700,horse,390,844),false);
 assert.equal(A.begin(s,2,170,350,horse,390,844),true);assert.ok(s.radius>100);
 A.move(s,3,195,490,horse);assert.equal(s.pull,0);A.move(s,2,195,470,horse);assert.equal(s.pull,1);
 assert.equal(A.end(s,2),true);assert.equal(A.end(s,2),false);assert.equal(s.shots,1);
 A.begin(s,3,170,350,horse,390,844);A.move(s,3,195,470,horse);assert.equal(A.end(s,3),false);A.advance(s,.25);
 A.begin(s,4,170,350,horse,390,844);A.move(s,4,195,470,horse);assert.equal(A.end(s,4,true),false);assert.equal(s.shots,1);
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
  assert.equal(A.end(s,2),true);assert.ok(s.releasePull>=A.minPull);assert.ok(distance>=49&&distance<=71);
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
 for(const [w,h]of [[320,568],[390,844],[844,390],[768,1024]])for(const horse of [{x:w*.5,y:h*.82},{x:w*.2,y:h*.5},{x:w*.8,y:h*.88}])for(let ix=0;ix<=10;ix++)for(let iy=0;iy<=10;iy++){
  const target={x:w*ix/10,y:h*iy/10},span=Math.min(78,Math.max(52,Math.min(w,h)*.18)),q=A.layout(target,horse,w,h,span);
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
 A.begin(s,1,195,350,horse,390,844);A.move(s,1,195,450,horse);assert.equal(A.end(s,1),true);
 A.begin(s,2,195,350,horse,390,844);A.move(s,2,195,450,horse);A.advance(s,A.cooldown/2);assert.equal(s.shots,1);A.advance(s,A.cooldown/2+.001);assert.equal(A.end(s,2),true);assert.equal(s.shots,2);
});
