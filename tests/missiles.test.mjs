import test from 'node:test';import assert from 'node:assert/strict';await import('../world/missiles.js');const M=globalThis.WindMissiles;
test('interception handles a fast rider, matching speeds, and impossible targets without NaN',()=>{
 assert.ok(Math.abs(M.intercept(-550,0,0,130,0,0,170)-550/300)<1e-8);
 for(const velocity of [0,130,170,350])assert.ok(Number.isFinite(M.intercept(550,20,60,velocity,0,0,170)));
 const time=M.acceleratingIntercept(-550,0,0,130,0,0,170),cap=130/145;
 const travel=170*cap+72.5*cap*cap+300*(time-cap);assert.ok(Math.abs(travel+130*time-550)<.04);
});
test('relative sweeps retain fast hits and close passes',()=>{
 assert.equal(M.swept(30,0,0,-30,0,0),0);assert.ok(M.swept(30,0,.8,-30,0,.8)>.54**2);
});
