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
test('generous screen-space locks exclude peaceful, reserved, distant and rear targets',()=>{
 const s=A.create();s.x=195;s.y=350;const d={};const good={d,x:265,y:385,distance:290,ahead:1,z:.9};
 for(const invalid of [{distance:500},{ahead:-1},{reserved:true},{hidden:true},{z:1.1},{x:500}])assert.equal(A.pick(s,[{...good,...invalid}]),null);
 assert.equal(A.pick(s,[good]),good);const slightlyWorse={...good,d:{},x:270};s.target=slightlyWorse;assert.equal(A.pick(s,[good,slightlyWorse]),slightlyWorse);
 A.cancel(s);assert.equal(s.target,null);assert.equal(s.id,null);
});
