# I-1 globe polar relief (REVIEW-R1-WEB-20261008), 2026-10-09

User (intro review): "지구: Moto Card와 비교하면 극지방(역광이 비치는 부분)의 요철·부피감에 따른 그림자 느낌이 약함."

`globe_before_after.jpg`: top: Moto Card frame (user's recording, 0.5 s, crop; reference only, not an asset); bottom: our intro at
p .06 before / after (built page, SwiftShader, 1280×720 crop).

Cause: REF-001's shader bump-maps the globe (terrain height + clouds); our reproduction omitted it and added a flat fresnel² glow
over the backlit cap, which washed the cap uniformly white.
Change (`prototype/v2/src/story/intro/globe.ts`): height from clouds (0.75) + day-map brightness (0.25) sampled 3 texels apart bends
the normal (uBump 6); the cap light now multiplies the surface texture and a relief factor (slopes toward the sun brighter,
uRelief 4.5); cloud shadow (uCloudShadow .5); edge glow narrowed to fresnel⁴.
Not checked: Edge on the user's PC; no real terrain height (mountain ranges, ice-sheet edges) — a NASA elevation map would add it.
A capture of the "before" state at p 0 failed (the page fell through to the Lab in that run), so the comparison uses p .06.

## v2 — user review the same day (`globe_v2_before_after.jpg`)
User (local Edge): "구름은 많이 늘었지만 극지방의 요철은 거의 보이지 않아 … 구름이 너무 많은 느낌 … 도심 불빛이 너무 적게 나타나는 것 같아."
Compared at the same place as the Moto Card frame (p .06, Europe), one change at a time:
- day map July → **January** Blue Marble (snow/ice on the northern lands: the backlit band turns white, as in REF-001) — the decisive change;
- relief height: clouds + brightness → **GEBCO_08 land/ice elevation** + clouds 0.35, 2-texel derivative at 4096;
- night: Black Marble 2012 2048 → **2016 8192**, lights only (R − 0.55 B), saturating curve `1 − e^(−6L)` on luminance with a warm tint;
- clouds: threshold .42–.95 × .8, no moonlit clouds on the night face (they only dim the lights);
- sun (.26, 1.39, −3) → **(.26, 1.85, −2.75)** (tried 1.65 / 2.0 / 2.2 / 3.0; 3.0 lights the whole visible Europe);
- bloom while the globe shows: strength .55 → .25, radius .35 → .10 (the grey haze over the globe was bloom, not the atmosphere shell).
Textures: `scripts/assets/build-globe-textures.py` (sources registered in `assets/registry.json`). Sizes: night 0.90 MB, height 0.39 MB, day 0.92 MB.
Left: REF band still a little wider/brighter; light points a little coarser (3 km source + bloom); 8192 texture vs low-end GPUs (exhibit PC unknown, P2). Edge not checked.
