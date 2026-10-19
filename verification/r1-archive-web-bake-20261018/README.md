# R1 archive baked-light web output

Isolated B3 web export for reviewing the selected archive lighting with a freely movable camera. The package is not wired into the Story route or its owned assets. Start the existing Vite app from `prototype/v2` and open `/archive-bake-preview/preview.html`; the staged package lives under ignored `prototype/v2/public/archive-bake-preview/` and can be recreated with `python3 scripts/assets/stage-archive-web-preview.py`. The Pages staging mode can also create a self-contained public artifact with `python3 scripts/assets/stage-archive-web-preview.py --destination <empty-directory>`; it includes only the preview, GLB, manifest, lightmap, pinned Three.js modules and MIT license notice.

## Recipe and measured output

- Selection: B3 (branch fragments kept, ladder L2, 30°; shelf underside material ×0.35), key scale 0.5; source r6 light ratios from the recorded D-084 recipe. This is an isolated review bake, not a change to Story defaults.
- Blender: bpy 4.5.3, Cycles; shell lightmap 2048², 128 samples. Direct and indirect light baked albedo-free; shell uses UV1 lightmap; books/decor use `COLOR_0` lighting. `lm_scale=4` and sqrt encoding.
- Measured bake times: shell 513.7 s, books 69.0 s, decor 121.0 s (total 703.7 s). PNG shell lightmap 4,001,079 bytes before packaging.
- Package: `gltf-transform optimize` with meshopt, WebP textures capped at 1024 px, no simplify/join/flatten, preserve `COLOR_0`; shell lightmap WebP q92. GLB 64,480,800 bytes before and 10.31 MB after; total package 10.95 MB.
- WebGL Chromium preview at 1280×720 loaded GLB/manifest/lightmap with HTTP 200, applied 1 shell lightmap and vertex lighting groups, reported no browser errors or failed requests, and OrbitControls moved/reset the camera. Local Vite and a standalone static-server copy of the Pages artifact both pass; see [`browser-result.json`](browser-result.json), [`staged-browser-result.json`](staged-browser-result.json), and [`web-preview.png`](web-preview.png).
- Viewer shader follows the existing archive web-lighting transfer (sqrt decode, albedo multiplication, saturation, exposure and ACES tone mapping); free orbit, wheel zoom, right-drag pan, and reset are available.

## Visual quality finding from public preview

- User observed mottled/patchy grain in the public Pages view. Comparing the submitted screenshot with the local bake evidence confirms the pattern is present in the rendered materials, even though runtime loading, lightmap application, and camera controls pass.
- Controlled GLB A/B found the main cause: neutralizing diffuse albedo while preserving the same baked light removes most of the mottling; disabling the shell lightmap while preserving albedo keeps the material pattern. See [`diagnostic comparison`](../r1-archive-mottle-reference-20261019/README.md).
- The shell lightmap is 2048², baked at 128 Cycles samples, then compressed to lossy WebP q92; ash/wall albedo retains 15% texture and the parquet floor retains 40%. Their separate contributions beyond the tested diffuse-vs-light comparison remain unmeasured.
- Browser success establishes asset decoding and shader application, not a clean material appearance. The likely review fix is a cleaner authored material/low-contrast grain; do not change public or Story materials until the user selects the look and that decision is recorded.
- Do not alter Story-owned production values/assets as part of this archive preview diagnosis.

## 확인 안 함

- Story route integration and Story-owned files/assets/defaults were not changed.
- The web preview tone mapping is the project's web shader path; pixel identity with Blender's AgX still is not claimed.
- Blender GLTF export warned some materials had multiple image nodes and uses the first node as its sampler; full art-direction approval remains unverified.

## Public preview deployment check (2026-10-18)

- URL: https://userpawbaw.github.io/ecg-gui-design-review/preview.html
- GitHub Pages workflow run: [39123185772](https://github.com/userpawbaw/ecg-gui-design-review/actions/runs/39123185772), success; Pages source is GitHub Actions.
- Public HTML, GLB (10,305,880 bytes), manifest, shell lightmap and pinned Three.js browser modules returned HTTP 200.
- Chromium 154 headless + SwiftShader, 1280×720: status `베이크 조명 적용 · 1 lightmaps · meshopt GLB`; groups shell/books/decor; applied lightmaps shell; browser errors 0; failed requests 0; OrbitControls drag moved camera; reset position error 0. Full captured measurements: [`public-browser-result.json`](public-browser-result.json).
- During setup, the first public browser run exposed a stale Pages deployment and then a managed proxy certificate issue. After the deployment completed, the current public HTML/runtime were checked directly with Chromium; the passing result above reflects the updated public artifact.

## 확인 안 함

- Story route integration and Story-owned files/assets/defaults were not changed.
- Physical display/GPU/browser diversity, mobile performance, download behavior on a production network, and visual approval of every material/camera angle remain unverified. Headless Chromium with SwiftShader is not a substitute for those checks.
