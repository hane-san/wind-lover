// New compositions for Wind Lover. No melodies or scores are imported from another game.
export const TRACKS = Object.freeze([
  { id: 'rust-horizon', title: '錆びた水平線', taste: '124 BPM · 黄昏のシンセウェーブ', bpm: 124, meter: 4, bars: 32,
    lead: 'warm', arp: 'glass', groove: 'motor',
    harmony: [[38,50,53,57,64],[34,50,53,57,62],[41,53,57,60,67],[36,52,55,60,62],
              [38,50,53,57,60],[31,50,53,57,62],[34,50,53,57,60],[33,49,55,57,64]],
    melody: [[76,74,69,72,77,76,74,72,69,67],[74,77,81,79,76,77,74,72,69,72],
             [76,81,84,81,79,77,76,74,72,69],[73,76,79,81,76,74,73,69,67,69]] },
  { id: 'glass-current', title: '遠い街の残響', taste: '172 BPM · リキッド・ブレイクビーツ', bpm: 172, meter: 4, bars: 32,
    lead: 'keys', arp: 'glass', groove: 'break',
    harmony: [[35,59,62,66,73],[31,55,59,62,66],[38,57,62,66,69],[33,57,61,64,71],
              [35,57,62,66,73],[28,55,59,62,66],[31,55,59,62,69],[33,57,61,64,71]],
    melody: [[78,74,73,69,71,78,81,78,76,74],[78,81,85,83,81,78,76,78,73,71],
             [83,81,78,74,76,78,81,78,76,73],[76,73,69,71,73,76,78,76,73,71]] },
  { id: 'blue-viaduct', title: '宙を渡る青', taste: '108 BPM · 浮遊するポストロック', bpm: 108, meter: 4, bars: 32,
    lead: 'air', arp: 'pluck', groove: 'float',
    harmony: [[40,55,59,64,66],[36,55,59,62,64],[43,55,59,62,69],[38,54,57,62,64],
              [40,55,59,62,66],[33,55,59,61,64],[36,55,59,62,67],[38,54,57,62,64]],
    melody: [[78,76,71,74,78,81,79,78,76,74],[79,78,76,74,71,74,76,78,76,74],
             [83,81,78,79,83,86,83,81,79,78],[78,76,74,71,69,71,74,76,74,71]] },
  { id: 'last-caravan', title: '風にほどける車窓', taste: '132 BPM · 弦と乾いた打楽器の6/8', bpm: 132, meter: 3, bars: 32,
    lead: 'pluck', arp: 'warm', groove: 'six',
    harmony: [[45,57,60,64,71],[41,57,60,64,67],[43,55,59,62,69],[40,55,59,64,67],
              [45,57,60,64,67],[38,57,60,64,69],[41,57,60,64,67],[40,56,59,62,64]],
    melody: [[76,72,71,69,64,67,71,72,69,67],[72,76,79,77,76,72,71,69,67,64],
             [81,79,76,72,74,76,79,76,72,71],[71,68,64,67,71,74,72,71,68,69]] },
  {"id": "copper-mirage", "title": "銅色の蜃気楼", "taste": "116 BPM · 旅を押すシンセの鼓動", "bpm": 116, "meter": 4, "bars": 32, "lead": "pluck", "arp": "glass", "groove": "motor", "harmony": [[40, 55, 59, 62, 66], [36, 55, 59, 64, 67], [38, 54, 57, 62, 69], [35, 54, 59, 62, 66], [40, 55, 59, 64, 71], [43, 55, 59, 62, 69], [36, 55, 60, 64, 67], [38, 54, 57, 62, 64]], "melody": [[71, 74, 78, 76, 74, 71, 67, 69, 71, 66], [74, 76, 79, 78, 74, 71, 69, 67, 64, 67], [78, 83, 81, 78, 76, 74, 71, 74, 78, 76], [69, 71, 74, 78, 76, 74, 71, 69, 66, 64]]},
  {"id": "forgotten-siding", "title": "忘れられた側線", "taste": "128 BPM · 旅を押すシンセの鼓動", "bpm": 128, "meter": 4, "bars": 32, "lead": "warm", "arp": "keys", "groove": "motor", "harmony": [[33, 52, 55, 60, 64], [29, 53, 57, 60, 65], [36, 52, 55, 60, 67], [31, 50, 55, 59, 62], [33, 52, 57, 60, 64], [38, 53, 57, 62, 65], [29, 53, 57, 60, 64], [28, 52, 56, 59, 64]], "melody": [[69, 72, 76, 79, 76, 74, 72, 71, 67, 69], [72, 77, 81, 79, 77, 76, 72, 69, 67, 65], [76, 79, 84, 83, 79, 76, 74, 72, 76, 74], [71, 76, 80, 83, 80, 76, 74, 71, 68, 69]]},
  {"id": "tian-shan-pass", "title": "天山を越える風", "taste": "138 BPM · 草原の弦と歩む三拍子", "bpm": 138, "meter": 3, "bars": 32, "lead": "pluck", "arp": "warm", "groove": "six", "harmony": [[38, 50, 57, 62, 65], [34, 53, 57, 62, 65], [41, 53, 60, 65, 69], [36, 52, 55, 60, 67], [38, 53, 57, 62, 69], [31, 50, 55, 62, 65], [34, 53, 58, 62, 65], [33, 52, 57, 61, 64]], "melody": [[74, 77, 81, 77, 74, 69, 72, 74, 77, 76], [77, 81, 84, 81, 79, 77, 74, 72, 69, 65], [81, 86, 84, 81, 79, 77, 74, 77, 79, 81], [76, 73, 69, 64, 67, 69, 73, 76, 74, 69]]},
  {"id": "snowlight", "title": "雪明かりの峠", "taste": "102 BPM · 空と雪の浮遊する余韻", "bpm": 102, "meter": 4, "bars": 32, "lead": "air", "arp": "glass", "groove": "float", "harmony": [[42, 57, 61, 66, 68], [38, 57, 61, 64, 66], [45, 57, 61, 64, 71], [40, 56, 59, 64, 66], [42, 57, 61, 66, 73], [35, 54, 59, 61, 66], [38, 57, 62, 66, 69], [37, 56, 61, 65, 68]], "melody": [[73, 78, 80, 85, 80, 78, 76, 73, 71, 68], [76, 78, 81, 85, 83, 81, 78, 76, 73, 69], [80, 85, 88, 85, 83, 80, 78, 80, 83, 81], [77, 80, 85, 83, 80, 77, 73, 71, 68, 66]]},
  {"id": "issyk-dawn", "title": "イシク・クルの朝凪", "taste": "110 BPM · 空と雪の浮遊する余韻", "bpm": 110, "meter": 4, "bars": 32, "lead": "keys", "arp": "pluck", "groove": "float", "harmony": [[43, 55, 59, 62, 69], [38, 54, 57, 62, 66], [40, 55, 59, 64, 67], [36, 55, 60, 64, 71], [43, 57, 59, 62, 69], [45, 57, 60, 64, 67], [38, 54, 57, 62, 69], [31, 55, 59, 62, 66]], "melody": [[79, 78, 74, 71, 69, 74, 78, 79, 83, 81], [78, 81, 78, 76, 74, 69, 71, 74, 78, 76], [79, 83, 86, 83, 81, 79, 76, 74, 76, 79], [78, 74, 71, 69, 67, 69, 71, 74, 76, 74]]},
  {"id": "shoreline-afterglow", "title": "湖岸に残る夕映え", "taste": "164 BPM · 湖面を渡るブレイクビーツ", "bpm": 164, "meter": 4, "bars": 32, "lead": "glass", "arp": "keys", "groove": "break", "harmony": [[36, 55, 59, 62, 67], [31, 55, 59, 62, 69], [38, 57, 60, 65, 69], [33, 55, 60, 64, 67], [36, 55, 59, 64, 71], [29, 53, 57, 60, 67], [34, 53, 57, 62, 65], [31, 53, 59, 62, 67]], "melody": [[79, 74, 76, 79, 83, 81, 79, 76, 74, 71], [74, 79, 81, 86, 83, 81, 79, 76, 74, 72], [81, 84, 88, 86, 84, 81, 79, 77, 76, 72], [79, 77, 74, 71, 69, 71, 74, 77, 79, 74]]},
  {"id": "jailoo-wind", "title": "ジャイローの草を分けて", "taste": "126 BPM · 草原の弦と歩む三拍子", "bpm": 126, "meter": 3, "bars": 32, "lead": "pluck", "arp": "air", "groove": "six", "harmony": [[43, 55, 62, 67, 71], [38, 54, 57, 62, 69], [40, 55, 59, 64, 71], [36, 55, 60, 64, 67], [43, 55, 59, 62, 69], [45, 57, 60, 64, 71], [36, 55, 60, 64, 69], [38, 54, 57, 62, 66]], "melody": [[67, 71, 74, 79, 78, 74, 71, 69, 67, 62], [69, 74, 78, 81, 78, 74, 72, 69, 66, 62], [71, 76, 79, 83, 81, 79, 76, 74, 71, 67], [74, 78, 81, 79, 78, 74, 71, 69, 66, 67]]},
  {"id": "felt-and-stars", "title": "フェルトと星の道", "taste": "118 BPM · 旅を押すシンセの鼓動", "bpm": 118, "meter": 4, "bars": 32, "lead": "warm", "arp": "pluck", "groove": "motor", "harmony": [[35, 54, 59, 62, 66], [31, 55, 59, 62, 69], [40, 55, 59, 64, 67], [33, 57, 61, 64, 71], [35, 54, 59, 62, 69], [38, 54, 57, 62, 66], [31, 55, 59, 64, 67], [33, 56, 61, 64, 68]], "melody": [[71, 73, 78, 81, 78, 76, 73, 71, 69, 66], [74, 78, 83, 81, 78, 74, 71, 69, 67, 66], [76, 79, 83, 86, 83, 79, 78, 76, 74, 71], [73, 76, 80, 83, 81, 80, 76, 73, 71, 68]]},
]);

export function buildScore(id) {
  const track = TRACKS.find(t => t.id === id);
  if (!track) throw new RangeError('Unknown Wind Lover composition: ' + id);
  const events = [], add = (beat, duration, midi, voice, velocity, pan = 0) => {
    events.push({ beat, duration, midi, voice, velocity, pan });
  };
  const barBeats = track.meter, totalBeats = track.bars * barBeats;
  for (let bar = 0; bar < track.bars; bar++) {
    const beat = bar * barBeats, chord = track.harmony[Math.floor(bar / 2) % 8], section = Math.floor(bar / 8);
    const drive = section === 1 || section === 2 ? 1 : 0.78;
    if (bar % 2 === 0) chord.slice(1).forEach((note, i) => add(beat, barBeats * 2, note, 'pad', 0.029, (i - 1.5) * 0.22));
    const subdivision = track.groove === 'six' ? 0.5 : track.groove === 'break' ? 1 : 0.5;
    for (let step = 0; step < barBeats / subdivision; step++) {
      const arpNotes = [1, 3, 2, 4, 2, 3, 1, 4], pitch = chord[arpNotes[(step + bar % 2 * 3) % 8]];
      add(beat + step * subdivision, subdivision * 0.76, pitch + (track.groove === 'float' ? 12 : 0), track.arp, 0.061 * drive, step % 2 ? 0.42 : -0.42);
    }
    if (track.groove === 'motor') {
      for (let step = 0; step < 8; step++) add(beat + step * 0.5, 0.34, chord[0] + (step === 7 ? 12 : 0), 'bass', 0.15 * drive);
      for (let k = 0; k < 4; k++) add(beat + k, 0.22, 0, 'kick', 0.3 * drive);
      for (const k of [1, 3]) add(beat + k, 0.18, 0, 'snare', 0.13 * drive);
      for (let k = 0; k < 8; k++) add(beat + k * 0.5 + 0.015, 0.08, 0, 'hat', (k % 2 ? 0.037 : 0.022) * drive, k % 2 ? -0.2 : 0.2);
    } else if (track.groove === 'break') {
      for (const [offset, length, pitch] of [[0,1.4,0],[1.75,0.65,0],[2.75,0.75,12],[3.5,0.35,7]]) add(beat + offset, length, chord[0] + pitch, 'bass', 0.15 * drive);
      for (const k of (bar % 2 ? [0,1.75,2.5] : [0,1.5,2.75])) add(beat + k, 0.21, 0, 'kick', 0.27 * drive);
      for (const k of [1,3]) add(beat + k, 0.16, 0, 'snare', 0.17 * drive);
      if (bar % 2) add(beat + 2.5, 0.08, 0, 'snare', 0.04 * drive, -0.15);
      for (let k = 0; k < 8; k++) add(beat + k * 0.5 + (k % 2 ? 0.025 : 0), 0.07, 0, 'hat', (k % 2 ? 0.035 : 0.02) * drive, k % 2 ? 0.28 : -0.28);
    } else if (track.groove === 'float') {
      for (const k of [0,1.5,3]) add(beat + k, 1.1, chord[0], 'bass', 0.105 * drive);
      for (const k of [0,2.5]) add(beat + k, 0.24, 0, 'kick', 0.22 * drive);
      add(beat + 2, 0.25, 0, 'snare', 0.085 * drive);
      for (const k of [0,0.75,1.5,2,2.75,3.5]) add(beat + k, 0.14, 0, 'hat', 0.017 * drive, k < 2 ? -0.45 : 0.45);
    } else {
      add(beat, 1.25, chord[0], 'bass', 0.14 * drive);
      add(beat + 1.5, 1.1, chord[0] + 7, 'bass', 0.105 * drive);
      add(beat, 0.23, 0, 'kick', 0.25 * drive);
      add(beat + 1.5, 0.24, 0, 'tom', 0.13 * drive);
      for (const k of [0.5,1,2,2.5]) add(beat + k, 0.1, 0, 'hat', 0.027 * drive, k < 1.5 ? -0.35 : 0.35);
    }
  }
  const beatsPerPhrase = barBeats * 2;
  const rhythms = track.groove === 'six' ? [0,0.5,1,1.5,2,3,3.5,4,4.5,5] : [0,1,1.5,2.5,3,4,5,6,6.5,7];
  for (let phrase = 0; phrase < track.bars / 2; phrase++) {
    const melody = track.melody[phrase % 4], secondHalf = phrase >= 8;
    for (let i = 0; i < melody.length; i++) {
      // The suspended phrase ends remain audible over the returning harmony.
      const gap = i === 4 && phrase % 4 === 3;
      if (gap) continue;
      const length = i === 9 ? beatsPerPhrase - rhythms[i] + 0.16 : (rhythms[i + 1] - rhythms[i]) * 0.82;
      add(phrase * beatsPerPhrase + rhythms[i], length, melody[i], track.lead, track.lead === 'air' ? 0.085 : 0.105, -0.12);
      if (secondHalf && (i === 0 || i === 6)) add(phrase * beatsPerPhrase + rhythms[i] + 0.03, length * 1.3, melody[i] - 12, 'warm', 0.038, 0.24);
    }
  }
  events.sort((a,b) => a.beat - b.beat);
  return { ...track, events, totalBeats, seconds: totalBeats * 60 / track.bpm };
}

