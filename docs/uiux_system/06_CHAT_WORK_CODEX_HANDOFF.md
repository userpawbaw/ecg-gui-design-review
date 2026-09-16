# Chat / Work / Codex Handoff

목적: UI/UX 판단의 중심을 유지하면서 실행 환경만 필요에 따라 바꾼다.

## 1. 기본 원칙

**Chat = Design Brain / Orchestrator**  
**GitHub = Durable Memory / Source of Truth**  
**Work/Codex/Claude Code = Execution Environment**

Work/Codex로 넘기는 이유는 기억을 보존하기 위해서가 아니라, 로컬 빌드·브라우저 자동화·MCP·장시간 실행이 필요하기 때문이다. 실행 환경이 바뀌어도 GitHub의 최신 기준 commit과 `00_UIUX_MASTER.md`를 다시 읽어 동일한 설계 계약으로 복귀한다.

## 2. Chat에서 유지할 작업

- 창의적 개선 아이디어 발산
- 프로젝트 전체 맥락 기반 critique
- Flourish/data-story 방향 결정
- Product Design/Figma와의 설계 판단
- KEEP/TUNE/REJECT
- 문서 routing 및 acceptance criteria
- 사용자 피드백 반복

## 3. Work/Codex/Claude로 넘길 신호

- 여러 파일에 걸친 구현
- dev server/build/test 반복
- Playwright headed/soak
- Storybook 도입/컴포넌트 자동 QA
- Motion AI Kit/로컬 MCP 사용
- 대용량 release/package 작업

## 4. Handoff Packet

넘길 때 항상 다음만 묶는다.

1. 기준 commit SHA와 현재 remote main/작업 branch SHA
2. `00_UIUX_MASTER.md`
3. 관련 상세 문서 1~3개
4. change contract
5. acceptance criteria
6. 변경 금지 범위
7. 필요한 검증 명령
8. 결과를 돌아올 위치(브랜치/PR/verification path)

긴 대화 전체를 그대로 넘기는 것을 기본으로 하지 않는다.

## 5. Return Packet

실행 환경은 Chat으로 다음을 돌려준다.

- 변경 파일 목록
- diff 요약
- 실행 명령과 종료 결과
- screenshot/video/evidence 경로
- PASS/CONDITIONAL/FAIL
- 미검증 항목
- 새로운 디자인 판단이 필요한 부분

그 후 Chat에서 다시 creative/UX 판단을 수행한다.

## 6. 병행 작업과 재개 규칙

- Work/Codex/Chat 세션이 동시에 존재한다는 사실만으로 서로를 막지 않는다.
- 같은 파일·semantic contract·generated artifact·Release/deployment·장시간 job·exclusive device를 실제로 공유할 때만 충돌을 조정한다.
- 중단된 실행은 재개 시 최신 remote commit을 먼저 확인하고 자신의 미커밋 변경을 보존한 채 새 기준과 비교한다.
- 다른 branch의 새 UI/UX 설계 문서는 현재 작업에 관련될 때 먼저 읽고, 필요하면 handoff packet의 기준 문서를 갱신한다.
