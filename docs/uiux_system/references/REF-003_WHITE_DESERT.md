# REF-003 white-desert.com — 스크롤로 밀려오는 두 겹 구름 · 스크롤로 그려지는 비행 경로 + 소나 표시점

기록 규칙: `../21_REFERENCE_EFFECT_RECORDS.md` v1 · 작성 2026-09-25 · 분석: Claude(사용자 녹화·지목 기반)

## 1. 레퍼런스 개요

- URL: https://white-desert.com/ — 남극 럭셔리 탐험 여행사 White Desert의 홈페이지. 제작사는 사이트·소스에서 확인하지 못했다 `[코드]`.
- 분석 날짜: 2026-09-25
- 선정 이유: 사용자가 녹화와 함께 두 가지를 짚었다.
  > "3초 부근의 구름이 밀려오는 듯한 효과, 38초~1분까지의 스크롤을 따라 부드럽게 위아래로 움직이며 지나친 지점을 청록색으로 표시하는 이동 지점 표시지. - 52초 부근을 보면 멈춰 있을 때도 일정한 시간 간격으로 마치 소나가 탐지하듯 위치가 나타나는 것이 wow 포인트." `[대화]`
- 특기: **WebGL·canvas를 전혀 쓰지 않는다**(라이브 측정 캔버스 0개). 모든 wow가 DOM + PNG/SVG + CSS 애니메이션 + GSAP ScrollTrigger로 만들어진다 `[런타임]` `[코드]`. REF-001·002(WebGL 중심)와 대비되는 사례다.

## 2. 입력 증거

| 증거 | 내용 | 한계 |
|---|---|---|
| 사용자 녹화 | 1:00.7, 1920×1032, 29.7 fps(H.264 압축본), **scroll HUD 표시 있음**. 휠 1칸 = 100 px `[영상]` | 압축본 30 fps. 1 fps·4 fps·10 fps(표시점 확대) 분해로 확인 |
| 소스 | `index.html`(166 KB, Next.js App Router + Turbopack) + 초기 청크 JS 16개·CSS 14개를 읽음. 구름 = `hero-banner` 컴포넌트, 경로 = `travel-globe` 컴포넌트(청크 `3740e28aac5f04a8.js`) `[코드]` | 미니파이. 컴포넌트 속성·CSS·GSAP 설정은 원문 그대로 |
| 라이브 측정 | Playwright + Chromium(에이전트 프록시 CA만 SPKI로 신뢰), 1920×1032. ① 네트워크·글꼴·캔버스 ② 휠 200 px마다 구름·제목·경로 요소의 화면 위치·필터·stroke-dash 값 `[런타임]` | 헤드리스 SwiftShader — fps 미측정. 결과 요약 `REF-003/live-probe.json` |

## 3. 기술 스택과 전역 설정

| 항목 | 값 | 근거 |
|---|---|---|
| 앱 | **Next.js**(App Router, Turbopack 빌드, `next/image`), React. CMS **Sanity**(`cdn.sanity.io` 이미지) | `[코드]` `[런타임]` |
| 스크롤 | **Lenis 1.3.15**(`lenis/react`의 `ReactLenis root`), `{autoRaf: false, syncTouch: true, syncTouchLerp: 0.075, touchInertiaExponent: 1.7, touchMultiplier: 1}` — 데스크톱 `lerp`는 기본값 0.1 | `[코드]` |
| 모션 | **GSAP 3.13.0** + ScrollTrigger + **DrawSVGPlugin + MotionPathPlugin**(3.13부터 무료 공개 플러그인). `@gsap/react useGSAP` | `[코드]` |
| 동기화 | Lenis를 `gsap.ticker`로 구동, `lagSmoothing(0)` → RCP-01 | `[코드]` |
| 렌더 | DOM만. canvas 0개, WebGL 없음. 영상 1개(Cloudflare Stream HLS + mp4 대체) | `[런타임]` |
| 기타 | Rive 런타임 언급(3회) — 이번 녹화 구간에서는 사용처 미확인. HubSpot 채팅·reCAPTCHA·GTM·Facebook 픽셀 | `[코드]` `[런타임]` |

## 4. 디자인 토큰

| 토큰 | 값 | 근거 |
|---|---|---|
| 제목(히어로) | **Oswald**(variable) 대문자, 가운데 정렬, 행간 1, `--size-16` | `[코드]` `[런타임]` |
| 디스플레이 세리프 | **Cardinal Classic Long**(Regular/Medium/Italic, woff2 각 79–86 KB) — 섹션 제목·이탤릭 캡션(`t-title-italic`) | `[코드]` `[런타임]` |
| 본문·수치 | **Inter Tight** variable(239 KB) — "05:30 HRS", "4,220 KM" 수치 카드 | `[코드]` `[런타임]` |
| 강조색 | 청록 `--wd_turqoise #6AF0FF`(지나온 경로·표시점·소나 링) | `[코드]` |
| 짙은 색 | `--wd_dark-blue #1F2A44`, 지도 배경 `--dark-bg #090B10` | `[코드]` |
| 카드 | 반투명 짙은 남색 + `backdrop-filter: blur(5px)`, 점선 구분선 | `[코드]` |
| 부대 요소 | 오른쪽 가장자리 주황 세로 탭("How it works") | `[영상]` |

Cardinal Classic Long·Oswald·Inter Tight 중 Oswald·Inter Tight는 OFL 무료 서체다(Cardinal은 상용). 글꼴 교체는 우리 프로젝트에서 deferred 항목이다.

## 5. 장면·전환 지도

| 순서 | 녹화 시각 | 섹션 | 장면·전환 | 입력 모델 요약 | 카드 |
|---|---|---|---|---|---|
| 1 | 0–7 s | `.hero-banner`(200svh) | 반복 영상(빙하 → 비행기 창 → 펭귄 …) + 대형 "ANTARCTICA". 스크롤하면 화면은 고정된 채 **구름 두 겹이 아래에서 밀려와 덮고** 제목이 흐려진다 | 스크롤 위치(구름·흐림) + 시간(영상) | EFX-003-01 |
| 2 | 7–8 s, 16 s | home intro | 흰 화면 "VAST, MAJESTIC …" 문장이 스크롤에 따라 마스크로 드러남 | 스크롤 위치 | EFX-003-05 |
| 3 | 8–15 s | hero(되돌림) | 사용자가 위로 되돌려 같은 구름 효과를 다시 보여 줌(되돌리면 구름이 내려감) | 스크롤 위치 | EFX-003-01 판별 근거 |
| 4 | 17–20 s | intro 이미지 | 큰 산 사진, 제목 겹침 | 스크롤 위치 | 기록 제외 — 일반 이미지 시차 |
| 5 | 21 s | experiences | "South Pole & Blue Rivers" 가로 카드 | 스크롤 위치 | 기록 제외 — 일반 가로 스크롤 카드 |
| 6 | 22–25 s | our camps | "OUR CAMPS" 제목 → 캠프 카드 슬라이더(Whichaway·Echo·Explorer) | 스크롤 위치 | 기록 제외 — 일반 카드 슬라이더 |
| 7 | 26 s | quote | 빙벽 사진 위 인용문 | 스크롤 위치 | 기록 제외 — 일반 |
| 8 | 27–33 s | 두 번째 hero | "CPT — WFR"(케이프타운 — 울프스팽 활주로) 빙벽 hero, 제목 흐려짐 | 스크롤 위치 | EFX-003-01(같은 컴포넌트, 구름 없는 변형) |
| 9 | 33–35 s | mist transition | 빙벽 사진 아래쪽이 **흰 안개로 기울어 올라오며** 흰 "TO THE END OF THE EARTH" 머리글로 이어짐 | 스크롤 위치 | EFX-003-04 |
| 10 | 35–56 s | `.travel-globe` | 검은 위성 지도 위 케이프타운 → 남극 곡선 경로. **스크롤에 따라 청록 경로가 그려지고 표시점이 따라가며**, 표시점은 멈춰 있어도 **소나 링**을 낸다. 왼쪽 정보 카드(비행시간·거리·기온), 오른쪽 "Watch Film" 카드 시차 | 스크롤 위치(경로·카드) + 시간(소나) | EFX-003-02, EFX-003-03 |
| 11 | 56 s | footer CTA | "START PLANNING YOUR ADVENTURE" 사진 | 스크롤 위치 | 기록 제외 — 일반 |
| 12 | 57–60 s | travel-globe(되돌림) | 위로 되돌리면 경로가 지워지고 표시점이 역행 | 스크롤 위치 | EFX-003-02 판별 근거 |

## 6. 효과 카드

### EFX-003-01 스크롤로 밀려오는 두 겹 구름 (고정 hero 덮기)

**선정 이유**: 사용자 지목("3초 부근의 구름이 밀려오는 듯한 효과"), wow 포인트 · 재사용 메커니즘(고정 화면 위를 다른 속도의 층이 덮는 전환).
**지각**: 영상과 "ANTARCTICA" 제목은 그대로 멈춰 있는데, 스크롤을 내리면 **아래에서 흰 구름이 두 겹으로 밀려 올라와** 화면을 덮는다. 앞 구름은 빠르고 뒤 구름은 느려서 깊이가 느껴진다. 동시에 제목이 점점 흐려진다(최대 10 px). 구름이 화면을 거의 다 덮으면 그 흰색이 다음 흰 섹션으로 이어진다. 위로 되돌리면 구름이 다시 내려간다.
**입력 모델**: 스크롤 위치. (배경 영상 자체는 시간.)
**판별 근거**: 녹화에서 위로 되돌리면 구름이 역행한다(8–15 s) `[영상]`. 소스 — `gsap.to(cloudWrap, {y: "-80%" | "-10%", ease: "none", scrollTrigger: {trigger: hero, start: "top top", end: "bottom top", scrub: true}})`, 제목 `filter: blur(0 → 10px)` 같은 구간 scrub `[코드]`. 라이브 측정에서 휠 200 px마다 구름 위치가 정확히 선형으로 변한다 `[런타임]`.
**구현 메커니즘**:
```
DOM(모두 position 기반, WebGL 없음)
.hero-banner            height 200svh (스크롤 거리 확보)
 ├ .hero-banner_wrapper  100svh — gsap y: 0 → +100svh (hero top → 다음 섹션 top, scrub) = 화면 고정(pin 효과)
 │   ├ video(loop, muted, cover) + 검은 20 % 덮개
 │   └ h1 "ANTARCTICA" — filter blur 0 → 10px (hero 전체 구간, scrub)
 ├ .clouds-overlay_wrap #1  100svh, CSS translateY(100%)에서 시작, data-scroll-speed "-80%"  → cloud-1-cropped.png
 └ .clouds-overlay_wrap #2  100svh, 같은 시작, data-scroll-speed "-10%"                     → cloud-2-full.png
   img: object-fit cover, object-position top, will-change transform
p = scroll / heroHeight (0 → 1, Lenis lerp 0.1로 부드러움)
화면 기준 구름 위쪽 가장자리 = 100vh × (1 − 1.8p)   (#1, 빠름)
                              = 100vh × (1 − 1.1p)   (#2, 느림)
```
구름 PNG는 **위쪽이 투명하고 아래로 갈수록 빽빽한 흰 구름**이라, 층이 올라오면 화면 아래부터 하얗게 덮인다 `[영상]` `[추론]`.
**파라미터**:
| 이름 | 값 | 출처 |
|---|---|---|
| hero 높이(스크롤 거리) | 200svh = 2,064 px(1032 뷰포트) | `[코드]` `[런타임]` |
| 앞 구름 속도 | 화면 기준 0.90 px / 스크롤 px(200 px마다 180 px 상승) | `[런타임]` |
| 뒤 구름 속도 | 0.55 px / 스크롤 px(200 px마다 110 px 상승) | `[런타임]` |
| 앞 구름이 화면 위에 닿는 스크롤 | 약 1,150 px(p ≈ 0.56) | `[런타임]` |
| 제목 흐림 | 0 → 10 px, p에 선형(200 px마다 0.969 px) | `[런타임]` |
| scrub | `true`(지연 없음) — 부드러움은 Lenis `lerp 0.1` | `[코드]` |
| 영상 덮개 | `rgba(0,0,0,0.2)`(기본) | `[코드]` |
**타임라인**: hero 구간(스크롤 0 → 2,064 px) 동안 모두 선형(`ease: none`). 끝나면 wrapper 고정이 풀리며 흰 intro 섹션이 올라온다. 녹화에서는 3–7 s(스크롤 약 50 → 1,400 px) `[영상]`.
**에셋**: `cloud-1-cropped.png`, `cloud-2-full.png`(1920×1080 원본, `next/image`가 WebP 1920 w로 변환해 각 96 KB·166 KB), hero 영상 mp4 **4.42 MB**(Cloudflare Stream, HLS 매니페스트 + mp4 대체). 구름은 사진 합성 또는 렌더로 만든 **투명 PNG 두 장**뿐이다 `[런타임]` `[추론]`.
**성능 기법**: 구름을 이미지 2장으로 끝낸다(파티클·셰이더 없음). `will-change: transform`, `translateZ(0)`로 합성 레이어화. `priority` 이미지 사전 로드 `[코드]`.
**접근성·폴백**: `prefers-reduced-motion` 처리 없음(JS·CSS 전체 0회) `[코드]`. 모바일은 같은 구조(`svh` 단위).
**근거**: 구조·설정 `[코드]`, 속도·흐림 수치 `[런타임]`, 지각·되돌림 `[영상]` `[대화]`, PNG 알파 분포 `[추론]`(파일을 열어 보지 않음).
**재현 요구사항**: GSAP ScrollTrigger(또는 스크롤 값 직접 매핑) + 투명 구름 PNG 2장(1920×1080, 위 투명·아래 불투명 그라데이션). 구름 이미지는 CC0 구름 사진·HDRI 하늘을 합성하거나 Blender 볼륨 구름을 렌더해서 만든다. 코드 난이도 하, 에셋 난이도 중.
**수용 기준**: (1) 스크롤 위치만으로 결정 — 되돌리면 같은 모습. (2) 두 층의 화면 속도 비가 약 1.6:1(0.9 : 0.55). (3) hero가 끝날 때 화면 아래 80 % 이상이 흰색이어서 다음 흰 섹션과 이음새가 없다. (4) 제목 흐림이 스크롤에 선형.
**ECG 번안**: Attract → 본 화면 전환이나 섹션 경계에 쓸 수 있다. 예: 잡음 섞인 파형 hero 위로 "잡음 안개" 두 겹이 올라와 화면을 덮고, 걷히면 깨끗한 파형 비교 화면이 나타난다. 안개 층은 장식이므로 파형·축 영역(LOW zone)을 덮는 순간에는 측정값을 표시하지 않고, 전환이 끝난 뒤 데이터를 보여 준다.
**재현 상태**: `spike` — `prototype/spikes/ref-repro/ref003.html` (2026-09-25, 헤드리스 캡처 — 실제 GPU·실측 수용 기준 미검증)

### EFX-003-02 스크롤로 그려지는 비행 경로 + 경로를 따라가는 표시점

**선정 이유**: 사용자 지목("스크롤을 따라 부드럽게 위아래로 움직이며 지나친 지점을 청록색으로 표시하는 이동 지점 표시지"), wow 포인트.
**지각**: 검은 위성 지도에서 케이프타운부터 남극까지 가는 흰 곡선이 있고, 스크롤을 내리면 **지나온 구간이 청록색으로 칠해지며** 청록 점이 곡선을 따라 내려간다. 지도는 스크롤보다 느리게 올라가고 점은 경로를 따라 내려가므로, **점이 화면 가운데 부근에 머문 채 지도가 그 아래로 흘러가는** 느낌이 든다(카메라가 비행기를 따라가는 듯). 왼쪽 정보 카드와 오른쪽 영상 카드는 서로 다른 속도로 움직인다. 되돌리면 칠이 지워지며 점이 역행한다.
**입력 모델**: 스크롤 위치.
**판별 근거**: 되돌림 반응(57–60 s) `[영상]`. 소스 — 한 timeline에 `drawSVG 0% → 100%`(청록 경로)와 `motionPath {path, align, alignOrigin [0.5, 0.5]}`(표시점)를 `duration 1, ease none`으로 겹치고 `scrollTrigger {trigger: .flight-path_wrap, start: "top bottom", end: "bottom top", scrub: true}` `[코드]`. 라이브 측정: 휠 300 px마다 칠해진 길이가 정확히 100.28 px씩 증가(경로 전체 607.4 px) `[런타임]`.
**구현 메커니즘**:
```
.travel-globe_component (검은 배경)
 └ .travel-globe_inner  y: 0 → +100svh (component top top → bottom top, scrub)   ← 지도 느린 시차
     yPercent: −5 → 0 (진입 구간)
   ├ img flight-path_large.jpg (1440:1721 비율, 전체 폭)          ← 위성 지도(정적 이미지)
   ├ .flight-path_wrap (폭 8.1 %, top 16 %, left 42.25 %)
   │   ├ svg path(흰색, viewBox 114×572)            ← 전체 경로
   │   ├ svg path(#6AF0FF, 같은 d) drawSVG 0→100 %  ← 지나온 경로
   │   ├ 시작점·끝점(작은 원)
   │   └ .flight-indicator(청록 원) motionPath로 경로 위 위치 = 진행률  (+ EFX-003-03 소나)
   └ 지명 라벨(absolute %, Cape Town / South Atlantic Ocean / Indian Ocean / Antarctica)
 └ .globe-sticky 카드: 정보 카드 y 0 → 40vh, 영상 카드 y 100svh → −20svh (서로 다른 시차)
p = (scroll − wrapTop + 100vh) / (100vh + wrapHeight)   // top bottom → bottom top, 선형
drawn = p × pathLength,  indicator = pointAt(path, p)
```
**파라미터**:
| 이름 | 값 | 출처 |
|---|---|---|
| 경로 SVG | `M68.8 0.24 C8.35 112.18 −66.62 315.31 112.92 571.10` (3차 베지어 1개), viewBox 114×572 | `[코드]` |
| 경로 화면 길이 | 607.4 px(1920 폭), 요소 높이 784 px | `[런타임]` |
| 칠 속도 | 0.334 px 경로 / 스크롤 px → 뷰포트 + 요소 높이(1,816 px) 동안 0 → 100 % | `[런타임]` |
| 지도 시차 | inner y 0 → 100svh over component — 측정상 지도는 스크롤의 약 0.55–0.89배로 이동 | `[코드]` `[런타임]` |
| 표시점 화면 위치 | 스크롤 1,800 px 동안 화면 y 1053 → 412 px(지도가 올라가는 만큼 점이 경로를 내려가 상쇄) | `[런타임]` |
| 표시점 크기 | `--size-0875`(약 14 px) 청록 원 | `[코드]` |
| scrub | `true` + Lenis lerp 0.1 | `[코드]` |
**타임라인**: 경로 요소가 화면 아래로 들어올 때 0 %, 화면 위로 나갈 때 100 %. 녹화 35–56 s(스크롤 약 19,000 → 21,550 px), 48–54 s에 사용자가 20,300 px에서 멈춤 `[영상]`.
**에셋**: `flight-path_large.jpg`(WebP 1920 w q90 = 100 KB) — 짙은 바다와 흰 대륙의 위성 이미지(남아프리카·남극 일부). 경로·점·라벨은 SVG·DOM이다 `[런타임]`.
**성능 기법**: 정적 이미지 1장 + SVG 경로 1개. `invalidateOnRefresh`로 크기 변화 시 다시 계산 `[코드]`.
**접근성·폴백**: reduced-motion 처리 없음. 모바일은 카드 배치가 세로 스택으로 바뀌고 카드 시차를 끔(`matchMedia(desktop)`에서만) `[코드]`.
**근거**: 설정 `[코드]`, 칠 길이·위치 `[런타임]`, 지각 `[영상]` `[대화]`.
**재현 요구사항**: GSAP DrawSVGPlugin + MotionPathPlugin(무료) 또는 직접 구현 — `path.getTotalLength()` + `stroke-dashoffset` + `getPointAtLength(p·L)`. 지도 배경은 NASA Blue Marble 등 공공 위성 이미지. 난이도 하.
**수용 기준**: (1) 칠한 길이 = 진행률 × 경로 길이(오차 1 px 이내), 되돌리면 같은 상태. (2) 표시점 중심이 칠한 끝점과 일치. (3) 스크롤하는 동안 표시점의 화면 y 변화가 지도의 화면 y 변화보다 작다(점이 화면에 "머무는" 느낌). (4) 멈추면 Lenis 보간으로 약 0.3 s 안에 정지. (5) **지난 경로와 남은 경로가 한눈에 구분된다** — 지난 경로는 굵고 채도 높은 청록, 남은 경로는 가늘고 흐린 흰색(2026-09-26 사용자 피드백으로 추가 `[대화]`). (6) 위 기준은 효과 구간 전체를 **최소 6장(권장 12장)** 균등 캡처로 레퍼런스와 대조해 확인한다(D-019) — 1–2장 확인에서는 (3)·(5)의 실패가 보이지 않았다(F-017).
**ECG 번안**: 가장 직접 쓸 수 있는 효과다. **파형 위를 지나가는 재생 헤드**로 옮길 수 있다 — 스크롤(또는 재생 시간)에 따라 지나온 구간을 청록으로 칠하고 표시점이 파형을 따라간다. 단, 칠하는 대상이 canonical 파형 곡선이어야 하고(장식 곡선을 데이터처럼 보이게 하면 안 됨), 시간축 대응(표시점 x = 실제 시각)을 지켜야 한다. 다른 쓰임: 신호 처리 단계(입력 → 필터 → 모델 → 출력)를 경로로 잇는 "방법 설명" 지도.
**재현 상태**: `spike` — `prototype/spikes/ref-repro/ref003.html` (2026-09-25; 2026-09-26 12장 대조로 대비·follow 매핑·dash 버그 수정, 컴포넌트 조합 변형 `ref003b.html`과 비교 — `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md`. 헤드리스 캡처 — 실제 GPU·스크롤 체감 미검증)

### EFX-003-03 멈춰 있어도 계속 퍼지는 소나 링

**선정 이유**: 사용자 지목("멈춰 있을 때도 일정한 시간 간격으로 마치 소나가 탐지하듯 위치가 나타나는 것이 wow 포인트"), 재사용 메커니즘.
**지각**: 표시점에서 청록 테두리 링 세 개가 잇따라 퍼져 나가며 옅어지고, 잠시 조용했다가 다시 퍼진다. 스크롤을 멈춰도 계속된다 — 화면이 "살아 있는 계기판"처럼 보이고 현재 위치로 시선을 끈다.
**입력 모델**: 시간.
**판별 근거**: 녹화 48–54 s에서 스크롤 속도 0인 동안에도 링이 반복된다 `[영상]`(10 fps 확대: 약 0.4 s에 첫 링 시작, 2.4 s에 다음 주기 시작). 소스 — CSS `@keyframes pulsed` 무한 반복, 스크롤과 연결 없음 `[코드]`.
**구현 메커니즘**:
```
.flight-indicator { --pulse-duration: 2s; --pulse-stagger: .2s; }
.flight-indicator_pulse i  × 3  (style="--index: 1|2|3")
  border: 1px solid #6AF0FF; border-radius: 50%; opacity 0; 가운데 정렬
  animation: pulsed 2s ease-out infinite;  animation-delay: index × 0.2s
@keyframes pulsed {
  0%     { opacity: 1; width: 100%; height: 100% }     // 점 크기에서 시작
  59.9%  { opacity: 0; width: 500%; height: 500% }     // 1.2 s 동안 5배로 퍼지며 사라짐
  60%,100% { opacity: 0; width: 100%; height: 100% }   // 0.8 s 쉼(보이지 않게 되돌림)
}
```
링 3개가 0.2 s 간격이라 한 주기에 "퍼지는 1.6 s + 조용한 0.4 s" 리듬이 생긴다.
**파라미터**:
| 이름 | 값 | 출처 |
|---|---|---|
| 주기 | 2.0 s | `[코드]` `[영상]` |
| 링 수·간격 | 3개, 0.2 s | `[코드]` |
| 확산 | 점 지름 × 1 → × 5, 주기의 0–59.9 %(1.2 s), ease-out | `[코드]` |
| 불투명도 | 1 → 0(확산과 함께) | `[코드]` |
| 선 | 1 px, #6AF0FF | `[코드]` |
**타임라인**: 페이지가 열려 있는 동안 무한 반복. 스크롤 위치(EFX-003-02)와 독립된 층이라 둘이 겹쳐 "스크롤로 이동 + 시간으로 숨쉬기"가 된다.
**에셋**: 없음(CSS만).
**성능 기법**: `will-change: width, height, opacity`, `backface-visibility: hidden`. 다만 width/height 애니메이션은 레이아웃을 건드린다 — `transform: scale()`이면 더 가볍다 `[추론]`.
**접근성·폴백**: reduced-motion에서도 계속 돈다(처리 없음) `[코드]`. 우리 재현에서는 reduced-motion일 때 링 1개 정지 표시로 바꿔야 한다.
**근거**: `[코드]`, `[영상]`, `[대화]`.
**재현 요구사항**: CSS 키프레임 1개(또는 Canvas 2D에서 반지름·알파를 시간 함수로 그리기). 난이도 하.
**수용 기준**: (1) 스크롤 속도 0에서도 2.0 s ± 0.05 s 주기로 반복. (2) 한 주기에 링 3개, 시작 간격 0.2 s. (3) 링이 최대 5배 지름에서 완전히 투명. (4) reduced-motion에서는 움직이지 않는다.
**ECG 번안**: "지금 여기" 표시에 좋다 — 실시간/재생 화면의 현재 시각 표시점, 비교 대상 선택 위치, 이상 구간 알림. 주기를 실제 심박(예: 저장 신호의 R-peak 간격)에 맞추면 의미 있는 박동 표시가 되지만, 그렇게 할 때는 실제 데이터에서 계산한 값만 쓰고 장식 주기와 섞지 않는다.
**재현 상태**: `spike` — `prototype/spikes/ref-repro/ref003.html` (2026-09-25, 헤드리스 캡처 — 실제 GPU·실측 수용 기준 미검증)

### EFX-003-04 안개 판이 기울어 올라오는 섹션 전환 (mist transition)

**선정 이유**: 장면 전환 — 빙벽 hero에서 흰 지도 머리글로 넘어가는 이음새.
**지각**: 빙벽 사진의 아래쪽에서 흰 안개가 앞으로 쓰러져 있던 판이 일어서듯 올라와 화면을 흰색으로 채우고, 그 위에 "TO THE END OF THE EARTH"가 나타난다.
**입력 모델**: 스크롤 위치.
**판별 근거**: 소스 — `gsap.fromTo(mistImage, {rotateX: 90}, {rotateX: 0, ease: "none", scrollTrigger: {start: "top top-=80%", end: "bottom center", scrub: true}})` `[코드]`. 녹화 33–35 s `[영상]`(되돌림으로는 확인하지 않음).
**구현 메커니즘**:
```
.mist-transition > .mist-transition_image-container(.visible) > img cloud-gradient.png
rotateX: 90° (화면과 수직으로 누움 = 안 보임) → 0° (정면) — 스크롤 scrub
원근(perspective)은 CSS에서 부여 — 값 미확인
```
**파라미터**:
| 이름 | 값 | 출처 |
|---|---|---|
| 회전 | rotateX 90° → 0° | `[코드]` |
| 구간 | 요소 top이 화면 top보다 80 % 뷰포트 더 지나간 때 → 요소 bottom이 화면 중앙 | `[코드]` |
| perspective | 미확인 — CSS 청크에서 `.mist-transition` 규칙을 찾지 못함 | — |
**타임라인**: 위 구간 선형(scrub true).
**에셋**: `cloud-gradient.png`(WebP 1920 w = 106 KB) — 아래가 불투명한 흰 안개 그라데이션 `[런타임]`.
**성능 기법**: 이미지 1장 + 3D transform(합성 레이어).
**접근성·폴백**: reduced-motion 처리 없음 `[코드]`.
**근거**: `[코드]`, `[영상]`.
**재현 요구사항**: 안개 그라데이션 PNG 1장 + `perspective` 부모 + rotateX scrub. 난이도 하.
**수용 기준**: (1) 스크롤 위치로만 결정. (2) 시작 시 판이 보이지 않고(90°), 끝에 정면(0°). (3) 전환이 끝나면 다음 섹션 흰 배경과 이음새가 없다.
**ECG 번안**: 어두운 데이터 화면 → 밝은 설명 화면 전환에 쓸 수 있다(예: 파형 뷰어에서 "방법 설명" 섹션으로). 판이 데이터 영역을 덮는 동안 측정값을 표시하지 않는다.
**재현 상태**: `spike` — `prototype/spikes/ref-repro/ref003.html` (2026-09-25, 헤드리스 캡처 — 실제 GPU·실측 수용 기준 미검증)

### EFX-003-05 스크롤로 드러나는 문장 마스크 (text scroll fade)

**선정 이유**: 재사용 메커니즘 — 흰 intro 문장이 읽는 속도에 맞춰 드러난다.
**지각**: 큰 세리프 문장의 아랫줄이 옅게 번진 상태에서, 스크롤을 내리면 위에서 아래로 차례로 또렷해진다.
**입력 모델**: 스크롤 위치.
**판별 근거**: 소스 — `gsap.fromTo(el, {"--mask-position": -40}, {"--mask-position": 100, ease: "none", scrollTrigger: {start: "top 80%", end: "bottom 60%", scrub: true}})` `[코드]`. 녹화 18 s의 반쯤 드러난 문장 `[영상]`.
**구현 메커니즘**:
```
.text-scroll-fade { mask-image: linear-gradient(... var(--mask-position) ...) }   // 마스크 CSS 원문은 미확인
CSS 변수 --mask-position: −40 → 100 을 scrub
```
**파라미터**:
| 이름 | 값 | 출처 |
|---|---|---|
| 마스크 위치 | −40 → 100 | `[코드]` |
| 구간 | 요소 top이 화면 80 % → 요소 bottom이 화면 60 % | `[코드]` |
| 그라데이션 폭 | 미확인 — mask CSS를 찾지 못함 | — |
**타임라인**: 위 구간 선형.
**에셋**: 없음.
**성능 기법**: CSS 변수 하나만 갱신.
**접근성·폴백**: reduced-motion 처리 없음. 마스크 미지원 브라우저는 문장이 그대로 보임 `[추론]`.
**근거**: `[코드]`, `[영상]`.
**재현 요구사항**: CSS mask-image + 변수 scrub. 난이도 하.
**수용 기준**: 스크롤 위치로만 결정되고, 구간 끝에서 문장 전체 불투명.
**ECG 번안**: 설명 문장(방법 요약·결과 해석)을 읽는 속도에 맞춰 드러낼 수 있다. 수치·단위가 들어간 문장은 처음부터 읽을 수 있게 두고 장식 문장에만 쓴다.
**재현 상태**: `spike` — `prototype/spikes/ref-repro/ref003.html` (2026-09-25, 헤드리스 캡처 — 실제 GPU·실측 수용 기준 미검증)

## 7. 에셋 목록과 조달 경로

| 레퍼런스 에셋 | 형식·용량 | 특수 처리 | 우리 조달 경로 |
|---|---|---|---|
| 구름 오버레이 2장 | PNG 원본 1920×1080 → WebP 96 KB·166 KB | 투명 배경, 위 투명·아래 빽빽 | CC0 구름 사진(Poly Haven HDRI 하늘 잘라내기, Unsplash 등 확인) 합성 또는 Blender 볼륨 구름 렌더 → 알파 PNG. `assets/registry.json`에 등록 |
| 안개 그라데이션 | PNG → WebP 106 KB | 흰 그라데이션 | 직접 생성(그라데이션 + 노이즈) |
| hero 영상 | mp4 4.42 MB, Cloudflare Stream(HLS + mp4) | 무음 반복 | 우리 연구·실험 영상 자체 촬영, 또는 파형 렌더 영상 |
| 위성 지도 | JPG → WebP 100 KB | 짙은 바다·흰 대륙 | NASA Blue Marble / Visible Earth(공공 도메인) |
| 경로·점·링 | SVG·CSS | — | 코드로 생성 |
| 사진(Sanity) | JPG 2000 px → WebP 최대 0.5 MB | `next/image` 반응형 | 우리 사진 |
| 글꼴 | Oswald 72 KB, Inter Tight 239 KB, Cardinal Classic 79–86 KB × 4 | Cardinal 상용 | Oswald·Inter Tight OFL(무료). 글꼴 교체는 deferred |

사이트 에셋 자체는 저장소에 복사하지 않았다(저작권).

## 8. 성능·접근성·폴백

| 항목 | 값 | 근거 |
|---|---|---|
| 페이로드 | 요청 135개, **약 13.6 MB**(스크립트 5.1 MB — 절반 이상이 HubSpot·reCAPTCHA·광고 태그, 영상 4.4 MB, 이미지 2.0 MB, 글꼴 0.64 MB). 자체 + 영상·Sanity 합계 약 8.7 MB | `[런타임]` |
| 렌더 | canvas 0, WebGL 없음 — GPU 요구가 낮다 | `[런타임]` |
| 레이어 | 구름·영상 `will-change: transform` | `[코드]` |
| reduced-motion | **없음**(JS·CSS 전체 0회) | `[코드]` |
| 모바일 | `svh` 단위, 카드 시차는 데스크톱에서만, Lenis syncTouch | `[코드]` |
| 폴백 | 영상 poster 이미지(Cloudflare 썸네일) | `[코드]` |

전시 PC 관점: WebGL이 없어 GPU 예산(P2)과 무관하게 재현할 수 있다. 우리 v2.2.1의 DOM/Canvas 2D 구조에 바로 얹을 수 있는 유형이다.

## 9. 레시피 후보

| ID | 이름 | 핵심 | 사례 |
|---|---|---|---|
| RCP-01 | Lenis 관성 스크롤을 단일 시간축으로 | Lenis 1.3.15(lerp 기본 0.1) + `gsap.ticker` + `lagSmoothing(0)` + `scrub: true` | EFX-003-01·02 (공통 레시피에 사례 추가) |
| RCP-15 | 고정 화면 위 다른 속도의 덮개 층 | 화면을 pin(또는 역방향 y)한 채 투명 PNG 층들을 서로 다른 속도로 올려 덮는 전환 — 깊이감은 속도 비에서 나온다 | EFX-003-01 |
| RCP-16 | 스크롤로 그리는 경로 + 따라가는 표시점 | 한 timeline에 `stroke-dashoffset`(drawSVG)과 `getPointAtLength`(motionPath)를 같은 진행률로 | EFX-003-02 |
| RCP-17 | 스크롤과 독립된 시간 루프 ("숨쉬는" 표시) | 스크롤로 위치가 정해지는 요소에 무한 시간 루프(링·맥동)를 겹쳐 정지 상태에서도 살아 있게 | EFX-003-03 |
| RCP-18 | 3D 기울기 판 전환 | 전환 이미지 rotateX 90° → 0° scrub | EFX-003-04 |
| RCP-19 | CSS 변수 마스크 scrub | `--mask-position`만 scrub해 문장을 드러냄 | EFX-003-05 |

**관찰**: REF-001·002와 달리 이 사이트의 wow는 모두 **WebGL 없이** 만들어졌다. "고품질 연출 = 3D"가 아니라, 좋은 재료(구름 PNG, 위성 사진, 영상)와 정확한 스크롤 매핑이 핵심인 경우가 있다.

## 10. 열린 질문

- 구름 PNG의 실제 알파 분포와 제작 방법(사진 합성 / 렌더)은 파일을 열어 보지 않아 추정이다.
- `.mist-transition`의 perspective 값과 `.text-scroll-fade`의 mask 그라데이션 CSS를 초기 CSS 청크에서 찾지 못했다(지연 로드 CSS로 추정). → 라이브에서 `getComputedStyle`로 확인 가능.
- 구름 층의 GSAP 값(`y: "-80%"`)과 측정 속도(화면 기준 0.9) 사이 변환(pin된 부모 기준 좌표)을 코드로 완전히 추적하지 않았다 — 재현에는 측정값을 쓴다.
- Rive 런타임이 어디에 쓰이는지 확인하지 않았다.
- 실제 GPU에서의 스크롤 프레임 안정성은 측정하지 않았다.
