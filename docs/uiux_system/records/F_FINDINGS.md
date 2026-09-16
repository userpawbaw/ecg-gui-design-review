# F — UI/UX Findings

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"이걸 몰랐다면 잘못된 디자인 판단이 굳었는가?"**

---

## F-001. 실행 편의성 문제가 아니라 **창의적 제안 capability gap**이 핵심이었다

| | |
|---|---|
| 상태 | 확정 |
| 발견 | 2026-09-15~16 UI/UX Plugin 논의 `[대화]` |
| 영향 | Plugin 탐색의 중심이 browser/deploy 편의성에서 Creative proposer + Validator 구조로 바뀜 |

### 발단 — 무엇이 이상해 보였나
초기 Plugin 추천은 Context7, TinyFish, Vercel처럼 Motion AI Kit 대체나 Chat 안에서의 실행·검수 편의성을 보강하는 방향으로 기울었다. 사용자는 이들이 유용하지만 **실제 능력의 한계는 "현재 UI 전체를 보고 보는 맛을 높일 창의적인 수정안을 내는 것"**이라고 지적했다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음에는 UI 수정 루프가 Chat에서 불편한 것이 주된 병목이라고 보았다. 그러나 사용자는 구현/피드백 루프는 번거로울 뿐 불가능하지 않으며, 필요한 것은 **기획 단계의 창의적 발산 능력**이라고 명시했다. 이 반론으로 문제 정의를 수정했다. `[대화]`

### 결정적 근거
사용자 요구는 두 축으로 분리됐다: ① 기존 UI를 더 인상적으로 만드는 제안기, ② Skill/문서/Plugin으로 타당성을 검증하는 어드바이저. 후자는 이미 충분히 구축됐고 전자가 비어 있었다. `[대화]`

### 조치와 검토한 대안
`expo-ui-art-director` 역할을 별도 계층으로 두고, Creative Production/Motion 계열은 발산에, Product Design/design-taste/project docs는 검증에 쓰는 구조로 변경했다. 이 구조는 `01_CREATIVE_DIRECTION.md`, `04_VALIDATION_AND_GUARDRAILS.md`, `05_TOOL_SKILL_ROUTING.md`에 반영됐다. `[커밋]`

### 비용 / 영향 범위
도구 수가 늘 수 있으므로 모든 Plugin을 상시 호출하지 않고 task router로 최소 로딩한다.

### 놓쳤다면
실행 환경은 편해졌지만 **무엇을 더 창의적으로 바꿀지 제안하는 능력은 그대로 빈 채** 시스템이 완성됐을 것이다.

### 일반화
AI workflow를 설계할 때 **실행 friction과 reasoning/capability gap을 먼저 분리**한다.

---

## F-002. Awwwards식 high-motion은 "ECG UI에 부적합"이 아니라 **적용 구역이 달랐다**

| | |
|---|---|
| 상태 | 확정 |
| 발견 | MotionDesign/Awwwards 재논의 `[대화]` |
| 영향 | Creative Freedom Zone HIGH / MEDIUM / LOW 개념 도입 |

### 발단 — 무엇이 이상해 보였나
초기 평가는 ECG 파형 판독성을 중심으로 MotionDesign/Awwwards 스타일의 화려함을 위험 요소로 봤다. 사용자는 Expo 시연의 첫인상, attract 화면, Replay→Live context switch처럼 **정확한 파형 판독이 주 task가 아닌 영역**에서는 오히려 기발함과 브랜딩이 가치라고 반론했다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음 가설은 "high-motion 자체가 의료/신호 UI와 맞지 않는다"였다. 사용자가 화면을 attract/transition/core waveform으로 나누어 사례를 들면서, 위험의 원인이 스타일 자체가 아니라 **데이터 해석 구간에 같은 강도를 적용하는 것**임이 드러났다. `[대화]`

### 결정적 근거
Attract와 mode transition은 상태/context 전달이 목적이고, core waveform은 신호 판독이 목적이다. 동일한 motion 기준을 적용할 이유가 없다. 이 구분을 토대로 `00_UIUX_MASTER.md`에 Creative Freedom Zone이 추가됐다. `[커밋]`

### 조치와 검토한 대안
- HIGH: Attract/Intro, context transition, narrative reveal
- MEDIUM: result summary, explanation, navigation
- LOW: waveform inspection, axes, Reference/Difference, quantitative comparison

전체 화면을 high-motion으로 만드는 안과 high-motion을 전면 금지하는 안은 모두 버렸다.

### 비용 / 영향 범위
구역마다 검증 기준이 달라져 design review가 복잡해진다. 대신 창의성을 핵심 데이터 영역의 안전성과 교환하지 않아도 된다.

### 놓쳤다면
Expo의 가장 자유로운 장면까지 core waveform 수준으로 보수화해 **전시용 첫인상과 브랜드 경험을 스스로 제한**했을 것이다.

### 일반화
창의적 표현의 타당성은 제품 전체에 한 번에 판정하지 말고 **task criticality와 표현 자유도가 다른 zone으로 나눠 평가**한다.

---

## F-003. Flourish의 핵심 가치는 차트 생성보다 **데이터 스토리텔링 탐색**이었다

| | |
|---|---|
| 상태 | 확정 |
| 발견 | Flourish 활용성 재논의 `[대화]` |
| 영향 | DATA layer와 `02_DATA_STORYTELLING.md`에서 Flourish를 탐색 엔진으로 재분류 |

### 발단 — 무엇이 이상해 보였나
초기에는 Flourish를 "ECG visualization 아이디어를 볼 수 있는 보조 도구" 정도로 낮게 평가했다. 사용자는 연구 프로젝트에서 **가장 중요한 것은 데이터이며, 관람객에게 연구 스토리를 짧게 전달하는 방식 자체가 핵심 UI 문제**라고 지적했다. `[대화]`

### 먼저 의심한 것과 배제 방법
"Flourish 결과를 앱에 직접 붙이지 않으면 가치가 제한적"이라고 생각했다. 그러나 최종 구현물이 아니라도 slope/rank/trade-off/small multiples 등 **같은 데이터를 다른 관계로 표현하는 후보를 빠르게 탐색**할 수 있다는 점이 더 중요했다. `[대화]`

### 결정적 근거
현재 UI의 3단 파형/표/숫자 구조가 유일한 표현 방식이라는 근거는 없고, 관람객이 5~10초 안에 이해할 insight를 먼저 정한 뒤 visualization을 탐색하는 것이 Expo의 목적과 맞는다. Flourish Plugin 자체도 "강조할 insight/story를 주면 editable interactive visualization을 만든다"는 역할로 확인됐다. `[플러그인]`

### 조치와 검토한 대안
Flourish는 **Data Storytelling Exploration Engine**으로 분류한다. 최종 성능 source of truth로 쓰지 않고, 후보 구조를 탐색한 뒤 필요한 경우 React/Canvas로 재구현한다.

### 비용 / 영향 범위
과장된 animation/3D encoding이 데이터를 왜곡할 수 있으므로 `04_VALIDATION_AND_GUARDRAILS.md`의 data-integrity 검증을 반드시 통과해야 한다.

### 놓쳤다면
연구 핵심 데이터를 기존 표/세로 파형 구조에 고정해 두고 **전시 관람객이 결과의 의미를 빠르게 이해하게 만드는 설계 기회**를 잃었을 것이다.

### 일반화
연구 UI에서 visualization 도구는 "예쁜 차트 생성기"가 아니라 **어떤 관계가 이야기를 가장 잘 전달하는지 탐색하는 사고 도구**로 평가한다.
