# CASE-001. UI/UX 개선용 AI 제안기·검토기 시스템은 어떻게 만들어졌나

> **성격.** 이 문서는 최종 UI 설계 명세가 아니라 **AI를 활용해 UI/UX 개선 시스템 자체를 설계한 과정**을 기록한 방법론 사례다. 운영 판단의 canonical source는 `records/F_FINDINGS.md`, `D_DECISIONS.md`, `O_INCIDENTS.md`, `R_AI_COLLABORATION.md`와 기존 확정 설계 문서다.
>
> **왜 남기나.** 최종적으로 "Creative Art Director + Data Storyteller + Validator + GitHub/Chat/Work handoff"라는 구조만 남기면, 왜 그런 역할 분리가 필요했는지와 사용자가 AI의 초기 제안을 어떻게 수정·반박했는지가 사라진다. 이 과정은 차후 AI 사용 패턴 개선과 커리어 포트폴리오에서 더 중요한 증거가 될 수 있다.
>
> **근거 주의.** 현재 Chat 대화에서 직접 옮긴 부분은 `[대화]`로 표시했다. 이 저장소에는 현재 Chat의 machine-export transcript가 없으므로, 연구 repo의 `41_ai_collaboration_transcript.md`처럼 byte-level 대조된 부록은 아직 없다. 이후 원문 export가 생기면 별도 부록으로 추가한다. 당시 생각을 추정해 채운 부분은 `[재구성]`으로 표시해야 하며, 이 문서에는 가능한 한 사용하지 않았다.

---

## 배경

ECG Signal Studio v2.2.1은 기능과 기본 UI가 이미 존재했다. 사용자가 느낀 문제는 "화면이 동작하지 않는다"보다 **완성도는 높아졌지만 여전히 시각적으로 투박하고, Expo에서 관람객이 계속 보고 싶게 만드는 '보는 맛'이 부족하다**는 것이었다. 동시에 waveform은 연구 데이터이므로, 단순한 화려함이 신뢰성과 판독성을 해치면 안 됐다.

초기 탐색은 design-taste, Motion AI Kit, Figma, Product Design, Playwright/Storybook 등으로 시작했다. 이 단계에서 시스템은 주로 두 문제에 초점을 맞췄다.

1. Motion AI Kit 같은 전문 도구를 Chat에서 직접 못 쓰는 문제
2. Chat 안에서 수정 → 실행 → screenshot → 피드백 루프를 얼마나 자동화할 수 있는가

둘 다 중요했지만, 사용자가 곧 **문제 정의 자체가 빗나갔다**고 지적했다. 이 지적이 전체 구조를 바꾸는 첫 전환점이었다. → F-001 / R-001.

---

## 논의 흐름 1 — "편의성"과 "실제 능력 부족"을 분리하다

### 사용자 문제 제기

사용자는 초기 Plugin 추천을 보고 다음과 같이 문제를 다시 정의했다. `[대화]`

> "네가 지금 추천해준 플러그인들은 UI/UX 관련 작업을 도와준다기보단 이전에 요청했던 내용, 즉 1)관련 플러그인인 motion AI kit 대체 2)chat 환경에서의 결과물 디스플레이 및 수정 에 관련해서 도움을 주는 대상들이네."

그리고 실제 병목을 두 가지로 분리했다. `[대화]`

> "지금 정확히 능력의 한계를 느끼고 도움이 필요한 부분은 1) 내 UI 관련해서 좀 더 보는 맛 있게, 그러면서도 UX 측면에서 문제를 일으키지 않을 만한 수정사항들을 제시해주고, 2) 이를 기존 UI/UX skill들과 문서, 플러그인을 기반해서 타당성을 검증해주는 어드바이저야."

핵심은 **실행/수정 환경은 편의성 문제이고, 실제 품질 병목은 창의적인 제안 능력**이라는 구분이었다.

### AI 쪽 판단 변화

이 구분을 바탕으로 역할을 다시 나눴다.

- **Creative UI Art Director** — 처음에는 과감하게 아이디어를 발산한다.
- **Data Storyteller** — 데이터를 어떤 관계와 순서로 보여야 연구 메시지가 빨리 전달되는지 탐색한다.
- **Validator** — design-taste, Product Design, project docs, motion/data/accessibility 규칙으로 `KEEP / TUNE / REJECT`한다.
- **Implementation/QA** — 확정안만 코드/Figma/Playwright로 옮긴다.

여기서 중요한 선택은 **한 역할에게 "창의적이면서 동시에 절대 위험하지 않게"를 요구하지 않는 것**이었다. 발산과 검증을 분리해야 창의성을 초기에 죽이지 않으면서도 최종 UX를 통제할 수 있다고 정리했다. → D-001.

### 시스템으로 굳어진 것

- `01_CREATIVE_DIRECTION.md`
- `04_VALIDATION_AND_GUARDRAILS.md`
- `.claude/skills/expo-ui-art-director/SKILL.md`
- `05_TOOL_SKILL_ROUTING.md`

---

## 논의 흐름 2 — MotionDesign을 왜 다시 보게 되었나

### 초기 AI 평가

MotionDesign의 설명이 "High-motion Awwwards UI"였고, 처음에는 ECG waveform의 정확성·피로·잔상·signal ambiguity를 기준으로 우선순위를 낮게 봤다. 이 판단 자체는 core waveform에는 합리적이었지만 **제품 전체를 core waveform과 같은 기준으로 본 것**이 문제였다. → R-002.

### 사용자 반론

사용자는 직접 Awwwards collection을 보고 난 뒤 Expo 맥락을 들었다. `[대화]`

> "결국 우리가 시연하는 방식은 expo 방식이니, 1) 관람객들에게 인상적인 첫인상을 줄 수 있어야 하고, 2) 짧은 시간 내에 우리의 결과가 어떤 의미가 있는지를 흥미롭게 보여줄 수 있어야 해. 어느정도 브랜딩과 겹친다고 생각하지 않아?"

그리고 적용 가능한 구역을 구체적으로 제시했다. `[대화]`

> "일단 시연 첫 화면, 또는 attract 화면에 대해서는 awwwards 디자인 방식처럼 특이하지만 기발한 방식으로 디자인해서 관람객이 흥미를 갖도록 할 수 있으면 더 좋겠지?"

> "기존 데이터에서 아두이노 실측으로 넘어가는 탭 전환은 창의성을 발휘해서 화려하거나 기발하게 전환시켜줘도 전혀 문제가 없을 거야."

이 반론의 값은 "high-motion을 쓰자"가 아니라 **화려함을 허용할 구역과 허용하지 않을 구역을 분리하자**는 데 있었다.

### 판단 변화

전체 화면을 세 구역으로 나눴다.

| Zone | 예 | 표현 자유도 |
|---|---|---:|
| HIGH | Attract/Intro, idle, Replay↔Live context switch, narrative reveal | 높음 |
| MEDIUM | 결과 요약, method 설명, navigation, metric reveal | 중간 |
| LOW | ECG waveform inspection, axes, units, Reference/Difference, 정량 비교 | 낮음 |

이것이 `Creative Freedom Zone`이 됐다. → F-002 / D-002.

### 재사용 가능한 통찰

**도구의 스타일을 제품 전체에 대해 찬반으로 판정하지 않는다.** 동일한 제품 안에서도 error cost와 task가 다른 surface를 분리한 뒤 적합성을 평가한다.

---

## 논의 흐름 3 — Flourish가 보조 도구에서 핵심 DATA layer로 이동하다

### 초기 AI 평가

처음에는 Flourish를 "ECG 데이터 visualization 아이디어를 참고하거나 발표용 차트를 만드는 도구" 정도로 평가했다.

### 사용자 반론

사용자는 이 평가가 프로젝트의 중심을 놓친다고 지적했다. `[대화]`

> "바로 그게 중요한 것 같은데. 결국 지금 우리 프로젝트에서 가장 의미있고 강조해야 할 건 데이터잖아?"

그리고 단순 표/3단 파형을 당연한 정답으로 보지 말고, 결과 데이터의 관계를 한 페이지에 연결하거나 연구 스토리를 더 빨리 이해시키는 시각화를 탐색하자고 제안했다. `[대화]`

> "특히 지금 UI 설계하면서 관람객이 연구 스토리를 짧은 시간내에 이해시키는 것도 꽤 중요할 텐데, 데이터 스토리텔링도 도와준다고 했으니 더 의미있는 플러그인 아닐까?"

### 판단 변화

Flourish는 최종 UI generator가 아니라 **Data Storytelling Exploration Engine**으로 재분류됐다.

- 먼저 한 문장 insight를 정한다.
- rank / trade-off / before-after / small multiples / connected view 등 후보를 탐색한다.
- animation/3D는 중요성을 강조할 수 있지만 값 자체를 왜곡해서는 안 된다.
- 최종 표현은 React/Canvas/Figma에서 프로젝트 계약에 맞춰 재구성할 수 있다.

→ F-003 / D-003.

### 시스템으로 굳어진 것

- `02_DATA_STORYTELLING.md`
- `04_VALIDATION_AND_GUARDRAILS.md`
- Flourish Plugin은 DATA 작업에서 필요 시 호출

---

## 논의 흐름 4 — Plugin을 많이 붙이는 것보다 "누가 언제 판단하는가"를 설계하다

Plugin 탐색 과정에서 Product Design, Figma, Creative Production, Flourish, Context7, TinyFish, Vercel 등이 후보/설치 상태로 모였다. 이 시점의 위험은 **도구 목록이 곧 workflow가 되는 것**이었다.

그래서 task를 `CREATIVE / DATA / MOTION / UX / IMPLEMENTATION / RESEARCH`로 분류하고 `05_TOOL_SKILL_ROUTING.md`가 필요한 도구만 선택하도록 했다. → D-005.

대표 라우팅:

```text
CREATIVE → expo-ui-art-director + Creative Production + Product Design
DATA     → Data Storytelling Guide + Flourish + Validator
MOTION   → motion-review + design-taste refs + Context7 + Playwright
UX       → Product Design + project docs + accessibility rules
IMPLEMENTATION → GitHub/Figma + 필요 시 Work/Codex
```

여기서 Plugin은 "많이 연결할수록 좋은 것"이 아니라 **특정 capability gap을 메우는 선택적 도구**가 됐다.

---

## 논의 흐름 5 — Chat / GitHub / Work·Codex의 역할을 분리하다

사용자는 이 전체 시스템을 Chat에서 계속 기억하고 쓸 수 있는지 물었다. 논의 결과, Chat memory만으로 정확한 설계 수치와 승인 상태를 장기간 보존하는 것은 위험하다고 판단했다.

### 채택한 구조

```text
Chat       = Design Brain / Orchestrator
GitHub     = Durable Memory / Source of Truth
Work/Codex = Build / browser / local tool / long-running execution
```

Chat은 창의 발산·비판·대안 비교·사용자 피드백을 유지하고, GitHub의 `00_UIUX_MASTER.md`를 항상 진입점으로 읽는다. Work/Codex는 기억을 대신하는 장소가 아니라 **실행 capability가 필요한 순간**에 handoff한다. → D-004.

이 결정은 다음 파일로 굳었다.

- `00_UIUX_MASTER.md`
- `05_TOOL_SKILL_ROUTING.md`
- `06_CHAT_WORK_CODEX_HANDOFF.md`
- `07_EXTERNAL_SKILLS_PROVENANCE.md`
- project-local Claude skills 4개

UI/UX orchestration v1은 PR #1, merge commit `c499516e56774bad3554c5434ce5fe1a0d61717f`로 main에 반영됐다. `[커밋]`

---

## 논의 흐름 6 — 잘못 이해한 동시 작업 문제를 시스템에서 되돌리다

별도 Work 재개 시스템에서 한때 repository-wide `execution_lock`을 두었다. 이 정책은 실제 data-loss 사고보다 사용자가 당시 세션/기기 동시 실행 문제라고 이해한 가설을 바탕으로 만들어졌다.

사용량 제한으로 Work가 종료되면서 lock이 풀리지 않았고, 실제로 아무 작업도 돌지 않는데 UI/UX 문서 반영까지 막히는 부작용이 생겼다. 사용자가 원인을 다시 질문했고, 도입 이력을 확인한 뒤 global lock을 폐기했다. → O-001 / R-004.

### 여기서 얻은 AI 사용 교훈

사용자가 원인 가설을 제시해도 **운영 정책으로 일반화하기 전에 실제 failure mode를 확인**해야 한다. AI는 사용자의 의도를 존중하되, 넓은 제약을 만드는 설계에서는 원인 가설 자체를 검증해야 한다.

---

## 논의 흐름 7 — "결론"이 아니라 이 시스템이 만들어진 과정까지 보존하다

UI/UX orchestration v1을 만들고 나서 사용자는 다시 한 단계 위를 요구했다. `[대화]`

> "나는 어떤 결과가 나오면 그걸로 끝나는 게 아니라 그 결정이 나오게 된 논의 과정도 굉장히 중요하게 생각하거든?"

그리고 원본 ECG denoising 연구 repo에서 이미 발전시킨 F/D/O/R 기록 규약과, 그 기록 시스템 **자체가 어떻게 만들어졌는지**를 정리한 `docs/40~42`를 가져왔다.

원본 사례에서 특히 이식한 원칙:

1. 기각한 후보와 틀린 예측을 삭제하지 않는다.
2. 결정은 실험/구현 전에 적는다.
3. 근거가 없으면 `기록 없음`; 사후 복원은 `[재구성]`이라고 밝힌다.
4. 규약만 만들지 않고 자동 검사로 준수 여부를 본다.
5. 운영 기록(F/D/O/R)과 **방법론 사례(CASE)**를 분리한다.
6. 상세 CASE / 원문 부록 / 영문 one-page는 목적이 다르다.

→ D-006 / R-005.

---

## 구축된 시스템

현재 구조:

```text
AGENTS.md
  ↓
00_UIUX_MASTER.md
  ↓
01~09  Creative / Data / Motion / Validation / Routing / Handoff / Provenance
  ↓
10_RECORD_KEEPING.md
11_CHECKLISTS.md
  ↓
records/
  F_FINDINGS.md
  D_DECISIONS.md
  O_INCIDENTS.md
  R_AI_COLLABORATION.md
  ↓
cases/
  CASE-001_UIUX_AI_ORCHESTRATION.md
  CASE-001_SUMMARY_EN.md
  ↓
scripts/check-uiux-records.cjs
```

**중요:** CASE는 F/D/O/R을 대체하지 않는다. 운영 중에는 F/D/O/R을 짧고 지속 가능하게 유지하고, 커리어/이식 가치가 생긴 시스템은 나중에 CASE로 묶는다.

---

## 사용자와 AI의 역할을 분리하면 무엇이 보이나

### 사용자가 기여한 것

- **문제 재정의**: 실행 편의성과 실제 creative capability gap을 분리했다.
- **초기 AI 판단에 반론**: MotionDesign을 waveform 기준만으로 평가한 것을 Expo journey 관점으로 확장했다.
- **프로젝트 중심 재설정**: Flourish를 데이터 storytelling 관점에서 다시 보게 했다.
- **부작용 예측**: global lock의 실제 필요성을 재검토하고 과도한 제약을 제거했다.
- **meta-level 요구**: 결과뿐 아니라 논의 과정과 AI 사용 방식을 기록 시스템에 포함하도록 했다.

### AI가 기여한 것

- 반론을 받아 역할과 layer를 **구조로 변환**했다.
- Creative Freedom Zone, task router, Chat/GitHub/Work 역할 분리 같은 운영 abstraction을 만들었다.
- Plugin/Skill 후보를 capability별로 분류하고 source of truth와 검증 순서를 명문화했다.
- 이전 연구 repo의 기록 시스템을 UI/UX에 맞게 F/D/O/R + CASE + 자동 검사 구조로 이식했다.

이 분리는 "AI가 디자인했다"는 서술보다 실제 협업 방식에 가깝다.

---

## 재사용 가능한 AI 사용 패턴

1. **환경 불편과 reasoning capability gap을 분리해서 질문한다.**
2. AI의 첫 추천이 문제 정의와 맞는지 먼저 되묻는다.
3. **보수적 검증기와 창의적 제안기를 역할로 분리**한다.
4. AI가 도구를 낮게 평가하면 **어떤 surface/task를 기준으로 평가했는지** 확인한다.
5. 연구 UI에서는 "차트"가 아니라 **data story를 어떤 관계로 표현할지** 묻는다.
6. Plugin을 많이 연결하는 대신 task→capability→tool routing을 만든다.
7. Chat memory에 설계 계약을 맡기지 않고 GitHub에 durable source를 둔다.
8. 운영 규칙이 넓은 제약을 만들 때는 사용자의 원인 가설도 검증한다.
9. 최종 결정과 별도로 **판단 변화의 역사를 보존**한다.
10. 커리어 사례에서는 사용자와 AI의 기여를 분리하고 한계를 함께 쓴다.

---

## 한계

- 이 CASE는 아직 실제 Creative redesign을 끝낸 사례가 아니다. **설계/오케스트레이션 시스템을 구축한 사례**다.
- Creative Production, Flourish, Product Design 등이 실제 ECG 화면 품질을 얼마나 높이는지는 이후 prototype 비교가 필요하다.
- MotionDesign Plugin 자체의 세부 capability는 충분히 검증되지 않았고, 현재 시스템은 "Awwwards식 art direction"이라는 capability를 먼저 정의한 상태다.
- 현재 Chat 대화의 machine-readable transcript 부록이 없어 인용을 자동 대조하지 못했다. 원문 export가 생기면 보강해야 한다.
- 이 시스템을 쓴 UI iteration이 충분히 쌓이기 전에는 "기록 체계가 품질을 높였다"고 인과적으로 주장할 수 없다.

따라서 이 사례가 현재 증명하는 것은 **UI 품질 향상 자체가 아니라, 사용자가 AI의 제안을 비판적으로 재정의하고 그 피드백을 재사용 가능한 협업 시스템으로 구조화한 과정**이다.
