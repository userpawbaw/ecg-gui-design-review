# Signal Studio Attract — Generation Design System

## Product and target

Signal Studio is an ECG denoising comparison experience for undergraduate exhibition visitors. This generation round targets only the expanded Attract state inside the existing React/Vite `prototype/v2` UI. It is a design exploration, not production implementation.

The Attract state starts from the current Lab scene and shows a 10-second stored `REPLAY` loop. It uses the same input, shared time, shared axis, and selected output as the direct comparison view. The primary visitor job is to notice that the same ECG changes under noise removal, then choose to continue into direct comparison at the same scene and time.

## Non-negotiable scientific contracts

- Preserve waveform geometry. Decorative effects must never change, morph, smooth, mask, perspectively distort, or redraw the ECG traces.
- Preserve shared time and same-axis comparison. Never offset traces to imply a different time window.
- Preserve physical `mV` units and truthful time labels.
- Preserve the meanings and colors of Input, Reference, selected Output, optional pinned comparison, and optional Difference (`Output − Reference`).
- Keep `REPLAY` and source/provenance labeling visible. Do not imply a live device or connected hardware.
- Do not invent performance metrics, winner claims, patient facts, alerts, diagnoses, or treatment language.
- The CTA returns to direct comparison at the same scene/time. It is not a purchase or signup action.

## Existing information architecture

- Attract is an expanded large viewer, not a separate route.
- Required visible content: a clear Attract headline, scene/source metadata, the truthful same-axis waveform comparison, semantic legend, `REPLAY` status, and one direct-comparison CTA.
- Utility controls, condition drawer, transport controls, method rail, metric panel, and timeline map are hidden in Attract.
- The waveform comparison is the dominant content and must remain readable at exhibition distance.

## Typography

- Use only `'Malgun Gothic', 'Noto Sans KR', system-ui, sans-serif`.
- Canvas labels remain `system-ui`.
- Existing hierarchy reference: eyebrow 10px / 750 / 2px tracking; body 12–14px; standard h2 20–24px; current Attract h2 30px.
- A direction may scale headings for composition, but Korean text must remain legible and must not crowd the waveform.
- Do not introduce Cabinet Grotesk, Satoshi, General Sans, Aileron, serif, decorative, or remote web fonts.

## Color and signal semantics

- Page/canvas: `#f4f5f4`.
- Foreground: `#172c37`; white panels; border `#d9e2df`.
- Brand/action: teal `#067d72`, dark green `#174235`, focus amber `#ce873a` / ring `#bd712e`.
- Signal panel: `#112b39`; grid `#304955`.
- Input: `#ffbc79`.
- Selected Output: `#67e7c3`.
- Reference: `#c4c6c7`.
- Pinned comparison: `#97c2ff`.
- Preview: `#f6d18d`.
- Use only these colors and their transparent variants. Do not introduce space orange, cobalt blue, neon purple, red/green success coding, or gradients that recolor the data.

## Shape, spacing, and layout

- Existing radii: global 8px, cards 12px, signal panel 14px, large dialog 16px.
- Existing spacing rhythm: compact gaps 5–15px; cards 18–22px; main 36px.
- Existing large dialog: approximately 98vw × 98dvh, with the waveform occupying the dominant area.
- Directional exploration may change composition, grid, hierarchy, and surrounding frame. It must not shrink the plot into a decorative thumbnail.
- Direction B01 may use a dark stage and metadata rail, but all atmospheric effects stay outside the plot drawing area.
- Direction B02 may use a strict exhibition grid and flatter borders, but it must translate the source prompt into the existing palette and font system.

## Motion

- Motion supports arrival, focus, and handoff only. Prefer restrained opacity/translate reveals around the plot.
- Do not animate waveform geometry, apply 3D tilt to the plot, parallax the traces, or place perspective transforms on axes.
- No pulsing indicator may imply live acquisition.
- `prefers-reduced-motion: reduce` must remove nonessential animation and transitions.

## Accessibility and interaction

- Maintain clear focus visibility with the existing amber focus ring.
- CTA target remains at least 44px high; current Attract CTA is 64px minimum.
- Do not depend on hover to understand the Attract screen.
- Maintain strong text and trace contrast against their backgrounds.
- Keep visible copy concise enough for a Korean exhibition audience at a glance.

## Generation fidelity rule

Use only the fonts, colors, spacing vocabulary, signal semantics, and component behavior defined here and in the supplied source files. Native prompt-library sources provide composition inspiration only; their literal palettes, fonts, objects, marketing sections, social proof, pricing, decorative planets, and unsupported metrics must not be copied.
