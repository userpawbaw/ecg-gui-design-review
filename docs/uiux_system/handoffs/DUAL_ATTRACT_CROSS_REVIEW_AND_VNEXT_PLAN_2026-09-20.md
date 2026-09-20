# DUAL-ATTRACT-001 Cross-Review → v2.2.1 기반 vNext 제작 계획

작성 기준: 2026-09-20  
상태: **계획 확정 / A-B validation 및 production implementation은 아직 미실행**  
관련 실험: `experiment/dual-attract-20260919`  
현재 production baseline: ECG Signal Studio v2.2.1 / `prototype/v2`

## 0. 이번 계획의 경계

이번 문서의 목적은 두 가지다.

1. 이미 동결된 Director A/B 결과를 **정식 cross-review + validator**로 비교한다.
2. 채택된 방향을 v2.2.1 위에 비파괴적으로 적용해 다음 버전 후보를 만든다.

이번 `17_REFERENCE_SOURCE_REGISTRY.md` 업데이트는 **다음 creative round부터** 적용한다. 현재 DUAL-ATTRACT-001의 A를 새 registry로 재실행하지 않는다. A/B first pass 조건을 바꾸지 않기 위해서다.

## 1. 현재 입력 — 그대로 동결

### Director A

A는 6개 concept으로 동결돼 있다.

- A01 두 줄의 전시물
- A02 10초 관측창
- A03 읽는 순서가 있는 무대
- A04 질문 포스터
- A05 같은 시각, 내 차례
- A06 회색 기준의 갤러리

검토 시 `A/A-report.md` + `A/reference-cards.md` + `A/source-read-log.md`를 같이 본다. A는 **아이디어만 보지 말고 원본 reference + viewing instruction + borrowed principle**까지 함께 제시한다.

### Director B

B는 5개 Direction Card → cheap prefilter → 2 draft로 동결돼 있다.

- B01 Signal Orbit — KEEP
  - Preview: https://p.superdesign.dev/draft/81ee679a-b18b-45e2-a008-8a1e60e322e7
- B02 Exhibition Grid — KEEP
  - Preview: https://p.superdesign.dev/draft/be68bb43-6954-4064-9362-0777b158f391
- B03 Archive Scan — REJECT
- B04 Signal Corridor — REJECT
- B05 Noir Pulse Reveal — REJECT

B cross-review 입력은 `direction-cards.md`, `prefilter.md`, B01/B02 preview, `B_FROZEN.md`다.

B01/B02는 HTML 구조와 waveform path 동일성은 검증됐지만 **실제 rendered browser/target-PC QA는 아직 아니다.**

## 2. Phase 1 — Cross-Review 준비

먼저 서로 다른 표현 형식을 비교 가능한 카드로 정규화한다.

각 후보마다 다음 한 장 요약을 만든다.

```text
Candidate ID / Name
Origin: A-reference / B-native
Core idea
3-second impression
What changes from v2.2.1
What remains invariant
Evidence/provenance
Primary benefit
Primary risk
Implementation class
Runtime verification needed
```

A 후보는 Reference Card 링크를 유지한다.
B 후보는 Direction Card + actual preview 링크를 유지한다.

중요:
- B가 draft가 있다는 이유로 A보다 높은 evidence로 자동 승격하지 않는다.
- A가 live external reference를 갖는다는 이유로 실제 ECG prototype이 검증됐다고 보지 않는다.
- B03~B05는 기록상 rejected 상태를 유지하되, 왜 버렸는지 cross-review 문서에 남긴다.

## 3. Phase 2 — 사용자 visual review

### A
각 A 후보는:
- direct reference URL
- "여기서 이 부분을 보세요"
- borrowed principle
- ECG translation

과 함께 보여준다.

### B
B01/B02는:
- Superdesign preview
- direction card
- baseline 대비 바뀐 composition
- 아직 미검증인 motion/readability 요소

를 함께 보여준다.

사용자에게 바로 winner를 고르게 하지 않는다.

먼저:
- 마음에 드는 부분
- 거슬리는 부분
- 반드시 살리고 싶은 interaction/composition
- "이건 우리 프로젝트와 다르다"고 느끼는 부분

을 후보별로 수집한다.

## 4. Phase 3 — Validator Pass

Cross-review 후 후보를 다음 축으로 검증한다.

### 필수 hard gate

- waveform geometry 불변
- Input / selected Output / Reference 의미 불변
- time axis / mV unit 불변
- 없는 live 상태/metric/diagnosis/성능 주장 금지
- 같은 장면 비교라는 truth 유지

### UX / Expo

- 3초 안에 ECG 비교 화면임을 인식 가능한가
- Attract에서 다음 action이 명확한가
- Lab으로 진입했을 때 context loss가 없는가
- 원거리/근거리 관람 모두 읽히는가
- 설명이 plot을 압도하지 않는가

### Visual / Art Direction

- v2.2.1보다 명백한 visual identity improvement가 있는가
- generic AI/SaaS landing으로 보이지 않는가
- 한 장면에서 기억나는 interaction/composition이 있는가
- project teal/amber/Reference language와 이어지는가

### Motion

- motion이 상태/context를 설명하는가
- waveform 자체를 장식용으로 왜곡하지 않는가
- reduced-motion fallback이 성립하는가
- 2~3초 intro를 넘겨 이해를 지연시키지 않는가

### Implementation / Performance

- 현재 React/Canvas 구조에 구현 가능
- target PC 1920×1080 / browser에서 안정적
- preview Lite real waveform data로 재현 가능
- 높은 GPU/WebGL 의존 없이도 핵심 인상이 남는가

판정:
- `KEEP`
- `TUNE`
- `REJECT`

점수 합산만으로 winner를 뽑지 않는다. hard fail은 별도로 처리한다.

## 5. Phase 4 — Shortlist

목표는 **최대 2~3 방향**이다.

가능한 결과:

1. A 단독 방향
2. B 단독 방향
3. A concept + B composition/motion의 Hybrid H1

A/B 각각 하나를 억지로 남기지 않는다. 둘 다 좋은 경우만 병렬 prototype한다.

Hybrid는 최대 한 번만 생성하고 다음 조건일 때만 허용한다.

- A의 message/interaction concept이 명확히 우수
- B의 실제 composition이 그 concept을 더 잘 보여줌
- 결합이 단순 "좋은 것 다 넣기"가 아니라 한 문장으로 설명 가능

예:
```text
A05 "같은 시각, 내 차례"
+
B02 editorial exhibition grid
→ 현재 scene continuity를 유지하는 전시형 CTA
```

## 6. Phase 5 — Pre-implementation Decision

실제 코드 변경 전에 D 기록을 만든다.

반드시 남길 것:
- 유지 후보
- Tune 요구
- rejected A/B 방향
- Hybrid 여부
- 왜 v2.2.1의 어떤 부분을 유지하는지
- 구현하지 않기로 한 시각 효과

Change Contract도 작성한다.

```text
Target:
prototype/v2 Attract

Allowed:
layout / typography / surrounding UI / transition / CTA

Frozen:
waveform geometry
time/amplitude scale
Input/Output/Reference semantics
real replay data
method identity
measurement truth
```

## 7. Phase 6 — v2.2.1 비파괴 구현

2.2.1을 직접 덮어쓰지 않는다.

권장:
- 새 feature branch
- `prototype/v2`의 현재 behavior를 baseline으로 유지
- Attract variant를 별도 config/component/style layer로 만들기

초기 비교 단계에서는 가능하면:

```text
?attractVariant=baseline
?attractVariant=candidate1
?attractVariant=candidate2
```

처럼 같은 데이터/상태에서 visual variant만 바꿔 비교한다.

구조상 query flag가 부적절하면 별도 development route 또는 feature flag를 사용한다.

**파일 전체 복제본을 여러 개 만드는 방식은 마지막 수단**이다. 같은 waveform/data contract를 공유해야 회귀 검증이 쉬워진다.

## 8. Phase 7 — Prototype validation

각 candidate에서 최소:

### Static
- 1920×1080 screenshot
- 첫 화면 / 3초 후 / CTA 직전
- 텍스트 clipping
- plot 크기/contrast

### Dynamic
- Attract enter
- loop/sweep
- CTA → Lab
- reduced-motion
- resize

### Data integrity
- waveform path/hash 또는 sampled coordinate equality
- same time window
- same Input/Output/Reference data
- units/labels
- no invented metric/text

### Browser/runtime
- Playwright
- live browser/TinyFish/Work browser 중 가능한 경로
- console error
- missing asset
- animation frame/performance issue

### Target machine
최종 후보는 실제 Expo PC 또는 유사 사양에서 확인한다.

## 9. Phase 8 — 사용자 비교

사용자에게 baseline + 후보들을 **같은 scene/data/time state**로 보여준다.

확인 질문:
- 3초 안에 무엇이 달라졌는지 느껴지는가
- 어떤 화면이 가장 "작품"처럼 보이는가
- 어느 후보가 ECG 자체를 가장 잘 보존하면서도 기억에 남는가
- interaction하고 싶은 느낌이 있는가
- 과장/광고처럼 느껴지는 부분은 무엇인가

이 단계의 사용자 평가는 `[사용자평가]`로 기록한다.

## 10. Phase 9 — vNext 결정

최종 1안을 선택하거나 baseline과 일부 요소를 결합한다.

버전명은 구현 성공 후 확정한다.

권장:
- 개발 중: `vNext-attract`
- 프로젝트 전체 regression을 통과하고 release scope가 Attract 이상의 의미 있는 UX 개선이면 `v2.3.0` 후보
- 아주 제한된 visual patch면 semantic version 정책에 따라 minor/patch 재검토

2.2.1 release asset은 보존한다.

## 11. 산출물

Cross-review:
- `experiments/DUAL-ATTRACT-001/CROSS_REVIEW.md`
- `experiments/DUAL-ATTRACT-001/VALIDATION_MATRIX.md`
- 필요 시 `HYBRID-H1.md`

Implementation:
- change contract
- implementation branch
- screenshots/video
- Playwright/runtime report
- target-PC report
- selected/rejected D record
- vNext release notes

## 12. 다음 실행 순서

```text
17 Source Registry merge
↓
(Registry test는 다음 creative round로 연기)
↓
DUAL-ATTRACT-001 bookkeeping 최신화
↓
A/B Cross Review
↓
User visual review
↓
Validator
↓
Shortlist 2~3
↓
optional Hybrid 1
↓
D + Change Contract
↓
v2.2.1 기반 non-destructive variants 구현
↓
Browser/Data/Target-PC QA
↓
User comparison
↓
vNext 선택 및 release candidate
```

## 13. 지금 하지 않는 것

- A를 새 source registry로 재실행
- B 추가 generation
- B01/B02 중 자동 winner 선택
- 2.2.1 source overwrite
- actual metric/waveform alteration
- cross-review 전에 Hybrid 생성
