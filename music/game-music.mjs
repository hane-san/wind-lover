import { createJourneyMusic, TRACKS } from './journey-music.mjs?v=20261030-atmosphere';
import { createRoutePlaylist } from './route-playlist.mjs?v=20261030-atmosphere';

const settings = document.querySelector('#musicSettings');
const toggle = document.querySelector('#musicToggle');
const select = document.querySelector('#musicTrack');
const volume = document.querySelector('#musicVolume');
const output = document.querySelector('#musicVolumeValue');
const status = document.querySelector('#musicStatus');
let playlist;

function show(state) {
  toggle.textContent = state.status === 'unavailable' && state.enabled ? 'BGM：再試行' : state.enabled ? 'BGM：オン' : 'BGM：オフ';
  toggle.setAttribute('aria-pressed', String(state.enabled));
  select.value = playlist?.automatic !== false ? 'auto' : state.track;
  volume.value = String(Math.round(state.volume * 100));
  output.textContent = volume.value + '%';
  status.textContent = state.status === 'preparing' ? 'BGMを準備しています…'
    : state.status === 'switching' ? '次の曲を準備しています…'
    : state.status === 'unavailable' ? '曲を読み込めませんでした。「BGM：再試行」で試せます。'
    : state.status === 'paused' ? 'BGMは一時停止中です。' : state.status === 'playing' ? '再生中：' + state.title : '';
}

const autoOption = document.createElement('option');
autoOption.value = 'auto'; autoOption.textContent = 'おまかせ：静けさと疾走、旅に合わせて'; select.append(autoOption);
for (const track of TRACKS) {
  const option = document.createElement('option');
  option.value = track.id; option.textContent = track.title+(track.energy==='brave'?' · 疾走':'');
  select.append(option);
}
const music = createJourneyMusic({ getContext: () => window.__wlAudio?.getContext(), getDestination: () => window.__wlAudio?.getDestination(), onChange: show });
playlist = createRoutePlaylist(music);
toggle.addEventListener('click', () => {
  if (music.state.enabled && music.state.status === 'unavailable') music.unlock();
  else music.setEnabled(!music.state.enabled);
});
select.addEventListener('change', () => {
  if (select.value === 'auto') playlist.setAutomatic(true);
  else { playlist.setAutomatic(false); music.select(select.value); }
  show(music.state);
});
volume.addEventListener('input', () => music.setVolume(Number(volume.value) / 100));

// Unlock only on deliberate gestures. Opening the menu or changing a world never restarts a playing loop.
document.addEventListener('click', event => {
  if (event.target.closest('[data-journey-route], #realmWarp, #realmWarp2, [data-monsoon-zone], [data-atlas-warp], #btnGo, #btnRandom, #btnMenu, #menuClose')) {
    // Resume inside the gesture; selection below can finish preparing asynchronously.
    if (music.state.enabled) music.unlock();
    queueMicrotask(() => { if(window.__wl?.started) playlist.enter(window.__wl.musicRegion()); });
  }
}, true);
window.addEventListener('wl:music-region', event => {
  if (window.__wl?.started) playlist.enter(event.detail.region, event.detail.visit);
});
// Short scenic chapters announce themselves after two seconds; longer journeys retain their debounce.
let candidate=null,since=0;
setInterval(()=>{
  const world=window.__wl;
  if(!world?.started||world.paused||world.P.dead||document.hidden){candidate=null;return;}
  const region=world.musicRegion(),sampler=region.startsWith('monsoon-');
  if(candidate!==region){candidate=region;since=performance.now();}
  else if(performance.now()-since>=(sampler?2000:12000))playlist.enter(region);
  playlist.tick({phase:world.combat.encounter.phase,moving:Math.hypot(world.P.vel.x,world.P.vel.z)>3});
},1000);
show(music.state); settings.disabled = false;
window.__wlMusic = music;
window.__wlPlaylist = playlist;

