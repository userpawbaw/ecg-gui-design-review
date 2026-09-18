# Capability Gap Audit

목적: 새 프로젝트/새 단계에서 Skill·MCP·Plugin을 과도하게 추가하지 않고 필요한 능력만 보강한다.

## 절차

1. 프로젝트 목표·기술 스택·주요 작업 유형 파악
2. 현재 Chat/Work/Codex 기능, project/global skills, plugins, MCP, CLI inventory
3. capability gap만 추출
4. 후보 조사
5. 다음 기준으로 평가
   - 관련성
   - 기존 기능과 중복
   - 고유 가치
   - 유지보수/출처
   - scripts/commands/permissions/network
   - context/tool complexity
   - 반복 사용 빈도
6. `INSTALL / OPTIONAL / REDUNDANT / REJECT`
7. project-local 우선
8. 실제 사용 결과를 기록하고 반복 가치가 확인될 때만 global 승격

## 현재 ECG 프로젝트의 주요 capability map

- Creative art direction → local `expo-ui-art-director` + Creative Production(installed)
- **Concrete multi-variant UI draft generation → Superdesign (conditional external skill/CLI; shell environments) + local `superdesign-routing`**
- UI polish/critique → design-taste + Product Design
- Data storytelling → Flourish(installed) + project data rules
- Design system → Figma
- Motion judgment → local `motion-review` + design-taste motion refs
- Latest library docs → Context7(installed) / official docs
- Browser QA → existing Playwright + TinyFish(installed) / Work
- Persistent source → GitHub

새 도구가 이 표의 기존 capability를 단순 중복한다면 기본적으로 설치하지 않는다.
