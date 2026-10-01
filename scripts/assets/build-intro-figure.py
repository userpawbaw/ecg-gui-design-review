"""Build the R1 intro figure (PLAN-R1-INTRO-STORY-V2 P1, D-045) into prototype/v2/src/story/intro/assets/.

Replaces the MakeHuman body and the metaball heart of build-intro.py (O-007: the human had to be rebuilt, not reshaded).

Inputs (assets/registry.json, sha256-pinned; originals under assets/source/, not committed):
  blender-human-base-meshes  Blender Studio "Human Base Meshes" bundle v1.0.0 (CC0) — GEO-body_male_realistic
  hra-heart-male             HuBMAP HRA reference organ "heart, male" v1.3 (CC BY 4.0, Visible Human Male data, NLM)
Outputs:
  body.glb     featureless mannequin: eyes removed, face/ears projected onto a smooth egg head, voxel-remeshed,
               arms relaxed, decimated; shape key "breath" (chest/abdomen) for the Story; metres, feet at y = 0
  heart.glb    anatomical outer shell (atria + ventricles + septum unioned) + short aorta/pulmonary trunk stubs,
               slightly enlarged for legibility; origin at the heart centre, already in body orientation
  figure.json  front silhouette polyline (rim → body morph), heart position, height (merged into the existing file)

Run: python scripts/assets/build-intro-figure.py [--preview DIR]   (bpy 4.5, numpy, opencv)
"""
import json, math, os, sys
import numpy as np
import bpy, mathutils

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'assets', 'source')
OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets')
sys.path.insert(0, os.path.dirname(__file__))
TARGET_H = 1.666          # same standing height as before, so the intro camera framing is unchanged
HEART_SCALE = 1.25        # deformé: reads at full-body distance (anatomical shape kept)


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def verts(o):
    return np.array([v.co[:] for v in o.data.vertices])


def set_verts(o, V):
    o.data.vertices.foreach_set('co', V.astype(np.float32).ravel())
    o.data.update()


def apply_mod(o, m):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


def egg_head(V):
    """Mannequin head: everything above the jaw-line plane is projected onto a smooth egg fitted to the skull
    (no eyes, mouth, nose or ears — user 2026-10-01). Blender coordinates: front = −y, up = z, metres (1.8 m body)."""
    C = np.array([0, -.035, 1.682]); A, BF, BB, CT, CB = .082, .094, .088, .112, .122
    d = V - C
    u = d / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-9)
    low = ss(0, 1, -u[:, 2])
    a = A * (1 - .20 * low); bf = BF * (1 - .05 * low); bb = BB * (1 - .22 * low)
    b = np.where(u[:, 1] < 0, bf, bb); c = np.where(u[:, 2] > 0, CT, CB)
    r = 1 / np.sqrt((u[:, 0] / a) ** 2 + (u[:, 1] / b) ** 2 + (u[:, 2] / c) ** 2)
    P = C + u * r[:, None]; P[:, 1] -= .012 * low          # chin a little forward of the skull centre
    zp = 1.545 + (V[:, 1] + .11) * .41                       # jaw line: under the chin → below the occiput
    w = ss(zp - .012, zp + .006, V[:, 2]) * (np.abs(V[:, 0]) < .13)
    return V * (1 - w[:, None]) + P * w[:, None]


def relax_arms(V, deg=6.0):
    """Bring the arms a few degrees closer to the body (19° → ~13°) about an estimated shoulder pivot."""
    V = V.copy()
    for sgn in (1, -1):
        pivot = np.array([.19 * sgn, -.03, 1.44])
        rel = V - pivot
        w = ss(.0, .08, rel[:, 0] * sgn) * ss(1.58, 1.48, V[:, 2]) * (V[:, 0] * sgn > .14)
        a = math.radians(deg) * sgn
        c, s = math.cos(a), math.sin(a)
        # rotate in the x–z plane so the hand moves toward the body (x → 0) and slightly up
        xr = rel[:, 0] * c + rel[:, 2] * s
        zr = -rel[:, 0] * s + rel[:, 2] * c
        tgt = pivot + np.stack([xr, rel[:, 1], zr], 1)
        V = V * (1 - w[:, None]) + tgt * w[:, None]
    return V


def breath_key(V):
    """Shape key offsets for one full inhale: chest +3 % depth/+2 % width, upper abdomen +2 % depth."""
    D = np.zeros_like(V)
    chest = ss(1.08, 1.2, V[:, 2]) * ss(1.5, 1.38, V[:, 2]) * (np.abs(V[:, 0]) < .2)
    belly = ss(.92, 1.0, V[:, 2]) * ss(1.14, 1.06, V[:, 2]) * (np.abs(V[:, 0]) < .18)
    cy = -.0
    D[:, 1] = (V[:, 1] - cy) * (.03 * chest + .02 * belly)
    D[:, 0] = V[:, 0] * .02 * chest
    D[:, 2] = .006 * chest                                   # ribcage lifts slightly
    return D


def build_body(preview_dir=None):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, 'blender-human-base-meshes', 'human_base_meshes_bundle.blend'))
    o = bpy.data.objects['GEO-body_male_realistic']
    for x in list(bpy.data.objects):
        if x != o:
            bpy.data.objects.remove(x, do_unlink=True)        # eyes and every other bundle mesh
    o.location = (0, 0, 0)
    apply_mod(o, o.modifiers['Multires'])
    set_verts(o, relax_arms(egg_head(verts(o))))
    r = o.modifiers.new('vox', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .0032   # closes folded face/ear geometry
    apply_mod(o, r)
    vg = o.vertex_groups.new(name='seam')
    for i, v in enumerate(o.data.vertices):
        if 1.5 < v.co.z < 1.66:
            vg.add([i], float(1 - abs(v.co.z - 1.585) / .075), 'REPLACE')
    sm = o.modifiers.new('relax', 'SMOOTH'); sm.factor = .8; sm.iterations = 12; sm.vertex_group = 'seam'
    apply_mod(o, sm)
    dec = o.modifiers.new('dec', 'DECIMATE'); dec.ratio = .2
    apply_mod(o, dec)
    # scale to the intro height, feet at z = 0
    V = verts(o); V[:, 2] -= V[:, 2].min(); k = TARGET_H / V[:, 2].max(); V *= k
    set_verts(o, V)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth()
    for name in ('sharp_edge', 'sharp_face'):                # remesh/decimate leave sharp flags → glTF splits verts
        if name in o.data.attributes:
            o.data.attributes.remove(o.data.attributes[name])
    o.shape_key_add(name='Basis')
    sk = o.shape_key_add(name='breath')
    B = verts(o) / k
    sk.data.foreach_set('co', (verts(o) + breath_key(B) * k).astype(np.float32).ravel())
    o.name = 'body'
    if preview_dir:
        import preview
        preview.render_views(o, os.path.join(preview_dir, 'body'), [
            ('front', (0, -6, .83), (0, 0, .83), 1.9), ('34', (3.5, -4.5, .9), (0, 0, .83), 1.9),
            ('side', (6, 0, .83), (0, 0, .83), 1.9), ('headF', (0, -2, 1.55), (0, 0, 1.55), .34),
            ('head34', (1.2, -2.2, 1.55), (0, 0, 1.55), .34), ('headS', (2, 0, 1.55), (0, 0, 1.55), .34),
            ('hand', (.9, -1.5, .8), (.37, -.08, .78), .32)])
    # heart position: 4th–5th rib level, behind the sternum, a little to the person's left (+x)
    V = verts(o)
    zh = .715 * TARGET_H
    ring = V[(np.abs(V[:, 2] - zh) < .01) & (np.abs(V[:, 0]) < .05)]
    heart = np.array([.025, ring[:, 1].min() + .07, zh])     # Blender coords
    export(o, os.path.join(OUT, 'body.glb'), morphs=True)
    return o, V, heart


def export(o, path, morphs=False):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLB', export_normals=True,
                              export_texcoords=False, export_materials='NONE', export_yup=True,
                              export_apply=not morphs, export_morph=morphs, export_morph_normal=False)


def close_holes(o, step=.001, radius=6):
    """Atrial walls have through-holes (vein/valve openings). Voxelise by ray parity, morphological closing
    (ball r = 6 mm) + fill enclosed cavities, then rebuild the surface with Points → Volume → Mesh nodes."""
    from mathutils.bvhtree import BVHTree
    from scipy import ndimage
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(o, dg)
    V = verts(o); lo = V.min(0) - .012; hi = V.max(0) + .012
    nx, ny, nz = np.ceil((hi - lo) / step).astype(int)
    occ = np.zeros((nx, ny, nz), bool)
    up = mathutils.Vector((0, 0, 1))
    for i in range(nx):
        for j in range(ny):
            x, y = lo[0] + (i + .5) * step, lo[1] + (j + .5) * step
            z = lo[2]; hits = []
            while True:
                loc, n, idx, dist = bvh.ray_cast(mathutils.Vector((x, y, z)), up)
                if loc is None:
                    break
                hits.append(loc.z); z = loc.z + 1e-5
            for a, b in zip(hits[0::2], hits[1::2]):
                k0 = int((a - lo[2]) / step); k1 = int((b - lo[2]) / step)
                occ[i, j, k0:k1 + 1] = True
    ball = np.linalg.norm(np.mgrid[-radius:radius + 1, -radius:radius + 1, -radius:radius + 1], axis=0) <= radius
    occ = ndimage.binary_closing(occ, structure=ball, iterations=1)
    occ = ndimage.binary_fill_holes(occ)
    surf = occ & ~ndimage.binary_erosion(occ)
    pts = lo + (np.argwhere(surf) + .5) * step
    me = bpy.data.meshes.new('pts'); me.from_pydata([tuple(p) for p in pts], [], []); me.update()
    po = bpy.data.objects.new('pts', me); bpy.context.scene.collection.objects.link(po)
    ng = bpy.data.node_groups.new('closevol', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi = ng.nodes.new('NodeGroupInput'); go = ng.nodes.new('NodeGroupOutput')
    p2v = ng.nodes.new('GeometryNodePointsToVolume'); p2v.inputs['Radius'].default_value = step * 1.3
    p2v.resolution_mode = 'VOXEL_SIZE'; p2v.inputs['Voxel Size'].default_value = step * .8
    v2m = ng.nodes.new('GeometryNodeVolumeToMesh')
    ng.links.new(gi.outputs[0], p2v.inputs['Points']); ng.links.new(p2v.outputs[0], v2m.inputs['Volume']); ng.links.new(v2m.outputs[0], go.inputs[0])
    m = po.modifiers.new('close', 'NODES'); m.node_group = ng
    apply_mod(po, m)
    o.data = po.data
    bpy.data.objects.remove(po, do_unlink=True)


def keep_outer_shell(o):
    """Voxel remesh of hollow chamber walls leaves the cavity surfaces as separate closed shells; they show through
    the additive light shaders. Keep only the outer shell (largest connected component by vertex count)."""
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    seen = set(); comps = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack = [v]; comp = []; seen.add(v.index)
        while stack:
            x = stack.pop(); comp.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index); stack.append(y)
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    bmesh.ops.delete(bm, geom=[v for c in comps[1:] for v in c], context='VERTS')
    bm.to_mesh(o.data); bm.free(); o.data.update()
    print('heart shells', len(comps), 'kept', len(comps[0]))


def build_heart(preview_dir=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, 'hra-heart-male', '3d-vh-m-heart.glb'))
    keep = ['left_cardiac_atrium', 'right_cardiac_atrium', 'heart_right_ventricle', 'heart_left_ventricle',
            'interventricular_septum']
    valves = {}
    parts = []
    plugs = []
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            continue
        o.data.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
        if any(k in o.name for k in keep):
            # close vein/valve openings so the shell reads as one solid organ
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.fill_holes(sides=0); bpy.ops.object.mode_set(mode='OBJECT')
            parts.append(o)
        else:
            valves[o.name] = np.mean([v.co[:] for v in o.data.vertices], 0)
            if o.name.endswith('_valve'):
                plugs.append(o)                                  # valve leaflets plug the annuli → chambers close
            else:
                bpy.data.objects.remove(o, do_unlink=True)
    # great vessel stubs (short, no arch — the earlier aortic arch read as a handle/skull, A6)
    def tube(p0, p1, r, name):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=float(np.linalg.norm(p1 - p0)), vertices=32,
                                            location=tuple((p0 + p1) / 2))
        t = bpy.context.active_object
        t.rotation_euler = mathutils.Vector(tuple(p1 - p0)).to_track_quat('Z', 'Y').to_euler()
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        t.name = name
        return t
    def join(objs):
        bpy.ops.object.select_all(action='DESELECT')
        for p in objs:
            p.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        return bpy.context.active_object

    def remesh(o, size):
        r = o.modifiers.new('vox', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = size
        apply_mod(o, r)

    # atria carry the vein/valve through-holes: close them on their own so the ventricles keep their shape
    rest = [p for p in parts if 'atrium' not in p.name]
    atria = join([p for p in parts if 'atrium' in p.name])
    remesh(atria, .0016)
    close_holes(atria, radius=9)
    ao = valves['VH_M_aortic_valve']; pu = valves['VH_M_pulmonary_valve']
    rest.append(tube(ao - [0, 0, .005], ao + np.array([-.012, .008, .042]), .0125, 'aorta'))
    rest.append(tube(pu - [0, 0, .004], pu + np.array([.008, .016, .03]), .0115, 'pulmonary'))
    h = join([atria] + rest + plugs)
    remesh(h, .0014)
    keep_outer_shell(h)
    sm = h.modifiers.new('sm', 'SMOOTH'); sm.factor = .6; sm.iterations = 8
    apply_mod(h, sm)
    dec = h.modifiers.new('dec', 'DECIMATE'); dec.ratio = .3
    apply_mod(h, dec)
    V = verts(h); c = (V.min(0) + V.max(0)) / 2
    set_verts(h, (V - c) * HEART_SCALE)
    bpy.ops.object.shade_smooth()
    h.name = 'heart'
    if preview_dir:
        import preview
        preview.render_views(h, os.path.join(preview_dir, 'heart'), [
            ('front', (0, -3, 0), (0, 0, 0), .2), ('34', (1.6, -2.4, .3), (0, 0, 0), .2), ('left', (3, 0, 0), (0, 0, 0), .2)])
    export(h, os.path.join(OUT, 'heart.glb'))
    d = h.dimensions
    return [round(d.x, 4), round(d.z, 4), round(d.y, 4)], len(h.data.polygons)


if __name__ == '__main__':
    pv = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    if pv:
        sys.path.insert(0, pv)
    o, V, heart = build_body(pv)
    # front silhouette for the rim → body morph (reuses build-intro's routine on y-up coordinates)
    import importlib.util
    spec = importlib.util.spec_from_file_location('bi', os.path.join(os.path.dirname(__file__), 'build-intro.py'))
    bi = importlib.util.module_from_spec(spec); spec.loader.exec_module(bi)
    Vy = np.stack([V[:, 0], V[:, 2], -V[:, 1]], 1)          # Blender → y-up (glTF)
    F = [list(p.vertices) for p in o.data.polygons]
    sil = bi.silhouette(Vy, F)
    fig_path = os.path.join(OUT, 'figure.json')
    fig = json.load(open(fig_path, encoding='utf-8'))
    hy = [float(heart[0]), float(heart[2]), float(-heart[1])]
    fig.update({'height': float(Vy[:, 1].max()), 'heart': [round(x, 4) for x in hy],
                'silhouette': [[round(float(x), 4), round(float(y), 4)] for x, y in sil], 'source': 'blender-human-base-meshes'})
    fig['heartSize'], fig['heartFaces'] = build_heart(pv)
    with open(fig_path, 'w', encoding='utf-8') as f:
        json.dump(fig, f)
    print('height', round(fig['height'], 3), 'heart', fig['heart'], 'heartSize', fig['heartSize'], 'silhouette', len(sil))
    for n in ('body.glb', 'heart.glb', 'figure.json'):
        print(n, os.path.getsize(os.path.join(OUT, n)))
