import test from 'node:test';import assert from 'node:assert/strict';import {ATLAS_TRACKS,buildAtlasScore}from'../music/atlas-score.mjs';
test('eight new places have distinct melodic intervals, rhythms and original score identities',()=>{
 assert.equal(ATLAS_TRACKS.length,8);const intervals=new Set(),rhythms=new Set();for(const t of ATLAS_TRACKS){intervals.add(t.motif.slice(1).map((v,i)=>v-t.motif[i]).join(','));rhythms.add(t.rhythm);const s=buildAtlasScore(t.id);assert.ok(s.seconds>50&&s.seconds<75);assert.ok(s.events.some(e=>e.voice===t.lead));let last=-1;for(const e of s.events){assert.ok(e.beat>=last&&e.duration>0&&e.beat+e.duration<=s.totalBeats&&e.velocity<.2&&Number.isFinite(e.midi));last=e.beat;}assert.deepEqual(buildAtlasScore(t.id),s);}
 assert.equal(intervals.size,8);assert.equal(rhythms.size,8);assert.throws(()=>buildAtlasScore('missing'),RangeError);
});
