# DUAL-ATTRACT-001 — Attract vNext implementation result

Date: 2026-09-21
Branch: `feat/attract-vnext-variants-20260920`
Base application: `prototype/v2` v2.2.1
Status: **THREE PROTOTYPE VARIANTS IMPLEMENTED AND LOCALLY VERIFIED / WINNER NOT SELECTED / NOT MERGED**

## Implementation

The Attract presentation is selected by one query value while all variants reuse the same React state, `Transport`, loaded `Loaded` data, and `Plot` implementation.

- `?attractVariant=baseline` — v2.2.1 rollback path
- `?attractVariant=question` — V1 Question Poster
- `?attractVariant=orbit` — V2 Signal Orbit tuned
- `?attractVariant=exhibition` — V3 Exhibition Grid × Same-scene Handoff
- missing or unknown values resolve to `baseline`

`prototype/v2/src/attract-variants.ts` owns the small visual/copy configuration, query resolver, transport handoff rule, and deterministic waveform fingerprint. `main.tsx` renders one shared plot and only changes the Attract outer composition. `Plot.tsx` exposes non-mutating evidence attributes for browser equality checks.

V3 no longer relies on the ancestor any-pointer exit path. Its explicit CTA is excluded from the capture handler, and the V3 capture handler ignores unrelated pointer/key input. The CTA calls one handoff that leaves transport time, playback, selected method, and the active 10-second loop range intact. Baseline/V1/V2 retain the established loop-clear exit behavior.

## Preserved contracts

The implementation does not modify waveform samples, trace selection, canvas geometry calculations, time mapping, amplitude scale, Difference meaning, or Reference opacity/source. Each Attract screen states:

- Input and selected Output use the same time and ±mV axis;
- gray Reference is the common-FE comparison source;
- Reference is not described as clinical absolute truth;
- the content is stored `REPLAY`, not a live device session.

The v2.2.1 release ZIP/assets were not edited or regenerated.

## Browser evidence

All implementation and reduced-motion captures are 1920×1080 at DPR 1:

| Variant | Standard | Reduced motion |
|---|---|---|
| V1 Question Poster | `verification/attract-vnext-variants-20260920/question-1920x1080.png` | `question-reduced-motion-1920x1080.png` |
| V2 Signal Orbit tuned | `verification/attract-vnext-variants-20260920/orbit-1920x1080.png` | `orbit-reduced-motion-1920x1080.png` |
| V3 Exhibition Grid × Handoff | `verification/attract-vnext-variants-20260920/exhibition-1920x1080.png` | `exhibition-reduced-motion-1920x1080.png` |

The combined source/implementation review board is `verification/attract-vnext-variants-20260920/qa-comparison.png`. Frozen B01/B02 and REF-A05 captures are retained beside it for auditability.

## Equality and handoff evidence

`data-state-equality.json` records exact equality across baseline/V1/V2/V3 for:

- waveform fingerprint `d1-mixed-10:250:2500:M08:9bd838ca`;
- scene `d1-mixed-10`;
- selected method `M08`;
- 250 Hz / 2,500 samples;
- 10-second display span;
- ±2 mV amplitude;
- Reference opacity `0.55`.

`v3-handoff.json` records an M04 handoff with scene, selected method and loop `0–10` unchanged. Transport advanced from 0.417 s to 0.567 s during the click; it did not return to zero, pause, seek, or restart, and continued advancing after controls appeared.

## Verification results

- `npm run build` in `prototype/v2`: PASS (TypeScript + Vite).
- Targeted Attract/engine/axis unit tests: 15 PASS.
- `npm run qa`: 5 PASS, 1 intentional SKIP (`ECG_SOAK=1` ten-minute test).
- Variant Playwright coverage: 1920×1080 render, Attract entry, reduced motion, CTA handoff, console errors, baseline equality: PASS.
- Console/page errors across baseline and all three variants: zero.
- Existing large viewer, Sweep/Scroll, hover/freeze/keyboard/download, Difference/physical-axis, archive/evidence/legacy Playwright coverage: PASS.
- Root `npm test`: PASS, including 98-scene data checks, 26 DOM checks, 34 UI/UX records and 26 record fixtures.
- `npm run records:check`: PASS (34 records).
- In-app browser manual V3 entry and CTA→controls reveal: PASS.

The prototype's full chunk unit test and the actual ten-minute soak require the ignored 600-second replay package. This checkout contains the reviewed 98-scene 10-second archive used for the variant comparison; no missing replay data was synthesized.

## Design QA

The first render exposed P2 title wrapping in the narrow V2/V3 rails. The final pass shortened the two display lines and added Korean word-preserving wrapping, then recaptured all evidence. No actionable P0/P1/P2 issue remains in the 1920×1080 comparison. The detailed report is `design-qa.md`.

Observed but intentionally unresolved external checks:

- Windows target-display scaling, actual exhibition viewing distance, physical touch and target Hangul fallback;
- 600-second data and ten-minute wall-clock soak;
- target-PC frame pacing and long unattended operation.

No winner is selected. No production release or merge was performed.
