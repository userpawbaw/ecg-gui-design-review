# BETA-R1 도구 품질 시험 — Canva generate-image 1장

작성 2026-09-27 · branch `claude/optimistic-goldberg-jnzpni` · Beta 트랙(별도 에이전트)
상태: **도구 시험(TOOL TEST)** — Beta 1차 본 실행(BETA-R1-001)이 아니다.
INDEPENDENCE: **clean context** — 허용 파일만 읽음(`19` 전체, `20` §2·§3·§7·§8, R1 Step1 패킷, REF-001–004·006 효과 기록 일부, `11` §1D, `v221-attract-1920x1080.png`). Alpha 산출물·PLAN·WORKLOG·WORK_STATE·records·git log는 열지 않았다.

> **생성 이미지의 픽셀·글자·파형은 canonical 자료가 아니다.** 이 이미지는 분위기·구도 시험용이며, 실제 화면의 파형은 저장 출력에서만 그린다(패킷 §1.1-3). 이미지 속 문구도 제품 문구가 아니다.

---

## 1. 컨셉 브리프 (5개, 패킷 §1·§1.1·§2·§3 기준)

| ID | 제목 | 한 줄 아이디어 | 레퍼런스 · 가져오는 것 | 장면 |
|---|---|---|---|---|
| B1 | **Eclipse Signal** | 어둠 속 역광 호(arc)의 빛이 세로 sweep 선으로 떨어지고, 그 선을 지나며 잡음에 묻힌 주황 입력이 청록 출력으로 드러난다 | REF-001 역광 림 라이트 + "빛의 호가 다음 대상의 윤곽이 되는" match cut(EFX-001-02·03) · REF-003 소나 링(EFX-003-03)은 **조건 표시점에만** · REF-006의 여백·절제 | Attract |
| B2 | Walk into the trace | 전시 공간(계측 장비 실루엣)을 휠로 걸어 들어가 화면 속 파형 평면 앞에 서는 도입, 첫 3초 안에 파형이 보인다 | REF-002 카메라 3단 계층·스크롤 = 걸음(RCP-10·11) · REF-001 한 대상에 빛 몰기 | Attract |
| B3 | Condition dial | 잡음 종류(pli / bw / ma)를 고르면 평면 링 다이얼이 돌아 그 조건의 1위 방법(S1, D0 S038 20 dB) 앞에 선다. hover 카드 = methods.json 한 줄 원리·한계 | REF-004 필터 → 최대 군집으로 회전(RCP-22)·단일색 표시층(RCP-20) — 지구본은 쓰지 않음 | Story |
| B4 | Split the noise | Input · Reference · (Input − Reference)를 같은 ±mV 축에 쌓고, 조건 축 경로의 지나온 구간을 칠해 남긴다 | REF-005 성분을 쌓아 합을 보여 주기 · REF-003 지나온 경로 강조(RCP-16) | Story |
| B5 | Same marks, new order | 방법 표시점(점·라벨)이 사라지지 않고 조건마다 순위로 재배열된 뒤, 파형이 Lab plot의 같은 선으로 match cut | REF-006 object constancy(파형은 재배열하지 않음) · REF-001 match cut | Story → Lab |

공통 금지: 가짜 BPM·실시간 연출, 새 지표, 원근 왜곡 파형, 방법 간 파형 morph, 레퍼런스 브랜드·에셋 복사.

## 2. 시험 대상으로 B1을 고른 이유

- 사용자 기준 `NEAR_FINAL`을 가장 직접 시험한다: 1920×1080 Attract 한 장면, 요소 수가 적어 "완성된 전시 화면처럼 보이는가"가 곧바로 드러난다.
- 이미지 생성기의 약점이 드러나기 쉬운 지점을 한 장에 모았다: (a) 그럴듯한 P-QRS-T 파형, (b) 잡음 속에 같은 박동이 묻혀 있는 관계, (c) 예약색 3개(#ffbc79 / #67e7c3 / #c4c6c7) 준수, (d) 짧은 문구의 정확도, (e) generic 의료 대시보드로의 drift.
- 레퍼런스 연결(REF-001 역광 호 → sweep)이 정지 이미지에서도 보이는 유형이라 "reference와의 관계" 평가가 가능하다.

### 이미지용 레퍼런스 추출 (`19` §2.2)

```text
Composition: 중앙 가로 파형 1줄(폭 ~70%), 위쪽 거대한 어두운 원반의 역광 호, 호 정점에서 세로 sweep
Palette relationship: 근흑 배경 + 차가운 은백 림 라이트, 색은 파형 3색에만
Lighting / depth: 뒤에서만 비추는 역광(REF-001), 앞면은 평면
Typography mood: 크고 조밀한 neo-grotesk 제목 + 작은 대문자 라벨(시스템 글꼴로 번역, D-035)
Signature UI object: 호 → sweep 선 match cut
Background behavior: 느린 역광 변화(실제로는 스크롤 연동)
Waveform role: hero, 가장 밝은 대상, 평면
CTA / navigation presence: 하단 pill 버튼 1개 + 휠 아이콘
Density: 매우 낮음
What must not appear: 병상 모니터, BPM, 진단, 홀로그램 심장, 데이터 카드, 원근 파형, 지구 텍스처
```

## 3. 사용한 프롬프트 (영문, 그대로 재사용 가능)

```text
Near-final exhibition UI screenshot, 1920x1080, for a museum-grade ECG denoising research exhibit ("ECG Signal Studio"). Attract / idle screen of a stored-replay comparison exhibit — NOT a live patient monitor. Polished product screen, Awwwards-level art direction, not a generic futuristic medical dashboard.

HERO (occupies the central ~70% width, horizontally centered, slightly below vertical center): one flat, perfectly 2D electrocardiogram trace running left to right on a single shared baseline, drawn as a thin crisp line on a flat plane facing the viewer (no perspective, no 3D tilt, no bending). The left third of the trace is a warm amber-orange line (#ffbc79) buried in dense high-frequency noise jitter, the P-QRS-T shape barely visible. Across a single vertical sweep line in the middle, the same trace continues as a clean mint-teal line (#67e7c3) with clearly readable heartbeats: small P wave, sharp narrow QRS spike, rounded T wave, about one beat per 0.8 s. A faint thin neutral grey line (#c4c6c7) sits exactly under the clean teal section as a reference ghost. The waveform is the brightest, most important object on screen.

REFERENCE TRANSLATION: (1) Backlit-rim lighting borrowed from a backlit planet hero: behind the trace, a huge very dark disc-like horizon glow sits low on the screen, lit only from behind so a thin cool silver-white rim of light (like a planet edge in eclipse) forms an arc; the arc's light flows into and becomes the sweep line — the "light arc becomes the signal" match-cut moment. (2) Sonar marker borrowed from an expedition map: at the far right end of the trace, a small point with two thin concentric outline rings expanding outward, only as a position/condition marker, not on the heartbeat itself. (3) Editorial restraint from a scrollytelling data story: very generous negative space, few elements.

COMPOSITION: near-black background (#080808 to deep blue-black #0b1016), subtle film grain. Top-left: a small refined wordmark area with a short two-line title in large clean grotesk sans-serif, e.g. "Signal, out of noise" and a tiny subtitle "Stored replay · synthetic record". Bottom-center: a single minimal pill-shaped light-grey button with dark text "Scroll or click to enter", plus a thin mouse-scroll-wheel icon. Bottom-left: tiny muted caption "REPLAY — no live device session". Top-right: three tiny text chips showing noise condition "Powerline · Baseline wander · Muscle", the first one highlighted. Subtle, thin hairline axis ticks under the trace, labeled only "0 s" and "10 s" and "mV". Nothing else.

PALETTE: near-black, cool silver-white rim light, amber #ffbc79 only for the noisy input, mint-teal #67e7c3 only for the cleaned output, neutral grey #c4c6c7 only for the reference. No other saturated colors.

TYPOGRAPHY: large, tight, confident neo-grotesk headline, small calm uppercase microlabels with generous letter spacing, very little text overall.

NEGATIVE: no hospital bedside monitor, no heart-rate BPM numbers, no vital-sign numbers, no diagnosis text, no hologram heart, no human body, no data cards, no charts other than the one trace, no random neon cyberpunk, no glowing grid floor, no perspective-distorted or 3D waveform, no dense unreadable microcopy, no logos, no planet texture or continents.

FIDELITY: crisp vector-sharp UI, consistent spacing, credible hierarchy, looks like a finished product screenshot of a high-end interactive exhibit.
```

### ChatGPT용 변형 (시험 결과를 반영한 작은 수정)

위 프롬프트 맨 앞에 아래 한 문단을 붙이고, HERO 문단의 두 문장을 바꾼다. 변경 이유: Canva 결과에서 (a) 주황 구간에 박동이 전혀 보이지 않아 "같은 신호"라는 관계가 끊겼고, (b) 오른쪽 끝 표시점이 "실시간 커서"처럼 읽혔다.

```text
Generate one single 16:9 image (1920x1080). Render all on-image text exactly as quoted and nothing else; keep text short and legible.

[replace in HERO] The left half is the same heartbeat rhythm as the right half, buried under amber (#ffbc79) noise: the tall QRS spikes are still faintly visible through the noise at exactly the same positions and spacing as the clean beats would continue, so it is obviously one continuous signal.
[replace in REFERENCE TRANSLATION (2)] The sonar marker is NOT at the end of the trace (it must not look like a live recording cursor); place it on the highlighted "Powerline" condition chip top-right, as two thin concentric outline rings.
```

## 4. 도구·모델 정보 (보고된 그대로)

| 항목 | 값 |
|---|---|
| 도구 | Canva MCP `generate-image` → `get-generate-image-job` |
| 모델 | 도구가 모델명을 보고하지 않음 `기록 없음` |
| aspectRatio | `LANDSCAPE_16_9` |
| job ID | `AaDjWVsqTKKXQMvlK2yNsA` · 폴링 3회 후 SUCCESS, 후보 **1장** |
| Canva media ID | `MAHWZrCC_IM` · 원본 메타데이터 **1680×944** (smart tags: sound, audio, digital, volume) |
| Canva 링크 | [Open generated image](https://www.canva.com/M/MAHWZrCC_IM?utm_source=OC-AaBlKuT9h240&utm_campaign=agent_connector_create_image_asset_opened) (로그인 필요, curl은 403) |
| 저장 파일 | `BETA-R1-test-01-canva.png` — **199×112 미리보기만**. 도구가 돌려준 것은 썸네일 blob뿐이고, `get-assets`의 썸네일 URL은 서명돼 있어 크기 파라미터를 바꾸면 403. 원본 해상도 파일을 받으려면 Canva 디자인을 새로 만들어 이미지를 넣고 export해야 하는데, 사용자 Canva 계정에 새 디자인을 만드는 부수 효과라 이번 시험에서는 하지 않았다 |

## 5. 품질 평가 (`19` §3·§7·§8 기준, 199×112 미리보기를 4배 확대해 봄)

| 기준 | 평가 | 근거 |
|---|---|---|
| 레퍼런스 연결 | **좋음** | 거대한 어두운 원반의 은백 역광 호, 정점에서 떨어지는 세로 sweep 선이 뚜렷하다. REF-001 역광 지구 → match cut을 "빛의 호가 신호가 된다"로 번역한 의도가 이미지에서 읽힌다. 지구 텍스처·카드·금속 숫자는 복사되지 않았다 |
| generic AI drift | **낮음** | 병상 모니터·BPM·데이터 카드·홀로그램 심장·네온 그리드 없음. 요소 수가 적고 여백이 넓다. 다만 오른쪽 청록 구간은 "심박 아이콘 라인"처럼 규칙적인 뾰족 봉우리여서 stock 심박 그래픽 쪽으로 약간 끌린다 |
| NEAR_FINAL 완성도 | **판정 불가~중간** | 구도·위계·CTA pill·상단 칩·하단 캡션까지 제품 화면 골격은 갖췄다. 그러나 확인 가능한 해상도가 199 px라 글자 선명도, 간격, 미세 디테일을 판정할 수 없다. 원본(1680×944)도 1920×1080보다 작다 |
| 파형 그럴듯함 | **약함** | 주황 구간은 고주파 잡음 띠뿐이고 박동(QRS)이 보이지 않아 "같은 신호가 잡음에 묻혀 있다"는 관계가 끊긴다. 청록 구간은 QRS 봉우리는 있으나 P·T파가 거의 없어 실제 ECG 모양과 거리가 있다. 회색 Reference 선은 보이지 않는다. 원근 왜곡은 없음(요구대로 평면) |
| 가짜 실시간 위험 | **있음** | 파형 오른쪽 끝의 밝은 점이 소나 링이 아니라 "기록 중 커서"처럼 읽힌다 → 패킷 §1.1-4 위반 소지. 이미지 → 구현 번역에서 반드시 제거·이동해야 한다 |
| 글자 | **부분 확인** | 제목 "Signal, out of noise"는 읽힌다. 상단 칩·하단 버튼·캡션 글자는 미리보기 해상도에서 판독 불가 → 깨짐 여부 미검증 |
| 실제 UI로 번역 가능한 것 | 역광 호(WebGL 또는 CSS radial/conic gradient) → sweep 선 match cut, 넓은 여백의 단일 hero 구도, 하단 pill CTA + 휠 아이콘, 상단 우측 잡음 조건 칩, 얇은 시간축 헤어라인. 파형은 전부 canonical renderer로 교체 |
| 버릴 것 | 생성된 파형 모양, 오른쪽 끝 발광 점, 이미지 속 문구 |

## 6. 판정

**BORDERLINE** — Beta를 이 도구로 계속하기에는 조건부.

- 구도와 레퍼런스 번역(역광 호 → sweep)은 기대 이상으로 의도를 따랐고 generic 대시보드로 흐르지 않았다 → SCENE 수준의 탐색 도구로는 쓸 만하다.
- 파형 관계(잡음 속 같은 박동, P-QRS-T, Reference 회색 선)를 제대로 그리지 못했다. 파형은 어차피 canonical이 아니지만, 사용자 기준 `NEAR_FINAL` 인상에는 불리하다.
- 오른쪽 끝 발광 점이 실시간 커서로 읽혀 데이터 계약 위험을 이미지가 스스로 만들었다(프롬프트로 줄일 수 있음, §3 변형).
- 도구가 199×112 썸네일만 내려받게 해 줘 NEAR_FINAL 판정(글자·간격·디테일)을 할 수 없다. 원본은 1680×944이고 Canva 디자인 export 경로를 거쳐야 한다.
- 권장: Beta stills 본 실행(최대 9장)은 **Chat 환경의 이미지 생성(§3 ChatGPT 변형 프롬프트)으로 handoff**하거나, Canva를 쓴다면 원본 해상도 export 경로를 먼저 확보한 뒤 같은 프롬프트로 1장 재시험한다(`20` §8, 패킷 §6).

## 7. 단계 기록

- 수행: 계약·패킷·레퍼런스 확인, 브리프 5개, B1 프롬프트 작성, Canva 생성 1회(후보 1장), 썸네일 저장·확대 검토, 평가 작성.
- 판정: **CONDITIONAL**(도구 BORDERLINE).
- 미검증: 원본 해상도 이미지의 글자·디테일, ChatGPT 변형 프롬프트의 실제 결과, 커밋 없음(지시대로).
- 다음: 사용자/상위 세션이 도구 경로(Chat handoff vs Canva export 재시험)를 고른 뒤 BETA-R1-001 본 실행.

## 8. ChatGPT 비교 시험 (사용자 실행, 2026-09-27)

사용자가 `BETA-R1-chatgpt-prompt.txt`(Canva 프롬프트 + 두 가지 수정)를 ChatGPT 이미지 생성으로 한 번 실행해 결과를 보냈다 `[사용자평가]`. 파일: `BETA-R1-test-02-chatgpt.webp`(1672×941). 비교·평가는 오케스트레이터(Claude Code)가 같은 `19` 기준으로 했다. 생성 픽셀·글자·파형은 canonical 자료가 아니다.

| 기준 | Canva(test-01) | ChatGPT(test-02) |
|---|---|---|
| 받을 수 있는 해상도 | 199×112 썸네일(원본 1680×944은 Canva 안) | 1672×941 원본 |
| 레퍼런스 번역 | 역광 호 → sweep 선 읽힘 | 같음, 더 선명(호의 빛이 선으로 이어짐) |
| 잡음 속 같은 신호 | 박동 안 보임 | **주황 잡음 속 QRS가 같은 간격으로 비침** — "같은 신호" 관계 성립 |
| 출력 파형 | 아이콘 같은 선 | P·QRS·T 구분되는 선, 박동 간격 일정 |
| Reference | 안 보임 | 출력 아래에 **별도 행**으로 그려짐(겹침 아님) — 실제 UI에서는 계약대로 겹치거나 같은 축 행으로 결정 |
| 가짜 실시간 위험 | 파형 끝 점이 커서처럼 읽힘 | 해소 — 소나는 조건 칩에만 |
| 글자 | 판독 불가 | 모든 문구 정확·판독 가능 |
| 완성도(NEAR_FINAL) | 판단 불가 | 제품 화면 후보 수준. 여백·위계·버튼 형태 일관 |
| 문제 | — | ① 축 라벨 `mV`가 시간축 끝에 붙음(단위 오배치) ② 선택 칩·소나에 **입력 파형 전용 주황**을 씀(팔레트 계약 위반 — 실제 UI는 무채색/청록) ③ "10 s" 눈금이 축 끝이 아님 ④ 잡음이 전원 간섭(좁은 주파수)보다 광대역처럼 보임 — 이미지 표현일 뿐, 실제 파형은 저장 자료로 그린다 |

**판정: ChatGPT = PASS**(Beta 본 실행 기준 충족, 위 ①–④는 번역 단계의 Gap으로 기록). Canva = BORDERLINE 유지(원본을 받을 수 없어 검증 불가). → Beta stills는 **사용자가 ChatGPT로 생성**하고, Beta 에이전트가 프롬프트·분해·번역을 맡는다(D-037).
