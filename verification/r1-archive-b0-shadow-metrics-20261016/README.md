# B0 — shadow sharpness and shade-layering metrics (2026-10-16)

Plan: `docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md` §7 B0. User: "권장안대로 B0부터 진행해줘".
Tool: `scripts/blender/shadow-sharpness-map.py` (bpy). Per camera ray: visible point, normal, depth; per light, a ray toward the light
gives the occluder→receiver distance d and the predicted penumbra w = d·θ in pixels of a 720 px frame (θ = sun disc or 2·radius/
distance). Boundary samples (shadowed with a lit neighbour) are what the eye reads. Rays pass through objects a render never shows
(hidden, volume boxes, haze). Layering: median L* (from a render of the same camera) of the bookcase faces in the left third by depth
(front layer / cell back walls) and by facing direction; foreground objects (ladder, stack ends, lamps) are excluded by a depth window.
REF-002 is measured on its rebuilt frames (its own glb + baked textures, analysis only, scratch folder; no lights in the file, so
layering only).

## Ours, V1 2.0 m (r8 lights), 320×180 samples (`b0_penumbra_sheet.jpg`, `ours_v1_z20_shadow_metrics.json`)

| light | boundary samples | crisp ≤ 3 px | soft > 10 px | boundary penumbra p10/50/90 | occluder distance p10/50/90 |
|---|---|---|---|---|---|
| sun (0.5°) | 5322 | 44 % | 7 % | 0.0 / 4.8 / 9.6 px | 0.07 / 3.0 / 4.9 m |
| key spot (r 0.06 m) | 5611 | 59 % | 39 % | 0.1 / 1.5 / 32 px | 0.06 / 2.4 / 4.0 m |

Read: crisp edges come from occluders within centimetres (books, shelf boards). Everything cast from far (ceiling/hatch rim
≈ 2.4–3 m, ladder ≈ 1.5–2 m) is soft under the key — the ladder's shadow on the right bay is > 10 px, where REF's ladder shadow is
crisp near its top. There is no deliberate "far occluder → shaped soft shadow" pair yet.

## Shade layering in the left third (median L*)

| | facing down (shelf undersides) | facing up | facing camera | front layer | cell back walls | cell depth |
|---|---|---|---|---|---|---|
| REF rebuild p 0.5 / 0.75 | **−0.5 / 0.0** | 11.8 / 13.4 | 17.7 / 19.1 | 19.4 / 20.0 | 11.6 / 10.1 | **≈ 0.5 m** (front 7.98, wall 8.52) |
| ours V1 2.8 / 2.0 m | **11.1 / 10.7** | 7.3 / 12.6 | 14.3 / 12.9 | 16.8 / 16.3 | 9.1 / 8.2 | ≈ 0.27 m (front 5.48, wall 5.75) |

Read: REF's shade is filled from above/front — shelf undersides go black, which draws every cell's depth. Ours is filled from below
(the sun floor patch bounce): undersides are as bright as tops, so the cells read flat. REF cells are about twice as deep.
REF p 0.25 is left out (its top rows see the far upper-floor wall, which breaks the depth window). Not done: B1 test bench.
