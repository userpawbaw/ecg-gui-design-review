---
name: ecg-ui-design
description: Apply the ECG Signal Studio project's UI/UX contracts whenever designing, reviewing, or modifying the ECG GUI, including attract mode, comparison, live/replay, waveform, difference, metrics, method explanation, and expo presentation flows.
---

Before significant UI work:
1. Read `docs/uiux_system/00_UIUX_MASTER.md`.
2. Read only the routed project documents for this task.
3. Preserve waveform/time/unit/reference/difference/data-scope integrity.
4. Preserve the Expo story: Attention → Choose → Compare → Inspect → Prove.
5. Treat GitHub docs as source of truth; do not rely on memory for exact values or approval state.
6. Distinguish idea, approval, implementation, and runtime verification.
7. Reuse existing architecture and components before inventing replacements.
8. Do not represent replay/demo/synthetic data as actual device measurement.
9. Record meaningful decisions with KEEP/TUNE/REJECT and evidence level.

Creative freedom:
- HIGH: attract/intro, context transitions, narrative reveal.
- MEDIUM: result summaries, method explanation, navigation.
- LOW: waveform inspection, axes, units, Reference, Difference, quantitative comparison.
