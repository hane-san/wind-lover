# A compact atlas of freely chosen journeys

**Latest follow-up:** [free reins and regional skies](FREE-REINS-AND-REGIONAL-SKIES.md) expands the atlas and strengthens its regional atmosphere. Dimensions and totals below record the initial atlas.

29 October 2026, initial atlas. This extends the existing Japan/southern-seas sampler and supersedes its six-scene circuit as the only travel structure. The owner's priority is a dense, freely connected world of distinctive landscapes, without requiring real geographical positions. Riding, bow input, camera defaults, pace, damage and the original Central Asian journey remain shared with the approved version.

## Choosing a road

The 8,130.5m outer circuit remains. `world/monsoon-atlas.js` adds 24 physical roads: eight links around the inner districts, eight spokes to a central crossroads and eight links to the outer road. Together these provide approximately 22.7km of riding. Seventeen nodes include nine broad plazas. The whole graph is connected, with no teleport links between roads. New roads are 50m wide; the original road remains 60m wide.

Hold a strong left or right rein for about one second approaching a junction to choose an exit. Short dodges do not immediately select a branch. Steering blends towards a point down the chosen road; it never teleports the rider or resets their speed. Brake/down plus steering releases road guidance for exploration. On desktop these are S/down and A/D or the arrow keys; the touch reins provide the same axes. The menu's **旅の地図** shows the actual road network, current position and fourteen selectable destinations, also operable with Enter or Space.

The three nearest district influences blend continuously, using the fourth-nearest distance as a common boundary. This avoids palette jumps when a third district changes rank. Terrain and physical road queries have their own small spatial index and do not follow the rider's preferred route. Junctions have broad flat approaches, a continuous terrain cushion and an 82m plaza surface. Scenery reserves the entire riding corridor and turning plazas. Road strips stop inside plazas rather than stacking multiple decks there. The outer-road joins preserve their parent's deck before climbing towards the inner districts.

## Fourteen distinct places

| Area | Landscape and landmarks |
| --- | --- |
| Toyosu-inspired waterfront | Glass towers, reclaimed quays, canal, bridge and dock crane |
| Edo-inspired evening road | Rice and crop plots, earth lane, low thatched houses and a dusk post-town |
| Angkor-inspired approach | Forest, rectangular moat, towers and a wide open gate |
| Inner ruins | Root-covered stone galleries and a tall entrance reached through the inner road network |
| Khaosan-inspired street | Shop fronts, signs, market lights and canal |
| Don Mueang-inspired airport | Runway, aircraft, terminal and urban viaduct |
| Malay Peninsula-inspired coast | Limestone headlands, islands, fishing huts and coves |
| Modern Kanazawa | Lattice-front houses, canal, low circular gallery and taller glass architecture |
| Shikoku | Emerald river, steep green valley, hillside hamlets and suspension-style roadside cables |
| Northern forest and lake | Birch trunks, a broad lake and thatched houses informed by Ainu cise |
| Ha Giang | High karst ridges, a blue-green river below the road and small mountain hamlets |
| Thai river district | Flat water country, houses, palms and tall riverside prang silhouettes |
| Ryukyu | Red roofs, pale walls, terraced castle massing and a broad red gateway |
| Okinawa | Turquoise water, concrete coastal houses, palms, pale rocks and a lighthouse |

These are original, condensed scenic interpretations. The northern district draws on the forest/lake setting and house forms described by Upopoy; its music and buildings are invented for this world. It does not reconstruct a particular community or ceremony. The existing fictional drone enemies remain independent of the cultures depicted.

Regional sky colours, cloud opacity, star visibility, sun elevation and distant haze vary smoothly with position and elapsed time. They use the existing sky renderer, without extra rendering passes or new camera movement. Local water is clipped into non-overlapping pieces: higher water wins where rectangles meet, matching `waterAt`. Terrain floors, water levels, road meshes and plaza surfaces are checked together rather than treating the water as decoration.

## Eight more original songs

All earlier IDs and saved music settings remain. The total is now 36 tracks, including nineteen brave pieces and seventeen quieter pieces.

| New ID | Musical identity |
| --- | --- |
| `rain-on-lattice` | Kanazawa, 112 BPM: swung keys and glass accents |
| `indigo-gorge` | Shikoku, 126 BPM: a 3+2+2 seven-beat pattern, reed and lute |
| `birch-lake` | Northern lake, 104 BPM: flowing triple metre, reed and warm sustained notes |
| `karst-eagle` | Ha Giang, 132 BPM: five-beat phrases, horn and plucked replies |
| `roots-of-the-sky` | Inner ruins, 102 BPM: dark triple metre, glass and horn |
| `river-neon` | Thai river district, 128 BPM: syncopated plucks and warm electronic rhythm |
| `vermillion-tide` | Ryukyu, 108 BPM: an original lute melody using the do/mi/fa/so/ti pitch palette |
| `reef-after-rain` | Okinawa, 138 BPM: airy melody, glass and broken beats |

`music/atlas-score.mjs` defines the new motifs and arrangements; the existing renderer bakes seamless stereo Vorbis loops. Regional themes wait for a two-second stable boundary and fourteen seconds of current playback, then crossfade for three seconds. Revisiting a district can restore its theme even if recently heard elsewhere. Same-district rotation still waits 38 seconds of riding and excludes recent alternatives. Manual, off, paused, hidden, dead and stationary states retain their existing behaviour. The original journey keeps complete-phrase/quiet-phase changes and its 2.4-second fade. One shared context, at most two decoded buffers and voices, outgoing playback during loading, and cancellation remain in force.

## Scenic references

- [JNTO: Kanazawa](https://www.japan.travel/en/destinations/hokuriku-shinetsu/ishikawa/kanazawa-and-around/): historical streets beside contemporary architecture.
- [JNTO: Iya Valley](https://www.japan.travel/en/destinations/shikoku/tokushima/iya-valley-area/): deep river valleys, bridges and mountain settlements.
- [Upopoy: the park](https://ainu-upopoy.go.jp/en/facility/park/): cise and the Lake Poroto forest setting.
- [Vietnam Tourism: Ha Giang Loop](https://vietnam.travel/things-to-do/ha-giang-loop-four-day-road-trip/): Dong Van karst, Ma Pi Leng and the Nho Que River.
- [Angkor Enterprise: Beng Mealea](https://www.angkorenterprise.gov.kh/en/explore/685a6e0bd5b83514cb10e7e2): forest, roots and ruined galleries.
- [Ayutthaya: Wat Chai Watthanaram](https://go.ayutthaya.go.th/tourist-attraction/wat-chai-watthanaram-chai-watthanaram-temple/): riverside prang silhouettes.
- [Visit Okinawa: traditional houses](https://visitokinawajapan.com/discover/traditional-culture/traditional-okinawan-houses/) and [Shuri](https://visitokinawajapan.com/destinations/okinawa-main-island/southern-okinawa-main-island/shuri/): red tiles, pale walls and castle forms.
- [Visit Okinawa: performing arts](https://visitokinawajapan.com/discover/traditional-culture/okinawa-traditional-performing-arts/): the Ryukyu pitch palette; the score uses an original melody.

## Regression checks

```sh
node --test --test-isolation=none tests/*.test.mjs
python tests/atlas-network-browser.py --three /path/to/three.min.js
python tests/monsoon-browser.py --three /path/to/three.min.js
python tests/atlas-music-browser.py --three /path/to/three.min.js
python tests/quiet-music-browser.py --browser /usr/bin/chromium --recordings
python tests/music-browser.py --three /path/to/three.min.js
python tests/world-smoke.py --three /path/to/three.min.js
```

The network audit drives all 24 roads in both directions and chooses six exits with held reins and ordinary health. The sampler audit covers native destination/map controls, collider footprints, road/plaza/terrain rays, local water, landmarks, the outer circuit, both physical gates, original-position restoration and mounted fights. The new music audit rides into all eight added districts, checks their automatic themes and manual-mode persistence, and records real output. Only the music-age probe is accelerated; decoded files, loading, fades and the shared audio graph are real. All 36 encoded recordings are also decoded for continuity, headroom and non-silent phrases. The main audio audit includes a 1.6-second main-thread stall, held loading, cancellation and saved settings; the original world smoke protects the main journey. These are scripted regressions, separate from human balance assessment and physical-phone frame rate or listening.

Measured in this session: all 84 unit checks passed. Forty-eight two-way road rides and six held-rein junction choices retained hull 3; the two open-country fixtures reached more than 120m from the nearest road. The outer-circuit audit covered 8,350.6m through its seam, with 0.065m final centre-line offset. Three ordinary-health 90-second fights landed 47 of 47 scripted shots. Fourteen departures and five additional landmark views passed the physical-surface checks. The 62.16-second actual eight-theme recording had minimum 100ms RMS 0.01691 and maximum adjacent-sample change 0.03933, with no detected gap. All 36 encoded loops passed, as did the original world smoke and shared-audio stall/loading/cancellation audit.
