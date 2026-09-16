# ECG Signal Studio — UI/UX 운영 MASTER v1.0

작성 기준: 2026-09-16  
상태: **프로젝트 UI/UX 작업의 진입점 / 상위 라우팅 문서**  
적용 대상: `prototype/v2` (ECG Signal Studio v2.2.1 이후) 및 후속 Expo UI/UX 개선

이 문서는 기존 `docs/12`, `13`, `15`, `21`, `22`를 대체하지 않는다. 기존 문서를 매 작업마다 전부 읽지 않고도 올바른 자료·Skill·Plugin·검증 경로를 선택하기 위한 **오케스트레이션 계층**이다.

## 0. 시작 전 상태·동시 작업 확인

어떤 파일 수정, 빌드, 테스트, 배포, GitHub 쓰기 작업보다 먼저 다음을 따른다.

1. 최신 사용자 요청을 확인한다.
2. `AGENTS.md` → `WORK_RESUME_POLICY.md` → `WORK_STATE.json` → `PLAN.md`의 최신 상태를 확인한다.
3. 2026-09-15에 도입했던 repository-wide `execution_lock`은 폐기되었다. stale lock이나 다른 세션의 존재만으로 관계없는 작업을 막지 않는다.
4. 시작 전 remote main/작업 branch의 최신 SHA와 관련 파일을 확인하고, 같은 파일·semantic contract·generated output·Release/deployment·비싼 job·exclusive AFE/device처럼 **실제 resource가 겹치는 경우에만** 조정한다.
5. 일반 문서/UI/code 작업은 branch/commit/diff로 병행하며 force push로 다른 변경을 덮지 않는다.
6. 중단된 Work/Codex/Chat이 재개될 때는 중단 전 base와 최신 remote를 비교하고, 새 설계 문서나 commit이 현재 과업과 관련되면 먼저 읽고 반영한다.
7. 문서 작업이라는 이유로 런타임 검증을 수행한 것처럼 기록하지 않는다.

상세 정책은 `docs/23_concurrency_and_resume_policy_revision.md`와 `WORK_RESUME_POLICY.md` v1.2를 따른다.

## 1. 프로젝트의 UI/UX 목적

Expo 관람객이 짧은 시간 안에 다음을 이해하도록 한다.

> 같은 ECG라도 잡음의 종류와 세기에 따라 적합한 잡음 제거 방법이 달라지고, 이 프로젝트는 여러 DSP·딥러닝 방법을 동일 조건에서 직접 비교했다.

UI/UX의 우선순위는 다음이다.

1. **데이터·파형 신뢰성** — 파형, 시간축, 단위, Reference, Difference, 지표의 의미를 왜곡하지 않는다.
2. **연구 스토리 전달** — 3초/15초/60초 안에 핵심 메시지를 단계적으로 이해시킨다.
3. **강한 첫인상과 보는 맛** — Expo 맥락에서는 attract, transition, result reveal에 창의적 표현을 적극 허용한다.
4. **조작 명확성** — 한 시연에서 관람객에게 한 가지 핵심 선택을 맡기고, 고급 정보는 단계적으로 공개한다.
5. **완성도와 접근성** — hierarchy, spacing, typography, 상태 표현, focus, reduced-motion, contrast를 보장한다.

## 2. Source of Truth와 우선순위

충돌 시 다음 순서를 적용한다.

1. 최신 사용자 지시
2. `AGENTS.md`, `WORK_RESUME_POLICY.md`, `WORK_STATE.json`, `docs/23_concurrency_and_resume_policy_revision.md`
3. 이 문서 `00_UIUX_MASTER.md`
4. 현재 확정 설계: `docs/12_expo_gui_plan_v2_1_final.md`, `docs/13_expo_gui_plan_v2_2_final.md`
5. 현재 refinement 운영: `docs/21_ui_refinement_workflow_final.md`
6. 최신 polish 결정: `docs/22_ui_polish_review_and_decisions.md`
7. 와이어프레임/팀 안내/검증 기록: `docs/15`, `17`, `18`, `19`
8. 과거 초안·아이디어 문서
9. 외부 Skill/Plugin/레퍼런스

외부 Skill 또는 Plugin이 프로젝트 규칙과 충돌하면 프로젝트 규칙이 우선한다.

## 3. Chat Memory와 GitHub의 역할

- Chat Memory는 **어디를 봐야 하는지 기억하는 인덱스**로 사용한다.
- GitHub 문서는 **정확한 현재 규칙·수치·결정·상태의 canonical source**다.
- 정확한 timing, opacity, layout 수치, 승인 상태, rejected idea를 Chat Memory에만 의존하지 않는다.
- 새 세션/모델/Work/Codex에서는 이 문서를 먼저 읽고 필요한 하위 문서만 점진적으로 읽는다.

## 4. 모든 UI/UX 작업의 기본 라우팅

작업을 다음 중 하나 이상으로 분류한다.

- `CREATIVE`: 화면을 더 인상적이고 독창적으로 만들기 위한 발산
- `DATA`: 데이터 관계·스토리·시각화 구조
- `MOTION`: transition, sweep, glow, fade, reveal, animation
- `UX`: flow, control, hierarchy, progressive disclosure, accessibility
- `IMPLEMENTATION`: React/TypeScript/CSS/Canvas 코드 수정
- `RESEARCH`: 상용 사례, 디자인 규칙, 라이브러리 문서 조사

기본 절차:

1. **BASELINE** — 현재 화면/코드/버전/승인 상태 확인
2. **ROUTE** — `05_TOOL_SKILL_ROUTING.md`로 필요한 문서·Skill·Plugin 선택
3. **DIVERGE** — 디자인 판단 작업이면 3개 이상 대안을 발산. 창의 작업은 검증 전에 과도하게 보수화하지 않는다.
4. **CONVERGE** — 프로젝트 UX·데이터 무결성·motion·접근성 규칙으로 `KEEP / TUNE / REJECT` 판정
5. **CHANGE CONTRACT** — 변경 대상, 변경 금지, 유지 조건, acceptance criteria 명시
6. **IMPLEMENT** — 승인 범위만 구현
7. **VERIFY** — 정적/동적/수치/접근성/대상 PC 중 필요한 수준만 검증
8. **RECORD** — 의미 있는 결정·실험·증거를 기록

## 5. Creative Freedom Zones

| Zone | 대표 영역 | 자유도 | 원칙 |
|---|---|---:|---|
| HIGH | Attract/Intro, idle, 모드 전환, narrative reveal | 높음 | Awwwards식 발상, 대담한 motion/branding 허용. 단 데이터라고 오해될 표현 금지 |
| MEDIUM | 결과 요약, metric reveal, method 설명, navigation | 중간 | 시각적 존재감과 정보 구조를 함께 설계 |
| LOW | ECG 파형 판독, 시간축, 단위, Difference, Reference, 정량 수치 | 낮음 | 정확성·비교 가능성 우선. 장식은 traceability를 돕는 경우만 |

창의성을 전체 화면에 균일하게 뿌리지 않는다. **HIGH zone에서 과감하게, LOW zone에서 절제**한다.

## 6. 핵심 역할 분리

### Creative UI Art Director
- 기존 dashboard 관습을 의심한다.
- attract, transition, reveal, data emphasis의 대담한 후보를 만든다.
- 최종 결정권은 없다.

### Data Storyteller
- 어떤 데이터를 어떤 순서와 관계로 보여야 메시지가 빨리 전달되는지 설계한다.
- Flourish 같은 도구는 아이디어·interactive visualization 탐색에 사용하며 최종 UI를 자동 결정하지 않는다.

### UX/Data Validator
- `design-taste`, Product Design, 프로젝트 문서, `motion-review`, data-integrity 규칙으로 후보를 걸러낸다.

### Implementation Engineer
- 확정안만 구현한다. 기존 React/TypeScript/Vite, Canvas, Radix/CVA 구조를 존중한다.

## 7. 현재 기술 기준선

`prototype/v2`는 React 19 + TypeScript + Vite 7 + Tailwind 4 계열이며 Radix Dialog/Slot, CVA, lucide-react를 사용한다. Playwright는 이미 devDependency와 `qa`, `qa:headed` script로 존재한다.

따라서:
- Playwright를 새로 도입했다고 기록하지 않는다.
- 새 HTML 목업으로 앱을 재작성하지 않는다.
- 시각 편집/프로토타입 도구의 결과는 현재 architecture로 다시 통합한다.
- Storybook은 현재 필수 기반으로 간주하지 않으며 도입 전 capability gap을 검토한다.

## 8. 증거 레벨

UI 관련 결론은 증거 수준을 명시한다.

- `L0 IDEA`: 개념/레퍼런스 제안
- `L1 SOURCE`: 소스·명세 검토
- `L2 STATIC`: 동일 조건 screenshot/render 비교
- `L3 INTERACTIVE`: 실제 브라우저 interaction/Playwright 확인
- `L4 TARGET`: 목표 Windows PC, 실제 배율/폰트/10분 soak/AFE 등 현장 조건

낮은 레벨의 PASS를 높은 레벨 검증으로 확대 해석하지 않는다.

## 9. 작업 종료 조건

완료라고 말하려면:
- 승인 범위와 실제 변경이 일치하고,
- 필요한 acceptance criteria가 검증되었으며,
- 미검증 조건이 명시되고,
- 결정/실험/잔여 후보가 문서화되어야 한다.

관련 운영 상세: `08_DECISION_EXPERIMENT_PROTOCOL.md`.
