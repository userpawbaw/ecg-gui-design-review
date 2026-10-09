# Archive set dressing test (D-060), 2026-10-09 — stills only

User asked what makes REF-002's soft shadow areas; answer: a broad source (r4), bounce from light flat surfaces near the patch,
and form that shows the change (depth, plain areas, matte). User: "응" to testing the cabinet + open cells first.
Build: `python scripts/blender/build_archive.py --intro2 --art r4 --dress --palette pastel|archive --look h5 --preview DIR --samples 64`
(the web scene is unchanged).

`--dress` on the back wall (cells = column 0-4 × shelf row 0-10):
- drawer cabinet, column 2 rows 0-3, under the centre skylight patch: 2 × 4 painted fronts, 6 mm reveals, brass pulls;
- open cells with a cream painted back: framed print (own colour-block composition, nothing taken from REF), plaster blocks and a ball,
  lying book stacks, under the hatch patch and the roof-gap bands; 12 % of the other cells made sparse (half books + a lying stack).
Climber contacts and collisions unchanged (gripping hands on rungs 6-7 only).

`r4_vs_dress_compare.jpg`, `soft_shadow_crops.jpg` (pastel a2: open cells left, cabinet right):
| | r4 pastel a1 / a2 | + dressing pastel a1 / a2 | + dressing archive a1 / a2 | REF-002 |
|---|---|---|---|---|
| L* 50 | 32 / 35 | 34 / 37 | 20 / 22 | 25-33 |
| lit% | 10.6 / 14.9 | 11.5 / 16.1 | 7.5 / 11.6 | 13-18 |
| edge | 20.7 / 19.4 | 18.1 / 16.4 | 20.7 / 19.0 | 28-31 |
| pastel% | 6.4 / 7.3 | 10.8 / 11.5 | 8.7 / 10.1 | 22-25 |

Read: the open cells now shade from the lit front edge to a darker back and under each shelf board (soft, graded), and the cabinet
fronts take the skylight patch as a broad bright plane with a wide penumbra; pastel share rose ~1.6×, still half of REF.
Seen and not yet decided: the pendant lamp's shadow falls on the cabinet as a dark silhouette; the framed print sits mostly behind
the ladder in both shots; edge dropped (plain surfaces have no spine texture). Not checked: web bake / runtime, Edge.
