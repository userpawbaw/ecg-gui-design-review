"""B1 clay shadow test bench (rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016 §7 B1). A small grey room, not the archive: it tests
only the light / occluder principles found in REF-002 (F-045, F-046) before they are built into build_archive.py.

  bookcase: 3 bays × 0.9 m, 2.9 m high, 4 cm boards, cell depth CELL (0.27 = ours today, 0.5 = REF), bevelled books and lying stacks
  hatch: an opening in the ceiling slab right in front of the bookcase, with its lid standing up (crisp edge near the receiver)
  ladder: top resting on the bookcase top, foot LAD_OUT m out (contact hardening)
  sculptures: a cube cluster and a faceted ball, 0.15 m in front of the cell back walls (crisp)
  right window: in a wall WIN_X m to the right, mullion grid, out of frame (far occluder → shaped soft shadow on the right bay)
  one sun from right-front-above through both openings; FILL = 'floor' (floor bounce only, like ours) or 'front' (a large soft area
  light behind the camera, the REF cut-away's open side)

  python scripts/blender/shadow-bench-b1.py -- OUTDIR [--cell 0.5] [--fill front] [--lad-out 0.75] [--win-x 6] [--sun-ang 0.5]
                                                     [--samples 64] [--res 960x540] [--save]
Writes OUTDIR/bench.png (AgX Punchy), OUTDIR/bench.blend with --save (for shadow-sharpness-map.py), and prints the camera spec.
"""
import argparse, math, os, sys
import bpy, bmesh
from mathutils import Vector

ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('--cell', type=float, default=0.5); ap.add_argument('--fill', default='front', choices=['front', 'floor'])
ap.add_argument('--lad-out', type=float, default=0.75); ap.add_argument('--win-dist', type=float, default=5.0); ap.add_argument('--sun-ang', type=float, default=0.5)
ap.add_argument('--sun-dir', default='-0.45,0.8,-0.4'); ap.add_argument('--samples', type=int, default=64); ap.add_argument('--res', default='960x540')
ap.add_argument('--fill-z', type=float, default=2.0); ap.add_argument('--fill-e', type=float, default=120.0); ap.add_argument('--fill-tilt', type=float, default=0.0); ap.add_argument('--floor-val', type=float, default=0.75)
ap.add_argument('--save', action='store_true'); ap.add_argument('--expo', type=float, default=0.8)
a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:])
os.makedirs(a.out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene

def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; return m
CLAY = mat('clay', (0.55, 0.53, 0.50)); CLAY_D = mat('clay_dark', (0.30, 0.29, 0.28)); CLAY_L = mat('clay_light', (0.75, 0.73, 0.70))

def box(name, size, loc, m=CLAY, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        md = o.modifiers.new('bevel', 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'ANGLE'
        o.modifiers.new('wn', 'WEIGHTED_NORMAL')
    o.data.materials.append(m); return o

D = a.cell; T = 0.04; BAYW = 0.9; HB = 2.9
# room: floor, back wall (y = 0 at the cell backs), ceiling slab with the hatch, right wall with the window
box('Floor', (16, 14, 0.1), (0, -5, -0.05), mat('floor', (a.floor_val, a.floor_val * 0.97, a.floor_val * 0.93)))
box('BackWall', (16, 0.1, 6), (0, 0.05, 3), CLAY)
HZ = 3.2; hx0, hx1, hy0, hy1 = -0.5, 0.6, -D - 1.9, -D - 1.0           # hatch 1–1.9 m in front of the bookcase: its light lands on the upper bays
SX0, SX1 = -4.0, 2.2                                                       # slab over the bookcase only (2.4 m deep): low light passes under its front edge
for nm, sx, sy, cx, cy in (('SlabBack', SX1 - SX0, 0.05 + D + 0.05, (SX0 + SX1) / 2, (0 + hy1) / 2), ('SlabFront', SX1 - SX0, 0.5, (SX0 + SX1) / 2, hy0 - 0.25),
                           ('SlabL', hx0 - SX0, hy1 - hy0, (SX0 + hx0) / 2, (hy0 + hy1) / 2), ('SlabR', SX1 - hx1, hy1 - hy0, (hx1 + SX1) / 2, (hy0 + hy1) / 2)):
    box(nm, (sx, abs(sy), 0.15), (cx, cy, HZ + 0.075), CLAY)
lid = box('HatchLid', (hx1 - hx0, 0.04, hy1 - hy0), ((hx0 + hx1) / 2, hy0 - 0.02, HZ + 0.15 + (hy1 - hy0) / 2), CLAY, bevel=0.004)
lid.rotation_euler.x = math.radians(-12)                                   # propped open, leaning back over the room
# far window wall (off screen, right-front): a large panel facing the sun with one mullioned window, WIN_DIST along the sun ray from
# the right bay, so the right bay gets shaped soft light and the rest of the bookcase stays in shade (apart from the hatch light)
from mathutils import Matrix
sd = Vector(tuple(float(v) for v in a.sun_dir.split(','))).normalized()
tgt_r = Vector((1.5 * BAYW - 0.45 * BAYW, -D / 2, 1.25))
cw = tgt_r - sd * a.win_dist
uu = sd.cross(Vector((0, 0, 1))).normalized(); vv = uu.cross(sd).normalized()
MW = Matrix(((uu.x, vv.x, sd.x, cw.x), (uu.y, vv.y, sd.y, cw.y), (uu.z, vv.z, sd.z, cw.z), (0, 0, 0, 1)))
def wbox(name, size, lc, m=CLAY):
    o = box(name, size, lc, m); o.matrix_world = MW @ o.matrix_world; return o
WW, WH, PW, PH = 1.2, 1.7, 12.0, 8.0                                         # window opening and wall panel (local u, v)
# one wall panel with two holes (boolean): the mullioned window for the right bay, and an upper opening where the sun runs on to
# the hatch (REF: the upper-floor windows feed the hatch). The hatch footprint is projected along the sun onto the panel.
def to_local(pw):
    t = (pw - cw).dot(sd); q = pw - sd * t - cw
    return q.dot(uu), q.dot(vv)
hc = [to_local(Vector((x, y, HZ + 0.15))) for x in (hx0, hx1) for y in (hy0, hy1)]
hu0, hu1 = min(c[0] for c in hc) - 0.25, max(c[0] for c in hc) + 0.25; hv0, hv1 = min(c[1] for c in hc) - 0.25, max(c[1] for c in hc) + 0.25
panel = wbox('WinWall', (PW, PH, 0.15), (0, 0, 0))
for nm, (cu, cv, su, sv) in (('cut_win', (0, 0, WW, WH)), ('cut_hatch', ((hu0 + hu1) / 2, (hv0 + hv1) / 2, hu1 - hu0, hv1 - hv0))):
    cut = wbox(nm, (su, sv, 0.6), (cu, cv, 0)); md = panel.modifiers.new(nm, 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cut
    cut.hide_render = True; cut.hide_viewport = True
bpy.context.view_layer.objects.active = panel
for md in list(panel.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
for nm in ('cut_win', 'cut_hatch'): bpy.data.objects.remove(bpy.data.objects[nm])
print('hatch opening on the window wall (u, v):', round(hu0, 2), round(hu1, 2), round(hv0, 2), round(hv1, 2))
for i in (-1, 0, 1):
    wbox(f'Mullion_v{i}', (0.09, WH, 0.12), (i * WW / 4, 0, 0), CLAY_D)
for j in (-1, 1):
    wbox(f'Mullion_h{j}', (WW, 0.09, 0.12), (0, j * WH / 6, 0), CLAY_D)
# bookcase
x0 = -1.5 * BAYW
for i in range(4): box(f'Upright{i}', (T, D, HB), (x0 + i * BAYW, -D / 2, HB / 2), CLAY, bevel=0.004)
for k in range(9):
    z = 0.06 + k * 0.36
    box(f'Shelf{k}', (3 * BAYW, D, T), (0, -D / 2, z), CLAY, bevel=0.004)
box('Top', (3 * BAYW + 0.1, D + 0.05, 0.06), (0, -D / 2, HB + 0.03), CLAY, bevel=0.005)
import random; rng = random.Random(5)
for k in range(1, 8):
    z = 0.06 + k * 0.36 + T / 2
    for bay in range(3):
        if (k, bay) in ((4, 1), (5, 2)): continue                         # cells for the sculptures
        bx = x0 + bay * BAYW + 0.06; end = x0 + (bay + 1) * BAYW - 0.06
        if rng.random() < 0.35:                                            # lying stack
            h = 0.0
            for s in range(rng.randint(2, 4)):
                th = rng.uniform(0.025, 0.04); box('BookLying', (rng.uniform(0.22, 0.28), min(0.2, D - 0.05), th), (bx + 0.16, -min(0.2, D - 0.05) / 2 - 0.02, z + h + th / 2), CLAY_L, bevel=0.002); h += th
            bx += 0.36
        while bx < end - 0.03 and rng.random() < 0.93:
            w = rng.uniform(0.025, 0.05); hgt = rng.uniform(0.2, 0.3); dep = min(rng.uniform(0.15, 0.22), D - 0.04)
            box('Book', (w, dep, hgt), (bx + w / 2, -dep / 2 - 0.02, z + hgt / 2), CLAY_L if rng.random() < .5 else CLAY, bevel=0.002); bx += w + 0.003
# sculptures 0.15 m in front of the back wall
z4 = 0.06 + 4 * 0.36 + T / 2
for dx, dy, dz, s in ((0, 0, 0, .12), (.1, -.03, 0, .09), (.04, .02, .12, .08)):
    box('Sculpt_cubes', (s, s, s), (x0 + BAYW * 1.5 + dx, -0.15 + dy, z4 + s / 2 + dz), CLAY_L, bevel=0.003)
z5 = 0.06 + 5 * 0.36 + T / 2
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.09, location=(x0 + BAYW * 2.5, -0.15, z5 + 0.09)); o = bpy.context.object; o.name = 'Sculpt_ball'; o.data.materials.append(CLAY_L)
# ladder: top on the bookcase top front edge, foot LAD_OUT out
top = Vector((x0 + BAYW * 0.75, -D - 0.02, HB)); foot = Vector((top.x, -D - a.lad_out, 0)); ax = (top - foot)
L = ax.length; ang = math.atan2(ax.y, ax.z)
for sx in (-0.22, 0.22):
    o = box('Ladder_rail', (0.04, 0.06, L), ((top + foot) / 2 + Vector((sx, 0, 0))), CLAY_D, bevel=0.004); o.rotation_euler.x = -ang
for r in range(1, int(L / 0.3)):
    p = foot + ax * (r * 0.3 / L); box('Ladder_rung', (0.44, 0.03, 0.03), p, CLAY_D, bevel=0.003)
# lights
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 6.0; sun.angle = math.radians(a.sun_ang); sun.color = (1.0, 0.93, 0.84)
so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so); so.rotation_euler = sd.to_track_quat('-Z', 'Y').to_euler()
CAM = (Vector((0, -6.5, 1.6)), Vector((0, 0, 1.6)), 26.0)
if a.fill == 'front':                                                       # the open side of a cut-away: big soft light behind the camera
    fl = bpy.data.lights.new('fill', 'AREA'); fl.shape = 'RECTANGLE'; fl.size = 5; fl.size_y = 3; fl.energy = a.fill_e; fl.color = (0.93, 0.95, 1.0)
    fo = bpy.data.objects.new('fill', fl); sc.collection.objects.link(fo); fo.location = (0, -9.0, a.fill_z); fo.rotation_euler = Vector((0, 1, -math.tan(math.radians(a.fill_tilt)))).to_track_quat('-Z', 'Y').to_euler()   # tilt: aims down (fill from above-front)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.08
# camera + render
loc, tgt, fov = CAM
cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov); c = bpy.data.objects.new('cam', cd); c.location = loc
c.rotation_euler = (tgt - loc).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(c); sc.camera = c
rx, ry = map(int, a.res.split('x'))
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = a.samples; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = rx, ry; sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
sc.view_settings.exposure = a.expo; sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 4
if a.save: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(a.out, 'bench.blend'))
sc.render.filepath = os.path.join(a.out, 'bench.png'); bpy.ops.render.render(write_still=True)
print('CAMSPEC', f'{loc.x},{loc.y},{loc.z};{tgt.x},{tgt.y},{tgt.z};{fov}')
