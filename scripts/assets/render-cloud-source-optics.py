"""D132 source survey and controlled optical-density comparison (offline only)."""
import argparse, hashlib, json, math, time
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--survey', action='store_true')
p.add_argument('--source', default='cloud_08')
p.add_argument('--only', default='')
a = p.parse_args()
OUT = ROOT / 'verification/a-cloud-source-optics-20261012'
if a.survey: OUT /= 'survey'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'CYCLES'
s.cycles.samples = 32 if a.survey else 96
s.cycles.use_denoising = True
s.cycles.volume_bounces = 6
s.cycles.volume_step_rate = .35
s.cycles.seed = 7
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'OPTIX'
s.cycles.device = 'GPU' if any(d.use for d in prefs.devices) else 'CPU'
s.render.resolution_x = s.render.resolution_y = 384 if a.survey else 1024
s.render.resolution_percentage = 100
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGBA'
s.render.image_settings.color_depth = '8'
s.render.film_transparent = True
s.view_settings.view_transform = 'AgX'
w = bpy.data.worlds.new('Same low sky'); s.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (.35, .5, .8, 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = .08
bpy.ops.object.light_add(type='SUN'); sun = bpy.context.object
sun.data.energy = 6; sun.data.angle = math.radians(.53)
direction = Vector((0, -math.cos(math.radians(15)), math.sin(math.radians(15))))
sun.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(); cam = bpy.context.object; s.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 10 if a.survey else 5
cam.location = (0, -20*math.cos(math.radians(65)), 20*math.sin(math.radians(65)))
cam.rotation_euler = (-cam.location).to_track_quat('-Z', 'Y').to_euler()
mat = bpy.data.materials.new('Same white cloud'); mat.use_nodes = True
mat.node_tree.nodes.clear()
o = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
v = mat.node_tree.nodes.new('ShaderNodeVolumePrincipled')
v.inputs['Density Attribute'].default_value = 'density'
v.inputs['Color'].default_value = (.98, .99, 1, 1)
mat.node_tree.links.new(v.outputs['Volume'], o.inputs['Volume'])
manifest = {'status': 'offline source/optical probes; not live geographic scene',
 'renderer': bpy.app.version_string, 'size': [s.render.resolution_x]*2,
 'maxSamples': s.cycles.samples, 'adaptiveSampling': s.cycles.use_adaptive_sampling,
 'adaptiveThreshold': s.cycles.adaptive_threshold, 'denoiser': s.cycles.denoiser,
 'stepRate': .35, 'volumeBounces': 6, 'seed': 7, 'sunElevation': 15,
 'sunEnergy': 6, 'sunDirection': list(direction), 'skyStrength': .08,
 'cameraElevation': 65, 'orthoScale': cam.data.ortho_scale, 'viewTransform': 'AgX',
 'normalization': 'longest source bbox extent normalized to 7; source physical metres unknown',
 'frames': [], 'limitations': ['isolated fixed-light asset; no live motion or GPU frame timing',
 'different sources have different normalized shape/optical paths; not resolution-only comparison',
 'density multiplier changes optical thickness and opacity, not source spatial resolution']}
mf = OUT/'manifest.json'
if mf.exists():
 prior=json.loads(mf.read_text(encoding='utf-8'))
 manifest['frames']=prior['frames']
jobs = [(f'cloud_{i:02d}', 1, .35) for i in range(1,11)] if a.survey else [
 ('cloud_06',4,.35), (a.source,1,.35), (a.source,4,.35), (a.source,4,0)]
for name,density,g in jobs:
 file=f'{name}-d{density}-g{g}.png'
 if a.only and file != a.only: continue
 if any(f['file']==file for f in manifest['frames']): continue
 path=ROOT/f'assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/{name}_variant_0000.vdb'
 bpy.ops.object.volume_import(filepath=str(path)); cloud=bpy.context.object
 cloud.data.grids.load(); bpy.context.view_layer.update()
 if cloud.data.grids.error_message: raise RuntimeError(cloud.data.grids.error_message)
 bounds=[Vector(b) for b in cloud.bound_box]
 lo=Vector([min(b[i] for b in bounds) for i in range(3)])
 hi=Vector([max(b[i] for b in bounds) for i in range(3)])
 scale=7/max(hi-lo); cloud.scale=(scale,)*3; cloud.location=-(lo+hi)/2*scale
 cloud.data.materials.append(mat)
 v.inputs['Density'].default_value=density; v.inputs['Anisotropy'].default_value=g
 s.render.filepath=str(OUT/file); start=time.time(); bpy.ops.render.render(write_still=True)
 manifest['frames'].append({'file':file,'source':path.relative_to(ROOT).as_posix(),
 'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'densityMultiplier':density,
 'anisotropy':g, 'bounds':[list(lo),list(hi)], 'scale':scale,
 'volumeSpace':cloud.data.render.space, 'seconds':time.time()-start,
 'sha256':hashlib.sha256((OUT/file).read_bytes()).hexdigest()})
 mf.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 bpy.data.objects.remove(cloud,do_unlink=True)
 print('COMPLETE',file,flush=True)
