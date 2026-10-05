"""Side-by-side: the user's own hand video at the same normalised close times as the fist renders (D-052).

Usage: python compare-sheet.py <video> <hand_angles.json> <render_dir> <out.jpg> [t_cross]
Picks the palm-view close whose grip crossing is nearest t_cross (default 27.9 s), uses the same window as
fist_profile_v1.json (grip core 5–95 % widened 30 % each side) and crops the hand by its landmarks. The video stays out of the repo;
the sheet holds small crops only.
"""
import json, sys
import cv2, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import median_filter

video, angles, rdir, out = sys.argv[1:5]; tc = float(sys.argv[5]) if len(sys.argv) > 5 else 27.9
D = json.load(open(angles)); F = D['frames']; fps = D['fps']; t = np.array([f['t'] for f in F])
fing = ['index', 'middle', 'ring', 'pinky']
A = {f: median_filter(np.array([x[f] for x in F]), size=(5, 1)) for f in fing}
g = np.mean([A[f][:, 1] for f in fing], 0)
m = (t > tc - 1.2) & (t < tc + 1.2); idx = np.where(m)[0]
lo, hi = np.percentile(g[idx], 5), np.percentile(g[idx], 95); s = g[idx] > (lo + hi) / 2
c = [k for k in np.where(np.diff(s.astype(int)) != 0)[0] if s[k + 1]]
i0 = idx[min(c, key=lambda k: abs(t[idx[k]] - tc))]
w = np.arange(i0 - 50, i0 + 50)
allc = np.mean([np.clip((A[f][w, j] - np.median(A[f][w[:10], j])) / (np.median(A[f][w[-10:], j]) - np.median(A[f][w[:10], j]) + 1e-6), 0, 1)
                for f in fing for j in range(3)], 0)
k0, k1 = np.argmax(allc > .05), np.argmax(allc > .95); L = k1 - k0
ka, kb = max(0, k0 - int(.3 * L)), min(len(w) - 1, k1 + int(.3 * L))
STEPS = (0, .25, .4, .55, .7, 1.0)
cap = cv2.VideoCapture(video); W, H = D['size']; S = 260
sheet = Image.new('RGB', (S * len(STEPS), S * 3 + 24), 'white'); dr = ImageDraw.Draw(sheet)
pts = np.array([F[w[k]]['img'] for k in range(ka, kb + 1)]).reshape(-1, 2) * [W, H]
x0, y0 = pts.min(0) - 60; x1, y1 = pts.max(0) + 60; side = max(x1 - x0, y1 - y0); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
for col, sv in enumerate(STEPS):
    fi = int(w[ka + round(sv * (kb - ka))]); cap.set(cv2.CAP_PROP_POS_FRAMES, fi); ok, img = cap.read()
    crop = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))).resize((S, S))
    sheet.paste(crop, (col * S, 24))
    for r, v in enumerate(('palm', '34')):
        sheet.paste(Image.open(f'{rdir}/fist_{v}_{int(sv * 100):03d}.png').convert('RGB').resize((S, S)), (col * S, 24 + S * (r + 1)))
    dr.text((col * S + 6, 5), f's={sv:.2f}  video t={t[fi]:.2f}s', fill='black')
sheet.save(out, quality=85)
print('close at', round(t[i0], 2), 's; window', round(t[w[ka]], 2), '-', round(t[w[kb]], 2), 's')
