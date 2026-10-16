# Archive viewpoint study, 2026-10-16 — stills only (analysis: rounds/R1/ANALYSIS-R1-REF002-SPACE-LIGHT-20261016.md §2.4)

Question: does a REF-002-style camera (level, pure vertical travel, narrow lens) give "faces appear / turn frontal" viewpoint
interest in our archive? REF-002's attic section moves the camera 2.75 units down with rotation range 0 (REF-002 EFX-002-03).

Build (r7 defaults, figures on):
```
SHOTS_JSON='{"v1_z34":[[0.45,-1.5,3.4],[0.45,4.7,3.4],26], ... ,"t2_shift":[[0.45,-1.5,1.6],[0.45,4.7,1.6],26,0.27]}' \
python scripts/blender/build_archive.py --intro2 --art r6 --dress --palette pastel --look h5 --preview DIR --samples 24 --res 960x540
```
`SHOTS_JSON` = {name: [location, target, vertical fov°, optional shift_y]} replaces the shot list (new knob).

- `vp_descent.jpg`: level camera, vfov 26°, aisle y −1.5 (6.2 m from the back shelves), heights 3.4 / 2.6 / 1.8 / 1.0 m.
  Shelf faces flip with the eye level; the ladder slides strongly over the shelves (≈ 37 % of the frame height for 2.4 m of
  travel, from f·T·(1/D_ladder − 1/D_wall) with D ≈ 4.3 / 6.2 m). Weak points: 3 cm shelf boards and full cells (little face area),
  the pendant lamp in the middle at 3.4 / 2.6 m, the near stack end as a dark band on the right fifth.
- `vp_tilt_shift.jpg`: same spot (1.6 m): tilting up converges the verticals; level + lens shift keeps them straight (REF look).
Not done: animation, motion between the heights, REF-side parallax measurement (needs the recording, analysis §7 V0).

## V0 — REF-002 recording measured (2026-10-16; recording kept in the session scratch folder only)
`ref_v0_face_reveal.jpg` (analysis only, not an asset): the same wall point aligned at scroll 7165 and 8583 (camera ≈ 1.36 units
lower); shelf undersides open from ≈ 3 to 24 px while the wall moves 385 px → d/Z ≈ 0.055 → wall ≈ 5.8 m, vertical fov ≈ 32°
(25–39° for a 0.25–0.4 m cell depth). Wall moves 0.27 px per scroll px; the ladder moves like the wall (leans near it). Section
spans page 7324–9243 px with a 948 px viewport, so the 2.75-unit descent takes ≈ 3 screens of scroll. Tool:
`scripts/assets/ref-scroll-shift.py`. Full table: analysis §9.

## V1 — level-camera path from the V0 numbers (D-071)
`SHOTS_JSON` shots p1–p4: level camera, vfov 32°, aisle centre x 0 (x 0.45 put the near stack over a quarter of the frame), y −0.8
(back wall ≈ 5.8 m), heights 3.6 / 2.8 / 2.0 / 1.2 m. 1280×720, 64 samples, r8 lights. `v1_path_r8.jpg`, `v1_edge_compare.jpg`.

| height | r8 (key dir x 0.45) L* 5/25/50/75/95 · plain_range · deep% · pastel% | key dir x 0.65 (edge at the hands) |
|---|---|---|
| 3.6 m | 5 19 30 50 91 · 53.4 · 7.2 · 18.1 | 4 18 28 48 91 · 37.1 · 7.4 · 16.0 |
| 2.8 m | 2 17 29 54 84 · **58.5** · 5.5 · 20.9 | 2 16 27 47 83 · 44.7 · 5.6 · 16.9 |
| 2.0 m | 2 16 30 63 80 · **61.0** · 3.6 · 25.4 | 2 16 28 46 79 · 44.5 · 3.1 · 18.3 |
| 1.2 m | −2 12 27 54 76 · **61.1** · 3.1 · 23.3 | −2 12 24 40 74 · 38.2 · 2.9 · 14.2 |
| REF-002 | 2–4 15–18 25–33 52–62 81–97 · 57–69 · 3.6 · 22–25 | |

Read: in the REF-like framing the r8 lights land inside REF's ranges at 2.0–2.8 m without further tuning — left bay in shade, the
centre bay a pool with crisp accents, the right bay bright; the stack ends stay as thin dark side frames (near-layer parallax). Moving
the edge to the hands (x 0.65) darkens the centre bay and costs 14–23 plain_range at every height: S3 resolved for r8 (x 0.45).
At 1.2 m the floor and the reading chair enter and L*5 drops below REF (the floor shade). At 3.6 m the hatch opening is in frame
(L*95 91). Not done: web camera path, the climb clip check, shelf geometry (V2).
