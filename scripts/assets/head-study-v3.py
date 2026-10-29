"""Head shape study (user 2026-10-04: the egg head feels alien; option B "subtle planes" from A's own head).
Renders front / 3-4 / side clay for each variant of head-vol-v3.mannequin (r_open, sigma_face, ears) plus A's original.
Run: python scripts/assets/head-study-v3.py OUT_DIR"""
import importlib.util, math, os, sys, pickle
import numpy as np, bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
HERE = os.path.dirname(os.path.abspath(__file__))
def load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
bif = load('bif', 'build-intro-figure.py'); hv = load('hv', 'head-vol-v3.py')
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True)
VARIANTS = {'B1': dict(r_open=3, sigma_face=1.6), 'B2': dict(r_open=3, sigma_face=2.5), 'B3': dict(r_open=4, sigma_face=3.5),
            'B2ear': dict(r_open=3, sigma_face=2.5, keep_ears=.35)}

def base():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(bif.SRC, 'blender-human-base-meshes', 'human_base_meshes_bundle.blend'))
    o = bpy.data.objects['GEO-body_male_realistic']; eyes = [bpy.data.objects[f'GEO-body_male_realistic.eye.{s}'] for s in 'LR']
    for x in list(bpy.data.objects):
        if x is not o and x not in eyes: bpy.data.objects.remove(x, do_unlink=True)
    off = o.location.copy()
    for x in [o] + eyes: x.location = x.location - off
    bif.apply_mod(o, o.modifiers['Multires'])
    for m in list(o.modifiers): bif.apply_mod(o, m)
    if o.data.shape_keys: o.shape_key_clear()
    return o, eyes

def head_grid(o, eyes):
    cache = os.path.join(OUT, 'sdf.npz')
    if os.path.exists(cache):
        z = np.load(cache); return z['D'], (z['x'], z['y'], z['z'])
    dg = bpy.context.evaluated_depsgraph_get()
    D, ax = hv.sdf_grid([BVHTree.FromObject(x, dg) for x in [o] + eyes]); np.savez(cache, D=D, x=ax[0], y=ax[1], z=ax[2]); return D, ax

def scene_and_render(objs, tag):
    sc = bpy.context.scene
    cl = bpy.data.materials.new('clay'); cl.use_nodes = True; cl.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.62, .6, .57, 1)
    for x in objs: x.data.materials.clear(); x.data.materials.append(cl); bpy.context.view_layer.objects.active = x; bpy.ops.object.shade_smooth()
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.42, .47, .56, 1)
    L = bpy.data.lights.new('s', 'SUN'); L.energy = 4; lo = bpy.data.objects.new('s', L); lo.rotation_euler = (math.radians(55), 0, math.radians(-30)); sc.collection.objects.link(lo)
    cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'
    sc.render.resolution_x = sc.render.resolution_y = 420
    H = Vector((0, -.03, 1.64))
    for vname, off in (('front', Vector((0, -1.3, .02))), ('34', Vector((.85, -1.0, .06))), ('side', Vector((1.3, -.02, .02)))):
        co.location = H + off; co.rotation_euler = (H - co.location).to_track_quat('-Z', 'Y').to_euler(); cam.lens = 85
        sc.render.filepath = os.path.join(OUT, f'head_{tag}_{vname}.png'); bpy.ops.render.render(write_still=True)

o, eyes = base(); D, ax = head_grid(o, eyes)
for tag, kw in VARIANTS.items():
    o, eyes = base()
    for e in eyes: bpy.data.objects.remove(e, do_unlink=True)
    v, f = hv.mannequin(D, ax, **kw)
    me = bpy.data.meshes.new('head'); me.from_pydata([tuple(p) for p in v], [], [tuple(t) for t in f]); me.update()
    h = bpy.data.objects.new('head', me); bpy.context.scene.collection.objects.link(h)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[x for x in bm.verts if x.co.z > hv.CUT_Z], context='VERTS'); bm.to_mesh(o.data); bm.free()
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); h.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.join()
    r = o.modifiers.new('vox', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .0032; bif.apply_mod(o, r)
    scene_and_render([o], tag)
