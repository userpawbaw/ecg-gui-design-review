# 레퍼런스 연출 재현을 위한 제작 파이프라인 점검 (에셋 · 3D · 기술 스택)

작성: 2026-09-25 (KST) · branch `claude/optimistic-goldberg-jnzpni`
분류: RESEARCH + IMPLEMENTATION 사전 점검. **새 creative 방향 제안이나 제품 UI 변경이 아니다.**
연결: F-010(이번 발견), F-009 / D-015 / D-016 / CASE-005(선행), `REDESIGN_BASELINE_ANALYSIS_2026-09-25.md`
증거: 사용자 제공 캡처 `[캡처]`, Awwwards 사이트 태그(웹 검색 결과 요약으로 확인, 원 페이지 직접 열람 불가) `[문헌]`, 이 세션 spike 빌드·headless 실행 `[런타임]` `[테스트]`, 추론 `[추론]`

---

## 1. 사용자가 짚은 문제

> "이 시스템에서 이전 결과물들이 우수 레퍼런스 사이트의 연출 효과 등을 제대로 구현하지 못했어 … 스크롤에서의 버튼 및 문구 전환 효과, wow 포인트인 스크롤시 지구 회전 효과를 적용한다고 했을 때 wow 포인트를 제대로 살리지 못하는 감이 있더라고." `[대화]`

지금 시스템(00~20번)은 **무엇을 만들지**(reference mining → Alpha/Beta → validator) 쪽은 두껍다. 반면 **그 연출을 어떤 재료와 기술로 만들지**를 정하는 계층이 없다. 이 문서는 그 빈칸을 점검한다.

## 2. 이전 결과물이 wow를 못 살린 원인 진단

| # | 빈칸 | 근거 | 결과 |
|---|---|---|---|
| G1 | **렌더링 상한이 Canvas 2D로 고정됨** | D-016 "Canvas 2D+HTML/CSS를 사용하고 profiling 후에만 WebGL을 재검토" `[커밋]`. `prototype/v2`에는 three.js·WebGL 코드가 없음 | 조명, 대기 산란, 3D 회전, 깊이, bloom처럼 레퍼런스 wow의 본체를 처음부터 쓸 수 없었다. 2D glow·입자로 흉내만 냄 |
| G2 | **에셋 계층이 없음** | 텍스처·HDR·3D 모델·영상·글꼴을 받아 오거나 만들 경로와 저장 규칙이 없음. recovered Beta B의 산은 "hard-edged placeholder landscape"로 기록됨 `[커밋]` | 코드로 그린 대체물만 쓰게 되어 "싸 보이는" 인상이 남음 |
| G3 | **스크롤·시간 연출 엔진이 없음** | 전환은 컴포넌트마다 RAF·CSS로 따로 구현됨. 공통 master timeline, scrub, pin, 관성 스크롤이 없음 | 레퍼런스의 "손에 붙는" 느낌(scrub 지연, easing, 여러 layer의 동기)이 재현되지 않음 |
| G4 | **레퍼런스를 정지 화면으로만 분석함** | Beta 입력은 still 이미지이고, 레퍼런스 사이트를 스크롤 위치별로 캡처하거나 시간축으로 분해한 기록이 없음. 이 환경은 moto-card.com, awwwards.com 접속이 egress 정책으로 차단됨 `[런타임]` | "스크롤 0→100%에서 무엇이 얼마나 움직이는가"라는 핵심 사양이 비어 있었음 |
| G5 | **전시 입력 방식으로 번안하는 규칙이 없음** | Attract는 관람객 입력이 없는 idle 상태. 레퍼런스 효과는 스크롤 입력으로 구동됨 | 스크롤 효과를 그대로 옮기면 Attract에서는 동작하지 않음. 시간 구동으로 번안해야 함 |
| G6 | **연출 품질을 판정할 기준이 없음** | 기존 QA는 data equality, RAF, console 중심 `[커밋]` | "wow가 살았는가"를 레퍼런스 동작과 나란히 비교하지 않았음 |

정리: 이전 결과의 한계는 아이디어나 prompt의 문제가 아니었다. **재료(에셋), 엔진(WebGL + timeline), 사양(시간축 분해)** 세 가지가 없었던 것이 주 원인이다. `[추론]`

## 3. 레퍼런스 분해: moto-card.com 히어로

직접 열람은 차단되었다. 대신 사용자 캡처와 Awwwards 태그(Scrolling, Single page, 3D, GSAP, Three.js, Webflow `[문헌]`)로 구조를 추정한다. 실제 코드는 확인하지 못했으므로 `[추론]`이다.

| Layer | 보이는 것 | 구현 추정 | 필요 재료 |
|---|---|---|---|
| DOM 타이포 | 대문자 grotesk 2줄 헤드라인, 2줄 리드, pill 버튼 | Webflow DOM + GSAP이 줄/글자 단위로 transform, opacity, clip을 바꿈 | 웹폰트(woff2) |
| 3D 지구 | 화면 하단에 떠오르는 구, 얇고 밝은 대기 rim, 낮/밤 경계와 도시 불빛 | three.js 구 + 낮 텍스처 + 밤 불빛 텍스처 + fresnel 대기 셰이더(+bloom 가능성) | 등장방형(2:1) 지구 텍스처: 낮, 밤, specular, (normal) |
| 스크롤 연동 | 스크롤에 따라 지구 회전, 문구 교체, 버튼 변화 | GSAP ScrollTrigger `scrub` + `pin`. 관성 스크롤(Lenis 류)은 추정 | — |
| 떠 있는 chip | "Jet Booked" 등 반투명 pill이 순차 등장 | DOM 요소 + backdrop-filter, timeline 안에서 stagger | 아이콘(SVG) |

핵심: 지구는 **3D 모델 파일이 필요 없는 구조**다. 구 geometry는 코드로 만들고, 사실감은 **텍스처와 셰이더**에서 나온다. wow는 모델링이 아니라 **텍스처 품질, 대기 rim 셰이더 튜닝, 스크롤 scrub 곡선**에서 생긴다.

## 4. 기술 검증 spike (이 세션에서 실행)

위치: `prototype/spikes/scroll-globe/` (제품과 분리된 독립 Vite 프로젝트, v2.2.1 코드 무변경)

- 스택: `three@0.186.1`(MIT), `gsap@3.15.0` + ScrollTrigger(GSAP Standard "no charge" license), `lenis@1.3.26`(MIT), Vite 7, TypeScript
- 구성: 고정 WebGL canvas + DOM 텍스트 layer. **master timeline 하나(0..1)**가 지구 상승·회전·카메라 줌·태양 방향(낮/밤 경계 이동)·헤드라인 3단 교체(blur/slide)·버튼 라벨/폭 변형·chip stagger를 모두 구동함
- 입력 driver 3종이 같은 timeline을 공유: ① 스크롤(Lenis + ScrollTrigger scrub 0.6) ② `?autoplay=1` 시간 구동 ping-pong(전시 Attract 번안) ③ reduced-motion(Lenis·관성 없이 즉시 scrub, idle 회전 정지)

| 확인 항목 | 결과 `[런타임]` |
|---|---|
| `npm run build` (tsc + vite) | PASS · JS 660 kB (gzip 184 kB). three.js 전체를 번들했기 때문이며 tree-shaking·분할은 미적용 |
| WebGL | Headless Chromium에서 `WebGL 2.0` 컨텍스트 생성 PASS (SwiftShader 소프트웨어 렌더) |
| 스크롤 위치 → 상태 | 0 / 30 / 60 / 100% 스크롤에서 timeline progress 0 / 0.30 / 0.60 / 1.00, 지구 rotationY 0 / 1.178 / 2.356 / 3.927 rad. 스크롤과 3D 상태가 정확히 동기됨 |
| reduced-motion | `scroll-native-reduced` 모드, 60% 위치 progress 0.60 일치 |
| autoplay(전시 번안) | 입력 없이 progress 0.085 → 0.277로 진행 |
| Console | 스크롤 run에서 404 1건(favicon, 무해). 그 외 오류 0 |
| **프레임 간격** | median 약 180~220 ms. **CPU 소프트웨어 렌더링 값이므로 성능 근거가 아니다.** 실제 GPU(target PC)에서 다시 재야 함 |

캡처(로컬 생성, gitignore): `qa-output/scroll-{0,30,60,100}.png`, `reduced-*.png`, `autoplay-*.png`, `results.json`

spike가 증명한 것:
- 이 저장소의 Vite/TS 환경에서 three.js + GSAP + Lenis 조합이 설치·빌드·실행된다.
- "스크롤로 지구가 돌면서 문구·버튼이 바뀌는" 연출의 **메커니즘**을 재현했다.
- 같은 timeline을 스크롤, 시간, reduced-motion 세 가지 입력으로 구동할 수 있다.
- headless WebGL 캡처로 스크롤 위치별 화면을 자동으로 남길 수 있다(연출 QA 자동화 가능).

spike가 증명하지 못한 것:
- **미감**: 현재 대기 rim이 레퍼런스보다 두껍고 하얗다. 이 차이가 곧 G6 문제다. 셰이더 계수, 노출(tone mapping), bloom 튜닝은 레퍼런스 동작 영상과 나란히 놓고 반복해야 한다.
- 실제 GPU 성능, 4K/8K 텍스처 메모리, target PC의 GPU·드라이버에서의 동작.
- 텍스처 라이선스: spike는 three.js 예제 저장소의 지구 텍스처를 받아 쓴다. 출처·라이선스가 명시되어 있지 않아 **gitignore 처리했고 제품에 쓰면 안 된다.**

## 5. 에셋 체계: 무엇을, 어떤 형식으로, 어디서 가져오나

### 5.1 3D 모델이 필요한가 — 판단 규칙

| 연출 유형 | 모델 필요 | 방법 |
|---|---|---|
| 구·링·리본·튜브·입자·격자 같은 기하 형태 | 불필요 | three.js geometry + 셰이더. 지구 효과가 여기에 해당 |
| **ECG 파형의 3D 표현**(리본, 튜브, 지형처럼 솟는 표면) | 불필요 | **실제 파형 데이터로 geometry를 만든다.** 데이터 무결성 계약과 가장 잘 맞는 방법 |
| 해부학적 심장, 전극, 기기처럼 형태가 복잡한 사물 | 필요 | glTF 모델 사용 |
| 계산이 너무 무거운 시네마틱(유체, 연기, 복잡한 조명) | 실시간 모델 대신 | Blender로 미리 렌더링한 영상(.mp4/.webm)을 스크롤 위치에 맞춰 재생 |

### 5.2 형식 표준

| 재료 | 형식 | 비고 |
|---|---|---|
| 3D 모델 | **glTF 2.0 바이너리 `.glb`** | 웹 3D의 사실상 표준이며 three.js 기본 로더가 지원. mesh 압축은 Draco 또는 Meshopt. 애니메이션(skin, morph)과 PBR 재질 포함 가능 |
| 모델 텍스처 | `.ktx2`(Basis Universal) 권장, 차선 `.webp`/`.jpg` | GPU 압축 텍스처라 메모리 사용이 크게 줄어듦 |
| 구 텍스처(지구 등) | 등장방형 2:1 (4096×2048, 필요 시 8192×4096) | 낮, 밤, specular/roughness, normal 맵 |
| 환경 조명 | `.hdr` / `.exr` 1~2k | PBR 반사와 조명용 |
| 2D 벡터 모션 | Lottie `.json` | After Effects + Bodymovin |
| 사전 렌더 영상 | `.mp4`(H.264) + `.webm`(VP9/AV1) | 스크롤 scrub을 할 경우 keyframe 간격을 짧게 인코딩해야 함 |
| 글꼴 | `.woff2`, 로컬 번들 | 오프라인 전시 PC이므로 CDN을 쓰지 않음 |

### 5.3 제작/조달 도구 — 질문하신 Unity 포함

| 도구 | 판정 | 이유 |
|---|---|---|
| **Blender (무료)** | **주 제작 도구로 권장** | glTF exporter가 내장되어 있음. 모델링, UV, 텍스처 bake, 영상 사전 렌더까지 한 도구로 처리됨 |
| Spline | 보조 (빠른 시안) | 브라우저에서 3D를 빠르게 만들 수 있고 glTF export 가능. 자체 runtime을 그대로 쓰면 번들이 무겁고 세부 제어가 제한됨 |
| Cinema 4D / Maya / 3ds Max | 조건부 | 이미 쓸 줄 안다면 사용. 결과는 glTF(또는 FBX → Blender → glb)로 넘김 |
| **Unity** | **HTML 연출용으로는 비권장** | Unity WebGL 빌드는 수십 MB 크기의 독립 canvas 앱이다. DOM 문구·버튼·스크롤 timeline과 하나로 엮기 어렵고(보통 iframe으로 따로 돔), 로딩과 메모리 비용이 크다. Unity는 모델 제작/편집에만 쓰고 FBX → Blender → glb로 넘기는 경로만 유효 |
| Sketchfab / Poly Haven / NASA | 조달처 | 아래 5.4 참조. 라이선스를 항목별로 기록해야 함 |

### 5.4 조달처와 라이선스 (도입 전 반드시 개별 확인)

| 재료 | 조달처 | 라이선스 메모 |
|---|---|---|
| 지구 낮/밤 텍스처 | NASA Visible Earth *Blue Marble*(낮), *Black Marble*(밤 불빛) | NASA 이미지는 일반적으로 public domain. 원본이 수 GB이므로 4k/8k로 줄여 KTX2로 변환 |
| HDRI | Poly Haven | CC0 |
| 심장 등 해부학 모델 | Sketchfab(모델별로 CC BY / CC BY-NC 등 다름), BodyParts3D(CC BY-SA 2.1 JP), Z-Anatomy(CC BY-SA 4.0) | 상업/전시 사용 조건과 출처 표기 의무를 모델별로 확인 |
| 글꼴 | Pretendard 등 OFL 계열 | 전면 글꼴 교체는 현재 deferred 항목이므로 별도 승인 필요 |

이 환경은 NASA, Poly Haven, Sketchfab 접속이 egress 정책으로 차단되어 있다(`raw.githubusercontent.com`과 npm registry는 허용). 받아야 할 재료가 생기면 사용자가 로컬에서 내려받아 올리거나, 해당 도메인을 허용 목록에 추가해야 한다.

## 6. 권장 기술 스택과 통합 구조

```text
┌──────────── Input drivers ─────────────┐
│ Scroll (Lenis)  │ Time (Attract auto) │ Drag/Touch │ reduced-motion
└───────┬─────────┴─────────┬──────────┴────────────┘
        ▼                   ▼
   ┌── Master timeline (GSAP, progress 0..1, 장면별 label) ──┐
   │                                                        │
   ▼                         ▼                              ▼
WebGL layer (three.js)    DOM layer (React)              Data layer (canonical ECG)
 · 지구/리본/입자/조명       · 헤드라인·버튼·chip             · Transport · Loaded traces
 · postprocessing(bloom)   · 접근성 텍스트, focus           · Canvas 2D Plot (LOW zone 유지)
 · glTF/KTX2/HDR 로더       · GSAP transform/opacity          · WebGL 표현은 이 데이터에서만 생성
```

| 역할 | 선택 | 근거 |
|---|---|---|
| 3D 렌더 | **three.js** (MIT) | 생태계가 가장 크고, glTF/KTX2/HDR 로더를 기본 제공. 레퍼런스도 사용 `[문헌]` |
| React 통합 | `@react-three/fiber@9` + `drei` (MIT) — 선택 | v2가 React 19 기반이라 선언형 통합이 편함. spike처럼 vanilla three로도 충분. 둘 중 하나를 D로 결정 |
| 연출 timeline | **GSAP 3 + ScrollTrigger** | scrub, pin, label, stagger, 다양한 easing. 레퍼런스도 사용 `[문헌]`. 라이선스는 "no charge" Standard license(도입 전 전시 사용 조건 재확인) |
| 관성 스크롤 | **Lenis** (MIT) | 스크롤이 손에 붙는 느낌을 담당. 키오스크 터치에서도 동작 확인 필요 |
| 후처리 | `postprocessing` (Zlib) 또는 three 기본 EffectComposer | bloom, tone mapping. 레퍼런스의 빛 번짐 느낌에 해당 |
| 에셋 최적화 | `@gltf-transform/cli`(Draco/Meshopt/KTX2), KTX-Software `toktx` | 빌드 전 변환. 원본과 산출물을 분리 보관 |
| 검증 | Playwright + SwiftShader(스크롤 위치별 캡처, 상태값) + **target PC 실측** | spike의 `scripts/qa.mjs`가 원형 |

유지할 계약: 파형·시간·mV·Reference·Difference(LOW zone)는 지금처럼 canonical data와 Canvas 2D Plot이 source of truth로 남는다. WebGL은 HIGH zone(Attract, Intro, 전환)의 무대이고, 파형을 WebGL로 그릴 때는 **같은 Transport와 같은 sample index**에서 만든다(D-016의 same-index 원칙 확장).

## 7. 제안하는 "제작 파이프라인" 계층 (시스템 추가안 — 아직 채택 전)

1. **Motion Spec 분해** — 레퍼런스마다 스크롤/시간 0→100% 구간표를 만든다. 구간 · 요소 · 속성 · 시작→끝 값 · easing · scrub 지연을 적고, 사용자가 제공한 녹화 영상이나 캡처 순서로 근거를 남긴다. G4 해결.
2. **Effect Recipe 카드** — "레퍼런스 효과 → 구현 기법 → 필요한 에셋 → 비용 → ECG 번안"을 한 장으로 정리한다. 예: *구 + 대기 rim* = SphereGeometry + fresnel BackSide 셰이더 + bloom + 2:1 텍스처 2~3장. Alpha 설계가 이 카드를 참조한다.
3. **Asset Registry** — `assets/manifest.json`에 파일마다 출처 URL, 라이선스, 원본/변환 형식, 해상도, 크기, SHA-256, 사용처를 기록하고, 원본(`assets/source/`)과 산출물(`public/assets/`)을 분리한다. 라이선스 누락 파일은 build에서 실패시킨다.
4. **Stack Baseline** — three + GSAP/ScrollTrigger + Lenis + gltf-transform을 표준으로 두고, D-016의 "Canvas 2D 우선" 규칙을 HIGH zone에서는 WebGL 허용으로 개정한다.
5. **Performance Budget** — target PC 기준으로 60 fps 목표, 초기 로드 크기, GPU 텍스처 메모리, draw call 상한을 정한다. **target PC의 GPU 사양이 먼저 필요하다.**
6. **Input Translation 규칙** — 모든 스크롤 연출은 같은 timeline을 시간 구동(Attract), 스크롤/드래그(체험), reduced-motion 세 경로로 제공한다. spike로 가능성 확인.
7. **Motion QA** — 스크롤 위치별 캡처를 레퍼런스 캡처와 나란히 놓은 비교판과 target PC 실측 fps를 수용 기준에 넣는다. G6 해결.

이 계층을 채택하면 AI 도구 orchestration과 검증 방법이 바뀌므로, AGENTS 규칙상 **D-017 + CASE-006 + 계약 문서(`21_EFFECT_PRODUCTION_PIPELINE.md` 가칭)**를 같은 작업 단위에서 작성해야 한다. 사용자 확인 전이므로 이번에는 F-010과 이 점검 문서만 기록한다.

## 8. 사용자 확인이 필요한 것

- **P1** 위 제작 파이프라인 계층(7절)을 시스템에 정식 채택할지. 채택하면 D-017 / CASE-006 / 21번 계약 문서를 작성한다.
- **P2** target 전시 PC의 GPU·해상도·OS·브라우저(Chrome/Edge 버전). 성능 예산과 WebGL 가능 범위가 이것으로 정해진다.
- **P3** 3D/영상 에셋 제작 주체: 직접 Blender 작업 / 외부 모델 조달 / 코드 생성(procedural)만 사용.
- **P4** 레퍼런스 동작 근거 확보 방식: 이 환경의 egress 허용 목록에 레퍼런스 도메인을 추가할지, 사용자가 화면 녹화를 제공할지.
- **P5** React 통합 방식: `@react-three/fiber` 또는 vanilla three.

## 9. 단계 판정

- 수행: 레퍼런스 스택 확인(검색, 직접 열람 차단), npm 패키지 버전·라이선스 확인, spike 구현, build PASS, headless WebGL 스크롤/autoplay/reduced-motion 실행과 캡처, `records:check`.
- 판정: **CONDITIONAL PASS** — 기술 조합과 메커니즘은 검증됨. 미감 튜닝, 실제 GPU 성능, 에셋 라이선스, target PC는 미검증.
- 다음: P1~P5 답을 받은 뒤 파이프라인 계약 문서 작성 → 재설계 사전 결정(Q1~Q4) 확정.
