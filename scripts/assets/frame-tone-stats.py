"""Tone / light / colour statistics of a frame, for comparing our renders with a reference frame on the same scale
(2026-10-09 archive art review, docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-ART-20261009.md §3).
  L5..L95      CIE L* percentiles: how deep the darks and how high the lights go (fog lifts L5, a flat grade caps L95)
  lit%         share of the frame at L* > 70: how much surface receives direct light
  edge         99th percentile of the L* gradient: how crisp the light/shadow boundaries are
  warm_lit     mean R-B (0..1) of the brightest 15 %: colour of the light (cream ~ .05-.13, orange > .2)
  pastel%      bright, lightly saturated pixels (V > .55, .08 < S < .45)
  deep%        saturated mid tones (V > .35, S > .6)
Edge width (added 2026-10-09, user: "경계가 뚜렷한 부분은 확실하게 뚜렷하고, 번지는 부분은 충분히 번지는" — the old `edge` is one
number at native resolution, dominated by book-spine texture, and frames of different widths are not comparable). The frame is
resized to 720 px high; every light/shadow edge is found and its width measured by scale selection (Lindeberg, γ = 1/2: the
Gaussian scale σ* where σ^½·|∇L| peaks equals the blur of the edge), at the ridge only (non-maximum suppression along the gradient),
with its contrast C = |∇L_σ*|·σ*·√(2π) (exact for a blurred step). Edges with C ≥ 6 L* count.
  spread       L* 90th − 10th percentile: how far apart the lit and the shadowed areas are
  sharp‰       per-mille of pixels on a crisp edge (σ* ≤ 2 px, 10–90 % width ≲ 5 px)
  sharpC       median contrast of those crisp edges (L*): how decisive the crisp edges are
  soft_area%   area covered by soft edges (σ* ≥ 8 px, width ≳ 20 px), each ridge pixel counted with its width 2.5 σ*
  softC        median contrast of the soft edges (L*): a soft area with no contrast is just flat
  crisp20‰     per-mille of pixels on crisp edges with C ≥ 20: the decisive edges (book-spine texture is mostly C < 20)
  plain_range  L* 90th − 10th percentile on plain surfaces only (local fine-texture energy < 2 L*): how far light travels from
               bright to dark across walls, cabinet fronts, empty cells. Separated REF-002 (49–55) from our r3 (21) when the edge
               metrics did not (soft area was similar) — a gradient on a plain surface reads, one on book spines does not.
Self-test (synthetic step / 40 px ramp / 120 px ramp): python scripts/assets/frame-tone-stats.py --selftest
Map (red = crisp edges, blue = soft areas over a grey frame): add --map out.png (one input frame)
Run: python scripts/assets/frame-tone-stats.py <frame.png> [...]  [--box x0,y0,x1,y1]  (box crops browser chrome)
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter

args = sys.argv[1:]; box = None; map_out = None
if '--box' in args:
    i = args.index('--box'); box = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]
if '--map' in args:
    i = args.index('--map'); map_out = args[i + 1]; del args[i:i + 2]
SIG = [2 ** (k / 2) for k in range(11)]                                  # 1 .. 32 px at 720 px frame height
CMIN = 6.0


def lstar(im):
    a = np.asarray(im).astype(float) / 255
    lin = np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)
    return 116 * np.cbrt(lin @ [.2126, .7152, .0722]) - 16


def edge_width(L):
    """Per pixel: ridge (bool), contrast C (L*), selected scale σ* (px). See the docstring."""
    G, GX, GY = [], [], []
    for s_ in SIG:
        gy, gx = np.gradient(gaussian_filter(L, s_)); G.append(np.hypot(gx, gy)); GX.append(gx); GY.append(gy)
    G = np.stack(G); k = np.argmax(G * np.sqrt(np.array(SIG))[:, None, None], 0); ii, jj = np.indices(L.shape)
    g = G[k, ii, jj]; gx = np.stack(GX)[k, ii, jj]; gy = np.stack(GY)[k, ii, jj]; sel = np.array(SIG)[k]
    dx = np.rint(gx / np.maximum(g, 1e-9)).astype(int); dy = np.rint(gy / np.maximum(g, 1e-9)).astype(int)
    H, W = L.shape
    ridge = (g >= G[k, np.clip(ii + dy, 0, H - 1), np.clip(jj + dx, 0, W - 1)]) & (g >= G[k, np.clip(ii - dy, 0, H - 1), np.clip(jj - dx, 0, W - 1)])
    return ridge, g * np.sqrt(2 * np.pi) * sel, sel


def width_stats(L):
    ridge, C, sel = edge_width(L); e = ridge & (C >= CMIN); N = L.size
    sharp, soft = e & (sel <= 2), e & (sel >= 8)
    med = lambda m: round(float(np.median(C[m])), 1) if m.any() else 0.0
    tex = np.sqrt(gaussian_filter((L - gaussian_filter(L, 3)) ** 2, 6)); plain = L[tex < 2.0]
    return {'spread': round(float(np.percentile(L, 90) - np.percentile(L, 10)), 1), 'sharp‰': round(sharp.sum() / N * 1000, 1), 'sharpC': med(sharp),
            'crisp20‰': round((sharp & (C >= 20)).sum() / N * 1000, 1), 'soft_area%': round(float((2.5 * sel * soft).sum()) / N * 100, 1), 'softC': med(soft),
            'plain_range': round(float(np.percentile(plain, 90) - np.percentile(plain, 10)), 1) if plain.size > 100 else 0.0}, (sharp, soft, sel)


def edge_map(L, masks, path):
    sharp, soft, sel = masks; area = np.zeros(L.shape, bool)
    for s_ in SIG[6:]:                                                    # paint each soft ridge pixel over its width
        area |= maximum_filter(soft & (sel == s_), size=max(3, int(2.5 * s_)))
    g = np.clip(L / 100, 0, 1) * .55 + .2; rgb = np.stack([g, g, g], -1)
    rgb[area] = rgb[area] * .45 + np.array([.25, .45, 1.]) * .55; rgb[maximum_filter(sharp, 2)] = (1, .2, .15)
    Image.fromarray((rgb * 255).astype(np.uint8)).save(path)


if '--selftest' in args:                                                  # widths must come out as built
    x = np.arange(1280); ok = True
    for name, prof, want in (('step', np.where(x < 640, 30., 80.), 'sharp'), ('ramp40', np.clip(30 + 50 * (x - 620) / 40, 30, 80), 'soft'),
                             ('ramp120', np.clip(30 + 50 * (x - 580) / 120, 30, 80), 'soft')):
        st, _ = width_stats(np.tile(prof, (720, 1))); got = 'sharp' if st['sharp‰'] > 0 and st['soft_area%'] == 0 else 'soft' if st['soft_area%'] > 0 and st['sharp‰'] == 0 else 'mixed'
        ok &= got == want; print(f'  {name:8s} {got:6s} (want {want})', st)
    print('selftest', 'PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)


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
    w, masks = width_stats(lstar(im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)))
    if map_out: edge_map(lstar(im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)), masks, map_out)
    return {'L5/25/50/75/95': ' '.join(f'{x:.0f}' for x in p), 'lit%': round((L > 70).mean() * 100, 1),
            'edge': round(float(np.percentile(np.hypot(gx, gy), 99)), 1), 'warm_lit': round(float((a[lit][:, 0] - a[lit][:, 2]).mean()), 3),
            'pastel%': round(float(((V > .55) & (S > .08) & (S < .45)).mean() * 100), 1), 'deep%': round(float(((V > .35) & (S > .6)).mean() * 100), 1), **w}


for f in args:
    print(f, stats(f))
