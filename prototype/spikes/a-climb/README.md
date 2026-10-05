# A climbing scene (D-066)
Internal A-P1 production candidate; overall TUNE.
Run from repository root:
```
npm run spike -- a-climb
```
Uses port4198 strictly. If the existing preview is running, open http://127.0.0.1:4198/ instead of starting another server.
Scroll: fixed archive → ladder/rear → back bay/side → heart + stored mixed ECG.
D toggles internal controls (figure clay/volume/bloom/progress). These controls are not product UI.

## Sources / component review
C1: reused approved Three0.186.1 (MIT), Lenis1.3.17 (MIT), Vite7.3.1 (MIT), Pretendard1.3.9 (OFL).
C2: original product route replacement vs isolated spike; isolated route chosen D066.
C3: measured anatomy + existing archive bake/volume + existing beats/sweep. No per-frame React state, one Lenis, shared playback clock.
GLB source/processed hashes and status: assets/registry.json. Anatomy heart inherits the existing attribution; no external model acquired this stage.
Rim is an artistic Fresnel fill, not a physically validated emitter. Sun-depth includes the pose body. Full receiver/contact lighting quality still TUNE.

## Data
prepare.mjs extracts d0-mixed-0 from stored bank/extension into gitignored public/wave.json.
250Hz, S022, 0dB. R detector uses stored clean. Sweep uses stored input.
Stored winner M08 output is loaded for future processing stage but not rendered or claimed as live computation in this A-P1.
Data generation stays reproducible; public/wave.json is not the source of truth.

## Internal QA
From this spike folder, npm run qa. Uses agent-browser; A_BROWSER_BIN and A_PREVIEW_URL override paths.
17 screenshots, 3 R sample boundaries, stationary-scroll playback, native scroll and reduced-motion checks.
Remaining gates: reference material/prop quality, middle camera framing, receiver shadow, volume aliasing, complete triangle contact, target-PC and long replay.
See docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_scene_review_2026-10-05.md.

