# Six departures and a connected northern road

26 October 2026. Builds on the open Osh galleries, stable mounted camera, longer bow gesture and sixteen-track score. No old controls, routes or saved settings are replaced.

## Geography informs the journey

Research references (read 26 October):

- [Abai Institute: Charyn Canyon](https://oq.gov.kz/en/abai/sharyn-shatqaly): a river at the canyon bottom and sandstone forms resembling castle towers; use layered russet banks, eroded columns and a green-blue side river.
- [MAP.KG: Chychkan](https://map.kg/en/fotobaza/42-kljuchevaja-territorija-bioraznoobrazija-chychkan.html): the gorge descends from Ala-Bel towards Toktogul along the Bishkek–Osh highway. Use a river valley after the snowy pass.
- [CBT Kyrgyzstan: Toktogul](https://cbtkyrgyzstan.kg/cbt-groups/english-cbt-toktogul/): mountain ranges, tributaries and the strategic Bishkek–Osh route. Preserve the contrast between high pasture, snow and a lower green valley.

These are inspirations for a fictional connected landscape. Coordinates, distances, road widths, plants and the direct Charyn–Astana link are deliberately composed for riding, not a geographical reconstruction. No source photographs or models are included.

## The physical network

The original four departures remain. Astana and Charyn make six neutral outline icons in two rows of three on a narrow phone; only the chosen departure is highlighted. Both start on a real road. `definition.start` chooses a suitable entry fraction without hard-coding new IDs in travel logic.

The new Charyn road is 29.754km long and 64m wide. It branches from the lake–pass connecting road at 46% of its distance and rejoins the Astana boulevard at 800m. This provides an alternative to the high pass: lakeshore → canyon → steppe/city → abandoned railway → caravan road. Existing road signs announce both junctions. There are no travel triggers or scene changes at these joins.

Cubic Hermite segments inherit the parent roads' endpoint tangents and grades. Short 40m control legs followed by kilometre-long uniform Catmull–Rom legs produced a reversal during testing; the final route removes that defect. Maximum segment grade is 2.20%, and the largest heading change between sampled segments is about 0.52°.

`landscapeAt` filters the existing spatial grid for landscape roads, with an explicit 1100m reach. The normal `nearest` radius remains 170m. One-entry coordinate caching shares a result between biome, elevation and colour sampling; `indexReach` invalidates it. Canyon earth colours also influence the regional palette and prop selection, instead of inheriting an unrelated apartment-district sky. Raw base terrain and legacy deck elevations explicitly exclude this palette overlay: otherwise the later palette could move cached railway approaches after the new junctions were built. The canyon's explicit terrain profile is applied separately. A generous floor rises towards eroded banks. The river stays about 160m to one side; rock formations, their conservative OBBs, props and signs reserve all riding corridors. Folded distant ranges yield beneath the new terrain near the canyon rather than cutting through it.

On the existing Osh descent, a roughly 4.7km river-and-grove sequence follows the lower valley. The terrain carves its riverbed and the matching ribbon follows the same mountain samples. River segments and tree trunks skip every riding corridor. New geometry is merged per streamed chunk, published with its colliders and disposed through the existing lifecycle; no additional render pass, permanent particle pool or music voice is added.

## Terrain and combat

Patrols appear at an actual road sample ahead, instead of initially occupying the straight projection across a valley wall. Their existing road-following approach remains. Canyon patrols use a lower, narrower sky formation; mountain and city patrols sit higher, with lateral spacing adapted to the setting. Counts, committed interceptor, one-arrow kills, frozen missile aim, salvos, hit core and recovery remain unchanged.

The director checks turns and ascent at 220, 440 and 650m before introducing a warning. An unreadable approach can postpone a new engagement by up to six seconds, then the normal rhythm resumes. Scout pairs also wait for a readable opening. Existing visibility checks still govern every new launch; this is not an exemption for enemies behind geometry or a replacement for projectile collision.

## Validation

- Node suite: 68 tests, including bounded opening delay and regional formation limits.
- `tests/northern-road-browser.py`: six mobile departure buttons and single-selection state, exact physical joins, all 1240 new road segments, full two-way riding and rendered canyon water/rock panoramas. Riding continues onto each parent road without teleporting.
- `tests/journey-network-browser.py`: original lake–pass–rail connection driven both ways.
- `tests/featured-browser.py --full-only --vehicle horse`: all eleven road surfaces, full 17km mountain and 36km lake drives.
- `tests/bow-response-browser.py`: current gesture checks at three viewport sizes and 20/60/120Hz, followed by ordinary-health 90s riding/aiming runs at all six departures.
- Regional checks retain gallery/roof/column agreement, queued-fire visibility, scout and skyline checks; additional inspection covers the descent river and grove.
- `tests/world-smoke.py`: 3751 railway samples, detours, shelters, three ordinary vehicle drives, streaming and world switching; specifically guards the original railway against later landscape-palette changes.

Headless software rendering and scripted steering are regression checks, not human balance, physical-phone FPS or real-device listening measurements.
