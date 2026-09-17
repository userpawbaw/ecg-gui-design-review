# CASE-002 — Reference-Grounded Creative Mining

작성 기준: 2026-09-18  
관련 운영 기록: `F-004`, `D-007`, `R-006`

## 1. 배경

ECG Signal Studio의 UI/UX 개선 시스템은 이미 Creative Art Director와 Validator를 분리하고, Attract/Transition 같은 HIGH creative freedom 영역에서는 Awwwards식 대담한 표현을 허용하도록 설계되어 있었다. 그러나 creative proposal이 실제 사용자 검토 단계로 넘어오면 다른 문제가 생겼다.

AI가 `Signal Observatory`, `Beat Portal`, `Noise Weather` 같은 개념을 설명해도 사용자는 **논리와 목적은 이해할 수 있지만 실제 화면이 주는 느낌까지 정확히 공유하기 어렵다**고 지적했다. `[대화]`

## 2. 문제 제기

초기에는 두 가지 방법이 자연스러워 보였다.

1. 텍스트 설명을 더 길고 구체적으로 쓴다.
2. 아이디어마다 mockup/prototype을 만든다.

사용자는 둘 다 불완전하다고 봤다.

- 텍스트를 길게 써도 실제 visual scene을 공유하지 못한다.
- 발산 단계의 모든 후보를 시안으로 만드는 것은 시간·사용량·구현 비용이 커서 오히려 아이디어 수를 줄이게 된다.

대신 사용자는 **실제 레퍼런스 사이트에서 AI가 어느 부분을 보고 어떤 특성을 차용하려는지 알려주면, 각 제안마다 시안을 받은 것과 비슷하게 느낌을 이해할 수 있다**고 제안했다. `[대화]`

## 3. 판단 변화

이 지적은 reference의 역할을 바꿨다.

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

핵심은 링크 자체가 아니었다. 단순히 Awwwards 링크를 던지면 사용자가 무엇을 봐야 하는지 알 수 없고, 원본 스타일에 과도하게 끌릴 수 있다.

그래서 Reference Card에 다음을 묶었다.

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

`F-004`가 이 발견을 기록하고, `D-007`이 text-only / all-mockup / reference-grounded 세 방법 중 세 번째를 선택한 이유와 되돌림 조건을 기록한다.

## 4. 구축 결과

다음 구조를 프로젝트에 추가했다. `[커밋]`

- `docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`
- `.claude/skills/reference-mining/SKILL.md`
- `00_UIUX_MASTER.md` significant CREATIVE routing
- `05_TOOL_SKILL_ROUTING.md` 자동/제안 trigger
- `expo-ui-art-director`의 reference-mining handoff
- `11_CHECKLISTS.md`의 viewing instruction / imitation-distance check
- `AGENTS.md`의 environment-neutral short trigger

짧은 사용자 명령도 고정했다.

```text
레퍼런스 마이닝 진행해줘.
Reference mining.
Attract 레퍼런스 마이닝.
```

이 명령은 특정 tool 이름보다 **GitHub에 저장된 workflow contract**를 가리킨다. Claude Code가 local skill을 직접 로드할 수 있으면 skill을 사용하고, 같은 skill loader가 없는 Chat/Work/Codex 환경에서는 문서 계약을 읽어 같은 절차를 수행한다.

## 5. 자동 호출 범위

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

이 규칙은 reference mining을 의식 없이 모든 UI 작업에 붙이는 것을 막는다.

## 6. 사용자 기여 / AI 기여

### 사용자 기여
- text-only idea가 논리적으로 이해돼도 visual impression은 공유되지 않는다는 문제를 명확히 했다.
- 모든 후보 mockup은 비용이 높다는 현실적 제약을 제시했다.
- 실제 레퍼런스의 차용 지점을 알려주면 시안과 비슷한 이해 효과를 얻을 수 있다는 해결 방향을 제시했다.
- 이 과정을 한 번의 대화가 아니라 다음 Work/Codex/Claude/Chat에서도 짧은 명령으로 재사용할 수 있게 시스템화할 것을 요구했다.

### AI 기여
- reference를 `visual-intent proxy`로 구조화했다.
- direct link만으로는 부족하므로 viewing instruction과 Reference Card schema를 만들었다.
- 원본 모방을 줄이기 위해 experience-principle translation과 Imitation Distance를 도입했다.
- 기존 Art Director / Validator / Tool Router에 reference mining을 삽입하고 자동/제안/생략 trigger를 정의했다.
- 재사용 방법을 F/D/R 및 project-local skill로 고정했다.

## 7. 재사용 패턴

`R-006`의 재사용 규칙을 요약하면 다음과 같다.

> 추상적인 creative concept을 사용자와 공유할 때 모든 후보를 mockup하지 말고, 실제 reference의 특정 장면을 먼저 visual-intent proxy로 공유한다. 반드시 어디를 볼지, 무엇을 차용하고 무엇을 버릴지, 프로젝트에 어떻게 번역할지까지 명시한다. 그 뒤 상위 후보만 prototype한다.

이 패턴은 UI/UX 외에도 motion design, data storytelling, slide visual direction처럼 **말로 설명할 수는 있지만 결과물의 느낌을 공유하기 어려운 작업**에 이식할 수 있다.

## 8. 한계와 반례

- Reference는 anchoring을 유발할 수 있다. 실제 사례를 너무 일찍 보여주면 아이디어가 원본 주변으로 수렴할 수 있다.
- 링크가 사라지거나 사이트가 redesign될 수 있다. 그래서 핵심 장면 설명과 viewing instruction을 기록에 남겨야 한다.
- Reference Card가 실제 prototype을 완전히 대체하는 것은 아니다. motion timing, layout density, target-PC performance는 L2/L3/L4 검증이 필요하다.
- 사용자가 reference를 보고도 느낌이 불분명한 후보는 mockup 단계로 올려야 한다.
- 프로젝트의 waveform/data contract보다 reference가 우선하지 않는다.

## 9. 성공 판단 기준

이 workflow가 잘 작동하면 사용자는 구현 전에도 다음을 답할 수 있어야 한다.

1. AI가 어느 사이트의 어느 장면을 보고 말하는가?
2. 거기서 어떤 경험 원리를 차용하려는가?
3. 원본에서 무엇은 일부러 가져오지 않는가?
4. ECG 화면에서는 어떤 느낌으로 번역될 것인가?
5. 이 아이디어가 mockup 비용을 쓸 만큼 유망한가?

이 질문이 답되지 않으면 reference mining은 완료된 것이 아니다.
