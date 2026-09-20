# Design QA — DUAL-ATTRACT-001 Attract vNext

**Source visual truth**

- V1: documented REF-A05 hierarchy at `verification/attract-vnext-variants-20260920/source-ref-a05-1920x1080.png`, interpreted through `A/A-report.md` A04 rather than copied literally.
- V2: frozen B01 at `verification/attract-vnext-variants-20260920/source-b01-1920x1080.png` and its structural contract in `B_FROZEN.md`.
- V3: frozen B02 at `verification/attract-vnext-variants-20260920/source-b02-1920x1080.png` plus `HYBRID-H1.md`.

**Rendered implementation**

- `question-1920x1080.png`
- `orbit-1920x1080.png`
- `exhibition-1920x1080.png`
- combined comparison: `verification/attract-vnext-variants-20260920/qa-comparison.png`

Viewport: 1920×1080 CSS px, DPR 1. Source and implementation captures are 1920×1080 PNGs; no density resampling was needed. State: archived D1 / mixed noise / 10 dB / M08 / Sweep / 10-second Attract loop / ±2 mV / Reference 0.55. The browser-rendered implementation was also checked in the Codex in-app browser.

**Findings**

- No actionable P0/P1/P2 mismatch remains.
- Typography: the final Question Poster has a single dominant question and one short subtitle; the tuned V2/V3 rail titles use deliberate two-line Korean phrases without mid-word fragmentation. Existing Malgun Gothic/Noto Sans KR/system fallbacks remain unchanged.
- Spacing and layout: all three keep the plot as the largest region. V1 uses a roughly 29/71 editorial split; V2 reduces the metadata rail to 240 px; V3 uses a 300 px left rail and a full-width bordered action row.
- Colors and tokens: Input amber, Output teal, Reference gray, and dark plot tokens remain unchanged. V2 applies its dark stage outside the plot; V3 uses a light exhibition shell without changing plot colors.
- Image/asset fidelity: no target image asset was replaced. These directions are layout systems around the existing Canvas plot; the small V2 orbit lines are non-data framing outside the plot and disappear under reduced motion.
- Copy/content: REPLAY, stored output, same-axis language and the common-FE Reference limitation remain visible. No metric, winner, live-device claim, or clinical truth claim was added.
- Interactions/accessibility: native buttons retain focus styling; each CTA reveals Lab controls. Reduced motion removes entrance transforms and the V2 orbit frame while preserving hierarchy. V3 retains scene/method/loop and continuous transport.

**Focused region comparison**

Separate crops were not needed because the original 1920×1080 captures keep the display headlines, metadata rail, axis labels, legend, CTA, and plot boundaries legible in the combined board. Those regions were inspected at original resolution in addition to the full comparison board.

**Comparison history**

1. Initial implementation pass: P2 typography drift — V2 and V3 Korean titles broke into overly narrow fragments in the left rails.
2. Fix: shortened the phrases, added `word-break: keep-all`, and reduced only the V2/V3 display sizes.
3. Post-fix evidence: final `orbit-1920x1080.png`, `exhibition-1920x1080.png`, and `qa-comparison.png`; no remaining P0/P1/P2 issue.

**Primary interactions tested**

- Attract entry for baseline and all variants.
- CTA exit/handoff for all variants.
- V3 explicit CTA without ancestor double-trigger.
- V3 transport/method/loop preservation and continued playback.
- reduced-motion render for every variant.
- existing Sweep/Scroll, freeze, method selection, keyboard Escape/focus return, export, Difference and evidence/legacy paths.

Console/page errors checked: zero. Playwright result: 5 passed, 1 ten-minute soak intentionally skipped. Browser-rendered evidence is present.

**Open Questions**

- Target-PC OS scaling, viewing-distance typography, physical touch, long-run frame pacing and the 600-second soak remain external verification items.
- Final winner selection is intentionally outside this pass.

**Implementation Checklist**

- [x] Query/config switch with baseline rollback.
- [x] Independent V1/V2/V3 compositions on one runtime.
- [x] Same-axis and Reference semantics preserved.
- [x] 1920×1080 and reduced-motion evidence.
- [x] CTA/handoff and console coverage.
- [x] Post-fix source/implementation comparison.

**Follow-up Polish**

- P3 only: revisit rail type size after the actual exhibition viewing-distance test; do not tune it from desktop screenshots alone.

final result: passed
