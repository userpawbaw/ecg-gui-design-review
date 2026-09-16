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
