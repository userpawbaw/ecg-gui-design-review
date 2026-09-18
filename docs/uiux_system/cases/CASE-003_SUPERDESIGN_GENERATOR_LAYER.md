# CASE-003 — Superdesign을 Generator Layer로 도입한 과정

상태: **방법론 사례 / human reread artifact**  
관련 운영 기록: F-006, D-009, R-008  
시점: 2026-09-18

이 문서는 Superdesign 사용법만 설명하지 않는다. **왜 기존 UI/UX 시스템에 새 생성기 레이어가 필요하다고 판단했고, 다른 AI의 도입 제안을 어떻게 다시 검증해 bounded role로 채택했는지**를 기록한다.

## 배경

UI/UX 시스템은 Reference Mining, Creative Art Director, Product Design, design-taste, motion-review, Flourish, Figma, Context7, TinyFish 등으로 확장되면서 아이디어 발산·검증·데이터 스토리·런타임 확인은 강해졌다. 그러나 실제 작업 흐름을 다시 보면 한 구간이 상대적으로 비어 있었다.

```text
Reference / concept
        ↓
     아이디어
        ↓
 ??? 같은 baseline의 실제 시안 2~4개 ???
        ↓
     Validator
```

텍스트 아이디어를 이해하기 위해 Reference Mining을 만들었지만, 상위 후보를 **현재 2.2.1 화면을 유지한 채 실제 visual draft 여러 안으로 빠르게 비교**하려면 여전히 Figma/React light prototype을 수작업으로 만들어야 했다. 이 문제를 F-006으로 기록했다. `[대화]` `[추론]`

## 논의 흐름

### 1. 사용자가 generator capability gap을 다시 문제로 정의했다

기존 도구 조합을 검토하던 중 사용자는 다음과 같이 문제를 제기했다. `[대화]`

> "우리 시스템에 검증기용 플러그인이나 스킬은 많은데 생성기용은 부족한 느낌이 들어서"

그리고 외부 AI가 조사한 Superdesign 분석을 가져온 뒤, 단순 채택이 아니라 현재 시스템을 가장 오래 함께 설계한 세션에서 다시 검증해달라고 요청했다. `[대화]`

> "현 시스템 설계자 입장에서 도입 타당성에 대해 최종 검증해보자."

핵심은 "Superdesign이 좋은가?"가 아니라 **이미 존재하는 proposer / reference / validator / implementation map에서 실제 빈칸을 채우는가**였다.

### 2. 가져온 분석안의 주요 주장

사용자가 가져온 분석은 Superdesign을 다음 흐름의 도구로 설명했다. `[대화]`

- 기존 codebase를 먼저 읽음
- design-system과 실제 style reference를 사용
- baseline replica를 만든 뒤 여러 방향을 branch
- 선택한 방향을 반복 refine
- Creative Production, Flourish, Product Design, design-taste와 역할을 나눌 수 있음

또한 legacy IDE extension과 현재 maintained skill/web app을 구분하고, Superdesign을 "현재 UI를 이해하면서 여러 창의적인 대안을 실제 화면으로 병렬 제시하는 역할"로 보자는 제안이 포함돼 있었다.

### 3. 외부 설명을 그대로 채택하지 않고 upstream을 다시 확인했다

최종 검증에서는 `superdesigndev/superdesign-skill`의 실제 maintained 문서와 manifest를 다시 읽었다. `[문헌]`

확인된 내용:

- real codebase가 있으면 init/context 분석을 먼저 수행
- existing UI/design system을 기반으로 디자인 가능
- 같은 baseline에서 branch variant 생성 가능
- 선택된 방향은 replace/refine으로 이어갈 수 있음
- canvas/preview URL로 사람이 실제 draft를 비교 가능
- standard Chat은 shell이 없어 직접 실행 대상이 아니며 shell 가능한 Work/Codex/Claude Code 또는 web app 경로가 필요
- legacy `superdesigndev/superdesign` IDE extension은 historical 경로이고 maintained 경로는 `superdesign.dev` + `superdesign-skill`

검토 기준 upstream은 `f9f05cd988c247dce6c072eaf9ac6b162f2ffc4b`이고, 최종 재확인 시 `.codex-plugin/plugin.json` manifest는 **v0.6.0**이었다. 이전 초안에 적힌 0.4.3은 이 검증에서 수정했다. `[문헌]` `[커밋]`

### 4. "Superdesign이 할 수 있는 모든 것"이 아니라 한 자리만 배정했다

Superdesign은 reference 검색, design system, UI generation, graphics 등 넓은 기능을 갖고 있지만, 프로젝트에서는 전부 맡기지 않기로 했다. `[추론]`

기존 시스템과 대조하면:

- Reference Mining — 실제 사례에서 experience principle 추출
- Creative Art Director — 프로젝트 맥락에 맞는 아이디어 발산
- Flourish — 데이터 관계와 visualization grammar 탐색
- **Superdesign — 상위 아이디어를 concrete visual draft로 branch**
- Product Design / design-taste / motion-review — 검증
- Figma — 필요할 때 selected direction 편집/freeze
- Codex/Work/Claude — production implementation
- Playwright/TinyFish — runtime QA

따라서 D-009에서는 Superdesign을 **조건부 핵심 Visual Draft Generator**로만 채택했다.

### 5. 왜 pipeline 전체를 Superdesign 중심으로 바꾸지 않았는가

Superdesign이 넓은 기능을 제공한다는 이유로 기존 시스템 전체를 대체하면 generator가 reference 선택, 생성, 자기 결과 평가까지 맡게 된다. 이는 앞서 D-001에서 의도적으로 분리한 **Creative divergence와 Validator의 독립성**을 다시 약화시킨다.

특히 ECG 프로젝트에는 waveform/time/unit/Reference/Difference와 같은 LOW freedom contract가 있으므로, polished draft가 나왔다는 이유만으로 approval이 되면 안 된다.

그래서 final flow는 다음으로 고정했다.

```text
Reference Mining
→ Art Director divergence
→ hard data-integrity prefilter
→ shortlist 2~4
→ Superdesign branch drafts
→ user visual alignment
→ Product Design / design-taste / motion-review / ECG validator
→ KEEP / TUNE / REJECT
→ Figma(optional) / implementation
→ runtime verification
```

## 핵심 대화 근거

`[대화]`

> "검증기용 플러그인이나 스킬은 많은데 생성기용은 부족한 느낌"

이 문장이 capability gap을 "도구 수 부족"이 아니라 **visual generation layer 부족**으로 좁혔다.

`[대화]`

> "타당하면 우리 시스템에 포함시킨 후, 언제 이를 호출하면 되는지 진입점 세팅과 사용 예시 문서를 생성해줘."

이 요구 때문에 단순 평가 보고서에서 끝내지 않고 Master/Router/AGENTS/Skill/usage example까지 **짧은 trigger로 재현되는 운영 규칙**으로 승격했다.

## 구축된 시스템

### 1. canonical generation contract

- `docs/uiux_system/14_SUPERDESIGN_GENERATION_LAYER.md`
- 역할: Superdesign의 정확한 위치, 자동/제안/생략 조건, context policy, validator boundary, output contract, fallback

### 2. 짧은 사용 예시와 first-use preflight

- `docs/uiux_system/15_SUPERDESIGN_USAGE_EXAMPLES.md`
- `Superdesign 시안 단계까지 진행해줘`
- `C2, C4, C5를 Superdesign으로 같은 baseline에서 비교해줘`
- 환경별 Chat/Work/Codex/Claude Code 동작과 설치·preflight 구분

### 3. project-local routing skill

- `.claude/skills/superdesign-routing/SKILL.md`
- vendor Superdesign skill을 복제하지 않고 ECG-specific routing/guardrail만 담당

### 4. 시스템 진입점

- `00_UIUX_MASTER.md`: Reference/Art Direction 뒤의 optional Visual Draft Generation stage
- `05_TOOL_SKILL_ROUTING.md`: 같은 baseline의 2~4 visual branch가 필요할 때 Superdesign 자동 라우팅
- `AGENTS.md`: trigger 의미, standard Chat의 handoff 경계, raw data/context 제한
- `07_EXTERNAL_SKILLS_PROVENANCE.md`: upstream pin, maintained/legacy 구분, 환경 제한

### 5. 운영 기록

- F-006 — concrete multi-variant generation gap
- D-009 — bounded generator로 채택한 결정과 되돌림 조건
- R-008 — 새 design AI에 하나의 capability role만 부여하는 재사용 규칙

## 재사용 가능한 AI 사용 패턴

### Pattern A — capability map에 한 자리만 배정

새 AI tool이 많은 기능을 지원해도 먼저 기존 pipeline에서 **하나의 primary role**만 정한다.

```text
idea proposer / visual generator / validator / implementation / runtime QA
```

여러 역할을 동시에 맡길 때는 authority와 source of truth를 별도로 적는다.

### Pattern B — cheap divergence, expensive visualization

아이디어 8~10개를 전부 외부 generator에 보내지 않는다.

```text
Reference + text divergence
→ cheap prefilter
→ top 2~4
→ concrete branch generation
```

이 구조는 generation credit과 prototype 시간을 아끼면서도 조기 수렴을 막는다.

### Pattern C — generator는 자기 결과를 승인하지 않는다

보기에 polished한 draft와 실제 제품에 맞는 draft는 다를 수 있다. 생성 후 별도의 user alignment + validator pass를 강제한다.

### Pattern D — existing-codebase first

기존 제품을 개선하는 프로젝트에서는 brand-new generation보다 current codebase/context baseline을 우선한다. baseline fidelity가 낮으면 prompt를 더 세게 쓰기 전에 **context/init 문제부터 점검**한다.

### Pattern E — 외부 도구 버전도 provenance다

Superdesign이 `@latest` CLI 사용을 권장하기 때문에 같은 prompt라도 결과가 달라질 수 있다. 실제 실험에서는 CLI version/model/upstream review pin을 같이 기록한다.

## 사용자가 기여한 것

- validator가 이미 풍부한데 visual generator가 부족하다는 capability gap을 직접 식별했다.
- 다른 AI의 Superdesign 조사 결과를 그대로 실행하지 않고 기존 시스템 설계 맥락에서 재검증하도록 요구했다.
- "타당하면 언제 자동으로 호출할지까지 시스템화"하도록 범위를 확장했다.

## AI가 기여한 것

- upstream skill/manifest를 다시 확인해 legacy/current 경로와 standard Chat/shell 환경 경계를 검증했다.
- 기존 capability map과 대조해 Superdesign의 역할을 전체 design agent가 아니라 **Visual Draft Generator**로 제한했다.
- Reference Mining / Flourish / Product Design / Figma와의 충돌 우선순위를 문서화했다.
- trigger, fallback, context/privacy, provenance, first-use setup까지 운영 계약으로 변환했다.

## 한계

- 아직 ECG Signal Studio 2.2.1 실제 화면에서 Superdesign branch 품질을 L2/L3로 검증하지 않았다.
- baseline fidelity와 branch diversity가 문서상 기능만큼 실제로 좋은지는 첫 1~2회 사용 후 판단해야 한다.
- 현재 ChatGPT Plugin Directory 검색에서는 Superdesign이 직접 노출되지 않았으며, upstream에 ChatGPT/Codex용 manifest가 존재한다는 사실과 이 계정의 standard Chat에서 native 실행 가능하다는 것은 같은 의미가 아니다.
- 외부 service에 전달되는 context는 최소화해야 하며, archive/raw experiment data/credential은 기본 제외한다.
- selected Superdesign draft를 실제 React UI로 옮기는 비용이 생각보다 크면 generator의 자동 trigger 범위를 줄여야 한다.

따라서 채택 상태는 **ADOPT, but evidence pending**이다. 첫 실사용 뒤 D-009/R-008을 갱신하고 필요하면 routing을 축소하거나 확장한다.
