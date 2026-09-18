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
- IN PROGRESS: branch → PR → 최신 head CI 확인. 결과는 PR checks 및 후속 WORKLOG에 연결.
- AWAITING USER after records closeout: 16번 canonical contract, dual-director skill, Superdesign dual-mode 및 activation routing. 이번 단계에서 구현/생성하지 않는다.
- 기존 target-PC/AFE/release 회복 등 별도 미완료 항목은 그대로 유지한다.
