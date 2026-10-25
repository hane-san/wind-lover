# Wind Lover — working notes for Claude

A portrait-first mobile action game prototype: a broken-down Soviet sidecar outfit (also a chopper and a hover board) runs flat out across ruined Soviet and Central Asian lands toward the sun. You have to keep moving, because legacy guns and drones catch anything slow. Design intent, rules and numbers live in `docs/DESIGN.md`. Read it before you change gameplay.

## Collaborating with the owner (はねさん)

- Reply in Japanese, in a gentle, slightly playful お嬢様 voice (一人称「わたくし」; call the user はねさん or はね氏). Keep the reasoning rigorous and the prose easy to read. If you don't know something, say so.
- Text written in English (code comments, docs, commits) uses British spelling.
- They give feel-based feedback ("もう少し重く", "ぴょんぴょんしすぎ"). Turn it into concrete parameters, measure the result in the headless harness (turn radius, airtime, speed), and report the numbers.
- Keep the UI minimal. Don't add buttons, radar or text unless asked. Avoid real political symbols (no stars, hammer and sickle, flags) and use generic Soviet-era forms instead.
- Work on branch `claude/hoverboard-prototype`. Commit with the session attribution lines. Do not open PRs unless asked.
- The published game is https://hane-san.github.io/wind-lover/. GitHub Pages serves `main` at `/`; the root entry opens `prototype/`. The older Claude artifact is a legacy publication.

## The code

The core game is `prototype/index.html`, using Three.js r128 from cdnjs (UMD global `THREE`). Music is loaded as ES modules from `music/`, with loops in `assets/music/`; serve the repository root over HTTP. There is no build step. The root `index.html` redirects to the game for GitHub Pages.

The file is split by `// ------ name` section headers. Search for the header to find a section:

| Section | What lives there |
|---|---|
| settings | `VEHICLES` (handling and defaults per machine), `store` (localStorage wrapper) |
| biomes | `BIOMES` (12 lands: palettes, terrain amp/ridge/off/swell, prop densities, landmark types), `BKEYS` |
| noise | `hash`, `vnoise`, `biomeW` → `journeyW`/`laneW` (`LANES` chapters per lane), `rawHeight`, **`relief`** (massif, edge walls), **funnel** (`X_GOAL`, `funnel`, `halfW`), trunk **highways** (`hwZ`/`hwX`, `highway()` returns distance, centre and normal), `deckAt`, `heightAt` (cut/fill to the road), `roadZ`/`roadX` (minor roads) |
| world state | `colliders`, `rails`, … rebuilt from loaded chunks; `ground(x,z,y)` (terrain, deck, roofs, ramps) |
| renderer / scene, geometry helpers | sky shader, `G` shared geometries, `M()` matrix helper, `Merger` (merges coloured parts into one mesh) |
| chunks | streamed terrain tiles (`CH`=480 m, radius 2): `chunkSteps`, `terrainSteps`, `propSteps` yield across frames; `advanceChunk` restores the chunk palette/context before every step. Roads, highways and railways keep their existing builders. Geometry and collision commit together. |
| the abandoned line | `LINE`, `STATIONS`, `BREAKS`, `LOOPS`, `railZ`/`railY`, `railway`, `rideRoute`; `buildChunkRailway` draws the maintenance bed, service loops, stations and piers. See `docs/MAP.md`. |
| landmarks | giant ruins on a 2 km grid (`RG`), far terrain ring (`buildFar`), edge-range silhouettes (`buildRanges`) |
| home and the goal | `buildHome()`: hangar base at `BASE_X`, the ring at `GOAL` |
| player models | the sidecar (Ural/Dnepr style, mirrored rig), the chopper, the board |
| state | `P` (all player state), `placeAt`, `placeHome`, `respawn` |
| physics | `stepPhysics` (lean steering, grip, flow speed build-up, gliding), `autoHop`, `nearMiss`, `crash`, `collide` (OBB colliders), `resolveGround` (terrain hugging), `landing` |
| walls | `wallImpact(nx,nz)`: a crash when more than `WALL_CRASH` m/s goes into the wall, otherwise a scrape. `tunnelWalls()` handles side walls and roof in galleries, tunnels and the hangar, and sets `P.inTunnel` |
| bombardment | shells aimed at you (`SAFE` speed), the barrage when you stop, `die`, `arrive`, `retry`, `routeHeat` |
| engine | stall, crank race, backfire, smoke, sparks |
| drones | formations (V, ring, wave, helix), modes (pass, chase, flyby, assault), dense readable volleys, `updateBullets` with swept relative collision and a 0.32 m rider core. See `docs/DODGE.md`. |
| camera & visuals | `MOODS` sky cycle, `updatePalette` (biome blend, moving sun, altitude sky), `updateVisuals` (camera, suspension, lean, effects) |
| audio | `sfx`: procedural WebAudio (engine, wind, carve hiss, scrape, booms); `music/game-music.mjs` connects the menu to `createJourneyMusic`, sharing the SFX context through `__wlAudio` but keeping gains independent. See `docs/MUSIC.md`. |
| UI | toast, HUD, compass (`updateCompass`), menu, start, over and tune sheets |
| loop | `frame()`: physics substeps → world streaming → threats → visuals → render |

Conventions:
- Units are metres, seconds and m/s. +x is "奥" (deeper in, toward the sun and the goal). The HUD shows km/h.
- Use `smooth(a,b,x)` (smoothstep), `lerp` and `clamp`. Seeded randomness comes from `hash`/`mulberry`. World generation must be deterministic from position.
- When adding a landmark or a prop, push colliders through `addCollider` (it needs `CUR`). Static content outside chunks goes into `HOME.colliders`.
- Debug hooks: `window.__wl` (P, deckAt, rawHeight, hwZ, highway, halfW, GOAL, spawnF, loadStep, …) and `window.__wlCam(camera, player)` for scripted close-ups.
- `__wl.performance` exposes streaming slice timings and adaptive resolution; `__wl.combat` exposes the hit/graze radii and live bullet count. Do not treat the 3 ms streaming deadline as a hard bound: a single builder or garbage collection can overrun it. Preserve atomic commits and call `cancelStreaming()` before changing worlds.

## Testing (headless)

The checked-in journey smoke test is `python tests/world-smoke.py --browser /usr/bin/chromium`. Supply `--three /absolute/path/three.min.js` for an offline r128 bundle. It covers route geometry, bridge clearance, station shelter, real driving, streaming, world switching and page errors.

Music checks: `node --test tests/music-scores.test.mjs` and `python tests/music-browser.py --browser /usr/bin/chromium` (also needs NumPy and FFmpeg; accepts the same `--three` option). The browser test uses the actual game, records output across a blocked main thread and crossfades, and checks shared context, WAV fallback, settings, cancellation and driving. Physical iPhone/Safari testing remains outstanding.

Combat/streaming checks: `python tests/dodge-browser.py --browser /usr/bin/chromium` (same `--three` option). This runs the actual code in WebGL, checks fast crossings and grazes, compares a hit whilst driving straight with a successful steering dodge, checks road corridors and incremental/forced generation equivalence, and reports CPU timings with software rendering excluded. Timings are not real-phone FPS measurements.

The scratchpad harness uses Playwright with the preinstalled Chromium:
1. Build `test.html` by putting `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" ...></head><body>` in front of `index.html`, and point the three.js `<script src>` at a local `three.min.js` (r128) copy.
2. Launch `chromium` from `/opt/node22/lib/node_modules/playwright` with `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` and `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`. Use a 390×844 mobile viewport with touch.
3. Set `localStorage['windlover.shells']='false'` for calm runs. Tap `#btnGo`, then drive with `window.__wl` (teleport with `P.pos.set`, call `loadStep()` a few dozen times, sample state with `setInterval`).
4. Check for `pageerror`, take screenshots and `Read` them.

SwiftShader runs slower than real time (dt is clamped to 0.05 s), so measure sim-time distances and don't rely on wall-clock speeds.

## Featured itineraries (21 October 2026)

Read `docs/FEATURED-JOURNEYS.md` for current route, steering, bullet and audio tuning. `world/featured-routes.js` is a classic script loaded before the core: it owns sampled mountain/lake paths and their spatial index. `prepareFeaturedElevations` joins nearby legacy decks; keep lake endpoints identical after height changes. `rideRoute` chooses the closest suitable road, so one itinerary never attracts a rider already on another. Featured curve assistance remembers the chosen lateral offset; strong steering still wins.

Run `node tests/featured-routes.test.mjs` and `python tests/featured-browser.py --three /path/to/three.min.js`. The latter audits physical/rendered surfaces and long route drives, as well as menu access and screenshots. The music browser test now covers default-on gesture playback and records actual loop wraps; the wind source join and shared output also require preservation.

## Horse riding and connected journeys (22 October 2026)

Read `docs/HORSE-RIDING.md` and `docs/CONNECTED-JOURNEY.md` before changing the horse or roads. These supersede the older equal-handling requirement: the horse has its own road-relative rein response, gathered lead-change bounds, folded airborne legs and cancellable audio-clock hoof scheduling. `world/horse-riding.js` owns the riding state; gait, sound and wake remain separate. Keep the 0.32 m bullet core and responsive sidesteps. Do not bring back tyre hiss, metal sparks or an engine explosion for the horse.

`prepareJourneyNetwork()` creates two physical roads after lake elevation alignment: `lake-pass` (11.1 km) and `pass-line` (4.2 km). Their endpoints share existing road/rail heights; signs and scenery stay outside every road corridor. `rideRoute` distinguishes upper and lower decks and remembers the current path through shallow junctions. Geometry uses unpreferred nearest paths, so steering never deforms the world. Connection music uses `path.region`.

`WindTravelCamera` adds bounded curve anticipation, centred combat framing and an OBB boom obstruction query. The rear view, muted colours and quiet regional music remain the reference. Keep cloth motion proportional to dt and frozen when paused.

Run `python tests/horse-riding-browser.py --three /path/to/three.min.js`, `python tests/journey-network-browser.py --three /path/to/three.min.js`, `python tests/horse-rhythm-browser.py`, `python tests/journey-camera-browser.py --three /path/to/three.min.js` and the existing presentation/wake/music/world/dodge checks. `tests/featured-browser.py --full-only --vehicle horse` checks the complete pass and lake loop. Tests use software WebGL; do not report their CPU timing as real mobile FPS.

## Faster flow and four departures (22 October 2026, later)

Read `docs/VOYAGE-FLOW.md` before changing speed, weather or the newer roads. This request supersedes the older unchanged-speed and no-speed-threads notes: horse acceleration is 24, default cruise 48 m/s and max 116 m/s, with stronger sustained pull. Preserve the quiet score, the 0.32 m core, independent reins and rear camera. Only old untouched horse speed fields migrate; other saved tuning stays.

Four neutral outline icons launch desert, mountain, lake and `silk` (Dushanbe–Samarkand, 24.9 km). `astana` is a connected 9.7 km city boulevard, not a fifth main icon. Both new roads return to the existing railway; their `travelRoad` flag distinguishes them from the two older `connection` roads. Road half-widths are 22 m (mountain, silk and connectors), 21 m (lake) and 32 m (city). Keep skyline buildings outside all corridors. The city is merged into two meshes.

`world/journey-climate.js` supplies elevation-led snow and the lake's distance-led westward sunset. The lake state resets only on a new featured departure; dodging and menu pauses must never scrub its light. `world/horse-wake.js` has a fixed 240-particle contact pool; snow colours and sizes follow the same elevation state as the terrain and hoof sound. `world/flow-effects.js` has 52 world-space lines, keeps the central 11 m clear, eases under threats and respects reduced motion. No additional composer or full-screen blur.

Run the meaningful browser suite in `docs/VOYAGE-FLOW.md`, including the four-icon mobile menu, full new-road drives, mesh rays, lake circuit, rein changes at the higher speed, wake lifetime and default-on music continuity. Software WebGL timings do not establish real-phone FPS.

## The abandoned defence network (23 October 2026)

Read `docs/DEFENCE-RHYTHM.md` before changing threats. It supersedes constant assault pressure: `world/encounter-director.js` alternates a scenic rest, a 2.4s warning, a 26s engagement with three weapon waves and short firing breaks, and a 4.5s withdrawal. Quiet phases contain no hostile projectiles. Lake rests last longer; low health shortens the engagement and lengthens recovery. Roofs and attack-off cancel pending fire; menus freeze time. Keep the newer camera controls/comparison from `docs/CAMERA-TUNING.md`.

The nine geometric patterns now close at 108 m/s; kinetic three-round bursts close at 210 m/s and share the same 0.32m swept core. Missiles use `world/missiles.js`: accelerating interception, 0.42s limited guidance then a fixed line, maximum two live darts, a 0.54m combined collision radius, fixed smoke and mesh pools. No large missile splash damage. Direct hits preserve speed more gently and do not launch the horse. The new `world/weapon-audio.js` warms 18 short cached sounds and schedules bursts on the shared audio clock with at most 24 voices. Cancel its future voices on pause, off, death, travel and hidden tabs without stopping music.

Run `tests/defence-browser.py`, `tests/weapon-audio-browser.py`, both horse and sidecar dodge tests, the world/music suite and the current camera panorama test. The defence test exercises 180s of actual driving and verifies straight-hit versus sidestep-avoidance at 20/60/120fps. Density runs use invulnerability; do not present them as proof that the player survives without dodging, or as real-phone FPS.

## Mounted bow and forward patrols (24 October 2026)

Read [docs/BOW-RIDING.md](docs/BOW-RIDING.md) before changing combat, input, horse pace or camera defaults. The latest owner request supersedes the earlier 116m/s horse and rotating weapon waves: the broadest panorama is the default, lower-screen touches keep the reins, upper-screen touches draw towards the saddle and release a forgiving one-hit bow. Native two-finger movement/draw must remain independent. A small patrol approaches from ahead; physical geometric missiles at 510–380m, a bow window to 155m, then short close-range machine-gun bursts. No rearward firing or overhead horse artillery. Victory buys scenery.

Horse defaults are now cruise 20 / max 34m/s, acceleration 18 and tailwind 1.5, with lower flow/road pull and retuned wind; slopes/soft cap can put measured speed around 40m/s. Custom tuning and camera presets survive migration. Keep the .32m core, .33s gathered lead changes, quiet music and reversible camera controls. `world/horse-archery.js` owns gesture/lock state; the core owns the visible bow, arrows and impact. Missile bodies/exhausts are capped at 256, arrows at twelve, audio at 24 voices with 27 cached variants.

The new `tests/archery-browser.py` exercises the full mounted loop; `tests/defence-browser.py` forwards to it. Run it with the unit suite and the relevant dodge, riding, panorama, audio, music and world checks listed in the new document. Older tests demanding a faster horse than the motorbike or the old default camera must use the latest mounted specification. Real-device touch feel and FPS remain separate from headless results.


## A committed recurved draw (24 October 2026, follow-up)

Read [docs/RECURVE-FEEL.md](docs/RECURVE-FEEL.md) for the owner's latest bow presentation and the regional sources. Remove the large circle: a nearby touch immediately acquires the small lock, a white composite-bow outline/straight string flex around it, and the selected drone stays selected through the draw. Release requires 78% of a 64–88px draw, with no extra holding timer. White tension, small inward ticks and one haptic cue signal readiness. Keep independent reins and one-hit kills. The release is broad air/string snap and the impact a dry crack; no pitched plucked cue. A fixed 96-segment .16s arrow wake remains through the hit; clear it with arrows on travel/vehicle changes. Run `tests/bow-feel-browser.py`, the mounted archery audit, unit tests and weapon/music checks. Historical research informs the silhouette/gesture; screen-pixel thresholds are game tuning, not historical measurements.

## Weighted release and separate lock (24 October 2026)

The latest follow-up in `docs/RECURVE-FEEL.md` supersedes the lock-centred bow and 78%/64–88px stroke. Keep the approved recurved graphic; enemy chevrons stay on the drone and disappear on pointer-up. `WindArchery.layout` fits the separate bow on the enemy–saddle segment, scaling near edges and yielding to the physical bow if too little projected space remains. The draw axis is fixed at pointer-down. Required stroke is 3 + .8 × (clamp(shortSide × .22, 70, 96) − 3) pixels, with .28s recovery and no extra holding timer. Cached release is softer band-limited air; the hit has low body and three fracture accents. Six spinning pieces per impact use one fixed 48-slot mesh. Run bow-feel, the full archery audit, 27-variant weapon audio, music continuity and unit checks. Never claim physical iPhone listening/FPS from software WebGL.

## Sideways bow strokes (24 October 2026, follow-up)

The owner also wants left/right draws, including a slight upward slant. `WindArchery.move` combines the frozen saddle projection with displacement in a forgiving screen-space sector: full resistance through 10 degrees above horizontal, tapering smoothly to zero at 20 degrees. Preserve the same slack/stroke/recovery, shallow cancellation and independent reins; progress is displacement, not accumulated travel. Eligible visible hostiles now include the whole forward hemisphere through directly alongside; rearward, occluded, off-screen, reserved and withdrawing targets still fail. See the latest section in `docs/RECURVE-FEEL.md`; run units, bow-feel and the native multi-touch mounted audit.

## Sky/ground encounter phrases (24 October 2026, later)

Read [docs/SKY-RHYTHM.md](docs/SKY-RHYTHM.md) before changing combat, hooves, camera defaults or automatic music. This builds on the latest sideways weighted draw and shattering. Stable high/low sky slots and an optional safe roadside sentry share at most two lofted missile salvos, about 2.2s apart; the lower 285m cutoff deliberately overlaps the 360m bow window. Preserve frozen aim, per-source cancellation, the .32m core, independent reins, safe road corridors and scenic rewards. Missile tails have a fixed twelve-sample history with opacity fade; no composer. The horse panorama distance is 17; only untouched prior panorama saves migrate. Hoof gain is quieter and its cadence now follows the actual mounted pace. The regional four-song playlist changes after a full phrase during quiet time with a 2.4s crossfade and recent-song exclusion; manual mode and paused/hidden/dead states cannot rotate it. Run the new sky-rhythm browser audit, mounted and bow-feel audits, units, hoof-clock/audio, recorded automatic music and panorama/obstruction checks. Distinguish the invulnerable phrase-density run from the four ordinary-health riding combats and from real-device assessment.

## Drawn-bow aiming and mixed trajectories (25 October 2026)

Read [docs/BOW-FLOW.md](docs/BOW-FLOW.md) before changing mounted combat. The owner's latest request supersedes the old 70–96px draw and stable-until-unavailable lock: use the longer 110–170px stroke, a larger fitted bow, bottom-edge pointer capture and deliberate post-draw steering with proximity hysteresis. Preserve independent reins, shallow cancellation and one-arrow kills. The .24s recovery and 420m range support five/six-target patrols, three overlapping salvos and low approaching targets. Direct, ballistic and analytic weaving cruise paths all keep frozen launch-time aim and the .32m swept core. The .42s, 160-segment contrasted arrow wake and larger local blast/low-body sound remain bounded. Run units, bow-feel (including native bottom/retarget/release), sky-rhythm (all three trajectory dodges at 20/60/120Hz), mounted, weapon audio and recorded music checks. Never turn invulnerable density runs or scripted riding into physical-phone or human-balance claims.

## Natural nock steering and staged destruction (25 October 2026, follow-up)

The owner's correction in `docs/BOW-FLOW.md` supersedes same-direction cursor steering. Capture the draw angle at readiness and rotate the shot ray opposite subsequent hand-angle changes. Extending an initial or already-steered draw along the same ray must preserve aim; camera motion must not change the reference. Acquire steered enemies by ray alignment, with the existing hysteresis, never by cursor radius alone. The example is upper-right touch → lower-left draw → move the nock right → arrow/new lock upper-left. The approved bow outline stays. Bow-only destruction now stages thirteen flame/ring/smoke sprites (120 cap), twelve shell pieces (96 pool) and 36 spark streaks (192 pool), all pausable/clearable; the cached .95s falling-boom impact and rapid cadence mix remain bounded. Run units, focused WebGL/native nock/target/release and burst phase/cap checks, mounted combat, weapon audio and recorded music continuity.

## Fixed supporting hand and crossing interceptor (25 October 2026, later)

Read [docs/GRIP-AND-SWEEPER.md](docs/GRIP-AND-SWEEPER.md) for the latest researched input/enemy decisions and limits. The approved local grip `(0,-24)` is now a per-gesture screen anchor: `WindArchery.pose/fitGrip` may rotate and scale around it, never chase a target by translating the grip. Preserve the visible forward arrow tip, counter-rotation, settled full-draw control lever, explicit off-ray unlock, candidate dwell and independent reins. One aerial slot per patrol is a swept-wing interceptor, excluded from launchers/guns. `world/sweeper.js` supplies crossing, a .95s frozen-aim tell, a 1.55s committed dive and a 1.7s non-damaging exit. Keep the .95m combined swept contact radius, final-frame contact, maximum one hit and cancellation. Run units, fixed-canvas-grip/native bow, interceptor real contact/phase/arrow interruption, full mounted, sky/incoming-fire and recorded music audits. Research sources inform the design; do not present software tests as a human study or physical-device proof.

## Bow response and readable pressure (25 October 2026, follow-up)

Read [docs/BOW-RESPONSE.md](docs/BOW-RESPONSE.md) before changing the current bow. Long-pull settling projects only along the draw axis; it must never absorb a slow sideways sweep. Aim uses one 32/s filter and the fitted graphic shares that ray, with scale easing separately. Preserve the fixed grip, eased steering onset, direct-touch priority, narrower manual cone, relative low-target counter-rotation and 65ms candidate dwell. Release only validates the last shown target identity; never acquire a new foe on pointerup, and fire along the last visible ray if that target is unavailable. Readiness feedback must work during a stationary prepared follow-up, once per rearm. Serialize the interceptor's tell/dive against new launcher tells while keeping existing missiles real. New 65-test units and bow-response browser coverage include .25s held draws in four ordinary-health 90s road/dodge runs; retain the mounted, sky, interceptor, audio and music audits and distinguish scripted checks from physical-phone feel.

## Steady camera and four roaming areas (25 October 2026)

Read [docs/ROAMING-AND-STEADY-CAMERA.md](docs/ROAMING-AND-STEADY-CAMERA.md). This supersedes automatic scenic glances and combat zoom: keep the mounted composition centred, heading-led and level through sidesteps, preserving saved camera settings, obstruction and tunnel protection. Four optional roaming paths add about 20.16km with 56–96m widths and broad terrain valleys. They share the main paths' endpoint heights/tangents, physical roads, streaming and regional music. `nearest` retains its 170m default; explicit roaming-only 1100m lookup shapes terrain without nearest-main-path discontinuities. `indexReach` expands only the new paths' spatial coverage. Keep props/bridge supports clear of all riding corridors. Run units, roaming real drives, camera obstruction/panorama, current bow-response and world checks. The latest bow/enemy work remains the baseline.

## Mixed journey music (26 October 2026)

Read [docs/MUSIC-VARIETY.md](docs/MUSIC-VARIETY.md). Preserve all twelve quiet IDs and saved/manual settings. Four separate riding arrangements extend the live list to sixteen; regional pools now contain four quiet and two brave choices. Recent-song exclusion and energy balancing avoid consecutive brave pieces and answer two quiet choices with a brave one. Keep complete-phrase/quiet-phase rotation, 2.4s crossfades, old-loop playback during preparation, cancellation, one shared context and the two-buffer cap. Baked Oggs retain the existing assets/music/quiet directory; the same score is the codec fallback. Only the new horn voice extends synthesis. Run units, all-sixteen recording audit and actual mixed-music continuity/browser checks. Never claim device-wide glitch immunity from browser recordings.
