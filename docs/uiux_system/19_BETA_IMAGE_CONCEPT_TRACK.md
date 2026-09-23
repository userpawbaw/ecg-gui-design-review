# Beta Track — Reference-Grounded Image Concept

작성 기준: 2026-09-23  
상태: **새 significant CREATIVE 작업의 저비용 image-first 시각 탐색 경로**  
상위 기준: `00_UIUX_MASTER.md`, `01_CREATIVE_DIRECTION.md`, `04_VALIDATION_AND_GUARDRAILS.md`, `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`, `17_REFERENCE_SOURCE_REGISTRY.md`

## 0. Beta의 목적

Beta는 "예쁜 AI 이미지 만들기"가 아니다.

목표는:

> **실제 reference와 ECG-specific idea를 바탕으로, 그 visual world가 우리 Attract / Transition / Compare / Evidence에 적용됐을 때의 near-final 정지 장면을 값싸고 빠르게 시각화한다. 그 뒤 이미지 속 모든 중요한 요소를 실제 UI component·state·motion·data contract로 다시 번역한다.**

이미지는 최종 제품도, 구현 사양의 대체물도 아니다.

Beta의 가치는:
- text/reference만으로 공유하기 어려운 분위기
- composition
- palette
- lighting
- scale
- typography
- density
- visual surprise

를 빠르게 확인하는 데 있다.

---

## 1. Beta 기본 원칙

### B1. Reference-grounded only

아무런 근거 없는 "futuristic ECG dashboard" prompt를 금지한다.

각 이미지 concept은 반드시:
- Reference Card IDs
- 차용할 visual features
- ECG translation
- do-not-copy
- target scene

을 가진다.

### B2. Project-specific, not stock UI

이미지 안의 hero는 ECG 프로젝트의 실제 개념이어야 한다.

허용:
- Input / Output / Reference
- stored replay
- sweep
- noise / restored relationship
- scene/beat/experiment story
- method identity

금지:
- 가짜 심박수/진단 수치
- 의미 없는 medical hologram
- 임의의 dashboard metric
- generic crypto/SaaS/space dashboard filler

### B3. Strong visual adaptation

Beta는 reference의:
- palette relationship
- macro composition
- typography scale
- signature shape/material
- light/depth treatment
- characteristic UI object

를 **의도적으로 강하게** 적용해 본다.

사용자가 "왜 이 reference를 썼는지" 이미지에서 느낄 수 있어야 한다.

### B4. Still image ≠ interaction proof

정지 이미지가 좋다고 hover/transition이 좋은 것은 아니다.

따라서 모든 이미지 뒤에 별도 Interaction Translation Spec을 작성한다.

### B5. Image text/data is illustrative

생성 이미지의:
- 텍스트
- axis label
- exact waveform
- 수치

는 source of truth가 아니다.

실제 UI 구현에서는 canonical copy/data로 교체한다.

가능하면 현재 2.2.1 screenshot 또는 정확한 plot screenshot을 visual input으로 사용해 baseline continuity를 높인다. 사용할 수 없으면 conceptual still로 명확히 표시한다.

### B6. Preserve image/implementation gap

이미지에서 멋있지만 구현에서 문제가 될 요소를 숨기지 않는다.

예:
- impossible glass blur
- illegible micro text
- physically inconsistent waveform
- hover가 있어야 의미가 생기는 control
- excessive GPU effect

는 `Image-to-Implementation Gap`에 기록한다.

---

## 2. Beta 입력 — Image Concept Packet

### 2.1 Common Creative Packet

Alpha와 동일한:
- target scene
- baseline
- data/state invariants
- Creative Intent
- Reference Pack
- 3s / 15s goal

을 받는다.

논리적 비교를 위해 Beta first pass는 Alpha의 완성안을 보지 않는 것을 기본으로 한다.

실행은 Alpha 후에 하더라도 **Alpha-specific layout/component answer를 prompt에 넣지 않는다**. 사용자가 의도적으로 Alpha를 변형한 이미지가 필요할 때만 예외.

### 2.2 Image-specific Reference Extraction

이미지 generation 전에 다음을 작성한다.

```text
Composition:
Palette relationship:
Lighting / depth:
Typography mood:
Signature UI object:
Background behavior:
Waveform role:
CTA / navigation presence:
Density:
What must not appear:
```

### 2.3 Fidelity target

- `MOOD`: 세계관 탐색
- `SCENE`: 실제 scene composition
- `NEAR_FINAL_STILL`: 실제 제품 screenshot 후보처럼 구체적

이 프로젝트의 Beta 기본은 `SCENE`, 비교 후보로 올릴 때는 `NEAR_FINAL_STILL`.

---

## 3. 이미지 생성 요구 수준

Prompt/brief는 최소 다음을 포함한다.

### Project identity
- ECG denoising research/expo
- stored replay인지 live인지
- compare / attract / transition 중 무엇인지

### Hero hierarchy
- waveform이 어느 정도 화면을 차지하는가
- Input / Output / Reference가 어떤 관계인가
- 다른 요소가 파형보다 앞서지 않아야 하는지

### Reference translation
- reference의 정확한 palette/composition/signature detail
- 어떤 원본 object는 ECG로 치환하는지

### Interaction implication
정지 이미지라도:
- hover 가능한 object
- CTA
- next scene cue
- transition origin

을 보이게 한다.

### Negative constraints
- generic hospital monitor
- stock medical dashboard
- meaningless data cards
- fake diagnosis
- random neon cyberpunk
- unreadable dense microcopy
- waveform perspective distortion

### Fidelity
- polished product UI screenshot
- exhibition-quality art direction
- consistent component language
- credible spacing and hierarchy
- no placeholder-ish unfinished blocks

---

## 4. Beta 생성 budget

한 concept에 무한 반복하지 않는다.

기본:
- 2~4 concept briefs
- 각 brief당 first-pass image 1개
- 유망 1~2개만 refine

사용자가 특정 reference adaptation을 깊게 보고 싶으면 해당 후보에 budget을 집중한다.

이미지 수보다 **reference별로 meaningfully different한 scene hypothesis**가 중요하다.

---

## 5. Beta 산출물 형식

이미지마다 다음 세트를 하나로 취급한다.

### B-01. Creative Brief

- target scene
- intended feeling
- reference IDs
- borrowed visual features
- ECG translation
- fidelity target

### B-02. Generated Still

이미지 또는 image artifact reference.

### B-03. Visual Breakdown

| 화면 요소 | 이미지에서의 역할 | Reference origin | ECG meaning |
|---|---|---|---|

### B-04. Component Translation Table

| Image element | Actual UI component | State/data binding | Component reference | Accessibility |
|---|---|---|---|---|

### B-05. Interaction Translation Spec

각 중요한 요소에:
```text
Trigger:
Hover/active:
Enter:
Exit:
Transition to next scene:
Reduced motion:
```

### B-06. Motion Storyboard

최소:
- Frame 0 / idle
- arrival
- focus state
- user action
- handoff/exit

정지 이미지 하나만 있을 경우 text storyboard라도 작성한다.

### B-07. Image-to-Implementation Gap

```text
Visually shown:
Actually implementable as-is?:
Required adaptation:
Data risk:
Performance risk:
```

### B-08. Implementation Translation

- 실제 2.2.1에서 사용할 component
- 새 component
- CSS/WebGL/Canvas/Motion 필요 여부
- 예상 구현 난이도
- 버릴 이미지-only effect

### B-09. Validation Plan

이미지의 미감 검토와 실제 UI의 runtime 검증을 분리한다.

---

## 6. Beta에서 baseline screenshot을 쓰는 방식

가능하면:
1. 동일 target scene의 실제 screenshot을 확보
2. 이미지 생성에 baseline context로 사용
3. 바뀌면 안 되는 plot 영역을 명시
4. outer composition / atmosphere / component language를 변형

한다.

하지만 이미지 생성 결과에서 waveform/data가 달라질 수 있으므로 **generated pixels를 실제 data-integrity proof로 사용하지 않는다**.

실제 implementation에서 원본 plot renderer를 다시 삽입한다.

---

## 7. Beta에서 피해야 할 실패

- text-to-image가 만든 임의의 medical UI를 creative result로 승인
- reference link와 생성물 사이의 시각적 연결이 없음
- image 자체를 implementation spec으로 사용
- 생성 이미지의 글자/숫자를 그대로 제품 copy로 사용
- 멋진 3D/perspective에 waveform을 실제 data plane처럼 휘게 함
- component/state를 설명하지 않음
- interaction을 "나중에 알아서"로 미룸
- 이미지의 불가능한 detail을 개발자가 그대로 재현하도록 강제

---

## 8. Beta 완료 gate

1. reference와 generated scene의 관계를 설명할 수 있는가?
2. ECG 프로젝트임을 이미지 자체에서 느낄 수 있는가?
3. generic AI dashboard가 아닌가?
4. 이미지 각 요소가 UI component/state로 번역됐는가?
5. interaction/motion storyboard가 있는가?
6. image-only fantasy와 실제 구현 영역을 구분했는가?
7. canonical waveform/data는 이미지가 아니라 실제 renderer가 담당한다는 점이 명확한가?

완료 후 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`의 비교 단계로 보낸다.
