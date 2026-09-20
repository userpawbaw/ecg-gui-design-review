---
name: reference-mining
description: Mine concrete visual references for ECG Signal Studio and translate specific scenes into project-safe creative principles. Use when the user asks for reference mining, Awwwards/Godly inspiration, a new bold visual direction, or help understanding what a creative proposal should feel like before prototyping.
---

Your job is to make visual intent inspectable before implementation.

In a Dual round, this is Director A only: follow the orchestrator's clean input manifest, generate 5–8 concepts, freeze and return them. Do not start Superdesign or inspect B outputs; the orchestrator applies 16_DUAL_CREATIVE_DIRECTOR cross-review first. The serial shortlist/generation instructions below apply only outside an active Dual first pass.

1. Read `docs/uiux_system/00_UIUX_MASTER.md`, `01_CREATIVE_DIRECTION.md`, `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`, and `17_REFERENCE_SOURCE_REGISTRY.md`.
2. Define one sentence for the intended viewer feeling or understanding before searching.
3. Use the task router in `17_REFERENCE_SOURCE_REGISTRY.md` to choose 2–4 source families, then find 3–8 concrete references. Do not default to Awwwards/Godly only. Full-site, section, component, flow, case-study, and research references are all allowed when their provenance is explicit.
4. For every reference, record `Reference Nature`, `Source Family`, `Granularity`, and `Evidence Level`, then give a direct URL and a precise `Viewing instruction`: tell the user exactly which scene, section, component, time window, scroll transition, or interaction to inspect. Never provide a link without saying what to look at.
5. Separate `Reference Feature → Experience Principle → Project Meaning → ECG Implementation Candidate`.
6. State what must NOT be copied: original palette, font, object, illustration, shader, layout, or interaction when those are not essential to the principle. Treat Behance/Dribbble-style concepts as inspiration unless separately verified as shipped; do not claim production UX evidence from a concept shot.
7. Assign Creative Freedom Zone and Imitation Distance (0–4). Default target is 3–4.
8. Generate at least 5 meaningfully different ECG-specific ideas grounded in those references. For each include goal experience, reference IDs, borrowed principle, ECG translation, expected 3-second impression, implementation hint, risk, prototype cost, and current evidence level.
9. Do not modify waveform geometry, time axis, units, Reference/Difference semantics, or metric meaning for visual effect.
10. Do not reject unusual ideas during divergence unless they directly violate data integrity. Send candidates to a separate validator pass.
11. Use reference mining as a cheaper visual-alignment step before mockups. Shortlist only the strongest 2–4 candidates.
12. If the shortlisted candidates still need concrete side-by-side visual comparison and the environment can run Superdesign, route them through the project `superdesign-routing` workflow and `docs/uiux_system/14_SUPERDESIGN_GENERATION_LAYER.md`. Do not send all 8–10 ideas to the generator.
13. If Superdesign cannot run in the current environment, prepare the same draft brief for Work/Codex/Claude or use Figma/React light prototypes instead.
14. If a reference changes the project’s interpretation, workflow, or AI-collaboration method, update the appropriate F/D/R record instead of silently changing the final recommendation.
15. This skill is advisory. The project MASTER and current user instruction override it.
