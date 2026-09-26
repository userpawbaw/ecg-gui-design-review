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

2026-09-19 후속: 사용자 구현 승인에 따라 D-012/16번 계약으로 실행 체계를 연결한다. 아래 설계 시점의 승인 대기 문구는 이력이다.

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

## D-012. Dual 실행 계약을 환경 중립 문서와 얇은 skill로 연결한다

| | |
|---|---|
| 시점 | 2026-09-19 사용자 구현 승인 [대화] |
| 상태 | 채택 — 구현 및 검증 대상 |
| 연결 | D-010, R-009 |
| CASE | CASE-004 |

### 갈림길
문서만 나열할지, vendor skill을 복제할지, 공통 계약과 얇은 wrapper로 실제 진입점을 연결할지 결정한다.
### 검토한 선택지
문서만 추가; vendor CLI 지침 전체 복제; 16번 공통 계약 + 두 wrapper + 기존 routing 연결.
### 고른 것과 근거
세 번째. 자동 activation의 범위·독립 context·예산·중단 상태를 16번에서 정의하고 vendor는 CLI/auth를 담당한다. 실행기는 공통 입력만 전달하는 별도 context를 쓰며, 불가능하면 독립성 미검증 상태와 깨끗한 handoff를 반환한다. [추론]
### 버린 것과 이유
문서만 추가하면 기존 serial 진입점이 우선될 수 있다. vendor 복제는 버전 변화와 모드 간 충돌을 만든다. 같은 대화에서 역할 이름만 바꾸는 방식은 이미 읽은 후보를 지울 수 없다.
### 되돌려야 하는 조건
첫 실사용에서 wrapper와 vendor의 context/resume가 충돌하거나 budget을 지키지 못하면 실제 실패 근거로 계약을 수정한다. 이번 구현 승인은 시안 생성·UI 반영·병합까지 뜻하지 않는다.

---

## D-013. Director A에 task-routed Reference Source Registry를 도입한다

| | |
|---|---|
| 시점 | 2026-09-20 source-pool 재논의 `[대화]` |
| 상태 | 채택 — 다음 creative round부터 적용; DUAL-ATTRACT-001에는 소급 적용하지 않음 |
| 연결 | F-008, R-012 |
| CASE | CASE-002 |

### 갈림길 — 무엇을 정해야 했나
Director A의 reference source를 Awwwards/Godly 중심으로 유지할지, B와 대비되도록 UX/product source 중심으로 바꿀지, 아니면 **A의 creative 범위를 유지한 채 reference ecosystem만 넓힐지** 결정해야 했다.

### 검토한 선택지
1. Awwwards/Godly 중심 유지
2. A를 UX/product-pattern 중심 director로 재정의
3. Creative/Curated Web/Concept/Product-Component/UX Evidence/Scientific/Data Story family를 만들고 task별로 일부만 선택

### 고른 것과 근거
3번. A의 정체성은 특정 미감이 아니라 **실제 외부 reference의 provenance와 차용 원리를 사용자가 확인할 수 있다는 것**이다. 따라서 source family를 넓혀도 역할 충돌이 없고, Land-book/Minimal Gallery의 site·section 미감과 Refero/Mobbin류 component·flow를 같은 Reference Card 규칙으로 사용할 수 있다. `[대화]` `[추론]`

### 버린 것과 이유
1번은 한 gallery aesthetic에 anchoring될 위험이 있다. 2번은 Dual Director의 차이를 "creative vs UX"라는 인위적 스타일 대립으로 바꿔 A의 이미 유효한 creative direction을 약화시킨다. 모든 사이트를 매번 전부 검색하는 방식도 context/검색 비용 때문에 버렸다.

### 되돌려야 하는 조건
다음 creative round에서 source router 때문에 검색 비용만 늘고 reference 다양성·설명력·아이디어 품질이 개선되지 않거나, source family 규칙이 오히려 발산을 제한하면 family 수와 budget을 줄인다.

---

## D-015. 새 significant CREATIVE 작업의 기본 경로를 **Alpha + Beta**로 바꾸고 Superdesign 자동 사용을 중지한다

| | |
|---|---|
| 시점 | 2026-09-23 첫 DUAL-ATTRACT 결과 회고 후 `[대화]` |
| 상태 | 채택 — 다음 creative round부터 적용 |
| 연결 | F-009, R-013, D-010, D-013 |
| CASE | CASE-005 |

### 갈림길 — 무엇을 정해야 했나
첫 Dual Director 실험 이후 기존 A/B+Superdesign 구조를 그대로 개선할지, Superdesign만 제외하고 단일 reference director로 돌아갈지, 또는 **같은 reference layer 위에 implementation-first와 image-first 두 표현 경로를 만들어 비교할지** 결정해야 했다.

### 검토한 선택지
1. Superdesign prompt/model을 더 세게 튜닝해 기존 Dual 구조 유지
2. Reference Mining → 직접 구현의 단일 경로
3. Alpha implementation-aware track + Beta reference-grounded image concept track을 같은 Common Creative Packet에서 실행 후 비교

### 고른 것과 근거
3번. 사용자는 Director A의 reference-grounded 발상 방식은 만족했지만, Superdesign 시안의 reference fidelity와 visual completeness에는 크게 실망했다고 평가했다. 동시에 이미지 생성은 실제 UI 구현보다 값싼 visual exploration으로 활용할 수 있지만, **각 image element의 component/interaction/motion translation이 별도로 명확해야 한다**고 요구했다. `[사용자평가]` `[대화]`

Alpha는 reference의 visual world를 처음부터 component/state/motion/implementation으로 설계한다. Beta는 같은 reference/idea를 near-final still로 빠르게 시각화하고, 이미지가 끝이 아니라 실제 UI spec으로 다시 번역한다.

### 버린 것과 이유
1번은 첫 실사용에서 드러난 품질 문제를 추가 비용으로 즉시 재시험하게 된다. 재도입은 별도 capability re-test로 남긴다. 2번은 text/reference와 actual implementation 사이의 visual imagination gap을 다시 키운다. Alpha/Beta를 서로 반대 스타일로 강제하는 것도 버렸다.

### 되돌려야 하는 조건
- Beta image가 반복적으로 generic AI visual로 drift하고 user alignment를 개선하지 못함
- Alpha/Beta 중복 비용이 실제 품질 이득보다 큼
- Superdesign 또는 다른 generator가 별도 재시험에서 reference fidelity와 near-final completeness를 안정적으로 충족함
- target task가 LOW/polish라 두 track이 불필요함

---

## D-017. 레퍼런스 촬영은 "순서 고정 · 시간 대략 · 입력 HUD 표시" 규칙을 따른다

| | |
|---|---|
| 시점 | 2026-09-25 moto-card.com 녹화 분석 후 `[대화]` |
| 상태 | 채택(순서 합의) — 제작 파이프라인 전체(P1)는 미결 |
| 연결 | F-010, F-011, `tools/reference-capture/README.md`, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §15 |
| CASE | CASE-006 |

### 갈림길
첫 녹화는 스크롤 입력이 보이지 않았고, 프레임 24.5 %가 중복되었으며, 녹화 도구 워터마크가 문구를 가렸다 `[영상]`. 스크롤할 때와 멈췄을 때의 동작 차이를 측정하려면 촬영 방식을 정해야 했다.

### 검토한 선택지
1. 자유 촬영 유지. 2. 키 입력 표시 프로그램 사용(사용자 제안). 3. 정지 → 규칙적 스크롤 순서 고정(사용자 제안). 4. 3번 + 페이지 안에서 휠·scrollY·속도를 표시하는 HUD.

### 고른 것과 근거
4번. 순서(정지 → 휠 1칸×3 → 연속 → 정지 → 휙 → 정지 → 되돌리기)는 고정하되, 사용자 합의대로 시간은 대략이면 된다 `[대화]`. 정확한 시각은 HUD의 `t`, `WHEEL`, `velocity`로 사후 측정한다. HUD는 관성 스크롤이 입력 뒤에도 이어지는 것까지 보여 주므로 키 입력 표시 프로그램보다 정보가 많다. `[테스트]`

### 버린 것과 이유
정확한 초 단위 준수 — 사람이 지키기 어렵고, HUD로 측정 가능하므로 불필요. 키 입력 표시 프로그램 단독 — 휠 입력과 실제 스크롤 속도를 구분하지 못함.

### 되돌려야 하는 조건
HUD가 특정 사이트에서 CSP 등으로 실행되지 않거나, 사이트가 네이티브 스크롤 대신 가상 스크롤을 써서 scrollY가 변하지 않으면 입력 표시 프로그램이나 로컬 캡처 스크립트(`capture-site.mjs`)로 대체한다.

---

## D-018. 레퍼런스 분석은 "효과 카드" 단위의 재현용 기록으로 남기고, 필수 항목을 자동 검사한다

| | |
|---|---|
| 시점 | 2026-09-25, 첫 레퍼런스(moto-card.com) 분석 후 다음 사이트로 넘어가기 전 `[대화]` |
| 상태 | 채택 |
| 연결 | F-010, F-011, F-012, D-017, `21_REFERENCE_EFFECT_RECORDS.md`, `references/REF-001_MOTO_CARD.md` |
| CASE | CASE-006 |

### 갈림길
첫 분석 결과는 채팅과 점검 문서(`handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md`)의 여러 절에 흩어져 있었다. 사용자는 "기록 없이 분석만 진행하면 컨텍스트 오염 가능성"을 지적했고, 기록의 목적을 "레퍼런스들의 특징적인 효과를 구현하기 위해 필요한 정보들이 담겨 있도록 강제하는 용도"로 정했다. `[대화]`

### 검토한 선택지
1. 채팅 요약 수준의 자유 서술 유지. 2. 사이트 단위 보고서 템플릿. 3. **효과 카드 단위 템플릿 + 필수 필드 자동 검사**. 4. 3번 + 여러 레퍼런스에서 반복되는 메커니즘을 레시피로 승격.

### 고른 것과 근거
4번. 재현의 단위는 사이트가 아니라 효과다. 첫 분석에서 입력 모델 오인(F-012), 광원 오해(F-011)가 있었으므로 **입력 모델·판별 근거·파라미터·수용 기준**을 필수 필드로 두었다. 사용자 지목 효과를 빠뜨리지 않도록 장면·전환 지도에 모든 카드 ID가 있어야 한다. 규칙만으로는 지켜지지 않았던 과거 경험(F-005)에 따라 `records:check`가 필드를 검사한다. `[추론]`

### 버린 것과 이유
1번 — 채팅 수준 분석은 숫자·에셋·판별 근거가 빠져 재현 계획에 쓸 수 없고 컨텍스트 압축 때 사라진다. 2번 — 사이트 단위로는 여러 효과의 입력 모델이 섞인다. 레퍼런스 에셋·코드 사본 저장 — 저작권 문제로 URL·크기·해시·짧은 의사코드만 남긴다.

### 되돌려야 하는 조건
카드 작성 비용이 분석 이득보다 커지거나(예: 단순 레퍼런스에도 15개 필드를 채우느라 진행이 막힘), 레시피 색인이 실제 구현에서 참조되지 않으면 필수 필드를 줄이거나 레시피 중심으로 재구성한다.

## D-019. 3D 작업은 셰이더·후처리를 항상 검토하고, 레퍼런스 대조는 효과 구간당 최소 6장(권장 12장)으로 한다

| | |
|---|---|
| 시점 | 2026-09-26, 다락방 셰이더 결과 확인과 REF-003 경로 피드백 직후 `[대화]` |
| 상태 | 채택 |
| 연결 | F-015, F-016, F-017, `11_CHECKLISTS.md` §12, `21_REFERENCE_EFFECT_RECORDS.md` §8, `handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md` |
| CASE | CASE-006 |

### 갈림길
다락방 재구성에서 광원 셰이더(볼륨 빛줄기)·후처리를 넣자 사용자가 "확실히 느낌이 사네. 빛 효과 말고도 3d 작업시 셰이더나 후처리를 항상 검토하도록 넣었으면 해"라고 했다 `[대화]`. 같은 날 REF-003 경로에서 1–2장 확인이 결함 3개를 놓쳤다(F-017).

### 검토한 선택지
1. 사용자가 요청할 때만 셰이더·후처리 검토, 프레임 수 규칙 없음.
2. 셰이더·후처리를 3D 장면에 **기본 탑재**.
3. **3D 작업마다 검토 항목을 체크(재질·조명·대기·색보정·안티에일리어싱·성능) — 넣을지는 측정·비교로 판단** + 레퍼런스 대조 최소 6장, 권장 12장.

### 고른 것과 근거
3번. 이번 차이는 "셰이더를 넣었다"가 아니라 "빠진 층을 찾아봤다"에서 왔다. 항상 넣으면 전시 PC 성능(P2 미결정)과 가독성을 해칠 수 있어 **검토는 필수, 채택은 근거 기반**으로 둔다. 프레임 수는 사용자가 제안한 "대여섯 장 이상"을 하한 6으로, 12장이 결함 ②·③을 모두 잡았으므로 권장 12로 둔다 `[추론]`.

### 버린 것과 이유
1번 — 사용자가 매번 지적해야 한다. 2번 — 성능·과한 연출 위험, KTX2·pmndrs postprocessing도 "문제 측정 후 도입"으로 이미 정했다(`ATTIC_BOOKSHELF_STUDY` §5). 24장 이상 — 캡처·검토 비용이 커지고 12장에서 놓친 사례가 아직 없다.

### 되돌려야 하는 조건
12장 대조에서도 놓친 결함이 나오면 장 수나 샘플링(균등 → 변곡 구간 밀집)을 바꾼다. 셰이더·후처리 검토가 매번 "해당 없음"으로 끝나 비용만 들면 검토 항목을 줄인다.

## D-020. 에셋 탐색 순서에 ambientCG·Openverse를 명시하고 Kenney·Quaternius를 로우폴리 후보로 둔다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 질문 "polyhaven 외에 다른 풍부한 공개 에셋 사이트가 있어? 거기서도 추가로 탐색하도록 명시하면 이득이 있을까?" `[대화]` |
| 상태 | 채택 — 2026-09-26 D-022로 확장(접속 가능·계정 조달처 포함, 로그인 요청) |
| 연결 | `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md` §5, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §12, `scripts/assets/fetch.mjs`, `assets/registry.json` |
| CASE | CASE-006 |

### 갈림길
registry의 외부 원본은 Poly Haven·NASA·npm/Khronos뿐이었다 `[코드]`. 다른 조달처를 규칙에 넣을지, 필요할 때만 볼지 정해야 했다.

### 검토한 선택지
1. Poly Haven 유지, 필요 시 개별 검색. 2. 접근 가능한 모든 사이트를 동등하게 탐색. 3. **CC0 + API가 있는 곳을 우선 순서로 명시하고 자동 받기를 붙인다**, 나머지는 조건부.

### 고른 것과 근거
3번. 탐색 순서: 재질·HDRI → Poly Haven, **ambientCG** / 사진판 → **Openverse**(CC0·PD 우선) / 로우폴리 소품 → Kenney, Quaternius(CC0) / 지구·지도 → NASA. ambientCG와 Openverse는 fetch.mjs source type을 추가해 받기·라이선스 재확인·sha256 고정까지 시험했다 `[테스트]`.

### 버린 것과 이유
1번 — AI가 이미 쓴 소스로 되돌아가 재질 반복이 생긴다. 2번 — OpenGameArt·Sketchfab·Openverse BY 항목은 항목별 라이선스 확인 부담이 커서 기본 순서에 넣지 않는다. Behance·Poly Pizza·Smithsonian — 이 환경에서 403.

### 되돌려야 하는 조건
ambientCG/Openverse에서 받은 에셋이 두 작업 연속으로 채택되지 않거나, API 약관·접근이 바뀌면 순서에서 뺀다. Sketchfab 토큰이나 Pexels/Unsplash 키가 제공되면 순서를 다시 본다.

## D-021. 외부 UI 컴포넌트 라이브러리는 레퍼런스 효과 구현의 기본 경로가 아니라 기법·아이디어 공급원으로 쓴다

| | |
|---|---|
| 시점 | 2026-09-26, REF-003 경로 A(직접)/B(Magic UI·Aceternity식 조합) 비교 후 `[대화]` `[테스트]` |
| 상태 | 채택 |
| 연결 | F-017, D-019, `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md` §3–4, `prototype/spikes/ref-repro/ref003b.html` |
| CASE | CASE-006 |

### 갈림길
사용자가 "직접 만드는 경우보다 나을 지 아닐 지 확실히 알고 싶"다고 했다 `[대화]`. 같은 데이터·지도로 두 변형을 만들어 12장 + 소나 12장으로 대조했다.

### 검토한 선택지
1. 외부 컴포넌트를 기본으로 조합. 2. 외부 컴포넌트 사용 금지. 3. **아이디어·기법만 가져오고, 코드 채택은 같은 대조(D-019)를 통과할 때만.**

### 고른 것과 근거
3번. B는 정지 소나(wow 포인트)를 다른 의미(제자리 숨쉬기)로 구현해 FAIL, follow 매핑은 B에서도 손으로 작성, 번들은 경로 구간만으로 A 페이지 전체의 2배 이상(gzip 126 KB 대 57 KB) `[테스트]`. 반면 motion `pathLength`는 A가 밟은 dash 버그를 피했고 Tracing Beam 그라디언트는 가져올 만하다.

### 버린 것과 이유
1번 — 레퍼런스 고유 효과는 라이브러리 컴포넌트와 의미가 달라 수정 비용이 오히려 든다. 2번 — 기법 공급원으로서의 가치(pathLength, 그라디언트 빔)를 잃는다. Behance(403·코드 없음), Superdesign(로그인 필요·이전 충실도 부족), Uiverse·CodePen(403)은 이 환경에서 공급원이 못 된다. Aceternity는 소스 재배포 금지라 코드 사본을 두지 않는다.

### 되돌려야 하는 조건
P5에서 React UI 층을 채택하고, 범용 UI(필터 버튼·카드·툴팁)에서 MIT 컴포넌트가 같은 대조를 통과하며 시간을 줄이면 그 범주에 한해 기본 경로로 올린다.

## D-022. 에셋 조사 단계에서 접근 가능한 조달처를 모두 탐색하고, 계정 조달처는 후보가 있을 때 로그인을 요청한다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 요청 "접속은 된다는 곳도 포함해서 에셋 조사 단계에서 탐색 … Sketchfab, Pexels는 계정을 만들테니 … 대상이 있다면 내게 로그인을 요청하도록" `[대화]` |
| 상태 | 채택 — D-020을 확장. 2026-09-26 후속: "접속만 되는 곳" 5곳도 로그인·브라우저 자동화 없이 받기 확인(`page`·`gdrive`·`url`) |
| 연결 | D-020, `24_ASSET_RESEARCH_STAGE.md`, `assets/sources.json`, `scripts/assets/explore.mjs`, `scripts/assets/fetch.mjs` |
| CASE | CASE-006 |

### 갈림길
D-020은 자동 받기가 되는 곳만 순서에 넣었다. 사용자는 접속만 되는 곳과 계정이 필요한 곳까지 탐색 범위에 넣고, 계정이 필요할 때 요청받기를 원했다.

### 검토한 선택지
1. 자동 받기 가능한 곳만 탐색(D-020 그대로). 2. 모든 곳 탐색, 계정 조달처는 미리 계정부터 요구. 3. **모든 곳 탐색, 계정 조달처는 실제 후보가 나오거나 검색 자체에 키가 필요할 때만 요청 기록 → 사용자에게 요청.**

### 고른 것과 근거
3번. Sketchfab은 검색이 공개라 후보를 먼저 보여 주고 로그인 가치를 판단하게 할 수 있다(bookshelf 4건, CC-BY 3 · CC-BY-NC 1) `[테스트]`. Pexels는 검색부터 키가 필요해 "검색 불가" 요청으로 남긴다. 토큰은 환경 변수로만 받는다(채팅·저장소 금지). 라이선스 허용 목록에 Pexels·Mixkit License를 추가했다.

### 버린 것과 이유
1번 — 사용자가 계정을 만들겠다고 한 조달처를 놓친다. 2번 — 필요 없는 계정·토큰을 먼저 요구한다.

### 되돌려야 하는 조건
긁기 기반 조달처(Kenney·Quaternius·Three D Scans·OpenGameArt·Mixkit)가 구조 변경으로 두 번 연속 오류를 내면 탐색 목록에서 수동으로 내린다. Sketchfab·Pexels 약관이 API 받기를 막으면 수동 받기로 바꾼다.

## D-023. 고정 경로 스크롤 구간에 "AI 영상 → 입고 QA → 스크롤 플레이어" 파이프라인을 시험 경로로 둔다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 제안 "AI로 … 원하는 구도로 동영상을 제작시킨 후 그걸 부드럽게 스크롤 에니메이션으로 적용 … 이게 더 쌀 수도 있지?" `[대화]` |
| 상태 | 시험 단계 채택 — 2026-09-26 자체 시험 2차(시선·정지 생명감·깊이, F-019·F-020·D-025·D-026) 반영, 사용자 확정 대기 |
| 연결 | D-019, F-018, `22_AI_VIDEO_SCROLL_PIPELINE.md`, `templates/AI_VIDEO_BRIEF.md`, `tools/video-qa/`, `prototype/spikes/video-scrub` |
| CASE | CASE-006 |

### 갈림길
고정 경로 연출을 Blender·실시간 3D로만 만들지, AI 영상을 재료로 쓰는 경로를 추가할지.

### 검토한 선택지
1. 도입 안 함. 2. 프롬프트로 영상 생성 → 그대로 스크롤에 연결. 3. **적합성 판정(V0) → 키프레임으로 구도 고정한 브리프 → 자동 입고 QA + 사람 확인 → 3회 상한 피드백 → 디테일 체크리스트를 갖춘 플레이어 → 12장 수용.**

### 고른 것과 근거
3번. 대역 클립 시험에서 입고 QA가 주입 결함(컷·중복·깜빡임·키프레임 불일치·속도 불균일)을 모두 잡았고, 속도 보정이 스크롤 구간별 화면 이동 편차를 CV 0.605 → 0.11로 줄였으며, 시선 반응이 REF-002 수용 기준(약 1.5 s)과 맞았다 `[테스트]`. 2번은 AI 영상 특유의 구도 불안정·속도 불균일·정지 시 무생명·메모리 문제를 그대로 제품에 들인다.

### 버린 것과 이유
1번 — 유기적 사실감 구간의 첫 시안 비용을 줄일 기회를 버린다. 레퍼런스 영상을 생성 입력으로 쓰는 방식 — 파생물·레퍼런스 에셋 복사 금지 규칙과 충돌, 원칙은 글로 구도는 우리 키프레임으로. 평면 영상으로 REF-002식 "고개 돌림" 재현 — 가려진 면이 없어 불가, 2.5D·전경 레이어로 한정.

### 되돌려야 하는 조건
실제 AI 영상 두 건 이상이 3회 피드백 안에 PASS/TUNE에 도달하지 못하거나, 생성 비용·약관이 Blender 경로보다 불리하면 이 경로를 "첫 시안 전용"으로 줄이거나 중단한다.

## D-024. 구현 전에 외부 UI 컴포넌트 검토 단계(C1–C4)를 두고, 예측 후 실제 비교로 결정한다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 제안 "실제 구현 단계에서 외부 UI 컴포넌트는 어떤 것을 사용할지, … 참조하여 변형할 만한 것은 … 검토해본 후, 실제 비교로 확인하는게 나을 것 같은데" `[대화]` |
| 상태 | 채택 — 후보 라이브러리는 미사용 기록 상태 |
| 연결 | D-021, D-019, `23_EXTERNAL_COMPONENT_REVIEW.md` |
| CASE | CASE-006 |

### 갈림길
D-021은 한 번의 비교(REF-003 경로)로 "외부 컴포넌트는 기법 공급원"이라 정했다. 사용자가 조사한 더 많은 라이브러리를 언제·어떻게 판단할지가 남았다.

### 검토한 선택지
1. D-021만 두고 필요할 때 즉흥 판단. 2. 매 구현마다 모든 후보를 실제 비교. 3. **효과를 고유 연출/범용 UI로 분류(C1) → 후보를 그대로/참조 변형/해당 없음으로 분류(C2) → 기준표로 예측(C3) → 비교 가치가 있는 것만 실제 비교(C4).**

### 고른 것과 근거
3번. 모든 후보 비교는 비용이 크고, 즉흥 판단은 이번처럼 라이선스 함정을 놓친다 — 사용자 목록의 Origin UI는 coss.com/ui로 옮겨 **AGPL-3.0**이 되었고, 대화 속 "무료" 설명만으로는 알 수 없었다 `[런타임]`. 증거상 고유 연출은 직접 제작이 기본이고, 범용 UI에서는 외부 컴포넌트가 이길 가능성이 있으나 아직 증거가 없다 `[추론]`.

### 버린 것과 이유
1번 — 판단 근거가 남지 않는다. 2번 — 비용. 영감 사이트(Behance·Dribbble·Mobbin·Landbook·Lapa Ninja 등)를 컴포넌트 공급원으로 취급 — 코드가 없고 다수가 403·로그인.

### 되돌려야 하는 조건
다음 레퍼런스 구현의 C4에서 범용 UI 외부 컴포넌트가 12장 대조와 비용 모두에서 직접 제작을 이기면, 범용 UI 범주는 "외부 컴포넌트 우선"으로 올린다. 반대로 C3 예측이 C4 결과와 두 번 연속 어긋나면 기준표를 고친다.

## D-025. 생성 도구 입력 자료는 단계별로 정한다 — 학습 단계는 레퍼런스 금지, 적용 단계는 우리 재현 결과를 기본 참고 입력으로

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 지적 "이건 정답지라서 그런 거고 … 다른 프로젝트에 적용시키려고 할 때엔 영상으로 제공해도 무방 … 사진 정도는 … 득실을 따져봐야" `[대화]` |
| 상태 | 채택 — D-023 브리프 §2의 "레퍼런스 입력 금지"를 대체 |
| 연결 | D-023, `22_AI_VIDEO_SCROLL_PIPELINE.md` §11, `templates/AI_VIDEO_BRIEF.md` §2 |
| CASE | CASE-006 |

### 갈림길
첫 판 브리프는 레퍼런스 영상·캡처를 생성 입력으로 넣지 말라고 일괄 규정했다. 사용자는 금지 이유가 단계마다 다르다고 지적했다.

### 검토한 선택지
1. 일괄 금지 유지. 2. 일괄 허용. 3. **단계별**: 학습 단계는 금지(정답지), 적용 단계는 우리 재현 결과 영상·스틸을 기본 입력, 레퍼런스 영상은 비공개 탐색 시안에만(`derivative-draft`), 레퍼런스 사진은 스타일 참고 입력으로만.

### 고른 것과 근거
3번. 학습 단계에서 정답지를 넣으면 우리 파이프라인의 한계를 배울 수 없다(사용자 논리). 적용 단계에서는 구도·카메라·속도를 글보다 영상이 훨씬 정확히 전달한다. 다만 레퍼런스 사이트 영상을 그대로 넣으면 파생물·도구 약관 위험이 있으므로, **우리 재현 결과**가 그 역할을 대신한다 — 재현 단계를 거치는 실익이 이 지점에서 나온다 `[추론]`.

### 버린 것과 이유
1번 — 적용 단계에서 가장 정확한 전달 수단을 버린다. 2번 — 학습 오염과 권리 위험. 레퍼런스 사진을 첫 프레임 입력으로 — 이미지→영상 도구는 입력을 첫 프레임으로 보존하는 경향이 있어 파생물이 되기 쉽다.

### 되돌려야 하는 조건
실제 AI 영상 시험에서 우리 재현 결과를 입력으로 준 생성이 글·키프레임만 준 생성보다 3회 피드백 통과율이 높지 않으면, 적용 단계 기본 입력을 키프레임으로 되돌린다. 사용하는 도구 약관이 참고 영상 업로드를 제한하면 그 도구에서는 키프레임만 쓴다.

## D-026. 정지 시 생명감: 카메라 경로 영상은 "영상 위 시간 층", 반복 영상만 "멈춰도 재생 + 스크롤 가속"

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 제안 두 방식의 시험 후 `[대화]` `[테스트]` |
| 상태 | 채택 |
| 연결 | F-020, F-012, D-023, `22_AI_VIDEO_SCROLL_PIPELINE.md` §10 |
| CASE | CASE-006 |

### 갈림길
스크롤을 멈추면 영상도 멈춘다. 사용자 제안: 1) 영상 위 살아 있는 층, 2) 멈춰도 천천히 재생 + 스크롤 시 가속(moto 지구처럼).

### 검토한 선택지
1. 1번만. 2. 2번만. 3. **대상별 조합**: 카메라 경로 = 스크롤 위치 재생 + 1번, 반복 대상 = 2번 + 필요 시 1번, 긴 정지 화면 = 별도 반복 클립.

### 고른 것과 근거
3번. 2번은 반복 영상에서 moto 지구와 같은 거동(정지 4 fps → 스크롤 45 fps → 감속)을 보였지만, 카메라 경로에서는 위치 어긋남과 조기 종료가 측정됐다(F-020). 1번은 모든 영상에 적용되지만 영상에 구워진 같은 요소와 충돌하므로 브리프에서 입자를 빼야 한다 `[테스트]`.

### 버린 것과 이유
2번만 — 카메라 경로 영상(이 파이프라인의 주 용도)에서 실패. 1번만 — 회전하는 물체처럼 "계속 도는 것"이 wow인 연출을 놓친다.

### 되돌려야 하는 조건
실제 GPU에서 시간 층 셰이더가 프레임 예산을 넘으면 층을 DOM/CSS 입자로 낮춘다. 카메라 경로에서도 "앞으로 조금 흘렀다가 스크롤 위치로 되돌아오는" 제한 드리프트가 체감상 낫다는 사용자 평가가 나오면 2번의 제한 변형을 시험한다.
