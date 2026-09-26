#!/usr/bin/env python3
"""Head-turn test (D-023 follow-up): can a flat video reproduce REF-002's pointer 'head turn'?
Compares true renders from the attic spike (our own scene) with emulations built from the centre frame only.
    python3 scripts/analyze_head_turn.py <probe_dir> <out_dir>
probe_dir: rot0, rotR (+0.75° yaw), wide (FOV ×1.1 = overscan source), trR (+0.12 sideways), trR2 (+0.3), depth (true)."""
import sys, os, json, math
import numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
L = lambda n: cv2.imread(os.path.join(src, n + '.png'))
rot0, rotR, wide, trR, trR2 = L('rot0'), L('rotR'), L('wide'), L('trR'), L('trR2')
Hh, Ww = rot0.shape[:2]
FOV = 27.0; f = (Hh / 2) / math.tan(math.radians(FOV / 2))            # focal length in px (vertical FOV 27°)
dt = cv2.imread(os.path.join(src, 'depth.png')).astype(np.float64); z = (dt[..., 2] + dt[..., 1] / 255) / 255 * 12

def ssim(a, b, mask=None):
    a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float64); b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY).astype(np.float64)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2; g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    ma, mb = g(a), g(b); va, vb, cab = g(a * a) - ma * ma, g(b * b) - mb * mb, g(a * b) - ma * mb
    s = ((2 * ma * mb + C1) * (2 * cab + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
    return float(s[mask].mean() if mask is not None else s.mean())

inner = np.zeros((Hh, Ww), bool); inner[40:-40, 60:-60] = True               # ignore the extreme border
blur = lambda x: cv2.GaussianBlur(x, (0, 0), 2)                              # structure only (resampling / screen-space dither removed)
mae = lambda a, b, m=inner: round(float(np.abs(a.astype(np.float64) - b.astype(np.float64)).mean(axis=2)[m].mean()), 2)
def score(a, b, m=inner): return {'ssim': round(ssim(a, b, m), 4), 'ssim_blur2': round(ssim(blur(a), blur(b), m), 4), 'mae': mae(a, b, m)}
res = {'focal_px': round(f, 1)}
# --- 1) pure rotation (REF-002: ±0.75° yaw) --------------------------------------------------------------
shift = f * math.tan(math.radians(0.75)); res['rotation_shift_px'] = round(shift, 1)
# three.js: yaw +0.75° turns the camera LEFT → content moves right → sample the overscan source shift px to the left
# overscan source: the wide frame, rescaled so its centre matches rot0's scale, then shifted by the yaw
s = math.tan(math.radians(FOV * 1.1 / 2)) / math.tan(math.radians(FOV / 2))
k = 1 / s                                                                     # wide px per centre px (wide focal = f / s)
M = np.float32([[k, 0, (1 - k) * Ww / 2 - shift * k], [0, k, (1 - k) * Hh / 2]])   # dst(x) = wide(M·x)
emu_rot = cv2.warpAffine(wide, M, (Ww, Hh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
edge = np.zeros((Hh, Ww), bool); edge[40:-40, :int(shift) + 4] = True           # the strip that appears on the turn side (left)
res['rotation'] = {'static_vs_true': score(rot0, rotR), 'overscan_shift_vs_true': score(emu_rot, rotR),
                   'revealed_edge_static': score(rot0, rotR, edge), 'revealed_edge_overscan': score(emu_rot, rotR, edge)}
# --- 2) sideways head translation (true parallax) -------------------------------------------------------
def best_shift(a, b):
    best = (-1, 0)
    for dx in range(-240, 241, 4):
        m = np.float32([[1, 0, dx], [0, 1, 0]]); w = cv2.warpAffine(a, m, (Ww, Hh), borderMode=cv2.BORDER_REPLICATE)
        sc = ssim(w, b, inner); best = max(best, (sc, dx))
    return best
def depth_warp(img, zmap, tx):
    # camera moves +tx (scene units) to the right → a point at depth z moves left by f·tx/z px (backward warp with source depth)
    disp = f * tx / np.maximum(zmap, 0.05)
    xs, ys = np.meshgrid(np.arange(Ww, dtype=np.float32), np.arange(Hh, dtype=np.float32))
    return cv2.remap(img, xs + disp.astype(np.float32), ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
for name, img, tx in (('translate_0.12', trR, 0.12), ('translate_0.30', trR2, 0.30)):
    sc, dx = best_shift(rot0, img)
    dw = depth_warp(rot0, z, tx)
    sw = cv2.warpAffine(rot0, np.float32([[1, 0, dx], [0, 1, 0]]), (Ww, Hh), borderMode=cv2.BORDER_REPLICATE)
    res[name] = {'static_vs_true': score(rot0, img), 'best_2d_shift_vs_true': score(sw, img), 'best_shift_px': dx,
                 'true_depth_warp_vs_true': score(dw, img)}
    cv2.imwrite(os.path.join(out, f'{name}_depthwarp.png'), dw)
cv2.imwrite(os.path.join(out, 'rotation_overscan_emulation.png'), emu_rot)
# difference images (amplified) for the report
def diff(a, b): return cv2.applyColorMap(np.clip(cv2.absdiff(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)) * 4, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
tiles = [('true yaw +0.75', rotR), ('overscan shift (emulated)', emu_rot), ('|diff| x4', diff(emu_rot, rotR)),
         ('true move +0.30', trR2), ('2D shift of centre', cv2.warpAffine(rot0, np.float32([[1, 0, res['translate_0.30']['best_shift_px']], [0, 1, 0]]), (Ww, Hh), borderMode=cv2.BORDER_REPLICATE)),
         ('depth warp (true depth)', depth_warp(rot0, z, 0.30))]
th = [cv2.putText(cv2.resize(t, (480, 270)), n, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (255, 255, 255), 2) for n, t in tiles]
cv2.imwrite(os.path.join(out, 'head_turn_compare.jpg'), np.vstack([np.hstack(th[:3]), np.hstack(th[3:])]), [cv2.IMWRITE_JPEG_QUALITY, 85])
json.dump(res, open(os.path.join(out, 'head_turn.json'), 'w'), indent=1); print(json.dumps(res, indent=1))
