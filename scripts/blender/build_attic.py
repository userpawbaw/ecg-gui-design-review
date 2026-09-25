"""Attic bookshelf study after REF-002 EFX-002-03 (headless Blender via the `bpy` wheel).

A built-in light-wood bookcase wall under a sloped attic ceiling with a skylight, filled with procedurally generated
books (pastel palette), a leaning library ladder on a rail, generated cut-out prints and Poly Haven CC0 props.
Lighting (sun through the skylight + sky + bounces) is fully baked into albedo-free lightmaps, like the reference.

    python3 scripts/blender/build_attic.py --out prototype/spikes/attic/public/scene --size 2048 --samples 512
    python3 scripts/blender/build_attic.py --out <dir> --preview        # quick Cycles still from the camera

Outputs: attic.glb, light_<group>.png (sqrt-encoded, lm_scale 4), manifest.json (sun, camera path, groups, stats).
Prints are original generative images (not copies of the reference's art).
"""
import argparse, json, math, os, random, sys, time
import bpy, bmesh, numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='prototype/spikes/attic/public/scene')
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--samples', type=int, default=512)
ap.add_argument('--preview', action='store_true')
ap.add_argument('--preview-samples', type=int, default=64)
ap.add_argument('--uv-only', action='store_true')
ap.add_argument('--no-denoise', action='store_true')
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--groups', default='shell,books,props,decor', help='groups to (re)bake; others keep their existing light_<g>.png in --out')
ap.add_argument('--books-margin', type=float, default=0.0008, help='UV pack margin for the books atlas (others 0.0015)')
ap.add_argument('--group-samples', default='', help='per-group samples, e.g. books=400')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
OUT = os.path.join(ROOT, args.out); os.makedirs(OUT, exist_ok=True)
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

def mat(name, rgb, rough=0.7, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    return m

def srgb(h):  # '#rrggbb' → linear rgb
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

M_WOOD = ph_material('ash_veneer', name='ash_wood')
M_DARK = ph_material('walnut_veneer', name='walnut_ladder')
M_WALL = ph_material('painted_plaster_wall', '1k', name='plaster')
M_FLOOR = ph_material('herringbone_parquet', '1k', name='parquet')
M_BRASS = mat('brass_rail', srgb('#b89a62'), 0.35); M_BRASS.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 1.0
M_KNOB = mat('knob', srgb('#3a2e26'), 0.4)
M_WHITE = mat('plaster_white', srgb('#efece6'), 0.55)
M_GLASS = mat('skylight_frame', srgb('#dcd8d0'), 0.5)
PALETTE = [('#e59a80', 5), ('#d4836a', 4), ('#f0b39c', 3), ('#a9c4cf', 4), ('#c3d6dc', 3), ('#8fb0bd', 2),
           ('#efe6d6', 4), ('#e3d3bc', 3), ('#c9a57e', 3), ('#b77e56', 2), ('#8a5a3c', 1), ('#d9c28f', 2), ('#6f8f86', 1)]
BOOK_MATS = [mat(f'book_{i}', srgb(h), 0.72) for i, (h, _) in enumerate(PALETTE)]
BOOK_W = [w for _, w in PALETTE]

def world_uv(o, tile, rot_grain=False):
    """box-mapped texture UV in metres / tile (layer 0)."""
    me = o.data; uv = (me.uv_layers[0] if me.uv_layers else me.uv_layers.new(name='UVMap')).data
    for poly in me.polygons:
        n = poly.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for li in poly.loop_indices:
            co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            if rot_grain: u, v = v, u
            uv[li].uv = (u / tile, v / tile)

def box(name, size, loc, m, grain=False, tile=1.2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m)
    world_uv(o, tile, grain)
    return o

# ---------------- room: floor, walls, sloped ceiling with a skylight ----------------
# frame: x across (−2.25…2.25), y depth (bookcase front y=0, back panel y=0.38, room towards −y), z up
W, BACK, D = 2.25, 0.40, 3.6
box('Floor', (2 * W + 0.3, D + 0.9, 0.1), (0, BACK - (D + 0.9) / 2 + 0.15, -0.05), M_FLOOR, tile=3.4)
box('BackWall', (2 * W + 0.3, 0.12, 4.6), (0, BACK + 0.06, 2.3), M_WALL, tile=2.0)
box('WallL', (0.12, D + 0.9, 4.8), (-W - 0.06, BACK - (D + 0.9) / 2, 2.4), M_WALL, tile=2.0)
box('WallR', (0.12, D + 0.9, 4.8), (W + 0.06, BACK - (D + 0.9) / 2, 2.4), M_WALL, tile=2.0)
box('WallFront', (2 * W + 0.3, 0.12, 4.8), (0, BACK - D - 0.5, 2.4), M_WALL, tile=2.0)
# ceiling slab tilted: 3.45 m at the bookcase, rising towards the room; skylight cut out
slope = math.radians(24); c_len = D + 1.0
bpy.ops.mesh.primitive_cube_add(size=1)
ceil = bpy.context.active_object; ceil.name = 'Ceiling'; ceil.scale = (2 * W + 0.3, c_len, 0.12); bpy.ops.object.transform_apply(scale=True)
ceil.rotation_euler = (-slope, 0, 0); ceil.location = (0, BACK - c_len / 2 * math.cos(slope), 3.45 + c_len / 2 * math.sin(slope))
bpy.ops.object.transform_apply(location=True, rotation=True)
sky_cut_center = Vector((0.95, -1.85, 0)); sky_cut_center.z = 3.45 + (BACK - sky_cut_center.y) * math.tan(slope)
bpy.ops.mesh.primitive_cube_add(size=1, location=sky_cut_center)
cut = bpy.context.active_object; cut.scale = (1.7, 1.4, 1.2); cut.rotation_euler = (-slope, 0, 0)
mod = ceil.modifiers.new('sky', 'BOOLEAN'); mod.object = cut; mod.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = ceil; bpy.ops.object.modifier_apply(modifier='sky'); bpy.data.objects.remove(cut)
ceil.data.materials.append(M_WHITE); world_uv(ceil, 2.0)
# skylight lining (short frame boxes around the opening)
for dx, sx in ((-0.86, 0.04), (0.86, 0.04)):
    box('SkyFrame', (sx, 1.4, 0.22), sky_cut_center + Vector((dx, 0, 0.0)), M_GLASS).rotation_euler = (-slope, 0, 0)

# ---------------- bookcase ----------------
T, DEP = 0.042, 0.36            # board thickness, shelf depth
bays = [(-2.1, -0.7), (-0.7, 0.7), (0.7, 2.1)]
TOP = 2.95                      # top of the open shelving; cabinet band above
box('Plinth', (4.2 + T, DEP, 0.10), (0, DEP / 2, 0.05), M_WOOD)
box('BackPanel', (4.2 + T, 0.02, 3.4), (0, DEP + 0.01, 1.7), M_WOOD, grain=True)
for x in (-2.1, -0.7, 0.7, 2.1):
    box('Upright', (T, DEP + 0.02, 3.42), (x, DEP / 2 - 0.01, 1.71), M_WOOD, grain=True)
box('UprightL2', (T * 0.8, DEP, TOP - 1.25), (-1.62, DEP / 2, 1.25 + (TOP - 1.25) / 2), M_WOOD, grain=True)   # narrow column, upper left
box('CorniceTop', (4.2 + T + 0.08, DEP + 0.06, 0.06), (0, DEP / 2 - 0.02, 3.42), M_WOOD)
# upper cabinet band: doors with knobs
box('CabinetShelf', (4.2 + T, DEP, T), (0, DEP / 2, TOP), M_WOOD)
for (x0, x1) in bays:
    for k in (0, 1):
        a, b = (x0 + (x1 - x0) * k / 2, x0 + (x1 - x0) * (k + 1) / 2)
        box('CabinetDoor', (b - a - 0.012, 0.022, 0.40), ((a + b) / 2, -0.012, TOP + 0.22), M_WOOD, grain=True)
        box('DoorPanel', (b - a - 0.12, 0.012, 0.28), ((a + b) / 2, -0.028, TOP + 0.22), M_WOOD, grain=True)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, location=((a + b) / 2, -0.045, TOP + 0.12), segments=12, ring_count=8)
        o = bpy.context.active_object; o.name = 'Knob'; o.data.materials.append(M_KNOB)

# shelves per bay (heights in m); the middle bay keeps an open niche for a print; the right bay has drawers
SHELVES = {0: [0.10, 0.52, 0.93, 1.30, 1.66, 2.02, 2.46], 1: [0.10, 0.52, 0.93, 1.30, 1.66, 2.46], 2: [1.30, 1.66, 2.02, 2.46]}
for bi, zs in SHELVES.items():
    x0, x1 = bays[bi]
    for z in zs:
        if z <= 0.11: continue
        box('Shelf', (x1 - x0 - T, DEP, T * 0.8), ((x0 + x1) / 2, DEP / 2, z), M_WOOD)
        box('ShelfLip', (x1 - x0 - T, 0.018, T * 1.2), ((x0 + x1) / 2, 0.006, z - 0.004), M_WOOD)
# right bay: drawers (2 columns × 3) with a small open niche on the right of the lower half
x0, x1 = bays[2]; xm = x0 + (x1 - x0) * 0.62
box('DrawerDivider', (T * 0.8, DEP, 1.2), (xm, DEP / 2, 0.70), M_WOOD, grain=True)
for r in range(3):
    zc = 0.10 + 0.2 + r * 0.40
    box('Drawer', (xm - x0 - T - 0.01, 0.024, 0.37), ((x0 + xm) / 2, -0.010, zc + 0.03), M_WOOD, grain=True)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.017, location=((x0 + xm) / 2, -0.035, zc + 0.03), segments=12, ring_count=8)
    o = bpy.context.active_object; o.name = 'Knob'; o.data.materials.append(M_KNOB)
box('NicheShelf', (x1 - xm - T, DEP, T * 0.8), ((xm + x1) / 2, DEP / 2, 0.70), M_WOOD)
# library rail on the cornice
bpy.ops.mesh.primitive_cylinder_add(radius=0.014, depth=4.25, location=(0, -0.10, 2.90), rotation=(0, math.radians(90), 0), vertices=16)
o = bpy.context.active_object; o.name = 'Rail'; o.data.materials.append(M_BRASS)
for x in (-2.0, -0.7, 0.7, 2.0):
    box('RailBracket', (0.02, 0.10, 0.02), (x, -0.05, 2.90), M_BRASS)

# ---------------- books (one mesh, material per colour) ----------------
def pick_mat():
    return rng.choices(range(len(BOOK_MATS)), weights=BOOK_W)[0]

books_bm = bmesh.new(); book_count = 0
def add_book(cx, cy, cz, w, d, h, rot_y=0.0, rot_z=0.0, mi=None):
    """box centred at (cx, cy) with bottom at cz; rot_y leans it sideways (around its bottom edge)."""
    global book_count
    geom = bmesh.ops.create_cube(books_bm, size=1.0)
    verts = geom['verts']
    mtx = Matrix.Translation((cx, cy, cz)) @ Euler((0, rot_y, rot_z)).to_matrix().to_4x4() @ Matrix.Translation((0, 0, h / 2)) @ Matrix.Diagonal((w, d, h, 1))
    bmesh.ops.transform(books_bm, matrix=mtx, verts=verts)
    m = pick_mat() if mi is None else mi
    for f in {f for v in verts for f in v.link_faces}: f.material_index = m
    book_count += 1

reserved = []   # (bay, z, x0, x1) spans kept free for props
def fill_shelf(x0, x1, z, avail, bay, allow_stack=True):
    x = x0 + 0.01
    while x < x1 - 0.03:
        if any(r[1] == z and r[2] - 0.01 <= x <= r[3] for r in reserved):
            x = next(r[3] for r in reserved if r[1] == z and r[2] - 0.01 <= x <= r[3]) + 0.01; continue
        roll = rng.random()
        room = min(x1 - x, *[r[2] - x for r in reserved if r[1] == z and r[2] > x] or [9])
        if roll < 0.07:                         # gap
            x += rng.uniform(0.04, 0.14); continue
        if roll < 0.17 and allow_stack and room > 0.3:   # horizontal stack
            n = rng.randint(3, 6); zz = z; w = rng.uniform(0.18, 0.26)
            for _ in range(n):
                t = rng.uniform(0.022, 0.04); add_book(x + w / 2, DEP - 0.03 - rng.uniform(0.07, 0.1), zz, w, rng.uniform(0.13, 0.18), t, rot_z=rng.uniform(-0.08, 0.08)); zz += t
                if zz > z + avail - 0.05: break
            x += w + 0.02; continue
        run = rng.randint(4, 16); hbase = rng.uniform(0.17, min(0.30, avail - 0.03))
        for i in range(run):
            w = rng.uniform(0.018, 0.045)
            if x + w > x1 - 0.01 or w > room: break
            h = min(avail - 0.02, hbase * rng.uniform(0.86, 1.1)); d = rng.uniform(0.15, 0.22)
            add_book(x + w / 2, DEP - 0.02 - d / 2, z, w, d, h); x += w + rng.uniform(0.0, 0.004)
            room -= w
        if rng.random() < 0.35 and x < x1 - 0.12:   # leaning book at the end of a run
            w = rng.uniform(0.02, 0.035); h = min(avail - 0.05, rng.uniform(0.18, 0.26)); ang = rng.uniform(0.18, 0.32)
            add_book(x + w / 2 + math.sin(ang) * h / 2, DEP - 0.12, z, w, rng.uniform(0.15, 0.2), h, rot_y=ang); x += w + math.sin(ang) * h + 0.02

# ---------------- props (Poly Haven CC0), auto-fitted to a target height ----------------
def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))

prop_log = []
def place(slug, x, z, target_h, bay, y=None, rot=0.0, reserve=True):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'assets/source/ph-{slug}/{slug}_1k.gltf'))
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    bpy.context.view_layer.update(); lo, hi = world_bbox(new)
    s = target_h / max(hi.z - lo.z, 1e-4)
    for r in roots:
        r.scale = tuple(v * s for v in r.scale); r.rotation_euler.z += rot
    bpy.context.view_layer.update(); lo, hi = world_bbox(new)
    c = (lo + hi) / 2; yy = DEP * 0.55 if y is None else y
    for r in roots: r.location += Vector((x - c.x, yy - c.y, z - lo.z))
    bpy.context.view_layer.update(); lo, hi = world_bbox(new)
    for o in new: o['group'] = 'decor'          # dense CC0 meshes → vertex-colour lighting
    if reserve: reserved.append((bay, z, lo.x - 0.03, hi.x + 0.03))
    prop_log.append({'slug': slug, 'size_m': [round(v, 3) for v in (hi - lo)], 'at': [round(x, 2), round(z, 2)]})
    return new

# decor spots (bay, shelf z, x, height) — sculptures, vases and clocks break up the book rows like the reference
S = lambda b, i: SHELVES[b][i] + T * 0.4
place('marble_bust_01', 1.72, S(2, 2), 0.26, 2)
place('ceramic_vase_02', -1.35, S(0, 5), 0.24, 0)
place('ceramic_vase_01', 0.25, S(1, 2), 0.30, 1)
place('jug_01', -1.95, S(0, 3), 0.16, 0)
place('potted_plant_04', 1.1, S(2, 0), 0.20, 2)
place('mantel_clock_01', -1.15, S(0, 4), 0.19, 0, rot=math.radians(180))
place('horse_statue_01', 1.55, S(2, 3), 0.20, 2, rot=math.radians(200))
place('lambis_shell', -0.45, S(1, 1), 0.07, 1, rot=math.radians(30))
place('seadogs_compass', -1.0, S(0, 2), 0.07, 0)
place('wooden_bowl_01', 0.45, S(1, 3), 0.09, 1)
place('brass_candleholders', -1.95, S(0, 6), 0.22, 0)
place('carved_wooden_elephant', 1.25, S(2, 3), 0.14, 2, rot=math.radians(160))
place('round_spectacles', -0.35, S(1, 3), 0.04, 1, y=DEP * 0.3)
place('alarm_clock_01', 1.92, S(2, 1), 0.13, 2, rot=math.radians(190))
place('ceramic_vase_04', 1.95, 0.70 + T * 0.4, 0.22, 2)
place('book_encyclopedia_set_01', -1.1, S(0, 1), 0.27, 0, rot=math.radians(180))
place('potted_plant_02', 1.6, 3.42 + 0.03, 0.55, 3, y=DEP * 0.45, reserve=False)          # plant on top of the cornice
place('ceramic_vase_01', -1.7, 3.42 + 0.03, 0.34, 3, y=DEP * 0.45, reserve=False)

# white geometric sculpture (three rotated cubes), like the reference's small white object
for i, (dx, dz, r) in enumerate(((0.0, 0.0, 12), (0.06, 0.05, 40), (-0.03, 0.09, 65))):
    bpy.ops.mesh.primitive_cube_add(size=0.085, location=(-0.62 + dx, DEP * 0.5, S(1, 3) + 0.045 + dz), rotation=(math.radians(r), math.radians(r * 0.7), math.radians(r * 0.4)))
    o = bpy.context.active_object; o.name = 'Sculpt'; o.data.materials.append(M_WHITE); o['group'] = 'props'
reserved.append((1, S(1, 3), -0.72, -0.5))

# ---------------- generated cut-out prints (original, Matisse-like vocabulary) ----------------
def make_print(name, w_px, h_px, seed):
    r = random.Random(seed); img = np.zeros((h_px, w_px, 4), np.float32); img[..., 3] = 1
    bgc = r.choice(['#f2c26b', '#efd9b6', '#f0a36b']); img[..., :3] = srgb(bgc)
    yy, xx = np.mgrid[0:h_px, 0:w_px] / max(w_px, h_px)
    def blob(cx, cy, rx, ry, rot, col, wobble=0.25, lobes=5):
        ang = np.arctan2(yy - cy, xx - cx) - rot; rad = np.hypot((xx - cx), (yy - cy))
        edge = (1 + wobble * np.sin(ang * lobes + r.random() * 6)) * np.hypot(rx * np.cos(ang), ry * np.sin(ang)) / 1.4
        img[rad < edge, :3] = srgb(col)
    for _ in range(r.randint(3, 5)):   # leaves
        blob(r.uniform(.1, .9) * w_px / max(w_px, h_px), r.uniform(.1, .7) * h_px / max(w_px, h_px), r.uniform(.05, .09), r.uniform(.14, .22), r.uniform(-1, 1), r.choice(['#2f6b3b', '#3f7d4a', '#1f4f33']), 0.35, 7)
    for _ in range(r.randint(2, 4)):   # flowers
        blob(r.uniform(.2, .8) * w_px / max(w_px, h_px), r.uniform(.1, .5) * h_px / max(w_px, h_px), r.uniform(.05, .08), r.uniform(.05, .08), 0, r.choice(['#e0562e', '#f07a3c', '#c8391f']), 0.4, 6)
    blob(0.5 * w_px / max(w_px, h_px), 0.72 * h_px / max(w_px, h_px), 0.26, 0.09, 0, '#1d2f6b', 0.05, 2)   # bowl
    im = bpy.data.images.new(name, w_px, h_px, alpha=False); im.pixels.foreach_set(np.flipud(img).ravel())
    im.filepath_raw = os.path.join(OUT, name + '.png'); im.file_format = 'PNG'; im.save()
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = im; nt.links.new(tex.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.8
    return m

def framed(name, cx, cz, w, h, seed, y=DEP - 0.005, tilt=0.0, group='props'):
    fm = make_print(name, 512, int(512 * h / w), seed)
    box('FrameT', (w + 0.05, 0.025, 0.025), (cx, y - 0.013, cz + h / 2 + 0.012), M_DARK)['group'] = group
    box('FrameB', (w + 0.05, 0.025, 0.025), (cx, y - 0.013, cz - h / 2 - 0.012), M_DARK)['group'] = group
    box('FrameL', (0.025, 0.025, h), (cx - w / 2 - 0.012, y - 0.013, cz), M_DARK)['group'] = group
    box('FrameR', (0.025, 0.025, h), (cx + w / 2 + 0.012, y - 0.013, cz), M_DARK)['group'] = group
    bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, y - 0.004, cz), rotation=(math.radians(90), 0, 0))
    p = bpy.context.active_object; p.name = 'Print'; p.scale = (w, h, 1); bpy.ops.object.transform_apply(scale=True, rotation=True)
    p.data.materials.append(fm); p['group'] = group

framed('print_a', 0.0, 2.05, 0.62, 0.46, 3)                  # middle niche (1.66 … 2.46)
framed('print_b', 1.86, 0.40, 0.30, 0.24, 11, y=DEP - 0.02)  # small print in the right niche (0.10 … 0.70)

# fill every shelf with books (after props reserved their spans)
for bi, zs in SHELVES.items():
    x0, x1 = bays[bi]
    for i, z in enumerate(zs):
        top = zs[i + 1] if i + 1 < len(zs) else TOP
        if bi == 1 and z == 1.66: reserved.append((1, z + T * 0.4, -0.36, 0.36))   # print niche: books only at the sides
        segs = [(x0 + T / 2, x1 - T / 2)]
        if bi == 0 and z >= 1.25: segs = [(x0 + T / 2, -1.62 - T / 2), (-1.62 + T / 2, x1 - T / 2)]
        for a, b in segs: fill_shelf(a, b, z + T * 0.4, top - z - T, bi)
x0, x1 = bays[2]; xm = x0 + (x1 - x0) * 0.62
fill_shelf(xm + T / 2, x1 - T / 2 - 0.2, 0.70 + T * 0.4, 1.30 - 0.70 - T, 2)          # niche above the small print
hidden = [f for f in books_bm.faces if f.normal.z < -0.9 or f.normal.y > 0.9]      # bottom / back faces: never seen
bmesh.ops.delete(books_bm, geom=hidden, context='FACES')
me = bpy.data.meshes.new('Books'); books_bm.to_mesh(me); books_bm.free()
bo = bpy.data.objects.new('Books', me); scene.collection.objects.link(bo)
for m in BOOK_MATS: me.materials.append(m)
bo['group'] = 'books'
print('[books]', book_count, flush=True)

# ---------------- ladder (walnut) leaning on the rail ----------------
bottom_c, top_c = Vector((-0.55, -0.95, 0.0)), Vector((-0.95, -0.12, 2.92))
axis = (top_c - bottom_c); L = axis.length; dirn = axis.normalized(); side = Vector((1, 0, 0)).cross(dirn).cross(dirn).normalized()
across = dirn.cross(Vector((0, 1, 0))).normalized()
for s in (-1, 1):
    c = (bottom_c + top_c) / 2 + across * 0.21 * s
    bpy.ops.mesh.primitive_cube_add(size=1, location=c); o = bpy.context.active_object; o.name = 'LadderRail'
    o.scale = (0.045, 0.028, L); o.rotation_euler = dirn.to_track_quat('Z', 'Y').to_euler(); bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.data.materials.append(M_DARK); world_uv(o, 1.0, True); o['group'] = 'props'
for i in range(1, int(L / 0.30)):
    c = bottom_c + dirn * (i * 0.30)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.017, depth=0.42, location=c, vertices=12)
    o = bpy.context.active_object; o.name = 'LadderRung'; o.rotation_euler = across.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(M_DARK); o['group'] = 'props'
for s in (-1, 1):   # hooks over the rail
    box('LadderHook', (0.03, 0.12, 0.03), top_c + across * 0.21 * s + Vector((0, 0.02, 0.0)), M_BRASS)['group'] = 'props'

# ---------------- lighting: sun through the skylight + sky ----------------
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.55, 0.66, 0.86, 1); bg.inputs['Strength'].default_value = 3.0
bpy.ops.object.light_add(type='SUN'); sun = bpy.context.active_object; sun.name = 'Sun'
sun.data.energy = 8.0; sun.data.angle = math.radians(1.2); sun.data.color = (1.0, 0.88, 0.72)
SUN_TO = Vector((-0.42, 0.55, -0.72)).normalized()                   # light travels left, into the bookcase, down
sun.rotation_euler = SUN_TO.to_track_quat('-Z', 'Y').to_euler()

# ---------------- camera: frontal, descends with scroll (path stored in manifest) ----------------
CAM_TOP, CAM_BOT = Vector((0.15, -3.35, 2.45)), Vector((0.15, -3.35, 0.95))
LOOK_TOP, LOOK_BOT = Vector((0.1, 0.4, 2.25)), Vector((0.1, 0.4, 0.95))
bpy.ops.object.camera_add(location=CAM_TOP); cam = bpy.context.active_object; cam.name = 'camera'; cam.data.lens_unit = 'FOV'; cam.data.angle = math.radians(52)
cam.rotation_euler = (LOOK_TOP - CAM_TOP).to_track_quat('-Z', 'Y').to_euler(); scene.camera = cam

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
scene.cycles.max_bounces = 8; scene.cycles.diffuse_bounces = 6; scene.cycles.glossy_bounces = 2; scene.cycles.transparent_max_bounces = 8
if args.preview:
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720; scene.cycles.samples = args.preview_samples; scene.cycles.use_denoising = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = 0.6
    scene.render.filepath = os.path.join(OUT, 'preview.png'); t0 = time.time(); bpy.ops.render.render(write_still=True)
    print('preview', round(time.time() - t0, 1), 's', 'books', book_count, json.dumps(prop_log)); sys.exit(0)

# ---------------- lightmap groups ----------------
meshes = [o for o in scene.objects if o.type == 'MESH']
for o in meshes:
    if not o.data.uv_layers:
        o.data.uv_layers.new(name='UVMap')
    else: o.data.uv_layers[0].name = 'UVMap'
    while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[-1])
def group_of(o):
    g = o.get('group');
    if g: return g
    p = o.parent
    while p is not None:
        if p.get('group'): return p['group']
        p = p.parent
    return 'shell'
buckets = {'shell': [], 'books': [], 'props': [], 'decor': []}
for o in meshes: buckets[group_of(o)].append(o)

def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lm = o.data.uv_layers.new(name='Lightmap'); o.data.uv_layers.active = lm
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.average_islands_scale(); bpy.ops.uv.pack_islands(rotate=True, margin=args.books_margin if name == 'Attic_books' else 0.0015, shape_method='AABB' if name == 'Attic_books' else 'CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    uv = o.data.uv_layers['Lightmap'].data; area = 0.0
    for poly in o.data.polygons:
        pts = [uv[i].uv for i in poly.loop_indices]
        area += 0.5 * abs(sum(pts[k].x * pts[(k + 1) % len(pts)].y - pts[(k + 1) % len(pts)].x * pts[k].y for k in range(len(pts))))
    print(f'[uv] {name}: faces {len(o.data.polygons)}, coverage {area:.2f}', flush=True)
    return o, area
groups = {}
for g, objs in buckets.items():
    if not objs: continue
    if g == 'decor':   # no lightmap UV: bake into a per-corner colour attribute (dense meshes have plenty of vertices)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.join()
        o = bpy.context.active_object; o.name = 'Attic_decor'; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        for a in list(o.data.color_attributes): o.data.color_attributes.remove(a)
        ca = o.data.color_attributes.new('Light', 'FLOAT_COLOR', 'CORNER'); o.data.color_attributes.active_color = ca
        print(f'[vc] Attic_decor: faces {len(o.data.polygons)}, corners {len(o.data.loops)}', flush=True)
        groups[g] = {'obj': o, 'uv_coverage': None}; continue
    o, cov = join('Attic_' + g, objs); groups[g] = {'obj': o, 'uv_coverage': round(cov, 3)}
if args.uv_only: sys.exit(0)

LM_SCALE = 4.0
manifest = {'lm_scale': LM_SCALE, 'encoding': 'png sqrt(linear / lm_scale), albedo-free full lighting (direct + indirect)', 'size': args.size,
            'samples': args.samples, 'denoise': 'none' if args.no_denoise else 'OIDN (compositor Denoise, HDR)', 'groups': {}, 'stats': {}, 'timing_s': {},
            'books': book_count, 'props': prop_log}

def denoise(rgb, n):
    src = bpy.data.images.new('dn_src', n, n, alpha=False, float_buffer=True)
    src.pixels.foreach_set(np.concatenate([rgb, np.ones((rgb.shape[0], 1), np.float32)], axis=1).ravel())
    scene.use_nodes = True; t = scene.node_tree
    for nd in list(t.nodes): t.nodes.remove(nd)
    a = t.nodes.new('CompositorNodeImage'); a.image = src
    d = t.nodes.new('CompositorNodeDenoise'); d.inputs['HDR'].default_value = True
    c = t.nodes.new('CompositorNodeComposite'); t.links.new(a.outputs['Image'], d.inputs['Image']); t.links.new(d.outputs['Image'], c.inputs['Image'])
    eng = scene.render.engine; scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = scene.render.resolution_y = n; scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'Standard'; scene.render.image_settings.file_format = 'OPEN_EXR'; scene.render.image_settings.color_depth = '32'
    bpy.ops.render.render(); tmp = os.path.join(OUT, '_dn.exr'); bpy.data.images['Render Result'].save_render(tmp)
    e = bpy.data.images.load(tmp); px = np.empty(n * n * 4, np.float32); e.pixels.foreach_get(px)
    bpy.data.images.remove(e); bpy.data.images.remove(src); os.remove(tmp); scene.render.engine = eng; scene.use_nodes = False
    out = px.reshape(-1, 4)[:, :3].copy(); out[rgb.max(axis=1) <= 0] = 0; return np.clip(out, 0, None)

bake = scene.render.bake; bake.margin = 8; bake.use_clear = True
scene.cycles.samples = args.samples
ONLY = set(args.groups.split(','))
GS = {k: int(v) for k, v in (x.split('=') for x in args.group_samples.split(',') if x)}
old = json.load(open(os.path.join(OUT, 'manifest.json'))) if os.path.exists(os.path.join(OUT, 'manifest.json')) else {}
for g, info in groups.items():
    o = info['obj']; sz = args.size; name = f'light_{g}.png'
    scene.cycles.samples = GS.get(g, args.samples)
    if g not in ONLY:   # keep the existing bake (UVs are deterministic for a given seed and settings)
        manifest['groups'][g] = old.get('groups', {}).get(g, {'object': o.name, 'uv_coverage': info['uv_coverage'], 'file': name})
        manifest['stats'][name] = old.get('stats', {}).get(name); manifest['timing_s'][name] = old.get('timing_s', {}).get(name)
        print('kept', name, flush=True); continue
    if g == 'decor':
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bake.target = 'VERTEX_COLORS'; t0 = time.time()
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'})
        bake.target = 'IMAGE_TEXTURES'
        ca = o.data.color_attributes['Light']; n = len(ca.data); v = np.empty(n * 4, np.float32); ca.data.foreach_get('color', v); v = v.reshape(-1, 4)
        manifest['stats']['decor_vc'] = {'p50': float(np.percentile(v[:, :3], 50)), 'p99': float(np.percentile(v[:, :3], 99))}
        v[:, :3] = np.sqrt(np.clip(v[:, :3] / LM_SCALE, 0, 1)); v[:, 3] = 1; ca.data.foreach_set('color', v.ravel())
        manifest['timing_s']['decor_vc'] = round(time.time() - t0, 1)
        manifest['groups'][g] = {'object': o.name, 'vertex_color': 'COLOR_0 = sqrt(light / lm_scale)'}
        print('baked decor vertex colours', manifest['timing_s']['decor_vc'], 's', manifest['stats']['decor_vc'], flush=True); continue
    img = bpy.data.images.new(name, sz, sz, alpha=False, float_buffer=True); img.colorspace_settings.name = 'Non-Color'
    for m in o.data.materials:
        nt = m.node_tree
        for nd in [nd for nd in nt.nodes if nd.name in ('BakeTarget', 'BakeUV')]: nt.nodes.remove(nd)
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.name = 'BakeTarget'; tn.image = img
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'BakeUV'; uvn.uv_map = 'Lightmap'; nt.links.new(uvn.outputs['UV'], tn.inputs['Vector']); nt.nodes.active = tn
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    t0 = time.time(); bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'})
    px = np.empty(sz * sz * 4, np.float32); img.pixels.foreach_get(px); rgb = px.reshape(-1, 4)[:, :3]; used = rgb.max(axis=1) > 0
    if not args.no_denoise: rgb = denoise(rgb, sz)
    manifest['stats'][name] = {'p50_used': float(np.percentile(rgb[used], 50)), 'p99_used': float(np.percentile(rgb[used], 99)), 'used_texels': float(used.mean())}
    enc = np.sqrt(np.clip(rgb / LM_SCALE, 0, 1))
    out = bpy.data.images.new(name + '_o', sz, sz, alpha=False); out.colorspace_settings.name = 'Non-Color'
    out.pixels.foreach_set(np.concatenate([enc, np.ones((enc.shape[0], 1), np.float32)], axis=1).ravel())
    out.filepath_raw = os.path.join(OUT, name); out.file_format = 'PNG'; out.save(); bpy.data.images.remove(out); bpy.data.images.remove(img)
    manifest['timing_s'][name] = round(time.time() - t0, 1)
    manifest['groups'][g] = {'object': o.name, 'uv_coverage': info['uv_coverage'], 'file': name}
    print('baked', name, manifest['timing_s'][name], 's', manifest['stats'][name], flush=True)
    for m in o.data.materials:
        for nd in [nd for nd in m.node_tree.nodes if nd.name in ('BakeTarget', 'BakeUV')]: m.node_tree.nodes.remove(nd)

bpy.data.objects.remove(sun)   # baked; the web page uses its direction only (volumetric shafts, dust)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'attic.glb'), export_format='GLB', export_cameras=True, export_lights=False,
                          export_texcoords=True, export_normals=True, export_image_format='AUTO',
                          export_vertex_color='ACTIVE', export_all_vertex_colors=False)
b2t = lambda v: [v.x, v.z, -v.y]   # Blender z-up → glTF y-up
manifest['sun'] = {'to_dir': b2t(SUN_TO), 'color': list(sun_color) if (sun_color := (1.0, 0.88, 0.72)) else None, 'energy': 8.0, 'angle_deg': 1.2}
manifest['skylight'] = {'center': b2t(sky_cut_center), 'size_m': [1.7, 1.4], 'slope_deg': 24}
manifest['camera_path'] = {'pos_top': b2t(CAM_TOP), 'pos_bottom': b2t(CAM_BOT), 'look_top': b2t(LOOK_TOP), 'look_bottom': b2t(LOOK_BOT), 'fov_v_deg': 30}
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('done', OUT, 'books', book_count)
