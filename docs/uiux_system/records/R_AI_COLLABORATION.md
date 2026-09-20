# R — AI / Plugin / Skill Collaboration Review

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"이건 UI 자체보다 AI를 쓰는 방법에 관한 교훈인가?"**

---

## R-001. Plugin 탐색이 실제 capability gap보다 실행 편의성에 치우쳤다

| | |
|---|---|
| 대상 | UI/UX Plugin 추천 과정 |
| 처리 | 부분 채택 후 문제 정의 수정 |
| 연결 | F-001, D-001 |
| CASE | CASE-001 |

### AI/도구가 내놓은 것
Context7, TinyFish, Vercel 등 Motion AI Kit 대체와 Chat 기반 실행/브라우저 반복을 돕는 도구를 주요 후보로 추천했다. `[대화]`

### 사람이 문제 삼은 것
사용자는 이들이 환경을 받쳐주는 데는 유용하지만, 실제 능력의 한계는 **"현재 UI를 전체적으로 인지하고 보는 맛을 높일 창의적인 수정사항을 제시하는 능력"**이라고 지적했다. 실행 루프는 번거로울 뿐 핵심 병목이 아니었다. `[대화]`

### 검증 방법과 결과
요구를 `creative proposer`와 `validator` 두 capability로 다시 나누자, validator는 이미 design-taste/Product Design/문서로 상당 부분 충족됐고 proposer가 비어 있음을 확인했다. `[추론]`

### 재사용 규칙
**도구를 추천하기 전에 "실행 friction"과 "판단/창의 capability gap"을 분리한다.** 사용자가 불편하다고 한 환경을 개선하는 것과, 실제 품질 한계를 해결하는 것은 같은 문제가 아니다.

---

## R-002. MotionDesign을 가장 엄격한 화면 기준으로만 평가해 용도를 과소평가했다

| | |
|---|---|
| 대상 | MotionDesign/Awwwards 계열 Plugin 평가 |
| 처리 | 초기 평가 수정 |
| 연결 | F-002, D-002 |
| CASE | CASE-001 |

### AI/도구가 내놓은 것
화려한 Awwwards/high-motion 스타일이 ECG waveform readability에 위험하다는 이유로 우선순위를 낮췄다. `[대화]`

### 사람이 문제 삼은 것
사용자는 Expo의 attract 화면, 모드 전환, first impression은 파형 정밀 판독과 목적이 다르며, **이 구역에서는 기발함과 브랜딩 자체가 목표의 일부**라고 반론했다. `[대화]`

### 검증 방법과 결과
화면을 task criticality에 따라 나누자 high-motion이 위험한 것은 core data view이고, attract/transition에는 오히려 맥락 전달과 완성도 측면의 잠재 가치가 있음을 확인했다. 그 결과 Creative Freedom Zone이 생겼다. `[추론]` `[커밋]`

### 재사용 규칙
**Creative tool을 평가할 때 제품의 가장 엄격한 core surface만 기준으로 전체 도구를 기각하지 않는다.** user journey를 구역으로 나누고 각 구역의 task와 error cost에 맞춰 판단한다.

---

## R-003. Flourish를 "차트 도구"로만 보아 연구 UI의 핵심 가치를 늦게 인식했다

| | |
|---|---|
| 대상 | Flourish Plugin 평가 |
| 처리 | 역할 재정의 후 채택 |
| 연결 | F-003, D-003 |
| CASE | CASE-001 |

### AI/도구가 내놓은 것
ECG visualization 아이디어나 결과 차트 제작에 참고할 수 있지만 현재 GUI polish의 주력은 아니라는 평가를 했다. `[대화]`

### 사람이 문제 삼은 것
사용자는 연구 프로젝트의 핵심이 데이터이고, Expo에서 짧은 시간에 **연구 스토리를 이해시키는 데이터 storytelling 자체가 UI/UX 핵심**이라고 지적했다. 3단 세로 파형과 문자 표가 유일한 답인지 탐색해야 한다고 했다. `[대화]`

### 검증 방법과 결과
Flourish 공개 Plugin 설명을 다시 확인해 "강조할 insight/story를 주면 editable interactive visualization을 만든다"는 역할을 확인했고, 최종 앱 작성 도구보다 **관계형 표현 후보 탐색기**로 두는 것이 적합하다고 재평가했다. `[플러그인]` `[추론]`

### 재사용 규칙
연구/분석 제품에서는 visualization tool의 가치를 "최종 차트를 그리는가"로만 보지 않는다. **어떤 데이터 관계가 이야기의 핵심인지 탐색하게 해주는가**를 별도 capability로 평가한다.

---

## R-004. 사용자의 임시 가설을 검증하지 않고 global concurrency 정책으로 일반화했다

| | |
|---|---|
| 대상 | Work 상태 공유 / repository-wide execution lock 설계 |
| 처리 | 폐기 후 resource-scoped 정책으로 교체 |
| 연결 | O-001, D-004 |
| CASE | CASE-001 |

### AI/도구가 내놓은 것
사용자가 "기기나 세션별 동시 실행 문제일 수 있다"고 생각한 상황에서 GitHub `WORK_STATE`의 global on/off lock을 정식 운영 규칙으로 발전시켰다. `[대화]`

### 사람이 문제 삼은 것
후에 사용자는 실제 문제는 기기/세션별 동시 실행이 아니었고, 사용량 제한으로 Work가 종료되어 off commit을 못 한 stale lock이 오히려 협업을 막았다고 재검토를 요청했다. `[대화]`

### 검증 방법과 결과
도입 커밋과 정책 문서를 확인하자 lock은 실제 데이터 손실 사고에 대응한 것이 아니라 **당시 사용자 요청을 예방 규칙으로 확장한 것**이었다. Git branch/commit이 일반 수정 충돌을 이미 관리하고, 필요한 것은 같은 resource의 실제 충돌 조정이었다. `[커밋]` `[추론]`

### 재사용 규칙
**사용자가 제시한 원인 가설을 운영 시스템으로 굳히기 전에 실제 실패 모드와 범위를 검증한다.** 예방 장치는 가장 작은 resource scope로 시작하고, repo-wide mutex처럼 넓은 제약은 실제 사고 근거가 있을 때만 도입한다.

---

## R-005. 우수한 AI 사용 사례를 남기려면 운영 기록과 방법론 서사를 분리해야 했다

| | |
|---|---|
| 대상 | 원본 ECG 연구 프로젝트 기록 시스템의 UI/UX 이식 |
| 처리 | 채택 및 확장 |
| 연결 | D-006 |
| CASE | CASE-001 |

### AI/도구가 내놓은 것
초기 UI/UX 시스템에는 `08_DECISION_EXPERIMENT_PROTOCOL.md`로 rejected idea와 근거를 남기는 규칙은 있었지만, 여러 대화에 걸친 **시스템 생성 배경과 사용자-AI 상호작용을 포트폴리오형 서사로 보존하는 계층**은 없었다. `[코드]`

### 사람이 문제 삼은 것
사용자는 최종 결과뿐 아니라 **결정이 나오게 된 논의 과정**을 중요하게 보며, 나중에 우수 AI 사용 경험을 설명하고 자신의 AI 사용 패턴을 개선하기 위해 "왜 만들었나"와 핵심 대화 흐름을 남기고 싶다고 했다. 원본 연구 프로젝트에 같은 목적의 기록을 추가한 대화와 결과 문서를 제공했다. `[대화]`

### 검증 방법과 결과
원본 repo의 `40_ai_collaboration_case.md`, `41_ai_collaboration_transcript.md`, `42_ai_collaboration_case_en.md`를 확인했다. 운영 F/D/O/R과 별개로 **방법론 사례 / 원문 부록 / 커리어용 one-page**를 분리한 구조가 실제로 작동하고, 사례 문서 자체도 저장소 무결성 검사에 걸려 세 차례 규칙을 끄지 않고 해소된 기록이 있었다. `[코드]` `[커밋]`

### 재사용 규칙
**운영 로그는 짧고 지속 가능하게, 방법론 사례는 여러 운영 기록과 대화를 묶어 서사화한다.** 커리어용 문서에서는 "AI가 무엇을 만들었다"보다 사용자가 문제를 어떻게 정의·반박·검증했고 AI가 어떻게 구조화했는지를 분리해서 보여준다.

---

## R-006. Reference를 AI와 사람 사이의 visual-intent proxy로 쓰면 mockup 비용을 줄일 수 있다

| | |
|---|---|
| 대상 | Creative proposal을 사용자가 이해하고 검토하는 방식 |
| 처리 | 새 workflow로 채택 |
| 연결 | F-004, D-007 |
| CASE | CASE-002 |

### AI/도구가 내놓은 것
AI는 `Signal Observatory`, `Beat Portal`, `Noise Fingerprint` 등 텍스트 기반 creative concept과, Awwwards/Godly 등에서 경험 원리를 가져오자는 방향을 제시했다. `[대화]`

### 사람이 문제 삼은 것
사용자는 제안의 개념 자체는 이해하지만 실제 화면을 본 것이 아니어서 **"어떤 느낌을 주려고 하는지"가 아리송할 수밖에 없고**, 후보마다 시안을 만드는 것도 제한적이라고 지적했다. 대신 실제 reference 사이트에서 AI가 어느 장면의 무엇을 보고 말하는지 알려주면 각 제안마다 시안을 받은 것과 비슷한 효과를 얻을 수 있다고 재정의했다. `[대화]`

### 검증 방법과 결과
이 문제를 `설명 부족`이 아니라 `visual anchor 부족`으로 다시 정의했다. direct URL만 주는 것도 충분하지 않아, `Viewing instruction`, `Unforgettable moment`, `Experience Principle`, `ECG Translation`, `Do NOT copy`, `Imitation Distance`를 하나의 Reference Card로 묶었다. 그 결과 reference가 inspiration source뿐 아니라 **prototype 이전의 shared visual language**가 되도록 workflow를 설계할 수 있었다. `[추론]` `[커밋]`

### 재사용 규칙
**추상적인 creative concept을 설명할 때 모든 후보를 직접 mockup하지 말고, 먼저 실제 reference의 특정 장면을 visual-intent proxy로 공유한다.** 반드시 `어디를 볼지`, `무엇을 차용할지`, `무엇은 차용하지 않을지`, `프로젝트에서 어떻게 번역할지`를 함께 적고, 상위 후보만 prototype한다.

---

## R-007. 기록 시스템은 AI 인수인계보다 인간의 재열람 품질을 우선 확인해야 한다

| | |
|---|---|
| 대상 | CASE/기록 시스템의 품질 기준과 자동 검사 |
| 처리 | checker와 transcript-excerpt 규칙 강화 |
| 연결 | F-005, D-008 |
| CASE | CASE-002 |

### AI/도구가 내놓은 것
기존 기록 시스템은 F/D/O/R 필수 구조, CASE 주요 절, F/D/O/R 연결, provenance 등을 자동 검사하도록 구성되어 있었다. `10_RECORD_KEEPING.md`에는 핵심 발화와 사용자/AI 기여를 남기라고 적혀 있었지만 checker는 그 부분까지 확인하지 않았다. `[코드]`

### 사람이 문제 삼은 것
사용자는 기록이 다음 AI에게 넘길 provenance인 것보다 **본인이 몇 달 뒤 다시 논의 흐름을 확인하기 위한 문서**라는 점을 강조했다. 따라서 필요하면 실제 대화를 인용하고, 어떤 문제 제기와 반론이 시스템을 바꿨는지 구체적으로 남겨야 한다고 요구했다. `[대화]`

### 검증 방법과 결과
문서 규약과 `scripts/check-uiux-records.cjs`를 대조하자 규약은 `핵심 발화`와 기여 구분을 요구하지만 checker는 이를 강제하지 않아 구조만 맞춘 축약 CASE도 PASS할 수 있음을 확인했다. `[코드]` 이를 보완하기 위해 CASE-002 transcript excerpt 부록, human-reread 규칙, checker 조건을 추가한다. `[커밋]`

### 재사용 규칙
**AI 협업 기록의 완료 조건을 기계적 provenance만으로 두지 않는다.** 사람이 다시 읽었을 때 `문제 제기 → AI 응답 → 반론 → 판단 변화 → 구축 결과`를 복원할 수 있어야 하며, 중요한 발화의 원문이 있으면 짧게 인용하고 없으면 `[재구성]`/`기록 없음`으로 정직하게 표시한다.

---

## R-008. 디자인 AI는 **제안기·시안 생성기·검증기**를 한 도구에 몰지 않을 때 역할이 더 명확했다

| | |
|---|---|
| 대상 | Superdesign 도입 검토와 기존 UI/UX orchestration |
| 처리 | 역할 분리 후 조건부 채택 |
| 연결 | F-006, D-009 |
| CASE | CASE-003 |

2026-09-18 후속: R-009 / CASE-004는 아래 한 자리 제한을 수정한다. 자기 승인 금지는 유지하며 당시 문장은 이력으로 보존한다.

### AI/도구가 내놓은 것
기존 시스템은 Reference Mining, Creative Art Director, Creative Production, Flourish, Product Design, design-taste, Figma 등을 역할별로 분리해 사용하고 있었다. 다른 AI의 Superdesign 조사안은 Superdesign이 codebase 분석→reference→baseline replica→branch variant 생성까지 할 수 있어 현재 pipeline의 생성기 빈칸을 채울 수 있다고 제안했다. `[대화]`

### 사람이 문제 삼은 것
사용자는 현재 시스템을 가장 많이 함께 설계한 이 세션에서 **"검증기용 플러그인/스킬은 많은데 생성기용은 부족한 느낌"**이라는 관점으로 최종 검증을 요구했다. 즉 새로운 도구를 유명세나 기능 수로 채택하는 것이 아니라, 기존 역할 지도에서 실제 빈칸을 채우는지 확인해야 했다. `[대화]`

### 검증 방법과 결과
maintained Superdesign skill의 실제 문서를 읽고 다음을 확인했다. `[문헌]`

- 기존 codebase가 있으면 init/context를 먼저 분석
- real reference와 design-system을 이용
- 같은 draft에서 branch variation 가능
- standard Chat에서는 shell이 없어 직접 지원하지 않음
- 현재 제품은 archived legacy IDE repo가 아니라 superdesign.dev + superdesign-skill

이를 기존 capability map과 대조하자 Superdesign은 Creative Production/Figma/Product Design을 대체하기보다 **concrete draft generation**이라는 별도 위치가 가장 적합했다.

### 재사용 규칙
**새 AI 디자인 도구를 평가할 때 기능 목록을 기존 파이프라인에 얹지 말고, 먼저 "idea proposer / visual generator / validator / implementation / runtime QA" 중 어느 capability를 채우는지 한 자리만 부여한다.** 역할이 둘 이상 겹치면 source of truth와 최종 승인권을 명시해서 한 도구가 자기 결과를 스스로 승인하지 못하게 한다.

## R-009. 역할 분리는 도구 하나를 한 위치에 제한하는 것과 다르다

2026-09-19 후속: D-012/16번은 이 원칙을 별도 clean context와 vendor state 격리로 구체화한다. 실제 생성 품질 향상은 여전히 미검증이다.

| | |
|---|---|
| 대상 | Superdesign Renderer → Independent Director 논의 |
| 처리 | R-008의 한 자리 제한 수정; 생성기 자기 승인 금지 유지 |
| 연결 | F-007, D-010, R-008 |
| CASE | CASE-004 |

### AI/도구가 내놓은 것
기존 AI는 generator 부족을 해소하기 위해 Superdesign을 A의 shortlist 뒤에만 두었다. [대화: handoff §3]

### 사람이 문제 삼은 것
사용자는 자체 발상 → 시안이라는 독립 경로와 A/B 병렬 비교를 기대했다고 반론하고, B의 비싼 생성은 1~2개로 제한하자고 제안했다. [대화: handoff §2]

### 검증 방법과 결과
D-009/R-008과 handoff를 대조해 NATIVE_DIRECTOR와 CONCRETIZER를 구분했다. 독립 입력과 cross-review 시점을 설계했지만 실제 결과의 다양성 향상은 아직 검증하지 않았다. [코드] [추론]

### 재사용 규칙
도구의 기능을 한 자리로 좁히기 전에 서로 다른 모드로 쓸 가치가 있는지 검토한다. 각 모드의 입력·출력·승인권을 분리하며, 독립 탐색 결과는 first pass가 끝나기 전 공유하지 않는다. 비싼 생성 전에 싼 후보 평가를 둔다.

---

## R-010. 기록이 있다는 것과 중요한 논의가 빠짐없이 기록된다는 것은 다르다

| | |
|---|---|
| 대상 | 방법론 D/R과 CASE의 누락 검사 |
| 처리 | CASE linkage와 회귀 검사로 보강 |
| 연결 | D-011, R-007 |
| CASE | CASE-004 |

### AI/도구가 내놓은 것
기존 checker는 있는 CASE의 절·대화 표시·기여 구분을 확인했다. [코드]

### 사람이 문제 삼은 것
사용자는 본인의 질문과 AI 답변 사이의 논의가 매번 충분히 보존되는지 확인하고 실행 시스템보다 기록 보강을 먼저 요구했다. [대화: 이번 실행 요청]

### 검증 방법과 결과
기존 코드에는 D/R → CASE 역방향 검사가 없었다. CASE 필드와 유효한 main CASE 대상을 검사하고, 잘못된 입력을 실제 임시 저장소에 넣어 실패하는 회귀 검사를 추가한다. 검사 PASS는 인용의 진실성이나 문장의 충분함을 보증하지 않는다. [코드]

### 재사용 규칙
기록의 존재를 확인하는 검사와 기록 의무의 누락을 확인하는 검사를 구분한다. 원문·전달 발췌·재구성을 구별하고, 사용자가 다시 읽어 반론과 판단 변화의 순서를 복원할 수 있는지 별도로 검토한다.

---

## R-012. 멀티 디렉터는 **반대 스타일**보다 서로 다른 provenance 경로로 차별화하는 편이 낫다

| | |
|---|---|
| 대상 | Director A source ecosystem 확장과 Dual Director 역할 해석 |
| 처리 | A의 creative 범위 유지 + source router 확장 |
| 연결 | F-008, D-013, R-009 |
| CASE | CASE-002 |

### AI/도구가 내놓은 것
B가 Superdesign-native direction과 draft를 생성한 뒤, A에 UX/product reference를 더 넣으면 두 Director의 다양성을 높일 수 있다는 해석이 가능했다. 기존 A source 문서에는 Awwwards/Godly, Land-book, Mobbin, scientific examples 등이 있었지만 source-selection budget과 provenance nature가 명시적으로 구조화되지는 않았다. `[코드]` `[추론]`

### 사람이 문제 삼은 것
사용자는 **"디렉터 B의 결과와 반대로 만들겠다고 일부러 UX에만 집중하게끔 하고 싶지는 않다"**고 지적하고, Land-book/Minimal Gallery와 component source를 추가한 이유는 **"혹시 awwwards에만 집중하고 있다면 그걸 방지"**하기 위한 것이라고 설명했다. `[대화]`

### 검증 방법과 결과
A/B 계약을 다시 보면 A의 차별점은 explicit URL/viewing instruction/principle/translation이고 B의 차별점은 Superdesign-native search/synthesis/draft다. 결과 미감을 반대로 강제할 필요가 없다. 그래서 `17_REFERENCE_SOURCE_REGISTRY.md`를 추가하고 A가 과업에 맞는 source family 2~4개만 선택하도록 했다. `[코드]` `[추론]`

### 재사용 규칙
**병렬 AI 역할을 설계할 때 서로 반대 결과를 내게 하는 것으로 diversity를 만들지 않는다.** 입력 source, provenance, search/generation mechanism을 다르게 두고 출력 공간은 겹치게 허용한다. 그래야 두 경로가 같은 결론에 도달하는 것도 의미 있는 독립 수렴 증거가 된다.
