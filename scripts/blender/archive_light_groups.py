"""Archive light-group render (2026-10-16 research, RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016 §3): open a .blend saved by
build_archive.py --save, put the spot key, the sun and the sky (world) into Cycles light groups, and render the a1 shot as a
multilayer EXR with one pass per group (Combined_key / Combined_sun / Combined_sky; the rest = Combined − the three).
Each pass holds that light's direct + indirect contribution, so the passes show where the light in the shade comes from and can be
re-weighted afterwards without a new render (scripts/assets/light-group-shares.py).

    python scripts/blender/build_archive.py --intro2 --nofig --art r6 --dress --palette pastel --look h5 --save OUT/r7.blend
    python scripts/blender/archive_light_groups.py -- OUT/r7.blend OUT/a1.exr 960x540 96
Env: SUN_MB = the sun's Cycles max_bounces (0 = direct light only: accents without bounce into the shade).
Linear, no view transform, no denoising (per-group passes are not denoised).
"""
import math, os, sys
import bpy
from mathutils import Vector

blend, out, res, spp = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = sc.view_layers[0]
for g in ('key', 'sun', 'sky'):
    vl.lightgroups.add(name=g)
bpy.data.objects['key'].lightgroup = 'key'
bpy.data.objects['sun'].lightgroup = 'sun'
sc.world.lightgroup = 'sky'
if os.environ.get('SUN_MB'):
    bpy.data.objects['sun'].data.cycles.max_bounces = int(os.environ['SUN_MB']); print('sun max_bounces', os.environ['SUN_MB'])
print('other lights:', [o.name for o in sc.objects if o.type == 'LIGHT' and o.name not in ('key', 'sun')])
rx, ry = map(int, res.split('x'))
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(spp); sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y = rx, ry
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 4; sc.cycles.volume_bounces = 0     # = build_archive.py r6 preview
loc, tgt, fov = (0.15, 0.95, 1.6), (0.75, 4.7, 2.75), 52                                     # a1_front (build_archive.py SHOTS)
cd = bpy.data.cameras.new('a1'); cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov)
c = bpy.data.objects.new('a1', cd); c.location = loc; sc.collection.objects.link(c)
c.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); sc.camera = c
vl.use_pass_combined = True; vl.use_pass_diffuse_color = True
sc.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'; sc.render.image_settings.color_depth = '32'
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('done', out)
