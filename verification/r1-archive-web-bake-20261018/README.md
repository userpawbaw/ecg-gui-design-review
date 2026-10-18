# R1 archive baked-light web output

Isolated B3 web export for reviewing the selected archive lighting with a freely movable camera. The package is not wired into the Story route or its owned assets. Start the existing Vite app from `prototype/v2` and open `/archive-bake-preview/preview.html`; the staged package lives under ignored `prototype/v2/public/archive-bake-preview/` and can be recreated with `python3 scripts/assets/stage-archive-web-preview.py`.

## Recipe and measured output

- Selection: B3 (branch fragments kept, ladder L2, 30°; shelf underside material ×0.35), key scale 0.5; source r6 light ratios from the recorded D-084 recipe. This is an isolated review bake, not a change to Story defaults.
- Blender: bpy 4.5.3, Cycles; shell lightmap 2048², 128 samples. Direct and indirect light baked albedo-free; shell uses UV1 lightmap; books/decor use `COLOR_0` lighting. `lm_scale=4` and sqrt encoding.
- Measured bake times: shell 513.7 s, books 69.0 s, decor 121.0 s (total 703.7 s). PNG shell lightmap 4,001,079 bytes before packaging.
- Package: `gltf-transform optimize` with meshopt, WebP textures capped at 1024 px, no simplify/join/flatten, preserve `COLOR_0`; shell lightmap WebP q92. GLB 64,480,800 bytes before and 10.31 MB after; total package 10.95 MB.
- WebGL Chromium preview at 1280×720 loaded GLB/manifest/lightmap with HTTP 200, applied 1 shell lightmap and vertex lighting groups, reported no browser errors or failed requests, and OrbitControls moved the camera. See [`browser-result.json`](browser-result.json) and [`web-preview.png`](web-preview.png).
- Viewer shader follows the existing archive web-lighting transfer (sqrt decode, albedo multiplication, saturation, exposure and ACES tone mapping); free orbit, wheel zoom, right-drag pan, and reset are available.

## 확인 안 함

- Story route integration, Story-owned files/assets/defaults, and deployed hosting were not changed or tested.
- Physical display/GPU/browser diversity, mobile performance, and download behavior on a production network were not tested. The browser check used headless Chromium with SwiftShader.
- Visual approval of all materials, hidden surfaces, and every camera angle was not performed. Blender GLTF export emitted warnings that some materials had multiple image nodes and the first node is used by the GLTF sampler; the packaged web preview loads, but those materials require a separate art-direction review.
- The web preview tone mapping is the project's web shader path; pixel identity with Blender's AgX still is not claimed.
