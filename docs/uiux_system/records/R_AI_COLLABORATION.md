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

### AI/도구가 내놓은 것
AI는 `Signal Observatory`, `Beat Portal`, `Noise Fingerprint` 등 텍스트 기반 creative concept과, Awwwards/Godly 등에서 경험 원리를 가져오자는 방향을 제시했다. `[대화]`

### 사람이 문제 삼은 것
사용자는 제안의 개념 자체는 이해하지만 실제 화면을 본 것이 아니어서 **"어떤 느낌을 주려고 하는지"가 아리송할 수밖에 없고**, 후보마다 시안을 만드는 것도 제한적이라고 지적했다. 대신 실제 reference 사이트에서 AI가 어느 장면의 무엇을 보고 말하는지 알려주면 각 제안마다 시안을 받은 것과 비슷한 효과를 얻을 수 있다고 재정의했다. `[대화]`

### 검증 방법과 결과
이 문제를 `설명 부족`이 아니라 `visual anchor 부족`으로 다시 정의했다. direct URL만 주는 것도 충분하지 않아, `Viewing instruction`, `Unforgettable moment`, `Experience Principle`, `ECG Translation`, `Do NOT copy`, `Imitation Distance`를 하나의 Reference Card로 묶었다. 그 결과 reference가 inspiration source뿐 아니라 **prototype 이전의 shared visual language**가 되도록 workflow를 설계할 수 있었다. `[추론]` `[커밋]`

### 재사용 규칙
**추상적인 creative concept을 설명할 때 모든 후보를 직접 mockup하지 말고, 먼저 실제 reference의 특정 장면을 visual-intent proxy로 공유한다.** 반드시 `어디를 볼지`, `무엇을 차용할지`, `무엇은 차용하지 않을지`, `프로젝트에서 어떻게 번역할지`를 함께 적고, 상위 후보만 prototype한다.
