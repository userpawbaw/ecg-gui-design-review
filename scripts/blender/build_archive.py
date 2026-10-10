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
from mathutils import Vector, Matrix, Euler, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--preview', default='')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--shots', default='')
ap.add_argument('--res', default='1280x720')
ap.add_argument('--seed', type=int, default=11)
ap.add_argument('--save', default='')
ap.add_argument('--look', default='h3', choices=['h3', 'h3b', 'h5'], help='figure look in stills: h3 world-height rings, h3b bone-aligned + distance-adaptive rings, h5 frosted glass + faint rings')
ap.add_argument('--light', default='r1', choices=['r1', 'r2'], help='r2 = D-049 light round: hero/support/closed windows, window reveals, 0.55° sun, low global haze + hero corridor, practicals')
ap.add_argument('--pose', default='', help='D-050 stage: floor|chair|desk|wall|climb — one v3 pose placed at its spot (implies --fig v3)')
ap.add_argument('--clay', action='store_true', help='D-049 clay gate A: grey materials, no volume, no glow, key + blockers only')
ap.add_argument('--fig', default='v2', choices=['v2', 'v3'], help='v3 = D-048 deformé figure with ECG electrodes and lead wires')
ap.add_argument('--signal', default='off', choices=['off', 'clean', 'noise'], help='v3 stills: neon dash preview — clean (blue heart→electrode, purple to the computer) or noise (red on the power line and leads)')
ap.add_argument('--bake', default='', help='bake lightmaps + export the web scene into this dir')
ap.add_argument('--nofig', action='store_true', help='no figure (and no electrodes/leads): an empty room to compose a separately posed figure into (chair-motion-v3)')
ap.add_argument('--export-rig', default='', help='v3 only: write the electrodes, yoke, leads, trunk, comm cable, power line, inside-body signal paths and RA ring as one rig.glb into this dir (web dash shader; IMPL_BRIEF_FIGURE_V3_WEB B2)')
ap.add_argument('--intro2', action='store_true', help='REVIEW-R1-WEB-20261008 I-4/I-5: Mixamo auto-rig figures — climber on the ladder (rungs re-spaced to the source motion) + floor-sitter with electrodes right of the ladder')
ap.add_argument('--size', type=int, default=2048)
ap.add_argument('--bsamples', type=int, default=128)
ap.add_argument('--art', default='', choices=['', 'r3', 'r4', 'r5', 'r6'], help='r6 = D-062: r5 with a near small spot key outside the hatch (crisp shadows + distance falloff, one pool), sun 0.5° as accents only, the left-side holes closed (shade zone), flat low-texture albedo on walls/wood. r5 = D-061: r4 plus a floor-patch hole (sun on the floor in front of the back shelves, bounced up), sky 0.8, sun 26, exposure 0.9, AgX Punchy (deep darks like REF). r4 = D-059: r3 plus more light holes (skylight, roof-board gaps), r2 windows open for sky fill, larger sun disc for penumbra. D-058 art test: ceiling hatch over the back of the aisle, side ladder up into it (rigid move of the r2 ladder + climber), sun through the hatch onto the back shelves, haze only in the hatch beam, cream sun, no bulbs')
ap.add_argument('--dress', action='store_true', help='D-060 set dressing on the back wall (review proposal 4): a drawer cabinet under the skylight patch, open cells with a framed print, block sculpture and lying book stacks under the hatch patch, painted cell backs, sparser shelves — broad light flat surfaces that catch and bounce the sun')
ap.add_argument('--palette', default='archive', choices=['archive', 'pastel'], help='D-058: archive = original dark book/wood colours; pastel = light pastel books, pale wood, light boxes (REF-002 comparison)')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
if args.intro2: args.fig = 'v3'; args.pose = 'ar_floor'
if args.art in ('r3', 'r4', 'r5', 'r6'): args.light = 'r2'                           # r3 builds on the r2 light round (hero corridor replaced by the hatch beam)
if args.pose: args.fig = 'v3'
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
if args.palette == 'pastel':                                  # D-058: high value, low-mid saturation (REF-002: pastel 22-25 % of the frame)
    PALETTE = [('#e8a48c', 4), ('#a9bccb', 4), ('#efe4cf', 4), ('#b9c4a8', 3), ('#d8c3a0', 3), ('#d98c74', 2), ('#8fa3b3', 2),
               ('#f3ece0', 3), ('#c47b5a', 2), ('#7f9e9a', 2), ('#e6c9a8', 2), ('#5a4a42', 1)]
    M_BOX = mat('archive_box', srgb('#e2cfae'), 0.85); M_BOX2 = mat('archive_box_grey', srgb('#cfcbc2'), 0.85)
    M_BEAM = mat('beam', srgb('#b49878'), 0.75)
    def lighten(m, val, sat):                                    # textured woods/walls: scale value and saturation of the base colour
        nt = m.node_tree; b = nt.nodes['Principled BSDF']; ln = b.inputs['Base Color'].links
        if not ln: return
        hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Value'].default_value = val; hs.inputs['Saturation'].default_value = sat
        nt.links.new(ln[0].from_socket, hs.inputs['Color']); nt.links.new(hs.outputs['Color'], b.inputs['Base Color'])
    lighten(M_WOOD, 1.45, .55); lighten(M_FLOOR, 1.25, .7); lighten(M_WALL, 1.1, .6)
if args.art == 'r6':                                          # D-062 (F-040): REF surfaces are near-flat albedo; texture hid our gradients
    def flatten(m, hexcol, keep):
        nt = m.node_tree; b = nt.nodes['Principled BSDF']; ln = b.inputs['Base Color'].links
        if ln:
            mx = nt.nodes.new('ShaderNodeMixRGB'); mx.inputs['Fac'].default_value = 1 - keep; mx.inputs['Color2'].default_value = (*srgb(hexcol), 1)
            nt.links.new(ln[0].from_socket, mx.inputs['Color1']); nt.links.new(mx.outputs['Color'], b.inputs['Base Color'])
        for n in nt.nodes:
            if n.type == 'NORMAL_MAP': n.inputs['Strength'].default_value *= keep
    pal = args.palette == 'pastel'
    flatten(M_WOOD, '#dccbb0' if pal else '#8a6a48', float(os.environ.get('TEX_KEEP', .15)))
    flatten(M_WALL, '#e8dfcf' if pal else '#bfb39e', float(os.environ.get('TEX_KEEP', .15)))
    flatten(M_FLOOR, os.environ.get('FLOOR_COL', '#a89075' if pal else '#6a4f36'), .4)
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
HATCH = tuple(float(v) for v in os.environ.get('HATCH', '0.0,1.6,2.47,3.88').split(','))   # D-058 r3: x0, x1, y0, y1 (between the beams at y 2.32 / 4.0, clear of the pendant at x −0.7)                                 # D-058 r3: x0, x1, y0, y1 of the ceiling hatch (between beams, clear of the pendant)
# D-059 r4: more light holes beside the hatch (user 2026-10-09: "다락문 하나에 갇혀 있을 필요는 없어"): a small skylight whose patch
# lands low on the back shelves at the centre, three roof-board gaps (0.30 m gaps, 0.12 m boards) that draw soft bands upper left, and
# a front skylight whose patch lands low right. x0, x1, y0, y1 each. Gaps narrower than ~0.2 m pass no sun: the 0.15 m slab itself
# shades a 0.12 m strip at this sun slope (ray check, it2).
HOLES = [HATCH]
if args.art in ('r4', 'r5', 'r6'):
    HOLES += [tuple(float(v) for v in h.split(',')) for h in os.environ.get('HOLES', '0.6,1.6,1.0,1.6' if args.art == 'r6' else '-1.9,-0.9,0.95,1.75;-2.5,-1.0,2.45,2.75;-2.5,-1.0,2.87,3.17;-2.5,-1.0,3.29,3.59;0.6,1.6,1.0,1.6').split(';') if h]
    HOLES += [tuple(float(v) for v in h.split(',')) for h in os.environ.get('HOLES_ADD', '-1.5,0.4,-0.4,0.25' if args.art in ('r5', 'r6') else '').split(';') if h]   # D-061 experiments (e.g. a floor-patch hole)
if args.art in ('r3', 'r4', 'r5', 'r6'):
    hx0, hx1, hy0, hy1 = HATCH
    xs = sorted({-XW, XW, *[h[0] for h in HOLES], *[h[1] for h in HOLES]}); ys = sorted({Y0, Y1, *[h[2] for h in HOLES], *[h[3] for h in HOLES]})
    for xa, xb in zip(xs, xs[1:]):                              # ceiling as a grid of cells, minus the holes
        for ya, yb in zip(ys, ys[1:]):
            mx, my = (xa + xb) / 2, (ya + yb) / 2
            if any(h[0] < mx < h[1] and h[2] < my < h[3] for h in HOLES): continue
            box('Ceiling', (xb - xa, yb - ya, 0.15), (mx, my, H + 0.075), M_WALL, tile=2.0)
    for (hx0_, hx1_, hy0_, hy1_) in HOLES:
        dz = .22 if (hx0_, hx1_, hy0_, hy1_) == HATCH else .1
        for (sx, sy, cx, cy) in ((hx1_ - hx0_ + .12, .06, (hx0_ + hx1_) / 2, hy0_ - .03), (hx1_ - hx0_ + .12, .06, (hx0_ + hx1_) / 2, hy1_ + .03),
                                 (.06, hy1_ - hy0_, hx0_ - .03, (hy0_ + hy1_) / 2), (.06, hy1_ - hy0_, hx1_ + .03, (hy0_ + hy1_) / 2)):
            box('APR_hatch_trim', (sx, sy, dz), (cx, cy, H + .075 - dz / 2), M_BEAM, grain=True)   # the hole's mouth: a crisp edge for the light
else:
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
# D-049 r2: hero window over the nook (wide, uneven slats, one missing), two support windows (uneven), the rest closed
# (slats near vertical and overlapping = dark anchors). r1 keeps the original uniform 20-slat blinds.
WIN_ROLE = {3.95: 'hero', 1.0: 'support', -2.2: 'support'} if args.light == 'r2' else {}
if args.art == 'r3': WIN_ROLE = {}                              # one source (review G): the hatch; the windows stay closed (dark anchors)
def slat_layout(c, role):
    if role == 'hero':
        zs = [WZ0 + .07 + i * .105 + (.018 if i % 3 == 1 else 0) for i in range(12)]; zs.pop(5); return [(z, 38 + (14 if i == 7 else 0)) for i, z in enumerate(zs)]
    if role == 'support':
        r_ = random.Random(int(c * 10) + 7); zs, z = [], WZ0 + .06
        while z < WZ1 - .06: zs.append(z); z += .062 * (0.75 + 0.5 * r_.random())
        del zs[len(zs) // 2]; return [(z, 35) for z in zs]
    if role == 'closed':
        return [(WZ0 + .05 + i * (WZ1 - WZ0 - .08) / 34, 82) for i in range(34)]
    return [(WZ0 + 0.06 + i * (WZ1 - WZ0 - 0.1) / SLATS, 35) for i in range(SLATS)]
for c, w in WIN:
    role = WIN_ROLE.get(c, 'closed' if args.light == 'r2' else '')
    if args.light == 'r2':                                    # aperture depth: reveals + lintel give the beam a believable mouth
        for dy in (-w / 2 - .03, w / 2 + .03):
            box('APR_reveal', (0.28, 0.06, WZ1 - WZ0 + .1), (-XW + 0.1, c + dy, (WZ0 + WZ1) / 2), M_WALL)
        box('APR_lintel', (0.28, w + .12, 0.12), (-XW + 0.1, c, WZ1 + .06), M_WALL)
    for dz in (WZ0, WZ1):
        box('WinSill', (0.22, w + 0.08, 0.05), (-XW + 0.03, c, dz), M_FRAME)
    for dy in (-w / 2, 0, w / 2):
        box('WinMullion', (0.08, 0.05, WZ1 - WZ0), (-XW + 0.0, c + dy, (WZ0 + WZ1) / 2), M_FRAME)
    for z, ang in slat_layout(c, role):
        box('BLK_hero_slat' if role == 'hero' else 'BlindSlat', (0.055, w - 0.04, 0.003), (-XW + 0.12, c, z), M_SLAT, rot=(0, math.radians(ang), 0))
    box('BlindRail', (0.07, w, 0.04), (-XW + 0.12, c, WZ1 - 0.02), M_FRAME)
# ceiling beams across the aisle (foreground parallax while the camera descends)
for i, y in enumerate(np.linspace(-4.4, 4.0, 6)):
    box('Beam', (2 * XW, 0.2, 0.32), (0, y, H - 0.16), M_BEAM, grain=True)
    box('Purlin', (0.14, 1.4, 0.18), (0, y + 0.8, H - 0.09), M_BEAM, grain=True) if i < 5 and not (args.art in ('r3', 'r4', 'r5', 'r6') and i == 4) else None

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
M_BINDER = mat('binder', srgb('#9fb0bc' if args.palette == 'pastel' else '#2d3e4a'), 0.6)
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
# D-060 set dressing (review proposal 4, user 2026-10-09 "응" to the soft-shadow answer): soft shading needs broad light flat
# surfaces that receive a sun patch and bounce it (cabinet fronts, painted cell backs, a print), depth (open cells, set-back items)
# and plain areas where a gradient can read (book spines hide it). Cells are (column 0-4 left to right, shelf row 0-10 bottom up).
DRESS = {}
if args.dress:
    DRESS = {(2, r): 'cabinet' for r in range(4)}                    # under the centre skylight patch (z 0.65-1.5)
    DRESS.update({(3, 6): 'flat', (3, 7): 'print', (3, 8): 'sculpt', (1, 7): 'sculpt2', (1, 6): 'flat', (2, 8): 'open', (0, 5): 'print2', (4, 7): 'flat'})
    rd = random.Random(60)
    for ci in range(5):
        for r in range(11):
            if (ci, r) not in DRESS and rd.random() < .12: DRESS[(ci, r)] = 'sparse'
    M_PAINT = mat('cell_paint', srgb('#ebe2d0' if args.palette == 'pastel' else '#d9ccb4'), 0.9)
    M_DRAWER = mat('drawer_paint', srgb('#cdd5c4' if args.palette == 'pastel' else '#8f8170'), 0.8)
    M_PLASTER = mat('plaster_white', srgb('#efe9de'), 0.85)
    M_PRINT = [mat(f'print_{i}', srgb(h), 0.85) for i, h in enumerate(('#f2ebdc', '#d9805f', '#7f9e9a', '#2f4a5a', '#e3b55c'))]
    def lying_stack(x, z, n):                                     # books lying flat, spines out, each a little offset
        for k in range(n):
            w = rd.uniform(.2, .27); h = rd.uniform(.025, .045); d = rd.uniform(.15, .2)
            add_box_to(books_bm, x + rd.uniform(-.015, .015), BY + 0.27 - d / 2, z, w, d, h, rng.choices(range(N_BOOK), weights=BOOK_W)[0], rot_z=rd.uniform(-.04, .04)); z += h
    def dress(kind, a, b, z, avail):
        cx = (a + b) / 2; zc = z + avail / 2
        box('DRS_cellback', (b - a - .002, .006, avail + .02), (cx, BY + .27, zc), M_PAINT)
        if kind == 'flat':
            lying_stack(a + .2, z, 4); lying_stack(b - .35, z, 2)
            fill_run(a + .45, a + .85, z, avail, BY + 0.28, -1)
        elif kind in ('print', 'print2'):
            fw, fh = (.46, .32) if kind == 'print' else (.34, .3); fx = cx + (-.18 if kind == 'print' else .2)
            lean = math.radians(-9); fy = BY + .2
            box('DRS_frame', (fw, .02, fh), (fx, fy, z + fh / 2), M_WOOD, rot=(lean, 0, 0))
            box('DRS_canvas', (fw - .05, .022, fh - .05), (fx, fy - .001, z + fh / 2), M_PRINT[0], rot=(lean, 0, 0))
            for (dx, dz, sw, sh, mi) in ((-.08, .02, .12, .12, 1), (.07, -.03, .14, .07, 2), (.0, .08, .2, .025, 3), (.1, .06, .05, .05, 4)):
                box('DRS_print', (sw * fw / .46, .024, sh * fh / .32), (fx + dx * fw / .46, fy - .002 + math.sin(lean) * -dz, z + fh / 2 + dz * math.cos(lean)), M_PRINT[mi], rot=(lean, 0, 0))
            lying_stack(b - .32, z, 3) if kind == 'print' else lying_stack(a + .18, z, 3)
        elif kind in ('sculpt', 'sculpt2'):
            sx = cx + (.15 if kind == 'sculpt' else -.2)
            box('DRS_block', (.12, .12, .12), (sx, BY + .12, z + .06), M_PLASTER)
            box('DRS_block', (.08, .08, .08), (sx + .03, BY + .12, z + .16), M_PLASTER, rot=(0, 0, math.radians(30)))
            bpy.ops.mesh.primitive_uv_sphere_add(radius=.045, location=(sx - .03, BY + .1, z + .245)); o = bpy.context.active_object; o.name = 'DRS_ball'; o.data.materials.append(M_PLASTER); bpy.ops.object.shade_smooth()
            lying_stack(a + .15 if kind == 'sculpt' else b - .4, z, 3)
        elif kind == 'open':
            fill_run(a + T, a + .4, z, avail, BY + 0.28, -1)
        elif kind == 'sparse':
            fill_run(a + T, (a + b) / 2, z, avail, BY + 0.28, -1); lying_stack(b - .35, z, rd.randint(2, 5))
    ca, cb = xs[2] + T / 2, xs[3] - T / 2; z0, z1 = BACK_Z[0], BACK_Z[4]
    box('DRS_cabinet', (cb - ca, .33, z1 - z0), ((ca + cb) / 2, BY + .135, (z0 + z1) / 2), M_PAINT)
    for row in range(4):                                          # 2 × 4 drawer fronts, 6 mm reveals, brass pulls
        for col in range(2):
            w_ = (cb - ca - .03) / 2; h_ = (z1 - z0 - .05) / 4
            fx = ca + .01 + w_ / 2 + col * (w_ + .01); fz = z0 + .02 + h_ / 2 + row * (h_ + .003)
            box('DRS_drawer', (w_ - .006, .02, h_ - .006), (fx, BY - .035, fz), M_DRAWER)
            box('DRS_pull', (.09, .018, .014), (fx, BY - .05, fz + h_ * .18), M_BRASS)
for zi, z in enumerate(BACK_Z[:-1]):
    for ci, (a, b) in enumerate(zip(xs[:-1], xs[1:])):
        if a < -1.4 and z < 1.2: continue          # reading nook: no low shelves behind the desk
        kind = DRESS.get((ci, zi))
        if kind == 'cabinet': continue
        if kind: dress(kind, a + T, b - T, z + T / 2, BACK_Z[zi + 1] - z - T); continue
        fill_run(a + T, b - T, z + T / 2, BACK_Z[zi + 1] - z - T, BY + 0.28, -1)
cyl('LadderRail', 0.016, 2 * XW - 0.4, (0, BY - 0.08, 4.25), M_BRASS, rot=(0, math.radians(90), 0))

# ---------------- library ladder (the figure sits on it) ----------------
LAD_X, LAD_TOP, LAD_ANG = 0.55, 4.25, math.radians(14)
if args.art in ('r3', 'r4', 'r5', 'r6'): LAD_TOP = H + 0.02                           # up into the hatch
LAD_FOOT_Y = BY - 0.08 - LAD_TOP * math.tan(LAD_ANG)
# intro2: the Mixamo climb's rung spacing fitted with its hand/foot contacts (0.2525 m along the stile, max error 23 mm;
# the old 0.29 m left 79 mm) — the user allowed changing the ladder rather than the motion (2026-10-08)
RUNG_DZ = 0.2525 * math.cos(LAD_ANG) if args.intro2 else 0.29
def ladder():
    objs = []
    for dx in (-0.24, 0.24):
        o = box('LadderStile', (0.045, 0.07, LAD_TOP / math.cos(LAD_ANG) + 0.1), (LAD_X + dx, (LAD_FOOT_Y + BY - 0.08) / 2, LAD_TOP / 2), M_DARK, grain=True,
                rot=(-LAD_ANG, 0, 0)); objs.append(o)
    rungs = []
    for i in range(1, 20):
        z = i * RUNG_DZ
        if z > LAD_TOP - 0.1: break
        y = LAD_FOOT_Y + z * math.tan(LAD_ANG)
        if args.light == 'r2' or args.intro2:                                    # D-050 climb: round rungs (r 19 mm) the hands close around
            o = cyl('LadderRung', 0.019, 0.48, (LAD_X, y, z), M_DARK, rot=(0, math.radians(90), 0), verts=20); world_uv(o, 1.2, True)
        else:
            o = box('LadderRung', (0.48, 0.09, 0.03), (LAD_X, y, z), M_DARK, grain=True)
        objs.append(o); rungs.append((z, y))
    for dx in (-0.24, 0.24):
        if args.art in ('r3', 'r4', 'r5', 'r6'):                                     # free-standing: rubber feet, no rail wheels or hooks
            objs.append(box('LadderFoot', (0.06, 0.09, 0.03), (LAD_X + dx, LAD_FOOT_Y, 0.015), M_BLACK))
            continue
        objs.append(cyl('LadderWheel', 0.04, 0.03, (LAD_X + dx, LAD_FOOT_Y - 0.02, 0.04), M_BLACK, rot=(0, math.radians(90), 0)))
        objs.append(box('LadderHook', (0.03, 0.1, 0.06), (LAD_X + dx, BY - 0.08, LAD_TOP), M_BRASS))
    LADDER_OBJS[:] = objs
    return rungs
LADDER_OBJS = []
RUNGS = ladder()
# D-058 r3: the ladder (and later the climber) moved rigidly: the top centre to the hatch's left rim, turned about the vertical so the
# rungs run mostly in depth (seen at an angle from the aisle, the rails part and the rungs show as slats — REF-002), foot out to +x
LAD_YAW = math.radians(float(os.environ.get('LAD_YAW', 60)))
LAD_TOP_LOCAL = Vector((LAD_X, BY - 0.08, LAD_TOP))
LAD_M = Matrix.Identity(4)
if args.art in ('r3', 'r4', 'r5', 'r6'):
    hx0, hx1, hy0, hy1 = HATCH
    LAD_M = Matrix.Translation((hx0 + 0.06, (hy0 + hy1) / 2, LAD_TOP)) @ Matrix.Rotation(LAD_YAW, 4, 'Z') @ Matrix.Translation(-LAD_TOP_LOCAL)
    bpy.context.view_layer.update()
    for o in LADDER_OBJS: o.matrix_world = LAD_M @ o.matrix_world
    print('r3 ladder: foot centre', tuple(round(v, 3) for v in (LAD_M @ Vector((LAD_X, LAD_FOOT_Y, 0)))), 'top', tuple(round(v, 3) for v in (LAD_M @ LAD_TOP_LOCAL)))

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
# power strip on the open floor right of the cart (D-048 fix: the wall outlet behind the desk was never in frame).
# Its wall cord tucks under the back shelf; the computer's power cable runs across the floor beside the ECG trunk cable
# (the coupling the Story's power-line scene is about) and up the desk leg to the PC.
OUT = Vector((-0.95, 3.62, 0.0))
box('PowerStrip', (0.30, 0.07, 0.045), OUT + Vector((0, 0, 0.0225)), M_OUTLET)
for dx in (-0.09, -0.01, 0.07):
    for hx in (-0.01, 0.01):
        cyl('StripHole', 0.0035, 0.004, OUT + Vector((dx + hx, 0, 0.045)), M_BLACK, verts=8)
box('StripSwitch', (0.025, 0.035, 0.012), OUT + Vector((0.125, 0, 0.05)), mat('strip_lamp', srgb('#ff3a2a'), .4, emit=4.0))
box('Plug', (0.04, 0.035, 0.04), OUT + Vector((-0.09, 0, 0.065)), M_BLACK)
wall = [OUT + Vector((0.15, 0, 0.02)), OUT + Vector((0.26, 0.05, 0.01)), Vector((OUT.x + 0.3, BY - 0.2, 0.01)), Vector((OUT.x + 0.32, BY + 0.05, 0.01))]
wc = bpy.data.curves.new('wallcord', 'CURVE'); wc.dimensions = '3D'; wc.bevel_depth = 0.005; wc.bevel_resolution = 2
ws = wc.splines.new('POLY'); ws.points.add(len(wall) - 1)
for p_, v_ in zip(ws.points, wall): p_.co = (*v_, 1)
ws.type = 'NURBS'; ws.order_u = 3; ws.use_endpoint_u = True
wco = bpy.data.objects.new('WallCord', wc); scene.collection.objects.link(wco); wc.materials.append(M_CABLE)
cpts = [OUT + Vector((-0.09, 0, 0.085)), OUT + Vector((-0.12, -0.04, 0.03)), Vector((OUT.x - 0.3, OUT.y - 0.08, 0.01)),
        Vector((CART.x, CART.y - 0.42, 0.01)), Vector((DESK.x + 0.45, DESK.y - 0.35, 0.01)), Vector((DESK.x + 0.3, DESK.y - 0.1, 0.02)),
        Vector((DESK.x + 0.25, DESK.y + 0.15, 0.4)), Vector((DESK.x + 0.2, DESK.y + 0.22, mz + 0.06))]
cu = bpy.data.curves.new('cable', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.006; cu.bevel_resolution = 2
sp = cu.splines.new('POLY'); sp.points.add(len(cpts) - 1)
for p, v in zip(sp.points, cpts): p.co = (*v, 1)
sp.type = 'NURBS'; sp.order_u = 3; sp.use_endpoint_u = True
co = bpy.data.objects.new('PowerCable', cu); scene.collection.objects.link(co); cu.materials.append(M_CABLE)
# D-050 measurement chair beside the ECG cart, the power strip at its back-right (r2 only)
MCHAIR = Vector((-0.75, 3.15, 0))
CHAIR_FIT = None
def chair_fit(objs):
    """Seat height, backrest direction and the anchor point for the sitting figure, by casting rays at the chair mesh
    (the figure used to be placed at a guessed .44 m and sank through the cushion — user 2026-10-04)."""
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get()
    trees = [BVHTree.FromObject(o, dg) for o in objs if o.type == 'MESH']
    tw = [o.matrix_world.copy() for o in objs if o.type == 'MESH']
    def cast(a, d):
        best = None
        for t, M in zip(trees, tw):
            Mi = M.inverted(); h = t.ray_cast(Mi @ a, (Mi.to_3x3() @ d).normalized())
            if h[0] is not None:
                w = M @ h[0]; dist = (w - a).length
                if best is None or dist < best[1]: best = (w, dist)
        return best
    lo, hi = world_bbox(objs); c = (lo + hi) / 2
    pts = []
    for i in range(-12, 13):
        for j in range(-12, 13):
            a = Vector((c.x + i * .025, c.y + j * .025, hi.z + .2)); h = cast(a, Vector((0, 0, -1)))
            if h: pts.append(h[0])
    zs = sorted(p.z for p in pts if abs(p.x - c.x) < .12 and abs(p.y - c.y) < .12); seat_z = zs[len(zs) // 2]
    back = [p for p in pts if p.z > seat_z + .25]
    bc = sum(back, Vector()) / len(back); b = Vector((bc.x - c.x, bc.y - c.y, 0)).normalized()
    hit = cast(Vector((c.x, c.y, seat_z + .22)), b); dback = hit[1] if hit else .25
    yaw = math.atan2(-b.x, b.y)                                  # figure back (+y in the figure frame) toward the backrest
    anchor = Vector((c.x, c.y, seat_z + .01)) + b * (dback - .21)    # sit upright toward the front: knees past the cushion's front edge (user 2026-10-05: knees buried)     # buttock contact ~12 cm in front of the backrest face (seat front rises to 0.449)
    print(f'chair_fit: seat {seat_z:.3f} m, back dir ({b.x:.2f}, {b.y:.2f}), backrest face {dback:.3f} m, yaw {math.degrees(yaw):.1f}°')
    return dict(seat_z=seat_z, yaw=yaw, anchor=anchor)
if args.light == 'r2':
    # GreenChair_01 (Poly Haven CC0, native scale): armrests 0.21 m over the seat carry the seated forearm (D-053, user 2026-10-07
    # "의자 GreenChair_01로 교체"; was modern_arm_chair_01 at 0.82 m, armrests 0.15 m). Placed by chair-motion-v3.place_chair
    # (rotation_mode set, so its yaw applies — F-033), backrest toward +y as the old chair measured (yaw −0.6°), then moved to MCHAIR
    import importlib.util as _ilu
    _s = _ilu.spec_from_file_location('chair_motion', os.path.join(ROOT, 'scripts/assets/chair-motion-v3.py')); _cmv = _ilu.module_from_spec(_s); _s.loader.exec_module(_cmv)
    _mch = _cmv.place_chair(bpy, Vector, ROOT)['objects']; bpy.context.view_layer.update()
    _lo, _hi = world_bbox(_mch); _c = (_lo + _hi) / 2
    for _o in _mch:
        if _o.parent is None: _o.location += Vector((MCHAIR.x - _c.x, MCHAIR.y - _c.y, 0))
    for _o in _mch: _o['group'] = 'decor'; _o['mchair'] = True  # chair-motion-v3 drops this chair and places its own copy
    bpy.context.view_layer.update(); CHAIR_FIT = chair_fit(_mch)
    scene['chair_fit'] = list(CHAIR_FIT['anchor']) + [CHAIR_FIT['yaw'], CHAIR_FIT['seat_z']]
# floor clutter that makes the aisle lived-in (kept off the camera path x ∈ [−0.6, 0.6])
place('cardboard_box_01', -0.95, -2.2, 0, 0.32, rot=0.3)
place('cardboard_box_01', -0.92, -2.15, 0.32, 0.26, rot=-0.2)
place('wooden_crate_01', 0.95, 0.9, 0, 0.36, rot=1.2)
place('vintage_suitcase', 0.9, -0.6, 0, 0.18, rot=1.5)
place('drawer_cabinet', 3.0, 3.6, 0, 1.1, rot=math.radians(180))
place('vintage_wooden_drawer_01', -3.0, 4.2, 0.77, 0.3, rot=0)
place('power_box_01', -2.6, BY + 0.25, 1.6, 0.35, rot=math.radians(180))
for y in ((-1.8,) if args.art in ('r3', 'r4', 'r5', 'r6') else (-1.8, 1.3)):         # r3: the lamp at y 1.3 hung in front of the frontal shot
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
fig_path = os.path.join(A, f'body_v3_{args.pose}.glb' if args.pose else 'body_seated_v3.glb' if args.fig == 'v3' else 'body_seated.glb')
FROT = Matrix.Identity(3); FYAW = 0.0                           # figure yaw (D-050 spots); the original paths keep 0
if os.path.exists(fig_path) and not args.nofig:
    _fig = json.load(open(os.path.join(A, 'figure.json'), encoding='utf-8'))
    fj = _fig['poses_v3'][args.pose] if args.pose else _fig['seated_v3' if args.fig == 'v3' else 'seated']
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=fig_path)
    FIG = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
    rz, ry = RUNGS[4]                                            # 5th rung, 1.45 m
    seat = Vector(fj['seat'])
    FIG.location = (LAD_X - 0.0 - (seat.x + 0.08), ry - 0.06 - seat.y, rz + 0.015 - seat.z)
    if args.fig == 'v3':                                         # v3 sits centred between the stiles (its right hand grips the right stile)
        FIG.location = (LAD_X - seat.x, ry - 0.06 - seat.y, rz + 0.015 - seat.z)
    if args.pose:                                                # D-050 spots: (world point for the anchor, yaw). Seat anchors sit on the surface
        an = Vector(fj['anchor'])
        SPOTS = {'floor': (Vector((LAD_X + .95, BY - .19, 0)), 0.0),     # back against the shelf face (BY − .02); floor pose back reaches +.165
                 'chair': ((CHAIR_FIT['anchor'], CHAIR_FIT['yaw']) if CHAIR_FIT else (Vector((MCHAIR.x, MCHAIR.y + .02, .44)), math.radians(20))),
                 'desk': (Vector((DESK.x + .1, DESK.y - .75, .5)), math.pi),
                 'wall': (Vector((-XW + .2, 1.0, 0)), math.pi / 2)}
        if args.pose == 'ar_floor':                              # right of the ladder, back 4 cm off the shelf face (BY − .02)
            back = max(v.co.y for v in FIG.data.vertices) - an.y
            SPOTS['ar_floor'] = (Vector((LAD_X + .95, BY - .06 - back, 0)), 0.0)
        if args.pose == 'climb':                                 # ladder plane at the foot rung = the rung; climber faces the ladder (+y)
            FYAW = math.pi; FROT = Matrix.Rotation(FYAW, 3, 'Z')
            if 'rung0' in fj['stile']:                           # Rigify build: the figure's rung 0 centre = the ladder's first rung
                rz2, ry2 = RUNGS[0]; FIG.location = Vector((LAD_X, ry2, rz2)) - FROT @ Vector(fj['stile']['rung0'])
            else:
                rz2, ry2 = RUNGS[1]; ref = Vector((0, fj['stile']['plane_y0'], fj['stile']['feet_z']))
                FIG.location = Vector((LAD_X, ry2, rz2 + .015)) - FROT @ ref
        else:
            spot, FYAW = SPOTS[args.pose]; FROT = Matrix.Rotation(FYAW, 3, 'Z')
            FIG.location = spot - FROT @ an
        FIG.rotation_mode = 'XYZ'; FIG.rotation_euler = (0, 0, FYAW)     # the glTF importer leaves QUATERNION mode — euler alone is ignored
    def ring_material(look):
        """Stills stand-in for the web shader. h3: object Z bands. h3b: bands on the bone-axis coordinate (_SLICE) whose
        density is set per shot (H3c: closer → denser) + a soft rim. h5: frosted glass surface + faint bands."""
        rm = bpy.data.materials.new('rings_' + look); rm.use_nodes = True; nt = rm.node_tree; nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        if look == 'h3':
            src = nt.nodes.new('ShaderNodeSeparateXYZ'); tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], src.inputs[0]); coord = src.outputs['Z']
        else:
            at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = '_SLICE'; coord = at.outputs['Fac']
        dens = nt.nodes.new('ShaderNodeValue'); dens.name = 'density'; dens.outputs[0].default_value = 42
        mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY'; nt.links.new(coord, mth.inputs[0]); nt.links.new(dens.outputs[0], mth.inputs[1])
        pp = nt.nodes.new('ShaderNodeMath'); pp.operation = 'PINGPONG'; pp.inputs[1].default_value = .5; nt.links.new(mth.outputs[0], pp.inputs[0])
        band = nt.nodes.new('ShaderNodeMath'); band.operation = 'LESS_THAN'; band.inputs[1].default_value = .07; nt.links.new(pp.outputs[0], band.inputs[0])
        em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1.0, .9, .78, 1)
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .25
        if look == 'h5':
            k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 1.2; nt.links.new(band.outputs[0], k.inputs[0]); nt.links.new(k.outputs[0], em.inputs['Strength'])
            gl = nt.nodes.new('ShaderNodeBsdfPrincipled'); gl.inputs['Base Color'].default_value = (.92, .94, .97, 1)
            gl.inputs['Transmission Weight'].default_value = 1; gl.inputs['Roughness'].default_value = .42; gl.inputs['IOR'].default_value = 1.25
            add = nt.nodes.new('ShaderNodeAddShader'); nt.links.new(gl.outputs[0], add.inputs[0]); nt.links.new(em.outputs[0], add.inputs[1]); nt.links.new(add.outputs[0], out.inputs['Surface'])
        else:
            rim = nt.nodes.new('ShaderNodeMath'); rim.operation = 'MULTIPLY'; rim.inputs[1].default_value = .9 if look == 'h3b' else 0
            nt.links.new(lw.outputs['Facing'], rim.inputs[0])
            bs = nt.nodes.new('ShaderNodeMath'); bs.operation = 'MULTIPLY'; bs.inputs[1].default_value = 4.0; nt.links.new(band.outputs[0], bs.inputs[0])
            st = nt.nodes.new('ShaderNodeMath'); st.operation = 'ADD'; nt.links.new(bs.outputs[0], st.inputs[0]); nt.links.new(rim.outputs[0], st.inputs[1])
            nt.links.new(st.outputs[0], em.inputs['Strength'])
            vis = nt.nodes.new('ShaderNodeMath'); vis.operation = 'MAXIMUM'; nt.links.new(band.outputs[0], vis.inputs[0])
            rv = nt.nodes.new('ShaderNodeMath'); rv.operation = 'MULTIPLY'; rv.inputs[1].default_value = .35 if look == 'h3b' else 0
            nt.links.new(lw.outputs['Facing'], rv.inputs[0]); nt.links.new(rv.outputs[0], vis.inputs[1])
            mix = nt.nodes.new('ShaderNodeMixShader'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
            nt.links.new(vis.outputs[0], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs['Surface'])
        return rm
    rm = ring_material(args.look)
    FIG.data.materials.clear(); FIG.data.materials.append(rm)
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(A, 'heart.glb'))
    HEART = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
    HEART.rotation_mode = 'QUATERNION'
    HEART.rotation_quaternion = FROT.to_quaternion() @ Quaternion(fj['heart_q_wxyz'])
    HEART.location = FIG.location + FROT @ Vector(fj['heart_b'])
    hm2 = mat('heart_glow', srgb('#ff5a64'), .5, emit=6.0); HEART.data.materials.clear(); HEART.data.materials.append(hm2)
    print('figure seat at', tuple(round(v, 3) for v in FIG.location), 'heart', tuple(round(v, 3) for v in HEART.location))
CLIMB = None
if args.intro2 and not args.nofig:
    # the climber: leaned 18.5° (fitted: its hand and foot contacts coplanar within 14 mm on the 14° ladder), hands centred on the
    # ladder, slid along the stile to the rung phase that puts the contacts on rungs (offsets: grip = rung axis, 2 cm in front;
    # ball of the foot 4.5 cm above and 3 cm in front of the rung axis)
    cj = json.load(open(os.path.join(A, 'figure.json'), encoding='utf-8'))['poses_v3']['ar_climb']
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(A, 'body_v3_ar_climb.glb'))
    CLIMB = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
    CLIMB.rotation_mode = 'XYZ'; CPITCH = -math.radians(18.5); CROT = Matrix.Rotation(CPITCH, 3, 'X'); CLIMB.rotation_euler = (CPITCH, 0, 0)
    u_ = Vector((0, math.sin(LAD_ANG), math.cos(LAD_ANG))); n_ = Vector((0, math.cos(LAD_ANG), -math.sin(LAD_ANG)))
    O_ = Vector((LAD_X, LAD_FOOT_Y, 0)); L_ = RUNG_DZ / math.cos(LAD_ANG)
    OFF = {'hand': (0.0, -0.02), 'foot': (-0.045, -0.03)}
    cs = {k: CROT @ Vector(v) for k, v in cj['contacts'].items() if k != 'foot.R'}       # the right foot is mid-step in frame 1
    beta = sum(OFF[k.split('.')[0]][1] - c.dot(n_) for k, c in cs.items()) / len(cs)
    gam = LAD_X - sum(c.x for k, c in cs.items() if k.startswith('hand')) / 2
    # height: the left foot on rung 3 (≈ 0.74 m) — hands then near 2 m, the climber fills the shot under the ceiling beams;
    # the slide is then fine-tuned within ±L/2 so the three contacts share the rung phase best
    al0 = 3 * L_ + OFF['foot'][0] - cs['foot.L'].dot(u_)
    best = None
    for i in range(-25, 26):
        al = al0 + i * L_ / 50
        e = [((c.dot(u_) + al - OFF[k.split('.')[0]][0]) / L_) for k, c in cs.items()]
        err = max(abs(x - round(x)) for x in e) * L_
        if best is None or err < best[0]: best = (err, al)
    T_ = O_ + u_ * best[1] + n_ * beta
    CLIMB.location = Vector((gam, T_.y, T_.z)) - Vector((O_.x, 0, 0)) + Vector((O_.x, 0, 0)) * 0
    CLIMB.location.x = gam
    bpy.context.view_layer.update()
    if args.art in ('r3', 'r4', 'r5', 'r6'):                                         # same rigid move as the ladder: the contacts keep their rung fit
        CLIMB.matrix_world = LAD_M @ CLIMB.matrix_world; bpy.context.view_layer.update()
    LAD_MI = LAD_M.inverted()
    for k, v in cj['contacts'].items():
        w_ = LAD_MI @ (CLIMB.matrix_world @ Vector(v)); d_ = min(((w_.y - ry) ** 2 + (w_.z - rz) ** 2) ** .5 for rz, ry in RUNGS)
        print(f'   contact {k}: world {tuple(round(x, 3) for x in w_)}, nearest rung axis {d_ * 1000:.0f} mm')
    print(f'climber on the ladder: pitch 18.5°, rung contact max error {best[0] * 1000:.0f} mm, location {tuple(round(v, 3) for v in CLIMB.location)}')
    if args.art in ('r3', 'r4', 'r5', 'r6'):                                         # skill pose-anatomy step 7 for the climber: vs the room (the ladder is an intended contact)
        import importlib.util as _ilu2
        _s2 = _ilu2.spec_from_file_location('pc2', os.path.join(ROOT, 'scripts/assets/pose-check-v3.py')); pc2 = _ilu2.module_from_spec(_s2); _s2.loader.exec_module(pc2)
        _c2 = pc2.scene_collisions(CLIMB, [o for o in scene.objects if o not in (CLIMB,) and o.type == 'MESH'], ignore=('Haze', 'VOL_', 'APR_', 'heart', 'El_', 'Lead', 'Trunk', 'Comm', 'Sig_', 'Power'), reach=.09)   # reach ≈ 2 × stile thickness (pose-check docstring)
        print('climber collisions (mm):', {k: v for k, v in _c2.items()})
    CLIMB.data.materials.clear(); CLIMB.data.materials.append(rm)
# ---------------- v3: ECG electrodes, lead wires, trunk to the cart, cable to the computer (D-048) ----------------
def catmull(pts, n=10):
    P = [Vector(p) for p in pts]; P = [P[0]] + P + [P[-1]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2]); return out

def hang(a, b, sag, n=24):
    a, b = Vector(a), Vector(b)
    return [a.lerp(b, i / n) - Vector((0, 0, 4 * sag * (i / n) * (1 - i / n))) for i in range(n + 1)]

def tube(name, pts, r, m, sides=8):
    """Swept tube with UV u = length in metres (dash shaders count metres, not curve parameter)."""
    pts = [Vector(p) for p in pts]
    pts = [p for i, p in enumerate(pts) if i == 0 or (p - pts[i - 1]).length > 1e-5]
    T = [(pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(len(pts))]
    up = Vector((0, 0, 1)) if abs(T[0].z) < .9 else Vector((1, 0, 0))
    N = (up - up.dot(T[0]) * T[0]).normalized(); V, F, U = [], [], []
    acc = 0.0
    for i, p in enumerate(pts):
        if i: acc += (p - pts[i - 1]).length
        N = (N - N.dot(T[i]) * T[i]).normalized(); Bn = T[i].cross(N)
        for k in range(sides):
            a = 2 * math.pi * k / sides; V.append(p + r * (math.cos(a) * N + math.sin(a) * Bn))
        U.append(acc)
    for i in range(len(pts) - 1):
        for k in range(sides):
            F.append((i * sides + k, i * sides + (k + 1) % sides, (i + 1) * sides + (k + 1) % sides, (i + 1) * sides + k))
    me = bpy.data.meshes.new(name); me.from_pydata(V, [], F); me.update()
    uv = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index; uv.data[li].uv = (U[vi // sides], (vi % sides) / sides)
    for poly in me.polygons: poly.use_smooth = True
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); me.materials.append(m)
    o['length'] = acc; return o

def dash_mat(name, col, base=None, period=.045, duty=.42, phase=0.0, strength=4.5):
    """Neon dashes along the wire (stills preview of the web's moving dashed-line shader). base None = light only."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'UVMap'
    sx = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(uvn.outputs[0], sx.inputs[0])
    dv = nt.nodes.new('ShaderNodeMath'); dv.operation = 'MULTIPLY'; dv.inputs[1].default_value = 1 / period; nt.links.new(sx.outputs['X'], dv.inputs[0])
    ph = nt.nodes.new('ShaderNodeMath'); ph.operation = 'SUBTRACT'; ph.inputs[1].default_value = phase; nt.links.new(dv.outputs[0], ph.inputs[0])
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; nt.links.new(ph.outputs[0], fr.inputs[0])
    lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = duty; nt.links.new(fr.outputs[0], lt.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*col, 1); em.inputs['Strength'].default_value = strength
    if base is None:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); bs = tr
    else:
        bs = nt.nodes.new('ShaderNodeBsdfPrincipled'); bs.inputs['Base Color'].default_value = (*base, 1); bs.inputs['Roughness'].default_value = .45
    mx = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(lt.outputs[0], mx.inputs[0]); nt.links.new(bs.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface']); return m

C_BLUE, C_RED, C_PURPLE = srgb('#3d8bff'), srgb('#ff3048'), srgb('#b24dff')
M_WIRE = mat('lead_wire', srgb('#2a2c30'), .45)
if FIG is not None and args.fig == 'v3' and args.pose != 'floor':     # D-050: electrodes attach at the measurement spot, not on the floor
    FL = Vector(FIG.location)
    def Wp(v): return FL + FROT @ Vector(v)                       # figure frame → world (lead routing is computed in the figure frame)
    Ef = {k: (Vector(v['p']), Vector(v['n']).normalized()) for k, v in fj['electrodes'].items()}
    E = {k: (Wp(p), FROT @ n) for k, (p, n) in Ef.items()}
    J = {k: Wp(v) for k, v in fj['joints'].items()}
    M_FOAM = mat('electrode_foam', srgb('#e9e6df'), .85); M_GEL = mat('electrode_gel', srgb('#9aa3ad'), .5)
    M_SNAP = mat('electrode_snap', srgb('#c9ccd1'), .25, metal=1.0); M_CLIP = mat('lead_clip', srgb('#33363b'), .5)
    sig = args.signal
    lead_col = {'clean': C_BLUE, 'noise': C_RED}.get(sig)
    M_LEAD = dash_mat('lead_dash', lead_col, base=srgb('#2a2c30')) if lead_col else M_WIRE
    # yoke (lead-wire junction) resting on the lap, trunk cable from there to the cart
    # yoke clipped at the right side of the waist (D-048 fix: on the lap the leads converged at the groin); the trunk
    # leaves from there toward the cart side
    YOKE_f = Vector(fj['joints']['thigh.R']) + Vector((-.115, -.03, .11)); YOKE = Wp(YOKE_f)
    yk = box('LeadYoke', (.018, .06, .035), YOKE, M_CLIP); yk.rotation_euler = (0, 0, FYAW)
    for k, (p, n) in E.items():
        pf, nf = Ef[k]
        rot = n.to_track_quat('Z', 'Y').to_euler()
        cyl(f'El_{k}_foam', .019, .0016, p + n * .0008, M_FOAM, rot=tuple(rot), verts=24)
        cyl(f'El_{k}_gel', .011, .0008, p + n * .0020, M_GEL, rot=tuple(rot), verts=20)
        cyl(f'El_{k}_snap', .0045, .005, p + n * .0045, M_SNAP, rot=tuple(rot), verts=12)
        to_y = (YOKE - p); tdir = (to_y - to_y.dot(n) * n).normalized()
        clip = box(f'El_{k}_clip', (.016, .009, .007), p + n * .0085 + tdir * .006, M_CLIP)
        clip.rotation_euler = Matrix((tdir, n.cross(tdir), n)).transposed().to_euler()
        tf = (YOKE_f - pf); tf = (tf - tf.dot(nf) * nf).normalized(); af = pf + nf * .009 + tf * .015
        if fj['electrodes'][k].get('torso', k.startswith('V')):   # torso leads: off the skin, down in front of the belly to the yoke
            mid = Vector((pf.x * .45 + YOKE_f.x * .55, min(pf.y, YOKE_f.y) - .06, (pf.z + YOKE_f.z) / 2 + .02))
            ptsf = [af, af + nf * .02 + tf * .02, mid, YOKE_f + Vector((.0, -.025, .0))]
        elif k in ('LL', 'RL'):          # ankle leads: up along the shin front
            mid = Vector((pf.x * .6 + YOKE_f.x * .4, pf.y - .05, (pf.z + YOKE_f.z) / 2))
            ptsf = [af, af + nf * .03, mid, YOKE_f + Vector((0, -.025, -.012))]
        else:                            # wrist leads: a soft sag to the lap
            mid = (af + YOKE_f) / 2 + nf * .03 - Vector((0, .04, .06))
            ptsf = [af, af + nf * .03, mid, YOKE_f + Vector((0, -.025, .012))]
        tube(f'Lead_{k}', [Wp(q_) for q_ in catmull(ptsf, 10)], .0013, M_LEAD, sides=6)
    # trunk: yoke → over the right thigh → hanging catenary to the ECG device on the cart
    dev_in = Vector((CART.x + .21, CART.y, .88))
    t0 = Wp(YOKE_f + Vector((-.05, -.03, -.06))); t1 = Wp(Vector((-.4, YOKE_f.y - .2, YOKE_f.z - .3)))
    sag = .45 if (t1 - dev_in).length > 1.2 else .12
    trunk = catmull([YOKE, t0, t1], 8) + hang(t1, dev_in + Vector((.25, 0, .05)), sag, 30)[1:] + [dev_in + Vector((.06, 0, 0)), dev_in]
    tube('TrunkCable', trunk, .0032, dash_mat('trunk_dash', lead_col, base=srgb('#2a2c30'), period=.06) if lead_col else M_WIRE, sides=10)
    # communication cable: ECG device → floor → computer (purple in both states)
    # communication cable over the desk top (D-048 fix: it ran under the desk and never read): device → sag → desk → PC
    pc_in = Vector((DESK.x - .05 + .225, DESK.y - .05, .77 + .08))
    dev_out = Vector((CART.x - .21, CART.y - .05, .89))
    comm = catmull([dev_out, dev_out + Vector((-.08, -.04, -.05)), Vector(((CART.x + DESK.x) / 2 + .2, DESK.y - .2, .70)),
                    Vector((DESK.x + .45, DESK.y - .22, .775)), Vector((DESK.x + .3, DESK.y - .15, .775)), pc_in + Vector((.06, -.02, -.07)), pc_in], 10)
    tube('CommCable', comm, .0045, dash_mat('comm_dash', C_PURPLE, base=srgb('#2a2c30'), period=.07, strength=7) if sig != 'off' else M_WIRE, sides=10)
    # inside-body signal paths heart → electrode (blue, seen through the frosted H5 body)
    if sig != 'off' or args.export_rig:
        HB = Vector(HEART.location); M_SIG = dash_mat('signal_dash', C_BLUE, base=None, period=.03, duty=.5, strength=3.5)
        for k, (p, n) in E.items():
            q = p - n * .012
            if fj['electrodes'][k].get('torso', k.startswith('V')): path = catmull([HB, HB.lerp(q, .5) + FROT @ Vector((0, -.01, .01)), q], 8)
            elif k == 'LA': path = catmull([HB, J['upper.L'], J['fore.L'], J['hand.L'].lerp(J['fore.L'], .25), q], 8)
            elif k == 'RA': path = catmull([HB, J['upper.R'], J['fore.R'], q], 8)
            elif k == 'LL': path = catmull([HB, J['spine'], J['thigh.L'], J['shin.L'], q], 8)
            else: path = catmull([HB, J['spine'], J['thigh.R'], J['shin.R'], q], 8)
            tube(f'Sig_{k}', path, .0016, M_SIG, sides=6)
    # noise state: the power line from the outlet to the computer carries red dashes; RA (grip arm) site glows red
    ra_ring = [E['RA'][0] + E['RA'][1] * .002 + (Matrix.Rotation(a, 3, E['RA'][1]) @ (E['RA'][1].orthogonal().normalized() * .024)) for a in np.linspace(0, 2 * math.pi, 33)]
    if sig == 'noise':
        pw = bpy.data.objects.get('PowerCable')
        if pw is not None:
            pw.hide_render = True
            tube('PowerNoise', catmull([tuple(p) for p in cpts], 10), .0062, dash_mat('power_dash', C_RED, base=srgb('#202020'), period=.05), sides=10)
        ring = tube('RA_noise_ring', ra_ring, .0018, dash_mat('ra_ring', C_RED, base=None, period=.012, duty=.6, strength=6), sides=6)
    if args.export_rig:
        # B2: the same paths as the stills (power line = the PowerNoise sweep of the floor cable, ring = the RA ring), plain
        # materials — the web replaces them by object name. UV u = metres from the path start, which is the signal source
        # (heart → electrode → yoke → cart → computer; power strip → computer), so dashes flow toward increasing u.
        tube('PowerLine', catmull([tuple(p) for p in cpts], 10), .0062, M_CABLE, sides=10)
        if bpy.data.objects.get('RA_noise_ring') is None: tube('RA_noise_ring', ra_ring, .0018, M_WIRE, sides=6)
        RIG_OUT = os.path.join(ROOT, args.export_rig); os.makedirs(RIG_OUT, exist_ok=True)
        rig = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith(('El_', 'LeadYoke', 'Lead_', 'TrunkCable', 'CommCable', 'PowerLine', 'Sig_', 'RA_noise_ring'))]
        for o in rig:
            if 'length' not in o: o['length'] = 0.0
        bpy.ops.object.select_all(action='DESELECT')
        for o in rig: o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(RIG_OUT, 'rig.glb'), export_format='GLB', use_selection=True, export_extras=True,
                                  export_cameras=False, export_lights=False, export_texcoords=True, export_normals=True, export_materials='NONE')
        print('rig exported', len(rig), 'objects', sorted({o.name.split('_')[0] for o in rig}), flush=True)


# ---------------- light: sun through the blinds + dim sky + warm lamp bulbs ----------------
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 11.0; sun.angle = math.radians(1.2); sun.color = srgb('#ffd9a8')
so = bpy.data.objects.new('sun', sun); scene.collection.objects.link(so)
SUN_TO = Vector((0.85, 0.06, -0.50)).normalized()   # across the gaps between stacks and over the nook onto the ladder and figure
if args.light == 'r2':                                 # steeper: the hero window's beam crosses the ladder and lands at its foot (D-050 floor spot)
    SUN_TO = Vector((0.807, 0.07, -0.584)).normalized(); sun.angle = math.radians(0.55)
if args.art in ('r3', 'r4', 'r5', 'r6'):                                   # through the hatch onto the back shelves (receiver), cream light (review D)
    SUN_TO = Vector(tuple(float(v) for v in os.environ.get('SUN_DIR', '0.22,0.62,-0.75').split(','))).normalized(); sun.color = srgb('#fff0dc'); sun.energy = float(os.environ.get('SUN_E', {'r5': 26.0, 'r6': 22.0}.get(args.art, 20.0)))
if args.art in ('r4', 'r5', 'r6'):                      # D-059: a larger sun disc so every hole's edge gets a penumbra (≈ 3.5 cm per metre of throw at 2°)
    sun.angle = math.radians(float(os.environ.get('SUN_ANG', 0.5 if args.art == 'r6' else 2.0)))   # r6 (F-040): crisp like REF, sigma 0.8 px
so.rotation_euler = SUN_TO.to_track_quat('-Z', 'Y').to_euler()
if args.art == 'r6':                                   # D-062 (F-040): the REF key is a near small lamp (crisp edges + falloff inside one light)
    hx0, hx1, hy0, hy1 = HATCH; hc = Vector(((hx0 + hx1) / 2, (hy0 + hy1) / 2, H))
    KEY_D = float(os.environ.get('KEY_D', 2.2))                  # metres back along the light direction from the hatch centre
    KEY_TO = Vector(tuple(float(v) for v in os.environ.get('KEY_DIR', '0.45,0.5,-0.74').split(','))).normalized()
    K = bpy.data.lights.new('key', 'SPOT'); K.energy = float(os.environ.get('KEY_E', 5500)); K.color = srgb(os.environ.get('KEY_COL', '#fff0e2'))
    K.shadow_soft_size = float(os.environ.get('KEY_R', 0.06)); K.spot_size = math.radians(110); K.spot_blend = 0.3
    ko = bpy.data.objects.new('key', K); ko.location = hc - KEY_TO * KEY_D; ko.rotation_euler = KEY_TO.to_track_quat('-Z', 'Y').to_euler(); scene.collection.objects.link(ko)
    print('r6 key at', tuple(round(v, 2) for v in ko.location), 'energy', K.energy)
w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('#7d96c4'), 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.4 if args.light == 'r1' else float(os.environ.get('SKY_E', {'r4': 2.4, 'r5': 0.8, 'r6': 0.5}.get(args.art, 1.8))) if args.art in ('r3', 'r4', 'r5', 'r6') else 0.9   # cool sky fill vs warm sun (r2: less fill = dark anchors)
for y in (() if args.art in ('r3', 'r4', 'r5', 'r6') else (-1.8, 1.3)):              # r3: one source — the bulbs stay off
    L = bpy.data.lights.new('bulb', 'POINT'); L.energy = 60; L.color = srgb('#ffb36b'); L.shadow_soft_size = 0.05
    lo_ = bpy.data.objects.new('bulb', L); lo_.location = (0, y, H - 1.45); scene.collection.objects.link(lo_)
if args.light == 'r2':
    # practicals with a story role (D-050): pendant over the measurement chair, desk lamp over the keyboard (an electrical device
    # itself — the power-line scene's light)
    place('hanging_industrial_lamp', MCHAIR.x + .05, MCHAIR.y - .1, H - 2.25, 1.0)
    L = bpy.data.lights.new('pendant', 'SPOT'); L.energy = 70; L.color = srgb('#ffc58a'); L.spot_size = math.radians(70); L.spot_blend = .6; L.shadow_soft_size = .06
    lo_ = bpy.data.objects.new('pendant', L); lo_.location = (MCHAIR.x + .05, MCHAIR.y - .1, H - 2.3); lo_.rotation_euler = (0, 0, 0); scene.collection.objects.link(lo_)
    L = bpy.data.lights.new('desklamp', 'SPOT'); L.energy = 18; L.color = srgb('#ffcf96'); L.spot_size = math.radians(60); L.spot_blend = .5; L.shadow_soft_size = .02
    lo_ = bpy.data.objects.new('desklamp', L); lo_.location = (DESK.x + .3, DESK.y - .05, mz + .42)
    lo_.rotation_euler = (Vector((DESK.x - .05, DESK.y - .3, mz)) - lo_.location).to_track_quat('-Z', 'Y').to_euler(); scene.collection.objects.link(lo_)
# preview-only haze so the beams read in stills (the web uses ray-marched shafts instead)
hz = box('Haze', (2 * XW - 0.1, Y1 - Y0 - 0.1, H - 0.1), (0, (Y0 + Y1) / 2, H / 2), mat('haze_dummy', (1, 1, 1)))
hm = bpy.data.materials.new('haze'); hm.use_nodes = True; nt = hm.node_tree
nt.nodes.remove(nt.nodes['Principled BSDF']); vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = 0.022 if args.light == 'r1' else 0.0012 if args.art in ('r3', 'r4', 'r5', 'r6') else 0.006
nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume']); hz.data.materials.clear(); hz.data.materials.append(hm)
if args.light == 'r2':                                 # local density on the hero corridor only (manual §7: low global, local where the beam is)
    a_ = Vector((-XW + .1, 3.95, 4.05)); b_ = a_ + SUN_TO * 6.2
    if args.art in ('r3', 'r4', 'r5', 'r6'):                               # the hatch beam: the one light curtain, among the other light types (user 2026-10-09)
        hx0, hx1, hy0, hy1 = HATCH; a_ = Vector(((hx0 + hx1) / 2, (hy0 + hy1) / 2, H)) - SUN_TO * 0.3; b_ = a_ + SUN_TO * 6.2
    vc = box('VOL_hero_corridor', (6.2, 0.95 if args.art not in ('r3', 'r4', 'r5', 'r6') else 1.05, 0.9 if args.art not in ('r3', 'r4', 'r5', 'r6') else 1.15), (a_ + b_) / 2, mat('vol_dummy', (1, 1, 1)))
    vc.rotation_euler = SUN_TO.to_track_quat('X', 'Z').to_euler()
    vm = bpy.data.materials.new('vol_hero'); vm.use_nodes = True; vn = vm.node_tree; vn.nodes.remove(vn.nodes['Principled BSDF'])
    vv = vn.nodes.new('ShaderNodeVolumePrincipled'); vv.inputs['Density'].default_value = 0.05
    vn.links.new(vv.outputs[0], vn.nodes['Material Output'].inputs['Volume']); vc.data.materials.clear(); vc.data.materials.append(vm)
    hz_extra = [vc]
else:
    hz_extra = []

# ---------------- preview shots (SPACE-R1-ARCHIVE §3–4) ----------------
SHOTS = {
    's1_top':     ((0.0, -3.8, 4.75), (0.0, 1.2, 0.0), 24),     # just under the roof, looking down the aisle
    's2_beams':   ((0.0, -4.6, 3.3), (0.2, 3.0, 1.2), 22),     # below the beams, beams in the foreground
    's3_aisle':   ((0.0, -3.2, 1.9), (0.5, 4.2, 1.6), 30),     # walking the aisle, stack ends pass
    's4_person':  ((0.25, 1.2, 1.95), (0.5, 3.9, 1.85), 40),    # medium on the seated figure
    's5_crane':   ((0.9, 0.6, 3.5), (-1.0, 4.1, 0.8), 34),     # Story PLI: outlet, cable, desk, ladder + figure in one frame
    's6_grip':    ((-0.55, 2.75, 1.05), (0.25, 3.85, 1.55), 45),  # Story MA: low angle at the hand on the stile
}
if FIG is not None and 'hand_r' in fj and not args.pose:
    HR = FIG.location + Vector(fj['hand_r'])
    SHOTS['s6_grip'] = (tuple(HR + Vector((-0.75, -0.95, -0.35))), tuple(HR + Vector((0.05, 0.1, 0.25))), 38)
    if args.fig == 'v3':   # hand + RA electrode fill the frame (the v2 framing left the hand at the edge)
        SHOTS['s6_grip'] = (tuple(HR + Vector((-0.42, -0.42, 0.08))), tuple(HR + Vector((0.0, 0.0, 0.07))), 30)
        CH = FIG.location + sum((Vector(e['p']) for e in fj['electrodes'].values()), Vector()) / len(fj['electrodes'])
        SHOTS['s7_chest'] = (tuple(CH + Vector((0.35, -1.25, 0.18))), tuple(CH + Vector((-0.04, 0.05, -0.12))), 34)
if args.pose and FIG is not None:                                 # skill pose-anatomy step 7: figure vs scene objects (chair, stool, ladder, shelves, desk)
    import importlib.util as _ilu
    _s = _ilu.spec_from_file_location('pc', os.path.join(ROOT, 'scripts/assets/pose-check-v3.py')); pc = _ilu.module_from_spec(_s); _s.loader.exec_module(pc)
    bpy.context.view_layer.update()
    _skip = ('El_', 'Lead_', 'LeadYoke', 'TrunkCable', 'CommCable', 'Sig_', 'RA_noise_ring', 'PowerNoise', 'Haze', 'VOL_', 'APR_', 'Floor', 'heart')
    _col = pc.scene_collisions(FIG, [o for o in scene.objects if o is not HEART], ignore=_skip)
    SOFT = {'modern_arm_chair_01': 35, 'GreenChair_01': 35}                           # upholstered (leather cushion): thighs may sink a little; 60 mm buried the knees (user 2026-10-05)
    _st = {k: ('FAIL' if v[0] > SOFT.get(k, 25) else 'WARN' if v[0] > 10 else 'OK') for k, v in _col.items()}
    print('figure collisions (mm, figure-frame point):', _col, '→', _st, '→', 'FAIL' if 'FAIL' in _st.values() else 'WARN' if 'WARN' in _st.values() else 'OK')
if args.pose and FIG is not None:                                 # D-050 shots: one per spot, each opening a new part of the archive
    AW = FIG.location + FROT @ Vector(fj['anchor'])
    SHOTS = {
        'floor': {'d1_floor_wide': ((-0.1, 0.9, 1.55), (1.0, 4.3, 0.85), 40), 'd2_floor_mid': ((0.25, 2.7, 0.85), (1.05, 4.3, 0.5), 38)},
        'chair': {'d3_chair': (tuple(AW + Vector((1.15, -1.55, .55))), tuple(AW + Vector((0, 0, .45))), 40)},
        'desk': {'d4_desk': ((-0.15, 1.75, 1.55), (-1.75, 3.3, .55), 32)},      # second draft: the power strip + line in frame
        'wall': {'d5_wall': ((-0.25, 1.0, 1.5), (-3.4, 1.0, 1.3), 40)},
        'climb': {'d6_climb': ((2.45, 2.2, 1.7), (LAD_X, 3.85, 1.9), 52)},
        'ar_floor': {'i1_wide': ((-0.35, 1.0, 1.8), (LAD_X + .5, 4.0, 1.2), 46), 'i2_climb': ((-0.1, 1.3, 1.9), (LAD_X, 3.8, 1.6), 46),
                     'i3_floor': (tuple(AW + Vector((-.55, -1.7, .65))), tuple(AW + Vector((0, 0, .38))), 38)},
    }[args.pose]
    if args.pose in ('chair', 'desk', 'wall', 'climb'): SHOTS = dict(SHOTS)
    if args.art in ('r3', 'r4', 'r5', 'r6'):                                         # D-058: frontal on the back shelves like REF-002; the side ladder crosses the frame
        SHOTS = {'a1_front': ((0.15, 0.95, 1.6), (0.75, 4.7, 2.75), 52), 'a2_near': ((0.55, 1.25, 1.45), (0.8, 4.7, 2.2), 52)}
    if args.pose == 'climb' and 'hand_r' in fj:                  # second draft: muscle-artifact close-up — the gripping hand and RA together
        HR = FIG.location + FROT @ Vector(fj['hand_r']); RA = FIG.location + FROT @ Vector(fj['electrodes']['RA']['p'])
        mid = RA.lerp(HR, .5)                                    # behind-right and above the climber: gripping hand + chest (RA through the glass body)
        SHOTS['d7_climb_close'] = (tuple(mid + Vector((.6, -.8, .35))), tuple(mid), 38)
if args.clay:                                                     # D-049 clay gate A: grey diffuse everywhere, no volume, no emission
    CLAY = mat('clay_gate', (.5, .5, .5), .8)
    for o in scene.objects:
        if o.type == 'MESH':
            if o.name.startswith(('Haze', 'VOL_')): o.hide_render = True; continue
            o.data.materials.clear(); o.data.materials.append(CLAY)
            for c_ in o.children_recursive:
                if c_.type == 'MESH': c_.data.materials.clear(); c_.data.materials.append(CLAY)
if args.save:
    bpy.ops.wm.save_as_mainfile(filepath=args.save)
if args.preview:
    os.makedirs(args.preview, exist_ok=True)
    rx, ry = map(int, args.res.split('x'))
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = args.samples; scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = rx, ry; scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = float(os.environ.get('EXPO', {'r5': 0.9, 'r6': 0.15}.get(args.art, 0.8)))
    if os.environ.get('LOOK', 'AgX - Punchy' if args.art in ('r5', 'r6') else ''): scene.view_settings.look = os.environ.get('LOOK', 'AgX - Punchy')   # D-061 tone-curve test (e.g. 'AgX - Punchy')
    scene.cycles.max_bounces = int(os.environ.get('BOUNCES', 6)) if args.art in ('r3', 'r4', 'r5', 'r6') else 4; scene.cycles.diffuse_bounces = min(scene.cycles.max_bounces, int(os.environ.get('BOUNCES', 4))); scene.cycles.volume_bounces = 0   # Cycles caps diffuse at 4 by default (D-061)
    want = set(args.shots.split(',')) if args.shots else set(SHOTS)
    if args.signal != 'off' and not args.clay:                    # neon glow for the dash preview (the web uses its bloom pass)
        scene.use_nodes = True; ct = scene.node_tree; rl = ct.nodes.get('Render Layers') or ct.nodes.new('CompositorNodeRLayers')
        cmp = ct.nodes.get('Composite') or ct.nodes.new('CompositorNodeComposite'); gl = ct.nodes.new('CompositorNodeGlare')
        try: gl.glare_type = 'BLOOM'
        except Exception: gl.glare_type = 'FOG_GLOW'
        for nm_, v_ in (('threshold', 1.6), ('size', 7), ('mix', -0.55)):
            if hasattr(gl, nm_): setattr(gl, nm_, v_)
        for sock, v_ in (('Threshold', 1.6), ('Strength', .6), ('Size', .5)):
            if sock in gl.inputs: gl.inputs[sock].default_value = v_
        ct.links.new(rl.outputs['Image'], gl.inputs[0]); ct.links.new(gl.outputs[0], cmp.inputs['Image'])
    for name, (loc, tgt, fov) in SHOTS.items():
        if name not in want: continue
        cd = bpy.data.cameras.new(name); cd.angle = math.radians(fov * 16 / 9) if False else math.radians(fov)
        cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov)
        c = bpy.data.objects.new(name, cd); c.location = loc; scene.collection.objects.link(c)
        c.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        if FIG is not None and FIG.data.shape_keys and 'grip' in FIG.data.shape_keys.key_blocks:
            FIG.data.shape_keys.key_blocks['grip'].value = 1.0 if name in ('s6_grip', 'd6_climb') else 0.0     # the grip shots show the clenched hand
        if FIG is not None and args.look != 'h3' and not args.clay:
            dist = (Vector(loc) - (FIG.location + Vector((0, 0, 1.0)))).length
            FIG.data.materials[0].node_tree.nodes['density'].outputs[0].default_value = float(np.clip(42 * 4.0 / max(dist, .5), 42, 170))   # H3c
        scene.camera = c; tag = f'_{args.look}' if args.look != 'h3' else ''
        if args.fig == 'v3': tag += f'_v3_{args.signal}'
        if args.pose: tag = f'_{args.light}' + ('_clay' if args.clay else f'_{args.signal}')
        if args.art: tag += f'_{args.art}_{args.palette}' + ('_dress' if args.dress else '')
        scene.render.filepath = os.path.join(args.preview, name + tag + '.png')
        bpy.ops.render.render(write_still=True)
        print('rendered', name)

# ---------------- bake + web export (attic method: albedo-free direct + indirect light, sqrt-encoded) ----------------
if args.bake:
    import json, time
    OUT = os.path.join(ROOT, args.bake); os.makedirs(OUT, exist_ok=True)
    # the figure, heart and preview haze are not part of the baked room (the figure is light, it casts no shadow)
    FIG_LOC = FIG.location.copy() if FIG is not None else None
    CLIMB_LOC = CLIMB.location.copy() if CLIMB is not None else None
    for o in [x for x in (FIG, globals().get('HEART'), CLIMB, hz, *hz_extra) if x is not None]:
        bpy.data.objects.remove(o, do_unlink=True)
    # v3 rig (electrodes, leads, trunk, comm, signal paths) and the power line are web objects with their own dash
    # shader (IMPL_BRIEF_FIGURE_V3_WEB B2), never baked into the room
    RIG_PREFIX = ('El_', 'Lead_', 'LeadYoke', 'TrunkCable', 'CommCable', 'Sig_', 'RA_noise_ring', 'PowerNoise', 'PowerCable')
    for o in [x for x in scene.objects if x.name.startswith(RIG_PREFIX)]:
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
        if g in ('decor', 'books'):          # small/dense meshes: per-corner light (books are tiny boxes — a shared lightmap leaves ~2 texels per face)
            o = join('Archive_' + g, objs, lm=False)
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
        if g in ('decor', 'books'):
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
    if CLIMB_LOC is not None:
        man['climb'] = {'location': b2t(CLIMB_LOC), 'pitch_x_rad': CPITCH, 'glb': 'body_v3_ar_climb.glb', 'rung_dz': RUNG_DZ}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), indent=1)
    print('exported', OUT)
