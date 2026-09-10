# ECG Signal Studio — Expo·GUI 기획서 v2.1 FINAL

작성: 2026-09-11  
상태: **기획 확정본 / 구현 전 기준선**

이 문서는 `docs/11_expo_gui_plan_v2.md`를 검토한 뒤, 사용자 승인과 추가 설계 논의를 반영해 구현 기준선을 확정한다. v2의 큰 방향은 유지하고, 비교 화면 구조·데이터 로딩·지표 계층·기술 스택·Expo 상호작용을 구체화한다.

> 이 문서가 확정하는 것은 **구현 방향과 검수 기준**이다. GUI 코드 수정, 패키지 설치, 600초 데이터 생성·추론, Playwright 실행은 아직 시작하지 않는다.

---

## 1. 프로젝트 목표

핵심 경험은 다음 한 문장으로 정의한다.

> **멀리서는 흘러가는 ECG가 눈에 들어오고, 가까이서는 같은 시간 구간에서 noisy·denoised·reference의 차이를 직접 확인하며, 더 오래 본 사람은 그 장면이 전체 실험 결과와 어떻게 연결되는지 이해할 수 있어야 한다.**

Expo 체험 깊이는 다음 3단계로 설계한다.

- **3초:** 움직이는 ECG와 denoising 전·후 차이가 시선을 끈다.
- **15초:** 잡음/SNR/method를 바꾸고 같은 구간을 비교한다.
- **60초:** Reference, Difference Lens, session/experiment 근거까지 확인한다.

현재 프로토타입의 차분한 밝은 앱 배경, 어두운 신호 패널, Method Explorer의 설명 품질, hover 미리보기, 연구 도구다운 분위기는 유지한다. 화려한 대시보드 템플릿이나 게임형 인터페이스로 교체하지 않는다.

---

## 2. 화면 구조: Explore와 Inspect를 분리한다

같은 앱 안에서 두 가지 관찰 상태를 명확히 구분한다.

### 2.1 Explore

움직이는 파형을 보며 조건과 방법을 빠르게 바꾸는 상태다.

- Sweep / Scroll
- Play / Pause
- noise / SNR / method 선택
- 2.5 / 5 / 10초 표시 구간
- 0.5 / 1 / 2× 재생
- 10분 timeline 이동
- Method hover preview

목적은 **움직임과 차이를 빠르게 이해하는 것**이다. 상세 지표와 긴 설명은 기본 접힘 상태로 둔다.

### 2.2 Inspect

현재 시간 구간을 고정하여 정밀하게 비교하는 상태다.

- 현재 표시 구간 고정
- noisy / selected method / reference 정렬 비교
- 선택적 comparison pin
- Difference Lens
- local/session/experiment metric
- 세부 method 설명과 제한점

`Pause`와 `구간 고정`은 같은 동작으로 취급하지 않는다. Pause는 현재 재생 상태를 그대로 정지하고, 구간 고정은 현재 source sample 범위를 비교용 정적 구간으로 확정한다.

---

## 3. 재생 모델

재생 상태와 표시 방식을 분리한다.

- 재생 상태: **Play / Pause**
- 표시 방식: **Sweep / Scroll**
- 정적 분석: **Inspect / 구간 고정**

모드 전환은 같은 record, condition, source sample index를 유지하고 표시 방식만 바꾼다.

### 3.1 Sweep

병원 모니터식 wrapping을 구현한다.

- 새 샘플은 writing head에서 즉시 원래 선명도로 그린다.
- 오른쪽 끝에 도달하면 왼쪽으로 돌아온다.
- writing head 앞에는 짧은 빈 간격을 둔다.
- 지난 주기의 파형은 지워지는 경계에서만 짧게 opacity 1→0으로 감소한다.
- grid, axes, labels는 fade 대상이 아니다.
- wrap 경계에서 오른쪽 끝과 왼쪽 시작을 연결하는 가짜 선을 만들지 않는다.
- 아직 재생하지 않은 미래 파형을 미리 보이지 않는다.

초기 설계값:

- blank gap: 데이터 시간 약 **0.12 s**
- fade band: 데이터 시간 약 **0.08 s**
- 기본 속도: **1×**

이 수치는 디자인 표준이 아니라 초기 튜닝값이며 실제 1920×1080 Expo 모니터 영상으로 조정한다.

긴 afterimage, glow, blur, morphing, 데이터 시간축에 easing을 적용하지 않는다.

### 3.2 Scroll

- 새 데이터는 오른쪽에 들어온다.
- 기존 가시 구간 전체가 왼쪽으로 이동한다.
- source sample clock은 Sweep과 공유한다.
- 1×에서 1초 데이터는 실제 1초에 해당해야 한다.

---

## 4. 대형 비교창 — Signal Inspector

현재 작은 파형 패널의 보조 modal이 아니라 **집중 비교 작업공간**으로 설계한다.

### 4.1 기본 구조

1920×1080 기준 브라우저 영역의 약 96%×94%를 사용하고 Fullscreen을 제공한다.

1. 상단 최소 정보
   - REPLAY 또는 LIVE 상태
   - record / noise / SNR
   - 현재 absolute playback time
   - Fullscreen / Close
2. 첫 번째 큰 행
   - **Noisy + Reference**
3. 두 번째 큰 행
   - **Selected Method + Reference**
4. 선택 영역
   - Method Explorer compact mode
5. 하단 transport
   - Play/Pause
   - Sweep/Scroll
   - speed
   - window length
   - 10분 timeline
   - Pin comparison
   - Difference Lens toggle

기본 1920×1080에서는 각 주요 waveform plot 내부 높이를 약 **280–330 CSS px** 목표로 한다. 1366×768에서는 부가 설명을 접고 각 행 약 **180–220 px**를 우선 확보한다.

파형이 화면의 주인공이며, 제어와 설명은 파형 공간을 침범하지 않도록 최소화한다.

---

## 5. Reference와 비교 규칙

Reference는 동일 시간축에 중성 회색으로 overlay한다.

초기 시각 규칙:

- Reference: neutral gray, 2.0–2.4 px, opacity 기본 0.55
- Noisy: warm input color
- Selected output: mint/teal output color
- Fixed comparison: calm blue
- Hover preview: amber/yellow dashed line

Reference 강도는 약하게/기본/강하게 0.35 / 0.55 / 0.75의 3단계 선택을 검토한다. 이는 표시 효과이며 실제 진폭·지표 계산에는 영향을 주지 않는다.

Reference의 정확한 정의는 데이터 provenance에 맞춰 표시한다. 실제 무잡음 환자 신호가 아닌 경우 `clean`이라는 단정적 표현 대신 프로젝트 데이터 정의에 맞는 `Reference`를 쓴다.

---

## 6. Method 비교 인터랙션 확정

기본은 **2행 비교**다.

- hover/focus: selected output 행 위에 후보 방법을 점선 preview
- click: 후보를 selected method로 변경
- pin: 현재 방법을 comparison으로 고정하여 필요할 때 **3번째 행** 추가

의미를 다음처럼 고정한다.

- **Hover = 순간 비교**
- **Click = 주 선택 변경**
- **Pin = 지속 A/B 비교**

3행 모드에서도 hover 후보는 selected output 행에 나타나며 pinned comparison 행은 바뀌지 않는다.

터치 환경에서는 hover가 필수 경로가 아니도록 click과 Pin만으로 모든 비교가 가능해야 한다.

---

## 7. Difference Lens

v2.1에서 신규 확정하는 기능이다.

Selected output과 Reference가 거의 겹쳐 차이가 보이지 않을 때 선택적으로 **Output − Reference** 잔차를 별도 작은 strip으로 표시한다.

- 기본 상태: 숨김
- Inspect 상태에서 toggle로 표시
- plot 높이: 약 60–90 px 초기값
- 0 line 명확히 표시
- 필요하면 display gain ×1 / ×3 / ×5 선택
- gain 적용 시 `display ×N · signal data unchanged`를 명시
- metric 계산은 원 데이터로 수행

Difference Lens의 목적은 “더 좋아 보이게” 만드는 것이 아니라 **어디에서 morphology가 Reference와 벗어났는지 찾기 쉽게 하는 것**이다.

---

## 8. Method Explorer 정보 계층

현재의 장점인 방법 설명을 유지하되 세 단계로 나눈다.

### Level 1 — Scan

목록에서 즉시 보이는 정보:

- Method ID
- 사람이 읽을 수 있는 이름
- family/classical/DL/hybrid/oracle 분류

### Level 2 — Quick explanation

선택 시 바로 보이는 한두 문장:

- 어떤 원리로 잡음을 줄이는가
- 이 프로젝트에서 무엇을 비교하기 위해 포함했는가

### Level 3 — Detail

펼침 또는 Inspector side panel에서:

- 원리
- 주요 파라미터
- 장점
- 실패/왜곡 가능성
- 실시간성 또는 causal/offline 차이
- 현재 결과 해석 시 주의점

설명 때문에 waveform 높이가 계속 변하지 않도록 상세 영역은 side panel 내부 scroll로 제한한다.

---

## 9. 지표 계층

장면 하나의 좋은 결과가 전체 방법 성능처럼 보이지 않도록 세 수준을 분리한다.

### Local

현재 Inspect에 고정된 2.5/5/10초 구간의 metric.

예:

- ΔSNR
- RMSE 또는 PRD
- CC
- 필요 시 residual RMS

### Session

현재 record의 전체 **600초** 결과.

- 10분 평균/집계
- 현재 method와 condition 기준

### Experiment

전체 TEST records/조건에 대한 기존 실험 집계.

Local, Session, Experiment를 같은 라벨이나 같은 숫자 스타일로 섞지 않는다. 재생 중에는 숫자가 계속 바뀌어 주의를 빼앗지 않도록 Session 값을 중심으로 보여주고, Local metric은 Inspect에서 강조한다.

`scaled SNR`과 같이 보정이 포함된 값은 보정 의미를 반드시 함께 표시한다.

---

## 10. 장시간 데이터 생성 범위

**재학습은 하지 않는다.**

필요한 경우 기존 checkpoint와 기존 signal-processing method를 사용해 각 조건의 input/reference/output waveform을 다시 생성한다.

목표 범위:

- D0 / D1
- 잡음 7종
- SNR 7단계
- 총 **98 conditions**
- 조건당 **연속 600 s**
- fs=250 Hz 기준 **150,000 samples / trace**

짧은 10초 파형을 반복하여 600초처럼 만들지 않는다.

가능한 한 D1에서는 noise 종류와 SNR을 바꾸어도 **같은 ECG record/lead/base segment**를 사용한다. 그래야 잡음 조건 변경과 ECG morphology 변경이 동시에 발생하는 혼동을 줄일 수 있다.

같은 noise의 SNR만 바꿀 때는 같은 noise realization의 scale만 바꾸는 것을 기본 원칙으로 한다.

전시용 한 record 600초는 전체 TEST experiment 결과를 대표한다고 주장하지 않는다.

---

## 11. 600초 데이터 저장/로딩 구조

현재의 대형 `bank.js` 방식은 98×600초 확장용 최종 구조로 사용하지 않는다.

권장 구조:

```text
manifest.json
D1/
  mixed/
    -5/
      chunk_000_030.bin
      chunk_030_060.bin
      ...
      chunk_570_600.bin
```

실제 확장자와 encoding은 구현 단계에서 benchmark 후 확정하되 다음 계약을 지킨다.

- chunk duration 초기안: **30 s**
- current chunk + next chunk prefetch
- 현재 condition 주변 자료만 decode/cache
- 98조건 전체를 한 번에 메모리에 풀지 않음
- metadata에 axis / record / lead / condition / SNR / method / sample range / fs / version/hash 포함
- 늦게 도착한 이전 condition 결과가 현재 UI를 덮지 못하도록 request identity 검사

전시는 인터넷 없이 동작하도록 모든 runtime asset을 로컬 배포한다.

---

## 12. 기술 스택 확정안 — B-lite

기술 도입 목적은 유행이 아니라 **복잡해지는 상태와 화면 구조를 안정적으로 관리하는 것**이다.

### 채택 권고

- **React** — UI component와 저빈도 상태
- **TypeScript** — playback/data/session 계약
- **Vite** — 개발 및 정적 production build
- **기존 CSS design token 적극 유지**
- **shadcn/ui 선택 도입** — Dialog, Tooltip, Toggle Group, Collapsible 등 필요한 primitive만
- **Canvas 2D** — Sweep/Scroll/동적 파형 렌더링
- **SVG** — 정적 상세 그림·축·export가 더 적합한 부분
- **Playwright** — browser interaction/visual evidence

### 선택

- Tailwind CSS는 필수가 아니다. 현재 CSS token 체계를 유지한 상태에서 실제 생산성 이득이 있을 때만 도입한다.

### 보류

- Electron/Tauri
- WebGL
- 대형 전역 state library
- OffscreenCanvas/Web Worker의 선제 도입

Web Worker 등은 target PC profiling에서 실제 main-thread 병목이 확인되면 추가한다.

React state로 매 animation frame마다 waveform sample을 갱신하지 않는다.

권장 구조:

```text
React / TypeScript UI
        ↓
Shared Session State
        ↓
Framework-independent Playback Engine
        ↓
Canvas Waveform Renderer
        ↓
Chunked ECG Data Source
```

기본창과 Inspector는 같은 playback clock/sample index를 구독한다.

---

## 13. Expo 운영 UX

기본 분석 앱과 Expo 옵션을 분리한다.

### 기본 제공

- 발표 북마크 3개
- 시작 설정으로 복귀
- Fullscreen Inspector
- Replay 표기
- keyboard: Space Play/Pause, Escape top-level overlay close

### 선택 Expo mode

- Attract replay
- 발표 중 idle reset 억제
- 무인 체험 시 idle reset

무인 초기화 초기값은 **180초 무입력 + 10초 취소 안내**로 두고 리허설에서 조정한다.

의미 있는 button/key/touch/drag만 user activity로 취급한다. 단순 pointer movement는 idle timer를 계속 갱신하지 않는다.

자동 reset은 unsaved review memo를 삭제해서는 안 된다.

---

## 14. 모션 규칙

모션은 UI 계층과 데이터 계층을 분리한다.

- button/selection feedback: 약 80–120 ms
- method hover intent delay: 약 120 ms
- large Inspector open/close: 약 180–220 ms
- panel collapse: 약 180 ms
- playback time: **linear**
- metric count-up animation: 사용하지 않음
- condition change: data/legend/metric 준비 후 atomic swap

`prefers-reduced-motion`에서는 비필수 UI motion과 자동 attract motion을 줄인다. 사용자가 직접 시작한 Sweep/Scroll에는 항상 Pause를 제공한다.

---

## 15. 시각적 금지/제한 항목

다음은 v2.1 기본 디자인에서 사용하지 않는다.

- ECG glow/blur/neon halo
- 긴 persistence trail
- method 간 waveform morph animation
- AI winner/always best 배지
- 과도한 glassmorphism
- moving gradient background
- 실제 측정이 아닌 animated metric interpolation
- 파형을 작게 만드는 과도한 dashboard card 분할

현대적인 인상은 장식 효과보다 **정렬, 여백, 정보 계층, 즉각적 피드백, 자연스러운 짧은 motion, 충분한 waveform 공간**으로 만든다.

---

## 16. Expo 대표 시연 흐름

대표 45–60초 동선:

1. **Attract / 5초**
   - 5초 window, Sweep 1×
   - noisy와 selected output이 같은 시간으로 흐름
2. **Condition change / 10초**
   - 추천 noise/SNR 2–3개 중 하나 변경
3. **Method comparison / 10초**
   - hover 후보 점선
   - click으로 method 변경
4. **Inspect / 15초**
   - 현재 구간 고정
   - Reference overlap 관찰
   - Difference Lens 필요 시 표시
5. **Evidence / 10–20초**
   - Session metric
   - Experiment 결과로 이동

추천 장면은 데이터 생성 후 정한다. 성능이 잘 나온 구간을 보고 사후적으로 고르지 않도록 선정 기준을 먼저 기록한다.

---

## 17. 검수 기준

구현 완료 판정은 기능 존재가 아니라 실제 브라우저 근거로 한다.

### Playback

- Sweep fade는 old trace 경계에만 적용
- wrap 가짜 연결선 없음
- future trace 선표시 없음
- Scroll/Sweep의 source sample time 동일
- Pause 후 정확히 같은 장면 유지
- Inspect 복귀 시 시간이 몰래 진행되지 않음

### Comparison

- Noisy/selected/reference의 sample index·axis 정렬
- hover가 selected method를 변경하지 않음
- pin이 hover에 의해 바뀌지 않음
- 3행에서도 충분한 plot height 확보

### Data

- 98 condition availability table
- 600 s / 150,000 sample 확인
- trace method 누락 명시
- chunk boundary artifact 없음
- stale load 결과 차단

### Visual/Expo

- 1920×1080 / 1366×768
- Windows 100/125/150% scaling은 실제 target PC에서 확인
- 약 1 m 관람 거리 가독성
- Reference opacity 3단계 비교
- long-run playback/memory check

### Accessibility

- keyboard focus
- Escape/Space context correctness
- touch path without hover
- reduced motion
- motion Pause control

Playwright는 screenshot/video/trace/error evidence를 자동 수집하되 시각적 우열은 사람 검토로 최종 판정한다.

---

## 18. 구현 순서

### R1a — Architecture parity

- 새 React/TS/Vite 영역 생성
- 현재 10초 dataset으로 기존 UI 핵심 상태 동등성 확인
- current CSS tokens 이관
- Playback Engine interface 생성

### R1b — Inspector / Playback

- Sweep / Scroll
- Pause / Inspect
- large Signal Inspector
- hover / click / pin
- Reference
- Difference Lens

### R2 — 600초 Data

- source/checkpoint/method pipeline 확인
- 98×600초 waveform 생성
- manifest/chunk 저장
- alignment/boundary/metric verification

### R3 — Expo packaging

- offline static runtime
- bookmark
- optional Expo mode
- target-PC Playwright evidence package

### R4 — Actual browser review

- captures/video/performance/accessibility
- visual tuning
- unresolved defects 수정

### R5 — Handoff

- team guide
- operation guide
- validation matrix
- final commit/status log

각 단계가 통과하기 전에 다음 대규모 단계로 넘어가지 않는다.

---

## 19. v2.1에서 확정된 것 / v2.2에서 다시 논의할 것

### 확정

- Sweep + Scroll + Pause
- short eraser-edge fade
- 600초 per condition
- 98 condition 목표
- 재학습 제외
- same-base ECG principle
- large 2-row Inspector
- gray Reference overlay
- hover/click/pin interaction
- optional third row
- Difference Lens
- Explore / Inspect
- Local / Session / Experiment metric scopes
- chunked data architecture
- React/TS/Vite + independent Canvas playback engine
- existing visual identity preservation

### v2.2 탐색 대상

v2.2는 기능 추가 목록이 아니라 **전시 전달력과 시각 완성도를 높이는 refinement 단계**로 다룬다.

- 1 m 거리에서의 hierarchy / typography / density
- first-time visitor onboarding
- method explanation storytelling
- microinteraction details
- SNR/noise control ergonomics
- timeline/navigation affordance
- Difference Lens 표현 방식
- 2행/3행 transition
- presentation bookmark UX
- Attract mode 장면 연출
- 실제 발표자의 손 동선과 말의 순서
- 실측 AFE 화면과 replay 화면의 시각적 연결
- fail/empty/loading/error states의 Expo 품질
- 신뢰감을 주는 provenance 표현
- team member가 처음 조작해도 1분 안에 익히는가

v2.2에서 아이디어를 검토하더라도 이 문서의 데이터 타당성·시간축 정합·Reference 정직성 원칙은 유지한다.

---

## 20. 최종 기준 문장

v2.1 구현은 다음 질문에 모두 `예`라고 답할 수 있어야 완료로 본다.

> 움직이는 ECG가 관람객의 시선을 끄는가?  
> 같은 시간의 noisy와 denoised를 충분히 크게 비교할 수 있는가?  
> Reference와의 작은 차이를 필요할 때 정밀하게 볼 수 있는가?  
> UI 효과가 데이터를 더 좋아 보이도록 왜곡하지 않는가?  
> 한 장면과 전체 실험 결과를 혼동하지 않는가?  
> 10분 데이터에서도 빠르고 안정적으로 동작하는가?  
> 발표자가 기능 설명보다 연구 결과 설명에 더 많은 시간을 쓸 수 있는가?

이 문서를 **v2.1 구현 기준선**으로 확정한다.
