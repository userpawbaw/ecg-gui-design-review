"""Where the light in each zone comes from: per-light-group shares of linear luminance in an EXR written by
scripts/blender/archive_light_groups.py (2026-10-16, RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016 §3). Needs the OpenEXR module.
Zones: the shade zone (left third of the frame, REF-002's flat shade), the darkest 20 % and the brightest 20 % (the pool).
'other' = Combined − key − sun − sky (pendant/desk lamps and the visible lamp glass).
    python scripts/assets/light-group-shares.py a1.exr [a1_variant.exr ...]
"""
import sys
import numpy as np
import OpenEXR

W709 = np.array([0.2126, 0.7152, 0.0722])

def shares(path):
    ch = OpenEXR.File(path, separate_channels=True).channels()
    get = lambda n: np.stack([ch[f'ViewLayer.{n}.{c}'].pixels for c in 'RGB'], -1).astype(np.float64) @ W709
    comb = get('Combined'); parts = {k: get('Combined_' + k) for k in ('key', 'sun', 'sky')}
    parts['other'] = comb - sum(parts.values())
    h, w = comb.shape; x = np.arange(w)[None, :].repeat(h, 0)
    zones = {'shade zone (left third)': x < w / 3, 'darkest 20 %': comb <= np.percentile(comb, 20),
             'brightest 20 % (pool)': comb >= np.percentile(comb, 80)}
    print(path)
    for name, m in zones.items():
        tot = comb[m].sum()
        print(f'  {name:24s} sum share ' + ' '.join(f'{k} {100 * v[m].sum() / tot:5.1f} %' for k, v in parts.items())
              + f' | median lum {np.median(comb[m]):.4f}')
    d20, p20 = np.percentile(comb, 20), np.percentile(comb, 80)
    print(f'  luminance p20 {d20:.4f}  p80 {p20:.4f}  p80/p20 {p20 / d20:.1f} ({np.log2(p20 / d20):.2f} stops)')

for p in sys.argv[1:]:
    shares(p)
