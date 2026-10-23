import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/encounter-director.js');const D=globalThis.WindEncounters;
test('engagements contain three distinct weapons and return to a genuinely quiet journey',()=>{
 const s=D.create(),phases={},weapons=new Set();let warnings=0,clears=0;
 for(let i=0;i<60*240;i++){D.advance(s,1/60,{region:'lake'});phases[s.phase]=(phases[s.phase]||0)+1/60;if(s.weapon)weapons.add(s.weapon);if(s.event==='warning')warnings++;if(s.event==='clear')clears++;if(s.phase==='scenic')assert.equal(s.fire,false);}
 assert.deepEqual([...weapons].sort(),['geometry','kinetic','missile']);assert.ok(phases.scenic>phases.combat);assert.ok(warnings>=3&&clears>=3);assert.ok(s.cycle>=3);
});
test('pause freezes the wave, roofs cancel it, and low health buys a longer rest',()=>{
 const s=D.create();for(let i=0;i<1000;i++)D.advance(s,.02);assert.equal(s.phase,'combat');const old=s.elapsed;D.advance(s,0);assert.equal(s.elapsed,old);
 D.advance(s,.02,{sheltered:true});assert.equal(s.phase,'scenic');assert.equal(s.event,'clear');assert.equal(s.fire,false);
 for(let i=0;i<500;i++)D.advance(s,.02,{sheltered:true});assert.equal(s.elapsed,0);
 assert.ok(D.rest('lake',1,1)>D.rest('lake',1,3));
 s.phase='combat';s.duration=26;s.elapsed=20;D.advance(s,.02,{bend:.5});assert.equal(s.weapon,'kinetic');
});
