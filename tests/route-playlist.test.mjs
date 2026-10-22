import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_POOLS, chooseRouteTrack, createRoutePlaylist } from '../music/route-playlist.mjs';
import { TRACKS } from '../music/scores.mjs';

test('every landscape has four playable candidates; re-entry avoids the previous song', () => {
  for (const [region, pool] of Object.entries(ROUTE_POOLS)) {
    assert.equal(new Set(pool).size, 4);
    for (const previous of pool) for(let i=0;i<100;i++) {
      const next = chooseRouteTrack(region, previous, () => i/100);
      assert.ok(pool.includes(next)); assert.notEqual(next, previous);
      assert.ok(TRACKS.some(t => t.id === next));
    }
  }
  assert.deepEqual(new Set(Object.values(ROUTE_POOLS).flat()), new Set(TRACKS.map(t => t.id)));
});
test('region polling preserves playback, re-entry rerolls, manual selection survives visits and reload', async () => {
  const data=new Map(), storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const selected=[]; const music={state:{track:'rust-horizon'},select(id){selected.push(id);this.state.track=id;return Promise.resolve(true);}};
  const list=createRoutePlaylist(music,{storage,random:()=>.2});
  await list.enter('lake'); assert.equal(selected.length,1);
  const first=music.state.track;
  for(let i=0;i<30;i++)await list.enter('lake'); assert.equal(selected.length,1);
  await list.enter('lake',true);assert.notEqual(music.state.track,first);
  await list.setAutomatic(false); await list.enter('mountain'); assert.equal(selected.length,2);
  const reloaded=createRoutePlaylist(music,{storage});assert.equal(reloaded.automatic,false);
  await reloaded.enter('desert');assert.equal(selected.length,2);
  await reloaded.setAutomatic(true);assert.equal(selected.length,3);
});
