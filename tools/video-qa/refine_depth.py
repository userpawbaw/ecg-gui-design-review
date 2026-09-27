#!/usr/bin/env python3
"""REJECTED 2026-09-27 (F-022) — kept only to reproduce the evidence. Guided-filter refinement printed book stripes into
the depth and haloed the ladder (edge-band error 5.15 vs 5.03 unrefined); the real fix was iterative sampling in the shader.
Original intent: refine estimated depth maps before using them for 2.5D parallax (22 §12).
    python3 tools/video-qa/refine_depth.py <frames_dir> <depth_dir> <out_dir> [--radius 8] [--eps 1e-3] [--grow 2]
1) upsample the depth to the colour frame's full size (never store it smaller — 640×360 depth made stair-step edges),
2) edge-aware guided filter with the colour frame as guide (He et al.) so depth edges snap to colour edges,
3) grow near (bright) regions by --grow px so thin foreground (ladder rungs, book spines) keeps its own depth
   at the rim instead of borrowing the background's. Output: 8-bit PNG, near = bright, same names as the frames."""
import argparse, glob, os
import numpy as np, cv2
ap = argparse.ArgumentParser(); ap.add_argument('frames'); ap.add_argument('depth'); ap.add_argument('out')
ap.add_argument('--radius', type=int, default=8); ap.add_argument('--eps', type=float, default=1e-3); ap.add_argument('--grow', type=int, default=2)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
box = lambda x, r: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
def guided(I, p, r, eps):
    mI, mp = box(I, r), box(p, r); cov = box(I * p, r) - mI * mp; var = box(I * I, r) - mI * mI
    A = cov / (var + eps); B = mp - A * mI
    return box(A, r) * I + box(B, r)
frames = sorted(glob.glob(os.path.join(a.frames, '*.png')) + glob.glob(os.path.join(a.frames, '*.webp')))
n = 0
for f in frames:
    name = os.path.splitext(os.path.basename(f))[0]
    dp = os.path.join(a.depth, name + '.png')
    if not os.path.exists(dp): continue
    img = cv2.imread(f); h, w = img.shape[:2]
    I = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    d = cv2.resize(cv2.imread(dp, 0), (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    d = guided(I, d, a.radius, a.eps)
    if a.grow > 0: d = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * a.grow + 1, 2 * a.grow + 1)))
    cv2.imwrite(os.path.join(a.out, name + '.png'), np.clip(d * 255, 0, 255).astype(np.uint8)); n += 1
print(f'refined {n} depth maps → {a.out}')
