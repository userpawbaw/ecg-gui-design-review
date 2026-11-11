#!/bin/bash
# $1 = out dir. Live tab, 1600x800, two wheel bursts; backdrop-only strip at the right edge is measured.
cd /home/user/ecg-gui-design-review
node scripts/qa/step-capture.cjs --url "http://127.0.0.1:5179/?route=lab&bgsoft=0&bgres=.5" --out $1 --size 1600x800 --frames 100 --warm 6000 \
 --click "실시간 측정@0" --action "wheel:2@30,wheel:2@36,wheel:-3@70" >/dev/null && node scripts/qa/frame-metrics.cjs $1 --region 1572,120,24,600
