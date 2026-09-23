# Alpha Track — Implementation-Aware Reference Adaptation

작성 기준: 2026-09-23  
상태: **새 significant CREATIVE 작업의 구현 친화형 설계 경로**  
상위 기준: `00_UIUX_MASTER.md`, `01_CREATIVE_DIRECTION.md`, `04_VALIDATION_AND_GUARDRAILS.md`, `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`, `17_REFERENCE_SOURCE_REGISTRY.md`

## 0. Alpha의 목적

Alpha는 "기존 UI를 조금 더 정돈하는 경로"가 아니다.

목표는:

> **강한 외부 reference의 세계관·구성·특징적인 UI 언어를 ECG 프로젝트에 고충실도로 번안하되, 처음부터 실제 컴포넌트·상태·모션·데이터 계약·구현 구조까지 고려해 near-implementation 수준의 설계안을 만든다.**

Alpha는 다음 질문에 답해야 한다.

- 이 reference의 무엇이 기억에 남는가?
- 그 특징이 ECG Attract / Transition / Compare / Evidence에서 어떤 장면이 되는가?
- 화면의 각 요소는 실제 어떤 component/state/data에 연결되는가?
- hover, reveal, transition은 어떻게 움직이는가?
- 2.2.1의 파형 엔진과 기능을 어디까지 유지하고 무엇을 새 visual shell로 감싸는가?
- 개발자가 그대로 구현을 시작할 만큼 설계가 구체적인가?

Alpha의 성공은 "안전한 UI"가 아니라 **reference intent가 실제 product structure 안에서 살아 있는 고완성도 설계**다.

---

## 1. Alpha의 기본 원칙

### A1. Scene-first, not component-first

버튼·카드부터 고르지 않는다.

먼저 이 장면이:
- 3초 안에 무엇을 느끼게 하는지
- 어떤 연구 내용을 보여주는지
- 어떤 관람 행동으로 이어지는지

정한다.

그 다음 해당 장면을 실현하는 component와 interaction을 선택한다.

### A2. Strong reference adaptation

Reference를 "영감 받음" 정도로 희석하지 않는다.

각 채택 reference에서:
- palette / contrast grammar
- spatial composition
- typography hierarchy
- signature visual device
- navigation/CTA language
- hover/motion behavior
- component shape/material

중 **무엇을 실제로 번안할지 명시**한다.

원본 브랜드 자산을 복제하지 않지만, 사용자가 결과를 보고 **"왜 이 reference를 골랐는지 느낄 수 있을 정도의 시각적 연관성"**은 남겨야 한다.

### A3. ECG-first translation

Reference의 hero object가 자동차·행성·제품 사진이라면 그것을 ECG에 그대로 가져오지 않는다.

대신 ECG 프로젝트의:
- waveform
- sweep head
- sample window
- Reference overlay
- noise/denoise contrast
- scene / beat / record hierarchy
- replay/live context

가 그 역할을 맡는다.

### A4. 2.2.1 is a capability baseline, not a visual prison

v2.2.1의:
- waveform rendering
- comparison semantics
- transport/state
- useful controls

는 자산이다.

하지만 기존 card/dashboard composition은 필요하면 크게 재배치할 수 있다.

### A5. Component quality is part of the design

최종 단계에서 버튼만 다듬는 것이 아니라, 처음부터:
- button
- tabs
- method rail
- status chip
- legend
- tooltip
- drawer
- segmented control
- metadata rail

등이 reference world와 일관되는지 설계한다.

Refero/Mobbin/Land-book/21st.dev류 source는 component reference로 사용할 수 있다.

### A6. Motion is specified, not implied

"부드럽게 등장"처럼 끝내지 않는다.

각 motion은:
- trigger
- target
- duration range
- easing character
- overlap
- exit
- reduced-motion fallback
- data surface에 미치는 영향

을 적는다.

### A7. HIGH zone은 과감하게, LOW zone은 고정

Attract/Intro/Transition은 과감하게 바꿀 수 있다.

Waveform geometry, time axis, mV, Reference/Difference semantics는 reference style을 이유로 변형하지 않는다.

---

## 2. Alpha 입력 — Common Creative Packet

Alpha 실행 전 다음을 고정한다.

### 2.1 Target

```text
Scene:
Route/state:
Creative Freedom Zone:
3-second goal:
15-second goal:
Next action:
```

예:
- Scene: Attract
- Zone: HIGH
- 3-second goal: ECG 프로젝트임을 즉시 인식 + 비교해 보고 싶게 함
- Next action: same-scene Lab handoff

### 2.2 Baseline

- 기준 commit / release
- 현재 screenshot 또는 live preview
- 유지할 기능
- 불만족 지점
- 이미 승인된 interaction

### 2.3 Data / state invariants

- waveform geometry
- time mapping
- mV
- Input / Output / Reference
- Difference
- replay/live
- method identity
- 실제/합성/저장 자료 표현

### 2.4 Creative Intent

한 문장으로 적는다.

예:
> "ECG 파형을 기술 차트가 아니라 전시 공간의 주 오브젝트처럼 느끼게 한다."

### 2.5 Reference Pack

`17_REFERENCE_SOURCE_REGISTRY.md`에서 보통 2~4 family / 3~8 references.

각 reference에는 `13_REFERENCE...`의 Reference Card가 있어야 한다.

Alpha에는 특히:
- 1~3개의 macro experience/art-direction references
- 필요 시 1~4개의 component/interaction references

를 구분해 전달한다.

### 2.6 Fidelity target

다음 중 하나를 명시한다.

- `STRUCTURAL`: 원리와 구조 중심
- `STRONG_ADAPTATION`: palette/composition/signature UI language까지 강하게 번안
- `NEAR_FINAL`: 실제 제품 후보처럼 component/motion/copy까지 구체화

새 HIGH creative round의 기본은 `STRONG_ADAPTATION`, prototype 직전은 `NEAR_FINAL`.

---

## 3. Alpha 산출물 형식

Alpha는 아래를 **모두** 내야 한다.

### A-01. Concept Sentence

한 문장.

### A-02. Experience Story

```text
0–1 s:
1–3 s:
3–10 s:
User action:
Handoff:
```

시간축이 필요 없는 화면이면 visual reading order로 대신한다.

### A-03. Reference Adaptation Map

| Reference | 정확히 가져올 것 | ECG에서 맡길 역할 | 가져오지 않을 것 |
|---|---|---|---|

단순 URL 목록 금지.

### A-04. Scene Layout Blueprint

- viewport regions
- focal object
- reading order
- plot size priority
- responsive / 1920×1080 behavior

### A-05. Component Inventory

각 component에:
- role
- source/reference
- state
- variants
- interaction
- accessibility
- existing 2.2.1 component 재사용 여부

를 적는다.

### A-06. Interaction / Motion Spec

각 motion에:
```text
ID:
Trigger:
Visual behavior:
Duration:
Easing:
Overlap:
Data surface rule:
Reduced motion:
Failure / fallback:
```

### A-07. Visual System Delta

v2.2.1 대비:
- palette
- typography
- radius
- border
- depth/glow
- icon
- spacing
- cursor
- background
- waveform surrounding treatment

중 무엇이 바뀌는지 명시한다.

### A-08. Data / State Contract

"바뀌지 않는 것"을 구체적으로 적는다.

### A-09. Implementation Blueprint

- 예상 수정 파일/컴포넌트
- 새 component 후보
- state hook
- animation technology
- external component/library 후보
- performance risk
- fallback

### A-10. Validation Plan

- L1 source
- L2 screenshot
- L3 browser/Playwright
- L4 target PC

중 필요한 수준.

---

## 4. Alpha에서 component reference를 쓰는 법

Component source는 creative direction을 평범하게 만드는 안전장치가 아니다.

목적은 **선택된 visual world를 실제 UI detail까지 완성**하는 것이다.

예:
```text
Macro reference:
Land-book / exhibition-style scientific site
→ white space + vertical technical labels + asymmetric grid

Component reference:
Refero / analytics segmented control
→ active method state와 group hierarchy

ECG adaptation:
Method Explorer rail을 동일한 visual language로 구현
```

Component의 exact brand color/text/logo를 복사하지 않는다.

---

## 5. Alpha에서 피해야 할 실패

- generic SaaS dashboard로 회귀
- "구현 가능성"을 이유로 초기에 창의성을 낮춤
- reference를 이름만 적고 실제 시각 특징은 반영하지 않음
- 파형 주변 frame만 바꾸고 scene story는 그대로
- component library를 붙인 뒤 전체 art direction이 분열
- motion을 adjective로만 설명
- 2.2.1 기능을 무조건 현재 위치에 고정

---

## 6. Alpha 완료 gate

다음 질문에 모두 답해야 freeze 가능하다.

1. 사용자가 reference의 어떤 특징이 반영됐는지 알아볼 수 있는가?
2. ECG가 reference의 decorative filler가 아니라 hero object인가?
3. 실제 component/state로 번역됐는가?
4. motion/interaction이 구체적인가?
5. v2.2.1에서 무엇을 보존하는가?
6. 구현자가 추가 디자인 결정을 크게 하지 않고 prototype을 만들 수 있는가?
7. 데이터 hard constraint를 건드리지 않는가?

완료 후 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`의 비교 단계로 보낸다.
