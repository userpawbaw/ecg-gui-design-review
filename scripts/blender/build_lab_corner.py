"""Isometric ECG lab-corner bake test (headless Blender via the `bpy` wheel).

Builds a cut-away room corner, places Poly Haven CC0 props from assets/source (see assets/registry.json),
bakes lighting-only lightmaps for N sun azimuths plus one AO map, and exports a glTF for the three.js spike.

    python3 scripts/blender/build_lab_corner.py --out prototype/spikes/lab-corner/public/scene \
        --azimuths 8 --size 1024 --samples 96

Outputs: lab_corner.glb, light_XX.png (lighting only, per azimuth), ao.png, manifest.json.
The monitor waveform is drawn from the canonical archive (d1-mixed-10, M08 output) and is decorative.
"""
import argparse, json, math, os, sys, time
import bpy, bmesh, numpy as np
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='prototype/spikes/lab-corner/public/scene')
ap.add_argument('--azimuths', type=int, default=8)
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--elevation', type=float, default=32.0)
ap.add_argument('--passes', default='full,indirect', help='per-azimuth bakes: full (direct+indirect) and/or indirect only')
ap.add_argument('--preview', action='store_true', help='render a camera preview instead of baking')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
OUT = os.path.join(ROOT, args.out)
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- materials ----------
def mat(name, rgb, rough=0.8, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    return m

M_WALL = mat('Wall', (0.80, 0.76, 0.69), 0.9)
M_FLOOR = mat('Floor', (0.46, 0.31, 0.19), 0.55)
M_TRIM = mat('Trim', (0.93, 0.91, 0.86), 0.6)
M_FRAME = mat('WindowFrame', (0.22, 0.20, 0.18), 0.5)
M_DARK = mat('MonitorBody', (0.05, 0.05, 0.055), 0.35)

def box(name, size, loc, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m)
    return o

# ---------- room shell (floor 4 x 4, walls on x=0 and y=4, height 2.9) ----------
W, D, H, T = 4.0, 4.0, 2.9, 0.14
floor = box('Floor', (W + T, D + T, 0.1), (W / 2 - T / 2, D / 2 + T / 2, -0.05), M_FLOOR)
back = box('BackWall', (W + T, T, H), (W / 2 - T / 2, D + T / 2, H / 2), M_WALL)
left = box('LeftWall', (T, D, H), (-T / 2, D / 2, H / 2), M_WALL)
# window cut in the back wall (Boolean), then frame + mullions
cut = box('Cut', (1.5, 0.6, 1.3), (2.75, D + T / 2, 1.65), M_WALL)
mod = back.modifiers.new('win', 'BOOLEAN'); mod.object = cut; mod.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = back; bpy.ops.object.modifier_apply(modifier='win')
bpy.data.objects.remove(cut)
for name, s, l in [('SillTop', (1.62, 0.2, 0.05), (2.75, D + 0.02, 1.0)),
                   ('FrameL', (0.06, T, 1.3), (2.0, D + T / 2, 1.65)), ('FrameR', (0.06, T, 1.3), (3.5, D + T / 2, 1.65)),
                   ('FrameT', (1.5, T, 0.06), (2.75, D + T / 2, 2.3)), ('Mullion', (0.035, 0.05, 1.3), (2.75, D + T / 2, 1.65)),
                   ('Transom', (1.5, 0.05, 0.035), (2.75, D + T / 2, 1.95))]:
    box(name, s, l, M_FRAME)
box('BaseBack', (W, 0.02, 0.1), (W / 2, D - 0.01, 0.05), M_TRIM)
box('BaseLeft', (0.02, D, 0.1), (0.01, D / 2, 0.05), M_TRIM)

# ---------- props from Poly Haven (CC0) ----------
def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), \
           Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))

def place(slug, loc, rot_z=0.0, scale=1.0):
    path = os.path.join(ROOT, f'assets/source/ph-{slug}/{slug}_1k.gltf')
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    for r in roots:  # keep the asset's own root transform (units), then place it
        r.location = loc; r.rotation_euler.z += math.radians(rot_z); r.scale = tuple(v * scale for v in r.scale)
    bpy.context.view_layer.update()
    lo, hi = world_bbox(new)
    print(f'[prop] {slug}: size {tuple(round(v, 2) for v in (hi - lo))} m', flush=True)
    return new

desk = place('metal_office_desk', (1.55, D - 0.45, 0), 180)
bpy.context.view_layer.update()
dmin, dmax = world_bbox(desk); desk_top = dmax.z
place('modern_arm_chair_01', (1.45, D - 1.35, 0), -15)
place('desk_lamp_arm_01', (0.85, D - 0.3, desk_top), 200)
place('industrial_microscope', (2.15, D - 0.35, desk_top), 160)
place('retro_multimeter', (1.95, D - 0.75, desk_top), 190)
place('steel_frame_shelves_01', (0.3, 1.7, 0), 90, scale=1.9 / 21.41)  # asset ships ~11x oversized
place('potted_plant_01', (0.45, 0.5, 0), 0)

# ---------- monitor with a decorative ECG trace from canonical data ----------
arch = json.load(open(os.path.join(ROOT, 'prototype/v2/public/archive.json')))
sc = next(s for s in arch['scenes'] if s['axis'] == 'd1' and s['cond'] == 'mixed' and s['snr'] == 10)
import base64
raw = np.frombuffer(base64.b64decode(sc['traces']['M08']), dtype='<i2').astype(np.float32) * sc['scale']
iw, ih = 512, 288
img = np.zeros((ih, iw, 4), np.float32); img[..., :3] = (0.02, 0.07, 0.09); img[..., 3] = 1
for gx in range(0, iw, 32): img[:, gx, :3] = (0.05, 0.14, 0.16)
for gy in range(0, ih, 32): img[gy, :, :3] = (0.05, 0.14, 0.16)
seg = raw[:1250]; ys = (0.5 - seg / 4.0) * ih  # ±2 mV full height, 5 s on screen
xs = np.linspace(8, iw - 8, len(seg))
for i in range(len(seg) - 1):
    for t in np.linspace(0, 1, 6):
        x = int(xs[i] + (xs[i + 1] - xs[i]) * t); y = int(ys[i] + (ys[i + 1] - ys[i]) * t)
        img[max(0, y - 1):y + 2, max(0, x - 1):x + 2, :3] = (0.40, 0.91, 0.76)
screen_img = bpy.data.images.new('ecg_screen', iw, ih, alpha=False)
screen_img.pixels.foreach_set(np.flipud(img).ravel())
screen_img.filepath_raw = os.path.join(OUT, 'ecg_screen.png'); screen_img.file_format = 'PNG'; screen_img.save()
M_SCREEN = bpy.data.materials.new('Screen'); M_SCREEN.use_nodes = True
nt = M_SCREEN.node_tree; b = nt.nodes['Principled BSDF']
tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = screen_img
nt.links.new(tex.outputs['Color'], b.inputs['Base Color']); nt.links.new(tex.outputs['Color'], b.inputs['Emission Color'])
b.inputs['Emission Strength'].default_value = 1.2; b.inputs['Roughness'].default_value = 0.25
mx = 1.35
box('MonitorStand', (0.06, 0.06, 0.28), (mx, D - 0.28, desk_top + 0.14), M_DARK)
box('MonitorFoot', (0.26, 0.18, 0.02), (mx, D - 0.28, desk_top + 0.01), M_DARK)
mon = box('Monitor', (0.72, 0.04, 0.42), (mx, D - 0.3, desk_top + 0.47), M_DARK)
bpy.ops.mesh.primitive_plane_add(size=1, location=(mx, D - 0.323, desk_top + 0.47), rotation=(math.radians(90), 0, 0))
scr = bpy.context.active_object; scr.name = 'MonitorScreen'; scr.scale = (0.68, 0.38, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True); scr.data.materials.append(M_SCREEN)

# ---------- camera: orthographic isometric-ish ----------
target = Vector((1.9, 2.2, 1.05))
cam_dir = Vector((1.0, -1.0, 0.82)).normalized()
bpy.ops.object.camera_add(location=target + cam_dir * 14)
cam = bpy.context.active_object; cam.name = 'camera'
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 6.4
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

# ---------- world + sun ----------
world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.62, 0.72, 0.86, 1); bg.inputs['Strength'].default_value = 0.35
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
sun = bpy.context.active_object; sun.name = 'Sun'
sun.data.energy = 4.2; sun.data.angle = math.radians(2.5); sun.data.color = (1.0, 0.93, 0.82)

def set_sun(az_deg, el_deg):
    # az: 0 = light travelling towards +y (sun in front of the camera side), measured CCW from +x
    az, el = math.radians(az_deg), math.radians(el_deg)
    d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))  # towards the sun
    sun.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    return [d.x, d.y, d.z]

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True

if args.preview:
    set_sun(60, args.elevation)
    scene.render.resolution_x, scene.render.resolution_y = 1280, 800
    scene.cycles.samples = 48
    scene.render.filepath = os.path.join(OUT, 'preview.png')
    t0 = time.time(); bpy.ops.render.render(write_still=True)
    print('preview', round(time.time() - t0, 1), 's'); sys.exit(0)

# ---------- two lightmap atlases: room shell (large flat surfaces) and props (dense detail) ----------
SHELL_PREFIX = ('Floor', 'BackWall', 'LeftWall', 'Sill', 'Frame', 'Mullion', 'Transom', 'Base', 'Monitor')
meshes = [o for o in scene.objects if o.type == 'MESH']
for o in meshes:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    if not o.data.uv_layers:
        o.data.uv_layers.new(name='UVMap')
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
    else:
        o.data.uv_layers[0].name = 'UVMap'
    while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[-1])

def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lm = o.data.uv_layers.new(name='Lightmap'); o.data.uv_layers.active = lm
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(rotate=True, margin=0.002)
    bpy.ops.object.mode_set(mode='OBJECT')
    # UV coverage check: fraction of the unit square covered by lightmap triangles (area sum)
    uv = o.data.uv_layers['Lightmap'].data; area = 0.0
    for poly in o.data.polygons:
        pts = [uv[i].uv for i in poly.loop_indices]
        area += 0.5 * abs(sum(pts[k].x * pts[(k + 1) % len(pts)].y - pts[(k + 1) % len(pts)].x * pts[k].y for k in range(len(pts))))
    print(f'[uv] {name}: faces {len(o.data.polygons)}, lightmap coverage {area:.2f}', flush=True)
    return o, area

shell_objs = [o for o in meshes if o.name.startswith(SHELL_PREFIX)]
prop_objs = [o for o in meshes if o not in shell_objs]
groups = {}
for gname, objs in (('shell', shell_objs), ('props', prop_objs)):
    o, cov = join('Lab_' + gname, objs); groups[gname] = {'obj': o, 'uv_coverage': round(cov, 3)}

bake = scene.render.bake; bake.margin = 6; bake.use_clear = True
manifest = {'lm_scale': 4.0, 'encoding': 'png sqrt(linear / lm_scale)', 'stats': {}, 'size': args.size, 'samples': args.samples,
            'elevation': args.elevation, 'azimuths': [], 'groups': {}, 'timing_s': {}}
LM_SCALE = manifest['lm_scale']

def bake_group(gname, kind, img_name, encode, passes=('DIRECT', 'INDIRECT')):
    g = groups[gname]; o = g['obj']
    img = bpy.data.images.new(img_name, args.size, args.size, alpha=False, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    for m in o.data.materials:
        nt = m.node_tree
        for n in [n for n in nt.nodes if n.name in ('BakeTarget', 'BakeUV')]: nt.nodes.remove(n)
        n = nt.nodes.new('ShaderNodeTexImage'); n.name = 'BakeTarget'; n.image = img
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'BakeUV'; uvn.uv_map = 'Lightmap'; nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        nt.nodes.active = n
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    t0 = time.time()
    if kind == 'AO': bpy.ops.object.bake(type='AO')
    else: bpy.ops.object.bake(type='DIFFUSE', pass_filter=set(passes))
    px = np.empty(args.size * args.size * 4, np.float32); img.pixels.foreach_get(px)
    rgb = px.reshape(-1, 4)[:, :3]; used = rgb.max(axis=1) > 0
    stats = {'p50_used': float(np.percentile(rgb[used], 50)) if used.any() else 0.0, 'p99_used': float(np.percentile(rgb[used], 99)) if used.any() else 0.0, 'max': float(rgb.max()), 'used_texels': float(used.mean())}
    rgb = np.sqrt(np.clip(rgb / LM_SCALE, 0, 1)) if encode else np.clip(rgb, 0, 1)
    out = bpy.data.images.new(img_name + '_out', args.size, args.size, alpha=False); out.colorspace_settings.name = 'Non-Color'
    out.pixels.foreach_set(np.concatenate([rgb, np.ones((rgb.shape[0], 1), np.float32)], axis=1).ravel())
    out.filepath_raw = os.path.join(OUT, img_name); out.file_format = 'PNG'; out.save()
    bpy.data.images.remove(out); bpy.data.images.remove(img)
    manifest['stats'][img_name] = stats; manifest['timing_s'][img_name] = round(time.time() - t0, 1)
    print('baked', img_name, manifest['timing_s'][img_name], 's', stats, flush=True)

for gname in groups:
    bake_group(gname, 'AO', f'ao_{gname}.png', encode=False)
    manifest['groups'][gname] = {'object': groups[gname]['obj'].name, 'uv_coverage': groups[gname]['uv_coverage'],
                                 'materials': [m.name for m in groups[gname]['obj'].data.materials]}
for i in range(args.azimuths):
    az = 360.0 * i / args.azimuths
    d = set_sun(az, args.elevation)
    entry = {'index': i, 'azimuth_deg': az, 'sun_dir': d}
    if 'full' in args.passes:
        for gname in groups: bake_group(gname, 'DIFFUSE', f'light_{gname}_{i:02d}.png', encode=True)
        entry['files'] = {g: f'light_{g}_{i:02d}.png' for g in groups}
    if 'indirect' in args.passes:
        for gname in groups: bake_group(gname, 'DIFFUSE', f'indirect_{gname}_{i:02d}.png', encode=True, passes=('INDIRECT',))
        entry['indirect_files'] = {g: f'indirect_{g}_{i:02d}.png' for g in groups}
    manifest['azimuths'].append(entry)

# ---------- export ----------
for g in groups.values():
    for m in g['obj'].data.materials:
        nt = m.node_tree
        for n in [n for n in nt.nodes if n.name in ('BakeTarget', 'BakeUV')]: nt.nodes.remove(n)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'lab_corner.glb'), export_format='GLB', use_selection=False,
                          export_cameras=True, export_lights=False, export_texcoords=True, export_normals=True,
                          export_image_format='AUTO')  # WEBP conversion dropped a 16-bit roughness map (2026-09-25)
manifest['sun'] = {'energy': sun.data.energy, 'angle_deg': 2.5, 'color': list(sun.data.color)}
manifest['world'] = {'color': [0.62, 0.72, 0.86], 'strength': 0.35}
manifest['camera'] = {'type': 'ORTHO', 'ortho_scale': cam.data.ortho_scale, 'dir': list(cam_dir), 'target': list(target)}
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=2)
print('done', OUT)
