#!/usr/bin/env python3
"""Estimate a per-frame depth map for an already-made video (monocular depth estimation), for 2.5D parallax
in the scroll player (22_AI_VIDEO_SCROLL_PIPELINE.md §5.2). Model: Depth Anything V2 Small (Apache-2.0).
Run inside a separate venv (torch + transformers) so the system numpy pin for bpy is not touched:
    <venv>/bin/python tools/video-qa/estimate_depth.py <frames_dir> <out_dir> [--true <true_depth_dir>] [--every 1] [--smooth 7]
Output: out_dir/fNNNN.png (8-bit, near = bright, same layout the player reads) + depth_report.json.
--true: our renders' true depth (R = hi byte, G = lo byte of view depth / 12) → accuracy after an affine fit
on disparity (the model gives relative inverse depth, so scale/shift are unknown by design)."""
import argparse, glob, json, os, time
import numpy as np, cv2, torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ap = argparse.ArgumentParser(); ap.add_argument('frames'); ap.add_argument('out'); ap.add_argument('--true'); ap.add_argument('--every', type=int, default=1)
ap.add_argument('--smooth', type=int, default=0, help='temporal window (frames) for a centred moving average — single-image models flicker frame to frame')
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
name = 'depth-anything/Depth-Anything-V2-Small-hf'
proc = AutoImageProcessor.from_pretrained(name); model = AutoModelForDepthEstimation.from_pretrained(name).eval()
files = sorted(glob.glob(os.path.join(a.frames, '*.png')) + glob.glob(os.path.join(a.frames, '*.webp')))[::a.every]
disp_all, rows, t0 = [], [], time.time()
for f in files:
    img = Image.open(f).convert('RGB')
    with torch.no_grad():
        pred = model(**proc(images=img, return_tensors='pt')).predicted_depth
    d = torch.nn.functional.interpolate(pred[:, None], size=img.size[::-1], mode='bicubic', align_corners=False)[0, 0].numpy()
    disp_all.append(d)
if a.smooth > 1:                                           # temporal smoothing: static parts stop wobbling; fast motion blurs depth edges
    st = np.stack(disp_all); k = a.smooth // 2
    disp_all = [st[max(0, i - k):i + k + 1].mean(0) for i in range(len(st))]
lo, hi = np.percentile(np.stack(disp_all), [1, 99])          # one normalisation for the whole clip → no per-frame pumping
for f, d in zip(files, disp_all):
    v = np.clip((d - lo) / (hi - lo), 0, 1)
    cv2.imwrite(os.path.join(a.out, os.path.basename(f).rsplit('.', 1)[0] + '.png'), (v * 255).astype(np.uint8))
    if a.true:
        tf = os.path.join(a.true, os.path.basename(f).rsplit('.', 1)[0] + '.png')
        if os.path.exists(tf):
            t = cv2.imread(tf).astype(np.float64)
            z = (t[..., 2] + t[..., 1] / 255.0) / 255.0 * 12.0            # BGR: R = hi, G = lo
            m = z > 0.05; tdisp = np.where(m, 1.0 / np.maximum(z, 1e-3), 0)
            A = np.stack([d[m], np.ones(m.sum())], 1); coef, *_ = np.linalg.lstsq(A, tdisp[m], rcond=None)
            fit = A @ coef; r = float(np.corrcoef(fit, tdisp[m])[0, 1])
            rel = float(np.median(np.abs(1 / np.maximum(fit, 1e-3) - z[m]) / z[m]))
            # depth edges: fraction of true depth edges that the estimate also has within 2 px
            te = cv2.Canny(cv2.normalize(tdisp, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8), 30, 90) > 0
            ee = cv2.dilate((cv2.Canny((v * 255).astype(np.uint8), 30, 90) > 0).astype(np.uint8), np.ones((5, 5))) > 0
            rows.append({'frame': os.path.basename(f), 'disp_corr': round(r, 4), 'median_rel_depth_err': round(rel, 4), 'edge_recall_2px': round(float((te & ee).sum() / max(te.sum(), 1)), 4)})
seq = np.stack([np.clip((d - lo) / (hi - lo), 0, 1) for d in disp_all])
flicker = float(np.median(np.abs(np.diff(seq, axis=0)))) if len(seq) > 1 else 0.0
rep = {'model': name, 'smooth': a.smooth, 'frames': len(files), 'seconds_per_frame_cpu': round((time.time() - t0) / max(len(files), 1), 2),
       'temporal_change_median': round(flicker, 4), 'vs_true': rows,
       'summary': {k: round(float(np.mean([r[k] for r in rows])), 4) for k in ('disp_corr', 'median_rel_depth_err', 'edge_recall_2px')} if rows else None}
json.dump(rep, open(os.path.join(a.out, 'depth_report.json'), 'w'), indent=2)
print(json.dumps({k: v for k, v in rep.items() if k != 'vs_true'}, indent=1))
