# Reference Source Registry v1

작성 기준: 2026-09-20  
상태: **명시적 reference 탐색의 공통 source registry — Alpha/Beta 공용**  
상위 계약: `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`, `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`, `19_BETA_IMAGE_CONCEPT_TRACK.md`, `20_ALPHA_BETA_OPERATING_PROTOCOL.md`

## 1. 목적

이 registry는 특정 미감(Awwwards식, UX-only 등)을 담당하지 않는다. 기존 Director A에서 시작했으며 2026-09-23 이후 Alpha/Beta의 공통 source layer로 확장한다.

공통 정체성은:

> **실제 외부 reference를 명시하고, 사용자가 직접 원본을 볼 수 있게 하며, 그 reference의 어떤 장면/컴포넌트/원리를 ECG UI에 어떻게 번역했는지 설명 가능한 source layer**

다.

Alpha는 이 source를 실제 component/state/motion 구조로 번역하고, Beta는 같은 source를 image concept으로 먼저 시각화한 뒤 다시 UI 구조로 번역한다.

따라서 이 registry의 목적은 Awwwards 의존도를 줄이되 A의 기존 강점인 과감한 creative exploration을 약화시키지 않고, **서로 다른 종류의 reference vocabulary를 넓히는 것**이다.

과거 Director A/B 차이는 이 문서의 이력이다. 새 Alpha/Beta의 차이도 "화려함 vs UX"가 아니다.

- Alpha: explicit provenance + implementation-aware structure
- Beta: explicit provenance + image-first scene exploration + implementation translation

둘 다 과감하거나 절제될 수 있다.

## 2. 기본 운영 원칙

1. 모든 source를 매번 검색하지 않는다.
2. 과업마다 **2~4 source family**, 실제 사이트/사례는 보통 **3~8개**만 선택한다.
3. 동일 family만으로 reference set을 채우지 않는다.
4. full-site reference와 component/flow reference를 모두 허용한다.
5. concept gallery를 shipped-product evidence로 취급하지 않는다.
6. UX research source는 creative idea를 금지하는 gate가 아니라 **cheap sanity check / principle source**다.
7. 최종 승인권은 Validator에 있다.
8. 현재 DUAL-ATTRACT-001의 A/B first pass에는 소급 적용하지 않는다. 이 registry는 **다음 creative round부터** 기본 적용한다.

## 3. Reference Nature 태그

Reference Card에 가능하면 다음 nature를 기록한다.

| 태그 | 뜻 | 사용할 수 있는 주장 |
|---|---|---|
| `LIVE_WEBSITE` | 실제 동작 중인 웹사이트 | 현재 관찰 가능한 화면/interaction |
| `SHIPPED_PRODUCT` | 실제 배포 제품/앱 화면 | production pattern의 존재 |
| `CURATED_SCREEN` | 큐레이션된 screenshot/section | visual/composition inspiration |
| `CONCEPT_ONLY` | concept shot / speculative design | 발상·미감 inspiration만 |
| `CASE_STUDY` | 설계 과정/브랜딩/UX case study | 문제 framing과 design rationale |
| `RESEARCH` | UX 연구/가이드/논문 | 원칙/위험/검증 근거 |
| `COMPONENT_LIBRARY` | 컴포넌트/패턴 중심 source | 구체 UI pattern 후보 |

Nature는 품질 점수가 아니다. **무엇을 근거로 주장할 수 있는지 제한하는 provenance 태그**다.

## 4. Source Families

### A. Creative / Experimental

대표:
- Awwwards
- Godly
- CSS Design Awards
- FWA 또는 동급 experimental web award/gallery

주로 찾을 것:
- wow moment
- unusual composition
- cinematic transition
- WebGL/3D presence
- large-type staging
- interactive hero
- memorable state change

좋은 대상:
- Attract
- Intro
- Replay→Live
- Lab→Evidence
- Result Reveal

위험:
- marketing/portfolio bias
- core data surface에 과도한 motion/3D를 끌고 올 위험

### B. Curated Web / Art Direction

대표:
- Land-book
- Minimal Gallery
- SiteInspire
- Lapa Ninja

주로 찾을 것:
- typography
- editorial hierarchy
- grid/spatial composition
- section design
- hero/CTA/features/stats 구성
- motion preview / transition
- restrained premium web language

특히 Land-book은 전체 website뿐 아니라 section, Motion, Headlines 등 **더 작은 단위의 reference**를 찾는 데 활용한다.

좋은 대상:
- Attract
- Evidence Story
- Method summary
- explanatory panel
- CTA / information grouping

위험:
- landing-page convention이 application UI를 과도하게 지배할 수 있음

### C. Visual Concept / Case Study

대표:
- Behance
- Dribbble

주로 찾을 것:
- speculative composition
- branding
- unusual visual metaphor
- UI concept
- full project presentation
- design-system case study

좋은 대상:
- 초기 creative divergence
- visual identity
- exhibition composition
- unusual data framing

기본 nature:
- Behance: `CASE_STUDY` 또는 `CONCEPT_ONLY`를 개별 확인
- Dribbble: `CONCEPT_ONLY` 가능성을 기본 경계

금지:
- concept shot이 실제 제품에서 검증된 UX라고 주장하지 않는다.

### D. Product / Component / Flow

대표:
- Refero
- Mobbin
- Screenlane
- UI Sources
- 필요 시 21st.dev류 component source

주로 찾을 것:
- tabs
- sidebars
- cards
- data tables
- charts surrounding UI
- modal / drawer
- search/filter
- onboarding
- mode switching
- comparison
- state transitions
- full user flow

좋은 대상:
- Lab
- Method Explorer
- Evidence controls
- navigation
- filter/state UI
- component-level polish

특징:
- A는 이 source도 **creative material**로 사용할 수 있다.
- 다만 "실제 앱에서 쓰인다"와 "우리 UX에 적합하다"는 같은 문장이 아니다. 후자는 Validator가 판단한다.

### E. UX Evidence / Principle

대표:
- Nielsen Norman Group (NN/g)
- UX Collective는 supplementary discovery/article source

주로 찾을 것:
- usability principle
- progressive disclosure
- navigation/findability
- cognitive load
- visibility of system status
- error prevention
- motion/accessibility 관련 known risk

사용 위치:
- Director A가 후보를 만들기 전/후의 **cheap sanity check**
- Validator가 후속 검증할 질문을 만드는 근거

주의:
- NN/g를 creative gate로 사용해 HIGH zone 아이디어를 조기에 보수화하지 않는다.
- UX Collective는 practitioner article source이며 authority를 자동 상향하지 않는다.

### F. Scientific / Exploratory / Exhibition

대표:
- NASA Eyes
- Bartosz Ciechanowski류 interactive explanation
- science museum / exhibition interactives
- 의료/신호 관측 UI 중 실제 의미를 보존하는 사례

주로 찾을 것:
- overview→detail
- scale continuity
- spatial exploration
- instrumentation metaphor
- explain-by-interaction
- observation mode

좋은 대상:
- Signal Observatory
- Beat/segment inspection
- Lab→Evidence scale change
- Expo explanatory interaction

### G. Data Storytelling / Editorial Data

대표:
- The Pudding
- Flourish examples/gallery
- Observable류 interactive data examples
- editorial data journalism

주로 찾을 것:
- one insight per scene
- progressive narrative
- small multiples
- annotations
- transitions that explain data
- Story→Explore→Table 구조

좋은 대상:
- Evidence
- experiment summary
- method/noise/SNR relationship
- result reveal

주의:
- visualization grammar 자체를 확정할 때는 `02_DATA_STORYTELLING.md`와 Flourish/Data Storyteller가 우선한다.

## 5. Task → Source Family Router

### HIGH: Attract / Intro / major transition

기본 후보:
- Creative / Experimental
- Curated Web / Art Direction
- Scientific / Exhibition

선택적:
- Product / Component — CTA/interaction state가 중요할 때
- Data Storytelling — 결과 메시지를 바로 보여주는 intro일 때

### HIGH/MEDIUM: Evidence Story

기본 후보:
- Data Storytelling
- Curated Web / Art Direction
- Scientific / Exploratory

선택적:
- Product / Component — filter/table/details
- Creative / Experimental — chapter transition/reveal

### MEDIUM: Method Explorer / Navigation / Result Cards

기본 후보:
- Product / Component / Flow
- Curated Web / Art Direction

선택적:
- Scientific / Exploratory
- Creative / Experimental — HIGH freedom subsection일 때

### LOW: waveform inspection / axes / Reference / Difference

기본:
- Product / Component
- Scientific / instrumentation

creative gallery는 필요할 때만 보조한다. core plot geometry는 reference로 변경하지 않는다.

## 6. Full Experience Reference와 Component Reference

A는 두 scale 모두 사용할 수 있다.

### Level 1 — Experience Reference

예:
```text
NASA Eyes
→ overview → detail
→ current 10 s ECG → selected beat/scene
```

Reference Card에는 반드시 target scene과 viewing instruction을 적는다.

### Level 2 — Component Reference

예:
```text
Refero / Land-book section
→ active item hierarchy / segmented control / sidebar grouping
→ Method rail의 family + active method 표현
```

Component Reference Card에도 최소 다음을 적는다.

- Source / direct URL
- Nature
- Target component/section
- Viewing instruction
- Borrowed principle
- ECG target
- Do NOT copy
- Imitation Distance
- Risk

## 7. Source Selection Budget

한 creative task에서 권장:

- source family: 2~4
- 실제 reference: 3~8
- 같은 source domain에서 가져오는 reference: 기본 최대 2개
- 한 source가 전체 reference set의 50%를 넘지 않게 노력

예외:
- 사용자가 특정 source/domain을 명시적으로 집중 요청
- 매우 좁은 component problem
- live reference 접근 실패로 대체 source가 부족

목표는 기계적 균등 배분이 아니라 **Awwwards나 어느 하나의 gallery에 자동 anchoring되는 것을 막는 것**이다.

## 8. Reference Card 추가 필드

기존 13번 Reference Card에 다음을 추가한다.

```text
Reference Nature:
Source Family:
Granularity: full-site / scene / section / component / flow
Evidence Level:
```

Evidence Level은 기존 프로젝트 근거 규칙과 함께 사용한다. 실제 browser interaction을 보지 않았으면 본 것처럼 서술하지 않는다.

## 9. Source별 기본 역할 요약

| Source | Family | 강점 | 기본 위험 |
|---|---|---|---|
| Awwwards | Creative | 강한 interaction / wow / motion | portfolio bias |
| Godly | Creative | experimental / current visual ideas | novelty bias |
| Land-book | Curated Web | site + section + motion + typography | landing bias |
| Minimal Gallery | Curated Web | restrained/minimal art direction | 과도한 절제 |
| SiteInspire | Curated Web | typography/editorial/layout | static bias |
| Lapa Ninja | Curated Web | full-flow/motion observation | landing bias |
| Behance | Concept/Case Study | project narrative, branding, concept | shipped 여부 불명확 |
| Dribbble | Concept | 빠른 visual divergence | shot-first / UX evidence 약함 |
| Refero | Product/Component | product screen/flow/component reference | product convention bias |
| Mobbin | Product/Flow | production app patterns/flows | originality가 낮아질 수 있음 |
| Screenlane | Product/Screen | app UI pattern | 범위/접근성 변화 가능 |
| UI Sources | Product/Flow | interaction flow 중심 | availability/access 변화 가능 |
| NN/g | UX Evidence | usability principle/research | creative source로 직접 쓰면 보수화 |
| UX Collective | UX Articles | practitioner framing/discovery | authority 편차 |
| NASA Eyes | Scientific | exploration/scale/context | 3D surface를 잘못 복제할 위험 |
| The Pudding | Data Story | editorial data narrative | narrative가 data보다 앞설 위험 |
| Flourish examples | Data Story | visualization grammar/interactive story | final app source of truth 아님 |

## 10. A/B 독립성과의 관계

이 registry는 Director A만 사용한다.

Dual first pass에서 Director B에게 다음을 전달하지 않는다.

- A가 선택한 source family
- 구체 source/domain
- Reference Card
- A 후보 아이디어
- A 선호

B는 `16_DUAL_CREATIVE_DIRECTOR.md`와 `14_SUPERDESIGN_GENERATION_LAYER.md`의 clean packet만 사용한다.

Cross-review 이후에는 A/B provenance를 함께 볼 수 있다.

## 11. 운영 예

### Attract

```text
Creative Intent:
3초 안에 ECG 비교라는 사실과 "관찰할 가치가 있다"는 인상

Router:
Creative/Experimental
+ Curated Web
+ Scientific/Exhibition

References:
Awwwards 1
Land-book 1~2
NASA/museum 1
Minimal Gallery 1 (필요 시)
```

### Method Explorer

```text
Creative Intent:
14개 방법을 메뉴가 아니라 이해 가능한 family 구조로 탐색

Router:
Product/Component
+ Curated Web
+ Scientific

References:
Refero 1~2
Mobbin/Screenlane 1
Land-book section 1
scientific taxonomy/explorer 1
```

### Evidence

```text
Creative Intent:
한 scene의 결과가 전체 experiment와 어떻게 연결되는지 이해

Router:
Data Storytelling
+ Curated Web
+ Product/Component

References:
The Pudding 1
Flourish/Observable 1
Land-book 1
Refero/Mobbin 1
```

## 12. 유지보수

- source가 사라지거나 성격이 크게 바뀌면 registry를 갱신한다.
- 새 source는 "유명해서"가 아니라 기존 family가 못 채우는 **고유 역할**이 있을 때 추가한다.
- 실제 사용에서 반복적으로 가치가 없으면 제거/secondary로 내린다.
- Registry 업데이트 자체는 Director A의 과거 frozen experiment를 소급 수정하지 않는다.
