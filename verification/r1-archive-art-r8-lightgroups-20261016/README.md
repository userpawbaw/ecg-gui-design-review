# Archive light groups (S1) and sun-bounce tuning (S2), 2026-10-16 — stills only

Plan: `docs/uiux_system/rounds/R1/RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016.md` §6. User: "보고서 고치고 S1부터 진행해줘."

## S1 — light-group tuning tool (PASS)
```
LIGHTGROUPS=1 python scripts/blender/build_archive.py --intro2 --art r6 --dress --palette pastel --look h5 --preview DIR --samples 64
python scripts/assets/light-group-mix.py DIR/a1_front_..._lg0001.exr OUT.png key=1.2 sun=0.5 [sky= rest= expo= look=]
python scripts/assets/light-group-sweep.py OUTDIR "key=1,1.2 sun=1,2 expo=0.15,0.35" A1.exr A2.exr
```
`LIGHTGROUPS=1` writes, beside each PNG, a multilayer EXR: Combined (the render's own denoised image) + key / sun / sky passes,
each denoised in the compositor (OIDN with the render's normal and albedo). 'rest' = Combined − the three (pendant/desk lamps,
visible lamp glass). The mix is put through the stills' view transform (AgX, AgX - Punchy, exposure) by bpy colour management.

Validation (1280×720, 64 samples, r7 defaults):

| | L* 5/25/50/75/95 | pastel% | deep% | sharpC | plain_range | pixels |
|---|---|---|---|---|---|---|
| a1 direct render | 4 17 25 57 77 | 22.9 | 6.2 | 13.8 | 50.8 | |
| a1 mix (1, 1, 1, 1) | 4 17 25 57 77 | 22.9 | 6.2 | 13.8 | 50.8 | max diff 1/255 |
| a2 direct / mix | 4 17 26 62 78 / same | 26.3 | 5.2 | 12.7 / 12.8 | 54.4 | |
| a1 render KEY_E 4200 SUN_E 11 | 3 16 25 57 78 | 23.1 | 5.7 | 14.2 | 51.1 | |
| a1 mix key 1.2 sun 0.5 | 3 16 25 57 78 | 23.1 | 5.7 | 14.2 | 51.1 | mean diff 0.84, p99 5 |

A weight equals a change of that light's energy: intensity tuning now takes seconds per candidate instead of ~17 min.
Direction, position, size and bounce limits (SUN_MB) still need a render.

## S2 — sun bounce limited to 1, key ×1.3, sun ×1.5 (D-082, now the defaults in `--art r6`)
Light-group render with `SUN_MB=1`, then 108 weight sets (a1 36 + a1/a2 72) through `light-group-sweep.py`; chosen
key 3500 → 4550, sun 22 → 33, sun max bounces 1, sky and exposure unchanged. Confirmed by real renders (1280×720, 64 samples):

| | L* 5/25/50/75/95 | plain_range | deep% | pastel% | room-scale ≥ +1.5 stops | sharpC with / without figure |
|---|---|---|---|---|---|---|
| r7 a1 / a2 | 4 17 25 57 77 / 4 17 26 62 78 | 50.8 / 54.4 | 6.2 / 5.2 | 22.9 / 26.3 | 43 / 46 % | 13.8 / 12.7 · 15.8 / 15.9 |
| sweep prediction a1 / a2 | 4 18 27 61 80 / 4 18 28 65 79 | 55.7 / 58.6 | 4.9 / 4.9 | 23.7 / 27.5 | | |
| **r8 render a1 / a2** | **4 17 27 61 80 / 4 18 27 65 79** | **55.8 / 58.6** | **4.9 / 4.8** | 23.7 / 27.5 | 44 / 48 % | 13.9 / 12.7 · 16.0 / 16.3 |
| REF-002 | 2–4 15–18 25–33 52–62 81–97 | 57–69 | 3.6 | 22–25 | 48 % | 20–22 |

Read: shade depth kept (L*5 4) while plain_range rose 5 (a2 now inside REF's range), the bright end to 79–80 (REF 81+), deep colour
down to ~4.9 % and the room-scale lit share to 44 / 48 %. Off: L*75 a2 65 (REF ≤ 62); sharpC does not move with intensities (layout /
occlusion question, analysis §5). Files: `a1_front_pastel_r8.jpg`, `a2_near_pastel_r8.jpg`, `a1_front_pastel_r8_nofig.jpg`,
`r8_compare.jpg` (r7 vs r8), `r8_light_structure.jpg`. Not checked: web bake, softness of the floor bounce by eye (D-061 intent).

## S3 — pool edge back to the ladder at the hands? (CONDITIONAL: user choice, defaults unchanged)
Key direction x 0.45 (r8) / 0.55 / 0.65 / 0.75 screened at 640×360 (a1); x 0.65 puts the edge at the ladder at the climber's
hands. Then a 1280×720 light-group render of x 0.65 and a 48-set sweep (a1/a2):

| | L* 5/25/50/75/95 a1 / a2 | plain_range a1 / a2 |
|---|---|---|
| r8 (x 0.45) | 4 17 27 61 80 / 4 18 27 65 79 | 55.8 / 58.6 |
| x 0.65, r8 intensities | 4 17 26 50 78 / 4 17 26 55 78 | 40.6 / 36.0 |
| x 0.65, key ×1.3 | 7 20 30 55 81 / 7 21 30 59 81 | 45.1 / 48.5 |

With this camera, putting the edge at the hands shrinks the pool in frame and plain_range falls back to the r6b level; buying it back
with the key lifts the shade (L*5 7). Edge position and in-pool range conflict in the a1/a2 framing. `s3_compare.jpg`: r8 /
x 0.65 / x 0.65 + key ×1.3 / r6b. A different framing (analysis V1: level camera, narrower lens) changes how much of the frame the
pool covers, so the choice may be re-opened with the camera.
