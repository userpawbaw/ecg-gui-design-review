# Review plan

Updated: 2026-09-12

User approved the concrete wireframe review in chat on 2026-09-12 ("응"). The five proposed layout decisions are accepted. R1a/R1b implementation is now authorized and in progress, followed by R2–R5; the earlier wireframe approval gate below is satisfied. Actual browser/hardware gates remain independent.

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
| W1–W10 wireframe preparation | COMPLETE / REVIEW PENDING | docs/15_wireframe_review.md + docs/wireframes/index.html; 12 static boards including three W7 failure variants. Static geometry is not browser QA |

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

## Resume

**Current phase: wireframe review, concrete boards ready.** Read docs/15_wireframe_review.md and docs/wireframes/index.html. Review the bottom method rail, contextual sidebar, preserved two-row height with Difference Lens, compact three-row scrolling and metric reveal timing. Do not start further GUI implementation, dependency migration, 600 s inference, or Playwright QA-runner changes until these wireframe decisions are reviewed.

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
