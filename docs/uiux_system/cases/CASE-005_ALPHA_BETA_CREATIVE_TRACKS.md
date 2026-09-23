# CASE-005 — 첫 Creative System Test에서 Alpha/Beta Track으로

작성 기준: 2026-09-23  
상태: **방법론 변경 구현**  
관련 운영 기록: `F-009`, `D-015`, `R-013`; 선행: `F-004`, `D-007`, `R-006`, `D-010`, `R-012`

> 이 CASE는 DUAL-ATTRACT-001의 "어느 Attract 후보가 예뻤는가"를 평가하는 문서가 아니다. 첫 creative orchestration 실사용 뒤 사용자가 무엇을 만족/불만족으로 느꼈고, 그 경험이 왜 Alpha/Beta라는 새 workflow로 이어졌는지 보존한다.
>
> 아래 직접 인용은 현재 Chat에서 확인 가능한 사용자 발화다. 전체 machine-export transcript는 아니며 누락된 부분을 원문처럼 복원하지 않는다.

## 배경

UI/UX 시스템은 여러 단계로 진화했다. CASE-002에서 실제 reference를 visual-intent proxy로 쓰기 시작했고, CASE-003/004에서는 Superdesign을 concrete generator이자 독립 Director B로 확장했다. 첫 DUAL-ATTRACT-001에서는 A가 실제 reference에서 6개 ECG-specific concepts를 만들고, B가 Superdesign prompt search → Direction Cards → 2개 drafts까지 수행했다.

기술적으로 이 실험은 독립 first pass, data guardrail, cross-review를 실제로 시험했다. 그러나 이 시스템의 목적은 방법론 자체를 성공시키는 것이 아니라 **사용자가 원한 더 창의적이고 도전적인 최종 화면을 만드는 것**이다. 첫 결과를 실제로 본 뒤 이 목표와 현재 pipeline 사이의 차이가 선명해졌다. `[대화]` `[사용자평가]`

## 논의 흐름

### 1. 사용자는 v2.2.1 자체를 부정한 것이 아니었다

사용자는 현재 baseline의 의미를 먼저 바로잡았다. `[대화]`

> "2.2.1 버전의 파형 및 각종 버튼/기능 등이 완전 불만족스럽던건 아니야."

파형 비교, 실시간/재생 기능, 기존 control은 버릴 대상이 아니라 capability asset이었다. 부족했던 것은 **처음 보는 사람을 끌어당기는 시각적 충격과 장면성**이었다.

사용자는 작은 수준에서는 단색 파형에 잔광을 더해 모던하게 만들고, 큰 수준에서는 연구 repo의 기록 자체를 story처럼 하나씩 강조하는 초기 화면까지 상상했다. 즉 요구는 "dashboard polish"보다 넓었다. Attract, Transition, Story scene, Compare viewer가 하나의 exhibition experience로 이어져야 했다. `[대화]`

### 2. Awwwards/Godly reference의 목적도 다시 명확해졌다

사용자는 외부 gallery를 단순 inspiration list로 넣고 싶었던 것이 아니다. `[대화]`

> "시각적으로 처음 보는 사람도 흡입시킬 수 있는 그런 충격은 부족했기 때문에 awwwards, godly, minimal galley등 트렌디한 인터렉티브 html의 독창적인 경험을 줄 수 있는 페이지 구성이라거나 화려한 화면전환 및 시각적 효과들이 있으면 좋겠다"

원하는 translation은:
- 화려한 페이지 구성/transition
- reference의 palette와 signature UI
- ECG를 hero object로 치환
- 2.2.1의 실제 waveform viewer를 그 visual world 안에 통합
- 그 다음 button/font/component까지 같은 language로 정교화

였다.

이는 F-009의 "scene-level ambition + reference fidelity" 발견으로 이어졌다.

### 3. Director A는 만족스러웠고 B의 concrete draft는 기대와 달랐다

사용자는 reference source와 차용 지점을 설명하는 Director A의 방식을 긍정적으로 평가했다. 반대로 Director B/Superdesign 시안에는 강한 불만이 있었다. `[사용자평가]`

> "일단 superdesign으로 완성한 시안 자체가 완성도가 너무 낮아."

사용자가 기대한 concrete draft는 reference의 색배합·특징적 UI 요소·해당 theme의 component·hover/motion까지 ECG Attract/Transition에 적용해 **"2.2.1에 넣으면 이렇게 보이겠다"**를 near-final 수준으로 보여주는 것이었다.

하지만 실제 B01 등에 대해서는 reference와의 시각적 연결과 완성도가 약했다고 평가했고, 다음 결론을 제안했다. `[대화]`

> "일단 이전에 네가 직접 만들었던 2.2.1 버전이 훨씬 나았으니 시안 제작기는 쓰지 말아보자."

과거 Superdesign 채택 자체를 삭제하지 않는다. Direction Card, 독립 context, generator 역할 분리에서 얻은 방법론 가치는 남는다. 다만 **현재 프로젝트의 기본 concrete generator로 쓰는 것은 중지**한다.

### 4. AI가 요구를 "더 화려한 UI"가 아니라 네 층으로 재구성

AI는 사용자의 긴 설명을 다음 목표로 구조화했다. `[대화]`

- tool
- exhibit
- story scene
- trendy interactive web experience

가 동시에 필요하다.

또 원하는 결과가 단순 component polish가 아니라:
1. reference world / scene
2. ECG waveform as hero
3. interaction / transition
4. component polish

순으로 내려가야 한다고 정리했다.

사용자는 이 해석을 바탕으로 두 방법을 직접 비교해 보고 싶다고 했다.

### 5. Beta의 새 아이디어 — image는 값싼 visual hypothesis

사용자는 Chat 이미지 생성을 활용하는 새 경로를 제안했다. 핵심은 생성 자체가 아니었다. `[대화]`

> "물론 아무 이미지가 아니라 예시와 관련 아이디어를 기반해서 ECG 프로젝트에 적용되었을 때의 이미지를 말하는거야."

그리고 이미지가 목표가 아니므로:

> "이미지상 각각의 요소에 대해 UI 컴포넌트나 인터렉티브 애니메이션 효과 등이 어떻게 구현되는지는 명확하게 따로 써줘야겠고."

라고 경계를 정했다.

AI는 이를:
- Alpha = implementation-aware
- Beta = image-first but implementation-translated

로 나눴다.

### 6. 사용자가 Alpha/Beta 둘 다 시스템화하도록 승인

AI가 목적, 원칙, 입력, 산출물, 공통 평가, 역할 차이, 운영 방식까지 제시하자 사용자는 전체 구조를 검토한 뒤 두 안 모두 시스템 문서로 먼저 확정하고 trigger/template/environment 실행법까지 정리하라고 요청했다. `[대화]`

이 단계에서 D-015가 실제 방법론 결정이 된다.

## 핵심 대화 근거

판단을 바꾼 핵심 발화는 다음이다. `[대화]`

> "2.2.1 버전의 파형 및 각종 버튼/기능 등이 완전 불만족스럽던건 아니야."

> "일단 superdesign으로 완성한 시안 자체가 완성도가 너무 낮아."

> "물론 아무 이미지가 아니라 예시와 관련 아이디어를 기반해서 ECG 프로젝트에 적용되었을 때의 이미지를 말하는거야."

> "이미지가 목표가 아니니 이미지상 각각의 요소에 대해 UI 컴포넌트나 인터렉티브 애니메이션 효과 등이 어떻게 구현되는지는 명확하게 따로 써줘야겠고."

이 네 문장이 각각:
- baseline 보존
- generator fidelity 문제
- reference-grounded image
- image→implementation translation

을 결정했다.

## 구축된 시스템

이번 작업에서 다음을 추가한다. `[커밋]`

- `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`
- `19_BETA_IMAGE_CONCEPT_TRACK.md`
- `20_ALPHA_BETA_OPERATING_PROTOCOL.md`
- F-009 / D-015 / R-013 / CASE-005
- Master / Creative / Routing / Handoff / Checklist / AGENTS / Reference Mining / Source Registry / Index 업데이트
- Superdesign 14/15/16을 기본 자동 경로가 아닌 역사·명시적 재검증용으로 상태 변경

Alpha 산출물은 Scene Blueprint, Component Inventory, Motion Spec, Data Contract, Implementation Blueprint를 요구한다.

Beta는 generated still 뒤에 Visual Breakdown, Component Translation, Interaction Translation, Motion Storyboard, Image-to-Implementation Gap을 요구한다.

둘은 같은 Common Creative Packet과 Reference Pack을 쓰되 first pass 동안 구체 결과를 공유하지 않고 freeze 뒤 비교한다.

## 사용자가 기여한 것

- 2.2.1의 기능적 가치와 부족한 visual experience를 분리했다.
- 원하는 창의성의 수준을 "더 예쁨"이 아니라 전시형 scene, 연구 story, 강한 reference adaptation으로 구체화했다.
- Director A와 B의 결과를 실제로 비교해 A의 장점과 B 시안의 fidelity 문제를 식별했다.
- Superdesign을 계속 튜닝하기보다 당분간 제외하자고 결정했다.
- image generation을 값싼 시각 가설로 쓰되 UI component/motion spec을 반드시 분리하자는 Beta 원리를 제안했다.
- Alpha와 Beta를 모두 실행해 비교한 뒤 결정하는 실험 구조를 승인했다.

## AI가 기여한 것

- 긴 사용자 경험을 tool/exhibit/story/interactive experience의 네 층과 scene-first design으로 구조화했다.
- Alpha/Beta의 목적·원칙·입력·출력·공통 평가·환경 역할을 contract로 만들었다.
- 이미지가 canonical UI/data가 되지 않도록 image-to-implementation gap과 translation artifact를 설계했다.
- 기존 Reference Mining/Source Registry/record system과 새 tracks를 연결하고 Superdesign 이력을 보존했다.

## 재사용 가능한 AI 사용 패턴

1. 사용자가 "창의적"이라고 할 때 style adjective로 축약하지 말고 **어떤 기존 자산은 유지하고 어떤 experience layer가 부족한지** 분해한다.
2. Reference 기반 결과에서 idea quality와 reference fidelity를 따로 평가한다.
3. 저비용 image generation은 final UI가 아니라 visual hypothesis로 사용한다.
4. 이미지 이후 component/state/motion/data mapping이 없으면 design workflow가 완료되지 않은 것으로 본다.
5. 두 생성 방식은 반대 스타일이 아니라 같은 문제의 서로 다른 representation으로 비교한다.

## 한계

이번 변경은 workflow 문서화다. Alpha/Beta가 실제로 기존 Dual/Superdesign보다 더 좋은 최종 UI를 만든다는 runtime 비교 결과는 아직 없다.

Beta image quality는 scene/reference/prompt와 이미지 모델에 따라 달라질 수 있다. 생성 이미지의 text/data/waveform 정확성은 보장되지 않으며 실제 implementation proof가 아니다.

Alpha는 구현 현실을 너무 일찍 고려해 창의성을 다시 보수화할 위험이 있다. 그래서 HIGH zone에서는 STRONG_ADAPTATION을 기본으로 하고 구현 가능성은 발산 후 구체화 단계에서 조절한다.

Superdesign이 영구 폐기됐다는 의미도 아니다. 첫 프로젝트 실사용에서 사용자 기대에 못 미쳤기 때문에 **기본 자동 경로에서 제외**했으며 별도 re-test가 성공하면 D-015를 재검토할 수 있다.
