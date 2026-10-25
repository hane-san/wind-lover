# A drawn bow, moving aim and a fuller encounter — 25 October 2026

This is the owner's latest mounted-combat direction. It builds on SKY-RHYTHM and the sideways weighted draw, and supersedes their short-stroke, stable-until-unavailable lock, three/four-target and two-salvo limits. Keep the approved recurved outline, melancholy landscape, regional music, rear camera, independent reins and physical road network.

## Draw, steer, release

The upper pointer retains the bow role until release, including when it crosses the saddle and reaches the bottom edge. A lower pointer still steers independently. Draw distance is now 40% of the shorter viewport side, bounded to 110–170 CSS pixels. Three pixels take up slack; 80% of the remainder is enough to shoot. This gives **125.4px at 390×844/844×390 and 103px at 320×568**. Saddle-directed, left/right and slightly upward sideways strokes retain their previous directional forgiveness. There is no extra holding timer.

The approved bow starts wider (span 23% of the shorter side, bounded to 70–96px) and grows up to 1.65 times through the draw. The fitted grip remains on the aim–saddle segment; the long string may extend past the saddle into the lower screen. The entire graphic still fits a padded viewport. Its position, angle and size ease towards the moving aim; every intermediate pose is fitted again, and a too-short gap yields to the physical riding bow. Recoil starts at the last displayed pose.

At readiness, the hand position becomes the steering origin and the chosen target becomes the aiming origin. A further horizontal hand movement over 20px enables aiming. Beyond 12px slack it moves the sight at 1.35 pixels per finger pixel, with restrained vertical movement at .35. The aiming point follows with an 18/s exponential response. Small hand movement leaves the lock intact.

An eligible neighbour must beat the current target by 28% of their projected separation, bounded to 6–20px, for 65ms. This hysteresis makes crossing a target boundary deliberate without chattering. Hidden/off-screen, rearward, reserved and withdrawing targets remain excluded. The bow follows the free aiming direction whilst the chevrons confirm the selected enemy. Free shots also use the moved aim.

A drawn string stays ready whilst the hand sweeps sideways. Bringing it back within 35% of full draw distance from the original touch lets down again. Cancellation, lost capture, menus, blur, hidden tabs, travel, death and changing vehicle clear the gesture. Release remains one arrow/one kill; recovery is .24s, with no ammunition counter or random chains. Range is now 420m to let the higher sky targets participate earlier. Existing movement, rider hit core and horse speed are unchanged.

## The shot is visible through the hit

A fixed 160-segment world wake lasts .42s instead of .16s, including the final segment into an enemy. Its projection has a 5.5px translucent dark edge and a 2.4px pale inner stroke, so it reads against both sky and terrain without a full-screen effect. The wake remains after the arrow disappears at impact and clears with the arrows. There are still twelve physical arrow slots.

Bow hits use a larger local white core, a 36m fireball growing over .62s, a .55s expanding shock ring and an additional warm .78s glow. Smoke and the six spinning shell/arm pieces remain. The effect does not damage neighbouring enemies or enlarge the rider's hit core. Existing transient sprites are bounded to approximately 120; fragments retain the fixed 48-slot mesh. No hit stop or speed penalty interrupts riding.

The cached impact sound is now .65s, with more low body and a longer breaking-metal tail. Its buffer headroom is set before caching; the actual mixed variants remain below .6 peak in the OfflineAudioContext audit. The release stays light, broad-band air. The shared mixer, independent music gain, 27-buffer cache and 24-voice cap remain.

## A busier encounter inside the quiet journey

Patrols contain five or six enemies. Stable slots combine heights up to roughly 180m with two lower enemies. The leading low slot starts 100m nearer and descends another 18m as the centre approaches 250–90m ahead, giving a larger, closer target. Existing targets do not jump on a kill, and landscape departures retain the original aspect-aware height scaling. Roadside sentries still require a safe shoulder and share the patrol's firing clock.

A patrol may launch three geometric salvos, with a .62s cue and 1.3s recovery. Missile preparation remains limited to 515–220m ahead, overlapping the new 420m bow range. The director grants 5.8s of permission in each 9.4s phrase, with pauses and sharp-turn suppression. A phrase boundary may delay a subsequent release. Surviving close enemies retain the cued machine gun and forward-only withdrawal. Initial scenery, regional rests, victory rewards and low-health relief remain intact.

The missiles mix three visible trajectories within the same frozen geometric arrival pattern:

- Direct: straight from the actual launcher to the launch-time predicted arrival point.
- Ballistic: the existing analytic loft and constant gravity; roadside launchers retain their taller arc.
- Cruise: a raised, laterally weaving corridor that returns to the exact same frozen endpoint, with no homing. For normalised flight time `u`, vertical offset is `H × 16u²(1−u)²`; lateral offset is `W × sin(2πu) × 16u²(1−u)²`. H is 36m times the departure height scale; W alternates between ±12m. Offset differences integrate exactly across frame rates. Delayed rows begin at the correct elapsed point on their curve; rendered bodies face their actual movement.

All paths retain swept relative collision, the .32m rider core, no large missile splash, open geometric corridors, the 256 acceptance/render cap, fixed twelve-sample trails and per-source cancellation. Already launched missiles remain real when their launcher is destroyed. Roofs, attack-off, withdrawal, travel and sharp turns still cancel the appropriate pending fire.

## Recorded validation

- All 47 Node tests pass: the longer strokes, directional tolerance, bottom-edge draw, deliberate retargeting, jitter rejection, let-down, pose fitting, cooldown and both analytic paths are covered.
- The focused actual WebGL/DOM audit passes at 390×844, 844×390 and 320×568. It checks larger drawn bows, bottom-edge steering, near-side hits, viewport pixels, wake lifetime, fragments and cancellation. Its native multi-touch case holds the reins, draws to the bottom, switches target and destroys exactly the newly selected enemy whilst leaving the old one alive.
- The four-route phrase audit produces three salvos and five/six kills, with roughly 9.8–10.55s of bow/incoming-fire overlap and a maximum 6.22m riding offset. This density/phrase run uses invulnerability.
- All 18 real missile comparisons pass: direct, ballistic and cruise at 20/60/120Hz each hit a straight-moving rider and miss the timed 5.16m sidestep.
- The separate four 100s ordinary-health riding combats pass: desert/mountain/lake/silk produce 11/5/11/11 kills and approximately 3.56–3.94km travelled. Minimum health is 3/3/3/2. These use a scripted controller; they are not a human difficulty assessment.
- The full mounted audit also passes native simultaneous controls, five one-arrow kills without subtracting speed, 180s encounter density (maximum six hostiles and 82 live missiles), the saturated 256 visible cap, roof/off/rear cancellation and saved tuning.

The 27-variant weapon audit passed with impact peaks .506–.570, silent endpoints, a 24-voice cap and cancellation. The 57.9s recorded automatic-music audit passed default-on/shared-context playback, 2.4s automatic crossfades, loop wraps and a 1.6s blocked main thread; minimum 100ms RMS was .01391 and maximum adjacent-sample step .02023, with no game errors. These checks use software Chromium/WebGL, not physical-phone touch, real-device FPS or subjective listening.
