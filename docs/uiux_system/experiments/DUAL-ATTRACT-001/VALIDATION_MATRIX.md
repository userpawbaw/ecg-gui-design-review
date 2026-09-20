# DUAL-ATTRACT-001 — Validation Matrix

작성 기준: 2026-09-20  
상태: **Validator pass complete at L0/L1/L2-lite evidence; user visual alignment pending**  
구현 승인: 없음

## Evidence note

- A 후보: reference-grounded L0 concepts. 일부 reference는 E1~E3.
- B01/B02: Superdesign draft + HTML structural verification + desktop rendered browser observation.
- Target PC / actual v2.2.1 integrated implementation / user test는 아직 없음.
- 따라서 이 문서의 KEEP/TUNE/REJECT는 **prototype worthiness** 판정이지 final design approval이 아니다.

## Matrix

| Candidate | Data integrity | 3s clarity | Expo impact | Handoff/interaction | App continuity | Motion/accessibility risk | Implementation cost | Validator |
|---|---|---|---|---|---|---|---|---|
| A01 두 줄의 전시물 | 강함 | 강함 | 중간 | 중간 | 강함 | 낮음 | 낮음 | TUNE / fallback |
| A02 10초 관측창 | 강함 | 중간 | 중간 | 중간 | 강함 | 낮음 | 중간 | DEFER |
| A03 읽는 순서가 있는 무대 | 강함 | 약함-중간 | 중간 | 약함 | 중간 | 중간 | 중간 | REJECT for Attract |
| A04 질문 포스터 | 강함 | 강함 | 강함 | 중간 | 중간 | 낮음 | 낮음 | KEEP |
| A05 같은 시각, 내 차례 | 강함 | 강함 | 중간 | 매우 강함 | 강함 | 낮음-중간 | 중간 | KEEP as interaction principle |
| A06 회색 기준의 갤러리 | 매우 강함 | 강함 | 중간 | 중간 | 강함 | 낮음 | 중간 | KEEP as semantic rule |
| B01 Signal Orbit | 구조상 강함 | 강함 | 매우 강함 | 중간-강함 | 강함 | 중간 | 중간 | KEEP / TUNE |
| B02 Exhibition Grid | 구조상 강함 | 강함 | 강함-매우 강함 | 강함 | 중간 | 낮음-중간 | 중간 | KEEP / TUNE |
| B03 Archive Scan | 강함 | 중간 | 중간 | 중간 | 중간 | 중간 | 중간 | REJECT 유지 |
| B04 Signal Corridor | hard-risk | 약함 | 강함 | 중간 | 약함 | 높음 | 높음 | REJECT 유지 |
| B05 Noir Pulse Reveal | 강함 | 중간 | 강함 | 중간 | 중간 | 중간-높음 | 중간 | REJECT 유지 |

## Hard-gate review

### Pass
- A01/A02/A03/A04/A05/A06: 제안 문서상 waveform/time/mV/Reference semantics를 보존한다.
- B01/B02: frozen HTML에서 동일 waveform SVG path hash와 필수 labels가 검증됐다.
- B03/B05: concept 자체가 hard fail은 아니지만 정보 이득이 낮아 reject.
- A04/A05/A06: 없는 metric/진단/live device를 요구하지 않는다.

### Fail / near-fail
- B04: perspective/Z-axis journey가 same-axis interpretation에 직접 위험 → reject.
- A03: data hard fail은 아니지만 temporal narrative가 processing stage처럼 읽힐 UX risk가 높아 Attract에서 reject.

## 3-second test hypothesis

실제 사용자/관람객 측정 전 가설:

- A04: "무엇을 보라는지"를 가장 빨리 전달할 가능성이 높음.
- B01: "작품처럼 보임"과 plot focality가 가장 강할 가능성이 높음.
- B02/H1: "전시물 + 내가 바로 만져봄"을 가장 명확히 연결할 가능성이 높음.
- A01: 이해는 빠르지만 wow delta가 작을 가능성.
- A02/A03: 추가 맥락/순서가 3초 window에서 부담일 가능성.

측정 없이 성공으로 기록하지 않는다.

## Shortlist gate

Validator가 prototype 비용을 허용하는 set:

1. **S1 = A04 Question Poster**
2. **S2 = B01 Signal Orbit — tuned**
3. **H1 = B02 Exhibition Grid × A05 Same-scene Handoff**

공통 tune:
- A06의 Reference semantics를 세 후보 모두에서 검토
- A01의 same-axis alignment discipline을 세 후보 모두의 hard guardrail로 유지

## 후보별 반드시 확인할 것

### S1 A04
- 1920×1080에서 plot width / axis text size
- 질문 headline이 conclusion처럼 읽히지 않는지
- 거리 가독성

### S2 B01
- actual reveal duration
- radial effect가 plot보다 먼저 보이지 않는지
- reduced-motion
- CTA copy density
- dark-theme target display contrast

### H1 B02×A05
- CTA 클릭 전후 같은 transport/time 유지
- left rail density
- bright Attract → existing Lab transition discontinuity
- CTA vs current any-pointer/key exit conflict
- no forced seek/restart

## User visual alignment questions

각 후보마다 다음을 받아야 한다.

1. 가장 살리고 싶은 요소
2. 가장 거슬리는 요소
3. "우리 프로젝트답다/아니다" 느낌
4. 실제 시안으로 볼 가치가 있는지
5. A06 Reference emphasis를 어느 강도로 넣을지

이 사용자 평가 후 final shortlist freeze와 구현 D를 작성한다.
