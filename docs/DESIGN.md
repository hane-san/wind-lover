# Wind Lover — design

## Pitch

**「壊れかけのバイクで、何かを探して戻ってくる」** (on a half-broken motorbike, go out looking for something and come back).

Leave the hangar at the back of the land and ride toward the sun, deeper in. An abandoned line runs through successive basins and passes. Something waits beyond its last station. You can reach it in one run in theory, but in practice that is very hard. The long game is a metroidvania or Wizardry-style loop: go out, come back, improve the machine, push the range a little further. The loop is not built yet.

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
- Short inputs are sidesteps, held inputs are arcs. Holding the stick to one side builds `P.hold`. Yaw from lean starts at 30% and reaches full strength only after about 2.4 s of holding (yaw K 33). The sideways float is the main short-input response: up to 8.5 m/s, building at 3.2/s. Measured at about 180 km/h: a 1 s input gives about 9° of heading and 5 m of sidestep, while a held input turns the line in a wide arc. A drift is unaffected.
- Lateral feel (spring): the lean rides a damped spring (natural frequency 1.55 × roll rate, damping ratio 0.62), so it goes over with weight, overshoots a touch and settles. Yaw from lean is about 14% lazier than before. On top of that, a sideways float of up to 5.5 m/s toward the turn builds quickly and dies slowly. The machine first slides across while still pointing ahead, the heading follows, and the line sways. The rider hangs into the bend a beat late and looks into it, and the dog looks too.
- The long pull: held straight, the engine keeps winding up toward 96% of the top end at about 2.3 m/s² × (1 − v/top), which is slow, and 30% stronger on tarmac. Light direction changes keep the pull. Only a really hard bend (lean beyond about 0.6) bleeds speed back toward about 1.3 × cruise (around 190 km/h).
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

The map now follows a fixed abandoned railway through a chain of basins and passes. The 19 October 2026 reference note supplies the feeling of a world continuing beyond the line; Wind Lover retains its existing vehicles, handling, Central Asian landscapes and optional threats.

- +x is 奥, towards the sun. Home remains the hangar at `BASE_X` (−230 m); the ring stands at x = 120.3 km.
- `BASINS` defines alternating open country and narrow passes rather than a land that only shrinks. The widest basin is 26.9 km across. Opening out again after a pass reveals a larger landscape.
- `LANES` defines all 120 km without cycling back into earlier chapters after 64 km. The existing 14 palettes remain available as individual worlds.
- `LINE` is a fixed railway through the fields, the north shore of Issyk-Kul, mountain valleys, steppe and desert. Its 28 m maintenance bed can be ridden in both directions. It is distinct from the board's grind rails.
- Ten stations have faded signs, overgrown platforms, broken canopies, stained waiting rooms, stopped clocks, water towers, empty carriages and a memory to find. Only two settlements retain a single warm window. Each has a 3.2 km service-road loop that rejoins the line. Remaining canopy panels shelter the rider from aerial attacks; missing panels have neither roof collision nor shelter.
- Two broken bridges, x = 28.64–29.12 km and 68.40–68.96 km, leave real gaps in the railway. Each has a service road branching 2.4 km before the break and rejoining 2.4 km after it. The roads remain available in both directions; jumping is not required.
- The railway crosses roads on raised decks. Its supports have collision, and ground selection distinguishes riding underneath from riding on top. The ordinary road assistance also works on the maintenance bed and service roads, whilst firm steering still wins.
- Trunk highways retain their 28 m width, graded banks, galleries and tunnels. Cross-country connections now occur at selected junctions rather than in every grid column. Minor roads stop at the lake, outer ranges and final approach.
- The railway is generated deterministically from global coordinates, with coarse distant spans beyond the loaded detail tiles. Nearby detail remains streamed in 480 m chunks; increasing the journey length does not load the entire map.
- The last few kilometres still settle into open ground around the pale ring. Reaching it ends the run and returns the rider home.

See [MAP.md](MAP.md) for the route and verification notes.

## Sky

- The sun walks an ellipse over the forward sky (period 540 s): high, then to one side, then low ahead, then to the other side.
- The `MOODS` cycle (rose dawn, pale gold, amber dusk, lilac, blue hour, teal mist) blends over the biome palette. At altitude the sky deepens and a cloud sea forms.

## Landmarks: the region remembered

Half of the giants are homages to Central Asia. They are never replicas, but someone who has travelled there should catch the reference. Kyrgyz and Uzbek memories come up most often. Each land has its own list (`HOMAGE`), built by `HOMAGE_BUILD`:

| Landmark | What it remembers | Where it appears |
|---|---|---|
| `registan` | A square framed by three madrasas: tiled portals with star tilework, ribbed blue domes, leaning minarets | Uzbek |
| `kalon` | A banded brick tower with a lantern of arches and a broken mosque wall | Bukhara-like towns |
| `burana` | A stubby brick tower on a grassy mound with a field of balbal stone figures | The Chuy valley |
| `yurtFrame` | The bones of a giant yurt: red lattice, roof poles, the open crown ring, rags of felt | Kyrgyz and Kazakh |
| `feltSlabs` | Contemporary felt: tall slabs in an arc, faced with the ram's-horn shyrdak ornament | Kyrgyz |
| `girihDome` | A dome dressed in eight-point star tiles, with an extruded girih star sculpture | — |
| `gateOfHell` | A burning crater in the desert: scorched pit walls, a floor of fire, rising embers | Turkmen |
| `shipGraveyard` | Hulls left in the sand when the sea went away | The Aral Sea |
| `caravanserai` | A stone caravan inn half sunk in a mountain meadow | Tash Rabat |
| `sanatorium` | A curved Soviet lakeside sanatorium with an empty pool | Issyk-Kul |
| `mosaicHall` | A Soviet mosaic wall on concrete legs: a sun, lake waves, three figures | — |

The other half are the biome's own marks and the uncanny geometric ones, which grow more common as you go deeper in. The ornament textures (shyrdak, girih, mosaic) are drawn once on canvases.

## Starting anywhere

「どこかの道から走りだす」 sits at the top of the start screen. It switches to the connected journey and drops you onto a random trunk highway at cruising speed. The spot is chosen between 1.5 and 113 km in, alternating between the railway and trunk highways. Railway starts avoid broken bridges and their approaches; highway starts avoid tunnels, the lake and the edges.

## The land beside the road

Cuts shallower than 22 m are now graded into wide, rolling banks (14 m + 2.6 × depth) rather than steep walls. You can ride up off the road, look around and come back down. Deep cuts keep their steep sides, galleries and tunnels.

## Assault formations (dodge them, or answer them)

Some hostile formations come straight up the road at you (`mode: 'assault'`). Only one runs at a time, and it becomes more likely when you are moving fast.
- They turn about 230 m ahead and hold there, weaving, for 15 s, then climb away.
- Their rounds keep your pace and close at 72 m/s, so each pattern takes about three seconds to arrive. That is long enough to read it and slide into the gap.
- There are six patterns in rotation:
  1. A curtain with one gap, placed away from where you are.
  2. An opening fan.
  3. A widening ring: stay in the eye, or ride out past it.
  4. Three aimed streams.
  5. A sweeping spiral.
  6. A staggered double curtain.
- Grazing a round (passing within about 5 m without being hit) gives a bright chime that climbs with a run of grazes, a spark, and a little flow.
- With the turret up, these formations are the natural prey. Its 560 m forward reach usually starts the chain before they settle.

## The turret

Hold the compass for 0.45 s and a steam-age twin gun unfolds out of the sidecar chair: two latches, two clanks (ガチャン、ガチャン), and a lurch each. Press the compass again to fold it away. (On a keyboard, T toggles it.) It is built from iron and brass, with a copper boiler, a pressure gauge, an ammunition drum and a shield plate.

Raised, it idles with a slow watchful sweep. It guards the road ahead: it tracks hostile drones in a forward cone from 900 m and opens fire inside 560 m. It fires small fast rounds (1100 m/s) at 22 a second from alternate barrels, with recoil kick, muzzle flashes and spent brass cases flying out of the side.
- Three rounds kill a drone: two clinking hits, then the blast.
- A blast is a white core, a swelling fireball, a pale shock ring, falling debris and smoke.
- A neighbour within 11 m has a 50% chance of going up a beat later, so blasts run through a formation as a chain.
- Kills that follow within 0.6 s climb a pentatonic scale. The chain rings out as one rising phrase, with the screen punching a little harder as it climbs.
- The gun sound is powder and iron (ガガガ): a blast of charge, the breech slamming, a ring of steel and a thump in the chest. Each kill is a deep falling blast with a sub-bass drop, then shrapnel rattling down after it.
- Measured: a 27-drone formation was gone in about 2 s once it came in range.

Peaceful formations are never targeted, and it does not fire under a roof.

This is deliberately overpowered for now. Variations, stamina and balance come later, along with boss targets.

## Sky by place

The mood palette (ten moods, including green-grey haze, faded peach over slate, cold silver, and violet with a gold horizon) is chosen by position as much as by time. Each stretch of land keeps its own pale sky, which drifts slowly with the hour, and the strength of the mood tint varies across the land (0.36–0.6). The biome palette and the altitude sky still sit underneath.

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

- Highway crossings can distort the terrain locally.
- Mobile performance has not been verified on hardware.
