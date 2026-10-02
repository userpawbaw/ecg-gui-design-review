"""ECG record archive stacks for the R1 intro + Story (D-046, rounds/R1/SPACE-R1-ARCHIVE.md). Headless Blender (bpy).

Tall double-sided stacks along a central aisle, a full-height back-wall shelf with a library ladder (the figure sits on
it), high left-wall windows with blinds that break the sun into slats, ceiling beams for foreground parallax, and a
reading nook (desk, CRT monitor + computer, ECG cart, wall outlet and floor cable) for the Story's noise-source scenes.
Shelves hold procedural books, archive boxes, binders and rolled ECG paper (blank grid — never a waveform).
Props: Poly Haven CC0 (assets/source/ph-*). Helpers follow scripts/blender/build_attic.py (REF-002 study).

    python3 scripts/blender/build_archive.py --preview DIR [--samples 64] [--shots s1,s2]
Blender frame: x right, y into the room (the camera enters at −y), z up. Units m.
"""
import argparse, math, os, random, sys
import bpy, bmesh, numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--preview', default='')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--shots', default='')
ap.add_argument('--res', default='1280x720')
ap.add_argument('--seed', type=int, default=11)
ap.add_argument('--save', default='')
ap.add_argument('--bake', default='', help='bake lightmaps + export the web scene into this dir')
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--bsamples', type=int, default=128)
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
rng = random.Random(args.seed)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- materials ----------------
def ph_material(slug, res='2k', name=None):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'assets/source/ph-{slug}/{slug}_{res}.gltf'))
    new = [o for o in bpy.data.objects if o not in before]
    m = next(o for o in new if o.type == 'MESH').data.materials[0]
    for o in new: bpy.data.objects.remove(o)
    m.name = name or slug; return m

def mat(name, rgb, rough=0.7, emit=0.0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    return m

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

M_WOOD = ph_material('ash_veneer', name='stack_wood')
M_DARK = ph_material('walnut_veneer', name='walnut')
M_WALL = ph_material('painted_plaster_wall', '1k', name='plaster')
M_FLOOR = ph_material('herringbone_parquet', '1k', name='parquet')
M_BEAM = mat('beam', srgb('#5b4330'), 0.75)
M_BRASS = mat('brass', srgb('#b89a62'), 0.35, metal=1.0)
M_SLAT = mat('blind_slat', srgb('#e9e2d4'), 0.5)
M_FRAME = mat('window_frame', srgb('#d8d2c6'), 0.55)
M_GLASS = mat('glass', (1, 1, 1), 0.05); M_GLASS.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 1.0
M_BOX = mat('archive_box', srgb('#c9b08a'), 0.85)
M_BOX2 = mat('archive_box_grey', srgb('#9a9a92'), 0.85)
M_LABEL = mat('label', srgb('#f1ece0'), 0.8)
M_BEIGE = mat('beige_plastic', srgb('#d8cfba'), 0.5)
M_SCREEN = mat('crt_glass', srgb('#12201c'), 0.15)
M_BLACK = mat('black_plastic', srgb('#1c1c1c'), 0.5)
M_STEEL = mat('steel', srgb('#9aa0a4'), 0.35, metal=1.0)
M_OUTLET = mat('outlet', srgb('#ece8de'), 0.45)
M_CABLE = mat('cable', srgb('#202020'), 0.6)
PALETTE = [('#7a3b2e', 4), ('#2f4a5a', 4), ('#5a6b48', 3), ('#8a6a3a', 3), ('#3b3030', 3), ('#b89b72', 3), ('#d9cfb8', 3),
           ('#6e2f2f', 2), ('#24343f', 2), ('#a8653c', 2), ('#cfc2a0', 2), ('#4d5e6b', 2), ('#e6dcc4', 2)]
BOOK_MATS = [mat(f'book_{i}', srgb(h), 0.72) for i, (h, _) in enumerate(PALETTE)]
BOOK_W = [w for _, w in PALETTE]

def ecg_paper_material():
    """Blank ECG paper (pink grid, 1 mm / 5 mm lines) — no waveform (data contract)."""
    N = 512; img = bpy.data.images.new('ecg_paper', N, N)
    px = np.ones((N, N, 4), np.float32); base = np.array(srgb('#f6e6e2') + (1,), np.float32); px[:] = base
    minor, major = np.array(srgb('#e9b8b4') + (1,)), np.array(srgb('#d47f7a') + (1,))
    for i in range(0, N, 8):
        px[i, :, :] = minor; px[:, i, :] = minor
    for i in range(0, N, 40):
        px[i:i + 2, :, :] = major; px[:, i:i + 2, :] = major
    img.pixels = px.ravel()
    m = bpy.data.materials.new('ecg_paper'); m.use_nodes = True
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
    m.node_tree.links.new(t.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .8
    return m
M_PAPER = ecg_paper_material()

def world_uv(o, tile, rot_grain=False):
    me = o.data; uv = (me.uv_layers[0] if me.uv_layers else me.uv_layers.new(name='UVMap')).data
    for poly in me.polygons:
        n = poly.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for li in poly.loop_indices:
            co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            if rot_grain: u, v = v, u
            uv[li].uv = (u / tile, v / tile)

def box(name, size, loc, m, grain=False, tile=1.2, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    if rot: o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=bool(rot)); o.data.materials.append(m)
    world_uv(o, tile, grain)
    return o

def cyl(name, r, depth, loc, m, rot=(0, 0, 0), verts=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m); return o

# ---------------- room ----------------
XW, Y0, Y1, H = 3.6, -5.0, 5.0, 5.0          # half width, front/back, ceiling height
box('Floor', (2 * XW, Y1 - Y0, 0.1), (0, (Y0 + Y1) / 2, -0.05), M_FLOOR, tile=3.0)
box('BackWall', (2 * XW, 0.15, H), (0, Y1 + 0.075, H / 2), M_WALL, tile=2.0)
box('WallR', (0.15, Y1 - Y0, H), (XW + 0.075, (Y0 + Y1) / 2, H / 2), M_WALL, tile=2.0)
box('Ceiling', (2 * XW, Y1 - Y0, 0.15), (0, (Y0 + Y1) / 2, H + 0.075), M_WALL, tile=2.0)
# left wall with three high windows (z 3.5–4.7), each with a frame and blinds that slice the sun
WIN = [(-3.8, 0.9), (-2.2, 0.9), (-0.6, 0.9), (1.0, 0.9), (2.6, 0.9), (3.95, 1.0)]   # (centre y, width): gaps between stacks + one above the reading nook (sun onto the ladder)
WZ0, WZ1 = 3.45, 4.7
edges = [Y0] + sum([[c - w / 2, c + w / 2] for c, w in WIN], []) + [Y1]
box('WallL_low', (0.15, Y1 - Y0, WZ0), (-XW - 0.075, (Y0 + Y1) / 2, WZ0 / 2), M_WALL, tile=2.0)
box('WallL_top', (0.15, Y1 - Y0, H - WZ1), (-XW - 0.075, (Y0 + Y1) / 2, (WZ1 + H) / 2), M_WALL, tile=2.0)
for a, b in zip(edges[0::2], edges[1::2]):
    box('WallL_pier', (0.15, b - a, WZ1 - WZ0), (-XW - 0.075, (a + b) / 2, (WZ0 + WZ1) / 2), M_WALL, tile=2.0)
SLATS = 20
for c, w in WIN:
    for dz in (WZ0, WZ1):
        box('WinSill', (0.22, w + 0.08, 0.05), (-XW + 0.03, c, dz), M_FRAME)
    for dy in (-w / 2, 0, w / 2):
        box('WinMullion', (0.08, 0.05, WZ1 - WZ0), (-XW + 0.0, c + dy, (WZ0 + WZ1) / 2), M_FRAME)
    for i in range(SLATS):
        z = WZ0 + 0.06 + i * (WZ1 - WZ0 - 0.1) / SLATS
        box('BlindSlat', (0.055, w - 0.04, 0.003), (-XW + 0.12, c, z), M_SLAT, rot=(math.radians(-35) * 0, math.radians(35), 0))
    box('BlindRail', (0.07, w, 0.04), (-XW + 0.12, c, WZ1 - 0.02), M_FRAME)
# ceiling beams across the aisle (foreground parallax while the camera descends)
for i, y in enumerate(np.linspace(-4.4, 4.0, 6)):
    box('Beam', (2 * XW, 0.2, 0.32), (0, y, H - 0.16), M_BEAM, grain=True)
    box('Purlin', (0.14, 1.4, 0.18), (0, y + 0.8, H - 0.09), M_BEAM, grain=True) if i < 5 else None

# ---------------- stacks ----------------
T = 0.03; SH = 4.2; SD = 0.25                  # board, stack height, half depth (double-sided)
SHELF_Z = [0.08 + i * 0.37 for i in range(11)]
STACK_Y = [-3.0, -1.4, 0.2, 1.8]
AX = 1.15                                      # aisle half width (stack ends at x = ±AX)
books_bm = bmesh.new(); counts = {'books': 0, 'boxes': 0, 'binders': 0, 'rolls': 0}

def add_box_to(bm_, cx, cy, cz, w, d, h, mi, rot_y=0.0, rot_z=0.0):
    geom = bmesh.ops.create_cube(bm_, size=1.0); verts = geom['verts']
    mtx = Matrix.Translation((cx, cy, cz)) @ Euler((0, rot_y, rot_z)).to_matrix().to_4x4() @ Matrix.Translation((0, 0, h / 2)) @ Matrix.Diagonal((w, d, h, 1))
    bmesh.ops.transform(bm_, matrix=mtx, verts=verts)
    for f in {f for v in verts for f in v.link_faces}: f.material_index = mi

N_BOOK = len(BOOK_MATS); MI_BOX, MI_BOX2, MI_LABEL, MI_PAPER, MI_BINDER = N_BOOK, N_BOOK + 1, N_BOOK + 2, N_BOOK + 3, N_BOOK + 4
M_BINDER = mat('binder', srgb('#2d3e4a'), 0.6)
rolls_bm = bmesh.new()

def fill_run(x0, x1, z, avail, face_y, dir_y):
    """Fill one shelf run along x at height z. Items sit against the stack's centre spine and face dir_y."""
    x = x0 + 0.01
    while x < x1 - 0.04:
        roll = rng.random(); room = x1 - x
        if roll < 0.06:
            x += rng.uniform(0.04, 0.12); continue
        if roll < 0.24 and room > 0.32 and avail > 0.27:       # archive boxes with a label
            n = rng.randint(1, 3)
            for _ in range(n):
                if x + 0.31 > x1: break
                bd = 0.2; cy = face_y + dir_y * (bd / 2 + 0.01)
                add_box_to(books_bm, x + 0.15, cy, z, 0.3, bd, 0.25, MI_BOX if rng.random() < .7 else MI_BOX2)
                add_box_to(books_bm, x + 0.15, cy + dir_y * (bd / 2 + 0.002), z + 0.08, 0.12, 0.004, 0.07, MI_LABEL)
                counts['boxes'] += 1; x += 0.31
            x += 0.01; continue
        if roll < 0.36 and room > 0.25:                         # binder row
            n = rng.randint(4, 9)
            for _ in range(n):
                w = 0.055
                if x + w > x1: break
                add_box_to(books_bm, x + w / 2, face_y + dir_y * 0.12, z, w, 0.22, min(avail - 0.03, 0.31), MI_BINDER, rot_z=rng.uniform(-.02, .02))
                counts['binders'] += 1; x += w + 0.002
            continue
        if roll < 0.46 and room > 0.25:                          # rolled ECG paper, stacked on their side
            n = rng.randint(3, 7); r = rng.uniform(0.035, 0.05)
            for k in range(n):
                cx = x + r + k * 2.05 * r
                if cx + r > x1: break
                g = bmesh.ops.create_circle(rolls_bm, cap_ends=True, radius=r, segments=14)
                vs = g['verts']; e = bmesh.ops.extrude_face_region(rolls_bm, geom=[f for f in rolls_bm.faces if all(v in vs for v in f.verts)])
                ev = [v for v in e['geom'] if isinstance(v, bmesh.types.BMVert)]
                bmesh.ops.translate(rolls_bm, vec=(0, 0, 0.21), verts=ev)
                bmesh.ops.transform(rolls_bm, matrix=Matrix.Translation((cx, face_y + dir_y * 0.015, z + r)) @ Euler((dir_y * -math.pi / 2, 0, 0)).to_matrix().to_4x4(), verts=vs + ev)
                counts['rolls'] += 1
            x += n * 2.05 * r + 0.02; continue
        run = rng.randint(5, 18); hbase = rng.uniform(0.2, min(0.31, avail - 0.03))
        for _ in range(run):
            w = rng.uniform(0.02, 0.05)
            if x + w > x1 - 0.01: break
            h = min(avail - 0.02, hbase * rng.uniform(0.85, 1.12)); d = rng.uniform(0.15, 0.21)
            add_box_to(books_bm, x + w / 2, face_y + dir_y * (d / 2 + 0.01), z, w, d, h, rng.choices(range(N_BOOK), weights=BOOK_W)[0])
            counts['books'] += 1; x += w + rng.uniform(0, 0.004)
        if rng.random() < 0.3 and x < x1 - 0.12:
            w = 0.03; h = min(avail - 0.05, 0.24); a = rng.uniform(0.18, 0.3)
            add_box_to(books_bm, x + w / 2 + math.sin(a) * h / 2, face_y + dir_y * 0.11, z, w, 0.18, h, rng.choices(range(N_BOOK), weights=BOOK_W)[0], rot_y=a * (1 if x > 0 else -1))
            x += w + math.sin(a) * h + 0.02

def stack(side, y):
    """Double-sided stack from the aisle (x = side·AX) to the wall, centred at depth y."""
    xa, xb = side * AX, side * (XW - 0.15)
    x0, x1 = min(xa, xb), max(xa, xb); L = x1 - x0
    box('StackSpine', (L, 0.02, SH), ((x0 + x1) / 2, y, SH / 2), M_WOOD, grain=True)
    box('StackEnd', (0.04, 2 * SD + 0.04, SH + 0.05), (xa, y, (SH + 0.05) / 2), M_WOOD, grain=True)
    box('StackTop', (L + 0.04, 2 * SD + 0.06, 0.05), ((x0 + x1) / 2, y, SH + 0.05), M_WOOD)
    for k in range(1, 3):
        box('StackUpright', (T, 2 * SD, SH), (x0 + L * k / 3, y, SH / 2), M_WOOD, grain=True)
    for z in SHELF_Z:
        box('StackShelf', (L, 2 * SD, T), ((x0 + x1) / 2, y, z), M_WOOD)
    for dir_y in (-1, 1):
        fy = y + dir_y * 0.012
        for zi, z in enumerate(SHELF_Z[:-1]):
            if rng.random() < 0.05: continue
            for k in range(3):
                fill_run(x0 + L * k / 3 + T, x0 + L * (k + 1) / 3 - T, z + T / 2, SHELF_Z[zi + 1] - z - T, fy, dir_y)
    # end-panel placard (blank record-range card)
    box('EndCard', (0.006, 0.16, 0.1), (xa - side * 0.024, y, 1.55), M_LABEL)

for y in STACK_Y:
    stack(-1, y); stack(1, y)
# back wall: full-height shelving (one-sided) with a brass rail for the ladder
BY = Y1 - 0.3
box('BackShelfBack', (2 * XW - 0.3, 0.02, 4.6), (0, BY + 0.29, 2.3), M_WOOD, grain=True)
for x in np.linspace(-XW + 0.15, XW - 0.15, 6):
    box('BackUpright', (T, 0.32, 4.6), (x, BY + 0.14, 2.3), M_WOOD, grain=True)
BACK_Z = [0.08 + i * 0.38 for i in range(12)]
for z in BACK_Z:
    box('BackShelf', (2 * XW - 0.3, 0.32, T), (0, BY + 0.14, z), M_WOOD)
xs = list(np.linspace(-XW + 0.15, XW - 0.15, 6))
for zi, z in enumerate(BACK_Z[:-1]):
    for a, b in zip(xs[:-1], xs[1:]):
        if a < -1.4 and z < 1.2: continue          # reading nook: no low shelves behind the desk
        fill_run(a + T, b - T, z + T / 2, BACK_Z[zi + 1] - z - T, BY + 0.28, -1)
cyl('LadderRail', 0.016, 2 * XW - 0.4, (0, BY - 0.08, 4.25), M_BRASS, rot=(0, math.radians(90), 0))

# ---------------- library ladder (the figure sits on it) ----------------
LAD_X, LAD_TOP, LAD_ANG = 0.55, 4.25, math.radians(14)
LAD_FOOT_Y = BY - 0.08 - LAD_TOP * math.tan(LAD_ANG)
def ladder():
    objs = []
    for dx in (-0.24, 0.24):
        o = box('LadderStile', (0.045, 0.07, LAD_TOP / math.cos(LAD_ANG) + 0.1), (LAD_X + dx, (LAD_FOOT_Y + BY - 0.08) / 2, LAD_TOP / 2), M_DARK, grain=True,
                rot=(-LAD_ANG, 0, 0)); objs.append(o)
    rungs = []
    for i in range(1, 15):
        z = i * 0.29
        if z > LAD_TOP - 0.1: break
        y = LAD_FOOT_Y + z * math.tan(LAD_ANG)
        o = box('LadderRung', (0.48, 0.09, 0.03), (LAD_X, y, z), M_DARK, grain=True); objs.append(o); rungs.append((z, y))
    for dx in (-0.24, 0.24):
        cyl('LadderWheel', 0.04, 0.03, (LAD_X + dx, LAD_FOOT_Y - 0.02, 0.04), M_BLACK, rot=(0, math.radians(90), 0))
        box('LadderHook', (0.03, 0.1, 0.06), (LAD_X + dx, BY - 0.08, LAD_TOP), M_BRASS)
    return rungs
RUNGS = ladder()

# ---------------- reading nook: desk, CRT computer, ECG cart, outlet, cable ----------------
def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))

def place(slug, x, y, z, target_h, rot=0.0):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'assets/source/ph-{slug}/{slug}_1k.gltf'))
    new = [o for o in bpy.data.objects if o not in before]; roots = [o for o in new if o.parent is None]
    bpy.context.view_layer.update(); lo, hi = world_bbox(new)
    s = target_h / max(hi.z - lo.z, 1e-4)
    for r in roots: r.scale = tuple(v * s for v in r.scale); r.rotation_euler.z += rot
    bpy.context.view_layer.update(); lo, hi = world_bbox(new); c = (lo + hi) / 2
    for r in roots: r.location += Vector((x - c.x, y - c.y, z - lo.z))
    for o in new: o['group'] = 'decor'                 # dense CC0 meshes → vertex-colour light
    bpy.context.view_layer.update(); return new

DESK = Vector((-2.35, 3.55, 0))
place('painted_wooden_table', DESK.x, DESK.y, 0, 0.76, rot=0)
place('wooden_stool_01', DESK.x + 0.1, DESK.y - 0.75, 0, 0.5)
# CRT monitor + computer (built; beige 1990s workstation)
mz = 0.77
box('PC_Case', (0.44, 0.42, 0.16), (DESK.x - 0.05, DESK.y + 0.05, mz + 0.08), M_BEIGE)
box('CRT_Body', (0.40, 0.38, 0.34), (DESK.x - 0.05, DESK.y + 0.12, mz + 0.16 + 0.17), M_BEIGE)
box('CRT_Back', (0.28, 0.2, 0.24), (DESK.x - 0.05, DESK.y + 0.38, mz + 0.16 + 0.16), M_BEIGE)
box('CRT_Screen', (0.32, 0.01, 0.25), (DESK.x - 0.05, DESK.y - 0.075, mz + 0.16 + 0.18), M_SCREEN)
box('Keyboard', (0.44, 0.15, 0.03), (DESK.x - 0.05, DESK.y - 0.28, mz + 0.015), M_BEIGE, rot=(math.radians(4), 0, 0))
place('desk_lamp_arm_01', DESK.x + 0.45, DESK.y + 0.15, mz, 0.45, rot=math.radians(200))
place('binder_notebook', DESK.x + 0.35, DESK.y - 0.2, mz, 0.04, rot=math.radians(20))
# ECG cart beside the desk: device box on a steel trolley, blank paper strip (no trace)
CART = Vector((-1.5, 3.9, 0))
for dx in (-0.2, 0.2):
    for dy in (-0.15, 0.15):
        box('CartLeg', (0.02, 0.02, 0.8), (CART.x + dx, CART.y + dy, 0.4), M_STEEL)
        cyl('CartWheel', 0.03, 0.02, (CART.x + dx, CART.y + dy, 0.03), M_BLACK, rot=(0, math.radians(90), 0))
box('CartTray', (0.46, 0.36, 0.02), (CART.x, CART.y, 0.8), M_STEEL)
box('CartShelf', (0.46, 0.36, 0.02), (CART.x, CART.y, 0.25), M_STEEL)
box('ECG_Device', (0.40, 0.30, 0.12), (CART.x, CART.y, 0.87), M_BEIGE)
box('ECG_PaperOut', (0.2, 0.18, 0.002), (CART.x - 0.02, CART.y - 0.24, 0.88), M_PAPER, rot=(math.radians(-25), 0, 0))
# wall outlet on the back-wall plinth below the desk, cable across the floor to the computer
OUT = Vector((-1.95, BY + 0.27, 0.32))
box('OutletPlate', (0.08, 0.012, 0.12), OUT, M_OUTLET)
for dx in (-0.012, 0.012):
    cyl('OutletHole', 0.004, 0.02, OUT + Vector((dx, -0.005, 0.02)), M_BLACK, rot=(math.radians(90), 0, 0), verts=8)
box('Plug', (0.04, 0.035, 0.04), OUT + Vector((0, -0.03, 0.02)), M_BLACK)
cpts = [OUT + Vector((0, -0.05, 0.02)), Vector((OUT.x, OUT.y - 0.15, 0.01)), Vector((OUT.x - 0.25, BY - 0.25, 0.01)),
        Vector((DESK.x + 0.15, DESK.y + 0.2, 0.01)), Vector((DESK.x - 0.05, DESK.y + 0.3, 0.4)), Vector((DESK.x - 0.05, DESK.y + 0.27, mz + 0.06))]
cu = bpy.data.curves.new('cable', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.006; cu.bevel_resolution = 2
sp = cu.splines.new('POLY'); sp.points.add(len(cpts) - 1)
for p, v in zip(sp.points, cpts): p.co = (*v, 1)
sp.type = 'NURBS'; sp.order_u = 3; sp.use_endpoint_u = True
co = bpy.data.objects.new('PowerCable', cu); scene.collection.objects.link(co); cu.materials.append(M_CABLE)
# floor clutter that makes the aisle lived-in (kept off the camera path x ∈ [−0.6, 0.6])
place('cardboard_box_01', -0.95, -2.2, 0, 0.32, rot=0.3)
place('cardboard_box_01', -0.92, -2.15, 0.32, 0.26, rot=-0.2)
place('wooden_crate_01', 0.95, 0.9, 0, 0.36, rot=1.2)
place('vintage_suitcase', 0.9, -0.6, 0, 0.18, rot=1.5)
place('drawer_cabinet', 3.0, 3.6, 0, 1.1, rot=math.radians(180))
place('vintage_wooden_drawer_01', -3.0, 4.2, 0.77, 0.3, rot=0)
place('power_box_01', -2.6, BY + 0.25, 1.6, 0.35, rot=math.radians(180))
for y in (-1.8, 1.3):
    place('hanging_industrial_lamp', 0, y, H - 1.4, 1.4)

books = bpy.data.meshes.new('Shelved'); books_bm.to_mesh(books); books_bm.free()
for m in BOOK_MATS + [M_BOX, M_BOX2, M_LABEL, M_PAPER, M_BINDER]: books.materials.append(m)
bo = bpy.data.objects.new('Shelved', books); scene.collection.objects.link(bo)
rolls = bpy.data.meshes.new('Rolls'); rolls_bm.to_mesh(rolls); rolls_bm.free(); rolls.materials.append(M_PAPER)
ro = bpy.data.objects.new('Rolls', rolls); scene.collection.objects.link(ro)
print('counts', counts, 'shelved faces', len(books.polygons), 'rolls faces', len(rolls.polygons))

# ---------------- figure on the ladder (stills: ring look approximated with emissive Z bands; web uses its shader) ----
FIG = None
import json
A = os.path.join(ROOT, 'prototype/v2/src/story/intro/assets')
fig_path = os.path.join(A, 'body_seated.glb')
if os.path.exists(fig_path):
    fj = json.load(open(os.path.join(A, 'figure.json'), encoding='utf-8'))['seated']
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=fig_path)
    FIG = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
    rz, ry = RUNGS[4]                                            # 5th rung, 1.45 m
    seat = Vector(fj['seat'])
    FIG.location = (LAD_X - 0.0 - (seat.x + 0.08), ry - 0.06 - seat.y, rz + 0.015 - seat.z)
    rm = bpy.data.materials.new('rings'); rm.use_nodes = True; nt = rm.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (1.0, .9, .78, 1); em.inputs['Strength'].default_value = 4.0
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY'; mth.inputs[1].default_value = 42
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'PINGPONG'; fr.inputs[1].default_value = .5
    lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .07
    nt.links.new(tc.outputs['Object'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], mth.inputs[0])
    nt.links.new(mth.outputs[0], fr.inputs[0]); nt.links.new(fr.outputs[0], lt.inputs[0])
    nt.links.new(lt.outputs[0], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    FIG.data.materials.clear(); FIG.data.materials.append(rm)
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(A, 'heart.glb'))
    HEART = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
    HEART.rotation_mode = 'QUATERNION'; HEART.rotation_quaternion = fj['heart_q_wxyz']
    HEART.location = FIG.location + Vector(fj['heart_b'])
    hm2 = mat('heart_glow', srgb('#ff5a64'), .5, emit=6.0); HEART.data.materials.clear(); HEART.data.materials.append(hm2)
    print('figure seat at', tuple(round(v, 3) for v in FIG.location), 'heart', tuple(round(v, 3) for v in HEART.location))

# ---------------- light: sun through the blinds + dim sky + warm lamp bulbs ----------------
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 11.0; sun.angle = math.radians(1.2); sun.color = srgb('#ffd9a8')
so = bpy.data.objects.new('sun', sun); scene.collection.objects.link(so)
SUN_TO = Vector((0.85, 0.06, -0.50)).normalized()   # across the gaps between stacks and over the nook onto the ladder and figure
so.rotation_euler = SUN_TO.to_track_quat('-Z', 'Y').to_euler()
w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('#7d96c4'), 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.7   # cool sky fill vs warm sun
for y in (-1.8, 1.3):
    L = bpy.data.lights.new('bulb', 'POINT'); L.energy = 60; L.color = srgb('#ffb36b'); L.shadow_soft_size = 0.05
    lo_ = bpy.data.objects.new('bulb', L); lo_.location = (0, y, H - 1.45); scene.collection.objects.link(lo_)
# preview-only haze so the beams read in stills (the web uses ray-marched shafts instead)
hz = box('Haze', (2 * XW - 0.1, Y1 - Y0 - 0.1, H - 0.1), (0, (Y0 + Y1) / 2, H / 2), mat('haze_dummy', (1, 1, 1)))
hm = bpy.data.materials.new('haze'); hm.use_nodes = True; nt = hm.node_tree
nt.nodes.remove(nt.nodes['Principled BSDF']); vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = 0.022
nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume']); hz.data.materials.clear(); hz.data.materials.append(hm)

# ---------------- preview shots (SPACE-R1-ARCHIVE §3–4) ----------------
SHOTS = {
    's1_top':     ((0.0, -3.8, 4.75), (0.0, 1.2, 0.0), 24),     # just under the roof, looking down the aisle
    's2_beams':   ((0.0, -4.6, 3.3), (0.2, 3.0, 1.2), 22),     # below the beams, beams in the foreground
    's3_aisle':   ((0.0, -3.2, 1.9), (0.5, 4.2, 1.6), 30),     # walking the aisle, stack ends pass
    's4_person':  ((0.25, 1.2, 1.95), (0.5, 3.9, 1.85), 40),    # medium on the seated figure
    's5_crane':   ((0.9, 0.6, 3.5), (-1.0, 4.1, 0.8), 34),     # Story PLI: outlet, cable, desk, ladder + figure in one frame
    's6_grip':    ((-0.55, 2.75, 1.05), (0.25, 3.85, 1.55), 45),  # Story MA: low angle at the hand on the stile
}
if FIG is not None:
    HR = FIG.location + Vector(fj['hand_r'])
    SHOTS['s6_grip'] = (tuple(HR + Vector((-0.75, -0.95, -0.35))), tuple(HR + Vector((0.05, 0.1, 0.25))), 38)
if args.save:
    bpy.ops.wm.save_as_mainfile(filepath=args.save)
if args.preview:
    os.makedirs(args.preview, exist_ok=True)
    rx, ry = map(int, args.res.split('x'))
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = args.samples; scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = rx, ry; scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = 0.8
    scene.cycles.max_bounces = 4; scene.cycles.volume_bounces = 0
    want = set(args.shots.split(',')) if args.shots else set(SHOTS)
    for name, (loc, tgt, fov) in SHOTS.items():
        if name not in want: continue
        cd = bpy.data.cameras.new(name); cd.angle = math.radians(fov * 16 / 9) if False else math.radians(fov)
        cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov)
        c = bpy.data.objects.new(name, cd); c.location = loc; scene.collection.objects.link(c)
        c.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        scene.camera = c; scene.render.filepath = os.path.join(args.preview, name + '.png')
        bpy.ops.render.render(write_still=True)
        print('rendered', name)

# ---------------- bake + web export (attic method: albedo-free direct + indirect light, sqrt-encoded) ----------------
if args.bake:
    import json, time
    OUT = os.path.join(ROOT, args.bake); os.makedirs(OUT, exist_ok=True)
    # the figure, heart and preview haze are not part of the baked room (the figure is light, it casts no shadow)
    FIG_LOC = FIG.location.copy() if FIG is not None else None
    for o in [x for x in (FIG, globals().get('HEART'), hz) if x is not None]:
        bpy.data.objects.remove(o, do_unlink=True)
    for o in [x for x in scene.objects if x.type == 'CURVE']:          # cable → mesh
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.convert(target='MESH')
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
    scene.cycles.max_bounces = 6; scene.cycles.diffuse_bounces = 4; scene.cycles.glossy_bounces = 1; scene.cycles.transparent_max_bounces = 8
    meshes = [o for o in scene.objects if o.type == 'MESH']
    for o in meshes:
        if o.name in ('Shelved', 'Rolls'): o['group'] = 'books'
        r = o
        while r.parent is not None and not o.get('group'):
            r = r.parent
            if r.get('group'): o['group'] = r['group']
    for o in meshes:
        if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
        else: o.data.uv_layers[0].name = 'UVMap'
        while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[-1])
    buckets = {'shell': [], 'books': [], 'decor': []}
    for o in meshes: buckets[o.get('group', 'shell')].append(o)
    print('buckets', {k: len(v) for k, v in buckets.items()}, flush=True)

    def join(name, objs, lm=True):
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.join()
        o = bpy.context.active_object; o.name = name
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        if lm:
            l = o.data.uv_layers.new(name='Lightmap'); o.data.uv_layers.active = l
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
            bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
            bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.average_islands_scale()
            bpy.ops.uv.pack_islands(rotate=True, margin=0.0008 if 'books' in name else 0.0015, shape_method='AABB' if 'books' in name else 'CONCAVE')
            bpy.ops.object.mode_set(mode='OBJECT')
        return o
    groups = {}
    for g, objs in buckets.items():
        if not objs: continue
        if g == 'decor':
            o = join('Archive_decor', objs, lm=False)
            for a in list(o.data.color_attributes): o.data.color_attributes.remove(a)
            ca = o.data.color_attributes.new('Light', 'FLOAT_COLOR', 'CORNER'); o.data.color_attributes.active_color = ca
        else:
            o = join('Archive_' + g, objs)
        groups[g] = o
        print('[group]', g, 'faces', len(o.data.polygons), flush=True)

    LM_SCALE = 4.0
    man = {'lm_scale': LM_SCALE, 'encoding': 'png sqrt(linear / lm_scale), albedo-free full lighting (direct + indirect)', 'size': args.size,
           'samples': args.bsamples, 'groups': {}, 'timing_s': {}, 'counts': counts}
    bake = scene.render.bake; bake.margin = 8; bake.use_clear = True; scene.cycles.samples = args.bsamples
    for g, o in groups.items():
        t0 = time.time()
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        if g == 'decor':
            bake.target = 'VERTEX_COLORS'; bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}); bake.target = 'IMAGE_TEXTURES'
            ca = o.data.color_attributes['Light']; n = len(ca.data); v = np.empty(n * 4, np.float32); ca.data.foreach_get('color', v); v = v.reshape(-1, 4)
            v[:, :3] = np.sqrt(np.clip(v[:, :3] / LM_SCALE, 0, 1)); v[:, 3] = 1; ca.data.foreach_set('color', v.ravel())
            man['groups'][g] = {'object': o.name, 'vertex_color': 'COLOR_0 = sqrt(light / lm_scale)'}
        else:
            sz = args.size; name = f'light_{g}.png'
            img = bpy.data.images.new(name, sz, sz, alpha=False, float_buffer=True); img.colorspace_settings.name = 'Non-Color'
            for m in o.data.materials:
                nt = m.node_tree
                tn = nt.nodes.new('ShaderNodeTexImage'); tn.name = 'BakeTarget'; tn.image = img
                uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'BakeUV'; uvn.uv_map = 'Lightmap'; nt.links.new(uvn.outputs['UV'], tn.inputs['Vector']); nt.nodes.active = tn
            bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'})
            px = np.empty(sz * sz * 4, np.float32); img.pixels.foreach_get(px); rgb = px.reshape(-1, 4)[:, :3]
            enc = np.sqrt(np.clip(rgb / LM_SCALE, 0, 1))
            out = bpy.data.images.new(name + '_o', sz, sz, alpha=False); out.colorspace_settings.name = 'Non-Color'
            out.pixels.foreach_set(np.concatenate([enc, np.ones((enc.shape[0], 1), np.float32)], axis=1).ravel())
            out.filepath_raw = os.path.join(OUT, name); out.file_format = 'PNG'; out.save(); bpy.data.images.remove(out); bpy.data.images.remove(img)
            for m in o.data.materials:
                for nd in [nd for nd in m.node_tree.nodes if nd.name in ('BakeTarget', 'BakeUV')]: m.node_tree.nodes.remove(nd)
            man['groups'][g] = {'object': o.name, 'file': name}
        man['timing_s'][g] = round(time.time() - t0, 1); print('baked', g, man['timing_s'][g], 's', flush=True)
    bpy.data.objects.remove(so)
    for o in [x for x in scene.objects if x.type in ('LIGHT', 'CAMERA')]: bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'archive.glb'), export_format='GLB', export_cameras=False, export_lights=False,
                              export_texcoords=True, export_normals=True, export_image_format='AUTO', export_vertex_color='ACTIVE', export_all_vertex_colors=False)
    b2t = lambda v: [round(float(v[0]), 4), round(float(v[2]), 4), round(float(-v[1]), 4)]
    man['sun'] = {'to_dir': b2t(SUN_TO), 'color': list(sun.color), 'energy': sun.energy}
    man['shots'] = {k: {'pos': b2t(p), 'look': b2t(t), 'fov_v_deg': f} for k, (p, t, f) in SHOTS.items()}
    man['room'] = {'min': b2t((-XW, Y1, 0)), 'max': b2t((XW, Y0, H))}
    if FIG_LOC is not None:
        man['figure'] = {'location': b2t(FIG_LOC), 'heart': b2t(FIG_LOC + Vector(fj['heart_b'])),
                         'heart_q_wxyz_blender': fj['heart_q_wxyz'], 'hand_r': b2t(FIG_LOC + Vector(fj['hand_r']))}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), indent=1)
    print('exported', OUT)
