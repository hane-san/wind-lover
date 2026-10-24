# Recurved bow feel — research and implementation, 24 October 2026

The owner's follow-up removes the large white aiming circle. A nearby touch should acquire the existing small marker, then a recognisable Central Asian bow should flex around that lock. Shooting should read as a swift air-cutting release followed by a firm impact, with an arrow wake. The additional request asks us to research regional bows and make the commitment to drawing fit simultaneous horseback evasion.

## Evidence and design decisions

- [WTAF — Kyrgyzstan](https://wtafederation.org/members/kyrgyzstan) describes Kyrgyz traditional archery in terms of Central Asian composite bows, thumb draw and its relationship to mounted disciplines. This grounds the regional technique; it does not prescribe one universal historical draw length or draw weight.
- [Royal Armouries — Arms and Armour of the Mongol Empire](https://royalarmouries.org/objects-and-stories/stories/the-mongols/arms-and-armour-of-the-mongol-empire), especially the pictured 19th-century Central Asian bow XXVIB.178, provides a regional shape reference. Its explanation distinguishes the flexible limbs from the rigid ends and describes why short composite recurves suit riding. The museum's Mongol draw-weight discussion is not treated as a fixed Kyrgyz specification. The photograph was inspected for reference and is not redistributed in the game.
- [Dan Sawyer — Step-by-step: The thumb draw](https://www.bow-international.com/features/step-by-step-the-thumb-draw/) is a first-person technical explanation by the then-president of the British Horseback Archery Association. It explains how short horsebows can accommodate a long draw, and how a relaxed hand/wrist release helps the string clear. The game adapts the draw and release gesture, rather than presenting itself as archery instruction.
- [World Archery — Thumb draw competition](https://www.worldarchery.sport/news/202174/great-britain-hosts-first-national-thumb-draw-competition-joining-growing-archery-trend) corroborates the thumb-draw tradition and its contemporary mounted use. It is not used to infer a Kyrgyz bow's exact historical measurements.

The resulting interpretation is a short composite silhouette with a thin grip, flexible limbs and forward-turned stiff ears. The white graphic is an original stylisation, not a museum reconstruction. The rider's physical bow also has recurved limbs and pale reinforced tips; the draw loads its limbs and the release rolls the drawing wrist outwards.

## The playable draw

`WindArchery.begin` still assigns pointer roles at the saddle: below for reins, above for the bow. On the upper touch itself, a generous, **invisible** search area acquires a visible hostile within 360m. The small 18px ring appears immediately. The selected drone remains selected through camera and riding movement until hidden, off screen, destroyed, out of range or already reserved; another enemy cannot steal the lock merely by moving nearer the original touch.

The white bow and its string are centred on the lock, rather than on the initial touch. A finger draws towards the saddle. Flexible limbs bend whilst the short ears remain visually distinct, and two straight string segments meet at the draw point. The large circle and circular charge meter are gone. Ready feedback comes from the string/limbs turning a firmer white, the small marker's ticks drawing inward, and one short haptic cue when supported.

Full draw is 20% of the shorter viewport side, clamped to 64–88 CSS pixels. A shot requires 78% of that displacement: **60.84px at 390×844 or 844×390; 49.92px at 320×568**. A shallow draw lets down without a shot or a cooldown charge. Reaching the displacement is sufficient: there is no extra hold-to-charge timer. This is a game tuning decision inspired by the complete drawing action; screen pixels do not represent historical centimetres or pounds.

Every committed locked shot remains one hit. The .22s cooldown and approximately nine-second bow window before close machine-gun range remain, as do independent reins, the .32m rider core and the existing horse/encounter speeds. The new input asks for a deliberate stroke without making the player stop steering or wait at full draw. At release the outline fades over about .15s with a small damped string return. Reduced-motion mode removes the oscillation and forward whip.

## Release, flight and impact

The old pitched pluck has been replaced with filtered broad-band air and a short dry snap. The hit combines a sharp broad crack, a low body and a brief breaking-metal tail. All three bow sound kinds still use cached variants, smooth start/end envelopes, the shared mixer and the existing 24-voice cap. No new sound context or music restart is introduced.

A fixed pool of 96 short line segments gives arrows a .16s world-space wake, including the final segment into the target. The wake remains briefly visible after the arrow head disappears on impact. Twelve physical arrow slots remain; their speed, one-hit targeting and reservations are unchanged. Travel and vehicle changes clear both the arrows and their wakes. This adds one line draw, without a full-screen effect or a new renderer.

## Validation

- `node --test tests/*.test.mjs`: includes the minimum committed draw across phone orientations/sizes, immediate release without a holding timer, stable selected targets, invalid-target recovery and the existing gesture/cancellation coverage.
- `python tests/bow-feel-browser.py --three /path/to/three.min.js`: actual WebGL and DOM pointer events at 390×844, 844×390 and 320×568; nearby-touch lock on pointer-down; no large canvas arc; bow centred on the selected target; shallow let-down; full draw/release/flight/impact screenshots; wake persistence and cleanup; unchanged travelling velocity; game/shader errors.
- `tests/archery-browser.py`: native two-finger controls, one-hit kills, 180s encounter cadence and four 100s riding combats, plus roof/off/rear cancellation and saved settings. The scripted riding controller is a mechanical balance check, not a human playtest.
- `tests/weapon-audio-browser.py`: all nine cached sound kinds have bounded peaks, silent endpoints, a voice cap and cancellation of scheduled sources.
- `tests/music-browser.py`: retained shared-context/default-on playback and recorded loop/crossfade continuity across a blocked main thread.

The existing world, featured-road network, camera defaults, horse speed and enemy cadence are preserved. Physical phone feel, real-device FPS and subjective listening/playtesting remain separate from these browser checks.

Recorded results: the unit suite, focused bow presentation audit, full mounted combat audit, cached audio audit and recorded music audit passed. The focused test measured 60.84px readiness on portrait/landscape 390px-short-side screens and 49.92px on a 320px screen; a 35px stroke did not fire. All three full strokes produced one hit, retained the impact wake and preserved velocity. The four 100s combat runs retained ordinary health throughout their scripted evasions. The 43.14s music recording included loop/crossfade checks and a 1.6s blocked main thread, with minimum 100ms RMS .01547 and maximum adjacent-sample step .02044. Game and shader error lists were empty. Physical-device feel and subjective sound judgement remain unverified.
