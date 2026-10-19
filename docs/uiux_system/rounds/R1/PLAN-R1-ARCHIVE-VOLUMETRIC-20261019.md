# 서고 실시간 빛 커튼 — 조사와 구현 설계

작성: 2026-10-19 · 분류: RESEARCH → IMPLEMENTATION 계획 · 연결: D-147, D-148, [REF-016](../../references/REF-016_SHADOW_MARCHED_SUN_SHAFTS.md).
작성 시점: **설계 완료, 구현·시각·성능 검증 전**이었다. 후속 사용자 “진행해줘” 승인으로 S0–S4를 실행한다. 아래 계획의 초기 제안과 실제 실행 증거는 구분하며, 현재 결과는 `verification/r1-archive-volumetric-20261019/README.md`를 따른다.

## 1. 목표와 이번 조사로 바뀐 판단

사용자 `[대화]`: “구름 사이를 뚫고 나오는 햇빛 느낌으로, 결이 살아있는 햇빛의 경로”, “슬라이더식 실시간 확인”. 기존 방위·고도 조작과 자유 카메라를 유지하면서 천창/해치를 통과한 빛의 부피가 읽혀야 한다. 실제 외부 구름 장면을 새로 만드는 요청으로 해석하지 않는다.

- `[코드]` 이 저장소의 `prototype/v2/src/story/intro/archive.ts:71–157`에 **독립 광원 깊이맵 + 시점 깊이 + 48단계 볼륨 레이마칭 + 3D 농도 noise + HG 산란 + 빛 안의 먼지**가 이미 있다. `introStage.ts`는 시작 때 광원 깊이를 한 번 그린다. 새 엔진을 처음부터 발명할 필요가 없다.
- `[코드]` 기존 방식의 보완점: 고정 광원, 한정된 카메라, 샘플 구간 최대 9 m, 모든 샘플의 방 경계 clip 부재, 전역 override depth material의 cutout 누락 가능성, frame별 jitter의 시간 안정성, 화면 전체 haze, 화면 해상도와 같은 48단계 계산. 코드 존재는 현재 B3 검토 페이지의 동작 증거가 아니다.
- `[정정]` 이전 채팅 및 `RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016.md` §5의 “three-good-godrays는 화면 밖 광원이면 사라짐” 설명은 라이브러리를 혼동했다. 포럼 79085의 문제는 **pmndrs GodRaysEffect**(화면의 광원 mesh를 사용하는 방식)다. **three-good-godrays GodraysPass**는 깊이 복원·그림자맵 레이마칭이고 DirectionalLight/PointLight를 지원한다. 시작 광원이 화면에 보일 필요가 없다는 것은 코드상 판단이며, 우리 장면의 런타임 검증은 아직 안 했다.
- `[코드]` Three 0.186.0 `WebGLShadowMap.js`는 PCFSoftShadowMap을 PCFShadowMap으로 바꾼다. PCF의 depthTexture는 비교 sampler 용도다. “현재 타입 상수가 PCFSoft니까 일반 sampler2D로 읽어도 된다”는 가정은 금지한다.
- `[코드]` B3 bake는 sun 외에 **해치 밖 가까운 SpotLight key**가 중요하다. 현재 D-147 페이지는 방향광 하나 + 고정 fill이므로 최종 B3 조명을 그대로 재현한 것이 아니다. 방향광 빛줄기 탐색과 B3 key 재현을 분리한다.

## 2. 외부 근거와 재사용 판단

| 근거 | 실제 확인한 내용 | 설계에 가져올 것 / 제한 |
|---|---|---|
| [three-good-godrays](https://github.com/ameobea/three-good-godrays/tree/70ad1c41c78796637064b3bb9246be08e81ee777) v0.12.1 | `godrays.frag`: scene depth → world position, 광원 frustum 교차 구간, shadow visibility 적분. `compositor.frag`: 깊이를 고려한 업샘플링. `index.ts`: scale 0.5, 60 steps, blur 기본값 | 저해상도 적분·경계 보존·구간 clip 참고. 코드·외부 데모 에셋은 저장소에 복사하지 않음 |
| [Three.js 공식 데모](https://threejs.org/examples/webgl_postprocessing_godrays.html) | `GodraysPass`와 pmndrs composer 사용, 데모는 point light/60 steps. 단순 인기 추정 대신 공식 예제 채택을 근거로 삼음 | 실제 배포에 쓰이는 경로임을 확인한 자료. 현재 서고의 성능 증거는 아님 |
| [NVIDIA GPU Gems 3, Ch.13](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process) | 화면의 광원 방향으로 sample을 모아 가림을 추정하는 radial 방식과 한계 | 빠른 2D 대안의 원리. 자유 카메라·천창이 화면 밖인 서고의 주력으로 택하지 않음 |
| [Epic Volumetric Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine) | 낮은 전체 농도 + 국소 volume/방향광 scattering을 권장. 저해상도 볼륨과 temporal reprojection, 빠르게 바뀌는 빛의 잔상 설명 | 방 전체를 뿌옇게 만들지 않기. 첫 버전은 시간 누적 없이 안정성 확인; 엔진 사례의 ms를 WebGL 예측치로 옮기지 않음 |
| [Three.js 포럼 cave 사례](https://discourse.threejs.org/t/79085) | 천장 구멍·화면 밖 source mesh라는 유사 문제. 답변은 WebGPU 볼륨 예제로 안내 | mesh 기반 screen-space 효과와 실제 공간 산란의 차이를 확인. 댓글을 구현/성능 보증으로 취급하지 않음 |

조회 메타데이터·HTTP·원문 해시는 [verification](../../../../verification/r1-archive-volumetric-plan-20261019/README.md)에 둔다. 외부 코드 작업 사본은 `/tmp/archive-godrays-research`에만 두었다.

### C1–C3: 채택 후보 비교

| 후보 | C1/C2 | 장점 | 비용·누락 | 계획 판정 |
|---|---|---|---|---|
| 기존 프로젝트의 볼륨 셰이더를 별도 study 모듈로 적응 | 장면 전용 효과 / 내부 코드 재사용 | 이미 noise·HG·먼지, WebGL·vanilla·공식 addons 사용 | 깊이·자유 카메라·캐시·저해상도·linear 합성 보완 필요 | **주력, 잠정** |
| three-good-godrays 그대로 사용 | 범용 볼륨 후처리 / 외부 패키지 사용 후보 | shadow raymarch, clip, bilateral upsample 구현 | v0.12.1 peer Three ≤0.182, 우리 0.186.0. 국소 농도·빛 방향에 정렬한 결·입자 확장은 기본 API에 없음. 내부 renderer.properties/framebuffer 복사 경로의 결합도 큼 | 주력에서 제외, 기존 방식 실패 시 격리 C4 비교 후보 |
| pmndrs GodRaysEffect / radial blur | 화면 효과 / 기법 참고 | 가장 단순한 저비용 후보 | source mesh/화면 의존, 앞뒤 가림·천창 바깥 시점 불안정 | 주력 기각 |
| WebGPU/TSL 볼륨 또는 froxel 엔진 교체 | 다른 renderer / 기법 참고 | 확장성 높은 볼륨 파이프라인 | WebGLRenderer·정적 package 교체와 기기 호환 QA 확대 | 현재 범위 기각; 현재 경로가 실측 성능 기준을 못 채울 때 재검토 |
| 얇은 투명 plane/cone 여러 장 | 가짜 beam geometry / 직접 제작 | 초기 시연은 가벼움 | 평행/교차 시 보드 단면, 물체 관통, 카메라 내부 진입 시 실패 | fallback으로도 몰래 전환하지 않음 |

`postprocessing` 6.39.5는 Three >=0.168 <0.187을 표기한다. 이것이 three-good-godrays의 ≤0.182 제약까지 해결하지는 않는다. 패키지 강제 설치나 전역 Three 하향은 하지 않는다. 외부 라이선스는 원문 `LICENSE`에서 Zlib 조건을 확인했지만 채택/복제는 하지 않았다. C4는 미래 단계이며 이번에 실행한 것처럼 기록하지 않는다.

## 3. 화면에서 표현할 것

1. **구조**: 천창·해치의 실제 개구부와 창틀·보·서가·사다리·잎 가림이 밝은 띠와 어두운 틈을 만든다. 태양광 빛줄기는 서로 평행하다.
2. **결**: 공기 농도에 약한 world-space 3D noise를 쓰되, 빛에 수직인 방향은 짧고 빛 진행 방향은 길게 늘인다. 기본 대비 15%, 허용 탐색 0–30%는 시작 후보 `[추론]`다. shadow 구조를 noise로 대신하지 않는다. 빛 축에 정렬하는 결은 미감 근사다. 방위 변화 때 매질 무늬까지 회전하는 부자연스러움이 생기면 world-fixed 농도 noise로 제한하고 띠 구조는 실제 개구부/가림에 맡긴다.
3. **공기**: 방 전체 회색 haze 대신 room AABB 안의 얇은 국소 매질. 경계는 부드럽게 taper한다. 광원을 돌려 닫힌 벽을 향하면 빛줄기가 사라지는 것이 올바른 결과다.
4. **먼지**: 본체 빛 커튼이 먼저 통과한 뒤 소수 입자를 추가한다. 입자의 밝음도 동일한 light visibility를 사용한다. 조밀한 점·grain으로 빛결을 표현하지 않는다.
5. **색**: 현재 광원의 선형 색을 공유한다. 고정 크림색 overlay, 과한 bloom·film grain은 첫 버전에서 제외한다.

## 4. 데이터·좌표·광원 계약

- 모델/표면 텍스처는 D-147 study GLB를 그대로 읽는다. vertex lighting을 제거한 PBR 경로에만 적용한다. 기존 `preview.html`은 정적 bake 기준으로 둔다.
- Three 월드 좌표는 Y-up, metre. `manifest.sun.to_dir`와 room/shots는 exporter의 `b2t`를 **이미 거친 값**이다. 다시 Z/Y 변환하지 않는다. `sun.to_dir`는 광자 진행 방향, `DirectionalLight.position - target`은 광원 쪽 벡터라 부호가 반대다.
- 슬라이더 방위 0°=+Z, 90°=+X, 고도=+Y. `toSun=(sin(az)cos(el),sin(el),cos(az)cos(el))`, `travelDir=-toSun`. 표면광·광원 depth camera·phase·noise basis가 한 상태 객체를 공유한다.
- 현행 study 기본 225°/35°를 유지한다. r8/D-084/Story 기본값으로 이 숫자를 역전파하지 않는다.
- 무한 태양광에는 거리 제곱 감쇠를 적용하지 않는다. 향후 key SpotLight는 perspective light camera + cone/blend + 거리 감쇠가 필요하다. 이때 source 위치/방향/색/세기/각도 메타데이터를 별도 study recipe로 추출한다. Blender key W와 Three intensity를 숫자 그대로 같다고 하지 않는다.
- 첫 구현의 광원 범위는 **현재 슬라이더의 DirectionalLight**다. B3 key·sun 다중 광원 재현은 별도 후속 단계. key의 빛줄기를 단순히 sun에 붙여 “원본 일치”라고 보고하지 않는다.

## 5. 렌더링 구조와 수식

```text
조명 input → 한 lightingState 갱신 → lightDepthDirty
  ├─ Three 표면 그림자: 조명/가림체 변경 때 갱신
  └─ 별도 raw 광원 depth RT: 같은 조명/가림체 변경 때 갱신

PBR 장면 → 선형 HDR color RT + view depth
camera ray ∩ room volume ∩ [camera, 첫 불투명 표면]
  → 저해상도 raymarch: density + light-depth visibility + phase + transmittance
  → 깊이 기반 공간 필터 → 깊이 기반 upsample + HDR 합성
  → OutputPass: ACES + exposure + sRGB를 한 번 적용
```

- 별도 광원 RT를 택하는 이유: 0.186의 PCF 비교 depth texture와 sampler2D 충돌, 외부 라이브러리의 private framebuffer 복사를 피하고, 기존 Story의 독립 depth 경로를 활용할 수 있다. 표면 shadow와 광원 depth 카메라 방향·범위는 일치시킨다. 두 번의 caster pass 비용을 별도로 잰다.
- 광원 depth는 2048² 시작 후보, 시각 비교 후 1024² 검토. JS property 이름만 보고 raw depth로 간주하지 않는다. 별도 RT의 DepthTexture는 비교 함수를 쓰지 않는 명시적 raw texture다. 기기 지원 검증 후 unsigned/float 형식을 결정한다.
- 깊이 전용 proxy group은 원본 geometry·world transform을 공유하고, map/alphaMap/alphaTest/side를 보존한 depth 재질을 사용한다. 하나의 overrideMaterial로 잎/구멍을 불투명 사각형으로 덮지 않는다. 색 재질 변경·원본 room 재부모화는 피한다.
- 광원 카메라 frustum은 room만이 아니라 **내보낸 외부 잎/가지 등 caster의 범위**까지 검사해 맞춘다. near/far, 투영 범위와 clip debug view를 남긴다. 카메라 밖 caster도 빛을 가려야 한다.
- view depth를 inverse projection/view로 복원한다. sky(depth=1)·near clipping·카메라가 volume 안/밖인 경우를 분기한다. ray-box slab 교차로 시작/종료를 구하고 표면 앞에서 적분을 끝낸다. 기존 고정 9 m 제한을 새 자유 시점에 그대로 옮기지 않는다.
- 광학 모델은 단일 산란 근사: `T *= exp(-sigma_t * ds)`, `L += T * sigma_s * Li * phase * visibility * ds`, `out = T_end * scene + L`. `sigma_s ≤ sigma_t`, 둘의 단위는 1/m. 낮은 농도에서도 `T_end=1`로 고정한 밝은 additive sheet가 되지 않도록 한다.
- HG phase g=0.5 시작 후보(탐색 0.35–0.65). 광원 쪽을 볼 때 전방 산란이 강해지는지 sign 테스트한다. noise 샘플 jitter와 사용자가 보는 빛의 결은 별도 입력이다.
- 투명체 색 누적은 첫 버전 범위 밖. alpha-tested opaque depth까지 지원하고, 완전 투명 표면은 뒤쪽 깊이/정렬 한계를 보고한다.
- 후처리 4개 목표: volume 적분 / 저해상도 bilateral 공간 필터 / 깊이 기반 upsample·composite / OutputPass. 선형 HDR 타깃은 tone mapping을 미리 적용하지 않는다. MSAA color/depth resolve는 S1에서 확인하며 canvas antialias만으로 offscreen AA가 해결된다고 하지 않는다.

## 6. 빛결과 상호작용 설계

| 입력 | 동작 | 캐시·출력 |
|---|---|---|
| 방위·고도 input | 기존 범위 0–359°, 5–85°. 최신 값만 다음 animation frame에 반영 | 여러 input을 1회로 합침, 표면 shadow와 raw depth 모두 dirty |
| 카메라 drag/orbit/zoom | view depth·볼륨 재계산 | 정적 caster의 광원 depth는 재사용 |
| 빛줄기 on/off | 체적 산란만 켜고 끔 | off일 때 새 적분·필터를 건너뜀; 기존 PBR 화면 대조 가능 |
| 빛줄기 강도 | 노출과 독립된 scattering gain 0–2 시작 후보 | 광원 depth 캐시 유지, 표면 광량은 바꾸지 않음 |
| 결(고급) | 농도 대비 0–30%, freeze 가능 | 월드 좌표에 고정, 화면을 따라 움직이는 무늬 금지 |
| 품질 | 자동 / 높음 / 빠름 | 실제 적용 scale·steps는 검수 정보로 표시 |
| reset / 공유 상태 | 시점·각도·효과 설정 재현 | 버전 있는 URL hash/JSON export; 기존 Story/defaults 파일 쓰기 없음 |

광학 농도 초기 후보 `sigma_t=0.012/m, sigma_s=0.008/m`는 5 m 경로의 `T≈0.942` 수준이며 **미감 승인/실측값이 아니다**. 횡결 0.2–0.6 m, 길이결 2–4 m를 초기 bench 범위로 둔다. 과한 소용돌이·퍼린 얼룩이 보이면 농도 noise를 0으로 내려 기하 기반 빛줄기를 먼저 검수한다.

pointer/key input으로 움직이는 동안 저품질, 마지막 input 후 200 ms 또는 OrbitControls damping 종료 뒤 고품질로 전환한다. 200 ms는 제안값이다. release 이벤트만 기다려 키보드 입력을 놓치지 않는다. RT 크기는 매 input마다 재할당하지 않고 두 크기를 재사용한다. 첫 버전은 temporal accumulation을 쓰지 않는다. jitter는 공간적으로 결정적이며 freeze seed를 기록한다. 이후 누적을 넣을 경우 조명·카메라·크기·농도 변경마다 history를 무효화한다.

`prefers-reduced-motion` 또는 정지 버튼은 noise 흐름·입자 시간만 멈춘다. 사용자가 직접 조절하는 각도는 작동한다. WebGL 실패 시 bake 링크와 오류를 제공한다. 효과를 자동으로 꺼서 성공인 것처럼 보이게 하지 않는다.

## 7. 성능 계획 — 목표와 측정 구분

1280×720, DPR 1 기준 산술. 아래는 실제 GPU 시간/FPS가 아니다.

| 모드 | 축별 해상도 비율 | ray steps | 최대 shadow lookup 근사/프레임 |
|---|---:|---:|---:|
| 기존 Story 구조를 full-res로 가정 | 1.0 | 48 | 44,236,800 |
| 조작 중 제안 | 0.25 | 16 | 921,600 |
| 정지 기본 제안 | 0.5 | 48 | 11,059,200 |
| 높은 품질 후보 | 0.75 | 64 | 33,177,600 |

비율은 **가로·세로 각각**이다. low-res filter/upsample, noise 계산, draw call, 그림자 렌더는 합계에 포함되지 않는다. 최대 lookup 감소를 FPS 향상 배수라고 말하지 않는다.

- 우선 성능 목표 `[추론]`: 사용자 GPU/Edge 1280×720에서 조작 중 p95 frame ≤33.3 ms(30 fps), 입력→다음 변경 프레임 ≤100 ms. 프로젝트의 기존 60 fps는 계속 목표이며 30 fps 통과를 최종 전시 품질로 바꾸지 않는다.
- 2 s warm-up 뒤 정적/카메라/광원 drag 각 10 s, p50/p95/max frame 시간·실제 표시 FPS를 기록한다. 조명 depth 재생성 수, draw call, texture 수·RT 크기, 최초 shader compile 시간도 잰다.
- 가능하면 GPU timer query를 별도 측정하되 지원 안 되거나 disjoint면 GPU ms를 쓰지 않는다. CPU update 시간·RAF 간격·GPU 시간을 섞지 않는다.
- SwiftShader는 기능/캡처 smoke에만 쓴다. 이전 D-147의 캡처 제한시간 초과를 GPU 성능 수치로 해석하지 않는다.
- 정적인 시점+freeze에서는 요청 렌더로 쉰다. 페이지 숨김 때 루프 중단. resize/dispose에서 모든 RT·depth proxy·재질·리스너 해제; 5회 재생성/폐기 후 자원 수 누적 여부를 확인한다.

## 8. 단계·파일·완료 조건

| 단계 | 작업·제안 파일 | 완료 조건 / 다음 단계 관문 |
|---|---|---|
| S0 광학 구조 bench | 별도 `verification/r1-archive-volumetric-<실행일>/`; 독립 천창·막힌 판·alpha cutout bench + 실제 B3 GLB caster/aperture 조사 | source가 화면 밖이어도 beam 유지; 닫힌 천창에선 없음; 실제 GLB의 구멍/외부 잎/앞면 개방이 의도와 일치. GLB join 뒤 누락된 blocker가 있으면 기록하고 메쉬 변경 전 재판단 |
| S1 파이프라인 | `verification/r1-archive-web-bake-20261018/study/volumetric-light.js`, `study/lighting-state.js`와 `light-study.html` 연결 | linear HDR/depth/마지막 출력 1회, off 상태 화면 비교, MSAA/depth resolve 검증, 양측 caster depth 동기. Story import/변경 없음 |
| S2 공간 빛줄기 | `study/volume-shaders.js`, 독립 raw depth pass, room clip, 균일 농도/HG | 최소 6방향+3카메라에서 공간 고정·가림·부호 검증. noise=0에서 먼저 통과 |
| S3 결·슬라이더·성능 | world-space 이방성 noise, depth-aware filter/upsample, 자동 품질, freeze/공유 상태 | 키보드/포인터/터치 범위와 초기화, 입력→실제 프레임 변화, 품질 전환 pop/노이즈 기록. 강도와 농도를 별도 조절 |
| S4 검수·공개 | 새 verification README/결과 JSON/우리 캡처; stage script allowlist와 addon transitive deps 검증 | 아래 시각/성능 게이트 통과 후 기존 Pages 경로로 배포. run ID·실제 source SHA·공개 브라우저 검증까지 남김 |
| S5 최종 품질 비교 | 선택 방향과 카메라를 Cycles 4.5.3로 렌더; 필요 시 key SpotLight 지원 설계 추가 | 동일 source 종류·위치·카메라·매질 조건 비교. 간접광·톤·다중 산란의 차이를 GAP으로 남김. 실시간 화면을 baked/Cycles 동등품질로 선언하지 않음 |

제안 파일명은 구현 때 확정한다. `archive.ts`, `introStage.ts`, Story 소품·원본 bake/GLB·r8/D-084 기본값은 수정 범위 밖이다. 프로젝트 내부 코드는 출처 주석을 남겨 별도 모듈로 적응하고 shared refactor는 Story 소유자와 범위를 정할 때만 한다. 새 `.js` runtime과 공식 addon은 정적 artifact의 명시적 allowlist로만 추가하며 외부 데모 코드·모델·이미지를 포함하지 않는다.

## 9. 검수 시나리오와 판정

- **실제 beam**: slider DOM 수치와 광원 좌표만 확인하지 않는다. 동일 camera의 before/after 이미지 및 beam 방향·가림 ROI 변화까지 검사한다. 닫힌 천창 bench의 blocker 뒤 구역 밝기 증가 ≤2/255를 잠정 기준으로 둔다(blur 경계는 별도 표본).
- **가림**: 사다리 앞/뒤, 깊이 경계, alpha-cutout 잎, camera 밖 caster, source 밖 화면, room 안/밖 카메라를 포함한다. glTF의 alphaMode별 실제 재질 목록을 검증 결과에 적는다.
- **시간 안정성**: camera/빛/seed 고정 12프레임, 방향 sweep 12프레임, orbit 12프레임. frame마다 angle, camera, depth 갱신 수, scale/steps를 함께 저장한다. reference 비교 이미지는 저장소 밖, 우리 캡처만 저장한다.
- **색·재질**: effect off와 기존 study가 같은 camera/노출일 때 표면 내부 ROI 평균 차이 ≤1/255 제안. geometry edge AA 차이는 별도 측정. tone map 중복, 검정 들뜸, 무늬가 화면에 고정됨, 색 얼룩을 실패 조건으로 둔다. beam on/off L* p5/p50/p95와 clipping 비율 보고; 밝게 만들었다는 이유만으로 통과시키지 않는다.
- **입력·복원**: 방위 wrap 359→0, 고도 5/85, reset, URL 재현, resize, 5회 dispose/recreate, 빛 off, freeze, reduced-motion. 각도 중 빛이 실제 개구부를 통과하지 않으면 “현재 방향은 개구부를 통과하지 않음”을 결과로 인정한다.
- **fidelity G1–G6**: 필수 채널 대응표 → bench 통과 → ≥6(권장12)프레임 비교 → 밝기/색 → 상태 전수 캡처. TUNE은 최대3회 후 남은 GAP을 제시한다. README에 측정값과 “확인 안 함”을 같이 쓴다.

## 10. 위험·다시 결정할 조건

1. 별도 광원 depth와 표면 shadow가 불일치하면 해상도를 올리기 전에 좌표·near/far·alphaTest·side·bias·caster 범위를 검사한다. raw sampler 문제를 private renderer 필드 접근으로 즉시 우회하지 않는다.
2. 현재 GLB에서 cutaway/개구부/가림 geometry가 의도한 광학 조건과 다르면 효과 세기로 숨기지 않는다. 별도 preview-only blocker가 필요해도 optical 모델 변경 기록이 먼저다; Story 소품을 고치지 않는다.
3. 저해상도에서 사다리/잎의 틈이 번지면 sample 증가만이 아니라 depth-aware upsample와 광원 texel/world 크기를 재검토한다.
4. 기존 적응 경로가 3회 TUNE 뒤 시각/성능 기준을 못 채우면 별도 sandbox에서 three-good-godrays + Three0.186의 C4 비교를 연다. peer 범위를 강제로 무시한 채 주력에 넣지 않는다.
5. 방향광 효과가 통과해도 B3 key의 원근 beam·falloff가 목표라면 SpotLight 단계가 필요하다. 방향광 한 개의 성공으로 종료하지 않는다.
6. 실제 GPU/Edge를 측정하지 않았다면 30/60 fps 달성 또는 “고품질 실시간 완료”라고 쓰지 않는다. 이번 설계 단계에서는 모든 시각·성능 기준이 **목표**다.

## 11. 후속 실행 기록 (2026-10-19, 사용자 진행 승인)

S0 optical bench와 GLB 조사, S1 HDR/raw depth, S2 single scattering/room clip, S3 결/슬라이더/자동품질·freeze/링크를 독립 study에 구현했다. S4 staged Chromium smoke/입력·프레임·모바일 viewport/reduced-motion·cache/resource 검사를 수행했다. 실제 GPU/Edge FPS·터치 및 S5 Cycles/near key는 확인 안 함이다. 공개 배포는 새 source SHA·run/public browser 증거로 검증한다.

계획의 OutputPass/3개 preset/광학 초기계수는 유지했다. shader source 외부 복사나 추가 패키지 설치 없이 프로젝트 내부 알고리즘과 공식 Three addon을 썼다. 기본225°/35°를 유지하고 `?view=shafts` 또는 ‘빛결 옆에서 보기’로 기준 방향·옆 시점을 선택한다.
