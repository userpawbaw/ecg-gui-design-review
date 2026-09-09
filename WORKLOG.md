# Work log

## S0 — GitHub connection reset and write verification

- Date: 2026-09-08.
- Earlier attempts returned integration 403. User reset the plugin and requested a new check.
- Re-read remote main/README.md and its current blob SHA; changed the README to the review charter with that SHA guard.
- Remote commit: 82ee3f6f60eca15185c562a232dad50afa847b08.
- Content blob: 5aa229291c1b1c62cbf2ab409bfe9a2aa5d31eb8.
- Re-fetched both the commit and main/README.md. Sent and received UTF-8 contents matched exactly.
- Verdict: PASS for actual README write and commit verification. Repository creation, branch protection edits and other admin actions were not tested or required.
- Plan: S0 complete; S1–S5 remaining. Next: source analysis at immutable SHA 5eb27946087faca3c6e70b3925e2ba132b2ee680.

## S1 — analysis started

- README and full path inventory were read. Repository has newer realtime processing, metrics and front-end experiments beyond the early README.
- Source GUI design files and demo HTML were identified by path and deliberately deferred until the independent design freeze.
- No claims about code execution or hardware operation are made from source inspection alone.

## S1 — source analysis complete

- Wrote docs/01_source_review.md with source-grounded requirements and conflicts between metrics, documentation and implementation.
- Verified actual demo-bank bytes against pinned Git blob 4a94d1b79db95b8cb8afa5e8f944955d756c5db6. Retrieved large public data via its immutable raw URL after the connector could not return its bytes; no access restriction was bypassed.
- Builder provenance matches; dataset source hash differs. Archive output will be labeled as stored results requiring regeneration verification.
- Corrected assumptions: existing registry/streaming bridge, 250 Hz processing, D1 band-limited reference, D3 uncollected, insufficient D1 QRS duration discrimination, bridge source/clock/denominator contract gaps.
- Verdict PASS for source inspection; model rerun, hardware, current-code reproduction NOT VERIFIED.
- Overall: S0/S1 complete, S2 active, S3–S5 pending. Previous GUI files remain unopened.

## S2 — independent design and implementation ready for freeze

- Date: 2026-09-09 (continued across the session boundary).
- Authored docs/02_independent_design.md and docs/03_acceptance_rubric.md before reading previous GUI artifacts.
- Built independent/index.html, style.css, core.js, app.js. Three workspaces; actual saved waveform comparison, method selection/preview, shared axes, interval focus, residual, strict/scaled/alpha/CC, aggregate evidence, acquisition-state preview and provenance dialog.
- Extracted 48 source scenes (D0/D1 × 4 conditions × 6 SNR) with 432 trace arrays. Named method outputs are source data, not generated substitutes. Kept original archive provenance and dataset freshness mismatch.
- Node syntax checks and tests/core.test.cjs PASS. Checked 336 output metrics against rounded stored values; largest scaled-SNR difference 0.0053266 dB. Known-input numerical tests include gain, DC, zero variance, invalid shape and signed int16 decoding.
- Browser setup succeeded. Direct local-file navigation was blocked by the browser URL policy. A server restricted to app assets was tried as a narrower exposure; localhost navigation returned ERR_BLOCKED_BY_CLIENT. No further browser access workaround is attempted. Actual rendered interaction, focus and screenshots are NOT VERIFIED at this checkpoint.
- Verdict: source-grounded independent concept complete, verification CONDITIONAL. Freeze preserves this limitation instead of inventing a visual PASS.
- Next: commit and verify S2 before opening previous artifacts; S3 comparison, S4 synthesis and S5 verification remain.
