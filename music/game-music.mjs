import { createJourneyMusic, TRACKS } from './journey-music.mjs';

const settings = document.querySelector('#musicSettings');
const toggle = document.querySelector('#musicToggle');
const select = document.querySelector('#musicTrack');
const volume = document.querySelector('#musicVolume');
const output = document.querySelector('#musicVolumeValue');
const status = document.querySelector('#musicStatus');

function show(state) {
  toggle.textContent = state.status === 'unavailable' && state.enabled ? 'BGM：再試行' : state.enabled ? 'BGM：オン' : 'BGM：オフ';
  toggle.setAttribute('aria-pressed', String(state.enabled));
  select.value = state.track;
  volume.value = String(Math.round(state.volume * 100));
  output.textContent = volume.value + '%';
  status.textContent = state.status === 'preparing' ? 'BGMを準備しています…'
    : state.status === 'switching' ? '次の曲を準備しています…'
    : state.status === 'unavailable' ? '曲を読み込めませんでした。「BGM：再試行」で試せます。'
    : state.status === 'paused' ? 'BGMは一時停止中です。' : '';
}

for (const track of TRACKS) {
  const option = document.createElement('option');
  option.value = track.id; option.textContent = track.title;
  select.append(option);
}
const music = createJourneyMusic({ getContext: () => window.__wlAudio?.getContext(), onChange: show });
toggle.addEventListener('click', () => {
  if (music.state.enabled && music.state.status === 'unavailable') music.unlock();
  else music.setEnabled(!music.state.enabled);
});
select.addEventListener('change', () => music.select(select.value));
volume.addEventListener('input', () => music.setVolume(Number(volume.value) / 100));

// Unlock only on deliberate gestures. Opening the menu or changing a world never restarts a playing loop.
for (const id of ['btnGo', 'btnRandom', 'btnMenu', 'menuClose']) {
  document.getElementById(id)?.addEventListener('click', () => { if (music.state.enabled) music.unlock(); });
}
show(music.state); settings.disabled = false;
window.__wlMusic = music;
