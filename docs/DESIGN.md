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
5. **Drones are scenery first.** Formations cross the sky every 2–5 s, with up to seven at once and most of them peaceful flybys. There are 19 figures:
   - The original four: V, ring, wave and helix.
   - Geometric figures: rose, pentagram, lattice, bloom, spiral, lotus (hexagon in triangle), mandala (three counter-turning rings), infinity, trefoil knot, Lissajous, sunburst, galaxy (two arms), chevrons, pinwheel and diamond.
   - About half of the curved figures slowly breathe into a second figure and back.
   - Peaceful eyes come in teal, pale gold, lilac, green or pink. Hostile eyes are always amber.
   - Each figure fires its own pattern: an opening flower, spiral arms drawn in seven bursts, a curtain with one gap, rings, or spokes (lines of bullets at stepped speeds that unfold as turning rays).
   - Every pattern is aimed at where you are now and flies at `BULLET_SPD`. At full speed you outrun them (`DRONE_MAX` 62 m/s).
6. **Route heat.** The mountain belt (centre lane) is technical but quieter. The lowland roads either side are faster but draw much heavier fire.

## Feel (numbers to protect)

- Sidecar: cruise 40 m/s, max 98 m/s (chopper 95, board 80). Flow builds speed while you keep going: cruise × (1 + 0.5·flow), max × (1 + 0.3·flow).
- The long pull: held straight, the engine keeps winding up toward 96% of the top end at about 2.3 m/s² × (1 − v/top), which is slow, and 30% stronger on tarmac. Laid over in a bend, speed bleeds back toward about 1.3 × cruise (around 190 km/h).
- Off the tarmac grip is 68% of the on-road value, so the machine slides more. The slide is still turned back into forward speed, so the sliding feels like flowing rather than braking.
- Steering follows lean: yaw rate = K·tan(lean)/v^0.88. The lean still takes time to build, which keeps the weight, but the response is quicker and more willing than before (roll rate: sidecar 4.3, chopper 5.0; grip keeps 78% at top speed).
- Road affinity (`roadAffinity`): the machine wants the road as much as the rider does, and only ever helps what the stick is already doing.
  1. With the stick near centre on a highway, the heading settles onto the road's line.
  2. Turning onto a road within 36 m of it, the turn is finished onto the line and leftover lean is eased off. Measured overshoot after letting go went from 12° to 5° at 110 km/h, and from 8° to 3° at 200 km/h.
  3. Near an edge and heading out without firm steering, there is a soft nudge back and the outward slide bleeds off.
  4. While the road is helping, grip rises by up to 45%.
  5. The approach: heading toward a road within 95 m at under about 65°, and not steering harder into it, the machine flies a glide path. Its angle to the road shrinks with the distance left, so it eases in on a long S and banks visibly (`P.assistLean`). Measured: from 70 m out at 29° it ends on the centre line, and at 52° it ends in the lane. Without the help it would cross straight over. At 80° it treats the move as a crossing and does not help.
  Steering firmly off the road always wins: a full-lock exit still leaves the road (measured 40 m off in 2.5 s).
- Tunnel and gallery walls are computed from the same 8 m samples the builder draws them from (`cutAt`). A gallery has a solid wall on one side and pillars every 16 m on the open side: you can leave through the gaps, but not through a pillar. A tunnel is solid on both sides.
- Highways carry obstacles about once every 440 m, always leaving a lane open:
  - Dead cars and fallen trunks are low enough for the auto-hop.
  - Overturned lorries, concrete blocks and tree crowns are `noHop`, so you have to go round them.
  - None are placed in tunnels, near home or in the last 3 km.
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

## The turret

Hold the compass for 0.45 s and a steam-age twin gun unfolds out of the sidecar chair: two latches, two clanks (ガチャン、ガチャン), and a lurch each. Press the compass again to fold it away. (On a keyboard, T toggles it.) It is built from iron and brass, with a copper boiler, a pressure gauge, an ammunition drum and a shield plate.

Raised, it picks the nearest hostile drone ahead within 720 m and fires homing tracers from alternate barrels, 15 rounds a second. One round kills one drone, so a formation goes down in a fast rolling ドドドドドン. Measured: a 30-drone formation was gone in about 2 s. Peaceful formations are never targeted, and it does not fire under a roof.

This is deliberately overpowered for now. Variations, stamina and balance come later, along with boss targets.

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
