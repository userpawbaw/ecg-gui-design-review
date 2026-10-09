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
