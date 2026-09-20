# DUAL-ATTRACT-001 — 첫 실사용 결과와 재개 지점

상태: **CROSS_REVIEW_COMPLETE — A_FROZEN / B_FROZEN / USER_VISUAL_ALIGNMENT_PENDING / IMPLEMENTATION_NOT_AUTHORIZED**.
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

## B: 두 차례의 차단 이력

[B/HANDOFF.md](B/HANDOFF.md), [status.json](B/status.json), sanitized logs와 freeze manifest를 보존한다.

첫 실행 명령은 `npx --yes @superdesign/cli@latest`. 재개 session에는 npm warning만 반환됐고 polling에서 자동 승인 검토가 거부했다. 사유: Superdesign 실행 승인과 별도 PostHog telemetry 전송 승인은 다르며 payload가 확인되지 않아 workspace/environment metadata가 포함될 수 있음. 같은 실행을 우회하지 않았다. 당시 로컬로 읽은 공식 SKILL/SUPERDESIGN 문서에서 검증된 telemetry opt-out을 찾지 못했다. 모든 CLI 구현에 opt-out이 절대 없다고 주장하지는 않았다.

소유 session 98069 취소는 Unknown process id를 반환했다. visible matching process도 없었지만 다른 process namespace 전체의 종료를 독립적으로 증명하지 않는다.

사용자는 2026-09-20에 payload가 알려지지 않은 상태를 포함해 telemetry 전송을 명시적으로 허용했다. 이 허용을 별도 clean context의 [B-authorized/AUTHORIZATION.md](B-authorized/AUTHORIZATION.md)에 기록하고, 이전 B 차단 증거를 덮어쓰지 않은 채 실행을 재개했다. 동일한 14개 baseline hash가 다시 일치했고 Superdesign 요구사항에 따라 6개 init 문서를 작성·재독했다.

두 번째 bare preflight는 실제 CLI `v0.14.0`, `not authenticated`를 확인했다. CLI는 `SuperDesign collects anonymous CLI usage; set DO_NOT_TRACK=1 to disable`도 출력했다. 이번 실행은 사용자 허용 범위를 그대로 존중해 `DO_NOT_TRACK`을 설정하지 않았다. 필수 `login`은 auth session 생성 단계에서 고정 30초 timeout으로 exit 3이 되었고, 브라우저 URL이나 device code를 출력하지 않았다. 공식 Superdesign skill의 “login 자체가 실패하면 중단하고 임의 우회하지 않는다” 규칙에 따라 search/model/project/generation으로 넘어가지 않았다. 별도 진단에서 API host의 HTTP 응답은 관찰했지만, 이것은 CLI 인증 성공 증거가 아니며 login을 반복하지 않았다. 상세 증거는 [B-authorized/B_BLOCKED.md](B-authorized/output/B_BLOCKED.md)와 [cli-evidence.json](B-authorized/output/cli-evidence.json)에 있다.

| 실행 증거 | 상태 |
|---|---|
| CLI version | 실제 bare preflight `0.14.0` |
| auth | `not authenticated`; login exit 3, `timeout of 30000ms exceeded`; URL/device code 없음 |
| native search/query/slugs | 0 / 없음 |
| cards/prefilter | 미실행; 일반 아이디어로 대체하지 않음 |
| selected model/project/draft IDs | 없음 |
| canvas/preview URL | 없음 |
| baseline replica/new direction 생성 | 0 / 0 |
| 실제 금액 | 청구/credit 사용 내역 미확인; 생성 0회이나 0원으로 단정하지 않음 |

## 독립성 및 비교 게이트

입력/대화 분리와 출력 비공유는 agent 설정, 동일 manifests와 각 read log 범위에서 확인했다. shared filesystem에 OS 차원의 접근 차단을 설정한 것은 아니므로 절대적 격리 증명은 아니다. A 결과를 B에 전달하지 않았으며 향후 B 재개에서도 전달하면 안 된다.

B_BLOCKED freeze 두 개는 각각 승인 전 차단과 승인 후 인증 실패 증거의 동결이지 first pass 완료가 아니다. 두 completed first passes가 필요하다는 계약에 따라 **cross-review는 실행하지 않았다**. 다양성·품질·비용 대비 이득·A/B 우열을 평가할 자료가 없다.

## 비용·횟수 및 한계

- 완료한 A concepts 6, 사용 reference 5. A는 실제 생성 서비스 시안을 만들지 않았다.
- B bare preflight 1회와 login 1회를 실제 확인했다. native search 0, model selection 0, project creation 0, generation calls 0. 중단 전에도 생성 명령은 보고되지 않았다.
- AI agent/browser 호출 비용은 이 환경에서 금액을 제공하지 않아 미확인. Superdesign 청구 내역도 미확인.
- 전체 허용 생성 상한 2회는 남아 있다. vendor replica 필요 시 1 replica + 1 새 방향으로 구분하며 몰래 추가 생성하지 않는다.
- 실제 ECG rendering, 접근성/performance, target PC, 전시 관람객 3초 이해도 미검증.

## 재개 조건

telemetry 허용 문제는 해소됐지만 Superdesign 인증이 완료되지 않았다. 다음 재개는 vendor auth session 생성과 브라우저 승인이 가능한 환경에서 해야 한다. URL/code가 출력되면 사용자에게 즉시 전달하고 승인을 기다린다. 성공 후에만 동일 baseline/clean packet에서 4~6 native cards → prefilter → 1 baseline reproduction + 최대 1 branch draft를 실행한다. 양쪽 first pass를 동결한 뒤에만 A와 함께 cross-review한다. A freeze 결과는 재생성할 필요가 없다.

O-002/R-011/CASE-004에 승인 후 인증 실패를 후속 기록으로 연결했다. 실험은 완료로 표시하지 않는다.


## 2026-09-20 후속 — B first pass 완료

이전 B_BLOCKED 기록은 당시 incident evidence로 유지한다. 이후 로컬/Codex 환경에서 Superdesign 인증이 성공했고 Director B first pass를 **A 결과를 읽지 않은 별도 clean context**에서 재개했다.

최신 B 결과:
- Superdesign CLI `v0.14.0`
- `DO_NOT_TRACK=1`
- prompt-library search 4회
- Direction Cards 5개
- cheap prefilter KEEP 2 / REJECT 3
- setup reproduction 1회
- branch generation 1회 → B01/B02 두 direction draft
- total credits 46.0
- production UI edits 0
- cross-review 0

선택 draft:
- B01 Signal Orbit — https://p.superdesign.dev/draft/81ee679a-b18b-45e2-a008-8a1e60e322e7
- B02 Exhibition Grid — https://p.superdesign.dev/draft/be68bb43-6954-4064-9362-0777b158f391

`B-authorized/output/B_FROZEN.md`와 `direction-cards.md`, `prefilter.md`, `freeze-verification.json`이 최신 source of truth다.

두 B draft는 faithful baseline과 동일 waveform SVG path hash, Input/Output/Reference semantics, mV/time labels, REPLAY/source wording을 구조적으로 보존했다. 단, 이 검증은 HTML/freeze structural verification이며 rendered-browser/target-PC visual QA는 아직 아니다.

따라서 현재 round는 **A_FROZEN + B_FROZEN** 조건을 충족했고, 다음 허용 단계는 A/B cross-review와 validator다. 추가 A/B generation이나 Hybrid는 아직 수행하지 않는다.


## 2026-09-20 Cross-review / Validator

A/B first pass 동결 뒤 처음으로 함께 비교했다. 상세 판단은 `CROSS_REVIEW.md`, `VALIDATION_MATRIX.md`, Hybrid proposal은 `HYBRID-H1.md`에 있다.

Rendered browser double-check:
- B01 Signal Orbit: dark two-column exhibition stage, dominant right plot, clear mV/time axes, prominent green CTA. 구조/data truth는 유지되나 radial/cinematic surface의 과잉과 reveal timing을 실제 runtime에서 검증해야 한다.
- B02 Exhibition Grid: bright 3/12 metadata rail + 9/12 waveform stage, dominant plot, strong full-width CTA. 정보 밀도와 bright Attract→existing Lab continuity가 주요 tune 대상이다.

Validator 결과:
- KEEP: A04
- KEEP as interaction principle: A05
- KEEP as semantic rule: A06
- KEEP/TUNE: B01, B02
- TUNE/fallback: A01
- DEFER: A02
- REJECT for current Attract: A03
- B03/B04/B05: 기존 reject 유지

사용자 visual alignment 전 provisional prototype-worthiness set:
1. S1 — A04 Question Poster
2. S2 — B01 Signal Orbit (tuned)
3. H1 — B02 Exhibition Grid × A05 Same-scene Handoff

H1은 **제안 문서만 작성**했으며 Superdesign generation/React implementation은 하지 않았다. A06의 Reference 의미 강조와 A01의 same-axis discipline은 공통 tune/guardrail로 다룬다.

다음 gate는 사용자 visual review다. 이 결과는 구현 승인이나 final winner가 아니다.
