#!/usr/bin/env python3
"""Raise a clip's frame count by motion-compensated interpolation (ffmpeg minterpolate), for clips that fail the
intake QA check motion_per_frame and cannot be regenerated (22_AI_VIDEO_SCROLL_PIPELINE.md, F-021).
    python3 tools/video-qa/interpolate_frames.py <in.mp4> <out.mp4> --factor 5
Second-best to regenerating longer/higher-fps: interpolation invents in-between frames and smears thin objects that
cross each other (ladder rungs over books). Compare the result's 12-frame sheet before using it."""
import argparse, shutil, subprocess, sys
import cv2
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst'); ap.add_argument('--factor', type=float, default=4.0)
ap.add_argument('--crf', type=int, default=16)
a = ap.parse_args()
ff = shutil.which('ffmpeg')
if not ff:
    try:
        import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError: sys.exit('ffmpeg not found (install ffmpeg or pip install imageio-ffmpeg)')
cap = cv2.VideoCapture(a.src); fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); cap.release()
target = fps * a.factor
subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', a.src,
                '-vf', f'minterpolate=fps={target}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1',
                '-c:v', 'libx264', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', a.dst], check=True)
m = int(cv2.VideoCapture(a.dst).get(cv2.CAP_PROP_FRAME_COUNT))
print(f'{a.src}: {n} frames @ {fps:g} fps → {a.dst}: {m} frames @ {target:g} fps')
