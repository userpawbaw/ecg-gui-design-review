# CASE-002 Transcript Excerpts — Reference-Grounded Creative Mining

작성 기준: 2026-09-18  
연결: `CASE-002_REFERENCE_GROUNDED_CREATIVE_MINING.md`, `F-004`, `D-007`, `R-006`

> **성격.** 이 문서는 CASE-002의 핵심 전환점을 다시 읽기 위한 **대화 발췌 부록**이다. 현재 Chat 대화에서 직접 확인 가능한 발화를 옮겼다. 전체 machine-export transcript가 아니므로, 생략된 구간을 임의로 복원하지 않는다. 직접 확인 가능한 발화는 `[대화]`, 요약 연결 문장은 `[추론]`으로 구분한다.

---

## 1. Awwwards를 단순 취향 참고가 아니라 creative source로 다시 보자

### 사용자 `[대화]`

> "좋아. 문서로 묶고 좀 더 발산적으로 아이디어를 제시해보자. 특히, 이전에 내가 awwwards UI/UX 디자인들을 레퍼런스 삼아 특징들을 차용해보자고 했었는데, 이를 도와주는 관련 플러그인이나 스킬이 있었나? 다시 한번 조사해서 어떻게 적용할 것인지도 알려줘."

사용자는 단순히 "Awwwards처럼 만들어 달라"고 한 것이 아니라, Awwwards와 유사하게 독창적·기발한 우수작을 공유하는 플랫폼과 이를 활용하게 해주는 Plugin/Skill/MCP까지 함께 조사해 **creative reference ecosystem**을 만들고자 했다. `[추론]`

### AI 응답의 핵심 `[대화]`

> "목표는 Awwwards 화면을 모방하는 게 아니다. 우리가 가져와야 하는 것은: '왜 그 사이트를 처음 본 3초가 기억에 남았는가?'"

AI는 Awwwards/Godly를 발산, SiteInspire/Land-book을 시각 언어 분해, Lapa를 flow/motion 분석, CSSDA를 UI/UX/Innovation 검증, Mobbin을 product-UX 현실성 확인에 쓰는 역할 분리를 제안했다. 또한 Reference Card와 `Imitation Distance`를 도입해 원본 외형이 아니라 experience principle을 가져오자고 제안했다. `[대화]`

---

## 2. Text-only 아이디어의 한계가 드러나다

### 사용자 `[대화]`

> "레퍼런스 마이닝 단계를 네가 제시해준 것처럼 진행하면, 레퍼런스마다 사이트까지 주니 내가 gpt가 준 제안이 실제 레퍼런스의 어떤 점을 보고 차용했는지, 즉 gpt의 제안이 어떤 느낌을 주려고 하는지도 확실하게 보고 느낄 수 있겠네. 맞지?"

사용자는 기존 제안 자체를 이해하지 못한 것이 아니라고 분명히 했다. 문제는 **visual impression의 공유**였다. `[대화]`

> "지금까지 해준 제안들이 이해가 안 가는 건 아니지만, 실제로 화면을 본 건 아니니까 어떤 느낌인지는 아리송할 수밖에 없거든. 그렇다고 각 제안마다 시안을 만들어보라고 하기엔 제한적이고."

그리고 reference가 mockup 이전의 communication proxy가 될 수 있다는 핵심 아이디어를 직접 제시했다. `[대화]`

> "레퍼런스 사이트에서 어떤 부분을 얘기하고자 하는건지 알려줄 수 있다면 각 제안마다 시안을 받은 것과 동일한 효과를 얻을 수 있을거야."

이 발화가 `F-004`와 `D-007`의 직접적인 계기다.

---

## 3. Reference Mining을 짧은 명령으로 실행 가능한 시스템으로 만들자

### 사용자 `[대화]`

> "이 시스템도 구체적으로 확정해서 시도해볼 수 있게 만들어줘. 긴 프롬프트를 쓸 필요 없이, 이 단계를 진행하라고 요청하면 네가 제시했던 구체적 진행 스텝을 계획하고 실행할 수 있게끔 바로."

이 요구는 reference mining을 일회성 설명이 아니라 **재사용 가능한 project workflow contract**로 만들라는 요청이었다. `[추론]`

### AI 응답의 핵심 `[대화]`

> "앞으로 네가 그냥 '레퍼런스 마이닝 진행해줘.'라고 하면 아래 전 과정을 자동으로 수행하는 것으로 정의하면 돼."

그리고 `현재 UI/문제 → Creative Intent → reference 탐색 → Reference Card → Experience Principle → ECG translation → 발산 → 사용자 검토 → Validator → KEEP/TUNE/REJECT → prototype → 구현/검증 → F/D/R 기록`의 순서를 제안했다. `[대화]`

또한 direct URL만 주지 않고 반드시 **어디를 볼지** 지정하는 `Viewing instruction`을 두고, `Reference Feature → Experience Principle → Project Meaning → Implementation`의 변환을 거치도록 했다. `[대화]`

---

## 4. 실제 프로젝트 계약으로 굳히기

이 논의는 다음과 같이 저장소 구조로 승급됐다. `[커밋]`

- `docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`
- `.claude/skills/reference-mining/SKILL.md`
- `00_UIUX_MASTER.md`의 reference-grounding 단계와 자동/제안/생략 trigger
- `05_TOOL_SKILL_ROUTING.md`의 reference-mining routing
- `expo-ui-art-director` → reference-mining handoff
- `11_CHECKLISTS.md`의 viewing-instruction / imitation-distance 점검
- `AGENTS.md`의 환경 중립 short trigger
- `F-004`, `D-007`, `R-006`, `CASE-002`

짧은 트리거는 다음으로 고정했다.

```text
레퍼런스 마이닝 진행해줘.
Reference mining.
Attract 레퍼런스 마이닝.
```

이 문구는 특정 agent 제품의 skill-loader 문법이 아니라 **저장소에 적힌 workflow 계약을 가리키는 사용자 명령**으로 취급한다.

---

## 5. 후속 확인 — 기록은 AI보다 사용자가 다시 읽기 위한 것이기도 하다

### 사용자 `[대화]`

> "시스템을 어떻게 구현하게 되었는지 그 배경 및 논의기록과 관련된 문서는 AI뿐만 아니라 오히려 사용자인 내가 다시 확인할 용도이니, 최대한 흐름을 놓치지 않도록, 필요시 대화 내용도 인용하면서 구체적으로 적어야 해."

이 요구로 기록 시스템의 품질 기준을 다시 확인했다. 기존 `10_RECORD_KEEPING.md`는 이미 CASE에 `배경 → 논의 흐름 → 핵심 발화 → 구축된 시스템 → 재사용 패턴 → 사용자/AI 기여 → 한계`를 요구했지만, 자동 checker는 당시 `배경/논의 흐름/구축된 시스템/재사용 패턴/한계`와 F/D/O/R 연결만 검사해 **핵심 발화와 인간이 다시 읽을 수 있는 대화 증거는 충분히 강제하지 못했다.** `[코드]` `[대화]`

이 gap은 별도의 F/D/R로 기록하고 checker와 checklist를 강화한다.

---

## 6. 이 부록을 다시 읽을 때의 기준

이 문서는 대화를 많이 저장하는 것이 목적이 아니다. 다음 전환점이 보존되어야 한다.

1. 사용자가 무엇을 문제라고 느꼈는가.
2. AI가 처음 어떤 framing을 제시했는가.
3. 사용자가 어떤 반론/재정의를 했는가.
4. 그 결과 판단과 시스템이 어떻게 바뀌었는가.
5. 실제로 어떤 문서/Skill/검사로 승급됐는가.

정확한 원문이 없으면 `[재구성]`으로 표시하거나 `기록 없음`이라고 쓴다. 사용자가 다시 읽을 때 **결론만 있고 왜 그런 결론이 나왔는지 사라지는 것**을 가장 큰 실패로 본다.

---

## 7. 후속 전환 — Director A를 UX-only로 만들려는 것이 아니었다

### 사용자 `[대화]`

> "지금 디렉터 A로 탐색했던 방향이 마음에 들었어서 디렉터 B의 결과와 반대로 만들겠다고 일부러 UX에만 집중하게끔 하고 싶지는 않네."

그리고 추가 사이트를 제시한 목적을 다음처럼 정리했다.

> "혹시 awwwards에만 집중하고 있다면 그걸 방지하기 위해 위의 사이트를 제시했던 거였어."

Land-book/Minimal Gallery처럼 전체 미감·section을 볼 수 있는 source와 Refero/Mobbin류 component/product source를 함께 쓰자는 요구였다. `[대화]`

### 판단 변화 `[추론]`

Director A와 B의 차이를 결과 스타일로 만들지 않는다.

- A = explicit external reference + viewing instruction + borrowed principle + ECG translation
- B = Superdesign-native search/synthesis + generated draft

따라서 A는 Creative/Experimental뿐 아니라 Curated Web, Product/Component, Scientific, Data Storytelling source도 사용할 수 있다. UX research는 아이디어의 cheap sanity check로 쓰되 Validator를 대체하지 않는다.

이 전환은 `F-008 / D-013 / R-012`와 `17_REFERENCE_SOURCE_REGISTRY.md`로 승급했다.
