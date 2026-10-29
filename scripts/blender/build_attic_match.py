"""D-158: the REF-002 attic rebuilt with our own assets at the measured layout. Headless Blender (bpy).

The layout, camera and sun come from measuring the reference scene in the scratchpad (never copied into the repo): a lower
room whose back wall is a three-bay cream-oak bookcase (drawer band on top, shelves, closed cabinets below), an upper studio
on a slab over it, a ceiling slot right in front of the bookcase with a sideways library ladder through it, and a low warm
sun from front right (azimuth ≈ 242°, elevation ≈ 17.5°, ~3° disc). The sun reaches the lower room only through the slot and
through the open strip between the slab edge and a hidden front wall (camera-invisible; it draws the bright band on the
cabinet tops). Books, paintings, sculptures and props are ours (procedural + Poly Haven CC0, assets/source/ph-*).

    blender -b -P scripts/blender/build_attic_match.py -- --preview DIR [--samples 64] [--zs -0.44,-1.815,-3.19]
    blender -b -P scripts/blender/build_attic_match.py -- --bake prototype/v2/src/story/intro/assets/archive-x
Blender frame = the reference frame: x toward the camera, y to screen right, z up. Units m. The camera stands at
x = 14.756 looking −x (vertical fov 22.9°) and descends z −0.44 → −3.19.
"""
import argparse, json, math, os, random, sys, time
import bpy, bmesh, numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--preview', default='')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--res', default='960x540')
ap.add_argument('--zs', default='-0.44,-1.815,-3.19', help='preview camera heights')
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--sun-energy', type=float, default=6.0)
ap.add_argument('--sun-angle', type=float, default=3.0)
ap.add_argument('--sun-dir', default='-0.44,-0.845,-0.30', help='travel direction of the sun light')
ap.add_argument('--sky', type=float, default=0.0, help='world strength (the reference windows are black)')
ap.add_argument('--exposure', type=float, default=0.0)
ap.add_argument('--sun-color', default='#ffe6c4')
ap.add_argument('--leaves', type=int, default=1, help='foliage gobo outside the front strip')
ap.add_argument('--bake', default='')
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--bsamples', type=int, default=128)
ap.add_argument('--save', default='')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
rng = random.Random(args.seed)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- measured layout (reference frame) ----------------
FLOOR_Z = -3.428; SLAB = (-0.1, 0.0); CEIL_Z = 5.0
BACK_X = 6.24; FRONT_X = 6.78; Y0, Y1 = -3.674, 3.58          # lower back wall / bookcase front / lower room width
UP_X0, UP_X1, UP_Y0, UP_Y1 = 0.172, 8.261, -7.596, 7.202       # upper slab extent
WALL_X = -0.012                                                # upper back wall (windows from z 0.84)
SLOT = (6.955, 7.833, -1.65, 1.651)                            # ceiling slot x0, x1, y0, y1
HIDDEN_WALL = (10.25, 10.4)                                    # x of the camera-invisible lower front wall (z FLOOR..0)
DIV_Y = [Y0, -3.27, -1.19, 1.18, 3.28, Y1]                      # bookcase dividers (narrow end columns + three bays)
CAM_X, FOV_V = 14.756, 22.9

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

def tint(m, hexcol, keep, normal=1.0):
    """Pull a scanned texture toward one colour (keep = share of the texture's own variation), soften its normal map."""
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; ln = b.inputs['Base Color'].links
    if ln:
        mx = nt.nodes.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs['Fac'].default_value = 1.0
        gr = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(ln[0].from_socket, gr.inputs['Color'])
        # albedo = colour × (1 − keep + keep × grey(texture) / mean): grain survives, hue is ours
        mp = nt.nodes.new('ShaderNodeMapRange'); mp.inputs['From Min'].default_value = 0; mp.inputs['From Max'].default_value = .45
        mp.inputs['To Min'].default_value = 1 - keep; mp.inputs['To Max'].default_value = 1 + keep * .35
        nt.links.new(gr.outputs['Val'], mp.inputs['Value'])
        mx.inputs['Color1'].default_value = (*srgb(hexcol), 1); nt.links.new(mp.outputs['Result'], mx.inputs['Color2'])
        nt.links.new(mx.outputs['Color'], b.inputs['Base Color'])
    for n in nt.nodes:
        if n.type == 'NORMAL_MAP': n.inputs['Strength'].default_value *= normal

M_OAK = ph_material('ash_veneer', name='cream_oak'); tint(M_OAK, '#ddcdb2', .55, .6)
M_WALL = ph_material('painted_plaster_wall', '1k', name='plaster'); tint(M_WALL, '#e6dccb', .25, .4)
M_FLOOR = ph_material('herringbone_parquet', '1k', name='parquet'); tint(M_FLOOR, '#c4a682', .6, .7)
for m_ in (M_OAK, M_FLOOR): m_.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = .2   # matte (the reference reads diffuse)
M_PANEL = mat('cell_back', srgb('#e2d5bf'), 0.8)
M_WHITE = mat('sculpture_white', srgb('#efebe4'), 0.6)
M_KNOB = mat('knob', srgb('#2a2420'), 0.4)
M_FRAME = mat('window_frame', srgb('#e4ddd0'), 0.55)
M_LEAF = None
PALETTE = [('#e39a7e', 5), ('#a9c0cc', 5), ('#efe5d2', 5), ('#d8b48c', 4), ('#c97a5c', 3), ('#f4efe6', 3), ('#8fa9b8', 2),
           ('#e6c7a4', 3), ('#b88c6a', 2), ('#d5a08a', 2)]
BOOK_MATS = [mat(f'book_{i}', srgb(h), 0.75) for i, (h, _) in enumerate(PALETTE)]
BOOK_W = [w for _, w in PALETTE]

def painting_material(name, seed, w=640, h=420):
    """Our own flat-colour still life (cut-paper shapes on a cream ground) — no reference pixels."""
    r = random.Random(seed); yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    px = np.ones((h, w, 3), np.float32) * np.array(srgb('#f1e4c8'), np.float32)
    def put(mask, hexcol): px[mask] = srgb(hexcol)
    put(((yy - h * .78) / (h * .17)) ** 2 + ((xx - w * .55) / (w * .3)) ** 2 < 1, r.choice(['#25407a', '#1f3a5f']))   # bowl
    put(yy > h * .86, '#25407a')
    for _ in range(5):                                                                                                       # fruit
        cx, cy, rr = r.uniform(.35, .75) * w, r.uniform(.55, .72) * h, r.uniform(.05, .08) * w
        put((xx - cx) ** 2 + (yy - cy) ** 2 < rr * rr, r.choice(['#e8743b', '#f0a03c', '#d9532b']))
    for _ in range(6):                                                                                                       # leaves
        cx, cy = r.uniform(.08, .4) * w, r.uniform(.15, .75) * h; a = r.uniform(0, math.pi)
        u = (xx - cx) * math.cos(a) + (yy - cy) * math.sin(a); v = -(xx - cx) * math.sin(a) + (yy - cy) * math.cos(a)
        put((u / (w * .09)) ** 2 + (v / (w * .03)) ** 2 < 1, r.choice(['#2f5e3a', '#3f7a45', '#1e3d2a']))
    for _ in range(3):                                                                                                       # flowers
        cx, cy = r.uniform(.5, .9) * w, r.uniform(.1, .4) * h
        for k in range(5):
            a = k * 2 * math.pi / 5; put((xx - cx - math.cos(a) * w * .035) ** 2 + (yy - cy - math.sin(a) * w * .035) ** 2 < (w * .028) ** 2, '#e8743b')
        put((xx - cx) ** 2 + (yy - cy) ** 2 < (w * .015) ** 2, '#f3c64b')
    img = bpy.data.images.new(name, w, h); img.pixels = np.concatenate([px[::-1], np.ones((h, w, 1), np.float32)], 2).ravel()
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; img.pack()
    nt.links.new(t.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color']); nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
    return m

def world_uv(o, tile, rot_grain=False):
    me = o.data; uv = (me.uv_layers[0] if me.uv_layers else me.uv_layers.new(name='UVMap')).data
    for poly in me.polygons:
        n = poly.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for li in poly.loop_indices:
            co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            if rot_grain: u, v = v, u
            uv[li].uv = (u / tile, v / tile)

def box(name, x0, x1, y0, y1, z0, z1, m, group='shell', bevel=0.0, tile=1.2, grain=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.active_object; o.name = name; o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m); world_uv(o, tile, grain); o['group'] = group
    if bevel:
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
    return o

def cyl(name, r, depth, loc, m, rot=(0, 0, 0), verts=16, group='decor'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m); o['group'] = group; world_uv(o, .6); return o

# ---------------- rooms ----------------
# the measured lower room has no side walls: its floor (x 4.8..10.25, y −5.7..10.7) ends at the hidden front wall
box('LowerFloor', 4.817, HIDDEN_WALL[0], -5.678, 10.683, FLOOR_Z - .1, FLOOR_Z, M_FLOOR, tile=1.0)
box('LowerBack', BACK_X - .1, BACK_X, Y0, Y1, FLOOR_Z, SLAB[0], M_WALL)
sx0, sx1, sy0, sy1 = SLOT                                       # slab around the slot (top = upper floor, edge = oak trim)
for nm, a in {'SlabBack': (WALL_X, sx0, UP_Y0, UP_Y1), 'SlabFront': (sx1, UP_X1, UP_Y0, UP_Y1),
              'SlabL': (sx0, sx1, UP_Y0, sy0), 'SlabR': (sx0, sx1, sy1, UP_Y1)}.items():
    box(nm, a[0], a[1], a[2], a[3], SLAB[0], SLAB[1], M_FLOOR, tile=1.0)
box('SlabEdge', UP_X1, UP_X1 + .03, UP_Y0, UP_Y1, SLAB[0] - .02, SLAB[1] + .01, M_OAK, bevel=.004, grain=True)
box('UpperBack', WALL_X - .1, WALL_X, UP_Y0 - .8, UP_Y1 + .8, 0, CEIL_Z, M_WALL)
box('UpperLeft', WALL_X, UP_X1, UP_Y0 - .9, UP_Y0 - .8, 0, CEIL_Z, M_WALL)
box('UpperCeil', WALL_X, UP_X1, UP_Y0 - .8, UP_Y1 + .8, CEIL_Z, CEIL_Z + .1, M_WALL)
# hidden lower front wall: casts shadow, never seen by the camera (and not exported as a visible surface)
hw = box('Occluder_front', HIDDEN_WALL[0], HIDDEN_WALL[1], -8.0, 11.0, FLOOR_Z - .1, 0.0, M_WALL, group='occluder')   # measured: y −8..11
hw.visible_camera = False

# upper back wall windows: openings cut as frames over a dark void (the reference windows read black)
def window(y0, y1, z0, z1, cols, rows):
    box('WinSill', WALL_X - .02, WALL_X + .12, y0 - .05, y1 + .05, z0 - .06, z0, M_FRAME, group='decor', bevel=.004)
    for k in range(cols + 1):
        y = y0 + (y1 - y0) * k / cols; box('WinMull', WALL_X - .04, WALL_X + .04, y - .025, y + .025, z0, z1, M_FRAME, group='decor')
    for k in range(rows + 1):
        z = z0 + (z1 - z0) * k / rows; box('WinTran', WALL_X - .04, WALL_X + .04, y0, y1, z - .025, z + .025, M_FRAME, group='decor')
WINDOWS = [(-3.85, -1.95, 0.84, 3.4, 3, 3), (-1.667, 1.684, 0.84, 3.4, 4, 3), (2.95, 4.85, 0.84, 3.4, 3, 3)]
def cut_windows():
    wall = bpy.data.objects['UpperBack']
    for i, (y0, y1, z0, z1, _, _) in enumerate(WINDOWS):
        c = box(f'cut{i}', WALL_X - .3, WALL_X + .3, y0, y1, z0, z1, M_WALL)
        m = wall.modifiers.new(f'cut{i}', 'BOOLEAN'); m.object = c; m.operation = 'DIFFERENCE'
        bpy.context.view_layer.objects.active = wall; bpy.ops.object.modifier_apply(modifier=m.name); bpy.data.objects.remove(c)
    world_uv(wall, 1.2)
cut_windows()
for w in WINDOWS: window(*w)

# ---------------- bookcase ----------------
T = 0.035
books_bm = bmesh.new(); counts = {'books': 0, 'stacks': 0}

def add_box_to(bm_, cx, cy, cz, w, d, h, mi, rot_x=0.0):
    """Box with its base centre at (cx, cy, cz): w along y (shelf run), d along x (depth), h up; rot_x leans it in the run."""
    geom = bmesh.ops.create_cube(bm_, size=1.0); verts = geom['verts']
    mtx = Matrix.Translation((cx, cy, cz)) @ Euler((rot_x, 0, 0)).to_matrix().to_4x4() @ Matrix.Translation((0, 0, h / 2)) @ Matrix.Diagonal((d, w, h, 1))
    bmesh.ops.transform(bm_, matrix=mtx, verts=verts)
    for f in {f for v in verts for f in v.link_faces}: f.material_index = mi

def book_run(y0, y1, z, avail, lying_ok=True):
    """Upright pastel books (spines to +x) with gaps, leaning ends and lying stacks, like a lived-in shelf."""
    y = y0 + .02; front = FRONT_X - .02
    while y < y1 - .05:
        roll = rng.random(); room = y1 - y
        if roll < .12: y += rng.uniform(.06, .25); continue
        if roll < .26 and room > .3 and lying_ok:                                    # lying stack
            n = rng.randint(3, 7); w = rng.uniform(.2, .28); zz = z
            for _ in range(n):
                th = rng.uniform(.025, .045); d = rng.uniform(.15, .2)
                add_box_to(books_bm, front - d / 2 - rng.uniform(0, .03), y + w / 2 + rng.uniform(-.01, .01), zz, w, d, th, rng.choices(range(len(PALETTE)), weights=BOOK_W)[0])
                zz += th
            counts['stacks'] += 1; y += w + .04; continue
        run = rng.randint(4, 14); hb = rng.uniform(.2, min(.3, avail - .03))
        for _ in range(run):
            w = rng.uniform(.025, .055)
            if y + w > y1 - .02: break
            h = min(avail - .02, hb * rng.uniform(.88, 1.1)); d = rng.uniform(.16, .21)
            add_box_to(books_bm, front - d / 2 - rng.uniform(0, .02), y + w / 2, z, w, d, h, rng.choices(range(len(PALETTE)), weights=BOOK_W)[0])
            counts['books'] += 1; y += w + rng.uniform(0, .003)
        if rng.random() < .3 and y < y1 - .15:                                        # one leaning book closes the run
            h = min(avail - .05, .24); a = rng.uniform(.15, .3); w = .03
            add_box_to(books_bm, front - .09, y + w / 2 + math.sin(a) * h / 2, z, w, .18, h, rng.choices(range(len(PALETTE)), weights=BOOK_W)[0], rot_x=-a)
            y += w + math.sin(a) * h + .03

def drawer(y0, y1, z0, z1, depth_out=.0):
    """Recessed drawer front with a small dark knob."""
    box('Drawer', FRONT_X - .02, FRONT_X + depth_out, y0 + .008, y1 - .008, z0 + .008, z1 - .008, M_OAK, bevel=.006, grain=True)
    cyl('Knob', .012, .02, (FRONT_X + depth_out + .008, (y0 + y1) / 2, z0 + (z1 - z0) * .62), M_KNOB, rot=(0, math.pi / 2, 0), verts=12, group='shell')

def bookcase():
    box('CaseBack', BACK_X, BACK_X + .02, Y0, Y1, FLOOR_Z, SLAB[0], M_PANEL)
    for y in DIV_Y:
        box('Divider', BACK_X, FRONT_X, y - T / 2, y + T / 2, FLOOR_Z, SLAB[0], M_OAK, bevel=.005, grain=True, tile=1.5)
    box('Top', BACK_X, FRONT_X + .02, Y0, Y1, -.13, SLAB[0], M_OAK, bevel=.004, grain=True)
    # top drawer band (z −0.47..−0.13): one wide drawer per bay, one per end column
    box('BandShelf', BACK_X, FRONT_X, Y0, Y1, -.49, -.47, M_OAK, bevel=.004, grain=True)
    for a, b in zip(DIV_Y[:-1], DIV_Y[1:]): drawer(a + T / 2, b - T / 2, -.47, -.13)
    # bottom cabinets (z −3.41..−2.69) stand slightly proud of the case
    box('CabTop', BACK_X, FRONT_X + .06, Y0, Y1, -2.69, -2.655, M_OAK, bevel=.006, grain=True)
    box('Plinth', FRONT_X - .03, FRONT_X + .04, Y0, Y1, FLOOR_Z, FLOOR_Z + .07, M_OAK, bevel=.004, grain=True)
    for a, b in zip(DIV_Y[:-1], DIV_Y[1:]):
        if b - a > 1: drawer(a + T / 2, (a + b) / 2, FLOOR_Z + .07, -2.69, .04); drawer((a + b) / 2, b - T / 2, FLOOR_Z + .07, -2.69, .04)
        else: drawer(a + T / 2, b - T / 2, FLOOR_Z + .07, -2.69, .04)
    # shelves per bay: (y0, y1, [z…]); books on each, decor placed below
    L, C, R = (DIV_Y[1] + T / 2, DIV_Y[2] - T / 2), (DIV_Y[2] + T / 2, DIV_Y[3] - T / 2), (DIV_Y[3] + T / 2, DIV_Y[4] - T / 2)
    for (y0, y1), zs in ((L, [-1.445, -1.85, -2.24]), (C, [-1.445, -1.85, -2.24]), (R, [-.97, -1.445, -1.85])):
        for z in zs: box('Shelf', BACK_X + .02, FRONT_X - .005, y0, y1, z - .03, z, M_OAK, bevel=.004, grain=True)
    box('Shelf', BACK_X + .02, FRONT_X - .25, L[0] + .4, L[1] - .25, -.85, -.82, M_OAK, bevel=.004, grain=True)   # small floating shelf (left)
    # right bay: three drawers on the left part, a small framed painting on the right (z −2.49..−2.06)
    split = 2.4
    for z0, z1 in ((-2.24, -2.0), (-2.48, -2.24), (-2.69, -2.48)): drawer(R[0], split - .02, z0, z1)
    box('Shelf', BACK_X + .02, FRONT_X - .005, R[0], R[1], -2.03, -2.0, M_OAK, bevel=.004, grain=True)
    # narrow end columns: small drawers stacked in the middle rows
    for a, b in ((DIV_Y[0], DIV_Y[1]), (DIV_Y[4], DIV_Y[5])):
        for z0, z1 in ((-1.85, -1.445), (-2.24, -1.85)): drawer(a + T / 2, b - T / 2, z0, z1)
        box('Shelf', BACK_X + .02, FRONT_X - .005, a + T / 2, b - T / 2, -1.445, -1.415, M_OAK, bevel=.004)
    # books — measured rows, with open cells where the reference puts a painting or a sculpture
    book_run(L[0], L[1], -1.445, .5); book_run(L[0], L[1], -1.85, .38); book_run(L[0], L[1], -2.24, .36); book_run(L[0], L[1], -2.655, .4, False)
    book_run(L[0] + .4, L[1] - .3, -.82, .3)
    book_run(C[0] + .9, C[1] - .1, -1.445, .4); book_run(C[0], C[1], -1.85, .38); book_run(C[0], C[1], -2.24, .36); book_run(C[0] + .5, C[1], -2.655, .4)
    book_run(R[0] + .1, R[1], -.97, .45); book_run(R[0], R[1], -1.445, .4); book_run(R[0], R[1] - .3, -1.85, .14 + .2)
    return L, C, R
L, C, R = bookcase()
ob = bpy.data.objects.new('Archive_books_src', bpy.data.meshes.new('books')); books_bm.to_mesh(ob.data); books_bm.free()
scene.collection.objects.link(ob); ob['group'] = 'books'
for m in BOOK_MATS: ob.data.materials.append(m)
world_uv(ob, .3)

# paintings (ours) — centre above the middle shelf, small one in the right bay
def painting(name, y0, y1, z0, z1, seed):
    box(name + '_frame', FRONT_X - .2, FRONT_X - .17, y0 - .03, y1 + .03, z0 - .03, z1 + .03, M_FRAME, group='decor', bevel=.004)
    box(name, FRONT_X - .171, FRONT_X - .165, y0, y1, z0, z1, painting_material(name, seed), group='decor')
    o = bpy.data.objects[name]; me = o.data; uv = me.uv_layers[0].data
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co; uv[li].uv = ((co.y - y0) / (y1 - y0), (co.z - z0) / (z1 - z0))
painting('PaintCentre', -.526, .39, -1.212, -.614, 3)
painting('PaintRight', 2.425, 3.03, -2.488, -2.059, 9)

# white block sculptures (ours): three rotated cubes, on the centre shelf and the right drawer band
def blocks(x, y, z, s, seed):
    r = random.Random(seed)
    for k in range(3):
        bpy.ops.mesh.primitive_cube_add(size=s * r.uniform(.7, 1), location=(x + r.uniform(-.03, .03), y + r.uniform(-.05, .05), z + s / 2 + k * s * .25),
                                        rotation=(r.uniform(0, 1), r.uniform(0, 1), r.uniform(0, 1)))
        o = bpy.context.active_object; o.name = 'Blocks'; o.data.materials.append(M_WHITE); o['group'] = 'decor'
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = .006; b.segments = 2
blocks(6.55, -1.0, -1.445, .1, 1); blocks(6.55, 3.0, -.97, .09, 2)

def place(slug, x, y, z, target_h, rot=0.0, group='decor'):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'assets/source/ph-{slug}/{slug}_1k.gltf'))
    new = [o for o in bpy.data.objects if o not in before]; roots = [o for o in new if o.parent is None]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in new if o.type == 'MESH' for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
    s = target_h / max(hi.z - lo.z, 1e-4)
    for r in roots: r.scale = tuple(v * s for v in r.scale); r.rotation_euler.z += rot
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in new if o.type == 'MESH' for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)]); c = (lo + hi) / 2
    for r in roots: r.location += Vector((x - c.x, y - c.y, z - lo.z))
    for o in new: o['group'] = group
    return new
place('marble_bust_01', 6.5, 3.35 - .3, -.97 + .0, .18, rot=math.radians(200))
place('ceramic_vase_01', 6.5, 1.0, -1.445, .2)

# ---------------- ladder (sideways through the slot: rails at x ≈ 6.98 / 7.82, leaning in y) ----------------
TOP, BOT = Vector((0, -1.66, .29)), Vector((0, -.31, FLOOR_Z))
axis = (TOP - BOT).normalized(); Lr = (TOP - BOT).length; ang = math.atan2(axis.y, axis.z)
for rx in (6.976, 7.824):
    c = (TOP + BOT) / 2
    box('Rail', -.02, .02, -.035, .035, -Lr / 2, Lr / 2, M_OAK, group='shell', grain=True)
    o = bpy.context.active_object; o.rotation_euler = (-ang, 0, 0); o.location = (rx, c.y, c.z)
    bpy.ops.object.transform_apply(location=True, rotation=True); world_uv(o, 1.2, True)
k = 1
while k * .546 < Lr - .2:
    p = BOT + axis * (k * .546)
    box('Tread', -.41, .41, -.055, .055, -.012, .012, M_OAK, group='shell', grain=True)
    o = bpy.context.active_object; o.location = (7.4, p.y, p.z); bpy.ops.object.transform_apply(location=True); k += 1

# ---------------- upper studio (ours: pedestals, vase, plant, stools, a work table) ----------------
for (x, y, h) in ((3.3, -3.6, 1.15), (3.0, 2.9, 1.3)):
    box('Pedestal', x - .25, x + .25, y - .25, y + .25, 0, h, M_WHITE, group='decor', bevel=.006)
blocks(3.3, -3.6, 1.15, .16, 4)
place('ceramic_vase_01', 3.0, 2.9, 1.3, .45)
place('potted_plant_01', 2.6, -.1, 0, 1.6)
def stool(x, y):
    cyl('StoolSeat', .17, .04, (x, y, .72), M_OAK)
    for k in range(3):
        a = k * 2 * math.pi / 3; cyl('StoolLeg', .015, .74, (x + .12 * math.cos(a), y + .12 * math.sin(a), .36), M_OAK, rot=(.12 * math.sin(a), -.12 * math.cos(a), 0), verts=8)
stool(3.6, -1.9); stool(3.4, 4.5)
box('TableTop', 2.6, 3.6, 3.7, 5.8, .78, .82, M_OAK, group='decor', bevel=.004, grain=True)
for (x, y) in ((2.65, 3.75), (3.55, 3.75), (2.65, 5.75), (3.55, 5.75)): box('TableLeg', x - .025, x + .025, y - .025, y + .025, 0, .78, M_OAK, group='decor')

# ---------------- foliage gobo outside the front strip (bake only; never exported) ----------------
if args.leaves:
    N = 512; img = bpy.data.images.new('leafmask', N, N, alpha=True); yy, xx = np.mgrid[0:N, 0:N] / N; a = np.zeros((N, N), np.float32)
    r = random.Random(5)
    for _ in range(140):
        cx, cy, s, t = r.random(), r.random(), r.uniform(.025, .06), r.uniform(0, math.pi)
        u = (xx - cx) * math.cos(t) + (yy - cy) * math.sin(t); v = -(xx - cx) * math.sin(t) + (yy - cy) * math.cos(t)
        a[(u / s) ** 2 + (v / (s * .45)) ** 2 < 1] = 1
    img.pixels = np.stack([a * .2, a * .3, a * .15, a], -1).ravel().astype(np.float32); img.pack()
    M_LEAF = bpy.data.materials.new('leaf'); M_LEAF.use_nodes = True; nt = M_LEAF.node_tree
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; bs = nt.nodes['Principled BSDF']
    nt.links.new(t.outputs['Color'], bs.inputs['Base Color']); nt.links.new(t.outputs['Alpha'], bs.inputs['Alpha'])
    sun_to = Vector(tuple(float(v) for v in args.sun_dir.split(','))).normalized()
    for (cx, cy, cz, sz) in ((11.6, 5.6, 0.9, 3.2), (12.4, 3.8, 1.6, 2.6)):
        bpy.ops.mesh.primitive_plane_add(size=sz, location=(cx, cy, cz)); g = bpy.context.active_object; g.name = 'Gobo'
        g.rotation_euler = (-sun_to).to_track_quat('Z', 'Y').to_euler(); g.data.materials.append(M_LEAF); g['group'] = 'gobo'
        g.visible_camera = False

# ---------------- light, world, camera ----------------
SUN_TO = Vector(tuple(float(v) for v in args.sun_dir.split(','))).normalized()
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = args.sun_energy; sun.angle = math.radians(args.sun_angle); sun.color = srgb(args.sun_color)
so = bpy.data.objects.new('sun', sun); scene.collection.objects.link(so); so.rotation_euler = SUN_TO.to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (*srgb('#bcd0e6'), 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = args.sky
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
scene.cycles.max_bounces = 8; scene.cycles.diffuse_bounces = 6; scene.cycles.glossy_bounces = 2; scene.cycles.transparent_max_bounces = 8
scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = args.exposure
for o in scene.objects:                                        # apply bevels before preview/bake (the bake joins meshes)
    if o.type == 'MESH' and o.modifiers:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
print('counts', counts, flush=True)
if args.save: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.save))

def shot_cam(z):
    cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(FOV_V); cd.clip_start = .05; cd.clip_end = 60
    c = bpy.data.objects.new('cam', cd); scene.collection.objects.link(c); c.location = (CAM_X, 0, z)
    c.rotation_euler = Vector((-1, 0, 0)).to_track_quat('-Z', 'Y').to_euler(); return c

ZS = [float(v) for v in args.zs.split(',')]
if args.preview:
    os.makedirs(args.preview, exist_ok=True)
    w, h = (int(v) for v in args.res.split('x')); scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.cycles.samples = args.samples; scene.cycles.use_denoising = True
    for z in ZS:
        scene.camera = shot_cam(z); scene.render.filepath = os.path.join(args.preview, f'z{z:+.2f}.png')
        bpy.ops.render.render(write_still=True); print('rendered', z, flush=True)

# ---------------- bake + web export (archive format: albedo-free direct + indirect light, sqrt-encoded) ----------------
if args.bake:
    OUT = os.path.join(ROOT, args.bake); os.makedirs(OUT, exist_ok=True)
    meshes = [o for o in scene.objects if o.type == 'MESH']
    for o in meshes:
        if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
        else: o.data.uv_layers[0].name = 'UVMap'
        while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[-1])
    buckets = {'shell': [], 'books': [], 'decor': []}
    for o in meshes:
        g = o.get('group', 'shell')
        if g in buckets: buckets[g].append(o)
    def join(name, objs, margin):
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.join()
        o = bpy.context.active_object; o.name = name
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        l = o.data.uv_layers.new(name='Lightmap'); o.data.uv_layers.active = l
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
        bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.average_islands_scale()
        bpy.ops.uv.pack_islands(rotate=True, margin=margin, shape_method='AABB')
        bpy.ops.object.mode_set(mode='OBJECT'); return o
    # D-158: every group is texel-baked (the archive baked books and decor per vertex — a coarse light on small faces)
    SIZES = {'shell': args.size, 'books': args.size, 'decor': args.size // 2}
    groups = {g: join('Archive_' + g, objs, .001 if g == 'shell' else .0015) for g, objs in buckets.items() if objs}
    LM_SCALE = 4.0
    man = {'lm_scale': LM_SCALE, 'encoding': 'png sqrt(linear / lm_scale), albedo-free full lighting (direct + indirect)',
           'size': SIZES, 'samples': args.bsamples, 'groups': {}, 'timing_s': {}, 'counts': counts,
           'source': 'scripts/blender/build_attic_match.py (D-158)', 'args': {k: v for k, v in vars(args).items() if k not in ('bake', 'preview', 'save')}}
    bake = scene.render.bake; bake.margin = 6; bake.use_clear = True; scene.cycles.samples = args.bsamples
    for g, o in groups.items():
        t0 = time.time(); sz = SIZES[g]; name = f'light_{g}.png'
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        img = bpy.data.images.new(name, sz, sz, alpha=False, float_buffer=True); img.colorspace_settings.name = 'Non-Color'
        for m in o.data.materials:
            nt = m.node_tree; tn = nt.nodes.new('ShaderNodeTexImage'); tn.name = 'BakeTarget'; tn.image = img
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
    for o in [x for x in scene.objects if x.get('group') == 'gobo' or x.type in ('LIGHT', 'CAMERA')]: bpy.data.objects.remove(o)
    occ = bpy.data.objects['Occluder_front']; occ.data.materials.clear()      # exported for the web sun depth map only
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'archive.glb'), export_format='GLB', export_cameras=False, export_lights=False,
                              export_texcoords=True, export_normals=True, export_image_format='AUTO')
    b2t = lambda v: [round(float(v[0]), 4), round(float(v[2]), 4), round(float(-v[1]), 4)]
    man['sun'] = {'to_dir': b2t(SUN_TO), 'color': list(sun.color), 'energy': sun.energy, 'angle_deg': args.sun_angle}
    man['shots'] = {f'z{z:+.2f}': {'pos': b2t((CAM_X, 0, z)), 'look': b2t((0, 0, z)), 'fov_v_deg': FOV_V} for z in ZS}
    man['room'] = {'min': b2t((WALL_X, UP_Y1, FLOOR_Z)), 'max': b2t((CAM_X + .5, UP_Y0, CEIL_Z))}   # to the camera: the sun map must cover the air it looks through
    man['occluders'] = ['Occluder_front']
    # web only: a shade-only lid over the air in front of the lower room (x 10.25..20, z 0) — the camera stands there, and
    # without it the web light shafts fill that sunlit air and wash the whole frame (the bake has no air, nothing changes there)
    man['occluder_boxes'] = [{'min': b2t((HIDDEN_WALL[0], 14.0, -0.05)), 'max': b2t((20.0, -8.0, 0.0))}]
    # the loader expects a figure entry (intro); the Lab never shows one — parked at the foot of the ladder
    man['figure'] = {'location': b2t(BOT + Vector((7.4, 0, 0))), 'heart': b2t(BOT + Vector((7.4, 0, 1.2))), 'heart_q_wxyz_blender': [1, 0, 0, 0], 'hand_r': b2t(BOT + Vector((7.4, .2, 1.0)))}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), indent=1)
    print('exported', OUT)
