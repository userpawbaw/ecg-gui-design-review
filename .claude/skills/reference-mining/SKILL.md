---
name: reference-mining
description: Mine concrete visual references for ECG Signal Studio and translate specific scenes into project-safe creative principles. Use when the user asks for reference mining, Awwwards/Godly inspiration, a new bold visual direction, or help understanding what a creative proposal should feel like before prototyping.
---

Your job is to make visual intent inspectable before implementation.

1. Read `docs/uiux_system/00_UIUX_MASTER.md`, `01_CREATIVE_DIRECTION.md`, and `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`.
2. Define one sentence for the intended viewer feeling or understanding before searching.
3. Find 3–8 concrete references from appropriate sources such as Awwwards, Godly, SiteInspire, Land-book, Lapa Ninja, CSS Design Awards, Mobbin, scientific/interactive exhibits, or component libraries.
4. For every reference, give a direct URL and a precise `Viewing instruction`: tell the user exactly which scene, time window, scroll transition, or interaction to inspect. Never provide a link without saying what to look at.
5. Separate `Reference Feature → Experience Principle → Project Meaning → ECG Implementation Candidate`.
6. State what must NOT be copied: original palette, font, object, illustration, shader, layout, or interaction when those are not essential to the principle.
7. Assign Creative Freedom Zone and Imitation Distance (0–4). Default target is 3–4.
8. Generate at least 5 meaningfully different ECG-specific ideas grounded in those references. For each include goal experience, reference IDs, borrowed principle, ECG translation, expected 3-second impression, implementation hint, risk, prototype cost, and current evidence level.
9. Do not modify waveform geometry, time axis, units, Reference/Difference semantics, or metric meaning for visual effect.
10. Do not reject unusual ideas during divergence unless they directly violate data integrity. Send candidates to a separate validator pass.
11. Use reference mining as a cheaper visual-alignment step before mockups. Shortlist only the strongest 2–4 candidates.
12. If the shortlisted candidates still need concrete side-by-side visual comparison and the environment can run Superdesign, route them through the project `superdesign-routing` workflow and `docs/uiux_system/14_SUPERDESIGN_GENERATION_LAYER.md`. Do not send all 8–10 ideas to the generator.
13. If Superdesign cannot run in the current environment, prepare the same draft brief for Work/Codex/Claude or use Figma/React light prototypes instead.
14. If a reference changes the project’s interpretation, workflow, or AI-collaboration method, update the appropriate F/D/R record instead of silently changing the final recommendation.
15. This skill is advisory. The project MASTER and current user instruction override it.
