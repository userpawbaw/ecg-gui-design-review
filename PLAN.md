# Review plan

Updated: 2026-09-10

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

## Source boundary

- Source: userpawbaw/ECG_denoising_method_comparision
- Branch at discovery: claude/ecg-denoising-dsp-dl-comparison-b5wjvj
- Pinned SHA: 5eb27946087faca3c6e70b3925e2ba132b2ee680
- Source demo HTML and docs/30–34 GUI plans are deferred until S3, as are previous local GUI deliverables.
- Earlier conversation contents cannot be erased. Independence means deferred reinspection, explicit design reasons and a prior freeze commit.

## Resume

Latest user steering: approve a concrete plan before implementing true Sweep/Scroll, >=600s continuous data and a large comparison dialog. See `docs/10_playback_expansion_proposal.md`. R0 source/capability analysis and proposal COMPLETE; R1–R5 await user confirmation. Do not start GUI edits, inference, training or QA-runner implementation until confirmed. This supersedes the previous request for the user to manually perform all target-PC checks: propose a local Playwright evidence bundle to minimize manual work.

Read this plan and the last WORKLOG entry, then compare the remote head and local build hashes. S0–S5 are complete for the source-grounded GUI review, implementation, documentation and automated checks. Overall result is CONDITIONAL PASS. Do not repeat the independent design or overwrite independent/. Next: run docs/07_verification.md browser checks on the target PC; then regenerate archive metadata and connect the existing bridge adapter. These are separate unverified integration/deployment gates.

## Remaining gates, not hidden implementation claims

Target-PC execution handoff: `docs/09_target_pc_check.md` gives Q01–Q10 actions, expected results and a report template. Preparation is COMPLETE; actual browser execution remains NOT VERIFIED. Continue visual/interaction review from the user's captures and review JSON. Do not repeat completed automated tests without a relevant code change.

- Target desktop browser rendering, native keyboard/dialog/download, zoom/scaling, screen reader and offline opening: NOT VERIFIED because local browser navigation is blocked in this environment.
- Current-source/checkpoint archive regeneration, exact metadata and pathology annotation: PENDING.
- Actual AFE adapter/source-session contract, hardware and exhibit testing: PENDING.
- Optional automatic attract/idle reset and expanded distribution/annotation screens require their data and operational requirements. Prior 16 frames and 10 hotspot flows are reconciled in docs/05_final_spec.md.
