# External Skills & Provenance Registry

목적: 외부 Skill을 "좋아 보이니까 설치"하지 않고, 출처·역할·프로젝트 적합성·버전을 기록한다.

## 1. design-taste

- Source: `arez-xd/ux-ui-design-taste`
- 검토 기준 commit: `a5c03fb6ac2b6b42f8f183d8514e30e9d032062c` (2026-07-27)
- 주요 역할: 기존 design system 우선, visual hierarchy, color/typography/spacing/restraint, consistency, personality
- 관련 reference: component taste, motion taste, motion performance, accessibility review, redesign audit, frontend guardrails, polish review, shadcn implementation, visual dials
- 특징: "기존 시스템을 먼저 읽고 최소 관련 reference만 load"하는 progressive routing이 본 프로젝트 방향과 잘 맞음

프로젝트 적용:
- 범용 polish/validator로 사용
- ECG-specific data/time/signal 규칙보다 우선하지 않음
- `motion-taste`, `motion-performance`, `redesign-audit`, `accessibility-review`를 특히 유용한 reference로 본다.

## 2. UI UX Pro Max

- Source: `nextlevelbuilder/ui-ux-pro-max-skill`
- 검토 기준 commit: `15de38fb70bc80ae9276fa7703b48ae861a672e6` (2026-09-15)
- README 기준: 산업별 추론 규칙, searchable UI styles, palettes, typography, chart recommendations, UX guidelines, 여러 frontend stack 지원
- 최근 upstream은 bundled skill 의존성과 workflow self-containment 문제를 수정한 이력이 있으므로 **version pinning과 update audit이 중요**

프로젝트 적용:
- 의료/헬스케어 generic rule을 그대로 채택하지 않음
- 색/폰트 전면 교체보다 UI pattern, anti-pattern, accessibility, chart 후보 탐색에 사용
- 파형·시간축·Reference·Difference 계약은 프로젝트 문서가 우선

## 3. 프로젝트 로컬 Skill

이 저장소에는 외부 Skill의 원문 전체를 vendoring하지 않고, 프로젝트 계약을 담은 작은 local Skill을 둔다.

- `.claude/skills/ecg-ui-design/SKILL.md`
- `.claude/skills/motion-review/SKILL.md`
- `.claude/skills/expo-ui-art-director/SKILL.md`
- `.claude/skills/project-capability-audit/SKILL.md`
- `.claude/skills/reference-mining/SKILL.md`

### reference-mining

- 작성 기준: 2026-09-18
- Source: 프로젝트 내부 대화와 `docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`
- 목적: Awwwards/Godly 등 실제 reference의 특정 장면을 사용자가 직접 확인할 수 있게 하고, 표면적 스타일이 아니라 experience principle을 ECG 프로젝트로 번역한다.
- 기본 출력: direct URL + viewing instruction + Reference Card + Imitation Distance + ECG translation + 5개 이상 발산 후보
- 자동/제안 trigger: 새 Attract/Transition/Result Reveal 설계, Awwwards/독창성/놀라움 요구, text-only 아이디어의 visual intent가 불분명한 경우
- 우선순위: 최신 사용자 지시와 `00_UIUX_MASTER.md`가 항상 우선한다.

외부 Skill은 필요 시 별도로 설치하고 이 registry의 기준 SHA를 업데이트한다.

## 4. 참고 후보 — creative reference/tool layer

아래는 자동 설치 대상이 아니라 **capability 후보**다. 실제 도입 전 `09_CAPABILITY_GAP_AUDIT.md`를 따른다.

- Mobbin Plugin — production product UI flow/reference. Awwwards식 발산의 반대편 validator/reference 축으로 적합.
- 21st.dev MCP 또는 유사 component catalog — 실제 구현 가능한 creative component/pattern 탐색 후보.
- Anthropic `frontend-design` 계열 — generic AI frontend를 피하고 distinctive direction을 유지하는 implementation-side advisory 후보.
- Awwwards-oriented community skill — 설치보다 먼저 workflow/reference 원리만 검토. 유지보수·권한·중복도를 평가한 뒤 필요 시 project-local로 시험.

Awwwards/Godly/SiteInspire/Land-book/Lapa Ninja/CSS Design Awards 같은 공개 gallery는 Skill/Plugin이 없어도 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`의 reference source로 웹 조사할 수 있다.

## 5. Skill 도입 절차

1. 프로젝트 capability inventory
2. gap 식별
3. 후보 검색
4. 기존 기능과 중복도 평가
5. SKILL.md뿐 아니라 scripts/commands/network/permissions 검토
6. INSTALL / OPTIONAL / REDUNDANT / REJECT 분류
7. 처음에는 project-local
8. 여러 프로젝트에서 반복 가치가 입증될 때만 global 승격

## 6. 업데이트 정책

외부 Skill 업데이트 시:
- upstream SHA 기록
- major instruction 차이 확인
- 프로젝트 local rules와 충돌 여부 확인
- 자동으로 최신판을 따라가지 않음

외부 문서·Skill은 근거 자료이지 최상위 프로젝트 명세가 아니다.
