# A quicker horse, connected road reading and a changing Central Asian journey

29 October 2026. Extends the six-departure build; the current mounted bow, independent reins, 0.32m hit core, one-arrow kills, saved camera settings and physical open world remain the baseline.

## Riding and junctions

Horse defaults change from cruise 20 / maximum 34 / acceleration 18 to **cruise 22m/s / maximum 38m/s / acceleration 22m/s²**, with tailwind 1.8. Only saved fields matching the previous defaults migrate. Untouched ancient defaults migrate through the existing earlier migration first; deliberate camera, turn and other vehicle settings survive.

The low-speed acceleration factor is .68 rather than .45. Road pull and sustained acceleration rise slightly. A road preview eases a cornering cap down by at most 16% on a tight bend, then restores it more quickly on exit. It never multiplies velocity by an instantaneous corner penalty. In the controlled desert run, 8→28m/s takes 1.85s and 38m/s is reached at 4.78s. In that 22s run, the maximum per-120Hz-step speed change is .163m/s. These are game units and relative tuning, not an assertion about a real horse's sustainable speed.

Mounted placement now starts grounded on the intended road. It no longer drops half a metre and loses pace on the initial landing, or chooses a gallery roof over the road beneath it. Other vehicles retain their existing placement.

`world/route-guidance.js` builds endpoint continuations from real shared decks, with a railway sampler for joins onto the abandoned line. It carries a look-ahead across a junction instead of clamping at the end of its source path. Steering, camera preview, patrol approaches and sentry placement use that continuous reading. A dangling prediction extends along its last tangent; it does not add geometry or a travel trigger.

Riding-path selection scores heading and deck height as well as proximity, with modest preference for the current road whilst the reins are quiet. This stops a same-level crossing or subpixel nearest-road noise from rotating the horse onto another road. Strong reins still choose a different line or leave the road. Geometry and ground queries never use the intent-based selection. One-entry candidate caching shares a spatial query between physics callers; adding paths or extending the index invalidates it.

The actual Charyn junction runs continue onto lake-pass and Astana without teleporting: maximum yaw changes are below .021° per 120Hz step and speed changes below .041m/s, with hull 3 retained. The camera and enemy read approximately 650m ahead across each join.

## Scenery and restrained sightseeing

`world/scenic-journey.js` supplies deterministic sequences roughly every 340m on the five featured roads, plus the desert railway. Nearby details alternate between poplars, orchards, ruined pillars, stone memories, russet fins and pale layered rock. Astana keeps its open, flat boulevard and tree-lined approaches; the coloured geology belongs to the canyon/desert sequences. The southern lake verge also changes between warmer earth tones. The existing alpine snow, river descent, distant mountains, city skyline and lake sunset remain.

Research read 29 October:

- [Destination Jeti Oguz: valley](https://jetioguz.travel/destinations/nature-sites/vallee-de-djeti-oguz/): vegetation, red rocks and the southern Issyk-Kul valley inform the lakeside fins and groves.
- [Kazakhstan Travel: Aktau Mountains](https://kazakhstan.travel/ru/attractions/211): white, yellow, blue and reddish sedimentary strata inform the pale rock sequences.
- [Altyn-Emel: Aktau](https://altynemel.kz/index.php/en/things-to-do/places-to-see/aktau-mountains): conical forms and coloured slopes set against steppe inform the silhouettes.

These motifs are recomposed for the fictional world; they are not exact sites or the real road between them. Models, colours and all music are original. No photographs, recordings or meshes are taken from these sources.

Rock layers share a continuous taper rather than widening into repeated artificial shelves. Foundations reach down to the surrounding terrain. New solid features and their conservative OBBs are merged and streamed together; vegetation has physical trunks. All new sites reserve every riding corridor and avoid existing permanent structures. Permanent landmarks build before streamed details so the reservations exist during the first chunk build as well. There is no new post-processing pass or permanent effect pool.

Sky moods drift over about 46s per stage, with a little more of the regional blue or desert warmth visible through the muted treatment. The lake's sunset and stars still follow actual progress, not this ambient clock.

Only during a quiet straight lakeside ride, after 2.4s without input or danger, the gaze can ease towards the lake. The camera **does not translate, roll or change distance**. The 1.45m maximum target offset is about 1.6° at the default aim distance; one actual departure settles at about .60°. A draw, steering, threats, jump, shelter or unstable ground returns it to centre quickly. Reduced-motion mode supplies no sightseeing offset. In the draw test the remaining offset after .5s is .0037m, with a level horizon.

## More targets and twelve missile figures

Forward armed patrols contain six/seven one-arrow targets rather than five/six. One slot remains the committed interceptor, never an extra launcher. A safe roadside sentry can still replace a sky slot. The two unarmed scenic scouts remain separate: at most nine active targets in this arrangement. Scenic rests shorten slightly by region, retaining low-health recovery and up to six seconds of deferral for unreadable terrain.

The existing nine geometric missile figures gain three: overlapping ridgelines, two sinuous ribbons and staggered stepped lanes. Each new figure reserves a ground-level dodge lane, has fewer than sixty points and less than one second of stagger. Frozen launch-time aim, direct/loft/cruise trajectories, three salvos, close-range guns, source visibility, interceptor cancellation and the 256-body cap remain. There is no four-sided ambush or automatic rear fire.

The six ordinary-health 90s bow-response runs produce 17–19 hits, with minimum hull 3 except lake 2, and end at hull 3. These are scripted controllers, not a human balance study. The separate 180s invulnerable density trace has 65.95s scenic time, 89.8s combat, a peak of nine targets and 72 visible missiles.

## Twenty-two original songs

All sixteen previous IDs remain. Six new compositions in `music/voyage-score.mjs` add distinct motifs, chord responses and instrumental rhythms:

| Song | Character |
| --- | --- |
| 碧い湖の騎行 | 116 BPM, plucked melody and galloping hand drums |
| 雷鳴の峠 | 108 BPM, horns and low strings in three |
| 草原の交信 | 128 BPM, warm synth pulse and bass |
| 赤い七つの峰 | 104 BPM, reed melody and hand drums |
| 風に眠る未来都市 | 136 BPM, glassy keys and light breaks |
| 砂塵の凱歌 | 120 BPM, horns and a dry marching rhythm |

Each region now has nine candidates: four quiet songs and five riding pieces. The first song remains quiet; recent-song exclusion and the quiet/brave balance remain. Full-phrase rotation, quiet-phase switching, 2.4s automatic crossfades, default on, manual settings, one shared audio clock and the two-buffer/two-voice bounds are preserved.

All six new mixes are baked to 24kHz stereo Vorbis. The existing offline score renderer remains the codec fallback. The complete twenty-two recording audit passes loop joins, minimum 500ms energy and clipping checks; the highest decoded peak is .529 and the largest adjacent-sample step is .059. Actual-game recording additionally checks crossfades, a 1.6s main-thread stall, slow preparation with outgoing music continuing, off during preparation, automatic selection and settings persistence. The 34.92s game recording has a minimum 100ms RMS of .01427 and maximum adjacent-sample step of .05578, with no page errors.

## Verification

- 72 Node tests: geometry, route continuity, crossing stability, bow, new missile lanes, the small glance, score determinism and playlist behaviour.
- `tests/voyage-upgrade-browser.py`: measured pace, real junction drives, bow cancellation of sightseeing, new collider clearance and rendered road rays; five regional screenshots.
- `tests/featured-browser.py --full-only --vehicle horse`: all eleven surfaces, full mountain and lake drives at the new pace.
- `tests/roaming-browser.py`: four actual return routes, with strong-rein riding checks separately in `horse-riding-browser.py`.
- `tests/bow-response-browser.py`, `archery-browser.py`, `sky-rhythm-browser.py`, `sweeper-browser.py`: native input, six-departure combat, missile dodge/contact at 20/60/120Hz, sources, interceptor and trail lifecycle.
- `tests/regional-browser.py`, `journey-camera-browser.py`, `world-smoke.py`: galleries, physical cover, placement, structures, old railway and streaming.
- `tests/quiet-music-browser.py --recordings`, `music-browser.py`, `weapon-audio-browser.py`: all recordings and actual mixed output/cancellation.

Software WebGL and scripted controllers verify regressions. Physical-phone feel, FPS and subjective listening remain separate measurements.
