"""Where the light on the bookcase shelf undersides comes from (D-085, user 2026-10-17: "책장 칸 아랫면이 더 어둡게 나오지 않는다는
문제가 [해치 빛]에 영향을 받는지"). Per camera ray (same camera spec as shadow-sharpness-map.py): the visible point, its normal and
object. Bookcase faces in the back-wall depth window (1 m in front of the shelf fronts) are classed down-facing (shelf undersides,
N.z < −0.7) or up-facing (shelf tops, N.z > 0.7). Each underside sample is split by whether the shelf top below it (a ray straight
down) sees the sun: an underside above a sunlit cell is lit by that cell's bounce. The light-group EXR (Combined + key/sun/sky, written
by build_archive.py LIGHTGROUPS=1, same camera) gives each group's linear luminance per class and zone (frame thirds).

  python scripts/blender/underside-light-sources.py -- SCENE.blend LG.exr "cam=x,y,z;tx,ty,tz;vfov" [--res 320x180] [--back-y 4.7] [--w key=0.5,sun=0.6,sky=4]
  --w: the light-group weights of the mix being judged (light-group-mix.py), applied before the shares (default 1 each).
Run with the bpy Python (needs OpenEXR).
"""
import math, sys
import bpy
import numpy as np
import OpenEXR
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
scene_path, exr, camspec = a[0], a[1], a[2].removeprefix('cam=')
opt = {a[i]: a[i + 1] for i in range(3, len(a) - 1, 2)}
W, H = (int(v) for v in opt.get('--res', '320x180').split('x')); BACK_Y = float(opt.get('--back-y', 4.7))
bpy.ops.wm.open_mainfile(filepath=scene_path)
sc = bpy.context.scene; dg = bpy.context.evaluated_depsgraph_get()
p, t, f = camspec.split(';')
loc = Vector(tuple(float(v) for v in p.split(','))); tgt = Vector(tuple(float(v) for v in t.split(',')))
rot = (tgt - loc).to_track_quat('-Z', 'Y'); th = math.tan(math.radians(float(f)) / 2); tw = th * W / H
fwd, up, right = rot @ Vector((0, 0, -1)), rot @ Vector((0, 1, 0)), rot @ Vector((1, 0, 0))
sun = next(o for o in sc.objects if o.type == 'LIGHT' and o.data.type == 'SUN')
to_sun = -(sun.matrix_world.to_quaternion() @ Vector((0, 0, -1))).normalized()

def skip(o):
    return o.hide_render or o.name.startswith(('VOL_', 'Haze')) or any(
        m and m.use_nodes and any(n.type == 'OUTPUT_MATERIAL' and n.inputs['Volume'].is_linked and not n.inputs['Surface'].is_linked
                                  for n in m.node_tree.nodes) for m in getattr(o.data, 'materials', []))

def cast(org, d, dist=1e4):
    while dist > 0:
        hit, P, N, _, ob, _ = sc.ray_cast(dg, org, d, distance=dist)
        if not hit: return None, None, None
        if not skip(ob): return P, N, ob
        dist -= (P - org).length + 1e-4; org = P + d * 1e-4
    return None, None, None

cls = np.zeros((H, W), np.int8)            # 0 other, 1 underside above a sunlit cell, 2 underside above a shaded cell, 3 shelf top
for y in range(H):
    for x in range(W):
        d = (fwd + right * (((x + .5) / W * 2 - 1) * tw) + up * ((1 - (y + .5) / H * 2) * th)).normalized()
        P, N, ob = cast(loc, d)
        if P is None or P.y < BACK_Y - 1.0: continue
        if N.dot(d) > 0: N = -N
        if N.z > 0.7: cls[y, x] = 3; continue
        if N.z >= -0.7: continue
        Q, _, _ = cast(P + Vector((0, 0, -1e-3)), Vector((0, 0, -1)), 1.0)    # the shelf top (or books) below
        if Q is None: continue
        S, _, _ = cast(Q + Vector((0, 0, 1e-3)), to_sun)
        cls[y, x] = 2 if S is not None else 1

ch = OpenEXR.File(exr, separate_channels=True).channels()
pre = next(k for k in ch if k.endswith('Combined.R')).removesuffix('Combined.R')   # 'ViewLayer.' (render EXR) or '' (compositor EXR)
grp = (lambda g: 'Combined_' + g) if pre else (lambda g: g)
lum = lambda n: (np.stack([ch[f'{pre}{n}.{c}'].pixels for c in 'RGB'], -1).astype(np.float64) @ [.2126, .7152, .0722])
comb = lum('Combined'); parts = {g: lum(grp(g)) for g in ('key', 'sun', 'sky')}; parts['rest'] = comb - sum(parts.values())
wt = {k: 1.0 for k in parts}; wt.update({k: float(v) for k, v in (kv.split('=') for kv in opt['--w'].split(','))} if '--w' in opt else {})
parts = {k: v * wt[k] for k, v in parts.items()}; comb = sum(parts.values())
fy, fx = comb.shape[0] // H, comb.shape[1] // W
sub = lambda img: img[fy // 2::fy, fx // 2::fx][:H, :W]
comb_s = sub(comb); parts_s = {k: sub(v) for k, v in parts.items()}
xs = np.arange(W)[None, :].repeat(H, 0)
names = {1: 'underside, sunlit cell below', 2: 'underside, shaded cell below', 3: 'shelf top'}
for zname, zm in (('left third', xs < W / 3), ('centre third', (xs >= W / 3) & (xs < 2 * W / 3)), ('right third', xs >= 2 * W / 3), ('whole frame', xs >= 0)):
    print(zname)
    for c_, cname in names.items():
        m = zm & (cls == c_)
        if m.sum() < 5: continue
        tot = comb_s[m].sum()
        if c_ == 3: top_med = np.median(comb_s[m])
        print(f'  {cname:30s} n {int(m.sum()):5d}  median lum {np.median(comb_s[m]):.4f}  share ' +
              ' '.join(f'{k} {100 * v[m].sum() / tot:5.1f}%' for k, v in parts_s.items()))
