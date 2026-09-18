# Superdesign Generation Layer

작성 기준: 2026-09-18  
상태: **ADOPT — 조건부 핵심 생성기(generator) 레이어**  
검토 기준 upstream: `superdesigndev/superdesign-skill@f9f05cd988c247dce6c072eaf9ac6b162f2ffc4b`  
검토된 plugin manifest version: `0.4.3`

## 1. 왜 추가하는가

현재 ECG UI/UX 시스템은 다음 능력이 강하다.

- Reference Mining — 어떤 visual experience를 만들지 실제 우수 사례로 grounding
- Creative Art Director — 기존 dashboard 관습을 흔드는 아이디어 발산
- Product Design / design-taste / motion-review — UX·taste·motion·data-integrity 검증
- Flourish — 어떤 데이터 관계를 어떤 시각화 문법으로 보여줄지 탐색
- Figma — 확정안의 편집·디자인 시스템·handoff
- Context7 / Playwright / TinyFish — 구현 문서·runtime 검증

반면 **현재 codebase와 design language를 읽은 뒤, 같은 baseline에서 실제 UI 시안을 여러 방향으로 빠르게 시각화하는 생성기**는 상대적으로 약했다.

Superdesign은 이 빈칸을 채우는 도구로 채택한다. 공식 maintained skill은 기존 codebase를 분석하고, style reference와 design-system context를 사용해 draft를 만들며, 하나의 baseline에서 branch variant를 병렬 탐색할 수 있다.

## 2. 시스템 안에서의 정확한 역할

Superdesign의 역할은 **결정자도 구현자도 아닌 Visual Draft Generator**다.

```text
Reference Mining
  ↓ 실제 reference / experience principle
Creative Art Director
  ↓ 5~10 concept directions
Hard-constraint prefilter
  ↓ data integrity를 즉시 깨는 후보만 제거
Superdesign
  ↓ top 2~4 directions를 같은 baseline에서 concrete visual drafts로 생성
User visual alignment
  ↓
Product Design / design-taste / motion-review / project rules
  ↓ KEEP / TUNE / REJECT
Figma (필요 시 freeze)
  ↓
Codex / Work / Claude Code implementation
  ↓
Playwright / TinyFish / target-PC verification
```

**Superdesign output은 프로젝트 source of truth가 아니다.** 최종 승인 전에는 exploratory artifact다.

## 3. 언제 자동 호출하는가

다음 조건을 모두 만족하면 기본적으로 Superdesign을 호출한다.

1. 단순 polish가 아니라 **significant CREATIVE/UI direction**이다.
2. 아이디어 설명 또는 Reference Mining만으로는 실제 visual difference를 판단하기 어렵다.
3. 2개 이상 방향을 같은 baseline에서 비교할 가치가 있다.
4. Work/Codex/Claude Code 등 **shell + Superdesign skill/CLI를 사용할 수 있는 환경**이다.

대표 trigger:

- `Superdesign으로 시안 비교해줘`
- `이 3개 방향을 실제 화면으로 branch해서 보여줘`
- `현재 2.2.1을 baseline으로 3가지 visual direction 만들어줘`
- Reference Mining 후 상위 2~4 후보를 실제 draft로 확인할 때
- Attract / Evidence / Method Explorer / major transition의 새 visual direction

## 4. 언제 먼저 제안만 하는가

사용자가 단순히 새 디자인을 원했지만 아직 concrete visual comparison을 요청하지 않았고, Reference Mining 또는 Creative divergence가 먼저 필요한 경우:

1. reference/idea 발산을 먼저 수행한다.
2. 상위 후보가 2~4개로 줄어들면
   - `이제 Superdesign에서 같은 baseline으로 실제 시안을 branch해 비교할까요?`
   를 한 번 제안한다.

생성 비용을 줄이기 위해 8~10개 아이디어를 모두 Superdesign으로 만들지 않는다.

## 5. 언제 호출하지 않는가

- 1~2 px spacing, label, color token 등 단순 polish
- 이미 visual direction이 freeze된 구현 작업
- waveform/time axis/unit/Reference/Difference 자체의 수치·geometry 수정
- 단순 버그 수정
- data visualization 문법 자체를 고르는 단계 — 먼저 Flourish/Data Storyteller
- 사용자가 reference와 방향을 이미 확정하고 바로 구현하라고 한 경우
- standard Chat처럼 shell이 없는 환경

## 6. 환경별 동작

### Standard Chat

2026-09-18 Plugin Directory 검색에서는 Superdesign이 일반 Chat용 설치 앱으로 노출되지 않았다. 공식 Superdesign skill도 shell/CLI를 전제로 하며 **standard Chat에서는 직접 실행하지 말고 Work tab 또는 shell 가능한 agent를 사용**하도록 명시한다. 따라서 일반 Chat에서는 직접 실행하지 않는다.

Chat의 역할:
- Reference Mining
- Creative brief
- candidate selection
- Superdesign handoff packet 작성
- 결과가 돌아오면 validator 수행

실행이 필요하면 Work/Codex/Claude Code 또는 Superdesign web app으로 넘긴다.

### Work / Codex

Superdesign skill/CLI가 설치되고 shell 실행이 가능한 경우 generator layer를 실제 실행할 수 있다.

- 첫 session: CLI preflight/auth 확인
- 기존 codebase: repo analysis/init 후 current UI를 baseline으로 사용
- 같은 baseline의 여러 방향 비교: branch iteration 사용
- draft/canvas URL과 draft id를 결과로 남긴다.

### Claude Code

공식 안내에 따라 namespaced plugin을 설치한 환경에서는 `/superdesign:superdesign`을 사용할 수 있다. 프로젝트 wrapper는 vendor skill을 복제하지 않고 project constraints와 routing만 제공한다.

## 7. Existing-codebase 원칙

이 프로젝트에서는 기본적으로 **brand-new from-scratch 생성 경로를 사용하지 않는다.**

Superdesign에 넘길 때 반드시:

- 현재 `prototype/v2` codebase를 baseline으로 분석
- 기존 component/layout/token을 우선
- 현재 확정 docs와 Creative Freedom Zone을 전달
- 기존 UI의 data contract를 보존
- 새 SaaS dashboard를 재발명하지 않도록 명시

Superdesign의 `.superdesign/design-system.md`와 init/resume 파일은 **derived tool state**다. 프로젝트의 canonical source는 계속 `00_UIUX_MASTER.md`, 확정 설계 문서, 실제 code/token이다.

## 8. Context / privacy / data policy

Superdesign CLI는 선택한 context file과 design context를 외부 서비스에 전달해 draft를 생성한다. 따라서 이 프로젝트에서는 최소 컨텍스트 원칙을 적용한다.

**허용 기본값**
- UI component source
- layout/style/token
- 작은 screenshot/reference
- 프로젝트 공개 문서 중 해당 화면에 필요한 부분

**기본 제외**
- 340MB release asset
- `archive.json` 전체
- patient/participant-identifiable data
- secrets/token/credential
- 불필요한 experiment raw data
- repository 전체 bulk upload

현재 repo는 공개 프로젝트지만, 향후 private/sensitive 데이터가 들어오면 별도 승인 없이 외부 생성 서비스에 넘기지 않는다.

## 9. Reference Mining과의 관계

Reference Mining은 **무슨 느낌/원리를 만들지** 정한다.

Superdesign은 그 원리를 **현재 UI 구조 위의 concrete draft로 보여준다.**

```text
REF-021: object continuity
REF-032: editorial big type
REF-041: scientific overview→detail
          ↓
Idea A / B / C
          ↓
Superdesign branch A / B / C
```

Prompt에는 원본 사이트를 복제하라는 지시 대신, Reference Card에서 추출한 experience principle과 ECG translation을 넣는다.

## 10. Flourish와의 관계

Evidence/Data 화면에서는 순서가 중요하다.

```text
Flourish / Data Storyteller
  ↓ 어떤 관계를 보여줄 것인가
Visualization grammar freeze
  ↓
Superdesign
  ↓ 그 story를 우리 app screen 안에서 어떻게 compose할 것인가
```

Superdesign이 예쁜 chart를 임의로 고르는 것으로 Data Storytelling 단계를 대체하지 않는다.

## 11. Creative Production과의 관계

Creative Production은 mood / branding / key concept upstream 도구다.

Attract처럼 brand-like concept이 필요한 경우:

```text
Creative Production
→ "signal emerging from noise" mood/concept
Reference Mining
→ 실제 visual scene grounding
Art Director
→ project-specific directions
Superdesign
→ concrete UI branches
```

모든 화면에서 Creative Production을 호출하지 않는다.

## 12. Figma와의 관계

Figma를 Superdesign의 필수 후속 단계로 만들지 않는다.

- Superdesign draft만으로 충분히 비교 가능 → 바로 validator
- 최종 selected direction을 팀과 정교하게 편집/고정해야 함 → Figma
- 구현 가능한 간단한 방향이고 code handoff가 빠름 → 바로 Codex/Work 구현 가능

즉 Figma는 **design freeze/editable handoff surface**이지, 모든 탐색의 필수 관문이 아니다.

## 13. Draft 생성 규칙

1. 하나의 target에서 첫 round는 **2~4 branches**가 기본이다.
2. branch prompt는 방향 중심으로 쓴다.
   - 좋은 예: `cinematic scientific observatory`, `editorial evidence story`
   - 나쁜 예: 픽셀·색·shadow까지 미리 지정해 generator의 탐색 능력을 막는 prompt
3. 같은 baseline을 유지해 visual direction만 비교한다.
4. 비교하려는 차원이 하나라면 branch를 남발하지 않는다.
5. user/validator feedback 이후에는 선택 방향을 `replace/refine`하고, 새 대안이 필요할 때만 branch한다.
6. draft HTML을 그대로 production source로 덮어쓰지 않는다.

## 14. Output contract

Superdesign 실행 결과는 최소 다음을 반환한다.

- 대상 화면/기준 commit
- Superdesign project/canvas URL
- Superdesign skill review pin / 실제 CLI version / 사용 model(확인 가능할 때)
- draft id와 preview URL
- 각 branch의 한 줄 direction
- 사용된 Reference IDs / Creative Intent
- 유지한 project constraints
- 변경된 visual principle
- 아직 검증하지 않은 항목
- 다음 단계: user alignment 또는 validator

중요한 draft 선택/기각은 D 기록과 연결한다.

## 15. Validator로 넘기는 기준

Superdesign은 자기 결과를 승인하지 않는다.

최종 판정은 다음이 담당한다.

- Product Design — flow/task/interaction
- design-taste / UI UX Pro Max — hierarchy/taste/pattern
- motion-review — motion/data ambiguity/performance
- ECG project docs — waveform/data/time contracts
- user — visual intent와 Expo 적합성

판정은 `KEEP / TUNE / REJECT`.

## 16. Failure / fallback

- Superdesign unavailable/auth failure → Reference Mining + Figma/React light prototype
- codebase init 실패 → 기존 project docs와 selected source files로 최소 handoff 후 재시도 1회
- external draft가 기존 design system을 무시함 → REJECT, prompt를 고치는 대신 baseline/context 문제를 먼저 점검
- Superdesign 결과가 모두 generic → 21st.dev/Creative Production/reference set을 보강한 뒤 second round
- standard Chat → generator 실행을 시도하지 않고 Work/Codex/Claude/web app용 handoff packet을 만든다.

## 17. 채택 상태

**ADOPT — generator layer로 채택.**

다만 다음을 아직 증명해야 한다.

- 실제 2.2.1 page에서 branch 품질
- 현재 codebase fidelity
- branch 간 diversity
- user가 reference-only보다 visual intent를 더 빨리 판단하는지
- 생성 draft → implementation transfer 비용

첫 1~2회 실사용 결과 후 이 문서의 trigger 범위를 다시 검토한다.

Superdesign 공식 skill이 `@superdesign/cli@latest` 사용을 기본으로 안내하므로, **각 실험은 실제 CLI version과 생성 model을 기록**해 나중에 결과 품질 변화가 도구 업데이트 때문인지 구분할 수 있게 한다.
