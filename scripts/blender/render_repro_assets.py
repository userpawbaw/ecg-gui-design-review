"""Render the image assets for the REF-003 repro spike (headless Blender via the `bpy` wheel).

    python3 scripts/blender/render_repro_assets.py hero   --out <dir> [--frames 240 --res 1920x1080 --samples 4]
    python3 scripts/blender/render_repro_assets.py clouds --out <dir> [--res 1920x1080 --samples 48]

hero:   Poly Haven horn-koppe_snow (CC0, tonemapped JPG) as the world; a perspective camera slowly pans across
        the snow field → PNG frames (encode to mp4/webm with ffmpeg). Stands in for the reference's hero video.
clouds: volumetric cloud banks (Principled Volume + noise density, height falloff) rendered with a transparent
        film → RGBA PNGs `cloud_front.png` / `cloud_back.png` (bottom dense, top wispy) for the two overlay layers.
"""
import argparse, math, os, sys, time
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('mode', choices=['hero', 'clouds'])
ap.add_argument('--out', required=True)
ap.add_argument('--res', default='1920x1080')
ap.add_argument('--samples', type=int, default=0)
ap.add_argument('--frames', type=int, default=240)
ap.add_argument('--fps', type=int, default=24)
ap.add_argument('--only', default='', help='clouds: front|back')
ap.add_argument('--test', action='store_true', help='single low-cost frame')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
OUT = os.path.abspath(args.out); os.makedirs(OUT, exist_ok=True)
W, H = map(int, args.res.split('x'))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.view_settings.view_transform = 'Standard'
world = bpy.data.worlds.new('W'); sc.world = world; world.use_nodes = True
nt = world.node_tree; bg = nt.nodes['Background']

def camera(loc, rot_deg, lens=None, fov_deg=None):
    bpy.ops.object.camera_add(location=loc, rotation=[math.radians(a) for a in rot_deg])
    cam = bpy.context.active_object; sc.camera = cam
    if fov_deg: cam.data.lens_unit = 'FOV'; cam.data.angle = math.radians(fov_deg)
    if lens: cam.data.lens = lens
    return cam

if args.mode == 'hero':
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(ROOT, 'assets/source/ph-horn-koppe_snow-tonemapped/horn-koppe_snow.jpg'))
    env.image.colorspace_settings.name = 'sRGB'
    nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0
    sc.cycles.samples = args.samples or 4; sc.cycles.use_denoising = False
    sc.render.filter_size = 1.2
    # sun in the panorama: u 0.598 (lon +35°), elevation 29° (measured). Blender world: u 0.5 looks along −X?
    cam = camera((0, 0, 0), (90 + 7, 0, 0), fov_deg=84)
    yaw0, yaw1 = float(os.environ.get('YAW0', '-8')), float(os.environ.get('YAW1', '4'))
    n = 1 if args.test else args.frames
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
    t0 = time.time()
    for f in range(n):
        t = f / max(1, n - 1); e = t * t * (3 - 2 * t) * 0.35 + t * 0.65     # mostly linear, soft ends
        cam.rotation_euler.z = math.radians(float(os.environ.get('YAWBASE', '0')) + yaw0 + (yaw1 - yaw0) * e)
        sc.render.filepath = os.path.join(OUT, f'hero_{f:04d}.png'); bpy.ops.render.render(write_still=True)
    print('hero frames', n, round(time.time() - t0, 1), 's', flush=True)

else:
    # soft white-blue sky light + low warm sun, transparent film
    bg.inputs['Color'].default_value = (0.78, 0.84, 0.95, 1); bg.inputs['Strength'].default_value = 1.2
    bpy.ops.object.light_add(type='SUN'); sun = bpy.context.active_object
    sun.data.energy = 4.0; sun.data.angle = math.radians(10); sun.data.color = (1.0, 0.97, 0.92)
    sun.rotation_euler = (math.radians(58), 0, math.radians(18))   # from behind/above the camera → lit faces toward us
    sc.render.film_transparent = True
    sc.cycles.samples = args.samples or 48; sc.cycles.use_denoising = True
    sc.cycles.volume_step_rate = 2.0; sc.cycles.volume_max_steps = 256
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    cam = camera((0, -30, 0), (90, 0, 0), fov_deg=50)     # looking along +y at a wall of cloud
    half_w = math.tan(math.radians(25)) * 30 * 1.15          # frame half-width at the cloud plane (+15 %)

    def cloud(name, seed, top, density, scale, detail_scale, puff):
        # box spanning the frame; density = noise × height falloff (dense bottom → 0 at `top`)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -8 + (top + 8) / 2))
        o = bpy.context.active_object; o.name = name
        o.scale = (half_w * 2.4, 10, top + 8); bpy.ops.object.transform_apply(scale=True)
        m = bpy.data.materials.new(name); m.use_nodes = True; t = m.node_tree
        for nd in list(t.nodes): t.nodes.remove(nd)
        out = t.nodes.new('ShaderNodeOutputMaterial'); vol = t.nodes.new('ShaderNodeVolumePrincipled')
        vol.inputs['Color'].default_value = (1, 1, 1, 1); vol.inputs['Anisotropy'].default_value = 0.2
        vol.inputs['Emission Strength'].default_value = 0.32; vol.inputs['Emission Color'].default_value = (0.9, 0.93, 1.0, 1)   # lifts the shadowed core
        tc = t.nodes.new('ShaderNodeTexCoord'); sep = t.nodes.new('ShaderNodeSeparateXYZ')
        n1 = t.nodes.new('ShaderNodeTexNoise'); n1.noise_dimensions = '4D'
        n1.inputs['Scale'].default_value = scale; n1.inputs['Detail'].default_value = 3; n1.inputs['Roughness'].default_value = 0.45
        n1.inputs['W'].default_value = seed
        n2 = t.nodes.new('ShaderNodeTexNoise'); n2.noise_dimensions = '4D'
        n2.inputs['Scale'].default_value = detail_scale; n2.inputs['Detail'].default_value = 4; n2.inputs['W'].default_value = seed * 3.1
        t.links.new(tc.outputs['Object'], n1.inputs['Vector']); t.links.new(tc.outputs['Object'], n2.inputs['Vector'])
        t.links.new(tc.outputs['Object'], sep.inputs['Vector'])
        # height falloff: 1 at the bottom of the box → 0 at the top, shaped by the noise so the top edge billows
        h = t.nodes.new('ShaderNodeMapRange'); h.inputs['From Min'].default_value = top; h.inputs['From Max'].default_value = -8
        t.links.new(sep.outputs['Z'], h.inputs['Value'])
        mix = t.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'   # noise*puff + falloff
        t.links.new(n1.outputs['Fac'], mix.inputs[0]); mix.inputs[1].default_value = puff; t.links.new(h.outputs['Result'], mix.inputs[2])
        det = t.nodes.new('ShaderNodeMath'); det.operation = 'MULTIPLY_ADD'
        t.links.new(n2.outputs['Fac'], det.inputs[0]); det.inputs[1].default_value = 0.18; t.links.new(mix.outputs[0], det.inputs[2])
        thr = t.nodes.new('ShaderNodeMapRange'); thr.inputs['From Min'].default_value = 0.72 + puff * 0.35; thr.inputs['From Max'].default_value = 1.05 + puff * 0.35
        thr.inputs['To Max'].default_value = density
        t.links.new(det.outputs[0], thr.inputs['Value']); t.links.new(thr.outputs['Result'], vol.inputs['Density'])
        t.links.new(vol.outputs['Volume'], out.inputs['Volume'])
        o.data.materials.append(m)
        return o

    specs = {'front': dict(seed=1.7, top=3.0, density=2.2, scale=0.13, detail_scale=0.6, puff=1.5),
             'back': dict(seed=4.2, top=7.0, density=1.6, scale=0.09, detail_scale=0.45, puff=1.6)}
    for name, sp in specs.items():
        if args.only and args.only != name: continue
        for o in [o for o in sc.objects if o.name.startswith('cloud_')]: bpy.data.objects.remove(o)
        cloud('cloud_' + name, **sp)
        sc.render.filepath = os.path.join(OUT, f'cloud_{name}.png')
        if args.test: sc.render.resolution_percentage = 25; sc.cycles.samples = 16
        t0 = time.time(); bpy.ops.render.render(write_still=True)
        print('cloud', name, round(time.time() - t0, 1), 's', flush=True)
