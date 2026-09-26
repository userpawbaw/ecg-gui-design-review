#!/usr/bin/env python3
"""AI-video intake QA for the scroll-video pipeline (docs/uiux_system/22_AI_VIDEO_SCROLL_PIPELINE.md, D-023).

    python3 tools/video-qa/check_video.py <video> --brief <brief.json> --out <dir> [--frames-width 1600]

Measures what the brief asked for and what breaks scroll scrubbing, then writes:
  report.json     metrics + PASS/TUNE/FAIL per check
  feedback.md     plain-language regeneration feedback for the AI video tool (Korean)
  sheet.jpg       12 evenly spaced frames (D-019 frame rule)
  curves.png      per-frame motion, luminance and sharpness plots
  remap.json      scroll-progress -> frame table that makes equal scroll = equal visual motion
  frames/         (with --frames-width) WebP sequence for the scrub player
Automatic checks cannot see AI morphing, garbled text or wrong anatomy — the sheet is for human review.
"""
import argparse, json, math, os, sys
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--brief', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--frames-width', type=int, default=0); ap.add_argument('--first'); ap.add_argument('--last')
a = ap.parse_args()
brief = json.load(open(a.brief)); spec = brief['acceptance']
os.makedirs(a.out, exist_ok=True)

cap = cv2.VideoCapture(a.video)
fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
N = len(frames)
if N < 2: sys.exit('video has fewer than 2 frames')

sw = 320; sh = round(H * sw / W)
small = [cv2.cvtColor(cv2.resize(f, (sw, sh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY) for f in frames]
lum = np.array([s.mean() for s in small])
diff = np.array([np.abs(small[i + 1].astype(np.float32) - small[i]).mean() for i in range(N - 1)])
# exposure-invariant structural change (flicker must not read as a cut)
norm = [(x.astype(np.float32) - x.mean()) / (x.std() + 1e-6) for x in small]
sdiff = np.array([np.abs(norm[i + 1] - norm[i]).mean() for i in range(N - 1)])
sharp = np.array([cv2.Laplacian(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() for f in frames])

# Global motion per frame step: median Farneback flow (camera motion dominates the median).
flow = []
for i in range(N - 1):
    fl = cv2.calcOpticalFlowFarneback(small[i], small[i + 1], None, 0.5, 3, 21, 3, 5, 1.1, 0)
    flow.append((float(np.median(fl[..., 0])), float(np.median(fl[..., 1])), float(np.median(np.hypot(fl[..., 0], fl[..., 1])))))
flow = np.array(flow)
mag = flow[:, 2] * (W / sw)                       # px per frame at source resolution
dom = np.arctan2(np.median(flow[:, 1]), np.median(flow[:, 0]))
ang = np.arctan2(flow[:, 1], flow[:, 0])
moving = mag > 0.05 * max(np.median(mag), 1e-6)
consistent = float(np.mean(np.abs(np.angle(np.exp(1j * (ang[moving] - dom)))) < math.radians(45))) if moving.any() else 0.0

def smooth(x, k=9):
    k = min(k, len(x) // 2 * 2 - 1) if len(x) > 2 else 1
    return np.convolve(np.pad(x, k // 2, mode='edge'), np.ones(k) / k, mode='valid') if k > 1 else x

flicker = lum - smooth(lum)
med = float(np.median(diff)) or 1e-6
dups = [i + 1 for i, d in enumerate(diff) if d < 0.3]
smed = float(np.median(sdiff)) or 1e-6
cuts = [i + 1 for i, d in enumerate(sdiff) if d > spec.get('cut_ratio', 4.0) * smed and d > 0.15]
sharp_drops = [i for i in range(N) if sharp[i] < 0.5 * np.median(sharp)]
speed_cv = float(np.std(mag[moving]) / (np.mean(mag[moving]) or 1)) if moving.any() else 0.0

def ssim(x, y):
    x = cv2.resize(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), (256, round(256 * H / W))).astype(np.float64)
    y = cv2.resize(cv2.cvtColor(y, cv2.COLOR_BGR2GRAY), x.shape[::-1]).astype(np.float64)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    mx, my = cv2.GaussianBlur(x, (11, 11), 1.5), cv2.GaussianBlur(y, (11, 11), 1.5)
    vx, vy = cv2.GaussianBlur(x * x, (11, 11), 1.5) - mx * mx, cv2.GaussianBlur(y * y, (11, 11), 1.5) - my * my
    cxy = cv2.GaussianBlur(x * y, (11, 11), 1.5) - mx * my
    return float((((2 * mx * my + C1) * (2 * cxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2))).mean())

checks = []
def check(name, value, ok, tune, msg_fail, unit=''):
    v = 'PASS' if ok else ('TUNE' if tune else 'FAIL')
    checks.append({'check': name, 'value': value, 'unit': unit, 'verdict': v, 'feedback': None if ok else msg_fail})

check('resolution', f'{W}x{H}', W >= spec['min_width'] and H >= spec['min_height'], W >= spec['min_width'] * 0.66,
      f"해상도 {W}×{H} — 최소 {spec['min_width']}×{spec['min_height']}로 생성하거나, 업스케일(TUNE)로 보완 가능한지 확인")
check('aspect', round(W / H, 3), abs(W / H - spec['aspect']) < 0.02, False,
      f"화면비 {W / H:.3f} — 요청 {spec['aspect']:.3f} (overscan 포함 비율)로 다시 생성")
check('fps', round(fps, 2), fps >= spec['min_fps'], fps >= 20, f"{fps:.1f} fps — {spec['min_fps']} fps 이상으로 생성(보간으로 보완 가능, TUNE)", 'fps')
dur = N / fps
check('duration', round(dur, 2), spec['duration_s'][0] <= dur <= spec['duration_s'][1], dur >= spec['duration_s'][0] * 0.7,
      f"길이 {dur:.1f}s — 요청 {spec['duration_s'][0]}–{spec['duration_s'][1]}s", 's')
check('single_take (no cuts)', cuts, not cuts, False, f"프레임 {cuts}에서 장면 전환/점프 — 한 번도 끊기지 않는 단일 연속 카메라 이동으로 재생성")
check('duplicate_frames', len(dups), len(dups) <= spec.get('max_duplicates', 2), len(dups) <= N * 0.1,
      f"정지·중복 프레임 {len(dups)}장({dups[:8]}…) — 멈춤 없이 일정하게 움직이도록 요청")
check('motion_direction', round(consistent, 3), consistent >= spec['min_direction_consistency'], consistent >= 0.6,
      f"카메라 이동 방향 일관성 {consistent:.0%} — '{brief['camera']['move']}' 한 방향으로만, 되돌아가거나 흔들리지 않게")
check('motion_speed_cv', round(speed_cv, 3), speed_cv <= spec['max_speed_cv'], True,
      f"속도 변화(CV {speed_cv:.2f}) — 일정 속도 요청. 불균일하면 remap으로 보정(TUNE)")
check('luminance_flicker', round(float(np.abs(flicker).max()), 2), float(np.abs(flicker).max()) <= spec['max_flicker'], float(np.abs(flicker).max()) <= spec['max_flicker'] * 2,
      f"밝기 깜빡임 최대 {np.abs(flicker).max():.1f}/255 — 조명·노출 고정 요청", '/255')
check('sharpness_drops', len(sharp_drops), len(sharp_drops) <= N * 0.05, len(sharp_drops) <= N * 0.15,
      f"흐려지는 프레임 {len(sharp_drops)}장 — 모션 블러·초점 변화 없이 선명하게")
for key, path in (('first', a.first or brief.get('keyframes', {}).get('first')), ('last', a.last or brief.get('keyframes', {}).get('last'))):
    if path and os.path.exists(path):
        s = ssim(frames[0 if key == 'first' else -1], cv2.imread(path))
        check(f'{key}_frame_match', round(s, 3), s >= spec['min_keyframe_ssim'], s >= spec['min_keyframe_ssim'] * 0.8,
              f"{'첫' if key == 'first' else '마지막'} 프레임이 지정 키프레임과 다름(SSIM {s:.2f}) — 키프레임 이미지를 {'시작' if key == 'first' else '끝'} 프레임 조건으로 넣어 재생성")

# Motion-normalising remap: cumulative visual motion -> frame index, sampled at 256 progress steps.
cum = np.concatenate([[0], np.cumsum(np.maximum(mag, 1e-3))]); cum /= cum[-1]
remap = [float(np.interp(p, cum, np.arange(N))) for p in np.linspace(0, 1, 256)]
json.dump({'frames': N, 'fps': fps, 'progress_to_frame': remap}, open(os.path.join(a.out, 'remap.json'), 'w'))

# 12-frame sheet
idx = np.linspace(0, N - 1, 12).round().astype(int)
tw = 480; th = round(H * tw / W)
tiles = [cv2.putText(cv2.resize(frames[i], (tw, th)), f'#{i}', (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2) for i in idx]
sheet = np.vstack([np.hstack(tiles[r * 4:(r + 1) * 4]) for r in range(3)])
cv2.imwrite(os.path.join(a.out, 'sheet.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 82])

# curves plot (no matplotlib dependency)
pw, ph = 900, 150
def plot(series, color, label):
    img = np.full((ph, pw, 3), 255, np.uint8); s = np.asarray(series, float)
    lo, hi = float(s.min()), float(s.max()); hi = hi if hi > lo else lo + 1
    pts = np.stack([np.linspace(10, pw - 10, len(s)), ph - 20 - (s - lo) / (hi - lo) * (ph - 40)], 1).astype(np.int32)
    cv2.polylines(img, [pts], False, color, 2)
    cv2.putText(img, f'{label}  [{lo:.2f} .. {hi:.2f}]', (10, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (40, 40, 40), 1)
    return img
cv2.imwrite(os.path.join(a.out, 'curves.png'), np.vstack([plot(mag, (200, 120, 0), 'motion px/frame'), plot(lum, (0, 140, 0), 'mean luminance'),
            plot(flicker, (0, 0, 200), 'luminance flicker'), plot(sharp, (120, 0, 120), 'sharpness (Laplacian var)')]))

if a.frames_width:
    fd = os.path.join(a.out, 'frames'); os.makedirs(fd, exist_ok=True)
    fh = round(H * a.frames_width / W) // 2 * 2
    for i, f in enumerate(frames):
        cv2.imwrite(os.path.join(fd, f'f{i:04d}.webp'), cv2.resize(f, (a.frames_width, fh), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82])

overall = 'FAIL' if any(c['verdict'] == 'FAIL' for c in checks) else 'TUNE' if any(c['verdict'] == 'TUNE' for c in checks) else 'PASS'
report = {'video': os.path.basename(a.video), 'brief': brief.get('id'), 'overall': overall, 'size': [W, H], 'fps': fps, 'frames': N,
          'checks': checks, 'motion_px_per_frame': {'median': float(np.median(mag)), 'max': float(mag.max())},
          'human_review_required': brief.get('human_review', []),
          'note': 'Automatic checks do not detect AI morphing, garbled text/logos or anatomy errors — review sheet.jpg.'}
json.dump(report, open(os.path.join(a.out, 'report.json'), 'w'), indent=2, ensure_ascii=False)
with open(os.path.join(a.out, 'feedback.md'), 'w') as fb:
    fb.write(f"# 영상 피드백 — {report['video']} ({overall})\n\n")
    for c in checks:
        if c['feedback']: fb.write(f"- [{c['verdict']}] {c['feedback']}\n")
    fb.write('\n사람 확인 필요(자동 검사 불가):\n' + ''.join(f'- {x}\n' for x in brief.get('human_review', [])))
for c in checks: print(f"{c['verdict']:4}  {c['check']:24} {c['value']} {c['unit']}")
print('OVERALL', overall, '->', a.out)
