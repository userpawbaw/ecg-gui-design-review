# Extractable components

## Layout components

No standalone reusable layout component exists in this snapshot. The header, route body, footer, large dialog, viewer heading, signal panel, and CTA are composed inline inside `App` in `src/main.tsx`; extracting them would require production refactoring and is outside this design-only experiment.

## Button
- Source: `src/components/ui/button.tsx`
- Category: basic
- Description: shadcn-style button primitive with visual and size variants.
- Extractable props: `variant`, `size`, `disabled`, `aria-pressed`
- Hardcoded: class-variance-authority variant class strings and default sizes.

## Dialog
- Source: `src/components/ui/dialog.tsx`
- Category: basic
- Description: Radix Dialog wrappers used for the large viewer and provenance modal.
- Extractable props: `open`, `onOpenChange`
- Hardcoded: overlay behavior, centered content layout, close icon, focus/state classes.

## Plot
- Source: `src/Plot.tsx`
- Category: basic
- Description: Canvas-rendered same-axis ECG comparison with Input, selected Output, Reference, optional comparison, and optional Output − Reference difference.
- Extractable props: none for a static Superdesign component; its meaningful state depends on typed arrays, transport timing, and canvas drawing.
- Hardcoded: scientific labels, physical mV tick logic, colors, trace widths, grid, and time semantics.
- Decision: do not extract for this experiment. Pass source context so the draft preserves the truthful visualization contract instead of replacing it with a decorative component.
