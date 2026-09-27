# 26. Reference-to-ECG Production Workflow v1

상태: **신규 HIGH/MEDIUM 시그니처 연출의 공식 진입 계약** (D-038, 2026-09-27). 상위 라우팅은 `00_UIUX_MASTER.md`; 효과 기록은 `21`, 기술 제작은 `22–25`, 기록은 `10`과 CASE-006을 따른다. 기존 Alpha/Beta 결과와 명시적 비교 실험은 `18–20`에 보존한다.

## 0. 적용과 우선순위

사용자가 지정한 wow point 또는 새 Attract/Story/major transition/Result Reveal의 **고유한 움직임·공간·조명·상호작용**을 ECG 프로젝트에 번안하려는 HIGH/MEDIUM 작업에 적용한다. 새 효과가 없어 검증된 recipe를 그대로 조합하는 작업은 Phase 1–6의 기존 증거를 참조하고 필요한 차이만 재검증한다. LOW 파형 판독, 단순 polish, 이미 동결된 구현은 기존 `docs/21_ui_refinement_workflow_final.md`와 데이터·검증 계약을 따른다.

사용자가 레퍼런스를 명시했으면 그것을 먼저 다룬다. 레퍼런스가 없고 중요한 새 방향을 요청했다면 `13`과 `17`로 후보를 찾는다. 사이트 전체 분석을 무조건 다시 실행하지 않는다. 사용자 지정 효과가 이미 기록되어 있으면 현재 카드와 증거의 빈칸만 채운다. 방법론은 레퍼런스의 **연출 원리**를 익히기 위한 것이며, 원본의 에셋·코드·로고·색·배치를 복제하는 허가가 아니다.

모든 ECG 장면의 우선순위는 최신 사용자 지시와 확정 데이터 계약이다. 파형·시간·±mV 축·Reference/Difference·방법 출력·지표는 canonical 저장 자료에서 그린다. 영상/생성 이미지의 가짜 ECG는 자료 증거가 아니다. **같은 ECG**라고 말하려면 record ID, 잡음 실현, 비교 sample index, 시각, 축과 필요한 조건이 실제로 같은지 확인한다(F-025). D1의 잡음별 세 장면은 서로 다른 기록이고 D0 S038의 해당 조건만 동일 합성 기록의 비교다. 합성/실제 기록과 REPLAY/ARCHIVED/GENERATED 상태를 화면에 정확히 표시한다.

## 1. 역할·증거·상태

사용자는 지목한 wow, ECG 의미, 선택한 시각 방향과 마지막 미감·적합성 판단을 제공한다. AI는 레퍼런스 관찰, 입력 모델 판별, 독립 재현, 자체 결함 발견/수정, 자료 검증, 제품 구현과 QA를 수행한다. 역할 분리는 책임 구분이지 별도 에이전트 호출 의무가 아니다. 중요한 선택은 구현 전 D에 대안·기각 이유·되돌릴 조건을 남기고, 판단을 바꾼 관찰은 F, 사고는 O, AI 협업 규칙은 R에 남긴다.

증거 레벨은 `00`의 L0 IDEA / L1 SOURCE / L2 STATIC / L3 INTERACTIVE / L4 TARGET을 쓴다. `[영상]`, `[코드]`, `[런타임]`, `[추론]` 등은 출처 종류다. 한 레벨의 PASS를 더 높은 레벨로 주장하지 않는다. 원본 source에 접근할 수 없으면 관찰과 판별 실험에서 **가장 잘 맞는 가설** 및 신뢰도를 쓰고, ‘실제 원본 mechanism 확인’이라고 말하지 않는다.

| 상태 | 뜻 | 통과 조건 |
|---|---|---|
| `CANDIDATE` | 관찰/가설/미검증 spike | fidelity 주장 금지 |
| `REPRO_PARITY_READY` | 원본 wow의 독립 재현 검증 | Phase 5의 P0/P1=0, 동작/상태/재료 증거 및 남은 P2 공개 |
| `INTEGRATION_READY` | 실제 ECG 앱 기술 통합 | Phase 10의 필수 경로와 데이터 P0=0 |
| `HUMAN_REVIEW_READY` | 최종 미감·프로젝트 적합성 검토 가능 | Phase 11의 P0/P1=0, 차이·P2·미검증 L4 공개 |
| `BLOCKED_FOR_REVIEW` | 3회 자체 수정에도 주요 결함 또는 필수 근거 부족 | 원인·시도·선택지·비용을 보고. READY/완료로 표기하지 않음 |

**P0:** wow 메커니즘, 입력 모델, ECG 자료 의미 또는 필수 경로가 깨짐(예: match cut 대신 fade, 다른 기록을 같은 ECG로 표기). **P1:** 분명한 지각/상호작용 차이 또는 제품 품질 결함(예: 표시기 경로 이탈, easing 끊김, 잘못된 대비). **P2:** 품질의 작은 조정. 원본의 의도적인 차이와 우리 ECG 번안에서의 의도적 변경은 서로 구분해 기록한다. P0/P1을 단순히 ‘tradeoff’로 바꿔 READY를 주지 않는다. 사용자가 특정 차이를 허용했다면 새로운 acceptance decision과 범위를 기록하고 다시 검증한다.

## 2. 전체 순서

```text
1 Reference Mining → 2 Wow Point Freeze → 3 Effect Forensics
→ 4 Independent Repro Spike → 5 Detail Parity Gate
→ 6 Versioned Effect Recipe → 7 ECG Creative Synthesis
→ 8 Alpha Product Design [8B Composition Still, 필요할 때만]
→ 9 Real Implementation → 10 Integration/Staging Gate
→ 11 Product Self-QA → 12 User Final Detail Review
```

한 번의 effect packet(`REF-ID/EFX-ID`)이 1–5에서 진전된다. 번호마다 별도 회의나 긴 문서를 요구하지 않는다. 각 단계의 `입력 → 실행 → 산출물/게이트 → 실패 경로`를 아래에 명시한다. 새 자료가 앞 판단을 뒤집으면 해당 단계로 돌아가고 후속 증거를 다시 판정한다.

## 3. 단계별 실행 계약

### 1 — Reference Mining

**입력:** 사용자 URL·영상·구간·viewing instruction을 우선, 없으면 Creative Intent와 `13/17`. **실행:** 대상 사이트의 장면·전환 지도를 만들고 정확 URL/시간/스크롤 위치/viewport/조작 순서를 적는다. 전체 art direction과 개별 효과, 관찰과 첫 기술 가설을 분리한다. 사용자가 지목한 순간은 모두 후보에 남긴다. **산출/게이트:** Reference Card(원본, target scene, wow, 이유, 보는 법, 잠정 ECG 연관, 근거 레벨). 지목 누락 0. **실패/비용:** 증거가 없으면 미확인과 필요한 촬영을 남긴다. 후보는 다음 단계에서 좁힌다. 이미 선정된 REF는 재탐색하지 않는다.

### 2 — Wow Point Freeze

**입력:** Phase 1 카드. **실행:** 효과의 onset–end, primary wow, supporting detail, 제외 요소, 어떤 입력/상태에서 보이는지, 수용 기준 초안을 `EFX-ID`에 버전과 함께 고정한다. 예: 지구→선→카드의 형태 연속이 primary, 역광은 supporting, footer는 제외. **산출/게이트:** 범위·우선순위·비교할 원본 구간이 한 effect segment로 재생 가능해야 한다. **실패/비용:** 사이트 전체를 하나로 묶었으면 분할하고, 단일 프레임만 뽑아 인과가 사라졌으면 구간을 넓힌다.

### 3 — Effect Forensics

**입력:** 동결된 EFX, 사용자 녹화/라이브/source. **실행:** ① 프레임별 움직이는 대상과 고정층·가림·빛의 순서 관찰 ② scroll position/velocity/wheel impulse, 시간, pointer/drag/hover, threshold, idle/load/resize 및 복합 입력 가설 작성 ③ stop·resume·reverse·한 번 wheel·빠른/느린 입력·pointer stationary·resize로 판별 ④ 가능하면 DOM/CSS/SVG/Canvas/WebGL/영상, JS·shader, network·asset 조사 ⑤ duration/easing/scrub·lag·camera/FOV·lighting/material/post·용량/해시 등을 값·단위·출처·confidence와 함께 기록한다. **산출/게이트:** `21` 효과 카드의 판별 근거·파라미터·에셋·수용 기준. 미확인 필드는 ‘미확인 — 이유 + 시험 방법’. **실패/비용:** 소스를 못 보면 행동 가설 두 개를 spike에서 비교한다. 녹화 상관만으로 기법을 확정하지 않는다(F-012).

### 4 — Independent Repro Spike

**입력:** Phase 3 카드, 별도 라이선스가 명확한 재료와 기술 경로. **실행:** 작은 독립 페이지에서 최소 geometry→핵심 motion→올바른 입력 결합→asset quality→lighting/material/shader/post→micro motion→performance/fallback 순으로 만든다. `25`의 vanilla 엔진/React 경계, `22` AI 영상 적합성, `23/24` 컴포넌트·에셋 선택은 필요할 때만 호출한다. 원본 효과를 학습하는 동안 ECG 장면을 섞지 않는다. 원본 에셋·코드를 복사하지 않고 동등한 재료를 만든다. placeholder는 표시한다. **산출/게이트:** 실행 가능한 spike, 고정된 입력/버전/에셋, 재생성 명령과 미완성 범위. **실패/비용:** P0 수준의 기법 한계가 확인되면 경로를 바꿔 비교하거나 EFX를 보류한다. 전체 사이트를 만들지 않는다.

### 5 — AI Detail Parity Gate

**입력:** 같은 viewport·scale·입력 궤적의 원본 증거와 spike. **실행:** 효과 구간당 normalized progress 최소 6장, 권장 12장. onset/전환/문제 구간은 추가 표본을 둔다. 시간 루프는 별도 시간축으로, scroll+time 효과는 scroll 위치와 정지 후 경과 시간을 함께 기록한다. stop/resume/reverse/hover/drag/release/reduced-motion은 해당 효과에서 관찰되거나 요구되는 상태로 freeze 때 목록화한다. 위치·크기·카메라·깊이/가림·타이밍/easing/관성·빛·재질·색·typography·shader/post·asset·micro detail을 표로 비교한다. **연속 녹화/입력 로그**로 프레임 사이 끊김과 멈춤 체감을 확인한다. 수치 비교는 조명/색을 맞추는 작업에서 사용한다.

각 결함은 `reference evidence | reproduction | observed difference | severity | likely cause | fix | confidence | regression risk`로 남긴다. P0/P1을 수정하면 **전체 구간과 관련 상태를 재캡처**하고 영상도 다시 본다(F-017). `25` G1–G6와 최대 3회 자체 수정 상한을 따른다. **산출/게이트:** 차이 장부, 캡처·클립 manifest, 남은 차이 공개, P0/P1=0일 때만 `REPRO_PARITY_READY`. **실패/비용:** 3회 뒤 남으면 `BLOCKED_FOR_REVIEW`로 이유·비용·대안을 제시한다. 원본 프레임이 포함된 비교 sheet는 저장소 밖에 두고 우리 캡처와 수열만 `verification/`에 둔다.

### 6 — Versioned Effect Recipe

**입력:** `REPRO_PARITY_READY` 증거, spike 코드/재료. **실행:** 유일한 `RCP-ID`와 version을 정하고 perceptual goal, input model, 알고리즘, 적용 범위와 critical parameter/range, source EFX/증거, 실제 code path, asset provenance/rights/hash, timeline, 성능·오프라인 비용, 실패 사례, reduced motion/fallback, clean-start 실행과 QA 절차를 연결한다. 특정 레퍼런스의 숫자는 recipe의 필수 규칙이 아니라 사례로 둔다. **성숙도:** `observed → spiked → parity-checked → target-PC-verified → production-used`. 색인 등재는 verified를 뜻하지 않는다. **산출/게이트:** 다른 세션이 레퍼런스를 다시 열지 않고 재현을 시작하고 같은 검사를 돌릴 수 있는 recipe; `verified`라는 표현은 최소 `parity-checked`에서만. **실패/비용:** 근거가 모자라면 candidate로 유지한다.

### 7 — ECG Creative Synthesis

**입력:** 검증된 recipe/version, 연구 질문과 canonical data contract. **실행:** 관람객이 3/15/60초 안에 알아야 할 주장부터 고른다. recipe가 그 의미를 어떻게 보여주는지 2–3개 번안안을 만든 뒤 데이터 객체/기록/시간/축의 동일성과 범위를 확인한다. 하나의 장면에 primary wow 하나를 중심으로 visual consistency와 과밀도를 본다. 예: 형태 연속 match cut의 선은 실제 R peak 좌표에서 장면 경계로 이어지되, 새 중간 파형을 만들지 않는다. REF-003 소나는 실제 심박 측정처럼 보이지 않도록 **조건 표시**에만 쓴다. **산출/게이트:** 연구 주장, 자료 provenance, recipe ID/version, 채택·기각 이유와 risk를 가진 concept card. **실패/비용:** 장식만 남거나 ‘같은 ECG’가 F-025에 어긋나면 보류/다른 자료·효과로 돌아간다.

### 8 — Alpha Product Design

**입력:** 선택한 ECG concept, 현재 앱·승인 범위, recipe critical params. **실행:** `18`의 A-01~A-10을 사용하되 scene blueprint, component inventory, state machine, master timeline, scroll/시간/클릭 매핑, canonical data binding, responsive/reduced motion, asset/loading/performance budget, offline fallback, acceptance criteria와 Change Contract를 한 표로 추적한다. 구현자가 새 디자인 결정을 하지 않아도 되는 수준이어야 한다. **산출/게이트:** scene/component/state/data/recipe/검증의 trace matrix와 handoff. **실패/비용:** 효과 품질이 희석되면 7, recipe 자체가 맞지 않으면 3–6으로 돌아간다.

**8B — Optional Composition Still:** 8의 장면 구도·빛·요소 위치가 구체적이지만 한 장의 시각 확인이 가치 있을 때 `19`의 이미지 생성/번역표를 제한해 사용한다. 문구·수치·파형 픽셀은 illustrative다. 이 이미지로 motion fidelity를 주장하지 않는다. 이미지가 새 요소를 제안하면 7/8에서 의미·자료·구현 계약을 재판정한다. 사용자 명시 Alpha/Beta 독립 비교는 역사/실험 계약 `20`으로 별도 실행하고 그 결과를 새 기본 경로로 자동 승격하지 않는다.

### 9 — Real Implementation

**입력:** 8의 Change Contract, recipe code, canonical renderer/state/data. **실행:** 작은 수직 slice에서 엔진/React 마운트·same-time handoff·asset load/오프라인·feature flag/rollback·build size와 런타임 비용을 통합한다. spike를 복사해서 데이터 의미를 새로 만들지 않는다. 프레임 값은 React state에 넣지 않고 Lenis는 페이지 하나만 둔다(`25` §4). **산출/게이트:** 버전된 코드, 사용한 recipe와 변경 이유, 데이터 계약 검증점. **실패/비용:** 설계 빈칸은 8, 효과 자체의 결함은 4–6으로 되돌린다.

### 10 — Integration/Staging Gate

**입력:** 실제 앱 preview/build와 실제 저장 bank. **실행:** route 진입/이탈·pause/resume·Lab 인계의 sample index/시각/축·모드 전환·loading/failure/refresh·오프라인·console·기본 용량을 smoke test 한다. **산출/게이트:** 명령/커밋/환경/결과, 필수 경로와 데이터 P0=0일 때 `INTEGRATION_READY`. L3 headless와 L4 Windows 전시 PC는 따로 적는다. **실패/비용:** 통합 코드는 9, 계약 자체 모순은 8로 돌아간다.

### 11 — Product Self-QA

**입력:** `INTEGRATION_READY` 제품과 8의 acceptance criteria. **실행:** Phase 5의 원본 fidelity가 아니라 **ECG 제품 의미**를 본다: 파형·기록·sample index·단위/축·Reference/Difference·지표/범위, research story의 과장, recipe intent, component/scene transition, keyboard/touch/resize/reduced-motion, 10분 soak와 GPU/fallback(가능한 환경에서)을 검증한다. 제품 시퀀스도 관련 상태의 캡처·영상으로 자체 감사한다. **산출/게이트:** P0/P1=0, 남은 P2·레퍼런스와 의도적으로 달라진 점·L4 미검증 및 실제 시험 범위를 먼저 나열한 `HUMAN_REVIEW_READY` packet. **실패/비용:** 수정 범위에 따라 7–11로 되돌리고 영향받은 상태를 재검증한다. 3회 한도 뒤 P0/P1은 차단 보고다.

### 12 — User Final Detail Review

**입력:** READY packet(원본 viewing instruction, 우리 영상/화면, 차이 장부, 테스트 레벨, 남은 P2). **실행:** 사용자는 wow 감각, ECG 연구와의 어울림, 미적 nuance, 선호·남은 polish를 판단한다. AI는 기능 결함을 미리 목록화·수정하고, 사용자에게 bug finding을 기본 업무로 넘기지 않는다. **산출/게이트:** KEEP/TUNE/REJECT와 이유·재검토 조건, 변경 후 필요한 회귀 범위. 사용자가 수정을 고르면 해당 7–11 단계를 다시 검증한다. L4 미검증은 최종 배포 PASS와 별개의 open item이다.

## 4. 인계 packet과 회귀 규칙

| 전환 | 빠뜨리면 안 되는 것 |
|---|---|
| 1→2→3 | exact scene, 사용자 wow, EFX 범위, viewing/입력 조건, 관찰·가설 구분 |
| 3→4→5 | 입력/기법 판별 근거와 uncertainty, 수치/재료, 동일 viewport·입력 재생 |
| 5→6→7 | 전체 상태 parity 증거, 결함 원인, recipe version/maturity, ECG 위험 |
| 7→8→9 | 연구 주장/자료 scope, recipe critical params, state/timeline/data, Change Contract |
| 9→10→11→12 | 코드 SHA, staging 결과, 제품 QA evidence level, 미해결 차이와 L4 조건 |

한 단계에서 수정한 부분의 캡처만 보는 방식은 허용하지 않는다. 변경이 영향을 줄 수 있는 **전체 효과 구간과 입력 상태**를 다시 보고, 제품에서는 해당 route와 데이터 인계를 재검증한다. 상태의 모든 조합이 과도하면 Freeze에서 observed/high-risk 상태를 우선하고 pairwise 표본과 제외 이유를 기록한다. 실패를 다른 Phase의 ‘완료’로 감추지 않는다.

## 5. 현재 브랜치의 이행 상태와 첫 실전 시험

- `21` REF 카드와 `prototype/spikes/ref-repro`는 Phase 1–5의 입력이다. 기존 12장 검사 사례는 방법의 근거지만 **모든 EFX의 parity 통과 증명은 아니다**. `25` G1–G6와 3회 상한을 보존한다.
- `references/README.md`의 RCP 이름은 후보 색인이다. 중복 `RCP-01`은 구별된 ID로 정정하고, 명시적 QA/버전 없는 후보는 `observed/spiked`로 둔다.
- R1 packet과 `ALPHA-R1-001`은 FROZEN이다. 이어서 사용자가 이미 승인한 독립 Beta 시험은 D-037에 따라 진행되어 도구 시험 PASS와 S01–S07 프롬프트까지 마련됐고, 이미지 생성은 사용자 입력 대기다. 이 병행 실험의 승인과 provenance는 보존한다. **신규 효과의 기본 제작 경로는** 선택된 wow의 EFX 범위·재현/QA/recipe maturity gap audit부터이며, Beta 이미지의 PASS를 effect parity나 제품 구현 승인으로 승격하지 않는다. 기존 R1 Beta가 완료되면 그 결과를 비교 입력으로 보존하고 새 기준에서 누락한 기술 증거를 채운다.
- 먼저 REF-003의 대비·표시기 이탈·dash 세 결함을 새 Phase 5 defect 장부에 소급 적용해 상태가 정직하게 나오는지 확인한다. 그다음 REF-001 match cut 등 새 효과 한 건을 처음부터 1–6으로 시험한다. 통과한 recipe를 R1 Story/Attract의 F-025를 반영한 장면에 번안한다.
- P2 전시 PC 사양과 실제 Windows/Edge/touch/Hangul/10분 soak는 아직 별도 L4 검증 조건이다. 문서나 headless 검사만으로 닫지 않는다.

## 6. 구현과 기록 체크

작업 직전 `11_CHECKLISTS.md`의 관련 절만 읽는다. 결론이 바뀌면 F/D/O/R을 연결하고 CASE-006에서 사용자 문제 정의→AI 초기 응답→사용자 반론→수정된 시스템의 흐름을 보존한다. 기록·링크 검사(`npm run records:check`)와 실제 브라우저/전시 PC 검증의 PASS 범위를 각각 적는다. 원본 reference 프레임·에셋 복제물은 repo에 저장하지 않는다.
