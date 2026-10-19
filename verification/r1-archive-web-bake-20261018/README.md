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

## 빠른 방위·고도 탐색 (D-147)

- `light-study.html`은 기존 baked-light 페이지와 분리된 실시간 탐색기다. `preview.html`은 고품질 bake 기준으로 그대로 유지한다.
- 같은 최적화 GLB를 불러와 albedo, normal, roughness PBR 맵을 유지하고, bake 때 적용한 vertex color 조명은 제거한다. 실시간 Hemisphere/Ambient fill과 DirectionalLight 그림자를 사용한다.
- 조절 범위: 방위각 0–359°, 고도각 5–85°. 기본값 225°/35°. 그림자맵 2048×2048, PCFSoftShadowMap, capped device pixel ratio 1.5. 카메라 회전/줌/이동과 조명·시점 초기화가 있다.
- 로컬 Chromium 1280×720 + SwiftShader 로드에서 HTTP 200, 메시 62, normal map이 있는 재질 22, roughness map이 있는 재질 21을 확인했다. 초기 DOM 상태 `PBR 실시간 · 메시 62 · normal map 22 · roughness map 21 · shadow 2048²`까지 도달했다.
- 소프트웨어 렌더러에서 동적 shadow를 포함한 장면 캡처/프레임 속도 검증은 제한 시간 안에 끝나지 않았다. 슬라이더 DOM 입력 반응은 수치로 완료 검증하지 않았다. 실제 GPU에서의 FPS, 모바일 성능, 접촉 그림자 품질은 확인 안 함.
- 이 모드는 PBR 표면 입력을 보존하지만 Cycles의 간접광 bake, 다중 bounce, 최종 bake 톤을 재현하지 않는다. 실시간 shadow map은 GPU/브라우저에 따라 hard/aliased/slow가 될 수 있다. 방향 선택 후 동일 카메라로 Blender 4.5.3 Cycles 최종 bake/still을 확인한다.
- 공개 파일 허용 범위에는 `light-study.html`만 추가했다. Story 소유 파일, 기존 baked 페이지/GLB/defaults, r8 및 D-084 값은 바꾸지 않았다.

### 확인 안 함

- 실제 물리 GPU, 모바일, 다른 브라우저/디스플레이에서의 FPS 및 그림자 외관.
- SwiftShader에서의 캡처와 슬라이더 프레임 응답 수치(동적 shadow 렌더가 검증 시간 제한을 초과함).
- 실시간 모드와 Blender Cycles 최종 결과의 픽셀/조도 일치. 이 둘은 다른 검토 목적이다.

## D-148 빛 커튼 구현 (2026-10-19)

`light-study.html?view=shafts`에서 천창 빛의 공간 경로를 볼 수 있다. 별도 raw2048² 광원depth + view depth, 국소 single scattering/HG/world-space 결, 조작 중/정지 자동품질·freeze·설정 링크를 추가했다. 기존 baked page/GLB/Story defaults는 변경하지 않았다. 실제 근거와 확인 안 함은 [볼륨 검수 README](../r1-archive-volumetric-20261019/README.md), [fidelity](../r1-archive-volumetric-20261019/fidelity.md)로 모았다.

위 D-147 초기 SwiftShader 시간제한/입력 미검증 기록은 당시 관찰이다. 후속 D-148 검증에서 actual staged 입력/이미지·캡처를 확인했다. 이전 공개 run39281362397도 새 API query 조회에서 success로 확인됐다. 이번 변경의 실제 공개 버전·동작은 새 deployment/public 결과로 확정한다.
