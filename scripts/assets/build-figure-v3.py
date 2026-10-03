"""R1 figure v3 (D-048): deformé body + egg head, seated on the archive ladder, right hand wrapped around the stile,
10 ECG electrode sites (standard 12-lead) for the lead-wire / signal-path story.

Source: Blender Studio "Human Base Meshes" v1.0.0 (CC0). Default --source realistic (candidate A, user choice
2026-10-03); --source stylized keeps candidate B (verification/r1-figure-v3-20261002/lineup_sheet.jpg).
Helpers (and, for A, the egg head, arm relax and joint measurements) come from build-intro-figure.py.

Outputs (prototype/v2/src/story/intro/assets/; the v2/archive web code still reads body_seated.glb until switched):
  body_seated_v3.glb   posed mesh, shape keys breath + grip, attribute _SLICE (H3b/H5 ring coordinate)
  figure.json          key "seated_v3": seat, heart, electrodes (site, position, normal), joints (signal paths), stile

The grip is geometric, not a bone curl: after the arm reaches the stile, finger vertices are wrapped around the stile
axis (arc length on the palm surface → angle), so the fingers really close around the wood (F-030 fist).

Run: python scripts/assets/build-figure-v3.py [--preview DIR]   (bpy 4.5, numpy)
"""
import importlib.util, json, math, os, sys
import numpy as np
import bpy, mathutils
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bif', os.path.join(HERE, 'build-intro-figure.py'))
bif = importlib.util.module_from_spec(spec); spec.loader.exec_module(bif)
ss, verts, set_verts, apply_mod, breath_key, export = bif.ss, bif.verts, bif.set_verts, bif.apply_mod, bif.breath_key, bif.export
SRC, OUT, TARGET_H = bif.SRC, bif.OUT, bif.TARGET_H
SOURCE = sys.argv[sys.argv.index('--source') + 1] if '--source' in sys.argv else 'realistic'
SRC_H = 1.794 if SOURCE == 'stylized' else 1.80    # bundle heights (metres)
K = TARGET_H / SRC_H

# archive ladder (scripts/blender/build_archive.py): stiles ±0.24 m from the ladder centre, 14° lean, 45 × 70 mm
STILE_DX, LAD_TAN, STILE_R = 0.24, math.tan(math.radians(14)), 0.026


def egg_head(V):
    """Featureless egg head for the stylized mesh (source units; front −y, up z). Everything above the jaw-line plane is
    projected onto an egg fitted to the skull — no eyes, nose, mouth or ears (user 2026-10-01)."""
    C = np.array([0, -.022, 1.655]); A, BF, BB, CT, CB = .097, .116, .112, .139, .150
    d = V - C; u = d / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-9)
    low = ss(0, 1, -u[:, 2])
    a = A * (1 - .24 * low); bf = BF * (1 - .08 * low); bb = BB * (1 - .25 * low)
    b = np.where(u[:, 1] < 0, bf, bb); c = np.where(u[:, 2] > 0, CT, CB)
    r = 1 / np.sqrt((u[:, 0] / a) ** 2 + (u[:, 1] / b) ** 2 + (u[:, 2] / c) ** 2)
    P = C + u * r[:, None]; P[:, 1] -= .010 * low
    zp = 1.50 + (V[:, 1] + .12) * .33                       # jaw line: under the chin → below the occiput
    w = ss(zp - .012, zp + .006, V[:, 2]) * (np.abs(V[:, 0]) < .16)
    return V * (1 - w[:, None]) + P * w[:, None]


def relax_arms(V, deg=9.0):
    """The stylized A-pose is wide (≈ 24°); bring the arms toward the body before rigging."""
    V = V.copy()
    for sgn in (1, -1):
        pivot = np.array([.19 * sgn, .01, 1.40])
        rel = V - pivot
        w = ss(.0, .06, rel[:, 0] * sgn) * ss(1.50, 1.42, V[:, 2]) * (V[:, 0] * sgn > .15)
        a = math.radians(deg) * sgn; c, s = math.cos(a), math.sin(a)
        xr = rel[:, 0] * c + rel[:, 2] * s; zr = -rel[:, 0] * s + rel[:, 2] * c
        V = V * (1 - w[:, None]) + (pivot + np.stack([xr, rel[:, 1], zr], 1)) * w[:, None]
    return V


def rot_arm_point(p, sgn, deg=9.0):
    pivot = np.array([.19 * sgn, .01, 1.40]); rel = np.array(p) - pivot
    a = math.radians(deg) * sgn; c, s = math.cos(a), math.sin(a)
    return pivot + np.array([rel[0] * c + rel[2] * s, rel[1], -rel[0] * s + rel[2] * c])


def bones():
    """Joints measured on the stylized mesh by limb cross-sections (radius minima), source units, then scaled by K."""
    B = {'pelvis': ((0, 0, .86), (0, 0, 1.0), None), 'spine': ((0, 0, 1.0), (0, 0, 1.18), 'pelvis'),
         'chest': ((0, 0, 1.18), (0, 0, 1.42), 'spine'), 'neck': ((0, 0, 1.42), (0, -.01, 1.52), 'chest'),
         'head': ((0, -.01, 1.52), (0, -.01, SRC_H), 'neck')}
    for s, n in ((1, 'L'), (-1, 'R')):
        A = lambda p: tuple(rot_arm_point((s * p[0], p[1], p[2]), s))
        B[f'thigh.{n}'] = ((s * .09, 0, .88), (s * .09, 0, .47), 'pelvis')
        B[f'shin.{n}'] = ((s * .09, 0, .47), (s * .098, .012, .12), f'thigh.{n}')
        B[f'foot.{n}'] = ((s * .098, .012, .12), (s * .13, -.12, .02), f'shin.{n}')
        B[f'clav.{n}'] = ((s * .03, 0, 1.40), A((.18, .01, 1.41)), 'chest')
        B[f'upper.{n}'] = (A((.19, .01, 1.40)), A((.32, .035, 1.14)), f'clav.{n}')
        B[f'fore.{n}'] = (A((.32, .035, 1.14)), A((.40, .0, .93)), f'upper.{n}')
        B[f'hand.{n}'] = (A((.40, .0, .93)), A((.405, -.01, .81)), f'fore.{n}')
        B[f'finger1.{n}'] = (A((.405, -.01, .81)), A((.405, -.012, .777)), f'hand.{n}')
        B[f'finger2.{n}'] = (A((.405, -.012, .777)), A((.404, -.015, .746)), f'finger1.{n}')
        B[f'finger3.{n}'] = (A((.404, -.015, .746)), A((.40, -.02, .716)), f'finger2.{n}')
        B[f'thumb.{n}'] = (A((.39, -.04, .87)), A((.361, -.096, .824)), f'hand.{n}')
    return {k: (tuple(np.array(h) * K), tuple(np.array(t) * K), p) for k, (h, t, p) in B.items()}


SEATED = {   # armature-space target directions (front = −y); the right arm is solved to the stile separately
    'spine': (0, -.10, 1), 'chest': (0, -.14, 1), 'neck': (0, -.30, 1), 'head': (0, -.34, 1),
    'thigh.R': (-.10, -1, -.06), 'shin.R': (-.02, -.12, -1), 'foot.R': (-.05, -1, -.35),
    'thigh.L': (.08, -1, .10), 'shin.L': (.02, .55, -1), 'foot.L': (.05, -1, -.1),
    'upper.L': (.08, -.22, -1), 'fore.L': (-.02, -.85, -.62), 'hand.L': (0, -.55, -1),
}

# electrode sites on the rest (standing) mesh, source units: ray origin → target (closest surface hit is the site)
SITES = {
    'V1': ((-.035, -.6, 1.265), (-.035, 0, 1.265)), 'V2': ((.035, -.6, 1.265), (.035, 0, 1.265)),
    'V3': ((.075, -.6, 1.24), (.075, 0, 1.24)), 'V4': ((.112, -.6, 1.215), (.112, 0, 1.215)),
}


def build(preview_dir=None):
    global K
    STY = SOURCE == 'stylized'
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, 'blender-human-base-meshes', 'human_base_meshes_bundle.blend'))
    o = bpy.data.objects['GEO-body_male_stylized' if STY else 'GEO-body_male_realistic']
    for x in list(bpy.data.objects):
        if x != o: bpy.data.objects.remove(x, do_unlink=True)
    o.animation_data_clear()
    o.location = (0, 0, 0)
    for m in list(o.modifiers): apply_mod(o, m)                 # stylized: Auto Smooth nodes; realistic: Multires
    o.vertex_groups.clear()
    if o.data.shape_keys: o.shape_key_clear()
    if STY:
        sd = o.modifiers.new('sub', 'SUBSURF'); sd.levels = 1; apply_mod(o, sd)
        set_verts(o, relax_arms(egg_head(verts(o))))
    else:
        set_verts(o, bif.relax_arms(bif.egg_head(verts(o))))     # same head/arms as v2 (P1)
    r = o.modifiers.new('vox', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .0032; apply_mod(o, r)
    vg = o.vertex_groups.new(name='seam'); zc, zw = (1.54, .08) if STY else (1.585, .075)
    for i, v in enumerate(o.data.vertices):
        if zc - zw < v.co.z < zc + zw: vg.add([i], float(1 - abs(v.co.z - zc) / zw), 'REPLACE')
    sm = o.modifiers.new('relax', 'SMOOTH'); sm.factor = .8; sm.iterations = 12; sm.vertex_group = 'seam'; apply_mod(o, sm)
    o.vertex_groups.clear()
    dec = o.modifiers.new('dec', 'DECIMATE'); dec.ratio = .22 if STY else .2; apply_mod(o, dec)
    V = verts(o); V[:, 2] -= V[:, 2].min(); K = TARGET_H / V[:, 2].max(); V *= K; set_verts(o, V)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth()
    for name in ('sharp_edge', 'sharp_face'):
        if name in o.data.attributes: o.data.attributes.remove(o.data.attributes[name])
    o.shape_key_add(name='Basis'); sk = o.shape_key_add(name='breath')
    sk.data.foreach_set('co', (verts(o) + breath_key(verts(o) / K) * K).astype(np.float32).ravel())
    o.name = 'body_v3'
    Vr = verts(o)
    # heart: behind the sternum at the 4th–5th rib, a little to the person's left (same rule as v2)
    zh = 1.235 * K if STY else .715 * TARGET_H
    ring = Vr[(np.abs(Vr[:, 2] - zh) < .01) & (np.abs(Vr[:, 0]) < .05)]
    heart = np.array([.025, ring[:, 1].min() + .075, zh])
    # electrode sites on the rest mesh → vertex indices (they ride the pose with the skin)
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get())
    site_idx = {}
    for nm, (a, b) in SITES.items():
        a, b = Vector(a) * K, Vector(b) * K
        hit = bvh.ray_cast(a, (b - a).normalized())
        site_idx[nm] = int(np.argmin(np.linalg.norm(Vr - np.array(hit[0]), axis=1)))
    zl = 1.215 * K; band = Vr[(np.abs(Vr[:, 2] - zl) < .008) & (Vr[:, 0] > 0)]
    xs = np.sort(band[:, 0]); g = np.argmax(np.diff(xs)); torso_x = (xs[g] + xs[g + 1]) / 2   # torso ends at the widest gap
    band = band[band[:, 0] < torso_x]; tx = band[:, 0].max()
    xm = (Vr[site_idx['V4'], 0] + tx) / 2; v5 = band[np.abs(band[:, 0] - xm) < .008]; v5 = v5[np.argmin(v5[:, 1])]   # anterior axillary: halfway V4 → side
    v6 = band[np.abs(band[:, 1] - .0) < .03]; v6 = v6[np.argmax(v6[:, 0])]                              # mid-axillary
    for nm, p in (('V5', v5), ('V6', v6)): site_idx[nm] = int(np.argmin(np.linalg.norm(Vr - p, axis=1)))
    B = bones() if STY else bif._bones()                       # realistic joints were measured on the 1.666 m mesh (P1)
    for s, n, tag in ((1, 'L', 'LA'), (-1, 'R', 'RA')):          # inner forearm, 4 cm above the wrist crease
        h, t = np.array(B[f'fore.{n}'][0]), np.array(B[f'fore.{n}'][1]); p = t + (h - t) * .2
        c = Vr[np.linalg.norm(Vr - p, axis=1) < .06]; d = c - p; d[:, 0] *= -s            # medial (toward the body) side
        site_idx[tag] = int(np.argmin(np.linalg.norm(Vr - c[np.argmax(d[:, 0] - .3 * np.abs(d[:, 1]))], axis=1)))
    for s, n, tag in ((1, 'L', 'LL'), (-1, 'R', 'RL')):          # inner lower leg above the ankle
        h, t = np.array(B[f'shin.{n}'][0]), np.array(B[f'shin.{n}'][1]); p = t + (h - t) * .18
        c = Vr[np.linalg.norm(Vr - p, axis=1) < .07]; d = c - p
        site_idx[tag] = int(np.argmin(np.linalg.norm(Vr - c[np.argmax(-s * d[:, 0])], axis=1)))
    # ---- rig ----
    ad = bpy.data.armatures.new('rig'); ar = bpy.data.objects.new('rig', ad); bpy.context.scene.collection.objects.link(ar)
    bpy.context.view_layer.objects.active = ar; bpy.ops.object.mode_set(mode='EDIT')
    for name, (h, t, par) in B.items():
        eb = ad.edit_bones.new(name); eb.head, eb.tail = h, t
    for name, (h, t, par) in B.items():
        if par: ad.edit_bones[name].parent = ad.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); ar.select_set(True); bpy.context.view_layer.objects.active = ar
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    # H3b ring coordinate (same rule as build-intro-figure.build_seated)
    names = list(B); hd = {n: np.array(B[n][0], float) for n in names}; tl = {n: np.array(B[n][1], float) for n in names}
    dr = {n: (tl[n] - hd[n]) / np.linalg.norm(tl[n] - hd[n]) for n in names}; off = {}
    for n in names:
        par = B[n][2]; off[n] = .80 if par is None else off[par] + float((hd[n] - hd[par]) @ dr[par])
    dr['pelvis'] = np.array([0, 0, 1.])
    gi = {g.index: g.name for g in o.vertex_groups}; acc = np.zeros(len(Vr)); wsum = np.zeros(len(Vr))
    fw = np.zeros(len(Vr)); tw = np.zeros(len(Vr))                   # right finger / thumb weights for the wrap
    for i, v in enumerate(o.data.vertices):
        for g in v.groups:
            n = gi.get(g.group)
            if n in hd and g.weight > 0:
                acc[i] += g.weight * (off[n] + float((Vr[i] - hd[n]) @ dr[n])); wsum[i] += g.weight
                if n.startswith('finger') and n.endswith('.R'): fw[i] += g.weight
                if n == 'thumb.R': tw[i] += g.weight
    SLICE = np.where(wsum > 0, acc / np.maximum(wsum, 1e-6), Vr[:, 2])
    # ---- pose ----
    bpy.context.view_layer.objects.active = ar; bpy.ops.object.mode_set(mode='POSE')
    def aim(name, d):
        pb = ar.pose.bones[name]; bpy.context.view_layer.update()
        rest = pb.bone.matrix_local.to_3x3(); rd = rest @ Vector((0, 1, 0))
        rot = rd.rotation_difference(Vector(d).normalized()).to_matrix() @ rest
        pb.matrix = Matrix.Translation(pb.matrix.translation.copy()) @ rot.to_4x4(); bpy.context.view_layer.update()
    for name in B:
        if name in SEATED: aim(name, SEATED[name])
    def curl(side, s_, deg, thumb_deg):
        hp = ar.pose.bones[f'hand.{side}']; Mh = hp.matrix @ hp.bone.matrix_local.inverted(); C = Matrix.Identity(4)
        for k, share in ((1, .38), (2, .36), (3, .26)):
            pb = ar.pose.bones[f'finger{k}.{side}']; Kp = pb.bone.head_local
            C = C @ Matrix.Translation(Kp) @ Matrix.Rotation(math.radians(s_ * deg * share), 4, (0, 1, 0)) @ Matrix.Translation(-Kp)
            pb.matrix = Mh @ C @ pb.bone.matrix_local; bpy.context.view_layer.update()
        pb = ar.pose.bones[f'thumb.{side}']; Kp = pb.bone.head_local
        pb.matrix = Mh @ Matrix.Translation(Kp) @ Matrix.Rotation(math.radians(-s_ * thumb_deg), 4, (0, 0, 1)) @ Matrix.Translation(-Kp) @ pb.bone.matrix_local
        bpy.context.view_layer.update()
    curl('L', 1, 50, 12)
    bpy.ops.object.mode_set(mode='OBJECT')
    def evaluated(breath=0.0):
        o.data.shape_keys.key_blocks['breath'].value = breath; bpy.context.view_layer.update()
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
        P = np.array([v.co[:] for v in me.vertices]); ev.to_mesh_clear(); return P
    P = evaluated()
    pel = (np.abs(P[:, 0]) < .13) & (np.abs(P[:, 1]) < .12)
    seat = P[pel][np.argmin(P[pel][:, 2])]
    # right stile in the figure frame (archive places the seat centred on the rung, 6 cm in front of its axis)
    u = Vector((0, LAD_TAN, 1)).normalized()
    def stile_at(z): return Vector((seat[0] - STILE_DX, seat[1] + .06 + (z - seat[2] + .015) * LAD_TAN, z))
    zg = seat[2] + .17
    A0 = stile_at(zg)
    f = Vector((-.05, 1.0, -.62)).normalized()                     # hand axis: back and down, across the stile
    fp = (f - f.dot(u) * u).normalized()
    n = u.cross(fp).normalized()
    if n.x < 0: n = -n                                                # palm faces the stile from outside (+x)
    S = A0 - STILE_R * n                                              # palm-surface contact at the knuckle line
    hb = ar.pose.bones['hand.R']; L = (Vector(B['hand.R'][1]) - Vector(B['hand.R'][0])).length
    Kn = S - n * .014 * K / .93                                       # bone runs inside the palm (half thickness)
    W = Kn - f * L
    # two-bone IK for the right arm (upper + fore) to the wrist W, elbow out and back
    bpy.context.view_layer.objects.active = ar; bpy.ops.object.mode_set(mode='POSE')
    tg = bpy.data.objects.new('ik_t', None); bpy.context.scene.collection.objects.link(tg); tg.location = W
    pl = bpy.data.objects.new('ik_p', None); bpy.context.scene.collection.objects.link(pl)
    pl.location = Vector(B['upper.R'][1]) + Vector((-.35, .45, 0))
    c = ar.pose.bones['fore.R'].constraints.new('IK'); c.target = tg; c.pole_target = pl; c.chain_count = 2; c.pole_angle = 0
    bpy.context.view_layer.update()
    mats = {k: ar.pose.bones[k].matrix.copy() for k in ('upper.R', 'fore.R')}
    ar.pose.bones['fore.R'].constraints.remove(c)
    for k in ('upper.R', 'fore.R'): ar.pose.bones[k].matrix = mats[k]; bpy.context.view_layer.update()
    # hand frame: bone y → f, rest palm normal (+x for the right hand) → n
    rest = hb.bone.matrix_local.to_3x3(); y0 = (rest @ Vector((0, 1, 0))).normalized()
    n0 = Vector((1, 0, 0)); n0 = (n0 - n0.dot(y0) * y0).normalized()
    nn = (n - n.dot(f) * f).normalized()
    M0 = Matrix((y0, n0, y0.cross(n0))).transposed(); M1 = Matrix((f, nn, f.cross(nn))).transposed()
    R = M1 @ M0.inverted()
    hb.matrix = Matrix.Translation(hb.matrix.translation.copy()) @ (R @ rest).to_4x4(); bpy.context.view_layer.update()
    print('wrist target', tuple(round(x, 3) for x in W), 'reached', tuple(round(x, 3) for x in hb.matrix.translation))
    for k in (1, 2, 3):                                               # fingers straight in line with the hand, then wrapped
        pb = ar.pose.bones[f'finger{k}.R']; pb.matrix_basis = Matrix.Identity(4)
    pt = ar.pose.bones['thumb.R']; pt.matrix_basis = Matrix.Identity(4); bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='OBJECT')
    P0, P1 = evaluated(0.0), evaluated(1.0)
    hand_pos = np.array(hb.matrix.translation)
    Sn, An, un, nn_, fn = (np.array(v) for v in (S, A0, u, n, fp))

    def wrap(Pin, amount, rad):
        """Wrap finger vertices around the stile axis: palm-surface arc length s past the knuckle line → angle s/rad."""
        Pq = Pin.copy()
        near = np.linalg.norm(Pin - hand_pos, axis=1) < .3
        d_all = Pin - Sn
        idx = np.where(near & (tw < .6) & (d_all @ fn > -.01) & (np.abs(d_all @ un) < .08) & (np.abs(d_all @ nn_) < .06))[0]
        d = d_all[idx]
        s = d @ fn; h = -(d @ nn_); lat = d @ un
        h = np.maximum(h, 0)
        # bend of curvature amount/rad: amount 1 = closed around the stile, smaller = a gentler curl whose circle stays
        # outside the stile (contains it, tangent at the palm contact), so fingers never cut the wood and keep their length
        Re = rad / max(amount, 1e-3)
        th = np.minimum(np.clip(s, 0, None) / Re, math.radians(250))
        r = Re + h
        new = Sn + Re * nn_ + lat[:, None] * un + r[:, None] * (np.cos(th)[:, None] * -nn_ + np.sin(th)[:, None] * fn)
        blend = ss(-.006, .010, s) * (1 - np.clip(tw[idx], 0, 1))
        Pq[idx] = Pin[idx] * (1 - blend[:, None]) + new * blend[:, None]
        return Pq
    WA = float(os.environ.get('WRAP', '1'))
    PB, PB1, PG = wrap(P0, .38 * WA, STILE_R + .003), wrap(P1, .38 * WA, STILE_R + .003), wrap(P0, 1.0 * WA, STILE_R)   # rest: hand laid on the stile; grip: closed (F-030)
    F = [list(p.vertices) for p in o.data.polygons]
    me = bpy.data.meshes.new('body_seated_v3'); me.from_pydata([tuple(p) for p in PB], [], F); me.update()
    so = bpy.data.objects.new('body_seated_v3', me); bpy.context.scene.collection.objects.link(so)
    bpy.context.view_layer.objects.active = so; bpy.ops.object.select_all(action='DESELECT'); so.select_set(True); bpy.ops.object.shade_smooth()
    so.shape_key_add(name='Basis'); so.shape_key_add(name='breath').data.foreach_set('co', PB1.astype(np.float32).ravel())
    so.shape_key_add(name='grip').data.foreach_set('co', PG.astype(np.float32).ravel())
    so.data.attributes.new('_SLICE', 'FLOAT', 'POINT').data.foreach_set('value', SLICE.astype(np.float32))
    # posed electrode sites + outward normals (from the posed basis mesh)
    me.calc_normals_split() if hasattr(me, 'calc_normals_split') else None
    Nv = np.array([v.normal[:] for v in me.vertices])
    electrodes = {k: {'p': [round(float(x), 4) for x in PB[i]], 'n': [round(float(x), 4) for x in Nv[i]], 'v': i} for k, i in site_idx.items()}
    # joints for the inside-body signal paths (heart → electrode), posed
    pb = ar.pose.bones['chest']; Dm = pb.matrix @ pb.bone.matrix_local.inverted()
    hb_ = Dm @ Vector(heart); q = Dm.to_quaternion()
    joints = {}
    for nm in ('upper.L', 'upper.R', 'fore.L', 'fore.R', 'hand.L', 'hand.R', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'foot.L', 'foot.R', 'chest', 'spine'):
        joints[nm] = [round(float(x), 4) for x in ar.pose.bones[nm].head]
    grip_pt = PG[np.where((fw > .5) & (np.linalg.norm(PG - hand_pos, axis=1) < .2))[0]].mean(0)
    out = {'seat': [round(float(x), 4) for x in seat], 'heart_b': [round(x, 4) for x in hb_], 'heart_q_wxyz': [round(x, 5) for x in q],
           'hand_r': [round(float(x), 4) for x in grip_pt], 'electrodes': electrodes, 'joints': joints,
           'stile': {'axis_point': [round(x, 4) for x in A0], 'axis_dir': [round(x, 4) for x in u], 'r': STILE_R, 'dx': STILE_DX},
           'source': f"blender-human-base-meshes GEO-body_male_{SOURCE} (CC0)"}
    for nm in ('rig', 'body_v3', 'ik_t', 'ik_p'):
        if nm in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[nm], do_unlink=True)
    export(so, os.path.join(OUT, 'body_seated_v3.glb'), morphs=True)
    fig_path = os.path.join(OUT, 'figure.json')
    fig = json.load(open(fig_path, encoding='utf-8')); fig['seated_v3'] = out
    with open(fig_path, 'w', encoding='utf-8') as fh: json.dump(fig, fh)
    print('body_seated_v3', len(PB), 'verts', os.path.getsize(os.path.join(OUT, 'body_seated_v3.glb')), 'bytes; seat', out['seat'])
    print('electrodes', {k: v['p'] for k, v in electrodes.items()})


if __name__ == '__main__':
    build(sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None)
