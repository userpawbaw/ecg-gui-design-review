"""Clay preview of the D-050 poses (front-3/4 + side), each standing/sitting on its anchor. Run: python scripts/assets/preview-poses-v3.py OUT_DIR"""
import bpy, json, math, os, sys
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, 'prototype/v2/src/story/intro/assets'); OUT = sys.argv[-1]
fj = json.load(open(os.path.join(A, 'figure.json'), encoding='utf-8'))['poses_v3']
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
cl = bpy.data.materials.new('clay'); cl.use_nodes = True; cl.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.62, .6, .57, 1)
fm = bpy.data.materials.new('fl'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.12, .1, .09, 1)
bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.object.data.materials.append(fm)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.4, .45, .55, 1)
L = bpy.data.lights.new('s', 'SUN'); L.energy = 4; lo = bpy.data.objects.new('s', L); lo.rotation_euler = (math.radians(50), 0, math.radians(-30)); sc.collection.objects.link(lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'
sc.render.resolution_x = sc.render.resolution_y = 600
for name, d in fj.items():
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(A, f'body_v3_{name}.glb'))
    o = [x for x in bpy.data.objects if x not in before and x.type == 'MESH'][0]; o.data.materials.append(cl)
    an = Vector(d['anchor']); seat_h = .45 if name in ('chair', 'desk') else 0.0
    o.location = Vector((0, 0, seat_h)) - an
    props = []
    if seat_h:                                                       # seat block so the sitting reads
        bpy.ops.mesh.primitive_cube_add(size=1); b = bpy.context.object; b.scale = (.45, .42, seat_h); b.location = (0, .02, seat_h / 2); props.append(b)
    for vname, off, lens in (('34', Vector((2.2, -3.0, 1.1)), 50), ('side', Vector((3.6, -.2, .9)), 50)):
        tgt = Vector((0, 0, .75 if name in ('wall', 'climb') else .6)); co.location = tgt + off
        co.rotation_euler = (tgt - co.location).to_track_quat('-Z', 'Y').to_euler(); cam.lens = lens
        sc.render.filepath = os.path.join(OUT, f'{name}_{vname}.png'); bpy.ops.render.render(write_still=True)
    for x in [o] + props: bpy.data.objects.remove(x, do_unlink=True)
