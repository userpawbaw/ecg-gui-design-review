# R1 intro2 — Mixamo auto-rig figures in the intro (REVIEW-R1-WEB-20261008 I-4…I-8), 2026-10-08

User request: "자동 리깅으로 도입부 다음 단계 진행해줘."

## What changed
| Item | Change | Where |
|---|---|---|
| I-4 model | The intro now uses the story mesh, rigged by Mixamo (user's auto-rig upload), posed by the Mixamo `Climbing_Ladder` (frame 1) and `Sitting_Idle` (frame 1) | `scripts/assets/autorig-export-v3.py` → `assets/body_v3_ar_{climb,floor}.glb`, `figure.json` `poses_v3.ar_*` |
| I-5 staging | ① climber appears top-down (p .37–.44) ② vanishes from the top, the reverse (p .475–.535) as the camera moves down ③ floor-sitter with electrodes appears right of the ladder (p .52–.585) ④ chest zoom → heart → waveform as before | `introStage.ts` (second H5 figure, `uScanDir`), camera knots `s1_top → s2_beams → s3_aisle → i2_climb → i3_floor → chest` |
| Ladder | Rungs re-spaced to the climb motion: 0.2525 m along the stile (0.245 m vertical; was 0.29 m), round rungs. The climber is leaned 18.5° (its contacts coplanar within 14 mm). Hands 28–35 mm from the rung axes, left foot 76 mm (planned offset ≈ 54 mm) | `build_archive.py --intro2`; archive rebaked (shell 466 s, books 46 s, decor 110 s; 10.38 MB) |
| Electrodes | 3-lead set on the floor-sitter, leads/trunk/comm as before | `rig_v3_floor.glb` (meshopt 68 KB) |
| I-6 heart | ×0.68 for the H5 look (intro and Story): measured inside the bodies — floor-sit wholly inside at ≤ 0.70, story chair at ≤ 0.90 | `figure.ts` `HEART_SCALE_H5` |
| I-7/I-8 crossfade | D-055: follows the scroll in 2.5 % steps, reversible; step cells at 25/50/75/100 %; label "입력 ↔ 출력" | `waveUi.ts` `createScrollMix` |

## Checks
- `web_p030-095_sheet.jpg`: built page (SwiftShader), p = .30 … .95. Climber appears, vanishes from the top, sitter appears with electrodes, chest, heart inside the chest, wave stage, crossfade input → output.
- First run: the camera path crossed a stack around p .43 (i2 camera outside the aisle). Fixed: i2 camera moved into the aisle and pulled back (`web_climb_camera_fix.jpg`, p .43–.50: whole climber, scan-out from the top).
- `blender_intro2_stills.jpg`: Blender stills of the placement (old i2 camera).
- tsc + vite build pass. One 404 in the console is the replay manifest missing in this container (known, unrelated).

## Not checked
- Real-time smoothness on the user's PC (Edge); timings tuned by eye on frozen frames only.
- Story scenes after the archive rebake (only the rungs changed; Story places its own chair figure).
- I-1 globe polar relief (detail item) — not started.
