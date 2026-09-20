# DUAL-ATTRACT-001 — Director B Direction Cards

- Mode: `NATIVE_DIRECTOR`
- Baseline SHA: `ecb5e7c63279035ee5eac866237731987e3e6c7e`
- Target: `prototype/v2` Attract screen
- Search actor: Superdesign CLI v0.14.0 prompt library, queried by Director B
- Draft model: not selected at card stage
- Card-stage generation cost: 0 drafts
- Shared constraints: preserve waveform geometry, shared time/axis, physical mV units, Input/Reference/selected Output/Difference meaning, replay/source labels, and the absence of a live device. Do not invent performance metrics.

## SD-DIR-B01 — Signal Orbit

- Query: `immersive data visualization`
- Source: `orbit-or-interactive-solar-system-explorer`
- Source URL: https://p.superdesign.dev/draft/1c2b23d2-0ac2-437e-97bf-70cc3e41aea3
- Why this direction: the prompt result explicitly combines immersive educational storytelling with high-end data visualization. That is a strong fit for an exhibition Attract moment without requiring invented metrics.
- ECG translation: turn the existing dark signal panel into the visual stage; use one oversized truthful waveform comparison as the focal object, restrained metadata rails, and a short typographic reveal. “Orbit” is a composition metaphor only—no planets or altered signal geometry.
- Expected feeling: cinematic, focused, immediately legible from a distance.
- Difference from current UI: removes the utility-dashboard feel around the viewer and makes the scientific comparison the dominant exhibit object.
- Difference from other B candidates: darkest and most spatially focused candidate; less typographic than B02 and less archival than B03.
- Hard risks: literal space motifs, glow, glass, or depth effects could reduce trace contrast or imply signal transformation.
- Estimated draft cost: 1 generation if kept.
- Prefilter: `KEEP`
- Draft: `81ee679a-b18b-45e2-a008-8a1e60e322e7`
- Preview: https://p.superdesign.dev/draft/81ee679a-b18b-45e2-a008-8a1e60e322e7

## SD-DIR-B02 — Exhibition Grid

- Query: `museum exhibition kiosk`
- Source: `saas-landing-page-for-developer-tool`
- Source URL: https://p.superdesign.dev/draft/a8f544ea-ba22-4214-ade4-4cbd56118443
- Why this direction: the returned prompt uses exhibition-poster composition and technical-document structure, giving a meaningfully different bright alternative to cinematic dashboards.
- ECG translation: use a strict editorial grid, a large Korean headline, one central same-axis waveform stage, and narrow vertical labels for REPLAY/source/time. Retain the project teal/amber palette instead of the source prompt’s cobalt.
- Expected feeling: bold, public-facing, graphic, confident.
- Difference from current UI: converts the Attract state from a large application dialog into an exhibition poster that still contains a truthful interactive comparison.
- Difference from other B candidates: brightest, flattest, and most typographic; no simulated depth.
- Hard risks: oversized type can steal space from the waveform; landing-page conventions may introduce unsupported marketing copy or extra calls to action.
- Estimated draft cost: 1 generation if kept.
- Prefilter: `KEEP`
- Draft: `be68bb43-6954-4064-9362-0777b158f391`
- Preview: https://p.superdesign.dev/draft/be68bb43-6954-4064-9362-0777b158f391

## SD-DIR-B03 — Archive Scan

- Query: `museum exhibition kiosk`
- Source: `brutalist-phylogenetic-map-redesign`
- Source URL: https://p.superdesign.dev/draft/97bdcd3a-2705-4821-9bee-fe4926d42c05
- Why this direction: the prompt is explicitly a scientific, museum-catalog interface with a strong technical system feel.
- ECG translation: present the waveform as a measured specimen with clear Input/Output/Reference registration, catalog labels, and a restrained scan-line transition that never touches waveform geometry.
- Expected feeling: rigorous, tactile, research-forward.
- Difference from current UI: replaces soft application cards with a hard-edged catalog composition.
- Difference from other B candidates: more archival and utilitarian than B02; less cinematic than B01/B05.
- Hard risks: monospace-heavy typography, hard shadows, dense labels, and scan effects conflict with the existing Korean font system and can compete with the plot grid.
- Estimated draft cost: 1 generation if kept.
- Prefilter: `REJECT`
- Draft/preview: none.

## SD-DIR-B04 — Signal Corridor

- Query: `museum exhibition kiosk`
- Source: `3d-journey-scroll-portfolio-centered`
- Source URL: https://p.superdesign.dev/draft/ffbd35dc-2bdb-4809-8094-5180f7754c02
- Why this direction: the source offers a spatial museum-journey metaphor that could make a strong first impression.
- ECG translation: a sequence of truthful labels and comparison states could approach the viewer along a depth axis before resolving into the flat same-axis plot.
- Expected feeling: dramatic, spatial, ceremonial.
- Difference from current UI: replaces the direct expanded viewer with a staged arrival sequence.
- Difference from other B candidates: only candidate based on simulated depth and journey progression.
- Hard risks: perspective, Z-axis motion, or staged waveform planes can visually distort time, amplitude, or trace alignment; the transition may delay understanding.
- Estimated draft cost: 1 generation if kept.
- Prefilter: `REJECT`
- Draft/preview: none.

## SD-DIR-B05 — Noir Pulse Reveal

- Query: `cinematic dark interface`
- Source: `cinematic-noir-style`
- Source URL: https://component-7121e835-54cd-4d01-98d8-95715596de25.preview.superdesign.dev/?projectId=a73b42e8-e7d4-4f03-9af3-c48202c9c063
- Why this direction: the result provides a direct cinematic language for a high-impact Attract state using dark surfaces, editorial hierarchy, and restrained warm light.
- ECG translation: retain the dark plot stage, add an off-plot radial focus and brief headline reveal, then settle into the real Input/Output/Reference comparison.
- Expected feeling: premium, dramatic, gallery-like.
- Difference from current UI: emphasizes atmosphere and timing over application chrome.
- Difference from other B candidates: shares the dark cinematic family with B01 but has less science/data-specific structure.
- Hard risks: grain, gradients, and dramatic type can become decorative noise; it risks producing a generic portfolio hero.
- Estimated draft cost: 1 generation if kept.
- Prefilter: `REJECT`
- Draft/preview: none.
