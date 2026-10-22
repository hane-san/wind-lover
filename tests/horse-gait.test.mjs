import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/horse-gait.js');
const g=globalThis.WindHorseGait;
test('a forward gallop caps cadence, and simulation frame rates preserve the rhythm',()=>{
  assert.ok(g.cadence(40)>1.7&&g.cadence(40)<1.85);
  assert.ok(g.cadence(500)<=2.12);
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
      const rig=g.rig,hipZ=front?rig.foreZ:rig.hindZ,parts=front?rig.fore:rig.hind;
      y=rig.hipY;z=hipZ;let angle=angles.leg;
      for(let j=0;j<parts.length;j++){if(j===1)angle+=angles.knee;if(j===2)angle+=angles.hock;y+=ry(...parts[j],angle);z+=rz(...parts[j],angle);}
      const Y=p.heave+ry(y,z,p.pitch),Z=rz(y,z,p.pitch)-hipZ;
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

test('one clustered pa-ka-ra phrase leaves a clear recovery before the next stride',()=>{
 const contacts=[...g.offsets].sort((a,b)=>a-b),rate=g.cadence(60);
 const gaps=contacts.map((p,i)=>(i===3?1-contacts[3]:contacts[i+1]-p)/rate);
 assert.ok(gaps[0]<.045,'The hind pickup no longer reads as a close pair');
 assert.ok(gaps[1]>.075&&gaps[2]>.075,'The fore clops merge into a buzz');
 assert.ok(gaps[3]>.25&&gaps[3]>gaps[1]*2.5,'No breathing space between strides');
 let low=Infinity,high=-Infinity;
 for(let i=0;i<1000;i++){
  const p=g.pose(i/1000,1),a=p.pitch+p.riderPitch;
  assert.ok(Math.abs(a)<.11,'The traveller pitches into a racing crouch');
  // Apply the same saddle pivot and body rotation as the actual rider model.
  const y=p.riderY+g.rig.saddleY+(g.rig.riderTop-g.rig.saddleY)*Math.cos(p.riderPitch);
  const z=(g.rig.riderTop-g.rig.saddleY)*Math.sin(p.riderPitch);
  const head=p.heave+y*Math.cos(p.pitch)-z*Math.sin(p.pitch);
  low=Math.min(low,head);high=Math.max(high,head);
 }
 assert.ok(high-low<.13,'The rider bounces rigidly with the horse');
});
