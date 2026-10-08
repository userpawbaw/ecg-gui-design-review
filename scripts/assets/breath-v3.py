"""Deep-breath shape key for the v3 figure, calibrated to measured chest expansion (D-052).

Targets (tape girth, deep inhale − full exhale, healthy adults):
  upper chest (4th intercostal ≈ nipple line, z ≈ .75 H)  +5.5 cm   ─┐ "5.6–6.4 cm upper, 7–7.5 cm lower" and "4–7 cm" in the
  lower chest (xiphoid, z ≈ .69 H)                       +6.4 cm   ─┘ chest-expansion literature (sources in the README)
  abdomen (umbilicus, z ≈ .60 H)                         +3.0 cm   [추정] mixed chest/abdominal breathing; no tape norm found
Shape: horizontal push away from the torso axis, front-weighted (the back moves .35 as much — the wall pose leans on it),
smooth falloff toward the arms and the neck/pelvis, ribcage lift 6 mm at the top. Amplitudes are solved per region by bisection
so the convex-hull girth (what a tape measures) hits the targets. The existing `breath` key (≈ 1–1.8 cm chest) stays as the
quiet-breathing key.
Output: assets/source/blender-human-base-meshes/breath_deep_v3.npz (per-vertex offsets, rest frame) + a side-silhouette overlay.
Run: python scripts/assets/breath-v3.py [OUT_DIR]
"""
import json, math, os, sys
import numpy as np, bpy
from scipy.spatial import ConvexHull
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes')
OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].endswith('.py') else os.path.join(ROOT, 'verification', 'r1-breath-20261006')
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, 'figure_v3_rig_cache.blend'))
o = bpy.data.objects['body_v3']; kb = o.data.shape_keys.key_blocks
B = np.array([v.co[:] for v in kb['Basis'].data]); Q = np.array([v.co[:] for v in kb['breath'].data])
H = B[:, 2].max()
LEVELS = {'upper chest': (.75, 5.5), 'lower chest': (.69, 6.4), 'abdomen': (.60, 3.0)}
XW = .175                                                            # tape stays on the torso: arms (A-pose) start beyond ±0.18 m


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def girth(V, zf):
    z = zf * H; m = (np.abs(V[:, 2] - z) < .006) & (np.abs(V[:, 0]) < XW)
    return ConvexHull(V[m][:, :2]).area * 100                        # 2-D hull: .area is the perimeter (cm)


def axis_y(z):
    """Torso centre line (y) at height z: mid between front and back at the rest pose."""
    m = (np.abs(B[:, 2] - z) < .01) & (np.abs(B[:, 0]) < .08)
    return (B[m, 1].min() + B[m, 1].max()) / 2 if m.any() else 0.0


zs = np.linspace(.85, 1.45, 25); cy = np.interp(B[:, 2], zs, [axis_y(z) for z in zs])
side = ss(.20, .13, np.abs(B[:, 0]))                                 # fade out toward the arms
zn = B[:, 2] / H
from scipy.interpolate import PchipInterpolator
KNOTS = [.50, .60, .69, .75, .84]                                     # one smooth amplitude profile along the height (first try:
w_up = ss(.69, .75, zn) * ss(.84, .78, zn)                            # three separate bands made the inhale outline wavy)
r = np.c_[B[:, 0], B[:, 1] - cy]; rn = r / np.maximum(np.linalg.norm(r, axis=1, keepdims=True), 1e-6)
front = .35 + .65 * ss(.3, -.3, rn[:, 1])                             # −y is the front; the back moves .35 as much, blended


def key(a):
    prof = PchipInterpolator(KNOTS, [0.0, a[2], a[1], a[0], 0.0], extrapolate=False)
    D = np.zeros_like(B); amp = np.nan_to_num(prof(zn)) * side * front
    D[:, 0] = rn[:, 0] * amp; D[:, 1] = rn[:, 1] * amp
    D[:, 2] = .006 * w_up * side * min(1.0, a[0] / .015)                 # ribcage lift
    return D


amps = [.01, .01, .01]
for _ in range(6):                                                   # the regions overlap → a few Gauss-Seidel rounds
    for i, (name, (zf, tgt)) in enumerate(LEVELS.items()):
        lo, hi = 0.0, .05
        for _ in range(30):
            amps[i] = (lo + hi) / 2
            if girth(B + key(amps), zf) - girth(B, zf) < tgt: lo = amps[i]
            else: hi = amps[i]
D = key(amps)
rows = []
for name, (zf, tgt) in LEVELS.items():
    g0 = girth(B, zf); rows.append(dict(level=name, z_frac=zf, girth_exhale_cm=round(g0, 1), quiet_key_cm=round(girth(Q, zf) - g0, 2),
                                         deep_key_cm=round(girth(B + D, zf) - g0, 2), target_cm=tgt))
    print(f'   {name:12} z={zf:.2f}H girth {g0:.1f} cm  quiet +{rows[-1]["quiet_key_cm"]:.2f}  deep +{rows[-1]["deep_key_cm"]:.2f} (target {tgt})')
print('   amplitudes (m, max radial push per region)', [round(a, 4) for a in amps], ' max vertex move', round(float(np.linalg.norm(D, axis=1).max()) * 1000, 1), 'mm')
np.savez_compressed(os.path.join(SRC, 'breath_deep_v3.npz'), offsets=D.astype(np.float32), amps=np.array(amps))
json.dump({'rows': rows, 'amps_m': amps, 'front_back_ratio': .35}, open(os.path.join(OUT, 'breath_girth.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

# ---- side silhouette overlay: exhale (Basis) vs deep inhale, rest pose, orthographic from the person's right ----
sk = o.shape_key_add(name='breath_deep'); sk.data.foreach_set('co', (B + D).astype(np.float32).ravel())
for x in list(bpy.data.objects):
    if x != o: bpy.data.objects.remove(x, do_unlink=True)
o.modifiers.clear()
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'FLAT'
sc.display.shading.color_type = 'SINGLE'; sc.display.shading.single_color = (0, 0, 0); sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = 700, 900
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
cam.type = 'ORTHO'; cam.ortho_scale = .62; co.location = (-3, -0.02, 1.13); co.rotation_euler = (math.radians(90), 0, math.radians(-90))
masks = []
for nm, v in (('exhale', 0.0), ('inhale', 1.0)):
    kb = o.data.shape_keys.key_blocks
    for k in kb:
        if k.name != 'Basis': k.value = 0.0
    kb['breath_deep'].value = v
    sc.render.filepath = os.path.join(OUT, f'side_{nm}.png'); bpy.ops.render.render(write_still=True)
from PIL import Image, ImageFilter, ImageChops
a0 = Image.open(os.path.join(OUT, 'side_exhale.png')).split()[-1]; a1 = Image.open(os.path.join(OUT, 'side_inhale.png')).split()[-1]
edge = lambda a: ImageChops.subtract(a.filter(ImageFilter.MaxFilter(3)), a.filter(ImageFilter.MinFilter(3)))
base = Image.new('RGB', a0.size, (236, 233, 228)); base.paste((175, 170, 165), mask=a0)
base.paste((40, 90, 200), mask=edge(a0)); base.paste((215, 60, 40), mask=edge(a1))
base.save(os.path.join(OUT, 'side_overlay.png'))
for nm in ('exhale', 'inhale'): os.remove(os.path.join(OUT, f'side_{nm}.png'))
print('   overlay →', os.path.join(OUT, 'side_overlay.png')); sys.stdout.flush(); os._exit(0)
