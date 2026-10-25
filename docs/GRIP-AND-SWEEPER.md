# A fixed bow grip and a crossing interceptor — 25 October 2026

The owner's latest request is to research which part of the approved bow graphic should stay fixed during the draw, then implement a more intuitive action and a distinctly different enemy. This extends BOW-FLOW. The pale journey, horse pace, independent reins, one-arrow kills, staged destruction and quiet regional score remain.

## Evidence and the design inference

- [World Archery, Recurve](https://www.worldarchery.sport/sport/equipment/recurve) describes supporting the grip, drawing the string, energy stored in the limbs and release/follow-through. This supports distinguishing the supporting hand from the drawing hand. It does **not** establish a particular screen anchor or pixel sensitivity, and a UI grip anchor is not the archer's facial reference point.
- [Vogel and Baudisch, Shift, CHI 2007](https://www.patrickbaudisch.com/publications/2007-Vogel-CHI07-Shift.pdf) identifies finger occlusion and uncertainty about the contact/selection point as problems in touch selection. Its callout technique is not copied here. The applicable inference is to retain clear feedback above the drawing finger, keep the original touch near the enemy useful, and avoid hiding the enemy or moving the whole weapon with the hand.
- [PlayStation's official gaming glossary](https://www.playstation.com/en-cz/editorial/playstation-ultimate-gaming-glossary/) defines an attack tell as an accentuated preparation that communicates the coming attack and gives time to respond. Our interception timings, frozen aim and one-pass behaviour are original game tuning, not values prescribed by that source.

The resulting design decision is to fix the **grip position**, while allowing the limbs, string and direction to change about it. Fixing the entire graphic would prevent aiming; fixing the drawing nock would weaken the impression of pulling the string; following the target with the entire graphic made the supporting hand drift. These are design hypotheses implemented and mechanically checked here, not a human study proving an optimal feel.

## The supporting hand stays put

The local grip point is `(0, −24)` in the approved graphic. A touch chooses a comfortable anchor near the initial saddle/target corridor, bounded to the central 35–65% of screen width. That screen position is captured once per gesture. Growing the bow, rotating it, following a locked enemy and clipping near an edge all preserve that same point.

`WindArchery.fitGrip` fits the entire rotated envelope **about the grip**. It scales the drawing if needed instead of translating the supporting hand. `WindArchery.pose` eases angle and size, then derives the canvas centre from the fixed grip. Full-draw space is reserved before applying the 1→1.65 growth ratio. The arrow shaft now passes through the grip to a small visible forward tip. The approved limbs, rigid ears and straight string remain.

A valid lock can rotate the bow about this grip while its enemy moves, without moving the grip itself. Once the player deliberately steers, the aiming ray follows the finger's counter-rotation and the selected enemy must remain near that ray. A target far outside it loses the lock, so a free shot cannot secretly snap back in the opposite direction. A new manually selected target must still win the 65ms confirmation; an unconfirmed candidate is not an invisible homing reservation.

The angular control reference settles forward when the player extends a straight pull before steering. Its lever remains one viewport draw length, rather than growing all the way to the bottom of the screen. This preserves usable horizontal travel on small phones and in landscape. After steering begins, extending along the current control ray preserves its direction. Existing 3px slack, 80% commitment, .24s recovery, 420m range, cancellation and independent lower-screen reins remain.

Menus, hiding the page, blur, death, travel, vehicle changes and resizing cancel the gesture. Release freezes the last displayed grip pose; there is no fallback jump back to a target-following bow.

## The new wing is an interceptor, not another launcher

One normal aerial slot in each five/six-enemy patrol is replaced with a wide swept-wing machine. Its merged model and banking silhouette differ from the rotor drones. It is excluded from both missile launchers and close-range guns; a lone interceptor cannot prepare a phantom missile/gun cue. No additional projectile stream is introduced.

Its sequence is:

| Phase | Behaviour and counterplay |
|---|---|
| Crossing | Starts when the patrol is within 430m. It sweeps about 164m sideways with banking and a changing height. Follow its lock or aim ahead of its lateral movement. |
| Braking tell | After at least 2.2s, an allowed firing window, unobstructed view and an on-screen forward position permit a .95s halt. The wing spreads and the amber eye pulses; this is a clean shooting opportunity. |
| Frozen dive | The predicted rider point is captured at the start of the tell. The machine accelerates along that fixed line for 1.55s, with no later tracking. Shoot it or move out of the line. |
| Recovery/exit | It climbs away for 1.7s, cannot damage the rider again, and leaves the encounter. There is no repeated surprise charge from behind. |

The attack replaces one slot, does not increase the maximum target count and keeps the existing director/rest/scenery reward. It is only prepared in the forward, visible 170–430m patrol band. Shelter, attack-off, withdrawal and sharp turns cancel the appropriate preparation/dive; cover and terrain prevent an unfair approach. Menus freeze its phase clock. Its nose points towards the captured line during the tell rather than misleadingly following a later dodge.

`world/sweeper.js` owns the deterministic phase clock and trajectory. The real game applies relative swept contact against the moving rider, including the final dive→climb frame. Combined contact radius is .95m: the .32m rider core plus a deliberately forgiving .63m enemy contact core. Contact can cost at most one existing damage event per dive. It uses ordinary health, invulnerability and mild hit slowdown, with no new splash or road collider. An arrow can destroy it in any phase; the tell does not add invulnerability or extra hit points.

The interceptor shares one eight-instance mesh; normal hidden rotor instances and existing eye instances retain their bounded buffers. Clearing the encounter also clears this mesh. A surviving interceptor's escape is not counted as a kill.

## Recorded checks

- All 58 Node tests pass, including fixed grip transforms, every padded viewport corner, diagonal draw extension, angular steering, ray-based selection, capture/let-down, deterministic interception and one-hit versus timed dodge at 20/60/120Hz.
- The focused actual WebGL audit passes at 390×844, 844×390 and 320×568. A canvas transform probe observes the rendered grip itself, not just its state, and requires less than .01px movement throughout a held draw/retarget. Native two-finger bottom-edge drawing, counter-steering, the newly chosen enemy's destruction, bounds and the existing burst/fragment/spark checks remain.
- The new interceptor browser audit runs its real collision/update path at 20/60/120Hz. Each straight-moving rider loses exactly one health point, each timed 5.16m sidestep avoids contact, and the interceptor emits no bullets. Real driving on all four routes reaches cross, windup, dive, climb and exit, with a 163.5m lateral span. The .95s tell and 1.55s dive remain consistent. The three-view test interrupts its tell with exactly one actual arrow and verifies the separate mesh clears. Turn/clear cancellation and the lone-interceptor cue guard are covered.
- The full mounted audit passes simultaneous input, five one-arrow kills without subtracting speed, the 256 visible-missile cap and cancellation. Its four 100s ordinary-health riding runs produce 11/5/11/11 kills (desert/mountain/lake/silk), retain minimum health 3/3/3/2 and travel approximately 3.56–3.94km. These use a scripted controller, not a human difficulty judgement.
- The separate four-route incoming-fire audit retains three salvos, safe ground placement, all 18 direct/ballistic/cruise hit-versus-dodge cases, and approximately 9.45–9.85s of bow/incoming-fire overlap. That density/phrase run uses invulnerability; an escaping interceptor is not recorded as an arrow kill.
- The 55.68s recorded music audit retains automatic regional changes, the shared context, 2.4s crossfades, pause/settings, loop wraps and the 1.6s main-thread stall. Minimum 100ms RMS is .01509 and maximum adjacent-sample step .02009, with no game errors. Impact synthesis and its previous waveform/voice limits are unchanged.

These are software Chromium/WebGL and scripted input checks. Physical-phone feel, subjective sound and real mobile frame rates remain separate.
