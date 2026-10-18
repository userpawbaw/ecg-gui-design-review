"""Render an opt-in, temporary cutaway overview of the saved B3 archive scene.

Run with the bpy 4.5.3 environment:
  /workspace/.ecg-cloud/bpyenv/bin/python scripts/blender/archive-overview-cutaway.py
The source .blend is loaded only; hidden cutaway objects and review camera are never saved back.
"""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'dist/archive-light-b3-selected-20261018/scene.blend'
OUTPUT = ROOT / 'verification/r1-archive-b3-rerender-20261018/overview-cutaway.png'

if not SOURCE.is_file():
    raise SystemExit(f'Missing ignored render scene: {SOURCE}')

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
for obj in bpy.data.objects:
    name = obj.name.lower()
    if name.startswith(('ceiling', 'beam')) or name in {'wallr', 'walll_low', 'walll_top'}:
        obj.hide_render = True

camera_data = bpy.data.cameras.new('Archive Overview Review Camera')
camera = bpy.data.objects.new('Archive Overview Review Camera', camera_data)
scene.collection.objects.link(camera)
target = Vector((0.0, 2.0, 2.4))
camera.location = Vector((3.5, -18.0, 10.8))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 30
camera.data.sensor_width = 36
camera.data.dof.use_dof = False
scene.camera = camera

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUTPUT)
scene.view_settings.exposure = -1.0
for obj in bpy.data.objects:
    if obj.type == 'LIGHT' and obj.name == 'key':
        obj.data.energy *= 0.5
    elif obj.type == 'LIGHT' and obj.name == 'sun':
        obj.data.energy *= 0.6

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(write_still=True)
print(f'Overview written: {OUTPUT}')
