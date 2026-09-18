# Dual Creative Director — Work Handoff Checkpoint

작성 기준: 2026-09-18  
상태: **Work 실행 전 Chat에서 고정한 handoff / context checkpoint**  
작성 목적: 현재 Chat의 풍부한 논의 맥락을 잃지 않고, 웹 Work/Codex/Claude Code에서 기록 체계 보강 → Dual Creative Director 실행 시스템 구현을 이어가기 위한 기준 문서.

> 이 문서는 최종 설계 문서가 아니다. **Work가 무엇을 왜 바꿔야 하는지, 어떤 대화 맥락을 보존해야 하는지 전달하는 실행 checkpoint**다.
>
> Work 시작 시 반드시 최신 remote main을 다시 확인하고, 이 문서 작성 이후 관련 파일이 바뀌었다면 최신 변경을 우선 반영한다.

---

## 0. 현재 저장소 기준점

이 checkpoint 작성 직전 확인한 remote main:

`88a8c03e67d1e884fd9f5a18f30d7317f76fd2d4`

중요: 이 main에는 이미 다음이 반영되어 있다.

- `CASE-001_UIUX_AI_ORCHESTRATION.md`
- `CASE-002_REFERENCE_GROUNDED_CREATIVE_MINING.md`
- `CASE-002_TRANSCRIPT_EXCERPTS.md`
- `CASE-003_SUPERDESIGN_GENERATOR_LAYER.md`
- `F-006 / D-009 / R-008`
- `14_SUPERDESIGN_GENERATION_LAYER.md`
- `15_SUPERDESIGN_USAGE_EXAMPLES.md`
- `.claude/skills/superdesign-routing/SKILL.md`

따라서 **새 Dual Creative Director 방법론 사례는 CASE-003을 덮어쓰지 않는다. 새 CASE 번호는 CASE-004를 기본으로 한다.**

추천 파일명:

- `docs/uiux_system/cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md`
- `docs/uiux_system/cases/CASE-004_TRANSCRIPT_EXCERPTS.md`

CASE-001은 별도 transcript appendix가 아직 없으므로, 이번 기록 보강 단계에서 `CASE-001_TRANSCRIPT_EXCERPTS.md` 추가를 검토한다.

---

## 1. 이 작업이 생긴 배경 — 시스템의 진화 흐름

### 1.1 Single Creative Director

초기 UI/UX 시스템에서는 사용자가 다음 문제를 제기했다.

> "지금 정확히 능력의 한계를 느끼고 도움이 필요한 부분은 1) 내 UI 관련해서 좀 더 보는 맛 있게, 그러면서도 UX 측면에서 문제를 일으키지 않을 만한 수정사항들을 제시해주고, 2) 이를 기존 UI/UX skill들과 문서, 플러그인을 기반해서 타당성을 검증해주는 어드바이저야."

이 문제를 바탕으로 다음 역할이 분리됐다.

- Creative UI Art Director
- Data Storyteller
- Validator
- Implementation / QA

이 과정은 현재 `CASE-001_UIUX_AI_ORCHESTRATION.md`에 기록되어 있다.

### 1.2 Reference-Grounded Creative Mining

다음 병목은 **텍스트 아이디어만으로는 visual intent를 충분히 공유하기 어렵다**는 것이었다.

사용자 핵심 발화:

> "지금까지 해준 제안들이 이해가 안 가는 건 아니지만, 실제로 화면을 본 건 아니니까 어떤 느낌인지는 아리송할 수밖에 없거든."

> "그렇다고 각 제안마다 시안을 만들어보라고 하기엔 제한적이고."

> "레퍼런스 사이트에서 어떤 부분을 얘기하고자 하는건지 알려줄 수 있다면 각 제안마다 시안을 받은 것과 동일한 효과를 얻을 수 있을거야."

이 문제로 `Reference Mining → Reference Card → Experience Principle → ECG Translation` 구조가 만들어졌다.

현재 `CASE-002_REFERENCE_GROUNDED_CREATIVE_MINING.md` 및 `CASE-002_TRANSCRIPT_EXCERPTS.md`에 기록되어 있다.

### 1.3 Superdesign을 처음에는 "bounded generator"로 도입

사용자는 이후 다음 capability gap을 제기했다.

> "우리 시스템에 검증기용 플러그인이나 스킬은 많은데 생성기용은 부족한 느낌이 들어서"

Superdesign 공식 maintained skill을 검토한 뒤, 처음에는 다음 직렬 구조로 통합했다.

```text
Reference Mining
→ Creative Art Director
→ shortlist 2~4
→ Superdesign concrete branch drafts
→ user visual alignment
→ validator
```

즉 Superdesign을 **상위 아이디어를 실제 시안으로 만드는 Visual Draft Generator / Concretizer**로 해석했다.

이 판단은 현재 다음에 기록돼 있다.

- `CASE-003_SUPERDESIGN_GENERATOR_LAYER.md`
- `F-006`
- `D-009`
- `R-008`

---

## 2. 이번 판단 전환의 핵심 — 사용자의 반론

이후 사용자는 위 배치를 다시 문제 삼았다.

### 사용자 발화 1 — 기대했던 Superdesign 역할

> "나는 superdesign이 자체적으로 아이디어를 발산시켜서 시안을 제조해보는 역할을 기대했거든."

### 사용자 발화 2 — 병렬 Multi-Director 구상

> "현재 구축한 awwwards, godly 기반 레퍼런스 교차 creative director과 병렬로 존재해서 멀티 디렉터 구조로."

### 사용자 발화 3 — 기존 Reference Director와의 차이

> "기존 레퍼런스 마이닝 기반 creative director는 이미 완성되어 존재하는 레퍼런스를 사용자가 참고할 수 있게 연결해주면서 해당 레퍼런스의 어떤 특징, 아이디어를 차용해 우리 프로젝트에 적용시킬지 제시해준다면, 새로운 superdesign은 순서를 뒤집어 범용적인 레퍼런스 탐색기를 기반으로 어떤 아이디어가 우리 프로젝트에 맞을지 제시한 다음 이와 관련된 시안을 superdesign 베이스로 만들어 제시해주는거야."

### 사용자 발화 4 — 비용 제어 아이디어

> "후자인 시안을 만드는 데 드는 비용이 전자인 기존 레퍼런스 제시 및 변형에 드는 그것보다 훨씬 높을테니, 후자는 superdesign 기반 아이디어를 사전 평가한 후 1~2개 정도로 추려서 전자의 다양한 기존 레퍼런스 변형과 비교해서 검증기를 통과시켜야 할 것 같긴 해."

이 반론은 단순한 parameter tuning이 아니라 **Superdesign의 시스템 위치를 바꾸는 방법론 수준의 설계 변경**이다.

---

## 3. AI의 초기 framing과 판단 수정

### 초기 framing — 이후 수정 대상

AI는 Superdesign을 다음과 같이 좁게 배치했다.

```text
Reference Mining
→ Creative Art Director
→ shortlist
→ Superdesign
→ Validator
```

즉 "이미 만들어진 아이디어를 실제 시안으로 바꾸는 제조기"에 가깝게 해석했다.

### 사용자 반론 이후 재검토

Superdesign 공식 문서를 다시 확인하면 다음 능력이 함께 존재한다.

- existing codebase 조사
- design system 추출/활용
- prompt/style library search
- URL design DNA extraction
- design direction discovery
- same baseline branch generation
- branch/replace iteration
- multiple design models 선택/비교 가능

따라서 **Superdesign이 "renderer"만 가능한 도구는 아니며, 독립적인 design-direction explorer로도 사용할 수 있다.**

### 판단 수정

Superdesign은 두 모드로 나누는 것이 더 적절하다.

```text
Superdesign
├─ NATIVE_DIRECTOR
│  자체 inspiration / prompt library / codebase context를 사용해
│  기존 Reference Director와 독립적으로 새 design direction 발산
│
└─ CONCRETIZER
   이미 선택된 A/B/Hybrid 아이디어를
   실제 concrete visual draft로 시안화
```

이 판단은 기존 D-009를 삭제하지 않는다.  
D-009는 "Superdesign을 generator로 처음 도입한 당시 결정"으로 보존하고, 이번 판단은 **후속 D/R/F 및 CASE-004로 연결**해야 한다.

---

## 4. 최종적으로 구상된 Dual Creative Director

### Director A — Explicit Reference Director

기존 시스템.

입력:
- current UI
- project goal
- Creative Freedom Zone
- ECG/data constraints

독립 자료:
- Awwwards
- Godly
- NASA Eyes
- SiteInspire
- Land-book
- Lapa Ninja
- CSS Design Awards
- Mobbin 등

출력:
- concrete external reference URL
- exact viewing instruction
- Reference Card
- Experience Principle
- ECG Translation
- 5~8 creative concepts

강점:
- visual provenance가 명확함
- 사용자가 "어디서 어떤 느낌을 차용하는지" 직접 확인 가능
- cheap visual alignment

### Director B — Superdesign-Native Director

새로 공식화할 역할.

입력:
- current codebase
- project goal
- Creative Freedom Zone
- ECG/data hard constraints

첫 pass에서 금지:
- Director A의 Reference Cards
- A의 후보 아이디어
- A의 선호/선정 결과

독립 자료:
- Superdesign init/context
- current design system
- Superdesign prompt/style library
- optional website design-DNA extraction
- selected Superdesign design model

출력 1단계:
- 4~6개의 **SD Direction Cards**
- 이 단계에서는 아직 실제 draft를 전부 만들지 않음

추천 SD Direction Card 필드:

```text
SD-DIR-###
Search queries:
Prompt-library source / slug:
Model:
Why this direction:
Project translation:
Expected feeling:
Difference from current UI:
Difference from other SD candidates:
Hard risks:
Draft cost:
```

그 뒤 cheap prefilter로 1~2개만 actual Superdesign draft 생성.

### Cheap prefilter에서 제거 가능한 이유

- waveform/data 의미를 직접 깨는가
- 프로젝트 목적과 관계가 거의 없는가
- 다른 후보와 사실상 같은가
- 실험 비용에 비해 얻을 정보가 거의 없는가

### Cheap prefilter에서 제거하면 안 되는 이유

- 너무 낯설다
- 일반적인 의료 UI 같지 않다
- 너무 과감해 보인다
- 전통적 dashboard 문법이 아니다

이런 판단은 downstream Validator 역할이다.

---

## 5. Independence Rule — Dual Director의 핵심

두 Director는 **First Pass에서 서로의 creative output을 보지 않는다.**

공유 가능:

- project problem
- current baseline
- current code/design system
- project hard constraints
- Creative Freedom Zone

공유 금지:

- A의 reference sites
- A의 idea list
- A의 preferred direction
- B의 prompt-library result
- B의 SD Direction Cards
- B의 generated drafts

이후 Cross Review 단계에서만 결과를 합친다.

목적:

> 같은 문제를 서로 다른 inspiration diet로 풀게 해서 실제 diversity를 확보한다.

두 Director가 처음부터 서로의 결과를 보면 anchoring 때문에 **두 번 비용을 쓰고 같은 방향을 얻는 구조**가 될 수 있다.

---

## 6. Cross Review / Hybrid 규칙

A와 B 결과를 함께 본 뒤:

```text
A candidates
      \
       → CROSS REVIEW → validator
      /
B draft candidates
```

필요하면 다음과 같은 Hybrid를 한 번 만들 수 있다.

```text
A concept
+
B composition / interaction grammar
↓
Hybrid H1
```

Hybrid는 기본 단계가 아니다.  
**서로 상보적인 강점이 실제로 보일 때만** 2차 생성한다.

---

## 7. Creative Freedom Zone과 Director Budget 연결

### HIGH

대표:
- Attract
- Intro
- Lab → Evidence
- Replay → Live
- major Evidence story
- Result Reveal

새 visual direction이면:

`Dual Director 기본 자동 실행`

### MEDIUM

대표:
- Method Explorer
- metric summary
- navigation
- result cards

기본:
- Director A 먼저
- 필요하면 Director B 제안/실행

### LOW

대표:
- waveform inspection
- axis
- Difference
- Reference
- exact numerical measurement

기본:
- Dual Director 자동 실행하지 않음
- data integrity / usability 우선

---

## 8. 환경별 실행 구조

### Standard Chat

Chat은 Superdesign CLI를 직접 실행하지 않는다.

가능:

- Director A 전체 실행
- project context / constraints 정리
- Director B용 handoff packet 작성
- Cross Review
- Validator
- 기록/CASE 설계

불가능/금지:

- shell 없이 Superdesign을 실행한 척하기

Short trigger 예:

- `듀얼 디렉터 진행해줘`
  - A는 Chat에서 실행
  - B는 Work/Codex/Claude용 handoff 생성

- `레퍼런스 디렉터만 진행해줘`
  - A만 실행

- `Superdesign 독립 탐색 진행해줘`
  - B용 handoff 생성 또는 shell 환경에서 B 실행

- `이 후보를 Superdesign 시안으로 만들어줘`
  - CONCRETIZER mode

### Work / Codex / Claude Code

shell + Superdesign skill/CLI가 실제 사용 가능한 환경에서는:

- Director A
- Director B NATIVE_DIRECTOR
- CONCRETIZER
- cross-review용 산출물 준비

모두 가능.

Work가 항상 이 Chat의 대화 원문을 볼 수 있다고 가정하지 않는다.  
GitHub canonical docs + 이 handoff checkpoint를 source로 사용한다.

---

## 9. 기록 시스템 보강 — Work가 먼저 해야 할 일

Dual Director 실행 시스템을 만들기 전에 **기록 계층을 먼저 완성한다.**

### 9.1 CASE-004 작성

추천:

`docs/uiux_system/cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md`

반드시 다음 서사를 보존한다.

1. Single Creative Director 탄생
2. Reference Mining 발전
3. Superdesign 발견
4. Superdesign을 Renderer/Generator로만 둔 첫 설계
5. 사용자 반론 — "독립 Director를 기대했다"
6. upstream capability 재검토
7. Superdesign = NATIVE_DIRECTOR + CONCRETIZER 판단
8. Dual Creative Director 확정
9. independent first pass / budget / cross-review / hybrid
10. Chat/Work/Codex activation 구조
11. 재사용 가능한 AI usage pattern

### 9.2 CASE-004 transcript appendix

추천:

`docs/uiux_system/cases/CASE-004_TRANSCRIPT_EXCERPTS.md`

목적:
- human reread
- 사용자가 몇 달 뒤 질문/답변의 흐름을 최대한 복원
- 원문 맥락이 손상되지 않게 pivotal dialogue를 비교적 충분히 보존

반드시 포함할 사용자 원문:

- "나는 superdesign이 자체적으로 아이디어를 발산시켜서 시안을 제조해보는 역할을 기대했거든."
- "현재 구축한 awwwards, godly 기반 레퍼런스 교차 creative director과 병렬로 존재해서 멀티 디렉터 구조로."
- Superdesign과 Reference Director의 순서를 뒤집는 차이를 설명한 긴 발화
- "후자는 superdesign 기반 아이디어를 사전 평가한 후 1~2개 정도로 추려서..."

반드시 포함할 AI 판단 변화:
- Superdesign을 "시안 제조기"로 좁게 둔 이전 framing
- 그 framing이 왜 incomplete였는지
- Dual Director / Native Director / Concretizer 재설계 답변

원문이 현재 Work에서 직접 보이지 않으면 이 handoff의 인용을 `[대화]` 근거로 사용하되, **이 checkpoint가 Chat에서 직접 옮긴 발췌임을 명시**한다. 없는 원문을 새로 만들지 않는다.

### 9.3 CASE-001 transcript appendix 보강

현재 CASE-001은 내용은 충분히 상세하지만 별도 transcript excerpt가 없다.

추천:

`docs/uiux_system/cases/CASE-001_TRANSCRIPT_EXCERPTS.md`

우선 보존할 turning points:

- execution friction vs creative capability gap
- MotionDesign/Awwwards 재평가
- Flourish 재평가
- 결과뿐 아니라 논의 과정 자체를 기록해야 한다는 사용자 요구

### 9.4 F/D/R 후속 기록

기존 D-009/R-008을 삭제하거나 조용히 수정하지 않는다.

후속 기록 예:

- F-007: Superdesign을 renderer로만 두면 native direction-discovery capability를 놓친다는 finding
- D-010: Dual Creative Director + Superdesign dual mode 채택
- R-009: 같은 AI tool도 pipeline placement에 따라 capability가 달라지며, 서로 다른 inspiration diet를 가진 independent first pass가 diversity를 높인다는 collaboration lesson

정확한 ID는 최신 main을 확인하고 충돌 없이 선택한다.

---

## 10. 기록 시스템 자체 보강

현재 checker는 "CASE가 존재할 때 제대로 쓰였는가"는 검사하지만:

> 방법론 수준의 D/R이 생겼는데 CASE가 아예 없는가?

를 자동으로 충분히 잡지는 못한다.

이번에는 별도 ledger를 새로 만들지 말고, 기존 D/R에 작은 CASE linkage 필드를 추가하는 방향을 검토한다.

예:

```text
| CASE | CASE-004 |
```

또는:

```text
| CASE | 보류 — 단일 사건 |
```

목표:

- 방법론 수준의 D/R이 생기면 CASE 연결 또는 CASE가 아직 불필요한 이유를 명시
- "새로운 ledger를 하나 더 만들고 그 ledger 작성 자체를 잊는 구조"는 만들지 않음
- checker는 가능한 범위에서 CASE link 존재/유효성을 검사
- 자동 검사가 판단 품질 자체를 대신하지 않음

`10_RECORD_KEEPING.md`, `11_CHECKLISTS.md`, `scripts/check-uiux-records.cjs`를 함께 검토한다.

---

## 11. 기록 단계 완료 조건

다음이 모두 끝나기 전에는 Dual Director runtime system 구현으로 넘어가지 않는다.

- [ ] CASE-004 main case
- [ ] CASE-004 transcript excerpts
- [ ] CASE-001 transcript appendix 여부 검토 및 가능한 범위 보강
- [ ] F/D/R 후속 기록
- [ ] 기존 D-009/R-008과 연결
- [ ] CASE linkage 규칙 보강
- [ ] checker 업데이트
- [ ] `npm run records:check` 또는 root test PASS
- [ ] GitHub Actions record check PASS
- [ ] PR/commit evidence 확보
- [ ] 사용자가 나중에 다시 읽었을 때 `문제 → AI 초기 framing → 사용자 반론 → 판단 변화 → 시스템` 흐름 복원 가능

---

## 12. 기록 단계 이후 구현할 Dual Director 시스템

기록 단계가 끝난 뒤 다음 구현으로 이동한다.

### 신규 canonical doc

`docs/uiux_system/16_DUAL_CREATIVE_DIRECTOR.md`

포함할 것:

- Director A / B 정의
- shared context
- forbidden cross-context
- independent first pass
- zone-based auto routing
- A/B budget
- SD Direction Card
- prefilter
- cross-review
- Hybrid rule
- validator handoff
- environment-specific behavior
- short triggers

### 신규 local skill

`.claude/skills/dual-creative-director/SKILL.md`

역할:
- short trigger
- A/B 독립 실행 강제
- first pass cross-contamination 금지
- B unavailable 시 handoff
- cross-review 전에는 서로의 output을 공개하지 않음

### 기존 superdesign-routing 수정

현재 CONCRETIZER 성격이 강한 skill을 dual mode로 확장:

```text
mode = NATIVE_DIRECTOR
mode = CONCRETIZER
```

#### NATIVE_DIRECTOR
- Reference Director 결과를 읽지 않음
- Superdesign prompt/inspiration/codebase context에서 4~6 SD Direction Cards
- 1~2만 실제 draft

#### CONCRETIZER
- 이미 선택된 A/B/Hybrid concept을 concrete draft로 시안화

### 연결 수정 대상

- `00_UIUX_MASTER.md`
- `01_CREATIVE_DIRECTION.md`
- `05_TOOL_SKILL_ROUTING.md`
- `06_CHAT_WORK_CODEX_HANDOFF.md`
- `14_SUPERDESIGN_GENERATION_LAYER.md`
- `15_SUPERDESIGN_USAGE_EXAMPLES.md`
- `AGENTS.md`
- `11_CHECKLISTS.md`
- `07_EXTERNAL_SKILLS_PROVENANCE.md`
- project index

---

## 13. activation contract

### 사용자가 기억할 최소 명령

#### 전체 새 creative 라운드
> `새 디자인 라운드 시작해줘.`

시스템이 Creative Freedom Zone과 과업 성격을 보고 single/dual routing 결정.

#### Dual 확정
> `듀얼 디렉터 진행해줘.`

#### A only
> `레퍼런스 디렉터만 진행해줘.`

#### B only
> `Superdesign 독립 탐색 진행해줘.`

#### Concretizer
> `이 후보를 Superdesign 시안으로 만들어줘.`

---

## 14. Work 시작용 권장 프롬프트

웹 Work에서 같은 프로젝트를 연 뒤 GitHub 연결을 확인하고 다음 정도로 시작하면 된다.

> `@GitHub userpawbaw/ecg-gui-design-review`의 UI/UX orchestration을 이어서 작업한다.
>
> 먼저 최신 main, `AGENTS.md`, `docs/uiux_system/00_UIUX_MASTER.md`, `10_RECORD_KEEPING.md`, 최신 F/D/R, `cases/`, 그리고 **`docs/uiux_system/handoffs/DUAL_CREATIVE_DIRECTOR_IMPLEMENTATION_2026-09-18.md`**를 읽어라.
>
> 이 handoff는 현재 Chat에서 직접 정리한 primary context checkpoint다.
>
> **첫 단계는 Dual Director 구현이 아니라 기록 시스템 보강이다.**
>
> CASE-004 + transcript excerpts + CASE-001 transcript 보강 + 후속 F/D/R + CASE linkage 규칙/checker 개선을 먼저 수행하고 records check/CI까지 검증하라.
>
> 사용자가 나중에 다시 읽는 문서이므로 단순 요약하지 말고 `사용자 문제 제기 → AI 초기 framing → 사용자 반론 → 판단 변화 → 시스템` 흐름과 pivotal dialogue를 충분히 보존하라.
>
> 기록 단계가 PASS하기 전에는 `16_DUAL_CREATIVE_DIRECTOR.md` 등 실행 시스템 구현으로 넘어가지 마라.
>
> 기록 단계 완료 후 변경 파일/PR/check 결과/미해결 사항을 보고하고 다음 단계 진행 여부를 확인하라.

---

## 15. Work 실행 시 주의

- 이 handoff 작성 이후 main에 다른 변경이 들어왔을 수 있으므로 시작 전에 최신 SHA를 다시 확인한다.
- CASE-003은 이미 Superdesign Generator Layer 사례다. Dual Director CASE로 재사용/덮어쓰기 금지.
- 기존 D-009/R-008을 "틀렸으니 수정"하는 방식으로 지우지 않는다. **당시 판단이 왜 나왔고 무엇이 새 반론으로 바뀌었는지 후속 기록으로 연결**한다.
- current Chat 전체를 Work가 자동으로 안다고 가정하지 않는다.
- GitHub 문서가 정확한 source of truth, Chat memory는 index다.
- first Work checkpoint는 "기록 시스템 보강 완료"로 끊는다.
- 그 다음에만 Dual Director 실행 시스템 구현을 별도 checkpoint로 진행한다.
