# BETA-R1-001

Status: **FROZEN (first pass)** — 2026-09-27. 교차 검토(Step 4) 전까지 이 카드의 결론은 바꾸지 않는다. 고칠 것이 생기면 원문을 두고 정정 줄을 덧붙인다.
Baseline: v2.2.1 = `prototype/v2` (branch `claude/r1-autopilot-recommended`), 현재 화면 `verification/redesign-baseline-20260925/v221-attract-1920x1080.png`
Target: Attract(무인 대기) → Story(S1, F-025 정정: 합성 기록 D0 S038 · 20 dB) → Lab 진입 전환 · 1920×1080 · 입력 = 마우스 휠 + 클릭
Zone: Attract·Story 배경·전환 = HIGH(WebGL 허용) · Story 수치·설명 = MEDIUM · 파형·시간축·단위·Reference·Difference = LOW(변경 금지)
Creative Intent: 관람객이 잡음 속 심장 신호를 **발견**하고, "잡음이 무엇이냐에 따라 답이 달라진다"를 한 번의 여정으로 **겪은 뒤**, 같은 신호·같은 시각 그대로 실험실로 들어간다(패킷 §1).
Image fidelity: `NEAR_FINAL_STILL` 목표 · 도구 ChatGPT 이미지 생성(사용자 실행, D-037) · 원본 1672×941
INDEPENDENCE: **clean context** — Beta 전용 에이전트. 읽은 파일: `19`, `20` §2·§3·§7·§8, R1 Step1 패킷, `references/REF-001–004·006`, `11` §1D, baseline 스크린샷, `prototype/v2/src/methods.json`, `prototype/v2/public/archive.json`(저장 지표·trace 디코드), `beta/` 폴더의 TOOL-TEST·PROMPTS·스틸. Alpha·AB·AUTOPILOT·PLAN·WORKLOG·WORK_STATE·records·README는 열지 않았다.
사용자 부재: 사용자가 몇 시간 자리를 비우며 "결정이 필요하면 권장안으로" 요청 → `19`가 사용자에게 묻는 지점은 **"권장안 자동 채택 (사용자 부재)"** 로 표시하고, 다시 볼 조건을 적었다(§Open Questions).

> **생성 이미지의 픽셀·글자·파형·숫자는 canonical 자료가 아니다.** 실제 화면의 파형은 `archive.json` 저장 trace로, 수치는 `storedMetrics`로, 방법 문구는 `methods.json`으로 그린다(패킷 §1.1-3, `19` B5). 이 카드의 측정값(%·px·색)은 이미지에서 잰 **디자인 의도의 근사치**이지 사양 확정값이 아니다.

---

## Reference Pack

패킷 §3 그대로(추가·교체 없음). Beta가 실제로 쓴 부분만 적는다.

| ID | Family | Beta가 가져온 것 | 들어간 스틸 | Do NOT copy (지켰는지) |
|---|---|---|---|---|
| REF-001 moto-card | A | 한 대상에 몰린 **역광 림 라이트**(지구 가장자리) → 거대한 어두운 원반의 은백 호. 호의 빛이 세로 **sweep 선**이 되는 match cut(EFX-001-02·03) | S01·S02·S03–S05(배경)·S06(소멸) | 지구 텍스처·대륙·카드·금속 숫자·Neue Montreal 없음 ✓ |
| REF-002 leoparpeix | A | 스크롤 = 카메라 접근(RCP-10) — Story → Lab의 push-in | S06 | 집·방·베이크 텍스처 없음 ✓. 공간 도입(B2)은 쓰지 않음 |
| REF-003 white-desert | B | **지나온 경로 강조**(굵은 흰색 vs 가늘고 흐린 남은 경로, RCP-16) · **소나 링**(독립 시간 루프, RCP-17)을 조건 표시에만 | S01(칩), S03–S05(조건 경로) | 청록 #6AF0FF·지도·Oswald 없음 ✓ — 소나를 파형에 얹지 않음 ✓ |
| REF-004 seasats | A | 필터를 누르면 **세계가 답 쪽으로 돈다**(RCP-22) → 조건을 바꾸면 방법 순위 열이 그 조건의 1위를 맨 위로 세움. 단일색 표시층(RCP-20) → 방법 표시점은 무채색 한 색, 1위만 청록 | S03–S05 | 지구본·배 아이콘·홀로그램 없음 ✓ |
| REF-005 ciechanow.ski Sound | F | 성분을 **같은 축에 쌓아** 합을 보여 주기 → "Noise(입력 − Reference)" 띠 + Input + Output 3행 | S03–S05 | 일러스트·입자·문구 없음 ✓ |
| REF-006 R2D3 | G | **같은 객체가 사라지지 않고 재배열**(object constancy) → 10개 방법 표시점이 조건마다 순위로 재배열. 박자 3개 + 결론 한 줄 | S03→S04→S05 | 초록/파랑·결정 나무 없음 ✓. **파형은 재배열하지 않음** ✓ |

## Image-specific Reference Extraction

(`19` §2.2, 생성 전 작성분을 결과에 맞춰 정리)

```text
Composition: 가로 1행(Attract) / 3행 스택 + 좌 조건 경로 + 우 방법 순위 열(Story) / 2행 plot 패널(Lab). 공통 하단에 거대한 원반의 역광 호.
Palette relationship: 근흑 배경(측정 #05080b–#060e14) + 은백 림 라이트(#f1f2f6–#faf4f8) + 파형 전용 3색. UI 크롬은 무채색.
Lighting / depth: 뒤에서만 비추는 역광 하나. 앞면 UI·파형은 완전 평면.
Typography mood: 크고 조밀한 neo-grotesk 헤드라인 + 자간 넓은 대문자 마이크로 라벨. 실제는 시스템 글꼴(D-035).
Signature UI object: 호 → sweep 선 match cut(Attract), 조건 경로 + 소나(Story), 재배열되는 방법 표시점(Story).
Background behavior: 역광 호가 Attract에서 가장 밝고, Story에서 유지, Lab 진입에서 0으로.
Waveform role: 모든 장면에서 hero. 가장 밝은 대상. 원근 없음.
CTA / navigation presence: 하단 가운데 pill 하나(휠 아이콘 포함). Attract "Scroll or click to enter", Story "Scroll for next noise" → 마지막 "Click to try it yourself", Lab "Method: … · change method".
Density: Attract 매우 낮음, Story 중간(3열), Lab 중간.
What must not appear: 병상 모니터, BPM, 진단, 홀로그램 심장, 데이터 카드, 원근 파형, 지구 텍스처, 파형 끝 "기록 중" 점, 처리 진행률.
```

## Concept Briefs

| ID | 제목 | 한 줄 | 레퍼런스 | 장면 | 결과 |
|---|---|---|---|---|---|
| B1 | Eclipse Signal | 어둠 속 역광 호의 빛이 sweep 선으로 떨어지고, 그 선을 지나며 잡음에 묻힌 주황 입력이 청록 출력으로 드러난다 | REF-001 · REF-003(칩 소나) · REF-006(절제) | Attract | **채택** → S01·S02 |
| B2 | Walk into the trace | 전시 공간을 휠로 걸어 들어가 파형 평면 앞에 선다 | REF-002 · REF-001 | Attract | **보류** — 3초 목표(신호 발견) 지연 위험, B1과 역할 중복 |
| B3 | Condition dial | 잡음 조건을 고르면 장면이 그 조건의 1위 방법 앞으로 돈다 | REF-004 | Story | **채택(결합)** → S03–S05 순위 열 |
| B4 | Split the noise | Noise · Input · Output(+Reference)를 같은 축에 쌓고 조건 경로를 칠해 남긴다 | REF-005 · REF-003 | Story | **채택(결합)** → S03–S05 3행 + 조건 경로 |
| B5 | Same marks, new order | 방법 표시점이 재배열된 뒤 파형이 Lab plot의 같은 선으로 match cut | REF-006 · REF-001 | Story → Lab | **채택** → S03–S05 재배열, S06·S07 전환 |

결합 한 문장: **"한 줄의 빛(REF-001)이 신호를 드러내고, 조건을 바꿀 때마다 같은 표시점들이 재배열(REF-006)되어 답이 바뀌는 것을 보인 뒤, 그 선이 그대로 실험실의 선이 된다."**

## Generated Stills

생성: 사용자, ChatGPT 이미지 생성, 프롬프트 `BETA-R1-PROMPTS.md` §6(STYLE BLOCK 포함). 전 스틸 1672×941. 평가: Beta 에이전트가 각 이미지를 직접 보고 판정. 참고 후보 `BETA-R1-test-02-chatgpt.webp`(도구 시험, S01의 전신)는 S01로 대체된다.

| ID | 파일 | 장면 | 판정 | 이유 |
|---|---|---|---|---|
| S01 | `BETA-R1-S01.png` | Attract · 대기(focus) | **KEEP** | test-02 결함 ①–⑤ 모두 해결: `mV`는 세로축 위, 시간축 11눈금·"0 s"/"10 s" 양 끝, 선택 칩·소나 무채색(#cacdd5), 전원 간섭 잡음이 규칙적 물결로 보임, 주황→청록 박동 간격 연속. 호의 정점에서 sweep이 솟아 match cut이 가장 명확. 약점: 회색 Reference가 청록 아래 그림자로만 보임(겹침은 맞지만 식별 약함) |
| S02 | `BETA-R1-S02.png` | Attract · 첫 3초 | **TUNE** | 어둠·흐린 제목·왼쪽 좁은 청록 구간으로 "막 드러나는 순간"은 성립. 그러나 ① sweep 선(x≈20 %)이 호의 정점(x≈50 %)과 떨어져 있어 "호의 빛이 선이 된다"가 끊김 ② 잡음이 전원 간섭(규칙 물결)이 아니라 광대역 → S01(Powerline)과 불일치 |
| S03 | `BETA-R1-S03.png` | Story 박자 1 · Powerline → M04 | **KEEP** | 3열 구조(조건 경로 · 3행 파형 · 순위 열)가 명확하고 위계가 제품 수준. 순위·수치 저장값과 일치(§수치 검증). 약점: 헤더의 "20 DB"(단위 대문자화), Noise 띠 진폭이 저장값보다 과장(Gap G-01) |
| S04 | `BETA-R1-S04.png` | Story 박자 2 · Baseline wander → M_FE | **KEEP** | 지나온 경로 굵은 흰색, 현재 정거장 소나, 순위 재배열이 저장값과 일치. Noise 띠가 느린 출렁임으로 조건 차이가 즉시 읽힘. 재배열 궤적(motion trail)은 거의 보이지 않음 → 모션 사양에서 해결 |
| S05 | `BETA-R1-S05.png` | Story 박자 3 · Muscle → M06L6 | **KEEP** | 순위·수치·"auxiliary experiment" 주석·범위 문장("on this one stored segment") 모두 요구대로. CTA가 "Click to try it yourself"로 바뀌어 다음 행동이 명확. 약점: Input 행에 앞 장면의 기저선 출렁임이 남아 있음(이미지 오류, G-06) |
| S06 | `BETA-R1-S06.png` | Lab 전환 · 중간 | **TUNE** | 패널·격자·눈금이 조립되고 호가 거의 꺼지며 Story 요소가 가장자리로 흐려지는 전환 키프레임은 좋다. 그러나 **파형의 박동 위치가 S05와 다름**(S05 13박, S06 12박, 위치 이동) → 이 전환의 핵심 약속("같은 선·같은 시각")을 이미지가 지키지 못함. 구현에서는 같은 trace라 자동 해결되지만 사용자에게 보일 때 주석 필요 |
| S07 | `BETA-R1-S07.png` | Lab 도착 | **TUNE** | v2.2.1 Lab 구조(입력 행 / 출력+Reference 겹침, 같은 ±mV 눈금, 같은 시각 sweep 커서)를 어두운 시리즈 스타일로 옮긴 모습이 설득력 있음. 그러나 ① 시간축이 "10 s" 눈금 너머로 이어지고 파형이 축 끝을 넘음(test-02 ③ 재발) ② 범례 "Reference · common front-end applied"는 **D0에서 틀린 설명**(D0 Reference = 합성 기준 신호, G-04) |

## 수치 검증 (스틸의 모든 숫자 ↔ `archive.json`)

방법: `archive.json`을 읽어 `scenes[id].storedMetrics[method].snr_imp`, `fs`, `n`, scene `record`/`snr`/`cond`를 대조. trace는 `signed int16 LE base64 × scene.scale = mV`로 디코드(provenance `traceEncoding`).

| 스틸 | 이미지 속 숫자/사실 | 저장값 | 일치 |
|---|---|---|---|
| S03 | "SNR improvement 19.4 dB" (M04) | `d0-pli-20` M04 `snr_imp` 19.45 | ✓ (표시 규칙 주의: 19.45 → 반올림 방식에 따라 19.4/19.5, G-10) |
| S03 | 순위 M04, M_FE, M06L6, M08, M03, M09, M06, M01, M05, M02 | 19.45, 17.95, 14.22, 9.92, 6.66, 5.01, 5.00, 2.60, −0.44, −5.42 | ✓ (M09 5.01 vs M06 5.00 — 사실상 동률) |
| S04 | "SNR improvement 23.2 dB" (M_FE) | `d0-bw_synth-20` M_FE 23.20 | ✓ |
| S04 | 순위 M_FE, M04, M03, M06L6, M08, M09, M06, M01, M05, M02 | 23.20, 21.71, 12.80, 11.78, 7.50, 2.53, 2.49, 0.18, −2.90, −7.85 | ✓ |
| S05 | "SNR improvement 9.9 dB" (M06L6) | `d0-ma_synth-20` M06L6 9.91 | ✓ |
| S05 | 순위 M06L6, M08, M04, M09, M06, M01, M03, M05, M_FE, M02 | 9.91, 9.00, 7.29, 6.21, 6.04, 3.13, 2.55, 1.32, 0.58, −3.55 | ✓ |
| S03–S05 | B01 순위 제외 | B01 23.86 / 23.2 / 9.5 | ✓ 제외 표기 맞음. S04에서 M_FE = B01(23.2), S05에서 M06L6(9.91) > B01(9.5) — 화면 문구로 해석하지 않음 |
| S03–S05·S07 | "D0 S038", "20 dB" | scene `axis` d0, `record` S038, `snr` 20 | ✓ (단 S03–S05는 "20 DB"로 대문자화, G-09) |
| S07 | "250 Hz" | `fs` 250 | ✓ |
| 전 스틸 | 시간축 0–10 s | `n` 2500 / `fs` 250 = 10 s | ✓ |
| S06·S07 | 세로 눈금 ±2.0 mV | 표시 범위일 뿐. 저장 clean 범위 −0.88…+0.90 mV | 눈금 자체는 v2.2.1과 같음 ✓. 이미지 속 R파 높이(≈1.2–1.5 mV)는 저장값(0.90 mV)보다 큼 ✗ (G-05) |
| 전 스틸 | 박동 수 | 저장 clean: **17박 / 10 s, 평균 RR 0.61 s** | ✗ 이미지 13–14박(S03–S05 13, S06 12, S07 13) (G-05) |
| S03 | Powerline 잡음 = 약 10 Hz로 보이는 물결 | 저장 잡음 주성분 **60 Hz**, p2p 0.072 mV | ✗ 주파수·진폭 모두 과장(G-01, G-02) |
| S04 | Baseline wander = 10 s에 약 2주기 | 주성분 0.30 Hz(≈3주기), p2p 0.061 mV | 모양 ✓, 진폭 ✗(G-01) |
| S05 | Muscle = 터지는 고주파 | 주성분 88 Hz, p2p 0.250 mV | 모양 ✓, 진폭 과장(G-01) |

이미지에 **저장값에 없는 숫자는 없다**(BPM·%·처리 시간 없음). 틀린 것은 파형 모양·박동 수·진폭(이미지 전용, 구현에서 저장 trace로 교체)과 표기 규칙뿐이다.

## Visual Breakdown

측정: 1672×941 이미지를 OpenCV로 읽어 색 마스크(주황 H 8–22, 청록 H 75–90)의 범위, 무채색 글자 띠 높이, 지정 좌표 3×3 평균 색을 쟀다. px는 1920 폭 환산(×1.148). 글자 크기는 글자 띠 높이에서 추정한 **근사값**.

### 공통 토큰 (이미지 측정 → 구현 제안)

| 토큰 | 이미지 측정 | 구현 값 |
|---|---|---|
| 배경 | #05080b · #040609 · #060b0f · #060e14 | `--bg: #06090d` + 2–3 % 필름 그레인(선택) |
| 입력 파형 | 선 코어 #f1c27d / #ecb975 / #f7b34b (발광 포함) | **#ffbc79 고정**(예약색) |
| 출력 파형 | #93f0e3 / #85efd6 / #76f7e7 | **#67e7c3 고정**(예약색) |
| Reference | 청록 뒤 회색 그림자로만 식별 | **#c4c6c7 고정**, 1 px, 출력 뒤 레이어 |
| 1위 방법 점 | #72f7cf | 출력색 #67e7c3 |
| 다른 방법 점 | #acaeb3 | 무채색 `--ink-3` |
| 선택 칩·버튼 채움 | #cacdd5 · #c5c8d0 · #babec2 | `--chip-on: #c9ccd3`, 글자 #0b0e12 |
| 비선택 칩 테두리·pill 테두리 | #5f6164 | `--line-2` |
| 역광 호 정점 | #f1f2f6 · #faf4f8 | 셰이더 rim 색 `#eef1f6` |
| Lab 패널 | #070d12 · #070f14, 1 px 밝은 테두리, 큰 radius | 기존 v2.2.1 plot 패널 색 계열을 어둡게 |

### S01 · Attract 대기

| 영역 | 위치(% of W×H) | 크기 · 색 | 역할 | Reference origin | ECG 의미 |
|---|---|---|---|---|---|
| 헤드라인 "Signal, out of noise" | x 5–48 %, y 8–17 % | 글자 띠 98 px → **약 96 px**, 굵게, #eef0f2 | 첫 문장 | REF-001 대형 헤드라인 | 전시 정체성 |
| 부제 "STORED REPLAY · SYNTHETIC RECORD" | x 5–35 %, y 18–20 % | 대문자 약 14 px, 자간 0.3 em | 범위 고지 | — | 저장 재생 · 합성 기록 |
| 조건 칩 3개 | x 62–96 %, y 10–15 % | pill 높이 ≈ 56 px, 글자 ≈ 20 px, 선택 = #cacdd5 채움 | 조건 예고 | REF-004 필터 | 잡음 종류 |
| 소나 링 | 선택 칩 왼쪽 끝, 지름 ≈ 100 px | 무채색 2중 링 | 현재 조건 표시 | REF-003 EFX-003-03 | "Powerline"이 현재 조건 |
| 파형 행 | x 5–95 %, y 30–56 % (선 y 37–50 %) | 주황 x 5–49 %, 청록 x 51–95 % | hero | — | 입력(잡음) → 출력 + Reference 겹침 |
| sweep 선 | x 50 %, y 0–64 % | 1–2 px 은백, 호 정점에서 솟음 | match cut | REF-001 EFX-001-02·03 | 저장 재생의 현재 시각 |
| 시간축 | y 55 %, 11눈금 | "0 s"/"10 s" 약 18 px | 단위 | — | 같은 절대 시간 |
| `mV` | x 5 %, y 31 % | 약 18 px | 단위 | — | 진폭 단위 |
| 역광 호 | 정점 y 64 %, 화면 폭 전체 | rim #f1f2f6 | 분위기·전환 기원 | REF-001 | — |
| CTA pill | x 40–60 %, y 86–93 % | 높이 ≈ 82 px, 글자 ≈ 22 px, #c5c8d0 | 다음 행동 | — | 휠 또는 클릭으로 진입 |
| 캡션 | x 2–25 %, y 95 % | 대문자 약 13 px, 자간 0.35 em, 회색 | 고지 | — | 실제 장치 세션 없음 |

### S02 · Attract 첫 3초

| 영역 | 위치 | 크기 · 색 | 역할 · 의미 |
|---|---|---|---|
| 헤드라인(흐림) | x 3–36 %, y 6–13 % | 약 60 px, 불투명도 ≈ 35 % | 페이드 인 중 |
| 파형 행 | x 4–96 %, y 32–53 % | 청록 x 4–19 %, 주황 x 20–96 % | 막 드러난 신호 |
| sweep 선 | x ≈ 19.7 % | 은백, 끝에 작은 발광점 | 드러냄의 선단(UI-02 sweep 선단 발광 범위 안) |
| 역광 호 | 정점 y 66 % | S01보다 어둡고 얇음 | 켜지는 중 |
| 캡션 | 좌하단 | 동일 | 고지 |

### S03–S05 · Story (공통 레이아웃, 조건만 변경)

| 영역 | 위치 | 크기 · 색 | 역할 | Reference origin | ECG 의미 |
|---|---|---|---|---|---|
| 헤더 "SAME SYNTHETIC ECG · RECORD D0 S038 · 20 DB · STORED 10-SECOND SEGMENT" | x 4–56 %, y 7 % | 대문자 약 13 px, 자간 0.3 em | 범위 고지 | — | 장면 단위 범위(§1.1-5) |
| 헤드라인 | x 3.5–83 %, y 10–17 % | 글자 띠 69 px → **약 68 px**, 굵게 | 스토리 주장 | REF-006 한 박자 한 통찰 | S1 |
| 조건 경로 | x 3–13 %, y 23–62 % | 정거장 원 지름 ≈ 52 px, 현재 = 흰 채움 + 소나, 지나온 선 굵음(≈ 6 px) / 남은 선 1 px | 진행 상태 | REF-003 EFX-003-02·03 | 3개 잡음 조건 |
| Noise 띠 | x 18–82 %, y 29–33 % | 주황(불투명) | 성분 | REF-005 | 입력 − Reference |
| Input 행 | x 18–82 %, y 37–48 % | 주황 | 입력 | — | 같은 기록 + 조건별 잡음 |
| Output 행 | x 18–82 %, y 55–64 %, 라벨 "Output · {code} {name}" 약 18 px | 청록 + 회색 겹침 | 1위 방법 출력 | — | 저장 출력 |
| 시간축 | x 18–82 %, y 67–70 % | 0–10 s 정수 라벨 11개, 약 18 px | 단위 | — | 같은 시각 |
| 순위 열 | x 85–99 %, y 22–70 % | 점 지름 ≈ 20 px(1위 ≈ 26 px), 간격 ≈ 45 px, 코드 약 18 px | 재배열 객체 | REF-006 · REF-004 | 저장 순위(B01 제외) |
| 1위 수치 | 1위 점 오른쪽 | "SNR improvement {v} dB" 약 16 px | 유일한 숫자 | — | `snr_imp` |
| Oracle 표시 | x 85–99 %, y 69 % | 속빈 원 | 비교 기준 분리 | — | B01, 참조가 있어야 쓸 수 있음(§1.1-6) |
| 결론 줄(S05만) | x 31–69 %, y 74 % | 약 24 px | 결론 + 범위 | REF-006 끝 반전 자리 | "이 저장 구간에서" |
| 역광 호 | 정점 y 76 % | 흐린 rim | 배경 연속 | REF-001 | — |
| CTA pill | x 42–58 %, y 88–94 % | 테두리만(S03·S04) | 다음 박자 | — | 휠 = 다음 조건, 마지막은 클릭 |

### S06 · Lab 전환 중간

| 영역 | 위치 | 크기 · 색 | 역할 · 의미 |
|---|---|---|---|
| 라벨 "Lab · same signal, same moment" | x 12–39 %, y 10 % | 약 20 px, 자간 넓음 | 전환 의미 고지 |
| 패널 | x 12–88 %, y 14–86 % | #070d12, 1 px 밝은 테두리, radius ≈ 24 px | Lab plot 틀 조립 |
| 입력 행 / 출력 행 | 입력 y 20–46 %, 출력 y 53–80 % | 주황 / 청록 + 회색 | 같은 trace, 커짐 |
| mV 눈금 | 각 행 왼쪽 | −2.0 … 2.0 | 같은 ±mV 축 |
| sweep 커서 | x ≈ 43.5 % (4 s 부근) | 은백 | 같은 시각 |
| Story 잔상 | x 0–10 %, x 90–100 % | 흐림 | 빠져나가는 조건 경로·순위 열 |
| 역광 호 | y 88 % 아래 | 거의 꺼짐 | bloom → 0 |

### S07 · Lab 도착

| 영역 | 위치 | 크기 · 색 | 역할 · 의미 |
|---|---|---|---|
| 제목 "Same ECG, different denoising" | x 5–48 %, y 4–11 % | 글자 띠 63 px → **약 64 px** | v2.2.1 제목과 같은 뜻 |
| 부제 "SYNTHETIC RECORD D0 S038 · MUSCLE · 20 dB · 250 Hz · REPLAY" | x 5–52 %, y 11 % | 대문자 약 15 px | 장면 메타데이터 |
| 조건 칩 + "TRY ANOTHER NOISE" | x 60–95 %, y 5–10 % | 선택 칩 채움 | 직접 바꿔 보기 |
| 패널 | x 5–95 %, y 14–88 % | #070f14 | plot 컨테이너 |
| 입력 행 | y 17–47 %, 라벨 "INPUT · NOISY" | 주황, ±2.0 mV | 입력 |
| 출력 행 | y 51–81 %, 라벨 "OUTPUT · M06L6" | 청록 + 회색 겹침 | 출력 + Reference |
| sweep 커서 | x ≈ 42 % | 은백 1 px | 같은 시각 |
| 범례 | y 85 % | 약 17 px | 선 의미 |
| 방법 pill | x 39–61 %, y 91–96 % | #babec2 채움 | 방법 바꾸기 |
| 캡션 | 좌하단 | 약 15 px | 고지 |

## Component Translation Table

| Image element | Actual UI component | State / data binding | Component reference (v2.2.1 재사용) | Accessibility |
|---|---|---|---|---|
| 역광 호 + 그레인 | `HorizonBackdrop` (새, vanilla WebGL 모듈 + React mount) | `uniform rim`(0–1), `uniform apexY`, `uniform sweepX` — 스크롤/시간 값은 GSAP ticker로 직접 전달, React state 아님(D-028) | 없음(새). 다락방 spike의 vanilla mount 패턴 참고(패킷 §4) | `aria-hidden`. reduced-motion: 정지 프레임 |
| sweep 선 | Attract: 셰이더 안의 선 / Story·Lab: plot 레이어 커서 | `playhead`(sample index) 하나를 plot과 셰이더가 공유 | v2.2.1 sweep 커서(baseline 스크린샷의 세로선) | 장식. 현재 시각은 텍스트로 제공하지 않음(재생 중 변동 → live region 금지) |
| 파형 행(입력/출력/Reference) | 기존 plot renderer(Canvas 2D) | `archive.scenes[id].traces.input / [method] / clean`, `scale`, `fs`; 모든 행 같은 sample index·같은 ±mV | v2.2.1 plot, CompareLens(같은 sample index), same-time handoff | 행 라벨 텍스트, 색 외에 라벨로 구분 |
| Noise 띠 | `ComponentStrip` (새, Canvas 2D) | `traces.input − traces.clean` 계산 표시. 라벨 **"입력 − Reference"**(§8.1), 확대 축 규칙은 OQ-1 | plot renderer 재사용 | 라벨로 Difference(출력 − Reference)와 구분 |
| `mV` · 시간축 | plot axis | 0–10 s(`n/fs`), 11눈금, 양 끝 라벨 | v2.2.1 axis | 단위 텍스트 유지 |
| 조건 칩(Attract·Lab) | `NoiseChips` | Attract: 장식 예고(클릭 = 해당 박자로 Story 진입) / Lab: `cond` 선택 → 같은 `snr`, 같은 playhead로 scene 교체 | v2.2.1 조건 선택 컨트롤 | `button` + `aria-pressed`, 키보드 포커스 유지 |
| 소나 링 | `SonarRing` (새, CSS keyframes) | 독립 시간 루프(RCP-17), 데이터와 무관 | 없음 | `aria-hidden`, reduced-motion 시 정지 링 1개 |
| 조건 경로 | `ConditionPath` (새, SVG) | `beatIndex` 0–2 → 칠한 길이(GSAP DrawSVG 또는 `stroke-dashoffset`) | REF-003 재현 spike 코드 경로(패킷 §4) | `nav` + `ol`, 현재 항목 `aria-current="step"` |
| 방법 순위 열 | `MethodRankColumn` (새, DOM) | `storedMetrics[m].snr_imp`로 정렬(B01 제외), 1위만 수치 표시. 재배열 = GSAP Flip(같은 DOM 노드 이동) | 없음. 방법 이름·원리는 `methods.json` | `ol`, 각 항목 텍스트 "순위 n, M04 Adaptive SWT". 순위를 색만으로 전달하지 않음 |
| 1위 수치 | `MetricBadge` | `snr_imp` 1자리 표시(G-10 규칙), 단위 "dB" 소문자 | v2.2.1 지표 formatter | 텍스트 |
| Oracle 표시 | `OracleMark` | B01 존재 여부만, 수치 없음 | — | "B01, 참조가 있어야 쓸 수 있는 비교 기준" |
| hover 카드(이미지엔 없음) | `MethodCard` | `methods.json[m].principle / limit` 그대로 | v2.2.1 방법 설명 | 포커스로도 열림 |
| 헤드라인·헤더·결론 줄 | `StoryCopy` | 한국어 최종 문구(OQ-3), 범위 문구 고정 | — | 제목 계층 h1/h2 |
| CTA pill | `AdvanceButton` | Attract: 진입 / Story: 다음 박자 → 마지막은 Lab 진입 | v2.2.1 CTA 버튼 | 실제 `button`, Enter/Space 동작 |
| 고지 캡션 | `ReplayNotice` | 라벨은 v2.2.1 상태 로직(`provenance.status` = archived)에서 | v2.2.1 REPLAY 라벨 | 항상 보임 |
| Lab 패널·범례·방법 pill | 기존 Lab | 도착 시 `cond`=ma_synth, `method`=M06L6, `playhead` 유지 | v2.2.1 Lab 전체(2라운드 전까지 재배치 없음) | 기존 유지 |

## Interaction Translation Spec

입력 = 마우스 휠 + 클릭(패킷 §7.1). 키보드 접근은 유지(Tab/Enter/Space, ←/→로 박자 이동).

**역광 호 · sweep (Attract)**
```text
Trigger: 무입력(Attract 대기). 휠/클릭 없으면 반복.
Hover/active: 없음(장식).
Enter: 페이지 로드 또는 Lab에서 60 s 무입력 후 복귀 → S02 도착 시퀀스.
Exit: 휠 1회 또는 클릭 → Story 박자 1.
Transition to next scene: 호의 rim이 약해지며 sweep이 Story의 Output 행 커서 위치로 이동(같은 playhead).
Reduced motion: S01 정지 프레임(sweep 50 % 위치 고정, 호 정지), 페이드만.
```

**조건 칩 (Attract)**
```text
Trigger: 클릭.
Hover/active: 테두리 밝기 +; 선택 칩은 이미 채움.
Enter: S01에서 페이드 인.
Exit: 클릭한 조건의 박자로 Story 진입(Powerline → 박자 1, Baseline → 2, Muscle → 3).
Transition to next scene: 칩 → 조건 경로 정거장으로 위치 이동(FLIP).
Reduced motion: 즉시 전환.
```

**Story 박자 (휠)**
```text
Trigger: 휠 한 번의 제스처 = 한 박자(스냅). 역방향 휠 = 이전 박자.
Hover/active: 순위 점 hover → MethodCard(methods.json 원리·한계). 조건 정거장 hover → 밝기 +.
Enter: 박자마다 Noise 띠·Input 행이 새 scene trace로 교차 페이드(파형 morph 금지 — 두 저장 trace 사이 중간 모양을 만들지 않는다), Output 행은 새 1위 방법 trace로 교차 페이드, Reference는 그대로(같은 기록).
Exit: 박자 3에서 휠 계속 또는 CTA 클릭 → Lab 전환.
Transition to next scene: S06 push-in.
Reduced motion: 스냅 대신 즉시 교체, 순위 재배열은 위치 이동 없이 페이드.
```

**조건 정거장 클릭 (Story)**
```text
Trigger: 클릭 → 해당 박자로 바로 이동(되돌리기 포함).
Hover/active: 커서 pointer, 밝기 +.
Enter/Exit: 박자 전환과 동일.
Reduced motion: 동일(즉시).
```

**Lab 조건 칩 / 방법 pill**
```text
Trigger: 클릭.
Hover/active: v2.2.1 동작.
Enter: S07 도착 직후 칩에 소나 1회(0.8 s)로 "바꿔 보세요" 신호, 이후 정지.
Exit: 없음(Lab 내부). 60 s 무입력 → Attract.
Transition: 조건 변경 시 playhead 유지(same-time handoff).
Reduced motion: 소나 없음.
```

## Motion Storyboard

시간 값은 1차 제안(`25` §5 성능 예산처럼 P2 전시 PC 확인 전 잠정). ease 이름은 GSAP 기준.

### M-A · Attract 도착 S02 → S01 (시간 기반, 무입력)

| 시각 | 무엇이 움직이나 | 지속 | easing |
|---|---|---|---|
| 0.0 s (Frame 0) | 완전 암흑, 캡션만 | — | — |
| 0.0–1.2 s | 역광 호 rim 0 → 0.6, 정점부터 좌우로 번짐 | 1.2 s | `power2.out` |
| 0.8–1.4 s | 파형 행 전체가 주황(입력)으로 불투명 0 → 1. 세로축·시간축 0 → 35 % | 0.6 s | `power1.out` |
| 1.4–3.0 s | sweep 선이 호 정점에서 떨어져 **x = 0 %(0 s)** 로 이동 후 재생 속도로 오른쪽 진행. 지나간 구간 = 저장 출력 + Reference, 남은 구간 = 입력 | 재생 1× (10 s 창) | linear(재생 시간) |
| 1.6–2.4 s | 헤드라인 0 → 100 % | 0.8 s | `power2.out` |
| ≈ 3.0 s | **3초 목표 도달**: 청록 박동이 2–3개 드러남 | — | — |
| sweep 50 % (≈ 6.4 s) | S01 상태: 칩·CTA 페이드 인(0.5 s), 소나 루프 시작 | 0.5 s | `power1.out` |
| 10 s 끝 | sweep이 끝에 닿으면 전체를 입력으로 되돌리지 않고 **다음 반복에서 다시 0 s부터**(v2.2.1 10초 반복과 같은 규칙) | — | — |

- Arrival → focus → user action(휠/클릭) → handoff(M-B 시작).
- 정정(G-03): 이미지 S02처럼 sweep이 호와 떨어진 위치에서 시작하지 않는다. 호 정점에서 떨어져 0 s로 가는 짧은 이동이 match cut의 실체다.
- Reduced motion: S01 정지 화면을 0.3 s 페이드로 표시, sweep 이동 없음(출력은 전체 표시), 소나 정지.

### M-B · Attract → Story 박자 1 (휠 1회 또는 클릭)

| 구간 | 무엇이 움직이나 | 지속 | easing |
|---|---|---|---|
| 0–0.6 s | 헤드라인·칩·CTA 위로 12 px + 페이드 아웃. 호는 정점 y 64 % → 76 %로 내려감 | 0.6 s | `power2.inOut` |
| 0.2–0.9 s | 파형 행이 Story의 Input 행 위치로 이동(형태 불변, 크기만 조정), Output 행이 그 아래로 분리 | 0.7 s | `expo.out` |
| 0.5–1.1 s | 조건 경로·순위 열·Noise 띠 페이드 인, 순위 점은 위에서부터 30 ms 간격 | 0.6 s | `power2.out` |
- Reduced motion: 교차 페이드 0.3 s.

### M-C · Story 박자 S03 → S04 → S05 (휠 스냅, 박자당 한 제스처)

| 구간 | 무엇이 움직이나 | 지속 | easing |
|---|---|---|---|
| 0–0.5 s | 조건 경로: 다음 정거장까지 칠함(DrawSVG), 소나가 새 정거장으로 이동 | 0.5 s | `power2.inOut` |
| 0–0.4 s | Noise 띠·Input 행: 이전 scene trace 페이드 아웃 / 새 scene trace 페이드 인(**교차 페이드만, morph 금지**) | 0.4 s | `power1.inOut` |
| 0.1–0.5 s | Output 행: 새 1위 방법 trace 교차 페이드, 라벨 교체. Reference 행은 **움직이지 않음**(같은 기록임을 보여 줌) | 0.4 s | `power1.inOut` |
| 0.2–0.9 s | 순위 열: 같은 10개 점이 새 순위로 **이동**(GSAP Flip, 겹침 방지 stagger 20 ms), 1위 점 커지며 청록, 이전 1위는 무채색으로 | 0.7 s | `expo.inOut` |
| 0.7–1.0 s | 1위 수치 페이드 인 | 0.3 s | `power1.out` |
| (S05만) 1.0–1.4 s | 결론 줄 페이드 인, CTA 문구 "다음 잡음" → "직접 바꿔 보기" | 0.4 s | `power2.out` |
- 스크롤 구간: 박자당 한 화면 높이의 가상 스크롤(스냅). 되돌리면 같은 상태(스크롤 위치로만 결정).
- 파형 위 재생 sweep은 Story에서 멈춤(playhead 고정, 기본 4 s) — 비교 장면에서 움직이는 파형은 읽기 방해. 이 고정 playhead가 Lab 도착 시각이 된다.
- Reduced motion: 경로 즉시 칠함, 순위는 이동 없이 교체 + 페이드 0.2 s.

### M-D · Story S05 → S06 → S07 Lab (클릭 또는 박자 3 이후 휠)

| 구간 | 무엇이 움직이나 | 지속 | easing |
|---|---|---|---|
| 0–0.3 s | 결론 줄·헤드라인·CTA 페이드 아웃 | 0.3 s | `power1.in` |
| 0–0.9 s | **카메라 push-in**: Input·Output 행이 Lab 패널의 두 행 위치·크기로 확대 이동. 파형은 같은 trace·같은 sample index, 원근 없음(2D 스케일만) | 0.9 s | `expo.inOut` |
| 0.2–0.9 s | Noise 띠 페이드 아웃(Lab에는 없음), 조건 경로·순위 열이 좌우 가장자리로 밀리며 blur 8 px + 페이드(S06) | 0.7 s | `power2.in` |
| 0.3–1.0 s | Lab 패널 테두리·격자·mV 눈금이 가장자리에서 그려짐 | 0.7 s | `power2.out` |
| 0–0.8 s | 역광 호 rim → **0**(Lab 진입 전 bloom 0, REF-001 Risk) | 0.8 s | `power2.in` |
| 0.9–1.3 s | S07: 제목·칩·범례·방법 pill 페이드 인, sweep 커서가 Story의 고정 playhead(4 s) 위치에 나타남 | 0.4 s | `power2.out` |
| 1.3–2.1 s | 선택 칩에 소나 1회 | 0.8 s | `sine.out` |
- 수용 기준: 전환 전후 같은 sample index에서 R파 x 좌표 차이 ≤ 1 px(12프레임 균등 캡처로 확인).
- Reduced motion: 교차 페이드 0.3 s, 확대 이동 없음.

## Image-to-Implementation Gap

| ID | Visually shown | Implementable as-is? | Required adaptation | Data risk | Performance risk |
|---|---|---|---|---|---|
| **G-01** | Noise 띠·Input 잡음 진폭이 크게 보임(S03–S05) | **아니오** | 저장 잡음 p2p: pli 0.072 mV, bw 0.061 mV, ma 0.250 mV(신호 ±0.9 mV). 같은 축이면 pli·bw 잡음은 거의 안 보임 → OQ-1 결정(Noise 띠만 명시적 확대 축) | 높음 — 과장된 잡음은 가짜 자료 | 없음 |
| **G-02** | Powerline 물결이 약 10 Hz로 보임 | 아니오 | 저장 잡음은 60 Hz(250 Hz 샘플링에서 약 4샘플/주기). 전체 10 s 창에서는 촘촘한 띠로만 보인다 → Noise 띠에 **시간 확대 렌즈**(CompareLens 재사용, 예: 0.5 s 창)를 두어 규칙적 물결을 실제 자료로 보이게 | 중 | 낮음 |
| **G-03** | S02: sweep이 호 정점과 떨어진 위치 | 아니오(의도와 다름) | M-A: 호 정점 → 0 s로 떨어지는 이동을 명시 | 없음 | 없음 |
| **G-04** | S07 범례 "Reference · common front-end applied" | 아니오 | D0 Reference = **합성 기준 신호**(`provenance.reference`: "D0: synthetic reference from source bank"). 범례는 axis별 문구: D0 "Reference · 합성 기준 신호", D1 "Reference · 원기록에 공통 FE 적용" | 높음 — 기준 신호 정의 오류 | 없음 |
| **G-05** | 박동 13–14개/10 s, R파 ≈ 1.2–1.5 mV, 모든 Story 출력이 같은 모양 | 아니오 | 저장 clean: 17박, 평균 RR 0.61 s, 범위 −0.88…0.90 mV. 방법 간 출력 차이는 매우 작음(pli M04 vs M_FE RMS 0.0025 mV) → 파형은 전부 저장 trace로. "출력 모양이 달라 보이는" 연출을 만들지 않는다 — 차이는 순위 열과 수치가 말한다 | 높음(이미지 파형 재현 금지) | 없음 |
| **G-06** | S05 Input에 기저선 출렁임이 남음 | 아니오 | 각 박자의 Input은 해당 scene의 `traces.input`만 | 중 | 없음 |
| **G-07** | S06 박동 위치가 S05와 다름 | 아니오(약속 위반처럼 보임) | 구현은 같은 trace라 자동 해결. 사용자 설명 때 "이미지 전용 오류" 주석 | 낮음 | 없음 |
| **G-08** | S07 시간축이 "10 s" 너머로 이어지고 파형이 축을 넘음 | 아니오 | 축 끝 = 10 s 눈금 = 마지막 sample(v2.2.1 축 규칙) | 중 | 없음 |
| **G-09** | 헤더 "20 DB" (대문자화) | 아니오 | 자간 넓은 대문자 라벨이라도 단위는 원래 표기(dB, mV, Hz) 유지 — 단위 span은 `text-transform: none` | 낮음 | 없음 |
| **G-10** | "19.4 dB" (저장 19.45) | 조건부 | 반올림 규칙이 둘로 갈리면 19.4/19.5가 섞인다 → v2.2.1 지표 formatter 하나만 사용, 패킷 F-025 표기(19.4)와 일치하는지 구현 때 확인 | 중 | 없음 |
| G-11 | S01 Reference가 청록 뒤 그림자로만 보임 | 부분 | 겹침은 계약대로. 식별성은 v2.2.1과 같은 1 px #c4c6c7 + 청록 선 1.5 px로 조정, 범례로 보완 | 낮음 | 없음 |
| G-12 | 파형 발광(glow) | 부분 | 입력·출력 선에 약한 glow는 Attract에서만, Story·Lab에서는 0(판독성, docs/22 UI-02 범위). 색은 예약색 고정 | 낮음 | 중(블러 필터 비용) → 캔버스 `shadowBlur` 대신 2패스 선(굵은 저불투명 + 얇은 선) |
| G-13 | 이미지 문구 전부 영어 | 아니오 | 최종 문구 한국어(OQ-3), 이미지 문구는 자리표시 | 낮음 | 없음 |
| G-14 | "REPLAY" 라벨 | 조건부 | archive `provenance.status` = archived → v2.2.1 상태 로직의 라벨(REPLAY / ARCHIVED REPLAY)을 그대로(OQ-6) | 중 | 없음 |
| G-15 | 역광 호의 부드러운 대기 번짐·그레인 | 예(셰이더) | 전체 화면 quad 1개, SDF 원 + rim 함수 + 노이즈. 텍스처 없음 | 없음 | 낮음–중(1920×1080 fragment, pixelRatio ≤ 1) |
| G-16 | 순위 열 재배열 궤적(S04·S05 거의 안 보임) | 이미지로 불가 | 모션(M-C)에서 Flip 이동으로 표현, 궤적 선은 그리지 않음 | 없음 | 낮음 |
| G-17 | Attract 잡음이 강함(S01·S02) vs Story 20 dB는 약함 | 조건부 | OQ-2: Attract는 `d0-pli-0`(잡음 p2p 0.53 mV) | 중 — dB 표기 필요 | 없음 |

## Implementation Translation

### 렌더 레이어 (뒤 → 앞)

| # | 레이어 | 기술 | 내용 | 비고 |
|---|---|---|---|---|
| L0 | 배경 · 역광 호 · 그레인 · Attract sweep | **WebGL**(three.js 없이 raw quad도 가능, 기존 스택이면 three `ShaderMaterial` 1개) vanilla 모듈, React는 mount만 | uniform: `rim`, `apexY`, `sweepX`, `time` | HIGH 구역(D-027). WebGL 불가 시 CSS radial-gradient + 1 px div fallback |
| L1 | 파형 plot(입력·출력·Reference·Noise 띠·축) | **Canvas 2D**, v2.2.1 plot renderer 재사용 | `archive.json` trace 디코드(int16 × scale) | LOW 구역: 기존 렌더러 규칙 그대로 |
| L2 | 조건 경로 | **SVG** + GSAP(DrawSVG 또는 dashoffset) | `beatIndex` | REF-003 spike 경로 |
| L3 | 방법 순위 열 · 1위 수치 · Oracle 표시 · MethodCard | **DOM** + GSAP Flip | `storedMetrics`, `methods.json` | 같은 DOM 노드 재사용(object constancy) |
| L4 | 텍스트·칩·CTA·고지 | **DOM** | 문구 상수 | 시스템 글꼴(D-035) |
| L5 | 소나 링 | **CSS keyframes** | 없음 | 독립 시간 루프 |

- 스크롤: Lenis 1개 + ScrollTrigger(스냅 3박자). 프레임 값은 GSAP ticker → WebGL uniform·Canvas에 직접, React state 경유 금지(D-028).
- 새 컴포넌트: `HorizonBackdrop`, `ComponentStrip`, `ConditionPath`, `MethodRankColumn`, `SonarRing`, `StoryCopy`, `AdvanceButton`(기존 버튼 확장 가능).
- 재사용: plot renderer, CompareLens(G-02 시간 확대 렌즈), same-time handoff, 지표 formatter, REPLAY 라벨 로직, Lab 전체.
- 에셋: **비트맵·영상·3D 모델 없음.** 글꼴 추가 없음. 이미지 생성물은 어떤 픽셀도 제품에 들어가지 않는다.
- 버릴 이미지 전용 효과: 생성 파형 모양, 과장 잡음, 파형 발광의 강한 번짐(Story·Lab), S06의 강한 가장자리 blur(8 px로 제한), 재배열 궤적 선.
- 예상 난이도: L0 중, L1 낮음(재사용), L2 낮음, L3 중(Flip + 접근성), 전환 M-D 중–높음(두 레이아웃 사이 plot 좌표 보간, 같은 sample index 유지).

## Validation Plan

이미지 미감 검토와 실제 UI 런타임 검증을 분리한다(`19` B-09).

**A. 이미지 단계(완료)**
- 7장 판정(KEEP 4 / TUNE 3 / REJECT 0), 수치 대조표(모든 숫자 저장값 일치, 파형·진폭·박동 수는 불일치 → Gap).

**B. 데이터·계약 검사(구현 후, 자동화)**
1. Story 세 박자의 표시 수치 = `storedMetrics[winner].snr_imp`를 formatter로 변환한 값, 순위 = B01 제외 내림차순 — 단위 테스트.
2. 모든 행이 같은 sample index 배열·같은 mV 스케일(Noise 띠 확대 축은 별도 라벨이 있을 때만) — 렌더 좌표 스냅샷 테스트.
3. 박자 전환 중 어떤 프레임에도 두 trace의 **중간 모양 곡선이 없음**(교차 페이드만) — 12프레임 캡처에서 알파 합성만 있는지 확인.
4. 범례·Reference 문구가 `axis`별로 맞음(G-04), 단위 표기(G-09), REPLAY 라벨(G-14).
5. Story → Lab 전환 전후 R파 x 좌표 차이 ≤ 1 px(M-D 수용 기준).

**C. 연출 충실도(`11` §13 G1–G6, `25` §6)**
- 전환마다 최소 6장(권장 12장) 균등 캡처로 이 카드의 Motion Storyboard와 대조(D-019).
- 레퍼런스 대조: REF-001 호 → 선 match cut, REF-003 지나온 경로 구분(굵기·채도), REF-006 같은 노드 재배열.

**D. 런타임**
- 1920×1080 L3 헤드리스 스크린샷(Attract/Story 3박자/Lab), reduced-motion에서 구조 성립, 10분 soak(메모리·프레임), 오프라인 동작(외부 요청 0), Lenis 1개. 성능 예산은 P2 전까지 잠정.

**E. 사용자 정렬(Step 5)**
- Alpha와 교차 검토 후, 이 카드의 KEEP/TUNE 스틸과 Gap을 사용자에게 보인다.

## Open Questions

모두 **권장안 자동 채택 (사용자 부재)**. 사용자 복귀 후 뒤집을 수 있으며, 각 항목에 다시 볼 조건을 적었다.

| # | 질문 | 선택지 | 채택(권장) | 이유 | 다시 볼 조건 |
|---|---|---|---|---|---|
| OQ-1 | Noise 띠(입력 − Reference)의 진폭 축 | (a) 입력·출력과 같은 축(정직하지만 pli·bw 잡음이 거의 안 보임) (b) Noise 띠만 **명시적 확대 축**(자체 눈금 + "확대" 라벨) (c) Story를 낮은 SNR로 | **(b)** — 권장안 자동 채택 (사용자 부재) | (c)는 불가: 세 조건의 1위가 서로 다른 패턴은 **15–25 dB에서만** 성립(10 dB 이하는 pli·bw 모두 M06L6/M08 1위, 저장값 확인). (a)는 3초·15초 목표를 못 채움. §1.1-1의 "같은 축"은 입력·출력 행에 적용, Noise 띠는 별도 성분 행이므로 자체 눈금을 명시하면 계약과 충돌하지 않음 | 사용자 또는 validator가 "확대 축이 오해를 만든다"고 판단하면 (a) + G-02 시간 렌즈로 |
| OQ-2 | Attract 장면 SNR·방법 | `d0-pli-20`(잡음 거의 안 보임) / `d0-pli-0` + M04 / `d0-pli-0` + 그 장면 1위 M06L6 | **`d0-pli-0` + 출력 M04**, 부제에 "Powerline · 0 dB · output M04" 작게 — 권장안 자동 채택 (사용자 부재) | 3초 목표(잡음에 묻힌 선)에는 눈에 보이는 잡음(p2p 0.53 mV)이 필요. 방법은 Story 박자 1의 Powerline 답(M04)과 이어지게. Attract에는 순위·수치 주장을 두지 않는다(0 dB에서 M04는 1위가 아님) | M04 0 dB 출력이 눈에 띄게 나쁘면 1위 M06L6로 바꾸고 방법명 표기 |
| OQ-3 | 화면 문구 언어 | 영어 / 한국어 | **한국어 최종 문구**, 이미지 영어는 자리표시 — 사용자 답(§8.1 "제안 그대로")에 따름 | v2.2.1 화면이 한국어, 글꼴 D-035 | — |
| OQ-4 | 숫자 표시 범위 | 전부 / 1위만 | **1위만** — 사용자 답(§8.1)에 따름 | 한 장면 값의 순위를 일반 법칙처럼 크게 보이지 않기(S1 범위) | — |
| OQ-5 | Story 휠 방식 | 자유 스크럽 / 박자 스냅 | **박자 스냅(휠 제스처 1회 = 1박자)** — 권장안 자동 채택 (사용자 부재) | 전시 관람자는 스크롤 거리 감각이 없고, 중간 상태(두 조건 사이)는 의미가 없음. 파형 morph 금지와도 맞음 | 사용자 휠 녹화에서 스냅이 끊겨 느껴지면 짧은 스크럽 구간 추가 |
| OQ-6 | 재생 라벨 | "REPLAY" / "ARCHIVED REPLAY" | **v2.2.1 상태 로직 그대로**(archive status = archived) — 권장안 자동 채택 (사용자 부재) | §1.1-4 구분 유지, 새 규칙을 만들지 않음 | v2.2.1 로직이 이 경로에서 라벨을 못 정하면 "ARCHIVED REPLAY" |
| OQ-7 | Story 안의 재생 sweep | 계속 재생 / 고정 playhead | **고정(기본 4 s)**, 이 시각으로 Lab 도착 — 권장안 자동 채택 (사용자 부재) | 비교 장면에서 움직이는 파형은 판독 방해, 고정 시각이 same-time handoff의 기준점 | 사용자가 "멈춘 화면이 죽어 보인다"고 하면 Story 진입 후 한 번만 0→4 s 재생 |
| OQ-8 | S02·S06·S07 TUNE 스틸 재생성 | 재생성 / 카드의 Gap·모션 사양으로 대체 | **재생성하지 않음**, Gap(G-03·G-07·G-08·G-04)으로 기록 — 권장안 자동 채택 (사용자 부재) | 결함이 모두 구현에서 자동 해결되거나 사양으로 고정됨. 예산(9장)은 교차 검토 후 Hybrid용으로 남김 | 교차 검토에서 이 스틸을 사용자에게 보일 때 오해가 생기면 해당 장만 재생성 |
| OQ-9 | B2(공간 도입) | 추가 / 보류 | **보류** | 3초 목표 지연 위험, B1과 역할 중복 | 사용자가 공간감을 더 원하면 Hybrid에서 |

---

단계 판정
- 수행: 7장 직접 판독·판정, OpenCV 측정(색·범위·글자 띠), `archive.json` 저장 지표·trace 디코드로 수치·파형 대조, `20` §7 템플릿 전 섹션 작성.
- 판정: **PASS(Beta 1차 동결)** — KEEP 4 · TUNE 3 · REJECT 0. 이미지 속 숫자는 모두 저장값과 일치. 파형·잡음 진폭·박동 수·범례 문구는 Gap으로 등록.
- 미검증: 실제 구현 런타임, 모션 시간값(잠정), OQ 자동 채택 항목의 사용자 확인, v2.2.1 formatter의 19.45 표시 결과, v2.2.1 컴포넌트 이름(패킷 §4 명칭 기준, 코드 미확인).
- 다음: Step 4 교차 검토(Alpha 동결본과 비교) — Beta는 이 카드를 입력으로 넘긴다. 커밋하지 않음(지시대로).
