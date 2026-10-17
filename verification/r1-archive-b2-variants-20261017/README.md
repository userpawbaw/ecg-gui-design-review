# B2 variants (D-085), 2026-10-17 — stills only, defaults unchanged

User: "b2로 가되, 잎 그림자가 좀 더 자유롭게 나오도록 모양을 바꿔봐. a), b)는 결과물을 보고 결정 … 화면 찍는 거리 2가지, 사다리
위치 더 가까이 2가지 버젼, 사다리 회전 각도 2가지 해서 총 16개". Builder `--intro2 --art r6 --dress --palette pastel --look h5 --b2`
with `LIGHTGROUPS=1`, 1280×720, 64 samples, mixed with the D-084 candidate weights (key ×0.5, sun ×0.6, sky ×4, exposure 0.3).
Cameras: V1 (D-083) at 2.8 m and 2.0 m.

| axis | values | env |
|---|---|---|
| foliage | twigs with pointed leaves at 6.5–10 m (all 16) | `B2_FOLIAGE=branch` |
| (a) one pool | skylight widened to x 1.7–3.5, y 2.45–3.88 (next to the hatch, between the beams); 10 short branches reach in from the edges only | `B2_EDGE=1 HOLES=1.7,3.5,2.45,3.88` |
| (b) patches | D-084 skylight x 1.75–3.3, y 2.6–3.85; 7 long branches cross the beam | — |
| L1 | ladder top moved to the hatch's back edge (still climbs into the hatch) | `LAD_MODE=hatch_back` |
| L2 | ladder top resting on the back-shelf rail at 4.3 m (nearer the wall the higher it goes; no longer into the hatch) | `LAD_MODE=wall` |
| 30° / 45° | the ladder's run in plan against the back-wall plane (`LAD_YAW` 60 / 45) | `LAD_YAW` |

Files: `{a,b}_{L1,L2}_y{30,45}_{p2_z28,p3_z20}.jpg` (16 frames), `sheet_mix_*.jpg` (the 16 as two sheets, one per camera),
`sheet_sun_*.jpg` (sun group only: where the sun lands and the leaf/ladder shadow shapes).

Metrics (frame-tone-stats, 2.8 m / 2.0 m):

| variant | L* 5/25/50/75/95 | plain_range | sharpC | soft_area% | pastel% |
|---|---|---|---|---|---|
| a L1 30° | 1 15 27 51 81 / 2 18 33 56 80 | 45.1 / 48.1 | 16.2 / 16.2 | 10.6 / 14.4 | 20.5 / 21.9 |
| a L1 45° | 1 15 27 50 80 / 2 19 34 57 80 | 44.0 / 46.5 | 16.6 / 16.1 | 11.6 / 15.0 | 20.0 / 22.0 |
| a L2 30° | 1 16 27 51 80 / 2 20 35 57 80 | 43.4 / 46.0 | 16.5 / 16.7 | 11.4 / 14.5 | 20.7 / 23.3 |
| a L2 45° | 1 16 27 51 81 / 2 20 35 57 80 | 42.7 / 44.6 | 16.5 / 16.8 | 11.0 / 14.8 | 20.7 / 23.3 |
| b L1 30° | 1 15 26 50 80 / 2 18 32 54 79 | 44.2 / 45.8 | 16.3 / 16.0 | 10.8 / 14.8 | 20.0 / 21.3 |
| b L1 45° | 1 15 27 49 80 / 2 19 33 54 79 | 43.5 / 44.4 | 16.6 / 15.9 | 11.4 / 16.0 | 19.5 / 21.1 |
| b L2 30° | 1 16 27 51 80 / 2 19 34 55 79 | 42.1 / 45.0 | 16.5 / 16.6 | 11.1 / 14.4 | 20.3 / 22.4 |
| b L2 45° | 1 16 27 51 80 / 2 20 34 55 79 | 41.8 / 43.8 | 16.6 / 16.6 | 10.9 / 14.5 | 20.2 / 22.3 |
| D-084 candidate | 1 15 26 49 82 / 1 17 31 55 82 | 44.9 / 45.4 | 16.7 / 16.3 | — | 18.6 / 20.2 |
| REF clean p 0.5 / 0.75 | 0 16 25 52 77 / 2 19 26 50 74 | 54.0 / 48.8 | 18.7 / 19.1 | — | 23 / 22 |

Sun shadow pairs (shadow-sharpness-map, (a) 30°, 2.0 m, 720 p penumbra; occluder distance):
L1 — ladder rungs 6.0 px (3.0 m), stiles 6.7 px (3.4 m); L2 — rungs **2.4 px (1.2 m)**, stiles **2.0 px (1.0 m)**;
leaves 17 px (8.4–8.5 m); lid 7–8 px; climber 0.7 px. Sun boundaries crisp ≤ 3 px: L1 56 %, L2 61 %.

Read `[런타임]`:
- Leaves: twig-and-leaf shadows now show stems and pointed tips mixed with blurred clumps (sun sheets). In (a) they stay at the
  pool's edges and read as a few dark blots; in (b) they cross the pool and break it into a dappled pattern.
- (a) gives one larger trapezoid pool low in the centre (cabinet fronts) and the hatch beam on the upper left bays; (b) keeps the
  D-084 split with more leaf dapple.
- L2 is the only arrangement whose ladder shadow is crisp: a sharp diagonal of stile and rungs across the pool. L1 barely helps
  (3.0–3.4 m), and its shadow mostly falls outside the pool.
- 30° vs 45°: at 45° the ladder turns more face-on, and its rungs read as horizontal bars rather than slats in depth. The tone metrics
  barely move (≤ 1.5 plain_range).
- At these weights the key spot dominates the frame at 2.8 m: the sun pool sits low, and the leaf shadows are faint in the mixes. A
  lower key weight would bring the sun pattern forward (a weight choice, no re-render needed).
- Not checked: climber pose against the moved ladders (only the rung-contact fit is printed, max error 25 mm as before), web bake,
  motion.
