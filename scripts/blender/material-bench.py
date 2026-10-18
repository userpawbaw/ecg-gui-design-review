"""D-142 isolated material fixture. Never loads or modifies the archive/Story scene.

Run with the repository Python wrapper and a bpy 4.5.3 environment.
--fetch verifies pinned downloads and restores missing originals; --render needs bpy;
--report measures input maps and writes contact sheets from this run's PNG files.
All paths are relative to the repository. No commercial assets or reference-site files.
"""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'verification/r1-archive-material-review-20261018'
SOURCE = ROOT / 'assets/source/material-review'
VARIANTS = [
    ('ph_ash', 'wood', 'ash_veneer', 1.0),
    ('ph_ash_flat15', 'wood', 'ash_veneer', .15),
    ('acg_wood095', 'wood', 'Wood095', 1.0),
    ('cgb_wood05', 'wood', 'Wood05', 1.0),
    ('own_wood', 'wood', None, 1.0),
    ('acg_wood051_negative', 'wood', 'Wood051', 1.0),
    ('ph_wall', 'wall', 'painted_plaster_wall', 1.0),
    ('ph_wall_flat15', 'wall', 'painted_plaster_wall', .15),
    ('acg_paint004', 'wall', 'Paint004', 1.0),
    ('own_paint', 'wall', None, 1.0),
    ('acg_plaster006_negative', 'wall', 'Plaster006', 1.0),
]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def verify(manifest):
    for asset in manifest['assets']:
        for name, info in asset['files'].items():
            path = ROOT / name
            if not path.exists() or digest(path) != info['sha256']:
                raise ValueError('Missing or changed pinned source: ' + name)


def fetch(manifest):
    for item in manifest['downloads']:
        path = ROOT / item['path']
        if not path.exists() or digest(path) != item['sha256']:
            request = urllib.request.Request(item['url'], headers={'User-Agent': 'ECGDesignReview/1.0'})
            with urllib.request.urlopen(request, timeout=120) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError('Download checksum mismatch: ' + item['asset'])
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        if path.suffix == '.zip':
            with zipfile.ZipFile(path) as archive:
                for name in archive.namelist():
                    # These pinned packs have flat filenames. Do not permit traversal.
                    if '/' not in name and '\\' not in name and name.lower().endswith('.png'):
                        (path.parent / name).write_bytes(archive.read(name))
    verify(manifest)


def maps(asset):
    if asset in ['ash_veneer', 'painted_plaster_wall']:
        suffixes = ['_diff_2k.png', '_nor_gl_2k.png', '_rough_2k.png']
    elif asset in ['Wood01', 'Wood05']:
        suffixes = ['_2K_BaseColor.png', '_2K_Normal.png', '_2K_Roughness.png']
    else:
        suffixes = ['_2K-PNG_Color.png', '_2K-PNG_NormalGL.png', '_2K-PNG_Roughness.png']
    return [SOURCE / asset / (asset + suffix) for suffix in suffixes]


def linear(hex_colour):
    rgb = [int(hex_colour[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb)


def render(output, only=None):
    import bpy
    from mathutils import Vector
    if bpy.app.version[:3] != (4, 5, 3):
        raise RuntimeError('This comparison is pinned to bpy 4.5.3')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 48
    scene.cycles.seed = 142
    scene.cycles.use_denoising = True
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.render.resolution_x = scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = 0
    scene.world = bpy.data.worlds.new('neutral-world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.2, .2, .2, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35

    def neutral(name, colour, rough=.75):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        b = m.node_tree.nodes.get('Principled BSDF')
        b.inputs['Base Color'].default_value = (*linear(colour), 1)
        b.inputs['Roughness'].default_value = rough
        return m

    fixture = []

    def box(name, loc, size, material, sample=False):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        ob = bpy.context.object
        ob.name = name
        ob.dimensions = size
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        # Dominant-face planar UV: 1 repeat/metre; same physical scale on every variant.
        uv = ob.data.uv_layers.active
        for poly in ob.data.polygons:
            axis = max(range(3), key=lambda k: abs(poly.normal[k]))
            axes = (0, 2) if axis == 1 else ((0, 1) if axis == 2 else (1, 2))
            for li in poly.loop_indices:
                co = ob.data.vertices[ob.data.loops[li].vertex_index].co + ob.location
                uv.data[li].uv = (co[axes[0]], co[axes[1]])
        bevel = ob.modifiers.new('3mm-bevel', 'BEVEL')
        bevel.width = .003
        bevel.segments = 3
        ob.data.materials.append(material)
        if sample:
            fixture.append(ob)
        return ob

    ground = neutral('ground', '777777')
    placeholder = neutral('sample', 'dccbb0')
    box('floor', (0, 0, -.05), (200, 200, .1), ground)
    box('panel', (0, 0, .65), (1.15, .08, 1.2), placeholder, True)
    box('ledge', (0, -.19, .36), (1.15, .4, .055), placeholder, True)
    box('left-return', (-.54, -.16, .65), (.055, .35, 1.2), placeholder, True)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=.17, location=(.25, -.25, .56))
    sphere = bpy.context.object
    sphere.name = 'sphere'
    sphere.data.materials.append(placeholder)
    for poly in sphere.data.polygons:
        poly.use_smooth = True
    fixture.append(sphere)

    def point_at(ob, target):
        ob.rotation_euler = (Vector(target) - ob.location).to_track_quat('-Z', 'Y').to_euler()

    light = bpy.data.lights.new('softbox', 'AREA')
    light.energy = 350
    light.shape = 'DISK'
    light.size = .9
    ob = bpy.data.objects.new('softbox', light)
    scene.collection.objects.link(ob)
    ob.location = (-1.6, -2.5, 3)
    point_at(ob, (0, 0, .65))
    camera = bpy.data.objects.new('camera', bpy.data.cameras.new('camera'))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 1.7

    def material(name, group, asset, keep):
        colour = 'dccbb0' if group == 'wood' else 'e8dfcf'
        m = neutral(name, colour)
        nt = m.node_tree
        bs = nt.nodes.get('Principled BSDF')
        if not asset:
            if group == 'wood':
                tex = nt.nodes.new('ShaderNodeTexNoise')
                tex.inputs['Scale'].default_value = 2
                tex.inputs['Detail'].default_value = 2
                coord = nt.nodes.new('ShaderNodeTexCoord')
                mapping = nt.nodes.new('ShaderNodeVectorMath')
                mapping.operation = 'MULTIPLY'
                mapping.inputs[1].default_value = (2, 2, 130)
                nt.links.new(coord.outputs['Generated'], mapping.inputs[0])
                nt.links.new(mapping.outputs[0], tex.inputs['Vector'])
                ramp = nt.nodes.new('ShaderNodeValToRGB')
                for element, value in zip(ramp.color_ramp.elements, ['d5c3a7', 'dccbb0']):
                    element.color = (*linear(value), 1)
                nt.links.new(tex.outputs['Fac'], ramp.inputs[0])
                nt.links.new(ramp.outputs[0], bs.inputs['Base Color'])
            return m
        images = []
        for path, space in zip(maps(asset), ['sRGB', 'Non-Color', 'Non-Color']):
            tex = nt.nodes.new('ShaderNodeTexImage')
            tex.image = bpy.data.images.load(str(path), check_existing=True)
            tex.image.colorspace_settings.name = space
            images.append(tex)
        source = images[0].outputs['Color']
        if keep != 1:
            mix = nt.nodes.new('ShaderNodeMixRGB')
            mix.inputs[0].default_value = 1 - keep
            mix.inputs[2].default_value = (*linear(colour), 1)
            nt.links.new(source, mix.inputs[1])
            source = mix.outputs[0]
        nt.links.new(source, bs.inputs['Base Color'])
        normal = nt.nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = keep
        normal_source = images[1].outputs['Color']
        if asset in ['Wood01', 'Wood05']:
            # CGBookcase's official Blender guide specifies DirectX normal maps.
            # Flip G into Blender/OpenGL convention, leaving R and B unchanged.
            split = nt.nodes.new('ShaderNodeSeparateXYZ')
            combine = nt.nodes.new('ShaderNodeCombineXYZ')
            invert = nt.nodes.new('ShaderNodeMath')
            invert.operation = 'SUBTRACT'
            invert.inputs[0].default_value = 1
            nt.links.new(normal_source, split.inputs[0])
            nt.links.new(split.outputs['X'], combine.inputs['X'])
            nt.links.new(split.outputs['Y'], invert.inputs[1])
            nt.links.new(invert.outputs[0], combine.inputs['Y'])
            nt.links.new(split.outputs['Z'], combine.inputs['Z'])
            normal_source = combine.outputs[0]
        nt.links.new(normal_source, normal.inputs['Color'])
        nt.links.new(normal.outputs['Normal'], bs.inputs['Normal'])
        nt.links.new(images[2].outputs['Color'], bs.inputs['Roughness'])
        return m

    runs = []
    if only:
        existing = json.loads((output / 'run.json').read_text(encoding='utf-8'))
        for entry in existing['runs']:
            if entry['variant'] not in only:
                if digest(output / entry['file']) != entry['sha256']:
                    raise ValueError('Cannot resume a changed render')
                runs.append(entry)
    output.mkdir(parents=True, exist_ok=True)
    for name, group, asset, keep in VARIANTS:
        if only and name not in only:
            continue
        m = material(name, group, asset, keep)
        for ob in fixture:
            ob.data.materials[0] = m
        for view, location in [('front', (0, -3, 1.1)), ('oblique', (1.75, -2.8, 1.7))]:
            camera.location = location
            point_at(camera, (0, 0, .65))
            dest = output / (name + '-' + view + '.png')
            scene.render.filepath = str(dest)
            bpy.ops.render.render(write_still=True)
            runs.append(dict(variant=name, view=view, file=dest.name, sha256=digest(dest)))
            print('BENCH_COMPLETE', name, view, flush=True)
    write_json(output / 'run.json', dict(bpy=bpy.app.version_string, samples=48, seed=142,
        resolution=[640, 640], threads=4, view='AgX / Medium High Contrast / exposure 0',
        uv='1 repeat/metre, dominant-face planar (sphere uses default sphere UV)',
        material='sRGB base; GL normal Non-Color strength 1 or .15; roughness Non-Color; no displacement/AO',
        normal_conventions='PH/ambientCG GL; CGBookcase DirectX converted by 1-G',
        runs=runs))


def report(output, manifest):
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter
    run = json.loads((output / 'run.json').read_text(encoding='utf-8'))
    if len(run['runs']) != len(VARIANTS) * 2:
        raise ValueError('Incomplete render run')
    metrics = []
    for a in manifest['assets']:
        source = maps(a['id'])[0]
        im = Image.open(source).convert('RGB')
        arr = np.asarray(im, dtype=np.float64)
        gray = np.asarray(im.convert('L'), dtype=np.float64)
        low = np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(32)), dtype=np.float64)
        row = dict(asset=a['id'],size=list(im.size),rgb_mean=arr.mean(axis=(0, 1)).tolist(),
            compression_reference='Pillow decoded RGB8; excludes source 16-to-8-bit quantization',
            gray_p95_p5=float(np.percentile(gray,95)-np.percentile(gray,5)),
            low_frequency_std=float(low.std()),compression=[],channels=[])
        for channel in maps(a['id']):
            with Image.open(channel) as image:
                row['channels'].append(dict(file=channel.name, size=list(image.size), mode=image.mode,
                                           png_bit_depth=channel.read_bytes()[24]))
        # Factor isolation: resize-only loss vs same-resolution lossy encode.
        for size, q in [(2048, None),(2048,75),(2048,90),(1024,None),(1024,75),(1024,90)]:
            scaled = im.resize((size,size),Image.Resampling.LANCZOS)
            memory=io.BytesIO()
            if q is None:scaled.save(memory,format='PNG')
            else:scaled.save(memory,format='WEBP',quality=q,method=6)
            decoded=Image.open(io.BytesIO(memory.getvalue())).convert('RGB')
            native=np.asarray(scaled,dtype=np.float64)-np.asarray(decoded,dtype=np.float64)
            enlarged=np.asarray(decoded.resize(im.size,Image.Resampling.LANCZOS),dtype=np.float64)
            mse=float(np.mean((arr-enlarged)**2));native_mse=float(np.mean(native**2))
            row['compression'].append(dict(size=size,quality=q or 'lossless PNG',bytes=len(memory.getvalue()),
                psnr_vs_2k_source_db=10*math.log10(255**2/mse) if mse else None,
                encoding_psnr_at_same_size_db=10*math.log10(255**2/native_mse) if native_mse else None))
        metrics.append(row)
    write_json(EVIDENCE/'map-metrics.json',metrics)
    render_metrics=[]
    for entry in run['runs']:
        path=output/entry['file']
        if digest(path)!=entry['sha256']:
            raise ValueError('Render hash changed')
        # Fixed front-panel patch, away from the sphere, ledge and left shadow.
        # High-pass luminance is descriptive grain, not an overall quality score.
        if entry['view']=='front':
            gray=Image.open(path).convert('L').crop((220,140,490,280))
            high=np.asarray(gray,dtype=float)-np.asarray(gray.filter(ImageFilter.GaussianBlur(4)),dtype=float)
            render_metrics.append(dict(variant=entry['variant'],roi_xyxy=[220,140,490,280],
                gray_mean=float(np.asarray(gray).mean()),highpass_std=float(high.std())))
    write_json(EVIDENCE/'render-metrics.json',render_metrics)
    write_json(EVIDENCE/'render-run.json',run)
    for group in ['wood','wall']:
        variants=[v for v in VARIANTS if v[1]==group]
        sheet=Image.new('RGB',(800,430*len(variants)),(245,245,245))
        draw=ImageDraw.Draw(sheet)
        for i,(name,_,_,_) in enumerate(variants):
            for j,view in enumerate(['front','oblique']):
                path=output/(name+'-'+view+'.png')
                entry=next(x for x in run['runs'] if x['file']==path.name)
                if digest(path)!=entry['sha256']:raise ValueError('Render hash changed')
                image=Image.open(path).convert('RGB')
                sheet.paste(image.resize((400,400),Image.Resampling.LANCZOS),(j*400,i*430+28))
                draw.text((j*400+7,i*430+8),name+' / '+view,fill=(0,0,0))
        sheet.save(EVIDENCE/(group+'-comparison.jpg'),quality=95,subsampling=0)
    # Raw albedo contact sheet: all native 2K originals, no colour edits.
    sheet=Image.new('RGB',(1000,560),'white');draw=ImageDraw.Draw(sheet)
    for i,a in enumerate(manifest['assets']):
        x=(i%4)*250;y=(i//4)*280
        sheet.paste(Image.open(maps(a['id'])[0]).convert('RGB').resize((250,250)),(x,y+25))
        draw.text((x+5,y+5),a['id'],fill='black')
    sheet.save(EVIDENCE/'source-albedos.jpg',quality=95,subsampling=0)
    sheet=Image.new('RGB',(800,860),'white');draw=ImageDraw.Draw(sheet)
    for i,name in enumerate(['ph_wall','own_paint','ph_ash','ph_ash_flat15']):
        x=(i%2)*400;y=(i//2)*430
        sheet.paste(Image.open(output/(name+'-front.png')).convert('RGB').resize((400,400)),(x,y+28))
        draw.text((x+7,y+8),name,fill='black')
    sheet.save(EVIDENCE/'selected-comparison.jpg',quality=95,subsampling=0)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch',action='store_true')
    parser.add_argument('--render',action='store_true')
    parser.add_argument('--report',action='store_true')
    parser.add_argument('--only',action='append',choices=[v[0] for v in VARIANTS],
                        help='Re-render selected variants, preserving hash-verified other frames')
    parser.add_argument('--output',type=Path,default=SOURCE/'renders')
    args=parser.parse_args()
    manifest=json.loads((EVIDENCE/'sources.json').read_text(encoding='utf-8'))
    if args.fetch:fetch(manifest)
    verify(manifest)
    if args.render:render(args.output,args.only)
    if args.report:report(args.output,manifest)
