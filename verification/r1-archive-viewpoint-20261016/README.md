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
