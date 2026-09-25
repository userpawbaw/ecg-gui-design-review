# Attract vNext — Beta visual QA

Final result: **PASS for the 1920×1080 prototype comparison**, with the deliberate source/data differences below. This is a headless Chromium design review, not a claim about a physical display or clinical use.

## Sources and actual browser evidence

- Directly opened the two attached 1672×941 Beta A/B images before implementation. Compared their layout, visual hierarchy, negative space, palette, waveform treatment and lower-stage density with the scene/component plan in `Attract-vNext-feasibility.md`.
- Browser captures: `verification/attract-vnext/A-1920x1080.png` and `B-1920x1080.png`; Chromium at CSS viewport 1920×1080, DPR 1. The runtime recording is `A-B-Compare-runtime.webm`; timed transitions, console, motion and RAF intervals are in `runtime-results.json`.
- Early browser passes exposed a white Lab header bleeding into Attract and missing Korean glyphs. Scoped the shell and bundled a Korean font. The next pass revealed A's small trace and B's hard-edged placeholder landscape; increased the plot amplitude display, used a dark mountain asset and faded its top/right edges. A further pass exposed B label/card overlap and plot/heading overlap; repositioned the B regions and recaptured.

## Source comparison and intentional differences

| Surface | Beta image | Implemented browser view / reason |
|---|---|---|
| A proportions and hierarchy | Narrow editorial left rail; broad plot to right; giant two-line serif title, small badges and footer | Same overall proportions, title hierarchy, header and broad plot. Header actions are the actual Lab/A/B actions rather than decorative navigation. |
| A waveform and field | Tall cyan neon ECG over dense, dramatic cyan particle cloud and noisy trace | Solid three-pass cyan glow reuses one actual selected-output path; low-opacity actual noisy input appears underneath. Particles derive deterministically from input/output divergence near the real trace. The source's much denser, free-floating cloud was reduced to preserve data meaning and measured frame cadence. |
| B composition and palette | Dark blue editorial left rail and mountains below; rounded right stage with purple noisy trace, mint output, miniatures and facts | Browser view keeps this contrast, region proportions, mountainous lower-left and three real-data miniatures. Background contours and texture are simpler than the generated image; source's visual density remains higher. |
| B dividing line | Center glowing disc implies a before/after transformation | `CompareLensBoundary` clips two traces calculated at identical absolute sample indices and x/y scale. The handle has a comparison-lens label; it never claims processing time or latency. |
| B lower cards | Invented pipeline stages, metric and numerical SNR | Cards are real input/reference/output from the same sample range. Facts state record/replay and comparison semantics. No fabricated metric, live BPM or denoising computation timing. |
| Typography and details | Highly polished decorative glyphs, pill icons and complex curved overlays | Korean local font, display serif and copy hierarchy retained. Pills, mini traces, glow and lens remain simpler Canvas 2D/CSS prototype elements. |

## Browser QA result

- **P0/P1/P2 actionable layout mismatch:** none in final 1920×1080 captures. B heading, plot and lower cards do not overlap; landscape edges fade into the rail.
- Browser console/page errors: none. B lens keyboard step works. B→Compare preserves scene/method and advances the same running clock; A→B preserves scene/method. A Enter Lab performs ~1 second accelerated playback before handoff; reduced motion enters paused and bypasses acceleration.
- The source's false live and fabricated data labels were consciously replaced; B-first implementation order does not choose a winning concept. Hardware, touch and other viewport sizes remain outside this screenshot verdict.
