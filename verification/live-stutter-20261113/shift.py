"""Per-frame horizontal shift of a scrolling waveform in a screen recording (60 fps).
For consecutive frames, the integer shift s (px, content moving left) that minimises the mean absolute difference
between frame[t][:, :-s] and frame[t-1][:, s:] inside a crop. Prints one line per frame and a summary.
python -I shift.py <video> <x0> <y0> <w> <h> [start_s] [dur_s] [maxshift]"""
import subprocess, sys
import numpy as np
v, x0, y0, w, h = sys.argv[1], *map(int, sys.argv[2:6])
ss = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
dur = float(sys.argv[7]) if len(sys.argv) > 7 else 5.0
M = int(sys.argv[8]) if len(sys.argv) > 8 else 40
cmd = ['ffmpeg', '-v', 'error', '-ss', str(ss), '-t', str(dur), '-i', v, '-fps_mode', 'passthrough', '-vf', f'crop={w}:{h}:{x0}:{y0},format=gray', '-f', 'rawvideo', '-']
raw = subprocess.run(cmd, capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
pts = [float(x) for x in subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.split()]
pts = np.array([p for p in pts if p >= ss - 1e-6][:len(F)])
out = []
for t in range(1, len(F)):
    a, b = F[t - 1], F[t]
    if np.abs(a - b).mean() < 0.15: out.append(0); continue
    best, bs = 1e9, 0
    for s in range(0, M + 1):
        d = np.abs(b[:, :w - s] - a[:, s:]).mean()
        if d < best: best, bs = d, s
    out.append(bs)
out = np.array(out)
dt = np.diff(pts[:len(out) + 1]) if len(pts) > len(out) else np.full(len(out), 1 / 60)
print('frames', len(F), 'shift@dt(ms):', ' '.join(f'{s}@{d*1000:.0f}' for s, d in zip(out, dt)))
vel = out / np.maximum(dt, 1e-3)
print('speed px/s: mean %.0f  (shift sum %d over %.2f s)' % (out.sum() / dt.sum(), out.sum(), dt.sum()))
# windows of 100 ms: displacement per window (smooth motion = constant)
t = np.cumsum(dt); bins = np.floor(t / 0.1).astype(int); disp = np.bincount(bins, weights=out)
print('px per 100 ms:', ' '.join(str(int(x)) for x in disp))
nz = out[out > 0]
print('moving frames %d/%d  mean %.2f px/frame  median %d  max %d  frames>=2x median: %d' % (len(nz), len(out), out.mean(), np.median(nz) if len(nz) else 0, out.max(), int((out >= 2 * max(1, np.median(nz) if len(nz) else 1)).sum())))
