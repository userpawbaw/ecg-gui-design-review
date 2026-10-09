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
