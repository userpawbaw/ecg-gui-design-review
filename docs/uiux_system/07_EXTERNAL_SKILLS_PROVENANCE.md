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

외부 Skill은 필요 시 별도로 설치하고 이 registry의 기준 SHA를 업데이트한다.

## 4. Skill 도입 절차

1. 프로젝트 capability inventory
2. gap 식별
3. 후보 검색
4. 기존 기능과 중복도 평가
5. SKILL.md뿐 아니라 scripts/commands/network/permissions 검토
6. INSTALL / OPTIONAL / REDUNDANT / REJECT 분류
7. 처음에는 project-local
8. 여러 프로젝트에서 반복 가치가 입증될 때만 global 승격

## 5. 업데이트 정책

외부 Skill 업데이트 시:
- upstream SHA 기록
- major instruction 차이 확인
- 프로젝트 local rules와 충돌 여부 확인
- 자동으로 최신판을 따라가지 않음

외부 문서·Skill은 근거 자료이지 최상위 프로젝트 명세가 아니다.
