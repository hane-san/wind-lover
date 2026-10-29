// Eight original regional themes. No borrowed melody, traditional recording or voice sample.
const pieces=[
 {id:'rain-on-lattice',title:'雨の格子と金の街',bpm:112,meter:4,bars:32,root:41,lead:'keys',reply:'glass',energy:'quiet',rhythm:'swing',motif:[24,19,22,26,29,26,22,17,19,24,22,14],steps:[0,.75,1.5,2.75,4,4.75,6,7.5,8,9.25,11,13.5],chords:[[0,3,7,10],[-5,2,5,9],[-2,2,5,9],[-7,0,4,7]],taste:'112 BPM · 雨の鍵盤と揺れる低音、現代金沢'},
 {id:'indigo-gorge',title:'藍の渓谷を越えて',bpm:126,meter:7,bars:16,root:43,lead:'reed',reply:'lute',energy:'brave',rhythm:'seven',motif:[12,19,17,24,22,19,14,17,26,24,19,12],steps:[0,.5,1.5,3,4,5,6.5,7,8.5,10,12,13],chords:[[0,7,12,17],[-5,2,9,14],[-2,5,10,17],[-7,0,7,14]],taste:'126 BPM · 3＋2＋2の笛と撥弦、四国の急流'},
 {id:'roots-of-the-sky',title:'空を抱く根',bpm:102,meter:3,bars:32,root:38,lead:'glass',reply:'horn',energy:'brave',rhythm:'stone',motif:[24,25,19,17,20,24,31,29,25,24,19,13],steps:[0,.5,1.5,3,4.5,5.5,6,7.5,9,10.5,12,14],chords:[[0,7,13,19],[-1,6,12,18],[-5,2,8,15],[-7,0,6,13]],taste:'102 BPM · 低い角笛と鐘、アンコールの奥の森'},
 {id:'river-neon',title:'水都のネオン舟',bpm:128,meter:4,bars:32,root:45,lead:'pluck',reply:'warm',energy:'brave',rhythm:'delta',motif:[19,24,28,26,24,19,21,16,19,26,28,24],steps:[0,.75,1.25,2.5,3.75,5,6.25,7.5,8.75,10,12,14.5],chords:[[0,4,7,14],[-5,2,7,11],[-3,4,9,14],[-7,0,4,9]],taste:'128 BPM · 跳ねる撥音とシンセ、水辺のタイ'},
 {id:'vermillion-tide',title:'朱の城壁、潮の唄',bpm:108,meter:4,bars:32,root:43,lead:'lute',reply:'keys',energy:'quiet',rhythm:'island',motif:[12,11,7,5,7,11,12,16,17,16,12,7],steps:[0,1,2.5,4,5,6.5,8,9,10.5,12,13.5,15],chords:[[0,4,7,11],[-5,0,4,7],[-1,4,7,12],[-5,0,5,11]],taste:'108 BPM · 五音の新しい旋律と乾いた太鼓、琉球の夕映え'},
 {id:'reef-after-rain',title:'雨上がりの珊瑚航路',bpm:138,meter:4,bars:32,root:45,lead:'air',reply:'glass',energy:'brave',rhythm:'breaks',motif:[24,31,30,26,28,24,21,19,26,33,31,28],steps:[0,.5,1.5,3,4.5,5.5,7,8,9.5,11,12.5,14],chords:[[0,4,7,14],[-5,2,9,16],[-2,5,12,19],[-7,0,7,14]],taste:'138 BPM · 浮遊する笛とブレイク、沖縄の青い空'},
 {id:'birch-lake',title:'白樺と湖の風',bpm:104,meter:3,bars:32,root:40,lead:'reed',reply:'warm',energy:'quiet',rhythm:'north',motif:[19,14,12,17,19,24,22,17,12,10,14,19],steps:[0,1.5,3,4,5,6,7.5,9,10.5,12,13,14],chords:[[0,7,12,19],[-5,2,7,14],[-2,5,12,17],[-7,0,7,12]],taste:'104 BPM · 木のような笛と淡い脈動、北の森と湖'},
 {id:'karst-eagle',title:'石の高原を翔ける',bpm:132,meter:5,bars:24,root:38,lead:'horn',reply:'pluck',energy:'brave',rhythm:'five',motif:[12,19,24,22,17,15,19,26,27,24,19,14],steps:[0,.5,2,3.5,5,6,7.5,9,10,12,13.5,15],chords:[[0,7,14,19],[-4,3,10,15],[-7,0,7,14],[-2,5,12,17]],taste:'132 BPM · 五拍子の角笛と駆ける弦、ハジャンの岩稜'},
];
export const ATLAS_TRACKS=Object.freeze(pieces.map(p=>Object.freeze({...p,arrangement:'riding'})));
export function buildAtlasScore(id){
 const t=ATLAS_TRACKS.find(p=>p.id===id);if(!t)throw new RangeError('Unknown atlas theme: '+id);
 const events=[],beats=t.bars*t.meter,span=beats/8,add=(at,duration,midi,voice,velocity,pan=0)=>{if(at>=beats)return;events.push({beat:at,duration:Math.min(duration,beats-at),midi,voice,velocity,pan});};
 for(let section=0;section<8;section++){
  const start=section*span,ch=t.chords[section%4];add(start,span-.2,t.root+ch[0],'drone',.025);
  for(let n=1;n<4;n++)add(start+.12*n,span-.6,t.root+ch[n]+12,'bowed',.024,(n-2)*.3);
  for(let b=0;b<span;b+=t.meter){
   add(start+b,.15,t.root+ch[0],'bass',.065);add(start+b,.10,40,'kick',.065);
   const accents=t.rhythm==='seven'?[3,5]:t.rhythm==='five'?[2,3.5]:t.rhythm==='stone'?[1,2.5]:[t.meter/2];
   for(const off of accents)if(b+off<span)add(start+b+off,.11,43,t.rhythm==='breaks'?'snare':'tom',.045,.17);
   if(['delta','breaks','swing'].includes(t.rhythm))for(let off=.5;off<t.meter;off+=1)if(b+off<span)add(start+b+off,.04,48,'hat',.016,-.2);
  }
  for(let i=0;i<t.motif.length;i++){
   if(section===7&&i>8)continue;const at=start+t.steps[i]/16*span,n=t.motif[i]+(section===4&&i%3===0?12:0),duration=Math.min(1.45,(i%3===0?.95:.62)*span/8);
   add(at,duration,t.root+n,t.lead,.077+(i===0?.014:0),-.07);
   if(i%3===1&&section%2===1)add(at+.23,duration*.8,t.root+n-12,t.reply,.042,.3);
  }
 }
 events.sort((a,b)=>a.beat-b.beat);return{...t,totalBeats:beats,seconds:beats*60/t.bpm,events};
}
