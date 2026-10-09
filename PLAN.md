# Review plan

Updated: 2026-09-15 (KST)

## Current Work control

Generation 6 closeout 2026-09-15 18:01 KST: regenerated `ecg-signal-studio-v2.2.1.zip` from current UI plus verified replay. Independent ZIP CRC/content checks pass; 1,960 chunks are present and the embedded verification matches. QA run from the extracted package's own server/config passes 2 non-soak tests with the 10-minute test skipped. The updated package is preserved for user download. Target-PC headed/Hangul/OS-scale/touch and 10-minute soak remain R4; generation 6 is released.

Generation 6 progress 2026-09-15 17:56 KST: all four user-provided assets passed ZIP CRC. The v2.2 archive's `VERIFICATION.json` is byte-identical to the tracked 98×600-second report, and all 1,960 replay chunk hashes pass; replay data was recovered without inference. Chrome 153 headless non-soak QA now passes 2 tests with 1 soak test intentionally skipped. One QA assertion was corrected to open the approved collapsed advanced settings before counting its two switches. Target-PC headed/Hangul/10-minute soak remain open; package regeneration is next.

Automation recovery 2026-09-15 17:42 KST: generation 5's owning conversation explicitly ended and no managed download/browser/server/test child remained. Generation 6 claims the user-provided Releases from remote main 6d60b1a. Verify downloads and archive provenance before reuse, then run approved browser QA only if the supplied Linux x64 Chromium starts. Preserve current UI source and do not regenerate ECG data.

Manual check 2026-09-15: retry Chromium installation at the user's explicit request. Preserve verified UI source; no data regeneration or repeated build. Generation 4 claim 4f6bdf1 was remotely verified. Official Chromium download timed out after 30000 ms; subsequent retry cancelled (exit 130), no installer child remains. Browser not installed; no tests/build/data regeneration. Generation 4 released as blocked.

Automation retry 2026-09-15 11:41 KST: generation-3 owner `automation-ecg-browser-20260915T024128Z-e697169f` was remotely verified at `84d1795`. The Chromium installation was retried once with a 120-second connection timeout, but every download was either a truncated 0 MiB response or HTTP 502; installer exit 1. No preview server or Playwright test started. Source/data/package remained unchanged and generation 3 is released. Resume R4 only with a browser-capable runner or target-PC evidence.

Automation resume 2026-09-15 05:38 KST: generation-2 owner `automation-ecg-ui-20260914T203857Z-982efb68` acquired the shared lock at `077e0b1`. UI-01/03/04 source implementation is remotely verified at `632fcbc`; 12 relevant engine/scale tests, 14 updated DOM/Canvas-command checks and TypeScript/Vite build PASS. Playwright Chromium installation ended with repeated CDN timeouts and no system browser exists, so pixels/native behavior remain NOT VERIFIED. The full chunk test and package regeneration were not run because gitignored 10-minute `public/replay` artifacts are absent; no inference or data regeneration was attempted. The prior release ZIP is therefore stale for this UI change. UI-02 and the additional recommendation shortlist remain out of implementation scope. Generation 2 is released by the final evidence commit with all child commands ended.

Latest request: record uncommitted UI/UX discussions and use GitHub-shared on/off execution ownership. D1 policy/start claim COMPLETE (d7ae76f, remote ownership read back); D2 docs/22 and existing automation alignment COMPLETE; D3 documentation remote verification COMPLETE (8ed1f42), own lock released by this closeout commit. Documentation/control request complete; UI-01/03/04 remain approved pending implementation. WORK_RESUME_POLICY.md v1.1 §3 supersedes mandatory cross-host manual inspection for a valid released lock.

Approved pending: UI-01 large-comparison button contrast; UI-03 compact basic display controls always visible; UI-04 semantic toggles/switches and grouped gain controls. These have NOT been implemented or browser-verified. UI-02 glow and the additional ten candidates are recorded recommendations only. Lack of runtime/build/render tools is separate from execution ownership. R4/R5 gates remain open.

Prior P1/P2/P3 policy/schedule/workflow documentation completed at 44fd7fd1 and closeout 6974aa7; this does not complete the new UI requests.

User approved the concrete wireframe review in chat on 2026-09-12 ("응"). The five proposed layout decisions are accepted. R1a/R1b and R2 implementation have since completed; R3/R5 handoff is prepared and R4 remains unverified; the earlier wireframe approval gate below is satisfied. Actual browser/hardware gates remain independent.

## SWT final-tuning audit — 2026-09-13

- COMPLETE: four source branches and final docs checked; current best.json matches all 98 GUI scenes. See docs/19_swt_tuning_version_review.md.
- CONFIRMED: M03/M04 differ in shrinkage and parameter settings; they do not isolate decimation.
- DEFECT FOUND: D1 tune and holdout select the same first four TRAIN records; only noise seeds change. Independent-patient holdout claim FAIL. No TEST contamination path found in this check.
- Follow-up research work: correct explicit record/patient split and generated prose, run controlled comparisons and retuning, then version affected replay outputs. Not executed by this audit; preserve current release.
- GUI/AFE/browser/font/loss-tab work remains as below. Do not claim this audit fixes the original research protocol.

## v2.2.1 user-feedback revision — 2026-09-12

1. M04/M_FE source and release audit: COMPLETE. 98 long + 98 archive scenes checked; 14 long scenes reproduced. No output replacement or retraining. See docs/18_swt_audit_and_ui_revision.md.
2. Moving Difference + physical left y ticks: COMPLETE. 13 tests + DOM/Canvas command regressions + TypeScript/Vite build pass; packaged release CRC pass. Actual browser pixels remain NV.
3. Font change: DISCUSSION ONLY; current font retained. Recommended local Pretendard and role-based weights.
4. Loss evolution view / lab and analysis integration: DEFERRED by user until this revision is complete.
5. R4 actual browser/monitor testing remains NOT VERIFIED. PC runner prepared; no local-browser bypass.

## Current execution checkpoint — 2026-09-12

- R1 implementation: COMPLETE / CONDITIONAL PASS. Main checkpoint ad6a920 and subsequent chunk/Expo refinements; actual rendering NV.
- R2 data: COMPLETE. 98×600s, 1,274 trace arrays, 1,078 verified method metrics, 1,960 byte-identical 30s chunks. No retraining. One damaged local condition was regenerated.
- R3 offline application/data package and PC QA runner: PREPARED. See verification/v2-package.json and docs/17_v2_team_handoff.md.
- R4 actual browser/monitor/keyboard/touch/10-minute soak: NOT VERIFIED. Local browser access is blocked in this environment; run the provided target-PC evidence bundle. No browser workaround was used.
- R5 team handoff: PREPARED, final closeout pending R4 evidence. Source/data/state tests are not a visual or exhibit-device pass.

The following wireframe-review section is historical context; approval is satisfied and must not be requested again. Next work is target-PC evidence and resulting layout/interaction fixes, not a repeated wireframe approval or repeated inference run.

## Goal

Produce a source-grounded independent GUI design, compare it fairly with the earlier GUI, and deliver a verified synthesis prototype plus team handoff. Model identity is not evidence of quality.

## Stages and observable completion

| Stage | Status | Completion evidence |
|---|---|---|
| S0 GitHub write check | PASS | README commit 82ee3f6f60eca15185c562a232dad50afa847b08; remote content equality verified |
| S1 source-project understanding | PASS | docs/01_source_review.md; immutable source SHA, inspected contracts/results and archive freshness boundary |
| S2 independent design freeze | PASS with QA limitation | Freeze bcd2f8d1516b4020895e6e17ed66107773504faa remotely verified; 336 metrics pass. Browser visual checks remain unverified |
| S3 prior-artifact comparison | COMPLETE / render NV | docs/04_comparison.md: prior mockup, team/manual docs and source GUI code compared; rendered behavior not claimed |
| S4 final synthesis | COMPLETE / browser NV | prototype/ + docs/05_final_spec.md, docs/06_team_guide.md, docs/08_manual_addendum.md; all prior frames/hotspots reconciled |
| S5 final verification | COMPLETE / CONDITIONAL PASS | 1,078 output metrics, 26 DOM groups, 6 portable groups, 38 components, 9 frozen files and 18 selected palette pairs verified. Actual browser/hardware gates remain NOT VERIFIED |
| R0-v2.1 functional planning | COMPLETE | docs/12_expo_gui_plan_v2_1_final.md; playback, Inspector, Difference Lens, 600 s data, chunk architecture, stack baseline |
| R0-v2.2 Expo/UI refinement | COMPLETE | docs/13_expo_gui_plan_v2_2_final.md; message hierarchy, Attention→Choose→Compare→Inspect→Prove, presentation behavior, scenario rules, failure states, wireframe handoff |
| Recovery checkpoint | PASS / implementation PARTIAL | recovery/v2-interrupted-20260911 at f8b6300: 52/98 scenes, 9 engine tests, build and one-condition reproduction verified; docs/14_resume_audit.md |
| W1–W10 wireframe preparation | COMPLETE / APPROVED 2026-09-12 | docs/15_wireframe_review.md + docs/wireframes/index.html; 12 static boards including three W7 failure variants. Static geometry is not browser QA |

## Source boundary

- Source: userpawbaw/ECG_denoising_method_comparision
- Branch at discovery: claude/ecg-denoising-dsp-dl-comparison-b5wjvj
- Pinned SHA: 5eb27946087faca3c6e70b3925e2ba132b2ee680
- Source demo HTML and docs/30–34 GUI plans were deferred until S3, as were previous local GUI deliverables.
- Earlier conversation contents cannot be erased. Independence means deferred reinspection, explicit design reasons and a prior freeze commit.

## Current design baseline

Use both planning documents together:

- `docs/12_expo_gui_plan_v2_1_final.md` — **function/data/technical architecture baseline**.
- `docs/13_expo_gui_plan_v2_2_final.md` — **Expo story/information hierarchy/presentation behavior baseline**.

Key frozen principles include:

- Sweep + Scroll + Pause with short erase-edge fade.
- Same-time comparison across method changes.
- Large two-row Signal Inspector with gray Reference overlay.
- Hover = temporary preview, Click = selected method, Pin = persistent A/B comparison.
- Difference Lens as an expert reveal rather than default clutter.
- 98 conditions × 600 s target, no retraining, no 10 s looping as fake long data.
- Local / Session / Experiment metric scope separation.
- Chunked data loading rather than scaling the current monolithic bank.js approach.
- React/TypeScript/Vite recommended with a framework-independent Canvas playback engine; preserve the existing visual identity and CSS token logic.
- Expo story: **Attention → Choose → Compare → Inspect → Prove**.
- One primary visitor choice per demonstration.
- Three scenario roles are defined before output-driven timestamp selection; final segments must follow predeclared input/reference selection rules to reduce cherry-picking risk.
- Presentation Mode is Signal-Inspector-centered.
- REPLAY and verified LIVE must remain visibly distinct.
- Loading/error transitions retain the last valid scene and atomically swap waveform + labels + legend + metrics.
- Avoid winner badges, automatic best/worst regions, waveform morphing, long persistence trails, and visual effects that could distort scientific interpretation.

## Historical resume note — superseded, not an active approval gate

**Historical phase: wireframe review, concrete boards ready.** Read docs/15_wireframe_review.md and docs/wireframes/index.html. Review the bottom method rail, contextual sidebar, preserved two-row height with Difference Lens, compact three-row scrolling and metric reveal timing. Do not start further GUI implementation, dependency migration, 600 s inference, or Playwright QA-runner changes until these wireframe decisions are reviewed.

The earlier v2 work was already started after user authorization and interrupted before the newer planning documents were discovered. It is preserved on recovery/v2-interrupted-20260911, not merged into this baseline. This distinction corrects the apparent conflict between old local work and the newer wireframe-first plan. Browser execution remains NOT VERIFIED.

Wireframe work should resolve at least the following states:

- W1 — 1920×1080 Presentation / Replay, two-row Signal Inspector.
- W2 — Inspect / Reference state.
- W3 — Inspect + Difference Lens.
- W4 — Pin comparison / three-row state.
- W5 — Attract state and handoff.
- W6 — Scenario launcher/bookmarks.
- W7 — Loading / missing output / error and retry.
- W8 — 1366×768 compact layout.
- W9 — Touch visitor path with no required hover.
- W10 — Evidence/Q&A path from Local → Session → Experiment and provenance.

Primary wireframe questions: waveform area ratio; condition-vs-method control priority; timeline location; Method Explorer sidebar vs lower rail; Difference Lens expansion behavior; three-row minimum height; scenario button visibility; metric placement; touch preview replacement; Attract information density; 1 m readability; and error-state coexistence with the last valid waveform.

After wireframe approval, continue with:

- R1a stack/behavior parity and minimal browser harness.
- R1b playback / Signal Inspector / comparison interactions.
- R2 full-grid 600 s data generation and verification.
- R3 offline packaging, scenario bookmarks, Expo options and target-PC evidence bundle.
- R4 actual browser review and visual/performance/accessibility tuning.
- R5 handoff, operation guide, validation matrix and final status log.

Retraining remains excluded. Use existing checkpoints and processing methods when long-form outputs need regeneration.

## Remaining gates, not hidden implementation claims

Target-PC execution handoff: `docs/09_target_pc_check.md` gives Q01–Q10 actions, expected results and a report template. Preparation is COMPLETE; actual browser execution remains NOT VERIFIED. Continue visual/interaction review from the user's captures and review JSON. Do not repeat completed automated tests without a relevant code change.

- Target desktop browser rendering, native keyboard/dialog/download, zoom/scaling, screen reader and offline opening: NOT VERIFIED because local browser navigation is blocked in this environment.
- Current-source/checkpoint archive regeneration, exact metadata and pathology annotation: PENDING.
- Actual AFE adapter/source-session contract, hardware and exhibit testing: PENDING.
- Optional attract/idle reset and expanded distribution/annotation screens still require their operational/data requirements and later implementation checks.


## 2026-09-15 — generation 7 package recovery

Latest user requested resumption and supplied the correct v2.2.1 archive. GitHub reports 340775483 bytes, SHA256 9070d4aacea61d2476473fbdf18e4df7de5621867e82d0425ca22ee0fa1e98ed. Read-only inspection found generation-6 ZIP missing app/archive.json and app/legacy even though current source uses them. Recover original static assets without data generation, add a packaging completeness gate, verify affected routes and regenerate the package. Preserve prior verified UI/replay. Generation 7 starts from main 3c40e031 with a single parent and force=false.


## Generation 8 — recover unpersisted package repair

Generation 7 command results in the owning conversation show original v2.2.1 SHA256/CRC PASS, seven archive/legacy files restored, build PASS and extracted-package Chromium QA 3 PASS. Its ZIP was 340780943 bytes, SHA256 5ec5d47e288c4b54c8ff2edfad2c27249d08d0129ff67e73344cc596d94506bf. Both Library replacement attempts ended transfer_failed. All owned child commands had terminal exit results. Before the final commit, workspace maintenance removed the checkout and ZIP; main remains b500207 (start only). Those historical results are not proof of a currently available deliverable. Reconstruct the small packaging/test fix from the preserved conversation, then recover assets from the original Release and rebuild. No model training or data regeneration. Generation-6 ZIP 31d17dfa… lacks archive/legacy and must not be distributed as complete.


## Generation 8 recovery checkpoint

Recovered original Release ZIP (340775483 bytes, SHA256 9070d4aacea61d2476473fbdf18e4df7de5621867e82d0425ca22ee0fa1e98ed), ZIP CRC PASS. Restored 1968 files covering replay plus archive/legacy. npm ci and TypeScript/Vite build exit 0. Reconstructed archive/evidence/legacy browser regression and packaging completeness guard. New package verification and persistence are next; prior generation-7 output is not available after workspace pruning. No data regeneration.


## 2026-09-18 — Dual Director 기록 우선 단계

- 기준 main `08ffec3`; primary context: docs/uiux_system/handoffs/DUAL_CREATIVE_DIRECTOR_IMPLEMENTATION_2026-09-18.md.
- CASE-003은 이미 generator 도입 사례여서 보존하고 Dual evolution은 CASE-004로 추가.
- COMPLETE locally: CASE-004/발췌, CASE-001 발췌, F-007/D-010/R-009, D-011/R-010, D/R CASE 연결 규칙과 checker/CI 회귀 검사.
- PASS: records:check (29 records), 16 isolated checker fixtures, full root npm test (core/final data/DOM/records). UI 렌더링 또는 Dual 실행 검증이 아님.
- COMPLETE: branch → PR #9 → commit `105fc0f` CI run `35338498909` success (기록 검사와 회귀 검사). closeout 후 최신 head 결과는 PR checks에서 확인. PR 미병합.
- AWAITING USER after records closeout: 16번 canonical contract, dual-director skill, Superdesign dual-mode 및 activation routing. 이번 단계에서 구현/생성하지 않는다.
- 기존 target-PC/AFE/release 회복 등 별도 미완료 항목은 그대로 유지한다.

## 2026-09-18 — 기록 단계 독립 재검증

- handoff §11 및 사용자 6개 검증 항목을 직접 대조했다. 상세: docs/uiux_system/handoffs/RECORDS_STAGE_VERIFICATION_2026-09-18.md.
- placeholder 우회 수정, 26개 fixture, 전체 npm test와 diff 검사 PASS. 원문/재구성 구분 및 현재 확보된 기록 요구 문답 보강.
- 최종 head CI 확인 후 보고하고 종료. merge 및 Dual 실행 시스템 구현은 하지 않는다.

## 2026-09-19 — Dual 실행 계약 구현

- 사용자 승인으로 16번/skills/두 모드/activation/handoff를 구현했다. 기록 단계 PR #9 head를 기반으로 후속 branch에서 작업한다.
- 문서/skill/tabletop/records 및 전체 npm test PASS. 자세한 검증: docs/uiux_system/handoffs/DUAL_RUNTIME_VERIFICATION_2026-09-19.md.
- 원격 PR/CI 확인 후 보고. 실제 시안 생성·UI 수정·main merge는 수행하지 않는다.

2026-09-19 closeout: PR #10 (stacked on #9), implementation f1da0d32113d6e7b166dc48e9e550f8701045f0a, CI run 35423470904 records-check and fixture steps success. Contract/skill implementation complete; no merge or live generation. Final checkpoint head CI is checked before the chat report.

## 2026-09-25 — UI/UX 재설계 기준선 분석

- [x] 20 remote branch 비교: canonical UI/UX 시스템 = `main` `cfef430` (Alpha/Beta 17~20 + CASE-005 포함). `experiment/dual-attract-20260919`는 파일 수가 많지만 실험 원자료이며 최신 계약 누락. `feat/attract-vnext-recovered-20260924`는 main+1 Beta A/B prototype(PR 없음, winner 미선정).
- [x] v2.2.1 분석: build PASS, 단위 테스트 12/12, headless 1920/1366 캡처 → `docs/uiux_system/handoffs/REDESIGN_BASELINE_ANALYSIS_2026-09-25.md`, `verification/redesign-baseline-20260925/`.
- [x] 사용자 결정 Q1~Q4 — 2026-09-26: Q1 전체·두 라운드(D-033), Q2 비교 입력만(D-034), Q3 UI-02만(D-035), Q4 릴리스 ZIP 확인(사용자 조치 불필요). 다음: 1라운드 Alpha/Beta Step 1 Intent/Reference Freeze.

## 2026-09-25 — 레퍼런스 연출 제작 파이프라인 점검

- [x] 원인 진단 G1~G6(Canvas 2D 상한, 에셋 계층 없음, timeline 엔진 없음, 정지 이미지 분석, 전시 입력 번안 부재, motion QA 부재) → F-010.
- [x] 에셋 형식(glTF .glb/KTX2/HDR/2:1 텍스처/영상/Lottie/woff2), 제작 도구(Blender 권장, Unity는 HTML 연출용 비권장), 조달처·라이선스 정리.
- [x] `prototype/spikes/scroll-globe`: three 0.186.1 + GSAP 3.15 ScrollTrigger + Lenis 1.3.26 build PASS, headless WebGL2 스크롤/autoplay/reduced-motion 상태 동기 PASS. 실제 GPU 성능·미감·텍스처 라이선스 미검증.
- [x] 사용자 결정 P1~P5 — 2026-09-26 완료: P1 채택(D-027), P3 외부 에셋 우선, P4 녹화·도메인 허용, P5 vanilla + React 마운트(D-028), P6 게이트(D-029). **P2(전시 PC)만 남음** → 재설계 Q1~Q4.
- 2026-09-25 후속: P1 레퍼런스 2~3개 추가 분석 후 결정, P2 구현 시 결정, P3 외부 에셋 우선(조달처 §12), P5 설명 완료(vanilla 엔진 + React hybrid 권장, 미확정). moto 녹화 분해 → F-011. 이 세션은 도메인 허용 뒤에도 CONNECT 거부됨.
- 2026-09-25 후속2: moto 파트별 정량 분석(지구 회전=기본+속도 비례 r=0.96, 카드 감쇠 약 0.7 s, 타이포=문턱 트윈+reflow 점프) §14. 촬영 규칙 초안과 scroll HUD `tools/reference-capture/` — 사용자 합의 대기. 앞으로 영상 분석은 화면별·전환 효과별로 기록.
- 2026-09-25 후속3: 네트워크 점검(기본값 환경, google.com까지 403) + 대안(capture-site.mjs, 로컬 세션, HAR). 에셋 1)~4) 시험 완료: `assets/registry.json` + `scripts/assets/fetch.mjs` + spike `asset-test.html`(HDRI + glTF + 감쇠 회전). 병목 B1~B6 §17. 촬영 규칙 순서 합의 → D-017.
- 2026-09-25 후속4: 네트워크 허용 적용 확인(awwwards 제외). moto 소스 분석 §18(three r181 WebGPU/TSL + Lenis 1.3.18 + GSAP 3.15; 지구=위치 연동 scrub 1, 원통 갤러리=충격+감쇠, 타이포=줄 단위 scrub true) → F-012. 비영리 학술 → NC 허용. Poly Haven API 소스 추가·md5 검증, HDRI 교체(B6 해소), WebP q90 변형으로 반사 얼룩 해소(B5 비교).
- 2026-09-25 후속5: 기록 목적 확정(효과 재현 정보 강제) → 21_REFERENCE_EFFECT_RECORDS.md + records:check 확장(REF 절·효과 카드 15필드·입력 모델·재현 상태·지도 연결) + 회귀 fixture 6개. REF-001 moto-card 작성(EFX 8개, 라이브 측정·소스 보강). D-018, CASE-006. 다음: 컨텍스트 압축 후 REF-002.
- 2026-09-25 REF-002 leoparpeix.com: 녹화(HUD)+소스+라이브 측정으로 효과 카드 7개. 사용자 가설(부분 로딩) → 실시간 3D 카메라 회전으로 정정. RCP-08·RCP-01을 공통 레시피로 승격. 다음: REF-003.
- 2026-09-25 연구실 코너 시험: AI 단독 headless bpy 4.5.3 + Poly Haven CC0 7종으로 아이소메트릭 방 → Cycles 8방위 bake(약 12.6분) → gltf-transform → `prototype/spikes/lab-corner`. 360° 빛 드래그 3모드(A bake 블렌드 / B 실시간 / C 실시간 직접광+bake 간접광) 모두 headless QA PASS, 권장 C. 품질 격차(UV·bake 해상도·아트 디렉션) 9개 → audit §20, F-013. 다음: REF-003.
- 2026-09-25 연구실 코너 C v2: 하늘빛/반사광 베이크 분리(반구광 보정 제거), OIDN, 소품 UV 7.6→32 %, 잎 프로브, 마루·회벽 PBR, 창밖 배경, 후처리, 방위 다이얼. audit §21. 남은 것: 실제 GPU fps, 135° 흰 삼각형 반사, 아트 디렉션. 다음: REF-003 white-desert, REF-004 seasats(사용자 녹화 수신).
- 2026-09-25 REF-003 white-desert.com: 녹화(HUD)+소스(Next.js·GSAP 3.13·Lenis 1.3.15)+라이브 측정. EFX 5개(두 겹 구름 덮기, 스크롤 경로 그리기+표시점, 소나 링, 안개 판 전환, 문장 마스크). WebGL 없음 → F-014. 다음: REF-004 seasats.
- 2026-09-25 REF-004 seasats.com: 녹화 + 소스(three r180 + r3f + GSAP 3.15) + 라이브 측정. EFX 6개(합성 셰이더 홀로그램 지구, 시계 눈금 링, hover 원형 사진 카드, 필터 → 최대 군집 회전, 드래그 관성, 스크롤 연속 이미지 끊김 사례). RCP-12·RCP-17 공통 승격. P1 판단 재료(레퍼런스 4개) 확보 — 사용자 결정 대기.
- 2026-09-25 레퍼런스 재현 + 품질 격차: REF-003·004를 외부 재료(Poly Haven HDRI·사진, NASA Blue Marble, Blender 볼륨 구름·hero 영상)와 GSAP 플러그인·Lenis·vanilla three로 재현(`prototype/spikes/ref-repro`), 연구실 코너 v3(스크롤 시점 하강 → 모니터 match cut). 품질 격차 층 분해 F-015 + 충실도 게이트 제안(P6). 문서 `handoffs/REFERENCE_REPRO_AND_QUALITY_GAP_2026-09-25.md`. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-25 REF-002 다락방 책장 재구성(`prototype/spikes/attic`): 책 478권 + CC0 소품 17종 + 생성 판화, 완전 베이크(조명 이미지 3장 + 소품 정점 색상), 브라우저 볼류메트릭 빛줄기·빛 속 먼지·bloom·AgX·수치 기반 색보정·SMAA, 섹션 창 카메라 하강 + 포인터 시선. F-016. 추가 기술 3종 득실 판단(측정 후 도입). 문서 `handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md`. 다음: 파이프라인 결정.
- 2026-09-26 REF-003 경로 12장 대조(사용자 지적): 결함 3개(지난/남은 경로 대비, 표시기 화면 이탈, dash 분할) 수정. 외부 컴포넌트 조합 변형 B와 A/B 비교 → 컴포넌트는 기법 공급원(D-021). 에셋 조달처 조사 + ambientCG·Openverse 자동 받기(D-020). 규칙: 3D 셰이더·후처리 상시 검토 + 효과 구간 최소 6장(권장 12장) 대조(D-019, 체크리스트 §12, 21번 §8, F-017). 문서 `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md`. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-26 제작 경로 확장: ① 에셋 조사 단계(`24`) — 조달처 12곳 탐색 스크립트, Sketchfab·Pexels는 후보가 있을 때 로그인 요청(D-022). ② AI 영상 → 스크롤 파이프라인(`22`, 시험 단계) — 브리프 템플릿, 입고 QA, 스크롤 플레이어, 대역 클립 자체 시험(D-023, F-018). ③ 외부 UI 컴포넌트 검토 단계 C1–C4와 후보 목록(`23`, D-024; coss.com/ui = AGPL). 사용자 대기: Sketchfab·Pexels 토큰, 실제 AI 영상 시험. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-26 AI 영상 절차 정리 + 2차 자체 시험: 시선 — REF-002형 작은 회전은 여백 이동이 진짜 회전과 오차 4.6/255로 거의 정확(첫 판 "한계" 판단 정정, F-019), 변형 영상 섞기는 잔상. 정지 생명감 — 카메라 경로는 영상 위 시간 층, 반복 영상만 "멈춰도 재생 + 스크롤 가속"(F-020, D-026). 입력 정책 — 학습 단계 레퍼런스 금지, 적용 단계 우리 재현 결과 입력(D-025). 깊이 추정 — 상관 0.905지만 프레임 떨림. API 없는 5곳도 스크립트 받기 확인. 다음: 사용자 파이프라인 확정 → P1·P5·P6.
- 2026-09-26 **파이프라인 결정 완료**: AI 영상 파이프라인 확정(D-023). P1 = HIGH·MEDIUM 전체 채택, HIGH에서 WebGL 허용(D-027, D-016 개정). P5 = vanilla 엔진 + React 마운트(D-028). P6 = 충실도 게이트 G1–G6, 자기 수정 3회(D-029). 계약 `docs/uiux_system/25_EFFECT_PRODUCTION_PIPELINE.md`, 체크리스트 §13, AGENTS.md 절 추가. 남은 것: P2 전시 PC(성능 예산 임시값), 재설계 Q1–Q4.
- 2026-09-26 기록 감사: 세션 원문 사용자 발언 19건 대 저장소 기록 대조(`handoffs/RECORD_AUDIT_2026-09-26.md`). 보완: D-030(P3 외부 우선), D-031(등록부·NC 라이선스), D-032(조명 C 모드), O-002(numpy/bpy), O-003(로컬 0 % 정지), R-014, R-015, AGENTS 한국어 중간 메시지, 25번 연결·§8. video-scrub 로컬 실행 수정(standins 커밋, `npm run clips`, 누락 안내, README). 다음: 재설계 Q1–Q4.
- 2026-09-26 재설계 질문 결정: Q1 전체 경험·두 라운드(1R Attract·Story·전환 / 2R Lab·Compare), Q2 Beta A/B 비교 입력만(데이터 안전 장치는 재사용), Q3 UI-02만 승인(글꼴·Loss 뷰 보류 유지), Q4 GitHub 릴리스 ZIP 이미 존재·받기 확인. D-033–D-035, docs/22 §7, 기준선 분석 §7.1. 다음: **1라운드 Step 1 — Common Creative Packet + Reference Pack freeze**.
- 2026-09-27 AI 영상 플레이어 사용자 피드백 반영: 끊김(프레임 밀도 — 대역 240프레임, 입고 QA 밀도 검사, 보간 도구, 멈춤 시 가까운 프레임으로 붙기), 깊이 계단(셰이더 반복 읽기, 경계 보정 기각). F-021, F-022. 다음: 1라운드 Step 1.
- 2026-09-27 다락방 포인터 기본값 `look=both`(사용자 결정, F-024). 압축 전 이어받기 메모: WORK_STATE `resume_notes_2026_09_27`(다음 단계 입력 문서, 사용자 환경, 대기 항목, 의도적으로 저장소 밖에 둔 것). **다음: 1라운드 Step 1 — Common Creative Packet + Reference Pack freeze.**
- 2026-09-27 **1라운드 Step 1 제안 동결**: 공통 창작 패킷(3초·15초 목표, 계약 9항, 산출 예산) + 검증 자료 스토리 S1–S5(중심 S1 "잡음이 바뀌면 1등이 바뀐다") + Reference Pack 6개·4 family(REF-001–004 + 신규 REF-005 ciechanow.ski "Sound", REF-006 R2D3). `docs/uiux_system/rounds/R1/R1_STEP1_PACKET_AND_REFERENCE_PACK.md`, D-036. **사용자 대기: 입력 장치, 중심 스토리 동의, REF-005·006 확인** → FROZEN → Step 2 ALPHA-R1-001.
- 2026-09-27 **Step 1 FROZEN**: 사용자 답 — 입력 = 마우스 휠 + 클릭, S1 중심, REF-006 객체 연속 재배열 지목 → 효과 기록 REF-006(EFX-006-01~05, 소스 + 헤드리스 로컬 사본 측정), RCP-24~27, R-016(확보 방식은 렌더 층으로). Beta는 별도 에이전트. 다음: Step 2 ALPHA-R1-001.
- 2026-09-27 **Step 2 ALPHA-R1-001 동결**: "한 줄의 신호, 바뀌는 1등" — Attract(잡음 속 발굴 sweep) → Story 4박자(성분 쌓기 / 방법 토큰 순위 재배열 / D1 49장면 1등 격자 → EXP-A 평균 막대 / 지표 재정렬) → 파형 match cut으로 Lab. 발산 8개(I8 원근 파형 기각, I6 실험실 하강 보류). F-025: D1 시연 장면은 잡음마다 기록이 달라 "같은 ECG"는 D0 S038로만 성립 → 패킷 정정 표시. 다음: Step 3 BETA-R1-001(별도 에이전트, 이미지 생성 도구 1장 시험 선행).
- 2026-09-27 Beta 스틸 S01–S07 수신(사용자 ChatGPT 생성). **이 커밋이 사용자 직접 검토 재시작 지점** — 이후 단계(Beta 분해·교차 검토·정렬·결정·구현)는 사용자 부재로 `claude/r1-autopilot-recommended` 브랜치에서 권장안 자동 진행. 그 결과를 쓸 수 없으면 여기서 Step 3 분해부터 사용자 결정으로 다시 시작.
- 2026-09-27 **[자동 진행 branch `claude/r1-autopilot-recommended`] R1 Step 3–10 완료(사용자 확인 전)**: BETA-R1-001 동결 → AB-R1-001 교차 검토(AI 대리 정렬) → HYB-R1-001(D-038) → 구현 `prototype/v2/src/story/` → 게이트 G1–G6(자기 수정 3회), e2e 5 PASS. 자동 결정 AP-01~17. F-026. 보고서 `docs/uiux_system/handoffs/R1_AUTOPILOT_REPORT_2026-09-27.md`. **다음: 사용자 검토 — AP 표 피드백 또는 복귀 지점 `1570dd4`에서 재시작.**
- 2026-09-29 **사용자 검토 → 도입부 재구상**: 제목·행성·스크롤 wow·sweep 잔광 부족(F-027). 사용자 구상(역광 지구 → 사람·심장 윤곽 → 가슴 확대 → 박동 동기 네온 sweep, 잡음 → 깨끗 투명도 교차). 화면 구상 단계를 공동 구상 세션으로 변경(`20` Step 5A, D-039, R-017). 보드 `docs/uiux_system/rounds/R1/IDEA-R1-INTRO.md` 라운드 1(B0–B9 선택지) 제시. **다음: 사용자 반응 → 라운드 2 구체화 → 보드 동결 → D·변경 계약 → 구현.** 뒤 단계(조건·격자·막대)는 검토 전.
- 2026-09-29 라운드 1 ★ 추천안 전부 사용자 채택. **작업 예정(도입부 구현 완료 후)**: 사용자가 정리 중인 도입부 이후 Story 화면(1–5단계·Lab 진입) 피드백 반영 — WORK_STATE `R1-NEXT-SCREENS`.
- 2026-10-01 **도입부 품질 검토**: AI·사용자 목록 합침(IDEA-R1-INTRO §7, Q1–Q15, 최우선 사람 형태). 테마 선택지 TH1–TH4 사용자 반응 대기. Story 흐름 v2 검토(IDEA-R1-NOISE §6, S1–S9). **다음: 테마 결정(필요 시 레퍼런스 탐색) → 도입부 재설계 → Story 라운드 1.**
- 2026-10-01 **통합 계획** `docs/uiux_system/rounds/R1/PLAN-R1-INTRO-STORY-V2.md`: 사용자 요구 U1–U19·AI 피드백 A1–A13 추적표. 첫 시도(e4db982)는 셰이더만 바꿔 사람 재제작 요구 미반영(O-007, R-018). **다음: P0 한글 자간 → P1 사람·심장 에셋 재제작(Blender Studio CC0 메시, 눈·입 없는 머리, 손·리그, NIH 심장) → P2 공간(다락방 기법) → P3 지구·하강 → P4 글·연결 → P5 Story.**
- 2026-09-29 잡음별 장면 흐름 기록(F-028, `rounds/R1/IDEA-R1-NOISE.md`): 전원 간섭 → 기저선 변동 → 근육 잡음을 도입부 문법으로 반복(심장 중앙 → 사람 축소 → 상태 표시기 → 원인 오브젝트·물결 → 재확대 → 잡음 입력 → "최선 기법: …" → 깨끗). 기법 설명형 전개 기각. 스택 점검·선택지 라운드는 도입부 구현 후. 이어서 D-040: 잡음 −5 dB 고정, −5 dB 1등이 모두 딥러닝이라 기법 표시 제외(Lab에 남음). 확인 사항: 도입부 장면 S022(74 bpm) ↔ 잡음 장면 S038(100 bpm) 박동 속도 차이 — 도입부 라운드 2에서 결정.
- 2026-09-29 **R1 도입부 구현(D-041)**: S038 통일, 장면 `d0-awgn--5`(백색 잡음 −5 dB, 1등 저장 출력 M06). `prototype/v2/src/story/intro/`(three.js 지구·REF-001 수치 재현, MakeHuman CC0 몸 + 직접 만든 심장, 지구 윤곽 → 사람 외곽선 모핑, 가슴으로 카메라, R 동기 박동, 빛 고리 → 네온 sweep, 잡음 → 저장 출력 초점 교차). 동기화 e2e(R 30개, 0프레임 오차) PASS, 기존 e2e 5 PASS, 단위 18/19(기존 chunk). 검증 `verification/r1-intro-20260929/`. **다음: 사용자 로컬 확인(`npm run story`) → 도입부 피드백 → 잡음별 장면(IDEA-R1-NOISE).**
- 2026-09-30 **사용자 로컬 확인 → 파형 파트 피드백(F-029)**: R 동기 OK. 반영: 0 dB(`d0-awgn-0`, 1등 M06), 잡음 파형 밝기를 출력 수준으로(D-042). 레퍼런스 분석: REF-003 EFX-003-06(세 층 시차, 측정·코드 모형), 신규 REF-007 hauntedbouldercity.com, REF-008 Searching for Birds, REF-009 Igloo Inc, REF-010 Bright Biotech. 공동 구상 보드 `rounds/R1/IDEA-R1-WAVE.md`(격자·전환·라벨·층 시차 선택지). **다음: 사용자 반응 → 파형 파트 구현 → 그 뒤 지구→사람→심장 부분 피드백.**
- 2026-09-30 **파형 파트 구현(D-043)**: G3 심전도 용지 격자(정사각 칸, 번짐 마스크, 머리 뒤 격자 잔광), T2 R 피크마다 4분의 1 전환 + 라벨 인계 + 저장 수치(SNR 0 → 12.44 dB · cc 0.971, 기호만 뒤섞임), L1 두 층 라벨(Pretendard + IBM Plex Mono, OFL 번들), L2 R 주석, P1 층 시차(라벨 0.85 · 파형 1.45). 상시 규칙 D-044(글 요소는 항상 레퍼런스로 설계·제안). REF-008 EFX-008-03(격자 비교 기준). 보드 라운드 2(도입부 다른 글 요소) 제시. e2e 3+5 PASS. **다음: 사용자 로컬 확인 → T3 판단·라운드 2 반응 → 지구→사람→심장 피드백.**
- 2026-09-30 파형 연출 탐색을 사용자 참여 별도 Claude Code 세션으로 분리: 브리프 `docs/uiux_system/handoffs/EXPLORE_BRIEF_WAVE_DISPLAY_2026-09-30.md`(REF-011–019 대역, EXPLORE-WAVE-DISPLAY.md, 기록은 초안만). 결과는 사용자 요청 시 이 세션이 병합.
- 2026-09-28 Windows 로컬 실행 정비(O-005): `npm run doctor / story / story:check / spike -- <이름> / py -- … / py:setup / browsers / v2:prepare`, VS Code 작업(cmd.exe), `docs/LOCAL_WINDOWS.md`, `tests/portability.test.cjs`(npm test). `prepare-v2`가 `methods.json`을 더는 덮어쓰지 않음(R-a 해소). Windows 실기 확인은 사용자 대기.
- 2026-10-08 **도입부 피드백 반영(REVIEW-R1-WEB-20261008)**: 심각 I-4(모델 통일: Mixamo 자동 리깅된 story 메시), I-5(사다리 등장 → 위에서부터 사라짐 → 사다리 오른쪽 바닥 앉기 + 전극 → 가슴 → 심장 → 파형), I-6(심장 ×0.68, Story에도), I-7·I-8(D-055 스크롤 연동 교차) 구현·캡처 확인(`verification/r1-intro2-autorig-20261008/`). **남은 것: 사용자 로컬 확인(Edge 실시간), 디테일 I-1(지구 극지방 음영), 그다음 Story 피드백 라운드. Story를 자동 리깅으로 옮길지(주먹·숨)는 Story 피드백 때 결정.**
- 2026-10-09 I-1 지구 극지방 음영 반영(`verification/r1-globe-relief-20261009/`, 사용자 Edge 확인 대기). **경험 플레이북(D-057, CASE-007)**: `docs/playbook/` — 설계 규칙(방법론 조사 + 사용자 틀 검토), 권장 카드 P-001~P-005, 여정 J-001(사람 모델 → 자동 리깅, 노드 15) · J-002(역광 지구), 검사기 `npm run playbook:check`(자체 테스트 18), AGENTS.md 상시 규칙. 자동 리깅 결정 D-056 사후 기록, R-023. **다음: 사용자의 도입부 일괄 피드백 대기. 정리 대기 주제(서고 빛·스크롤 영상 등)는 해당 작업이 결론에 닿을 때 여정으로.**

