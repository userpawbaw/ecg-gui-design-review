# Archive art test r3 (D-058), 2026-10-09 — stills only

User: "1은 권장안으로, 2는 밝은 파스텔 서고로 옮겨보기(이전 것과 비교해 선택 예정), 손발 위치 다시 진행."
Build: `python scripts/blender/build_archive.py --intro2 --art r3 --palette archive|pastel --look h5 --preview DIR --samples 64`
(defaults unchanged: the web scene still uses the r2 rail ladder). Measure: `scripts/assets/frame-tone-stats.py`.

What r3 changes (review proposals 1, 2, 3 + the ladder):
- ceiling hatch over the back of the aisle (x 0–1.6, y 2.47–3.88, between the beams); the sun (cream #fff0dc, 20) enters only there and
  lands on the back shelves; the windows stay closed and the bulbs are off (one source, review G); sky fill 1.8 through the hatch;
- haze only in the hatch beam (global 0.0012) — the one light curtain;
- side ladder up into the hatch: the r2 ladder and the climber moved by one rigid transform (top to the hatch rim, turned 60° about
  the vertical, foot out to +x), so the rails part and the rungs read as slats (REF-002);
- palettes: `archive` (original dark books/wood) and `pastel` (pastel books, pale wood ×1.45 value, light boxes/binders/beams).

Hands and feet (user: "손발 위치 다시 진행"): the climber keeps its rung fit exactly (same rigid move): hands 28 / 35 mm, left foot
76 mm from the rung axes (right foot mid-step in the source frame). Room collisions: only the gripping hands on rungs 6–7
(14.5 / 0.7 mm, intended contact). A first check reported 178–196 mm "into" the stiles — a false positive of the default search reach
(0.2 m) on a 45 mm stile; with reach 0.09 m it is gone (the pose-check docstring already warned about thin parts).

Iterations (a1 front, 640×360 tests): it1 (hatch 1.2×1.15, sun 9, yaw 72°) was dark (L*50 = 5 archive / 14 pastel) and the ladder
read edge-on (one stile) → it2 (hatch 1.6×1.4, sun 20, sky 1.8, 6 bounces, yaw 60°, front lamp removed): L*50 23, rails parted →
a lower sun (0.25, 0.78, −0.58) moved the patch to the shelf top (lit 6.3 → 4.5 %), so the it2 sun was kept.

`r3_palette_compare.jpg` (1280×720, 64 samples; numbers on the sheet):
| | current web r2 | r3 archive | r3 pastel | REF-002 |
|---|---|---|---|---|
| L* 50 | 19 | 12–14 | 23–25 | 25–33 |
| lit% (L* > 70) | 5 | 5–8 | 6–10 | 13–18 |
| edge | 17 | 17–18 | 15–16 | 28–31 |
| light R−B | .23 | .06–.07 | .06–.07 | .06–.13 |
| deep% | 13 | 0.2 | 0.1 | 3–4 |
| pastel% | 8 | 2 | 2 | 22–25 |

Read: the orange cast and the saturated mid tones are gone in both palettes (light colour now in the REF range); pastel reaches the
REF mid brightness, archive stays dark (dark books absorb the bounce). Not reached: lit area (one 1.6 m hatch patch on a wall of books)
and pastel share — REF's pastel comes from large flat light surfaces (cabinet fronts, wall, framed prints, drawers) and gaps; our back
wall is books edge to edge. That is proposal 4 (set dressing), not palette. Edge stays ~16: the patch is sharp, but small.
Also visible: the measurement-chair pendant hangs in the top-left of a1 (story prop); the climber is seen from the side (the ladder is).
Not checked: web bake / runtime, Edge.
