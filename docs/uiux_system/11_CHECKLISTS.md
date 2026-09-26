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

## §1A Superdesign **CONCRETIZER** concrete draft를 만들기 전에

- [ ] 이 작업이 단순 polish가 아니라 **선택된 방향의 실제 visual branch 비교가 필요한 significant CREATIVE 작업**인가.
- [ ] Reference Mining / Art Director 단계가 끝났거나 사용자가 이미 충분히 구체적인 방향·reference를 줬나.
- [ ] 많은 아이디어를 그대로 생성하지 않고 **선택된 1개 또는 비교할 2~4개**로 좁혔나.
- [ ] existing `prototype/v2` codebase를 baseline으로 쓰고 brand-new from-scratch를 피했나.
- [ ] Flourish/Data Storyteller가 먼저 정해야 할 visualization grammar를 Superdesign에게 떠넘기고 있지 않나.
- [ ] release/archive/raw experiment data/credential을 context로 넘기지 않았나.
- [ ] generator output을 승인안으로 취급하지 않고 canvas/preview에서 멈출 계획이 있나.
- [ ] 결과를 Product Design / design-taste / motion-review / project contract로 별도 검증할 계획이 있나.
- [ ] standard Chat처럼 shell이 없는 환경이면 실행을 가장하지 않고 handoff packet만 만들고 있나.

## §1B Superdesign **NATIVE_DIRECTOR**를 실행하기 전에

- [ ] `16_DUAL_CREATIVE_DIRECTOR.md`에서 B_ONLY 또는 Dual의 B로 route되었나.
- [ ] A의 reference / idea / shortlist / 선호 / draft를 제외한 **clean baseline packet**만 준비했나.
- [ ] 기존 `.superdesign` resume/project/draft state에 A 결과가 섞이지 않았는지 확인했나. 섞였으면 Native용으로 재사용하지 않나.
- [ ] 먼저 **4~6 SD Direction Cards**를 만들고, B 내부 cheap prefilter 뒤 **유효한 1~2개만 draft**로 생성하도록 예산을 고정했나.
- [ ] first pass에서 A와의 중복 비교를 하지 않고 B 내부 중복만 제거하나.
- [ ] shell 존재와 실제 vendor/auth/network 가능 여부를 구분했나.
- [ ] context isolation이 안 되면 독립 실행 성공을 주장하지 않고 `B_HANDOFF_READY` / `INDEPENDENCE_UNVERIFIED`로 멈출 계획인가.
- [ ] Native 결과도 자기 승인하지 않고 A/B 동결 뒤 cross-review + validator로 넘길 계획인가.

## §1C Alpha 실행 전

- [ ] `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`를 읽었나.
- [ ] Common Creative Packet의 target / 3초 목표 / next action / hard constraints가 고정됐나.
- [ ] 17번 registry에서 2~4 source family와 3~8 reference를 고르고 viewing instruction이 있나.
- [ ] macro art-direction reference와 component reference를 구분했나.
- [ ] fidelity target이 STRUCTURAL / STRONG_ADAPTATION / NEAR_FINAL 중 무엇인지 정했나.
- [ ] reference의 palette/composition/signature UI/motion 중 실제로 가져올 것을 명시했나.
- [ ] implementation feasibility를 이유로 발산 전에 creative ambition을 낮추지 않았나.
- [ ] Scene Blueprint + Component Inventory + Motion Spec + Data Contract + Implementation Blueprint를 모두 만들 계획인가.

## §1D Beta image concept 실행 전

- [ ] `19_BETA_IMAGE_CONCEPT_TRACK.md`를 읽었나.
- [ ] 아무 "futuristic ECG" prompt가 아니라 Reference IDs와 exact borrowed features가 있나.
- [ ] baseline screenshot을 쓸 수 있으면 확보했나. 없으면 conceptual still임을 명시했나.
- [ ] image prompt에 project identity / hero waveform / reference translation / negative constraints / fidelity를 포함했나.
- [ ] 생성 이미지의 text/axis/waveform pixel을 실제 데이터 증거로 쓰지 않을 계획인가.
- [ ] image 뒤에 Component Translation + Interaction Translation + Motion Storyboard + Gap register를 반드시 작성할 계획인가.
- [ ] Alpha와 비교하는 first pass라면 Alpha-specific 결과를 Beta prompt에 섞지 않았나.
- [ ] generic medical dashboard / meaningless metric / random cyberpunk로 drift하지 않는지 검토할 계획인가.

## §1E Alpha/Beta cross-review 전

- [ ] 두 track이 같은 Common Creative Packet을 사용했나.
- [ ] 둘 다 first pass를 freeze했나.
- [ ] Creative Impact / Reference Translation / ECG Identity / Waveform Centrality / Story / Completeness / Interaction / Component / Data Integrity / Implementation Reality / Accessibility를 같이 비교하나.
- [ ] 점수 합계로 자동 winner를 고르지 않나.
- [ ] 사용자가 살릴 것 / 거슬리는 것 / 더 과감하게 할 것 / 프로젝트답지 않은 것을 표시할 기회를 받나.
- [ ] Hybrid가 필요하면 결합 이유를 한 문장으로 설명할 수 있나.

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

## §11 Dual Director 실행 전후 — 역사/명시적 재검증

- [ ] 16번으로 target/task/zone/명시 모드를 정했나. HIGH여도 frozen 구현이면 자동 탐색을 생략했나.
- [ ] baseline SHA와 공통 manifest를 고정하고 서로의 출력을 제외한 별도 A/B context를 만들었나.
- [ ] B init/resume/project/draft에 A 아이디어가 섞이지 않았나. 불가능하면 handoff/미검증으로 표시했나.
- [ ] A 5~8 concepts, B 4~6 cards와 prefilter 이유, 최대 1~2 drafts 예산을 지켰나.
- [ ] prefilter 중복은 B 내부에만 적용했나. 낯설다는 이유만으로 제거하지 않았나.
- [ ] 양쪽 동결 뒤 cross-review했나. Hybrid는 상보적 근거와 부모 IDs가 있고 한 번 이내인가.
- [ ] Chat/shell 및 실제 auth/network capability를 구별하고 실패/미실행을 완료로 부르지 않았나.
- [ ] actual sources/CLI/model/URLs/budget와 rejected reasons를 반환하고 user+validator를 거쳤나.
- [ ] 문서/skill 검증과 실제 생성 품질·UI 검증 결과를 구별했나.

## §12 3D 장면 · 레퍼런스 재현 작업 전후 (D-019)

- [ ] **셰이더·후처리 검토**(빛 효과만이 아니라 3D 작업 전부): 재질(PBR 맵·굴절·SSS), 조명(그림자·AO·bake 여부), 대기(안개·볼륨 빛줄기·먼지), 색보정(톤매핑·LUT·채도·난색), 선명도(AA·bloom·DOF·grain), 성능 비용을 각각 "넣음 / 뺌 / 해당 없음 — 이유"로 적었나.
- [ ] 넣은 셰이더·후처리는 전후 캡처 또는 수치(밝기 분위·채도, F-016)로 효과를 확인했나. 전시 PC 성능이 미확정이면 끄는 스위치(URL·상수)가 있나.
- [ ] **프레임 대조**: 움직이는 효과마다 구간 전체를 균등하게 **최소 6장(권장 12장)** 캡처해 레퍼런스의 같은 비율 프레임과 나란히 놓았나. 시간 루프 효과(소나·회전 링)는 시간축으로 같은 수.
- [ ] 효과의 핵심 좌표·값(표시기 화면 y, 진행률, 투명도 등)을 장마다 수열로 기록했나(F-017).
- [ ] 수정한 뒤 같은 구간을 **다시 전부** 캡처했나 — 수정 하나가 다른 결함을 드러낼 수 있다.
- [ ] 레퍼런스 프레임이 든 비교 이미지는 저장소 밖에 두고, 우리 캡처만 `verification/`에 남겼나.
- [ ] 에셋은 D-020 순서(Poly Haven → ambientCG → Openverse → Kenney·Quaternius → NASA)로 찾아봤나. 외부 UI 컴포넌트는 D-021에 따라 기법 공급원으로만 보고, 코드 채택은 같은 대조를 통과할 때만 했나.
- [ ] 영상·연속 이미지 구간이면 `22_AI_VIDEO_SCROLL_PIPELINE.md` V0 적합성 판정을 했나. 디코딩 메모리(폭×높이×4×동시 보유 장수)를 예산에 넣었나(F-018).
- [ ] 에셋은 `24_ASSET_RESEARCH_STAGE.md`대로 `explore.mjs`로 모든 조달처를 탐색했나. 로그인 요청이 나왔으면 후보와 함께 사용자에게 전달했나(토큰은 채팅으로 받지 않음, D-022).
- [ ] 구현 전에 `23_EXTERNAL_COMPONENT_REVIEW.md` C1–C3(분류·후보·예측)을 적었나. 라이선스(MIT·재배포 금지·Commons Clause·AGPL)를 확인했나(D-024).
- [ ] AI 영상 구간이면 시선 방식(작은 회전 = 여백 이동, 진짜 시차 = 3D)과 정지 생명감 방식(카메라 경로 = 시간 층, 반복 = idle play)을 정했나(F-019, F-020, D-026). 생성 입력 자료가 단계별 정책에 맞나(D-025).

## §13 사용자에게 연출 결과를 보이기 전 — 충실도 게이트 (D-029, `25` §6)

- [ ] G1 효과 카드의 수치를 코드 상수로 옮기고 REF-ID·EFX-ID 주석을 달았나(없으면 "미확인 — 이유").
- [ ] G2 모든 재료가 registry에 있고 해시 고정·허용 라이선스·해상도(텍셀 ≥ 1:1)·용량(§5 임시 예산)을 지키나.
- [ ] G3 효과 구간마다 레퍼런스와 최소 6장(권장 12장) 나란히 대조하고 KEEP/TUNE/GAP 표를 썼나(비교 이미지는 저장소 밖).
- [ ] G4 룩을 맞추는 작업이면 밝기 분위·채도·난색을 레퍼런스와 수치 비교했나.
- [ ] G5 모든 상태(각도·필터·스크롤 구간·hover·정지 시간축·reduced-motion)를 캡처했나.
- [ ] G6 자기 수정은 3회 이내였고, 수정할 때마다 G3·G5를 다시 전부 캡처했나. 남은 GAP만 사용자에게 묻나.
- [ ] `verification/<작업>-<날짜>/fidelity.md`를 남겼나. 헤드리스 결과와 실제 GPU·체감 확인이 필요한 항목을 구별했나.

