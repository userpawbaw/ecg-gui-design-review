# Work log

## 2026-09-12 — v2.2.1 SWT audit and requested UI revision

- Restored latest GitHub e0c9878 source and verified released ZIP hash. Local archive JSON was truncated; restored it byte-for-byte from the verified release before rerunning DOM checks. Long replay chunks came from that release, not incomplete local raw generation files.
- Checked all 98 long scenes and 98 archive scenes: no fully identical M04/M_FE pair. Reproduced 14 long conditions with input hash equality and 28 outputs within quantization tolerance. Hard threshold and k=0 controls pass. D1 conservative hard threshold is active; weak/no extra benefit on some noises is a performance finding, not a missing execution claim.
- Enabled moving Output−Reference for both modes, preserved Difference across play/pause/mode transitions, added five left y ticks with gain-correct physical values, repaired Difference bottom-label space and range-fit inclusion. Active SWT metadata is visible in Method Explorer.
- Final verification: 13 unit/engine/chunk tests PASS; DOM/Canvas-command checks PASS; TypeScript/Vite build PASS; ZIP CRC PASS and all 1968 prior replay/archive/legacy assets byte-identical.
- Added axis unit tests, DOM/Canvas-command playback checks and target-PC tests for standard/large Difference. Font and major tab/loss changes deferred as requested. No native browser run claimed.


## 2026-09-12 — R2 complete; R3/R5 handoff prepared

- Generated 47 conditions (46 missing + one corrupted), preserving the other 51 verified files. All 98 conditions now have 600s/150,000 samples. Re-verified 112 pinned inference assets.
- Verified 1,274 arrays and 1,078 method metric sets against source float metrics within declared quantization tolerances. Packaged 1,960 30s chunks; reassembly byte-identical. First packaging attempt stopped before the final D0 condition existed; reran after both generators completed 49/49. Final report: verification/v2-long-data.json.
- Integrated bounded adjacent-window loading, SHA-256/length checks, a nine-chunk cache, full-session metrics, request-epoch guards, frozen interval seek and intent-aware resume. Added fixed-input scenario bookmarks, explicit ten-second Attract/handoff, opt-in idle, timeline range/markers and clipping notices.
- Final engine/chunk/Attract tests: 11 PASS. DOM state tests: 6 PASS. TypeScript/Vite build PASS. Hashed-window test includes 30/60/300/600s boundaries and corrupted-chunk rejection; it is not a real ten-minute wall-clock soak.
- Prepared standalone distribution with all 98 conditions, local Node launcher, optional PC Playwright runner, source/license notices and docs/17_v2_team_handoff.md. Package integrity in verification/v2-package.json.
- Verdict: implementation/data CONDITIONAL PASS; R4 actual browser/exhibit/AFE NV. R5 handoff prepared, final closeout awaits target-PC results. Do not ask for the already-granted wireframe approval again.

## 2026-09-12 — wireframes approved; R1 implemented

- User approved the five wireframe decisions. Restored local baseline from verified GitHub blobs (38 restored / 22 intact), preserving latest main planning and recovering v2 source.
- Implemented bottom method rail, optional sidebar, persistent Pin, separate Output−Reference Difference Lens, explicit metric scope and last-valid-scene loading/error behavior.
- Checks: engine 9 PASS; DOM state 6 PASS; TypeScript/Vite build PASS. Browser pixels/native behavior remain NV. Details: docs/16_implementation_progress.md and verification/v2-dom.json.
- Long-data resume audit found 51 prior files identical and d1-mixed-15.json malformed/hash mismatch. Quarantined it; regenerate this condition plus 46 missing conditions, no retraining.
- R1 code checkpoint CONDITIONAL PASS; next R2 full data grid/chunks, then R3–R5. No actual browser execution is claimed.

## 2026-09-11 — W1–W10 wireframe preparation

- Reconciled remote main 90792b9 with the interrupted local v2 implementation. Preserved 27 source/log files in recovery commit f8b63004f54d29700b101d1e25599d62bc4e6e35; verified remote tree hashes and branch ref. No inference output JSON or installed dependency tree was added to Git.
- Read v2.1/v2.2 latest baselines and completed 12 static spatial boards covering W1–W10, with W7 pending/error/missing variants. Authored docs/15_wireframe_review.md: exact plot dimensions, 12 design questions, state behavior, touch flow, scenario policy, atomic transitions and review decisions.
- Retained two plot interiors at 280px for 1080p, 204px compact, 200px three-row 1080p. Difference Lens is separate Output−Reference with a 64px trace area. Proposed compact three-row scroll and first-screen metric reveal remain review decisions, not accepted changes.
- Checked generated region bounds and panel label widths; directly inspected W3/W8 PNGs and the complete board overview. These are static design diagrams generated with Pillow/SVG, not browser screenshots. No restricted browser route was retried; no new GUI implementation or full-grid inference continued.
- Static document/asset link and geometry audit saved in verification/wireframe-review.json. Verdict: wireframe preparation COMPLETE / static checks PASS / user review PENDING / actual browser and exhibit readability NV.
- Next: user reviews five layout decisions in docs/15_wireframe_review.md, then resume R1a/R1b from the recovery divergence table, followed by R2–R5. Work is not reported as final GUI completion.

## 2026-09-11 — interrupted v2 checkpoint

- Recovered v2 source and 52/98 complete 600-second conditions (D0 25, D1 27); 676 trace arrays decode to expected lengths. 112 pinned source asset hashes and 12 preserved baseline files matched. Evidence: verification/v2-resume-check.json.
- Re-ran nine engine tests and TypeScript/Vite build: PASS. Re-generated d1-mixed--5: all traces, scale and stored metrics exactly match; only methodSeconds differs. No full-grid restart after discovering the new remote plan.
- GitHub main advanced to 90792b9 with v2.1/v2.2 and a wireframe-first gate. Preserve v2 WIP on recovery/v2-interrupted-20260911; follow main's W1–W10 next. Detailed divergence and limitations: docs/14_resume_audit.md.
- Verdict: recovery PASS; v2 implementation PARTIAL; actual browser/hardware verification NV. Next: wireframe review, then resume implementation with the approved decisions.

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

## S2 — remote freeze confirmed

- Commit bcd2f8d1516b4020895e6e17ed66107773504faa, tree 54e89c323968309ff5c4e7729b2839150e275143.
- All 14 committed files matched local Git blob hashes after remote tree retrieval. Receipt in verification/S2-freeze-receipt.json.
- Only after this check were previous GUI files opened.

## S3 — comparison complete

- Compared previous local complete HTML, handoff, checklist, reusable manual and two labeled wireframes; also source demo/index.html, demo/live.html, demo/mockup_expo.html and docs/31.
- Found P0 method-name mapping differences and contradictory success labels within sample UI. Prior handoff already documented sample/CDN limitations; did not represent those as newly discovered facts.
- Credited previous design for multi-method comparison, audience flow, component-level debugging and operational states. Credited source GUI for real bank, all SNR/method controls and SSE/ring-buffer implementation.
- Criticized independent version for limited methods/conditions, weak presentation flow, missing cohort context near scene, small-screen source loss and incomplete failure recovery.
- Recorded synthesis decisions and common rubric in docs/04_comparison.md. No rendered beauty or full behavior superiority is claimed without browser evidence.
- Verdict COMPLETE for source/document comparison; browser rendering NOT VERIFIED. S0–S3 complete; S4 active, S5 remains.

## Recovery and S4 implementation checkpoint

- Date: 2026-09-09. User requested a loss audit after interruption.
- Remote main is still S3 commit `7eb0723a255d33ba9c85fbd12dde8c55d74af8cd`. All 19 files in that remote tree exist locally; the preview server is the only pre-existing file changed before this log update. All seven frozen independent/data files match the S2 receipt. Known S4 files are present. Evidence: `verification/recovery-check.json` and `verification/S3-remote-tree.json`.
- Added prototype/ with actual stored 98 scenes, 12 selectable methods including identity, two-method comparison beside FE, dual focus, EXP-G condition means, presentation guide, scope-aware provenance, review JSON and acquisition diagnostics/explicit Replay preview.
- Added extension.js while preserving the frozen bank. 1,078 output metrics / 1,274 trace arrays PASS; maximum difference from rounded archive scaled SNR 0.009936 dB. Same-condition reference/noise consistency checked with quantization tolerance.
- Re-ran JavaScript syntax and 22 DOM behavior groups successfully. Native dialog methods use an explicitly documented test host shim; browser pixels, native focus, screen reader and hardware remain NOT VERIFIED.
- One asynchronous shell polling call could not resume its tool session; the relevant tests were rerun synchronously and passed. No missing authored file was found. The existing portable HTML is stale and will be rebuilt for S5.
- Verdict: S4 implementation checkpoint CONDITIONAL, not a completed product. Next: finish Replay regression coverage, component-level final specification/team guide, portable-build verification and final report. S0–S3 complete; S4/S5 remain.

## S4 — synthesis and handoff complete

- Recovery checkpoint `5b6b5ad24b25b480dbf0e49844075b697147d566` was committed and all 19 changed files verified against the remote tree.
- Final specification maps all previous 16 frame IDs and 10 hotspot flows to implemented, integrated or deferred behavior. It does not claim 16 functional frame passes.
- Team guide documents 38 component IDs with purpose, behavior, failure symptoms and code entry points. Includes metric scope, archived data identity, review JSON, source bridge contracts and integration requirements.
- Reusable manual addendum separates structure/behavior/evidence/environment verification and includes screen split/addition and recovery checkpoint rules.
- Added four Replay DOM groups (now 26) covering explicit entry, invalid mask, warmup/reset output clearing and stop-on-close. Added clipping disclosure and scope-aware header; final review snapshot includes acquisition scenario. Split dual plots into responsive panels with larger SVG labels.
- Re-ran the parent workspace's legacy audit against the previous mockup as required: FAIL on three external CDN scripts (Floating UI core/dom, Lucide). This confirms the old offline defect, not a failure of prototype/. That validator is intentionally not repurposed to certify the new GUI.
- Verdict: S4 implementation/specification COMPLETE; browser rendering NOT VERIFIED. Next S5: rebuild and execute portable HTML in DOM test host, verify downloaded JSON payload, audit component/document references, final report and remote commit.

## S4 — remote synthesis checkpoint confirmed

- Commit `b0299499b49736a4222e321df497bce0e6d1ec56`, tree `4e60766414839412edec53b34ef98006302a07de`. All 12 changed files matched the remote blobs.

## S5 — final verification and handoff

- Date: 2026-09-09. Final source syntax checks passed for 13 JS/CJS files.
- Re-ran core known-input/subset tests, final data tests and 26 DOM task groups. All passed. Final data covers 98 scenes, 1,274 trace arrays, 1,078 stored method outputs. Maximum scaled-SNR difference 0.009935499 dB; quantization-aware same-condition consistency passed.
- Rebuilt the portable HTML: 8,809,153 bytes, SHA-256 `f14296bc03d2c725bc5940df7fcca5e0e856fd376d8124f79a1558ed262ee5a2`. Source input hashes are recorded in verification/portable-build.json.
- Executed actual inlined scripts in a jsdom host: six portable groups passed. Verified JSON payload/filename/notes/source hash/explicit null metadata and acquisition preview context. Native file download was not simulated as a filesystem success. Actual browser dialog/focus and download remain NV.
- All 38 component IDs match the team guide exactly. Nine frozen source/design files match the S2 receipt. All 25 local document links resolve. Eighteen selected opaque palette pairs pass their stated contrast thresholds; this is not an all-state accessibility certificate.
- Authored docs/07_verification.md with the original rubric, 16-frame/10-flow reconciliation link, browser checklist and research/hardware integration gates. README now points to final entrypoints and makes archived vs freshly executed data explicit.
- Routine verification corrections: the document audit initially checked for its own not-yet-created report; corrected its generation order exception, then all actual file links passed. An earlier test expectation of 18 aggregate rows was corrected to the source's actual 16. Neither was relabeled a product defect.
- Overall verdict: CONDITIONAL PASS for the final GUI prototype. Implementation/specification and automated checks S0–S5 are complete. Browser pixels, native keyboard/dialog/download, OS settings, current-code inference regeneration, pathology annotation and actual AFE/exhibit validation remain unverified or pending as documented.
- Next action: target-PC browser checklist with screenshots and review JSON, then archive regeneration and source/session-aware bridge integration. No further optional tests are needed before that evidence exists.

## Post-stop resume — implementation intact; target-PC handoff prepared

- User reported the stuck progress indicator had stopped and requested continuation.
- Refreshed GitHub main: `4a99f30f0b6b108f0e5b61a11c3f6e62b82a67f8`. All 44 baseline files match the final receipt; no missing or changed source file. Portable HTML matches SHA-256 `f14296bc03d2c725bc5940df7fcca5e0e856fd376d8124f79a1558ed262ee5a2`. Evidence: verification/post-stop-resume.json.
- No interrupted source implementation was found. Data and full DOM suites were not repeated; their reports remain tied to unchanged source. A later portable-file integrity failure required a targeted portable retest, recorded below.
- Continued the next feasible step with docs/09_target_pc_check.md: ten exact PC tasks, expected states, screenshot priorities and a result form. Linked it from README and PLAN.
- No GUI behavior, frozen design, source data or model output was modified. No previously blocked browser route was retried.
- Verdict: recovery PASS; target-PC handoff preparation COMPLETE; actual browser/native behavior still NOT VERIFIED. Overall GUI verdict remains CONDITIONAL PASS.
- Next evidence: PC lab/focus/Replay screenshots, exported review JSON and observed keyboard/download results. Then resolve UI issues before archive regeneration and AFE integration.

## Post-stop portable artifact recovery

- During the new document audit, portable HTML no longer matched its verified build hash. Direct inspection found a 27,329-byte tail truncation. The damaged 8,781,824-byte file was an exact prefix of the correct 8,809,153-byte HTML. Cause not established; no background project writer was identified in the limited process inspection.
- Existing ZIP member remained intact and matched `f14296bc03d2c725bc5940df7fcca5e0e856fd376d8124f79a1558ed262ee5a2`. Preserved the damaged file under dist/recovery/ and restored the HTML atomically from the verified ZIP. Receipt: verification/portable-recovery.json.
- Re-ran only the six portable groups needed to verify the recovered artifact: PASS. All 38 component mappings still match. Document/freeze/build audit also passed; the initial link count was 28 before the recovery report links were added.
- Clarification: the initial resume check was successful, but a subsequent artifact failure was found and repaired. Source files/data were intact; this is not proof of what caused the progress indicator to remain active.
- Updated PC handoff and final report to use a freshly downloaded review ZIP. Browser/native/AFE gates still require actual target-PC evidence.

## R0 — continuous playback and enlarged comparison proposal

- Date: 2026-09-10. User requests a reviewable plan and confirmation before implementation: true Sweep/Scroll, >=600s data, large noisy/output comparison with gray reference, hover or pinned comparison, and browser automation that reduces manual QA.
- Re-read final app, original mockup drawAll, bank builder, DLDenoiser and split contracts. Current app only animates a cursor; original Sweep moves an erase band on a fixed synthetic trace. A true new-sample playback engine is needed.
- Queried the pinned original Git tree; raw MITDB/NSTDB and D0/D1 checkpoints exist. Fetched 111.hea: 650000 samples at 360Hz (~30.09min). Asset presence is not proof of checkpoint loading or completed 600s inference.
- User clarified during planning: generate 10-minute outputs through existing methods for every noise combination, not retraining. Proposal targets all existing 98 axis/noise/SNR conditions and supporting method outputs; single-condition generation is only a pipeline gate. Retraining excluded.
- Browser skill connection exposes cloud Chrome only; no user-PC browser connection was observed. Prior file/localhost access block was not bypassed or repeatedly retried. Opened official Playwright headed-run/trace docs and OpenAI browser docs. Proposed local PC automatic evidence bundle; no runner was built or executed yet.
- Authored docs/10_playback_expansion_proposal.md: shared transport, honest Sweep time mapping, large two-row dialog with optional third row, full-grid generation, chunked offline packaging, automated QA gates and R1–R5 sequencing. PLAN updated.
- Checks: read-only source/capability feasibility and proposal consistency; GUI code/data unchanged, no inference/training/browser rendering performed. R0 proposal COMPLETE / implementation and execution NOT VERIFIED. Await user confirmation as explicitly requested; next R1 shared playback and enlarged viewer.

## R0-v2 — Expo and GUI planning review

- Date: 2026-09-10. User asked for design discussion and a v2 plan before implementation, including short Sweep fade and a review of React/Tailwind/shadcn/ui.
- Confirmed current stack from source and package.json: plain HTML/CSS/JS + SVG; only jsdom is a development dependency. No framework was installed or migrated.
- Read official Fluent motion, React synchronization, Tailwind static CSS, shadcn open-code, Vite build, MDN animation/Canvas and WCAG motion guidance. Distinguished source-backed roles/principles from project-specific timing/layout proposals.
- Authored docs/11_expo_gui_plan_v2.md with v1→v2 decisions, short edge-only Sweep fade, independent playback/mode controls, same-segment inspection, stable hover/pinned-row rules, large-view sizing and semantic styling, presenter bookmarks and opt-in Expo idle behavior. Recommended the same base ECG across noise conditions in newly generated data.
- Recommended incremental React/TypeScript/Vite/Tailwind/selected-shadcn migration while preserving current visual identity, frozen independent output and S5 baseline. A dedicated renderer owns high-frequency samples; React owns interaction state. Recommendation is not implementation authorization.
- Maintained all 98 conditions ×600s output generation, no retraining, no method-output substitutes and explicit research/Replay provenance. Added 14 v2 acceptance items; motion constants and typography are preliminary values pending actual rendering.
- Updated PLAN/README and linked v1 to v2. No GUI/runtime/data/QA code changed. No browser rendering, model inference or installation performed. Planning COMPLETE; implementation/rendered quality NOT VERIFIED. Next after confirmation: R1a behavior parity and browser evidence path, then R1b–R5.
- Planning verification PASS: 19 local links in the five touched Markdown files resolve; V2-01–14 are present; all 23 baseline non-document/non-verification files match the S5 Git blob receipt. Existing automated GUI suites were not repeated because their inputs/code were unchanged. This document audit is not a rendered-UI pass.
