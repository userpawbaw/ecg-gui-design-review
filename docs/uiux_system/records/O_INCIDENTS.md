# O — UI/UX Incidents

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"같은 일이 또 나면 다시 시간을 잃는가?"**

---

## O-001. repository-wide execution lock이 stale 상태로 남아 관계없는 작업까지 막았다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` `[커밋]` |
| 잃은 것 | UI/UX 문서 업로드 지연, 세션 간 병렬 작업 차단 |
| 재발 방지 | global mutex 폐기, resource-scoped conflict policy로 교체 |

### 증상
Work 사용량 제한으로 중단된 뒤 `execution_lock.active=true`가 남아 있었고, 실제 실행이 없는데도 Chat에서 UI/UX 시스템 문서를 GitHub에 반영하지 못했다. `[대화]`

### 원인
동시 실행 문제를 **세션/기기 존재 여부**로 모델링하고, 저장소 전체를 하나의 mutex로 잠갔다. 그러나 실제 충돌 위험은 같은 파일·같은 generated output·같은 release/deployment·같은 long-running job 등 **resource 단위**였다. `[추론]`

### 조치
`execution_lock`을 폐기하고 `WORK_STATE`를 상태/체크포인트 기록으로 되돌렸다. `WORK_RESUME_POLICY.md` v1.2와 `docs/23_concurrency_and_resume_policy_revision.md`에서 resource-scoped conflict만 조정하도록 변경했다. `[커밋]`

### 재발 방지와 자동화 상태
- 다른 세션이 있다는 이유만으로 관계없는 docs/UI/code 작업을 막지 않는다.
- 시작/재개 시 remote SHA와 관련 파일을 확인한다.
- 실제 충돌 resource만 `active_jobs` 등 advisory state로 표시할 수 있다.
- force push로 다른 변경을 덮지 않는다.

자동 검사는 아니지만 `AGENTS.md`, `WORK_RESUME_POLICY.md`, `00_UIUX_MASTER.md`의 상위 운영 규칙으로 승급됐다. `[커밋]`

## O-002. 첫 Dual 실사용의 B preflight가 텔레메트리 승인 검토에서 차단됐다

| | |
|---|---|
| 시점 | 2026-09-19 DUAL-ATTRACT-001 [런타임] |
| 잃은 것 | native search/draft와 cross-review 완료 불가 |
| 연결 | R-011, CASE-004 |

### 증상
사용량 제한 중단 후 재개한 B의 bare CLI preflight polling이 자동 승인 검토에서 거부됐다. 현재 session에는 npm warning만 반환됐다.
### 원인
자동 검토는 Superdesign 사용 승인과 별도 PostHog telemetry 전송 승인을 구별했고 payload가 확인되지 않았다고 밝혔다. 실제 전송 내용/과금은 확인하지 못했다. [런타임]
### 조치
같은 요청 우회/재시도 없이 B_BLOCKED로 동결했다. 공식 skill 문서에서 검증된 opt-out을 찾지 못했다. 소유 session 98069 취소는 Unknown process id를 반환했고 visible process도 없었으나 namespace 전체 종료를 증명하지 않는다. A는 독립적으로 계속 수행한다.
### 재발 방지와 자동화 상태
CLI/auth/search/generation 준비 상태를 별개로 기록한다. 허용 범위가 확인되기 전 B를 재실행하지 않는다. 차단 handoff와 로그는 experiments/DUAL-ATTRACT-001/B에 보존했다. 계약 자체의 효과나 Dual 품질을 평가한 결과는 아니다.

### 2026-09-20 후속 — 허용 후에도 auth session 생성 timeout
사용자가 payload 미확인을 포함한 telemetry 전송을 명시적으로 허용해 별도 B clean context에서 재개했다. 이전 차단 기록은 덮어쓰지 않았다. 실제 bare preflight에서 CLI `v0.14.0`, `not authenticated`, `DO_NOT_TRACK=1` 안내를 확인했다. 허용 범위대로 opt-out 없이 필수 login을 실행했지만 auth session 생성이 30초 timeout(exit 3)으로 끝났고 URL/device code가 나오지 않았다. [대화] [런타임]

공식 skill의 login 실패 시 중단 규칙에 따라 search/model/project/generation을 실행하거나 다른 도구로 B 결과를 꾸미지 않았다. B-authorized evidence와 6개 init 문서의 hash를 보존했고 generation은 0회다. 다음 재개 조건은 telemetry 재승인이 아니라 vendor auth session과 브라우저 승인이 완료되는 실행 환경이다. 두 first pass가 완료되지 않아 cross-review도 계속 보류한다. [테스트] [추론]
