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
