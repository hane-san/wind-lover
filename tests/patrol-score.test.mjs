import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/patrol-score.js');const score=globalThis.WindPatrolScore;
test('small patrols use distinct sky heights and retain aerial alternatives to unsafe ground sites',()=>{
 for(let cycle=0;cycle<12;cycle++){
  const p=score.plan(cycle);assert.ok(p.total>=5&&p.total<=6);assert.equal(p.sky+(p.sentry?1:0),p.total);
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
test('bounded salvos leave a bow answer and alternate their open side',()=>{
 assert.equal(score.mayLaunch({ahead:450,salvos:0}),true);assert.equal(score.mayLaunch({ahead:320,salvos:1}),true);
 for(const ahead of [210,520])assert.equal(score.mayLaunch({ahead,salvos:0}),false);
 assert.equal(score.mayLaunch({ahead:400,salvos:3}),false);assert.equal(score.gap(0),-score.gap(1));
 assert.ok(score.salvoGap+score.cueTime>1.8);assert.equal(score.tailFade(12),0);
});

test('cruise paths weave without changing their frozen endpoint across frame rates',()=>{
 for(const fps of [20,60,120])for(const flight of [2.7,3.5,4.2]){
  let y=0,x=0,t=0;const a={},b={};let high=0,wide=0;
  while(t<flight-1e-8){const dt=Math.min(1/fps,flight-t);score.cruise(t,flight,36,12,a);score.cruise(t+dt,flight,36,12,b);y+=b.y-a.y;x+=b.side-a.side;t+=dt;high=Math.max(high,y);wide=Math.max(wide,Math.abs(x));}
  assert.ok(Math.abs(x)<1e-8&&Math.abs(y)<1e-8);assert.ok(high>35&&wide>5);
 }
 const p=score.plan(1);assert.ok(p.slots.some(s=>p.altitude+s.height<40));assert.ok(p.slots.some(s=>p.altitude+s.height>150));
});

test('regional patrols adapt to the skyline without increasing the number or changing frozen trajectories',()=>{
 for(const region of ['canyon','mountain','lake','city'])for(const aspect of [.46,2.16]){
  const p=score.plan(3,true,aspect,region),base=score.plan(3,true,aspect);
  assert.equal(p.total,base.total);assert.equal(p.sentry,base.sentry);assert.deepEqual(p.slots.map(x=>x.depth),base.slots.map(x=>x.depth));
  assert.ok(p.slots.every(x=>Number.isFinite(x.height+x.side)&&Math.abs(x.side)<=60));assert.ok(p.altitude+p.slots[0].height>10);
 }
 assert.ok(score.plan(0,true,.5,'canyon').altitude<score.plan(0).altitude);
});
