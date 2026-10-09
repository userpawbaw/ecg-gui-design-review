"""Tone / light / colour statistics of a frame, for comparing our renders with a reference frame on the same scale
(2026-10-09 archive art review, docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-ART-20261009.md §3).
  L5..L95      CIE L* percentiles: how deep the darks and how high the lights go (fog lifts L5, a flat grade caps L95)
  lit%         share of the frame at L* > 70: how much surface receives direct light
  edge         99th percentile of the L* gradient: how crisp the light/shadow boundaries are
  warm_lit     mean R-B (0..1) of the brightest 15 %: colour of the light (cream ~ .05-.13, orange > .2)
  pastel%      bright, lightly saturated pixels (V > .55, .08 < S < .45)
  deep%        saturated mid tones (V > .35, S > .6)
Run: python scripts/assets/frame-tone-stats.py <frame.png> [...]  [--box x0,y0,x1,y1]  (box crops browser chrome)
"""
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]; box = None
if '--box' in args:
    i = args.index('--box'); box = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]


def stats(path):
    im = Image.open(path).convert('RGB')
    if box: im = im.crop(box)
    a = np.asarray(im).astype(float) / 255
    lin = np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)
    L = 116 * np.cbrt(lin @ [.2126, .7152, .0722]) - 16
    hsv = np.asarray(im.convert('HSV')).astype(float) / 255; S, V = hsv[..., 1], hsv[..., 2]
    gy, gx = np.gradient(L)
    lit = L > np.percentile(L, 85)
    p = [np.percentile(L, q) for q in (5, 25, 50, 75, 95)]
    return {'L5/25/50/75/95': ' '.join(f'{x:.0f}' for x in p), 'lit%': round((L > 70).mean() * 100, 1),
            'edge': round(float(np.percentile(np.hypot(gx, gy), 99)), 1), 'warm_lit': round(float((a[lit][:, 0] - a[lit][:, 2]).mean()), 3),
            'pastel%': round(float(((V > .55) & (S > .08) & (S < .45)).mean() * 100), 1), 'deep%': round(float(((V > .35) & (S > .6)).mean() * 100), 1)}


for f in args:
    print(f, stats(f))
