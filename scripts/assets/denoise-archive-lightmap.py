"""Denoise the web archive's baked room lightmap (light_shell.webp) without re-baking.

Why (user 2026-10-14): white speckles on the computer, the floor and the shelves in the dark desk corner — the room
lightmap was baked at 128 samples (manifest), so indirect-only areas carry firefly noise. The bake script
(scripts/blender/build_archive.py) belongs to the archive-light session (WORK_STATE active_jobs), so this works on the
exported image: 1) outlier pixels (brighter than 1.35 x their 5 x 5 median) take the median, 2) the remaining grain is
smoothed only where neighbours differ little (edges and light/shadow borders stay sharp). UV islands are respected:
the empty background is filled from the nearest island pixel before filtering and is black again afterwards.
The original stays in light_shell.raw.webp; rerun after any new web bake.
Run: python scripts/assets/denoise-archive-lightmap.py [archive dir]
"""
import os, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
DIR = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets', 'archive')
if len(sys.argv) > 1: DIR = os.path.abspath(sys.argv[1])   # another packaged archive (D-075: the Lab's sun variant)
SRC, RAW = os.path.join(DIR, 'light_shell.webp'), os.path.join(DIR, 'light_shell.raw.webp')

if not os.path.exists(RAW):
    shutil.copyfile(SRC, RAW)
img = np.asarray(Image.open(RAW).convert('RGB'), np.float32) / 255.0
mask = img.max(axis=2) > 1.0 / 255
# fill the background from the nearest island pixel so filters at island borders see only island values
_, (iy, ix) = ndimage.distance_transform_edt(~mask, return_indices=True)
filled = img[iy, ix]
lum = filled.mean(axis=2)
med = np.stack([ndimage.median_filter(filled[..., c], size=5) for c in range(3)], axis=2)
mlum = med.mean(axis=2)
fire = mask & (lum > mlum * 1.35 + 0.03)
out = filled.copy(); out[fire] = med[fire]
# grain: gaussian blend weighted by similarity (a cheap bilateral)
blur = np.stack([ndimage.gaussian_filter(out[..., c], 1.6) for c in range(3)], axis=2)
diff = np.abs(out - blur).mean(axis=2, keepdims=True)
w = 0.75 * np.exp(-(diff / 0.05) ** 2)
out = out * (1 - w) + blur * w
out[~mask] = 0
Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(SRC, quality=94, method=6)
print('light_shell.webp: fireflies replaced', int(fire.sum()), 'of', int(mask.sum()), 'lit px; grain smoothed (bilateral blend)')
sys.stdout.flush()
