import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/featured-routes.js');await import('../world/route-guidance.js');const R=globalThis.WindRoutes;
const branch=R.addConnection('branch-check',[{x:-17000,z:0,y:20},{x:-16000,z:0,y:20}],'steppe');
const parent=R.addConnection('parent-check',[{x:-17000,z:-1000,y:20},{x:-16000,z:0,y:20},{x:-15000,z:1000,y:20}],'steppe');
const crossing=R.addConnection('crossing-check',[{x:-16500,z:-1200,y:20},{x:-16500,z:1200,y:20}],'steppe');
const N=globalThis.WindRouteGuidance.install(R);
test('look-ahead crosses a real shared junction continuously, instead of stopping at the endpoint',()=>{
 const a=N.ahead(branch,branch.length-200,500),b=N.ahead(branch,branch.length-199,499);
 assert.equal(a.path.id,parent.id);assert.ok(Math.hypot(a.x+16000,a.z)>290);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-7);assert.ok(a.tx>0&&a.tz>0);
 const edge=N.ahead(branch,100,400,-1);assert.ok(edge.extended&&edge.x< -17000&&edge.tx<0);
});
test('a crossing and subpixel nearest-distance noise cannot rotate the selected road under the rider',()=>{
 for(const dx of [-.1,0,.1]){const r=N.choose(-16500+dx,0,{preferred:branch.id,y:20.14,yaw:Math.PI/2,steer:0});assert.equal(r.path.id,branch.id);}
 assert.notEqual(N.choose(-16500,0,{preferred:branch.id,y:20.14,yaw:0,steer:.8}).path.id,branch.id);
 assert.equal(N.choose(-16500,0,{preferred:branch.id,y:200,yaw:Math.PI/2}),null);
});
