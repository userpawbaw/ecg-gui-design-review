# B2 — light structure test (D-084), 2026-10-17 — stills only, defaults unchanged

User: B2 go-ahead ("응"). Builder option `--b2` (with `--art r6`): the desk-corner sun (−0.42, 0.40, −0.81; Story branch D-070's
`desk-corner-set.py`) so both bakes in the one room cast parallel shadows; no floor-patch hole and no front skylight (the fill from
below, F-046); a skylight between the beams near the back right (x 1.75–3.3, y 2.6–3.85); a lid standing on the hatch's right edge
(`B2_LID`); 14 leaf blobs ~3.5 m above the skylight, up-sun, off screen (`B2_CANOPY`, bake-only, named `B2_*`). Camera V1 (D-083).

Iterations:
1. Same sun through the hatch and a high right-wall window (`b2_first_try_light_groups.jpg`, light-group mixes): the hatch beam lands
   low in the left-centre bay (the REF layout mirrored); the right-wall window light falls on the floor (54° sun) — window dropped
   (`B2_WIN` now off by default); with the key spot on, the centre is evenly bright and the sun pattern is lost.
2. Skylight near the back right + lid + leaves: rays traced — 38 leaves and a beam at y 4.0 blocked the skylight; moved between the
   beams, 14 leaves (`b2_skylight_canopy_sun_only_lowres.jpg`, key off).
3. Light-group render + two sweeps (96 + 72 weight sets) ranked by distance to the clean REF (F-045).

Candidate: key ×0.5 (2275), sun ×0.6 (≈ 20), sky ×4, exposure 0.3 (`b2_compare.jpg` against r8, `b2_candidate_*.jpg`):

| | L* 5/25/50/75/95 | plain_range | sharpC | deep% | pastel% |
|---|---|---|---|---|---|
| B2 2.8 / 2.0 m | 1 15 26 49 82 / 1 17 31 55 82 | 44.9 / 45.4 | 16.7 / 16.3 | 2.2 / 1.3 | 18.6 / 20.2 |
| r8 V1 2.8 / 2.0 m | 2 17 29 54 84 / 2 16 30 63 80 | 58.5 / 61.0 | 16.1 / 14.8 | 5.5 / 3.6 | 20.9 / 25.4 |
| REF clean p 0.5 / 0.75 | 0 16 25 52 77 / 2 19 26 50 74 | 54.0 / 48.8 | 18.7 / 19.1 | 5.7 / 5.0 | 23 / 22 |

Sun shadow pairs at 2.0 m (boundary penumbra, 720 p; occluder distance): shelves/books 0.1 px (≤ 0.07 m), climber 0.6 px (0.2 m),
stack shelves 3.8 px (1.1 m), stack ends 4.1 px (1.3 m), beams 3.3 px (1.7 m), lid 8.0 px (4.0 m), ladder 7–8 px (3.6–4 m),
**leaves 15 px (7.6 m)**. Sun boundaries: 62 % crisp ≤ 3 px, 9 % soft > 10 px (r8: 44 % / 7 %).
Shade layering, left third: up-facing 50.5, down-facing 10.3, front layer 21.1, cell backs 12.6 (r8: 12.6 / 10.7 / 16.3 / 8.2).

Read: crisp near pairs and a far, freely shaped soft pair (the leaves) now coexist under one sun, sharpC is near REF's, and up-facing
faces are brighter than undersides. Costs: plain_range dropped to REF's lower edge (45), deep colour and pastel share fell, and the sun
breaks into several patches across the centre bays — the scattered look F-040 warned about may come back. The hatch beam still lands
in the lower left-centre. The ladder shadow is soft (the hatch sun meets it ~4 m from the shelves) — REF's crisp ladder shadow needs
the ladder nearer the lit surface (B3). Not checked: web bake, motion.
