---
name: motion-review
description: Review or propose motion, transitions, sweep effects, glow, fade, reveal, hover, and micro-interactions for ECG Signal Studio while protecting signal legibility, data integrity, reduced-motion behavior, and runtime performance.
---

For each motion idea:
1. State the user benefit. If it only decorates, say so.
2. Identify the Creative Freedom Zone.
3. Check overlap/crossover ambiguity and small waveform morphology visibility.
4. Check play/pause/wrap/pin/zoom/state consistency.
5. Check reduced-motion behavior.
6. Prefer bounded, interruptible motion; avoid permanent attention capture.
7. Prefer transform/opacity for UI motion; flag continuous blur/layout work.
8. For Canvas motion, require real runtime/performance evidence before declaring smoothness.
9. Use the project Motion Scorecard in `docs/uiux_system/03_MOTION_AND_POLISH.md`.
10. A data-integrity critical failure overrides any aesthetic score.

Never morph between ECG waveforms in a way that creates a non-existent intermediate signal.
