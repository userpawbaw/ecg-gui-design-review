# H5 ring coordinate rebuilt (2026-10-09)

User (local Edge, intro 0:08 ladder / 0:11 floor sit): rings squashed on the back and buttocks on the ladder, the crotch "아예 찌그러진" when seated; asked whether skin stretching causes it.

Cause (F-037): not the skin. The per-vertex ring value `_SLICE_rest` (build-figure-v3 `slice_coord`, since 2026-10-02) started every
parentless deform bone (thigh, upper arm, shoulder, pelvis.L/R) at a constant .80 while the trunk ran upward from the pelvis — the value
jumped at shoulders and hips and had minima on the buttocks and crotch; rings are its level lines, so jumps and extrema became whorls.

Fix: `scripts/assets/slice-field-v3.py` — one tree rooted at the top of the head, pelvis.L/R counted as the pelvis, single-bone cores
(weight ≥ .9) keep the bone-axis value, joint blends filled with a harmonic function (cotangent Laplacian).
Local extrema 142 → 31 (the rest: finger tips, toes, head top and single vertices); 99.9th-percentile gradient 19.0 → 2.1 (1 = metric).

- `intro_rings_before_after.jpg`: ladder back/buttocks (p .45), floor sit crotch (p .60), chest (p .64); left before, right after.
- `story_rings_before_after.jpg`: Story muscle (front) and baseline (side) scenes; left before, right after.
Re-exported: `body_v3_ar_climb.glb`, `body_v3_ar_floor.glb` (`autorig-export-v3.py`, figure.json unchanged);
`body_v3_story.glb` ring attribute replaced in place (meshopt reorders vertices: matched by old ring value + neighbour signature, 53,286 one-to-one).
Left: a mild bend where trunk rings meet thigh rings at the groin. Edge not checked.
