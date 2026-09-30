# REFMINE-R1-INTRO-ASSET — 도입부 에셋 완성도·연출 레퍼런스 마이닝 (2026-09-30)

상태: **제안(L0–L1)** — 사용자 반응 대기. 구현·동결 아님. D-039에 따라 사용자가 남기는 방향만 구체화한다.
대상: `prototype/v2/src/story/intro/*` (지구 → 사람 → 심장 → sweep), 커밋 `23c9bbb` 기준.
연결: F-027, F-029, F-030, D-041, D-043, D-044, IDEA-R1-INTRO, IDEA-R1-WAVE, REF-001–010.

## 0. 요청과 증거 한계

> "spline3d, awwwards등 우수 웹 사이트를 학습해서 만든 건데, 에셋의 디테일적인 측면부터 활용 방식 아이디어까지 좀 부족한 듯 느껴져. … 10~15개 정도 우수 레퍼런스를 디테일하게 분석한 다음, … 에셋 자체의 완성도를 높일 수 있는 피드백이나 연출 방식을 트렌디하게 바꿀 수 있는 개선점 제시" — 사용자, 2026-09-30 `[대화]`

| 증거 | 내용 | 한계 |
|---|---|---|
| 우리 출력물 | 빌드본을 헤드리스 Chromium(SwiftShader)으로 띄워 p·t 고정 캡처 14장 + 실시간 휠 캡처 21장, 에셋 측정(정점 수·텍스처 해상도) `[런타임]` `[코드]` | 실시간 1.6–4 fps라 움직임의 부드러움은 판단 불가(L3 정지 화면까지) |
| 레퍼런스 12개 | 제작사 제작기·사례 연구(WebFetch), 홈페이지 HTML의 라이브러리 표식(curl), 공개 대표 이미지(og:image) `[코드]` | **외부 사이트 라이브 렌더 없음**: 헤드리스 Chromium이 프록시 CA를 신뢰하지 않음(R-016과 같은 원인). Awwwards·Codrops는 프록시/Cloudflare로 차단. 따라서 모든 레퍼런스 카드는 L1(소스·사례 연구) — **아래 "보는 법"으로 사용자가 직접 확인 필요** |

## 1. Creative Intent (검색 전 한 문장)

관람객이 첫 20초 동안 **"지구의 수많은 사람 중 한 사람 → 그 사람의 심장 → 그 심장이 만든 전기 신호"가 하나의 물체처럼 끊기지 않고 이어진다**고 느끼고, 그 심장이 실제 사물처럼 만져질 듯한 밀도를 가져야 한다.

## 2. 현재 출력물 진단 — "어디가 부족한가"를 쪼갠 결과

사용자가 말로 짚기 어렵다고 한 부족함을 층별로 나눴다. 캡처: `verification` 밖 스크래치(저장소 미포함), 대표 장면 번호는 채팅 시트 ①–⑧.

| # | 층 | 관찰 (수치) | 레퍼런스 기준과의 차이 |
|---|---|---|---|
| G-1 | **렌더 언어 불일치** | 지구 = 사진 텍스처 + 대기 산란(사실적), 사람 = 균일 굵기 흰 네온 튜브(그래픽), 3D 몸 = 가산 fresnel 선(홀로그램), 심장 = 붉은 fresnel(X선), 파형 = 네온 선. **한 장면 안에 다섯 가지 그림체** `[캡처]` `[코드]` figure.ts rimMaterial | Messenger·Oryzo·Igloo는 전체가 **하나의 재질·조명 언어**로 묶인다(RM-01·02·04). "덜 완성된 느낌"의 가장 큰 원인으로 판단 |
| G-2 | 심장 형태 | 구(`Sphere`)를 변형해 만든 메시, **정점 2,364개 / 삼각형 약 4,700개**. 대동맥궁이 구멍 뚫린 고리로 보이고(③⑤ 캡처), 관상동맥·심이(auricle)·폐동맥 분지·심첨 같은 해부학 표식이 없음 | Lando Norris 헬멧(Draco + Basis PBR, 다중 재질), Oryzo(사진측량 180장) 수준은 **표면 미세 정보**가 기본값 |
| G-3 | 심장 재질 | 조명 계산 없음, 가산 fresnel 테두리만(`uFill 0.018`). 두께감·반투명·젖은 하이라이트·내부 구조 없음 → "속이 빈 풍선" | 반투명 두께(흡수), 스페큘러 한 점, 내부 전도로(빛나는 길)로 **"살아 있는 물체"** 신호를 준다(RM-02·07) |
| G-4 | 사람 | MakeHuman 기본 메시 **정점 6,691개**, 네온 윤곽은 굵기·밝기 균일, 화면 하단에서 다리가 잘림(③). 얼굴·손·자세에 인물성 없음 → 마네킹 | Superpower·Neuralink·Prenuvo는 **실제 인물의 역광·자세**가 감정을 만든다(RM-08–10). 3D라면 점군/스캔 표현(Neko 스캔 미학)으로 "측정되는 몸"을 말한다 |
| G-5 | 지구 해상도 | NASA 2048×1024 텍스처 3장(주·야·구름). 화면 높이 이상으로 확대될 때 텍셀 밀도 부족, 바다 반사광·구름 그림자·지형 법선 없음 | Oryzo 원칙: **카메라가 보는 중앙 50 %에 텍스처 정보 90 %**. 또는 사진 대신 점 지구(RM-05·06)로 해상도 문제 자체를 없앰 |
| G-6 | 공간·대기 | 배경 `#000000` 평면, 안개·먼지·피사계 심도·그레인 없음. bloom 한 겹(초기 256², 이후 반 해상도) | ATMOS: 하늘 구 그라데이션 + 속도 반응 입자 + 값싼 방사 블러 DoF. Igloo: 서리 녹임 + 약한 색수차 — **공기가 있는 화면** |
| G-7 | 연결 방식 | 지구 → 사람 → 심장이 대부분 **투명도 교차 + 카메라 줌**. 480점 모핑(지구 윤곽 → 몸 윤곽)은 있으나 선 하나라 "같은 물체" 느낌이 약함 | Igloo 입자가 **모양을 바꿔 뭉침**, Oryzo **3D 물체가 그대로 2D UI 요소가 됨** — 장면 경계가 물체 변형으로 대체됨 |
| G-8 | 최종 구도 | 심장 왼쪽 · 파형 오른쪽 **양분 레이아웃**(⑦⑧) — 대시보드 인상. 파형이 심장에서 "나오지" 않음 | Oryzo "제품 중심"·"디자인은 계속 주의를 요구하면 안 된다", Lusion류는 주인공 1개 + 보조 |
| G-9 | 글자 | 비활성 라벨의 외곽선 글자에서 **가변 글꼴 윤곽 겹침선**이 보임(Pretendard Variable + `-webkit-text-stroke`, 2× 확대 캡처) — 이중 글자처럼 흔들려 보임 `[캡처]` | Igloo는 SDF 텍스트, Oryzo는 한 글꼴·4색 제한. 외곽선 대신 채움+낮은 명도, 또는 정적(비가변) 굵기 파일 사용 필요 |

## 3. 레퍼런스 카드 (12개)

ID는 이 문서 안의 마이닝 번호(RM-xx)다. 재현 대상으로 선택되면 `21_REFERENCE_EFFECT_RECORDS.md` 형식의 REF 효과 카드로 승격한다(REF-011–019는 파형 탐색 세션 예약 번호이므로 020 이후 사용). 모든 카드 Evidence = **L1**(라이브 렌더 미확인).

### RM-01 Oryzo AI — Lusion (Awwwards SOTM 2026-04)
- URL: https://oryzo.ai · 제작기 https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics , https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations
- Nature/Family/Granularity: shipped 캠페인 사이트 / Creative·Curated Web / full-site + 제작 과정
- **보는 법**: 첫 화면에서 코르크 받침이 책상 위 3D로 있다가, 스크롤하면 **같은 물체가 크기·위치를 바꿔 평면 UI 칸 안으로 들어가는 순간**만 보세요. 그다음 코르크 표면을 가까이 볼 수 있는 장면에서 구멍·결의 밀도를 보세요.
- 잊히지 않는 순간: 3D 물체와 2D 레이아웃이 한 번도 끊기지 않음.
- 메커니즘(제작기): 실물 코르크를 RAW **약 180장** 사진측량, 카메라 초점 영역인 **중앙 50 %에 텍스처 정보 약 90 %** 배분, Redshift로 조명 반복, 포장 찢김은 Houdini Vellum 시뮬레이션. UI는 **글꼴 한 가족 99 %, 색 4개**(크림·검정·올리브·주황). 원칙 "Realistic imagery / Product centrality / Seamless transitions", "Design cannot constantly ask for attention".
- 왜 통하나: 물체의 재질 신뢰도가 화면 전체 신뢰도가 된다. UI가 절제돼 물체가 주인공.
- ECG 번역: 심장을 **실재감 있는 단일 주인공**으로 만들고, 마지막에 심장이 크기를 줄이며 파형 무대의 한 요소(예: 격자 왼쪽 위 기준 아이콘 또는 sweep 시작점)가 된다 → G-8 해결.
- 베끼지 말 것: 책상 소품, 유머 톤, 올리브/주황 팔레트.
- Zone HIGH · Imitation Distance 3.

### RM-02 Igloo Inc — Abeto (Awwwards SOTY 2024)
- URL: https://www.igloo.inc · 사례 https://www.webgpu.com/showcase/igloo-inc-procedural-crystals/ , https://www.awwwards.com/igloo-inc-case-study.html · three.js 포럼 https://discourse.threejs.org/t/landing-site-igloo-inc/67249 (기존 REF-009는 HUD 글자 뒤섞임만 기록)
- **보는 법**: ① 프로젝트 섹션에서 얼음 블록 속 물체가 바뀔 때 **서리가 녹듯 전환되는 1초**, ② 맨 아래 링크 영역에서 **링크에 마우스를 올릴 때마다 입자 구름이 다른 3D 모양으로 뭉치는 동작**(입자 색이 속도에 따라 변함)을 보세요.
- 메커니즘: 절차적 결정 성장 알고리즘으로 얼음 블록 생성, 입자 목표 모양은 Houdini **VDB 볼륨 → 자체 압축 형식**(이미지 한 장보다 작음), UI 글자는 SDF 텍스처 오프셋 교체로 뒤섞음, 장면 전환에 약한 색수차. 스택 three.js · Svelte · GSAP · Houdini · Blender.
- 왜 통하나: 모양이 바뀌어도 **같은 입자**라는 연속성 + 속도가 색으로 보여 "움직임에 물리가 있다".
- ECG 번역: 지구 도시 불빛 점 → 사람 점군 → 심장 점군을 **같은 입자 집합**으로 잇는다(REF-006 객체 연속과 같은 원리). 속도→색은 "잡음 = 무질서, 제거 = 정렬"과 연결 가능(장식층 한정).
- 베끼지 말 것: 얼음·서리 소재, 회청색 팔레트, 전체 WebGL UI(우리는 DOM 글자 유지).
- Zone HIGH · Distance 3.

### RM-03 ATMOS — Leeroy (Awwwards 사례 연구, FWA)
- URL: https://atmos.leeroy.ca · 사례 https://www.webgpu.com/showcase/atmos-scroll-driven-flight-procedural-skies/ , https://www.awwwards.com/case-study-atmos.html
- **보는 법**: 첫 스크롤 10초 동안 **하늘 색이 구간마다 다른 팔레트로 넘어가는 것**과, 스크롤을 **빠르게** 굴릴 때만 나타나는 바람 입자를 보세요. 글자가 화면 위가 아니라 **하늘 공간 안에** 떠 있는 방식도.
- 메커니즘: 안쪽을 향한 하늘 구 + 애니메이션 Perlin 그라데이션 + 디자인팀 팔레트 시퀀스, 반구광이 하늘색을 따라감. 구름은 고폴리 Blender 모델 **2개**를 Draco 압축 후 인스턴싱. 비행 경로는 매 방문 재생성되는 Catmull-Rom. 바람 입자는 InstancedMesh, **스크롤 가속도**로 불투명도. DoF 대신 값싼 2D 방사 블러. 글자는 Troika 3D 텍스트.
- 왜 통하나: 색 대본(color script)이 이야기의 장(章)을 구분 — 글 없이 "다른 곳에 왔다"를 느낌.
- ECG 번역: 우주(차가운 남색) → 사람(역광 주황) → 몸 안(깊은 적색) → 심전도 용지(청록 격자)로 **배경 색 대본**. 스크롤 속도 반응 먼지로 공간감(G-6).
- 베끼지 말 것: 파스텔 하늘, 비행기, 코끼리 이스터에그.
- Zone HIGH · Distance 3–4.

### RM-04 Messenger — Abeto (Awwwards SOTD 2025)
- URL: https://messenger.abeto.co · 사례 https://www.webgpu.com/showcase/messenger/
- **보는 법**: 작은 행성 전체가 보이는 첫 화면에서 **건물·나무·해변이 모두 같은 셀 셰이딩·같은 외곽선 두께**로 그려진 점, 그리고 해변 물결 셰이더를 보세요.
- 메커니즘: three.js + three-mesh-bvh, Houdini·Blender 모델, Substance 텍스처, 초기 로드 **5.7 MB / 총 17.5 MB**, "해변 셰이더에 너무 오래 매달렸다".
- 왜 통하나: 사실성이 아니라 **일관성**이 완성도로 읽힌다. 작은 부분(해변) 하나에 집요하게 공들인 곳이 전체 품질 인상을 끌어올린다.
- ECG 번역: 사실적 지구 대신 **양식화된 한 그림체**로 지구·사람·심장을 통일하는 선택지(G-1). "집요하게 공들일 한 곳" = 심장의 R 순간.
- 베끼지 말 것: 카툰 캐릭터·게임 요소·파스텔.
- Zone HIGH · Distance 4.

### RM-05 GitHub globe — GitHub (엔지니어링 사례)
- URL: https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/ (실물은 github.com/home 비로그인 첫 화면)
- **보는 법**: 지구에 **육지 텍스처가 없고 점만 있는 것**, 지구 뒤쪽 가장자리의 부드러운 후광, 호(arc)가 궤도 높이를 달리해 뜨는 방식.
- 메커니즘: 남극부터 위도마다 원주에 비례해 **약 12,000개 오각 원**을 배치, 작은 세계지도 PNG를 `getImageData`로 읽어 육지만 표시. 후광 = 지구 **1.15배** 구의 뒷면 그라데이션 셰이더(약 0.03 rad 기울임). 텍스처 없이 **조명 4개**. 최소 **55.5 fps**(50프레임) 미달 시 4단계로 품질 하강(픽셀 밀도 2.0 → 1.5, 점 12,000 → 8,000). 로드 전 SVG 자리표시.
- ECG 번역: 도입 지구를 점 지구로 → 점이 곧 입자 연속(RM-02)의 재료가 되고, 심전도 용지 격자의 점 언어와 이어진다(G-5 해결).
- 베끼지 말 것: 분홍·파랑 PR 색, 호의 의미(우리 데이터 아님 — 가짜 데이터처럼 보이는 호는 금지).
- Zone HIGH · Distance 3.

### RM-06 Stripe globe — Stripe (디자인·엔지니어링 사례)
- URL: https://stripe.com/blog/globe
- **보는 법**: 점 간격이 극지방에서도 뭉치지 않고 고른 것, 점의 은은한 반짝임, 바다가 반투명 구로 깔린 층 구성.
- 메커니즘: 처음 **60,000점 → 서비스 국가 약 20,000점**, 해바라기(피보나치) 나선 배치 `phi = acos(-1 + 2i/N)`, `theta = sqrt(N·π)·phi`. 층 = 반투명 바다 구(약 50분할) + 반짝이는 점 + 호(반지름 0.5 px, 8면, 44분할 튜브). `antialias` 끄기로 고해상도 병목 해소.
- ECG 번역: RM-05와 같음. 추가로 **해바라기 배치** 덕분에 점 개수를 바꿔도(모핑 대상 사람·심장과 같은 N) 분포가 고르다.
- 베끼지 말 것: 국가별 색, 결제 호.
- Zone HIGH · Distance 3.

### RM-07 Lando Norris — OFF+BRAND (Awwwards SOTY)
- URL: https://landonorris.com · 사례 https://www.itsoffbrand.com/our-work/lando-norris
- **보는 법**: 헬멧 3D가 나오는 구간에서 **헬멧 재질(도장·카본·바이저)의 반사가 스크롤·포인터에 따라 변하는 것**과, 헬멧 디자인이 바뀔 때 전환 방식.
- 메커니즘(사례): three.js, **Draco 메시 + Basis Universal GPU 텍스처**, 다중 변형 PBR 셰이더 재질, Rive 모션, Webflow + Lenis(HTML 표식 `[코드]`).
- 왜 통하나: 주인공 물체 하나에 PBR 재질 여러 겹을 제대로 주면 화면이 "제품급"으로 읽힌다.
- ECG 번역: 심장에 **KTX2(Basis) 법선·거칠기 맵 + 두께 기반 반투명**(G-2·G-3). 전환 때 재질 변형(피부 → X선 → 전도로 발광)을 같은 메시 위에서.
- 베끼지 말 것: 네온 노랑, 서명 낙서, 레이싱 모티프.
- Zone HIGH · Distance 3.

### RM-08 Superpower (건강 멤버십)
- URL: https://superpower.com
- **보는 법**: 첫 화면의 **큰 주황 원(해/빛) 앞 인물 옆얼굴 역광** 구도(대표 이미지와 같은 장면)와, 그 뒤 섹션들이 사진 중심으로 넘어가는 속도.
- 메커니즘: Webflow + GSAP 3.15(CustomEase·Flip·Observer·ScrollTo) + Lenis `[코드]`(HTML 표식). 3D 아님 — **사진 조명 연출**이 핵심.
- 왜 통하나: 역광 원 하나로 "사람 = 빛나는 존재"가 3초 안에 전달된다. 우리 "역광 지구 → 사람"과 같은 은유를 훨씬 따뜻하게 씀.
- ECG 번역: 지구 역광 테두리가 **그대로 사람 뒤 광원 원반**이 되는 match cut(REF-001 역광 지구 수치 유지). 사람은 네온 선 대신 **역광 실루엣(가장자리만 밝은 어두운 몸)**.
- 베끼지 말 것: 실제 인물 사진(초상권), 주황 브랜드색 그대로.
- Zone HIGH · Distance 3.

### RM-09 Prenuvo (전신 MRI)
- URL: https://www.prenuvo.com
- **보는 법**: 스크롤 중 **가로로 넘어가는 패널 구간**(data-horizontal-scroll-panel)과 제목이 교체되는 순간(outgoingTitle) — 의료 정보를 한 장씩 넘기는 리듬. 가능하면 MRI 영상이 나오는 구간의 크기·여백.
- 메커니즘: Webflow + GSAP 3.15(ScrollTrigger·SplitText) + Lenis 1.2.3 `[코드]`.
- 왜 통하나: **실제 의료 영상**이 장식이 아니라 증거로 쓰여 신뢰를 만든다.
- ECG 번역: 몸 → 심장 구간에 **단면 스캔 평면**이 위에서 아래로 지나가며 심장을 드러내는 연출(MRI 슬라이스 은유). 단, 실제 환자 영상처럼 보이면 안 됨 → "합성·예시" 표기.
- 베끼지 말 것: 실제 MRI 이미지, 자전거 인물 사진.
- Zone HIGH · Distance 3–4.

### RM-10 Neuralink
- URL: https://neuralink.com
- **보는 법**: 첫 화면의 **다큐멘터리 인물 사진 + 가는 산세리프 헤드라인 + 한 단어만 굵게**("pioneers.") 구성, 그리고 이후 기기·수술 로봇 이미지를 얼마나 절제해 배치하는지.
- 메커니즘: 소형 HTML(Vite류 번들) `[코드]`. 핵심은 사진·타이포 연출.
- 왜 통하나: 과학 기술을 **사람 이야기로** 먼저 보여 준다. 헤드라인 한 단어 강조가 D-044의 "크기·굵기 대비"와 같은 원리.
- ECG 번역: 제목 "심전도 잡음 제거"에서 한 단어만 대비(이미 '잡음' 떨림 T2 있음) — 굵기 대비 추가. 사람 장면에 "한 사람"을 느끼게 하는 자세·시선 한 가지.
- 베끼지 말 것: 실제 환자 사진, 브랜드 로고 곡선.
- Zone HIGH/MEDIUM · Distance 4.

### RM-11 Active Theory (스튜디오 사이트)
- URL: https://activetheory.net
- **보는 법**: 첫 화면 작품 이미지들에서 **유리 굴절 + 홀로그램 반사 + 반짝이는 먼지 입자**가 한 장면에 겹친 질감(대표 이미지와 같은 계열), 작품 사이 전환.
- 메커니즘: 자체 WebGL 엔진(Hydra) `[추론]` — 소스 미분석.
- 왜 통하나: 굴절·먼지 같은 **2차 광학 효과**가 물체 표면의 "고급감"을 만든다.
- ECG 번역: 심장을 둘러싼 **미세 먼지·빛 산란**(G-6), 투명 몸 재질의 굴절 가장자리.
- 베끼지 말 것: 보라·청 홀로그램 팔레트, 작품 이미지.
- Zone HIGH · Distance 4. Evidence 가장 약함(L0–L1).

### RM-12 Spline Community "heart" (Spline 제작 장면)
- URL: https://community.spline.design/file/658bbc9d-b0ad-4b77-8b7f-3653c747d465
- **보는 법**: 파일을 열어 **재질 패널**(Glass/Matcap/Fresnel 레이어 스택)을 보세요. Spline 특유의 "부드러운 점토 + 유리" 질감이 어느 레이어 조합에서 나오는지.
- 메커니즘: 미확인(클라이언트 렌더라 컨테이너에서 열지 못함). Spline 재질은 레이어 합성(색·조명·fresnel·굴절·노이즈) 구조 `[추론]`.
- 왜 참고하나: 사용자가 Spline을 학습 출처로 명시. Spline 장면은 **해부학 정확도 대신 재질 레이어 합성**으로 완성도를 만든다 — 우리 심장이 fresnel 한 겹뿐인 것과의 차이를 직접 비교할 수 있다.
- ECG 번역: 심장 셰이더를 레이어 구조로(기본색 + 두께 흡수 + fresnel + 스페큘러 + 발광 전도로).
- Zone HIGH · Distance 2–3(재질 조합은 메커니즘 차용). **사용자 확인 필수.**

## 4. 레퍼런스들에서 공통으로 나온 원리

| 원리 | 근거 | 우리 현재 |
|---|---|---|
| P1 **그림체 하나** — 재질·조명·후처리를 한 체계로 | RM-01·02·04·07 | 다섯 체계(G-1) |
| P2 **주인공 하나에 디테일 집중** — 중앙에 정보 90 % | RM-01·04·07 | 해상도·폴리곤이 전 에셋에 고르게 낮음 |
| P3 **물체 변형으로 장면 전환** — 교차 페이드가 아니라 같은 물체의 모양·크기 변화 | RM-01·02·05·06, REF-006 | 투명도 교차 중심(G-7) |
| P4 **공기** — 색 대본, 먼지, DoF, 그레인 | RM-03·11, REF-002 | 평면 검정(G-6) |
| P5 **UI 절제** — 한 글꼴·적은 색, 물체가 말하게 | RM-01·10 | 양분 레이아웃, 라벨 외곽선 결함(G-8·G-9) |
| P6 **성능 설계를 처음부터** — 품질 단계·압축 형식 | RM-04·05·06·07 | 품질 단계 없음, 전시 PC 미정(P2) |

## 5. 에셋 완성도 개선안 (A — 에셋 자체)

| ID | 대상 | 제안 | 근거 | 비용 | 데이터 계약 |
|---|---|---|---|---|---|
| A1 | 심장 형태 | 해부학 원본에서 다시 제작: **BodyParts3D**(DBCLS, CC BY-SA 2.1 JP) 또는 **Z-Anatomy**(CC BY-SA 4.0), NIH 3D 모델(개별 라이선스) 중 택1(라이선스 조건은 받기 전 재확인) → Blender 리토폴로지 3–6만 삼각형 + 고해상도에서 **법선 맵 bake**(관상동맥·근육 결) → Draco + KTX2. 심이·대동맥 분지·폐동맥·심첨 표식 확보 | RM-07·12, G-2 | 중(1–2일) | 장식층. 라이선스 BY-SA는 에셋 파일에만 적용 — 등록부·표기 필요(D-031) |
| A2 | 심장 재질 | fresnel 한 겹 → **레이어 셰이더**: 두께 기반 흡수(뒷면 깊이 차로 가짜 SSS) + 젖은 스페큘러 한 점 + 약한 fresnel + **전도로 발광**(동방결절 → 방실결절 → 심실, R 전 약 0.2 s에 출발해 R에 심실 도착) | RM-02·07·12, G-3 | 중 | 박동 시각은 기존대로 저장 기록의 R(beats.ts). 전도 경로·PR 간격은 **예시 연출**로 표기, 파형과 수치 연결 주장 금지 |
| A3 | 사람 | 네온 튜브 → (a) **점군 몸**(표면에서 해바라기 샘플 N점, RM-02 입자 연속의 중간 모양) 또는 (b) **역광 실루엣**(어두운 몸 + 가장자리만 밝음, 선 굵기가 빛 방향에 따라 변함). 다리가 잘리지 않는 구도 또는 의도적 크롭(가슴 위) | RM-02·08, G-4 | (a) 중 (b) 소 | 없음 |
| A4 | 지구 | (a) 사실형 유지 시: 보이는 반구만 4K–8K KTX2, 바다 반사광 마스크, 구름 그림자 오프셋, 야간 불빛 bloom 분리 / (b) **점 지구**: 해바라기 배치 2만 점 + 육지 마스크 + 1.15배 뒷면 후광(REF-001 역광 수치 유지) | RM-01·05·06, G-5 | (a) 소 (b) 중 | 없음 |
| A5 | 공통 룩 | 한 체계로 통일: 조명 리그 1개(역광 키 + 약한 채움), 색 대본 4단(§6 I3), 필름 그레인 1–2 %, 약한 색수차(가장자리만), 반 해상도 bloom → 다단 bloom(mip) | RM-02·03·04, G-1·G-6 | 소–중 | 후처리는 WebGL 층에만 — Canvas 2D 파형 층 제외(현재 규칙 유지) |
| A6 | 라벨 글자 | 비활성 외곽선 → 채움 + 명도 32 %, 또는 정적 굵기 파일(비가변)로 stroke. 가변 글꼴 + text-stroke 금지 규칙화 | G-9 | 소 | 없음 |

## 6. 연출 개선 아이디어 (I — 쓰는 방식)

| ID | 이름 | 목표 경험 | 레퍼런스 | ECG 번역 | 3초 인상 | 구현 힌트 | 위험 | 비용 |
|---|---|---|---|---|---|---|---|---|
| I1 | **한 무리의 빛** | 지구의 불빛 하나하나가 모여 한 사람이 되고, 그 사람의 심장이 된다 | RM-02·05·06, REF-006 | 점 지구의 도시 불빛 N점 → 사람 점군 → 심장 점군. 같은 입자 ID로 GPGPU(FBO) 위치 보간, 점별 지연 | "수많은 사람 중 한 사람의 심장" | three.js GPGPU 위치 텍스처 3개(지구·몸·심장) 사이 보간, N ≈ 16–32k | 입자 = 데이터로 오해(→ 파형 등장 전까지 라벨 없음) | 중–대 |
| I2 | **심장에서 흘러나오는 선** | 파형이 옆 패널이 아니라 심장에서 나와 종이 위에 눕는다 | RM-01(3D→2D) | R마다 심장 전도 빛이 한 줄기로 빠져나와 sweep 머리에 닿고, 심장은 작아져 격자 왼쪽 위 기준점이 됨 | "이 선이 저 심장의 신호" | 심장 화면 좌표 → 격자 좌표 경로(곡선), 파형 꼭짓점은 저장 표본 그대로(현재 sweep.ts) | 선이 데이터 궤적처럼 보이면 안 됨 — 경로는 파형 **밖**에서만 | 중 |
| I3 | **색 대본** | 장면이 바뀐 것을 글 없이 안다 | RM-03·08 | 우주 남색 → 역광 주황(사람) → 심장 적색 → 용지 청록 | "여행하는 느낌" | 배경 구/전체 화면 셰이더 그라데이션 + 반구광 색 연동, 스크롤 p 함수 | 파형 색(입력 주황·출력 청록)과 충돌 → 파형 등장 전 주황 퇴장 | 소 |
| I4 | **역광 원반 match cut** | 지구 테두리 빛이 사람 뒤의 해가 된다 | RM-08, REF-001 | 지구 역광 링이 축소되며 원반 → 그 앞에 역광 실루엣 사람 | "빛 속의 사람" | 기존 rim 셰이더 파라미터를 원반으로 보간, 실루엣은 A3(b) | 적음 | 소 |
| I5 | **스캔 평면** | 몸 안을 들여다보는 순간 | RM-09 | 가로 빛 평면이 몸을 위→아래로 지나가며 지나간 곳만 X선 재질로 바뀌고 심장이 드러남 | "진단 장비가 나를 본다" | 재질에 평면 높이 uniform, 경계에 얇은 발광 띠 | 실제 의료 영상 주장 금지(표기) | 소–중 |
| I6 | **공기 입자** | 공간이 비어 있지 않다 | RM-03·11 | 심장 주변 미세 먼지, 스크롤 가속도에 따라 흐름 | "깊이" | InstancedMesh 2–4k, 불투명도 = 스크롤 속도 | 잡음 입자처럼 보이면 의미 충돌 → 파형 무대에서는 정지 | 소 |
| I7 | **주인공 한 곳 집요하게** | "여기에 공들였다"가 보이는 한 점 | RM-04 | R 순간 1프레임: 심장 전도 도착 + 파형 R 피크 + 격자 섬광이 동시에(현재 동기화 위에 광학 효과 한 겹) | "딱 맞아떨어짐" | 기존 W4 동기 프레임에 bloom 펄스·색수차 0.3 px 펄스 | 과하면 싸 보임 — 1회 감쇠 | 소 |
| I8 | **서리 녹임 전환** | 장면이 녹아서 바뀐다 | RM-02 | 몸 → 심장 전환에 노이즈 임계값 녹임(투명도 교차 대체) | "물질이 바뀜" | 재질에 dissolve 노이즈 + 경계 발광 | 적음 | 소 |

## 7. 추천 조합 (AI 제안 — 결정은 사용자)

- **1순위 (구조)**: I1 한 무리의 빛 + I2 심장에서 흘러나오는 선 — "끊기지 않는 한 물체"라는 Creative Intent에 가장 직접적. 에셋은 A4(b) 점 지구 + A3(a) 점군 몸 + A1·A2 새 심장.
- **2순위 (저비용 즉시 효과)**: A5 룩 통일 + A6 라벨 + I3 색 대본 + I4 역광 원반 — 기존 구조를 유지한 채 "그림체 다섯 개" 문제를 줄임.
- **보류 후보**: I5 스캔 평면(I1과 겹침), I8 서리 녹임(I1 채택 시 불필요).

Validator 메모: 모든 안이 파형 꼭짓점·시간축·단위·저장 수치를 바꾸지 않는다. I1·I6 입자와 I2 경로는 파형 무대 **밖**의 장식층이며, 파형 등장 이후에는 데이터처럼 읽힐 위치에 두지 않는다. A2 전도 경로는 "예시" 표기.

## 8. 사용자에게 묻는 것

1. RM-01·02·03·08 중 **직접 봤을 때 "이거다"** 싶은 장면이 있는지(보는 법 참고). Spline heart(RM-12)는 컨테이너에서 열지 못해 꼭 직접 봐 달라.
2. 그림체 방향: **사실형 통일**(A4a, 해부학 심장, 역광 사진 느낌) vs **점·빛 통일**(A4b + I1, 입자 언어) vs 혼합.
3. 1순위(구조 변경, 비용 큼) vs 2순위(현 구조 보강)부터 할지.

## 9. 출처

- Lusion, Oryzo BTS Part 2 — https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics
- Lusion, Oryzo BTS Part 3 — https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations
- Lusion project page — https://lusion.co/projects/oryzo_ai/
- WebGPU showcase: Igloo Inc — https://www.webgpu.com/showcase/igloo-inc-procedural-crystals/
- Awwwards: Igloo Inc case study — https://www.awwwards.com/igloo-inc-case-study.html
- WebGPU showcase: ATMOS — https://www.webgpu.com/showcase/atmos-scroll-driven-flight-procedural-skies/
- Awwwards: Case Study ATMOS — https://www.awwwards.com/case-study-atmos.html
- WebGPU showcase: Messenger — https://www.webgpu.com/showcase/messenger/
- GitHub Blog, How we built the GitHub globe — https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/
- Stripe Blog, globe — https://stripe.com/blog/globe
- OFF+BRAND, Lando Norris — https://www.itsoffbrand.com/our-work/lando-norris
- Spline Community heart — https://community.spline.design/file/658bbc9d-b0ad-4b77-8b7f-3653c747d465
- 사이트: https://oryzo.ai · https://www.igloo.inc · https://atmos.leeroy.ca · https://messenger.abeto.co · https://landonorris.com · https://superpower.com · https://www.prenuvo.com · https://neuralink.com · https://activetheory.net
