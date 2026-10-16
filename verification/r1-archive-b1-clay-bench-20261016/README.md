# B1 — clay shadow test bench (2026-10-16)

Plan: `docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md` §7 B1. Script: `scripts/blender/shadow-bench-b1.py` (a small
grey room, not the archive). Bookcase 3 bays × 0.9 m with bevelled books and lying stacks; a ceiling slab over the bookcase with a
hatch (lid propped) 1–1.9 m in front of it; a ladder resting on the bookcase top (foot 0.75 m out); a cube cluster and a faceted ball
0.15 m in front of the cell backs; one sun (0.5°, from right-front-above); off screen, a wall panel facing the sun 5 m away with a
mullioned window (for the right bay) and an upper opening where the sun runs on to the hatch (REF: upper-floor windows feed the
hatch). Camera level, vfov 26°, 6.5 m. Measured with `shadow-sharpness-map.py` (shade zone = the centre bay, --zone 0.42,0.58).

Iterations: t0 front fill too strong, the sun missed the bookcase → t1 low side sun: grid on the wall but raking light blocked by
the uprights → t2/t3 window wall facing the sun 5 m away (REF right bookcase is lit from the right-front) → t4 opening the panel above
the window flooded the room → t5 two boolean openings (window + hatch beam): the intended layout.

## Shadow pairs (cell 0.5, front fill 400, dark floor; `b1_penumbra.jpg`)

| occluder | occluder → receiver | boundary penumbra (720 p) | boundary samples |
|---|---|---|---|
| Ladder_rail | 0.21 m | 0.5 px | 18 |
| Ladder_rung | 0.19 m | 0.4 px | 16 |
| Mullion_h-1 | 5.06 m | 11.0 px | 92 |
| Mullion_h1 | 4.81 m | 10.4 px | 82 |
| Mullion_v-1 | 5.07 m | 11.2 px | 173 |
| Mullion_v0 | 4.93 m | 10.8 px | 185 |
| SlabBack | 0.65 m | 1.5 px | 148 |
| SlabFront | 2.48 m | 5.6 px | 330 |
| SlabL | 1.86 m | 3.9 px | 66 |
| SlabR | 1.6 m | 3.6 px | 246 |
| WinWall | 5.17 m | 11.5 px | 716 |

Ladder and sculptures have fewer than 15 boundary samples in this variant; in t3/t4 (same geometry): Ladder_rail 0.21 m → 0.5 px,
Ladder_rung 0.19 m → 0.4 px, Sculpt_cubes 0.11 m → 0.2 px.

Read: crisp (≤ 2 px) from occluders within ~0.7 m (ladder, sculptures, the slab edge at the back), soft but shaped (10–12 px) from the
window wall and mullions at ~5 m — the REF pair of shadow kinds from one sun, set only by distance.

## Shade layering in the centre bay (median L*)

| variant | front layer | cell back walls | facing up | facing down | facing camera |
|---|---|---|---|---|---|
| c0.27_front | 17.3 | 10.6 | 10.0 | 12.6 | 13.6 |
| c0.27_floor | 12.7 | 6.0 | 6.5 | 9.6 | 9.1 |
| c0.5_front | 12.5 | 4.9 | 2.1 | 8.5 | 8.5 |
| c0.5_floor | 7.1 | -1.5 | -0.2 | 5.6 | 2.9 |
| c0.5_hi | 8.5 | -0.8 | 0.4 | 6.6 | 3.9 |
| c0.5_hi_dark | 1.7 | -4.6 | -3.3 | -0.1 | -1.5 |
| c0.5_fdark400 | 15.9 | 12.4 | 4.2 | 8.0 | 13.8 |
| c0.5_fdark800 | 24.7 | 21.8 | 9.8 | 14.0 | 23.1 |
| c0.5_flight400 | 21.0 | 14.9 | 7.3 | 14.0 | 17.6 |

Read:
- Deeper cells (0.5 m) darken the cell backs against the front layer (gap 6.7 → 7.6–8.6 L*): the "darker inside the corner" layer.
- They also stop oblique light entering the lit bays (bottom pair in `b1_variants.jpg`: the window light catches only the front edges).
  → deep cells only where the shade is, normal depth where light should enter.
- Shelf undersides stay brighter than tops in every fill variant (floor bounce, low fill). REF's black undersides were not reproduced
  by the fill direction alone; open for B2 (overhanging top cabinet, where the bounce comes from, bake settings).
- The left wall picks up stray patches through the hatch beam's opening — a bench artefact (no side walls).
Verdict: CONDITIONAL — shadow kinds and distances confirmed; underside order open.
