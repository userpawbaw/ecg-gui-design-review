#!/usr/bin/env python3
"""Import a video into the scrub player: run the intake QA (tools/video-qa/check_video.py) with frame export,
then write public/clips/<name>/manifest.json. The player refuses clips whose QA is FAIL unless --allow-fail.
    python3 scripts/import_clip.py <video> <name> --brief <brief.json> [--width 1280] [--synthetic-depth] [--allow-fail]
--synthetic-depth writes a vertical-gradient depth map (bottom = near) ONLY to exercise the depth-parallax code
path; a real clip needs an estimated depth map (e.g. Depth Anything V2, offline) — not verified in this spike."""
import argparse, json, os, subprocess, sys
import numpy as np, cv2
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.abspath(os.path.join(here, '../../../..'))
ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('name'); ap.add_argument('--brief', required=True)
ap.add_argument('--width', type=int, default=1280); ap.add_argument('--synthetic-depth', action='store_true'); ap.add_argument('--allow-fail', action='store_true')
ap.add_argument('--variant-l'); ap.add_argument('--variant-r'); ap.add_argument('--variant-offset', default='')   # head-offset variant videos (same length)
ap.add_argument('--depth-dir'); ap.add_argument('--depth-source', default='')                                   # per-frame depth PNGs (near = bright)
a = ap.parse_args()
out = os.path.join(here, '..', 'public', 'clips', a.name)
subprocess.run([sys.executable, os.path.join(root, 'tools/video-qa/check_video.py'), a.video, '--brief', a.brief, '--out', out, '--frames-width', str(a.width)], check=True)
rep = json.load(open(os.path.join(out, 'report.json'))); remap = json.load(open(os.path.join(out, 'remap.json')))
if rep['overall'] == 'FAIL' and not a.allow_fail: sys.exit(f"QA FAIL — see {out}/feedback.md (use --allow-fail only for tests)")
f0 = cv2.imread(os.path.join(out, 'frames', 'f0000.webp')); h, w = f0.shape[:2]
depth = None; depth_pattern = None; variants = {}
def export_frames(video, sub):
    cap = cv2.VideoCapture(video); d = os.path.join(out, sub); os.makedirs(d, exist_ok=True); i = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        cv2.imwrite(os.path.join(d, f'f{i:04d}.webp'), cv2.resize(fr, (w, h), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82]); i += 1
    if i != remap['frames']: sys.exit(f'{video}: {i} frames, main clip has {remap["frames"]}')
    return f'{sub}/f{{i}}.webp'
for k, v in (('l', a.variant_l), ('r', a.variant_r)):
    if v: variants[k] = {'pattern': export_frames(v, f'frames_{k}')}
if variants: variants['offset'] = a.variant_offset
if a.depth_dir:
    dd = os.path.join(out, 'depth'); os.makedirs(dd, exist_ok=True)
    src = sorted(f for f in os.listdir(a.depth_dir) if f.endswith('.png'))
    if len(src) != remap['frames']: sys.exit(f'depth: {len(src)} maps for {remap["frames"]} frames')
    for i, f in enumerate(src): cv2.imwrite(os.path.join(dd, f'f{i:04d}.png'), cv2.resize(cv2.imread(os.path.join(a.depth_dir, f), 0), (w, h)))
    depth_pattern = 'depth/f{i}.png'
if a.synthetic_depth:
    g = np.tile(np.linspace(40, 255, h, dtype=np.float32)[:, None], (1, w)).astype(np.uint8)
    cv2.imwrite(os.path.join(out, 'depth.png'), g); depth = 'depth.png'
json.dump({'name': a.name, 'frames': remap['frames'], 'fps': remap['fps'], 'size': [w, h], 'pattern': 'frames/f{i}.webp', 'pad': 4,
           'remap': remap['progress_to_frame'], 'depth': depth, 'depth_is_synthetic': bool(depth), 'qa': rep['overall'],
           'depth_pattern': depth_pattern, 'depth_source': a.depth_source, 'variants': variants or None, 'loopable': rep.get('loopable', False),
           'brief': rep['brief']}, open(os.path.join(out, 'manifest.json'), 'w'))
print('imported', a.name, remap['frames'], 'frames', f'{w}x{h}', 'QA', rep['overall'])
