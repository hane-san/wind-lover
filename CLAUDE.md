# Wind Lover — working notes for Claude

A portrait-first mobile action game prototype: a broken-down Soviet sidecar outfit (also a chopper and a hover board) runs flat out across ruined Soviet and Central Asian lands toward the sun. You have to keep moving, because legacy guns and drones catch anything slow. Design intent, rules and numbers live in `docs/DESIGN.md`. Read it before you change gameplay.

## Collaborating with the owner (はねさん)

- Reply in Japanese, in a gentle, slightly playful お嬢様 voice (一人称「わたくし」; call the user はねさん or はね氏). Keep the reasoning rigorous and the prose easy to read. If you don't know something, say so.
- Text written in English (code comments, docs, commits) uses British spelling.
- They give feel-based feedback ("もう少し重く", "ぴょんぴょんしすぎ"). Turn it into concrete parameters, measure the result in the headless harness (turn radius, airtime, speed), and report the numbers.
- Keep the UI minimal. Don't add buttons, radar or text unless asked. Avoid real political symbols (no stars, hammer and sickle, flags) and use generic Soviet-era forms instead.
- Work on branch `claude/hoverboard-prototype`. Commit with the session attribution lines. Do not open PRs unless asked.
- The published artifact is https://claude.ai/artifact/UezdYJswnYuwz9TpmBtuPf. Republish `prototype/index.html` to that URL after each meaningful change.

## The code

The whole game is `prototype/index.html`: one file, about 3,500 lines, using Three.js r128 from cdnjs (UMD global `THREE`). It has no build step. The file has no `<!doctype>`, `<html>` or `<body>` because the artifact host adds the skeleton.

The file is split by `// ------ name` section headers. Search for the header to find a section:

| Section | What lives there |
|---|---|
| settings | `VEHICLES` (handling and defaults per machine), `store` (localStorage wrapper) |
| biomes | `BIOMES` (12 lands: palettes, terrain amp/ridge/off/swell, prop densities, landmark types), `BKEYS` |
| noise | `hash`, `vnoise`, `biomeW` → `journeyW`/`laneW` (`LANES` chapters per lane), `rawHeight`, **`relief`** (massif, edge walls), **funnel** (`X_GOAL`, `funnel`, `halfW`), trunk **highways** (`hwZ`/`hwX`, `highway()` returns distance, centre and normal), `deckAt`, `heightAt` (cut/fill to the road), `roadZ`/`roadX` (minor roads) |
| world state | `colliders`, `rails`, … rebuilt from loaded chunks; `ground(x,z,y)` (terrain, deck, roofs, ramps) |
| renderer / scene, geometry helpers | sky shader, `G` shared geometries, `M()` matrix helper, `Merger` (merges coloured parts into one mesh) |
| chunks | streamed terrain tiles (`CH`=480 m, radius 2): `buildChunkRoads`, `buildChunkHighway` (deck, piers, galleries, tunnels, portals), `buildChunkProps` |
| landmarks | giant ruins on a 2 km grid (`RG`), far terrain ring (`buildFar`), edge-range silhouettes (`buildRanges`) |
| home and the goal | `buildHome()`: hangar base at `BASE_X`, the ring at `GOAL` |
| player models | the sidecar (Ural/Dnepr style, mirrored rig), the chopper, the board |
| state | `P` (all player state), `placeAt`, `placeHome`, `respawn` |
| physics | `stepPhysics` (lean steering, grip, flow speed build-up, gliding), `autoHop`, `nearMiss`, `crash`, `collide` (OBB colliders), `resolveGround` (terrain hugging), `landing` |
| walls | `wallImpact(nx,nz)`: a crash when more than `WALL_CRASH` m/s goes into the wall, otherwise a scrape. `tunnelWalls()` handles side walls and roof in galleries, tunnels and the hangar, and sets `P.inTunnel` |
| bombardment | shells aimed at you (`SAFE` speed), the barrage when you stop, `die`, `arrive`, `retry`, `routeHeat` |
| engine | stall, crank race, backfire, smoke, sparks |
| drones | formations (V, ring, wave, helix), modes (pass, chase, flyby), volleys, bullets |
| camera & visuals | `MOODS` sky cycle, `updatePalette` (biome blend, moving sun, altitude sky), `updateVisuals` (camera, suspension, lean, effects) |
| audio | `sfx`: procedural WebAudio (engine, wind, carve hiss, scrape, booms) |
| UI | toast, HUD, compass (`updateCompass`), menu, start, over and tune sheets |
| loop | `frame()`: physics substeps → world streaming → threats → visuals → render |

Conventions:
- Units are metres, seconds and m/s. +x is "奥" (deeper in, toward the sun and the goal). The HUD shows km/h.
- Use `smooth(a,b,x)` (smoothstep), `lerp` and `clamp`. Seeded randomness comes from `hash`/`mulberry`. World generation must be deterministic from position.
- When adding a landmark or a prop, push colliders through `addCollider` (it needs `CUR`). Static content outside chunks goes into `HOME.colliders`.
- Debug hooks: `window.__wl` (P, deckAt, rawHeight, hwZ, highway, halfW, GOAL, spawnF, loadStep, …) and `window.__wlCam(camera, player)` for scripted close-ups.

## Testing (headless)

The scratchpad harness uses Playwright with the preinstalled Chromium:
1. Build `test.html` by putting `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" ...></head><body>` in front of `index.html`, and point the three.js `<script src>` at a local `three.min.js` (r128) copy.
2. Launch `chromium` from `/opt/node22/lib/node_modules/playwright` with `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` and `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`. Use a 390×844 mobile viewport with touch.
3. Set `localStorage['windlover.shells']='false'` for calm runs. Tap `#btnGo`, then drive with `window.__wl` (teleport with `P.pos.set`, call `loadStep()` a few dozen times, sample state with `setInterval`).
4. Check for `pageerror`, take screenshots and `Read` them.

SwiftShader runs slower than real time (dt is clamped to 0.05 s), so measure sim-time distances and don't rely on wall-clock speeds.
