import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/horse-gait.js');
const g=globalThis.WindHorseGait;
test('powerful strides cap cadence, and simulation frame rates preserve the rhythm',()=>{
  assert.ok(g.cadence(40)>1.6&&g.cadence(40)<1.9);
  assert.ok(g.cadence(500)<=2.1);
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
      assert.ok(f.y>=.085&&f.y<.52);
      const front=leg>=2,angles=g.solve(front,f.y,f.z,p.heave,p.pitch);
      assert.ok(Number.isFinite(angles.leg+angles.knee));
      const ry=(y,z,a)=>y*Math.cos(a)-z*Math.sin(a),rz=(y,z,a)=>y*Math.sin(a)+z*Math.cos(a);
      let y,z;
      if(front){y=1.1+ry(-.58,-.03,angles.leg)+ry(-.59,.04,angles.leg+angles.knee);z=.69+rz(-.58,-.03,angles.leg)+rz(-.59,.04,angles.leg+angles.knee);}
      else{y=1.1+ry(-.30,.22,angles.leg)+ry(-.38,-.22,angles.leg+angles.knee)+ry(-.42,.07,angles.leg+angles.knee+angles.hock);z=-.67+rz(-.30,.22,angles.leg)+rz(-.38,-.22,angles.leg+angles.knee)+rz(-.42,.07,angles.leg+angles.knee+angles.hock);}
      const Y=p.heave+ry(y,z,p.pitch),Z=rz(y,z,p.pitch)-(front?.69:-.67);
      assert.ok(Math.abs(Y-f.y)<.025&&Math.abs(Z-f.z)<.025,JSON.stringify({leg,phase,Y,Z,f}));
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

test('four audible contacts coincide with their own leg plants in transverse order',()=>{
 const state=g.create();state.cycles=1;state.phase=0;state.rate=g.cadence(60);state.blend=1;
 const contacts=[];for(let i=0;i<600;i++){g.advance(state,1/600,60,true);for(const e of state.beats){assert.ok(e.age>=0&&e.age<=1/600+.000001);const phase=(state.cycles-e.age*state.rate)%1;assert.ok(g.foot(phase+.000001,e.leg,1).stance);contacts.push(e.leg);}}
 assert.deepEqual(contacts.slice(0,4),[0,3,2,1]);
});
