"""Re-weight the light-group passes of an archive render and save it through the same view transform as the stills
(AgX + look + exposure), so frame-tone-stats.py can measure a lighting change in seconds instead of a new render
(rounds/R1/RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016 §6 S1). Run with the bpy Python (bpy colour management + OpenEXR module).

    LIGHTGROUPS=1 python scripts/blender/build_archive.py --intro2 --art r6 --dress --palette pastel --look h5 --preview DIR
      -> DIR/<shot>..._lg0001.exr  (layers Combined, key, sun, sky; each group denoised)
    python scripts/assets/light-group-mix.py IN.exr OUT.png [key=1 sun=1 sky=1 rest=1] [expo=0.15] [look="AgX - Punchy"]

A weight scales that light's whole contribution (direct + indirect) — the same as scaling its energy in Cycles. 'rest' =
Combined − key − sun − sky (pendant/desk lamps, visible lamp glass). Direction, position, size or bounce limits need a render.
"""
import sys
import numpy as np
import OpenEXR
import bpy

src, out = sys.argv[1], sys.argv[2]
opt = dict(a.split('=', 1) for a in sys.argv[3:])
w = {k: float(opt.get(k, 1)) for k in ('key', 'sun', 'sky', 'rest')}
ch = OpenEXR.File(src, separate_channels=True).channels()
pre = next(n[:-len('Combined.R')].rstrip('.') for n in ch if n.endswith('Combined.R'))   # 'ViewLayer' (render EXR) or '' (compositor EXR)
get = lambda layer: np.stack([ch[f'{pre}.{layer}.{c}' if pre else f'{layer}.{c}'].pixels for c in 'RGB'], -1).astype(np.float64)
comb = get('Combined'); parts = {k: get(k) for k in ('key', 'sun', 'sky')}
parts['rest'] = comb - sum(parts.values())
mix = sum(w[k] * v for k, v in parts.items())
h, wd = mix.shape[:2]
img = bpy.data.images.new('mix', wd, h, alpha=False, float_buffer=True)
rgba = np.concatenate([mix, np.ones((h, wd, 1))], -1)[::-1].astype(np.float32)   # EXR rows top-down, Blender bottom-up
img.pixels.foreach_set(rgba.ravel())
sc = bpy.context.scene
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = opt.get('look', 'AgX - Punchy')
sc.view_settings.exposure = float(opt.get('expo', 0.15))
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'; sc.render.image_settings.color_depth = '8'
img.save_render(out, scene=sc)
print(out, w, 'expo', sc.view_settings.exposure)
