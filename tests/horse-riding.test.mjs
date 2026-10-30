import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/horse-riding.js');
await import('../world/horse-gait.js');
const riding=globalThis.WindHorseRiding,gait=globalThis.WindHorseGait;
test('free reins yield in the middle, support a short dodge at the verge and allow a deliberate exit',()=>{
  const centre=riding.guidance({steer:.75,held:.7,offset:2,half:28,outward:.2});
  const idle=riding.guidance({offset:2,half:28}),edge=riding.guidance({steer:.75,held:.7,offset:27.4,half:28,outward:.2});
  assert.ok(centre.gain<idle.gain*.2);assert.equal(centre.lateral,1);assert.ok(edge.gain>centre.gain*4);assert.ok(edge.lateral<.2);
  const exit=riding.guidance({steer:.95,held:2.6,offset:27.4,half:28,outward:.2});assert.equal(exit.lateral,1);assert.ok(exit.gain<.2);
  assert.equal(riding.guidance({braking:true}).gain,0);assert.ok(riding.headingWeight(.8)>.3);assert.ok(riding.headingWeight(.2)<.1);
});
test('rein reversals answer quickly and reserve one gathered lead change across frame rates',()=>{
  const results=[];
  for(const fps of [20,30,60,120]){
    const s=riding.create(),advance=steer=>riding.advance(s,1/fps,{steer,speed:60,grounded:true,onRoad:true});
    for(let i=0;i<fps*.5;i++)advance(1);
    let launchTime=null,zeroTime=null,launches=0;
    for(let i=0;i<fps*.5;i++){advance(-1);if(zeroTime===null&&s.lateral<0)zeroTime=i/fps;if(s.launch){launches++;launchTime=i/fps;}}
    assert.equal(launches,1);assert.ok(launchTime<.11);assert.ok(zeroTime<.08);assert.equal(s.lead,-1);
    for(let i=0;i<fps;i++)advance(0);
    assert.ok(Math.abs(s.lateral)<.001);results.push({fps,launchTime,zeroTime});
  }
  assert.ok(Math.max(...results.map(r=>r.launchTime))-Math.min(...results.map(r=>r.launchTime))<.05);
});
test('jitter, unsafe verges, air and inactive play cannot start a bound',()=>{
  for(const reason of ['jitter','verge','air','inactive']){
    const s=riding.create();let launches=0;
    for(let i=0;i<240;i++){
      riding.advance(s,1/120,{steer:reason==='jitter'?(i%2?1:-1):i<60?1:-1,speed:60,
        grounded:reason!=='air',onRoad:true,active:reason!=='inactive',canHop:reason!=='verge'});
      if(s.launch)launches++;
    }assert.equal(launches,0,reason);
  }
});
test('airborne legs gather and both leads keep finite articulated solutions',()=>{
  for(const lead of [-1,1])for(const vertical of [-8,0,8]){
    const s=riding.create();s.flight=.2;s.lead=lead;const action=riding.pose(s,false,vertical);
    for(let leg=0;leg<4;leg++){
      const f=gait.foot(.4,leg,.8,1,action,lead),angles=gait.solve(leg>=2,f.y,f.z,action.heave,action.pitch);
      assert.ok(!f.stance&&f.y>.25);assert.ok(Object.values(angles).every(Number.isFinite));
    }
  }
});
