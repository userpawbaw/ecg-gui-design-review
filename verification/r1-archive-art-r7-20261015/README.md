# Archive r7 (D-081), 2026-10-15 — stills only

User: "1a, 2a, 다운로드 허가" — tune once more (restore plain_range while keeping the shade depth), pastel palette.
Build (r7 defaults now in `--art r6`):
```
python scripts/blender/build_archive.py --intro2 --art r6 --dress --palette pastel --look h5 --preview DIR --samples 64
```
Changes to the r6b defaults: key pulled toward the hatch along the same axis `KEY_D` 2.2 → 1.6 m, `KEY_E` 5500 → 3500,
sky 0.5 → 0.3, pastel floor #a89075 → #86705a. r6b is reproduced with `KEY_D=2.2 KEY_E=5500 SKY_E=0.5 FLOOR_COL=#a89075`.
New knob: `CELL_COL` (painted cell backs / cabinet). New: `--nofig` with `--art r3–r6` keeps the a1/a2 shots (figure-free sharpC).

Environment: cloud container, `bpy` 4.5.3 (Python 3.11 venv, numpy 1.26.4). Poly Haven sources re-fetched into `assets/source/`
(not committed), every file md5-checked against the Poly Haven API; the `.gltf` sha256 matches `assets/registry.json` for 15 of 16.
`vintage_wooden_drawer_01` (a small drawer on the shade-side desk) has been republished by Poly Haven: the current files match the
API md5 but not the registry sha256 (registry `d39f41…`, current `4080ec…`); its CDN also served a stale `.bin` until a
cache-busting query. The r6b baseline re-rendered here reproduced the committed r6b numbers exactly (a1 `4 15 24 42 77`, plain_range
32.0; a2 `4 15 24 53 78`, 29.7), so the prop change does not touch these frames. `GreenChair_01` (chair-motion-v3) was also needed.

## Measurement caveat (new)
plain_range depends on the **render** resolution. The same r6b scene: 1280×720 render 32 / 30, 640×360 render 51 / 64.
Downscaling the 1280 render to 640 measures 33 (unchanged) — a low-res render resolves less fine texture, so the "plain surface"
mask grows. Compare plain_range only between 1280×720 renders. (r6 first → r6b, 52–57 → 30–32, were both 1280×720: the drop was real.)

## Iterations
640×360 / 32 samples screening (a1 / a2; plain_range not comparable, see above):

| variant | L* 5/25/50/75/95 | deep% | pastel% |
|---|---|---|---|
| r6b | 5 15 24 43 77 / 4 15 24 54 77 | 3.4 / 3.1 | 19 / 21 |
| `KEY_E` 8000 | 7 18 27 49 81 / 6 18 27 59 81 | 6.4 / 5.0 | 20 / 22 |
| `KEY_E` 12000 | 9 22 30 55 85 / 9 21 31 65 84 | 16.9 / 14.2 | 21 / 22 |
| `KEY_D` 1.6 | 10 23 32 65 81 / 10 24 33 69 81 | 18.2 / 16.0 | 26 / 30 |
| `KEY_D` 1.6 + `KEY_E` 3500 | 7 19 27 58 77 / 7 19 28 63 77 | 5.6 / 4.8 | 24 / 28 |
| `TEX_KEEP` .05 + `CELL_COL` #f6f0e4 | 6 16 24 44 77 / 5 17 25 54 78 | 4.7 / 3.7 | 19 / 22 |

1280×720 / 64 samples, a1, all with `KEY_D` 1.6 + `KEY_E` 3500:

| shade correction | L* 5/25/50/75/95 | deep% | plain_range |
|---|---|---|---|
| none | 6 19 27 58 77 | 7.0 | 50.0 |
| sky 0.25 | 5 18 27 57 77 | 7.8 | 50.5 |
| **sky 0.3 + floor #86705a** | **4 17 25 57 77** | 6.2 | **50.8** |
| exposure 0.0 | 5 17 25 55 76 | 5.6 | 49.0 |

## Result (pastel, 1280×720, 64 samples)

| | r6b a1 / a2 | **r7 a1 / a2** | REF-002 |
|---|---|---|---|
| L* 5/25/50/75/95 | 4 15 24 42 77 / 4 15 24 53 78 | **4 17 25 57 77 / 4 17 26 62 78** | 2–4 15–18 25–33 52–62 81–97 |
| deep% | 4.1 / 3.6 | 6.2 / 5.2 | 3.6 |
| room-scale share ≥ +1.5 stops | 37 / 41 % | **43 / 46 %** | 48 % |
| pastel% | 18 / 20 | **23 / 26** | 22–25 |
| plain_range | 32 / 30 | **51 / 54** | 57–69 |
| spread | 65 / 67 | 64 / 65 | 67–77 |
| sharpC with figure | 12.9 / 12.0 | 13.8 / 12.7 | 20–22 |
| sharpC **figure hidden** (`--nofig`) | 14.5 / 15.1 | 15.8 / 15.9 | 20–22 |

Read:
- plain_range back over 50 with the shade depth kept (L*5 4); L*25/50/75 now inside REF's ranges, pastel share back at REF.
- The pool now reaches the drawer cabinet and the middle bay (light-structure sheet, middle row).
- Hiding the figure raises sharpC by only ~2–3: the gap to REF (~5) is a real contrast gap of the crisp edges, not the ring pattern.

Changed, needs the user's eye: the pool edge moved left from the ladder at the hands (r6b's chosen placement) to the middle bay, so
the climber is now mostly inside the light. Also: deep% rose to 5–6 % (REF 3.6), L*95 stays at 77–78 (REF 81–97).
Not checked: web bake, brown palette (not chosen).

Files: `a1_front_pastel.jpg`, `a2_near_pastel.jpg`, `a1_front_pastel_nofig.jpg`, `r7_compare.jpg` (r6b vs r7 with numbers),
`r7_light_structure.jpg` (photo / stop map / room-scale stop map: r6b a1, r7 a1, r7 a2).
