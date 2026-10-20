# REF-016 — 그림자맵 레이마칭으로 만든 실시간 빛줄기

## 1. 레퍼런스 개요

- 대상: [three-good-godrays](https://github.com/ameobea/three-good-godrays), [Three.js 공식 Godrays 데모](https://threejs.org/examples/webgl_postprocessing_godrays.html).
- 제작: Casey Primozic(ameobea), 원형 n8python/goodGodRays. 분석: 2026-10-19, source SHA `70ad1c41c78796637064b3bb9246be08e81ee777`(v0.12.1).
- 사용자 지목은 특정 사이트가 아니라 효과: “구름 사이를 뚫고 나오는 햇빛 느낌으로, 결이 살아있는 햇빛의 경로”, 자유 시점·방위/고도 슬라이더. 이 자료는 구현 방법의 기술 레퍼런스로 선정했다.
- 연결: D-148, `rounds/R1/PLAN-R1-ARCHIVE-VOLUMETRIC-20261019.md`. 분류 RESEARCH / 기존 서고 방향의 구현 계획.

## 2. 입력 증거

| 증거 | 확보 | 한계 |
|---|---|---|
| 소스 | upstream README·shader·pass·LICENSE·package.json을 `/tmp`에서 읽음. HTTP 메타데이터/해시는 `verification/r1-archive-volumetric-plan-20261019/source-probe.json` | 소스·에셋 원문은 저장소에 넣지 않음 |
| 공식 예제 | HTML HTTP200, GodraysPass/pointLight/60 steps 설정 확인 | 실제 GPU 렌더·시각 관찰·스크롤 녹화 확인 안 함 |
| 유사 문제 | Three.js 포럼 79085 JSON HTTP200, source mesh가 화면 밖이면 사라지는 GodRaysEffect 질문과 WebGPU 대안 답변 확인 | 다른 라이브러리/시점의 사례. GodraysPass의 제약으로 옮기지 않음 |
| 프로젝트 대조 | 현행 `archive.ts`, `introStage.ts`, study HTML, Three0.186 shadow 코드를 읽음 | 새 볼륨 효과의 동작·품질 검증은 아직 없음 |

## 3. 기술 스택과 전역 설정

- upstream: Three.js + pmndrs postprocessing, WebGL, `GodraysPass` 내부 illumination/filter/compositor pass. 방향광/점광을 지원한다 `[코드]`.
- v0.12.1 peer Three >=0.125 ≤0.182, postprocessing ^6.33.4. 프로젝트 Three0.186과 지원 범위가 다르다. postprocessing 6.39.5 자체 peer는 >=0.168 <0.187이다 `[출처]`.
- 공식 데모: OrbitControls + animation loop + composer, scene shadow map. 데모 광원은 PointLight이며 서고 Sun을 직접 검증한 예는 아니다 `[코드]`.
- Three0.186 PCFSoft는 PCF로 대체되고 비교 depth sampler가 생길 수 있다. 라이브러리는 raw-depth 복사를 위한 내부 framebuffer 경로를 갖는다. 현재 프로젝트에서는 별도 light-depth RT 경로를 계획한다.

## 4. 디자인 토큰

효과의 기술 원리가 대상이다. 공식 데모 본문의 서체·버튼 치수는 측정하지 않았고 서고로 번안하지 않는다. source params는 color white, density 1/128, maxDensity0.5; 데모의 point-light 색은 서고 채택값이 아니다. 서고는 광원 선형 색과 기존 UI를 따른다. 공간 haze/빛결 세부 후보는 설계 계획 §3/§6에 명시했다.

## 5. 장면·전환 지도

| 구간 | 지도 | 입력 모델 | 기록 범위 |
|---|---|---|---|
| 데모 장면 | 모델·가림체·발광 점광원·공기 빛줄기 | 로드 + 포인터(OrbitControls) + 시간(animation loop) | EFX-016-01; 전체 사이트 녹화 없음 |
| finite-disc 비교 | 독립window/receiver와거리bench | 포인터/키보드 슬라이더 | EFX-016-02 |
| 기타 장면/전환 | 미확인 — 실제 페이지 녹화 안 함 | 미확인 | 사이트 전체 연출 복제는 이번 대상 아님 |

## 6. 효과 카드

### EFX-016-01 — 화면 밖 광원도 그림자맵으로 계산하는 공간 빛줄기

**선정 이유**: 사용자 지목 효과의 구현 후보. 천창이 화면 밖이어도 자유 카메라에서 빛의 경로를 보이려는 목적.

**지각**: 가림체 사이의 밝은 공기와 그늘진 공기가 분리되어 광원의 경로가 보이는 것이 의도다. upstream 스크린샷의 설명/코드를 읽은 것이며 이번 조사에서 직접 화면 움직임을 관찰했다고 주장하지 않는다.

**입력 모델**: 로드 + 포인터(camera orbit) + 시간(render loop). 서고 번안은 포인터/키보드 슬라이더로 DirectionalLight를 바꾸고 별도의 정지/freeze 상태를 제공한다.

**판별 근거**: upstream `updateLightParams`가 매 render에 광원 matrix를 갱신하고 `godrays.frag`가 sceneDepth로 world position을 복원한다 `[코드]`. 특정 광원 mesh를 화면에 합성하는 radial 모델이 아니다.

**구현 메커니즘**: WebGL scene color/depth → camera ray를 light volume과 교차 → shadow map을 샘플하며 산란량 누적 → low-resolution illumination RT → bilateral filter → full-res depth를 이용한 joint bilateral upsample/composite. 원본 코드 복사 없이 이 메커니즘을 내부 archive 셰이더의 보완 설계에 적용한다.

**파라미터**:

| 이름 | 값·단위 | 근거 |
|---|---|---|
| 기본 resolutionScale | 0.5(각 축) | upstream index.ts `[코드]` |
| 기본 raymarchSteps | 60 | upstream index.ts `[코드]` |
| 기본 density / maxDensity | 1/128 / 0.5(패키지 고유 스케일) | upstream index.ts `[코드]`; 물리 단위로 단정하지 않음 |
| upsample | low 2×2=4 taps / high 4×4=16 taps | upstream index.ts/compositor.frag `[코드]` |
| 프로젝트 기존 적분 | 48 steps, max9 m, density0.05, g0.55, 광원depth2048² | archive.ts `[코드]`; 현행 study 성능이 아님 |

**타임라인**: 데모 animation loop에 매 프레임 계산. 서고는 input frame coalescing, 조작 종료 뒤 200 ms 품질 전환을 제안하며 이는 아직 실측되지 않은 설계값이다.

**에셋**: upstream 데모 GLB와 스크린샷은 조달/복사하지 않았다. 서고는 기존 검수 GLB·절차적 density noise 사용 계획, 새 외부 텍스처 없음. code/license는 URL과 해시만 보관했다.

**성능 기법**: upstream 저해상도 illumination, bilateral blur/upsample, 광원 frustum 구간 clip. 실제 GPU frame ms는 확인 안 함. 서고는 광원 depth dirty-cache, 정적 frame 절전, 조작 중 낮은 sample/해상도를 더한다.

**접근성·폴백**: upstream reduced-motion·실제 터치 체감은 확인 안 함. 우리 설계는 키보드 range, freeze, reduced-motion 시 매질 흐름/먼지 정지, WebGL 실패 시 bake 페이지 경로.

**근거**: README/source SHA와 `source-probe.json` `[코드]` `[출처]`. 포럼의 offscreen 문제는 GodRaysEffect 사례임을 구별한다. source audit는 시각/성능 PASS가 아니다.

**재현 요구사항**: 난이도 중–상. 기존 프로젝트 볼륨 코드를 별도 study 모듈로 적응하고 view-depth/광원-depth/linear HDR 합성·clip·노이즈·업샘플링을 구현해야 한다. 외부 패키지를 무검증 채택하거나 Three 전역 하향하지 않는다.

**수용 기준**: 닫힌 개구부 bench에 beam 없음, 광원 화면 밖에서도 beam 유지, 전경 깊이 경계 관통 없음, camera/광원 freeze12프레임 안정성. 실제 입력→image 변화 검증, 6방향·3시점·alpha cutout과 source outside 검수. 수치·목표는 계획 §7/§9, 실측은 미래 verification에 기록한다.

**ECG 번안**: HIGH 장면 서고의 공기 경로만 담당한다. ECG 파형·Story 신호·사람·소품·기존 bake/defaults와 분리된 D-147 study 페이지가 대상이다.

**재현 상태**: 조사 시 `none` → 후속 사용자 진행 승인 뒤 `spike` — 독립 `verification/r1-archive-web-bake-20261018/light-study.html`에 구현. `verification/r1-archive-volumetric-20261019/README.md`의 optical bench·staged 기능·연속 프레임을 검증했다. 실제 GPU/사용자 미감·외부 demo 동일 카메라 비교·Cycles 일치는 확인 안 함이다.

## 7. 에셋 목록과 조달 경로

외부 데모 모델/텍스처/사진은 사용하지 않는다. 기존 package GLB와 공식 Three runtime이 입력이다. density 결은 procedural world-space noise로 계획했다. 따라서 이번 asset registry 신규 항목은 없다. 패키지 채택 시에는 별도 라이선스 고정·SBOM/lockfile·최소 runtime artifact 검증이 필요하다.

## 8. 성능·접근성·폴백

- HTTP probe는 외부 요청 11개 모두200, 원문 hash 기록. 페이지/패키지 전체 전송량·GPU cost를 합산한 것이 아니다.
- upstream resolutionScale0.5는 픽셀 수가 1/4인 계산 크기다. 실제 FPS는 미측정이다.
- 서고의 모드별 sample 산술, 30/60 fps 목표 구분, 입력 지연, 절전·dispose·fallback은 구현 계획 §7–§9에 있다.
- external demo 촬영·실제 GPU·mobile·reduced-motion 대응은 확인 안 함.

## 9. 레시피 후보

후보: 별도 raw 광원 depth + view depth로 제한한 단일 산란 + world-space density + 저해상도/depth-aware 합성. 내부 archive 구현과 외부 사례 양쪽에서 메커니즘을 확인했지만 새 재사용 카드 승격은 실제 서고 검증 뒤에 한다.

## 10. 열린 질문

- 현행 B3 GLB의 개구부/외부 caster가 실제로 모두 보존됐는가? source builder만으로 확정하지 않고 bench와 GPU depth debug로 확인한다.
- 0.186에서 외부 패키지가 실제 호환되는가? peer 범위를 근거로 보류했으며 동작 불가라고 단정하지 않는다.
- 낮은 샘플에서 고운 결과 사다리 경계가 동시에 유지되는가? ≥6방향·12frame 비교가 필요하다.
- 사용자 Edge GPU에서 목표 frame/응답을 충족하는가? SwiftShader 기록으로 대체할 수 없다.
- B3 key SpotLight 단계가 필요한가? 방향광 첫 구현과 최종 B3 일치를 구별해 후속 판단한다.

## 2026-10-20 — D-150: finite-disc 반그림자 보완

사용자 “반그림자가 거의 보이지”라는 피드백으로 depth binary/PCF와 유한 태양을 분리했다. [NVIDIA PCSS integration paper (2008)](https://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf)는 blocker search → 거리 기반 penumbra 추정 → 필터 원리를 설명한다. [Three LightShadow](https://threejs.org/docs/pages/LightShadow.html)와 현행0.186 lights/shadow shader도 대조했다. 외부 shader/code/assets는 저장소에 복사하지 않았다. 기존 서고 리뷰 §2의 w≈거리×각지름과 연결한다.

### EFX-016-02 — 독립 directional PCSS 비교
직사 광원의 각지름0°는 기존PCF 경로, 새window preset0.53°는 surface16blocker+32filter disk. ortho depth는 near/far에 대해 선형이므로 normalized blocker 차×depthRange를 실제 거리로 복원한다. filter 반경=거리×tan(각지름/2), projection span으로 UV 변환한다. 추가 surface depth offset15mm는 raw depth 자체그림자 오차 완화값이며 물리 광원크기가 아니다. volume은 중앙blocker+4방향 샘플의 거리 기반 근사로 표면 PCSS와 같은 정밀도는 아니다. 완전한 다중광선 경로 추적/모든 얇은 caster 보존을 주장하지 않는다.

거리0.15m/3m의 동일blocker 시험대와0°/0.53°/1.5° 프로파일, 여섯방위 capture·창/물체 A/B·claykit 검수는 `verification/r1-archive-window-penumbra-20261020/`에 기록한다. 실제GPU/FPS/Cycles는 확인 안 함.

**선정 이유**: `[대화]` D-150 반그림자 부족 피드백.

**지각**: 가까운 접촉은 선명하고 멀리 떨어진 창틀/잎은 부드러운 경계를 보인다.

**입력 모델**: 포인터/키보드 각지름·방위/고도, 창/소품 전환, 자유camera.

**판별 근거**: `[코드]` 기존0° PCF의고정폭과1회depth; `[출처]` PCSS paper의blocker/filter분리.

**구현 메커니즘**: 위단락의 선형ortho depth차/유한disc. 외부shader는복사안함.

**파라미터**: 각지름0~2°, preset0.53°, surface16+32tap, volume4tap, rawdepth2048², surfacebias15mm.

**타임라인**: 정적/frozen 기본, 입력시에재렌더. 각지름변경은depth재생성없이filter만갱신.

**에셋**: 자체창틀/원형철물/brace/가지·잎 geometry,단색PBR. 기존GLB는보존.

**성능 기법**: 기존depthcache/자동resolution유지,0°는기존경로. 실제GPU측정안함.

**접근성·폴백**: range키보드,reset/link복원,0°off,기존baked링크. reduced-motion동작은기존freeze유지.

**근거**: `[런타임]` 신규qa-result.json/bench프로파일,기존0°regression,source-probe.json.

**재현 요구사항**: 현행Three0.186/WebGL2/floatRT와rawdepth. Three shaderchunk변경은contract검사에서차단.

**수용 기준**: window/roof독립ray,동일가림의거리/각크기증가시전이폭증가,shader오류0,원본보존.

**ECG 번안**: 독립서고study의광학비교. ECG파형·Story기본값에는적용안함.

**재현 상태**: verified — 구현/거리bench·6방위·clay검수PASS,사용자미감/실제GPU/Cycles확인안함. 세부GAP는D-150검수fidelity.
