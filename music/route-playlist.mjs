// A visit chooses once; menu opens and position polling do not roll the dice again.
export const ROUTE_POOLS = Object.freeze({
  desert: ['rust-horizon','last-caravan','copper-mirage','forgotten-siding'],
  mountain: ['blue-viaduct','last-caravan','tian-shan-pass','snowlight'],
  lake: ['glass-current','blue-viaduct','issyk-dawn','shoreline-afterglow'],
  steppe: ['last-caravan','blue-viaduct','jailoo-wind','felt-and-stars'],
  city: ['rust-horizon','glass-current','forgotten-siding','shoreline-afterglow'],
});
export function chooseRouteTrack(region, previous, random = Math.random) {
  const pool = ROUTE_POOLS[region] || ROUTE_POOLS.steppe;
  const candidates = pool.filter(id => id !== previous);
  return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))];
}
export function createRoutePlaylist(music, { storage, random = Math.random } = {}) {
  if (storage === undefined) try { storage = globalThis.localStorage; } catch {}
  const key = 'windlover.route-music.v1';
  let automatic = true;
  try { automatic = storage?.getItem(key) !== 'manual'; } catch {}
  let region = null;
  function enter(next, force = false) {
    if (!next || (!force && region === next)) return Promise.resolve(false);
    region = next;
    return automatic ? music.select(chooseRouteTrack(region, music.state.track, random)) : Promise.resolve(false);
  }
  function setAutomatic(value) {
    automatic = Boolean(value);
    try { storage?.setItem(key, automatic ? 'auto' : 'manual'); } catch {}
    return automatic && region ? enter(region, true) : Promise.resolve(true);
  }
  return { enter, setAutomatic, get automatic() { return automatic; }, get region() { return region; } };
}
