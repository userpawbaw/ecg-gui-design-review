# CASE-002 — Reference-Grounded Creative Mining

작성 기준: 2026-09-18  
관련 운영 기록: `F-004`, `F-005`, `F-008`, `D-007`, `D-008`, `D-013`, `R-006`, `R-007`, `R-012`  
대화 발췌 부록: `CASE-002_TRANSCRIPT_EXCERPTS.md`

> **왜 남기나.** 이 CASE는 Reference Mining이라는 기능 명세만 남기기 위한 문서가 아니다. 사용자가 text-only creative proposal의 한계를 어떻게 지적했고, 그 반론이 reference의 역할과 기록 시스템 자체를 어떻게 바꿨는지 나중에 다시 읽을 수 있게 보존한다.
>
> **근거 주의.** 아래 직접 인용은 현재 Chat에서 확인 가능한 발화다. 전체 machine-export transcript는 아니므로 누락된 구간을 원문처럼 복원하지 않는다. 자세한 발췌는 별도 transcript-excerpt 부록을 본다.

## 배경

ECG Signal Studio의 UI/UX 개선 시스템은 이미 Creative Art Director와 Validator를 분리하고, Attract/Transition 같은 HIGH creative freedom 영역에서는 Awwwards식 대담한 표현을 허용하도록 설계되어 있었다. 이후 `Signal Observatory`, `Beat Portal`, `Noise Weather`, `Method Constellation`처럼 기존 v2.2.1 dashboard 문법을 넘어서는 concept을 발산하기 시작했다.

여기서 새로운 병목이 드러났다. AI가 concept의 목적과 구조를 자세히 설명해도 사용자는 실제 화면을 본 것이 아니므로 **제안이 의도하는 시각적 감각·리듬·공간감을 정확히 공유하기 어렵다**고 지적했다. `[대화]`

즉 문제는 아이디어 수 부족이 아니라 **AI와 사용자가 같은 visual intent를 보고 있는지 검증하는 저비용 수단의 부재**였다. → `F-004`.

## 논의 흐름

### 1. Awwwards를 단순 취향 참고가 아니라 creative source로 재정의

사용자는 Awwwards 우수작의 특징을 차용하고, 비슷한 역할을 하는 플랫폼·Plugin·Skill·MCP까지 다시 조사하자고 요청했다. `[대화]`

AI는 Awwwards 화면을 그대로 복사하는 대신, "처음 본 3초가 왜 기억에 남는가"를 typography, spatial composition, staged reveal, motion choreography, depth, microinteraction 같은 **experience principle**로 분해하자고 제안했다. 동시에 Awwwards/Godly, SiteInspire/Land-book, Lapa, CSSDA, Mobbin, 21st 계열의 역할을 발산/분해/flow/검증/구현 참고로 나누는 방향을 제시했다. `[대화]`

이 단계까지는 reference가 여전히 **AI가 아이디어를 얻는 source**라는 성격이 강했다.

### 2. 사용자가 핵심 문제를 다시 정의

사용자는 기존 creative concept을 이해하지 못한 것이 아니었다. 오히려 다음처럼 문제를 정확히 좁혔다. `[대화]`

> "지금까지 해준 제안들이 이해가 안 가는 건 아니지만, 실제로 화면을 본 건 아니니까 어떤 느낌인지는 아리송할 수밖에 없거든."

그리고 모든 후보를 mockup하는 대안의 비용도 바로 지적했다. `[대화]`

> "그렇다고 각 제안마다 시안을 만들어보라고 하기엔 제한적이고."

여기서 사용자가 해결 방향을 직접 제시했다. `[대화]`

> "레퍼런스 사이트에서 어떤 부분을 얘기하고자 하는건지 알려줄 수 있다면 각 제안마다 시안을 받은 것과 동일한 효과를 얻을 수 있을거야."

이 발화로 reference의 역할이 바뀌었다.

기존:

```text
Reference = 아이디어를 얻기 위한 inspiration source
```

변경:

```text
Reference = inspiration source
          + AI와 사람이 같은 visual scene을 공유하는 communication proxy
          + mockup 이전의 low-cost visual prototype
```

### 3. 링크만 주는 것으로는 부족하다는 결론

단순 URL만 전달하면 사용자는 어느 장면을 봐야 하는지 알 수 없고, 원본 appearance에 anchoring될 수 있다. 그래서 각 reference에 다음을 묶는 `Reference Card`를 설계했다. `[추론]`

- direct URL
- **Viewing instruction — 정확히 어느 장면/시간/스크롤/interaction을 볼지**
- unforgettable moment
- reference mechanism
- why it works / expected feeling
- `Reference Feature → Experience Principle → Project Meaning → ECG Translation`
- `Do NOT copy`
- Creative Freedom Zone
- Imitation Distance 0~4
- risk
- minimal prototype

이렇게 하면 사용자는 "이 사이트 전체처럼 만들자는 것"과 "이 장면의 특정 원리만 가져오자는 것"을 구분할 수 있다.

### 4. 일회성 설명이 아니라 short-trigger workflow로 만들기

사용자는 긴 프롬프트를 매번 다시 쓰는 방식도 원하지 않았다. `[대화]`

> "긴 프롬프트를 쓸 필요 없이, 이 단계를 진행하라고 요청하면 네가 제시했던 구체적 진행 스텝을 계획하고 실행할 수 있게끔 바로."

이에 다음 short trigger를 프로젝트 계약으로 고정했다.

```text
레퍼런스 마이닝 진행해줘.
Reference mining.
Attract 레퍼런스 마이닝.
```

이 문구는 특정 제품의 skill-loader 문법이 아니라 **GitHub에 저장된 workflow contract를 가리키는 사용자 명령**이다. Claude Code는 local skill을 직접 사용할 수 있고, 같은 loader가 없는 Chat/Work/Codex는 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`를 읽어 같은 절차를 수행하도록 설계했다. → `D-007` / `R-006`.

### 5. 기록 시스템 자체의 gap도 발견

구현 중 사용자는 이 기록들의 독자를 다시 명확히 했다. `[대화]`

> "시스템을 어떻게 구현하게 되었는지 그 배경 및 논의기록과 관련된 문서는 AI뿐만 아니라 오히려 사용자인 내가 다시 확인할 용도이니, 최대한 흐름을 놓치지 않도록, 필요시 대화 내용도 인용하면서 구체적으로 적어야 해."

저장소를 다시 확인하자 `10_RECORD_KEEPING.md`와 `11_CHECKLISTS.md`는 이미 핵심 발화와 사용자/AI 기여 보존을 요구했지만, `scripts/check-uiux-records.cjs`는 당시 주요 CASE 제목과 F/D/O/R 연결만 검사하고 있었다. 즉 **문서 규칙은 있었지만 자동 강제 수준이 약했다.** `[코드]`

이 gap을 `F-005`, `D-008`, `R-007`로 기록하고, transcript-excerpt 부록과 checker 강화를 추가했다.

## 핵심 대화 근거

이 CASE에서 판단을 실제로 바꾼 핵심은 다음 세 발화다. 전체 흐름과 추가 인용은 `CASE-002_TRANSCRIPT_EXCERPTS.md`에 있다.

> "실제로 화면을 본 건 아니니까 어떤 느낌인지는 아리송할 수밖에 없거든."

> "레퍼런스 사이트에서 어떤 부분을 얘기하고자 하는건지 알려줄 수 있다면 각 제안마다 시안을 받은 것과 동일한 효과를 얻을 수 있을거야."

> "긴 프롬프트를 쓸 필요 없이, 이 단계를 진행하라고 요청하면 네가 제시했던 구체적 진행 스텝을 계획하고 실행할 수 있게끔 바로."

첫 발화는 **visual alignment 문제**, 두 번째는 **reference-as-proxy라는 해결 원리**, 세 번째는 **재사용 가능한 시스템으로의 승급 요구**를 각각 만들었다. `[대화]` `[추론]`

## 구축된 시스템

다음 구조를 프로젝트에 추가했다. `[커밋]`

- `docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`
- `.claude/skills/reference-mining/SKILL.md`
- `00_UIUX_MASTER.md` significant CREATIVE routing
- `05_TOOL_SKILL_ROUTING.md` 자동/제안 trigger
- `expo-ui-art-director`의 reference-mining handoff
- `11_CHECKLISTS.md`의 viewing instruction / imitation-distance check
- `AGENTS.md`의 environment-neutral short trigger
- `CASE-002_TRANSCRIPT_EXCERPTS.md`
- `F-004`, `D-007`, `R-006`
- human-reread 품질 gap을 보완한 `F-005`, `D-008`, `R-007`
- CASE dialogue evidence / contribution split을 검사하는 `scripts/check-uiux-records.cjs`

Reference Mining의 실행 순서는 다음으로 고정했다.

```text
현재 UI / 문제
      ↓
Creative Intent
      ↓
3~8개 concrete references
      ↓
Reference Cards + Viewing Instructions
      ↓
Experience Principle 추출
      ↓
ECG Translation
      ↓
5개 이상 creative divergence
      ↓
사용자 visual-intent 확인
      ↓
Validator
      ↓
KEEP / TUNE / REJECT
      ↓
상위 2~3개 prototype
      ↓
구현 / browser verification / F-D-R 기록
```

자동 호출 범위도 나눴다.

### 자동 실행
- Awwwards/reference/inspiration을 사용자가 명시
- 새 Attract/Intro/Transition/Result Reveal의 creative direction 설계
- `더 독창적`, `더 놀랍게`, `generic dashboard를 벗어나게`처럼 visual language 자체를 흔드는 요청

### 먼저 제안
- 중요한 CREATIVE 설계인데 visual direction이 추상적이고 여러 mockup 전에 cheaper alignment가 유용한 경우

### 생략
- 미세 polish
- 이미 reference와 visual direction이 freeze된 구현
- 사용자가 reference 조사 없이 바로 구현하라고 한 경우

### 사용자 기여
- text-only idea가 논리적으로 이해돼도 visual impression은 공유되지 않는다는 문제를 명확히 했다.
- 모든 후보 mockup은 비용이 높다는 현실적 제약을 제시했다.
- 실제 레퍼런스의 차용 지점을 알려주면 시안과 비슷한 이해 효과를 얻을 수 있다는 해결 방향을 제시했다.
- 긴 프롬프트가 아니라 short trigger로 재사용할 수 있어야 한다고 요구했다.
- 기록 문서는 AI보다 자신이 다시 읽는 용도도 크므로 논의 흐름과 핵심 대화가 압축되어 사라지면 안 된다고 재확인했다.

### AI 기여
- reference를 `visual-intent proxy`로 구조화했다.
- direct link만으로는 부족하므로 viewing instruction과 Reference Card schema를 만들었다.
- 원본 모방을 줄이기 위해 experience-principle translation과 Imitation Distance를 도입했다.
- 기존 Art Director / Validator / Tool Router에 reference mining을 삽입하고 자동/제안/생략 trigger를 정의했다.
- 저장소 규약과 checker의 차이를 다시 비교해 human-reread enforcement gap을 식별하고 기록/검사를 강화했다.

## 재사용 가능한 AI 사용 패턴

`R-006`의 재사용 규칙을 요약하면 다음과 같다.

> 추상적인 creative concept을 사용자와 공유할 때 모든 후보를 mockup하지 말고, 실제 reference의 특정 장면을 먼저 visual-intent proxy로 공유한다. 반드시 어디를 볼지, 무엇을 차용하고 무엇을 버릴지, 프로젝트에 어떻게 번역할지까지 명시한다. 그 뒤 상위 후보만 prototype한다.

`R-007`은 기록 쪽 규칙을 추가한다.

> AI 협업 방법론 문서는 다음 AI가 읽을 수 있는 provenance에서 끝내지 않는다. 사용자가 다시 읽었을 때 문제 제기·반론·판단 변화가 복원돼야 하며, 중요한 원문이 있으면 짧게 인용한다.

이 패턴은 UI/UX 외에도 motion design, data storytelling, slide visual direction처럼 **말로 설명할 수는 있지만 결과물의 느낌을 공유하기 어려운 작업**에 이식할 수 있다.

성공했다면 사용자는 구현 전에도 다음을 답할 수 있어야 한다.

1. AI가 어느 사이트의 어느 장면을 보고 말하는가?
2. 거기서 어떤 경험 원리를 차용하려는가?
3. 원본에서 무엇은 일부러 가져오지 않는가?
4. ECG 화면에서는 어떤 느낌으로 번역될 것인가?
5. 이 아이디어가 mockup 비용을 쓸 만큼 유망한가?

## 한계

- Reference는 anchoring을 유발할 수 있다. 실제 사례를 너무 일찍 보여주면 아이디어가 원본 주변으로 수렴할 수 있다.
- 링크가 사라지거나 사이트가 redesign될 수 있다. 그래서 핵심 장면 설명과 viewing instruction을 기록에 남겨야 한다.
- Reference Card가 실제 prototype을 완전히 대체하는 것은 아니다. motion timing, layout density, target-PC performance는 L2/L3/L4 검증이 필요하다.
- 사용자가 reference를 보고도 느낌이 불분명한 후보는 mockup 단계로 올려야 한다.
- 프로젝트의 waveform/data contract보다 reference가 우선하지 않는다.
- transcript-excerpt는 현재 Chat에서 확인한 핵심 발췌이지 전체 machine-export transcript가 아니다. 따라서 "전체 대화 보존"으로 과장하지 않는다.
- checker는 구조와 evidence marker를 확인할 뿐, 실제 서사가 충분히 좋은지는 사람이 최종 확인해야 한다.

## 2026-09-20 후속 — Awwwards 중심 source list에서 Reference Source Registry로

첫 Dual Attract 실험에서 Director A는 실제 reference를 명시하는 방식으로 6개 방향을 만들었고, 사용자는 이 A의 creative direction 자체가 마음에 들었다고 평가했다. 이후 Land-book, Minimal Gallery, Refero, Mobbin, Behance/Dribbble, NN/g 등 추가 source를 제시하면서도 **B와 반대로 만들기 위해 A를 UX-only로 좁히려는 의도가 아님**을 분명히 했다. `[대화]`

> "디렉터 B의 결과와 반대로 만들겠다고 일부러 UX에만 집중하게끔 하고 싶지는 않네."

> "혹시 awwwards에만 집중하고 있다면 그걸 방지하기 위해 위의 사이트를 제시했던 거였어."

이 발화로 Director A의 정체성을 다시 확인했다. A는 Awwwards 미감 전담도, UX 전담도 아니다. **외부 reference의 provenance를 사용자가 직접 확인할 수 있는 creative director**다. B와의 차이는 결과 스타일이 아니라 information diet와 provenance/generation process다. `[추론]`

이에 `17_REFERENCE_SOURCE_REGISTRY.md`를 추가했다. Creative/Experimental, Curated Web/Art Direction, Visual Concept/Case Study, Product/Component/Flow, UX Evidence, Scientific/Exploratory, Data Storytelling으로 source를 나누고, task마다 2~4 family와 3~8 references만 선택한다. full-site뿐 아니라 section/component/flow도 Reference Card로 사용할 수 있으며 `Reference Nature`와 granularity/evidence를 기록한다. `[커밋]`

이 확장은 기존 Reference Mining 원리를 교체하지 않는다. 오히려 `URL → Viewing instruction → Principle → ECG Translation` 계약을 더 다양한 source scale에 적용한다. 현재 `DUAL-ATTRACT-001`의 frozen A/B 결과에는 소급 적용하지 않고 다음 creative round부터 사용한다.
