# DUAL-ATTRACT-001 — Implementation Selection Freeze

작성 기준: 2026-09-20  
상태: **THREE VARIANTS APPROVED FOR PROTOTYPE / FINAL WINNER NOT SELECTED**  
Source experiment commit: `e1f86d1a679492f73321bdce293cfb16e6162da0`

## 승인된 구현 후보

### V1 — S1 / A04 Question Poster
목적:
- 멀리서도 하나의 질문으로 관람 task를 즉시 제시
- dashboard chrome을 줄이고 editorial exhibit 느낌 강화

핵심:
- 큰 질문 1개
- 보조 문장 최대 1개
- same-axis Input/Output comparison
- Reference 의미는 A06 원칙으로 짧게 명시

### V2 — S2 / B01 Signal Orbit — tuned
목적:
- 기존 dark palette를 유지하면서 plot를 전시의 주인공으로 만들기
- cinematic impact와 scientific readability의 균형 검증

핵심:
- dark stage
- metadata rail 최소화
- radial/orbit motif는 plot 밖에서만
- first useful frame < 1 s 목표
- reduced-motion fallback 필수

### V3 — H1 / B02 Exhibition Grid × A05 Same-scene Handoff
목적:
- public/exhibition composition과 관람→조작 전환을 결합
- 같은 scene/time/method/axes를 유지한 채 Lab controls만 열기

핵심:
- bright editorial grid
- left metadata rail은 B02보다 30–40% 간소화 후보
- CTA: `이 장면에서 직접 비교`
- click 시 no seek / no replay restart / selected method 유지

## 세 variant 공통

### A01 hard guardrail
- Input/Output plot의 동일 time/mV alignment
- waveform geometry/scale/data source 불변
- comparison correspondence를 position/label로도 명확화

### A06 semantic tune
- 회색 Reference가 비교 기준임을 더 명확히 설명
- 단, 임상적 절대 정답/ground truth처럼 표현하지 않음
- common FE 적용 source를 함께 표기

## 이번 구현에서 제외

- A02 — Inspect/Evidence 쪽으로 defer
- A03 — current Attract에서 reject
- B03/B04/B05 — 기존 reject 유지

## 비교 원칙

세 variant는 가능한 한 **같은 data, same scene, same transport time, same method, same viewport**에서 비교한다.

최종 winner는 구현 전에 정하지 않는다.

구현 완료 후:
- static screenshot
- runtime browser
- reduced motion
- Attract→Lab handoff
- data integrity
- target-PC

를 검증한 뒤 사용자 비교로 결정한다.
