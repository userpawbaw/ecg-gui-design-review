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
- 다음: P1~P5 답을 받은 뒤 파이프라인 계약 문서 작성 → 재설계 사전 결정(Q1~Q4) 확정. (후속 상태는 §10 참조)

---

## 10. 추가 (2026-09-25 후속) — 사용자 결정 반영

| 항목 | 결정 `[대화]` |
|---|---|
| P1 파이프라인 채택 | 보류. 레퍼런스 2~3개를 더 분석한 뒤 결정 |
| P2 target PC GPU | 구현 단계 결정으로 연기 |
| P3 에셋 제작 주체 | 사용자는 Blender 경험이 없으므로 **외부 에셋 우선, 불가할 때만 직접 제작** |
| P4 레퍼런스 근거 | 사용자가 도메인 허용과 화면 녹화 제공. 단, 이 세션에서는 설정 변경 뒤에도 `www.moto-card.com` CONNECT가 여전히 거부됨 `[런타임]` → 새 세션부터 적용되는 것으로 추정 `[추론]` |
| P5 React 통합 | 설명 요청 → §13 |

## 11. moto-card.com 화면 녹화 분해 (54 s, 1920×1080, 59 fps)

출처: 사용자 제공 화면 녹화 `[영상]`. 1 fps 전체 contact sheet와 3~13 s 구간 2 fps로 분해했다. 타이밍은 녹화 기준이며 사용자의 스크롤 속도가 섞여 있다. 레퍼런스 원본 프레임은 저장소에 커밋하지 않는다.

| 녹화 시각 | 장면 | 관찰 | 구현 추정 `[추론]` |
|---|---|---|---|
| 0–3 s | BUILT FOR MODERN WEALTH | 금속 카드가 받침대 위에 있고 어두운 암석 질감 배경. 스크롤하면 받침대째 위로 빠짐 | 사전 렌더 이미지나 영상, 또는 glTF 카드 + 받침대 |
| 3–6 s | INFRASTRUCTURE FOR HOW YOU MOVE | 헤드라인이 일반 스크롤로 올라오고, 그 아래에서 지구가 화면 하단에 떠오름 | DOM 스크롤 + 고정 WebGL canvas |
| 5–8 s | 지구 + chip | **태양이 지구 뒤 위쪽에 있는 역광**: 정면은 밤 면(도시 불빛), 윗가장자리에만 밝은 대기 rim. chip 3개가 순차로 fade-in. 회전은 **작다**(대륙이 조금 이동하는 정도) | 밤 텍스처 중심 셰이더 + 역광 rim + bloom |
| 7–9.5 s | 문구 퇴장 | 헤드라인·버튼이 위로 빠지고 chip이 흐려지며 지구가 가라앉고 어두워짐 | scrub timeline |
| **9.5–10.5 s** | **match cut** | 지구 정수리에서 **가느다란 흰 수직선**이 솟아오르고 지구가 사라지면, 그 선이 **옆에서 본 카드의 모서리**가 됨 | 카드 glTF를 edge-on(90°)으로 배치한 뒤 선 → 카드 회전으로 형태를 이어 붙인 전환 |
| 11–20 s | THE CARD IS ONLY THE BEGINNING | 카드가 3D로 뒤집히며 금속 반사광이 쓸고 지나감. 주변에 사진 타일 수십 장이 **깊이 공간에 흩어져** parallax. 헤드라인은 blur-in | 카드 PBR 재질 + 환경맵(HDR), 이미지 plane 다수 + 안개/심도 |
| 21–28 s | SPEND GLOBALLY. 0 FX FEES | 밝은 배경으로 전환. 여러 통화 금액이 세로 열로 서로 다른 속도로 흐르며 **거리마다 흐림이 다름**(심도). 중앙 문구 고정 | DOM/Canvas 텍스트 열 + blur/opacity를 depth에 연동 |
| 29–40 s | 24/7 CONCIERGE → 지형 영상 | 전면 영상 패널이 아래에서 올라오며 clip reveal. 오른쪽 정렬 대형 문구 목록이 누적 | 영상(.mp4) + clip-path scrub |
| 40–54 s | MADE FOR THE PLACES… / ACCESS / FAQ / footer | 영상 배경, 시간대 시계 행, 항목 accordion, 사진 섹션 | 일반 DOM + 영상/사진 에셋 |

### 11.1 이 녹화가 바꾼 해석 (→ F-011)

1. **wow의 본체는 "지구 회전"이 아니다.** 회전량은 작다. 핵심은 **역광 연출**(밤 면 + 윗가장자리 rim + 도시 불빛)과 **지구 → 빛줄기 → 카드 모서리로 이어지는 형태 연속 전환(match cut)**이다.
2. 앞서 만든 spike는 회전을 크게(3.9 rad) 주고 정면 주광을 써서 **레퍼런스를 잘못 읽었다.** 캡처 1장과 사이트 태그만으로 동작을 추정한 한계이며, 정지 이미지 분석(G4)의 실제 사례다.
3. 사이트 전체의 wow는 3D 한 가지가 아니라 **장면마다 다른 재료**로 만들어진다: 실시간 3D(지구, 카드), 사진 타일 공간, 타이포 심도 효과, 사전 촬영/렌더 영상, clip reveal. 제작 파이프라인은 3D만이 아니라 **영상·사진·타이포 효과까지** 포함해야 한다.
4. ECG 번안 후보(아이디어 수준, 승인 아님): *파형 한 줄 → 빛줄기 → 다른 물체*처럼 **ECG의 선 자체를 match cut의 매개로 쓰는 전환**. 파형은 반드시 canonical 데이터에서 만든다.

### 11.2 필요한 에셋을 역으로 추정 `[추론]`

| 장면 | 재료 | 외부 조달 가능성 |
|---|---|---|
| 지구 | 밤 불빛 + 낮 + 구름 텍스처 | 높음 (NASA, public domain) |
| 카드 | 자사 카드 glTF + 금속 PBR 텍스처 + HDR | 모델은 자체 제작으로 추정. HDR은 조달 가능 |
| 사진 타일, 컨시어지·체육관 영상 | 브랜드 촬영물 | 자체 촬영으로 추정. 대체재는 스톡 영상/사진 |
| 암석 배경 | 스캔 질감 또는 사전 렌더 | 조달 가능 (CC0 질감) |

## 12. P3 — "코드 생성만 사용"의 의미와 외부 에셋 조달처

### 12.1 세 방식의 차이

| 방식 | 의미 | 예 |
|---|---|---|
| **코드 생성(procedural)** | 형태·움직임·빛을 코드와 셰이더로 만듦. 외부 파일이 **없거나 텍스처 몇 장**뿐 | spike의 지구(구는 코드, 사실감은 텍스처 3장), 입자, 빛줄기, **ECG 데이터로 만든 3D 리본/지형**, 추상 격자, 노이즈 배경 |
| **외부 조달** | 다른 사람이 만든 모델·텍스처·영상을 라이선스에 맞춰 가져옴 | 심장 모델, HDR 조명, 금속 질감, 스톡 영상 |
| 직접 제작 | Blender 등으로 모델링하거나 영상을 렌더링 | 형태가 독특한 전용 오브젝트 |

즉 "코드 생성만"은 spike처럼 만드는 방식이 맞다. 다만 사실적인 지구에는 텍스처가 필요하므로, 엄밀하게는 **코드 + 텍스처 몇 장**이다. ECG 프로젝트에서는 주인공이 파형이므로, 파형 기반 연출은 대부분 코드 생성으로 해결되고 **외부 조달은 배경·조명·보조 오브젝트**에 주로 쓰일 것이다. `[추론]`

### 12.2 외부 에셋 사이트 (조달 우선순위 순)

라이선스는 사이트 정책 요약이다. **실제 사용 전에 항목별 페이지의 라이선스를 반드시 다시 확인하고 Asset Registry에 기록한다.** (이 세션에서는 대부분 직접 접속이 차단되어, 사이트 내용은 알려진 정책과 웹 검색으로 확인했다.)

**A. 무료 · 제약 적음 (CC0 / public domain) — 1순위**

| 사이트 | 제공 | 형식 | 라이선스 요약 |
|---|---|---|---|
| Poly Haven | HDRI, PBR 질감, 모델 | .hdr/.exr, 질감 맵, .gltf/.blend | CC0 |
| ambientCG | PBR 질감, HDRI | 질감 맵 (1k~8k) | CC0 |
| NASA Visible Earth / Scientific Visualization Studio | 지구 낮/밤/구름, 행성 | 대형 JPG/TIFF | 일반적으로 public domain (개별 크레딧 확인) |
| pmndrs market | 웹용 glTF 모델, HDRI | .glb | 대부분 CC0 |
| Kenney / Quaternius / Poly Pizza | low-poly 모델 | .glb/.fbx | 대부분 CC0. 스타일이 게임풍이라 이 프로젝트에는 제한적 |

**B. 무료 · 조건 있음 — 2순위**

| 사이트 | 제공 | 주의 |
|---|---|---|
| Sketchfab (무료 다운로드 모델) | 가장 방대한 3D 모델, **glTF로 바로 다운로드** 가능 | 모델마다 CC BY / CC BY-NC / CC BY-SA 등이 다름. NC(비상업)는 전시 성격에 따라 불가할 수 있음. 유료 판매는 2024-10부터 Fab로 이전됨 |
| NIH 3D (구 NIH 3D Print Exchange) | **해부학·의료 모델(심장 포함)** | 모델별 라이선스 확인. 인쇄용 STL 위주라 웹용 정리가 필요할 수 있음 |
| BodyParts3D / Z-Anatomy | 인체 해부 모델 | CC BY-SA 계열. 출처 표기와 동일조건 공유 의무 |
| Pexels / Pixabay / Mixkit | 스톡 영상·사진 | 각 사이트 자체 라이선스(대부분 무료 상업 사용 가능, 재판매 금지 등) |
| Unsplash | 사진 | Unsplash License |
| LottieFiles | 2D 벡터 애니메이션 | 무료 애니메이션은 Lottie Simple License. 항목별 확인 |
| Google Fonts / 눈누(한글 무료 글꼴 모음) | 글꼴 | OFL 등. 글꼴 교체는 deferred 항목 |
| Shadertoy | 셰이더 기법 참고 | **기본 CC BY-NC-SA** — 코드를 복사하지 말고 기법만 참고 |

**C. 유료 — 무료로 해결되지 않을 때**

| 사이트 | 특징 |
|---|---|
| Fab (Epic, Sketchfab 판매분 이전) | 고품질 모델·질감. 표준 라이선스 확인 |
| CGTrader / TurboSquid | 대형 모델 마켓. "Editorial use only" 모델은 전시에 부적합할 수 있음 |
| Envato Elements | 구독형. 영상·모델·사운드·Lottie를 한곳에서 해결 |

**D. AI 3D 생성 — Blender 대체 후보**
Meshy, Tripo 등은 텍스트나 이미지로 GLB 모델을 만든다. 형태 품질이 들쑥날쑥하고, 요금제별로 라이선스(상업 사용·소유권)가 다르다. **배경 소품 수준에서만 시험적으로 사용**하고, 주인공 오브젝트에는 쓰지 않는 것을 권장한다. 생성물의 형태가 ECG 데이터처럼 보이면 안 된다.

**E. 직접 제작이 필요할 때의 최소 경로 (Blender 경험 없음 전제)**
1) 조달한 모델을 Blender로 열어 크기·원점·재질만 정리하고 glTF로 내보내기(튜토리얼 1~2시간 수준) → 2) 그래도 어려우면 Spline에서 단순 형태를 만들어 glTF로 내보내기 → 3) 둘 다 어려우면 형태를 코드 생성으로 대체.

## 13. P5 — vanilla three.js와 React Three Fiber(r3f)의 차이

| | vanilla three.js | React Three Fiber (+ drei) |
|---|---|---|
| 무엇인가 | three.js를 직접 호출해 장면·카메라·재질·렌더 루프를 코드로 조립 | **같은 three.js를 React 컴포넌트 문법으로** 쓰게 해 주는 층. 내부 렌더러는 동일 |
| 품질 상한 | 동일. 셰이더·후처리·PBR 모두 가능 | 동일. three.js의 모든 기능 사용 가능 |
| 고품질에 도달하는 속도 | 느림. 환경맵, 모델 로딩, 후처리, 반사 재질 등을 직접 조립 | **빠름.** drei가 Environment, useGLTF, 반사/투과 재질, 텍스트, 스크롤 제어 등을 부품으로 제공 |
| GSAP 스크롤 timeline과의 결합 | 자연스러움. spike가 이 방식 | 가능. ref와 `useFrame`으로 연결. 매 프레임 React state를 바꾸면 성능이 망가지므로 규칙이 필요 |
| 기존 v2.2.1(React 19)과의 통합 | React 컴포넌트 하나가 엔진을 mount하는 **어댑터 코드**가 필요 | Transport·선택 방법 같은 상태를 그대로 prop으로 전달. r3f v9가 React 19 지원 |
| 레퍼런스 코드 이식 | 쉬움. Awwwards/Codrops 튜토리얼 대부분이 vanilla | 번역이 필요 |
| 성능 제어 | 최고. 모든 객체와 메모리 해제를 직접 관리 | 대부분 충분. 추상화 층의 비용과 컴포넌트 재렌더를 조심해야 함 |
| 유지보수 | 수명주기(dispose·resize·loading)를 직접 작성 | React 수명주기에 편승. 대신 three / r3f / drei 버전을 서로 맞춰야 함 |
| 디버깅 | 직접적 | drei 부품은 블랙박스일 때가 있음 |

**결론:** 두 방식의 품질 상한은 같다. 차이는 **상한에 도달하는 비용**과 **통제권**이다.
- r3f를 쓰면 개발 속도와 React 통합이 좋아지고, 대신 저수준 통제와 레퍼런스 코드 이식 편의를 일부 포기한다.
- vanilla를 쓰면 전환 연출을 프레임 단위로 완전히 통제할 수 있고, 대신 개발 시간과 어댑터 코드가 늘어난다.

**권장 `[추론]`:** 이 프로젝트의 wow는 moto처럼 **하나의 timeline으로 3D·DOM·전환을 정밀하게 맞추는 연출**이고, 성능이 중요한 전시 PC에서 돌아간다. 그래서 **3D 무대는 vanilla three.js 엔진 모듈로 만들고, React는 그 엔진을 mount하고 상태만 전달하는 hybrid**를 권장한다. 포기하는 것은 drei의 편의 부품인데, 필요한 기능(환경맵, glTF 로더, 후처리)은 three.js 공식 addon에 거의 다 있다. 확정은 P1(파이프라인 채택) 때 D 기록으로 한다.

## 14. moto-card.com 파트별 정량 분석 (사용자 질문 3건)

방법 `[영상]` `[추론]`: 녹화를 60 fps · 640×360 흑백으로 풀고, 영역별 phase correlation(이동량)과 프레임 차이(움직임 에너지)를 계산했다. 스크롤 입력은 녹화에 표시되지 않아, 스크롤과 함께 움직이는 DOM 문구의 이동 속도를 **스크롤 속도 대리값**으로 썼다.

주의: 녹화 프레임의 **24.5 %가 직전 프레임과 동일**했다(녹화 프로그램의 프레임 누락·반복). 미세한 끊김 일부는 사이트가 아니라 녹화에서 생겼을 수 있다. 아래 결론은 여러 프레임에 걸친 변화만 사용했다.

### 14.1 지구 파트 (녹화 4–10 s) — 스크롤 속도에 비례해 가속하는 회전

| 측정 | 값 |
|---|---|
| 회전 속도(지구 내부 수평 이동) vs 스크롤 속도(문구 수직 이동) 상관 | **0.96** (지연 0 프레임에서 최대, ±5 프레임에서 0.73~0.86) |
| 선형 적합 | 회전 ≈ **0.09 + 0.99 × 스크롤 속도** (px/frame) |
| 스크롤이 멈춘 구간(7.8 s, 8.6–8.7 s) | 회전 0~1 px/frame. 멈추지 않고 느리게 계속 돎 |
| 4.0–5.7 s | 지구가 문구와 같은 속도로 올라옴(페이지와 함께 이동) → 5.7 s부터 제자리 고정 |

해석: 회전각은 스크롤 **위치**가 아니라 스크롤 **속도**로 정해진다. 식으로 쓰면 `각도 += (기본 속도 + k × 스크롤 속도) × dt`이다. 지연이 0인 것은 회전과 문구가 **같은 관성 스크롤 값**(Lenis류)을 쓰기 때문으로 보인다.

8 s 부근 역광 강화 → 카드 전환: 스크롤 속도가 아니라 **스크롤 위치(진행률)**에 묶인 구간 연출로 보인다. 광원 방향, 노출, rim 세기를 진행률에 따라 바꾸고, 빛줄기(옆에서 본 카드)를 등장시키는 방식이다.

**도메인 접근이 필요한가:** 동작의 *모델*(속도 비례 + 기본 회전 + 위치 연동 광원)은 녹화로 충분히 측정했고, 재현도 가능하다. 다만 *실제 구현 수단*은 녹화만으로 구분할 수 없다.
- (A) three.js 실시간 구 + 셰이더
- (B) 루프 영상의 재생 속도(`playbackRate`)를 스크롤 속도로 조절
- (C) 이미지 시퀀스

이를 확정하고 셰이더·광원 코드, 에셋 형식(.glb / .mp4 / 이미지 시퀀스), 감쇠 계수 같은 정확한 값을 보려면 **사이트 소스(JS, 네트워크 요청)를 열어야 한다.** 이 세션은 허용 설정 뒤에도 CONNECT가 거부되므로 **새 세션에서 확인**해야 한다.

### 14.2 카드 회전 파트 (녹화 11–20 s) — 빠른 회전과 느린 회전 사이의 부드러운 전환

| 측정 (카드 영역 움직임 에너지, 0.1 s 평균) | 값 |
|---|---|
| 스크롤 중 (13.0–13.2 s) | 4.4 → 13.7 |
| 스크롤 정지 직후 (13.3 → 14.0 s) | 2.95 → 2.5 → 2.2 → 1.6 → 1.2 → 1.1 → 0.8 → **0.7** : 약 0.7 s에 걸쳐 **지수 함수형 감쇠** |
| 정지 유지 (14.0–15.5 s) | 0.6~0.8에서 유지. **0으로 떨어지지 않음** = 기본 회전 |
| 다시 스크롤 (16.9–17.3 s) | 2.5 → 5.3 → 6.3로 **점진 상승**(계단식 점프 아님) |

부드러움을 만드는 세 요소 `[추론]`:
1. **적분형 회전** — `각도 = f(scrollY)`가 아니라 `각도 += 속도 × dt`. 스크롤이 멈춰도 각도가 튀지 않는다.
2. **감쇠(damping)** — 현재 속도가 목표 속도(`기본 + k·|스크롤 속도|`)를 시간상수 약 0.2~0.3 s로 따라간다. 예: `speed = THREE.MathUtils.damp(speed, target, λ, dt)`. 관성 스크롤 라이브러리의 속도 값 자체가 이미 부드럽다(Lenis `velocity`).
3. **0이 아닌 기본 속도** — 멈춰도 계속 돌아서, 멈춤이 "정지"가 아니라 "느려짐"으로 보인다.

### 14.3 오른쪽 타이포그래피 파트 (녹화 36–40 s) — 끊겨 보이는 이유

60 fps 프레임으로 보면 `[영상]`:
- 문구 항목이 오른쪽 목록에서 왼쪽 목록으로 **날아가지 않는다.** 오른쪽 항목은 제자리에서 작아지며 사라지고, 왼쪽 복사본은 제자리에서 얇은 선에서부터 커지며 나타난다. 두 동작 모두 약 0.15~0.3 s의 **시간 기반 트윈**이며, 스크롤 위치 문턱을 넘을 때 **실행 버튼처럼 발동**하는 방식으로 보인다.
- 항목 하나가 빠지면 아래 항목들이 **한 줄 위로 한 프레임 만에 점프**한다. 레이아웃 재배치(reflow)로 보이며 중간 위치가 없다.
- 스크롤을 멈춘 39.3–40.0 s에는 배경 영상을 포함한 **모든 것이 완전히 정지**한다. 기본 움직임이 없다.

지구·카드 파트와의 차이:

| 요소 | 지구·카드 (부드러움) | 타이포 (끊김) |
|---|---|---|
| 상태 변화 | 연속값(각도·광원)을 보간 | 문턱 발동 트윈 + 레이아웃 점프 |
| 입력 | 관성 스크롤의 속도·진행률 | 스크롤 위치 문턱(on/off) |
| 공간 연속성 | 같은 물체가 계속 변형 | 사라짐과 나타남이 따로 일어나 이동 경로가 없음 |
| 정지 시 | 기본 회전 유지 | 전부 정지 |

부드럽게 만들려면 `[추론]`:
1. **FLIP 보간** — 항목의 시작·끝 위치와 크기를 측정해 transform으로 실제 이동시킨다. GSAP **Flip 플러그인**을 쓰고, 문턱 발동 대신 **진행률 scrub**(예: `scrub: 0.6`)으로 묶는다.
2. **레이아웃 점프 제거** — DOM을 빼고 넣지 말고, 두 목록을 미리 배치한 뒤 transform·opacity만 움직인다(합성 레이어만 사용, reflow 없음).
3. **기본 움직임 층** — 배경 영상을 계속 재생하거나 느린 drift를 넣어, 멈춤이 "정지"가 되지 않게 한다.
4. **영상을 스크롤로 되감는(scrub) 경우** — 일반 MP4는 keyframe 사이를 탐색할 때 디코딩이 끊긴다. **모든 프레임을 keyframe으로 인코딩**(`ffmpeg -g 1` 등)하거나 **이미지 시퀀스를 canvas로 재생**해야 한다.

사전 준비물: GSAP Flip(+ 필요하면 SplitText) 플러그인, 측정 전에 반드시 로드되는 로컬 글꼴(woff2 preload. 글꼴이 늦게 로드되면 FLIP 측정값이 틀어짐), 배경 영상의 스크롤 되감기용 all-intra 인코딩 또는 이미지 시퀀스(용량 예산 필요).

## 15. 레퍼런스 촬영 규칙 (초안 · 합의 대기)

사용자 제안 `[대화]`: *정지 상태를 먼저 보여 준 뒤 규칙적으로 스크롤* / *입력 상태를 화면에 표시*. 두 가지를 모두 반영하고, 이번 분석에서 드러난 문제(녹화 프레임 24.5 % 중복, 스크롤 입력 비가시, 녹화 프로그램 워터마크가 문구를 가림)를 막는 규칙을 더했다. 상세 절차와 도구는 `tools/reference-capture/README.md`.

요약:
- **녹화 설정**: 60 fps 고정(CFR), 1920×1080, 브라우저 전체화면(F11), 워터마크 없는 녹화 도구(예: OBS)
- **입력 표시**: `tools/reference-capture/scroll-hud.js`(DevTools 콘솔이나 북마클릿). 휠 입력, 방향, scrollY, 스크롤 속도가 화면 구석에 표시된다
- **파트별 동작 순서**: 정지 3 s → 휠 1칸씩 3회(1 s 간격) → 연속 스크롤 2 s → 정지 3 s → 빠른 휙 스크롤 1회 → 정지 2 s → 위로 되돌리기
- **분석 산출 단위**: 앞으로 영상 분석은 **화면별 · 전환 효과별**로 나눠 기록한다(사용자 요청 `[대화]`)
