# Reference-Grounded Creative Mining v1

작성 기준: 2026-09-18  
상태: **Creative reference 탐색과 visual-intent 공유를 위한 운영 규칙**

## Alpha/Beta에서의 적용 (2026-09-23)

새 significant CREATIVE round에서는 이 문서가 **Alpha/Beta 공통 source layer**다.

- Alpha: Reference Card를 실제 scene/layout/component/motion/implementation으로 번역한다.
- Beta: 동일 Reference Card에서 image-specific palette/composition/signature features를 추출해 scene still을 만들고 다시 UI로 번역한다.
- source selection은 `17_REFERENCE_SOURCE_REGISTRY.md`.
- 공통 운영은 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`.

기존 Dual Director 적용 규칙은 DUAL-ATTRACT-001 이력/명시적 재검증에서만 사용한다.

## Dual round에서의 적용 — 역사/재검증용 (2026-09-19)

`16_DUAL_CREATIVE_DIRECTOR.md`로 먼저 route한다. Dual일 때 이 문서는 A 전용이며 A 예산은 5~8 concepts다. 아래 기존 단일 경로의 8~10 권장/shortlist→Superdesign 단계는 Dual first pass에 적용하지 않는다. A는 결과를 동결·반환하고 B 검색/cards/draft를 읽거나 B를 대신 실행하지 않는다. 두 pass 동결 뒤 orchestrator가 cross-review한다. B_ONLY는 이 reference mining 선행조건을 갖지 않는다.

## 1. 목적

이 단계의 목적은 Awwwards나 다른 우수작을 그대로 모방하는 것이 아니다. 실제 reference의 특정 장면을 AI와 사용자가 함께 보면서 **"어떤 느낌을 만들려는가"를 mockup 이전에 공유**하고, 그 장면에서 경험 원리만 추출해 ECG 프로젝트에 재해석하는 것이다.

Reference는 단순 inspiration source가 아니라 **low-cost visual communication proxy**로 사용한다. 아이디어마다 시안을 모두 만들지 않고도 사용자가 원본의 특정 장면을 직접 확인해 제안의 visual intent를 빠르게 이해하도록 한다.

## 2. 짧은 실행 명령

다음 표현은 이 문서의 전체 절차를 실행하라는 명령으로 본다.

- `레퍼런스 마이닝 진행해줘.`
- `Reference mining.`
- `Attract 레퍼런스 마이닝.`
- `Evidence 화면을 더 과감하게 레퍼런스 마이닝해줘.`

대상 화면·문제가 명시되면 그 범위에 집중한다. 범위가 없으면 현재 작업 중인 주요 CREATIVE 과업을 기준으로 한다.

## 3. 자동 호출 / 제안 트리거

### 자동 실행
다음처럼 사용자의 요청 자체가 reference-grounded exploration을 명확히 요구하면 별도 확인 없이 실행한다.

- `Awwwards`, `Godly`, `레퍼런스`, `inspiration`, `이런 느낌`, `비슷한 사례`, `reference mining`
- 새로운 Attract/Intro/Transition/Result Reveal의 **creative direction을 처음 설계**하는 요청
- `더 독창적으로`, `더 놀랍게`, `generic dashboard를 벗어나게`처럼 시각적 방향을 크게 바꾸라는 요청

### 먼저 제안
아래 경우에는 실행 전 한 줄로 제안하고, 사용자가 수락하면 수행한다.

- 중요한 새 CREATIVE 설계인데 visual direction이 아직 텍스트 추상어만 있음
- 서로 다른 후보의 느낌을 사용자가 구분하기 어려워 보임
- 3개 이상 후보 mockup을 만들기 전에 cheaper visual alignment 단계가 유용함

### 생략 가능
- 1~2 px spacing, label, 색상 미세 조정 등 단순 polish
- 이미 visual direction과 reference가 freeze되어 있고 구현/검증만 남은 작업
- 사용자가 reference 조사 없이 바로 구현하라고 명시한 경우

## 4. 전체 파이프라인 — standalone/A-only serial 경로

아래 흐름은 **active Dual first pass 밖에서** 적용한다. Dual의 Director A는 `ECG TRANSLATION → DIVERGENCE 5~8 → FREEZE/RETURN`에서 멈추며 shortlist→Superdesign을 직접 실행하지 않는다.

```text
BASELINE
  ↓
CREATIVE INTENT
  ↓
REFERENCE DISCOVERY
  ↓
REFERENCE CARDS
  ↓
EXPERIENCE PRINCIPLE EXTRACTION
  ↓
ECG TRANSLATION
  ↓
DIVERGENCE 5~10 ideas
  ↓
USER REFERENCE ALIGNMENT
  ↓
SHORTLIST 2~4
  ↓
SUPERDESIGN VISUAL DRAFTS when useful
  ↓
VALIDATOR PASS
  ↓
KEEP / TUNE / REJECT
  ↓
IMPLEMENT / BROWSER VERIFY
  ↓
F / D / R RECORD
```

Reference mining은 `DIVERGE`를 대신하지 않는다. **reference를 grounding으로 삼아 더 넓고 구체적인 divergence를 만든다.**

## 5. Step 1 — Creative Intent

검색 전에 관람객이 무엇을 느끼거나 이해해야 하는지 한 문장으로 적는다.

예:

- Attract: `3초 안에 잡음 속에 생체 신호가 숨어 있고 이 시스템이 그것을 드러낸다는 느낌을 준다.`
- Evidence: `한 장면의 결과가 전체 실험의 어느 위치에 있는지 10초 안에 이해시킨다.`
- Replay → Live: `저장 데이터 재생에서 실제 장치 계측으로 context가 바뀌었다는 것을 설명 없이 느끼게 한다.`

`멋있게`, `Awwwards처럼`만으로 search target을 정의하지 않는다.

## 6. Step 2 — Reference Source 역할

**`17_REFERENCE_SOURCE_REGISTRY.md`를 Alpha/Beta 공통 source-of-truth registry로 사용한다.**

한 플랫폼이나 한 미감에만 의존하지 않는다. Awwwards/Godly는 중요한 creative source지만 Director A 자체를 Awwwards-style director로 정의하지 않는다.

작업마다:
1. Creative Intent를 기준으로 registry에서 2~4 source family를 고른다.
2. 실제 reference는 보통 3~8개만 찾는다.
3. 가능하면 한 domain이 reference set의 50%를 넘지 않게 한다.
4. full-site뿐 아니라 section/component/flow reference도 허용한다.
5. 각 reference에 `Reference Nature`, `Source Family`, `Granularity`, `Evidence Level`을 남긴다.

예:
- Attract → Creative/Experimental + Curated Web + Scientific/Exhibition
- Method Explorer → Product/Component + Curated Web + Scientific
- Evidence → Data Storytelling + Curated Web + Product/Component

플랫폼 이름 자체가 품질 보증은 아니다. 필요한 경험 원리에 맞는 실제 사례를 선택하고, concept gallery를 shipped-product UX evidence로 취급하지 않는다.

## 7. Step 3 — Reference Card

채택한 reference는 최소 다음 필드를 갖는다.

```text
REF-###
Source:
Site / direct URL:
Reference Nature:
Source Family:
Granularity: full-site / scene / section / component / flow
Evidence Level:
Target scene/component:
Viewing instruction:
Unforgettable moment:
Mechanism:
Why it works:
Expected feeling:
ECG translation:
Do NOT copy:
Creative Freedom Zone:
Imitation Distance:
Risk:
Minimal prototype:
```

### Viewing instruction은 필수
링크만 던지지 않는다. 사용자가 **정확히 어디를 봐야 하는지** 지정한다.

예:

- `홈페이지를 열고 첫 0~5초 reveal만 보세요. 아래 section layout은 이번 아이디어와 관계없습니다.`
- `Hero보다 첫 스크롤 이후 두 section이 하나의 공간처럼 이어지는 transition을 보세요.`
- `카드 디자인이 아니라 cursor가 object 근처에서 interaction mode로 바뀌는 방식만 참고합니다.`

가능하면 static screenshot보다 실제 live interaction/video를 우선한다.

## 8. Step 4 — 표면이 아니라 Experience Principle 추출

반드시 다음 변환을 거친다.

```text
Reference Feature
  ↓
Experience Principle
  ↓
Project Meaning
  ↓
Implementation Candidate
```

예:

```text
WebGL sphere
  ↓
depth gives one object strong presence
  ↓
현재 분석 대상 signal을 scene의 중심으로 느끼게 할 필요
  ↓
2D waveform frame에 spatial hierarchy/depth만 적용
```

원본의 object, palette, font, illustration, shader를 그대로 가져오는 것이 기본값이 아니다.

## 9. Imitation Distance

- `0` — 거의 복제
- `1` — appearance 차용
- `2` — layout/mechanism 차용
- `3` — interaction principle 차용
- `4` — abstract experience principle만 차용

프로젝트 기본 목표는 **3~4**다. 0~2를 쓰려면 왜 그 수준의 직접 차용이 필요한지 별도로 설명한다.

## 10. Step 5 — ECG Translation

각 reference마다 다음을 명확히 한다.

1. **어디에 적용하는가** — Attract / Transition / Evidence / Method Explorer / Core Plot 등
2. **무엇을 느끼게 하는가** — 장면에 들어감, 신호 안으로 확대됨, context가 바뀜, 실험 규모가 드러남 등
3. **무엇을 절대 바꾸지 않는가** — waveform geometry, time axis, unit, Reference/Difference 의미, 실제 metric
4. **어떤 표현만 가져오는가** — typography scale, mask reveal, camera/spatial continuity, microinteraction, ambient depth, stage pacing 등

Creative Freedom Zone을 반드시 함께 표시한다.

## 11. Step 6 — 아이디어 발산

Reference를 본 뒤 **최소 5개, 권장 8~10개** 후보를 만든다. 한 reference를 그대로 한 아이디어로 복사하지 않고 서로 다른 reference 원리를 조합할 수 있다.

각 후보 출력 형식:

```text
Idea ID / Name
Goal experience
Reference IDs
What to watch in each reference
Borrowed principles
ECG translation
Expected 3-second impression
Implementation hint
Risk
Prototype cost
Evidence level now (usually L0)
```

가능하면 `정보 구조`, `타이포/스케일`, `공간/깊이`, `motion/choreography`, `microinteraction`, `data storytelling` 축이 한 방향으로만 몰리지 않게 분산한다.

## 12. Mockup 비용을 줄이는 사용법

Reference mining 자체가 mockup 전 단계의 visual alignment다.

```text
5~10 ideas
  ↓
reference를 직접 보고 의도 이해
  ↓
Alpha implementation-aware design
  + Beta image-first scenes (필요 시)
  ↓
두 first pass freeze
  ↓
user alignment / cross-review
  ↓
validator
  ↓
selected real implementation
```

모든 아이디어를 Figma/React/Superdesign 시안으로 만들지 않는다. reference만으로 충분히 reject 가능한 후보는 여기서 줄인다.

Superdesign은 현재 기본 시안 경로가 아니다. first DUAL-ATTRACT test 이후 별도 re-test 승인이 있을 때만 `14/16` 계약으로 사용한다. 기본 visual comparison은 `18/19/20`의 Alpha/Beta를 따른다.

## 13. Validator pass

발산이 끝난 뒤 별도 단계에서 검증한다.

- ECG/data integrity
- task clarity
- accessibility/reduced motion
- performance
- cognitive load
- production UX familiarity
- Expo context fit
- imitation risk / reference anchoring

판정은 `KEEP / TUNE / REJECT`로 하며, unusual하다는 이유만으로 reject하지 않는다.

Reference가 실제 데이터처럼 보이게 하는 장식, waveform을 왜곡하는 3D/perspective, 존재하지 않는 중간 파형 morph는 critical fail이다.

## 14. 도구 라우팅

기본 순서:

- reference discovery: 웹 조사 + `17_REFERENCE_SOURCE_REGISTRY.md`의 task-based source routing
- concept/mood expansion: Creative Production
- concrete visual/component inspiration: 21st.dev류 source가 연결되어 있으면 사용
- **concrete multi-variant screen drafts: Superdesign (shell 환경, 14번 문서 기준)**
- production UX reality check: Product Design / Mobbin
- data story: Flourish
- editable design: Figma
- implementation: Work/Codex/Claude Code
- runtime verification: TinyFish / Playwright / Work browser

도구가 없다고 역할을 포기하지 않는다. 웹 조사 + 이 문서 + project-local skill로 동일 절차를 수행한다.

## 15. 역할 분리

### Reference Miner
- 적절한 reference를 찾고 특정 장면을 지정한다.
- visual surface와 experience principle을 분리한다.
- Imitation Distance를 관리한다.

### Creative Art Director
- reference 원리를 서로 조합해 새로운 ECG-specific concept을 만든다.
- 기존 dashboard 관습을 의심한다.

### Validator
- 프로젝트 계약과 UX/data/motion/accessibility 규칙으로 수렴한다.

한 역할이 동시에 reference를 찾고 즉시 자기 아이디어를 승인하지 않는다.

## 16. 자동 라우팅 규칙

새로운 **중요 CREATIVE 설계**를 시작할 때 다음 순서를 기본으로 한다.

```text
00 MASTER
→ 01 CREATIVE
→ 필요 시 13 REFERENCE MINING
→ expo-ui-art-director
→ validator
```

다음 중 하나면 `13_REFERENCE...`를 자동으로 포함한다.

- Attract/Intro/Transition/Result Reveal을 처음 설계
- Awwwards/독창성/놀라움/새 visual direction 요구
- 아이디어의 느낌을 텍스트만으로 공유하기 어려운 상황

단순 polish에는 자동 포함하지 않는다.

## 17. 기록 규칙

Reference 자체는 F/D/R이 아니다. 그러나 다음 경우 기록한다.

- reference를 쓰는 방식이 판단을 바꿨다 → **F**
- text-only / all-mockup / reference-grounded 중 workflow를 선택했다 → **D**
- AI와 visual intent를 공유하는 재사용 가능한 방법론이 생겼다 → **R**

특히 rejected reference와 rejected idea를 삭제하지 않는다. 다만 reference URL이 사라질 수 있으므로 핵심 장면 설명과 viewing instruction을 기록에 남긴다.

## 18. 성공 조건

이 단계가 성공했다면 사용자는 prototype을 보기 전에도 다음 질문에 답할 수 있어야 한다.

- `AI가 어느 사이트의 어느 장면을 보고 말하는지` 알 수 있는가?
- `그 장면에서 무엇을 차용하고 무엇을 버리는지` 알 수 있는가?
- `결과 UI가 어떤 느낌을 목표로 하는지` 상상할 수 있는가?
- `레퍼런스를 모방한 것이 아니라 프로젝트 의미로 번역했는지` 설명할 수 있는가?

이 네 가지가 불명확하면 reference mining 결과가 부족한 것이다.
