import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/travel-camera.js');
const camera=globalThis.WindTravelCamera;
test('rear follow dominates, with a slow bounded rear-quarter glance and return',()=>{
  const s=camera.create(),input={speed:65},samples=[];
  for(let i=0;i<76*60;i++){camera.advance(s,1/60,input);samples.push({...s});}
  assert.ok(samples.slice(0,12*60).every(s=>Math.abs(s.side)<.001));
  assert.ok(Math.max(...samples.map(s=>s.side))>1.8);
  assert.ok(Math.min(...samples.map(s=>s.side))<-1.8);
  assert.ok(samples.every(s=>Math.abs(s.side)<2.3&&s.pull<1.7&&s.rise<.3));
  assert.ok(samples.filter(s=>Math.abs(s.side)<.35).length/samples.length>.65);
  for(let i=1;i<samples.length;i++)assert.ok(Math.abs(samples[i].side-samples[i-1].side)<.025,'Camera makes a sudden sideways move');
});
test('steering, danger, pause and resets preserve a readable forward view',()=>{
  for(const interrupt of [{steer:1},{yawRate:.3},{blocked:true},{speed:0}]){
    const s=camera.create();for(let i=0;i<21*60;i++)camera.advance(s,1/60,{speed:65});assert.ok(s.side>1.5);
    const before={...s};camera.advance(s,0,{speed:65});assert.deepEqual(s,before);
    for(let i=0;i<60;i++)camera.advance(s,1/60,{speed:65,...interrupt});
    assert.ok(Math.abs(s.side)<.03&&s.pull<.03);assert.equal(s.clock,0);
    camera.reset(s);assert.deepEqual(s,camera.create());
  }
});
test('frame rates preserve the slow composition without affecting any travel input',()=>{
 const positions=[];for(const fps of [20,30,60,120]){const input=Object.freeze({speed:65,steer:0,yawRate:0}),s=camera.create();for(let i=0;i<fps*20;i++)camera.advance(s,1/fps,input);positions.push(s.side);assert.equal(input.speed,65);}
 assert.ok(Math.max(...positions)-Math.min(...positions)<.025);
});
test('combat recentres and widens the forward view, and a bend preview stays bounded',()=>{
 const s=camera.create();for(let i=0;i<21*60;i++)camera.advance(s,1/60,{speed:65});
 for(let i=0;i<120;i++)camera.advance(s,1/60,{speed:65,threat:1,bend:.8});
 assert.ok(s.focus>.99&&Math.abs(s.side)<.01&&s.pull>1.3&&s.pull<1.5&&s.bend<=.20);
});
test('camera boom stops in front of walls and lintels, including rotated boxes',()=>{
 const target={x:0,y:3,z:0},eye={x:0,y:6,z:-18};
 const wall={x:0,z:-9,c:1,s:0,hw:5,hd:1,bottom:0,top:12};
 const t=camera.boomFraction(target,eye,[wall]);assert.ok(t>.3&&t<.5);
 assert.equal(camera.boomFraction(target,eye,[{...wall,x:40}]),1);
 assert.equal(camera.boomFraction(target,eye,[{...wall,bottom:8}]),1);
 assert.ok(camera.boomFraction(target,eye,[{...wall,c:Math.SQRT1_2,s:Math.SQRT1_2}])<.6);
});
