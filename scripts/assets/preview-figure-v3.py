"""Clay preview of body_seated_v3.glb with the stile + electrode markers (D-048 check renders).
Run: python scripts/assets/preview-figure-v3.py OUT_DIR [grip]"""
import bpy, json, math, os, sys
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, 'prototype/v2/src/story/intro/assets')
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]
GRIP = 'grip' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.join(A, 'body_seated_v3.glb'))
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]
if GRIP: o.data.shape_keys.key_blocks['grip'].value = 1
fj = json.load(open(os.path.join(A, 'figure.json'), encoding='utf-8'))['seated_v3']
cl = bpy.data.materials.new('clay'); cl.use_nodes = True; cl.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.62, .6, .57, 1)
o.data.materials.append(cl)
st = fj['stile']; ap = Vector(st['axis_point']); ad = Vector(st['axis_dir'])
bpy.ops.mesh.primitive_cube_add(size=1); s = bpy.context.object; s.scale = (.045, .07, 1.6)
s.location = ap; s.rotation_euler = ad.to_track_quat('Z', 'Y').to_euler()
wd = bpy.data.materials.new('wood'); wd.use_nodes = True; wd.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.25, .13, .06, 1); s.data.materials.append(wd)
seat = Vector(fj['seat']); bpy.ops.mesh.primitive_cube_add(size=1); r = bpy.context.object; r.scale = (.48, .09, .03)
r.location = (seat.x, seat.y + .06, seat.z - .015); r.data.materials.append(wd)
em = bpy.data.materials.new('el'); em.use_nodes = True; em.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.1, .35, 1, 1)
for k, e in fj['electrodes'].items():
    bpy.ops.mesh.primitive_cylinder_add(radius=.016, depth=.004); c = bpy.context.object
    c.location = Vector(e['p']) + Vector(e['n']) * .002; c.rotation_euler = Vector(e['n']).to_track_quat('Z', 'Y').to_euler(); c.data.materials.append(em)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.4, .45, .55, 1)
L = bpy.data.lights.new('s', 'SUN'); L.energy = 4; lo = bpy.data.objects.new('s', L); lo.rotation_euler = (math.radians(50), 0, math.radians(-30)); sc.collection.objects.link(lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'
def shoot(name, loc, tgt, lens, res=(700, 700)):
    co.location = loc; co.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cam.lens = lens
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True)
H = Vector(fj['hand_r']); sfx = '_grip' if GRIP else ''
if not GRIP:
    shoot('v3_front.png', (0, -4.2, .9), (0, 0, .85), 50); shoot('v3_34.png', (2.6, -3.2, 1.1), (0, 0, .85), 50)
    shoot('v3_side.png', (4.2, -.1, .9), (0, 0, .85), 50); shoot('v3_head.png', (.5, -1.4, 1.5), (0, -.05, 1.45), 70)
    shoot('v3_chest.png', (.15, -1.3, 1.15), (0, 0, 1.1), 60)
shoot(f'v3_hand_out{sfx}.png', tuple(H + Vector((-.5, -.25, .1))), tuple(H), 80)
shoot(f'v3_hand_front{sfx}.png', tuple(H + Vector((-.15, -.55, .05))), tuple(H), 80)
shoot(f'v3_hand_back{sfx}.png', tuple(H + Vector((-.2, .5, .15))), tuple(H), 80)
