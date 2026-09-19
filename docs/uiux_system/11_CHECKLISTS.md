# UI/UX 작업 직전 체크리스트

> **이 문서가 필요한 이유.** 상세 규약이 있어도 행동 직전에 보지 않으면 같은 실수를 반복한다. `10_RECORD_KEEPING.md`는 규약 원문이고, 이 문서는 **트리거별로 필요한 것만 보는 L2 체크리스트**다.
>
> 원칙: 자동화할 수 있게 된 항목은 여기서 빼고 `scripts/check-uiux-records.cjs`로 승급한다. 체크리스트가 길어지면 읽히지 않는다.

## §1 창의적 UI 아이디어를 발산하기 전에

- [ ] `00_UIUX_MASTER.md`와 `01_CREATIVE_DIRECTION.md`를 읽었나.
- [ ] 이번 영역이 HIGH / MEDIUM / LOW Creative Freedom 중 어디인지 정했나.
- [ ] 기존 화면을 새로 갈아엎는 게 아니라 **현재 문제를 어떤 방향으로 확장하려는지** 한 문장으로 적었나.
- [ ] 중요한 새 visual direction이면 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`의 자동/제안 trigger에 해당하는지 확인했나.
- [ ] reference mining을 썼다면 direct URL뿐 아니라 **어디를 봐야 하는지 viewing instruction**과 `Reference Feature → Experience Principle → ECG Translation`을 남겼나.
- [ ] reference mining을 썼다면 Imitation Distance가 기본 3~4인지, 원본 appearance를 그대로 복제하고 있지 않은지 확인했나.
- [ ] 최소 3개, 권장 5개 이상의 서로 다른 대안을 만들었나.
- [ ] unusual하다는 이유만으로 초기 후보를 제거하지 않았나.
- [ ] 이미 과거에 reject된 아이디어라면 `D_DECISIONS.md`를 먼저 확인했나.

## §1A Superdesign concrete draft를 만들기 전에

- [ ] 이 작업이 단순 polish가 아니라 **실제 visual branch 비교가 필요한 significant CREATIVE 작업**인가.
- [ ] Reference Mining / Art Director 단계가 끝났거나 사용자가 이미 충분히 구체적인 방향·reference를 줬나.
- [ ] 8~10개 아이디어를 그대로 생성하지 않고 **2~4개로 shortlist**했나.
- [ ] existing `prototype/v2` codebase를 baseline으로 쓰고 brand-new from-scratch를 피했나.
- [ ] Flourish/Data Storyteller가 먼저 정해야 할 visualization grammar를 Superdesign에게 떠넘기고 있지 않나.
- [ ] release/archive/raw experiment data/credential을 context로 넘기지 않았나.
- [ ] generator output을 승인안으로 취급하지 않고 canvas/preview에서 멈출 계획이 있나.
- [ ] 결과를 Product Design / design-taste / motion-review / project contract로 별도 검증할 계획이 있나.
- [ ] standard Chat처럼 shell이 없는 환경이면 실행을 가장하지 않고 handoff packet만 만들고 있나.

## §2 중요한 설계 후보를 고르기 전에

- [ ] 이것이 단순 값 조정인가, 아니면 결과의 성격을 바꾸는 **갈림길**인가.
- [ ] 갈림길이면 구현 전에 D 항목을 만들었나.
- [ ] 고른 안뿐 아니라 **버린 안과 이유**를 적었나.
- [ ] 무엇이 관측되면 이 결정을 되돌릴지 적었나.
- [ ] 사용자 승인과 구현 승인을 구분했나.

## §3 파형·motion·transition을 수정하기 전에

- [ ] `03_MOTION_AND_POLISH.md`와 `motion-review` 기준을 확인했나.
- [ ] 이 motion이 실제로 돕는 것은 attention / state change / continuity 중 무엇인가.
- [ ] signal geometry를 가리거나 존재하지 않는 중간 파형을 만들지 않나.
- [ ] play/pause/wrap/pin/zoom/reduced-motion 상태를 확인할 계획이 있나.
- [ ] 이전 판단이 바뀌었다면 F 또는 D의 기존 항목을 조용히 고치지 않고 연결했나.

## §4 데이터 시각화/Flourish를 쓰기 전에

- [ ] 관람객이 5~10초 안에 이해해야 할 **한 문장 insight**가 먼저 정해졌나.
- [ ] 단위가 다른 지표를 높이/면적/3D 크기로 직접 비교하고 있지 않나.
- [ ] Flourish 결과를 프로젝트 성능 증거로 오해하지 않도록 원본 데이터와 source를 분리했나.
- [ ] 최종 앱에 embed할지, 아이디어만 가져와 React/Canvas로 재구현할지 구분했나.
- [ ] 시각화 선택이 중요한 갈림길이면 D를 먼저 적었나.

## §5 AI / Plugin / Skill 제안을 채택하거나 반박할 때

- [ ] 지금 해결하려는 문제가 **실행 편의성**인지 **판단/창의 capability gap**인지 먼저 분리했나.
- [ ] AI/Plugin이 제안한 이유를 프로젝트 맥락에서 다시 검증했나.
- [ ] 사용자가 반론해 판단이 바뀌었다면 R 후보인지 확인했나.
- [ ] 외부 제안을 단순히 많이 채택하지 않고 ADOPT / TUNE / REJECT 이유를 남겼나.
- [ ] 다음 프로젝트에서도 쓸 수 있는 `재사용 규칙`이 있다면 R로 승급했나.

## §6 이상한 화면·결과를 발견했을 때

- [ ] 원인을 알기 **전에** 무엇이 이상해 보였는지 기록했나.
- [ ] 처음 의심한 가설을 지우지 않았나.
- [ ] 가설을 배제한 캡처/런타임/코드/테스트 근거를 남겼나.
- [ ] 결정적 근거와 `놓쳤다면`을 적었나.
- [ ] 당시 기록이 없으면 `[재구성]` 또는 `기록 없음`으로 정직하게 표시했나.

## §7 사고·중단·협업 실패를 해결했을 때

- [ ] 결과를 바꾼 사건이면 F, 시간/재현성 문제면 O로 분류했나.
- [ ] 재발 방지책이 문서에만 있는지, 자동화 가능한지 확인했나.
- [ ] 특정 resource 문제를 repository-wide 규칙으로 과도하게 일반화하지 않았나.
- [ ] 테스트/스크립트로 승급했다면 아래 승급 대장에 한 줄 남겼나.

## §8 방법론 CASE를 쓸 때

- [ ] 단순한 최종 결과 요약이 아니라 **배경 → 문제 제기 → AI 응답 → 반론 → 판단 변화 → 시스템**의 흐름이 보이나.
- [ ] 사용자가 몇 달 뒤 다시 읽었을 때도 "왜 이 시스템이 생겼는가"를 따라갈 수 있는가.
- [ ] 핵심 비유·문제 정의·사용자 질문이 지나치게 요약되어 의미를 잃지 않았나.
- [ ] 판단을 바꾼 핵심 발화의 원문이 현재 대화/export에 있으면 **짧은 직접 인용**을 남겼나.
- [ ] 원문이 없으면 따옴표로 그럴듯하게 만들지 않고 `[재구성]` 또는 `기록 없음`을 썼나.
- [ ] 대화가 길고 방법론 가치가 높다면 `CASE-*_TRANSCRIPT_EXCERPTS.md` 부록이 필요한지 검토했나.
- [ ] 사용자와 AI의 기여를 분리했나.
- [ ] 관련 F/D/O/R과 commit을 연결했나.
- [ ] 커리어용 문서라면 "AI가 해줬다"보다 **문제 정의·검증·반박·구조화 능력**이 드러나나.
- [ ] 한계를 명시했나. 반사실이 없으면 없다고 썼나.

## §9 커밋 / PR 전에

- [ ] `npm run records:check` 또는 전체 `npm test`를 돌렸나.
- [ ] 새 `.claude/skills/*`가 `07_EXTERNAL_SKILLS_PROVENANCE.md`에 등록됐나.
- [ ] 새 CASE가 실제 F/D/O/R을 가리키나.
- [ ] 새 시스템 문서가 Index/Master에서 찾아갈 수 있나.
- [ ] 문서 PASS와 runtime/browser PASS를 혼동하지 않았나.

---

## 승급 대장 — 사람 체크에서 기계 검사로 옮긴 것

| 항목 | 자동 검사 | 계기 |
|---|---|---|
| F/D/O/R 필수 절과 ID 중복 | `check-uiux-records.cjs` | 결론만 남고 판단 경로가 사라지는 것을 방지 |
| R의 재사용 규칙 / D의 되돌림 조건 | `check-uiux-records.cjs` | AI 사용 교훈·설계 결정이 단순 메모가 되는 것을 방지 |
| CASE → F/D/O/R 연결 | `check-uiux-records.cjs` | 커리어용 서사가 증거 없는 자화자찬이 되는 것을 방지 |
| CASE의 대화 근거 또는 원문 부재 명시 | `check-uiux-records.cjs` | 형식은 맞지만 사람이 다시 읽을 핵심 전환점이 사라지는 것을 방지 |
| CASE의 사용자/AI 기여 구분 | `check-uiux-records.cjs` | 협업 사례가 "AI가 다 했다" 또는 "사용자가 다 했다"로 평면화되는 것을 방지 |
| project-local Skill provenance | `check-uiux-records.cjs` | 외부/로컬 Skill이 출처·역할 없이 누적되는 것을 방지 |
| Master/Index가 기록 시스템을 가리키는가 | `check-uiux-records.cjs` | 규약이 만들어져도 다음 세션이 못 찾는 문제 방지 |

### 아직 사람 체크로 남은 것

자동 검사는 인용의 **존재 여부와 출처 표시**까지만 확인할 수 있고, 그 발화가 정말 핵심 turning point인지까지 판정하지 않는다. §8에서 사람이 흐름과 맥락을 최종 확인한다.

현재 코드 구조에서는 새 route/component/token 변경이 "중요한 D 의무"인지 자동으로 안정적으로 판별하기 어렵다. 별도 ledger를 새로 만들어 또 잊는 문제를 만들지 않는다. component/token/route/feature registry가 canonical source로 정리되면 그 구조에서 D 의무를 유도하는 검사로 승급한다.

## §10 방법론을 변경할 때 — 같은 작업 단위의 기록 게이트

- [ ] AI 역할·orchestration·source of truth·검증·handoff·creative 방법론·기록 규칙 변화이면 CASE를 작성/갱신했나.
- [ ] D/R의 CASE 비연결 사유가 실질적으로 타당한가. 보류 조건이 구체적인가. 사용자 명시 요구를 회피하지 않았나.
- [ ] handoff 인용은 전달 발췌임을 밝히고, AI 초기 응답의 원문이 없으면 요약/재구성으로 표시했나.
- [ ] 초기 판단·반론·수정·시스템 변화와 설계 채택/구현 완료를 구분했나.

자동 승급: D/R CASE 필드·대상·사유·보류 재검토 조건·main 번호 유일성은 checker와 임시 fixture 회귀 검사에서 확인한다. 방법론 판별·사유 타당성·서사 품질은 사람 검토로 남는다.
