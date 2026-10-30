import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS,buildScore } from '../music/quiet-score.mjs';
import { ROUTE_POOLS } from '../music/route-playlist.mjs';

test('the twelve quiet and saved chamber songs retain breathing room',()=>{
  assert.equal(TRACKS.length,38);
  for(const id of TRACKS.filter(t=>t.arrangement==='quiet').map(t=>t.id)){
    const s=buildScore(id),voices=new Set(s.events.map(e=>e.voice));
    assert.ok(s.bpm>=60&&s.bpm<=72);
    assert.ok(s.seconds>50&&s.seconds<75);
    assert.deepEqual([...voices].sort(),['bowed','drone','lute','reed']);
    const lead=s.events.filter(e=>e.voice==='reed');
    assert.ok(lead.length/s.seconds<.5,'Melody leaves no space');
    assert.ok(s.totalBeats-Math.max(...lead.map(e=>e.beat+e.duration))>3,'Final phrase has no unanswered space');
    let previous=-1;for(const e of s.events){assert.ok(e.beat>=previous&&e.beat+e.duration<=s.totalBeats);previous=e.beat;assert.ok(e.duration>0&&Number.isFinite(e.midi));}
    assert.deepEqual(buildScore(id),s);
  }
  assert.throws(()=>buildScore('missing'),RangeError);
});

test('twenty brave arrangements have distinct rhythms, bounded levels and stable saved identities',()=>{
 const riding=TRACKS.filter(t=>t.energy==='brave');assert.equal(riding.length,20);
 for(const t of riding){const s=buildScore(t.id);assert.ok(s.bpm>=100&&s.bpm<=150);assert.ok(s.seconds>50&&s.seconds<75);assert.ok(s.events.some(e=>e.voice==='kick'));
  for(const e of s.events)assert.ok(Number.isFinite(e.midi+e.beat+e.velocity)&&e.velocity>0&&e.velocity<.4&&e.duration>0);
  assert.deepEqual(s,buildScore(t.id));
 }assert.ok(buildScore('tian-shan-charge').events.some(e=>e.voice==='horn'));
});
