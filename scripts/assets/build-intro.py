"""Build R1 intro assets (D-041) into prototype/v2/src/story/intro/assets/.

Inputs (assets/registry.json, fetched by scripts/assets/fetch.mjs):
  makehuman-base-mesh (CC0), nasa-bluemarble-200407-5400, nasa-blackmarble-2012-3600, nasa-clouds-2048 (public domain)
Outputs:
  body.glb      MakeHuman base mesh, body group only, arms lowered, decimated, metres, feet at y=0
  heart.glb     stylised heart (metaballs, built here), metres, origin at the heart centre
  figure.json   front silhouette polyline of the body (for the rim→body morph), heart position, height
  earth_day.jpg, earth_night.jpg, earth_clouds.jpg  2048x1024 equirectangular

Run: python scripts/assets/build-intro.py   (needs bpy 4.5, numpy, opencv, pillow)
"""
import json, math, os, sys
import numpy as np
import cv2
from PIL import Image
import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'assets', 'source')
OUT = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets')
os.makedirs(OUT, exist_ok=True)


def read_obj(path):
    V, faces, joints, g = [], [], {}, None
    with open(path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('v '):
                V.append([float(x) for x in line.split()[1:4]])
            elif line.startswith('g '):
                g = line.split()[1]
            elif line.startswith('f '):
                idx = [int(p.split('/')[0]) - 1 for p in line.split()[1:]]
                if g == 'body':
                    faces.append(idx)
                elif g and g.startswith('joint-'):
                    joints.setdefault(g, set()).update(idx)
    V = np.array(V)
    return V, faces, {k: V[list(v)].mean(0) for k, v in joints.items()}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lower_arms(V, J, angle_deg=28.0):
    """Rigidly rotate each arm about its shoulder joint in the front (x, y) plane.
    Weight = along-arm ramp through the shoulder × closeness to the arm axis, so torso sides stay put."""
    V = V.copy()
    for side, sgn in (('l', 1), ('r', -1)):
        pivot = J[f'joint-{side}-shoulder']
        wrist = J[f'joint-{side}-hand']
        axis = (wrist - pivot)[:2]
        length = np.linalg.norm(axis)
        axis /= length
        rel = V[:, :2] - pivot[:2]
        t = rel @ axis
        dist = np.abs(rel[:, 0] * axis[1] - rel[:, 1] * axis[0])
        w = smoothstep(-0.25, 0.55, t) * (1 - smoothstep(0.75, 1.25, dist)) * (V[:, 0] * sgn > 0.9)
        a = -math.radians(angle_deg) * sgn  # l arm (+x) rotates clockwise (down) toward the body
        c, s = math.cos(a * 1), math.sin(a * 1)
        rot = np.array([[c, -s], [s, c]])
        target = rel @ rot.T + pivot[:2]
        V[:, :2] = V[:, :2] * (1 - w[:, None]) + target * w[:, None]
    return V


def silhouette(V, faces, px_per_m=900):
    """Front orthographic silhouette → one closed polyline (x, y in metres), starting at the top of the head, clockwise."""
    mn, mx = V[:, :2].min(0), V[:, :2].max(0)
    pad = 20
    W = int((mx[0] - mn[0]) * px_per_m) + 2 * pad
    H = int((mx[1] - mn[1]) * px_per_m) + 2 * pad
    img = np.zeros((H, W), np.uint8)
    to_px = lambda p: np.stack([(p[:, 0] - mn[0]) * px_per_m + pad, (mx[1] - p[:, 1]) * px_per_m + pad], 1)
    for f in faces:
        cv2.fillPoly(img, [np.round(to_px(V[f][:, :2])).astype(np.int32)], 255)
    img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)[:, 0, :].astype(float)
    # smooth + resample by arc length
    k = 9
    cs = np.stack([np.convolve(np.r_[c[-k:, i], c[:, i], c[:k, i]], np.ones(2 * k + 1) / (2 * k + 1), 'valid') for i in (0, 1)], 1)
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(np.r_[cs, cs[:1]], axis=0), axis=1))]
    n = 480
    s = np.linspace(0, seg[-1], n, endpoint=False)
    closed = np.r_[cs, cs[:1]]
    res = np.stack([np.interp(s, seg, closed[:, i]) for i in (0, 1)], 1)
    top = int(np.argmin(res[:, 1]))  # image y down → smallest y = top of head
    res = np.roll(res, -top, axis=0)
    # OpenCV external contours run counter-clockwise in image space = clockwise on screen with y up flipped; normalise to clockwise on screen
    xs = (res[:, 0] - pad) / px_per_m + mn[0]
    ys = mx[1] - (res[:, 1] - pad) / px_per_m
    if xs[5] < xs[0]:  # make the second point go to the viewer's right (clockwise)
        xs, ys = np.r_[xs[:1], xs[1:][::-1]], np.r_[ys[:1], ys[1:][::-1]]
    return np.stack([xs, ys], 1)


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def export(obj, path):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLB', export_normals=True,
                              export_texcoords=False, export_materials='NONE', export_yup=True, export_apply=True)


def build_body():
    V, faces, J = read_obj(os.path.join(SRC, 'makehuman-base-mesh', 'base.obj'))
    V = lower_arms(V, J)
    used = sorted({i for f in faces for i in f})
    remap = {o: n for n, o in enumerate(used)}
    Vb = V[used] * 0.1  # decimetres → metres
    Vb[:, 1] -= Vb[:, 1].min()
    shift_y = -V[used][:, 1].min() * 0.1
    Fb = [[remap[i] for i in f] for f in faces]
    J = {k: v * 0.1 + np.array([0, shift_y, 0]) for k, v in J.items()}

    clear()
    mesh = bpy.data.meshes.new('body')
    # OBJ is y-up; Blender is z-up → (x, -z, y); glTF export converts back to y-up
    mesh.from_pydata([(x, -z, y) for x, y, z in Vb], [], Fb)
    mesh.update()
    obj = bpy.data.objects.new('body', mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    # no face: heavily smooth everything above the chin (weights ramp from the neck joint up)
    neck_y, head_y = J['joint-neck'][1], J['joint-head'][1]
    vg = obj.vertex_groups.new(name='head')
    for i, (x, y, z) in enumerate(Vb):
        w = float(smoothstep(neck_y + 0.02, (neck_y + head_y) / 2, y))
        if w > 0:
            vg.add([i], w, 'REPLACE')
    sm = obj.modifiers.new('noface', 'SMOOTH')
    sm.factor = 1.0
    sm.iterations = 150
    sm.vertex_group = 'head'
    body_sm = obj.modifiers.new('mannequin', 'SMOOTH')   # soften anatomy detail so the outline reads as a mannequin
    body_sm.factor = 0.6
    body_sm.iterations = 10
    dec = obj.modifiers.new('dec', 'DECIMATE')
    dec.ratio = 0.5
    export(obj, os.path.join(OUT, 'body.glb'))

    sil = silhouette(Vb, Fb)
    # heart: behind the sternum, slightly to the person's left (+x in MakeHuman), between T4 and T8
    heart = (J['joint-spine-2'] * 0.35 + J['joint-neck'] * 0.65)
    heart = [0.028, float(heart[1] - 0.06), float(J['joint-spine-2'][2] + 0.075)]
    return {
        'height': float(Vb[:, 1].max()),
        'heart': heart,
        'chestFrontZ': float(Vb[(abs(Vb[:, 0]) < 0.05) & (abs(Vb[:, 1] - heart[1]) < 0.03)][:, 2].max()),
        'silhouette': [[round(float(x), 4), round(float(y), 4)] for x, y in sil],
    }


def build_heart():
    """Stylised heart: ventricles, atria, aortic arch and pulmonary trunk as scaled spheres/tubes, unioned by a voxel
    remesh and smoothed. Blender z-up; +x = person's left, -y = front. Metres (about 12 cm tall)."""
    clear()
    from mathutils import Euler

    def blob(co, size, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1, location=co)
        o = bpy.context.active_object
        o.scale = size
        o.rotation_euler = Euler(rot)
        return o

    def tube(p0, p1, r, n):
        return [blob(tuple(p0[i] + (p1[i] - p0[i]) * k / (n - 1) for i in range(3)), (r, r, r)) for k in range(n)]

    parts = [
        blob((0.004, 0.0, -0.012), (0.034, 0.029, 0.052), (0.0, 0.62, 0.0)),     # ventricles: rounded cone, apex to the person's left
        blob((-0.012, -0.012, -0.004), (0.027, 0.020, 0.034), (0.0, 0.45, 0.0)), # right ventricle bulge in front
        blob((0.014, 0.012, 0.028), (0.017, 0.015, 0.015)),                     # left atrium (back)
        blob((-0.024, 0.004, 0.022), (0.019, 0.017, 0.018)),                    # right atrium
    ]
    parts += tube((-0.026, 0.006, 0.030), (-0.026, 0.008, 0.064), 0.0072, 7)    # superior vena cava (short)
    parts += tube((0.000, 0.002, 0.026), (0.003, 0.004, 0.056), 0.0088, 6)      # ascending aorta
    for k in range(12):                                                           # aortic arch: over the top and backwards
        a = math.pi * k / 11
        parts.append(blob((0.003 + 0.011 * (1 - math.cos(a)), 0.004 + 0.022 * k / 11, 0.056 + 0.009 * math.sin(a)), (0.0098, 0.0098, 0.0098)))
    parts += tube((0.025, 0.026, 0.054), (0.028, 0.030, 0.018), 0.0082, 6)      # descending aorta, behind
    parts += tube((-0.008, -0.018, 0.020), (0.003, -0.016, 0.048), 0.0082, 6)   # pulmonary trunk (front)
    parts += tube((0.003, -0.016, 0.048), (0.020, -0.006, 0.054), 0.0060, 5)    # left pulmonary artery
    parts += tube((0.003, -0.016, 0.048), (-0.014, -0.004, 0.054), 0.0060, 5)   # right pulmonary artery
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.join()
    m = bpy.context.active_object
    m.name = 'heart'
    rm = m.modifiers.new('remesh', 'REMESH')
    rm.mode = 'VOXEL'
    rm.voxel_size = 0.0022
    sm = m.modifiers.new('smooth', 'SMOOTH')
    sm.iterations = 12
    sm.factor = 0.8
    dec = m.modifiers.new('dec', 'DECIMATE')
    dec.ratio = 0.25
    bpy.ops.object.modifier_apply(modifier='remesh')
    bpy.ops.object.modifier_apply(modifier='smooth')
    bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.shade_smooth()
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    m.location = (0, 0, 0)
    export(m, os.path.join(OUT, 'heart.glb'))
    dims = m.dimensions
    return [round(dims.x, 4), round(dims.z, 4), round(dims.y, 4)], len(m.data.polygons)


def textures():
    size = (2048, 1024)
    Image.open(os.path.join(SRC, 'nasa-bluemarble-200407-5400', 'world.200407.3x5400x2700.jpg')).convert('RGB') \
        .resize(size, Image.LANCZOS).save(os.path.join(OUT, 'earth_day.jpg'), quality=86)
    Image.open(os.path.join(SRC, 'nasa-blackmarble-2012-3600', 'dnb_land_ocean_ice.2012.3600x1800.jpg')).convert('RGB') \
        .resize(size, Image.LANCZOS).save(os.path.join(OUT, 'earth_night.jpg'), quality=86)
    Image.open(os.path.join(SRC, 'nasa-clouds-2048', 'cloud_combined_2048.jpg')).convert('L') \
        .resize(size, Image.LANCZOS).save(os.path.join(OUT, 'earth_clouds.jpg'), quality=86)


if __name__ == '__main__':
    fig = build_body()
    fig['heartSize'], fig['heartFaces'] = build_heart()
    textures()
    with open(os.path.join(OUT, 'figure.json'), 'w', encoding='utf-8') as f:
        json.dump(fig, f)
    print('height', round(fig['height'], 3), 'heart', fig['heart'], 'silhouette', len(fig['silhouette']))
    for n in sorted(os.listdir(OUT)):
        print(n, os.path.getsize(os.path.join(OUT, n)))
