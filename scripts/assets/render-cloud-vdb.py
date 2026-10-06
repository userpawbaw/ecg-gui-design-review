"""Isolated external VDB optical trial; never replaces the live Intro."""
import bpy, json, math, hashlib, os, time
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/source/jangafx-cloud-pack/unpacked'
OUT = ROOT / 'verification/a-cloud-vdb-20261006'
OUT.mkdir(parents=True, exist_ok=True)
MODE = os.environ.get('VDB_TRIAL_MODE', 'survey')
SUFFIX = os.environ.get('VDB_TRIAL_SUFFIX', '')
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24 if MODE == 'survey' else 96
scene.cycles.use_denoising = True
scene.cycles.volume_bounces = int(os.environ.get('VDB_BOUNCES', '6'))
scene.cycles.volume_step_rate = .5
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'OPTIX'
scene.cycles.device = 'GPU' if any(d.use for d in prefs.devices) else 'CPU'
scene.render.resolution_x = 480 if MODE == 'survey' else 960
scene.render.resolution_y = int(scene.render.resolution_x * 9 / 16)
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0
world = bpy.data.worlds.new('Soft blue sky fill')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.32, .46, .65, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = float(os.environ.get('VDB_SKY', '.35'))
bpy.ops.object.light_add(type='SUN')
sun = bpy.context.object
sun.data.energy = 4
sun.data.angle = math.radians(1)
sun.data.color = (1, .9, .78)
SUN = Vector((.70583314, -.4836477, .51757557))
sun.rotation_euler = (-SUN).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, -.25))
floor = bpy.context.object
floor.name = 'Diagnostic blue receiver, not planet geometry'
fm = bpy.data.materials.new('Receiver')
fm.use_nodes = True
fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.025, .085, .14, 1)
fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .7
floor.data.materials.append(fm)
bpy.ops.object.camera_add()
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 45
cam.data.clip_end = 200
mat = bpy.data.materials.new('VDB white scattering')
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
vol = nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 1
vol.inputs['Density Attribute'].default_value = 'density'
vol.inputs['Color'].default_value = (.98, .99, 1, 1)
vol.inputs['Anisotropy'].default_value = .45
mat.node_tree.links.new(vol.outputs['Volume'], output.inputs['Volume'])
metadata, frames = [], []
files = sorted(SOURCE.rglob('*.vdb'))
selected = os.environ.get('VDB_SELECTED', '')
if selected:
    files = [p for p in files if p.name.split('_variant')[0] in selected.split(',')]
for path in files:
    bpy.ops.object.volume_import(filepath=str(path.resolve()))
    cloud = bpy.context.object
    cloud.data.grids.load()
    bpy.context.view_layer.update()
    bounds = [Vector(p) for p in cloud.bound_box]
    low = Vector([min(p[i] for p in bounds) for i in range(3)])
    high = Vector([max(p[i] for p in bounds) for i in range(3)])
    scale = 8 / max(high-low)
    cloud.scale = (scale,)*3
    center = (low + high)/2
    cloud.location = (-center.x*scale, -center.y*scale, -low.z*scale)
    cloud.data.materials.append(mat)
    entry = {'file': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
             'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
             'grids': [{'name': g.name, 'type': g.data_type, 'matrix': [list(row) for row in g.matrix_object]} for g in cloud.data.grids],
             'original_bounds': [list(low), list(high)], 'normalized_scale': scale}
    metadata.append(entry)
    shots = [('survey', (10,-13,8), (0,0,1.3))] if MODE == 'survey' else [
        ('far-diagnostic', (26,-34,23), (0,0,1.3)),
        ('orbit-top', (7,-9,7), (0,0,1.4)),
        ('descent-side', (7,-10,2.6), (0,0,1.5))]
    for shot, pos, target in shots:
        if os.environ.get('VDB_SHOT') and shot != os.environ['VDB_SHOT']:
            continue
        cam.location = pos
        cam.rotation_euler = (Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
        tag = path.name.split('_variant')[0]+'-'+shot+SUFFIX
        scene.render.filepath = str(OUT/(tag+'.png'))
        started = time.time()
        bpy.ops.render.render(write_still=True)
        frames.append({'file': tag+'.png', 'asset': path.name, 'camera': pos,
                       'target': target, 'seconds': time.time()-started})
        print('FRAME_COMPLETE', tag, flush=True)
    bpy.data.objects.remove(cloud, do_unlink=True)
manifest = {'status': 'isolated optical trial; not runtime adoption or user feedback',
            'mode': MODE, 'bpy': bpy.app.version_string, 'engine': 'Cycles',
            'samples': scene.cycles.samples, 'volume_bounces': scene.cycles.volume_bounces,
            'volume_step_rate': scene.cycles.volume_step_rate, 'sun_direction': list(SUN),
            'density_multiplier': 1, 'anisotropy': .45, 'bloom': False,
            'sky_strength': world.node_tree.nodes['Background'].inputs['Strength'].default_value,
            'devices': [{'name': d.name, 'type': d.type, 'enabled': d.use} for d in prefs.devices],
            'assets': metadata, 'frames': frames,
            'limitations': 'Normalized isolated clouds and flat receiver; far view is not a whole Earth render. No thin cirrus, globe coverage or live camera handoff proof.'}
(OUT/(MODE+SUFFIX+'-manifest.json')).write_text(json.dumps(manifest, indent=2), encoding='utf-8', newline='\n')
