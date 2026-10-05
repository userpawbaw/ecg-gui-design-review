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

## AA checkpoint (2026-10-06)
Default now shows A-P2 Earth/orbit/clouds/actual clerestory then A-P1. Use ?stage=room for the previous room-only path. Full scroll content is760vh; room430vh. NASA credit appears during Earth. See ECG_A_arrival_review_2026-10-06.md. npm run qa:arrival captures the new transition. A_MOTION_DIR overrides motion evidence output without overwriting AA comparisons.
Default MSAA4 (supported HDR sample count), volume96 steps, grain35%. SMAA fallback when no MSAA samples are available. Local diagnostics: ?aa=none|msaa|smaa|hybrid, &steps=48|64|96, &grain=0..1, &scale=1..1.5. r186 SMAA runs before OutputPass. Original baseline: ?aa=none&steps=48&grain=1.
GPU timing is opt-in with &timing=1, valid timer query results only. Use npm run qa:aa / npm run qa:aa:motion after opening a working agent-browser a-climb session. Motion recordings contain only the 3D canvas, not ECG/DOM. A_AA_FINAL=1 records final settings; A_QA_DIR overrides runtime screenshot output so old evidence is preserved.
See ECG_A_antialiasing_review_2026-10-06.md / verification/a-aa-20261005/fidelity.md. AA internal KEEP, whole scene still TUNE.


## A-P2 lighting checkpoint (2026-10-06)
Warm solar light/night mask, artistic NASA-derived roughness/polar relief, Earth-occluded solar flare, directional cloud scattering. Approved archive retained. Whole visual TUNE; close-up cloud/ice silhouette/specular and GPU cost remain gaps. See ECG_A_lighting_review_2026-10-06.md.
Diagnostic URLs: flare=0, cloud=0, cloudShadow=0. Cloud-off reveals the hidden cut; it is not a low-spec production mode. aPreview.set accepts the same booleans; aPreview.path(8,true) runs a reverse camera path for QA. npm run qa:lighting captures effect-off/idle/reduced states and reverse video.

## A-P2 depth trial (2026-10-06)
Default is an experimental Bruneton/Takram LUT sky/aerial bridge + REMA Antarctic mesh + world-space half-resolution density cloud. Previous renderer is preserved at `?planet=legacy`. Additional diagnostics: `atmosphere=0`, `specular=0`; cloud-off is diagnostic, not an adopted low-spec route. Technical verification does not establish mockup fidelity; close clouds, micro-ice reflection and warm orbit framing remain GAP. Same approved archive retained.
Sources, MIT/CC BY notices, generated-data encoding and display-only exaggeration/infill: `assets/planet-v2/NOTICE.md`. Source registry and preparation: `scripts/assets/register-planet-v2.mjs`, `scripts/assets/prepare-planet-v2.py`; obtain the hash-pinned LUT/REMA sources first. Snow candidate was not acquired/used. Detailed review: `ECG_A_planet_render_trial_2026-10-06.md`. Final evidence is `verification/a-arrival-20261006/planet-verified`; effect-off and runtime final directories are separate. Capture workflows sharing a-climb must run sequentially.
