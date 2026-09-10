# ECG Signal Studio — Expo·GUI 기획서 v2.2 FINAL

작성: 2026-09-11  
상태: **Expo 기획·UI refinement 확정본 / wireframe 전 기준선**

이 문서는 `docs/12_expo_gui_plan_v2_1_final.md`의 기능·데이터·기술 기준선을 유지하면서, 실제 졸업작품/Expo 부스에서 관람객과 심사위원에게 어떻게 보여주고 설명할지를 비판적으로 재검토하여 전시 경험과 UI 정보 구조를 확정한다.

v2.2의 핵심은 기능을 더 늘리는 것이 아니다.

> **v2.1이 “어떤 기능을 갖춘 앱인가?”를 해결했다면, v2.2는 “사람에게 어떤 순서로 무엇을 이해시키는 앱인가?”를 해결한다.**

이 문서 이후 단계는 화면별 wireframe 회의다. 구현·600초 데이터 생성·Playwright 실행은 아직 시작하지 않는다.

---

## 1. 전시 핵심 메시지

Expo에서 관람객이 최종적으로 기억해야 할 메시지를 다음으로 확정한다.

> **같은 ECG라도 잡음의 종류와 세기에 따라 적합한 잡음 제거 방법이 달라진다. 그래서 우리는 같은 조건에서 여러 DSP·딥러닝 방법을 직접 비교했다.**

보조 메시지는 다음 순서로만 확장한다.

1. 잡음이 섞인 ECG를 여러 기법으로 처리했다.
2. 같은 시간 구간에서 직접 비교했다.
3. Reference와의 차이를 확인했다.
4. 한 장면뿐 아니라 10분 Session과 전체 Experiment 결과를 분리해 검토했다.
5. 딥러닝이 항상 더 좋다고 주장하지 않는다.

전시 스토리는 “AI가 더 좋다”가 아니라 **조건에 따라 결과가 달라지고, 그 차이를 정직하게 비교한다**는 연구 태도를 중심으로 한다.

---

## 2. 관람객 경험 구조 — 3초 / 15초 / 60초

### 2.1 3초 — Attention

멀리서 글을 읽지 않는 관람객의 목표는 두 가지다.

- ECG 화면이라는 것을 즉시 인식한다.
- noisy와 denoised가 다르게 보인다는 것을 느낀다.

Attract 화면의 기본 구성은 다음만 우선한다.

- 큰 ECG 두 행
- Sweep 1×
- 짧은 문구: `같은 ECG, 다른 잡음 제거 결과`
- REPLAY 상태 표기

SNR, CC, ΔSNR, method principle, provenance 세부값은 이 단계에서 전면에 두지 않는다.

### 2.2 15초 — Choose & Compare

관람객에게 한 번의 선택을 맡긴다.

일반 관람객 기본 CTA:

> **어떤 잡음을 넣어볼까요?**

기술 관람객/심사위원 대체 CTA:

> **어떤 방법과 비교해볼까요?**

한 시연에서 noise/SNR/method 세 가지를 모두 직접 조작시키지 않는다. 기능은 열어 두되, 발표자가 유도하는 주 상호작용은 하나만 둔다.

### 2.3 60초 — Inspect & Prove

관심이 이어지는 경우 다음 순서로 깊이를 늘린다.

1. 현재 구간 고정
2. Reference overlay
3. 필요 시 Difference Lens
4. Session metric
5. Experiment evidence

기능 설명이 아니라 연구 결과 설명에 시간이 더 많이 쓰여야 한다.

---

## 3. 최종 발표 흐름

v2.2의 대표 발표 구조를 다음 다섯 단계로 확정한다.

> **Attention → Choose → Compare → Inspect → Prove**

### Attention

- 움직이는 ECG로 시선 유도
- 같은 record/time의 noisy와 output을 동시에 보여줌

### Choose

- 관람객에게 noise 또는 method 중 하나의 선택만 요청

### Compare

- 같은 source sample range를 유지한 채 method 변경
- hover/focus preview 또는 click 비교

### Inspect

- 현재 구간 고정
- Reference와 작은 morphology 차이 확인
- 필요할 때만 Difference Lens 공개

### Prove

- 현재 장면의 Local 수치와 10분 Session, 전체 Experiment를 구분해 제시
- “이 장면 하나가 전체 성능은 아니다”는 정보 구조를 유지

---

## 4. Presentation Mode의 역할 확대

Presentation Mode에서는 Signal Inspector를 **대형 modal이 아니라 사실상의 주 발표 화면**으로 다룬다.

### 일반 실행

연구/분석 dashboard 성격을 유지한다.

- 조건 선택
- Method Explorer
- metrics
- evidence
- provenance
- acquisition

### Presentation Mode

Signal Inspector 중심으로 단순화한다.

- 두 큰 waveform 행
- 최소 조건 정보
- 재생/구간 고정
- compact method selector
- timeline
- 필요 시 Difference/Evidence reveal

발표 중 화면을 스크롤하거나 작은 버튼을 찾아 이동하는 상황을 최소화한다.

---

## 5. 사용자 언어와 내부 상태 언어를 분리

개발 내부에서는 `Explore / Inspect`를 유지해도 된다.

화면에서는 더 직관적인 행동 언어를 권고한다.

- `Explore` → **재생 보기**
- `Inspect` → **정밀 비교**
- `Freeze range` → **현재 구간 고정**

상단 상태 표기는 예를 들어 다음처럼 명시한다.

- `REPLAY · SWEEP · 1×`
- `정밀 비교 · 02:14.000–02:19.000 고정`

Pause와 구간 고정은 별도 동작으로 유지한다.

---

## 6. 관람객 상호작용 원칙

### 기본 원칙

**한 시연 = 한 개의 관람객 선택**

선택지가 많아도 발표자가 동시에 여러 조작을 요구하지 않는다.

### 일반 관람객

현실 상황에 가까운 잡음 이름을 우선한다.

예:

- 근육 움직임
- 전원 간섭
- 전극 움직임
- 순간 잡음

정식 noise code/약어는 보조 표기로 유지한다.

### 심사위원/기술 관람객

방법 비교에 참여하도록 한다.

- classical
- wavelet
- model-based
- deep learning

선택 이후에는 source time을 바꾸지 않고 output만 바꿔 비교한다.

---

## 7. 대표 시나리오/북마크 3개의 역할

실제 timestamp는 아직 확정하지 않는다.

600초 데이터 생성 후 method output을 보고 유리한 위치를 고르는 방식은 피한다.

먼저 시나리오의 **역할과 선정 규칙**만 확정한다.

### Scenario A — 복원이 잘 보이는 강한 잡음

목적:

- 입출력 차이를 빠르게 이해시킴
- Attention/초반 시연용

### Scenario B — 고전 DSP가 충분히 경쟁력 있는 조건

목적:

- “딥러닝이 항상 우세하지 않다”는 메시지
- 비교 연구의 필요성 강조

### Scenario C — 비교적 깨끗한 입력 / 과처리 가능성

목적:

- 잡음을 더 줄이는 것과 morphology 보존의 trade-off
- 과도한 denoising도 손해가 될 수 있음을 설명

### 구간 선정 규칙

method output을 보기 전에 input/reference 기준으로 선정한다.

후보 기준:

- clipping 없음
- chunk/window 경계 artifact 없음
- signal dropout 없음
- 충분한 beat 포함
- 시연에 필요한 시간 길이 확보
- 특정 method가 잘 나온다는 이유로 선택하지 않음

선정 기준과 최종 timestamp를 문서화한다.

---

## 8. Attract Mode — 절제된 유도

Attract Mode의 목적은 많은 기능을 보여주는 것이 아니라 **관람객을 멈춰 세우는 것**이다.

### 기본 연출

- 한 representative scene 유지
- 8–12초 정도의 Sweep 반복
- 자동 noise/SNR/method switching은 기본 비활성
- 라벨/짧은 안내만 단계적으로 강조 가능

예:

1. `잡음이 섞인 ECG`
2. `같은 구간을 처리한 결과`
3. `직접 비교해보세요`

파형 사이를 morph하거나 존재하지 않는 중간 신호를 만들지 않는다.

### Handoff

사용자가 의미 있는 조작을 하면 즉시 Attract를 종료한다.

가능하면 **방금 보던 동일 scene/time context**에서 재생 보기로 이어간다.

갑자기 다른 record/condition으로 이동하지 않는다.

### Reset

v2.1의 idle reset 원칙을 유지한다.

- 발표 중 reset 억제
- unsaved memo 삭제 금지
- 무인 운영에서만 사용
- reset 직전 취소 가능

---

## 9. Signal Inspector 정보 밀도

Signal Inspector에서는 파형이 주인공이다.

### 기본 노출

- condition summary
- two waveform rows
- playback controls
- compact method selector
- timeline

### 1단계 reveal

- Reference opacity control
- comparison pin
- 현재 구간 고정

### 2단계 reveal

- Difference Lens
- Local/Session metric

### 3단계 reveal

- Experiment evidence
- method detailed explanation
- provenance

정보를 새로 추가하기보다 **언제 숨길지를 설계**한다.

---

## 10. Difference Lens의 위치 재정의

Difference Lens는 일반 관람객의 기본 화면이 아니라 **expert reveal**로 사용한다.

발표 흐름 예:

> “두 파형이 거의 겹치면 차이를 눈으로 보기 어렵습니다. 이때 Reference와의 차이만 확대해 볼 수 있습니다.”

화면 표시명은 `Error`보다 다음을 권고한다.

- **Reference와 차이**
- 보조 표기: `Output − Reference`

0에 가까울수록 Reference와 유사하다는 짧은 안내를 둔다.

display gain ×1/×3/×5를 쓰는 경우 시각 확대임을 항상 표시한다.

Difference Lens 자체가 우열 판정 장치처럼 보이지 않도록 자동 green/red scoring은 넣지 않는다.

---

## 11. Beat Focus 재검토

한 박동 확대 아이디어는 시연 효과가 높아 **Could**로 유지한다.

하지만 annotation이나 선정 규칙이 없는 상태에서 `대표 beat`, `정상 beat`라는 이름을 쓰지 않는다.

우선 구현 후보는:

- **현재 위치 확대**
- **선택 구간 확대**

R-peak annotation과 selection rule이 확보된 뒤 `Beat Focus`로 승격한다.

---

## 12. Method Explorer refinement

첫 화면에 12개 방법을 동일 우선순위로 노출하지 않는다.

### 대표군

- Baseline/front-end
- 대표 classical
- 대표 wavelet
- 대표 deep learning
- 현재 프로젝트의 주요 hybrid

### 전체 방법

`전체 방법 보기`에서 나머지를 제공한다.

정보 계층은 v2.1의 3단계를 유지한다.

1. 이름/ID/family
2. 한두 문장 Quick explanation
3. principle/parameter/strength/limitation/detail

기법 설명의 목표는 “이 방법이 무엇인가?”뿐 아니라 **“왜 이 프로젝트에 비교군으로 들어왔는가?”**까지 답하는 것이다.

---

## 13. SNR/Noise control UX

### Noise

Expo 기본 화면에서는 주요 noise 3–4개를 quick chip으로 보여주고 나머지는 펼침 선택으로 둘 수 있다.

### SNR

실제 데이터가 discrete grid라면 continuous control처럼 보이지 않게 한다.

- -5 / 0 / 5 / 10 / 15 / 20 / 25 dB
- 명확한 snap points
- 현재 측정/생성 데이터가 있는 값만 활성

숫자 옆 친화 문구는 보조로만 쓴다.

예:

- `−5 dB · 매우 강한 잡음`
- `10 dB · 중간`
- `20 dB · 약한 잡음`

이 문구는 프로젝트 설명용 UX label이며 물리적/임상적 표준 등급으로 주장하지 않는다.

---

## 14. Timeline을 “위치 지도”로 사용

600초 데이터에서 timeline은 단순 seek bar 이상의 역할을 맡는다.

필수 표현:

- 전체 10분
- current playhead
- 현재 2.5/5/10초 viewport
- scenario/bookmark marker

사용자는 “전체 10분 중 어디를 보는지”를 한눈에 알아야 한다.

### 넣지 않을 것

- best region
- worst region
- 자동 performance heatmap
- method winner 영역 표시

북마크는 **이야기 위치**이지 성능 랭킹이 아니다.

---

## 15. Metric 정보 구조

v2.1의 `Local / Session / Experiment` 구분을 유지하고 노출량을 줄인다.

### Expo 기본

대표 metric 1개를 크게 보여준다.

초기 후보:

- Session ΔSNR

### 펼침

- Local metrics
- Session metrics
- Experiment metrics
- strict/scaled 차이
- CC/PRD 등 세부 지표

metric은 충분히 저장하지만 첫 화면에 모두 보이지 않는다.

재생 중 수치가 끊임없이 변하는 UI는 피한다.

---

## 16. Loading / Missing / Error도 전시 디자인에 포함

연구 결과 GUI에서 stale UI는 단순 UX 문제가 아니라 잘못된 결과 표시가 될 수 있다.

### 금지 상태

- 새 method label + 이전 method waveform
- 새 SNR label + 이전 metric
- 새 legend + 이전 trace

### 원칙

condition/method 변경 시:

1. 현재 valid scene 유지
2. `새 조건 준비 중` 표시
3. 새 waveform + label + legend + metric이 모두 준비되면 atomic swap

누락된 output은 다른 method로 자동 대체하지 않는다.

오류 상태에도:

- 현재 valid view 유지
- 짧은 원인
- Retry
- 다른 method 선택 가능

을 제공한다.

---

## 17. REPLAY / LIVE provenance

움직이는 Sweep 화면이 실제 실시간 ECG로 오해되지 않도록 source state를 항상 접근 가능하게 한다.

### Replay

- `REPLAY`
- record/source
- stored/generated session

### Live

실제 AFE bridge가 검증된 경우에만 `LIVE`를 사용한다.

Replay와 Live를 자동 혼합하거나 연결 상태만으로 LIVE를 선언하지 않는다.

---

## 18. 물리 전시 환경 고려

wireframe부터 두 경로를 함께 검토한다.

### Desktop Presenter

- 마우스/키보드
- 발표자가 옆에서 조작
- hover preview 사용 가능

### Touch Visitor

- 터치 모니터 또는 pointer interaction
- hover 필수 금지
- 큰 target
- click/pin으로 전체 기능 접근 가능

1920×1080 해상도만으로 실제 Expo 가독성을 판정하지 않는다.

확인 항목:

- 모니터 크기
- 관람 거리 약 1 m
- 책상 높이/설치 각도
- OS scaling
- 입력 장치
- 주변 조명

주요 상호작용 target은 Expo 편의를 위해 약 44 CSS px 수준을 초기 목표로 하되 실제 장비에서 검수한다.

---

## 19. Microinteraction 방향

현대적인 인상은 장식보다 예측 가능성과 응답성에서 만든다.

### 유지

- 80–120ms button state feedback
- hover intent delay
- short Inspector transition
- Sweep erase-edge feathering
- stable layout

### 제한/금지

- glow
- long afterimage
- glass blur 남용
- waveform morph
- animated score count-up
- moving gradient
- winner confetti/game scoring

motion은 사용자의 이해와 상태 변화 설명에 필요한 곳만 사용한다.

---

## 20. 심사위원 질의 대응 동선

Signal Inspector에서 다음 질문에 빠르게 답할 수 있어야 한다.

### “이 구간만 잘 나온 것 아닌가?”

→ Local → 10분 Session → Experiment로 즉시 확장

### “딥러닝이 항상 더 좋은가?”

→ Scenario B 또는 전체 evidence에서 classical 우세/경쟁 조건 제시

### “파형이 너무 매끄럽게 변한 것 아닌가?”

→ Reference overlay + Difference Lens + morphology 관련 metric/한계 설명

### “실시간인가?”

→ REPLAY/LIVE 명확히 구분하고 causal/offline method 차이 설명

### “왜 이 방법들을 비교했나?”

→ Method Explorer detail에서 family와 비교 목적 제시

UI는 발표자의 답변 자료를 찾는 시간을 줄여야 한다.

---

## 21. 연구 정직성을 해칠 수 있어 보류할 것

다음은 시각적으로 매력적이어도 v2.2 범위에서는 보류한다.

- `AI WINNER` / 항상 최고 배지
- best/worst automatic region
- method rank animation
- blind game score
- automatic pathology claim
- automatic beat classification
- good-looking output 기준 bookmark 선정
- continuously rotating methods/noises in Attract
- actual device와 replay의 자동 전환
- waveform intermediate morph

시각적 효과 때문에 비교 결과의 의미가 달라져서는 안 된다.

---

## 22. v2.2 우선순위

### Must

1. 전시 핵심 한 문장 고정
2. Attention → Choose → Compare → Inspect → Prove 흐름
3. Presentation Mode에서 Signal Inspector 중심
4. 한 시연당 관람객 선택 1개 원칙
5. Scenario A/B/C 역할과 blind selection rule
6. atomic data/UI swap
7. REPLAY/LIVE 명확한 source state
8. same-time comparison 유지

### Should

1. timeline + viewport + scenario markers
2. Difference Lens를 expert reveal로 사용
3. 대표 Method + 전체 방법 구조
4. Attract single-scene handoff
5. SNR stepped control
6. friendly noise labels + technical labels 병기
7. loading/error/retry design
8. touch path without hover

### Could

1. 현재 위치/선택 구간 확대
2. annotation 확보 후 Beat Focus
3. visitor/presenter UI density 차이
4. Reference opacity quick control

### Defer

1. best/worst performance navigation
2. AI winner/game UI
3. automatic diagnosis/beat class
4. Electron/Tauri packaging solely for presentation
5. automatic live/replay switching
6. visual spectacle that alters waveform interpretation

---

## 23. Wireframe 회의로 넘길 화면/상태

다음 단계에서는 기능 설명이 아니라 실제 공간 배치 수준으로 결정한다.

### W1 — 1920×1080 Presentation / Replay

- 기본 2행 Signal Inspector
- condition summary
- transport
- compact method area
- timeline

### W2 — Inspect / Reference

- 구간 고정 상태
- Reference overlay
- selected method detail
- Local/Session metric reveal

### W3 — Inspect + Difference

- Difference Lens 위치/높이
- gain control
- 설명 위치

### W4 — Pin 3-row

- 세 번째 comparison row
- 3행 높이/scroll/side panel trade-off

### W5 — Attract

- 3초 시선 유도
- 메시지 위치
- user handoff

### W6 — Scenario launcher

- 세 개 story bookmark
- 시작/복귀 동작

### W7 — Loading/Error/Missing output

- last-valid-state 유지
- loading/retry/missing label

### W8 — 1366×768 compact

- 파형 최소 높이
- control folding
- method selector adaptation

### W9 — Touch visitor

- 주요 target 크기
- hover 대체
- drawer/bottom control 가능성

### W10 — Evidence/Q&A

- Local → Session → Experiment reveal
- provenance
- judge-response navigation

---

## 24. Wireframe 회의에서 답해야 할 핵심 질문

1. 두 파형이 실제로 화면의 몇 %를 차지해야 하는가?
2. 조건 선택과 method 선택 중 어느 쪽을 더 가까운 위치에 둘 것인가?
3. timeline을 파형 아래에 둘지 전체 하단 transport에 통합할지?
4. Method Explorer는 오른쪽 sidebar인가, 하단 rail인가?
5. Difference Lens가 열릴 때 파형 높이를 줄일지 전체 화면을 확장할지?
6. 3행 Pin 상태에서 각 행 최소 높이는 얼마인가?
7. Scenario 버튼을 presentation 화면에 상시 둘 것인가?
8. Local/Session metric은 파형 옆인가 아래인가?
9. touch 환경에서 method preview를 어떤 행동으로 대체할 것인가?
10. Attract에서 어느 정보까지 숨길 것인가?
11. 1 m에서 반드시 읽혀야 하는 텍스트는 무엇인가?
12. 오류 시 현재 파형과 오류 메시지를 어떻게 동시에 유지할 것인가?

이 질문들은 wireframe을 그리면서 최종 결정한다.

---

## 25. v2.2 최종 판정

v2.2는 v2.1을 대체하지 않는다.

- v2.1: 기능·데이터·기술 구조의 구현 기준
- v2.2: Expo story·information hierarchy·presentation behavior의 구현 기준

두 문서를 함께 사용한다.

최종 설계 원칙은 다음이다.

> **움직임으로 시선을 끌고, 하나의 선택으로 참여시키고, 같은 구간에서 비교시키고, 필요할 때 세부 차이를 열고, 마지막에는 전체 근거로 연결한다.**

그리고 다음 조건을 만족할 때 v2.2 기획을 성공으로 본다.

- 처음 보는 사람이 3초 안에 ECG와 전후 비교를 인식한다.
- 15초 안에 하나의 의미 있는 조작을 할 수 있다.
- 60초 안에 왜 여러 denoising method를 비교했는지 이해한다.
- 심사위원 질문에 현재 장면 → 10분 → 전체 실험으로 근거를 확장할 수 있다.
- UI가 특정 방법을 실제보다 좋아 보이게 만들지 않는다.
- 발표자가 메뉴 탐색보다 결과 설명에 더 많은 시간을 사용한다.

이 문서를 **v2.2 wireframe 전 최종 기획 기준선**으로 확정한다.
