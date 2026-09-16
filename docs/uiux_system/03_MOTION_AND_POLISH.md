# Motion & Polish Guide

목적: 파형 및 UI가 투박하지 않고 "보는 맛"이 있으면서도 signal readability와 UX를 침해하지 않도록 한다.

## 1. Motion의 역할

허용 목적:
- attention guidance
- state/context change 전달
- spatial continuity
- progressive disclosure
- 제품 완성도와 리듬

불허 목적:
- 의미 없는 지속 장식
- 실제 데이터처럼 보이는 가짜 trace
- 판독을 방해하는 blur/halo/crossover

## 2. Sweep 관련 현재 기준

기존 결정과 `docs/22`를 우선한다.

- 지워지는 경계의 fade는 현재 표현 계약을 존중한다.
- 새로 그려지는 선단 glow는 **후보**이며 blanket 승인으로 간주하지 않는다.
- 선단 효과를 실험할 경우 원래 방법 색과 가는 선 형태를 유지한다.
- Reference는 비교 기준으로 안정적으로 보이게 한다.
- wrap 전후에 옛 주기 파형이 새 표본처럼 강조되지 않는지 확인한다.
- pause에서는 장식 상태가 정리되어야 한다.
- waveform crossover/morph로 존재하지 않는 중간 신호를 만들지 않는다.

## 3. Project Motion Scorecard

각 항목 1~5점. 공식 MotionScore를 대체한다고 주장하지 않는다.

1. Legibility — 작은 P/T/Q/S 굴곡을 가리지 않는가
2. Attention Guidance — 진행/상태를 실제로 더 빨리 이해시키는가
3. Signal Integrity — 잔상·halo가 데이터처럼 오해되지 않는가
4. Subtlety — 반복 시 피로하지 않은가
5. Cognitive Load — 핵심 task보다 motion이 앞서지 않는가
6. Context Fit — Attract/Transition/Core 중 위치에 맞는 강도인가
7. Reduced Motion — 대체 상태가 존재하는가
8. Performance Risk — continuous Canvas/UI에서 jank 위험이 낮은가
9. State Consistency — play/pause/wrap/pin/zoom에서 일관적인가
10. Reversibility — 문제가 생기면 쉽게 끌 수 있는가

점수는 비교 도구일 뿐 승인 자동화가 아니다. 하나라도 data-integrity critical FAIL이면 총점과 무관하게 재설계한다.

## 4. Transition 튜닝 절차

Motion AI Kit/Transition Editor를 사용할 수 없는 Chat 환경에서는:

1. 목적을 한 문장으로 정의
2. 2~3개 timing/easing/intensity variant 작성
3. 동일 상태에서 비교
4. design-taste motion reference + 이 문서로 review
5. Context7 또는 공식 Motion/CSS 문서로 API/성능 방식 확인
6. 실제 브라우저/Playwright로 상태와 jank 확인
7. 채택값을 코드·결정 로그에 고정

## 5. Creative Freedom에 따른 기본값

- HIGH zone: 장면 전환, reveal, atmospheric depth 허용
- MEDIUM zone: 짧은 hover/selected/reveal, bounded spring 허용
- LOW zone: transform/opacity 중심, 짧고 기능적인 motion만

## 6. 성능 원칙

- `transition: all` 금지
- 가능하면 transform/opacity 중심
- continuous blur/filter/layout measurement를 남발하지 않는다
- Canvas animation은 draw cost와 프레임 안정성을 실제로 측정한다
- reduced-motion에서 장식 motion을 줄이되 사용자가 요청한 ECG 재생 자체를 임의 중단하지 않는다
