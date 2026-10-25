import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/featured-routes.js');
const routes=globalThis.WindRoutes;
test('the lake is closed and both roads remain gentle, finite and searchable',()=>{
  for(const path of routes.paths){
    let steepest=0;
    for(const seg of path.segments){
      assert.ok(Number.isFinite(seg.length+seg.grade+seg.a.y+seg.a.nx));assert.ok(seg.length>0);
      steepest=Math.max(steepest,Math.abs(seg.grade));
      const x=(seg.a.x+seg.b.x)/2,z=(seg.a.z+seg.b.z)/2,r=routes.nearest(x,z);
      assert.equal(r.path.id,path.id);assert.ok(r.d<.01);assert.ok(Math.abs(r.y-(seg.a.y+seg.b.y)/2)<.001);
    }
    assert.ok(steepest<.12,`${path.id}: ${steepest}`);
  }
  const lake=routes.paths.find(p=>p.id==='lake');assert.deepEqual(lake.points[0],lake.points.at(-1));
  const a=routes.at(lake,0),b=routes.at(lake,lake.length);assert.deepEqual(a,b);assert.ok(lake.length>34000);
});
test('all custom tunnel bands have a connected, correctly sampled road',()=>{
  const path=routes.paths.find(p=>p.id==='mountain');let tunnel=0,gallery=0;
  for(const s of path.segments){const mode=routes.tunnel((s.a.x+s.b.x)/2);if(mode==='tunnel')tunnel+=s.length;if(mode==='gallery')gallery+=s.length;}
  assert.ok(tunnel>150&&tunnel<350);assert.ok(path.segments.some(s=>routes.tunnel((s.a.x+s.b.x)/2)==='gallery'&&!routes.covered(s)));assert.equal(routes.shelterHeight,26);assert.ok(gallery>1400);assert.equal(routes.nearest(0,0),null);
});
