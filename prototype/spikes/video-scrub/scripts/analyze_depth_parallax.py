#!/usr/bin/env python3
"""Why does depth parallax stair-step / tear on the ladder and books? (user report 2026-09-27, F-022)
Compares a true sideways head move (render) with warps of the centre frame driven by:
  depth: true | estimated (raw) | estimated (raw, stored at 640×360 like the old standins) | estimated + refine_depth
  sampling: single (what the shader did: read depth at the destination) | iterative (fixed-point, 6 steps)
Estimated depth is relative, so its shift is affine-fitted to the true shift first — this isolates edge/shape
quality from scale. Metrics: MAE on the whole frame and in the depth-edge band (where tearing happens).
    python3 scripts/analyze_depth_parallax.py <probe_dir> <est_depth.png> <refined_depth.png> <out_dir>"""
import sys, os, json, math
import numpy as np, cv2
probe, est_p, ref_p, out = sys.argv[1:5]; os.makedirs(out, exist_ok=True)
rot0 = cv2.imread(os.path.join(probe, 'rot0.png')); truth = cv2.imread(os.path.join(probe, 'trR.png')); TX = 0.12
H, W = rot0.shape[:2]; f = (H / 2) / math.tan(math.radians(27 / 2))
t = cv2.imread(os.path.join(probe, 'depth.png')).astype(np.float64); z = (t[..., 2] + t[..., 1] / 255) / 255 * 12
true_shift = f * TX / np.maximum(z, 0.05)                                   # px, content moves left by this
def fit_shift(d):
    d = d.astype(np.float64) / 255; A = np.stack([d.ravel(), np.ones(d.size)], 1)
    c, *_ = np.linalg.lstsq(A, true_shift.ravel(), rcond=None); return (A @ c).reshape(H, W)
est = cv2.imread(est_p, 0); ref = cv2.imread(ref_p, 0)
low = cv2.resize(cv2.resize(est, (640, 360), interpolation=cv2.INTER_AREA), (W, H), interpolation=cv2.INTER_LINEAR)
shifts = {'true': true_shift, 'est_raw': fit_shift(est), 'est_640': fit_shift(low), 'est_refined': fit_shift(ref)}
xs, ys = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
def warp(s, iterative):
    if not iterative:                                                        # shader before: depth read at the destination
        return cv2.remap(rot0, xs + s.astype(np.float32), ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    src = xs.copy()
    for _ in range(6):                                                       # find the source pixel whose own shift lands here
        si = cv2.remap(s.astype(np.float32), src, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        src = xs + si
    return cv2.remap(rot0, src, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
edge = cv2.dilate((cv2.Canny(cv2.normalize(1 / np.maximum(z, 0.05), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8), 20, 60) > 0).astype(np.uint8), np.ones((9, 9))) > 0
inner = np.zeros((H, W), bool); inner[40:-40, 80:-80] = True
mae = lambda a, m: round(float(np.abs(a.astype(np.float64) - truth.astype(np.float64)).mean(axis=2)[m].mean()), 2)
res, imgs = {'static': {'all': mae(rot0, inner), 'edge_band': mae(rot0, inner & edge)}}, {}
for k, s in shifts.items():
    for it in (False, True):
        o = warp(s, it); name = f'{k}_{"iter" if it else "single"}'; imgs[name] = o
        res[name] = {'all': mae(o, inner), 'edge_band': mae(o, inner & edge)}
json.dump(res, open(os.path.join(out, 'depth_parallax.json'), 'w', encoding='utf-8'), indent=1)
for k, v in res.items(): print(f'{k:22} all {v["all"]:6}  edge {v["edge_band"]:6}')
crop = lambda im: cv2.resize(im[140:560, 0:560], (420, 315))
tiles = [('truth (moved 0.12)', truth), ('est 640 single (old)', imgs['est_640_single']), ('est raw single', imgs['est_raw_single']),
         ('est refined iter (new)', imgs['est_refined_iter']), ('true depth single', imgs['true_single']), ('true depth iter', imgs['true_iter'])]
th = [cv2.putText(crop(x), n, (6, 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (255, 255, 255), 2) for n, x in tiles]
cv2.imwrite(os.path.join(out, 'depth_parallax_compare.jpg'), np.vstack([np.hstack(th[:3]), np.hstack(th[3:])]), [cv2.IMWRITE_JPEG_QUALITY, 85])
d3 = [cv2.putText(cv2.resize(cv2.applyColorMap(x, cv2.COLORMAP_VIRIDIS)[140:560, 0:560], (420, 315)), n, (6, 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (255, 255, 255), 2)
      for n, x in [('est 640 (old standins)', low), ('est raw full-res', est), ('est refined', ref)]]
cv2.imwrite(os.path.join(out, 'depth_maps_compare.jpg'), np.hstack(d3), [cv2.IMWRITE_JPEG_QUALITY, 85])
