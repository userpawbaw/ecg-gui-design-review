# Routes

## Framework routing

This Vite + React snapshot has no React Router configuration. `baseline/index.html` mounts the single React entry at `src/main.tsx`; the application switches views with the local `route` state.

| URL | Entry | View state | Layout |
|---|---|---|---|
| `/` (and static build base `./`) | `src/main.tsx` | `lab` (default) | App header + main + footer |
| `/` | `src/main.tsx` | `evidence` | Same shell; EXP-A evidence table in main |
| `/` | `src/main.tsx` | `legacy` | Same shell; legacy analysis iframe in main |

Attract is not a separate URL. `startAttract()` keeps the current lab scene, opens the large dialog, hides controls by CSS, sets a 10-second loop, 10-second sweep span, speed 1, and displays the replay CTA.

## Entrypoint source

```html
<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>Signal Studio · 연속 파형 비교</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
```
