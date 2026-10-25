import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/travel-camera.js');
const camera=globalThis.WindTravelCamera;
test('long rides and repeated danger transitions keep the mounted composition centred',()=>{
 const s=camera.create();for(let i=0;i<180*60;i++){
  camera.advance(s,1/60,{speed:40,threat:(i%240)<120?1:0,steer:Math.sin(i*.1),bend:Math.sin(i*.03)});
  assert.equal(s.side,0);assert.equal(s.pull,0);assert.equal(s.rise,0);assert.equal(s.look,0);assert.ok(Math.abs(s.bend)<=.08);
 }const before={...s};camera.advance(s,0,{speed:40});assert.deepEqual(s,before);camera.reset(s);assert.deepEqual(s,camera.create());
});
test('frame rates preserve the slow composition without affecting any travel input',()=>{
 const positions=[];for(const fps of [20,30,60,120]){const input=Object.freeze({speed:65,steer:0,yawRate:0}),s=camera.create();for(let i=0;i<fps*20;i++)camera.advance(s,1/fps,input);positions.push(s.side);assert.equal(input.speed,65);}
 assert.ok(Math.max(...positions)-Math.min(...positions)<.025);
});
test('combat keeps distance and height fixed, and a bend preview stays bounded',()=>{
 const s=camera.create();for(let i=0;i<21*60;i++)camera.advance(s,1/60,{speed:65});
 for(let i=0;i<120;i++)camera.advance(s,1/60,{speed:65,threat:1,bend:.8});
 assert.ok(s.focus>.99&&Math.abs(s.side)<.01&&s.pull===0&&s.rise===0&&s.bend<=.08);
});
test('camera boom stops in front of walls and lintels, including rotated boxes',()=>{
 const target={x:0,y:3,z:0},eye={x:0,y:6,z:-18};
 const wall={x:0,z:-9,c:1,s:0,hw:5,hd:1,bottom:0,top:12};
 const t=camera.boomFraction(target,eye,[wall]);assert.ok(t>.3&&t<.5);
 assert.equal(camera.boomFraction(target,eye,[{...wall,x:40}]),1);
 assert.equal(camera.boomFraction(target,eye,[{...wall,bottom:8}]),1);
 assert.ok(camera.boomFraction(target,eye,[{...wall,c:Math.SQRT1_2,s:Math.SQRT1_2}])<.6);
});
