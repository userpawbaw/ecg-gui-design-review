# Page dependency trees

## `/` — Lab / Attract target

Entry: `src/main.tsx`

Dependencies:
- `src/main.tsx`
  - `src/components/ui/dialog.tsx`
    - `src/lib/utils.ts`
  - `src/components/ui/button.tsx`
    - `src/lib/utils.ts`
  - `src/methods.json`
  - `src/engine.ts`
  - `src/data.ts`
    - `src/engine.ts`
  - `src/Plot.tsx`
    - `src/engine.ts`
    - `src/plot-scale.ts`
    - `src/data.ts` (types)
  - `src/style.css`

Actual Attract render branch: `startAttract()` in `src/main.tsx` establishes the replay state; `content` renders the large `.viewer.expanded.attract` dialog; `plot` renders the canvas and semantic legend; `.attract` rules in `src/style.css` hide interactive controls and show `.attract-cta`.

## `/` — Evidence view

Entry: `src/main.tsx` with `route === 'evidence'`

Dependencies are the same shared entry graph. The view renders an existing experiment evidence table; it is outside the Attract redesign target.

## `/` — Legacy view

Entry: `src/main.tsx` with `route === 'legacy'`

Dependencies are the same shared entry graph. The view embeds `./legacy/index.html`; that file is not present in this isolated baseline snapshot and is outside the Attract target.
