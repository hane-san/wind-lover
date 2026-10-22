import test from 'node:test';
import assert from 'node:assert/strict';
await import('../world/horse-sound.js');
const sound=globalThis.WindHorseSound;
test('hoof strikes retain a sharp clop and body without clipped samples or hard joins',()=>{
 for(const rate of [24000,44100,48000])for(const hard of [false,true])for(let leg=0;leg<4;leg++){
  const a=sound.samples(rate,leg>=2,hard,leg);let energy=0,peak=0,early=0,tail=0;
  for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));energy+=a[i]*a[i];peak=Math.max(peak,Math.abs(a[i]));if(i<rate*.05)early+=a[i]*a[i];if(i>rate*.14)tail+=a[i]*a[i];}
  assert.ok(peak<.96&&peak>.4);assert.ok(Math.sqrt(energy/a.length)>.05);assert.equal(a[0],0);assert.equal(a.at(-1),0);assert.ok(early>tail*50);
 }
 const road=sound.samples(48000,true,true),earth=sound.samples(48000,true,false);
 assert.notDeepEqual(road,earth);assert.deepEqual(road,sound.samples(48000,true,true));
});
