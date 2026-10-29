import { RIDING_TRACKS } from './quiet-score.mjs?v=20261029-voyage';
const brave=new Set(RIDING_TRACKS.map(t=>t.id));
// Visits and complete musical phrases choose songs; menus and boundary noise never churn playback.
export const ROUTE_POOLS = Object.freeze({
  desert: ['rust-horizon','last-caravan','copper-mirage','forgotten-siding','dune-riders','railbound-heart','saffron-riders','seven-red-cliffs','steppe-signal'],
  mountain: ['blue-viaduct','last-caravan','tian-shan-pass','snowlight','tian-shan-charge','dune-riders','pass-of-thunder','seven-red-cliffs','turquoise-cavalcade'],
  lake: ['glass-current','blue-viaduct','issyk-dawn','shoreline-afterglow','skyward-current','tian-shan-charge','turquoise-cavalcade','seven-red-cliffs','cities-in-the-wind'],
  steppe: ['last-caravan','blue-viaduct','jailoo-wind','felt-and-stars','dune-riders','tian-shan-charge','steppe-signal','saffron-riders','pass-of-thunder'],
  city: ['rust-horizon','glass-current','forgotten-siding','shoreline-afterglow','railbound-heart','skyward-current','cities-in-the-wind','steppe-signal','turquoise-cavalcade'],
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
  let region = null, rotating=false;const history=[music.state.track];
  function nextTrack(){
    const pool=ROUTE_POOLS[region]||ROUTE_POOLS.steppe;
    const recent=new Set(history.slice(-3).concat(music.state.track));
    let choices=pool.filter(id=>!recent.has(id));
    const lastBrave=brave.has(music.state.track),quietPair=history.length>=2&&history.slice(-2).every(id=>!brave.has(id));
    const balanced=choices.filter(id=>(lastBrave||history.length===1)?!brave.has(id):quietPair?brave.has(id):true);
    if(balanced.length)choices=balanced;
    const id=choices.length?choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))]:chooseRouteTrack(region,music.state.track,random);
    history.push(id);if(history.length>4)history.shift();return id;
  }
  function enter(next, force = false) {
    if (!next || (!force && region === next)) return Promise.resolve(false);
    region = next;
    return automatic ? music.select(nextTrack(),{fade:2.4}) : Promise.resolve(false);
  }
  async function tick({active=true,phase='scenic'}={}){
    if(!automatic||!region||!active||rotating||music.state.status!=='playing'||!['scenic','release'].includes(phase))return false;
    const info=music.inspect();
    if(!(info.playingSeconds>=Math.max(55,info.duration-.9)))return false;
    rotating=true;
    try{return await music.select(nextTrack(),{fade:2.4});}finally{rotating=false;}
  }
  function setAutomatic(value) {
    automatic = Boolean(value);
    try { storage?.setItem(key, automatic ? 'auto' : 'manual'); } catch {}
    return automatic && region ? enter(region, true) : Promise.resolve(true);
  }
  return { enter, tick, setAutomatic, get automatic() { return automatic; }, get region() { return region; },get history(){return history.slice();} };
}
