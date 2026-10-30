import { RIDING_TRACKS } from './quiet-score.mjs?v=20261030-atmosphere';
const brave=new Set(RIDING_TRACKS.filter(t=>t.energy==='brave').map(t=>t.id));
// Visits and complete musical phrases choose songs; menus and boundary noise never churn playback.
export const ROUTE_POOLS = Object.freeze({
  desert: ['rust-horizon','last-caravan','copper-mirage','forgotten-siding','dune-riders','railbound-heart','saffron-riders','seven-red-cliffs','steppe-signal'],
  mountain: ['blue-viaduct','last-caravan','tian-shan-pass','snowlight','tian-shan-charge','dune-riders','pass-of-thunder','seven-red-cliffs','turquoise-cavalcade'],
  lake: ['glass-current','blue-viaduct','issyk-dawn','shoreline-afterglow','skyward-current','tian-shan-charge','turquoise-cavalcade','seven-red-cliffs','cities-in-the-wind'],
  steppe: ['last-caravan','blue-viaduct','jailoo-wind','felt-and-stars','dune-riders','tian-shan-charge','steppe-signal','saffron-riders','pass-of-thunder'],
  city: ['rust-horizon','glass-current','forgotten-siding','shoreline-afterglow','railbound-heart','skyward-current','cities-in-the-wind','steppe-signal','turquoise-cavalcade'],
  'monsoon-bay':['bay-glass','rain-on-lattice','reef-after-rain','runway-swallow','skyward-current','glass-current'],
  'monsoon-edo':['crows-at-dusk','sunset-reins','rain-on-lattice','birch-lake','vermillion-tide','indigo-gorge'],
  'monsoon-angkor':['stone-and-rain','lotus-stone','roots-of-the-sky','birch-lake','straits-tide','river-neon'],
  'monsoon-khaosan':['khaosan-afterlight','river-neon','lotus-stone','stone-and-rain','straits-tide','roots-of-the-sky'],
  'monsoon-donmueang':['runway-swallow','bay-glass','rain-on-lattice','skyward-current','river-neon','reef-after-rain'],
  'monsoon-straits':['straits-tide','vermillion-tide','reef-after-rain','river-neon','lotus-stone','birch-lake'],
  'monsoon-kanazawa':['rain-on-lattice','bay-glass','crows-at-dusk','sunset-reins','birch-lake','indigo-gorge'],
  'monsoon-shikoku':['indigo-gorge','sunset-reins','birch-lake','rain-on-lattice','karst-eagle','stone-and-rain'],
  'monsoon-inner':['roots-of-the-sky','stone-and-rain','lotus-stone','birch-lake','straits-tide','karst-eagle'],
  'monsoon-thai':['river-neon','khaosan-afterlight','stone-and-rain','lotus-stone','straits-tide','roots-of-the-sky'],
  'monsoon-ryukyu':['vermillion-tide','sunset-reins','crows-at-dusk','straits-tide','reef-after-rain','birch-lake'],
  'monsoon-okinawa':['reef-after-rain','straits-tide','vermillion-tide','river-neon','bay-glass','rain-on-lattice'],
  'monsoon-ainu':['birch-lake','rain-on-lattice','straits-tide','roots-of-the-sky','sunset-reins','indigo-gorge'],
  'monsoon-hagiang':['karst-eagle','indigo-gorge','stone-and-rain','roots-of-the-sky','straits-tide','river-neon'],
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
  let region = null, rotating=false,pendingRegion=null;const history=[music.state.track];
  function nextTrack(){
    const pool=ROUTE_POOLS[region]||ROUTE_POOLS.steppe;
    // Inside a district, alternate its two local arrangements rather than importing an unrelated scene.
    if(region?.startsWith('monsoon-')){const id=pool.slice(0,2).find(id=>id!==music.state.track)||pool[0];history.push(id);if(history.length>4)history.shift();return id;}
    const recent=new Set(history.slice(-3).concat(music.state.track));
    let choices=pool.filter(id=>!recent.has(id));
    const lastBrave=brave.has(music.state.track),quietPair=history.length>=2&&history.slice(-2).every(id=>!brave.has(id));
    const balanced=choices.filter(id=>(lastBrave||history.length===1)?!brave.has(id):quietPair?brave.has(id):true);
    if(balanced.length)choices=balanced;
    const id=choices.length?choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))]:chooseRouteTrack(region,music.state.track,random);
    history.push(id);if(history.length>4)history.shift();return id;
  }
  const isSampler=id=>Boolean(id?.startsWith('monsoon-'));
  const themes={bay:'bay-glass',edo:'crows-at-dusk',angkor:'stone-and-rain',khaosan:'khaosan-afterlight',donmueang:'runway-swallow',straits:'straits-tide',kanazawa:'rain-on-lattice',shikoku:'indigo-gorge',inner:'roots-of-the-sky',thai:'river-neon',ryukyu:'vermillion-tide',okinawa:'reef-after-rain',ainu:'birch-lake',hagiang:'karst-eagle'};
  async function sampleChange(boundary=false){
    if(rotating)return false;rotating=true;const requested=region;
    try{
      let id=boundary?themes[region?.slice(8)]:null;
      if(id===music.state.track){if(pendingRegion===requested)pendingRegion=null;return false;}
      if(!id)id=nextTrack();
      else {history.push(id);if(history.length>4)history.shift();}
      const changed=await music.select(id,{fade:3});
      if(pendingRegion===requested)pendingRegion=null;return changed;
    }finally{rotating=false;}
  }
  function enter(next, force = false) {
    if (!next || (!force && region === next)) return Promise.resolve(false);
    const fromSampler=isSampler(region);region=next;
    if(isSampler(next)){
      pendingRegion=next;
      if(!automatic)return Promise.resolve(false);
      if(force||!fromSampler)return sampleChange(true);
      // A stable boundary queues the new scene's theme; tick applies the minimum musical dwell.
      return Promise.resolve(false);
    }
    pendingRegion=null;
    return automatic ? music.select(nextTrack(),{fade:2.4}) : Promise.resolve(false);
  }
  async function tick({active=true,phase='scenic',moving=true}={}){
    if(isSampler(region)){
      if(!automatic||!active||!moving||rotating||music.state.status!=='playing')return false;
      const age=music.inspect().playingSeconds;
      if(pendingRegion&&age>=14)return sampleChange(true);
      if(!pendingRegion&&age>=38)return sampleChange(false);
      return false;
    }
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
  return { enter, tick, setAutomatic, get automatic() { return automatic; }, get region() { return region; },get history(){return history.slice();},get pendingRegion(){return pendingRegion;} };
}
