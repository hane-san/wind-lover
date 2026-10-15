# Wind Lover — design

## Pitch

**「壊れかけのバイクで、何かを探して戻ってくる」** (on a half-broken motorbike, go out looking for something and come back).

Leave the hangar at the back of the land and ride toward the sun, deeper in. The land narrows, too slowly to notice, into a wedge. Something waits at its point. You can reach it in one run in theory, but in practice that is very hard. The long game is a metroidvania or Wizardry-style loop: go out, come back, improve the machine, push the range a little further. The loop is not built yet.

Mood: melancholy and beautiful. Wide pale skies whose colours drift, Soviet ruins that thin out into Central Asia (the Tian Shan, the Ferghana road, Issyk-Kul, the Kyzylkum's blue-tiled ruins, the Pamir gorges, the Kazakh steppe, the port of Aktau), and strange geometric monuments that are uncanny but still belong to the world.

## Core rules

1. **Speed is survival.** Shells are aimed where you are now. At ≥ `SAFE` (38 m/s, about 137 km/h) they land behind you. Slower, they walk onto you.
2. **Don't stop.** After 2.1 s below 2.5 m/s a barrage starts. The engine stalls when you stop, and each crank has only about a 36% chance of catching.
3. **Walls are real.** If more than 18 m/s of your velocity goes *into* a wall, you crash: hull −1, the engine stalls and a chase formation spawns. A shallower hit is a scrape: the inbound part is removed, speed and flow bleed off, the machine swings along the wall, and you get sparks and a grinding sound. Lean into the wall and you keep paying for it.
4. **Roofs shelter.** In galleries, tunnels and the hangar, no shells are fired, no volleys land and bullets do nothing. A barrage cannot start there. Later, drones will come in sideways through the spine-like openings of galleries, so a roof should not stay a perfect refuge.
5. **Drones are scenery first.** Formations cross the sky every 3–7 s (at most five at once). There are nine shapes: V, ring, wave, helix, plus the geometric rose (five petals), pentagram, lattice, bloom (two counter-turning rings) and spiral. They have 19–30 drones each. Peaceful ones have teal eyes and hostile ones amber. Each shape fires its own pattern: an opening flower, spiral arms drawn in seven bursts, a curtain with one gap, or rings. Every pattern is aimed at where you are now and flies at `BULLET_SPD`. At full speed you outrun them (`DRONE_MAX` 62 m/s).
6. **Route heat.** The mountain belt (centre lane) is technical but quieter. The lowland roads either side are faster but draw much heavier fire.

## Feel (numbers to protect)

- Sidecar: cruise 40 m/s, max 75 m/s. Flow builds speed while you keep going: cruise × (1 + 0.5·flow), max × (1 + 0.3·flow).
- Steering follows lean: yaw rate = K·tan(lean)/v^0.88. The lean still takes time to build, which keeps the weight, but the response is quicker and more willing than before (roll rate: sidecar 4.3, chopper 5.0; grip keeps 78% at top speed).
- Road sense: on a trunk highway, with the stick within 30% of centre, the heading settles onto the road's line when it is within about 25°. Any real steering input overrides it.
- Walls also include viaduct parapets, which work as soft walls you can still fly over, and terrain steeper than about 60°, which you glance off and cannot ride up.
- The machine hugs the ground: it snaps to terrain when the gap is under 1.1 + 0.03·v m. Normal launches are capped at a vertical speed of 10 m/s. Long glides happen only at top speed off real edges. "空は飛びすぎない".
- Ground contact is visible. A spring suspension on the chassis takes vertical jolts. On asphalt you feel a fine buzz (about 1 cm). Off-road you get coarse bumps and pitch chatter (about 2–3 cm, growing with speed). A camera share and a compass needle that shivers carry the feel through. In the air the chassis hangs slightly.
- Camera: wide and pulled back. The rider is small, with lots of sky. FOV opens with speed.

## Map (journey mode)

- +x is 奥 (toward the sun and the goal). Home is the hangar at `BASE_X` (−230 m) on trunk highway row 0. The back wall is at x = −4.5 km.
- **Funnel:** the half-width is 10.5 km up to x = 16 km, then shrinks smoothly to about 0.95 km at `X_GOAL` (96 km). The lane bands, the massif, the five highway rows and the edge walls all scale with it. The highway rows draw together and meet at the point. A front wall rises past the goal.
- Lanes are chapters by distance (see `LANES`):
  - north: Soviet → steppe → Aktau → steppe → dusk …
  - centre: Soviet → Ferghana → Tian Shan → Pamir …
  - south: Soviet → village → **Issyk-Kul** → Kyzylkum …
  - After 64 km the chapters cycle with variation.
- **Issyk-Kul** (south lane, x ≈ 7.5–23.5 km): a 16 × 2.5 km lake of deep blue water, ringed with summer meadows and beaches.
  - It lies between the mountain belt (to the north) and the edge range (to the south).
  - North shore (`issyk`): golden-green meadows, sandy beaches, piers and old sanatoria. The highway runs close along the water.
  - South shore (`issykS`): lush valleys, spruce, yurts and red-rock canyon slopes under the snow peaks. The highway swings wide inland.
  - East end (`karakol`): a town of poplar avenues with a wooden cathedral and a Dungan-style mosque.
  - No cross highways run over the lake.
- Trunk highways: 28 m wide and graded. The land is cut down to them, or banked up, and deep valleys are spanned by viaducts. Cuts deeper than 22 m become galleries. Cuts deeper than 45 m close into tunnels with portals.
- The last 5–7 km settle into a quiet open floor between converging walls, so the goal is seen across open ground rather than met in a tunnel.
- **Goal:** a vast pale ring (r 130 m) standing across the end of the road, with a faint light inside it and a circle of stones around it. Reaching it ends the run with 「旅の果てに着いた」 and sends you home.

## Sky

- The sun walks an ellipse over the forward sky (period 540 s): high, then to one side, then low ahead, then to the other side.
- The `MOODS` cycle (rose dawn, pale gold, amber dusk, lilac, blue hour, teal mist) blends over the biome palette. At altitude the sky deepens and a cloud sea forms.

## HUD

Speed, three hull pips, a single warning line, a red vignette, and a retro brass compass in the bottom right. The compass has no letters. Its needle points 奥 (toward the goal) and is a damped spring that swings and shivers. Nothing else.

## Roadmap (not built yet)

1. Home loop: return to the hangar to bank what you found, then upgrade (hull, engine reliability, crank odds, grip, a shield against side entries).
2. Things to find: salvage and memories placed by region, plus a reason to come back.
3. Side entries: drones coming into galleries through the openings, and turrets that guard tunnel mouths.
4. Turrets on the ground with visible arcs, and denser defences on the lowland routes.
5. Events and story beats per chapter, with the goal's meaning revealed slowly.
6. Performance pass on real phones (chunk build cost, draw calls, the far ring).

## Known limitations

- Galleries treat both sides as walls in physics, even though the open side is drawn as pillars.
- Minor roads (`roadZ`/`roadX`) ignore the funnel and can climb the edge walls.
- Highway crossings can distort the terrain locally.
- Mobile performance has not been verified on hardware.
