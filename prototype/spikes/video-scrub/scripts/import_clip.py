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
a = ap.parse_args()
out = os.path.join(here, '..', 'public', 'clips', a.name)
subprocess.run([sys.executable, os.path.join(root, 'tools/video-qa/check_video.py'), a.video, '--brief', a.brief, '--out', out, '--frames-width', str(a.width)], check=True)
rep = json.load(open(os.path.join(out, 'report.json'))); remap = json.load(open(os.path.join(out, 'remap.json')))
if rep['overall'] == 'FAIL' and not a.allow_fail: sys.exit(f"QA FAIL — see {out}/feedback.md (use --allow-fail only for tests)")
f0 = cv2.imread(os.path.join(out, 'frames', 'f0000.webp')); h, w = f0.shape[:2]
depth = None
if a.synthetic_depth:
    g = np.tile(np.linspace(40, 255, h, dtype=np.float32)[:, None], (1, w)).astype(np.uint8)
    cv2.imwrite(os.path.join(out, 'depth.png'), g); depth = 'depth.png'
json.dump({'name': a.name, 'frames': remap['frames'], 'fps': remap['fps'], 'size': [w, h], 'pattern': 'frames/f{i}.webp', 'pad': 4,
           'remap': remap['progress_to_frame'], 'depth': depth, 'depth_is_synthetic': bool(depth), 'qa': rep['overall'],
           'brief': rep['brief']}, open(os.path.join(out, 'manifest.json'), 'w'))
print('imported', a.name, remap['frames'], 'frames', f'{w}x{h}', 'QA', rep['overall'])
