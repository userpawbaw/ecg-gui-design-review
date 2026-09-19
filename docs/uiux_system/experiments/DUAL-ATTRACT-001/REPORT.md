# DUAL-ATTRACT-001 — 첫 실사용 결과와 재개 지점

상태: **PARTIAL — A_FROZEN / B_BLOCKED / CROSS_REVIEW_NOT_RUN**.
기준 main/UI SHA: `ecb5e7c63279035ee5eac866237731987e3e6c7e`. Target: prototype/v2 Attract, HIGH 신규 방향. Production UI 및 Hybrid 생성 없음.

## 실제 수행

A/B는 fork_turns=none인 별도 agent context와 별도 폴더에서 같은 14개 UI source snapshot과 공통 제약을 받았다. baseline SHA256 manifest는 동일하고 재개 후도 일치한다. method rail이 DOM에는 있지만 Attract CSS에서 숨겨진다는 사실만 공통 packet에서 정정했다. creative 후보는 공유하지 않았다.

사용량 제한 중단 전 산출물은 파일로 남지 않았다. B는 CLI 0.14.0/not authenticated/login 시작을 당시 메시지로 보고했지만 로그는 없다. 재개 시 live 이전 process가 보이지 않았고, 현재 결과로 과거 auth 상태를 단정하지 않았다. 새 clean context에서 A를 완성하고 B를 재개했다.

## A: 동결 완료

[A-report.md](A/A-report.md), [reference-cards.md](A/reference-cards.md), [source-read-log.md](A/source-read-log.md).

| ID | 방향 | 주된 차이 |
|---|---|---|
| A01 | 두 줄의 전시물 | 두 plot의 대응과 큰 행 레이블 |
| A02 | 10초 관측창 | 전체 기록에서 loopRange의 위치 |
| A03 | 읽는 순서가 있는 무대 | 파형을 유지하고 설명만 순차 제시 |
| A04 | 질문 포스터 | 원거리에서 읽는 질문과 비교 영역 |
| A05 | 같은 시각, 내 차례 | 현재 시각을 유지하는 관람→조작 인계 |
| A06 | 회색 기준의 갤러리 | Reference의 의미를 먼저 설명 |

참조 5개 중 Juxtapose는 실제 drag(E3), Pudding은 도입 화면 렌더링(E2)을 확인했다. NASA Eyes/Ciechanowski/Nicky Case는 텍스트(E1) 확인이며 미관찰 모션을 주장하지 않는다. ECG 제안 여섯 개는 모두 L0로 실제 시안/관람객 검증이 아니다. 이 표는 결과 목록이며 winner/shortlist/cross-review 판정이 아니다.

## B: preflight 차단

[B/HANDOFF.md](B/HANDOFF.md), [status.json](B/status.json), sanitized logs와 freeze manifest를 보존한다.

실행 명령은 `npx --yes @superdesign/cli@latest`. 재개 session에는 npm warning만 반환됐고 polling에서 자동 승인 검토가 거부했다. 사유: Superdesign 실행 승인과 별도 PostHog telemetry 전송 승인은 다르며 payload가 확인되지 않아 workspace/environment metadata가 포함될 수 있음. 같은 실행을 우회하지 않았다. 이미 로컬로 읽은 공식 SKILL/SUPERDESIGN 문서에서 검증된 telemetry opt-out을 찾지 못했다. 모든 CLI 구현에 opt-out이 절대 없다고 주장하지는 않는다.

소유 session 98069 취소는 Unknown process id를 반환했다. visible matching process도 없었지만 다른 process namespace 전체의 종료를 독립적으로 증명하지 않는다.

| 실행 증거 | 상태 |
|---|---|
| CLI version | 이전 메시지 0.14.0; 이번 session 미확인 |
| auth | 이전 not authenticated/login 시작; 현재 미확인, 새 login URL 없음 |
| native search/query/slugs | 0 / 없음 |
| cards/prefilter | 미실행; 일반 아이디어로 대체하지 않음 |
| selected model/project/draft IDs | 없음 |
| canvas/preview URL | 없음 |
| baseline replica/new direction 생성 | 0 / 0 |
| 실제 금액 | 청구/credit 사용 내역 미확인; 0원으로 단정하지 않음 |

## 독립성 및 비교 게이트

입력/대화 분리와 출력 비공유는 agent 설정, 동일 manifests와 각 read log 범위에서 확인했다. shared filesystem에 OS 차원의 접근 차단을 설정한 것은 아니므로 절대적 격리 증명은 아니다. A 결과를 B에 전달하지 않았으며 향후 B 재개에서도 전달하면 안 된다.

B_BLOCKED freeze는 차단 증거의 동결이지 first pass 완료가 아니다. 두 completed first passes가 필요하다는 계약에 따라 **cross-review는 실행하지 않았다**. 다양성·품질·비용 대비 이득·A/B 우열을 평가할 자료가 없다.

## 비용·횟수 및 한계

- 완료한 A concepts 6, 사용 reference 5. A는 실제 생성 서비스 시안을 만들지 않았다.
- B native search 0, model selection 0, project creation 0, generation calls 0. 중단 전에도 생성 명령은 보고되지 않았다.
- AI agent/browser 호출 비용은 이 환경에서 금액을 제공하지 않아 미확인. Superdesign 청구 내역도 미확인.
- 전체 허용 생성 상한 2회는 남아 있다. vendor replica 필요 시 1 replica + 1 새 방향으로 구분하며 몰래 추가 생성하지 않는다.
- 실제 ECG rendering, 접근성/performance, target PC, 전시 관람객 3초 이해도 미검증.

## 재개 조건

자동 승인 검토가 차단한 Superdesign CLI의 PostHog telemetry 전송 범위에 대한 사용자 확인 또는 공식적이고 검증된 비전송 경로가 필요하다. payload 자체는 아직 미확인이다. 해결 후 B의 process/auth를 먼저 확인하고 동일 baseline/clean packet만 전달한다. 4~6 native cards → prefilter → 허용 범위 drafts를 동결한 뒤에만 A와 함께 cross-review한다. A freeze 결과는 재생성할 필요가 없다.

O-002/R-011/CASE-004에 이 상태를 연결했다. 실험은 완료로 표시하지 않는다.
