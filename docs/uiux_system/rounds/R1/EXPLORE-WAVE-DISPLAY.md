# EXPLORE-WAVE-DISPLAY — 파형 표시 연출 탐색 (별도 탐색 세션)

형식: `20` Step 5A (D-039) 공동 구상 · 브리프 `../../handoffs/EXPLORE_BRIEF_WAVE_DISPLAY_2026-09-30.md`
시작: 2026-09-29(세션 시계 기준; 브리프 작성일 2026-09-30과 같은 작업 흐름) · branch `claude/wave-display-explore`(기준 커밋 `23c9bbb`)
상태: **후보 목록 제시 — 사용자 선택 대기**
소유 범위: 이 문서와 `references/REF-011`–`REF-019`만 새로 쓴다. 색인·F/D/O/R·PLAN·WORKLOG·WORK_STATE·`prototype/v2/src/**`는 수정하지 않는다(브리프 §4). 레시피 번호는 `RCP-40`부터.

## 0. 탐색 목표와 겹치지 않을 것

- 목표: **심전도 파형을 보여 주는 방식 자체**의 참신한 연출 후보(브리프 §1).
- 이미 구현(겹침 금지): 2.5 s sweep + 잔광 + 지우는 쪽 국소 페이드, 심전도 용지 격자(번짐·머리 뒤 격자 잔광), R 피크마다 4분의 1씩 잡음 → 저장 출력 교차, 두 층 라벨, R 주석, 층 시차 등장. 보류: T3 초점 렌즈.
- 이미 분석한 레퍼런스(중복 금지): REF-001–010, REF-005 ciechanow.ski/sound(파형 쪼개고 더하기).

## 1. 후보 목록 (라운드 0 — 2026-09-29 제시)

확보 방식은 R-016(렌더 층)으로 표시. "우리에게 줄 수 있는 것"은 L0 IDEA 수준의 한 줄 가설이다.

| # | 레퍼런스 | URL | 보는 법 | 한 줄 요지 | 렌더 층 · 확보 |
|---|---|---|---|---|---|
| C1 | woscope — WebGL 오실로스코프 에뮬레이터 (m1el) + 기법 글 | https://m1el.github.io/woscope/ · https://m1el.github.io/woscope-how/ | 데모에서 소리를 재생하고 **선이 빨리 지나간 곳은 흐리고 머문 곳은 밝은** 점만 본다. 기법 글은 "가우스 빔을 선분 따라 적분" 절 | 전자빔 물리: 밝기 = 머문 시간. QRS처럼 빠른 구간은 가늘고 흐리게, 기저선은 진하게 — 실제 아날로그 모니터 느낌의 잔광 | WebGL · 소스 공개(GitHub) → 소스 + 사용자 녹화 |
| C2 | Oscilloscope Music (Jerobeam Fenderson) | https://oscilloscopemusic.com/watch/oscilloscope_music | 영상 아무 곡 첫 30 s — **소리 신호 두 채널을 X·Y로 그리면 도형**이 되는 순간 | 같은 신호를 시간축 대신 위상 공간에 그리면 형태가 된다 → 심전도 `(x(t), x(t−τ))` 고리: 박동마다 같은 고리를 덧그림, 잡음은 고리를 뭉갬 | 영상 → 사용자 시청 |
| C3 | NASA SVS Climate Spiral (Ed Hawkins 원안) | https://svs.gsfc.nasa.gov/5190/ · https://ed-hawkins.github.io/climate-visuals/spirals.html | SVS 영상 후반 — **2D 원형 도표가 기울어 3D 회오리 기둥**으로 바뀌는 전환 | 시간을 각도로: 한 주기 = 한 바퀴. 심전도 R–R 한 주기를 한 바퀴로 감으면 박동이 겹쳐 쌓이고, 기울이면 시간 기둥 | 영상 → 사용자 시청 |
| C4 | NYT Upshot "3-D View of the Yield Curve" (Aisch · Cox, 2015) | https://www.nytimes.com/interactive/2015/03/19/upshot/3d-yield-curve-economic-growth.html | 스크롤하며 **3D 곡면을 카메라가 돌다가 한 단면으로 정면 정렬돼 평범한 2D 차트가 되는** 구간 | 3D는 개관, 판독은 정면 2D — 박동을 깊이 축으로 쌓은 곡면 → 정면 정렬하면 표준 심전도 띠. 데이터 왜곡 없이 3D를 쓰는 드문 사례 | WebGL · 봇 차단(403) → 사용자 녹화 |
| C5 | CP 1919 펄서 적층 도표 (Unknown Pleasures 원본) — Scientific American 해설 | https://blogs.scientificamerican.com/sa-visual/pop-culture-pulsar-the-science-behind-joy-division-s-unknown-pleasures-album-cover/ | 원본 도표 사진 — **연속 펄스를 위아래로 쌓고 앞줄이 뒷줄을 가리는(숨은 선 제거)** 방식 | R 피크 정렬로 박동을 층층이 쌓기 — 잡음 입력은 층마다 제각각, 출력은 같은 모양이 반복돼 "일관성"이 눈에 보임 | 정적 이미지 · 문서 → AI 확보 |
| C6 | Chrome Music Lab — Spectrogram | https://musiclab.chromeexperiments.com/Spectrogram/ | 내장 예시 소리 하나 재생 — **주파수 지형이 뒤로 흘러가는 3D 띠** | 시간–주파수를 지형으로: 잡음(넓은 대역)은 지형 전체가 들끓고, 잡음 제거 후 심전도 대역만 산맥으로 남음 — 저장값에서 계산한 파생 데이터임을 밝혀야 함 | WebGL · 소스 공개(GitHub) → 소스 + 사용자 녹화 |
| C7 | LIGO GW150914 — "잡음 속 신호 + 모형 겹침" + Sounds of Spacetime | https://www.soundsofspacetime.org/ · https://www.ligo.caltech.edu/video/ligo20160211v2 | LIGO 영상의 **검출기 원신호(잡음) → 거른 신호 → 이론 파형 겹침** 순서 | 우리 주제와 구조가 같다(잡음 속 신호를 드러냄). 두 검출기 신호를 겹쳐 "같은 사건"임을 보여 주는 문법 → 입력·출력·참조를 한 축에 겹치는 확정 순간 | 영상·정적 도표 → 사용자 시청 + AI 문서 |
| C8 | IRIS 지진 시각화 (USArray 지면 운동, 헬리코더 드럼 기록) | https://www.iris.edu/hq/programs/epo/visualizations | "USArray Ground Motion Visualization" 영상 — **관측소 점들이 진폭에 따라 색이 바뀌며 파도처럼 퍼지는** 장면 | 파형을 선이 아닌 **점의 장(field)**으로: 2.5 s 창의 표본들이 한 줄의 점이 되어 진폭만큼 빛남. 헬리코더(긴 기록을 줄 바꿈해 한 장에) = 전체 기록 개관 | 영상 → 사용자 시청 |

AI 추천 3개(선택 참고용): ★ C1(물리 기반 잔상 — 지금 sweep과 바로 결합, LOW 구역 계약 위험 낮음) · ★ C4(3D 개관 → 2D 판독 정렬 — 과감하되 데이터 무결성 사례) · ★ C5(박동 적층 — 잡음 제거의 "일관성"을 한눈에). 과감한 대안: C2(위상 고리).

### 1.1 검토했으나 목록에서 뺀 것

| 후보 | 이유 |
|---|---|
| The Pudding "Let's Learn About Waveforms" (https://pudding.cool/2018/02/waveforms/) | 파형을 성분으로 더하고 쪼개는 설명 — REF-005(ciechanow.ski/sound)와 원리가 겹침 |
| Awwwards 오디오 시각화 컬렉션(APEXvj, 3D Audio Visualizer 등) | 음악 반응형 장식 — 실제 데이터 곡선을 판독하게 하는 사례가 아님. 검색에서 파형을 주인공으로 한 SOTD 수상작은 확인하지 못함 |
| 스톡 심전도 모션그래픽(Envato 등) | 가짜 실시간 장식 곡선 — 데이터 계약 §5 "장식 곡선을 데이터처럼" 위반 방향 |
| Neuralink 사이트(Play Studio) | 브랜드 색·블록 레이아웃 중심, 신호 표시 연출이 핵심이 아님 |

## 2. 사용자 선택 (라운드 0)

(대기)

## 3. 효과 분석과 "우리 파형에 옮기면" 선택지

(선택 후 작성 — 효과 카드는 `references/REF-011`부터)

## 4. 발행 세션에 넘길 기록 초안

(탐색 종료 시 작성 — 색인 행, F/D/R 초안)
