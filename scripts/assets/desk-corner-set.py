"""Story desk corner — prop set with baked light (D-070 A, user 2026-10-16 "A안으로 진행해줘. 컴퓨터는 빼고 소품으로 바꿔줘").

Why: the user wants the leoparpeix look (REF-002 §11): one small sun, crisp contact shadows where the occluder touches the
receiver, and soft free-form shadows from something off screen (window bars, foliage), on simple bevelled props whose
texture never smears. The web archive keeps books/props as per-vertex light and the computer was real-time PBR, so neither
can carry a shadow edge. This builds a self-contained set in the archive frame (x right, y into the room, z up; desk corner
around DESK) — desk with drawers, card-catalogue cabinet with brass pulls, two frames with blank ECG grid paper (no trace,
decorative space rule), plaster polyhedra, a book stack, a stool, a rug and wainscot panels that receive the shadows — and
lights it with one sun plus off-screen occluders (window bars + a foliage cluster) that exist only here.
Stand-ins for the room (floor, left and back wall, shelf mass) give bounce and occlusion.

Modes:
  python scripts/assets/desk-corner-set.py --preview OUTDIR [--samples 96]   Cycles stills from the Story cameras
  python scripts/assets/desk-corner-set.py --bake [--samples 256]              colour x light textures + glb (web)
The archive bake (scripts/blender/build_archive.py) is not touched (archive-light session).
"""
import argparse, json, math, os, random, sys
import bpy, bmesh
from mathutils import Vector, Matrix

ap = argparse.ArgumentParser()
ap.add_argument('--preview', default='')
ap.add_argument('--bake', action='store_true')
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--res', default='960x540')
ap.add_argument('--shots', default='pli7,pli5,pli85')
ap.add_argument('--sun', default='')            # override sun "to" direction x,y,z (archive frame)
ap.add_argument('--sunang', type=float, default=2.2)
ap.add_argument('--clay', action='store_true')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'noise', 'assets', 'desk_corner')
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
DESK, TOP = Vector((-2.45, 3.62, 0.0)), 0.76            # new desk (old: -2.35, 3.55; 1.9 x 0.9)
WALL_X, WALL_Y = -3.6, 5.0                                # archive room min x / max y (manifest room)

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c)

# ---------------- materials ----------------
def mat(name, hexc, rough=.6, metal=0., spec=.35):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = spec
    return m

def oak(name, a='#8a5f3a', b='#6b4527', scale=6., rough=.5):
    """oak: wave bands + fine noise, along the object's local x (planks run lengthwise)"""
    m = mat(name, a, rough); nt = m.node_tree; N = nt.nodes; L = nt.links; bsdf = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, scale, scale)
    wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Y'; wv.inputs['Scale'].default_value = 2.2
    wv.inputs['Distortion'].default_value = 6.0; wv.inputs['Detail'].default_value = 3.0
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 140.; nz.inputs['Detail'].default_value = 2.
    ramp = N.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (*srgb(b), 1); ramp.color_ramp.elements[1].color = (*srgb(a), 1)
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = .12
    L.new(tc.outputs['Object'], mp.inputs['Vector']); L.new(mp.outputs['Vector'], wv.inputs['Vector']); L.new(mp.outputs['Vector'], nz.inputs['Vector'])
    L.new(wv.outputs['Fac'], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], mix.inputs['A']); L.new(nz.outputs['Color'], mix.inputs['B'])
    L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    return m

def grid_paper_image(name, w=1024, h=768):
    """blank ECG grid paper (1 mm / 5 mm), cream with pink lines — no trace (decorative space rule)"""
    img = bpy.data.images.new(name, w, h, alpha=False); px = [0.0] * (w * h * 4)
    paper, fine, bold = srgb('#efe6d4'), srgb('#e6b9ad'), srgb('#d58f84')
    mm = w / 160.0                                                     # 160 mm wide sheet
    for y in range(h):
        gy = (y / mm); fy = abs(gy - round(gy)) * mm < .55; by = abs(gy / 5 - round(gy / 5)) * 5 * mm < .9
        for x in range(w):
            gx = (x / mm); fx = abs(gx - round(gx)) * mm < .55; bx = abs(gx / 5 - round(gx / 5)) * 5 * mm < .9
            c = bold if (bx or by) else fine if (fx or fy) else paper
            i = (y * w + x) * 4; px[i:i + 4] = (*c, 1.0)
    img.pixels = px; return img

def paper_mat(name):
    m = mat(name, '#efe6d4', .85); nt = m.node_tree; N = nt.nodes
    tx = N.new('ShaderNodeTexImage'); tx.image = grid_paper_image(name + '_img'); tx.interpolation = 'Cubic'
    nt.links.new(tx.outputs['Color'], N['Principled BSDF'].inputs['Base Color']); return m

M = {
    'oak': oak('set_oak'), 'oak_dark': oak('set_oak_dark', '#5a3a22', '#3f2716', 7.),
    'brass': mat('set_brass', '#a8823f', .32, .85), 'plaster': mat('set_plaster', '#e8e2d6', .82, spec=.25),
    'wainscot': mat('set_wainscot', '#4a4f45', .7), 'frame': mat('set_frame', '#2a211b', .45),
    'rug': mat('set_rug', '#7a3b2c', .95, spec=.1), 'rug_border': mat('set_rug_border', '#d7c7a6', .95, spec=.1),
    'cloth_r': mat('set_cloth_r', '#6e2a24', .8), 'cloth_b': mat('set_cloth_b', '#2c3a4f', .8), 'cloth_o': mat('set_cloth_o', '#a9822f', .8),
    'page': mat('set_page', '#e9dfc7', .9), 'card': mat('set_card', '#efe8d6', .9),
    'floor': mat('stand_floor', '#4a3324', .7), 'wall': mat('stand_wall', '#6a5a4a', .9), 'shelf': mat('stand_shelf', '#3b2a1d', .8),
    'occl': mat('occluder', '#000000', 1.),
}
M['paper'] = paper_mat('set_paper')
if args.clay:
    for k in list(M):
        if not k.startswith(('stand', 'occl')): M[k] = M['plaster']

SET = []                                                       # (object, group) to bake
def link(o, group=None):
    if o.name not in bpy.context.collection.objects: bpy.context.collection.objects.link(o)
    if group: SET.append((o, group))
    return o

def rbox(name, size, loc, m, bevel=.004, seg=3, rot=(0, 0, 0), group='furn'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, scale=True, rotation=True)
    if bevel > 0:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m); bpy.ops.object.shade_smooth()
    if hasattr(o.data, 'set_sharp_from_angle'): o.data.set_sharp_from_angle(angle=math.radians(35))
    if group: SET.append((o, group))
    return o

def cyl(name, r, h, loc, m, verts=32, rot=(0, 0, 0), bevel=.003, group='furn'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts); o = bpy.context.active_object; o.name = name
    o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, rotation=True)
    if bevel > 0:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = 2; bv.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m); bpy.ops.object.shade_smooth()
    if hasattr(o.data, 'set_sharp_from_angle'): o.data.set_sharp_from_angle(angle=math.radians(35))
    if group: SET.append((o, group))
    return o

def poly(name, kind, size, loc, rot, m, group='small'):
    if kind == 'ico': bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=size, location=loc)
    elif kind == 'dodeca':
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=size, location=loc)
        o = bpy.context.active_object; bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.dissolve_verts(bm, verts=[]); bm.to_mesh(o.data); bm.free()
    else: bpy.ops.mesh.primitive_cube_add(size=size, location=loc)
    o = bpy.context.active_object; o.name = name; o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, rotation=True)
    bv = o.modifiers.new('bv', 'BEVEL'); bv.width = size * .03; bv.segments = 2; bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m); bpy.ops.object.shade_flat(); SET.append((o, group)); return o

# ---------------- props ----------------
# desk: 1.5 x 0.75 top, four square legs, a three-drawer pedestal on the left, a pencil drawer
dx, dy = DESK.x, DESK.y
rbox('Desk_top', (1.5, .75, .04), (dx, dy, TOP - .02), M['oak'], .006)
for sx in (-1, 1):
    for sy in (-1, 1):
        if sx < 0: continue                                            # left side is the pedestal
        rbox('Desk_leg', (.05, .05, TOP - .04), (dx + sx * .7, dy + sy * .32, (TOP - .04) / 2), M['oak'], .004)
ped_x = dx - .5
rbox('Desk_pedestal', (.48, .7, TOP - .06), (ped_x, dy, (TOP - .06) / 2 + .02), M['oak'], .005)
for i in range(3):
    z = .14 + i * .22
    rbox('Desk_drawer', (.42, .02, .18), (ped_x, dy - .355, z), M['oak'], .004)
    cyl('Desk_pull', .012, .03, (ped_x, dy - .375, z + .04), M['brass'], 20, rot=(math.radians(90), 0, 0), bevel=.002)
rbox('Desk_apron', (.92, .02, .08), (dx + .23, dy - .355, TOP - .1), M['oak'], .003)
rbox('Desk_pencil', (.36, .015, .055), (dx + .23, dy - .368, TOP - .1), M['oak'], .003)
cyl('Desk_pull', .01, .025, (dx + .23, dy - .385, TOP - .1), M['brass'], 20, rot=(math.radians(90), 0, 0), bevel=.002)

# card catalogue cabinet against the back wall right of the desk (4 rows x 3 columns, label frames + pulls)
cx, cy = -1.45, WALL_Y - .26
rbox('Cat_body', (.78, .46, .94), (cx, cy, .47 + .08), M['oak_dark'], .008)
rbox('Cat_plinth', (.82, .5, .08), (cx, cy, .04), M['oak_dark'], .006)
rbox('Cat_top', (.84, .5, .03), (cx, cy, 1.04), M['oak_dark'], .006)
for r in range(4):
    for c in range(3):
        x = cx - .25 + c * .25; z = .21 + r * .215
        rbox('Cat_drawer', (.23, .02, .195), (x, cy - .235, z), M['oak'], .004)
        rbox('Cat_label', (.07, .006, .035), (x, cy - .248, z + .045), M['brass'], .001)
        rbox('Cat_card', (.058, .003, .024), (x, cy - .251, z + .045), M['card'], 0)
        cyl('Cat_pull', .011, .025, (x, cy - .255, z - .02), M['brass'], 20, rot=(math.radians(90), 0, 0), bevel=.002)

# wainscot on the back wall (behind desk + cabinet) and the left wall: raised panels
def wainscot(axis, a0, a1, h=1.1):
    n = max(1, round((a1 - a0) / .55)); w = (a1 - a0) / n
    for i in range(n):
        c = a0 + w * (i + .5)
        if axis == 'y':   # back wall, panels face -y
            rbox('Wain_base', (w, .03, h), (c, WALL_Y - .015, h / 2), M['wainscot'], .004, group='wall')
            rbox('Wain_panel', (w - .1, .02, h - .3), (c, WALL_Y - .04, h / 2 + .03), M['wainscot'], .012, 4, group='wall')
        else:             # left wall, panels face +x
            rbox('Wain_base', (.03, w, h), (WALL_X + .015, c, h / 2), M['wainscot'], .004, group='wall')
            rbox('Wain_panel', (.02, w - .1, h - .3), (WALL_X + .04, c, h / 2 + .03), M['wainscot'], .012, 4, group='wall')
    if axis == 'y': rbox('Wain_rail', (a1 - a0, .05, .05), ((a0 + a1) / 2, WALL_Y - .03, h + .02), M['wainscot'], .008, group='wall')
    else: rbox('Wain_rail', (.05, a1 - a0, .05), (WALL_X + .03, (a0 + a1) / 2, h + .02), M['wainscot'], .008, group='wall')
wainscot('y', -2.05, -1.0); wainscot('x', 2.6, WALL_Y - .05)

# open cubby bookcase behind the desk (user 2026-10-16: in the dark corner the recesses into the shelves get no light and
# go darker still, while faces turned toward the light catch a weak bounce) — deep cubbies, partly filled, back panel
bx0, bx1, bz, bd = WALL_X + .06, -2.1, 1.08, .36
by = WALL_Y - bd / 2 - .01
rbox('Cub_back', (bx1 - bx0, .02, bz), ((bx0 + bx1) / 2, WALL_Y - .02, bz / 2), M['oak_dark'], .003, group='wall')
cols, rows = 4, 3
for c in range(cols + 1):
    x = bx0 + (bx1 - bx0) * c / cols
    rbox('Cub_side', (.025, bd, bz), (x, by, bz / 2), M['oak_dark'], .004, group='wall')
for r in range(rows + 1):
    z = .03 + (bz - .05) * r / rows
    rbox('Cub_shelf', (bx1 - bx0 + .02, bd, .025), ((bx0 + bx1) / 2, by, z), M['oak_dark'], .004, group='wall')
cw, ch = (bx1 - bx0) / cols, (bz - .05) / rows
cloths = ['cloth_r', 'cloth_b', 'cloth_o', 'oak_dark', 'card']
for c in range(cols):
    for r in range(rows):
        x0 = bx0 + cw * c + .03; z0 = .03 + ch * r + .0125
        kind = (c * 3 + r * 5) % 4
        if kind == 0:                                   # a row of upright books (spines toward the room), the rest of the cell empty
            n = random.randint(5, 8); x = x0
            for k in range(n):
                t = random.uniform(.025, .045); hh = random.uniform(.18, min(.27, ch - .03))
                rbox('Cub_book', (t, random.uniform(.17, .23), hh), (x + t / 2, WALL_Y - .2, z0 + hh / 2), M[random.choice(cloths[:3])], .003, group='small'); x += t + .002
        elif kind == 1:                                 # an archive box flush with the front edge
            rbox('Cub_box', (cw - .08, .3, ch * .62), (x0 + (cw - .06) / 2, by - .01, z0 + ch * .31), M['card'], .006, group='small')
        elif kind == 2:                                 # leaning books + a polyhedron
            for k in range(3):
                t = .035; hh = .22
                rbox('Cub_book', (t, .2, hh), (x0 + .05 + k * .04, WALL_Y - .2, z0 + hh / 2 - .01), M[cloths[k]], .003, rot=(0, -.32, 0), group='small')
            poly('Cub_poly', 'ico', .05, (x0 + cw * .65, by - .02, z0 + .05), (.4, .3, .1), M['plaster'])
        # kind 3: empty cell — a clean recess that goes dark toward the back

# frames on the left wall with blank ECG grid paper
for i, (y, z, w, h) in enumerate(((3.25, 1.62, .46, .36), (3.9, 1.55, .34, .46))):
    rbox('Frame', (.03, w, h), (WALL_X + .035, y, z), M['frame'], .006, group='wall')
    rbox('Frame_mat', (.006, w - .07, h - .07), (WALL_X + .052, y, z), M['card'], 0, group='wall')
    rbox('Frame_paper', (.004, w - .13, h - .13), (WALL_X + .057, y, z), M['paper'], 0, group='wall')

# plaster polyhedra and a book stack on the desk, a dodecahedron on the cabinet
poly('Poly_ico', 'ico', .075, (dx + .45, dy + .18, TOP + .07), (.3, .2, .5), M['plaster'])
poly('Poly_cube', 'cube', .11, (dx + .2, dy + .26, TOP + .055), (0, 0, .5), M['plaster'])
poly('Poly_cube2', 'cube', .07, (dx + .2, dy + .26, TOP + .11 + .035), (0, 0, 1.1), M['plaster'])
poly('Poly_dodeca', 'ico', .09, (cx + .15, cy, 1.055 + .085), (.6, .1, .2), M['plaster'])
for i, (m, w, d, t) in enumerate((('cloth_r', .26, .19, .035), ('cloth_b', .24, .17, .03), ('cloth_o', .22, .16, .028))):
    z = TOP + sum(x[3] for x in (('', 0, 0, .035), ('', 0, 0, .03), ('', 0, 0, .028))[:i]) + t / 2
    rbox('Book', (w, d, t), (dx - .35, dy + .12, z), M[m], .004, rot=(0, 0, .12 * (i - 1)), group='small')
    rbox('Book_pages', (w - .01, d - .012, t - .008), (dx - .35 + .004, dy + .12, z), M['page'], .001, rot=(0, 0, .12 * (i - 1)), group='small')
rbox('Paper_sheet', (.21, .297, .002), (dx + .05, dy - .12, TOP + .001), M['paper'], 0, rot=(0, 0, -.25), group='small')

# stool (round seat, three splayed legs, a ring)
sx_, sy_ = DESK.x + .25, DESK.y - .78
cyl('Stool_seat', .17, .035, (sx_, sy_, .48), M['oak'], 48, bevel=.006)
for k in range(3):
    a = k * 2 * math.pi / 3 + .3; tip = Vector((sx_ + math.cos(a) * .2, sy_ + math.sin(a) * .2, 0)); top = Vector((sx_ + math.cos(a) * .1, sy_ + math.sin(a) * .1, .46))
    mid = (tip + top) / 2; d = top - tip
    o = cyl('Stool_leg', .018, d.length, mid, M['oak'], 16, bevel=.002)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.ops.object.transform_apply(location=False, rotation=True)
cyl('Stool_ring', .155, .018, (sx_, sy_, .2), M['oak'], 48, bevel=.002)

# rug under desk and stool (receives the leg / cabinet shadows)
rbox('Rug', (2.1, 1.6, .012), (-2.35, 3.45, .006), M['rug_border'], .003, group='rug')
rbox('Rug_field', (1.9, 1.4, .004), (-2.35, 3.45, .014), M['rug'], .001, group='rug')

# ---------------- stand-ins (not exported): floor, walls, shelf mass above the wainscot, ceiling ----------------
def stand(name, size, loc, m):
    o = rbox(name, size, loc, m, 0, group=None); o['stand'] = 1; return o
stand('Stand_floor', (8, 10, .02), (0, 0, -.01), M['floor'])
stand('Stand_wall_l', (.05, 10, 5), (WALL_X - .025, 0, 2.5), M['wall'])
stand('Stand_wall_b', (8, .05, 5), (0, WALL_Y + .025, 2.5), M['wall'])
stand('Stand_shelf_b', (2.6, .4, 2.6), (-2.3, WALL_Y - .2, 1.2 + 1.3), M['shelf'])     # high shelves behind the desk (build_archive: none below 1.2)
stand('Stand_ceiling', (8, 10, .05), (0, 0, 5.0), M['wall'])

# ---------------- light: one small sun, off-screen occluders ----------------
sun_to = Vector(tuple(float(v) for v in args.sun.split(','))) if args.sun else Vector((-0.62, 0.46, -0.64))
sun_to.normalize()
sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = 4.2; sd.angle = math.radians(args.sunang); sd.color = srgb('#ffe9cf')
so = bpy.data.objects.new('sun', sd); so.rotation_euler = sun_to.to_track_quat('-Z', 'Y').to_euler(); bpy.context.collection.objects.link(so)
# the sunlit patch is framed by a window opening far up-right (bars), with a foliage cluster further out (soft dapple);
# the ceiling stand-in has a hole along the sun path so the sun reaches the corner (an unseen high window / hatch)
target = Vector((-2.6, 3.9, .9))
def occl_mesh(name, verts_faces):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    for poly_ in verts_faces:
        vs = [bm.verts.new(v) for v in poly_]; bm.faces.new(vs)
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.data.materials.append(M['occl']); o['stand'] = 1; return o
# basis perpendicular to the sun
up = Vector((0, 0, 1)); u = sun_to.cross(up).normalized(); v = u.cross(sun_to).normalized()
def plane_at(dist):
    return target - sun_to * dist
# window: an opening 1.6 x 2.0 in a wall slab, two bars each way (2.4 m out → bars a few cm soft)
wc = plane_at(2.4); faces = []
W2, H2, T = 1.0, 1.25, .045
def quad(c, a, b):  # rectangle centred c spanning half-vectors a, b
    return [c - a - b, c + a - b, c + a + b, c - a + b]
for c, a, b in ((wc + v * (H2 + .6), u * 2.5, v * .6), (wc - v * (H2 + .6), u * 2.5, v * .6), (wc + u * (W2 + .8), u * .8, v * 3.), (wc - u * (W2 + .8), u * .8, v * 3.)):
    faces.append(quad(c, a, b))                                            # the wall around the opening
for k in (-1, 1): faces.append(quad(wc + u * (k * W2 / 3), u * T / 2, v * H2))
faces.append(quad(wc, u * W2, v * T / 2)); faces.append(quad(wc + v * H2 * .5, u * W2, v * T / 2))
occl_mesh('Occ_window', faces)
# foliage: twig lines with elliptical leaves, 5.5 m out → 20 cm penumbra, free-form dapple
fc = plane_at(5.5) + u * .35 + v * .55; leaves = []
for twig in range(7):
    p = fc + u * random.uniform(-.9, .9) + v * random.uniform(-.7, .8); dirv = (u * random.uniform(-1, 1) + v * random.uniform(-.4, .6)).normalized()
    for k in range(9):
        q = p + dirv * k * .11 + (u * random.uniform(-.05, .05) + v * random.uniform(-.05, .05))
        ang = random.uniform(0, math.pi); a = (u * math.cos(ang) + v * math.sin(ang)); b = a.cross(sun_to).normalized()
        L, Wd = random.uniform(.09, .16), random.uniform(.035, .06)
        leaves.append([q + a * L * math.cos(t) + b * Wd * math.sin(t) for t in [i * 2 * math.pi / 10 for i in range(10)]])
occl_mesh('Occ_foliage', leaves)

w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('#8a7a66'), 1); w.node_tree.nodes['Background'].inputs[1].default_value = .35

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = args.samples
scene.cycles.use_denoising = True; scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'None'
scene.cycles.max_bounces = 6

# ---------------- cameras (Story, three → archive: (x, y, z) → (x, −z, y)) ----------------
SHOTS = {'pli7': ((.5, 1.749, 1.581), (-.7798, .5803, -.2347), 32.27), 'pli5': ((-.29, 1.617, 1.248), (-.4823, .8563, -.1848), 30.4),
         'pli85': ((.427, 3.469, 1.446), (-.8759, .0025, -.4825), 31.33), 'close': ((-1.25, 2.35, 1.35), (-.72, .62, -.32), 40.)}
def shoot(name, out):
    pos, d, fov = SHOTS[name]; cam = bpy.data.cameras.new(name); cam.sensor_fit = 'VERTICAL'; cam.angle = math.radians(fov)
    co = bpy.data.objects.new(name, cam); co.location = pos; co.rotation_euler = Vector(d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(co); scene.camera = co
    rx, ry = (int(x) for x in args.res.split('x')); scene.render.resolution_x, scene.render.resolution_y = rx, ry
    scene.render.filepath = os.path.join(out, f'{name}{"_clay" if args.clay else ""}.png'); bpy.ops.render.render(write_still=True)
    print('rendered', scene.render.filepath, flush=True)

if args.preview:
    os.makedirs(args.preview, exist_ok=True)
    for s in args.shots.split(','): shoot(s, args.preview)
print('set objects', len(SET), 'groups', sorted({g for _, g in SET}), flush=True)
