# REF-003 지나온 경로 수정 · 외부 UI 컴포넌트 A/B · 추가 에셋 조달처 (2026-09-26)

연결: REF-003 (`references/REF-003_WHITE_DESERT.md`), F-017, D-019, D-020, D-021, CASE-006,
`REFERENCE_REPRO_AND_QUALITY_GAP_2026-09-25.md` §4.1(P6), `ATTIC_BOOKSHELF_STUDY_2026-09-25.md`.
모든 화면 값은 **demo content** — 실제 탐사 경로·진행 데이터가 아니다.

## 1. 사용자 피드백

> "레퍼런스 3는 아래로 위치 표시기가 이동함에 따라 표시지점 뒤, 즉 위치 표시기가 이동한 곡선을 이미 지난 경로라는 것을 알 수 있게 다른 색으로 확실하게 표시해줬는데, 우리 구현에서는 그 부분의 디테일이 부족하네. … 아마도 여러 장을 확인하지 않아서 그런 느낌. 한 대여섯장 이상은 확인해봐야 할 것 같은데?" `[대화]`

## 2. 12장 대조로 드러난 결함 (이전 구현)

레퍼런스 녹화 38 s–60 s 구간 12장과 우리 캡처 12장을 같은 스크롤 비율로 나란히 놓았다(비교 이미지는 레퍼런스 프레임이 들어 있어 저장소 밖에 둔다) `[캡처]`.

| # | 결함 | 1–2장 확인에서 보였나 | 원인 | 수정 (A, vanilla) |
|---|---|---|---|---|
| 1 | 지난 경로와 남은 경로 구분이 안 된다 | 아니오 — 한 장에선 "청록 선이 있다"로 보임 | 남은 경로 흰색 80 %·1.4 px가 청록 2 px와 밝기가 거의 같음 | 남은 경로 흰색 불투명도 .38·1 px, 지난 경로 청록 2.6 px + glow |
| 2 | 4번째 프레임부터 표시기가 화면 밖으로 나간다 | 아니오 — 첫 장·중간 한 장은 정상 | 고정 ScrollTrigger 구간이 지도 parallax(0.55 vh)와 맞지 않음 | **follow 매핑**: 표시기의 화면 y가 0.56 vh가 되는 경로 비율 p를 매 프레임 이분 탐색(경로 양 끝에서 clamp) |
| 3 | 청록 선이 두 토막으로 갈라진다 | 아니오 — 수정 1 이후 12장에서 처음 보임 | `vector-effect: non-scaling-stroke`가 DrawSVG의 dash 길이를 화면 단위로 바꿈 | vector-effect 제거 (motion `pathLength`는 영향 없음) |

수정 후 표시기 화면 y(1600×900, 12장) `[테스트]`:

```text
A  1501 1270 1038 834 645 500 483 473 470 468 440 318
B  1345 1269 1038 835 645 504 501 501 501 503 452 337
```

앞 5장은 경로 시작점이 아직 0.56 vh 아래에 있는 구간(표시기가 시작점에 머물며 지도와 함께 올라옴), 마지막 2장은 끝점 clamp 구간이다. 가운데 구간은 레퍼런스처럼 화면 중앙 부근에 붙어 있다.

## 3. 외부 UI 컴포넌트 조사

| 사이트 | 무료 접근 | 이 환경 접근 | 형태 | 라이선스 | 판단 |
|---|---|---|---|---|---|
| Behance | 열람 무료 | **403** | 작품 이미지(코드 없음) | 작품별 저작권 | 영감 전용. 컴포넌트 공급원이 아님 |
| Superdesign | 계정 필요 | 로그인으로 redirect | AI 생성 초안 | 서비스 약관 | 이전 DUAL-ATTRACT 시험에서 충실도 부족(14/15/16 역사 자료) — 이번엔 제외 |
| Magic UI | 무료 | 가능 (registry JSON) | React + Tailwind + motion 코드 | **MIT** | 채택 가능 → Ripple 사용 |
| Aceternity UI | 무료 컴포넌트 | 가능 | React + motion | 최종 결과물 사용 허용, 소스 재배포 금지 | **기법만 참고**(Tracing Beam 그라디언트), 코드 사본 없음 |
| React Bits | 무료 | 가능 | React | MIT + Commons Clause(재판매·재배포 금지) | 조건부. 이번엔 해당 컴포넌트 없음 |
| Uiverse · CodePen | 무료 | **403** | HTML/CSS 조각 | 작성자별(Uiverse MIT) | 이 환경에서 못 씀 |

## 4. A(직접 제작) vs B(컴포넌트 조합) — 같은 데이터·같은 지도

B: `prototype/spikes/ref-repro/ref003b.html` — React 19 + motion 13 (`useScroll`·`useSpring`·`pathLength`) + Tailwind 4 + `lenis/react` + Magic UI Ripple(MIT, `ringStep` prop 1개 추가) + Tracing Beam식 그라디언트.

### 4.1 동작 (12장 + 대기 소나 12장, 170 ms 간격)

| 기준 | A | B | 근거 |
|---|---|---|---|
| 지난/남은 경로 대비 | PASS | PASS (+ 머리 쪽 밝은 그라디언트) | 12장 `[캡처]` |
| 표시기 화면 중앙 유지 | PASS | PASS | y 수열 위 `[테스트]` |
| **정지 시 소나 (wow 포인트)** | PASS — 2 s 주기로 퍼지며 사라지는 링 | **FAIL** — Ripple은 제자리에서 숨 쉬듯 커졌다 작아지는 정적 링. 퍼져 나가는 탐지 느낌이 없음 | `verification/route-ab-20260926/sonar-A-top-B-bottom.jpg` |
| dash 버그 | 수정 필요했음(vector-effect) | 없음(`pathLength`는 정규화 길이) | #3 |
| 도메인 로직 | 직접 작성 | **똑같이 직접 작성** — 컴포넌트는 "요소의 스크롤 진행률"만 주고 "점을 화면 중앙에 붙이는" 매핑은 없다 | `main.tsx` follow solve |
| 컴포넌트 수정 | — | Ripple 링 간격 70 px 하드코딩 → prop 추가. 소나로 쓰려면 keyframe 자체를 다시 써야 함 | `components/ui/ripple.tsx` 머리 주석 |

### 4.2 비용 (`vite build`, 2026-09-26) `[테스트]`

| | A — REF-003 **페이지 전체**(히어로·구름·경로·카드) | B — **경로 구간만** |
|---|---|---|
| JS | 141.8 KB / gzip 57.0 KB | 395.4 KB / gzip 126.2 KB |
| CSS | 7.8 KB / gzip 2.6 KB | 15.8 KB / gzip 3.9 KB |
| 코드 줄 수(경로 부분) | ref003.ts 94 + css 62 (페이지 전체) | main.tsx 110 + style 6 + ripple 63 |
| 추가 의존성 | 없음(GSAP·Lenis 기존) | react, react-dom, motion, tailwindcss, clsx, tailwind-merge, @vitejs/plugin-react(5.2 고정 — 6.x는 vite 8 요구) |

### 4.3 결론 — 외부 컴포넌트가 직접 제작보다 나은가

**레퍼런스 충실도가 목표인 효과에서는 아니다.** 근거: ① 핵심 wow(정지 소나)를 컴포넌트가 다른 의미로 구현해 다시 써야 했고, ② 가장 어려운 부분(follow 매핑)은 어느 라이브러리에도 없어서 B에서도 손으로 썼고, ③ 같은 결과에 2배 이상 번들과 스택 추가가 들었다.

**얻은 것도 있다.** motion의 `pathLength`가 A가 밟은 dash 버그를 피했고, Tracing Beam의 "머리가 밝은 그라디언트"는 A에 가져올 만한 연출이다. 즉 외부 컴포넌트는 **기법·아이디어 공급원**으로 쓰고, 채택 전에 같은 12장 대조를 통과시킨다(D-021). React 화면(P5 hybrid의 UI 층)에서 버튼·필터·카드처럼 레퍼런스 고유 효과가 아닌 범용 UI라면 MIT 컴포넌트가 시간을 줄일 수 있다 — 이번 실험의 범위 밖이며 P5 결정 때 다시 본다.

## 5. 추가 에셋 조달처 조사

2026-09-26 이 컨테이너에서 직접 확인 `[런타임]`.

| 조달처 | 종류 | 라이선스 | 접근 | 자동 받기 | 쓸모 |
|---|---|---|---|---|---|
| Poly Haven | HDRI, PBR 질감, 모델 | CC0 | API | `polyhaven` (기존) | 조명·반사, 소품 |
| **ambientCG** | PBR 질감 2,000+(나무 330 등), HDRI, 일부 모델 | **CC0** | API v2 `full_json` + zip(CDN redirect) | **`ambientcg` 추가**, API 크기 대조 | 책장·벽·바닥 재질 — Poly Haven에 없는 변형이 많음 |
| **Openverse** | CC 사진 검색 색인(Flickr 등) | 항목별(CC0/BY/…) | API(키 없음) | **`openverse` 추가**, 받을 때마다 API 라이선스 재확인 | 구름·하늘·풍경 사진판, 참고 사진 |
| Kenney | 로우폴리 모델·UI 스프라이트 | CC0 | 사이트 가능 | 미구현(zip 수동) | 단순 소품·아이콘 |
| Quaternius | 로우폴리 모델 팩 | CC0 | 사이트 가능 | 미구현 | 배경 소품 |
| threedscans | 3D 스캔 조각상 | 무제한 무료(사이트 명시) | 사이트 가능 | 미구현 | 조형물 |
| Mixkit | 영상·음원 | Mixkit 라이선스 | 사이트 가능 | 미구현 | 배경 영상 후보 |
| OpenGameArt | 게임 에셋 | 항목별 혼재 | 사이트 가능 | 미구현 | 항목별 라이선스 확인 부담 큼 |
| Sketchfab | 모델 | 항목별(CC0/BY/NC) | 열람 가능, 받기엔 계정 토큰 | 미구현 | 고품질 모델 — 토큰 제공 시 |
| NASA / Smithsonian | 위성영상, 3D 스캔 | 공공 | NASA 일부만, Smithsonian 403 | `url` | 지구·지도 |
| Pexels / Unsplash | 사진·영상 | 자체 라이선스 | API 키 필요 | 미구현 | 키 제공 시 |
| Poly Pizza | 로우폴리 모델 | CC0/BY | **403** | — | — |

시험: `mat-ambientcg-wood095-1k`(3,882,297 B zip, Color·NormalGL·Roughness 등 10개 파일)와 `photo-openverse-cumulus-wing`(124,268 B)를 `node scripts/assets/fetch.mjs --pin --only=…`로 받고 sha256 고정 → 두 번째 실행에서 해시 재검증 PASS `[테스트]`. 둘 다 `test-only`, 어느 페이지도 아직 쓰지 않는다.

**탐색 순서에 명시하면 이득인가 — 그렇다(D-020).** 한 곳만 보면 재질 변형이 제한되어 다락방처럼 "빈 느낌이 들지 않게 채우는" 장면에서 반복이 눈에 띈다. ambientCG는 같은 CC0 조건에 변형이 훨씬 많고, Openverse는 사진판을 검색 한 번으로 라이선스와 함께 준다. 명시하지 않으면 AI는 이미 쓴 소스로 되돌아가는 경향이 있었다(지금까지 registry의 외부 원본은 Poly Haven·NASA·npm/Khronos 묶음뿐) `[코드]` `[추론]`. 비용은 조회 몇 번이다. 단, 라이선스 항목별 확인이 필요한 곳(OpenGameArt·Sketchfab·Openverse의 BY 항목)은 registry의 `licence`·`attribution`을 반드시 채운다.

## 6. 검증과 한계

- `tsc --noEmit` + `vite build` PASS (A·B 둘 다) `[테스트]`. 캡처는 헤드리스 SwiftShader, 1600×900.
- 스크롤 스무딩(A: follow 0.35 lerp, B: spring 500/90)의 체감 차이는 프레임 캡처로 판정할 수 없다 — 실제 브라우저에서 사용자 확인 필요.
- 모바일·터치·reduced-motion 실기기 미검증.
- B는 비교용 spike로 남긴다. 제품 경로로 채택하지 않는다.
