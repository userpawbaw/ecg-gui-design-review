"""Bake the R1 intro floor light (P2, PLAN-R1-INTRO-STORY-V2 §4.3) — the attic method (REF-002 study): Cycles direct +
indirect light baked into a texture, so the floor carries a soft light pool and the figure's long contact shadow.

Scene (Blender z-up; three.js y-up = (x, z, −y)): figure body.glb at the origin, feet on z = 0, facing −y (toward the
intro camera). Warm area light behind and above the figure (matches the backlight glow in createSpace), faint cool sky.
Output: prototype/v2/src/story/intro/assets/floor_light.png — 1024², 16 × 16 m centred on the figure, 8-bit sqrt-encoded.
Run: python scripts/assets/bake-intro-floor.py   (bpy 4.5)
"""
import os, math
import numpy as np
import bpy, mathutils
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets')
SIZE, RES = 16.0, 1024
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(A, 'body.glb'))
body = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 256; sc.cycles.use_denoising = True
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.55, .65, .85, 1); bg.inputs[1].default_value = .03
L = bpy.data.lights.new('back', 'AREA'); L.energy = 700; L.size = 1.2; L.color = (1, .62, .36)
lo = bpy.data.objects.new('back', L); lo.location = (0, 3.2, 1.8)
lo.rotation_euler = (mathutils.Vector((0, -.6, 0)) - lo.location).to_track_quat('-Z', 'Y').to_euler()
sc.collection.objects.link(lo)
me = bpy.data.meshes.new('floor')
h = SIZE / 2
me.from_pydata([(-h, -h, 0), (h, -h, 0), (h, h, 0), (-h, h, 0)], [], [(0, 1, 2, 3)])
me.uv_layers.new(name='uv')
for i, uv in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
    me.uv_layers['uv'].data[i].uv = uv
floor = bpy.data.objects.new('floor', me); sc.collection.objects.link(floor)
m = bpy.data.materials.new('f'); m.use_nodes = True
m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (1, 1, 1, 1)
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1
img = bpy.data.images.new('floor_light', RES, RES, float_buffer=True)
tn = m.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img; m.node_tree.nodes.active = tn
me.materials.append(m)
bm = bpy.data.materials.new('b'); bm.use_nodes = True
bm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.5, .5, .5, 1)
body.data.materials.clear(); body.data.materials.append(bm)
bpy.ops.object.select_all(action='DESELECT'); floor.select_set(True); bpy.context.view_layer.objects.active = floor
sc.render.bake.use_pass_color = False; sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True
bpy.ops.object.bake(type='DIFFUSE', margin=4)
px = np.array(img.pixels[:]).reshape(RES, RES, 4)[:, :, 0]
peak = np.percentile(px, 99.8)
v = np.sqrt(np.clip(px / peak, 0, 1))
from PIL import Image
Image.fromarray((v[::-1] * 255 + .5).astype(np.uint8), 'L').save(os.path.join(A, 'floor_light.png'), optimize=True)
print('peak', float(peak), 'mean', float(v.mean()), 'saved', os.path.getsize(os.path.join(A, 'floor_light.png')))
