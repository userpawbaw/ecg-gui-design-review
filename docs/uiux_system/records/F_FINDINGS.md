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
