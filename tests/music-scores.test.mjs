import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,buildScore} from '../music/scores.mjs';
test('twelve complete compositions have distinct scores and four complementary styles',()=>{
 assert.equal(TRACKS.length,12);assert.equal(new Set(TRACKS.map(t=>t.title)).size,12);
 assert.equal(new Set(TRACKS.map(t=>t.groove)).size,4);
 assert.equal(new Set(TRACKS.map(t=>JSON.stringify(t.melody))).size,12);
 for(const t of TRACKS){const s=buildScore(t.id);assert.ok(s.seconds>40&&s.seconds<90);assert.equal(s.bars,32);assert.ok(s.events.length>350);
  let previous=-1;for(const e of s.events){assert.ok(e.beat>=previous&&e.beat<s.totalBeats);previous=e.beat;assert.ok(Number.isFinite(e.midi));assert.ok(e.duration>0);assert.ok(e.velocity>0&&e.velocity<.5);assert.ok(Math.abs(e.pan)<=1);}
  for(const voice of ['pad','bass','kick',t.lead,t.arp])assert.ok(s.events.some(e=>e.voice===voice));
 }
});
test('scores are deterministic, and unknown IDs do not silently select another composition',()=>{
 for(const t of TRACKS)assert.deepEqual(buildScore(t.id),buildScore(t.id));
 assert.throws(()=>buildScore('not-a-track'),RangeError);
});

