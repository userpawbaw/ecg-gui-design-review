# Handoff — Attract vNext 3-Variant Implementation

작성 기준: 2026-09-20  
실행 환경 권장: Work / Codex / Codex Desktop  
branch: `feat/attract-vnext-variants-20260920`

## 먼저 읽기

1. `AGENTS.md`
2. `docs/uiux_system/00_UIUX_MASTER.md`
3. `docs/uiux_system/04_VALIDATION_AND_GUARDRAILS.md`
4. `docs/uiux_system/08_DECISION_EXPERIMENT_PROTOCOL.md`
5. `docs/uiux_system/experiments/DUAL-ATTRACT-001/IMPLEMENTATION_SELECTION.md`
6. `docs/uiux_system/experiments/DUAL-ATTRACT-001/CHANGE_CONTRACT.md`
7. `docs/uiux_system/experiments/DUAL-ATTRACT-001/CROSS_REVIEW.md`
8. `docs/uiux_system/experiments/DUAL-ATTRACT-001/VALIDATION_MATRIX.md`
9. `docs/uiux_system/experiments/DUAL-ATTRACT-001/HYBRID-H1.md`
10. A/B source files in the same experiment folder

## 작업

v2.2.1 기반 `prototype/v2`에서 세 Attract variant를 모두 구현한다.

- V1: Question Poster
- V2: Signal Orbit tuned
- V3: Exhibition Grid × Same-scene Handoff

**세 아이디어를 한 화면에 섞지 않는다.**
각각 독립 variant로 유지하고 동일 data/state에서 비교 가능하게 만든다.

A01 same-axis discipline과 A06 Reference semantics는 세 variant의 공통 guardrail/tune으로 적용한다.

## 구현 우선순위

1. current Attract state/data contract 파악
2. 최소한의 variant switch 구조 생성
3. V1
4. V2
5. V3
6. static screenshots
7. Playwright/runtime validation
8. data equality / handoff state test
9. reduced-motion
10. 결과 기록

## 금지

- final winner 선정
- v2.2.1 release overwrite
- production release
- A/B 추가 creative search
- Superdesign Native 추가 generation
- waveform/data 의미 변경
- unrelated Lab/Evidence redesign

## V3 특별 주의

현재 Attract의 pointer/key exit behavior와 explicit CTA가 충돌할 수 있다.

따라서 먼저 existing event handlers를 읽고:
- CTA click이 double-trigger되지 않는지
- same-time handoff가 유지되는지
- controls reveal이 replay restart를 일으키지 않는지

테스트를 작성한 뒤 구현한다.

## 완료 조건

보고서에 반드시 포함:
- 변경 파일
- variant switch 방식
- 각 variant screenshot
- baseline vs variant data/state equality evidence
- Playwright 결과
- reduced-motion 결과
- console/runtime issue
- 아직 미검증인 target-PC 항목
- 구현 중 발견한 design/UX issue
- 최종 head SHA

완료 후 **merge하지 말고** Chat 검토를 위해 멈춘다.
