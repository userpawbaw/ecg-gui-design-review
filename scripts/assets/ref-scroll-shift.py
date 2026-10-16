"""Vertical image shift of chosen regions between two frames of a reference recording (2026-10-16, analysis
rounds/R1/ANALYSIS-R1-REF002-SPACE-LIGHT-20261016 §9 V0). Normalised cross-correlation over a dy search range, after an optional
uniform horizontal correction (pointer yaw). The recording itself stays in the session scratch folder — never in the repo.

    python scripts/assets/ref-scroll-shift.py A.png B.png --dx 15 --range -520,-250 "wall|560,740,1400,1880" "ladder|560,740,250,650"
Region = y0,y1,x0,x1 in frame A. Prints dy (pixels B relative to A) and the correlation. Divide by the scroll difference (HUD
scrollY) for px per scroll px; equal rates for two regions mean equal depth.
"""
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
dx = 0; rng = (-400, 400)
if '--dx' in args:
    i = args.index('--dx'); dx = int(args[i + 1]); del args[i:i + 2]
if '--range' in args:
    i = args.index('--range'); rng = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]
a = np.asarray(Image.open(args[0]).convert('L')).astype(float)
b = np.roll(np.asarray(Image.open(args[1]).convert('L')).astype(float), dx, axis=1)
for spec in args[2:]:
    name, box = spec.split('|'); y0, y1, x0, x1 = (int(v) for v in box.split(','))
    pa = a[y0:y1, x0:x1]; pa = (pa - pa.mean()) / (pa.std() + 1e-9); best = (None, -2)
    for dy in range(rng[0], rng[1] + 1):
        if y0 + dy < 0 or y1 + dy > b.shape[0]: continue
        pb = b[y0 + dy:y1 + dy, x0:x1]; pb = (pb - pb.mean()) / (pb.std() + 1e-9); s = float((pa * pb).mean())
        if s > best[1]: best = (dy, s)
    print(f'{name}: dy {best[0]} px, ncc {best[1]:.2f}')
