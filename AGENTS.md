# ECG GUI independent review instructions

User-approved workflow: source-project analysis → independent design/prototype freeze → previous-artifact review → comparison → final synthesis → verification.

- The latest user request supersedes the parent workspace's previous approved GUI design. Do not read the previous GUI artifacts, or the source repository's GUI design/HTML, before the independent freeze commit.
- Project source code, data contracts, results, metrics and acquisition constraints are admissible before freeze. Log source repository and immutable SHA.
- This is a GUI review and prototype project. Never label demo values, synthetic input, disconnected hardware or model substitutes as actual project performance.
- Preserve independent/ after its freeze commit. Put improvements in prototype/ and reasons in docs/04_comparison.md.
- Each milestone must update PLAN.md and WORKLOG.md and be committed to this repository. The remote commit and its content must be verified.
- Never force-update main. Refresh its head before a multi-file commit and retain its base tree.
- Use component IDs for explanation and bug reports, but do not place debugging IDs prominently in the default product UI.
- End each stage with checks performed, PASS/CONDITIONAL/FAIL, unverified conditions and next action. A file existing is not behavioral proof.

