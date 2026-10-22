import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/featured-routes.js');await import('../world/journey-climate.js');
const c=globalThis.WindJourneyClimate,r=globalThis.WindRoutes;
test('the foothills stay green and snow follows elevation rather than the menu choice',()=>{
 assert.equal(c.mountain(33000,480,170).snow,0);
 assert.ok(c.mountain(41000,1700,620).snow>.95);
 assert.equal(c.mountain(47800,1100,220).snow,0);
 assert.equal(c.mountain(76000,100,700).snow,0);
});
test('lake light starts clear, waits for westward travel and never oscillates on a dodge',()=>{
 const s=c.create(),path=r.paths.find(p=>p.id==='lake');
 let distance=0;for(let i=0;i<400;i++){
   distance+=60;const p=r.at(path,path.length*.53+distance);
   c.advance(s,1,p,p.tx*90,90);
   if(distance<12000)assert.equal(s.evening,0);
 }
 assert.ok(s.evening>.7);const previous=s.evening;
 c.advance(s,0,r.at(path,5000),-90,90);assert.equal(s.evening,previous);
 c.advance(s,1,r.at(path,5000),90,90);assert.ok(s.evening>=previous);
 assert.equal(c.sky(0).stars,0);assert.equal(c.sky(1).stars,1);assert.ok(c.sky(1).elevation<0);
});
