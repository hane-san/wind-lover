import { TRACKS as originals } from './scores.mjs?v=20261022';

// Original chamber arrangements: modal falling phrases, held strings and unfilled bars.
// IDs and regional choices stay stable, including a manually saved song.
const roots = [38,35,40,45,40,33,38,42,43,36,43,35];
const tempi = [68,72,66,70,64,68,66,60,64,62,70,64];
const phrases = [
  [19,17,15,14,12,14], [24,22,19,17,15,14], [19,22,19,17,14,12],
  [12,15,19,17,15,14], [19,20,19,15,14,12], [24,19,17,15,12,14],
  [19,24,22,19,17,14], [24,26,24,22,19,17], [19,17,14,15,14,12],
  [24,22,19,15,17,14], [12,19,17,15,14,12], [19,22,24,19,17,14],
];
export const TRACKS = Object.freeze(originals.map((t,i) => Object.freeze({
  ...t, bpm:tempi[i], bars:t.meter===3?24:16, arrangement:'quiet',
  taste:tempi[i]+' BPM · 遠い弦と笛、余白のある旅',
})));

export function buildScore(id) {
  const index=TRACKS.findIndex(t=>t.id===id);
  if(index<0)throw new RangeError('Unknown Wind Lover composition: '+id);
  const track=TRACKS[index],root=roots[index],events=[];
  const add=(beat,duration,midi,voice,velocity,pan=0)=>events.push({beat,duration,midi,voice,velocity,pan});
  const totalBeats=track.bars*track.meter,span=totalBeats/8;
  const chords=[[0,3,7,14],[-4,3,7,12],[-9,3,7,10],[-2,2,7,10],[-7,0,5,10],[0,3,7,14],[-4,3,7,12],[-5,2,7,14]];
  for(let section=0;section<8;section++){
    const beat=section*span,chord=chords[section];
    // No kick, snare, hi-hat or repeating bass ostinato: hooves and wind carry the motion.
    add(beat,span-.2,root+chord[0],'drone',.034);
    chord.slice(1).forEach((n,i)=>add(beat+.12+i*.11,span-.65,root+12+n,'bowed',.027,(i-1)*.36));
    add(beat+1.25,2.6,root+12+chord[1],'lute',.066,-.3);
    if(section%2===0)add(beat+span*.64,2.4,root+12+chord[2],'lute',.043,.27);
  }
  const phraseSpan=totalBeats/4,offsets=[.65,2.4,4.2,6.1,9.2,11.6];
  for(let phrase=0;phrase<4;phrase++){
    const pitches=phrases[(index+(phrase===2?4:0))%phrases.length];
    for(let i=0;i<6;i++){
      // A different answer in the third phrase; the last phrase lets the wind finish it.
      if(phrase===3&&i>3)continue;
      const beat=phrase*phraseSpan+offsets[i]/16*phraseSpan;
      const next=i===5?phraseSpan:offsets[i+1]/16*phraseSpan;
      const length=Math.min(2.9,(next-offsets[i]/16*phraseSpan)*.73);
      add(beat,length,root+pitches[i], 'reed', i===0?.078:.069,-.09);
      if(phrase===2&&i===2)add(beat+.2,length*1.4,root+pitches[i]-12,'bowed',.026,.25);
    }
  }
  events.sort((a,b)=>a.beat-b.beat);
  return {...track,events,totalBeats,seconds:totalBeats*60/track.bpm};
}
