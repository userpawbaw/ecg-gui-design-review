# Work 동시 작업·재개 정책 수정 — repository-wide lock 폐기

2026-09-16 (KST) · 사용자 결정 기록

## 1. 변경 이유

2026-09-15에 `WORK_STATE.json.execution_lock`을 이용한 GitHub 공유 on/off 잠금이 도입되었다. 당시 사용자는 여러 기기·세션에서 실행 중인 작업을 일일이 확인해야 하는 문제로 이해하고, 작업 시작 시 on, 종료 시 off를 커밋하는 방식을 제안했다.

후속 검토 결과 이 잠금은 실제로 관찰된 다중 세션 데이터 손실 사건을 해결하기 위해 도입된 것이 아니라, 위 사용자 요청을 예방적 규칙으로 엄격하게 구현한 것이었다. 사용량 제한·강제 중단 시 off 커밋을 남기지 못하면 stale lock이 남고, 실제로 충돌하지 않는 문서·UI 설계·별도 branch 작업까지 차단하는 부작용이 확인되었다.

사용자는 2026-09-16에 이 전역 차단 방식이 과도하다고 판단하여 폐기를 승인했다.

## 2. 폐기되는 것

다음은 더 이상 시작 게이트가 아니다.

- `WORK_STATE.json.execution_lock.active`
- owner_id / generation 기반 repository-wide mutex
- 모든 수정·빌드·테스트 전에 on 커밋을 요구하는 절차
- 세션이 중단된 뒤 lock 생존 여부를 증명하지 못하면 저장소 전체를 수정 금지하는 절차
- 다른 작업 하나가 진행 중이라는 이유만으로 관계없는 문서·코드·설계 작업을 막는 규칙

과거 commit/log의 lock 기록은 이력으로 보존하지만 현재 운영 규칙으로 사용하지 않는다.

## 3. 유지되는 것

`WORK_STATE.json`, `PLAN.md`, `WORKLOG.md`의 본래 목적은 유지한다.

- 마지막 검증된 checkpoint
- 완료 / 미완료 / blocked / awaiting_user 구분
- 실제 산출물과 검증 범위
- 중단 지점과 다음 action
- 이미 끝난 대규모 실험·빌드의 불필요한 반복 방지
- 사용자가 승인하지 않은 후속 작업의 자동 실행 금지

즉 Work State는 **상태·재개 정보**이며 저장소 전체의 배타적 소유권 표시가 아니다.

## 4. 새 동시 작업 원칙

동시 작업 가능 여부는 세션 존재 여부가 아니라 **실제 충돌 자원**으로 판단한다.

일반 문서/코드/UI 설계 작업:

1. 시작 시 원격 branch/SHA와 관련 파일을 갱신해 읽는다.
2. 가능하면 독립 branch를 사용한다.
3. commit/push 전 원격 변경을 다시 확인한다.
4. 같은 파일 또는 의미적으로 같은 기능이 동시에 바뀌었으면 diff를 비교해 merge/rebase/수동 통합한다.
5. force push로 다른 변경을 덮어쓰지 않는다.
6. 로컬 미커밋 사용자 변경을 임의로 삭제하지 않는다.

Git의 branch/commit/history를 기본 충돌 제어 수단으로 사용한다.

## 5. Resource-scoped 중복 방지

다음처럼 실제 외부 자원이나 장시간 작업이 겹치는 경우에만 task/resource 수준의 상태 표시를 사용할 수 있다.

- 같은 600초 데이터/모델 출력을 동시에 재생성
- 같은 Release asset/tag를 동시에 생성·업로드
- 같은 배포 환경을 동시에 교체
- 같은 실제 장치/AFE를 독점 사용
- 동일 output path를 파괴적으로 갱신하는 장시간 job

이 경우 `WORK_STATE.json.active_jobs` 같은 advisory 상태를 둘 수 있지만:

- 해당 resource와 동일한 작업만 중복 실행을 피한다.
- 관계없는 docs/UI/code 작업은 차단하지 않는다.
- stale 상태 하나가 repository-wide block이 되지 않는다.
- 가능하면 job ID, output path, branch, 시작 시각, 최근 실제 progress evidence를 기록한다.

## 6. 중단된 Work 재개

Work/Chat/Codex/Claude Code가 재개될 때는 이전 세션의 기억을 최신 상태로 가정하지 않는다.

1. 원격 main 및 자신의 작업 branch 최신 SHA 확인
2. `AGENTS.md`, `WORK_RESUME_POLICY.md`, `WORK_STATE.json`, 관련 계획/문서 읽기
3. 중단 전 base SHA와 최신 원격 변경 비교
4. 자신의 미커밋/미푸시 변경이 있으면 먼저 보존
5. 새 commit·설계 문서가 자신의 작업에 관련되면 읽고 반영
6. 마지막 검증 checkpoint부터 필요한 부분만 재개

새로운 다른 작업이 이미 존재한다는 사실만으로 재개를 중단하지 않는다. 실제 같은 파일·같은 output·같은 외부 resource와 충돌하는 경우에만 조정한다.

## 7. 예약 작업

6시간 예약 점검도 repository-wide lock을 만들거나 해제하지 않는다.

예약 실행은:

- 최신 상태와 원격 commit을 읽고,
- 이미 완료된 작업은 반복하지 않고,
- 같은 resource를 실제로 사용 중인 job이 있으면 그 작업만 건너뛰며,
- 관계없는 승인 작업은 계속할 수 있다.

이 문서와 `WORK_RESUME_POLICY.md` v1.2가 과거 shared-lock 규칙보다 우선한다.
