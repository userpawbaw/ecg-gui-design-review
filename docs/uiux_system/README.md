# UI/UX System Index

이 디렉터리는 ECG Signal Studio의 후속 UI/UX 개선을 위한 **운영·설계·기록 오케스트레이션 계층**이다. 기존 `docs/12`, `13`, `21`, `22` 등 확정 설계를 대체하지 않고, 어떤 작업에서 무엇을 읽고 어떤 Skill/Plugin을 쓸지, 그리고 **왜 그런 결론이 나왔는지를 어떻게 보존할지** 라우팅한다.

시작점은 항상 [`00_UIUX_MASTER.md`](00_UIUX_MASTER.md)다.

## 설계·도구 계층

- `01_CREATIVE_DIRECTION.md` — Expo art direction, Awwwards식 발상, Creative Freedom Zone
- `02_DATA_STORYTELLING.md` — 데이터 스토리·Flourish 활용·정량 왜곡 방지
- `03_MOTION_AND_POLISH.md` — motion 기준, sweep/glow/fade, project Motion Scorecard
- `04_VALIDATION_AND_GUARDRAILS.md` — KEEP/TUNE/REJECT, data integrity, accessibility
- `05_TOOL_SKILL_ROUTING.md` — 작업 유형별 Plugin/Skill/도구 선택
- `06_CHAT_WORK_CODEX_HANDOFF.md` — Chat 중심 판단과 Work/Codex 실행 분리
- `07_EXTERNAL_SKILLS_PROVENANCE.md` — design-taste/UI UX Pro Max 및 project-local Skill 출처·버전·적용 범위
- `08_DECISION_EXPERIMENT_PROTOCOL.md` — 후보 비교·승인·구현·검증 실험 단위
- `09_CAPABILITY_GAP_AUDIT.md` — 새 Skill/MCP/Plugin 도입 전 gap audit
- `13_REFERENCE_GROUNDED_CREATIVE_MINING.md` — 실제 reference의 특정 장면을 visual-intent proxy로 사용해 `reference → principle → ECG translation → divergence`를 수행하는 workflow

프로젝트 local skill:

- `.claude/skills/ecg-ui-design/SKILL.md`
- `.claude/skills/motion-review/SKILL.md`
- `.claude/skills/expo-ui-art-director/SKILL.md`
- `.claude/skills/project-capability-audit/SKILL.md`
- `.claude/skills/reference-mining/SKILL.md`

`레퍼런스 마이닝 진행해줘`, `Reference mining`, `Attract 레퍼런스 마이닝`은 `13_REFERENCE...`의 전체 절차를 실행하는 짧은 trigger로 사용한다. 중요한 새 CREATIVE 설계는 `05_TOOL_SKILL_ROUTING.md`의 자동/제안 규칙에 따라 이 단계를 포함한다.

## 판단 과정 기록 계층

- `10_RECORD_KEEPING.md` — **F/D/O/R 기록 규약 + CASE 방법론 사례 규칙**
- `11_CHECKLISTS.md` — 작업 직전 trigger별 최소 체크리스트와 자동검사 승급 대장
- `12_RECORD_SYSTEM_LINEAGE.md` — 원본 ECG 연구 기록 시스템의 배경·새 40/41/42 문서 검토·UI/UX 이식 차이

운영 기록:

- `records/F_FINDINGS.md` — 잘못된 디자인 판단을 막은 발견
- `records/D_DECISIONS.md` — 갈림길에서 무엇을 왜 고르고 버렸는가
- `records/O_INCIDENTS.md` — 시간·재현성·협업 품질을 잃게 한 사고와 재발 방지
- `records/R_AI_COLLABORATION.md` — AI/Plugin/Skill을 쓰는 방식 자체의 교훈

방법론/커리어 사례:

- `cases/CASE-001_UIUX_AI_ORCHESTRATION.md` — Creative proposer + Validator + data-story + tool-routing 체계가 만들어진 실제 논의 과정
- `cases/CASE-001_SUMMARY_EN.md` — 위 사례의 커리어용 영문 one-page
- `cases/CASE-002_REFERENCE_GROUNDED_CREATIVE_MINING.md` — text-only creative proposal과 모든 mockup 사이의 비용/의도 공유 문제를 reference mining으로 해결한 논의와 시스템화
- `cases/CASE-002_TRANSCRIPT_EXCERPTS.md` — CASE-002의 판단 전환을 다시 읽기 위한 핵심 사용자/AI 대화 발췌

`CASE`는 다섯 번째 운영 기록 종류가 아니다. 여러 F/D/O/R과 대화를 묶어 **배경 → 문제 제기 → AI 응답 → 반론 → 판단 변화 → 구축 결과 → 재사용 패턴 → 한계**를 설명하는 해설 계층이다.

CASE는 다음 AI의 provenance만을 위한 문서가 아니다. **사용자가 나중에 다시 읽고 당시의 문제 정의와 판단 전환을 복원할 수 있어야 한다.** 그래서 핵심 대화 원문이 있으면 짧게 인용하고, 없으면 `[재구성]` 또는 `기록 없음`을 명시한다.

## 자동 무결성 검사

- `scripts/check-uiux-records.cjs`
- `npm run records:check`
- root `npm test`에도 포함

검사는 현재 F/D/O/R 필수 구조와 근거, CASE 연결, CASE의 대화 provenance/인용 또는 transcript 부록, 사용자·AI 기여 구분, project-local Skill provenance, Master/Index/AGENTS 진입점을 확인한다. 코드 구조에서 "중요한 D가 아예 빠졌다"를 안정적으로 유도할 canonical route/token/component registry는 아직 없으므로, 없는 기록 탐지는 `11_CHECKLISTS.md`의 사람 trigger를 병행한다. 별도 수동 ledger를 하나 더 만들어 그 ledger 자체를 잊는 구조는 만들지 않는다.

## 환경별 사용

프로젝트 로컬 Claude skill은 `.claude/skills/` 아래에 둔다. Claude Code에서는 project-local skill로 직접 활용할 수 있고, Chat/Work/Codex가 같은 skill loader를 제공하지 않는 환경에서도 `00_UIUX_MASTER.md` → `05_TOOL_SKILL_ROUTING.md` → `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`의 동일한 프로젝트 계약을 읽어 같은 절차를 수행한다.

즉 short trigger의 의미는 **skill loader 자체가 아니라 GitHub에 고정된 workflow contract**에 있다. 어떤 환경이든 repo 문서를 읽을 수 있으면 `레퍼런스 마이닝 진행`이라는 짧은 요청으로 같은 흐름을 재현한다.

Chat memory는 이 구조의 **인덱스**로만 사용한다. exact 승인 상태, rejected idea, 수치, timing, 결정 이유의 source of truth는 GitHub 문서·코드·commit이다.
