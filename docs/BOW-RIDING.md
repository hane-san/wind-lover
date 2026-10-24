# Mounted archery — 24 October 2026

The owner's latest direction supersedes the 116m/s horse and the rotating geometric/kinetic/guided-missile waves in VOYAGE-FLOW and DEFENCE-RHYTHM. Keep the current world, quiet soundtrack, independent reins, small hit core and camera tuning. The central loop is now: a patrol appears ahead, dodge its distant missile geometry, draw and release whilst galloping, destroy individual drones in one hit, and earn another quiet stretch. Surviving enemies become dangerous with short machine-gun bursts at close range.

## Controls and view

Fresh installs select the horse and **大パノラマ**: FOV offset +46° (portrait base 112° before the small speed contribution), height 20m, pitch −5°, distance 14m, framing +.08. Other vehicles also start with this preset. Old untouched camera defaults migrate once; explicit camera adjustments and presets remain intact, including missing fields in partial older saves. The existing comparison, preview, sliders and per-vehicle saving remain.

A pointer's starting position selects its role for its entire lifetime. Below the projected saddle is the existing movement stick. Above it is the bow: a nearby touch acquires the small lock marker immediately; pull towards the horse and release. A white recurved-bow outline flexes between the selected target and the saddle, with no large circle. See [RECURVE-FEEL.md](RECURVE-FEEL.md) for the regional research and latest draw tuning. Two fingers can steer and draw independently. Mouse drags work in the same way and keyboard riding remains available.

`world/horse-archery.js` owns gesture state and the screen-space target choice. The invisible acquisition radius is 28% of the shorter viewport dimension, bounded to 88–150 CSS pixels, with another 18px of aim assistance. Full draw is 22% of the shorter viewport side, bounded to 70–96px; after 3px slack, release needs at least 80% of the remaining stroke, without a holding timer. Taps, pulling away, pointer cancellation, lost capture, menu opening, blur, hiding the page, death, vehicle changes and travel cannot produce accidental shots or stuck reins. There is a .28s release cooldown, no ammunition counter and no charge-power penalty.

Only hostile, unreserved targets within 360m and the forward view can lock. Buildings and intervening terrain exclude hidden targets. Small white chevrons confirm a lock and follow that drone throughout the draw. One arrow reserves one target and destroys it on arrival; another shot can immediately choose a different drone. There is no random blast chaining for bow kills. Twelve reusable arrow slots draw shafts, tips and feathers in one line buffer, with a fixed 96-segment short wake that persists through impact. Travel and vehicle changes release all reservations.

The rider raises a physical recurved bow, extends the left arm and draws the right hand to the cheek; the string and rein endpoints follow the hands. The original clothes, gallop, scarf and saddle absorption remain. Release and impact have separate cached sounds. Hits produce an enlarged core/fireball/ring, debris, a short white hit mark, bounded camera impulse and haptics. No hit stop or speed subtraction interrupts the gallop.

## Pace and patrols

The horse defaults are cruise 20m/s, base maximum 34m/s, acceleration 18m/s² and tailwind 1.5. Flow adds up to 30% to cruise and 12% to the base maximum; slopes and the soft cap can briefly put actual speed around 40m/s. These are still stylised travel speeds, not a claim of realistic equine performance. A featured departure starts at 90% cruise instead of forcing every vehicle to 52m/s. Only untouched old horse speed/wind fields migrate; deliberate tuning survives.

The lateral response still reaches 8.6m/s, now available at the lower riding pace. Lead-change bounds can begin above 18m/s. Road pull and sustained acceleration ease back; dust, grass, foreground motion, wind audio and roadside threads are retuned to the new pace. The panorama and its modest speed FOV remain, without adding a blur/composer.

One hostile patrol contains three or four drones; peaceful distant formations remain scenery. Patrols spawn about 690m ahead and follow the road's direction through bends instead of circling the rider. They close at approximately 23m/s relative to a horse. Firing becomes possible around 510m. The progression is:

| Distance ahead | Behaviour |
|---|---|
| 510–380m | Telegraphed geometric missile salvos |
| 380–155m | No newly prepared missile salvo: ride into the 360m bow range and shoot |
| 155–55m | .65s cue, then short, frozen-aim machine-gun bursts |
| Below 55m | Disengage; never turn around and fire from behind |

The bow window before the machine gun is roughly nine seconds at the intended closing speed. Destroying launchers thins subsequent salvos; already launched missiles remain real. Defeating the whole patrol ends the engagement and earns quiet rather than immediately replacing the enemies.

The director retains a 13s initial view, 2.6s warning, up to 32s engagement, 4.5s withdrawal and regional rests (lake 32s, mountain 28s, desert 24s before cycle/health adjustments). A 6.2s beat alternates approximately 3.1s of permission to fire and 3.1s without new fire. Sharp bends pause fire. Low health shortens combat and lengthens recovery. Roofs and attack-off cancel projectiles and queued emissions; menus freeze simulation. Horse gameplay no longer adds the old overhead artillery or stop barrage to this forward encounter.

## Missiles and sound

The nine patterns use physical missiles: dark bodies, noses and cross fins, small warm exhausts, softly coloured fading trails. Missiles depart from actual patrol drones and unfold into fans, grids, rings, five streams, spirals, double gates, double diamonds, double hexagons and angular weaves. Aim is frozen on launch; there is no later homing. Closing speed is 124m/s (previously 108). The 380–510m launch band gives about 3–4s of flight. Basic horizontal spacing is 5.4–7m; repeated streams are .18s apart and staggered gates/inner polygons .48s apart. Open corridors remain within the road.

Bodies and exhausts use two instanced meshes capped at 256 visible missiles; the same cap is applied before accepting shots, so hidden overflow cannot damage the rider. Trails share the existing compact line buffer. The .32m rider core and swept relative hit test remain; the larger silhouettes deliberately make dodging forgiving. There is no missile splash damage. The older briefly guided dart module remains available for legacy/debug inspection but is not used by these patrol salvos.

Close-range rounds close at 230m/s, have 6m lateral spacing, three .075s rows and at least .42s flight. Bursts have a cue and recovery, rather than continuous tracking. They are harder than distant missiles but remain avoidable. Quiet recovery restores health after 22s of riding above 16m/s.

`world/weapon-audio.js` now warms 27 cached variants across nine kinds, including draw, string release and the weighty bow impact. Attacks and tails have short envelopes, scheduling uses the shared audio clock, and the 24-voice cap remains. SFX cancellation never stops the independent default-on music bus.

## Checks for the next audit

- `node --test tests/*.test.mjs`: gesture direction, cooldown/cancellation, target eligibility, victory/rest/bend behaviour, and existing gait/riding/camera/routes/music/climate tests.
- `tests/archery-browser.py` (`defence-browser.py` forwards to it): real WebGL, native two-finger capture/release plus DOM pointer cancellation/menu tests, three one-arrow kills, unchanged release speed, real riding pace, 180s patrol cadence, four 100s riding combats with ordinary health, forward/near attack ranges, a saturated visible-missile cap, roof/off/rear-queue clearing, old-save migration and mobile/landscape/small-phone screenshots. The 180s density run deliberately uses invulnerability; it is not proof of survival without dodging.
- `tests/dodge-browser.py --vehicle horse`: relative swept collisions, real physics sidestep, all nine open patterns, road corridors, atomic streaming and CPU timings. The mounted-archery test additionally compares straight hits with 5.16m sidesteps at 20/60/120Hz for missiles and close-range rounds.
- `tests/horse-riding-browser.py`: actual desert, pass and lake riding with lead changes and manual jump; retain grouped hoof sound and foot contact.
- `tests/camera-panorama-browser.py`: reversible presets, touch scrolling, pause, custom save preservation and tunnel clearance. `tests/weapon-audio-browser.py` renders all nine sounds and verifies cached voices and cancellation.
- `tests/music-browser.py`: actual recorded output across loop wraps, crossfades and a 1.6s main-thread stall, plus default-on, independent SFX/BGM settings and persistence.
- `tests/world-smoke.py`: route geometry, bridge/station clearance, streaming, driving and world changes.

Use Chromium and `--three /absolute/path/to/three.min.js` for the game browser checks. Software WebGL CPU measurements are not real-phone frame rates. Physical iPhone/Safari touch feel, missile readability at actual screen brightness and the final balance still warrant a hands-on pass.

### Recorded headless results

The implementation audit passed the 12-file Node suite, native multi-touch plus all mounted-bow browser checks, both camera-control audits, the horse riding and dodge audits, travel/scenery/music settings, cached weapon audio, recorded music continuity and the world smoke audit. The four 100s riding combats used ordinary health and a scripted lane/aim controller: desert/lake/silk destroyed seven targets each, the mountain road three, with no health lost and about 3.55–3.93km travelled per run. This establishes a playable mechanical loop under that controller, not a human difficulty judgement.

In the separate invulnerable 180s density run there were at most four hostile drones and 48 live missiles; scenic time was 85.7s, combat 72.7s, warning 7.95s and withdrawal 13.65s. A saturated-cap check accepted and rendered exactly 256 missiles. A scripted 5.16m sidestep avoided both weapons at 20/60/120Hz, whilst the corresponding straight path took one hit. Three touch-drawn arrows destroyed exactly three separate drones without subtracting speed.

The desert/pass/lake rein-change audit retained 0.33s / approximately 0.52m bounds and stayed within 3.11m of the road during its alternating inputs. The music recording covered 44.46s with loop wraps, crossfades and a 1.6s blocked main thread; minimum 100ms RMS was .01268 and maximum adjacent-sample step .02026. No game or shader errors were reported by these browser runs. Physical-device input feel and frame rates remain unmeasured.

The latest weighted draw, separate bow/lock layout, screen-edge fitting, .40s fracture sound and fixed 48-piece shatter pool are detailed in [RECURVE-FEEL.md](RECURVE-FEEL.md). They preserve the approved bow silhouette, independent reins, immediate pointer-up lock removal and one-hit kills.
