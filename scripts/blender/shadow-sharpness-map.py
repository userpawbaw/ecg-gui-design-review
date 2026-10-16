"""B0 (rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016 §7): where in the frame are the shadows crisp, where soft, and how is the
shade layered — from the scene geometry, per camera ray.

For each sample of a camera grid: the visible point P (scene.ray_cast), its normal, its depth. Then, per light, a ray from P toward
the light: if blocked, the occluder→receiver distance d gives the predicted penumbra width w = d · θ (θ = the light's angular
size seen from P: the sun's disc angle, or 2·radius / distance for a point/spot), converted to pixels at P's depth.
Outputs (OUT prefix):
  Penumbra widths are in pixels of a 720 px-high frame (the frame-tone-stats scale), whatever --res is.
  OUT_penumbra.png  per light: grey = lit, colour = shadowed by an occluder: red ≤ 3 px (crisp), yellow 3–10, blue > 10 (soft)
  OUT.json          per light: shares of crisp / medium / soft shadow among shadowed samples and among boundary samples
                    (shadowed with a lit neighbour — the edges the eye reads), occluder-distance percentiles, and per occluder object
                    (name before the first '.') its boundary count, median penumbra and distance;
                    per sample the arrays needed for the layering index (normal, depth class) when --image is given
  With --image RENDER.png (same camera): shade layering in the left third — median L* of (a) surfaces facing the light side
  (normal·side > 0.5; side = camera right unless --side), (b) the front layer (≥ 0.15 m in front of the cell back wall: shelf
  fronts, books, drawers), (c) the cell back walls (within 0.06 m of the deepest plane). Only the bookcase depth window (1 m in front of
  the back wall) counts, so the ladder, stack ends and lamps are left out. Plus median L* of bookcase faces by facing direction
  (camera right / left / up / down / toward camera): where the fill in the shade comes from. REF-002 rebuilds work too (no lights: layering only).

  python scripts/blender/shadow-sharpness-map.py -- SCENE(.blend|.glb) OUT "cam=x,y,z;tx,ty,tz;vfov" [--res 320x180]
         [--image RENDER.png] [--side 1,0,0] [--zone 0,0.333] [--glbcam]   (--glbcam: use the glb's own camera, z offset via cam=;;;dz)
Run with the bpy Python. Lights read from the scene: SUN objects (angle) and POINT/SPOT objects (shadow_soft_size).
"""
import json, math, sys
import bpy
import numpy as np
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
scene_path, out, camspec = a[0], a[1], a[2]
opt = {}
i = 3
while i < len(a):
    if a[i] in ('--res', '--image', '--side', '--zone'): opt[a[i]] = a[i + 1]; i += 2
    else: opt[a[i]] = True; i += 1
W, H = (int(v) for v in opt.get('--res', '320x180').split('x'))

if scene_path.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=scene_path)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=scene_path)
sc = bpy.context.scene; dg = bpy.context.evaluated_depsgraph_get()

if opt.get('--glbcam'):
    cam = bpy.data.objects['camera']; dz = float(camspec.split(';')[-1]) if camspec else 0.0
    loc = cam.matrix_world.translation + Vector((0, 0, dz)); rot = cam.matrix_world.to_quaternion(); vfov = cam.data.angle_y
else:
    p, t, f = camspec.split(';')
    loc = Vector(tuple(float(v) for v in p.split(','))); tgt = Vector(tuple(float(v) for v in t.split(',')))
    rot = (tgt - loc).to_track_quat('-Z', 'Y'); vfov = math.radians(float(f))
fwd = rot @ Vector((0, 0, -1)); up = rot @ Vector((0, 1, 0)); right = rot @ Vector((1, 0, 0))
side = Vector(tuple(float(v) for v in opt['--side'].split(','))).normalized() if '--side' in opt else right   # default: camera right
th = math.tan(vfov / 2); tw = th * W / H; fpx = 360 / th          # penumbra reported in pixels of a 720 px-high frame (frame-tone-stats scale)

lights = []
for o in sc.objects:
    if o.type != 'LIGHT' or o.hide_render: continue
    L = o.data
    if L.energy <= 0: continue
    if L.type == 'SUN': lights.append((o.name, 'SUN', (o.matrix_world.to_quaternion() @ Vector((0, 0, -1))).normalized(), L.angle))
    elif L.type in ('POINT', 'SPOT'): lights.append((o.name, L.type, o.matrix_world.translation.copy(), L.shadow_soft_size))

def skip(o):
    """objects a render never sees as surfaces: hidden from render, volume boxes and haze"""
    return o.hide_render or o.name.startswith(('VOL_', 'Haze')) or any(
        m and m.use_nodes and any(n.type == 'OUTPUT_MATERIAL' and n.inputs['Volume'].is_linked and not n.inputs['Surface'].is_linked
                                  for n in m.node_tree.nodes) for m in getattr(o.data, 'materials', []))

def cast(org, d, dist=1e4):
    """scene.ray_cast that passes through skipped objects"""
    travelled = 0.0
    while travelled < dist:
        hit, P, N, idx, ob, _ = sc.ray_cast(dg, org, d, distance=dist - travelled)
        if not hit: return False, None, None
        if not skip(ob): cast.last = ob.name; return True, P, N
        travelled += (P - org).length + 1e-4; org = P + d * 1e-4
    return False, None, None
cast.last = ''

depth = np.full((H, W), np.nan); nrm = np.zeros((H, W, 3)); pts = np.zeros((H, W, 3))
res = {l[0]: {'pen': np.full((H, W), np.nan), 'occ': np.full((H, W), np.nan), 'who': np.full((H, W), '', dtype=object)} for l in lights}
for y in range(H):
    for x in range(W):
        u = ((x + .5) / W * 2 - 1) * tw; v = (1 - (y + .5) / H * 2) * th
        d = (fwd + right * u + up * v).normalized()
        hit, P, N = cast(loc, d)
        if not hit: continue
        if N.dot(d) > 0: N = -N
        z = (P - loc).dot(fwd); depth[y, x] = z; nrm[y, x] = N; pts[y, x] = P
        for name, typ, val, size in lights:
            if typ == 'SUN': ld = -val; dist_l = 1e4; theta = size
            else:
                ld = (val - P); dist_l = ld.length; ld = ld.normalized(); theta = 2 * size / max(dist_l, 1e-3)
            if N.dot(ld) <= 0: continue                      # facing away: attached shade, not a cast shadow
            h2, Q, _ = cast(P + N * 1e-3, ld, dist_l)
            if not h2: continue
            dor = (Q - P).length
            res[name]['occ'][y, x] = dor; res[name]['pen'][y, x] = dor * theta * fpx / z; res[name]['who'][y, x] = cast.last.split('.')[0]

# penumbra map image
img = np.zeros((H * len(lights) or H, W, 3))
summary = {'camera': {'loc': list(loc), 'vfov_deg': math.degrees(vfov)}, 'lights': {}}
for k, (name, typ, val, size) in enumerate(lights):
    pen = res[name]['pen']; occ = res[name]['occ']; blk = img[k * H:(k + 1) * H]
    lit = ~np.isnan(depth) & np.isnan(pen); blk[lit] = .55
    m = ~np.isnan(pen)
    blk[m & (pen <= 3)] = (.9, .15, .1); blk[m & (pen > 3) & (pen <= 10)] = (.95, .8, .1); blk[m & (pen > 10)] = (.2, .4, .95)
    n = max(int(m.sum()), 1)
    vis = ~np.isnan(depth); litm = vis & ~m                     # boundary = shadowed sample with a lit 4-neighbour: what the eye reads
    nb = np.zeros_like(m)
    nb[1:] |= litm[:-1]; nb[:-1] |= litm[1:]; nb[:, 1:] |= litm[:, :-1]; nb[:, :-1] |= litm[:, 1:]
    bd = m & nb; nbd = max(int(bd.sum()), 1)
    summary['lights'][name] = {'type': typ, 'shadowed_share': round(float(m.mean()), 3),
        'crisp_le3px': round(float((pen[m] <= 3).sum() / n), 3), 'medium_3_10px': round(float(((pen[m] > 3) & (pen[m] <= 10)).sum() / n), 3),
        'soft_gt10px': round(float((pen[m] > 10).sum() / n), 3),
        'occluder_dist_m_p10_50_90': [round(float(np.percentile(occ[m], q)), 2) for q in (10, 50, 90)] if m.any() else None,
        'penumbra_px_p10_50_90': [round(float(np.percentile(pen[m], q)), 1) for q in (10, 50, 90)] if m.any() else None,
        'boundary_samples': int(bd.sum()), 'boundary_crisp_le3px': round(float((pen[bd] <= 3).sum() / nbd), 3),
        'boundary_soft_gt10px': round(float((pen[bd] > 10).sum() / nbd), 3),
        'boundary_penumbra_px_p10_50_90': [round(float(np.percentile(pen[bd], q)), 1) for q in (10, 50, 90)] if bd.any() else None,
        'by_occluder': {o: {'boundary_samples': int((bd & (res[name]['who'] == o)).sum()),
                            'penumbra_px_p50': round(float(np.median(pen[bd & (res[name]['who'] == o)])), 1),
                            'occluder_dist_m_p50': round(float(np.median(occ[bd & (res[name]['who'] == o)])), 2)}
                        for o in sorted(set(res[name]['who'][bd])) if (bd & (res[name]['who'] == o)).sum() >= 15}}
from PIL import Image
Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((W * 2, img.shape[0] * 2), Image.NEAREST).save(out + '_penumbra.png')

# shade layering (left third) against a render of the same camera
if opt.get('--image'):
    im = Image.open(opt['--image']).convert('RGB').resize((W, H), Image.BOX)
    a8 = np.asarray(im).astype(float) / 255; lin = np.where(a8 <= .04045, a8 / 12.92, ((a8 + .055) / 1.055) ** 2.4)
    Ls = 116 * np.cbrt(lin @ [.2126, .7152, .0722]) - 16
    zx0, zx1 = (float(v) for v in opt.get('--zone', '0,0.3333').split(','))     # shade zone as frame-width fractions (default: left third)
    zone = np.zeros((H, W), bool); zone[:, int(zx0 * W):int(zx1 * W)] = True; ok = zone & ~np.isnan(depth)
    back = float(np.percentile(depth[ok], 98))                       # the cell back wall (level camera facing the wall: one depth)
    unit = ok & (depth > back - 1.0)                                  # the bookcase only: ladder, stack ends, lamps excluded
    facing = unit & ((nrm @ np.array(side)) > 0.5)
    lay_in = unit & (depth >= back - 0.06) & ~facing                  # deepest: cell back walls
    lay_front = unit & (depth <= back - 0.15) & ~facing               # front layer: shelf fronts, books, drawer fronts
    summary['bookcase_depth_m'] = {'back_wall': round(back, 2), 'front_p10': round(float(np.percentile(depth[unit], 10)), 2)}
    med = lambda m: round(float(np.median(Ls[m])), 1) if m.sum() > 20 else None
    dirs = {'right': right, 'left': -right, 'up': up, 'down': -up, 'toward_camera': -fwd}
    summary['directional_left_third'] = {k: med(unit & ((nrm @ np.array(v)) > 0.7)) for k, v in dirs.items()}   # median L* of bookcase faces by facing
    summary['layering_left_third'] = {'L_facing_light_side': med(facing), 'L_front_layer': med(lay_front), 'L_cell_interior': med(lay_in),
        'counts': [int(facing.sum()), int(lay_front.sum()), int(lay_in.sum())]}
np.save(out + '_depth.npy', depth)
json.dump(summary, open(out + '.json', 'w'), indent=1)
print(json.dumps(summary, indent=1))
