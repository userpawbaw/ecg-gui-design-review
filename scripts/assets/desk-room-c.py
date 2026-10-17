"""Story room, route C — the noise scenes' space rebuilt as a leoparpeix-style attic and baked whole (D-071).

Why: the user (2026-10-17 "일단 별개로 C안을 진행해봐. 확인은 두개의 결과를 보고 비교해볼게") asked for route C next to
route A (scripts/assets/desk-corner-set.py). A keeps the baked archive and adds a prop set; C redesigns the space itself
(D-070 "미진한 부분이 있다면 C로 진행해서 공간 구조부터 재설계"). The structure follows the leoparpeix home scene
(REF-002 §11): gable attic with exposed rafters, a thick back gable wall with an arched window (light from behind right),
a skylight hatch in the slope with a ladder up to it (light from above), cream plaster and oak — one small sun through both
openings (all shadows parallel), sky light only through the openings, off-screen branches outside both for soft dapple, deep
cubbies in the low corner for the darkness gradation (D-070 user note). Everything inside is baked colour x light per group.

Archive frame (x right, y into the room, z up) so the Story's figure spot, chair, power strip and cameras stay where they are.
The room encloses every camera position of the pli / bw / ma paths (sampled from the running Story, --cams json).

Modes:
  python scripts/assets/desk-room-c.py --preview OUTDIR [--cams campath.json] [--shots pli@7,bw@6] [--samples 64]
  python scripts/assets/desk-room-c.py --bake [--samples 128]
build_archive.py (archive-light session) and desk-corner-set.py (route A) are not touched.
"""
import argparse, json, math, os, random, sys
import bpy, bmesh
from mathutils import Vector

ap = argparse.ArgumentParser()
ap.add_argument('--preview', default='')
ap.add_argument('--bake', action='store_true')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--res', default='960x540')
ap.add_argument('--cams', default='')
ap.add_argument('--shots', default='pli@5,pli@7,pli@8.5,pli@13,bw@6,ma@4')
ap.add_argument('--clay', action='store_true')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'noise', 'assets', 'room_c')
random.seed(11)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- room layout (archive frame) ----------------
X0, X1, Y0, Y1 = -3.6, 2.6, 0.2, 5.0          # inner faces: left / right knee walls, front / back gables
KL, XR, ZR = 1.7, 0.6, 3.9                    # left knee height, ridge x, ridge height
SL = (ZR - KL) / (XR - X0)                    # slope (same both sides)
KR = ZR - SL * (X1 - XR)                      # right knee height
WT = .2                                      # gable wall thickness (deep window reveal)
DESK, TOP = Vector((-2.45, 3.62, 0.0)), 0.76
FIG = Vector((-.7505, 3.0995, 0))             # Story figure spot (noiseStage SPOT)
STRIP = Vector((-.97, 3.62, 0))               # Story power strip
def roof_z(x): return KL + SL * (x - X0) if x <= XR else ZR - SL * (x - XR)

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

def oak(name, a='#8a5f3a', b='#74502f', scale=2.4, rough=.5):
    """oak: wave bands + fine noise along the object's local x"""
    m = mat(name, a, rough); nt = m.node_tree; N = nt.nodes; L = nt.links; bsdf = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, scale, scale)
    wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Y'; wv.inputs['Scale'].default_value = 2.2
    wv.inputs['Distortion'].default_value = 3.0; wv.inputs['Detail'].default_value = 4.0; wv.inputs['Detail Scale'].default_value = 1.5
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 140.; nz.inputs['Detail'].default_value = 2.
    ramp = N.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (*srgb(b), 1); ramp.color_ramp.elements[1].color = (*srgb(a), 1)
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = .12
    L.new(tc.outputs['Object'], mp.inputs['Vector']); L.new(mp.outputs['Vector'], wv.inputs['Vector']); L.new(mp.outputs['Vector'], nz.inputs['Vector'])
    L.new(wv.outputs['Fac'], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], mix.inputs['A']); L.new(nz.outputs['Color'], mix.inputs['B'])
    L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    return m

def planks(name, a='#86613f', b='#6d4c30', gap='#2a1c12'):
    """floor boards: brick texture with long staggered boards (0.16 x 1.4 m), thin dark joints, per-board tone"""
    m = mat(name, a, .55); nt = m.node_tree; N = nt.nodes; L = nt.links; bsdf = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); br = N.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = .0025; br.inputs['Mortar Smooth'].default_value = .2
    br.inputs['Brick Width'].default_value = 1.4; br.inputs['Row Height'].default_value = .16; br.offset = .37; br.offset_frequency = 1
    br.inputs['Color1'].default_value = (*srgb(a), 1); br.inputs['Color2'].default_value = (*srgb(b), 1); br.inputs['Mortar'].default_value = (*srgb(gap), 1)
    sw = N.new('ShaderNodeSeparateXYZ'); cm = N.new('ShaderNodeCombineXYZ')            # boards run along y: feed (y, x)
    L.new(tc.outputs['Object'], sw.inputs['Vector']); L.new(sw.outputs['Y'], cm.inputs['X']); L.new(sw.outputs['X'], cm.inputs['Y'])
    L.new(cm.outputs['Vector'], br.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 90.; nz.inputs['Detail'].default_value = 3.
    L.new(cm.outputs['Vector'], nz.inputs['Vector'])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = .14
    L.new(br.outputs['Color'], mix.inputs['A']); L.new(nz.outputs['Color'], mix.inputs['B']); L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    return m

def grid_paper_image(name, w=768, h=576):
    """blank ECG grid paper (1 mm / 5 mm), cream with pink lines — no trace (decorative space rule)"""
    img = bpy.data.images.new(name, w, h, alpha=False); px = [0.0] * (w * h * 4)
    paper, fine, bold = srgb('#d9cfbb'), srgb('#d2a99e'), srgb('#c08277')
    mm = w / 160.0
    for y in range(h):
        gy = (y / mm); fy = abs(gy - round(gy)) * mm < .55; by = abs(gy / 5 - round(gy / 5)) * 5 * mm < .9
        for x in range(w):
            gx = (x / mm); fx = abs(gx - round(gx)) * mm < .55; bx = abs(gx / 5 - round(gx / 5)) * 5 * mm < .9
            c = bold if (bx or by) else fine if (fx or fy) else paper
            i = (y * w + x) * 4; px[i:i + 4] = (*c, 1.0)
    img.pixels = px; return img

def paper_mat(name):
    m = mat(name, '#d9cfbb', .85); nt = m.node_tree; N = nt.nodes
    tx = N.new('ShaderNodeTexImage'); tx.image = grid_paper_image(name + '_img'); tx.interpolation = 'Cubic'
    nt.links.new(tx.outputs['Color'], N['Principled BSDF'].inputs['Base Color']); return m

M = {
    'oak': oak('c_oak', '#7d5a3c', '#6c4c31'), 'oak_dark': oak('c_oak_dark', '#5a3a22', '#4a2f1c', 2.8),
    'rafter': oak('c_rafter', '#6a4a30', '#573b25', 3.2, .7), 'floor': planks('c_floor', '#9a7550', '#7f5c3b'),
    'brass': mat('c_brass', '#a8823f', .32, .85), 'plaster': mat('c_plaster', '#cbc2b0', .85, spec=.2),
    'plaster_w': mat('c_plaster_w', '#c7bca8', .88, spec=.2), 'iron': mat('c_iron', '#1d1b19', .45, .3),
    'frame': mat('c_frame', '#2a211b', .45), 'rug': mat('c_rug', '#6e4033', .95, spec=.1), 'rug_border': mat('c_rug_border', '#8c7d63', .95, spec=.1),
    'cloth_r': mat('c_cloth_r', '#6e2a24', .8), 'cloth_b': mat('c_cloth_b', '#2c3a4f', .8), 'cloth_o': mat('c_cloth_o', '#a9822f', .8),
    'page': mat('c_page', '#d4cab3', .9), 'card': mat('c_card', '#d6cfbd', .9), 'occl': mat('c_occluder', '#000000', 1.),
}
M['paper'] = paper_mat('c_paper')
if args.clay:
    for k in list(M):
        if k != 'occl': M[k] = M['plaster']

SET = []                                                       # (object, group) to bake
def add(o, group):
    SET.append((o, group)); return o

def finish(o, m, bevel, seg=3, smooth=True):
    if bevel > 0:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m)
    if smooth:
        bpy.ops.object.shade_smooth()
        if hasattr(o.data, 'set_sharp_from_angle'): o.data.set_sharp_from_angle(angle=math.radians(35))
    return o

def rbox(name, size, loc, m, bevel=.004, seg=3, rot=(0, 0, 0), group='furn'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, scale=True, rotation=True)
    finish(o, m, bevel, seg)
    return add(o, group) if group else o

def cyl(name, r, h, loc, m, verts=32, rot=(0, 0, 0), bevel=.003, group='furn'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts); o = bpy.context.active_object; o.name = name
    o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, rotation=True)
    finish(o, m, bevel, 2)
    return add(o, group) if group else o

def between(name, a, b, r, m, verts=16, group='furn', square=False):
    """a round (or square) bar from a to b"""
    a, b = Vector(a), Vector(b); d = b - a
    if square: o = rbox(name, (r * 2, r * 2, d.length), (a + b) / 2, m, .003, 2, group=None)
    else:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, location=(a + b) / 2, vertices=verts); o = bpy.context.active_object; o.name = name
        finish(o, m, .002, 2)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.transform_apply(location=False, rotation=True)
    return add(o, group)

def poly(name, kind, size, loc, rot, m, group='small'):
    if kind == 'ico': bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=size, location=loc)
    else: bpy.ops.mesh.primitive_cube_add(size=size, location=loc)
    o = bpy.context.active_object; o.name = name; o.rotation_euler = rot; bpy.ops.object.transform_apply(location=False, rotation=True)
    bv = o.modifiers.new('bv', 'BEVEL'); bv.width = size * .03; bv.segments = 2; bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m); bpy.ops.object.shade_flat(); return add(o, group)

def prism(name, outline, y0, y1, m, group, holes=()):
    """a wall slab: polygon outline in (x, z) extruded along y from y0 to y1; holes = cutter objects (boolean difference)"""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x, y0, z)) for x, z in outline])
    ext = bmesh.ops.extrude_face_region(bm, geom=[f]); vs = [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, y1 - y0, 0), verts=vs); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    for h in holes:
        bo = o.modifiers.new('cut', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = h; bo.solver = 'EXACT'
        bpy.ops.object.modifier_apply(modifier='cut')
    o.data.materials.append(m); return add(o, group)

def cutter(name, objs):
    """join helper solids into one hidden cutter"""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    c = bpy.context.active_object; c.name = name; c.hide_render = True; c.hide_set(True); return c

# ---------------- sun and openings ----------------
# one sun from the right, high, a little from behind (screen right-back in the pli views). It enters three openings, each
# placed by tracing the sun back from the patch it should draw:
#   skylight A, left slope  → the desk (the ladder's top rungs and the desk props cast across it)
#   skylight B, right slope → the floor at the power strip (the pli scene's subject stands in a square of sun)
#   arched window, right knee wall, back part → a barred patch by the right wall (bw side view background)
# Drafts: a sun from behind grazed a back-gable window and could not reach the strip from any roof opening; a dense
# foliage cluster and a mis-oriented skylight lining swallowed the skylight beam (previews p3–p7, 2026-10-17).
SUN_TO = -Vector((.45, .20, .87)).normalized()
L = -SUN_TO
def on_left(T):  # T + L t on the left slope z = KL + SL (x − X0)
    t = (KL + SL * (T.x - X0) - T.z) / (L.z - SL * L.x); return T + L * t
def on_right(T):  # … on the right slope z = ZR − SL (x − XR)
    t = (ZR + SL * XR - SL * T.x - T.z) / (L.z + SL * L.x); return T + L * t
HA_T, HB_T = Vector((-2.45, 3.62, TOP)), Vector((-.85, 3.55, 0))
HA_C, HB_C = on_left(HA_T), on_right(HB_T)
HA, HB = 1.0, .9                                  # skylight openings (square)
nL = Vector((-SL, 0, 1)).normalized(); nR = Vector((SL, 0, 1)).normalized()     # slope outward normals
WIN_C = Vector((X1, 4.2, 0)); WIN_W, WIN_H, WIN_Z0 = .9, 1.2, .9   # right knee-wall arched window (centre y, sill height)
print('skylight A', tuple(round(v, 2) for v in HA_C), 'skylight B', tuple(round(v, 2) for v in HB_C), flush=True)

# ---------------- shell ----------------
rbox('Floor', (X1 - X0 + .4, Y1 - Y0 + .4, .1), ((X0 + X1) / 2, (Y0 + Y1) / 2, -.05), M['floor'], .0, group='floor')
# skirting along the walls (crisp dark line where wall meets floor)
for (sx, sy, cx, cy) in (((X1 - X0), .025, (X0 + X1) / 2, Y1 - .0125), ((X1 - X0), .025, (X0 + X1) / 2, Y0 + .0125),
                          (.025, (Y1 - Y0), X0 + .0125, (Y0 + Y1) / 2), (.025, (Y1 - Y0), X1 - .0125, (Y0 + Y1) / 2)):
    rbox('Skirting', (sx, sy, .12), (cx, cy, .06), M['oak_dark'], .004, group='walls')
rbox('Knee_L', (.2, Y1 - Y0 + .4, KL + .1), (X0 - .1, (Y0 + Y1) / 2, KL / 2), M['plaster_w'], 0, group='walls')
# right knee wall with the arched window (box + cylinder cutters, two booleans: one joined overlapping cutter emptied a wall)
rk = rbox('Knee_R', (WT, Y1 - Y0 + .4, KR + .1), (X1 + WT / 2, (Y0 + Y1) / 2, KR / 2), M['plaster_w'], 0, group='walls')
bpy.ops.mesh.primitive_cube_add(size=1, location=(X1 + WT / 2, WIN_C.y, WIN_Z0 + WIN_H / 2)); c1 = bpy.context.active_object; c1.scale = (WT + .4, WIN_W, WIN_H)
bpy.ops.mesh.primitive_cylinder_add(radius=WIN_W / 2, depth=WT + .4, vertices=64, location=(X1 + WT / 2, WIN_C.y, WIN_Z0 + WIN_H), rotation=(0, math.radians(90), 0))
c2 = bpy.context.active_object
for c in (cutter('Win_cut_box', [c1]), cutter('Win_cut_arch', [c2])):
    bpy.ops.object.select_all(action='DESELECT'); rk.select_set(True); bpy.context.view_layer.objects.active = rk
    bo = rk.modifiers.new('cut', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = c; bo.solver = 'EXACT'; bpy.ops.object.modifier_apply(modifier='cut')
print('right wall faces', len(rk.data.polygons), flush=True)
gable = [(X0 - .2, -.1), (X1 + .2, -.1), (X1 + .2, KR - SL * .2), (XR, ZR + .02), (X0 - .2, KL - SL * .2)]
# back gable: solid, with a small round window high under the ridge (sky light, a bright disc in the ma / bw views)
OC = Vector((XR, Y1, 3.05)); bpy.ops.mesh.primitive_cylinder_add(radius=.3, depth=WT + .4, vertices=48, location=(OC.x, Y1 + WT / 2, OC.z), rotation=(math.radians(90), 0, 0))
gb = prism('Gable_B', gable, Y1, Y1 + WT, M['plaster_w'], 'walls', holes=[cutter('Oc_cut', [bpy.context.active_object])])
# front gable: a wide window that only the sky reaches (the sun is behind the room) — the soft fill of a room open on one side
FW_C, FW_W, FW_H = Vector((-1.2, Y0, 1.3)), 2.2, 1.7
bpy.ops.mesh.primitive_cube_add(size=1, location=(FW_C.x, Y0 - WT / 2, FW_C.z)); fc1 = bpy.context.active_object; fc1.scale = (FW_W, WT + .4, FW_H)
prism('Gable_F', gable, Y0 - WT, Y0, M['plaster_w'], 'front', holes=[cutter('FWin_cut', [fc1])])
for k in (-1, 0, 1):
    rbox('FWin_bar', (.035, .04, FW_H), (FW_C.x + k * FW_W / 3 if k else FW_C.x, Y0 - WT * .5, FW_C.z), M['iron'], .004, group='front')
# roof slabs (0.15 thick, inner face on the slope line), one skylight in each
def slope_slab(name, xa, xb, holes=()):
    za, zb = roof_z(xa), roof_z(xb); n = Vector((-(zb - za), 0, xb - xa)).normalized() * .15
    outline = [(xa, za), (xb, zb), (xb + n.x, zb + n.z), (xa + n.x, za + n.z)]
    return prism(name, outline, Y0 - WT - .1, Y1 + WT + .1, M['plaster'], 'roof', holes)
def hatch_cut(name, C, n, size):
    bpy.ops.mesh.primitive_cube_add(size=1, location=C + n * .1); hc = bpy.context.active_object
    hc.scale = (size, size, .8); hc.rotation_euler = n.to_track_quat('Z', 'Y').to_euler(); return cutter(name, [hc])
slope_slab('Roof_L', X0 - .2, XR, holes=[hatch_cut('HA_cut', HA_C, nL, HA)])
slope_slab('Roof_R', XR, X1 + .2, holes=[hatch_cut('HB_cut', HB_C, nR, HB)])
def lining(C, n, size):
    """deep oak frame through the slab (crisp patch edge). track_quat('Z', 'Y'): local z = slope normal, y = up the slope, x = world y"""
    up = Vector((0, 0, 1)); sd = (up - n * up.dot(n)).normalized(); rot = n.to_track_quat('Z', 'Y').to_euler()
    for k in (-1, 1):
        rbox('Hat_jamb', (size + .08, .04, .26), C + sd * (k * (size / 2 + .02)) + n * .06, M['oak'], .005, rot=rot, group='roof')
        rbox('Hat_jamb', (.04, size + .08, .26), C + Vector((0, k * (size / 2 + .02), 0)) + n * .06, M['oak'], .005, rot=rot, group='roof')
lining(HA_C, nL, HA); lining(HB_C, nR, HB)
# rafters under both slopes every 0.6 m (skipped across a skylight, trimmers either side), ridge beam, a purlin on the right
def rafter(y, xa, xb):
    a = Vector((xa, y, roof_z(xa))); b = Vector((xb, y, roof_z(xb))); n = (Vector((-(b.z - a.z), 0, b.x - a.x)).normalized()) * -.05
    between('Rafter', a + n, b + n, .04, M['rafter'], group='roof', square=True)
for y in [Y0 + .3 + i * .6 for i in range(int((Y1 - Y0 - .4) / .6) + 1)]:
    if abs(y - HA_C.y) >= HA / 2 + .06: rafter(y, X0, XR)
    if abs(y - HB_C.y) >= HB / 2 + .06: rafter(y, XR, X1)
for k in (-1, 1):
    rafter(HA_C.y + k * (HA / 2 + .06), X0, XR); rafter(HB_C.y + k * (HB / 2 + .06), XR, X1)
rbox('Ridge', (.14, Y1 - Y0, .2), (XR, (Y0 + Y1) / 2, ZR - .1), M['rafter'], .006, group='roof')
rbox('Purlin', (.12, Y1 - Y0, .12), (X1 - .45, (Y0 + Y1) / 2, roof_z(X1 - .45) - .16), M['rafter'], .006, group='roof')
# arched window: black iron frame, a cross of mullions, an arched head bar, deep sill — the bars draw crisp lines on the floor
wx = X1 + WT * .55
rbox('Win_sill', (WT + .08, WIN_W + .16, .05), (X1 + WT / 2 - .04, WIN_C.y, WIN_Z0 - .025), M['oak'], .006, group='walls')
rbox('Win_bar_v', (.04, .035, WIN_H + WIN_W / 2), (wx, WIN_C.y, WIN_Z0 + (WIN_H + WIN_W / 2) / 2), M['iron'], .004, group='furn')
for z in (WIN_Z0 + WIN_H * .5, WIN_Z0 + WIN_H):
    rbox('Win_bar_h', (.04, WIN_W, .035), (wx, WIN_C.y, z), M['iron'], .004, group='furn')
for sy in (-1, 1):
    rbox('Win_jamb', (.05, .05, WIN_H), (wx, WIN_C.y + sy * (WIN_W / 2 - .025), WIN_Z0 + WIN_H / 2), M['iron'], .004, group='furn')
rbox('Win_foot', (.05, WIN_W, .05), (wx, WIN_C.y, WIN_Z0 + .025), M['iron'], .004, group='furn')
bpy.ops.mesh.primitive_torus_add(major_radius=WIN_W / 2 - .025, minor_radius=.025, major_segments=48, minor_segments=8,
                                 location=(wx, WIN_C.y, WIN_Z0 + WIN_H), rotation=(0, math.radians(90), 0))
ar = bpy.context.active_object; ar.name = 'Win_arch'
bm = bmesh.new(); bm.from_mesh(ar.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > .001], context='VERTS'); bm.to_mesh(ar.data); bm.free()
finish(ar, M['iron'], 0); add(ar, 'furn')
bpy.ops.mesh.primitive_torus_add(major_radius=.3, minor_radius=.022, major_segments=48, minor_segments=8, location=(OC.x, Y1 + WT * .55, OC.z), rotation=(math.radians(90), 0, 0))
oc = bpy.context.active_object; oc.name = 'Oc_ring'; finish(oc, M['iron'], 0); add(oc, 'furn')
rbox('Oc_bar', (.6, .035, .03), (OC.x, Y1 + WT * .55, OC.z), M['iron'], .003, group='furn')
rbox('Oc_bar', (.03, .035, .6), (OC.x, Y1 + WT * .55, OC.z), M['iron'], .003, group='furn')

# ---------------- furniture ----------------
# desk (route A's desk, same spot)
dx, dy = DESK.x, DESK.y
rbox('Desk_top', (1.5, .75, .04), (dx, dy, TOP - .02), M['oak'], .006)
for sy in (-1, 1): rbox('Desk_leg', (.05, .05, TOP - .04), (dx + .7, dy + sy * .32, (TOP - .04) / 2), M['oak'], .004)
ped_x = dx - .5
rbox('Desk_pedestal', (.48, .7, TOP - .06), (ped_x, dy, (TOP - .06) / 2 + .02), M['oak'], .005)
for i in range(3):
    z = .14 + i * .22
    rbox('Desk_drawer', (.42, .02, .18), (ped_x, dy - .355, z), M['oak'], .004)
    cyl('Desk_pull', .012, .03, (ped_x, dy - .375, z + .04), M['brass'], 20, rot=(math.radians(90), 0, 0), bevel=.002)
rbox('Desk_apron', (.92, .02, .08), (dx + .23, dy - .355, TOP - .1), M['oak'], .003)
cyl('Desk_pull', .01, .025, (dx + .23, dy - .385, TOP - .1), M['brass'], 20, rot=(math.radians(90), 0, 0), bevel=.002)
# deep cubby bookcase under the low left slope, against the left knee wall (dark recesses, D-070 user note)
bd, bz = .38, 1.12
by0, by1 = 3.95, Y1 - .05
bx = X0 + bd / 2 + .01
rbox('Cub_back', (.02, by1 - by0, bz), (X0 + .02, (by0 + by1) / 2, bz / 2), M['oak_dark'], .003, group='walls')
cols, rows = 3, 3
for c in range(cols + 1):
    y = by0 + (by1 - by0) * c / cols
    rbox('Cub_side', (bd, .025, bz), (bx, y, bz / 2), M['oak_dark'], .004, group='walls')
for r in range(rows + 1):
    z = .03 + (bz - .05) * r / rows
    rbox('Cub_shelf', (bd, by1 - by0 + .02, .025), (bx, (by0 + by1) / 2, z), M['oak_dark'], .004, group='walls')
cw, ch = (by1 - by0) / cols, (bz - .05) / rows
cloths = ['cloth_r', 'cloth_b', 'cloth_o']
for c in range(cols):
    for r in range(rows):
        y0 = by0 + cw * c + .03; z0 = .03 + ch * r + .0125; kind = (c * 2 + r * 5) % 4
        if kind == 0:
            y = y0
            for k in range(random.randint(5, 8)):
                tt = random.uniform(.025, .045); hh = random.uniform(.18, min(.27, ch - .03))
                rbox('Cub_book', (random.uniform(.17, .23), tt, hh), (X0 + .2, y + tt / 2, z0 + hh / 2), M[random.choice(cloths)], .003, group='small'); y += tt + .002
        elif kind == 1:
            rbox('Cub_box', (.3, cw - .08, ch * .62), (bx + .01, y0 + (cw - .06) / 2, z0 + ch * .31), M['card'], .006, group='small')
        elif kind == 2:
            for k in range(3):
                rbox('Cub_book', (.2, .035, .22), (X0 + .2, y0 + .05 + k * .04, z0 + .1), M[cloths[k]], .003, rot=(.32, 0, 0), group='small')
            poly('Cub_poly', 'ico', .05, (bx, y0 + cw * .65, z0 + .05), (.4, .3, .1), M['plaster'])
# frames on the back wall between the ladder and the window (grid paper), polyhedra on the cubby top (in the skylight beam)
for i, (x, z, w, h) in enumerate(((-1.6, 1.42, .46, .36), (-1.0, 1.5, .34, .46), (-.4, 1.4, .4, .3))):
    rbox('Frame', (w, .03, h), (x, Y1 - .015, z), M['frame'], .006, group='walls')
    rbox('Frame_mat', (w - .07, .006, h - .07), (x, Y1 - .032, z), M['card'], 0, group='walls')
    rbox('Frame_paper', (w - .13, .004, h - .13), (x, Y1 - .037, z), M['paper'], 0, group='walls')
poly('Poly_ico', 'ico', .08, (X0 + .2, 4.2, bz + .075), (.3, .2, .5), M['plaster'])
poly('Poly_cube', 'cube', .12, (X0 + .2, 4.6, bz + .06), (0, 0, .5), M['plaster'])
poly('Poly_cube2', 'cube', .075, (X0 + .2, 4.6, bz + .12 + .037), (0, 0, 1.1), M['plaster'])
# card catalogue against the right knee wall (bw side view background), drawers face −x
cx, cy = X1 - .25, 3.0
rbox('Cat_body', (.46, .78, .94), (cx, cy, .55), M['oak_dark'], .008)
rbox('Cat_plinth', (.5, .82, .08), (cx, cy, .04), M['oak_dark'], .006)
rbox('Cat_top', (.5, .84, .03), (cx, cy, 1.04), M['oak_dark'], .006)
for r in range(4):
    for c in range(3):
        y = cy - .25 + c * .25; z = .21 + r * .215
        rbox('Cat_drawer', (.02, .23, .195), (cx - .235, y, z), M['oak'], .004)
        rbox('Cat_label', (.006, .07, .035), (cx - .248, y, z + .045), M['brass'], .001)
        rbox('Cat_card', (.003, .058, .024), (cx - .251, y, z + .045), M['card'], 0)
        cyl('Cat_pull', .011, .025, (cx - .255, y, z - .02), M['brass'], 20, rot=(0, math.radians(90), 0), bevel=.002)
poly('Poly_dodeca', 'ico', .09, (cx, cy + .15, 1.055 + .085), (.6, .1, .2), M['plaster'])
# tall open shelf on the right knee wall, front part (off the arched window), and a built-in bookcase on the back wall right of
# the frames (the ma views look at the back wall)
def bookcase(name, x0, x1, y0, y1, h, shelves, face):
    """open bookcase: face 'y' = front toward −y (back wall), 'x' = front toward −x (right wall); books stand in each row"""
    if face == 'x':
        for y in (y0, (y0 + y1) / 2, y1): rbox(name + '_side', (x1 - x0, .025, h), ((x0 + x1) / 2, y, h / 2), M['oak_dark'], .004, group='walls')
        rbox(name + '_back', (.02, y1 - y0, h), (x1 - .01, (y0 + y1) / 2, h / 2), M['oak_dark'], .003, group='walls')
    else:
        for x in (x0, (x0 + x1) / 2, x1): rbox(name + '_side', (.025, y1 - y0, h), (x, (y0 + y1) / 2, h / 2), M['oak_dark'], .004, group='walls')
        rbox(name + '_back', (x1 - x0, .02, h), ((x0 + x1) / 2, y1 - .01, h / 2), M['oak_dark'], .003, group='walls')
    zs = [.05 + (h - .08) * k / shelves for k in range(shelves + 1)]
    for z in zs: rbox(name + '_shelf', (x1 - x0, y1 - y0, .025), ((x0 + x1) / 2, (y0 + y1) / 2, z), M['oak_dark'], .004, group='walls')
    for z in zs[:-1]:
        a = (y0 if face == 'x' else x0) + .03; end = (y1 if face == 'x' else x1) - .03
        while a < end - .05:
            tt = random.uniform(.025, .05); hh = random.uniform(.2, min(.34, (h - .08) / shelves - .04))
            if random.random() < .16: a += random.uniform(.1, .25); continue
            if random.random() < .12 and a < end - .3:                          # a box or a poly now and then
                poly(name + '_poly', 'ico', .055, ((x1 - .17 if face == 'x' else a + .07), (a + .07 if face == 'x' else y1 - .17), z + .068), (.4, .2, .3), M['plaster']); a += .16; continue
            d = random.uniform(.18, .24)
            if face == 'x': rbox(name + '_book', (d, tt, hh), (x1 - .02 - d / 2, a + tt / 2, z + .0125 + hh / 2), M[random.choice(cloths + ['oak_dark'])], .003, group='small')
            else: rbox(name + '_book', (tt, d, hh), (a + tt / 2, y1 - .02 - d / 2, z + .0125 + hh / 2), M[random.choice(cloths + ['oak_dark'])], .003, group='small')
            a += tt + .003
bookcase('R_shelf', X1 - .32, X1, 1.15, 2.35, 1.9, 4, 'x')
bookcase('B_case', .1, 1.6, Y1 - .34, Y1, 2.2, 5, 'y')
rbox('Frame_big', (.03, .7, .52), (X1 - .015, 3.2, 1.6), M['frame'], .008, group='walls')
rbox('Frame_big_mat', (.006, .62, .44), (X1 - .032, 3.2, 1.6), M['card'], 0, group='walls')
rbox('Frame_big_paper', (.004, .54, .36), (X1 - .037, 3.2, 1.6), M['paper'], 0, group='walls')
# ladder from behind the desk up through skylight A (two square rails, round rungs), leaning on its lower rim
sdL = Vector((1, 0, SL)).normalized(); low_edge = HA_C - sdL * (HA / 2) + Vector((0, .25, 0)); foot = Vector((-2.9, low_edge.y, 0)); head = low_edge + Vector((.06, 0, .4))
for k in (-1, 1):
    off = Vector((0, k * .2, 0)); between('Ladder_rail', foot + off, head + off, .022, M['oak'], group='furn', square=True)
n_r = int((head - foot).length / .28)
for i in range(1, n_r):
    p = foot.lerp(head, i / n_r); between('Ladder_rung', p + Vector((0, -.2, 0)), p + Vector((0, .2, 0)), .014, M['oak'], 16, group='furn')
# stool, books, paper on the desk
sx_, sy_ = DESK.x + .25, DESK.y - .78
cyl('Stool_seat', .17, .035, (sx_, sy_, .48), M['oak'], 48, bevel=.006)
for k in range(3):
    a = k * 2 * math.pi / 3 + .3
    between('Stool_leg', (sx_ + math.cos(a) * .2, sy_ + math.sin(a) * .2, 0), (sx_ + math.cos(a) * .1, sy_ + math.sin(a) * .1, .46), .018, M['oak'])
cyl('Stool_ring', .155, .018, (sx_, sy_, .2), M['oak'], 48, bevel=.002)
for i, (m, w, d, th) in enumerate((('cloth_r', .26, .19, .035), ('cloth_b', .24, .17, .03), ('cloth_o', .22, .16, .028))):
    z = TOP + (0, .035, .065)[i] + th / 2
    rbox('Book', (w, d, th), (dx - .35, dy + .12, z), M[m], .004, rot=(0, 0, .12 * (i - 1)), group='small')
    rbox('Book_pages', (w - .01, d - .012, th - .008), (dx - .35 + .004, dy + .12, z), M['page'], .001, rot=(0, 0, .12 * (i - 1)), group='small')
rbox('Paper_sheet', (.21, .297, .002), (dx + .05, dy - .12, TOP + .001), M['paper'], 0, rot=(0, 0, -.25), group='small')
poly('Desk_ico', 'ico', .07, (dx - .55, dy - .12, TOP + .065), (.3, .2, .5), M['plaster'])
poly('Desk_cube', 'cube', .09, (dx - .35, dy - .2, TOP + .045), (0, 0, .4), M['plaster'])
# rug under the desk and the chair spot
rbox('Rug', (3.0, 1.9, .012), (-1.75, 3.35, .006), M['rug_border'], .003, group='rug')
rbox('Rug_field', (2.8, 1.7, .004), (-1.75, 3.35, .014), M['rug'], .001, group='rug')

# ---------------- light ----------------
sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = 6.5; sd.angle = math.radians(1.0); sd.color = srgb('#ffe9cf')
so = bpy.data.objects.new('sun', sd); so.rotation_euler = SUN_TO.to_track_quat('-Z', 'Y').to_euler(); bpy.context.collection.objects.link(so)
# sky through the openings only (the room is closed): bluish world + light portals in both openings
w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('#b4bccb'), 1); w.node_tree.nodes['Background'].inputs[1].default_value = 2.2
def portal(c, size, normal):
    ld = bpy.data.lights.new('portal', 'AREA'); ld.shape = 'RECTANGLE'; ld.size, ld.size_y = size; ld.cycles.is_portal = True
    lo = bpy.data.objects.new('portal', ld); lo.location = c; lo.rotation_euler = (-normal).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(lo)
portal(Vector((X1 + WT + .02, WIN_C.y, WIN_Z0 + (WIN_H + WIN_W / 2) / 2)), (WIN_H + WIN_W / 2, WIN_W), Vector((1, 0, 0)))
portal(HA_C + nL * .3, (HA, HA), nL); portal(HB_C + nR * .3, (HB, HB), nR)
portal(Vector((OC.x, Y1 + WT + .02, OC.z)), (.6, .6), Vector((0, 1, 0)))
portal(Vector((FW_C.x, Y0 - WT - .02, FW_C.z)), (FW_W, FW_H), Vector((0, -1, 0)))
# off-screen branches outside both openings: soft, free-form dapple (REF-002 §11.2)
def occl_mesh(name, polys):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    for p in polys: bm.faces.new([bm.verts.new(v) for v in p])
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.data.materials.append(M['occl'])
    o.visible_camera = False; o.visible_glossy = False; return o
def foliage(centre, n, spread):
    u = SUN_TO.cross(Vector((0, 0, 1))).normalized(); v = u.cross(SUN_TO).normalized(); leaves = []
    for twig in range(n):
        p = centre + u * random.uniform(-spread, spread) + v * random.uniform(-spread * .8, spread * .8)
        d = (u * random.uniform(-1, 1) + v * random.uniform(-.4, .6)).normalized()
        for k in range(9):
            q = p + d * k * .11 + (u * random.uniform(-.05, .05) + v * random.uniform(-.05, .05))
            ang = random.uniform(0, math.pi); a = (u * math.cos(ang) + v * math.sin(ang)); b = a.cross(SUN_TO).normalized()
            Lf, Wd = random.uniform(.11, .2), random.uniform(.045, .08)
            leaves.append([q + a * Lf * math.cos(s) + b * Wd * math.sin(s) for s in [i * 2 * math.pi / 10 for i in range(10)]])
    return leaves
occl_mesh('Occ_branches', foliage(Vector((X1, WIN_C.y, WIN_Z0 + .9)) + L * 2.4, 10, .8)          # outside the arched window
          + foliage(HA_C + L * 2.2 + Vector((.45, 0, .2)), 4, .35))                             # sparse over A (dense swallowed the beam, p4)
# B stays clear: the strip's square of sun keeps a crisp edge (leaves over B turned it into a blur, p8)

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = args.samples
scene.cycles.use_denoising = True; scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'None'
scene.cycles.max_bounces = 6
scene.view_settings.exposure = float(os.environ.get('PREVIEW_EV', 0)) if args.preview else 0

# ---------------- preview cameras (sampled Story paths, three → archive: (x, y, z) → (x, −z, y)) ----------------
def shoot(tag, pos, d, vfov, out):
    cam = bpy.data.cameras.new(tag); cam.sensor_fit = 'VERTICAL'; cam.angle = math.radians(vfov); cam.clip_start = .05
    co = bpy.data.objects.new(tag, cam); co.location = pos; co.rotation_euler = Vector(d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(co); scene.camera = co
    rx, ry = (int(x) for x in args.res.split('x')); scene.render.resolution_x, scene.render.resolution_y = rx, ry
    scene.render.filepath = os.path.join(out, f'{tag.replace("@", "_")}{"_clay" if args.clay else ""}.png'); bpy.ops.render.render(write_still=True)
    print('rendered', scene.render.filepath, flush=True)

if os.environ.get('RAYCHECK'):                                  # QA: what stops the sun on its way to each target patch
    dg = bpy.context.evaluated_depsgraph_get()
    for nm, T in (('skylight A', HA_T), ('skylight B', HB_T)):
        for du in (-.15, 0, .15):
            for dv in (-.15, 0, .15):
                o = T + Vector((du, dv, .002)); hit = scene.ray_cast(dg, o, L)
                print('ray', nm, round(du, 2), round(dv, 2), hit[4].name if hit[0] else 'SKY', tuple(round(x, 2) for x in hit[1]) if hit[0] else '', flush=True)
if args.preview:
    os.makedirs(args.preview, exist_ok=True)
    cams = json.load(open(args.cams, encoding='utf-8')) if args.cams else {}
    for s in args.shots.split(','):
        cond, tt = s.split('@'); q = min(cams[cond], key=lambda c: abs(c['t'] - float(tt)))
        p, d = q['pos'], q['dir']
        shoot(s, (p[0], -p[2], p[1]), (d[0], -d[2], d[1]), q['fov'], args.preview)
print('set objects', len(SET), 'groups', sorted({g for _, g in SET}), flush=True)

# ---------------- bake: colour x light per group → sqrt-encoded WebP + glb (UV = bake layer) ----------------
RES = {'floor': 2048, 'walls': 2048, 'roof': 2048, 'furn': 2048, 'small': 1024, 'rug': 1024, 'front': 512}
if args.bake:
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    os.makedirs(OUT, exist_ok=True)
    scale_res = float(os.environ.get('BAKE_SCALE', 1.0))
    scene.cycles.bake_type = 'COMBINED'; scene.render.bake.margin = 8
    scene.render.bake.use_pass_direct = scene.render.bake.use_pass_indirect = scene.render.bake.use_pass_color = True
    joined, raw = {}, {}
    for g in sorted({gg for _, gg in SET}):
        objs = [o for o, gg in SET if gg == g]
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.active_object; o.name = 'Room_' + g
        me = o.data; base = me.uv_layers[0] if me.uv_layers else me.uv_layers.new(name='UVMap'); base.active_render = True
        uv = me.uv_layers.new(name='bake'); me.uv_layers.active = uv
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.003, area_weight=0.0, scale_to_bounds=False)
        bpy.ops.uv.pack_islands(margin=.004); bpy.ops.object.mode_set(mode='OBJECT')
        n = max(64, int(RES[g] * scale_res)); img = bpy.data.images.new('bake_' + g, n, n, alpha=True, float_buffer=True)
        img.pixels.foreach_set(np.zeros(n * n * 4, np.float32))
        for slot in o.material_slots:
            m = slot.material.copy(); slot.material = m; tn = m.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img; m.node_tree.nodes.active = tn
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        print('baking', g, n, 'px', len(me.polygons), 'faces', flush=True)
        bpy.ops.object.bake(type='COMBINED')
        a = np.empty(n * n * 4, np.float32); img.pixels.foreach_get(a); raw[g] = a.reshape(n, n, 4)[::-1]
        joined[g] = o
    allv = np.concatenate([r[..., :3][r[..., 3] > 0].ravel() for r in raw.values()])
    scale = float(np.percentile(allv, 99.97)) if allv.size else 1.0      # same rule as route A (sunlit whites must not clip)
    meta = {'source': 'scripts/assets/desk-room-c.py', 'encoding': 'webp sqrt(linear colour x light / scale)', 'scale': round(scale, 5),
            'sun_to': [round(x, 4) for x in SUN_TO], 'sun_angle_deg': 1.0, 'samples': args.samples,
            'room': {'min': [X0, Y0, 0], 'max': [X1, Y1, ZR]}, 'window': [round(x, 3) for x in WIN_C], 'skylights': [[round(x, 3) for x in HA_C], [round(x, 3) for x in HB_C]], 'groups': {}}
    for g, r in raw.items():
        rgb, m = r[..., :3], r[..., 3] > 0
        med = np.stack([ndimage.median_filter(rgb[..., c], 3) for c in range(3)], -1)
        fire = m & (rgb.mean(-1) > med.mean(-1) * 1.6 + .02); rgb = rgb.copy(); rgb[fire] = med[fire]
        enc = np.sqrt(np.clip(rgb / scale, 0, 1)); enc[~m] = 0
        fn = f'{g}.webp'; Image.fromarray((enc * 255 + .5).astype(np.uint8)).save(os.path.join(OUT, fn), quality=92, method=6)
        meta['groups'][g] = {'file': fn, 'size': r.shape[0], 'fireflies': int(fire.sum()), 'saturated_pct': round(float((enc[m].max(-1) >= .98).mean() * 100), 3)}
        print('saved', fn, r.shape[0], 'fireflies', int(fire.sum()), 'sat%', meta['groups'][g]['saturated_pct'], flush=True)
    for g, o in joined.items():
        for l in [l for l in o.data.uv_layers if l.name != 'bake']: o.data.uv_layers.remove(l)
        o.data.materials.clear()
    bpy.ops.object.select_all(action='DESELECT')
    for o in joined.values(): o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'room_c.glb'), export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_materials='NONE', export_normals=False, export_texcoords=True)
    meta['tris'] = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())
    with open(os.path.join(OUT, 'room_c.json'), 'w', encoding='utf-8') as f: json.dump(meta, f, indent=1)
    print('exported room_c.glb', os.path.getsize(os.path.join(OUT, 'room_c.glb')), 'bytes', meta['tris'], 'tris, scale', scale, flush=True)
