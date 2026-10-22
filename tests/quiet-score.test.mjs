import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS,buildScore } from '../music/quiet-score.mjs';
import { ROUTE_POOLS } from '../music/route-playlist.mjs';

test('all regional and saved songs have sparse chamber arrangements with breathing room',()=>{
  assert.equal(TRACKS.length,12);
  for(const id of new Set(Object.values(ROUTE_POOLS).flat())){
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
