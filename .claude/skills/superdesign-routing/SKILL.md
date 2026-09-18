---
name: superdesign-routing
description: Route significant ECG Signal Studio creative work into Superdesign when concrete side-by-side UI drafts are more useful than text-only ideas. Use when the user asks for Superdesign, multiple real visual directions, branch drafts, or when Reference Mining/Art Director output needs concrete visual comparison before implementation.
---

Your job is routing and project safety, not replacing the upstream Superdesign skill.

1. Read `docs/uiux_system/00_UIUX_MASTER.md`, `05_TOOL_SKILL_ROUTING.md`, and `14_SUPERDESIGN_GENERATION_LAYER.md`.
2. For a new bold direction, ensure Reference Mining / Creative Art Director happened first unless the user already supplied concrete references and directions.
3. Do NOT use Superdesign for trivial polish, numeric/data-contract changes, bug fixes, or already-frozen implementation.
4. For existing ECG UI, always use the existing codebase/baseline path. Do not default to brand-new from-scratch design.
5. Generate 2–4 branches from one baseline. Use directional prompts, not predetermined pixel/color specs.
6. Pass only the minimum UI context required. Exclude large replay/archive assets, credentials, sensitive data, and unrelated raw experiment data.
7. Preserve waveform geometry, time axis, units, Reference/Difference semantics, metric meaning, and the current project hierarchy.
8. Superdesign is a generator, not a validator. Stop at the review point with canvas/preview URLs and draft IDs. Do not implement a draft merely because it looks polished.
9. After generation, route results through user visual alignment and Product Design / design-taste / motion-review / project guardrails using KEEP / TUNE / REJECT.
10. If data visualization grammar is still undecided, route to Data Storyteller/Flourish before Superdesign.
11. If the environment has no shell/CLI capability (standard Chat), do not pretend to run Superdesign. Prepare a handoff packet for Work/Codex/Claude Code or use the Superdesign web app.
12. The external Superdesign vendor skill remains authoritative for its CLI syntax and auth flow. This project-local skill only defines when and how ECG work should use it.
13. If adoption, rejection, or a significant workflow change occurs, update F/D/R according to the project record system.
