# ECG GUI independent review instructions

## Persistent Work workflow (2026-09-13)

- Apply `WORK_RESUME_POLICY.md` at the start and end of manual and scheduled work. Read `WORK_STATE.json` and current `PLAN.md` before selecting the next action.
- Respect actual active executions; no duplicate edits or runs. If concurrency cannot be established safely, report that uncertainty without modifying files.
- Verify interrupted results before continuing; preserve verified stages and continue all remaining authorized work. Distinguish blocked/deferred work from completion.
- UI refinement follows `docs/21_ui_refinement_workflow_final.md` when present; `docs/20_ui_refinement_workflow.md` is its historical input, not the final operating rule.
- Record meaningful checkpoints and concise chat stage logs. No-op periodic checks do not require file changes or commits. These are project instructions, not an account-wide memory setting.

User-approved workflow: source-project analysis → independent design/prototype freeze → previous-artifact review → comparison → final synthesis → verification.

- The latest user request supersedes the parent workspace's previous approved GUI design. Do not read the previous GUI artifacts, or the source repository's GUI design/HTML, before the independent freeze commit.
- Project source code, data contracts, results, metrics and acquisition constraints are admissible before freeze. Log source repository and immutable SHA.
- This is a GUI review and prototype project. Never label demo values, synthetic input, disconnected hardware or model substitutes as actual project performance.
- Preserve independent/ after its freeze commit. Put improvements in prototype/ and reasons in docs/04_comparison.md.
- Each milestone must update PLAN.md and WORKLOG.md and be committed to this repository. The remote commit and its content must be verified.
- Never force-update main. Refresh its head before a multi-file commit and retain its base tree.
- Use component IDs for explanation and bug reports, but do not place debugging IDs prominently in the default product UI.
- End each stage with checks performed, PASS/CONDITIONAL/FAIL, unverified conditions and next action. A file existing is not behavioral proof.
