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

`CASE`는 다섯 번째 운영 기록 종류가 아니다. 여러 F/D/O/R과 대화를 묶어 **배경 → 문제 제기 → AI 응답 → 반론 → 판단 변화 → 구축 결과 → 재사용 패턴 → 한계**를 설명하는 해설 계층이다.

## 자동 무결성 검사

- `scripts/check-uiux-records.cjs`
- `npm run records:check`
- root `npm test`에도 포함

검사는 현재 F/D/O/R 필수 구조와 근거, CASE 연결, project-local Skill provenance, Master/Index/AGENTS 진입점을 확인한다. 코드 구조에서 "중요한 D가 아예 빠졌다"를 안정적으로 유도할 canonical route/token/component registry는 아직 없으므로, 없는 기록 탐지는 `11_CHECKLISTS.md`의 사람 trigger를 병행한다. 별도 수동 ledger를 하나 더 만들어 그 ledger 자체를 잊는 구조는 만들지 않는다.

## 환경별 사용

프로젝트 로컬 Claude skill은 `.claude/skills/` 아래에 둔다. Chat/Work/Codex가 해당 skill을 직접 invoke하지 못하는 환경에서도 이 디렉터리의 동일한 프로젝트 계약을 따른다.

Chat memory는 이 구조의 **인덱스**로만 사용한다. exact 승인 상태, rejected idea, 수치, timing, 결정 이유의 source of truth는 GitHub 문서·코드·commit이다.
