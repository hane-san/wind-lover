// Six original travelling pieces; no imported tune or external recording.
const pieces=[
 {id:'turquoise-cavalcade',title:'碧い湖の騎行',bpm:116,root:38,meter:4,lead:'lute',flavour:'gallop',motif:[19,22,24,26,24,22,19,17],taste:'116 BPM · 太鼓と撥弦、湖を渡る騎行'},
 {id:'pass-of-thunder',title:'雷鳴の峠',bpm:108,root:40,meter:3,lead:'horn',flavour:'procession',motif:[12,19,22,24,19,17,15,14],taste:'108 BPM · 角笛と低い弦、勇ましい三拍子'},
 {id:'steppe-signal',title:'草原の交信',bpm:128,root:35,meter:4,lead:'warm',flavour:'pulse',motif:[24,22,19,17,19,26,24,19],taste:'128 BPM · 広いシンセと低音、草原の疾走'},
 {id:'seven-red-cliffs',title:'赤い七つの峰',bpm:104,root:43,meter:4,lead:'reed',flavour:'handdrum',motif:[19,20,24,22,19,15,17,12],taste:'104 BPM · 笛と手太鼓、赤い渓谷の冒険'},
 {id:'cities-in-the-wind',title:'風に眠る未来都市',bpm:136,root:33,meter:4,lead:'keys',flavour:'breaks',motif:[24,26,31,29,26,24,22,19],taste:'136 BPM · ガラスの鍵盤とブレイク、遠い未来都市'},
 {id:'saffron-riders',title:'砂塵の凱歌',bpm:120,root:38,meter:4,lead:'horn',flavour:'march',motif:[12,19,24,22,19,17,19,24],taste:'120 BPM · 角笛と乾いた太鼓、砂塵を抜ける凱歌'},
];
export const EXPEDITION_TRACKS=Object.freeze(pieces.map(p=>Object.freeze({...p,bars:32,energy:'brave',arrangement:'riding'})));
export function buildExpeditionScore(id){
 const track=EXPEDITION_TRACKS.find(p=>p.id===id);if(!track)throw new RangeError('Unknown voyage composition: '+id);
 const events=[],totalBeats=track.bars*track.meter,add=(beat,duration,midi,voice,velocity,pan=0)=>events.push({beat,duration,midi,voice,velocity,pan});
 const chords=[[0,7,14,19],[-4,3,10,15],[-7,0,7,14],[-2,5,12,17],[0,7,15,19],[-9,-2,7,15],[-4,3,10,17],[0,7,14,19]];
 for(let section=0;section<8;section++){
  const start=section*totalBeats/8,span=totalBeats/8,chord=chords[section];
  add(start,span-.2,track.root+chord[0],'drone',.027);
  for(let i=1;i<4;i++)add(start+.08*i,span-.5,track.root+12+chord[i],'bowed',.031,(i-2)*.32);
  for(let b=0;b<span;b+=track.meter){
   add(start+b,.18,track.root+chord[0],'bass',.075,-.05);add(start+b,.12,40,'kick',.080);
   add(start+b+track.meter*.5,.12,43,track.flavour==='breaks'?'snare':'tom',.055,.22);
   if(track.flavour==='pulse'||track.flavour==='breaks')for(const off of [.5,1.5,2.5,3.5])if(off<track.meter)add(start+b+off,.05,48,'hat',.018,-.24);
   if(track.flavour==='gallop'||track.flavour==='handdrum')for(const off of [.75,1.5,2.75,3.5])if(off<track.meter)add(start+b+off,.10,43,'tom',.036,off%2?.28:-.28);
   if(track.flavour==='march')add(start+b+3,.10,43,'snare',.045,.12);
  }
  // Each phrase answers the preceding one; the final section leaves its last two beats to the wind.
  const phrase=track.motif.map((n,i)=>n+(section===3&&i<4?3:section===6&&i>3?-2:0));
  for(let i=0;i<8;i++){
   if(section===7&&i>5)continue;
   const offset=i*span/8+(i%2?.16:.08),length=Math.min(span/8*.72,1.6);
   add(start+offset,length,track.root+phrase[i],track.lead,.083+(i===0?.012:0),(section%2?-.08:.08));
   if(section%2===1&&i%2===0)add(start+offset+.12,length*.8,track.root+phrase[i]-12,'lute',.038,-.3);
  }
 }
 events.sort((a,b)=>a.beat-b.beat);return {...track,totalBeats,seconds:totalBeats*60/track.bpm,events};
}
