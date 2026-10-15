"""Desk lamp for the Story desk corner, aimed at the keyboard (D-067, user 2026-10-15 "조명은 A+B로 진행해줘").
The baked archive has the same CC0 lamp (Poly Haven desk_lamp_arm_01, build_archive.py place(..., 0.45, rot=200°)) with its
shade turned to the back of the desk, so a lit pool would land behind the monitor. This rebuilds it at the same height, moved to the
front-right corner and turned so the shade faces the keyboard; the web trims the baked lamp by volume (noiseStage.ts) and lights from the
bulb position/direction written to desk_lamp.json (three frame: x, z, -y).
Run: python scripts/assets/desk-lamp-story.py   → prototype/v2/src/story/noise/assets/desk_lamp.glb + desk_lamp.json
"""
import json, math, os, sys
import bpy
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'assets', 'source', 'ph-desk_lamp_arm_01', 'desk_lamp_arm_01_1k.gltf')
OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'noise', 'assets')
DESK, MZ = Vector((-2.35, 3.55, 0)), 0.77
BASE = Vector((DESK.x + .63, DESK.y - .13))            # front-right of the desk (1.9 x 0.9 m): at the baked spot (+.45, +.15) the shade sat
                                                        # 2 cm from the PC case and burned its side (web check 2026-10-15)
AIM = Vector((DESK.x - .05, DESK.y - .28, MZ))          # keyboard centre (workstation-v1.py)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
objs = list(bpy.data.objects); roots = [o for o in objs if o.parent is None]; meshes = [o for o in objs if o.type == 'MESH']
def verts(): return [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
def bbox():
    vs = verts(); return Vector([min(v[k] for v in vs) for k in range(3)]), Vector([max(v[k] for v in vs) for k in range(3)])
def bulb():
    pts, nrm = [], Vector()
    for o in meshes:
        me = o.data; li = [i for i, m in enumerate(me.materials) if m and m.name.endswith('_light')]
        if not li: continue
        for p in me.polygons:
            if p.material_index == li[0]:
                pts += [o.matrix_world @ me.vertices[i].co for i in p.vertices]; nrm += (o.matrix_world.to_3x3() @ p.normal) * p.area
    return sum(pts, Vector()) / len(pts), nrm.normalized()
def place(rot):                                          # glTF roots import in quaternion mode: turn a parent empty instead
    piv.rotation_euler = (0, 0, rot); piv.location = (0, 0, 0); bpy.context.view_layer.update(); lo, hi = bbox(); c = (lo + hi) / 2
    piv.location = (BASE.x - c.x, BASE.y - c.y, MZ - lo.z); bpy.context.view_layer.update()
bpy.context.view_layer.update(); lo, hi = bbox(); s = .45 / (hi.z - lo.z)
piv = bpy.data.objects.new('DeskLampStory', None); bpy.context.collection.objects.link(piv); piv.scale = (s, s, s)
for r in roots: r.parent = piv
rot = math.radians(200)
for _ in range(4):                                       # turn until the shade's horizontal direction points at the keyboard
    place(rot); p, d = bulb(); want = (AIM - p).xy; have = d.xy
    rot += math.atan2(want.y, want.x) - math.atan2(have.y, have.x)
place(rot); p, d = bulb(); lo, hi = bbox()
print('rot', round(math.degrees(rot) % 360, 1), 'bulb', [round(v, 3) for v in p], 'dir', [round(v, 3) for v in d], 'bbox', [round(v, 3) for v in lo], [round(v, 3) for v in hi])
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'desk_lamp.glb'), export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_image_format='WEBP', export_image_quality=85)
T = lambda v: [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
with open(os.path.join(OUT, 'desk_lamp.json'), 'w', encoding='utf-8') as f:
    json.dump({'source': 'Poly Haven desk_lamp_arm_01 (CC0)', 'bulb': T(p), 'dir': T(d), 'aim': T(AIM), 'rot_deg': round(math.degrees(rot) % 360, 2),
               'bbox_archive': [[round(v, 3) for v in lo], [round(v, 3) for v in hi]]}, f, indent=1)
print('desk_lamp.glb', os.path.getsize(os.path.join(OUT, 'desk_lamp.glb')), 'bytes'); sys.stdout.flush()
