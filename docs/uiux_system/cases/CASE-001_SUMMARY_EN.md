# CASE-001 — Building an AI-Assisted UI/UX Advisory System

> **Scope.** This is a methodology case, not a claim that the UI itself is already improved. The detailed Korean narrative is `CASE-001_UIUX_AI_ORCHESTRATION.md`; operational evidence lives in the F/D/O/R records.

## Context

The ECG Signal Studio already had a working v2.2.1 interface. The next problem was not basic functionality but **product polish for an Expo setting**: make the experience more memorable and visually engaging without compromising ECG readability or the credibility of research data.

The first round of tool exploration focused on replacing Motion AI Kit and making the edit→preview→feedback loop easier inside Chat. The user challenged that framing: those tools improved convenience, but the real capability gap was **creative direction** — generating bolder improvements for the whole interface — while a separate validator checked whether those ideas were still defensible in UX, data integrity, motion, and accessibility terms.

## Four important reframings

### 1. Separate creative divergence from validation

Instead of asking one agent to be "creative but never risky," the workflow now has two roles:

- **Creative UI Art Director** — deliberately generates unusual alternatives.
- **Validator** — applies project documents, design-taste, Product Design, motion rules, accessibility, and data integrity to classify ideas as KEEP / TUNE / REJECT.

This prevents safety constraints from collapsing ideation into generic dashboard patterns while keeping final authority conservative.

### 2. Evaluate high-motion design by surface, not by the strictest screen

The initial assessment treated Awwwards/high-motion design as a poor fit because ECG waveforms must remain interpretable. The user pointed out that an Expo product has surfaces with very different jobs: an attract screen and a Replay→Live transition are not the same task as reading P/T/Q/S morphology.

That produced **Creative Freedom Zones**:

- HIGH — attract/intro, context switches, narrative reveals
- MEDIUM — result summaries, explanation, navigation
- LOW — waveform inspection, axes, Reference/Difference, quantitative comparison

The lesson: do not reject a creative tool for the whole product based on the error cost of its most sensitive surface.

### 3. Reframe Flourish from chart maker to data-story exploration engine

The first assessment treated Flourish as a secondary visualization tool. The user reframed the question: in a research demo, the data is the product's core story. A tool that helps explore *which relationship* — ranking, trade-off, before/after, small multiples — explains the result fastest can be central even if its output is not embedded directly.

Flourish is therefore used to explore visual narratives; final implementation still has to obey the project's signal/data contracts.

### 4. Separate the design brain, durable memory, and execution environment

The operating model became:

```text
Chat       = design brain / critique / orchestration
GitHub     = durable source of truth for exact decisions and history
Work/Codex = build, browser automation, local tools, long-running execution
```

This avoids treating model memory as the canonical record while keeping design discussions conversational.

## A correction that changed the operating model

A repository-wide `execution_lock` had been introduced after an earlier misunderstanding about concurrent sessions. When a Work session hit a usage limit, the lock stayed active and blocked unrelated documentation work. The policy was removed and replaced with **resource-scoped conflict checks**: same file, same release/deployment target, same generated artifact, or same exclusive device only.

The reusable AI lesson is important: **a user's causal hypothesis should be verified before an agent turns it into a broad operating constraint.**

## System produced

```text
00_UIUX_MASTER.md
01 Creative Direction
02 Data Storytelling
03 Motion & Polish
04 Validation & Guardrails
05 Tool / Skill Routing
06 Chat↔Work/Codex Handoff
07 External Skill Provenance
08 Decision / Experiment Protocol
09 Capability Gap Audit
10 Record Keeping
11 Trigger Checklists

records/
  Findings / Decisions / Incidents / AI Collaboration Reviews

cases/
  methodology narratives such as this one

scripts/check-uiux-records.cjs
  machine enforcement of record structure and links
```

## What the user contributed

- Reframed execution convenience vs. actual design capability.
- Challenged the initial MotionDesign assessment with Expo-specific use cases.
- Reframed data visualization as research storytelling, not decoration.
- Revisited an over-broad concurrency mechanism when its assumptions proved wrong.
- Required not only final decisions but the **discussion process that produced them** to be preserved for future learning and career evidence.

## What the AI contributed

- Turned those challenges into reusable roles, zones, routing rules, and source-of-truth policies.
- Mapped Plugin/Skill capabilities to specific task classes instead of accumulating tools.
- Converted the earlier research project's record-keeping principles into a UI/UX-specific F/D/O/R + CASE system with machine checks.

## Reusable prompt/working patterns

1. Distinguish convenience problems from reasoning/capability gaps.
2. Challenge the criterion the AI used for its first recommendation.
3. Separate a bold proposer from a conservative validator.
4. Ask which product surface a style judgement actually applies to.
5. Treat data-story exploration as a design capability in research products.
6. Route tools by task and capability instead of invoking everything.
7. Put exact project decisions in Git, not only model memory.
8. Verify causal assumptions before turning them into operating policy.
9. Preserve rejected ideas and changed opinions, not just the final answer.
10. For career evidence, distinguish the user's problem framing from the agent's implementation contribution.

## Limitations

This case documents the **construction of the advisory workflow**, not yet a controlled before/after proof that the final UI improved. Several Plugins still need to demonstrate value on real ECG iterations, and the current Chat transcript has not been exported into a machine-verifiable appendix. Those limits should stay explicit in any portfolio use.
