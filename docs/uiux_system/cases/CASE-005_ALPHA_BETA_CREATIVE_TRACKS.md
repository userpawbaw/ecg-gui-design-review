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

## 2026-09-27 추가 — Beta 이미지 생성기를 실측으로 고름 (D-037)

- **문제**: Claude Code에서 Beta를 돌리면 이미지 생성기가 필요하다. `20` §8은 Chat 환경을 가정했다.
- **AI 대응**: Alpha를 보지 않은 별도 에이전트가 콘셉트 5개와 프롬프트를 쓰고, 연결된 Canva로 1장을 시험했다. 판정 BORDERLINE(썸네일만 받을 수 있음, 잡음 속 박동 없음, 커서처럼 읽히는 점).
- **사용자 개입**: "먼저 시험 후 내게 보여줘 … gpt를 이용해서도 한번 뽑아볼꺼고. 두 이미지 모두 품질 미달이면 alpha로만 진행." `[대화]` — 사용자가 같은 프롬프트로 ChatGPT를 돌려 비교 자료를 만들었다.
- **판단 변화**: ChatGPT 결과는 원본 해상도·정확한 문구·잡음 속 박동까지 반영돼 PASS. 생성은 사용자, 프롬프트·분해·번역은 Beta 에이전트로 역할을 나눴다.
- **시스템**: 생성기 선택을 "같은 프롬프트로 두 도구 1장씩 시험 → 같은 기준 표로 비교 → 미달이면 Alpha만" 순서로 고정(BETA-R1-TOOL-TEST §8). 사용자 생성이 들어가도 프롬프트 작성자는 Alpha를 보지 않은 에이전트여야 독립성이 유지된다.

## 2026-09-27 추가 — 사용자 부재 중 "권장안 자동 진행" 분기 (D-038)

- **문제**: 교차 검토 이후(Step 5 사용자 시각 정렬, Step 6 Hybrid, Step 8 결정)는 사용자 판단 자리인데, 사용자가 몇 시간 개입할 수 없었다.
- **사용자 개입**: "새 분기를 쳐서 새 branch에서 내 결정이 있어야 하는 부분은 모두 권장안으로 처리하여 진행해줘. … 완전히 복구 불가능하다고 생각될 경우 … 기존 branch로 돌아와 … 내가 결정할 부분을 직접 하나씩 검토" `[대화]`
- **AI 대응**: 복귀 지점 커밋(`1570dd4`)을 먼저 남기고 새 branch에서 진행. 사용자 판단 자리마다 `AUTOPILOT_DECISIONS.md`에 한 줄(채택·대안·이유·되돌리는 법). Step 5는 "AI 대리 판단"으로 표기하고 사용자 기존 발화만 근거로 삼음. D 기록 상태를 "자동 채택 — 사용자 확인 전"으로 둠.
- **시스템**: 사용자 결정이 막힌 동안에도 작업을 멈추지 않되, (1) 되돌릴 수 있는 지점, (2) 결정마다 되돌리는 법, (3) 대리 판단 표기 — 세 가지를 갖춘 분기에서만 진행한다.

## 2026-09-29 추가 — 구현 결과 피드백 뒤 "공동 구상" 단계 추가 (F-027, D-039, R-017)

- **문제**: 자동 진행 결과(HYB-R1-001)는 게이트 G1–G6를 모두 통과했지만, 사용자가 로컬에서 보니 제목은 프로젝트를 설명하지 못했고, 행성은 이유도 품질도 없었으며, sweep의 잔광·국소 페이드가 빠져 있었다(F-027).
- **사용자 개입 1**: 사용자가 대안 구상을 직접 냈다 — "일반 행성 회전에서 역광으로 전환되는 부분은 최대한 원본에 가깝게 … 전환 대상은 카드가 아니라 사람의 형태와 심장이 보이는 형태로" `[대화]`. 심장 박동과 R 피크 동기, 네온 파형, 스크롤로 잡음 → 깨끗한 신호 투명도 교차까지 구체적으로 제시했다.
- **AI 대응**: 이해 정리 + 타당성 표 + 단계별 계획으로 답했다.
- **사용자 개입 2**: "타당성 검토라기보다는 … 아이디어를 내보라는 말에 가깝겠네. … 나와 같이 진행하는게 더 대담하면서도 구체적으로 아이디어를 발전시킬 수 있을 것 같아." `[대화]`
- **판단 변화**: 화면 구상은 AI가 완성해 제출하는 결과물이 아니라, 사용자와 beat별 선택지를 주고받으며 발전시키는 과정으로 바꿨다. 자동 진행(대리 판단)은 이 단계에 쓰지 않는다.
- **시스템**: `20` Step 5A 공동 구상 세션, `25` S0, 아이디어 보드 `rounds/<R>/IDEA-*.md`, R-017 재사용 규칙.
- **이어서(D-040)**: 사용자가 시안 기준으로 잡음 −5 dB 고정을 정하고 "모두 딥러닝이 우위라면 아예 기법 얘기를 빼도 괜찮아"라는 조건을 달았다. AI는 저장값으로 조건을 확인(−5 dB 1등 전부 딥러닝)해 결정을 확정했다 — 사용자는 방향과 조건, AI는 데이터 확인.
- **한계**: 공동 구상이 AI 단독안보다 나은지는 R1 도입부 구현 결과로 아직 확인되지 않았다.

## 2026-09-30 추가 — 글 요소도 레퍼런스로 설계한다 (F-029, D-043, D-044)

- **문제**: 도입부 파형 무대는 R 동기화가 정확했지만, 사용자가 "그래프 축 없이 … 허전", "아무 표시 없이 … 전환되니까 임팩트가 부족", 라벨이 "너무 흔한 폰트에 아무 효과도 없이 덩그러니 … 싸보이는 감"이라고 지적 `[대화]`.
- **사용자 개입**: 직접 녹화한 레퍼런스(white-desert 세 층 시차, hauntedbouldercity 목록 강조·테마 전환)를 가리키며 "awwward의 대부분의 레퍼런스들에서 … 보통 글자만 저렇게 놓는 경우는 거의 없거든. 어떻게 배치하고 강조할 지 명확한 의도가 있는 디자인들이 많았어." `[대화]`
- **AI 대응**: 녹화 정량 분석(층별 속도비 측정 + 소스 모형으로 검증), 소스 기반 효과 카드(REF-007), 추가 레퍼런스 3개(REF-008–010), 격자·전환·라벨·층 선택지 보드.
- **판단 변화**: 사용자가 네 추천안을 모두 채택하고, "글과 관련된 부분이 있으면 항상 레퍼런스를 탐색해서 … 제시해줘"로 상시 규칙을 만들었다. 게이트(G1–G6)가 데이터 정확성만 보고 글 배치를 보지 않은 것이 F-029의 구조적 원인이었다.
- **시스템**: D-044, `11_CHECKLISTS.md` §14, `20` Step 5A 규칙, AGENTS.md.

## 2026-10-01 추가 — 여러 메시지에 걸친 피드백을 요구 추적표로 묶는다 (D-045, O-007, R-018)

- **문제**: 도입부 품질 검토에서 사용자는 네 메시지에 걸쳐 요구를 냈다(사람 품질이 가장 문제 → 테마는 별개 → 카메라 워크 → 목록화·권장안부터 구현).
- **AI 첫 응답**: 마지막 메시지를 기준으로 "단면 고리 셰이더 + 격자 바닥"을 구현하고 완료로 보고 — 기존 메시를 그대로 둬서 머리·눈·입·손 문제가 남았다.
- **사용자 이의**: "사람 3d 에셋부터 고퀄리티로 다시 만들어달라는 내용이 적용 안되었네 … 네 피드백도 검토가 잘 안된 것 같은데?" / "애초에 눈과 입이 있을 필요가 없는데 들어가 있어서 불쾌해." `[대화]`
- **판단 변화**: 구현 전에 대화 전체를 요구 행(U1–U19, AI 자체 피드백 A1–A13)으로 뽑고, 대체·우회 해결은 ◐로 표시해 먼저 알린다.
- **시스템**: 통합 계획 `rounds/R1/PLAN-R1-INTRO-STORY-V2.md`, R-018.

## 2026-10-02 추가 — 재현이 아니라 원본을 깔고 확장한다 (F-031, D-047, O-008)

사용자 → 초기 AI 응답 → 사용자 반박 → 판단 변경 → 시스템 순서를 보존한다.

**사용자.** 서고 시나리오(D-046)가 "깊이감이 적다"고 느꼈다 `[대화]`. 다락방에서 가져온 것은 기법이 아니라 **공간감**이어야 한다고 했다.

**초기 AI 응답.** 문서만 읽고 일직선 복도·평행 서가·층 부족·원인 오브젝트 쏠림을 진단하고, 깊이를 "원인의 거리"에 매핑하는 안(앙필라드 서고 등 3안)과 책 포털·Ha·Hb를 제안했다. 레퍼런스로 white-desert·moto-card를 본체 후보로 함께 냈다.

**사용자 반박.** REF-002를 제외한 레퍼런스는 "볼거리가 딱히 없다"며 Awwwards·Godly 같은 검증된 큐레이션으로 한정하라고 했다. 또 "재현으로 직접 만들다가 퀄리티에서 손해보는 일 없이 원본을 깔고 발전시켜야" 하며 연습본이라 저작권은 신경 쓰지 않는다고 했다 `[대화]`.

**판단 변경.** (1) 재현 대신 포크 + 이음새 교체로 방향 전환(F-031). (2) 레퍼런스 탐색을 큐레이션 한정으로 다시 했고, 내장 브라우저가 WebGL을 캡처하지 못해 L1 증거임을 명시. (3) moto-card는 본체가 아니라 황동 색인 카드·회전 서가로 안 1에 흡수. (4) 원본 반입이 권한 심사에서 막혀(O-008) 사용자 결정으로 되돌림.

**시스템.** 보드 `rounds/R1/IDEA-R1-SPACE-FORK.md`(wow 배치 지도, Ha/Hb 병렬 사양), 로컬 전용 반입 폴더와 gitignore.

## 2026-10-03 추가 — 원본 위 수직 슬라이스 (D-047, F-032, F-033)

**사용자.** 허용 규칙을 설정에 직접 추가해 원본 반입을 풀었고(O-008), 서고 본체는 AI 추천 3번("갤러리 방 → 하강 → 책 포털")을 "추천대로"로 채택했다 `[대화]`.

**AI.** 원본이 2층 단면(위: 천창 갤러리와 큰 꽃 조형물, 아래: 책장 서재)임을 로드해서 확인했고, 헤더 방이 서고가 아니라는 점을 보고했다. 낮/밤은 구운 텍스처 위 등급 + 램프 풀 + 달빛 재해석으로 성립시켰고(F-032), Hb는 점 구름 심장을 층 실루엣으로 잘라 종이 오려 붙이기로 바꿨다(F-033). 제 오류 셋(fov 단위, `#include` 줄 위치, 생성 문자열의 `
`)을 화면과 콘솔 로그로 잡아 고쳤다.

**시스템.** `prototype/practice/attic-fork`(원본은 로컬 전용), 저장 S038 기록에서 뽑은 R 피크 시계 하나로 Ha·Hb·파형이 같이 뜀.

## 2026-10-04 추가 — "네가 스스로 부족한 점을 짚고 두세 번 고쳐라" (F-035, D-049)

사용자 → 초기 AI 응답 → 사용자 반박 → 판단 변경 → 시스템 순서를 보존한다.

**사용자.** 프레임은 괜찮아졌지만 "책 모델링 업그레이드나 간접조명은 반영이 아예 안 되었고, 파형 맥동도 느낌이 이상하다. 왜 노이즈에 깨끗한 신호가 덮여 있나. 청록광도 디자인이 별로고 차라리 이전 도입부 버전이 깔끔하다. 모델링·효과 디테일이 매번 문제이니 스킬·플러그인을 찾거나, 에셋 조사 단계를 넣거나, 조명·후처리의 우수 관행으로 자체 피드백 루프를 만들어 스스로 두세 번 고쳐라" `[대화]`.

**초기 AI 응답.** 직전 라운드에서는 책을 박스로 짜고 베이직 머티리얼에 가짜 음영을 칠했으며, 파형은 깨끗한 신호를 12% 잔여 알파로 겹쳐 그렸다. 즉 사용자가 지적한 두 가지를 "다음 단계"로 미뤄 둔 상태였다.

**사용자 반박.** 위 인용 — 구현 속도가 아니라 결과의 디테일 품질을 AI가 스스로 책임지라는 요구.

**판단 변경.** (1) 외부 플러그인을 찾았으나 맞는 것이 없어 로컬 루프+스킬로 결정(D-049). (2) 에셋 조사 단계를 정식화하되, 조사 결과(닫힌 단일 셸 책 메시)가 쓸 수 없는 형태이면 폐기하지 않고 **품질 기준 레퍼런스**로 등록. (3) 라운드마다 정지 프레임을 고정 조건으로 찍어 루브릭으로 채점하고 수정 목록을 만든 뒤 재구현 — 3라운드에서 8건을 사용자 전에 잡았다. (4) 점수를 낼 수 없는 항목(모션, 실사용 GPU)은 "미평가"로 남겼다.

**시스템.** `docs/uiux_system/26_LOOKDEV_REVIEW_LOOP.md`, `.claude/skills/lookdev-loop`, `rounds/R1/LOOKDEV-BOOK-STAGE.md`, 레지스트리에 책·재질 에셋 5건(품질 기준 레퍼런스 포함). 핵심 한계: 점수는 AI 자기 평가이며 정지 프레임이라 모션 결함은 못 잡는다.

## 한계

이번 변경은 workflow 문서화다. Alpha/Beta가 실제로 기존 Dual/Superdesign보다 더 좋은 최종 UI를 만든다는 runtime 비교 결과는 아직 없다.

Beta image quality는 scene/reference/prompt와 이미지 모델에 따라 달라질 수 있다. 생성 이미지의 text/data/waveform 정확성은 보장되지 않으며 실제 implementation proof가 아니다.

Alpha는 구현 현실을 너무 일찍 고려해 창의성을 다시 보수화할 위험이 있다. 그래서 HIGH zone에서는 STRONG_ADAPTATION을 기본으로 하고 구현 가능성은 발산 후 구체화 단계에서 조절한다.

Superdesign이 영구 폐기됐다는 의미도 아니다. 첫 프로젝트 실사용에서 사용자 기대에 못 미쳤기 때문에 **기본 자동 경로에서 제외**했으며 별도 re-test가 성공하면 D-015를 재검토할 수 있다.
