---
name: lookdev-loop
description: Run the self-critique look-dev loop for 3D/shader/lighting/post-processing work (book modelling, lighting rig, paper, page turn, waveform glow, heart, pulse FX). Use when an ECG zone effect needs higher visual fidelity than a first implementation gives, or the user says the modelling/lighting/effects detail is weak.
---

Read `docs/uiux_system/26_LOOKDEV_REVIEW_LOOP.md` first; it is the contract (rubric §2, standard shots §3, per-discipline practice sheets §4, asset research §5).

1. S0: pick the practice-sheet lines that apply and write the round's pass lines. S1: asset research via `24_ASSET_RESEARCH_STAGE.md` and `scripts/assets/explore.mjs` / `fetch.mjs --pin`; look at previews before choosing; register everything (`assets/registry.json`), including "reference only" items.
2. S2: change one bundle per round. S3: capture the fixed standard shots (same size, time and beat phase; include light-off and post-off comparison shots). S4: score every rubric item 0–3 with a sentence on what is wrong and why. S5: for each item below 2, write cause hypothesis → fix → expected gain, ordered by impact. S6: implement only the top items and go back to S3.
3. Stop when all required items are ≥ 2 and the frame budget passes, or after 3 rounds. Report remaining weaknesses honestly; never claim a score the captures do not support.
4. Record each round in `docs/uiux_system/rounds/<R>/LOOKDEV-<topic>.md` (before/after paths, score table, hypotheses, what actually improved, what did not). Do not delete failed fixes; mark them.
5. Data contracts win over looks: never draw a clean signal over noise, never present demo values as measured results, keep waveform/time/unit rules. Perf rule: no per-frame CPU canvas redraws; verify with `window.__bench`.

Scores are AI self-assessment, not a substitute for the user's visual check.
