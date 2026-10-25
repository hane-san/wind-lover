import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/sweeper.js');await import('../world/missiles.js');const W=globalThis.WindSweeper,M=globalThis.WindMissiles;
test('the interceptor crosses widely, then offers one readable windup and one frozen dive',()=>{
 const s=W.create(-1);let min=Infinity,max=-Infinity;
 for(let i=0;i<100;i++){W.advance(s,.025,{permit:false});const p=W.cross(s);min=Math.min(min,p.side);max=Math.max(max,p.side);}assert.ok(max-min>150);assert.equal(s.phase,'cross');
 W.advance(s,.025,{permit:true});assert.equal(s.event,'lock');assert.equal(s.phase,'windup');
 const start={x:380,y:90,z:0},target={x:85,y:.45,z:0};W.lock(s,start,target,{x:1,z:0});target.z=99;
 const before=JSON.stringify(s);W.advance(s,0,{permit:true});assert.equal(JSON.stringify(s),before);
 W.advance(s,W.windup-.01);assert.equal(s.phase,'windup');W.advance(s,.02);assert.equal(s.phase,'dive');assert.equal(s.tz,0);
 W.advance(s,W.flight);assert.equal(s.phase,'climb');W.advance(s,W.escape);assert.equal(s.phase,'gone');
});
test('straight riding is hit once and a timed sidestep avoids the dive at 20/60/120Hz',()=>{
 for(const fps of [20,60,120])for(const dodge of [false,true]){
  const s=W.create(),dt=1/fps;Object.assign(s,{phase:'windup'});W.lock(s,{x:380,y:90,z:0},{x:34*(W.windup+W.flight),y:.45,z:0},{x:1,z:0});
  let x=0,z=0,p=W.position(s),hits=0;for(let i=0;i<fps*4;i++){
   const old={...p},px=x,pz=z,was=s.phase==='dive';x+=34*dt;if(dodge&&i>=fps*.9&&i<fps*1.5)z+=8.6*dt;
   W.advance(s,dt);p=W.position(s);
   if((was||s.phase==='dive')&&!s.hit&&M.swept(old.x-px,old.y-.45,old.z-pz,p.x-x,p.y-.45,p.z-z)<W.radius**2){s.hit=true;hits++;}
  }assert.equal(hits,dodge?0:1,JSON.stringify({fps,dodge,hits}));
 }
});
test('aborting a dive climbs from its current point and never follows a later target',()=>{
 const s=W.create();Object.assign(s,{phase:'dive',age:.7});W.lock(s,{x:200,y:70,z:10},{x:50,y:1,z:0},{x:1,z:0});const p=W.position(s);W.abortDive(s,p);assert.equal(s.phase,'climb');assert.deepEqual(W.position(s),p);W.advance(s,.5);const after=W.position(s);assert.ok(after.y>p.y+20);assert.equal(s.tx,50);
});
