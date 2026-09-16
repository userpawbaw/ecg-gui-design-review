# Validation & Guardrails

목적: Creative/Data/Motion 아이디어를 **데이터 무결성, UX, 접근성, 제품 일관성** 기준으로 수렴시킨다.

## 1. 검증 레이어

### A. Project Contract
- `docs/12`, `13`, `21`, `22`
- 파형 우선, Attention→Choose→Compare→Inspect→Prove
- Local/Session/Experiment 구분
- Replay/Live/Reference/Difference 의미 보존

### B. Design Quality
- design-taste / ui-ux-pro-max의 관련 reference
- hierarchy, spacing, typography, states, consistency

### C. Motion
- `03_MOTION_AND_POLISH.md`
- reduced-motion, overlap, fatigue, performance

### D. Data Integrity
- 단위, 축, time mapping, Reference, Difference sign/gain
- 새로운 시각화가 정량 의미를 왜곡하지 않는지

### E. Accessibility
- keyboard/focus/semantic state
- contrast
- icon-only control labeling
- reduced-motion

## 2. KEEP / TUNE / REJECT

모든 비사소한 creative 후보를 다음 중 하나로 기록한다.

- `KEEP`: 그대로 prototype할 가치가 있음
- `TUNE`: 아이디어는 유지하되 강도/구조/표현을 조정
- `REJECT`: 데이터/UX/접근성/성능/프로젝트 목적과 충돌

REJECT에는 "취향에 안 맞음"이 아니라 구체적 근거를 남긴다.

## 3. 변경 계약

구현 전 최소 다음을 기록한다.

- 변경 목적
- 대상 화면/컴포넌트
- 변경 금지 범위
- 유지해야 할 데이터/상태 계약
- acceptance criteria
- 필요한 증거 레벨(L0~L4)
- rollback 방식

## 4. UI 변경 검증 매트릭스

| 변경 | 최소 검증 |
|---|---|
| spacing/typography | source + static render |
| shared control/state | source + interaction |
| transition/motion | video/runtime + reduced-motion |
| waveform style | runtime + 작은 morphology 가독성 |
| 축/단위/Difference | 수치 fixture + runtime |
| data visualization | 원본 데이터/단위 검증 + static/interactive |
| attract/narrative | 3초/15초 메시지 test + handoff consistency |

## 5. 과장 금지

- "전문가 수준", "병원급" 같은 품질을 검증 없이 UI 표현으로 암시하지 않는다.
- synthetic/demo/replay를 actual device measurement로 표현하지 않는다.
- automated DOM PASS를 target-PC visual PASS로 확대하지 않는다.
- Flourish/3D/animation을 metric 우월성의 증거처럼 사용하지 않는다.
