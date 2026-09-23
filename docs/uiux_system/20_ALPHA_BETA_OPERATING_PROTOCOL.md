# Alpha / Beta Creative Operating Protocol

작성 기준: 2026-09-23  
상태: **새 creative round의 기본 비교 프로토콜**  
관련: `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`, `19_BETA_IMAGE_CONCEPT_TRACK.md`

## 0. Alpha/Beta는 Director A/B와 다르다

기존 Dual Director:
- Director A = explicit external reference path
- Director B = Superdesign-native path

새 Alpha/Beta:
- **Alpha = reference-grounded + implementation-aware design track**
- **Beta = reference-grounded + image-first visual concept track**

둘 다 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`과 `17_REFERENCE_SOURCE_REGISTRY.md`를 공통 source layer로 사용한다.

Superdesign은 첫 DUAL-ATTRACT 실사용의 낮은 시안 fidelity 때문에 **새 creative round의 기본 generator에서 제외**한다. 과거 기록/실험을 삭제하지 않으며, 향후 별도 재검증이 있을 때만 optional tool로 돌아올 수 있다.

---

## 1. 공통 목표

Alpha와 Beta의 목적은 서로 반대 스타일을 만드는 것이 아니다.

같은 Creative Intent를 서로 다른 representation으로 탐색한다.

- Alpha: 구조·component·interaction·implementation을 처음부터 함께 설계
- Beta: visual world를 이미지로 먼저 강하게 확인한 뒤 구조로 번역

좋은 결과는 둘이 같은 방향으로 수렴할 수도 있고, 서로 다른 강점을 가질 수도 있다.

---

## 2. Common Creative Packet

두 track에는 동일하게 다음만 제공한다.

```text
Round ID:
Target scene:
Baseline SHA / release:
Current screenshot/live URL:
Creative Freedom Zone:
3-second goal:
15-second goal:
Next user action:
Creative Intent:
Research story/content available:
Hard data/state constraints:
Reference Pack IDs:
Reference Source Families:
Fidelity target:
Output budget:
```

### Research story/content

Attract/Intro/Evidence처럼 연구 스토리를 다루는 경우, 필요하면 `ECG_denoising_method_comparision`의 **검증된 기록**에서:
- 흥미로운 시행착오
- noise/model 비교
- before/after
- methodology insight
- result relationship

을 가져올 수 있다.

원본 연구 기록을 creative copy로 과장하지 않는다.

---

## 3. 실행 순서

### Step 1 — Intent / Reference Freeze

Reference Mining을 수행하고:
- 2~4 source families
- 3~8 concrete references
- Reference Cards

를 고정한다.

### Step 2 — Alpha First Pass

`18_ALPHA...` 계약으로 설계한다.

Alpha 결과를 freeze한다.

### Step 3 — Beta First Pass

운영상 Alpha 다음에 실행해도 되지만, 비교 실험 기본에서는 **Alpha의 구체적 layout/component answer를 Beta prompt에 넘기지 않는다.**

Beta는 같은 Common Creative Packet + Reference Pack에서 독립적으로 이미지 concepts를 만든다.

Beta 결과를 freeze한다.

### Step 4 — Cross Review

이제 처음으로:
- Alpha structure
- Beta stills
- reference provenance
- implementation translation

을 함께 본다.

### Step 5 — User Visual Alignment

사용자는 각 후보에서:
- 반드시 살릴 것
- 거슬리는 것
- 더 과감하게 할 것
- 프로젝트답지 않은 것
- 실제 구현해서 보고 싶은 것

을 표시한다.

### Step 6 — Hybrid Translation

필요하면:
> **Alpha skeleton + Beta art direction**

또는 반대로 Beta composition을 Alpha component/state 구조로 옮긴다.

Hybrid는 "좋은 것 전부 섞기"가 아니다. 한 문장으로 결합 이유를 설명할 수 있어야 한다.

### Step 7 — Validator

`04_VALIDATION_AND_GUARDRAILS.md`로 KEEP/TUNE/REJECT.

### Step 8 — Decision / Change Contract

구현 전 D와 change contract.

### Step 9 — Implementation

Work/Codex/Claude Code에서 actual code.

### Step 10 — Runtime / Target Validation

L2 → L3 → 필요 시 L4.

---

## 4. 공통 평가 기준

Alpha/Beta 비교에는 아래를 공통으로 사용한다.

| 기준 | 질문 |
|---|---|
| Creative Impact | 처음 보는 사람이 멈춰 볼 이유가 있는가? |
| Reference Translation | reference를 쓴 이유가 최종 장면에서 느껴지는가? |
| ECG Identity | 다른 데이터/AI/SaaS 프로젝트로 바꿔도 그대로 성립하는 generic UI는 아닌가? |
| Waveform Centrality | 파형/연구 결과가 hero인가, 장식에 밀리는가? |
| Story Power | 연구의 흥미로운 내용을 장면으로 전달하는가? |
| Near-final Completeness | placeholder mock이 아니라 제품 후보처럼 완성돼 보이는가? |
| Interaction Coherence | hover/reveal/handoff가 화면 의미와 연결되는가? |
| Component Coherence | 버튼/rail/label/legend가 같은 visual language인가? |
| Data Integrity | waveform/time/unit/Reference 의미를 훼손하지 않는가? |
| Implementation Reality | 현재 architecture/performance에서 핵심 인상을 유지할 수 있는가? |
| Accessibility / Reduced Motion | 효과를 줄여도 구조가 성립하는가? |

필요하면 1~5 보조 점수를 붙일 수 있으나 **합산 점수만으로 winner를 자동 결정하지 않는다**.

Hard data violation은 점수와 무관하게 reject/tune 대상이다.

---

## 5. Track별 추가 평가

### Alpha 추가
- implementation blueprint가 충분히 구체적인가?
- component reference가 art direction과 일치하는가?
- 개발자가 새 design decision을 과도하게 다시 해야 하지 않는가?

### Beta 추가
- 이미지가 reference와 실제로 연결돼 보이는가?
- generic AI visual drift가 없는가?
- image-to-implementation gap이 정직하게 기록됐는가?
- still에서 보이는 인상이 실제 motion/component로 번역 가능한가?

---

## 6. 호출 트리거

### Alpha

`Alpha안으로 [scene] 설계해줘.`

의미:
- 18번 문서 전체 실행
- reference adaptation
- component/motion/state/implementation blueprint 포함
- 이미지 생성은 기본 생략

### Beta

`Beta안으로 [scene] 진행해줘.`

의미:
- 19번 문서 전체 실행
- reference-grounded image concept 생성
- image breakdown + component/interaction/motion translation까지
- 이미지 생성에서 끝내지 않음

### Alpha + Beta

`Alpha/Beta 라운드로 [scene] 진행해줘.`

의미:
- Common Creative Packet
- Alpha freeze
- Beta independent first pass
- 둘 다 freeze
- 사용자 요청 없이는 자동 winner 선정/구현하지 않음

### Compare

`Alpha/Beta 결과 비교해줘.`

의미:
- §4 공통 평가 기준
- strength/weakness
- optional Hybrid
- KEEP/TUNE/REJECT 이전의 user alignment

### Promote Beta

`이 Beta 시안을 실제 UI 설계로 승격해줘.`

의미:
- generated still을 source of truth로 쓰지 않고
- B-03~B-09를 강화해 actual component/state/motion/change contract 후보로 변환

### Implement

`확정안을 v2.2.1 기반으로 구현해줘.`

의미:
- D + change contract 확인
- Work/Codex handoff
- 구현/QA
- image pixel copy가 아니라 canonical code/data로 재구성

---

## 7. 산출물 템플릿

### Alpha Round Card

```markdown
# ALPHA-[SCENE]-###

Status:
Baseline:
Target:
Zone:
Creative Intent:

## Reference Pack
## Concept Sentence
## Experience Story
## Reference Adaptation Map
## Scene Layout Blueprint
## Component Inventory
## Interaction / Motion Spec
## Visual System Delta
## Data / State Contract
## Implementation Blueprint
## Validation Plan
## Open Questions
```

### Beta Round Card

```markdown
# BETA-[SCENE]-###

Status:
Baseline:
Target:
Zone:
Creative Intent:
Image fidelity:

## Reference Pack
## Image-specific Reference Extraction
## Concept Briefs
## Generated Stills
## Visual Breakdown
## Component Translation Table
## Interaction Translation Spec
## Motion Storyboard
## Image-to-Implementation Gap
## Implementation Translation
## Validation Plan
## Open Questions
```

### Cross Review Card

```markdown
# AB-[SCENE]-### Cross Review

## Same Common Packet
## Alpha Summary
## Beta Summary
## Common Evaluation
## User Visual Alignment
## Complementary Parts
## Optional Hybrid
## KEEP / TUNE / REJECT
## Decision Needed Before Implementation
```

---

## 8. 환경별 실행

### Chat

주 역할:
- Creative Intent
- Reference Mining
- Alpha 전체 설계
- **Beta image generation**
- generated image visual critique
- Alpha/Beta cross-review
- user alignment
- D/change contract 작성

Chat에서 Beta 이미지를 생성할 때:
- 현재 UI screenshot이 대화에 있으면 source image로 활용 가능
- 없으면 reference feature를 설명으로 grounding
- 결과 이미지의 text/data 정확성은 주장하지 않음

Chat은 실제 repo runtime/build가 필요한 지점에서 Work/Codex로 넘긴다.

### Work

주 역할:
- repo/source 전체 확인
- Alpha implementation
- Beta Translation Packet의 실제 UI 구현
- browser/dev server
- screenshot/video
- Playwright
- multi-file iteration
- QA report

Beta 이미지 자체 생성보다 **이미 확정된 image + translation spec을 구현**하는 역할이 우선이다.

### Codex / Codex Desktop

주 역할:
- local repo implementation
- component integration
- motion implementation
- external component/library feasibility check
- Playwright/build/test
- target-like local browser QA
- screenshot evidence

Codex에는 generated image만 던지지 않는다.
반드시 Beta Round Card의:
- Component Translation
- Interaction Spec
- Motion Storyboard
- Gap register
- Data contract

를 함께 준다.

### Claude Code

project-local skill을 이용할 수 있으면 같은 GitHub 문서 계약을 따른다. Alpha/Beta 전용 skill wrapper가 없어도 18/19/20번을 직접 읽으면 된다.

---

## 9. Environment Handoff Packet

구현 환경으로 넘길 최소 packet:

1. baseline SHA
2. Round ID
3. 18/19/20 중 해당 문서
4. selected Alpha/Beta/Hybrid card
5. Reference Cards
6. current screenshot / generated still
7. Component Translation
8. Motion/Interaction Spec
9. Data/State contract
10. acceptance criteria
11. output branch / PR
12. return evidence requirements

전체 Chat transcript를 기본으로 넘기지 않는다.

---

## 10. Superdesign 상태

첫 `DUAL-ATTRACT-001` 실사용에서:
- Direction Cards 자체는 의미가 있었으나
- generated B01/B02의 reference fidelity와 near-final completeness가 사용자 기대에 크게 못 미쳤다. `[사용자평가]`

따라서 현재 기본 정책:
- NATIVE_DIRECTOR 자동 실행 중지
- CONCRETIZER 자동 실행 중지
- 기존 14/15/16 문서는 역사/재검증용으로 보존
- 새 creative round는 Alpha/Beta가 기본
- Superdesign 재도입은 별도 capability re-test와 사용자 승인 필요

과거 채택을 삭제하거나 당시 판단이 없었던 것처럼 수정하지 않는다.

---

## 11. 운영 기본값

### Attract / Intro / major transition
- Alpha + Beta **둘 다 권장**
- Beta에서 더 과감한 image world 탐색
- Alpha에서 actual component/state 현실화

### Evidence Story
- Alpha 기본 + Beta 선택
- data story grammar는 02/Flourish 선행 가능

### Method Explorer / Lab
- Alpha 우선
- Beta는 큰 art-direction 변화가 필요할 때

### Core waveform inspection
- Alpha만 또는 direct implementation
- Beta 자동 생략

---

## 12. 종료 조건

한 Alpha/Beta round를 완료라고 부르려면:
- 두 track의 상태가 명시되고
- user visual alignment가 기록되며
- image와 implementation truth가 분리되고
- rejected idea가 남고
- implementation 전 D/change contract가 있으며
- 구현 후 필요한 L2/L3/L4 증거가 연결돼야 한다.
