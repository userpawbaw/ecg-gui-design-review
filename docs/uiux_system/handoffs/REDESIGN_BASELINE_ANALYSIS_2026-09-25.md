# UI/UX 재설계 착수 전 기준선 분석 — 설계 시스템 branch 선정 + v2.2.1 분석

작성: 2026-09-25 (KST) · 작업 branch `claude/optimistic-goldberg-jnzpni` (base = `origin/main` `cfef430`)
성격: **RESEARCH / BASELINE** 단계 기록. 새 creative 방향·구현·승인을 포함하지 않는다.
증거 레벨: 시스템/코드 분석 `L1 SOURCE`, v2.2.1 화면 관찰 `L3 INTERACTIVE`(Linux headless Chromium, 10초 archive 자료만). `L4 TARGET` 아님.

---

## 1. 결론 요약

1. **UI/UX 설계 시스템의 canonical branch는 `main` (`cfef430`)** 이다. 파일 수만 보면 `experiment/dual-attract-20260919`(docs/uiux_system 94개)가 가장 많지만, 추가분 54개는 DUAL-ATTRACT-001 실험 산출물(Superdesign baseline 사본, draft HTML, 로그)이고 **Alpha/Beta 계약(17~20번)과 CASE-005가 빠져 있다.** 운영 규칙으로서 가장 완전한 것은 main이다.
2. main 위에 **1 commit만 앞선 `feat/attract-vnext-recovered-20260924`** 가 가장 최근(2026-09-25) 작업이다. Alpha/Beta 체계 하의 첫 Beta A/B Attract prototype과 D-016이 들어 있으나 **PR 없음·winner 미선정·merge 안 됨** 상태다. 시스템이 아니라 재설계의 입력 후보로 취급한다.
3. v2.2.1(`prototype/v2`, React 19 + Vite 7 + Canvas 2D)은 이 세션에서 **build PASS, 핵심 단위 테스트 12/12 PASS**, 1920×1080/1366×768 화면 캡처 완료. 파형·시간·단위·Reference·Difference 계약은 견고하고, 부족한 것은 사용자가 CASE-005에서 말한 대로 **"처음 보는 사람을 끌어당기는 장면성"** 과 Lab 화면의 정보 밀도/계층이다.
4. 재설계는 `00_UIUX_MASTER.md` 기준 **HIGH-zone CREATIVE**(Attract/Intro/Transition) + **UX**(Lab 재배치) 복합 과제로 분류된다. 기본 경로는 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`의 **Alpha + Beta round**이며 공통 Reference Pack을 먼저 freeze해야 한다. 착수 전 사용자 결정이 필요한 항목은 §7에 정리했다.

---

## 2. Branch 조사

조사 방법: `git fetch --all` 후 20개 remote branch 각각에서 `docs/uiux_system/`, `.claude/skills/` 파일 수, main 대비 ahead/behind, 내용 diff를 비교. PR 상태는 GitHub API로 확인.

| Branch | uiux 파일 | skills | main 대비 | 성격 / PR |
|---|---:|---:|---|---|
| **`main`** (`cfef430`) | 40 | 7 | — | **현재 운영 시스템 전체: 00~20 + records + CASE-001~005 + handoff** |
| `claude/optimistic-goldberg-jnzpni` | 40 | 7 | = main | 이 작업 branch |
| `feat/attract-vnext-recovered-20260924` | 40 | 7 | +1 / −0 | Beta A/B Attract prototype, D-016 (PR 없음) |
| `experiment/dual-attract-20260919` | 94 | 7 | +10 / −2 | DUAL-ATTRACT-001 실험 원자료. 17~20번·CASE-005 없음 (#12 open) |
| `feat/attract-vnext-variants-20260920` | 47 | 7 | +12 / −1 | V1/V2/V3 Attract variant 구현. 18~20번 없음 (#14 open, `[PAUSED]`) |
| `docs/alpha-beta-creative-tracks-20260923` | 40 | 7 | 내용상 main과 동일 | squash 전 이력 (#15 closed, main에 반영됨) |
| 그 외 `docs/*`, `ci/*`, `feat/dual-director-*` 등 | 11~36 | 4~7 | behind 2~11 | 단계별 이력, 모두 main에 흡수됨 |
| `preview/lite-baseline`, `experiments/uiux-a-f-baseline-20260917` | 20 | 4 | behind 9 | v2.2.1 lite preview / A–F 실험 (#3 open) |
| `recovery/v2-interrupted-20260911` | 0 | 0 | behind 45 | v2 구현 초기 복구본 |

판정 근거: main에만 있는 파일은 `17_REFERENCE_SOURCE_REGISTRY`, `18_ALPHA…`, `19_BETA…`, `20_ALPHA_BETA_OPERATING_PROTOCOL`, `CASE-005`, `handoffs/DUAL_ATTRACT_CROSS_REVIEW_AND_VNEXT_PLAN`. 즉 **최신 방법론은 main에만 있다.** `records:check`는 main에서 36 records PASS.

---

## 3. 현재 UI/UX 설계 시스템 (main) — 재설계에 쓰는 부분만

### 3.1 계층

```text
AGENTS.md → WORK_RESUME_POLICY v1.2 → WORK_STATE.json / PLAN.md
  └ docs/uiux_system/00_UIUX_MASTER.md v1.3   (라우팅 진입점)
      ├ 설계층 01 creative · 02 data story · 03 motion · 04 validation/guardrail
      ├ 도구층 05 tool routing · 06 Chat/Work/Codex handoff · 07 외부 skill 출처 · 09 gap audit
      ├ 실험층 08 decision experiment protocol
      ├ creative 층 13 reference mining + 17 source registry (공통 reference layer)
      │            18 Alpha(implementation-aware) · 19 Beta(image-first) · 20 운영 protocol  ← 현재 기본
      │            14/15/16 Superdesign · Dual Director                                  ← 이력/재검증용
      └ 기록층 10 F/D/O/R 규약 · 11 checklists · 12 lineage · records/ · cases/ (records:check로 자동 검사)
.claude/skills/: ecg-ui-design, motion-review, expo-ui-art-director, reference-mining,
                 project-capability-audit, superdesign-routing, dual-creative-director
```

### 3.2 재설계에 직접 걸리는 규칙

- **Creative Freedom Zone** (`00` §5): Attract/Intro/전환 = HIGH, 결과 요약·method 설명·navigation = MEDIUM, 파형·시간축·단위·Difference·Reference·수치 = LOW. HIGH에서 과감하게, LOW에서 절제.
- **Alpha/Beta** (`20`): 같은 Common Creative Packet + frozen Reference Pack → Alpha first pass / Beta first pass(서로의 결과를 보지 않음) → freeze → cross-review → **사용자 visual alignment** → Hybrid(최대 1) → validator → D + change contract → 구현 → runtime 검증.
- **Beta 이미지**는 visual-intent artifact일 뿐이며 이미지 속 파형·수치·문구는 canonical data가 아니다.
- **D 기록은 구현 전**에, 기각안 포함. 방법론 변경 시 CASE 동반. 증거 레벨 L0~L4를 섞지 않는다.
- 사용자 의도 원문 (CASE-005): *"2.2.1 버전의 파형 및 각종 버튼/기능 등이 완전 불만족스럽던건 아니야."* / 원하는 것은 Awwwards·Godly류의 페이지 구성·화면 전환·시각 효과로 **tool + exhibit + story scene + trendy interactive web**을 한 경험으로 잇는 것. 번안 순서: reference world → ECG waveform as hero → interaction/transition → component polish.

### 3.3 아직 열린 승인 상태 (WORK_STATE / docs/22)

- UI-01/03/04: 구현 완료, 브라우저 NV로 기록되어 있음 → 이번 세션 headless 캡처에서 렌더 확인(§4.4). target-PC는 여전히 R4 blocked.
- UI-02(sweep 선단 발광)·추가 10후보·전면 글꼴 교체·Loss 뷰/탭 통합: **deferred, 구현 승인 없음.** 재설계가 이 항목을 건드리면 명시적 승인 필요.

---

## 4. v2.2.1 분석

### 4.1 실행 확인 (이 세션)

| 확인 | 결과 |
|---|---|
| `node scripts/prepare-v2.cjs` → `npm ci` → `npm run build` (tsc + vite) | PASS · JS 334.65 kB (gzip 108 kB), CSS 27.1 kB |
| `tsx --test engine / plot-scale / attract` | 12/12 PASS |
| `chunks.test.ts`, 600초 replay | **미실행** — `public/replay`(98×600초, 1,960 chunk)는 gitignore 대상이며 Release ZIP(340,775,483 B)에만 있음. 이 세션엔 없음 |
| Headless Chromium 1920×1080 / 1366×768 캡처 | `verification/redesign-baseline-20260925/` 4장. console error는 `replay/manifest.json` 404 1건(자료 부재로 예상된 것) |

### 4.2 구조

`prototype/v2/src` (총 ≈56 KB, 매우 압축된 코드 스타일)

| 파일 | 역할 |
|---|---|
| `main.tsx` (29 KB) | 단일 `App` 컴포넌트에 상태 ~40개, 3 route(`lab`/`evidence`/`legacy` iframe), 조건 바, method panel/rail, transport, metric panel, Attract, bookmark, JSON export, Radix Dialog 2개 |
| `Plot.tsx` | Canvas 2D 렌더러. rows = 입력 / 선택 출력 / (고정 비교) / (Difference). 각 row에 Reference 회색 겹침, mV 눈금, clip 경고, sweep 커서 |
| `engine.ts` | `Transport`(time/speed/loop/loopRange), `visiblePoints`(sweep gap 0.12 s + fade 0.08 s / scroll / inspect), `metric`(strict·scaled SNR, α, CC, RMSE) |
| `data.ts` | 10초 archive(base64 int16) + 600초 30초 chunk(SHA-256 검증, LRU 9) 로더 |
| `plot-scale.ts` | 물리 mV 눈금(Difference gain 환산 포함) |
| `style.css` | light 셸(#f4f5f4, primary #067d72) + dark plot(#112b39). 글꼴 Malgun Gothic/Noto Sans KR/system |

### 4.3 재설계에서 **보존할 계약** (LOW zone, 변경 금지 후보)

- 입력과 출력은 **동일 절대 sample index·동일 시간·동일 ±mV 축**. 행 간 scale 차별 금지.
- Reference = "공통 FE 적용 기준 신호"(D1: 원기록, D0: 합성). 임상 절대 정답으로 표현 금지.
- Difference = Output − Reference, gain ×1/3/5는 표시 확대이며 눈금은 물리 mV로 환산.
- Sweep: 0.12 s gap + 0.08 s soft fade, 눈금은 "화면 내 위치". Scroll: 오른쪽 유입. 구간 고정(inspect) 시 실제 시각 라벨.
- `REPLAY` / `ARCHIVED REPLAY` / `GENERATED REPLAY` 구분, "실제 장치 세션 없음" 고지. 실시간 계측처럼 보이는 연출 금지.
- Local / Session / Experiment 지표 범위 구분, scaled SNR 설명 문구, EXP-A 집계는 현재 장면과 다른 자료라는 고지.
- 조건 변경 실패 시 마지막 유효 장면 유지 + 요청 상태 표시, requestEpoch 기반 경쟁 상태 방지.
- reduced-motion → soft fade off, 탭 숨김 시 pause, Space 재생, Dialog 닫을 때 focus 복귀.

### 4.4 화면 관찰 (L3 headless, 10초 archive)

| # | 관찰 | 해석 |
|---|---|---|
| O1 | Lab 1920 세로 길이 ≈1,760 px. 제목 → 조건 바 → bookmark/Attract 줄 → viewer 제목 → plot → transport → method rail → 근거 버튼 → 검토 기록이 **한 열에 순차 적층** | 한 시연에서 "한 가지 핵심 선택"(`00` §1-4) 원칙 대비 동시 노출 조작이 많다 |
| O2 | 1366×768 첫 화면에서 파형이 fold 아래(상단 ≈600 px가 헤더·제목·조건·bookmark) | 관람객이 처음 보는 것이 파형이 아니라 폼 |
| O3 | transport 아래 **진행 막대(timeline-map)와 range slider가 거의 같은 모양으로 중복** | 역할(표시 구간 vs 탐색) 구분이 시각적으로 약함 |
| O4 | 큰 비교(1920×1080 Dialog)에서 표시 도구·추가 설정이 fold 아래로 잘림 | 큰 창에서도 스크롤 필요 |
| O5 | Attract = 큰 비교 Dialog를 밝은 셸에 그대로 띄우고 하단 CTA 1개. sweep 초기 2.5초 구간 외에는 빈 격자 | CASE-005의 "시각적 충격 부족"이 가장 직접적으로 드러나는 곳 |
| O6 | 파형 팔레트(입력 #ffbc79 / 출력 #67e7c3 / Reference #c4c6c7 / 비교 #97c2ff / 미리보기 #f6d18d 점선)는 dark plot 위 판독성 양호 | LOW zone 자산으로 유지 가치 높음 |
| O7 | UI-01(크게 비교 primary 대비), UI-03(기본 도구 상시 노출), UI-04(차이 보기 토글 + 스위치) 렌더 확인 | docs/22의 "브라우저 NV" 중 headless 렌더 부분은 확인됨. target-PC는 여전히 NV |
| O8 | light 셸 + dark plot의 두 세계가 공존, 브랜드 `signalstudio` wordmark 외 visual identity 요소 거의 없음 | 재설계의 visual world 결정 대상 |

### 4.5 코드 차원에서 재설계 전에 알아둘 위험

- **R-a `prepare-v2.cjs`가 `methods.json`을 덮어쓴다.** 실행하면 v2.2.1에서 수정된 M04 principle/limit 문구가 `prototype/app.js`의 이전 문구로 되돌아간다(이 세션에서 재현 후 원복). 재설계 build 절차에서 이 script를 그대로 쓰면 v2.2.1 SWT 설명 수정이 조용히 사라진다.
- **R-b `main.tsx` 단일 컴포넌트 구조.** 재설계로 scene(Attract/Story/Lab/Compare)이 늘면 상태 공유를 위해 Transport·Loaded data·선택 상태를 context/store로 분리해야 한다. recovered branch가 이미 `SignalView`/`AttractSession`으로 그 방향을 시도했다.
- **R-c 600초 replay 자료 부재.** 연속 재생·chunk 경계·시연 장면 A/B/C·Session 지표는 Release ZIP 없이는 검증 불가. 재설계 runtime 검증 전 ZIP 확보 필요.
- **R-d 글꼴.** 시스템 글꼴 의존. recovered branch는 `@fontsource-variable/noto-sans-kr` 번들을 추가했다. 전면 글꼴 교체는 deferred 항목이므로 재설계에 포함하려면 승인 필요.

---

## 5. 이전 Attract 탐색의 입력 가치

| 산출물 | 위치 | 재설계에 가져갈 것 | 가져가지 않을 것 |
|---|---|---|---|
| DUAL-ATTRACT-001 A (reference 6 concept) | `experiment/dual-attract-20260919` | 사용자가 긍정 평가한 "reference 출처 + 차용 지점 설명" 방식 | — |
| DUAL-ATTRACT-001 B (Superdesign B01/B02) | 동일 | 실패 사례로서의 기준: 완성도·reference fidelity 부족 | generator 자체 (D-015로 자동 사용 중지) |
| V1 Question Poster / V2 Orbit / V3 Exhibition | `feat/attract-vnext-variants-20260920` (#14 PAUSED) | `?attractVariant=` 전환, waveform fingerprint 기반 **data-state equality 검증 방식**, V3의 same-time handoff 규칙 | 결과 화면은 기존 Dialog 재배치 수준이라 "장면성" 요구에 미달 |
| Beta A (ECG Signal Studio neon hero) / Beta B (compare lens) | `feat/attract-vnext-recovered-20260924` | 실제 출력 path의 3-pass glow + noisy ghost, 차이 기반 입자, **동일 sample index CompareLens**, A→B→Compare same-time handoff, reduced-motion 진입, RAF 측정 스크립트 | 이미지의 가짜 BPM·지표·"처리 시점" 연출(D-016에서 이미 기각) |

Beta A 화면(recovered branch `verification/attract-vnext/A-1920x1080.png`)은 v2.2.1 Attract 대비 사용자가 요구한 방향(dark visual world, ECG hero, editorial 타이포)에 가장 근접한 기존 결과다. 다만 Alpha/Beta 프로토콜상 **Reference Pack freeze → Alpha first pass**가 없었으므로, 새 재설계 round에서 이를 winner로 간주하지 않고 비교 입력으로 둔다(재설계 범위에 따라 §7-Q2에서 결정).

---

## 6. 재설계 진입 라우팅 (제안)

- 분류: `CREATIVE`(HIGH: Attract/Intro/Story/전환) + `UX`(Lab 계층·조작 수) + `MOTION` + 이후 `IMPLEMENTATION`.
- 경로: `20` Step 1 **Intent / Reference Freeze** → Alpha first pass → Beta first pass → freeze → cross-review → 사용자 visual alignment.
- Common Creative Packet 초안 입력:
  - 목표 메시지: "같은 ECG라도 잡음 종류·세기에 따라 적합한 방법이 다르고, 여러 DSP·DL 방법을 동일 조건에서 비교했다" (3초/15초/60초 단계).
  - 보존 자산: §4.3 계약 전체, 파형 팔레트(O6), Transport/visiblePoints/metric/data 로더.
  - 개선 대상: O1~O5, O8.
  - 실행 제약: 오프라인 Windows PC 전시, 1920×1080 우선, reduced-motion, 10분 soak, Canvas 2D 우선(WebGL은 profiling 후).
- 첫 창작 산출 전에 D 기록(재설계 범위 결정)을 작성한다.

## 7. 착수 전에 사용자 결정이 필요한 것

- **Q1 재설계 범위**: Attract/Intro만인가, Attract → Story → Lab → Compare 전체 경험인가? (CASE-005 발화는 전체 경험 쪽)
- **Q2 recovered Beta A/B의 지위**: (a) 새 round의 비교 입력으로만 사용 (b) Beta first pass 결과로 인정하고 Alpha만 새로 수행 (c) 폐기하고 새로 시작.
- **Q3 deferred 항목 해제 여부**: 전면 글꼴 교체, UI-02 sweep 선단 발광, Loss 뷰/탭 통합 중 재설계에 포함할 것.
- **Q4 Release ZIP**: 600초 replay 검증을 위해 v2.2.1 ZIP(SHA-256 `9070d4aa…e98ed`)을 이 환경에 제공할 수 있는가.

---

## 8. 단계 종료 판정

- 수행한 검사: 20 branch 파일/ahead-behind/내용 diff, PR 상태, main `records:check` PASS(36), v2.2.1 build PASS, 단위 테스트 12/12, headless 캡처 4장, `prepare-v2` 부작용 재현 후 원복.
- 판정: **PASS** (분석 단계). 
- 미검증: 600초 replay·chunk 테스트, target-PC headed/한글 글꼴/배율/touch/10분 soak(R4), recovered branch 코드의 이 세션 재빌드.
- 다음 행동: §7 답을 받은 뒤 `20` Step 1(Intent/Reference Freeze)과 범위 D 기록 작성.
