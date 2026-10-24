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
test('complete phrases rotate without repeats only in a playing, quiet journey; manual and paused tracks stay put',async()=>{
 const calls=[];let elapsed=0;
 const music={state:{track:'rust-horizon',status:'playing'},inspect:()=>({playingSeconds:elapsed,duration:60}),select(id,options){calls.push({id,options});this.state.track=id;elapsed=0;return Promise.resolve(true);}};
 const list=createRoutePlaylist(music,{storage:null,random:()=>0});await list.enter('lake');
 const songs=[music.state.track];
 for(let i=0;i<7;i++){
  elapsed=58;assert.equal(await list.tick(),false);
  elapsed=61;assert.equal(await list.tick({phase:'combat'}),false);assert.equal(await list.tick({active:false}),false);
  music.state.status='switching';assert.equal(await list.tick(),false);music.state.status='playing';
  assert.equal(await list.tick({phase:i%2?'release':'scenic'}),true);songs.push(music.state.track);
 }
 for(let i=0;i<songs.length-3;i++)assert.equal(new Set(songs.slice(i,i+4)).size,4);
 assert.ok(calls.every(c=>c.options.fade===2.4));
 await list.setAutomatic(false);elapsed=120;assert.equal(await list.tick(),false);assert.equal(list.history.length,4);
});
