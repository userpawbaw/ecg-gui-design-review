# Review plan

Updated: 2026-09-09

## Goal

Produce a source-grounded independent GUI design, compare it fairly with the earlier GUI, and deliver a verified synthesis prototype plus team handoff. Model identity is not evidence of quality.

## Stages and observable completion

| Stage | Status | Completion evidence |
|---|---|---|
| S0 GitHub write check | PASS | README commit 82ee3f6f60eca15185c562a232dad50afa847b08; remote content equality verified |
| S1 source-project understanding | PASS | docs/01_source_review.md; immutable source SHA, inspected contracts/results and archive freshness boundary |
| S2 independent design freeze | READY TO COMMIT | Design, acceptance rubric, offline interactive concept and actual output data complete; 336 metric checks pass. Browser file/localhost preview blocked; visual interaction verification pending |
| S3 prior-artifact comparison | PENDING | Existing behavior checked; both versions compared against identical tasks with evidence and weaknesses |
| S4 final synthesis | PENDING | Runnable GUI, component guide, input/output contracts and migration decisions |
| S5 final verification | PENDING | Offline, state, context, controls, visual/keyboard tests; actual limitations; final remote commit |

## Source boundary

- Source: userpawbaw/ECG_denoising_method_comparision
- Branch at discovery: claude/ecg-denoising-dsp-dl-comparison-b5wjvj
- Pinned SHA: 5eb27946087faca3c6e70b3925e2ba132b2ee680
- Source demo HTML and docs/30–34 GUI plans are deferred until S3, as are previous local GUI deliverables.
- Earlier conversation contents cannot be erased. Independence means deferred reinspection, explicit design reasons and a prior freeze commit.

## Resume

Read this plan and the last WORKLOG entry. Commit S2, verify the remote tree, then start S3. Do not replay successful write checks or reopen older UI before the S2 freeze commit exists.
