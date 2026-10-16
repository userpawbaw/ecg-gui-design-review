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
