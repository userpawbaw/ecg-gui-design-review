# REF-003 parity 소급 판정 · R1 다음 효과 gap

2026-09-27 · D-038/`26_REFERENCE_TO_ECG_WORKFLOW.md` Phase 5–6을 기존 기록에 소급 적용. **새 캡처·원본 재측정은 수행하지 않았다.** 근거: `references/REF-003_WHITE_DESERT.md` EFX-003-02/03, `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md` §1–2·§4·§6, CASE-006 §6·§11, F-017. 레퍼런스 프레임 포함 비교 sheet는 repo 밖에 보관된 기록이므로 이 세션에서는 다시 볼 수 없다.

## REF-003 EFX-003-02 — 경로/표시기

기록된 비교: 원본 영상 38–60초와 구현 A의 동일 스크롤 비율 **12장**, 수정 후 1600×900 표시기 y 12개 `1501, 1270, 1038, 834, 645, 500, 483, 473, 470, 468, 440, 318`. 시작/끝의 clamp와 중앙 유지가 설명돼 있다. 입력 모델은 스크롤 진행률, 소나(별도 EFX-003-03)는 정지 중에도 돌아가는 시간 루프다. 원본 source의 DrawSVG/MotionPath와 구현의 dash/path mapping을 구별한다.

| ID | 원본 증거 → 구현의 차이 | 심각도 | 기록된 원인·수정 | 현재 증거 한계 |
|---|---|---|---|---|
| 003-02-A | 지난 경로는 선명한 청록, 남은 경로는 흐리고 가는 색 → 초기 구현에서 구분 부족 | P1 | 남은 선 흰색 80%·1.4px을 38%·1px로, 지나온 선 2px을 2.6px+glow로 변경 | 수정 후 12장 PASS라고 기존 handoff에 기록; 원본 sheet 현 세션 재열람 불가 |
| 003-02-B | 표시기가 중간 구간에서 화면에 머무름 → 초기 구현은 4번째 프레임부터 이탈 | P1 | ScrollTrigger 고정 구간과 지도 0.55vh parallax 불일치. 화면 y 0.56vh를 목표로 경로 진행률 이분 탐색, 양끝 clamp | y 수열 12개는 기록됐지만 빠른/느린 실제 휠, reverse/stop 연속 녹화의 새 증거 없음 |
| 003-02-C | 하나의 칠해진 경로 → A 수정 후 청록 dash 두 토막 | P1 | `vector-effect: non-scaling-stroke` 제거. 이 결함은 A/B 수정 뒤 전체 12장을 다시 봐야 발견됨 | 수정 반영·A 12장 결과는 기록됐지만 현재 코드/런타임 재검증은 별개 |

**소급 결론: `CANDIDATE (spiked)`.** 세 P1의 과거 수정과 A 12장 비교 결과는 재사용 가능한 근거다. 그러나 원본 sheet가 없는 현재 세션에서 전체 시퀀스와 stop/reverse/연속 motion을 다시 확인하지 못했고, 실제 GPU/터치/성능은 기존 handoff에서도 미검증이다. `REPRO_PARITY_READY`나 RCP-16 `parity-checked`라고 승급하지 않는다. B 컴포넌트 변형은 정지 소나 실패가 기록되어 별도 P1이며 A 결과와 합산해 통과시키지 않는다.

## R1의 첫 gap audit

R1 packet은 FROZEN이고 `ALPHA-R1-001`은 이전 순서로 만든 초안이다. 사용자 지목 REF-006의 객체 연속 재배열과 REF-001 형태 연속 match cut은 우선 검사 후보이다. **효과를 하나로 묶지 않고** 다음처럼 평가한다.

| 대상 | 있는 증거 | Phase 2–6에서 남은 것 | 다음 실행 |
|---|---|---|---|
| REF-006 EFX-006-01/02, RCP-24/25 | source+로컬 사본 headless 측정, 사용자 지정 wow와 R1 pack | 정확한 primary 구간과 상태 동결, 원본/재현 동일 진행률 캡처, 독립 spike와 parity 장부, recipe 버전/코드/성능 | 사용자 지목 wow를 Phase 2에 고정하고 메커니즘+원본 증거 범위를 감사한 뒤 독립 재현 |
| REF-001 EFX-001-03, RCP-03 | 원본 녹화·소스·라이브 분석; 별도 scroll-globe spike는 지구→선→카드의 전체 match cut parity 증명 아님 | transition geometry/occlusion/광선→카드 edge 연속의 입력 범위, 독립 전체 구간 spike, 6–12장+연속 motion, recipe | REF-006과 별도 wow로 동결해 Phase 3–6 시험. 착수 시 아카이브/에셋·라이선스 재확인 |
| REF-003 EFX-003-02/03, RCP-16/17 | 위 소급 12장과 수정 기록, A/B 비교 | 재현 명령·수정 후 전체 상태/영상·P1 잔여 확인, recipe version/rights/fallback | 누락한 stop/reverse/reduced-motion 등 실제 상태를 다시 캡처하여 판정 |

R1의 Story 자료에는 F-025를 적용한다. D1 잡음별 장면은 서로 다른 기록이므로 같은 ECG라는 문구/화면 인계는 금지한다. 동일 기록의 조건 비교는 D0 S038과 명시된 조건에서만 설계한다. 첫 새 효과의 `REPRO_PARITY_READY` 이후 ECG synthesis와 Alpha 개정으로 간다. L4 Windows/전시 PC는 별도 미검증이다.
