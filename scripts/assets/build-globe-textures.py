"""Globe textures v2 (2026-10-09, user: polar relief barely visible, too many clouds, too few city lights vs REF-001).
Sources (public domain, NASA; registered in assets/registry.json, originals outside git under assets/source/):
  nasa-blackmarble-2016-3km   BlackMarble_2016_3km.jpg 13500x6750   -> earth_night.jpg 8192x4096
  nasa-gebco08-elev-5400      gebco_08_rev_elev_5400x2700.jpg        -> earth_height.jpg 4096x2048 (grey, ocean 0)
  nasa-bluemarble-200401-5400 world.200401.3x5400x2700.jpg           -> earth_day.jpg 4096x2048 (January: snow and ice on
                              the northern lands, as in REF-001's bright polar band; July left it green)
Night: Black Marble 2016 paints the land a moonlit blue (B > R) and city lights warm (R >> B); keeping only R - 0.55 B leaves
the lights (desert 3, Siberia -4, Paris 122 on 0-255) on black, so the shader can lift faint towns without lifting the land.
Run: python scripts/assets/build-globe-textures.py
"""
import os
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'assets', 'source'); OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets')

im = Image.open(os.path.join(SRC, 'nasa-blackmarble-2016-3km', 'BlackMarble_2016_3km.jpg')).resize((8192, 4096), Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
m = np.clip((a[..., 0] - .55 * a[..., 2] - 4.) / 120., 0., 1.)          # light mask, 0 on the moonlit land and the sea
night = np.clip(a * m[..., None] * 1.15, 0, 255).astype(np.uint8)
Image.fromarray(night).save(os.path.join(OUT, 'earth_night.jpg'), quality=84, optimize=True)
print('   earth_night.jpg', os.path.getsize(os.path.join(OUT, 'earth_night.jpg')), 'lit px %.2f %%' % (100 * (m > .05).mean()))

h = Image.open(os.path.join(SRC, 'nasa-gebco08-elev-5400', 'gebco_08_rev_elev_5400x2700.jpg')).convert('L').resize((4096, 2048), Image.LANCZOS)
h.save(os.path.join(OUT, 'earth_height.jpg'), quality=90, optimize=True)
print('   earth_height.jpg', os.path.getsize(os.path.join(OUT, 'earth_height.jpg')))

DAY = os.environ.get('DAY', '200401')
d = Image.open(os.path.join(SRC, f'nasa-bluemarble-{DAY}-5400', f'world.{DAY}.3x5400x2700.jpg')).convert('RGB').resize((4096, 2048), Image.LANCZOS)
d.save(os.path.join(OUT, 'earth_day.jpg'), quality=86, optimize=True)
print('   earth_day.jpg', os.path.getsize(os.path.join(OUT, 'earth_day.jpg')))
