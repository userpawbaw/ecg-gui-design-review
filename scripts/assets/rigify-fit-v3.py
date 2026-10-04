"""Rigify rig for figure v3 (user 2026-10-04: the hand-made 17-bone rig bent the arms oddly — no twist control,
estimated joints, one bone per limb segment). The Rigify human metarig (no face) is fitted to joints measured on the
realistic body (1.666 m, arms relaxed), the rig is generated, and the body is skinned to its DEF bones (upper arm and
forearm split in two, so a wrist turn spreads along the forearm instead of wringing the wrist).

Poses are set through the generated controls: IK hand / foot targets with pole targets for the elbow / knee bend, FK
spine / neck / head, and finger curls by rotating the finger FK controls about their bend axis.
Figure frame: z up, front −y, person's left +x. Used by build-figure-v3.py."""
import math
import numpy as np
import addon_utils, bpy
from mathutils import Vector, Matrix, Quaternion


def measure(V):
    """Joint positions (left side; the body is symmetric) from the rest mesh V (metres, 1.666 m, front −y)."""
    J = dict(
        spine=[(0, .03, .80), (0, .02, .93), (0, .01, 1.05), (0, .01, 1.18), (0, .015, 1.37), (0, .0, 1.42), (0, -.01, 1.47), (0, -.01, 1.666)],
        shoulder=((.02, -.035, 1.365), (.155, .0, 1.37)), upper=(.18, 0, 1.36), elbow=(.29, .0, 1.06), wrist=(.338, -.062, .865),
        hip=(.09, 0, .87), knee=(.095, -.012, .47), ankle=(.10, .0, .085), ball=(.11, -.13, .02), toe=(.115, -.19, .02),
        heel=((.07, .055, 0), (.13, .055, 0)), pelvis=(.11, -.08, .93))
    H = V[(V[:, 0] > .25) & (V[:, 2] < .95)]
    fingers = {}
    for name, (y0, y1), zb in (('f_index', (-.124, -.101), .80), ('f_middle', (-.098, -.076), .80), ('f_ring', (-.073, -.051), .797), ('f_pinky', (-.050, -.030), .79)):
        band = H[(H[:, 1] > y0) & (H[:, 1] < y1) & (H[:, 2] < zb + .01)]
        yc = band[np.abs(band[:, 2] - zb) < .004][:, 1].mean()
        own = band[np.abs(band[:, 1] - yc) < .006]; tip_z = own[:, 2].min()
        def c(z):
            s = band[np.abs(band[:, 2] - z) < .004]; return s.mean(0) if len(s) else None
        base = c(zb); tip = own[np.argmin(own[:, 2])]
        L = zb - tip_z; pts = [base]
        for f in (.45, .75):
            p = c(zb - L * f); pts.append(p if p is not None else base + (tip - base) * f)
        pts.append(tip + (base - tip) * .03)
        fingers[name] = [np.array(p) for p in pts]
    th = H[(H[:, 1] < -.118) & (H[:, 2] < .85)]
    tip = th[np.argmin(th[:, 1])]; cmc = np.array([J['wrist'][0] - .004, -.083, .855])
    fingers['thumb'] = [cmc, cmc + (tip - cmc) * .40, cmc + (tip - cmc) * .72, tip + (cmc - tip) * .04]
    J['fingers'] = fingers
    return J


def build_rig(J, name='rig'):
    """Fit the human metarig to J (mirrored for .R) and generate the Rigify rig. Returns the generated armature object."""
    addon_utils.enable('rigify', default_set=True)
    bpy.ops.object.armature_human_metarig_add()
    meta = bpy.context.object; meta.name = 'metarig'
    bpy.ops.object.mode_set(mode='EDIT'); eb = meta.data.edit_bones
    for b in list(eb):
        if b.name.startswith(('breast', 'face')) or (b.parent and 'face' in [p.name for p in b.parent_recursive]): eb.remove(b)
    zax = {b.name: b.z_axis.copy() for b in eb}; dirs = {b.name: (b.tail - b.head).normalized() for b in eb}
    def put(n, h, t, z_rot=None):
        b = eb[n]; b.head, b.tail = Vector(h), Vector(t)
        R = z_rot if z_rot is not None else dirs[n].rotation_difference((b.tail - b.head).normalized()).to_matrix()
        b.align_roll(R @ zax[n])
    S = J['spine']
    for i, n in enumerate(['spine', 'spine.001', 'spine.002', 'spine.003', 'spine.004', 'spine.005', 'spine.006']):
        put(n, S[i], S[i + 1])
    # metarig hand frame (left) → measured hand frame: one rotation for the palm, fingers and thumb axes
    def frame(d, s):
        d = Vector(d).normalized(); s = (Vector(s) - Vector(s).dot(d) * d).normalized(); return Matrix((d, s, d.cross(s))).transposed()
    mk = sum((eb[f'{f}.01.L'].head for f in ('f_index', 'f_middle', 'f_ring', 'f_pinky')), Vector()) / 4
    Fm = frame(mk - eb['hand.L'].head, eb['f_pinky.01.L'].head - eb['f_index.01.L'].head)
    F = J['fingers']; tk = sum((Vector(F[f][0]) for f in ('f_index', 'f_middle', 'f_ring', 'f_pinky')), Vector()) / 4
    for side, sg in (('L', 1), ('R', -1)):
        M = lambda p: Vector((sg * p[0], p[1], p[2]))
        Ft = frame(M(tk) - M(J['wrist']), M(F['f_pinky'][0]) - M(F['f_index'][0]))
        Rh = Ft @ Fm.inverted() if sg == 1 else None
        if sg == -1:                                                    # mirror of the left rotation for the right hand
            Mx = Matrix.Diagonal((-1, 1, 1)); Rh = Mx @ (Ft_L @ Fm.inverted()) @ Mx
        else: Ft_L = Ft
        put(f'shoulder.{side}', M(J['shoulder'][0]), M(J['shoulder'][1]))
        put(f'upper_arm.{side}', M(J['upper']), M(J['elbow'])); put(f'forearm.{side}', M(J['elbow']), M(J['wrist']))
        put(f'hand.{side}', M(J['wrist']), M(J['wrist']) + (M(tk) - M(J['wrist'])) * .42, Rh)
        for k, f in enumerate(('f_index', 'f_middle', 'f_ring', 'f_pinky')):
            P = [M(p) for p in F[f]]
            put(f'palm.0{k + 1}.{side}', M(J['wrist']) + (P[0] - M(J['wrist'])) * .22 + Vector((0, (P[0] - M(tk)).y * .6, 0)), P[0], Rh)
            for j in range(3): put(f'{f}.0{j + 1}.{side}', P[j], P[j + 1], Rh)
        P = [M(p) for p in F['thumb']]
        for j in range(3): put(f'thumb.0{j + 1}.{side}', P[j], P[j + 1], Rh)
        put(f'pelvis.{side}', S[0], M(J['pelvis']))
        put(f'thigh.{side}', M(J['hip']), M(J['knee'])); put(f'shin.{side}', M(J['knee']), M(J['ankle']))
        put(f'foot.{side}', M(J['ankle']), M(J['ball'])); put(f'toe.{side}', M(J['ball']), M(J['toe']))
        h0, h1 = J['heel']; put(f'heel.02.{side}', M(h0) if sg == 1 else M(h1), M(h1) if sg == 1 else M(h0))
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.pose.rigify_generate()
    rig = bpy.context.view_layer.objects.active
    if rig is meta or rig is None: rig = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o is not meta][0]
    rig.name = name
    meta.hide_render = meta.hide_viewport = True
    return rig, meta


def skin(body, rig):
    bpy.ops.object.mode_set(mode='OBJECT') if bpy.context.object and bpy.context.object.mode != 'OBJECT' else None
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    clean_weights(body, rig)
    n0 = sum(1 for v in body.data.vertices if not v.groups)
    print('  skin: vertices without weights', n0)


def clean_weights(body, rig, margin=.06):
    """Heat weighting leaves stray islands (a thigh vertex weighted to a finger, a flank vertex to the forearm) that show
    as pits once posed. Drop any weight whose bone is more than margin farther from the vertex than the nearest deform
    bone, then renormalise."""
    V = np.array([v.co[:] for v in body.data.vertices])
    bones = [b for b in rig.data.bones if b.use_deform]
    D = np.empty((len(V), len(bones)))
    for k, b in enumerate(bones):
        a, t = np.array(b.head_local), np.array(b.tail_local); d = t - a; L2 = max(d @ d, 1e-12)
        u = np.clip((V - a) @ d / L2, 0, 1); D[:, k] = np.linalg.norm(V - (a + u[:, None] * d), axis=1)
    near = D.min(1); idx = {b.name: k for k, b in enumerate(bones)}
    gi = {g.index: g.name for g in body.vertex_groups}; removed = 0
    for i, v in enumerate(body.data.vertices):
        drop = [g.group for g in v.groups if gi[g.group] in idx and D[i, idx[gi[g.group]]] > near[i] + margin]
        for gidx in drop: body.vertex_groups[gidx].remove([i]); removed += 1
        tot = sum(g.weight for g in v.groups)
        if tot > 0:
            for g in v.groups: g.weight /= tot
    print('  skin: stray weights removed', removed)


class Poser:
    """World-space posing through the generated Rigify controls (armature space = figure frame; the rig is not moved).
    Every turn is a world rotation about the control's own head, so no result depends on control roll conventions."""
    def __init__(self, rig):
        self.rig = rig; self.pb = rig.pose.bones
    def up(self): bpy.context.view_layer.update()
    def reset(self):
        for p in self.pb:
            p.matrix_basis = Matrix.Identity(4)
        for side in 'LR':
            for ctl in (f'upper_arm_parent.{side}', f'thigh_parent.{side}'):
                p = self.pb[ctl]; p['IK_FK'] = 0.0; p['pole_vector'] = True; p['IK_Stretch'] = 0.0
        self.up()
    def M(self, name):
        self.up(); return self.pb[name].matrix.copy()
    def head(self, name): self.up(); return self.pb[name].head.copy()
    def tail(self, name): self.up(); return self.pb[name].tail.copy()
    def set_world(self, name, loc=None, rot3=None):
        p = self.pb[name]; M = self.M(name)
        R = rot3 if rot3 is not None else M.to_3x3()
        p.matrix = Matrix.Translation(Vector(loc) if loc is not None else M.translation) @ R.to_4x4(); self.up()
    def move(self, name, d):
        M = self.M(name); self.set_world(name, M.translation + Vector(d))
    def turn(self, name, deg, axis):
        """World rotation of a control about its head."""
        M = self.M(name); R = Matrix.Rotation(math.radians(deg), 3, Vector(axis).normalized())
        self.set_world(name, M.translation, R @ M.to_3x3())
    def hand_frame(self, side, f, n):
        """hand_ik orientation whose hand axis points along f with the palm facing n."""
        b = self.rig.data.bones[f'hand_ik.{side}']; R0 = b.matrix_local.to_3x3()
        org = self.rig.data.bones[f'ORG-hand.{side}']; f0 = (org.tail_local - org.head_local).normalized()
        n0 = Vector((-1 if side == 'L' else 1, 0, 0))
        return frame(f, n) @ frame(f0, n0).inverted() @ R0
    def arm(self, side, wrist, f, n, pole):
        self.set_world(f'upper_arm_ik_target.{side}', pole)
        self.set_world(f'hand_ik.{side}', wrist, self.hand_frame(side, f, n))
    def leg(self, side, ankle, toe_dir, pole, up=(0, 0, 1)):
        b = self.rig.data.bones[f'foot_ik.{side}']; R0 = b.matrix_local.to_3x3()
        org = self.rig.data.bones[f'ORG-foot.{side}']; t0 = org.tail_local - org.head_local; t0.z = 0
        R = frame(toe_dir, up, True) @ frame(t0, (0, 0, 1), True).inverted() @ R0
        self.set_world(f'thigh_ik_target.{side}', pole)
        self.set_world(f'foot_ik.{side}', ankle, R)
    def palm_normal(self, side):
        org = self.pb[f'ORG-hand.{side}']; b = org.bone; self.up()
        n0 = Vector((-1 if side == 'L' else 1, 0, 0))
        return ((org.matrix.to_3x3() @ b.matrix_local.to_3x3().inverted()) @ n0).normalized()
    def curl(self, side, deg, thumb=0.0, fingers=('f_index', 'f_middle', 'f_ring', 'f_pinky'), spread=None, shares=(.40, .34, .26)):
        """Bend each finger toward the palm: deg is the whole-finger bend, shared .40 / .34 / .26 over the joints."""
        for f in fingers:
            k = deg * (spread[f] if spread else 1.0)
            for j, share in zip((1, 2, 3), shares):
                n = self.palm_normal(side); y = (self.tail(f'ORG-{f}.0{j}.{side}') - self.head(f'ORG-{f}.0{j}.{side}')).normalized()
                ax = y.cross(n)
                if ax.length > 1e-4: self.turn(f'{f}.0{j}.{side}', k * share, ax)
        if thumb:
            for j in (2, 3):
                n = self.palm_normal(side); y = (self.tail(f'ORG-thumb.0{j}.{side}') - self.head(f'ORG-thumb.0{j}.{side}')).normalized()
                ax = y.cross(n)
                if ax.length > 1e-4: self.turn(f'thumb.0{j}.{side}', thumb * .5, ax)

    def wrap_bar(self, side, c, u, Rs, fingers=('f_index', 'f_middle', 'f_ring', 'f_pinky')):
        """Close each finger round a bar (axis point c, direction u): joint by joint, the bend toward the palm is solved
        (bisection) so the joint's tail lies at distance Rs[j] from the axis. Rs grows toward the knuckle because a straight
        phalanx is a chord: its middle comes closer to the bar than its ends."""
        c, u = Vector(c), Vector(u).normalized()
        dist = lambda p: ((p - c) - (p - c).dot(u) * u).length
        for f in fingers:
            for j in (1, 2, 3):
                ctl, org = f'{f}.0{j}.{side}', f'ORG-{f}.0{j}.{side}'
                n = self.palm_normal(side); y = (self.tail(org) - self.head(org)).normalized(); ax = y.cross(n)
                if ax.length < 1e-4: continue
                M0 = self.M(ctl); lo, hi = -20.0, 130.0; R = Rs[j - 1]
                def at(a):
                    R_ = Matrix.Rotation(math.radians(a), 3, ax.normalized())
                    self.set_world(ctl, M0.translation, R_ @ M0.to_3x3()); return dist(self.tail(org))
                if at(lo) < R: at(lo); continue                         # already inside: leave straight-ish
                for _ in range(14):
                    mid = (lo + hi) / 2
                    if at(mid) > R: lo = mid
                    else: hi = mid
                at(lo)


def frame(d, s, flat=False):
    """Rotation whose columns are d, s (orthogonalised against d) and d × s."""
    d = Vector(d).normalized(); s = Vector(s); s = (s - s.dot(d) * d).normalized()
    return Matrix((d, s, d.cross(s))).transposed()
