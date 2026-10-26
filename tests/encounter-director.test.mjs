import test from 'node:test';import assert from 'node:assert/strict';
await import('../world/encounter-director.js');const D=globalThis.WindEncounters;
test('forward salvos leave drawing windows and more frequent lake encounters',()=>{
 const s=D.create(),phases={};let warnings=0,clears=0,combatRest=0,fire=0;
 for(let i=0;i<60*240;i++){D.advance(s,1/60,{region:'lake'});phases[s.phase]=(phases[s.phase]||0)+1/60;if(s.event==='warning')warnings++;if(s.event==='clear')clears++;
  if(s.phase==='scenic')assert.equal(s.fire,false);if(s.phase==='combat'){if(s.fire){fire++;assert.equal(s.weapon,'missile');}else combatRest++;}}
 assert.ok(phases.combat>phases.scenic);assert.ok(warnings>=3&&clears>=3);assert.ok(combatRest>fire*.4);
});
test('victory earns quiet immediately; pauses, roofs and attack-off cannot emit another salvo',()=>{
 const s=D.create();for(let i=0;i<1000;i++)D.advance(s,.02);assert.equal(s.phase,'combat');const old=s.elapsed;D.advance(s,0);assert.equal(s.elapsed,old);
 D.advance(s,.02,{cleared:true});assert.equal(s.phase,'release');assert.equal(s.fire,false);
 D.advance(s,.02,{sheltered:true});assert.equal(s.phase,'scenic');assert.equal(s.event,'clear');assert.equal(s.fire,false);
 for(let i=0;i<500;i++)D.advance(s,.02,{sheltered:true});assert.equal(s.elapsed,0);
 assert.ok(D.rest('lake',1,1)>D.rest('lake',1,3));
 Object.assign(s,{phase:'combat',duration:32,elapsed:1});D.advance(s,.02,{bend:.5});assert.equal(s.fire,false);
 D.advance(s,.02,{enabled:false});assert.equal(s.weapon,null);assert.equal(s.fire,false);
});

test('an unreadable approach postpones a new warning, with bounded delay and immediate shelter cancellation',()=>{
 const s=D.create();s.elapsed=s.duration-.01;
 for(let i=0;i<120;i++)D.advance(s,1/60,{opening:false});assert.equal(s.phase,'scenic');assert.equal(s.fire,false);
 D.advance(s,1/60,{opening:true});assert.equal(s.phase,'warning');assert.equal(s.event,'warning');
 Object.assign(s,D.create(),{elapsed:13});for(let i=0;i<370;i++)D.advance(s,1/60,{opening:false});assert.equal(s.phase,'warning');
 D.advance(s,.1,{sheltered:true});assert.equal(s.phase,'scenic');assert.equal(s.fire,false);
});
