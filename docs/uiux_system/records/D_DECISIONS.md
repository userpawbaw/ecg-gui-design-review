# D — UI/UX Decisions

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"다르게 골랐다면 경험·구현·검증 결과가 의미 있게 달라졌는가?"**

---

## D-001. Creative Art Director와 Validator를 분리한다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` |
| 상태 | 유효 |
| 연결 | F-001, R-001 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
한 AI/한 규칙 집합이 처음부터 "창의적이되 절대 위험하지 않게" 모든 판단을 수행하게 할지, **발산과 검증을 별도 역할로 분리할지** 정해야 했다.

### 검토한 선택지
1. 하나의 보수적 adviser가 아이디어와 검증을 동시에 수행
2. Creative Art Director가 대담한 후보를 만들고 Validator가 data/UX/motion 기준으로 수렴

### 고른 것과 근거
2번. 초기 단계부터 검증 규칙을 강하게 적용하면 평범한 dashboard 해법으로 수렴하기 쉽다. 반대로 Creative 계층에 최종 결정권을 주면 과장 위험이 있다. 역할을 분리하면 두 문제를 동시에 줄일 수 있다. `[추론]`

### 버린 것과 이유
1번은 안전하지만 사용자가 실제로 느낀 capability gap인 **창의적 발산 부족**을 해결하지 못할 가능성이 높아 버렸다.

### 되돌려야 하는 조건
Creative 단계가 반복적으로 프로젝트 제약을 무시해 후보 생성 비용만 늘어나거나, 별도 역할 분리가 실제 작업에서 의미 있는 다양성을 만들지 못한다는 증거가 쌓이면 통합한다.

---

## D-002. Creative Freedom Zone으로 표현 강도를 나눈다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` |
| 상태 | 유효 |
| 연결 | F-002 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
Awwwards/high-motion 표현을 전반적으로 배제할지, Expo 특성을 이유로 전체 화면에 적극 적용할지 정해야 했다.

### 검토한 선택지
- 전면 제한: 의료/신호 UI라는 이유로 전체 화면을 보수적으로 유지
- 전면 허용: Expo first impression을 위해 high-motion language를 광범위 적용
- 구역 분리: task criticality에 따라 HIGH / MEDIUM / LOW 자유도

### 고른 것과 근거
구역 분리. Attract/Intro/Context transition은 감성 표현이 정보 전달을 돕지만, waveform/axis/Reference/Difference는 오해 비용이 크다. `[대화]` `[추론]`

### 버린 것과 이유
전면 제한은 전시 가치가 낮고, 전면 허용은 signal/data integrity 위험이 크다.

### 되돌려야 하는 조건
실제 관람객/target-PC 검증에서 HIGH zone motion이 task 진입을 늦추거나 피로·혼동을 유발하면 강도를 낮춘다.

---

## D-003. Flourish는 최종 성능 source가 아니라 Data Storytelling Exploration Engine으로 쓴다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` |
| 상태 | 유효 |
| 연결 | F-003 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
Flourish를 단순 차트 생성 보조로 두거나, 결과 화면을 통째로 Flourish에 맡기거나, **데이터 관계를 탐색하는 전 단계 도구**로 쓸 수 있었다.

### 검토한 선택지
1. 사용하지 않거나 단순 참고만 함
2. Flourish output을 최종 앱 visualization으로 직접 사용
3. insight/story에 맞는 표현 후보를 탐색하고 최종 표현은 프로젝트 계약에 맞춰 결정

### 고른 것과 근거
3번. editable interactive visualization의 장점은 빠른 후보 탐색에 있고, 원본 데이터 계약·ECG 시간축·접근성·앱 architecture는 별도 검증이 필요하다. `[플러그인]` `[추론]`

### 버린 것과 이유
2번은 도구 결과가 프로젝트 source of truth처럼 굳을 위험이 있어 버렸다.

### 되돌려야 하는 조건
Flourish embed가 실제 앱의 접근성·offline·성능·배포 요구를 모두 충족하고 유지비가 더 낮다는 근거가 생기면 일부 직접 사용을 재검토한다.

---

## D-004. Chat을 Design Brain으로, GitHub를 Durable Memory로, Work/Codex를 실행 환경으로 둔다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` |
| 상태 | 유효 |
| 연결 | F-001, O-001, R-004 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
UI/UX 논의를 Work/Codex로 완전히 이전할지, Chat에서 설계와 피드백을 유지할지 정해야 했다.

### 검토한 선택지
- 모든 것을 Work/Codex에서 수행
- 모든 것을 Chat에서 수행
- Chat = 기획/비판/조율, GitHub = 정확한 장기 기억, Work/Codex = 빌드/브라우저/장시간 실행 필요 시 handoff

### 고른 것과 근거
세 번째. 디자인 판단은 긴 대화와 비교가 중요하고, 실행 반복은 Work/Codex가 강하다. 정확한 수치·승인 상태는 Chat memory보다 GitHub가 안정적이다. `[대화]` `[추론]`

### 버린 것과 이유
한 환경에 모든 책임을 몰아넣으면 either reasoning continuity 또는 execution ergonomics 중 하나를 희생한다.

### 되돌려야 하는 조건
Chat이 필요한 repo/plugin/runtime 정보를 안정적으로 가져오지 못하거나 handoff 비용이 설계 이득보다 커지면 작업 단계별 중심 환경을 재조정한다.

---

## D-005. 외부 Skill/Plugin은 task router를 통해 필요한 것만 사용한다

| | |
|---|---|
| 시점 | UI/UX orchestration system v1, commit `c499516` `[커밋]` |
| 상태 | 유효 |
| 연결 | F-001 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
설치된 모든 Plugin/Skill을 매 작업에 호출할지, 작업 유형별로 필요한 capability만 선택할지 정해야 했다.

### 검토한 선택지
- 상시 전체 로딩: 누락은 적지만 context/tool complexity가 증가
- 수동 선택: 사용자가 매번 도구를 지시해야 함
- `05_TOOL_SKILL_ROUTING.md`를 기준으로 task type에 따라 자동 선택

### 고른 것과 근거
세 번째. `CREATIVE / DATA / MOTION / UX / IMPLEMENTATION / RESEARCH` 분류 후 최소 관련 문서·도구만 로드한다. `[커밋]`

### 버린 것과 이유
상시 전체 로딩은 도구가 목적이 되는 과잉 workflow를 만들고, 수동 선택은 사용자가 routing 비용을 계속 부담한다.

### 되돌려야 하는 조건
라우터가 자주 필요한 도구를 누락하거나 routing overhead가 커지면 category를 단순화한다.

---

## D-006. 운영 기록(F/D/O/R)과 방법론 CASE를 분리한다

| | |
|---|---|
| 시점 | 2026-09-17 기록 시스템 이식 `[대화]` |
| 상태 | 유효 |
| 연결 | R-005 |
| CASE | CASE-001 |

### 갈림길 — 무엇을 정해야 했나
커리어/AI 활용 사례를 R 항목 안에 길게 누적할지, 운영 기록과 별도의 **방법론 서사 계층**을 둘지 정해야 했다.

### 검토한 선택지
1. R 문서에 모든 AI 사용 배경과 대화까지 기록
2. 별도 CASE 문서가 여러 F/D/O/R을 묶어 배경과 진화 과정을 설명

### 고른 것과 근거
2번. R은 재사용 규칙을 짧게 남기는 운영 기록이고, CASE는 여러 사건을 시간 순으로 엮어 커리어/이식 관점에서 설명한다. 원본 ECG 연구 repo의 `40/41/42` 분리도 이 구조의 실제 작동 사례다. `[코드]` `[커밋]`

### 버린 것과 이유
1번은 R이 비대해지고 프로젝트 교훈과 포트폴리오 서사가 다시 섞이기 때문에 버렸다.

### 되돌려야 하는 조건
CASE가 운영 기록을 반복 복사해 유지보수 부담만 만든다면 CASE를 요약/링크 중심으로 축소한다.

---

## D-007. 중요한 새 creative direction에는 Reference-Grounded Creative Mining을 넣는다

| | |
|---|---|
| 시점 | 2026-09-18 `[대화]` |
| 상태 | 유효 |
| 연결 | F-004, R-006 |
| CASE | CASE-002 |

### 갈림길 — 무엇을 정해야 했나
AI가 creative idea를 텍스트로만 설명할지, 모든 아이디어마다 시안을 만들지, 아니면 실제 reference의 특정 장면을 **visual-intent proxy**로 써서 prototype 이전에 느낌을 공유할지 정해야 했다.

### 검토한 선택지
1. text-only idea 설명을 더 자세히 작성
2. 각 idea마다 Figma/React mockup 제작
3. direct reference URL + viewing instruction + experience principle + ECG translation을 제공하고 상위 2~3개만 prototype

### 고른 것과 근거
3번. 사용자는 기존 제안의 개념은 이해했지만 실제 visual impression은 화면을 보지 않아 아리송할 수밖에 없다고 했다. 반대로 각 제안마다 시안을 만드는 것은 제한적이다. 실제 reference의 어느 부분을 보고 무엇을 차용하는지 지정하면 **시안을 만들기 전에 같은 시각적 기준점을 공유**할 수 있다. `[대화]` `[추론]`

### 버린 것과 이유
1번은 설명 길이를 늘려도 visual scene 자체를 공유하지 못한다. 2번은 발산 단계에서 prototype 비용이 과도하고 후보 수를 줄이는 압력으로 작용한다.

### 적용 범위
- 자동 실행: reference/Awwwards 요구, 새 Attract/Intro/Transition/Result Reveal, 독창성·놀라움 중심의 significant CREATIVE request
- 먼저 제안: visual intent가 추상적이고 여러 mockup 전에 cheaper alignment가 유용한 significant CREATIVE request
- 생략: 단순 polish, 이미 direction/reference가 freeze된 구현

### 되돌려야 하는 조건
Reference가 반복적으로 anchoring을 강화해 후보 다양성을 줄이거나, 사용자가 원본 appearance에 과도하게 끌려 프로젝트 고유성이 떨어지는 증거가 생기면 자동 실행 범위를 줄이고 text-first divergence를 앞에 둔다.

---

## D-008. 방법론 CASE는 인간 재열람을 위한 대화 증거까지 최소 수준 자동 검사한다

| | |
|---|---|
| 시점 | 2026-09-18 `[대화]` `[코드]` |
| 상태 | 유효 |
| 연결 | F-005, R-007 |
| CASE | CASE-002 |

### 갈림길 — 무엇을 정해야 했나
CASE 문서의 품질을 사람 체크리스트에만 맡길지, checker가 서사 구조뿐 아니라 핵심 대화 근거와 사용자/AI 기여 구분까지 최소 수준 강제할지 정해야 했다.

### 검토한 선택지
1. 기존 checker 유지: CASE의 주요 제목과 F/D/O/R 연결만 검사
2. 모든 대화 전문 저장과 인용 수를 강제
3. `논의 흐름 + 핵심 대화 근거(또는 명시적 원문 부재) + 사용자/AI 기여 구분 + F/D/O/R 연결`을 자동 검사하고, transcript 부록은 가치가 있을 때 추가

### 고른 것과 근거
3번. 사용자가 다시 읽는 것이 핵심 목적이므로 결론만 남는 과도한 요약은 막아야 하지만, 모든 대화를 저장하면 운영 비용이 커지고 불필요한 기록이 쌓인다. 중요한 전환점과 발화만 보존하고 원문이 없을 때는 `[재구성]` 또는 `기록 없음`을 허용한다. `[대화]` `[추론]`

### 버린 것과 이유
1번은 현재 발견된 gap을 그대로 둔다. 2번은 CASE를 transcript archive로 바꾸어 운영 기록과 목적이 뒤섞인다.

### 되돌려야 하는 조건
자동 검사가 정상적인 CASE를 자주 오탐하거나, 작성자가 형식만 맞추고 내용 품질은 개선되지 않는다면 검사 조건을 단순화하고 transcript appendix의 선택 기준을 재조정한다.

---

## D-009. Superdesign을 **조건부 핵심 Visual Draft Generator**로 채택한다

| | |
|---|---|
| 시점 | 2026-09-18 `[대화]` `[문헌]` |
| 상태 | 유효 — 첫 실사용 후 trigger 범위 재검토 |
| 연결 | F-006, R-008 |
| CASE | CASE-003 |

2026-09-18 후속: D-010 / CASE-004에서 역할 확장 설계를 채택했다. 아래 도입 당시 판단은 보존하며 실행 routing 변경은 승인 대기다.

### 갈림길 — 무엇을 정해야 했나
Superdesign을 도입하지 않을지, 기존 pipeline 전체를 대체하는 design agent로 둘지, 아니면 현재 시스템의 부족한 **concrete multi-variant generation**만 맡기는 bounded generator로 둘지 정해야 했다.

### 검토한 선택지
1. 미도입 — Creative Production/Figma/React prototype으로 계속 탐색
2. Superdesign 중심 재편 — reference, generation, validation, implementation을 넓게 위임
3. 기존 `Reference Mining → Art Director → Validator` 사이에 **Superdesign generator layer만 추가**

### 고른 것과 근거
3번. 공식 maintained skill은 기존 codebase 분석과 branchable draft generation에 강점이 있어 F-006의 gap과 직접 맞는다. 반면 Product Design/design-taste/motion-review/project docs가 이미 검증 역할을 잘 수행하고 있고, Flourish는 데이터 관계 선택이라는 별도 전문성이 있다. 따라서 Superdesign을 넓게 쓰기보다 **"현재 UI를 이해한 concrete visual branches"**에 집중시키는 것이 중복과 authority conflict를 가장 적게 만든다. `[문헌]` `[추론]`

### 버린 것과 이유
1번은 여러 candidate의 실제 visual difference를 보기 위해 매번 수작업 prototype 비용이 든다는 gap을 남긴다. 2번은 generator가 자기 결과를 평가하고 project/data contract까지 재해석하게 만들어 현재 분리형 시스템의 장점을 잃는다.

### 운영 위치
기본 흐름:

```text
Reference Mining
→ Art Director divergence
→ hard data-integrity prefilter
→ shortlist 2~4
→ Superdesign branch drafts
→ user visual alignment
→ Product Design / design-taste / motion-review / project validator
→ KEEP / TUNE / REJECT
→ Figma(필요 시) / implementation
```

Evidence/Data에서는 Flourish가 visualization grammar를 먼저 정한다.

### 환경 경계
- Standard Chat: 직접 실행하지 않음. brief/handoff까지만.
- Work/Codex/Claude Code: shell + Superdesign skill/CLI 설치가 실제 확인될 때 실행.
- Superdesign web app: coding-agent가 없을 때 수동 대안.

### 되돌려야 하는 조건
첫 1~2회 실사용에서 다음이 반복되면 핵심 generator 지위를 낮춘다.

- baseline fidelity가 낮고 generic SaaS drift가 큼
- branch diversity가 실제로 낮음
- reference-only alignment보다 사용자 판단 속도가 개선되지 않음
- selected draft를 React로 옮기는 비용이 Figma/직접 prototype보다 큼
- 외부 context 전송/운영 비용이 이득보다 큼

## D-010. Dual Creative Director와 Superdesign 두 모드를 설계로 채택한다

| | |
|---|---|
| 시점 | 2026-09-18 handoff §2–9 [대화] |
| 상태 | 설계 채택 / 실행 시스템 구현은 기록 검증 후 별도 사용자 승인 대기 |
| 연결 | F-007, D-009, R-009 |
| CASE | CASE-004 |

### 갈림길 — 무엇을 정해야 했나
Superdesign을 기존 shortlist 뒤에만 둘지, 독립적인 방향 탐색도 맡길지 결정해야 했다.

### 검토한 선택지
1. 기존 직렬 generator만 유지
2. 기존 A를 Superdesign으로 대체
3. A와 독립적인 B를 추가하고 CONCRETIZER는 유지

### 고른 것과 근거
3번. 사용자는 A의 외부 reference 설명 가능성과 B의 자체 아이디어·시안 생성을 함께 원했다. 공통 baseline·제약만 공유하는 independent first pass, B 4~6 cards → 1~2 drafts, 이후 cross-review와 별도 Validator를 설계한다. 필요할 때만 Hybrid 한 번을 허용한다. [대화: primary handoff §2–7]

### 버린 것과 이유
1번은 독립 발상을 충족하지 못한다. 2번은 기존 reference provenance와 역할 분리를 잃는다. 모든 후보 즉시 렌더링은 비용이 크고, first pass 상호 공유는 anchoring 위험이 있어 배제한다. 모든 zone에서 Dual 자동 실행하는 안도 비용 대비 정보 이득이 낮아 채택하지 않는다. [추론]

### 되돌려야 하는 조건
실사용에서 독립성 유지가 불가능하거나 후보 다양성·판단 가치보다 비용이 커지면 B 범위를 축소한다. HIGH 신규 방향 기본 Dual/MEDIUM A 우선/LOW 생략은 아직 구현·실측되지 않은 routing 설계다.

---

## D-011. D/R마다 CASE 연결 또는 구체적인 비연결 사유를 요구한다

| | |
|---|---|
| 시점 | 2026-09-18 기록 우선 실행 요청 [대화] |
| 상태 | 유효 — 이번 기록 단계에서 구현 |
| 연결 | D-006, D-008, R-007, R-010 |
| CASE | CASE-004 |

### 갈림길 — 무엇을 정해야 했나
존재하는 CASE만 검사하면 방법론 변화에 CASE가 아예 없는 경우를 놓친다.

### 검토한 선택지
사람 기억에만 의존, 별도 ledger 추가, D/R의 CASE 필드 검사, 문장 의미를 코드로 자동 분류하는 방식을 비교했다.

### 고른 것과 근거
모든 D/R에 CASE 필드를 둔다. 방법론 여부를 코드가 추측하지 않고 작성자가 분류하도록 하며 방법론 변화는 같은 작업 단위에서 CASE를 작성·갱신한다. 비방법론은 `불필요 — 구체적 이유`, 보류는 `보류 — 이유; 재검토: 조건`을 쓴다. 이번 사용자 요청처럼 CASE 작성이 명시된 경우 보류로 완료 처리할 수 없다. [추론]

### 버린 것과 이유
새 ledger는 또 다른 누락 지점을 만들고, 의미 자동 분류는 오탐·누락 가능성이 높다. 모든 D마다 새 CASE를 강제하면 사소한 결정까지 서사 파일이 늘어난다. 기존 CASE를 연결하거나 사유를 쓰는 방법으로 조정했다.

### 되돌려야 하는 조건
사유만 형식적으로 쓰는 일이 반복되면 인간 리뷰를 강화한다. 정규화된 canonical 변경 registry가 생기면 그 source에서 의무를 유도한다. 검사 통과를 서사 품질 보증으로 확대하지 않는다.
