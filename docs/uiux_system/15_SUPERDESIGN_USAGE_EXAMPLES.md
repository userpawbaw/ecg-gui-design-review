# Superdesign 사용 예시 — ECG Signal Studio

상위 기준: `14_SUPERDESIGN_GENERATION_LAYER.md`  
목적: 긴 프롬프트 없이 **언제 generator를 부르고 어떤 결과를 기대할지** 예시로 고정한다.

## 1. 가장 짧은 trigger

### 전체 흐름을 알아서 태우기

> `이 화면 Superdesign 시안 단계까지 진행해줘.`

의미:

```text
MASTER / routing
→ 필요한 경우 Reference Mining
→ Creative divergence
→ hard-constraint prefilter
→ Superdesign 2~4 branches
→ user visual alignment
→ validator
```

### 이미 후보가 있을 때

> `C2, C4, C5를 Superdesign으로 같은 baseline에서 비교해줘.`

### 특정 화면

> `Attract를 현재 2.2.1 기준으로 Superdesign 3안 만들어줘.`

### 결과 화면

> `Evidence story를 Flourish로 관계부터 정한 뒤 Superdesign으로 3안 시각화해줘.`

## 2. Standard Chat에서의 사용

일반 Chat은 Superdesign CLI를 직접 실행하지 않는다.

사용자가:

> `이걸 Superdesign으로 비교해보자.`

라고 하면 Chat은 다음을 만든다.

- target screen
- current baseline commit
- Creative Intent
- Reference IDs
- top candidate directions
- immutable data/UI constraints
- branch count
- validator criteria

그리고 Work/Codex/Claude Code용 handoff를 제공한다.

즉 Chat에서도 **Superdesign 단계까지의 routing과 brief 생성은 동일**하지만 실제 canvas draft generation은 shell 가능한 환경에서 수행한다.

## 3. Work / Codex 예시

Superdesign skill/CLI가 설치된 환경에서:

> `현재 prototype/v2의 Attract를 baseline으로 사용해. docs/uiux_system/00, 01, 13, 14를 먼저 읽고, Reference Mining 결과 REF-02/05/07의 experience principle만 사용해서 3개 branch draft를 Superdesign으로 만들어. waveform geometry와 data contract는 바꾸지 마. 결과에는 canvas/preview 링크와 draft ID를 남기고 구현하지 말고 멈춰.`

핵심은 **생성 후 바로 production code를 바꾸지 않고 review point에서 멈추는 것**이다.

## 4. Claude Code 예시

공식 namespaced plugin을 설치한 경우:

```text
/superdesign:superdesign
현재 prototype/v2 Attract를 기존 codebase 기반으로 재설계해.
프로젝트 docs/uiux_system/00, 01, 13, 14의 제약을 지키고,
REF-02 / REF-05에서 추출한 experience principle을 사용해
같은 baseline에서 3가지 branch direction을 만들어.
production 구현은 하지 말고 canvas/preview 결과까지만.
```

프로젝트 local `superdesign-routing` skill은 이 호출 시점과 project guardrail을 안내하고, vendor skill 자체는 외부 Superdesign plugin이 담당한다.

## 5. Attract 예시

### 목적
3초 안에 `noise → signal → insight`를 느끼게 하되 ECG geometry를 꾸미지 않는다.

### upstream
- Reference Mining
- 필요 시 Creative Production
- expo-ui-art-director

### Superdesign directions

- A: cinematic scientific observatory
- B: editorial big-type signal reveal
- C: restrained premium clinical-tech

### validator 질문
- waveform이 장식 배경처럼 격하되지 않았나?
- first CTA가 3초 안에 이해되나?
- reduced-motion에서도 메시지가 남나?
- core Lab으로 들어갈 때 visual language가 갑자기 끊기지 않나?

## 6. Evidence 예시

### 먼저 하지 말 것
Superdesign에게 raw metric을 주고 `멋있는 차트 만들어줘`라고 하지 않는다.

### 올바른 순서

1. Data Storyteller/Flourish에서 한 문장 insight를 확정
2. visualization grammar 선택
3. Superdesign에서 screen composition을 비교

예:

> `Flourish에서 선택한 Noise×SNR heatmap + 기존 detail table을 유지한다. Superdesign에서 Story→Explore→Table 구조를 3개 composition으로 branch하라. 3D object의 크기를 metric 값으로 사용하지 마.`

## 7. Method Explorer 예시

> `기존 method rail 정보 구조와 기능은 유지하고, method family가 더 잘 느껴지는 3가지 visual organization을 branch해줘. taxonomy가 performance ranking처럼 보이면 안 된다.`

비교 방향 예:
- compact family bands
- node-like taxonomy without metric axes
- editorial grouped rail

## 8. Lab → Evidence transition 예시

Superdesign을 **static screen generator만으로 쓰지 않고 transition key-state 설계**에도 사용할 수 있다.

> `현재 scene이 experiment overview의 한 sample이라는 의미가 느껴지도록 시작/중간/끝 key state 3장을 설계해줘. waveform 자체 morph 금지. spatial continuity만 사용.`

이후 motion-review에서 실제 animation timing/easing을 검증한다.

## 9. 같은 baseline branch 비교 예시

좋은 branch prompt:

- `cinematic, spatial, scientific observatory`
- `editorial data story, bold type, restrained motion`
- `premium clinical instrumentation, minimal but tactile`

나쁜 branch prompt:

- `#00ff88를 쓰고 shadow 16px에 border-radius 12px`

첫 round는 **direction을 비교**하는 단계다. 세부 token은 selected direction에서 refine한다.

## 10. 결과를 받은 뒤 사용자에게 보여줄 형식

```text
Baseline: <commit / screen>
Canvas: <url>

A — Scientific Observatory
Preview: <url>
의도: waveform을 관측 대상처럼 느끼게
Reference: REF-02, REF-07
주의: controls 발견성

B — Editorial Signal Story
Preview: <url>
의도: Noise→Signal narrative를 type/reveal로 전달
Reference: REF-05
주의: 광고적 과장

C — Premium Instrument
Preview: <url>
의도: core workflow를 거의 유지하고 material/spacing/microinteraction만 강화
Reference: ...
주의: surprise가 약할 수 있음

다음: 사용자 visual alignment → validator KEEP/TUNE/REJECT
```

## 11. 사용하지 않는 예

다음에는 Superdesign을 부르지 않는다.

- `y축 레이블을 4px 왼쪽으로`
- `버튼 글자 색이 안 보여`
- `fade 180ms를 150ms로 바꿔`
- `Difference 계산 부호 검증`
- `Playwright가 실패하는 이유 찾아줘`

이런 작업은 현재 design/implementation/QA 도구로 바로 처리한다.

## 12. 첫 실사용 검증 항목

Superdesign을 프로젝트에 채택했더라도 첫 사용에서 다음을 측정한다.

- baseline fidelity
- variant diversity
- reference principle 반영도
- generic SaaS drift 여부
- ECG/data contract 보존
- user가 visual difference를 판단하기 쉬워졌는가
- selected draft를 실제 React UI로 옮기는 비용

첫 실사용 후 D/R 기록을 갱신하고 필요하면 trigger 범위를 줄이거나 늘린다.
