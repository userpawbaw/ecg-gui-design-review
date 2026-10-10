# Archive r6 tuned (D-062 tuning), 2026-10-10 — stills only

User: "조정 한번 더 확인해줘" and "사람 위치는 네 임의로 진행해봐".
Changes to r6 defaults: exposure 0.9 → 0.15 (−0.75 stop), sky 0.8 → 0.5, key colour #ffe8d0 → #fff0e2 (less saturated), sun 12 → 22
(accents), floor albedo #cdb699 → #a89075 (less bounce into the shade), key direction (0.3, 0.5, −0.81) → (0.45, 0.5, −0.74).
Figure placement (AI choice): the ladder and climber stay (moving them would re-open the rung contacts); the key was turned so the pool
edge runs along the ladder at the hands — the climber goes from the shade into the light, where REF puts its maximum contrast.
Variants tried (640×360): v1 direction 0.3 (pool over the whole figure), v2 0.45 (edge at the hands, chosen), v3 0.6 (pool to the
right, the figure in front of the brightest wall).

| | r6 first pastel a1 / a2 | r6 tuned pastel a1 / a2 | REF-002 |
|---|---|---|---|
| L* 5/25/50/75/95 | 11 24 34 60 83 / 11 24 35 69 83 | 4 15 24 42 77 / 4 15 24 53 78 | 2–4 15–18 25–33 52–62 81–97 |
| deep% | 10.8 / 8.0 | 4.1 / 3.6 | 3.6 |
| room-scale share ≥ +1.5 stops | 34 / 38 % | 37 / 41 % | 48 % |
| pastel% | 23 / 27 | 18 / 20 | 22–25 |
| plain_range | 52 / 57 | 32 / 30 | 57–69 |
| spread | 64 / 64 | 65 / 67 | 67–77 |

Read: the tone distribution and the saturation now sit on REF's; the layout (shade zone + one pool) is kept and the pool is stronger.
Lost: plain_range fell (the lit cabinet and empty cells are darker now, so plain surfaces span less) and pastel share dipped below
REF. Archive palette at this exposure is crushed (L*5 −10, median −1) — not usable without its own exposure. Not checked: web bake.
