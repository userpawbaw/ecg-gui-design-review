"""Head shape study (user 2026-10-04: the egg head feels alien). Variants on the realistic base (candidate A):
  orig  — the bundle head as is, eyeballs included (the user's earlier objection 2026-10-01: eyes/mouth unpleasant)
  soft  — A's real skull silhouette kept; eyes, mouth, nostrils and ears smoothed away (Taubin smoothing weighted to the face)
  egg   — the current projection onto an egg
Run: python scripts/assets/head-study-v3.py OUT_DIR"""
import importlib.util, math, os, sys
import numpy as np, bpy
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bif', os.path.join(HERE, 'build-intro-figure.py'))
bif = importlib.util.module_from_spec(spec); spec.loader.exec_module(bif)
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True)

def edges_of(o): return np.array([e.vertices[:] for e in o.data.edges])

def soften_face(V, E, iters=260):
    """Laplacian smoothing with a weight that is 1 on the face front and the ears, 0 on the skull, neck and body."""
    ss = bif.ss
    head = ss(1.50, 1.56, V[:, 2])                                         # above the jaw/neck
    front = ss(-.02, -.07, V[:, 1])                                        # face side (front = −y)
    ears = ss(.060, .075, np.abs(V[:, 0])) * ss(1.56, 1.60, V[:, 2]) * ss(1.73, 1.69, V[:, 2])
    w = np.clip(head * np.maximum(front, ears * 1.0), 0, 1) ** .7
    n = len(V); deg = np.bincount(E.ravel(), minlength=n).astype(float)
    def lap(P):
        acc = np.zeros_like(P); np.add.at(acc, E[:, 0], P[E[:, 1]]); np.add.at(acc, E[:, 1], P[E[:, 0]])
        return acc / np.maximum(deg, 1)[:, None] - P
    P = V.copy()
    for _ in range(iters):
        P = P + (.5 * w)[:, None] * lap(P)                                  # plain Laplacian: fills sockets, flattens features
    return P

def make(variant):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(bif.SRC, 'blender-human-base-meshes', 'human_base_meshes_bundle.blend'))
    o = bpy.data.objects['GEO-body_male_realistic']
    keep = {o.name} | ({'GEO-body_male_realistic.eye.L', 'GEO-body_male_realistic.eye.R'} if variant == 'orig' else set())
    for x in list(bpy.data.objects):
        if x.name not in keep: bpy.data.objects.remove(x, do_unlink=True)
    off = o.location.copy(); o.location = (0, 0, 0)
    for x in bpy.data.objects:
        if x is not o: x.location = x.location - off
    bif.apply_mod(o, o.modifiers['Multires'])
    V = bif.verts(o)
    if variant == 'egg': V = bif.egg_head(V)
    if variant == 'soft': V = soften_face(V, edges_of(o))
    bif.set_verts(o, V)
    for x in bpy.data.objects:
        if x.type == 'MESH':
            bpy.context.view_layer.objects.active = x; bpy.ops.object.shade_smooth()
    return o

sc = None
for variant in (sys.argv[-2].split(',') if len(sys.argv) > 2 and ',' in sys.argv[-2] or sys.argv[-2] in ('orig', 'soft', 'egg') else ('orig', 'soft', 'egg')):
    o = make(variant); sc = bpy.context.scene
    cl = bpy.data.materials.new('clay'); cl.use_nodes = True; cl.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.62, .6, .57, 1)
    for x in bpy.data.objects:
        if x.type == 'MESH': x.data.materials.clear(); x.data.materials.append(cl)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.42, .47, .56, 1)
    L = bpy.data.lights.new('s', 'SUN'); L.energy = 4; lo = bpy.data.objects.new('s', L); lo.rotation_euler = (math.radians(55), 0, math.radians(-30)); sc.collection.objects.link(lo)
    cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'
    sc.render.resolution_x = sc.render.resolution_y = 500
    H = Vector((0, -.03, 1.64))
    for vname, off, lens in (('front', Vector((0, -1.3, .02)), 85), ('34', Vector((.85, -1.0, .06)), 85), ('side', Vector((1.3, -.02, .02)), 85),
                             ('body', Vector((1.4, -4.6, -.6)), 50)):
        tgt = H if vname != 'body' else Vector((0, 0, .95)); co.location = (H if vname != 'body' else tgt) + off
        co.rotation_euler = (tgt - co.location).to_track_quat('-Z', 'Y').to_euler(); cam.lens = lens
        sc.render.filepath = os.path.join(OUT, f'head_{variant}_{vname}.png'); bpy.ops.render.render(write_still=True)
