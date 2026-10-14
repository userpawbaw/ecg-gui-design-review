"""Desk workstation + ECG cart device for the Story (user 2026-10-14: "컴퓨터쪽 에셋들은 퀄리티가 왜 이렇게 낮지? …
구식 게임의 에셋같은 퀄리티"). The baked archive has plain boxes there (build_archive.py PC_Case, CRT_Body, CRT_Back,
CRT_Screen, Keyboard, ECG_Device). This builds detailed versions at the same spots and sizes; the web removes the baked
boxes by volume (noiseStage.ts) and shows these. The bake script itself is not touched (archive-light session).
Beige 1990s workstation: desktop case with two floppy drives, power button and LED, front vents; CRT with rounded bezel,
tapered rear housing, a slightly curved recessed screen and top vents on a swivel foot; keyboard with individual keys;
ECG device with a tilted display, knobs and a paper slot.
Run: python scripts/assets/workstation-v1.py   → prototype/v2/src/story/noise/assets/workstation.glb
"""
import math, os, sys
import bpy, bmesh
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUTF = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'noise', 'assets', 'workstation.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
DESK, MZ, CART = Vector((-2.35, 3.55, 0)), 0.77, Vector((-1.5, 3.9, 0))   # build_archive.py values (archive frame, z up)

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c)
def mat(name, hexc, rough=.5, metal=0., emit=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*srgb(hexc), 1); b.inputs['Emission Strength'].default_value = emit
    return m
M_BEIGE, M_BEIGE2, M_KEY = mat('ws_beige', '#d8cfba', .45), mat('ws_beige_dark', '#c4baa3', .5), mat('ws_key', '#e3dccb', .4)
M_SLOT, M_GLASS, M_GRILLE = mat('ws_slot', '#1a1916', .6), mat('ws_crt_glass', '#121816', .12), mat('ws_grille', '#9d9584', .6)
M_LED, M_ECGSCR, M_KNOB = mat('ws_led', '#59ff7a', .3, emit=2.5), mat('ws_ecg_screen', '#0d2a1c', .2, emit=.6), mat('ws_knob', '#2e2b27', .45)

def obj(name, me, m):
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.data.materials.append(m); return o
def rbox(name, size, loc, m, bevel, seg=4, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    if rot: o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if bevel > 0:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier='bv')
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def cyl(name, r, h, loc, m, verts=32, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts); o = bpy.context.active_object; o.name = name
    if rot: o.rotation_euler = rot; bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def cut(target, cutter):
    md = target.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cutter; md.solver = 'EXACT'
    if hasattr(md, 'material_mode'): md.material_mode = 'TRANSFER'
    bpy.context.view_layer.objects.active = target; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cutter)
def frustum(name, w0, h0, w1, h1, depth, loc, m):
    """tapered housing: front rect (w0 x h0) at y=0 → back rect (w1 x h1) at y=+depth, centred on loc (front face)"""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for (y, ww, hh) in ((0, w0, h0), (depth, w1, h1)) for (x, z) in ((-ww/2, -hh/2), (ww/2, -hh/2), (ww/2, hh/2), (-ww/2, hh/2))]
    for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([vs[i] for i in f])
    bm.to_mesh(me); bm.free(); o = obj(name, me, m); o.location = loc
    bv = o.modifiers.new('bv', 'BEVEL'); bv.width = .02; bv.segments = 5; bv.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='bv'); bpy.ops.object.shade_smooth(); return o

# --- desktop case (front faces −y) ---
cx, cy, cz = DESK.x - .05, DESK.y + .05, MZ + .08
case = rbox('WS_case', (.44, .42, .16), (cx, cy, cz), M_BEIGE, .008)
front = cy - .21
for i, dx in enumerate((-.07, .07)):                                   # two 3.5" floppy drives, right half
    cut(case, rbox('_slot', (.10, .03, .006), (cx + .08 + dx * .0, front, cz + .035 - i * .03), M_SLOT, 0))
    rbox('WS_eject', (.014, .006, .008), (cx + .145, front - .002, cz + .035 - i * .03), M_BEIGE2, .002)
cut(case, rbox('_grooves', (.16, .01, .09), (cx - .12, front, cz - .005), M_GRILLE, 0))   # vent recess
for k in range(7): rbox('WS_vent', (.15, .006, .004), (cx - .12, front + .001, cz - .045 + k * .013), M_BEIGE2, .001)
rbox('WS_power', (.026, .01, .02), (cx + .17, front - .003, cz - .045), M_BEIGE2, .004)
rbox('WS_led', (.006, .004, .003), (cx + .13, front - .002, cz - .05), M_LED, .001)
# --- CRT monitor on a swivel foot ---
mz0 = MZ + .16
cyl('WS_foot', .11, .018, (cx, DESK.y + .12, mz0 + .009), M_BEIGE2, 48)
cyl('WS_neck', .05, .03, (cx, DESK.y + .14, mz0 + .03), M_BEIGE2, 32)
by = DESK.y - .07                                                       # bezel front plane
bezel = rbox('WS_bezel', (.40, .08, .34), (cx, by + .04, mz0 + .045 + .17), M_BEIGE, .018, 6)
cut(bezel, rbox('_screenhole', (.33, .2, .26), (cx, by, mz0 + .045 + .18), M_SLOT, .012))
frustum('WS_housing', .37, .31, .25, .20, .30, (cx, by + .08, mz0 + .045 + .17), M_BEIGE)
# curved glass, recessed 2 cm, slight bulge
bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=18, size=1, location=(0, 0, 0)); g = bpy.context.active_object; g.name = 'WS_glass'
for v in g.data.vertices:
    x, y = v.co.x, v.co.y; v.co = Vector((x * .33, -(1 - (x * x + y * y) * .9) * .012, y * .26))
g.location = (cx, by + .02, mz0 + .045 + .18); g.data.materials.append(M_GLASS); bpy.ops.object.shade_smooth()
for k in range(9): rbox('WS_topvent', (.012, .12, .004), (cx - .09 + k * .022, by + .25, mz0 + .045 + .17 + .1 + .004), M_SLOT, .001)
rbox('WS_crt_led', (.006, .004, .004), (cx + .16, by - .002, mz0 + .045 + .02), M_LED, .001)
cyl('WS_knob1', .007, .01, (cx + .12, by - .004, mz0 + .045 + .02), M_BEIGE2, 16, rot=(math.radians(90), 0, 0))
cyl('WS_knob2', .007, .01, (cx + .1, by - .004, mz0 + .045 + .02), M_BEIGE2, 16, rot=(math.radians(90), 0, 0))
# --- keyboard (4° tilt) with individual keys ---
ky, kz, tilt = DESK.y - .28, MZ + .012, math.radians(4)
kb = rbox('WS_kb', (.44, .15, .022), (cx, ky, kz), M_BEIGE, .005, rot=(tilt, 0, 0))
rows = [(15, 0), (15, .5), (14, .75), (13, 1.0)]
pitch = .0265
for r, (n, off) in enumerate(rows):
    for i in range(n):
        x = cx - .19 + (i + off * .5) * pitch; y = ky + .045 - r * .025
        if x > cx + .2: continue
        rbox('WS_key', (.022, .021, .009), (x, y, kz + .014 + (ky + .045 - y) * math.tan(tilt) * -1 + .003), M_KEY, .0025, 3, rot=(tilt, 0, 0))
rbox('WS_space', (.15, .021, .009), (cx - .02, ky - .055, kz + .017), M_KEY, .0025, 3, rot=(tilt, 0, 0))
# --- ECG device on the cart ---
ex, ey, ez = CART.x, CART.y, .87
dev = rbox('WS_ecg', (.40, .30, .12), (ex, ey, ez), M_BEIGE, .012, 5)
cut(dev, rbox('_paper', (.18, .02, .008), (ex - .06, ey - .15, ez + .035), M_SLOT, 0))
panel = rbox('WS_ecg_panel', (.22, .02, .13), (ex + .06, ey - .06, ez + .11), M_BEIGE2, .008, 4, rot=(math.radians(-25), 0, 0))
rbox('WS_ecg_screen', (.18, .006, .09), (ex + .06, ey - .072, ez + .115), M_ECGSCR, .003, 2, rot=(math.radians(-25), 0, 0))
for i in range(3): cyl('WS_ecg_knob', .011, .014, (ex - .14 + i * .035, ey - .155, ez + .0), M_KNOB, 20, rot=(math.radians(90), 0, 0))
rbox('WS_ecg_led', (.006, .004, .004), (ex + .17, ey - .151, ez + .03), M_LED, .001)

root = bpy.data.objects.new('WorkstationV1', None); bpy.context.collection.objects.link(root)
for o in list(bpy.context.collection.objects):
    if o is not root and o.type == 'MESH': o.parent = root
bpy.ops.object.select_all(action='SELECT')
os.makedirs(os.path.dirname(OUTF), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUTF, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
n = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('workstation.glb', os.path.getsize(OUTF), 'bytes,', n, 'faces'); sys.stdout.flush()
