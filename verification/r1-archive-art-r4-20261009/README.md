# Archive art test r4 (D-059), 2026-10-09 — stills only

User on r3: "이전보다 오히려 빛이 비치는 부분이 줄어든 것 같은데? 은은한 그림자나 반그림자들은 거의 보이지 않고. … 다락문 하나에
갇혀 있을 필요는 없어. 이전 레퍼런스를 유지하면서 빛 구멍을 좀 추가하고 은은한 그림자와 반그림자가 생길 수 있게 고쳐봐."
Build: `python scripts/blender/build_archive.py --intro2 --art r4 --palette pastel|archive --look h5 --preview DIR --samples 64`
(r3 kept for comparison; the web scene is unchanged). Knobs: `HOLES` (x0,x1,y0,y1;…), `SUN_ANG` (2.0°), `SKY_E` (2.4).

What r4 adds to r3 (same sun direction, same hatch, same side ladder and climber):
- light holes in the ceiling beside the hatch, each placed so its patch lands on the back shelves in frame:
  a skylight (x −1.9…−0.9, y 0.95…1.75) → a low patch at the centre; three roof-board gaps (0.30 m gaps, 0.12 m boards,
  x −2.5…−1.0, y 2.45…3.59) → soft bands upper left; a front skylight (x 0.6…1.6, y 1.0…1.6) → a low patch right (behind the climber);
- penumbra: sun disc 0.55° → 2° (penumbra ≈ throw × tan 2°: ~9 cm on the hatch patch, ~17 cm on the skylight patch);
- soft shading: sky fill 1.8 → 2.4 through all holes; the r2 hero/support windows reopened (side sky light).
Ray check (it2): 0.12 m gaps passed no sun — the 0.15 m ceiling slab shades 0.12 m at this sun slope, so the gaps are 0.30 m.
Climber contacts unchanged (hands 28 / 35 mm, left foot 76 mm), room collisions none beyond the gripping hands.

`r3_vs_r4_compare.jpg` (1280×720, 64 samples; numbers on the sheet), `penumbra_crop_r3_r4.jpg` (left r3, right r4, same crop):
| | r3 pastel a1 | r4 pastel a1 / a2 | r4 archive a1 / a2 | REF-002 |
|---|---|---|---|---|
| L* 50 | 23 | 32 / 35 | 19 / 22 | 25–33 |
| lit% | 5.8 | 10.6 / 14.9 | 7.7 / 11.6 | 13–18 |
| edge | 16.3 | 20.7 / 19.4 | 25.1 / 24.0 | 28–31 |
| light R−B | .07 | .07 / .05 | .09 / .07 | .06–.13 |
| pastel% | 2.2 | 6.4 / 7.3 | 6.2 / 6.5 | 22–25 |
| deep% | 0.2 | 0.3 / 0.3 | 0.9 / 1.1 | 3–4 |

Read: lit area doubled (pastel a2 inside the REF range), mid brightness reached REF in pastel, archive moved from 12–14 to 19–22.
Patches now have soft edges and the shelves between them shade gradually (sky through five holes); the ladder throws a soft
shadow across the hatch patch. Pastel share is still a set-dressing gap (proposal 4). Penumbra judged visually (no metric).
Not checked: web bake / runtime, Edge.
