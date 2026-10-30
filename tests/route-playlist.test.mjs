import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_POOLS, chooseRouteTrack, createRoutePlaylist } from '../music/route-playlist.mjs';
import { TRACKS } from '../music/quiet-score.mjs';

test('landscape pools have playable candidates; re-entry avoids the previous song', () => {
  for (const [region, pool] of Object.entries(ROUTE_POOLS)) {
    assert.equal(new Set(pool).size, region.startsWith('monsoon-')?6:9);
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

test('regional automatic selection mixes quiet and brave music without consecutive brave pieces',async()=>{
 const brave=new Set(TRACKS.filter(t=>t.energy==='brave').map(t=>t.id));
 for(const region of Object.keys(ROUTE_POOLS).filter(id=>!id.startsWith('monsoon-'))){
  const ids=[],music={state:{track:'rust-horizon'},select(id){this.state.track=id;ids.push(id);return Promise.resolve(true);}};
  const list=createRoutePlaylist(music,{storage:null,random:()=>.97});for(let i=0;i<20;i++)await list.enter(region,true);
  assert.equal(brave.has(ids[0]),false);assert.ok(ids.filter(id=>brave.has(id)).length>=6);for(let i=1;i<ids.length;i++)assert.ok(!(brave.has(ids[i-1])&&brave.has(ids[i])));
 }
});

test('sampler boundaries play their own themes after a minimum dwell, with smooth fades',async()=>{
 const selected=[];let age=0;const music={state:{track:'rust-horizon',status:'playing'},inspect:()=>({playingSeconds:age}),select(id,options){selected.push({id,options});this.state.track=id;age=0;return Promise.resolve(true)}};
 const list=createRoutePlaylist(music,{storage:null,random:()=>0});await list.enter('monsoon-bay',true);assert.equal(music.state.track,'bay-glass');
 const themes={edo:'crows-at-dusk',angkor:'stone-and-rain',khaosan:'khaosan-afterlight',donmueang:'runway-swallow',straits:'straits-tide'};
 for(const [zone,id]of Object.entries(themes)){
  await list.enter('monsoon-'+zone);age=13;assert.equal(await list.tick({phase:'combat'}),false);age=14;
  assert.equal(await list.tick({active:false}),false);assert.equal(await list.tick({moving:false}),false);
  assert.equal(await list.tick({phase:'combat'}),true);assert.equal(music.state.track,id);assert.equal(list.pendingRegion,null);
 }
 assert.equal(selected.length,6);assert.ok(selected.every(c=>c.options.fade===3));
 age=37.9;assert.equal(await list.tick(),false);age=38;assert.equal(await list.tick(),true);assert.notEqual(music.state.track,'straits-tide');
 await list.setAutomatic(false);await list.enter('monsoon-bay');age=100;const n=selected.length;assert.equal(await list.tick(),false);assert.equal(selected.length,n);
});
test('boundary chatter queues only the latest sampler scene instead of repeatedly restarting audio',async()=>{
 let age=0;const calls=[],music={state:{track:'bay-glass',status:'playing'},inspect:()=>({playingSeconds:age}),select(id){calls.push(id);this.state.track=id;age=0;return Promise.resolve(true)}};
 const list=createRoutePlaylist(music,{storage:null});await list.enter('monsoon-bay',true);const initial=calls.length;
 for(const zone of ['edo','bay','edo','angkor'])await list.enter('monsoon-'+zone);assert.equal(calls.length,initial);
 age=14;music.state.status='switching';assert.equal(await list.tick(),false);music.state.status='playing';await list.tick();assert.equal(calls.at(-1),'stone-and-rain');assert.equal(calls.length,initial+1);
});

test('returning along an atlas road restores the district theme even when heard recently',async()=>{
 let age=0;const music={state:{track:'rust-horizon',status:'playing'},inspect:()=>({playingSeconds:age}),select(id){this.state.track=id;age=0;return Promise.resolve(true)}};
 const list=createRoutePlaylist(music,{storage:null,random:()=>0});
 await list.enter('monsoon-shikoku',true);assert.equal(music.state.track,'indigo-gorge');
 for(const [region,theme]of [['kanazawa','rain-on-lattice'],['shikoku','indigo-gorge']]){await list.enter('monsoon-'+region);age=14;assert.equal(await list.tick(),true);assert.equal(music.state.track,theme);}
});
test('staying in a land alternates its local arrangements whilst manual music remains fixed',async()=>{
 for(const region of Object.keys(ROUTE_POOLS).filter(id=>id.startsWith('monsoon-'))){
  let age=0;const music={state:{track:'rust-horizon',status:'playing'},inspect:()=>({playingSeconds:age}),select(id){this.state.track=id;age=0;return Promise.resolve(true)}};
  const list=createRoutePlaylist(music,{storage:null,random:()=>.99});await list.enter(region,true);const heard=new Set([music.state.track]);
  for(let i=0;i<6;i++){age=38;await list.tick();heard.add(music.state.track);}assert.deepEqual(heard,new Set(ROUTE_POOLS[region].slice(0,2)));
  await list.setAutomatic(false);const before=music.state.track;age=100;await list.tick();assert.equal(music.state.track,before);
 }
});
test('arriving while the destination theme is playing preserves its live voice',async()=>{
 const calls=[],music={state:{track:'rain-on-lattice',status:'playing'},select(id){calls.push(id);this.state.track=id;return Promise.resolve(true)}};
 const list=createRoutePlaylist(music,{storage:null});await list.enter('monsoon-kanazawa',true);
 assert.deepEqual(calls,[]);assert.equal(list.pendingRegion,null);
});
