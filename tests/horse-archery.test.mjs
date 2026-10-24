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
test('taps, sideways drags and pulling away from the horse cannot loose arrows',()=>{
 for(const delta of [[0,0],[80,0],[0,-90]]){const s=A.create(),horse={x:195,y:590};A.begin(s,1,195,350,horse,390,844);A.move(s,1,195+delta[0],350+delta[1],horse);assert.equal(A.end(s,1),false);}
});
test('generous screen-space locks exclude hidden, reserved, distant and rear targets',()=>{
 const s=A.create();s.x=195;s.y=350;const d={};const good={d,x:265,y:385,distance:290,ahead:1,z:.9};
 for(const invalid of [{distance:500},{ahead:-1},{reserved:true},{hidden:true},{visible:false},{z:1.1},{x:500}])assert.equal(A.pick(s,[{...good,...invalid}]),null);
 assert.equal(A.pick(s,[good]),good);const slightlyWorse={...good,d:{},x:270};s.target=slightlyWorse;assert.equal(A.pick(s,[good,slightlyWorse]),slightlyWorse);
 A.cancel(s);assert.equal(s.target,null);assert.equal(s.id,null);
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
