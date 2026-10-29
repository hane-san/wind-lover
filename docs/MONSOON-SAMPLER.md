# Japan and southern seas — an optional compressed journey

29 October 2026. This is an additional fictional sample world, rather than a replacement for the connected Central Asian journey. Use **旅の門：日本・東南アジアへ** on the start screen or in the menu. A light gate also stands just off the lake's departure road. The sample's gate returns to the previous journey; the menu provides the same return. A journey entered during play remembers its position, heading, pace, selected landscape and lake sunset state. The initial sample departure falls back to the original desert departure on return. Gates require leaving their centre before rearming, with a four-second cooldown. Warps clear attacks, reservations, arrows, reins and scheduled hoof sounds.

## Six scenes in one circuit

`world/monsoon-world.js` lazily installs an 8,130.5 m, closed, 480-segment road. The 60 m riding width, physical surface, normals and endpoint are continuous. The optional road lives outside the original world's bounds; only this realm bypasses the original journey's end boundary. A complete circuit takes roughly three to four minutes once up to pace. Each scene spans about 1.35 km, so the scenery changes within tens of seconds. The sample's menu exposes all six stops:

| Stop | Visual approach |
| --- | --- |
| Toyosu-inspired waterfront | Raised reclaimed quays and glass towers across a canal; a high open bridge and a dock crane |
| Edo-inspired evening plain | Unmarked 16m earth lane, 72 banked rice/crop plots, irrigation water, thatched hamlets and tea houses in an inland basin |
| Angkor-inspired stone forest | An inland forest, rectangular moats, five towers and galleries, with a wide open Khmer-inspired entrance |
| Khaosan-inspired street | 64 continuous shophouses, window grids, projecting market signs, stalls, canal water and sagging lantern strings |
| Don Mueang-inspired airport | Parallel runway and drainage canal, a raised urban viaduct, terminals, control tower and parked aircraft with landing gear |
| Malay Peninsula-inspired coast | A climb to 60m, wooded limestone escarpments, small coves, three coastal headlands, nine offshore stacks, palms and fishing huts |

This is intentionally compressed fictional geography and architecture. The model of the temple, the modern airport and the hunting outfit are original approximations, not measured reconstructions. There are no copied models, recordings, flags, brands or religious enemies. The scenery is built into five merged meshes (solid parts, glass, lanterns, local water and signs). The one small sign atlas is cached across visits. Solid building volumes publish with their collision boxes, clear of the entire road; the temple entrance alone has high beams crossing it, leaving a 33m-high, 68m-wide passage that also clears the camera. All other low structures reserve the whole corridor; foliage, lamps and sign panels remain visual details. Ocean terrain lies below the water plane. Local canals, paddies and moats have lowered physical floors and queryable water levels. Reclaimed quays keep waterfront buildings out of the sea; runway slabs and landing gear meet their real ground. Road shoulders share edges with the centre rather than overlapping it. Widths and vertex colours interpolate at both ends of every segment. Edo, the ruins and the coast have no modern painted edge/centre lines or roadside marker posts. Local water uses one clipped surface per cell, avoiding overlapping transparent rectangles.

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

These are contemporary original soundtracks, not claims to reproduce regional traditional music. They are baked with the existing score renderer to small seamless stereo Vorbis loops; synthesis remains the codec fallback. Default-on gesture unlock, manual/off/volume controls, one shared audio context, outgoing playback during loading, cancellation and the two-voice/two-buffer limit remain. The latest request supersedes preserving a whole phrase through a sample boundary. Each of the six sample scenes now has its own theme. A boundary must remain stable for two seconds; an automatic change waits until the current song has played at least 14 seconds, then uses a three-second audio-clock crossfade. Only the newest pending scene is retained. Remaining in one scene whilst moving rotates the music after 38 seconds; recent-song exclusion and the original balancing logic choose alternatives. Boundary themes can be consecutive brave pieces because the scene now leads the music. Menus, hidden tabs, death, stopped riding and manual mode do not trigger automatic changes. Explicit travel may change sooner. Central Asia keeps its original pools, complete-phrase/quiet-phase logic and 2.4-second fades.

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
python tests/regional-music-browser.py --three /path/to/three.min.js
python tests/monsoon-music-browser.py --three /path/to/three.min.js
python tests/quiet-music-browser.py --browser /usr/bin/chromium --recordings
python tests/bow-response-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js
python tests/music-browser.py --three /path/to/three.min.js
python tests/world-smoke.py --three /path/to/three.min.js
```

The sampler audit uses native menu clicks, screenshots, road rays, non-overlapping shoulder rays, full ordinary-health riding through all six scenes and the loop seam, both physical gates, restoration of the saved departure, and three ordinary-health 90-second riding/aiming/dodging runs. The original six-departure bow-response and world smoke checks guard against a regression in the main journey. These scripted tests are not a human play study or evidence of real-phone frame rate.

All 28 encoded loops were decoded and checked for continuity, headroom and non-silent phrases. The sampler music audit records all six new songs and native warps in the actual game output, including return to Central Asia, with default-on playback and one shared context. Browser recordings bound clicks/gaps in those runs; physical-device listening remains separate. The existing audio audit also tests a 1.6-second main-thread stall, held loading, cancellation, repeated changes and saved settings.

Measured in this session: all 76 unit checks passed. The scripted sample circuit covered 8,293.6 m through the seam with hull 3 and less than 0.05 m of final centre-line drift. The three ordinary-health 90-second sample fights landed 47 of 47 scripted shots, retaining hull 3; this is a regression fixture, not a human difficulty rating. The 27.3-second actual sampler/warp audio recording had minimum 100 ms RMS 0.0183 and maximum adjacent-sample output change 0.0693, without a detected gap. All 28 encoded loops passed the decoding/loop/headroom checks. The original six departures' bow-response runs, original world smoke and live shared-audio/stall/loading/cancellation checks also passed.

## Regional landscape follow-up and verification

The latest owner request calls for much stronger local geography, an agricultural Edo landscape and songs that change during ordinary riding. It supersedes the former mostly flat ellipse and phrase-preserving sample policy. The circuit remains closed and 60m wide for manoeuvring, but its horizontal bends and height profile now vary. Its centre height ranges from 20 to 60m, with maximum sampled grade 9.36%. The apparent earth lane can be narrower whilst its flat, unobstructed riding verges retain the existing dodge space. Pace, controls, bows, targets and the original Central Asian world remain unchanged.

The new farmland has 36 wet rice plots, 18 golden crop plots and 18 dry plots, with shallow floors, visible rice rows and physical banks. The forest and delta remain inland rather than sharing the same ocean-facing island edge. The coast has real raised terrain, a steep wooded ridge and an irregular shoreline. All local water levels are shared by drawing and physical ground queries. Road/collider clearance uses samples of each oriented footprint, so a long field bank or bridge pier may stand near the road without an overly broad circle rejecting it. Overhead entrance beams are checked separately above the camera and rider corridor.

References for this follow-up:

- [Koto City Tourism Association — waterfront itinerary](https://www.koto-kanko.jp/tourism/detail_course.php?mcid=16): Toyosu's waterfront parks, canals, former dock crane and bridges.
- [MLIT Agano River Office — life in the Aizu basin](https://www.hrr.mlit.go.jp/agano/jigyou/pamph/ryuiki/ryuuiki0203.html): Edo-period agricultural development and irrigation networks. The sample evokes an Edo-era rural landscape, rather than identifying Aizu as Edo city.
- [Angkor Enterprise — Angkor Wat](https://www.angkorenterprise.gov.kh/en/explore/685a10149b66c0d6db9be5d3): moat, raised rectangular galleries and five central towers. The large road gate is an invented Khmer-inspired approach, not a measured Angkor Wat gateway.
- [Thailand Foundation — Khao San Road](https://thailandfoundation.mfa.go.th/en/content/52586-khao-san-road-%5Bbangkok%5D?menu=5d83170115e39c1d3400471b&page=5d83170115e39c1d3400471a): Banglamphu streets, shop fronts, stalls, guesthouses and neon signs.
- [Tourism Malaysia — Kedah](https://ebrochures.malaysia.travel/en/malaysia-travel-guide/kedah/): Langkawi's mangroves, islands and limestone emerging from the sea. These forms inspire the peninsula scene without claiming an exact coastal location.

The updated 79 unit checks pass. The browser audit checks all six stops and five landmark views, 55 local-water rays without overlapping surfaces, matching water physics, obstacle footprints, the full 8.35km seam-crossing run and three ordinary-health 90-second riding fights. The latter land 47/47 scripted shots, preserving hull 3. These are regression fixtures, not human balance or real-device performance measurements.

The natural-music audit crosses six boundaries using actual riding physics, with no warp or direct track-selection calls for those changes. Only its song-age probe is accelerated to satisfy the separately unit-tested 14-second dwell; asset loading, audio-clock fades, loop wrapping, playback and recording remain real. Its 51.12-second recording has minimum 100ms RMS 0.0169 and maximum adjacent-sample output change 0.0761, without a detected gap; manual selection survives another ridden boundary. The shared-context live audio audit also passes held loading, cancellation, menu/persistent settings and a 1.6-second main-thread stall. The original world smoke passes. The encoded music assets are unchanged from the prior all-28 recording audit.
