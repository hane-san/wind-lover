# Free reins and distinct regional skies

30 October 2026. The owner wants less attachment to a road, gentle support against an accidental departure, a slightly larger compact world, and much stronger local differences in sky, road surface, landscape and music. This supersedes the atlas's earlier constant mounted road-heading gain, dimensions and 36-song total. The bow, threat choreography, default pace and saved camera composition remain the current baseline.

## Steering without the strong pull

`WindHorseRiding.guidance` supplies the mounted heading aid. A released rein settles along the road at gain 4.8/s; a strong input lowers this to 0.5/s in the middle, compared with the former constant 7.5/s. Heading authority starts building after 0.32 seconds rather than waiting 1.15 seconds. Short inputs still provide the same immediate sidestep. On release the chosen line is retained rather than attracting the horse towards the centre.

The final eight metres of the verge progressively reduce an outward sidestep and support outward motion, including the sidestep itself. The retained line keeps a four-metre safety margin at the verge. This is not a hard boundary or a position correction. Strong reins held for 1.6–2.5 seconds progressively release that guard for an intentional departure; braking also releases assistance. Junction choice still uses the existing held-rein gesture and bounded heading changes. A short dodge retains the road corridor under the feet, even when a narrower branch becomes closer; choosing a branch updates that preference explicitly. Physical ground queries consider the union of overlapping road widths, so a branch cannot hide the parent road's shoulder or pull a rider up from below. The road aid applies to the horse in both realms; the atlas's junction aid applies only inside the atlas.

The new browser audit measures a one-second, 65% rein gesture against a coasting baseline on the same curve, then releases it. It covers both directions at 30, 60 and 120Hz on the lake, mountain, Edo and Okinawa approaches. Separate cases start near both verges and apply a brief outward gesture. The older riding audit still checks gathered bounds, brief airtime, momentum, Space input and leaving open country. Its departure measurement records the largest excursion during a held turn, since a freely turning horse may cross another road before the final sample.

## More space and clearer surfaces

The atlas is expanded by 16% in each horizontal direction, giving roughly 35% more area. Its outer circuit is now 9.431km; the connected 24 inner roads and circuit provide about 26.3km of riding. New roads are 56m wide and the outer road 68m. Heights are preserved, so climbs become gentler. The fourteen destinations, seventeen nodes, nine clear plazas, menu map and reversible portal remain connected. The map fits the larger extent rather than clipping it. The rural belt now contains 84 field plots.

Four-neighbour distance queries still produce three continuous influences, with a stronger centre for each district. Each land now has its own road palette. Worn earth tracks are built from adjoining bands at exactly the same height; no raised or overlapping rut strips are added. Rural roads, green-grey ruin paths, cool urban surfaces and pale coastal tracks share the same safe physical corridor. Existing buildings, water and large landmarks keep their collider and clearance checks. The main Angkor-inspired entrance has a wider span to match the expanded road.

## Skies with a local identity

`world/regional-atmosphere.js` supplies fourteen sky and surface profiles. Edo has an indigo and amber evening with long thin clouds and dark crows; Okinawa and the straits use clear blue/teal light, bright clouds and gulls. Kanazawa has a cooler overcast sky, the northern lake a pale cool horizon, the inner ruins a deeper green mist, and the Thai river district a purple and peach evening. Mountain birds glide more slowly than crows or small forest birds.

Colours, haze, cloud shape, sun elevation and limited evening stars blend by the same continuous landscape weights. Cloud bands use the existing sky material. Birds use one bounded 48-instance mesh and analytic world paths; neighbouring flocks fade by district influence instead of appearing abruptly at the nearest-region boundary. They are decorative, without target or collision registration. The original realm disables the new sky treatment and hides these birds. There is no extra full-screen render pass, camera translation or roll.

The previously documented regional references remain the visual basis: [Kanazawa](https://www.japan.travel/en/destinations/hokuriku-shinetsu/ishikawa/kanazawa-and-around/), [Iya Valley](https://www.japan.travel/en/destinations/shikoku/tokushima/iya-valley-area/), [Upopoy](https://ainu-upopoy.go.jp/en/facility/park/), [Ha Giang](https://vietnam.travel/things-to-do/ha-giang-loop-four-day-road-trip/), [Okinawan houses](https://visitokinawajapan.com/discover/traditional-culture/traditional-okinawan-houses/) and the [Agano/Aizu agricultural history](https://www.hrr.mlit.go.jp/agano/jigyou/pamph/ryuiki/ryuuiki0203.html). The condensed geography, silhouettes and lighting are original scenic interpretations, not measured reconstructions.

## Hearing the place

Two original scores extend the total to 38, including twenty brave pieces:

| ID | Arrangement |
| --- | --- |
| `crows-at-dusk` — 烏の帰る茜道 | 106 BPM; an original sparse melody on a zither-like pluck, answered by a distant reed, for Edo's rural evening |
| `stone-and-rain` — 石の回廊に降る雨 | 118 BPM; an original running wooden-mallet melody, reed replies and low drums, for the forest ruins |

The synthesiser adds separate zither-like and wooden-mallet envelopes and partials for these scores. Earlier score IDs, encoded recordings and synthesis parameters retain their settings. The two new loops are baked with the existing second-cycle tail renderer and seam treatment.

Each atlas district now alternates its two most closely related arrangements during a long visit, instead of importing an unrelated airport or city track. Edo pairs its new theme with `sunset-reins`; the ruins pair their new wooden theme with `lotus-stone`; Kanazawa pairs keys and glass; Thai streets and waterways share their two urban themes; the coast pairs sea-related pieces. A destination theme already playing remains uninterrupted. Boundary stability, the fourteen-second minimum dwell, three-second fades, 38-second same-area rotation, manual/off settings, one context and two voices/buffers remain. Central Asia keeps its existing complete-phrase and quiet-phase music policy.

## Validation

```sh
node --test --test-isolation=none tests/*.test.mjs
python tests/free-reins-browser.py --three /path/to/three.min.js
python tests/horse-riding-browser.py --three /path/to/three.min.js
python tests/atlas-network-browser.py --three /path/to/three.min.js
python tests/monsoon-browser.py --three /path/to/three.min.js
python tests/bow-response-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js
python tests/regional-music-browser.py --three /path/to/three.min.js
python tests/atlas-music-browser.py --three /path/to/three.min.js
python tests/quiet-music-browser.py --recordings
python tests/music-browser.py --three /path/to/three.min.js
python tests/world-smoke.py --three /path/to/three.min.js
```

The sampler combat fixture now requires a positive margin to the actual road edge, rather than the earlier fixed 14m centre-line band. This tests avoiding a course departure whilst allowing the broader riding lines requested. Shader compilation, bounded bird rendering, road/terrain/plaza rays, collider footprints, local water levels and all fourteen native departures remain checked. Recorded-output tests cover all fourteen regional themes and manual persistence, in addition to every encoded loop and the existing stall/loading/cancellation checks. These scripted regressions do not measure human balance or physical-phone frame rate and listening.

Measured in the final local checks: all 91 unit checks passed. The 24 controlled rein gestures produced 2.44–4.77 degrees of heading response relative to a coasting baseline after one second. Eight short verge gestures retained at least 2.43m of road margin, all with ordinary health. Forty-eight road rides, six junction choices and both deliberate open-country departures passed; the latter reached more than 140m from a road. The older three invulnerable riding fixtures also passed their gait, bound, airtime and momentum checks.

All fourteen native departures, five additional landmark views, 71 water rays, shader/bird rendering and clearance against every overlapping road passed. The outer circuit covered 9,651.5m through its seam, ending within 0.162m of its centre line. Three ordinary-health sampler fights hit 49 of 49 scripted shots and kept at least 18.14m to an occupied road edge. The original six routes' ordinary-health bow fixtures landed 112 of 114 shots.

All 38 encoded loops passed decoding, headroom and continuity checks. The six outer themes' live recording ran for 54.36s with minimum 100ms RMS 0.01516; the eight inner themes' recording ran for 59.64s with minimum RMS 0.01862. Manual persistence and the shared context passed. The main mixed-audio recording, 1.6-second main-thread stall, loading/cancellation/saved-setting audit and original world smoke passed as well.
