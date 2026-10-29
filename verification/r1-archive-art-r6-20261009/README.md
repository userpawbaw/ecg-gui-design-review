# Archive r6 (D-062), 2026-10-09 — stills only

From the F-040 frame anatomy: REF's key is a near small lamp (crisp edges + falloff inside one light), the left third is a flat shade
zone, surfaces are near-flat albedo. Build: `python scripts/blender/build_archive.py --intro2 --art r6 --dress --palette pastel|archive
--look h5 --preview DIR --samples 64`. r6 = r5 + spot key 2.2 m outside the hatch (5500, #ffe8d0, radius 0.06 m, dir 0.3/0.5/−0.81),
sun 0.5° and 12 (accents), left holes closed (shade zone), wall/wood albedo 85 % flat colour (floor 60 %), normal maps scaled alike.
Iterations (640×360): KEY_E 9000 #ffd6a6 too bright and saturated (deep 36 %, the pool covered the wall) → 4500/3500 → 5500 #ffe8d0.

`r6_light_structure.jpg` (photo / stops / room-scale stops), `r6_compare.jpg`:
| | r5 pastel a1 / a2 | r6 pastel a1 / a2 | REF-002 |
|---|---|---|---|
| room-scale layout | several separate pools | **left shade zone + one pool centre/right** | left shade zone + one pool |
| share ≥ +1.5 stops (room scale) | 37 % | 34 / 38 % | 48 % |
| crisp-edge scale σ* (720 p) | 2.8 px (cabinet) | 1.0 px | 0.8 px |
| grain (local std, L*) | 2.6–5.4 | 1.7–1.8 | 0.4–1.0 |
| pastel% | 14 | 23 / 27 | 22–25 |
| plain_range | 52 / 50 | 52 / 57 | 57–69 |
| L* 5/25/50/75/95 (a1) | 2 12 25 39 80 | 11 24 34 60 83 | 2 15 25 52 81 |
| deep% | 1.5 | 8–11 | 3.6 |

Read: the light is now organised like REF (shade zone, one coherent pool falling off to the right, crisp edges, near-flat surfaces);
pastel share reached REF. Still off: the darks are lifted again (L*5 11 vs 2 — the key's bounce fills the shade), the frame is ~1
stop brighter overall, the warm key saturates some books (deep 8–11 %), sun accents are faint at energy 12, and the climber now
sits inside the pool. Archive palette r6 crushes the darks (L*5 −8). Not checked: web bake / runtime, Edge.
