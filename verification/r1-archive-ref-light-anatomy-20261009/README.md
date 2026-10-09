# REF-002 attic frame — light anatomy (F-040), 2026-10-09 — analysis only

User: how does the original make the soft shading of the right column (blue box), the dark-yet-readable left (green) and the maximum
contrast in the centre (red)? Analyse this one work in detail — its lighting, light entry, props — not general criteria.

Asset access this time: www.leoparpeix.com answers 402 DEPLOYMENT_DISABLED; web.archive.org and archive.ph are cut by this
environment's network policy. So the source assets (scene_v9.glb, KTX2 bakes) could not be re-read. What is known from the
2026-09-25 bundle read (REF-002 §6 EFX-002-01/03): the attic is the same `scene_v9.glb` house; every mesh uses an unlit textured
material with the lighting baked into 4096 px KTX2 textures (TexBibli, TexMobilier, TexWalls, …). No real-time light, so every
gradient in the frame is an offline (path-traced) bake — reproducible in our Blender pipeline.

Measured on the recording frame (0:15, 1912×946, `light_anatomy.jpg`; stops = log2 of luminance / frame median):
- Three tiers, spatially organised: a flat shade zone (left third, about −1 to −1.8 stops, little variation), one coherent lit pool
  over the centre and right (+1 to +3), and crisp sun accents inside the pool (+3.5 to +4.2: cube, drawer top, lower shelf).
- The pool/shade boundary is a long near-vertical-to-diagonal line left of centre; across it the light jumps ~4.5 stops within
  50–75 px (row profiles), then decays smoothly to the right — a near, large source (light entering the hatch close to the
  wall), not a distant uniform sun.
- Blue box: room-scale gradient of ~3.5–4 stops from bottom-left (+3) to top-right (−0.8): it is the tail of the pool's falloff.
  Inside each cell the back wall brightens by ~1.1 stops from right under the shelf down to mid-cell (occlusion of a large source
  above-front).
- Green box: shade at −1 to −1.8 with almost no room-scale variation; readability comes from bounce, not from patches.
- Red centre: maximum contrast where the sun accents sit right next to the shade boundary (+4 beside −1.8).
- Colour: lit areas warm (b* 18), shade near neutral (b* 6). Lit − shade median: 4.9 stops (ours r5 5.1–5.4 — the amount of
  contrast is the same; its organisation is not).

Ours r5 on the same scale: several separate pools from five holes and a directional sun (no falloff), the same mid-cyan level
everywhere else (no shade zone vs pool), lit colour b* 8–14. The white figure is the largest bright blob at room scale.
Not measured: the original light rig itself (lamp types, sizes, powers) — inferred from the frame only.

## Follow-up 2026-10-09 — access re-check and offline-render inference

Access: the proxy CONNECT to web.archive.org succeeds (HTTP 200 Connection Established); the reset comes at the TLS client hello,
from the far side (archive.org and web-static.archive.org answer 200). So it is not the environment's network level; the Internet
Archive refuses this cloud egress. The user's CDX list (12 URLs, Aug 12 – Sep 19 2026) holds the HTML, fonts, `index-BZFBO0Ol.js`
(the same hash read on 2026-09-25) and `index-CLH3rn1-.css` — but no `.glb` / `.ktx2`: the 3D scene and its baked textures were never
archived. The two uploaded files are the Wayback wrapper pages (the script itself sits in the inner frame), so they add nothing.
The original light rig cannot be read from any reachable source; what follows is inferred from the frame.

More measurements on the 0:15 frame (`ref_crop` region; L* sampled every 3–4 px):
- Sun-type edges are crisp near their occluder: the drawer-front band's top edge goes 30 → 49 → 77 L* within ~6 px; the diagonal end of
  the same band softens over ~12 px (longer throw). Crisp-edge scale σ* = 0.8 px (at 720 p) on the drawer, cube and lower-shelf
  patches; ours r5 cabinet patch 2.8 px (the 2° sun disc of D-059).
- The wall lit beside the ladder falls from L* 88 to 57 over ~100 px to the right inside the same light — a parallel sun gives a
  uniform patch on a flat wall, so the key is a near light (small radius → crisp shadows, distance → falloff), e.g. a spot / small
  area lamp just outside the hatch rather than a sun object [inference].
- Grain (std of L* high-pass on flat surfaces): REF 0.4 (wall) – 1.0 (drawer front); ours 2.6 (cabinet) – 5.4 (cell back, wood
  grain + sampling noise). REF surfaces are near-flat albedo with almost no texture; the light gradient is the only signal on them.
- Highlights: 0.22 % of pixels at the top of the range (ours 0.10 %); highlights roll off rather than clip — LDR KTX2 bakes must
  have been tone-mapped (Filmic/AgX-type) before being stored, since the materials are unlit [inference].
