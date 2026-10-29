"""Power strip for the Story power-line scene (REVIEW-R1-STORY-20261011 S-03, user 2026-10-11: "테두리는 네모뿐인데 좀 둥근
모서리로 … 콘센트 구멍이 … 실제 콘센트처럼 안쪽으로 들어가 있어야").
Built from the socket standard rather than a downloaded model: Korea uses CEE 7/3 (Schuko) sockets — a round recess 17.5 mm deep,
two 4.8 mm contact holes 19 mm apart, earthing clips on the recess wall [Wikipedia "Schuko", "CEE 7"]; recess diameter ~38 mm
[inference: the plug body is 36.5 mm]. Strip: four sockets on a raised round collar each, one rocker switch with a red lamp per
socket, rounded body (8 mm bevel), a plug in the first socket (the computer's — its cable is the scene's PowerLine), and the wall
cord leaving the far end. Placed where build_archive.py's baked box strip was (OUT = −0.95, 3.62, 0 in the archive frame), so the
web hides the baked parts (PowerStrip, StripHole, StripSwitch, Plug) and shows this one.
Run: python scripts/assets/power-strip-v1.py   → prototype/v2/src/story/noise/assets/power_strip.glb
"""
import math, os, sys
import bpy, bmesh
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUTF = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'noise', 'assets', 'power_strip.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
OUT = Vector((-0.95, 3.62, 0.0))                       # archive frame (Blender, z up) — same spot as the baked strip

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c)
def mat(name, hexc, rough=.5, metal=0., emit=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*srgb(hexc), 1); b.inputs['Emission Strength'].default_value = emit
    return m
M_BODY, M_WELL, M_HOLE = mat('strip_body', '#ece8de', .42), mat('strip_well', '#d6d1c6', .5), mat('strip_hole', '#141414', .6)
M_CLIP, M_SW, M_LAMP = mat('strip_clip', '#b9bcc0', .3, 1.), mat('strip_switch', '#f2efe8', .35), mat('strip_lamp', '#ff3a2a', .3, emit=3.)
M_PLUG, M_CORD = mat('plug', '#2b2b2b', .55), mat('cord', '#1d1d1d', .6)

def obj(name, me, m):
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.data.materials.append(m); return o
def rbox(name, size, loc, m, bevel):                   # rounded box: cube + bevel modifier (applied)
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = 5; bv.limit_method = 'ANGLE'
    bpy.ops.object.modifier_apply(modifier='bv'); o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def cyl(name, r, h, loc, m, verts=48, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts); o = bpy.context.active_object; o.name = name
    if rot: o.rotation_euler = rot; bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(m); return o
def cut(target, cutter):                               # boolean difference, cutter removed
    md = target.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cutter; md.solver = 'EXACT'
    if hasattr(md, 'material_mode'): md.material_mode = 'TRANSFER'          # cut faces take the cutter's material (well, hole)
    bpy.context.view_layer.objects.active = target; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cutter)

L, Wd, Hh = .36, .078, .042                            # body length (x), width (y), height (z), metres
SOCK = [-.120, -.040, .040, .120]                      # socket centres along x (one per 8 cm)
REC_R, REC_D, PIN_R, PIN_DX, PIN_D = .019, .0175, .0024, .0095, .016
top = OUT.z + Hh
body = rbox('Strip_body', (L, Wd, Hh), OUT + Vector((0, 0, Hh / 2)), M_BODY, .008)
# raised collar around each socket (a soft ring, as on most strips) then the recess cut through collar and body
collars = []
for x in SOCK:
    c = cyl('Strip_collar', REC_R + .0045, .004, OUT + Vector((x, -.004, top + .0015)), M_BODY, 64); collars.append(c)
for x, c in zip(SOCK, collars):                        # recess: 17.5 mm below the collar top, walls/floor in the well colour
    floor_z = top + .0035 - REC_D
    cut(body, cyl('_rec', REC_R, .04, OUT + Vector((x, -.004, floor_z + .02)), M_WELL, 64))
    cut(c, cyl('_rec', REC_R, .02, OUT + Vector((x, -.004, top)), M_WELL, 64))
    for dx in (-PIN_DX, PIN_DX):                       # contact holes 4.8 mm, 19 mm apart, 16 mm deep (black)
        cut(body, cyl('_pin', PIN_R, 2 * PIN_D, OUT + Vector((x + dx, -.004, floor_z)), M_HOLE, 24))
    for dy in (-1, 1):                                 # earthing clips on the recess wall, across the pin line
        rbox('Strip_clip', (.010, .0018, .009), OUT + Vector((x, -.004 + dy * (REC_R - .0011), floor_z + .0065)), M_CLIP, .0007)
# rocker switch + red lamp per socket, on the long edge
for x in SOCK:
    rbox('Strip_switch', (.016, .012, .006), OUT + Vector((x, Wd / 2 - .016, top + .002)), M_SW, .002)
    rbox('Strip_lamp', (.006, .004, .003), OUT + Vector((x - .005, Wd / 2 - .016, top + .0055)), M_LAMP, .001)
# the computer's plug in socket 1: round body seated in the recess, grip ribs, cable out of the back
px = SOCK[0]
cyl('Plug_body', .0182, .040, OUT + Vector((px, -.004, top - .006 + .020)), M_PLUG, 48)
for k in range(10):
    a = 2 * math.pi * k / 10
    rbox('Plug_rib', (.002, .003, .028), OUT + Vector((px + .0185 * math.cos(a), -.004 + .0185 * math.sin(a), top + .016)), M_PLUG, .0008)
cyl('Plug_cap', .0165, .006, OUT + Vector((px, -.004, top + .037)), M_PLUG, 48)
# wall cord stub leaving the far end (the baked cord continues on the floor)
cyl('Strip_cord', .0045, .05, OUT + Vector((L / 2 + .02, 0, .015)), M_CORD, 16, rot=(0, math.radians(90), 0))
# join by material-agnostic parent (keep objects; export as one scene)
root = bpy.data.objects.new('PowerStripV1', None); bpy.context.collection.objects.link(root)
for o in list(bpy.context.collection.objects):
    if o is not root and o.type == 'MESH': o.parent = root
bpy.ops.object.select_all(action='SELECT')
os.makedirs(os.path.dirname(OUTF), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUTF, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
n = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('power_strip.glb', os.path.getsize(OUTF), 'bytes,', n, 'faces'); sys.stdout.flush()
