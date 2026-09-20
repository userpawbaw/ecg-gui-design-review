# Dual Creative Director — 공통 실행 계약

2026-09-19. 근거: CASE-004, D-010/R-009, D-012. 이전 handoff는 설계 이력이며 현재 실행 규칙은 이 문서다. 14번은 Superdesign 모드 실행 계약, 13번은 A의 reference 방법론이고, 17번은 A의 reference source registry다.

## 1. Activation과 우선순위

AI는 새 요청에서 target, task, zone, 새 방향 여부, 명시 모드를 판단하고 짧게 결과를 알린다. 자동 activation은 요청을 처리할 때 적용하는 routing이며 백그라운드 hook/예약 작업이 아니다.

| 조건/명령 | 경로 |
|---|---|
| `듀얼 디렉터 진행해줘` | DUAL: A + 독립 B |
| `레퍼런스 디렉터만 진행해줘` / reference mining | A_ONLY |
| `Superdesign 독립 탐색 진행해줘` | B_ONLY / NATIVE_DIRECTOR |
| `이 후보를 Superdesign 시안으로 만들어줘` / 선택 후보 비교 | CONCRETIZER |
| significant CREATIVE + HIGH + 새 방향 | DUAL 기본 자동 실행 |
| CREATIVE + MEDIUM | A 먼저, 독립 B의 추가 정보 가치가 있으면 제안; 이미 허용된 범위면 실행 |
| LOW, 사소한 polish, 버그/수치 수정, 방향 freeze 후 구현 | 자동 Director 생략, 해당 구현/검증으로 연결 |

명시적 모드가 자동 zone routing보다 우선한다. hard data constraints는 어느 모드에도 유지한다. LOW에서 명시적으로 탐색을 요청해도 수치·파형을 꾸밀 수 없다. 혼합 화면은 영역별 분리: HIGH reveal의 변화가 LOW 파형/축으로 번지지 않게 한다. “새 디자인 라운드” 자체는 전역 Dual 명령이 아니며 scope와 zone을 먼저 판정한다.

HIGH: Attract/Intro, Lab→Evidence, Replay→Live, major Evidence story, Result Reveal. MEDIUM: Method Explorer, navigation, metric summary/cards. LOW: waveform inspection, axis, Reference/Difference, exact measurements.

## 2. 공통 baseline packet

Orchestrator는 최신 main/작업 branch SHA와 UI baseline SHA, target route, 문제/관람객 목표, zone, 현재 code/design-system의 허용 파일 목록, hard constraints, 데이터 story/grammar(필요 시), 예산, 출력 위치를 먼저 고정한다.

공통 제약: waveform geometry, time/units, Reference/Difference 의미, data scope/metric 의미 유지. 합성/데모/미연결 hardware를 실제 성능처럼 표시하지 않는다. `.superdesign`은 derived state다. 전체 repo/대형 archive/replay/raw data/secrets를 업로드하지 않는다.

공통 packet에는 현재 라운드 A/B의 reference, 아이디어, 선호, 생성 draft를 넣지 않는다. 과거 CASE·handoff는 orchestrator의 운영 배경이고 Director에게 넘길 creative seed가 아니다. baseline에 원래 존재하는 시각 언어와 이번 탐색 결과를 구별한다.

## 3. First-pass independence를 실제로 지키는 방법

1. Orchestrator가 공통 packet을 동결한 뒤, A와 B를 **서로의 대화 기록을 상속하지 않는 별도 context/session**에서 실행한다. 환경이 허용하는 독립 worker 또는 별도 세션 handoff를 사용한다. full-history fork는 사용하지 않는다.
2. A는 공통 packet + 13번 A 계약만, B는 공통 packet + 14번 NATIVE_DIRECTOR 계약만 받는다. 파일 접근은 최소 manifest로 제한하고 각 worker는 실제 읽은 경로/출처를 보고한다. 두 worker가 전체 저장소를 자유롭게 탐색하도록 지시하지 않는다.
3. 라운드 출력은 `round-id/A/`, `round-id/B/`처럼 분리한다. B의 Superdesign project/draft/resume/context에도 A 결과가 없어야 한다. 다른 방향이 섞인 saved draft는 독립 탐색용으로 재사용하지 않고 깨끗한 baseline target을 준비한다. B init도 허용된 UI source만 분석한다.
4. A 결과를 B에게, B의 prompt search/card/draft를 A에게 first pass 종료 전 공개하지 않는다. 두 결과를 모두 동결한 뒤에만 CROSS_REVIEW로 이동한다. B prefilter의 중복 비교는 **B 내부**에 한정한다.
5. 누출을 발견하면 해당 pass를 CONTAMINATED로 표시하고 깨끗한 context에서 재시작한다. 이미 생성된 비용은 기록하며 재시작을 이유로 승인된 예산을 자동 확대하지 않는다.

같은 대화에서 “이제 B로 행동하라”는 독립 실행이 아니다. 격리 도구가 없으면 순차 실행이어도 별도 새 세션에 clean packet을 전달한다. 그것도 불가능하면 `INDEPENDENCE_UNVERIFIED / B_HANDOFF_READY`로 멈추고 A만의 결과를 Dual 완료로 보고하지 않는다. 논리적 독립성과 wall-clock 병렬 실행은 별개다.

## 4. Director A

13번 Reference Mining + Art Director를 수행한다. 실제 direct URL, 정확히 볼 장면/상태/시간, Reference Card, Experience Principle, ECG translation을 포함한 5~8 concepts를 만든다. 접근 못한 reference는 미검증으로 표시하고 보았다고 주장하지 않는다. 결과와 context manifest를 동결한다.

## 5. Director B — NATIVE_DIRECTOR

기존 UI baseline과 자체 Superdesign inspiration/prompt 탐색에서 시작한다. A의 reference/shortlist로 시작하지 않는다. vendor skill의 실제 preflight/auth와 codebase init/resume 규칙을 14번에 따라 수행한다. search 결과를 사용했다고 주장하려면 실제 query/result를 남긴다. 독립 URL design-DNA 추출은 선택 사항이다.

먼저 **4~6 SD Direction Cards**, 그다음 cheap prefilter, **1~2 actual drafts**. 카드 단계에는 유료 draft를 생성하지 않는다. 카드 필드:

- SD-DIR ID, baseline SHA/target, query와 source slug/URL(없으면 없음)
- 탐색 주체/모델, draft model은 실제 생성 후 기록(모르면 미확인)
- 왜 이 방향인가, ECG translation, 기대 느낌
- 현재 UI 및 다른 B 후보와 차이, hard risks, draft cost
- prefilter KEEP/REJECT와 이유, 생성한 draft/preview 연결

Prefilter에서 제거 가능: 데이터 의미 훼손, 목적 무관, B 내부 중복, 비용 대비 정보 이득 부족. 낯설다/화려하다/의료 UI 같지 않다는 이유만으로 제거하지 않는다. 모든 후보가 hard constraint에 실패하면 draft 0개와 이유를 반환한다. 유효 후보가 하나면 하나만 만든다.

예산은 라운드별: B cards 4~6, 신규 B 방향 drafts 최대 2; 기존 UI replica 등 유료 setup이 필요하면 별도 비용으로 먼저 명시한다. 서비스 retry의 비용·성공 여부가 불명확하면 상태 확인 전 중복 생성하지 않는다. model 다양화는 동질적 결과가 확인됐을 때만 추가 라운드로 제안하며 기본 예산에 몰래 더하지 않는다.

## 6. Cross-review와 Hybrid

A 동결 + B 동결 + 동일 baseline + 독립성 확인 후 양쪽 산출물을 공개한다. 비교표에 후보 ID, 원리/구성, provenance, baseline 차이, 사용자 판단에 주는 정보, data/UX/motion/accessibility 위험, 비용, KEEP/TUNE/REJECT 이유를 적는다. A는 reference concept이고 B는 concrete draft임을 명시해 산출물 완성도 차이를 품질 우열로 오인하지 않는다.

A concept + B composition처럼 상보성이 구체적으로 확인될 때만 H1을 제안한다. 부모 후보 IDs, 결합 이유와 새로 확인할 가설을 기록하고 **추가 Hybrid 생성은 최대 한 라운드/한 draft**다. 사용자가 이미 허용한 budget이면 진행하고, 허용 범위를 넘으면 그 구체적 비용만 확인한다. Hybrid는 CONCRETIZER이며 독립 B 결과라고 부르지 않는다. 자동 반복 hybrid는 없다.

Product Design/design-taste/motion-review/프로젝트 규약과 사용자 visual alignment로 검증한다. 생성기는 자기 결과를 승인하지 않는다. final UI 구현은 별도 change contract/승인 범위에 따른다.

## 7. 환경과 중단 상태

| 실제 capability | 수행 |
|---|---|
| Standard Chat, shell 없음 | A 수행 + A 결과 없는 B clean handoff. B 반환 뒤 cross-review |
| Work/Codex/Claude, shell + vendor/auth/network + clean contexts 사용 가능 | A/B 각각 실행, 동결 후 cross-review |
| shell 있으나 vendor/auth/network 실패 | 가능한 A 수행, B_BLOCKED와 원인 및 clean handoff 반환 |
| shell 있으나 context 격리 불가 | 독립 worker용 새 세션 handoff; 독립 완료 주장 금지 |

shell 존재만으로 B 실행 성공을 보장하지 않는다. user authorization은 재요청하지 않으며 실제 로그인/비용 등 빠진 선행조건만 다룬다. upstream 실패는 무한 재시도하지 않는다. Figma/직접 prototype fallback은 표시하고 B native 실행 성공으로 대체하지 않는다.

상태: BASELINE_READY → FIRST_PASS(A/B 개별 READY/RUNNING/FROZEN/BLOCKED) → CROSS_REVIEW → 선택적 HYBRID → VALIDATED. B_HANDOFF_READY는 대기 상태다. 중단 후 baseline/input manifest와 실제 생성 IDs를 확인해 검증된 산출물을 재사용하며 중복 생성하지 않는다.

## 8. Return packet과 기록

반환: round/mode/zone/route 이유, baseline SHA, A/B 입력 manifest와 독립성 판정, A references/concepts, B query/cards/prefilter/draft IDs/canvas/preview, 실제 CLI/model, 비용·생성 횟수, 비교/기각 이유, Hybrid 부모/결과(있을 때), validator 결과, 미검증/blocked/다음 action.

06번 handoff에 B-only clean packet과 orchestrator review packet을 분리한다. 사례/방법론 변경은 CASE-004 및 후속 D/R로 연결한다. 기존 D-009/R-008은 역사로 유지한다. 문서/skill/오프라인 routing 검사 PASS는 실제 Superdesign 품질·독립성 효과·브라우저 UX 검증이 아니다.
