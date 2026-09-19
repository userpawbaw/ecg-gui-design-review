# Dual orchestration 구현 검증 — 2026-09-19

기준 main: `08ffec369b07c75d52f0728e1ee28869f241efa1`. 기록 단계 head: `703554557896da6dff84967a713d9e4429150b08` (PR #9, 검증 완료/미병합). 후속 branch: `feat/dual-director-runtime-20260919`. 이 PR은 기록 branch 위에 쌓으며 main을 병합하거나 변경하지 않는다.

## 구현 범위

16번 공통 계약, dual wrapper, Superdesign Native/Concretizer wrapper, 00/01/05/06/07/11/13/14/15/AGENTS 및 indices를 연결했다. 기존 reference-mining/art-director의 serial generator 호출이 Dual A first pass에서 실행되지 않게 명시했다. CASE-004/발췌와 D-012, D-010/R-009 후속 안내, PLAN/WORKLOG/WORK_STATE를 갱신했다.

자동 activation은 요청 처리 중 AI routing이다. 실제 scheduler/hook, account-wide skill 설치, 시안 생성 코드나 Superdesign 서비스 자동화 데몬을 만든 것이 아니다. 다른 환경은 native wrapper discovery를 가정하지 않고 16번을 직접 따른다.

## 계약 시나리오 검토

아래는 문서/skill을 읽고 분기를 대조한 tabletop review다. 실제 독립 agent 실행이나 vendor 생성 결과를 의미하지 않는다.

| 입력/상황 | 확인한 계약 | 판정 |
|---|---|---|
| 새 Attract 방향, HIGH | 기본 Dual; 별도 A/B context | PASS |
| Method Explorer 신규, MEDIUM | A 우선; B 추가 가치 제안 | PASS |
| axis/Reference 수치 수정, LOW | 자동 Director 없음, 데이터 검증 | PASS |
| HIGH이지만 선택안 구현 | frozen 구현, 재탐색 없음 | PASS |
| HIGH에서 A-only 명시 | 자동 Dual보다 명시 요청 우선 | PASS |
| B 독립 탐색 명시 | A 선행/shortlist 요구 없음 | PASS |
| 선택 C2 시안화 | Concretizer 1개 가능, Native 아님 | PASS |
| Chat Dual | A + A 출력 없는 B clean handoff, 완료 대기 | PASS |
| shell 있으나 auth/network 실패 | B_BLOCKED, A 진행 가능 | PASS |
| 같은 대화 역할 교체/격리 없음 | 독립 성공 주장 금지, 새 세션 packet | PASS |
| B resume에 A 선호 포함 | Native 재사용 금지, clean baseline | PASS |
| B 후보 전부 hard constraint 위반 | draft 0, 이유 반환; quota 강제 없음 | PASS |
| B prefilter에서 A와 중복 검사 | first pass 금지; B 내부만 비교 | PASS |
| 양쪽 동결 전 cross-review | 대기; 한쪽 blocked를 완료로 처리 금지 | PASS |
| 상보적 부모 후보/Hybrid | H1 최대 한 번/한 draft, 별도 허용 budget | PASS |

## 발견한 충돌과 수정

- 기존 13번/두 A skill의 8~10 권장 및 shortlist→generator 경로를 Dual first pass와 분리했다. Dual A는 5~8 concepts만 동결·반환한다.
- B init/resume까지 A 정보가 새어 들어갈 가능성을 확인해 입력 manifest와 vendor state 격리를 계약에 포함했다.
- 01번의 stored waveform 시간축 압축 예시는 geometry/time 보존과 충돌해 container 전환으로 고쳤다.
- 이전 기록의 승인 대기 표현은 역사로 유지하고 2026-09-19 사용자 승인/구현 후속을 명시했다.

## 자동 검증

- 네 변경 skill: skill-creator quick_validate PASS (dual-creative-director, superdesign-routing, reference-mining, expo-ui-art-director).
- npm run records:check: 30 F/D/O/R 및 CASE/provenance/entrypoint PASS.
- root npm test: core 48 scenes/336 metrics, final data 98 scenes/1078 metrics, DOM 26 groups, records 26 fixtures PASS.
- git diff --check 및 staged diff check: PASS.
- 원격 tree와 로컬 검증 tree 동일성, PR 최신 head의 GitHub Actions records/checker job은 게시 후 확인하고 최종 보고한다.

## 한계와 종료

실제 Superdesign login/search/draft/비용, 별도 agent들의 독립 실행 효과, preview/UI 품질, target PC는 NOT VERIFIED. 이 요청은 실행 계약/skill/routing 구현이며 유료 생성과 UI 변경은 수행하지 않았다. 배포된 모든 Chat 환경이 프로젝트 지침을 자동 로드한다는 보장은 없으므로 06번 explicit handoff를 사용한다.

문서/skill 구현과 오프라인 검증 PASS; 첫 실사용 결과는 별도 라운드에서 실제 provenance와 함께 기록한다. main merge는 수행하지 않는다.

## Chat secondary semantic review — 2026-09-19

Work의 1차 검증 이후 standard Chat에서 PR #10 branch를 다시 읽어 **semantic routing double-check**를 수행했다. 이 단계는 shell/local test 재실행이 아니라 canonical docs·skill·CI wiring의 독립 재검토다.

발견하고 수정한 ambiguity:

1. `05_TOOL_SKILL_ROUTING.md`의 `화면이 밋밋함 / 창의 개선` 행이 significant CREATIVE와 구분되지 않아 16번 Dual routing을 건너뛸 여지가 있었다. 이를 `기존 방향 안의 가벼운 창의 개선 / non-significant polish`로 좁히고 significant direction은 16번 행으로 승격하도록 명시했다.
2. `11_CHECKLISTS.md §1A`가 모든 Superdesign draft에 Reference Mining/Art Director 완료와 2~4 shortlist를 요구해 B_ONLY/NATIVE_DIRECTOR와 충돌할 수 있었다. §1A를 CONCRETIZER 전용으로 좁히고 §1B NATIVE_DIRECTOR preflight를 별도로 추가했다.
3. `00_UIUX_MASTER.md`의 Superdesign 역할 설명이 Native와 Concretizer를 한 문장에 섞어 읽을 여지가 있어 두 모드를 별도 bullet로 분리했다.
4. `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`의 기존 serial pipeline이 Dual A first pass에도 이어질 수 있어, 해당 pipeline은 standalone/A-only용이며 Dual A는 5~8 concepts 동결 후 반환한다고 §4에 다시 명시했다.

재확인:
- `16_DUAL_CREATIVE_DIRECTOR.md`, `AGENTS.md`, `05`, `06`, `14`, `15`, dual/reference/art-director/Superdesign routing skill의 핵심 budget·independence·environment boundary는 위 수정 뒤 같은 방향을 가리킨다.
- GitHub Actions path filter는 `docs/uiux_system/**`, `.claude/skills/**`, `AGENTS.md`, checker/tests를 포함하므로 이번 semantic-doc/skill 변경도 CI trigger 범위다.
- 이 Chat 검토에서는 Work가 이미 수행한 `npm test`, skill quick_validate, local diff/tree 검증을 재실행하지 않았다. 최신 branch head의 GitHub Actions는 변경 후 다시 확인해야 한다.

이 secondary review는 실제 Superdesign vendor 실행·독립 agent diversity·UI 품질을 검증한 것이 아니다.
