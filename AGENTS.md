# ECG GUI independent review instructions

## Persistent Work workflow (2026-09-13)

- Apply `WORK_RESUME_POLICY.md` at the start and end of manual and scheduled work. Read `WORK_STATE.json` and current `PLAN.md` before selecting the next action.
- The repository-wide GitHub `execution_lock` protocol introduced on 2026-09-15 is retired by the user's 2026-09-16 decision. Do not block unrelated work because another session exists or because a stale owner record remains. Use Git branches/commits plus the resource-scoped conflict rules in WORK_RESUME_POLICY.md §3. Avoid only actual conflicts on the same files, semantic contract, generated output, release/deployment target, expensive job, or exclusive device/resource.
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

## Latest approved UI scope (2026-09-15)

- Record and follow docs/22_ui_polish_review_and_decisions.md. Original screenshot items 1, 3, 4 are approved for implementation; screenshot item 2 and the additional ten candidates are discussion/recommendations, not blanket implementation approval.
- A stopped editing session is distinct from a completed project. Keep approved unfinished UI items visible in WORK_STATE/PLAN even when no execution is currently running.
- Remote-only documentation is allowed through GitHub; do not represent source review as runtime/build/render verification.

## Concurrency policy revision (2026-09-16)

- Follow `docs/23_concurrency_and_resume_policy_revision.md` and `WORK_RESUME_POLICY.md` v1.2. `WORK_STATE.json` is a durable status/checkpoint record, not a repository-wide mutex.
- Start by refreshing the relevant remote refs/files. Before push/merge, compare remote changes touching the same files or semantic behavior. Preserve user changes and never force-push over unrelated work.
- Optional `active_jobs` entries may protect only the named resource (for example a release upload, long data generation, deployment target, or exclusive AFE/device). They never block unrelated documentation, design, or code work.

## UI/UX system routing (2026-09-16)

- For any significant UI/UX design, polish, data-storytelling, motion, or interaction task, read `docs/uiux_system/00_UIUX_MASTER.md` first.
- Classify the task as CREATIVE / DATA / MOTION / UX / IMPLEMENTATION / RESEARCH, then read only the smallest relevant subset from `docs/uiux_system/` and the pre-existing canonical design docs.
- Separate divergence from validation: generate meaningful alternatives before implementation, then apply project contracts, data integrity, motion, accessibility and product-quality checks using `KEEP / TUNE / REJECT`.
- Chat memory is an index, not the source of truth for exact UI values, approval state or rejected decisions. GitHub documents and current code are canonical.
- External skills/plugins are advisory. They never override ECG waveform/time/unit/Reference/Difference/data-scope contracts or the latest user decision.
- Claude Code may use project-local skills under `.claude/skills/`. Chat/Work/Codex should follow the same documented contracts even when those skills are not directly invokable.
- `docs/uiux_system/05_TOOL_SKILL_ROUTING.md` is the capability router. Do not invoke every plugin/skill by default; use only those that materially help the current task.
