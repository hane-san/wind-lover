# Japan and southern seas — an optional compressed journey

29 October 2026. This is an additional fictional sample world, rather than a replacement for the connected Central Asian journey. Use **旅の門：日本・東南アジアへ** on the start screen or in the menu. A light gate also stands just off the lake's departure road. The sample's gate returns to the previous journey; the menu provides the same return. A journey entered during play remembers its position, heading, pace, selected landscape and lake sunset state. The initial sample departure falls back to the original desert departure on return. Gates require leaving their centre before rearming, with a four-second cooldown. Warps clear attacks, reservations, arrows, reins and scheduled hoof sounds.

## Six scenes in one circuit

`world/monsoon-world.js` lazily installs an 8,073.5 m, closed, 480-segment road. The 60 m riding width, physical surface, normals and endpoint are continuous. The optional road lives outside the original world's bounds; only this realm bypasses the original journey's end boundary. A complete circuit takes roughly three to four minutes once up to pace. Each scene spans about 1.35 km, so the scenery changes within tens of seconds. The sample's menu exposes all six stops:

| Stop | Visual approach |
| --- | --- |
| Toyosu-inspired waterfront | Pale glass towers, layered floors, open water and a broad promenade verge |
| Edo-inspired evening plain | Amber earth road, gabled wooden houses, fields and low inland hills under lavender evening light |
| Angkor-inspired stone forest | Stepped lotus-bud silhouettes, five large towers, galleries, palms and a stone-coloured causeway |
| Khaosan-inspired street | Pastel shop fronts, awnings, small luminous sign panels and hanging lanterns |
| Don Mueang-inspired airport | Low terminals, runway markings, a control tower and a parked aircraft silhouette |
| Malay Peninsula-inspired coast | Sandy road, drooping palm canopies, wooden houses, turquoise water and offshore limestone silhouettes |

This is intentionally compressed fictional geography and architecture. The model of the temple, the modern airport and the hunting outfit are original approximations, not measured reconstructions. There are no copied models, recordings, flags, brands or religious enemies. The scenery is built into three merged meshes. Solid building volumes publish with their collision boxes, clear of the entire road; foliage, lamps and sign panels remain visual details. Ocean terrain lies below the water plane. Road shoulders share edges with the centre rather than overlapping it, and their vertex colours blend at the short regional seams, avoiding depth flicker and broad colour bands.

## Shared riding, new appearance

The mounted controls, default camera, supporting-hand anchor, draw stroke, aim filter, lock dwell, shot validation, enemy formation/attack logic and projectile physics are unchanged. Cruise remains 22 m/s, maximum setting 38, acceleration 22, and the rider's projectile core 0.32 m. Existing custom settings survive.

In the sample the rider wears an invented indigo hunting outfit, a broad straw hat, a plain saddle blanket and an asymmetric Japanese-bow silhouette. The familiar white draw guide remains the same so it does not move the player's learned grip or aiming reference. Aerial patrols have folded ivory wings with indigo bodies and red accents; interceptors have long cranked wings, and ground relays have four legs and a raised housing. These are alternative meshes on the same bounded instance pools. Returning restores the original clothing, saddle texture, bow and enemy geometry. Other chosen vehicles retain their own controls and models.

## Six more original compositions

All 22 previous IDs remain available. Six new original scores extend the total to 28:

| ID | Arrangement |
| --- | --- |
| `bay-glass` | 110 BPM, glassy keys and a soft electronic pulse |
| `sunset-reins` | 104 BPM, plucked melody and galloping drums |
| `lotus-stone` | 108 BPM, bell-like notes and hand drums in three |
| `khaosan-afterlight` | 124 BPM, warm synthesiser and syncopated percussion |
| `runway-swallow` | 138 BPM, bright plucks and broken beats |
| `straits-tide` | 106 BPM, reed-like melody and softer hand percussion |

These are contemporary original soundtracks, not claims to reproduce regional traditional music. They are baked with the existing score renderer to small seamless stereo Vorbis loops; synthesis remains the codec fallback. Default-on gesture unlock, manual/off/volume controls, one shared audio context, outgoing playback during loading, cancellation and the two-voice/two-buffer limit remain. Sample boundary polling changes the candidate pool whilst preserving the current musical phrase; explicit menu travel uses the existing 2.4-second crossfade. The Central Asian pools are unchanged.

## References consulted

- [Japan Equestrian Archery Association — On Yabusame](https://yabusame.or.jp/english/on-yabusame/): mounted archery, the archer's clothing and stable posture. This informed the traveller's outline; the game does not simulate the ritual or its historical costume exactly.
- [GO TOKYO — Toyosu](https://www.gotokyo.org/en/destinations/eastern-tokyo/toyosu/index.html): the waterfront setting and modern district.
- [UNESCO — Angkor](https://whc.unesco.org/en/list/668/): monumental ruins within a forested archaeological landscape.
- [Airports of Thailand — Don Mueang access](https://donmueang.airportthai.co.th/service/way-to-airport/detail/95): airport/urban-road context and its link with the Khaosan area. No timetable or price is used by the game.

## Verification and hand-off

Run:

```sh
node --test --test-isolation=none tests/*.test.mjs
python tests/monsoon-browser.py --three /path/to/three.min.js
python tests/monsoon-music-browser.py --three /path/to/three.min.js
python tests/quiet-music-browser.py --browser /usr/bin/chromium --recordings
python tests/bow-response-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js
python tests/music-browser.py --three /path/to/three.min.js
python tests/world-smoke.py --three /path/to/three.min.js
```

The sampler audit uses native menu clicks, screenshots, road rays, non-overlapping shoulder rays, full ordinary-health riding through all six scenes and the loop seam, both physical gates, restoration of the saved departure, and three ordinary-health 90-second riding/aiming/dodging runs. The original six-departure bow-response and world smoke checks guard against a regression in the main journey. These scripted tests are not a human play study or evidence of real-phone frame rate.

All 28 encoded loops were decoded and checked for continuity, headroom and non-silent phrases. The sampler music audit records all six new songs and native warps in the actual game output, including return to Central Asia, with default-on playback and one shared context. Browser recordings bound clicks/gaps in those runs; physical-device listening remains separate. The existing audio audit also tests a 1.6-second main-thread stall, held loading, cancellation, repeated changes and saved settings.

Measured in this session: all 76 unit checks passed. The scripted sample circuit covered 8,293.6 m through the seam with hull 3 and less than 0.05 m of final centre-line drift. The three ordinary-health 90-second sample fights landed 47 of 47 scripted shots, retaining hull 3; this is a regression fixture, not a human difficulty rating. The 27.3-second actual sampler/warp audio recording had minimum 100 ms RMS 0.0183 and maximum adjacent-sample output change 0.0693, without a detected gap. All 28 encoded loops passed the decoding/loop/headroom checks. The original six departures' bow-response runs, original world smoke and live shared-audio/stall/loading/cancellation checks also passed.
