import { TRACKS, buildScore } from './scores.mjs';
export { TRACKS, buildScore };

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const frequency = n => 440 * 2 ** ((n - 69) / 12);
const modulo = (a, b) => ((a % b) + b) % b;
const random = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };

function envelope(context, at, duration, attack, release, peak, plucked = false) {
  const gain = context.createGain(), end = at + duration + release;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + Math.min(attack, duration / 3));
  if (plucked) gain.gain.exponentialRampToValueAtTime(0.00001, end - 0.015);
  else {
    gain.gain.linearRampToValueAtTime(peak * 0.82, Math.max(at + attack, at + duration * 0.74));
    gain.gain.linearRampToValueAtTime(0.00001, end - 0.015);
  }
  gain.gain.linearRampToValueAtTime(0, end);
  return { gain, end };
}

function drum(context, destination, event, at, noise) {
  const kick = event.voice === 'kick', tom = event.voice === 'tom', hat = event.voice === 'hat';
  const env = envelope(context, at, hat ? 0.035 : 0.08, 0.003, hat ? 0.055 : 0.17, event.velocity, true);
  env.gain.connect(destination);
  if (kick || tom) {
    const osc = context.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(tom ? 170 : 145, at);
    osc.frequency.exponentialRampToValueAtTime(tom ? 67 : 43, at + 0.1);
    osc.connect(env.gain); osc.start(at); osc.stop(env.end + 0.01);
  } else {
    const source = context.createBufferSource(), filter = context.createBiquadFilter();
    source.buffer = noise; filter.type = 'highpass'; filter.frequency.value = hat ? 6500 : 1400;
    source.connect(filter); filter.connect(env.gain); source.start(at); source.stop(env.end + 0.01);
    if (!hat) {
      const body = context.createOscillator(), gain = context.createGain();
      body.type = 'triangle'; body.frequency.setValueAtTime(195, at); body.frequency.exponentialRampToValueAtTime(112, at + 0.12);
      gain.gain.value = 0.23; body.connect(gain); gain.connect(env.gain); body.start(at); body.stop(env.end + 0.01);
    }
  }
}

function note(context, destination, event, at, secondsPerBeat) {
  const pad = event.voice === 'pad', bass = event.voice === 'bass', pluck = ['glass','pluck','keys'].includes(event.voice);
  const duration = event.duration * secondsPerBeat, attack = pad ? 0.65 : pluck ? 0.008 : 0.045, release = pad ? 1.6 : bass ? 0.095 : pluck ? 0.75 : 0.35;
  const env = envelope(context, at, duration, attack, release, event.velocity, pluck);
  const filter = context.createBiquadFilter(); filter.type = 'lowpass';
  filter.frequency.value = pad ? 1600 : bass ? 500 : event.voice === 'pluck' ? 3300 : 6500;
  filter.Q.value = event.voice === 'pluck' ? 0.9 : 0.5;
  filter.connect(env.gain);
  const pan = context.createStereoPanner(); pan.pan.value = event.pan;
  env.gain.connect(pan); pan.connect(destination);
  const hz = frequency(event.midi);
  const oscillator = (type, ratio = 1, level = 1, cents = 0) => {
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.value = hz * ratio; osc.detune.value = cents;
    gain.gain.value = level; osc.connect(gain); gain.connect(filter);
    osc.start(at); osc.stop(env.end + 0.02); return osc;
  };
  if (pad) { oscillator('triangle', 1, 0.42, -7); oscillator('triangle', 1, 0.42, 7); oscillator('sine', 2, 0.08); }
  else if (bass) { oscillator('sine', 1, 0.78); oscillator('triangle', 1, 0.22); }
  else if (event.voice === 'keys' || event.voice === 'glass') {
    const carrier = oscillator('sine', 1, 0.8), modulator = context.createOscillator(), depth = context.createGain();
    modulator.type = 'sine'; modulator.frequency.value = hz * (event.voice === 'glass' ? 3.003 : 2.002);
    depth.gain.setValueAtTime(hz * (event.voice === 'glass' ? 0.32 : 0.7), at);
    depth.gain.exponentialRampToValueAtTime(hz * 0.01, at + Math.min(1.1, duration + release));
    modulator.connect(depth); depth.connect(carrier.frequency); modulator.start(at); modulator.stop(env.end + 0.02);
    oscillator('sine', 2, 0.1);
  } else if (event.voice === 'air') {
    const carrier = oscillator('sine', 1, 0.85); oscillator('sine', 2, 0.12);
    const vibrato = context.createOscillator(), depth = context.createGain();
    vibrato.frequency.value = 4.8; depth.gain.value = hz * 0.002;
    vibrato.connect(depth); depth.connect(carrier.frequency); vibrato.start(at); vibrato.stop(env.end + 0.02);
  } else if (event.voice === 'pluck') { oscillator('triangle', 1, 0.72); oscillator('sine', 2, 0.18); oscillator('sine', 3, 0.06); }
  else { oscillator('triangle', 1, 0.75); oscillator('sine', 1, 0.18, 4); oscillator('sine', 2, 0.07); }
}

export async function renderTrack(id, { sampleRate = 24000, Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext } = {}) {
  if (!Offline) throw new Error('Offline audio rendering is not supported');
  const score = buildScore(id), frames = Math.round(score.seconds * sampleRate), duration = frames / sampleRate;
  // Render two complete cycles. The second already contains the preceding cycle's delay and note tails.
  const context = new Offline(2, frames * 2 + sampleRate * 3, sampleRate), mix = context.createGain();
  const highpass = context.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 28;
  mix.connect(highpass); highpass.connect(context.destination);
  for (const [time, level, panValue] of [[0.375,0.16,-0.48],[0.75,0.1,0.48]]) {
    const delay = context.createDelay(2), filter = context.createBiquadFilter(), feedback = context.createGain(), wet = context.createGain(), pan = context.createStereoPanner();
    delay.delayTime.value = 60 / score.bpm * time; filter.type = 'lowpass'; filter.frequency.value = 3000;
    feedback.gain.value = 0.27; wet.gain.value = level; pan.pan.value = panValue;
    mix.connect(delay); delay.connect(filter); filter.connect(feedback); feedback.connect(delay); filter.connect(wet); wet.connect(pan); pan.connect(highpass);
  }
  const noise = context.createBuffer(1, sampleRate, sampleRate), rnd = random(703);
  const data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
  for (let cycle = 0; cycle < 3; cycle++) for (const event of score.events) {
    const at = cycle * duration + event.beat * 60 / score.bpm;
    if (at >= duration * 2 + 2.8) continue;
    if (['kick','snare','hat','tom'].includes(event.voice)) drum(context, mix, event, at, noise);
    else note(context, mix, event, at, 60 / score.bpm);
  }
  const rendered = await context.startRendering(), buffer = context.createBuffer(2, frames, sampleRate);
  let peak = 0, energy = 0;
  for (let channel = 0; channel < 2; channel++) {
    const out = buffer.getChannelData(channel), source = rendered.getChannelData(channel);
    out.set(source.subarray(frames, frames * 2));
    for (const value of out) { peak = Math.max(peak, Math.abs(value)); energy += value * value; }
  }
  const rms = Math.sqrt(energy / (frames * 2)), gain = Math.min(0.8 / Math.max(0.0001, peak), 0.115 / Math.max(0.0001, rms));
  for (let channel = 0; channel < 2; channel++) {
    const out = buffer.getChannelData(channel); for (let i = 0; i < out.length; i++) out[i] *= gain;
  }
  return { id, buffer, score, peak: peak * gain, rms: rms * gain, bytes: frames * 2 * 4 };
}

export function alignLoopSeam(buffer) {
  // Codec windowing can leave a tiny DC mismatch at the join. Distribute only that error
  // over 8 ms either side; never fade the loop to silence or change its musical length.
  const span = Math.min(Math.round(buffer.sampleRate * 0.008), Math.floor(buffer.length / 4));
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel), last = data.length - 1;
    const slope = ((data[1] - data[0]) + (data[last] - data[last - 1])) / 2;
    const error = data[0] - data[last] - slope;
    if (Math.abs(error) > 0.08) throw new Error('Music asset has a discontinuous loop');
    for (let i = 0; i < span; i++) {
      const t = i / (span - 1), weight = 1 - 3 * t * t + 2 * t * t * t;
      data[i] -= error * 0.5 * weight; data[last - i] += error * 0.5 * weight;
    }
  }
  return buffer;
}

export async function loadTrackAssets(id, context) {
  const score = buildScore(id);
  let lastError;
  // Vorbis has a defined sample length. PCM WAV is the fallback for browsers without an Ogg decoder.
  for (const extension of ['ogg','wav']) {
    try {
      const response = await fetch(new URL('../assets/music/' + id + '.' + extension, import.meta.url));
      if (!response.ok) throw new Error('Music asset unavailable: ' + response.status);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      const expected = score.seconds, error = Math.abs(buffer.duration - expected);
      if (error > 0.02) throw new Error('Unexpected music loop length');
      alignLoopSeam(buffer);
      return { id, buffer, score, bytes: buffer.length * buffer.numberOfChannels * 4 };
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

// The continuous audio clock owns playback. Drawing, chunk builds and timer jitter never schedule notes.
export function createJourneyMusic(options = {}) {
  let storage = options.storage; if (storage === undefined) try { storage = globalThis.localStorage; } catch {}
  const prefix = options.keyPrefix || 'windlover.journey-music.v1';
  const read = (key, fallback) => { try { const value = storage?.getItem(prefix + '.' + key); return value === null || value === undefined ? fallback : JSON.parse(value); } catch { return fallback; } };
  const save = (key, value) => { try { storage?.setItem(prefix + '.' + key, JSON.stringify(value)); } catch {} };
  let enabled = read('enabled', false) === true, selected = read('track', TRACKS[0].id), volume = read('volume', 0.6);
  if (!TRACKS.some(t => t.id === selected)) selected = TRACKS[0].id;
  if (typeof volume !== 'number' || !Number.isFinite(volume)) volume = 0.6;
  volume = clamp(volume, 0, 1);
  let context = options.context || null, ownContext = !context, master = null, disposed = false, epoch = 0;
  let active = null, outgoing = null, resumeOffset = 0, offsetTrack = null, status = 'off', lastError = null, hidden = false;
  let renderChain = Promise.resolve(), switchTimer = null;
  const cache = new Map(), pending = new Map(), allVoices = new Set();
  const state = () => ({ enabled, track: selected, title: TRACKS.find(t => t.id === selected).title, volume, status, error: lastError, cachedBytes: [...cache.values()].reduce((n,t) => n + t.bytes, 0) });
  const notify = () => { try { options.onChange?.(state()); } catch {} };
  const fail = error => { lastError = String(error?.message || error); status = 'unavailable'; notify(); return false; };
  function ensureContext() {
    if (!context && options.getContext) {
      context = options.getContext();
      if (context) ownContext = false;
    }
    if (!context || context.state === 'closed') {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) throw new Error('Audio is not supported');
      context = new Audio(); ownContext = true; master = null;
    }
    if (!master) {
      master = context.createGain(); master.gain.value = volume * 0.7;
      const limiter = context.createDynamicsCompressor(); limiter.threshold.value = -8; limiter.knee.value = 6; limiter.ratio.value = 4;
      master.connect(limiter); limiter.connect(options.destination || context.destination);
    }
    return context;
  }
  const gainAt = (voice, at) => voice.end <= voice.at ? voice.to : voice.from + (voice.to - voice.from) * clamp((at - voice.at) / (voice.end - voice.at), 0, 1);
  function ramp(voice, value, seconds) {
    const now = context.currentTime, current = gainAt(voice, now), param = voice.gain.gain;
    param.cancelScheduledValues(now); param.setValueAtTime(current, now); param.linearRampToValueAtTime(value, now + seconds);
    Object.assign(voice, { from: current, to: value, at: now, end: now + seconds });
  }
  function retire(voice, seconds) {
    if (!voice || voice.stopping) return;
    voice.stopping = true; ramp(voice, 0, seconds); voice.source.stop(context.currentTime + seconds + 0.03);
  }
  function stop() {
    epoch++; clearTimeout(switchTimer); switchTimer = null;
    if (active && context) { resumeOffset = modulo(context.currentTime - active.started + active.offset, active.track.buffer.duration); offsetTrack = active.track.id; }
    for (const voice of allVoices) {
      if (voice.stopping) { ramp(voice, 0, 0.2); continue; }
      retire(voice, 0.2);
    }
    active = null; outgoing = null;
  }
  function prepare(id) {
    if (cache.has(id)) return Promise.resolve(cache.get(id));
    if (pending.has(id)) return pending.get(id);
    const job = renderChain.then(async () => {
      if (disposed || id !== selected || !enabled || hidden) return null;
      // Evict an unused loop before decoding another, keeping the live pair bounded.
      for (const key of cache.keys()) if (key !== active?.track.id) cache.delete(key);
      const track = await (options.loadTrack || loadTrackAssets)(id, context);
      if (!disposed && id === selected && enabled) {
        cache.set(id, track);
        while (cache.size > 2) cache.delete([...cache.keys()].find(key => key !== id && key !== active?.track.id));
      }
      return track;
    });
    pending.set(id, job); renderChain = job.catch(() => {});
    job.finally(() => pending.delete(id)).catch(() => {}); return job;
  }
  function activate(track, token) {
    if (!track || token !== epoch || disposed || !enabled || hidden) return false;
    if (active?.track.id === track.id) { status = 'playing'; notify(); return true; }
    if (outgoing && context.currentTime < outgoing.end + 0.04) {
      clearTimeout(switchTimer); switchTimer = setTimeout(() => activate(track, token), Math.max(30, (outgoing.end + 0.05 - context.currentTime) * 1000));
      return true;
    }
    const now = context.currentTime, source = context.createBufferSource(), gain = context.createGain();
    source.buffer = track.buffer; source.loop = true; source.loopStart = 0; source.loopEnd = track.buffer.duration;
    source.connect(gain); gain.connect(master); gain.gain.value = 0;
    const offset = offsetTrack === track.id ? resumeOffset : 0, voice = { source, gain, track, started: now + 0.02, offset, from: 0, to: 0, at: now, end: now, stopping: false };
    allVoices.add(voice);
    source.onended = () => { source.disconnect(); gain.disconnect(); allVoices.delete(voice); if (outgoing === voice) outgoing = null; };
    source.start(voice.started, modulo(offset, track.buffer.duration));
    if (active) { outgoing = active; retire(outgoing, 0.9); }
    active = voice; ramp(voice, 1, 0.9); offsetTrack = null; resumeOffset = 0; lastError = null; status = 'playing'; notify();
    return true;
  }
  async function unlock() {
    if (disposed || !enabled || hidden) return false;
    const token = ++epoch;
    try {
      const audio = ensureContext();
      // Called synchronously from the gesture before awaiting any asset preparation.
      if (audio.state !== 'running') await audio.resume();
      if (token !== epoch || disposed || !enabled || hidden) return false;
      if (active?.track.id === selected) { status = 'playing'; notify(); return true; }
      status = active ? 'switching' : 'preparing'; lastError = null; notify();
      return activate(await prepare(selected), token);
    } catch (error) { return token === epoch ? fail(error) : false; }
  }
  function setEnabled(value) {
    if (disposed) return Promise.resolve(false);
    enabled = Boolean(value); save('enabled', enabled);
    if (enabled) return unlock();
    stop(); status = 'off'; notify(); return Promise.resolve(true);
  }
  function select(id) {
    if (!TRACKS.some(t => t.id === id)) throw new RangeError('Unknown Wind Lover composition: ' + id);
    if (disposed) return Promise.resolve(false);
    if (selected !== id) { selected = id; save('track', id); }
    notify(); return enabled ? unlock() : Promise.resolve(true);
  }
  function setVolume(value) {
    if (!Number.isFinite(Number(value))) return volume;
    volume = clamp(Number(value), 0, 1); save('volume', volume);
    if (master && context) master.gain.setTargetAtTime(volume * 0.7, context.currentTime, 0.035);
    notify(); return volume;
  }
  const visibility = () => {
    hidden = Boolean(globalThis.document?.hidden);
    if (hidden) { stop(); status = enabled ? 'paused' : 'off'; notify(); }
    else if (enabled) unlock();
  };
  globalThis.document?.addEventListener('visibilitychange', visibility);
  async function dispose() {
    if (disposed) return;
    stop(); disposed = true; cache.clear(); globalThis.document?.removeEventListener('visibilitychange', visibility);
    if (context?.state !== 'running') for (const voice of allVoices) { voice.source.disconnect(); voice.gain.disconnect(); }
    if (context && ownContext) { await new Promise(resolve => setTimeout(resolve, 250)); await context.close().catch(() => {}); }
    else if (master) setTimeout(() => master.disconnect(), 250);
  }
  return { unlock, setEnabled, select, setVolume, dispose, get state() { return state(); },
    inspect: () => ({ voices: allVoices.size, playingTrack: active?.track.id || null, cached: [...cache.keys()], pending: [...pending.keys()], contextState: context?.state || 'none', ownContext }) };
}
