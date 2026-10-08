"""Story noise scenes (brief 3, D-053/D-054): export the chair figure for the web.

Not run on its own — `EXPORT_STORY=<dir> FIST_POSE=chair python scripts/assets/fist-v3.py` poses the chair figure, solves and
gates the fist and the breath bones (FAIL 0 or no output), then chair-motion-v3.render() hands its locals to run() here.
  body_v3_story.glb   chair pose (open hand, breath 0) + morph targets fist25/50/75/100 (the measured close curve sampled at
                      s = .25 … 1 — the web blends neighbours, so PIP still leads MCP) and breath (deep key × 0.8 + bones × 0.8);
                      attributes _SLICE (H5 rings, rest bone-axis coordinate), _INFLOW_D / _INFLOW_M (M-b wave, inflow-preview-v3)
  chair_v3_story.glb  GreenChair_01 (Poly Haven CC0) as placed under the figure (figure frame)
  story.json          electrodes (vertex, position, normal), sternum vertex, heart (approx., see below), RA arc length, cameras
                      'ma' (16 mm auto frame) and 'side' (ortho, the person's right), archive spot (chair_fit)
Figure frame = Blender (z up); the glTF export turns it into three's y-up (x, z, −y).
"""
import json, math, os
import numpy as np


def run(L):
    g = L['g']; bpy, o, rig, P, state, apply = g['bpy'], g['o'], g['rig'], g['P'], g['state'], g['apply']
    Vector, ROOT = g['Vector'], g['ROOT']; cams, base, cm = L['cams'], L['base'], L['cm']
    OUT = os.path.join(ROOT, os.environ['EXPORT_STORY']); os.makedirs(OUT, exist_ok=True)
    import importlib.util as _iu
    _sp = _iu.spec_from_file_location('inflow', os.path.join(ROOT, 'scripts', 'assets', 'inflow-preview-v3.py'))
    ip = _iu.module_from_spec(_sp); _sp.loader.exec_module(ip)
    fj = json.load(open(os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets', 'figure.json'), encoding='utf-8'))['poses_v3']['chair']

    def pose(b, s):
        cm.breath_bones(P, Vector, base, .8 * b); apply(*state('close', s))
        o.data.shape_keys.key_blocks['breath_deep'].value = .8 * b; bpy.context.view_layer.update()
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
        A = np.array([(o.matrix_world @ v.co)[:] for v in me.vertices]); ev.to_mesh_clear(); return A

    P0 = pose(0, 0)
    FK = {f'fist{int(s * 100)}': pose(0, s) for s in (.25, .5, .75, 1.0)}
    PB = pose(1, 0); pose(0, 0)
    total = ip.arc_attribute(bpy, o, rig, fj['electrodes']['RA']['v'])
    def attr(n):
        a = o.data.attributes[n]; v = np.zeros(len(a.data), np.float32); a.data.foreach_get('value', v); return v
    SL, ID, IM = attr('_SLICE_rest'), attr('_inflow_d'), attr('_inflow_m')
    F = [list(p.vertices) for p in o.data.polygons]
    me = bpy.data.meshes.new('body_v3_story'); me.from_pydata([tuple(p) for p in P0], [], F); me.update()
    so = bpy.data.objects.new('body_v3_story', me); bpy.context.scene.collection.objects.link(so)
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = so; so.select_set(True); bpy.ops.object.shade_smooth()
    so.shape_key_add(name='Basis')
    for k, A in FK.items(): so.shape_key_add(name=k).data.foreach_set('co', A.astype(np.float32).ravel())
    so.shape_key_add(name='breath').data.foreach_set('co', PB.astype(np.float32).ravel())
    for n, v in (('_SLICE', SL), ('_INFLOW_D', ID), ('_INFLOW_M', IM)):
        so.data.attributes.new(n, 'FLOAT', 'POINT').data.foreach_set('value', v)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'body_v3_story.glb'), use_selection=True, export_format='GLB',
                              export_normals=True, export_texcoords=False, export_materials='NONE', export_yup=True,
                              export_apply=False, export_morph=True, export_morph_normal=False, export_attributes=True)
    Nv = np.array([v.normal[:] for v in me.vertices])
    # chair as placed (figure frame)
    chair = [x for x in bpy.data.objects if x.get('chair')]
    bpy.ops.object.select_all(action='DESELECT')
    for x in chair: x.select_set(True)
    bpy.context.view_layer.objects.active = chair[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'chair_v3_story.glb'), use_selection=True, export_format='GLB',
                              export_yup=True, export_apply=True, export_image_format='JPEG')
    # sternum (posed skin, as inflow-preview B-b) and heart: the D-050 chair pose heart expressed in its RA/LA/LL frame,
    # carried to this pose's electrode frame (approximate — the torso differs only by the 5° lean and the breath bones)
    E = {k: P0[e['v']] for k, e in fj['electrodes'].items()}
    ra = E['RA']; cand = np.where((np.abs(P0[:, 0]) < .015) & (np.abs(P0[:, 2] - (ra[2] - .06)) < .015))[0]
    sternum = int(cand[np.argmin(P0[cand, 1])])
    def frame(a, b, c):
        x = b - a; x /= np.linalg.norm(x); y = c - a; y -= x * (x @ y); y /= np.linalg.norm(y); return a, np.stack([x, y, np.cross(x, y)])
    Eo = {k: np.array(e['p']) for k, e in fj['electrodes'].items()}
    a0, R0 = frame(Eo['RA'], Eo['LA'], Eo['LL']); a1, R1 = frame(E['RA'], E['LA'], E['LL'])
    heart = a1 + R1.T @ (R0 @ (np.array(fj['heart_b']) - a0))
    def cam(c):
        d = {'loc': [round(v, 4) for v in c.location], 'rot_euler': [round(v, 5) for v in c.rotation_euler]}
        if c.data.type == 'ORTHO': d.update(type='ortho', ortho_scale=1.9, loc=[round(v, 4) for v in (c.location + Vector((0, 0, .2)))])
        else: d.update(type='persp', lens=c.data.lens, sensor_width=c.data.sensor_width)
        return d
    arch = {}
    ab = os.environ.get('ARCHIVE_BLEND')
    out = {'source': 'scripts/assets/story-export-v3.py (fist-v3 chair pose, gate FAIL 0)', 'frame': 'blender figure frame (z up)',
           'figure_anchor': [0.0, .0087, .4313], 'morphs': list(FK) + ['breath'], 'fist_s': [.25, .5, .75, 1.0],
           'breath_scale': .8, 'ra_arc_m': round(total, 4), 'sternum_v': sternum,
           'electrodes': {k: {'v': e['v'], 'p': [round(float(x), 4) for x in P0[e['v']]], 'n': [round(float(x), 4) for x in Nv[e['v']]]}
                          for k, e in fj['electrodes'].items()},
           'heart_approx': [round(float(x), 4) for x in heart], 'cams': {k: cam(c) for k, c in cams.items()},
           'archive_spot_note': 'build_archive.py r2 chair_fit: anchor (-0.7505, 3.0995, 0.4372), yaw -0.0106 rad; web archive.glb (r1 bake) has no chair'}
    json.dump(out, open(os.path.join(OUT, 'story.json'), 'w', encoding='utf-8'), indent=1)
    for f in ('body_v3_story.glb', 'chair_v3_story.glb', 'story.json'):
        print(f'   export {f}: {os.path.getsize(os.path.join(OUT, f))} bytes')
