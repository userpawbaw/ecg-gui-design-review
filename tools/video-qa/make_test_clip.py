#!/usr/bin/env python3
"""Make a defect-injected 'AI-like' clip from a clean clip to prove check_video.py catches problems.
Injects: ease-in-out retiming (uneven speed), a luminance flicker, frozen frames and a jump cut.
    python3 tools/video-qa/make_test_clip.py <clean.mp4> <out.mp4> [--only-ease]"""
import sys, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
only_ease = "--only-ease" in sys.argv   # uneven speed only (for the remap test)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(f)
N = len(fr); H, W = fr[0].shape[:2]
t = np.linspace(0, 1, N); ease = (1 - np.cos(np.pi * t)) / 2          # slow-fast-slow camera
idx = (ease * (N - 1)).round().astype(int)
seq = [fr[i].copy() for i in idx]
for k in ([] if only_ease else range(100, 106)): seq[k] = seq[99].copy()                         # frozen frames
for k in ([] if only_ease else range(150, 154)): seq[k] = cv2.convertScaleAbs(seq[k], alpha=1.12, beta=6)   # exposure flicker
if not only_ease: seq[200:] = [cv2.flip(f, 1) for f in seq[200:]]                          # jump cut (mirrored shot)
vw = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*'mp4v'), fps, (W, H))
for f in seq: vw.write(f)
vw.release(); print('wrote', out, len(seq), 'frames')
