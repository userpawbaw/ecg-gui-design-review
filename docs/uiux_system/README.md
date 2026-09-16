# UI/UX System Index

이 디렉터리는 ECG Signal Studio의 후속 UI/UX 개선을 위한 **운영·설계 오케스트레이션 계층**이다. 기존 `docs/12`, `13`, `21`, `22` 등 확정 설계를 대체하지 않고, 어떤 작업에서 무엇을 읽고 어떤 Skill/Plugin을 쓸지 라우팅한다.

시작점은 항상 [`00_UIUX_MASTER.md`](00_UIUX_MASTER.md)다.

- `01_CREATIVE_DIRECTION.md` — Expo art direction, Awwwards식 발상, Creative Freedom Zone
- `02_DATA_STORYTELLING.md` — 데이터 스토리·Flourish 활용·정량 왜곡 방지
- `03_MOTION_AND_POLISH.md` — motion 기준, sweep/glow/fade, project Motion Scorecard
- `04_VALIDATION_AND_GUARDRAILS.md` — KEEP/TUNE/REJECT, data integrity, accessibility
- `05_TOOL_SKILL_ROUTING.md` — 작업 유형별 Plugin/Skill/도구 선택
- `06_CHAT_WORK_CODEX_HANDOFF.md` — Chat 중심 판단과 Work/Codex 실행 분리
- `07_EXTERNAL_SKILLS_PROVENANCE.md` — design-taste/UI UX Pro Max 출처·버전·적용 범위
- `08_DECISION_EXPERIMENT_PROTOCOL.md` — 아이디어/승인/구현/검증 로그 규칙
- `09_CAPABILITY_GAP_AUDIT.md` — 새 Skill/MCP/Plugin 도입 전 gap audit

프로젝트 로컬 Claude skill은 `.claude/skills/` 아래에 둔다. Chat/Work/Codex가 해당 skill을 직접 invoke하지 못하는 환경에서도 이 디렉터리의 동일한 프로젝트 계약을 따른다.
