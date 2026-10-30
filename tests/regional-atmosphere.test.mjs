import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/regional-atmosphere.js');
const A=globalThis.WindRegionalAtmosphere;
const scene=(id,index=0)=>({id,weights:[{zone:{id,x:150000,z:0,y:25},w:1,index}]});
test('fourteen lands have separate road palettes and readable regional sky families',()=>{
  assert.equal(Object.keys(A.profiles).length,14);
  assert.equal(new Set(Object.values(A.profiles).map(p=>p.road)).size,14);
  const edo=A.weather(scene('edo'),0),sea=A.weather(scene('okinawa'),0),forest=A.weather(scene('inner'),0);
  assert.ok(edo.hor[0]>edo.hor[2]*1.3);assert.ok(sea.top[2]>sea.top[0]*2);assert.ok(edo.elevation<sea.elevation*.5);assert.ok(forest.cover>sea.cover*2);
  for(const id of Object.keys(A.profiles))for(let t=0;t<180;t+=.3){const a=A.weather(scene(id),t),b=A.weather(scene(id),t+.001);for(const field of ['top','hor','cloudColour'])for(let i=0;i<3;i++){assert.ok(a[field][i]>=0&&a[field][i]<=1);assert.ok(Math.abs(a[field][i]-b[field][i])<.001);}}
});
test('crow, gull and soaring bird silhouettes have finite continuous world paths above the roads',()=>{
  for(const [index,id] of Object.keys(A.profiles).entries())for(let i=0;i<A.profiles[id].birds;i++){
    const zone=scene(id,index).weights[0].zone,a=A.birdPose(zone,i,0),b=A.birdPose(zone,i,.001);
    assert.ok(Object.values(a).every(Number.isFinite));assert.ok(a.y>zone.y+100);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.1);
  }
  assert.equal(A.profiles.edo.bird,'crow');assert.equal(A.profiles.okinawa.bird,'gull');assert.equal(A.profiles.hagiang.bird,'kite');
});
