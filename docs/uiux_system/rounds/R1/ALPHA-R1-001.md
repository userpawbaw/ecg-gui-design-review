# ALPHA-R1-001 — "한 줄의 신호, 바뀌는 1등"

Status: **FROZEN (first pass, 2026-09-27)** — Beta 1차가 동결될 때까지 Beta 입력에 넣지 않는다(패킷 §6)
Baseline: v2.2.1 `prototype/v2` (this branch) · 자료 `prototype/v2/public/archive.json`
Target: Attract → Story(4박자) → Lab 진입 전환
Zone: Attract·Story 배경·전환 HIGH / Story 수치·설명 MEDIUM / 파형·축·Reference·Difference LOW
Creative Intent: 관람객이 잡음 속 심장 신호를 발견하고, "잡음이 무엇이냐에 따라 답이 달라진다"를 한 번의 휠 여정으로 겪은 뒤 끊김 없이 실험실로 들어가게 한다(패킷 §1)
Fidelity: `STRONG_ADAPTATION`
입력: `R1_STEP1_PACKET_AND_REFERENCE_PACK.md`(FROZEN + F-025 정정)만. 계약: `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md` A-01~A-10
작성: Claude Code · 2026-09-27

---

## 0. 발산 — 먼저 만든 후보 8개와 거른 이유

`13` §11(최소 5, 권장 8–10). 축(정보 구조·타이포·공간·모션·마이크로·데이터 스토리)이 한쪽에 몰리지 않게 만들었다. L0(설명만).

| ID | 이름 | 레퍼런스 | 3초 인상 | 판정 |
|---|---|---|---|---|
| I1 | **잡음 속 발굴** — 어두운 화면 가득 잡음 섞인 입력이 흐르고, UI-02 발광 선단이 지나간 자리에 출력 선이 드러남 | REF-001(빛 한 줄에 집중), REF-003(멈춰도 살아 있음) | "잡음 아래 심장이 있다" | **채택 — Attract** |
| I2 | **조건 궤도** — 잡음 7종이 링을 이루고, 조건을 고르면 장면 전체가 돌아 그 조건의 1등 앞에 섬 | REF-004 EFX-004-04 | "버튼 하나에 세계가 돈다" | 부분 채택 — 회전 대신 **조건 경로 + 소나**(I4)로. 원형 궤도는 3D 은유가 ECG와 멀고 휠 입력과 맞지 않음 |
| I3 | **방법 토큰 재배열** — 방법 하나 = 토큰 하나. 잡음이 바뀌면 토큰이 물결처럼 순위를 바꾸고, 전체로 퍼졌다가 평균 막대로 모임 | REF-006 EFX-006-01·02·03 | "같은 방법들이 조건마다 줄을 바꿔 선다" | **채택 — Story 핵심** |
| I4 | **조건 경로 + 소나** — 왼쪽 세로 경로에 지나온 조건이 표시로 남고 현재 조건에 소나 링 | REF-003 EFX-003-02·03 | "어디까지 왔는지 안다" | **채택 — Story 진행 표시** |
| I5 | **성분 쌓기** — 입력 = Reference + (입력 − Reference) 세 행을 같은 축에 쌓아 잡음 종류마다 잔차 행 모양이 바뀜 | REF-005 | "잡음에도 모양이 있다" | **채택 — Story 1박자** |
| I6 | **실험실 하강** — 3D(다락방 spike 방식) 또는 AI 영상으로 전시 공간을 내려가 모니터로 match cut | REF-002, `22` | "공간 안으로 들어간다" | 보류 — 3초 목표(신호 발견)가 늦어진다. **Beta와 교차 검토 후 Attract 앞 1회 인트로로 재검토**(§A-11 Q2) |
| I7 | **반전 흐름** — 평균 1등으로 쌓은 결론에 다른 조건 장면을 흘려 순위가 무너짐 | REF-006 EFX-006-04 | "만능은 없다" | 부분 채택 — Story 4박자를 **지표 재정렬**로(S3). 장면을 경로로 흘리는 연출은 자료(98 장면)가 적어 흐름이 성겨 보여 기각 |
| I8 | **원근 파형 복도** — 파형 띠를 3D 원근으로 깔고 카메라가 따라감 | REF-002 EFX-002-02 | "신호 위를 달린다" | **기각** — 파형 원근 왜곡은 `13` §13 critical fail(LOW 구역) |

결합 한 문장: **I1로 신호를 발견하고, I5→I3로 "잡음이 바뀌면 1등이 바뀐다"를 같은 객체의 재배열로 겪으며, I4가 여정의 위치를 잡고, 끝에서 파형이 그대로 Lab 플롯이 된다(REF-001 match cut).**

---

## A-01. Concept Sentence

> **한 줄의 신호는 끝까지 그대로 있고, 그 신호를 두고 방법들이 조건마다 줄을 바꿔 선다.**

파형(LOW)은 움직이지 않는 기준이고, 움직이는 것은 방법 토큰·조건 표시·수치 막대(MEDIUM)뿐이다. REF-006의 object constancy를 **"자료 객체는 사라지지 않는다"**로 번안하되, 재배열의 주인공을 파형이 아니라 방법으로 바꾼 것이 이 안의 핵심 선택이다.

## A-02. Experience Story

| 시점 | 화면 | 관람객이 느끼는 것 |
|---|---|---|
| 0–1 s (Attract, 휠 위치 0) | 검은 화면 가운데 높이 약 44 vh의 **잡음 섞인 입력 선**(주황 #ffbc79)이 왼쪽→오른쪽으로 sweep. 선단에 UI-02 발광 | 뭔가 요동치는 신호 |
| 1–3 s | 선단이 지나간 자리에 **출력 선**(청록 #67e7c3)이 회색 Reference 위에 겹쳐 드러남. 잡음 선은 20 % 불투명도로 물러남. 왼쪽 위 대형 문구 "잡음 속에서, 심장을 꺼냅니다" | "잡음 아래 박동이 있다" — 3초 목표 |
| 3–10 s | 10초 한 바퀴(저장 구간 재생). 오른쪽 아래 작은 표기 `REPLAY · D1 기록 111 · 혼합 잡음 −5 dB · M08 Wavelet U-Net`. 하단 안내 "휠을 굴려 이야기 보기 · 클릭하면 바로 실험실" | 저장 자료 재생임을 안다 |
| 휠 ↓ (Story 1박자) | 문구가 마스크로 바뀌고(REF-003 EFX-003-05), 파형 행이 세 줄로 갈라짐: 입력 / Reference / 입력 − Reference. 자료가 **D0 S038 합성 ECG · 20 dB**로 바뀌며 "합성" 표기. 휠 세 칸마다 잡음이 전원 간섭 → 기저선 변동 → 근육으로 바뀌고 셋째 행 모양이 달라짐 | "잡음에도 모양이 있다" |
| 휠 ↓ (2박자) | 파형이 두 줄(입력 / 1등 출력 + Reference)로 돌아오고, 아래에 **방법 토큰 10개**가 순위 줄로 섬. 같은 세 잡음을 다시 지나며 토큰이 물결처럼 자리를 바꿈: M04 → M_FE → M06L6가 맨 위. 1등 토큰의 출력이 파형 행에 그려짐 | "같은 ECG인데 1등이 바뀐다" — 15초 목표 |
| 휠 ↓ (2박자 보조) | "실제 기록에서도" — D1 세 장면(기록 219·123·202, 각각 표기)에서 pli → M04, impulse → M06L6, bw 20 dB → M_FE | 합성만의 이야기가 아니다 |
| 휠 ↓ (3박자) | 토큰이 D1 49개 장면 격자(잡음 7 × SNR 7)로 **퍼져** 각 칸의 1등 자리에 섬(M06L6 18칸, M04 8, M09 8, M08 7, M06 4, M_FE 3, M01 1, 나머지 0). 이어서 토큰이 다시 모여 **EXP-A 평균 막대**가 됨(M08 14.66 … M_FE 12.11) | "전체로 보면 차이는 좁다" |
| 휠 ↓ (4박자) | 막대가 다른 지표(PSD 거리)로 **재정렬**: M01이 중간에서 맨 끝으로. 무처리 M00 막대가 들어와 "배율 보정 +2.56 dB / 보정 없음 0.0" | "숫자 하나가 전부가 아니다" |
| User action | 마지막 "직접 바꿔 보세요 →" 클릭(또는 어느 박자에서든 파형 클릭) | |
| Handoff | 지금 파형 행이 그대로 Lab 플롯 자리로 이동·확대(REF-001 match cut, 700 ms). Lab은 같은 장면·같은 방법·같은 시각으로 열림 | 설명 없이 이어서 조작 |

## A-03. Reference Adaptation Map

| Reference | 정확히 가져올 것 | ECG에서 맡길 역할 | 가져오지 않을 것 |
|---|---|---|---|
| REF-001 moto-card | 검은 배경에 **빛 한 줄로 시선 몰기**(역광 대상), 장면을 넘어 **같은 형태가 다음 장면의 윤곽이 되는 match cut** | Attract의 발광 선단, Story 끝의 "파형 → Lab 플롯" 전환 | 지구·카드·금속 재질, Neue Montreal, 회전 수치 |
| REF-002 leoparpeix | 카메라 3단 계층 중 **포인터 층**: 배경 깊이 층이 마우스에 느리게 따라옴(`1−exp(−2dt)`) | Attract 배경 격자·먼지 층의 미세 시차(파형 평면은 고정) | 3D 집·방, 베이크 텍스처, 스크롤 카메라 하강(I6 보류) |
| REF-003 white-desert | **지나온 경로는 색으로 남기고 현재 위치에 소나 링**(시간 루프), **문장 마스크 scrub** | Story 왼쪽 조건 경로·현재 조건 표시, 박자 제목 전환 | 남극 지도, Oswald+Cardinal, #6AF0FF |
| REF-004 seasats | **필터를 고르면 장면이 답으로 이동** + hover 카드 | 조건 칩 클릭 시 해당 박자로 스크롤 이동, 토큰 hover 시 방법 원리·한계 카드(methods.json 문구 그대로) | 지구본, 배 아이콘, 홀로그램 텍스처, Supply Mono |
| REF-005 ciechanow.ski "Sound" | **복잡한 파형 = 성분의 합**을 같은 축에 쌓아 보여 주기 | Story 1박자 입력 / Reference / 입력 − Reference | 일러스트, 3D 공기, 연속 슬라이더(저장 조건만 선택) |
| REF-006 R2D3 | **객체 연속 재배열**(RCP-24), **점별 1/3 순차 지연 + 무리 분리**(RCP-25), **구간별 선형 키프레임**(RCP-26), **좁은 글 칼럼 + 고정 그래픽 무대**, 평활 스크롤 | Story 2–4박자의 방법 토큰(순위 → 격자 → 막대 → 재정렬) | 초록·파랑, 결정 나무, Helvetica 조합 그대로, 흰 배경 |

## A-04. Scene Layout Blueprint (1920×1080 기준)

```
Attract (full-bleed)                          Story (sticky stage)
┌──────────────────────────────────────┐      ┌──────────┬───────────────────────────┐
│ 문구 L 64px/300          [REPLAY]     │      │ 조건 경로 │  파형 무대 (고정)            │
│                                      │      │ ○ 전원    │  행1 입력                   │
│ ~~~~~~~~ 파형 44vh ~~~~~~~~ ▌발광     │      │ ● 기저선  │  행2 출력 + Reference       │
│                                      │      │ ◌ 근육    │  (1박자는 행3 입력−Ref)      │
│ 자료 표기(작게, 우하)                 │      │           ├───────────────────────────┤
│ 안내: 휠 = 이야기 · 클릭 = 실험실      │      │ 박자 글   │  토큰 무대 (순위/격자/막대)   │
└──────────────────────────────────────┘      │ 28% 폭    │  72% 폭                    │
                                              └──────────┴───────────────────────────┘
```

| 항목 | 값 |
|---|---|
| 화면 영역 | Attract: 전체. Story: 왼쪽 칼럼 28 %(경로 72 px + 박자 글 약 440 px), 오른쪽 무대 72 %(파형 무대 상단 46 %, 토큰 무대 하단 54 %) |
| 초점 대상 | 항상 파형 행. 토큰 무대는 파형 아래에서 "누가 이 출력을 냈나"를 답함 |
| 읽는 순서 | 박자 제목 → 파형(무엇이 바뀌었나) → 토큰(누가 1등인가) → 경로(어디까지 왔나) |
| 플롯 크기 우선 | 파형 무대 높이 ≥ 420 px(1080 기준). 1366×768에서는 박자 글을 무대 위 한 줄 캡션으로 접고 무대를 100 % 폭 |
| 스크롤 길이 | 전체 약 8.5 vh 분량(휠 한 칸 100 px 기준 약 90칸). 박자마다 1.6–2.4 vh |
| Lab 전환 후 | 기존 v2.2.1 Lab 레이아웃(2라운드에서 재배치) — 파형 행 위치만 match cut 목표 |

## A-05. Component Inventory

| Component | Role | Source / ref | State | Variants | Interaction | 접근성 | v2.2.1 재사용 |
|---|---|---|---|---|---|---|---|
| `SignalStage` | 파형 행 그리기(입력/출력/Reference/잔차) | v2.2.1 `Plot.tsx` 그리기 로직 | scene, rows[], methodId, time, mode(sweep/static) | attract(대형, 1행 겹침), story-2row, story-3row, handoff | 클릭 → handoff | 행마다 `aria-label`("입력 파형, 합성 기록 S038, 전원 간섭 20 dB") | **그리기 함수 추출 재사용**(R-b) |
| `SweepHead` | 선단 발광(UI-02) | docs/22 §4, REF-001 | on/off | attract, story(off) | 없음 | reduced-motion에서 발광 끔 | 신규(승인 범위) |
| `DataTag` | 자료 표기 칩 `REPLAY · 합성/D1 · 기록 · 잡음 · SNR · 방법` | v2.2.1 viewer-heading | 자료 바뀔 때 120 ms 교차 | 작게(Attract)/보통(Story) | 없음 | 텍스트 | 문구 규칙 재사용 |
| `StoryColumn` | 박자 제목·본문, 마스크 전환 | REF-006 글 칼럼, REF-003 EFX-003-05 | beat 0–4 | — | 없음 | 제목 h2, 스크롤과 무관하게 DOM 순서 | 신규 |
| `ConditionPath` | 조건 경로 + 소나 | REF-003 EFX-003-02·03 | visited[], current | 3조건(1–2박자), 숨김(3–4박자) | 조건 칩 클릭 → 해당 위치로 `lenis.scrollTo` | 버튼, `aria-current` | 신규 |
| `MethodToken` | 방법 하나 = 객체 하나 | REF-006 점, REF-004 hover 카드 | rank, value, isWinner, family | 행(순위), 칸(격자), 막대 끝, 흐림(자료 없음) | hover/focus → `MethodCard` | focus 가능, 이름 읽힘 | methods.json 이름·계열 |
| `MethodCard` | 원리·한계 한 줄 | REF-004 EFX-004-03 | open/closed | — | 150 ms 페이드 | `role=tooltip` | methods.json 문구 그대로 |
| `ScopeNote` | 수치 범위 문구 | 패킷 §1.1-5 | 박자별 | "저장된 10초 한 구간" / "EXP-A · D1 · TEST 22 · 혼합 −5…20 dB" | 없음 | 텍스트 | evidence 문구 재사용 |
| `ValueBar` | EXP-A 평균·지표 막대 | REF-006 막대 | metric | snr_imp_scaled, psd_logdist, snr_imp_strict | hover → 수치 | 표 대체(보이지 않는 `<table>`) | evidence 표 자료 |
| `EnterLabCTA` | "직접 바꿔 보세요 →" | v2.2.1 attract-cta | idle/hover/press | — | 클릭 → handoff | 버튼, Enter | 문구 새로 |
| `IdleReturn` | 무입력 시 Attract 복귀 | v2.2.1 idle 180 s | countdown | — | 입력 시 취소 | 상태 알림 `aria-live` | **재사용** |

토큰 모양(색은 파형 팔레트와 겹치지 않게 무채색 + 1등만 출력 청록):
| 계열 | 모양 |
|---|---|
| 공통 Front-end(M_FE) | 속 빈 사각 |
| 고전 DSP(M01, M02) | 속 빈 원 |
| 웨이블릿(M03, M04) | 점선 원 |
| 모델 기반(M05) | 이중 원 |
| 딥러닝(M06, M06L6, M08, M09) | 속 찬 원 |
| Oracle(B01) | 점선 사각 + "참조 필요" — 순위에 넣지 않고 무대 오른쪽 끝 별도 칸 |

## A-06. Interaction / Motion Spec

스크롤 값은 Lenis 하나(`lerp 0.1`, RCP-01) + GSAP ScrollTrigger `scrub: true`. 객체 위치는 RCP-26 구간별 선형 키프레임(clamp)으로 **스크롤 위치의 함수**(시간 트윈 금지 — 되돌리면 정확히 거꾸로). 아래 "구간"은 해당 박자 스크롤 길이에 대한 비율.

```
ID: M-01 Attract sweep
Trigger: 시간(휠 위치 0에서만), 10 s 한 바퀴 반복
Visual behavior: v2.2.1 sweep(0.12 s gap + 0.08 s fade) 그대로. 선단 폭 32 px, 흰색 30 % 혼합 발광(UI-02 범위 24–48 px, 25–40 %). 출력 선은 선단 뒤에만, 입력 선은 선단 뒤에서 20 % 불투명도
Duration: 10 s 주기(저장 구간 길이)
Easing: 없음(시간 선형 = 재생 시간)
Overlap: M-02와 동시
Data surface rule: 좌표·샘플·진폭·시간 매핑 불변. 발광은 선단 위치 표시층, 옛 파형은 빛나지 않음. 표기 REPLAY 유지
Reduced motion: sweep 대신 정지 전체 표시(출력 + Reference, 입력 20 %), 발광 끔
Failure / fallback: 자료 로드 실패 → 문구 + "자료를 불러오지 못했습니다" + Lab 버튼(가짜 파형 금지)
```
```
ID: M-02 배경 포인터 시차
Trigger: 포인터 이동
Visual behavior: 배경 격자(1 px, 흰 5 %)와 먼지 점(흰 3–8 %, 200개)이 두 깊이로 ±10 px / ±18 px 따라옴. 파형 평면은 0 px
Duration: 추종 k = 1 − exp(−2·dt) (REF-002, RCP-08) — 약 1.5 s에 자리
Easing: 지수 추종
Overlap: 전 구간
Data surface rule: 파형 행은 움직이지 않는다. 먼지 점은 파형 영역 안에서 불투명도 3 % 이하(자료로 오인 방지)
Reduced motion: 끔
Failure / fallback: WebGL 없으면 CSS 그라데이션 + 정적 격자
```
```
ID: M-03 Attract → Story 문구 마스크
Trigger: 스크롤 0 → 0.4 vh
Visual behavior: Attract 문구가 아래에서 위로 마스크로 지워지고 1박자 제목이 같은 방식으로 드러남(REF-003 EFX-003-05, CSS 변수 마스크 scrub, RCP-19). 동시에 파형 무대가 전체 폭 → 오른쪽 72 %로 이동(파형 다시 그리기, 비트맵 늘림 금지)
Duration: 0.4 vh 스크롤
Easing: 선형 scrub(평활은 Lenis)
Overlap: 파형 무대 이동과 문구 마스크 동시
Data surface rule: 무대 이동 중 행 간 축 공유 유지. 축 눈금은 이동 중 숨기고 끝에서 120 ms 페이드
Reduced motion: 즉시 전환(마스크 없이 교체)
Failure / fallback: 마스크 미지원 → opacity 교차
```
```
ID: M-04 성분 쌓기(1박자)
Trigger: 스크롤, 1박자 앞 30 %
Visual behavior: 한 행이 세 행으로 갈라짐 — 입력 / Reference / 입력 − Reference(모두 같은 ±mV 축, 같은 시간축). 행 사이 간격만 0 → 24 px로 벌어짐
Duration: 구간 30 %
Easing: 선형 scrub
Overlap: 없음
Data surface rule: 셋째 행은 저장된 입력 − 저장된 Reference(샘플별 뺄셈)이며 이름을 "입력 − Reference"로 표기. "잡음"이라고만 쓰지 않는다(FE 대역 밖 성분 포함)
Reduced motion: 세 행 즉시 표시
Failure / fallback: —
```
```
ID: M-05 조건 전환(1·2박자, 3회)
Trigger: 스크롤, 조건마다 구간 1/3 중 가운데 20 %
Visual behavior: (a) 파형: 이전 조건 선이 10 % 구간 동안 불투명도 1→0, 이어서 새 조건 선이 0→1(동시 섞기 금지 — 두 실제 선의 순차 교체). (b) DataTag 교체. (c) ConditionPath: 지난 조건 점은 청록 채움으로 남고, 현재 점에 소나 링. (d) 2박자: MethodToken이 새 순위로 이동 — RCP-25: 구간의 1/3을 이전 순위 순서로 나눈 지연, 각 토큰은 선형 키프레임으로 새 y
Duration: 구간 20 %(휠 약 3칸)
Easing: 선형 scrub(평활은 Lenis)
Overlap: (a)의 페이드아웃이 끝나야 페이드인. (d)는 (a)와 동시
Data surface rule: 중간 파형 morph 금지. 토큰 순위 = 저장된 snr_imp 내림차순(oracle 제외). 수치 라벨은 토큰이 멈춘 뒤에만 표시(이동 중 숨김)
Reduced motion: 토큰 즉시 재배치, 파형 즉시 교체
Failure / fallback: 해당 방법 출력이 없는 장면 → 토큰 흐림 + "이 장면에 저장된 출력 없음"
```
```
ID: M-06 소나 링
Trigger: 시간(현재 조건 점)
Visual behavior: 선 1 px 링 3개, 0.2 s 간격, 2.0 s 주기, 지름 ×1→×5, 불투명도 1→0(REF-003 EFX-003-03, RCP-17)
Duration: 무한
Easing: ease-out
Overlap: —
Data surface rule: 조건 경로에만. 파형·토큰에는 맥동을 걸지 않는다(가짜 실시간 금지)
Reduced motion: 링 1개 정지
Failure / fallback: CSS만
```
```
ID: M-07 토큰 → 격자로 퍼짐(3박자 앞)
Trigger: 스크롤, 3박자 0–45 %
Visual behavior: 각 토큰이 자기 1등 칸 수만큼 복제되어 D1 7×7 격자(가로 SNR −5…25, 세로 잡음 7종)의 칸으로 이동(REF-006 EFX-006-03: 시작 위치 = 토큰 위치). 1등 칸이 0인 토큰(M02·M03·M05)은 제자리에서 25 % 불투명도로 남음
Duration: 구간 45 %, 복제본마다 1/3 순차 지연
Easing: 선형 scrub
Overlap: 파형 무대는 이 박자에서 현재 칸 장면을 보여 주지 않고 비움(격자 자체가 주인공) — 대신 칸 hover 시 그 장면 1등 출력을 파형 무대에 표시
Data surface rule: 칸 = 저장된 장면 하나, 1등 = 그 장면 저장 snr_imp 최댓값(oracle 제외). ScopeNote "장면마다 저장된 10초 한 구간 · D1 기록은 잡음마다 다름"
Reduced motion: 격자 즉시 표시
Failure / fallback: —
```
```
ID: M-08 격자 → 평균 막대로 모임(3박자 뒤)
Trigger: 스크롤, 3박자 55–100 %
Visual behavior: 복제본들이 자기 토큰 막대 끝으로 모이며 EXP-A scaled SNR 개선 평균 막대가 왼쪽에서 자람(표준편차 가는 선). EXP-A에 없는 M06L6 토큰은 무대 밖으로 나가며 "EXP-A 주 실험에 없음 · 보조 실험(EXP-G)" 라벨. EXP-A에만 있는 M07·M10은 오른쪽에서 새 객체로 들어옴(표기 "이 전시 장면 자료에 출력 없음")
Duration: 구간 45 %
Easing: 선형 scrub
Overlap: ScopeNote가 "EXP-A · D1 · TEST 22 · 혼합 −5…20 dB"로 교체
Data surface rule: 막대 = evidence 표 값 그대로(소수 둘째 자리). 순위 차이를 강조하는 색 없음(유의성 자료 없음 → "차이는 좁다"까지만)
Reduced motion: 막대 즉시
Failure / fallback: 표 대체 텍스트
```
```
ID: M-09 지표 재정렬(4박자)
Trigger: 스크롤, 4박자 두 지점
Visual behavior: (1) 막대가 PSD log-distance(↓가 좋음) 기준으로 재정렬 — RCP-25 지연으로 물결, M01이 맨 끝으로. (2) 무처리 M00 막대가 들어와 "배율 보정 +2.56 dB"에서 "보정 없음 0.0 dB"로 줄어듦(두 저장값 사이 막대 길이 보간 — 수치 라벨은 두 값만 표시, 중간값 표시 금지)
Duration: 각 구간 30 %
Easing: 선형 scrub
Overlap: 없음
Data surface rule: 지표 이름과 방향(↑/↓)을 막대 무대 제목에 항상 표시
Reduced motion: 즉시
Failure / fallback: —
```
```
ID: M-10 Lab 진입 match cut
Trigger: EnterLabCTA 클릭, 또는 Attract/Story에서 파형 클릭
Visual behavior: 현재 파형 행의 화면 사각형 → Lab 플롯 사각형으로 이동·크기 변화(매 프레임 목표 사각형에 다시 그림, 비트맵 늘림 금지). 나머지 요소 200 ms 페이드아웃, Lab 크롬 300 ms 페이드인
Duration: 700 ms(시간 기반 — 클릭은 문턱 입력)
Easing: 빠르게 시작해 부드럽게 멈춤(cubic-bezier(.2,.7,.2,1))
Overlap: 사각형 이동 0–700 ms, Lab 크롬 400–700 ms
Data surface rule: 같은 장면·같은 방법·같은 재생 시각(same-time handoff, D-034 자산). 전환 중 입력/출력 행은 같은 축 공유 유지, 눈금 숨김
Reduced motion: 150 ms 교차 페이드
Failure / fallback: Lab 자료 미준비 → 파형 무대에서 정지 + "실험실 준비 중" 상태, 준비되면 전환
```
```
ID: M-11 무입력 복귀
Trigger: 입력 없이 180 s(v2.2.1 값)
Visual behavior: 10 s 카운트다운 칩 → `lenis.scrollTo(0, 2.4 s)`로 Attract 복귀(Lab에서는 v2.2.1 동작)
Reduced motion: 즉시 이동
```

## A-07. Visual System Delta (v2.2.1 대비)

| 항목 | v2.2.1 | ALPHA-R1-001 |
|---|---|---|
| 배경 | 밝은 셸 #f4f5f4 + 어두운 플롯 #112b39 | Attract·Story 전체가 어두운 세계: 기본 #071319, 무대 #0b1d26(플롯 #112b39 계열 확장). Lab은 2라운드 전까지 v2.2.1 유지 → 전환 시 셸 밝아짐(M-10에서 400 ms 배경 보간) |
| 팔레트 | 입력 #ffbc79 / 출력 #67e7c3 / Reference #c4c6c7 / 비교 #97c2ff | **그대로**(LOW). UI 크롬은 무채색(#e6edf0 글자, #8aa0aa 보조, 선 rgba(255,255,255,.12)). 강조색은 출력 청록 하나 |
| 타이포 | 시스템 글꼴(Malgun Gothic/Noto Sans KR) | 같은 글꼴(D-035). 위계만 편집형으로: Attract 제목 64 px/300, 박자 제목 44 px/300 + 1 px 밑줄(REF-006), 본문 19 px/400 행간 1.55, 표기 13 px 대문자 자간 .08em |
| 모서리 | 둥근 버튼 | 4 px, 칩 999 px |
| 테두리 | 회색 카드 테두리 | 카드 없음. 무대는 가는 선 구획만 |
| 깊이·발광 | 없음 | 발광은 선단(UI-02)과 소나에만. 그림자 없음 |
| 아이콘 | 최소 | 토큰 모양(계열) 외 아이콘 없음 |
| 간격 | 촘촘한 폼 | 8 px 격자, 무대 여백 48 px |
| 커서 | 기본 | 기본(파형 위 pointer — 클릭 = Lab) |
| 배경 요소 | 없음 | 격자 + 먼지 점 두 층(M-02) |
| 파형 주변 | 플롯 카드 | 테두리 없는 무대, 축 눈금은 가는 선 + 13 px 라벨 |

## A-08. Data / State Contract (바뀌지 않는 것)

1. 모든 파형은 `archive.json` 저장 trace를 복호화한 값. 입력·출력·Reference·잔차 행은 같은 절대 sample index·시간·±mV 축.
2. 잔차 행 = 저장 입력 − 저장 Reference(샘플별), 이름 "입력 − Reference".
3. 조건 전환 시 두 실제 선의 순차 교체만(보간·morph 없음).
4. 순위·1등·격자 = 저장 `storedMetrics[*].snr_imp`에서 계산(oracle 제외, 동점은 저장값 그대로 소수 첫째 자리 표기 후 ID 순). 계산은 빌드 시 `story.json`으로 만들고 테스트가 archive와 대조.
5. 막대 = `evidence.rows`(EXP-A) 값 그대로. 범위 문구 필수. M06L6·M07·M10의 자료 유무를 표기.
6. 합성(D0)과 실제 기록(D1)을 항상 DataTag에 표기. D1 장면은 기록 번호 표기(F-025).
7. `REPLAY`/`ARCHIVED REPLAY` 표기 유지, "실제 장치 세션 없음" 고지는 Lab 진입 후 v2.2.1 그대로. Attract에 BPM·"처리 중" 연출 없음.
8. Lab 진입 상태 = {axis, cond, snr, method, time} — Story가 보여 준 그대로(v2.2.1 `restore()` 경로).
9. 스크롤 평활·배경 시차는 재생 시간(Transport)에 영향 없음.

박자별 자료(모두 저장값 `[코드]`):

| 박자 | 장면 | 1등(oracle 제외) | 비교용 |
|---|---|---|---|
| Attract | D1 기록 111 · 혼합 −5 dB · 방법 M08 | (보여 주는 방법은 v2.2.1 기본 M08) | — |
| 1·2 | D0 S038 · 20 dB · 전원 간섭 | M04 19.4 dB | M_FE 17.9 |
| 1·2 | D0 S038 · 20 dB · 기저선 변동 | M_FE 23.2 dB | M04 21.7 |
| 1·2 | D0 S038 · 20 dB · 근육 | M06L6 9.9 dB | M08 9.0, M_FE 0.6 |
| 2 보조 | D1 기록 219 · 전원 간섭 5 dB | M04 29.4 | M_FE 20.5 |
| 2 보조 | D1 기록 123 · 임펄스 5 dB | M06L6 19.5 | M04 1.9(맨 끝) |
| 2 보조 | D1 기록 202 · 기저선 20 dB | M_FE 32.3 | M08 18.7 |
| 3 | D1 49 장면 1등 수 | M06L6 18, M04 8, M09 8, M08 7, M06 4, M_FE 3, M01 1 | M02·M03·M05 0 |
| 3 | EXP-A scaled 평균 | M08 14.66, M06 14.37, M09 14.21, M10 13.78, M07 13.16, M04 13.12, M01 13.03, M_FE 12.11, M05 11.03, M02 10.84, M03 10.41 | B01 17.93(참조 필요) |
| 4 | EXP-A PSD log-distance(↓) | M01 22.79 맨 끝 | M00 scaled 2.56 / strict 0.00 |

## A-09. Implementation Blueprint

| 항목 | 내용 |
|---|---|
| 구조 | `25` + D-028: vanilla 엔진 `StoryEngine` + React 마운트. 프레임 값은 React state로 흐르지 않음. Lenis 하나 |
| 새 파일(예상) | `prototype/v2/src/story/StoryEngine.ts`(Lenis·ScrollTrigger·레이어 조립, 인터페이스 `setData/setProgress/on('handoff')/resize/dispose`), `story/keyframes.ts`(RCP-26 구간 선형 함수 + RCP-25 지연 계산), `story/tokens.ts`(Canvas 2D 토큰·격자·막대), `story/signal.ts`(파형 행 — `Plot.tsx`에서 추출한 순수 그리기 함수 사용), `story/background.ts`(WebGL 먼지·격자, 실패 시 CSS), `story/StoryMount.tsx`, `story/story.css`, `scripts/build-story-data.mjs` → `public/story.json` |
| 수정 파일 | `Plot.tsx`(그리기 함수 분리 — 동작 불변, 기존 테스트 유지), `main.tsx`(route `story`를 무인 시작 화면으로, Attract Dialog 대체, handoff → `restore()`), `style.css`(어두운 셸 토큰) |
| 상태 훅 | React는 route·handoff 목표 상태만. 박자·토큰 위치는 엔진 내부 |
| 애니메이션 기술 | Lenis 1.3.x + GSAP 3.15 ScrollTrigger(scrub), 자체 키프레임 유틸. 시간 기반은 M-01(기존 Transport), M-06(CSS), M-10(GSAP 700 ms) |
| 렌더 층 | 파형: Canvas 2D(기존). 토큰·격자·막대: Canvas 2D 1장(객체 최대 약 70) + 접근성용 숨은 DOM. 배경: WebGL 1장(HIGH 허용, D-027) |
| 외부 컴포넌트 | 없음(23번 C1–C4 대상 없음). 마스크는 CSS |
| 재사용 자산(D-034) | same-time handoff, CompareLens의 같은 sample index 검사, RAF 측정 스크립트 |
| 성능 위험 | 배경 WebGL + 파형 Canvas 두 장 동시 → P2 전 예산 잠정(`25` §5). 토큰 Canvas는 변화 시에만 다시 그림 |
| 폴백 | WebGL 없음 → CSS 배경. reduced-motion → 모든 scrub을 박자 단위 즉시 전환(스크롤 위치별 정적 상태) |

## A-10. Validation Plan

| 레벨 | 내용 |
|---|---|
| L1 | `story-data.test` — story.json의 순위·1등 수·막대 값이 archive와 일치, 모든 장면 표기(D0/D1·기록) 존재, oracle 제외 확인 |
| L2 | `25` 게이트 G1–G6: 박자마다 12장(휠 위치 균등) 캡처 — 토큰 개수 보존(사라짐 0), 파형 행 축 공유, 전환 중간 프레임에 morph 없음(두 선이 동시에 반투명으로 겹치지 않음), 문구·표기 |
| L3 | Playwright 휠 시뮬레이션: 앞으로·되돌리기 같은 위치 픽셀 일치(되돌림 일치), reduced-motion, 180 s 무입력 복귀, 클릭 handoff 후 Lab 상태 = Story 상태 |
| L4 | 전시 PC(P2) — 실제 휠 부드러움, fps, 10분 soak. 미정 |

## A-11. Open Questions

1. Attract 자료: D1 실제 기록(현안)과 D0 S038(Story와 같은 신호) 중 무엇으로 시작할까 — 실제 기록이 더 설득력 있고, 같은 신호는 이어짐이 좋다.
2. I6(3D·AI 영상 실험실 하강)을 Attract 앞 1회 인트로로 둘지 — Beta 교차 검토 후 결정.
3. M06L6(보조 실험 EXP-G)가 1박자·2박자 1등으로 나오는 것 — 표기는 하지만 주 실험 방법(M08)으로 바꿔 보일지는 사용자 판단.
4. 박자 수(4)와 전체 길이(약 90칸)가 전시 관람 시간에 맞는지 — L4 전 사용자 체감 확인.

## 완료 gate (`18` §6)

| 질문 | 답 |
|---|---|
| 1 레퍼런스 특징이 보이나 | REF-006 객체 재배열·글 칼럼+고정 무대, REF-003 경로+소나·문장 마스크, REF-001 빛 한 줄·match cut, REF-005 성분 쌓기, REF-002 포인터 깊이, REF-004 hover 카드·조건 이동(A-03) |
| 2 ECG가 hero인가 | 파형 행이 모든 박자의 초점, 토큰은 "누가 이 출력을 냈나"에 답하는 보조 |
| 3 component/state로 번역됐나 | A-05 11개 + 토큰 모양 규칙 |
| 4 motion이 구체적인가 | A-06 M-01~M-11 |
| 5 v2.2.1 보존 | Plot 그리기·팔레트·sweep·표기·Transport·restore·idle(A-05, A-07, A-08) |
| 6 추가 디자인 결정 없이 구현 가능한가 | 레이아웃 비율, 타이포 수치, 모션 구간, 자료 표 확정. 남은 결정은 A-11 네 가지 |
| 7 데이터 계약 침범 없나 | A-08. 원근·morph·가짜 실시간 없음, F-025 표기 |
