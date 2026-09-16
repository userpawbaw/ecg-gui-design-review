# UI/UX Decision & Experiment Protocol

목적: 아이디어, 승인, 구현, 검증을 섞지 않고 기록한다.

## 1. 기록 단위

각 의미 있는 후보/변경에 `UX-YYYYMMDD-NN` 또는 기존 `UI-xx` ID를 사용한다.

필수 필드:
- 문제/기회
- 화면/상태
- Creative Freedom Zone
- 제안
- 근거
- 위험
- 판정: KEEP/TUNE/REJECT/DEFER
- 승인 여부
- 구현 commit/PR
- 증거 레벨
- 검증 결과
- 후속

## 2. 아이디어와 승인 구분

- 제안 목록 ≠ 구현 승인
- Plugin이 만든 prototype ≠ final spec
- Flourish chart ≠ 프로젝트 성능 증거
- 사용자 "좋아 보인다" 피드백 ≠ 모든 viewport/runtime 검증 완료

## 3. 비교 실험

Motion/visual 후보는 가능하면 2~3 variant를 같은 조건에서 비교한다.

예:
- A: fade only
- B: subtle glow + short fade
- C: stronger glow + same fade

비교 항목:
- 첫 시선
- signal readability
- 피로도
- 상태 이해
- 성능
- reduced-motion

## 4. Rejected Ideas도 보존

거절한 이유를 기록한다. 같은 제안을 다음 세션에서 다시 검토할 때 과거 맥락을 잃지 않기 위함이다.

예:
- waveform crossover: 시각적으로 흥미롭지만 signal overlap/identity ambiguity 때문에 core view에서는 reject

## 5. 정기 전체 감사

국소 수정이 누적될 때 다음을 다시 확인한다.
- focal point drift
- accent/motion 과잉
- data hierarchy 약화
- 같은 기능의 다른 control language
- responsive/target PC 영향

횟수 자체보다 영향 범위와 누적 위험을 기준으로 전체 감사를 실행한다.
