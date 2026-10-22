import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/horse-gait.js');
const g=globalThis.WindHorseGait;
test('broad strides cap cadence, and simulation frame rates preserve the rhythm',()=>{
  assert.ok(g.cadence(40)>1&&g.cadence(40)<1.3);
  assert.ok(g.cadence(500)<=1.55);
  const cycles=[];
  for(const fps of [20,30,60,120]){const s=g.create();for(let i=0;i<fps*10;i++)g.advance(s,1/fps,80,true);cycles.push(s.cycles);}
  assert.ok(Math.max(...cycles)-Math.min(...cycles)<.04,JSON.stringify(cycles));
});
test('all four legs trace finite, continuous paths and leave a suspension interval',()=>{
  let airborne=0;
  for(let i=0;i<=1000;i++){
    const phase=i/1000,p=g.pose(phase,1);let planted=0;
    for(let leg=0;leg<4;leg++){
      const f=g.foot(phase,leg,1);if(f.stance)planted++;
      const next=g.foot(phase+.00001,leg,1);
      assert.ok(Math.abs(f.z-next.z)<.001&&Math.abs(f.y-next.y)<.001);
      assert.ok(f.y>=.085&&f.y<.47);
      const front=leg>=2,angles=g.solve(front,f.y,f.z,p.heave);
      assert.ok(Number.isFinite(angles.leg+angles.knee));
      const uz=front?-.07:.14,lz=front?.09:-.1;
      const ry=(y,z,a)=>y*Math.cos(a)-z*Math.sin(a),rz=(y,z,a)=>y*Math.sin(a)+z*Math.cos(a);
      const y=1.1+p.heave+ry(-.52,uz,angles.leg)+ry(-.59,lz,angles.leg+angles.knee);
      const z=rz(-.52,uz,angles.leg)+rz(-.59,lz,angles.leg+angles.knee);
      assert.ok(Math.abs(y-f.y)<.018&&Math.abs(z-f.z)<.018,JSON.stringify({leg,phase,y,z,f}));
    }
    if(!planted)airborne++;
  }
  assert.ok(airborne>=180,'No held suspension phase');
});
test('stopping, pause and airborne poses do not advance footsteps or jump the phase',()=>{
  const s=g.create();for(let i=0;i<120;i++)g.advance(s,1/60,60,true);
  const phase=s.phase;g.advance(s,0,100,true);assert.equal(s.phase,phase);assert.equal(s.beats.length,0);
  for(let i=0;i<60;i++)g.advance(s,1/60,0,true);assert.equal(s.phase,phase);assert.ok(s.blend<.001);
  for(let i=0;i<60;i++){g.advance(s,1/60,60,false);assert.equal(s.beats.length,0);}
  assert.equal(s.phase,phase);assert.ok(s.air>.99);
});
