import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/patrol-score.js');const score=globalThis.WindPatrolScore;
test('small patrols use distinct sky heights and retain aerial alternatives to unsafe ground sites',()=>{
 for(let cycle=0;cycle<12;cycle++){
  const p=score.plan(cycle);assert.ok(p.total>=3&&p.total<=4);assert.equal(p.sky+(p.sentry?1:0),p.total);
  assert.equal(p.slots.length,p.sky);assert.ok(new Set(p.slots.map(s=>s.height)).size>=2);
  assert.ok(p.slots.some(s=>s.depth< -50));assert.ok(p.altitude+p.slots[1].height>=85);
  const fallback=score.plan(cycle,false);assert.equal(fallback.sky,p.total);assert.equal(fallback.slots.length,p.total);
 }
});
test('landscape departures keep their sky phrase inside a shorter vertical view',()=>{
 const portrait=score.plan(1,true,.46),landscape=score.plan(1,true,2.16);
 assert.ok(landscape.altitude<portrait.altitude*.65);assert.equal(landscape.total,portrait.total);
 assert.deepEqual(landscape.slots.map(s=>s.depth),portrait.slots.map(s=>s.depth));
 assert.ok(landscape.slots[1].height>=40);assert.ok(score.loft(3,false,1,landscape.skyScale).lift<score.loft(3,false,1).lift);
});
test('lofted missiles land at the same frozen aim at different frame rates',()=>{
 for(const flight of [2.4,3,4])for(const ground of [false,true])for(const fps of [20,60,120]){
  const a=score.loft(flight,ground,1);let y=0,v=a.lift,time=0;
  while(time<flight-1e-8){const dt=Math.min(1/fps,flight-time);y+=v*dt+.5*a.gravity*dt*dt;v+=a.gravity*dt;time+=dt;}
  assert.ok(Math.abs(y)<1e-8);assert.ok(a.lift*flight/2+.5*a.gravity*(flight/2)**2>40);
 }
});
test('paired salvos leave a longer bow answer and alternate their open side',()=>{
 assert.equal(score.mayLaunch({ahead:450,salvos:0}),true);assert.equal(score.mayLaunch({ahead:320,salvos:1}),true);
 for(const ahead of [280,520])assert.equal(score.mayLaunch({ahead,salvos:0}),false);
 assert.equal(score.mayLaunch({ahead:400,salvos:2}),false);assert.equal(score.gap(0),-score.gap(1));
 assert.ok(score.salvoGap+score.cueTime>2);assert.equal(score.tailFade(12),0);
});
