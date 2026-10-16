"""Sweep light-group weights and exposure over archive light-group EXRs and measure each mix with frame-tone-stats
(rounds/R1/RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016 §6 S1/S2). One bpy process: mix -> AgX look -> PNG -> stats, in seconds.

    python scripts/assets/light-group-sweep.py OUTDIR "key=1,1.2 sun=1,2 sky=1 rest=1 expo=0.15,0.35" A1.exr [A2.exr]
Writes OUTDIR/sweep.tsv (one row per weight set and frame) and keeps the PNGs. Weights scale a light's whole contribution.
"""
import importlib.util, itertools, os, sys
import numpy as np
import OpenEXR
import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
out_dir, grid_s, exrs = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(out_dir, exist_ok=True)
grid = {k: [float(x) for x in v.split(',')] for k, v in (p.split('=') for p in grid_s.split())}
for k, d in (('key', 1), ('sun', 1), ('sky', 1), ('rest', 1), ('expo', 0.15)):
    grid.setdefault(k, [d])
argv0 = sys.argv; sys.argv = [argv0[0]]                       # frame-tone-stats parses argv at import
spec = importlib.util.spec_from_file_location('fts', os.path.join(ROOT, 'scripts/assets/frame-tone-stats.py'))
fts = importlib.util.module_from_spec(spec); spec.loader.exec_module(fts); sys.argv = argv0

def load(path):
    ch = OpenEXR.File(path, separate_channels=True).channels()
    pre = next(n[:-len('Combined.R')].rstrip('.') for n in ch if n.endswith('Combined.R'))
    get = lambda layer: np.stack([ch[f'{pre}.{layer}.{c}' if pre else f'{layer}.{c}'].pixels for c in 'RGB'], -1).astype(np.float64)
    comb = get('Combined'); parts = {k: get(k) for k in ('key', 'sun', 'sky')}
    parts['rest'] = comb - sum(parts.values()); return parts

sc = bpy.context.scene
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'; sc.render.image_settings.color_depth = '8'
frames = {os.path.basename(p).split('_r2_')[0]: load(p) for p in exrs}
rows = []
keys = ('key', 'sun', 'sky', 'rest', 'expo')
for combo in itertools.product(*(grid[k] for k in keys)):
    wt = dict(zip(keys, combo)); tag = '_'.join(f'{k}{wt[k]:g}' for k in keys)
    sc.view_settings.exposure = wt['expo']
    for shot, parts in frames.items():
        mix = sum(wt[k] * v for k, v in parts.items()); h, w = mix.shape[:2]
        img = bpy.data.images.new('mix', w, h, alpha=False, float_buffer=True)
        img.pixels.foreach_set(np.concatenate([mix, np.ones((h, w, 1))], -1)[::-1].astype(np.float32).ravel())
        png = os.path.join(out_dir, f'{shot}__{tag}.png'); img.save_render(png, scene=sc); bpy.data.images.remove(img)
        st = fts.stats(png); rows.append((tag, shot, st)); print(tag, shot, st, flush=True)
with open(os.path.join(out_dir, 'sweep.tsv'), 'w') as f:
    cols = list(rows[0][2].keys()); f.write('\t'.join(['weights', 'shot'] + cols) + '\n')
    for tag, shot, st in rows: f.write('\t'.join([tag, shot] + [str(st[c]) for c in cols]) + '\n')
print('rows', len(rows))
