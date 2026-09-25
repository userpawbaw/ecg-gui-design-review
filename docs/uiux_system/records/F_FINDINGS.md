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

---

## F-004. 실제 reference는 inspiration뿐 아니라 **저비용 visual prototype / communication proxy**로 쓸 수 있다

| | |
|---|---|
| 상태 | 확정 |
| 발견 | 2026-09-18 Reference Mining 설계 논의 `[대화]` |
| 영향 | text-only creative proposal과 모든 후보 mockup 사이에 Reference-Grounded Creative Mining 단계 도입 |

### 발단 — 무엇이 이상해 보였나
AI가 `Signal Observatory`, `Beat Portal`, `Noise Weather` 같은 creative concept을 설명하면 개념은 이해할 수 있었지만, 사용자는 실제 화면을 본 적이 없어 **"어떤 느낌을 주려고 하는지"를 정확히 공유하기 어렵다**고 지적했다. 반대로 모든 후보를 시안으로 만드는 것은 비용이 너무 컸다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음에는 설명을 더 길게 하거나 각 아이디어별 mockup을 만드는 방향이 자연스러워 보였다. 그러나 사용자는 실제 레퍼런스 사이트의 **특정 장면과 차용 지점**을 알 수 있다면 각 제안의 visual intent를 거의 시안처럼 이해할 수 있다고 제안했다. 이로써 문제는 설명량이 아니라 **공유 가능한 시각 기준점의 부재**임이 드러났다. `[대화]`

### 결정적 근거
Reference Card에 direct URL, viewing instruction, unforgettable moment, experience principle, ECG translation, `Do NOT copy`, Imitation Distance를 함께 주면 사용자는 원본 화면을 직접 보면서 AI가 무엇을 보고 어떤 느낌을 가져오려는지 검증할 수 있다. 동시에 prototype은 상위 2~3개에만 쓰면 된다. `[대화]` `[추론]`

### 조치와 검토한 대안
`docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`와 project-local `reference-mining` skill을 추가했다. 새 significant CREATIVE 작업에는 routing rule에 따라 자동 실행하거나 먼저 제안한다. `[커밋]`

검토한 대안:
- text-only creative ideas 유지
- 모든 후보를 mockup/prototype으로 제작
- 실제 reference를 visual-intent proxy로 쓰고 상위 후보만 prototype

세 번째를 채택했다.

### 비용 / 영향 범위
Reference가 anchoring을 일으켜 원본 appearance를 따라갈 위험이 있다. 이를 줄이기 위해 `Reference Feature → Experience Principle → Project Meaning → ECG Translation` 변환과 Imitation Distance 3~4를 기본으로 둔다.

### 놓쳤다면
AI와 사용자가 같은 단어를 쓰면서도 서로 다른 시각적 장면을 상상해, 구현 후에야 "원하던 느낌이 아니었다"는 피드백이 반복되거나 너무 많은 mockup 비용이 발생했을 것이다.

### 일반화
**실제 reference의 특정 장면은 mockup 이전의 저비용 visual prototype 역할을 할 수 있다.** 단, 원본 외형이 아니라 차용할 경험 원리와 보지 않을 부분까지 명시해야 한다.

---

## F-005. CASE 서사 품질은 문서 규칙만으로는 충분히 강제되지 않았다

| | |
|---|---|
| 상태 | 확정 |
| 발견 | 2026-09-18 기록 시스템 재점검 `[대화]` `[코드]` |
| 영향 | CASE checker와 transcript-excerpt 규칙 강화 |

### 발단 — 무엇이 이상해 보였나
사용자는 시스템 생성 배경과 논의 기록이 **AI를 위한 provenance보다 본인이 나중에 다시 읽을 인간용 기록**이라는 점을 다시 강조했다. 특히 흐름이 압축되어 사라지지 않도록 필요하면 실제 대화도 인용해야 한다고 확인을 요청했다. `[대화]`

> "시스템을 어떻게 구현하게 되었는지 그 배경 및 논의기록과 관련된 문서는 AI뿐만 아니라 오히려 사용자인 내가 다시 확인할 용도이니, 최대한 흐름을 놓치지 않도록, 필요시 대화 내용도 인용하면서 구체적으로 적어야 해."

### 먼저 의심한 것과 배제 방법
`10_RECORD_KEEPING.md`와 `11_CHECKLISTS.md`에는 이미 CASE가 `배경 → 논의 흐름 → 핵심 발화 → 구축 결과 → 재사용 패턴 → 사용자/AI 기여 → 한계`를 담아야 한다고 적혀 있어 처음에는 요구가 충분히 제도화되었다고 볼 수 있었다. 그러나 실제 `scripts/check-uiux-records.cjs`를 확인하자 자동 검사는 `배경/논의 흐름/구축된 시스템/재사용 패턴/한계`와 F/D/O/R 연결만 확인하고, **핵심 발화·대화 근거·사용자/AI 기여의 보존은 검사하지 않았다.** `[코드]`

### 결정적 근거
즉 문서 규약은 올바른 방향이었지만, checker가 더 약해서 **내용을 과도하게 요약한 CASE도 구조상 PASS할 수 있는 gap**이 있었다. `CASE-002` 역시 논의 흐름은 있었지만 처음 버전에는 별도 transcript-excerpt 부록과 핵심 대화 근거 섹션이 없었다. `[코드]` `[커밋]`

### 조치와 검토한 대안
- CASE-002에 직접 대화 발췌 부록을 추가한다.
- CASE 규약에 human reread 목적과 `핵심 대화 근거`를 더 명시한다.
- checker가 dialogue evidence와 사용자/AI 기여 구분을 확인하도록 승급한다.
- 원문이 없을 때는 인용을 강제하지 않고 `[재구성]` 또는 `기록 없음`을 요구한다.

단순히 CASE 길이를 늘리거나 모든 대화 전문을 저장하는 방식은 버렸다.

### 비용 / 영향 범위
CASE 작성 비용이 조금 증가한다. 대신 operational F/D/O/R은 계속 짧게 유지하고, 여러 사건을 묶는 CASE에만 이 규칙을 적용한다.

### 놓쳤다면
형식 검사는 통과하지만 사용자가 몇 달 뒤 읽었을 때 **"왜 이 결론이 나왔는지"를 다시 체감할 수 없는 기록**이 누적될 수 있었다.

### 일반화
방법론 CASE는 데이터베이스용 provenance가 아니라 **사람이 다시 사고 과정을 복원할 수 있는 narrative evidence**여야 한다. 자동 검사는 최소한 그 목적을 훼손하는 과도한 요약을 걸러낼 수 있어야 한다.

---

## F-006. 검증 체계가 강해진 뒤에도 **concrete multi-variant visual generation**은 별도 빈칸으로 남아 있었다

| | |
|---|---|
| 상태 | 확정 |
| 발견 | 2026-09-18 Superdesign 도입 검토 `[대화]` `[문헌]` |
| 영향 | Reference/Art Direction과 Validator 사이에 Visual Draft Generator 레이어 추가 |

### 발단 — 무엇이 이상해 보였나
프로젝트에는 Reference Mining, Creative Art Director, Product Design, design-taste, motion-review, Flourish, Figma 등 **제안·검증·정리 도구가 많이 쌓였지만**, 사용자는 여전히 "검증기용 플러그인이나 스킬은 많은데 생성기용은 부족한 느낌"이라고 문제를 제기했다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음에는 Creative Production이나 Figma가 이 빈칸을 이미 충분히 채우는지 볼 수 있었다. 그러나 Creative Production은 mood/branding upstream에 가깝고, Figma는 selected direction의 편집/freeze에 강하다. 둘 다 **현재 codebase를 baseline으로 읽고 같은 화면을 2~4개의 concrete visual direction으로 branch해서 비교**하는 역할과는 다르다. `[추론]`

### 결정적 근거
유지 중인 `superdesigndev/superdesign-skill`을 독립 검토하자 기존 codebase 분석, design-system context, real style reference, branchable draft iteration, resume/canvas workflow를 공식 시나리오로 제공하고 있었다. 또한 standard Chat에서는 shell이 없어 직접 실행하지 말고 Work 또는 shell 가능한 agent/web app을 사용하라는 제약도 명시되어 있어 환경 경계를 정확히 정의할 수 있었다. `[문헌]`

### 조치와 검토한 대안
- Superdesign을 **Visual Draft Generator**로 채택
- Reference Mining / Art Director 뒤, Validator 앞에 배치
- 8~10개 아이디어 전체가 아니라 상위 2~4개만 concrete draft로 생성
- generator output을 source of truth나 자동 승인안으로 취급하지 않음
- standard Chat은 실행이 아니라 handoff/brief까지만 담당

검토한 대안:
- 기존 Creative Production/Figma만으로 유지
- Superdesign을 전체 UI 설계/검증까지 맡기는 통합 도구로 사용
- Superdesign을 generator 역할로만 좁혀 기존 pipeline에 삽입

세 번째를 채택했다.

### 비용 / 영향 범위
외부 CLI/service auth와 draft generation 비용이 추가되고, code/context 일부가 외부 서비스로 전달된다. 그래서 최소 context, raw data/credential 제외, selected draft만 production implementation으로 옮기는 정책이 필요하다.

### 놓쳤다면
Reference와 아이디어는 풍부하지만 사용자가 **실제 시안 차이를 보기 위해 매번 Figma/React prototype을 직접 만들어야 하는 상태**가 남아, 발산 후보를 충분히 비교하기 전에 구현 비용 때문에 일찍 수렴했을 수 있다.

### 일반화
AI 디자인 시스템에서 **idea generation / concrete visual generation / validation은 서로 다른 capability**다. 검증기가 많다고 실제 시안 생성 능력이 자동으로 채워지는 것은 아니다.

## F-007. Renderer로만 배치하면 독립적인 방향 탐색을 놓친다

| | |
|---|---|
| 상태 | 설계 해석 확정 / 실사용 효과 미검증 |
| 발견 | 2026-09-18 handoff §2–3 [대화] |
| 영향 | D-009의 generator 역할에 D-010의 독립 Director 모드 추가 설계 |
| 연결 | F-006, D-010, R-009, CASE-004 |

### 발단 — 무엇이 이상해 보였나
사용자는 Superdesign이 A의 아이디어를 시안화하기만 하는 배치와 자신이 기대한 독립적 아이디어 발산 사이의 차이를 지적했다.

### 먼저 의심한 것과 배제 방법
초기 판단은 generator 빈칸에 한 자리만 배정하면 기존 역할과 충돌하지 않는다는 것이었다. handoff §3의 capability 재검토는 방향 탐색과 시안 생성이 서로 다른 모드로 공존할 수 있다고 정리한다. 현재 작업에서 외부 서비스를 다시 실행·측정한 결과는 아니다. [대화] [추론]

### 결정적 근거
handoff §2의 사용자 발췌는 기존 reference director와 병렬로 두려는 의도를 명시한다. D-009/R-008의 직렬 배치와 대조하면 승인권 분리와 도구의 역할 수 제한을 혼동한 부분이 드러난다. [코드] [대화]

### 조치와 검토한 대안
직렬 경로 유지, 전체 교체, 독립 Director 추가를 비교했다. 세 번째를 설계로 채택하되 기존 CONCRETIZER를 유지한다. CASE-004에 논의 순서를 보존했다.

### 비용 / 영향 범위
B는 4~6 cards 뒤 1~2 drafts만 생성하도록 설계했다. 실제 비용과 다양성 효과는 미검증이다.

### 놓쳤다면
사용자는 여러 시안을 받더라도 A가 정한 방향의 변형만 보게 되어 독립 발상이라는 요구를 충족하지 못했을 수 있다.

### 일반화
도구 목록보다 pipeline의 위치·입력·출력·승인권을 점검한다.

---

## F-008. Director A의 차별점은 특정 미감이 아니라 **명시적 provenance**였다

| | |
|---|---|
| 상태 | 확정 — 다음 creative round부터 적용 |
| 발견 | 2026-09-20 Director A source 확장 논의 `[대화]` |
| 영향 | Awwwards 중심 source list를 task-routed Reference Source Registry로 확장 |
| 연결 | F-004, D-013, R-012, CASE-002 |

### 발단 — 무엇이 이상해 보였나
Dual Director 첫 실험에서 A의 reference-grounded 결과가 유용했지만, A와 B를 차별화한다는 이유로 A를 "UX 쪽", B를 "creative visual 쪽"처럼 스타일 역할로 나누는 해석이 생길 수 있었다. 사용자는 **A의 기존 creative 방향 자체가 마음에 들었고, B와 반대로 만들기 위해 UX-only로 제한하고 싶지 않다**고 명시했다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음에는 A의 source pool을 product UX 쪽으로 넓히면 B와 다양성이 커질 수 있다고 생각할 수 있었다. 그러나 이는 A/B 차이를 결과 스타일로 정의한다. 실제 시스템의 차이는 A가 외부 reference의 URL·보는 장면·차용 원리를 명시한다는 점과, B가 Superdesign-native synthesis를 사용한다는 **provenance/process 차이**다. `[추론]`

### 결정적 근거
사용자는 Land-book/Minimal Gallery 같은 visual source와 Refero/Mobbin 같은 component/product source를 모두 A에 추가하려는 이유가 **Awwwards 하나에 과도하게 집중하는 것을 막고 reference vocabulary를 넓히기 위해서**라고 재정의했다. `[대화]`

### 조치와 검토한 대안
- A를 UX-only director로 변경 — 기각
- 사이트 목록만 길게 추가 — 기각
- source를 Creative / Curated Web / Concept / Product-Component / UX Evidence / Scientific / Data Story family로 분류하고 과업별 2~4 family만 선택 — 채택
- full-site뿐 아니라 section/component/flow reference도 Reference Card로 허용

### 비용 / 영향 범위
reference router와 provenance tag를 읽는 비용이 조금 늘어난다. 대신 한 gallery에 anchoring되는 위험과 concept/shipped-product 근거 혼동을 줄인다.

### 놓쳤다면
Dual Director의 차이를 "화려함 vs UX" 같은 결과 스타일로 잘못 고정해 A의 강점인 폭넓은 creative exploration을 스스로 제한했을 수 있다.

### 일반화
멀티 디렉터의 다양성은 서로 반대 스타일을 강제해서 만드는 것이 아니라 **서로 다른 정보원·provenance·생성 절차를 유지하면서 각자 넓게 탐색하게 하는 것**이 더 안정적이다.

---

## F-009. 첫 creative system test에서 핵심 병목은 **기능 부족보다 scene-level visual ambition과 reference fidelity 부족**으로 드러났다

| | |
|---|---|
| 상태 | 확정 — 새 creative routing에 반영 |
| 발견 | 2026-09-23 DUAL-ATTRACT-001 결과 회고 `[대화]` `[사용자평가]` |
| 영향 | Alpha/Beta 두 creative track 도입, Superdesign 기본 자동 경로 중지 |
| 연결 | D-015, R-013, CASE-005 |

### 발단 — 무엇이 이상해 보였나
사용자는 v2.2.1의 파형 표시와 기능 자체를 전면 부정하지 않았다. 오히려 비교/실시간성/기능은 자산으로 보고, 부족한 것은 처음 보는 사람을 끌어당기는 **전시형 장면·스토리·화려한 transition·reference의 강한 visual language**라고 설명했다. `[대화]`

### 먼저 의심한 것과 배제 방법
초기 시스템은 reference mining, Dual Director, Superdesign draft를 통해 발상 다양성과 concrete preview를 높이려 했다. 그러나 사용자가 첫 실사용 결과를 보고 평가한 핵심 불만은 "아이디어 수가 부족하다"가 아니라 **reference의 색·특징적 UI 요소·hover/motion·완성도가 실제 시안에 충분히 이식되지 않았다**는 것이었다. 특히 B01/B02는 구조적 data contract는 보존했지만, 사용자 기준에서 2.2.1보다 낮은 visual completeness와 약한 reference fidelity를 보였다. `[사용자평가]` `[추론]`

### 결정적 근거
사용자는 다음 목표를 명확히 했다. `[대화]`
- 파형은 결과물의 중심이므로 더 현대적이고 존재감 있게 보여야 한다.
- 연구 기록의 흥미로운 포인트를 scene/story로 전개할 수 있어야 한다.
- Awwwards/Godly/Minimal Gallery류의 독창적 experience를 ECG에 강하게 번안해야 한다.
- component/hover/motion까지 near-final 수준으로 구현되는 느낌이 필요하다.
- Superdesign 시안 제작기는 당분간 쓰지 않는다.

### 조치와 검토한 대안
- Superdesign prompt를 더 길게 튜닝해 재시도 — 당장 채택하지 않음.
- 기존 reference director + 직접 구현만 유지 — 이미지 기반 저비용 visual alignment 기회를 놓침.
- **Alpha: 처음부터 implementation-aware / Beta: reference-grounded image-first 후 UI translation** — 채택.

### 비용 / 영향 범위
creative system 문서와 routing이 늘어나지만, 이미지가 implementation spec을 대신하지 않도록 공통 packet/template/gate를 둔다. Superdesign 관련 문서는 삭제하지 않고 이력/향후 re-test용으로 유지한다.

### 놓쳤다면
"더 창의적으로"라는 요구를 button polish나 generic high-motion으로 오해하고, 실제 원하는 **고충실도 reference adaptation + ECG-specific exhibition scene**과 계속 어긋날 수 있었다.

### 일반화
Creative AI workflow에서는 "아이디어 다양성"과 "사용자가 기대하는 reference fidelity / near-final completeness"를 별개 capability로 검증해야 한다. 생성물이 빠르더라도 후자가 낮으면 실제 디자인 의사결정에는 도움이 적다.

---

## F-010. 레퍼런스 wow 재현 실패의 주원인은 발상이 아니라 **에셋·렌더링 엔진·시간축 사양의 부재**였다

| | |
|---|---|
| 상태 | 확인됨 — 제작 파이프라인 계층 채택 여부는 사용자 결정 대기 |
| 발견 | 2026-09-25 moto-card.com 지구 회전 사례 논의 `[대화]` `[사용자평가]` + scroll-globe spike `[런타임]` `[테스트]` |
| 영향 | 재설계 전 제작 파이프라인(에셋 registry, WebGL/timeline stack, motion spec, 입력 번안, motion QA) 도입 검토 |
| 연결 | F-009, D-015, D-016, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` |

### 발단 — 무엇이 이상해 보였나
사용자는 이전 결과물이 우수 레퍼런스의 연출을 제대로 살리지 못했다고 평가했다. 예로 moto-card.com의 "스크롤에서의 버튼 및 문구 전환 효과"와 "wow 포인트인 스크롤시 지구 회전 효과"를 들었고, 필요한 에셋, 3D 데이터 형식과 제작처, HTML 연동 기술 스택까지 "좀 더 백엔드적으로 체계를 더 구축할 필요가 있다"고 했다. `[대화]`

### 먼저 의심한 것과 배제 방법
F-009 이후의 해석은 "reference fidelity가 낮다 → creative track(Alpha/Beta)을 강화한다"였다. 그러나 기존 기록을 확인한 결과, D-016이 Attract 구현을 Canvas 2D로 제한했고 `[커밋]`, 저장소에 텍스처·모델·HDR 에셋 경로와 공통 scroll timeline이 없었으며 `[코드]`, 레퍼런스는 정지 이미지로만 분석되어 있었다 `[커밋]`. 즉 creative track을 아무리 개선해도 렌더링 상한과 재료가 없으면 결과가 같다는 것이 드러났다. `[추론]`

### 결정적 근거
three.js + GSAP ScrollTrigger + Lenis spike에서 지구 텍스처 2~3장과 셰이더만으로 "스크롤 → 지구 회전 + 헤드라인·버튼 교체" 메커니즘을 재현했다. 스크롤 0/30/60/100%에서 timeline progress와 회전값이 정확히 일치했고, 같은 timeline이 autoplay와 reduced-motion으로도 구동되었다 `[런타임]` `[테스트]`. 레퍼런스도 Three.js·GSAP·Webflow 태그를 가진다 `[문헌]`. 반면 대기 rim의 미감 차이는 여전히 남아, wow의 나머지 부분이 레퍼런스 동작과의 비교 튜닝(motion QA)에 있음을 확인했다. `[캡처]`

### 조치와 검토한 대안
- Alpha/Beta prompt만 보강 — 렌더링/에셋 상한을 넘지 못하므로 단독으로는 부족.
- Unity WebGL로 3D 장면 제작 — DOM/스크롤 timeline과 통합이 어렵고 무거워 HTML 연출용으로 비권장.
- **제작 파이프라인 계층(에셋 registry, WebGL stack, motion spec, 입력 번안, motion QA)을 creative track 아래에 둠** — 제안. 채택은 D-017에서 사용자 확인 후 결정.

### 놓쳤다면
다음 재설계 round에서도 Alpha/Beta 설계는 풍부한데 결과물은 2D 흉내 수준에 머무르는 같은 실패가 반복되고, 원인을 다시 "창의성 부족"으로 오진했을 것이다.

### 일반화
레퍼런스 기반 creative workflow에서는 "무엇을 만들지"와 별도로 **"무엇으로 만들지"(재료·엔진·시간축 사양·실측 기준)**를 사전 계층으로 갖춰야 한다. 그렇지 않으면 fidelity 목표가 구현 단계에서 조용히 하향된다.

---

## F-011. moto-card.com의 wow는 지구 회전이 아니라 **역광 연출과 형태 연속 전환(match cut)**이었다

| | |
|---|---|
| 상태 | 확인됨 — 레퍼런스 분석 방식에 반영 |
| 발견 | 2026-09-25 사용자 제공 54초 화면 녹화 분해 `[영상]` |
| 영향 | spike의 연출 해석 수정, 레퍼런스는 동작 녹화로 분해하는 규칙의 필요성 확인, 파이프라인 범위를 영상·사진·타이포 효과까지 확장 |
| 연결 | F-010, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §11 |

### 발단 — 무엇이 이상해 보였나
사용자는 이 사이트의 wow 포인트를 "스크롤시 지구 회전 효과"로 설명했고 `[대화]`, AI는 캡처 1장과 사이트 태그만으로 회전을 크게 주는 spike를 만들었다 `[커밋]`. 이후 사용자가 실제 스크롤 녹화를 제공했다. `[대화]`

### 먼저 의심한 것과 배제 방법
처음에는 spike의 부족함을 대기 rim 두께 같은 셰이더 튜닝 문제로 보았다 `[추론]`. 녹화를 1 fps와 2 fps contact sheet로 분해해 보니 회전량이 작았고, spike는 광원 방향부터 레퍼런스와 반대였다. 튜닝 이전에 해석 자체가 틀렸다. `[영상]`

### 결정적 근거
녹화 5~8초 구간에서 지구는 정면이 밤 면(도시 불빛)이고 윗가장자리만 밝은 역광이다. 9.5~10.5초 구간에서는 지구 정수리에서 흰 수직선이 솟고, 그 선이 옆에서 본 카드의 모서리가 된 뒤 회전하며 카드가 드러난다. 이후 장면들은 사진 타일 공간, 심도 흐림 타이포, 영상 clip reveal 등 서로 다른 재료로 만들어져 있다. `[영상]`

### 조치와 검토한 대안
- 사용자 설명 문장만 믿고 회전을 튜닝 — 기각.
- **레퍼런스는 동작 녹화를 시간축으로 분해하고, 장면별 재료·기법을 역추정한 뒤 번안** — 채택 후보(P1 파이프라인의 Motion Spec 단계).

### 놓쳤다면
"지구가 도는 화면"을 정교하게 만들수록 레퍼런스와 멀어지고, wow가 없는 원인을 다시 셰이더 품질에서 찾는 헛수고가 반복되었을 것이다.

### 일반화
사람이 말로 요약한 wow 포인트("지구 회전")는 실제로 인상을 만드는 기법(역광, 형태 연속 전환)과 다를 수 있다. 연출 레퍼런스는 반드시 **동작 녹화를 프레임 단위로 분해**한 뒤 해석한다.

---

## F-012. 녹화로 측정한 "속도 비례 회전"은 실제로는 **위치 연동 + scrub 지연 추종**이었다 — 두 메커니즘은 되돌리기로만 구분된다

| | |
|---|---|
| 상태 | 확인됨 — 녹화 분석 해석 규칙에 반영 |
| 발견 | 2026-09-25 moto-card.com 인라인 스크립트 확인 `[코드]` |
| 영향 | §14 결론 일부 정정, D-017 촬영 순서 7번(되돌리기)의 판별 근거 확정 |
| 연결 | F-011, D-017, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §18 |

### 발단 — 무엇이 이상해 보였나
녹화 분석에서 지구 회전 속도와 스크롤 속도의 상관이 0.96이었다 `[영상]`. AI는 이를 근거로 "각도 += (기본 + k·스크롤 속도)·dt" 같은 속도 적분형이라고 해석했다 `[커밋]`.

### 먼저 의심한 것과 배제 방법
네트워크 허용 뒤 소스를 확인하니, 지구는 `rotation.y`를 스크롤 진행률에 **선형 매핑**하고 `scrub: 1`로 부드럽게 추종하는 구조였다 `[코드]`. 선형 위치 매핑의 시간 미분은 스크롤 속도에 비례하므로, 녹화의 상관계수로는 두 해석을 구분할 수 없다. 반대로 사용자가 짚은 카드 파트의 "부드러운 빠름↔느림 전환"은 원통 사진 갤러리의 wheel 충격 + 지수 감쇠 구조로, 추정한 감쇠 시간상수(0.2~0.3 s)가 코드(0.92^(60·dt) ≈ 0.2 s)와 맞았다. `[코드]`

### 결정적 근거
`createScrollTimeline`의 `fromTo(earthGroup.rotation, {y: y−π/1.4}, {y: y−π/5})` + `scrub: 1`, 그리고 카드 씬의 `spinVelocity += deltaY × 0.0015`, `spinVelocity *= 0.92^(60·dt)`. `[코드]`

### 조치와 검토한 대안
§18에 추정과 실제를 나란히 기록해 §14를 정정한다. 녹화만 있을 때는 "속도 비례"를 관찰값으로만 적고, 메커니즘은 **되돌리기 반응**(위치 연동이면 거꾸로 돎, 충격형이면 방향만 바뀌고 계속 돎)으로 판정한다.

### 놓쳤다면
위치 연동 연출을 속도 적분으로 구현하면, 되돌려도 장면이 원래 상태로 돌아오지 않아 스크롤 서사가 깨진다. 반대로 원통 갤러리를 위치 연동으로 구현하면 멈췄을 때 살아 있는 느낌이 사라진다.

### 일반화
관찰값이 같아도 메커니즘은 다를 수 있다. 연출 분석은 **판별 실험(되돌리기, 단발 입력, 정지)**을 촬영 단계에 넣고, 가능하면 소스로 확인한 뒤 구현 방식을 정한다.

---

## F-013. AI 단독 Blender 제작은 "완주"는 되지만 품질 격차는 UV·베이크 규칙과 아트 디렉션에 몰린다 — 빛 360°는 직접광 실시간 + 간접광 베이크가 답이다

| | |
|---|---|
| 상태 | 확인됨 — P3(에셋 제작 주체) 판단 근거 |
| 발견 | 2026-09-25 lab-corner spike `[런타임]` `[테스트]` `[캡처]` |
| 영향 | 3D 장면 제작을 외주 필수가 아닌 "AI 제작 + 사용자 아트 디렉션 반복"으로 계획 가능. 동적 광원 요구에는 C 방식을 기본으로 |
| 연결 | F-010, REF-002(EFX-002-01 베이크 조명), `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §20 |

### 발단 — 무엇이 이상해 보였나
REF-002 분석 뒤 AI는 "70~80 %까지는 빠르게, 나머지 20 %가 대부분의 시간"이라고 예측했다 `[대화]`. 사용자는 실제로 해 보자며, 방은 그대로 두고 빛을 360° 돌리는 조건을 추가했다. `[대화]`

### 먼저 의심한 것과 배제 방법
AI는 MCP와 GPU가 있어야 현실적인 속도가 나온다고 보았다 `[대화]`. 헤드리스 `bpy`와 CPU 4코어로 조립·베이크·패키징까지 완주했고, 8방향 × 2종 베이크가 약 12.6분이었다 `[런타임]`. 도구가 병목이라는 가설은 배제했다.

### 결정적 근거
실제로 막힌 9가지(§20.3)는 축척 검수, 조명맵 UV(소품 UV 면적 7.6 %), 인코딩·내보내기·최적화 파이프라인의 함정, 디노이즈, 재질·색감이었다 `[런타임]` `[캡처]`. 빛 360°는 전체 베이크 블렌드(A)에서 사이 각도 그림자 잔상이 보였고, 실시간 직접광 + 간접광 블렌드(C)에서는 보이지 않았다. `[캡처]`

### 조치와 검토한 대안
- 3D 아티스트 외주를 전제 — 이번 근거로는 필수가 아님(주인공 조형은 미시험).
- 순수 베이크로 방향 수 증가(16–24방향) — 잔상은 줄지만 메모리·시간이 비례 증가.
- **C 방식 + 파이프라인 규칙(축척 검사, 조명맵 분리, 인코딩, prune/palette 주의) + 사용자 캡처 비교 반복** — 채택 후보.

### 놓쳤다면
"AI가 3D를 못 한다"는 막연한 판단으로 외주 비용을 들이거나, 반대로 순수 베이크로 360° 빛을 만들려다 잔상 문제로 시간을 잃었을 것이다.

### 일반화
AI 3D 제작의 한계는 "만들 수 있는가"보다 **보이지 않는 중간 산출물(UV, 인코딩, 최적화 옵션)의 함정**에 있다. 단계마다 수치 검사(치수, UV 면적, 조명맵 통계)와 캡처 비교를 자동으로 붙이면 반복 비용이 크게 줄어든다.

### 후속 — C 방식 v2 (2026-09-25)
사용자 요청 `[대화]`: "C 모드로 부족한 부분 개선해서 다시 해봐." 베이크를 **하늘빛(1회, 직접+간접) + 해 반사광(8방향, 간접만)**으로 나누어 v1의 반구광 0.45 보정을 없앴다. 여기에 OIDN 디노이즈, 소품 조명맵 분리(UV 면적 7.6 % → 32 %), 잎은 평균 조명 프로브, 바닥·벽 PBR, 창밖 배경, 후처리를 더했다. 같은 각도의 v1/v2 비교에서 입자 노이즈가 사라졌고, 역광에서도 그늘이 자연스러워졌다. 90°에서는 창문 모양 햇빛이 바닥에 떨어진다 `[캡처]`. 새 함정: 광택 마루에서 역광 반사가 화면을 하얗게 날렸고, 거칠기 하한으로 해결했다 → 일반화에 "**실시간 광원을 돌리는 장면은 모든 각도의 캡처를 검수한다(한 각도에서만 터지는 문제가 있다)**"를 더한다. 상세: audit §21.

## F-014. 레퍼런스급 wow가 WebGL 없이도 나온다 — white-desert는 PNG 두 장, SVG 경로 하나, CSS 링 세 개로 만든다

| | |
|---|---|
| 상태 | 확인됨 — 재설계에서 "3D 필요 여부" 판단 근거 |
| 발견 | 2026-09-25 REF-003 분석 `[코드]` `[런타임]` `[영상]` |
| 영향 | 모든 wow를 WebGL 파이프라인으로 풀 필요가 없다. DOM/Canvas 2D 기반인 v2.2.1 구조에도 바로 얹을 수 있는 연출군이 있다 |
| 연결 | F-010(원인 G1 Canvas 2D 상한), REF-003 EFX-003-01~03, `references/REF-003_WHITE_DESERT.md` |

### 발단 — 무엇이 이상해 보였나
사용자가 짚은 두 효과(구름이 밀려오는 hero, 소나처럼 위치를 알리는 경로 표시점)는 녹화만 보면 3D 렌더나 영상 합성처럼 보였다. `[대화]` `[영상]`

### 먼저 의심한 것과 배제 방법
REF-001·002가 모두 WebGL이었으므로 같은 계열을 예상했다 `[추론]`. 라이브 측정에서 canvas가 0개였고, 소스에서 구름은 `clouds-overlay_wrap` PNG 두 장, 경로는 SVG path + DrawSVG/MotionPath, 소나는 CSS `@keyframes`였다. `[런타임]` `[코드]`

### 결정적 근거
구름 두 층의 화면 속도는 스크롤 1 px당 0.90 px와 0.55 px로 정확히 선형이었고, 경로의 칠한 길이는 스크롤 300 px마다 100.28 px씩 늘었다 `[런타임]`. 효과의 품질은 렌더 기술보다 **재료(투명 구름 PNG, 위성 사진)와 정확한 스크롤 매핑·속도 비**에서 나왔다.

### 조치와 검토한 대안
- 모든 연출을 three.js 파이프라인으로 통일 — 불필요한 GPU·용량 비용이 생긴다.
- **연출마다 필요한 렌더 층을 고른다**: 깊이·조명·카메라 이동이 핵심이면 WebGL(REF-001·002), 층 겹침·경로·시간 루프면 DOM/SVG/CSS(REF-003). 효과 카드의 "구현 메커니즘 — 렌더 층" 필드로 판단한다.

### 놓쳤다면
재설계에서 3D 스택 채택(P1)을 "wow = 3D"로 단정했거나, 반대로 v2.2.1 구조로는 고급 연출이 불가능하다고 오판했을 것이다.

### 일반화
레퍼런스의 인상을 재현할 때 **렌더 기술을 먼저 정하지 말고, 효과 카드의 메커니즘(입력 모델, 층 구성, 재료)을 먼저 확인한다.** 같은 인상이 훨씬 가벼운 기술로 나오는 경우가 있다.
