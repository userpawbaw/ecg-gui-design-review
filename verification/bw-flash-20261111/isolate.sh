#!/bin/bash
# Baseline-wander hold (camera still, t 4.5 → 6 s, 90 frames at 60 fps), once per switch-off set; flashes counted in the book-cart area.
# bash isolate.sh <scratch dir>   (dev server 127.0.0.1:5179)
cd "$(dirname "$0")/../.."
# SETS overrides the runs, e.g. SETS="none spike0" (spike0 = ?spike=0, the neighbourhood clamp off)
for off in ${SETS:-none jitter dust fog bloom}; do
 q=""; [ "$off" = spike0 ] && q="&spike=0"; [ "$off" != none ] && [ "$off" != spike0 ] && q="&qaoff=$off"
 node scripts/qa/step-capture.cjs --url "http://127.0.0.1:5179/?story=noise&cond=bw&t=0$q" --out "$1/$off" --size 960x540 --frames 90 --warm 8000 \
  --perframe "window.__noise&&window.__noise.set({t:4.5+i/60})" >/dev/null
 echo "== $off"; node scripts/qa/frame-metrics.cjs "$1/$off" --region 300,20,200,320 | head -1
done
