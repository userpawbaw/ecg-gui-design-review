"""Candidate human meshes side by side (clay + H5-like frosted look) for the D-048 mesh remake choice.
Run: python scripts/assets/figure-lineup.py OUT_DIR   (bpy 4.5)"""
import bpy, os, sys, math
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'assets', 'source')
OUT = sys.argv[-1]
QM = os.path.join(S, 'quaternius-ubc', 'Universal Base Characters[Standard]', 'Base Characters', 'Godot - UE')
CANDS = [  # (label, loader)
    ('A blender-realistic', ('blend', 'blender-human-base-meshes/human_base_meshes_bundle.blend', 'GEO-body_male_realistic')),
    ('B blender-stylized', ('blend', 'blender-human-base-meshes/human_base_meshes_bundle.blend', 'GEO-body_male_stylized')),
    ('C quaternius-superhero', ('gltf', os.path.join(QM, 'Superhero_Male_FullBody.gltf'), 'SuperHero_Male')),
    ('D mannequiny', ('gltf', os.path.join(S, 'oga-mannequiny', 'mannequiny-0.4.0.glb'), 'body.001')),
]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def load(kind, path, name):
    before = set(bpy.data.objects)
    if kind == 'blend':
        with bpy.data.libraries.load(os.path.join(S, path) if not os.path.isabs(path) else path) as (src, dst):
            dst.objects = [name]
        o = dst.objects[0]; scene.collection.objects.link(o)
    else:
        bpy.ops.import_scene.gltf(filepath=path)
        o = [x for x in bpy.data.objects if x not in before and x.name.startswith(name.split('.')[0])][0]
        for x in list(bpy.data.objects):
            if x not in before and x is not o: bpy.data.objects.remove(x, do_unlink=True)
    o.parent = None
    for m in list(o.modifiers):
        if m.type == 'ARMATURE': o.modifiers.remove(m)
    o.data = o.data.copy()
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy(); o.data.transform(mw); o.matrix_world.identity()
    zs = [v.co.z for v in o.data.vertices]; h = max(zs) - min(zs)
    s = 1.75 / h; o.data.transform(__import__('mathutils').Matrix.Scale(s, 4))
    xs = [v.co.x for v in o.data.vertices]; ys = [v.co.y for v in o.data.vertices]; zs = [v.co.z for v in o.data.vertices]
    o.data.transform(__import__('mathutils').Matrix.Translation((-(max(xs)+min(xs))/2, -(max(ys)+min(ys))/2, -min(zs))))
    for p in o.data.polygons: p.use_smooth = True
    return o

def clay():
    m = bpy.data.materials.new('clay'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (.62, .6, .57, 1); b.inputs['Roughness'].default_value = .55
    return m

def frosted():
    """H5 stand-in: frosted glass + faint emissive world-height bands (stills only)."""
    m = bpy.data.materials.new('h5'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sx.inputs[0])
    mu = nt.nodes.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = 60; nt.links.new(sx.outputs['Z'], mu.inputs[0])
    pp = nt.nodes.new('ShaderNodeMath'); pp.operation = 'PINGPONG'; pp.inputs[1].default_value = .5; nt.links.new(mu.outputs[0], pp.inputs[0])
    lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .07; nt.links.new(pp.outputs[0], lt.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1, .9, .78, 1); nt.links.new(lt.outputs[0], em.inputs['Strength'])
    gl = nt.nodes.new('ShaderNodeBsdfPrincipled'); gl.inputs['Base Color'].default_value = (.92, .94, .97, 1)
    gl.inputs['Transmission Weight'].default_value = 1; gl.inputs['Roughness'].default_value = .42; gl.inputs['IOR'].default_value = 1.25
    ad = nt.nodes.new('ShaderNodeAddShader'); nt.links.new(gl.outputs[0], ad.inputs[0]); nt.links.new(em.outputs[0], ad.inputs[1]); nt.links.new(ad.outputs[0], out.inputs['Surface'])
    return m

objs = []
for i, (lab, (k, p, n)) in enumerate(CANDS):
    o = load(k, p, n); o.location.x = (i - 1.5) * 1.15; objs.append(o)
    print(lab, len(o.data.vertices))
fl = bpy.data.meshes.new('floor'); fl.from_pydata([(-20, -20, 0), (20, -20, 0), (20, 20, 0), (-20, 20, 0)], [], [(0, 1, 2, 3)])
fo = bpy.data.objects.new('floor', fl); scene.collection.objects.link(fo)
fm = bpy.data.materials.new('fl'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.08, .07, .065, 1); fl.materials.append(fm)
w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.35, .4, .5, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
for e, rot, col in [(4.5, (math.radians(50), 0, math.radians(-35)), (1, .86, .7)), (1.2, (math.radians(70), 0, math.radians(140)), (.6, .7, 1))]:
    L = bpy.data.lights.new('s', 'SUN'); L.energy = e; L.color = col; L.angle = math.radians(4)
    lo = bpy.data.objects.new('s', L); lo.rotation_euler = rot; scene.collection.objects.link(lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); scene.collection.objects.link(co); scene.camera = co
scene.render.engine = 'CYCLES'; scene.cycles.samples = 48; scene.cycles.use_denoising = True; scene.view_settings.view_transform = 'AgX'

def shoot(name, loc, tgt, lens, res):
    co.location = loc; co.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cam.lens = lens
    scene.render.resolution_x, scene.render.resolution_y = res; scene.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True)

for look, mf in (('clay', clay), ('h5', frosted)):
    m = mf()
    for o in objs: o.data.materials.clear(); o.data.materials.append(m)
    shoot(f'lineup_{look}.png', (1.2, -6.0, 1.2), (0, 0, .9), 40, (1800, 800))
