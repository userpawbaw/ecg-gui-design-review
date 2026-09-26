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
- `14_SUPERDESIGN_GENERATION_LAYER.md` — NATIVE_DIRECTOR 독립 탐색과 CONCRETIZER 선택안 시안화 계약
- `15_SUPERDESIGN_USAGE_EXAMPLES.md` — Chat/Work/Codex/Claude 환경별 short trigger, Attract/Evidence/Method/Transition 사용 예시
- `16_DUAL_CREATIVE_DIRECTOR.md` — 독립 A/B activation, first-pass isolation, budget, cross-review, Hybrid 규칙
- `17_REFERENCE_SOURCE_REGISTRY.md` — Creative/Curated Web/Concept/Product/UX Evidence/Scientific/Data Story family와 과업별 source router; Alpha/Beta 공통 reference layer
- `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md` — reference의 visual world를 component/state/motion/implementation까지 처음부터 설계하는 Alpha 경로
- `19_BETA_IMAGE_CONCEPT_TRACK.md` — reference-grounded image still을 만들고 component/interaction/motion으로 다시 번역하는 Beta 경로
- `20_ALPHA_BETA_OPERATING_PROTOCOL.md` — Alpha/Beta 공통 packet, 평가 기준, trigger, template, Chat/Work/Codex 실행 계약
- `21_REFERENCE_EFFECT_RECORDS.md` — 레퍼런스의 특징적 효과를 재현하는 데 필요한 정보를 효과 카드 단위로 강제하는 기록 규칙. 기록은 `references/REF-*.md`, 촬영은 `tools/reference-capture/`
- `22_AI_VIDEO_SCROLL_PIPELINE.md` — 고정 경로 스크롤 구간을 AI 영상으로 만드는 시험 경로: 적합성 판정, 브리프(`templates/AI_VIDEO_BRIEF.md`), 입고 QA(`tools/video-qa/`), 스크롤 플레이어(`prototype/spikes/video-scrub`)
- `23_EXTERNAL_COMPONENT_REVIEW.md` — 외부 UI 컴포넌트 후보 목록(접근·라이선스 확인)과 구현 전 C1–C4 검토 단계
- `24_ASSET_RESEARCH_STAGE.md` — 에셋 조달처 전체 탐색(`explore.mjs`)과 계정 조달처 로그인 요청 규칙
- `25_EFFECT_PRODUCTION_PIPELINE.md` — **채택된 연출 제작 파이프라인 계약**(P1·P5·P6): 적용 범위(HIGH·MEDIUM), 작업 순서 S1–S7, 스택 기준, vanilla 엔진 + React 마운트 인터페이스, 임시 성능 예산, 충실도 게이트 G1–G6

프로젝트 local skill:

- `.claude/skills/ecg-ui-design/SKILL.md`
- `.claude/skills/motion-review/SKILL.md`
- `.claude/skills/expo-ui-art-director/SKILL.md`
- `.claude/skills/project-capability-audit/SKILL.md`
- `.claude/skills/reference-mining/SKILL.md`
- `.claude/skills/superdesign-routing/SKILL.md`

`레퍼런스 마이닝 진행해줘`, `Reference mining`, `Attract 레퍼런스 마이닝`은 `13_REFERENCE...`의 전체 절차를 실행하는 짧은 trigger다. Alpha/Beta 모두 `17_REFERENCE_SOURCE_REGISTRY.md`에서 과업에 맞는 2~4 source family를 선택하며 Awwwards/Godly만 기본값으로 고정하지 않는다.

새 trigger: `Alpha안으로 [scene] 설계해줘`, `Beta안으로 [scene] 진행해줘`, `Alpha/Beta 라운드로 [scene] 진행해줘`, `Alpha/Beta 결과 비교해줘`. 정확한 의미는 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`가 source of truth다.

Superdesign 관련 14/15/16번은 DUAL-ATTRACT-001의 이력과 향후 별도 capability 재검증을 위해 보존한다. 2026-09-23 이후 새 creative round의 기본 generator가 아니다.

## Current next-stage plan

- `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` — 레퍼런스 wow 재현 실패 원인 진단(F-010), 에셋 형식/조달처/제작 도구(Unity 판정 포함), three.js+GSAP+Lenis 스택과 `prototype/spikes/scroll-globe` 검증, 제작 파이프라인 계층 채택안(사용자 결정 대기).
- `handoffs/REDESIGN_BASELINE_ANALYSIS_2026-09-25.md` — UI/UX 재설계 착수 전 기준선: canonical 시스템 branch(main) 판정, v2.2.1 구조·보존 계약·화면 관찰(L3 headless), 이전 Attract 탐색의 입력 가치, 사용자 결정 필요 항목.

- `handoffs/DUAL_ATTRACT_CROSS_REVIEW_AND_VNEXT_PLAN_2026-09-20.md` — frozen A/B 결과를 cross-review/validator로 비교하고 v2.2.1을 보존한 채 Attract vNext variant를 구현·검증·선정하는 다음 단계 계획. 새 Source Registry의 실사용 테스트는 다음 creative round로 연기한다.

## Work handoff checkpoint

- `handoffs/DUAL_CREATIVE_DIRECTOR_IMPLEMENTATION_2026-09-18.md` — Single Director → Reference Mining → Superdesign bounded generator → Dual Creative Director로 이어진 최신 판단 전환과, 웹 Work에서 먼저 수행할 기록 보강/후속 구현 순서를 고정한 primary handoff context.

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
- `cases/CASE-003_SUPERDESIGN_GENERATOR_LAYER.md` — validator-heavy 시스템에서 visual generator gap을 발견하고 Superdesign을 bounded generator로 채택한 검증·통합 과정
- `cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md` — Superdesign을 독립 B로 확장한 판단과 첫 실행 계약의 진화
- `cases/CASE-006_REFERENCE_EFFECT_PRODUCTION_PIPELINE.md` — 레퍼런스 wow 재현 실패를 제작 정보·재료 부재로 재정의하고, 녹화·소스 검증과 효과 카드 기록 규칙으로 체계화한 과정
- `cases/CASE-005_ALPHA_BETA_CREATIVE_TRACKS.md` — 첫 creative system 실사용의 fidelity 한계를 바탕으로 Alpha implementation-aware + Beta image-first 구조로 전환한 과정

`CASE`는 다섯 번째 운영 기록 종류가 아니다. 여러 F/D/O/R과 대화를 묶어 **배경 → 문제 제기 → AI 응답 → 반론 → 판단 변화 → 구축 결과 → 재사용 패턴 → 한계**를 설명하는 해설 계층이다.

CASE는 다음 AI의 provenance만을 위한 문서가 아니다. **사용자가 나중에 다시 읽고 당시의 문제 정의와 판단 전환을 복원할 수 있어야 한다.** 그래서 핵심 대화 원문이 있으면 짧게 인용하고, 없으면 `[재구성]` 또는 `기록 없음`을 명시한다.

## 자동 무결성 검사

- `scripts/check-uiux-records.cjs`
- `npm run records:check`
- root `npm test`에도 포함

검사는 현재 F/D/O/R 필수 구조와 근거, CASE 연결, CASE의 대화 provenance/인용 또는 transcript 부록, 사용자·AI 기여 구분, project-local Skill provenance, Master/Index/AGENTS 진입점을 확인한다. 코드 구조에서 "중요한 D가 아예 빠졌다"를 안정적으로 유도할 canonical route/token/component registry는 아직 없으므로, 없는 기록 탐지는 `11_CHECKLISTS.md`의 사람 trigger를 병행한다. 별도 수동 ledger를 하나 더 만들어 그 ledger 자체를 잊는 구조는 만들지 않는다.

## 환경별 사용

프로젝트 로컬 Claude skill은 `.claude/skills/` 아래에 둔다. Claude Code에서는 project-local skill로 직접 활용할 수 있고, Chat/Work/Codex가 같은 skill loader를 제공하지 않는 환경에서도 `00_UIUX_MASTER.md` → `05_TOOL_SKILL_ROUTING.md` → 필요 시 `13/17` → 새 significant CREATIVE는 `18/19/20`의 동일한 프로젝트 계약을 읽어 같은 절차를 수행한다.

즉 short trigger의 의미는 **skill loader 자체가 아니라 GitHub에 고정된 workflow contract**에 있다. 어떤 환경이든 repo 문서를 읽을 수 있으면 `레퍼런스 마이닝 진행`이라는 짧은 요청으로 같은 흐름을 재현한다.

Chat memory는 이 구조의 **인덱스**로만 사용한다. exact 승인 상태, rejected idea, 수치, timing, 결정 이유의 source of truth는 GitHub 문서·코드·commit이다.

## Dual Director 기록 단계

[CASE-004](cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md)와 [발췌 부록](cases/CASE-004_TRANSCRIPT_EXCERPTS.md)은 CASE-001 → CASE-002 → CASE-003의 후속 판단을 기록한다. D-010의 설계 채택은 실행 구현 완료가 아니다. 기록 검사 후 별도 사용자 승인을 받아 다음 단계를 시작한다.

## Alpha / Beta creative 실행 진입점 (2026-09-23)

- `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`: Alpha 전체 계약.
- `19_BETA_IMAGE_CONCEPT_TRACK.md`: Beta image-first 전체 계약.
- `20_ALPHA_BETA_OPERATING_PROTOCOL.md`: 공통 packet, trigger, template, 비교, 환경별 실행.
- Reference source는 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md` + `17_REFERENCE_SOURCE_REGISTRY.md`.

## Dual Creative Director 실행 진입점 — 역사/재검증용 (2026-09-19)

- `docs/uiux_system/16_DUAL_CREATIVE_DIRECTOR.md`: HIGH/MEDIUM/LOW activation, 독립 A/B, 예산, cross-review, 환경별 fallback의 공통 계약(경로는 repository root 기준).
- `docs/uiux_system/14_SUPERDESIGN_GENERATION_LAYER.md`: NATIVE_DIRECTOR / CONCRETIZER 실행.
- `docs/uiux_system/15_SUPERDESIGN_USAGE_EXAMPLES.md`: 짧은 사용자 trigger 예시.
- `.claude/skills/dual-creative-director/SKILL.md`: Claude wrapper; 다른 환경은 16번을 직접 따른다.
