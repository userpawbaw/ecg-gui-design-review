# REF-002 site anatomy from its own files (2026-10-16) — analysis only

User: "실제 leoparpeix 사이트가 동작하니까 사이트에 접근해서 어떻게 구현했는지 확인한 후 … 에셋을 가져와서 분석해도 좋아."
The site answered again (200). Downloaded into the session scratch folder only (never into the repo): `index-djk_Apyr.js` (1.40 MB),
`assets/models/home/scene_v9.glb` (142 KB, Draco), the eight 4096 px baked textures `assets/textures/home/scene-ktx/4096/Tex*.ktx2`
(0.48–1.53 MB each; redirect to cdn.leoparpeix.com). KTX2 decoded with three r153's Basis transcoder (node), the glb opened in bpy.
Every image here is a render of their scene with their baked textures as unlit emission — labelled analysis only, not an asset.

Facts `[코드]` `[런타임]`:
- Camera (glb object `camera`): vertical fov **22.9°** (59 mm), level, looking −x from x 14.76. In the attic section it descends from
  z −0.44 to −3.19 (2.75). Back wall of the lower bookcase at x ≈ 6.25 → **distance ≈ 8.5 m**, wall height in frame 3.44 m
  (our V0 recording estimate 3.4 m was right; its 32° / 5.8 m came from an assumed 0.3 m cell depth and is superseded).
- Geometry is simple: 13 meshes, ≈ 22 k faces in total (bookcase 3.0 k, furniture 5.9 k, props 3.2 k). Small chamfers are everywhere:
  edges < 1 cm are 53 % (bookcase), 68 % (props), 34 % (furniture) — bevels catch light and draw crisp outlines.
- Materials: every mesh is one baked final-colour texture (albedo × light, tone-mapped, sRGB), unlit at runtime, linear filtering.
  `TexBibli`, `TexProps`, `TexWalls` use a texel max-cross sampler (max of 5 texels) against dark seams on thin UV islands.
  Optional hash blur. No runtime light, no runtime tone mapping. Wood keeps a fine low-contrast grain; books are flat colour.
- Scene (`ref_overview_analysis_only.jpg`): an upper studio with large arched windows, a big daisy sculpture, pedestals with faceted
  geometric sculptures, step ladder, table; a floor hatch with an open lid; under it the bookcase wall with the rolling ladder going up
  through the hatch. The lower floor carries soft window-grid shadows from windows that are not in the exported file (removed after
  baking because they are never on screen) — the "unknown far occluder" behind the soft shadows on the right bookcase.

Clean metrics on the rebuilt attic frames (no UI text, no video compression; `ref_attic_descent_analysis_only.jpg`):

| frame | L* 5/25/50/75/95 | plain_range | sharpC | deep% | pastel% | room-scale ≥ +1.5 stops |
|---|---|---|---|---|---|---|
| REF p 0.25 / 0.5 / 0.75 | 1 14 23 45 80 / 0 16 25 52 77 / 2 19 26 50 74 | 44.9 / 54.0 / 48.8 | 17.2 / 18.7 / 19.1 | 6.0 / 5.7 / 5.0 | 18 / 23 / 22 | 42 % (p 0.5) |
| ours V1 2.8 / 2.0 m (D-083) | 2 17 29 54 84 / 2 16 30 63 80 | 58.5 / 61.0 | 16.1 / 14.8 | 5.5 / 3.6 | 21 / 25 | 41 % (2.0 m) |

The recording-based REF targets used since F-038 (L*95 81–97, plain_range 57–69, sharpC 20–22, deep 3.6 %) were inflated by the
overlaid title text and compression; F-045 replaces them with these.
