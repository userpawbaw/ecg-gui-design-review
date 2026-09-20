# H1 — Exhibition Grid × Same-scene Handoff

상태: **PROPOSED ONLY / NOT GENERATED / NOT IMPLEMENTED**  
출처:
- B02 Exhibition Grid — Superdesign Native
- A05 같은 시각, 내 차례 — Reference Director

## 한 문장

> **밝고 공공 전시물 같은 B02의 구성 안에서, 관람객이 보고 있던 바로 그 ECG 시각을 유지한 채 Lab 조작권을 넘겨준다.**

이 Hybrid는 "좋은 요소를 다 섞기"가 아니다.

- B02에서 가져오는 것: exhibition grid, public-facing hierarchy, full-width action band
- A05에서 가져오는 것: **same scene / same time / same method / same axes handoff**
- 가져오지 않는 것: 새로운 waveform effect, seek/restart, invented interaction, extra marketing CTA

## 왜 Hybrid인가

B02는 actual rendered shell과 강한 CTA 구조를 이미 갖고 있다.
A05는 visual shell보다 interaction meaning이 강하다.

둘은 서로 같은 문제를 중복해서 해결하지 않고:
- B02 = "어떻게 보이는가"
- A05 = "클릭했을 때 관람자 역할이 어떻게 바뀌는가"

를 각각 담당한다.

## Proposed screen behavior

Attract:
- B02의 left metadata rail / right waveform stage
- same-axis Input/Output/Reference 유지
- 하단 action band

CTA copy 후보:
- `이 장면에서 직접 비교`
- 보조 text가 필요하면 `같은 시각 · 같은 방법 · controls만 열기`

Click:
1. current transport time 저장
2. method 유지
3. loop range / axis 유지
4. waveform canvas를 새로 seek/restart하지 않음
5. Lab controls / rail이 등장
6. layout resize가 필요하면 waveform coordinates가 의미적으로 동일하게 유지되는지 검증

## A06 semantic tune

H1에서도 Reference를 단순 legend로만 두지 않고:
- `회색 선 = 공통 FE가 적용된 Reference`
- 특정 method winner/clinical truth가 아님

을 짧게 설명하는 안을 검토한다.

단, B02 left rail의 정보 밀도를 높이지 않도록 Reference 설명은 1줄 이하 또는 plot-adjacent legend로 둔다.

## Risks

- current Attract의 any-pointer/key exit과 CTA semantics 충돌
- bright exhibition screen → existing dark Lab로 들어가며 큰 style discontinuity
- controls 등장 시 canvas resize jump
- full-width CTA가 waveform보다 더 강한 focal point가 될 수 있음

## Prototype acceptance criteria

- CTA 전/후 transport time 동일
- selected method 동일
- Input/Output/Reference source 동일
- x/y meaning 동일
- no auto seek
- no replay restart
- CTA가 plot보다 먼저 읽히지 않음
- 1920×1080에서 plot가 primary visual object
- keyboard/focus path 정의
- reduced-motion에서도 same-scene handoff 의미 유지

## Generation boundary

사용자 visual alignment 후 H1이 final shortlist에 남는 경우에만:
- Superdesign CONCRETIZER 1회 또는 direct React light prototype
- 추가 Native search는 하지 않음
- 생성 결과가 B02보다 나빠지면 H1 concept을 유지한 채 직접 구현 prototype으로 전환 가능

현재는 아이디어 문서만 만든다.
