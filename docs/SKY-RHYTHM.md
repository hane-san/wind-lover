# Sky, riding and the answering bow — 24 October 2026

This update builds on `a825f79`, including the weighted sideways draw, separate bow/lock layout and shattering impacts. It follows the owner's request for sky targets, beautiful missile trajectories, a rhythmic mixture of evasion and shooting, ground enemies, quieter speed-related hooves, changing music and a slightly more distant camera. The connected world, riding pace, small hit core and regional melancholy remain.

## The encounter phrase

A patrol still contains three or four targets. `world/patrol-score.js` assigns stable slots: a 76m base height, additional heights of 0/80/38/104m and staggered depths, including one target 68m nearer. These are terrain-relative heights. A new patrol scales the heights and loft to 58–100% for the viewport aspect, keeping a landscape volley within the shorter vertical view. Existing enemies and missiles never jump when the screen rotates. A nearer low target can enter bow range whilst the distant, higher launchers are still releasing missiles. Destroying a neighbour no longer makes the remaining aerial targets jump to different slots.

The director grants 4.2s of firing permission in each 9.4s phrase, with the existing bend restriction. A patrol can launch **at most two** geometric missile salvos, with a .68s cue and 1.55s recovery: about 2.2s between releases. The launch band extends down to 285m, so the second reading overlaps the start of the 360m bow window. The two existing open-sided patterns alternate their opening between +7m and −7m relative to the frozen aim. The other nine-pattern geometry and generous projectile spacing remain. This encourages a second sidestep and several answering arrows without demanding a score-perfect beat.

After those two releases there are no more newly prepared missiles from that patrol. Already airborne missiles continue. Surviving enemies below 155m retain the close-range machine gun, now with a .8s cue and 1.7s recovery; retreat below 55m and the prohibition on rear fire remain. Victory still ends the engagement early and earns landscape time. Regional rests, low-health relief and the initial scenic interval are unchanged.

Each original launcher owns its share of the salvo. A destroyed launcher cannot contribute to subsequent launches or delayed rows. Delayed rows already committed to the current phrase can finish during an ordinary firing break, but shelter, sharp turns, attack-off, withdrawal and destruction cancel pending fire. Launchers hidden by terrain or buildings cannot launch. No randomness is added to the one-arrow kill.

## The ground network

From the second encounter, two cycles in three may replace one aerial target with a stationary unmanned roadside launcher: tracked chassis, twin raised missile boxes and an amber optic. It participates in the **same** paired salvos and close-range phase, rather than adding an independent crossfire timer. Its missiles rise in a higher arc. It uses the ordinary bow reservation, hit and destruction path.

A site is sampled about 730m ahead and 10m outside the road's half-width. It must also clear every nearby featured, railway, highway and minor-road corridor by at least 5m, have less than 10m of shoulder/deck height difference, lie above the water plane and clear buildings. Unsafe cuts, viaduct edges, water and occupied sites fall back to an aerial target. No roadside enemy collider or obstacle is added to the riding corridor. A terrain/building sight check also prevents a concealed ground launcher firing through cover. The first encounter is aerial only.

## The missile stroke

The aim remains frozen at release. Closing speed is still 124m/s, with a minimum 2.7s flight for a late second salvo. Each missile adds a quadratic vertical arc: for extra height H and flight time T, initial vertical lift is `4H/T` and constant vertical acceleration is `−8H/T²`. H is 70/86/102m for aerial sources and 120m for ground sources. Exact constant-acceleration integration preserves the original arrival point at different frame rates; this is a ballistic visual trajectory, not hidden homing. Delayed rows account for the rider's frozen launch-time velocity.

Dark bodies, fins and warm exhaust remain, with the distant visual scale reduced to a maximum 2.2 to avoid dense blocks at launch. A fixed twelve-sample history gives every live missile about half a second of curved, pale exhaust trail. Per-vertex opacity fades its end instead of painting a black tail. The 256-missile cap remains the acceptance/render cap. Tails share one bounded line mesh; ground machines share one eight-instance mesh. No extra render target, composer or blur is introduced. Quiet, travel and roof clearing also clear both meshes.

## Horse, camera and music

The mounted panorama moves from distance 14 to 17, retaining height 20, FOV offset 46, pitch −5 and framing +.08. Only the untouched previous mounted panorama migrates. Custom views and handling remain saved. The panorama preset offers the new distance; obstruction recovery, tunnel caps, preview and comparison remain.

The gait's cadence now changes across the actual 12–40m/s riding band, instead of being tuned mostly for the superseded 90m/s horse. It rises from about 1.43 strides/s at 12m/s to 1.96 at 38m/s, capped at 2.02. The same gait drives model feet, contact dust and audio-clock hoof reservations. Strike gain falls from .36 to .265, about 26%, and slow contacts are slightly softer. Surface colours, four grouped contacts, cancellation, airborne silence and missed-frame scheduling remain.

The twelve existing original chamber songs remain. In automatic mode, after approximately a complete 55–65s song the playlist waits for a scenic/withdrawal interval, then chooses another of the region's four songs with a 2.4s crossfade. A recent-song history prevents repeating one of the last three regional choices. This also works whilst staying in the same landscape. Menus, tuning, death, hidden tabs, music-off and manual song mode cannot cause automatic rotation. Stable-region polling and deliberate departures still select regionally. Loading retains the old loop; the shared audio context, default-on gesture unlock, two-buffer cache, fallback rendering, cancellation and independent SFX gain remain.

## Review and verification

- `node --test tests/*.test.mjs`: gesture, slots, paired permission, analytic arc landing at 20/60/120Hz, speed cadence and non-repeating automatic playlist decisions.
- `python tests/sky-rhythm-browser.py --three /path/to/three.min.js`: actual physics on all four routes, at most two launches, the drawing/incoming-missile overlap, real aerial/ground arrow hits, safe ground placement, three viewport renders, trail shader/pool clearing. Its phrase-density run explicitly uses invulnerability; the ordinary-health riding combats are in the separate audit below.
- `python tests/archery-browser.py --three /path/to/three.min.js`: native simultaneous reins/draw, decisive hits, swept collisions and timed dodges at 20/60/120Hz, 180s density, four ordinary-health riding combats, cancellation and visible cap.
- `python tests/bow-feel-browser.py --three /path/to/three.min.js`: preserve the approved sideways draw, fitted separate bow, lock removal, recoil, arrow wake and shattering.
- `python tests/horse-rhythm-browser.py`: audio-clock contacts, missed frames and cancellation. The gait/foot IK and riding checks remain relevant.
- `python tests/music-browser.py --three /path/to/three.min.js`: recorded output through loops, manual and actual automatic crossfades, a 1.6s main-thread stall, menu freeze, settings and cancellation. Only its automatic-age probe is accelerated; actual selection, loading and output use the real engine.
- The camera panorama and journey-camera browser audits cover preserved custom settings, pause, scrolling, A/B, blocking geometry and tunnel clearance.

These are software WebGL and scripted input checks. They establish mechanical behaviour and audio continuity, not human difficulty, subjective listening, physical-phone touch feel or mobile FPS. The balance is intentionally generous: landscape time and a flowing bow response take priority over surrounding or trapping the rider.

### Recorded implementation checks

All thirteen Node test files passed. The new four-route phrase audit measured two launches 2.2s apart, approximately 4.9–5.5s of bow/incoming-fire overlap, three or four arrow kills per patrol and a maximum 6.23m riding offset. A safe mountain shoulder supplied a real ground target; the lake/raised-road sites correctly fell back to aerial targets. The separate four 100s ordinary-health combats destroyed 7/3/7/7 targets (desert/pass/lake/silk), retained all three health points and travelled about 3.56–3.94km. The 180s invulnerable density run peaked at four targets and 120 live missiles, below the fixed 256 cap.

The three-view bow audit retained sideways and near-side shots, independent controls, 69.24px/56.92px draw thresholds, speed and shattering. Camera comparison, custom saves, obstruction recovery and tunnel clearance passed. The hoof-clock audit retained distinct contacts at 20/30/60/120Hz through a missed update, with no retained voices. The music output recording covered 76.68s, including actual automatic selection/crossfade and the 1.6s main-thread stall: minimum 100ms RMS .01397, maximum adjacent-sample step .02050 and no game errors.
