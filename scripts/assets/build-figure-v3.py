"""R1 figure v3 (D-048 / D-050): realistic body (Blender Studio "Human Base Meshes" v1.0.0, CC0, candidate A) with a
mannequin head made from A's own head (head-vol-v3.py, user 2026-10-04 option B), a Rigify rig (rigify-fit-v3.py, user
2026-10-04: the earlier hand-made 17-bone rig bent the arms oddly), 3-lead ECG electrode sites (RA, LA, LL on the torso).

Poses (D-050 relocation, user reference images 2026-10-04):
  floor  first appearance: on the floor at the ladder foot; right knee up with the right forearm across it, the hand
         hanging past the knee; left leg folded flat, left hand on the ankle; head down
  chair  measurement starts: armchair beside the ECG cart, hands on the thighs (seat height = the chair's measured seat)
  desk   power-line scene: on the stool, hands on the keyboard
  wall   baseline wander: standing, back against the wall under the window, face up to the light
  climb  muscle artifact: on the ladder, hand over hand on the rungs (right high, left at the chest), left knee raised with
         the foot on rung 1, right foot on rung 0, looking up
Each pose is set with IK hand / foot targets plus pole targets (elbow / knee bend direction) and an explicit hand
orientation, then baked to its own mesh with shape keys breath (+ grip for climb: fingers squeeze the rungs).

The D-046 ladder seat (body_seated_v3.glb, figure.json "seated_v3") is no longer rebuilt here; the current web build keeps
the file made by the previous rig (git history) until brief 3 switches it to the D-050 poses.

Outputs (prototype/v2/src/story/intro/assets/): body_v3_<pose>.glb, figure.json "poses_v3".
Run: python scripts/assets/build-figure-v3.py   (bpy 4.5 with Rigify, numpy, scipy, scikit-image)
  env POSES=floor,climb   build only these;  CHAIR_SEAT_H=0.43   chair seat height (build_archive prints it)
"""
import importlib.util, json, math, os, sys
import numpy as np
import bpy
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
def _load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
bif = _load('bif', 'build-intro-figure.py'); hv = _load('hv', 'head-vol-v3.py'); rf = _load('rf', 'rigify-fit-v3.py')
pc = _load('pc', 'pose-check-v3.py')          # pose validator (skill pose-anatomy)
ss, verts, set_verts, apply_mod, breath_key, export = bif.ss, bif.verts, bif.set_verts, bif.apply_mod, bif.breath_key, bif.export
SRC, OUT, TARGET_H = bif.SRC, bif.OUT, bif.TARGET_H
CACHE = os.path.join(SRC, 'blender-human-base-meshes', 'head_sdf_A.npz')   # assets/source is not committed

LAD_TAN = math.tan(math.radians(14))              # archive ladder lean (scripts/blender/build_archive.py)
RUNG_DZ, RUNG_R = 0.29, 0.019                     # r2 ladder: round rungs every 29 cm
SEAT_H = {'chair': float(os.environ.get('CHAIR_SEAT_H', .43)), 'desk': .50}

# 3-lead monitoring placement (user 2026-10-03): RA / LA under the collarbones, LL on the left lower abdomen.
# Source units (1.8 m body): ray origin → target, the closest surface hit is the site.
SITES3 = {'RA': ((-.115, -.6, 1.41), (-.115, 0, 1.41)), 'LA': ((.115, -.6, 1.41), (.115, 0, 1.41)), 'LL': ((.10, -.6, 1.06), (.10, 0, 1.06))}


def body_mesh():
    """A with the mannequin head, arms relaxed, voxel remeshed, decimated, scaled to TARGET_H. Returns (object, K)."""
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, 'blender-human-base-meshes', 'human_base_meshes_bundle.blend'))
    o = bpy.data.objects['GEO-body_male_realistic']; eyes = [bpy.data.objects[f'GEO-body_male_realistic.eye.{s}'] for s in 'LR']
    for x in list(bpy.data.objects):
        if x is not o and x not in eyes: bpy.data.objects.remove(x, do_unlink=True)
    off = o.location.copy()
    for x in [o] + eyes: x.animation_data_clear(); x.location = x.location - off
    for m in list(o.modifiers): apply_mod(o, m)
    o.vertex_groups.clear()
    if o.data.shape_keys: o.shape_key_clear()
    if os.path.exists(CACHE):
        z = np.load(CACHE); D, ax = z['D'], (z['x'], z['y'], z['z'])
    else:
        dg = bpy.context.evaluated_depsgraph_get()
        D, ax = hv.sdf_grid([BVHTree.FromObject(x, dg) for x in [o] + eyes]); np.savez(CACHE, D=D, x=ax[0], y=ax[1], z=ax[2])
    for e in eyes: bpy.data.objects.remove(e, do_unlink=True)
    hvv, hf = hv.mannequin(D, ax, r_open=3, sigma_face=2.5)                 # variant B2 (verification/r1-head-20261004)
    set_verts(o, bif.relax_arms(verts(o)))
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > hv.CUT_Z], context='VERTS'); bm.to_mesh(o.data); bm.free()
    me = bpy.data.meshes.new('head'); me.from_pydata([tuple(p) for p in hvv], [], [tuple(t) for t in hf]); me.update()
    h = bpy.data.objects.new('head', me); bpy.context.scene.collection.objects.link(h)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); h.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.join()
    r = o.modifiers.new('vox', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .0032; apply_mod(o, r)
    vg = o.vertex_groups.new(name='seam'); zc, zw = hv.CUT_Z, .03
    for i, v in enumerate(o.data.vertices):
        if zc - zw < v.co.z < zc + zw: vg.add([i], float(1 - abs(v.co.z - zc) / zw), 'REPLACE')
    sm = o.modifiers.new('relax', 'SMOOTH'); sm.factor = .6; sm.iterations = 6; sm.vertex_group = 'seam'; apply_mod(o, sm)
    o.vertex_groups.clear()
    dec = o.modifiers.new('dec', 'DECIMATE'); dec.ratio = .2; apply_mod(o, dec)
    V = verts(o); V[:, 2] -= V[:, 2].min(); K = TARGET_H / V[:, 2].max(); V *= K; set_verts(o, V)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth()
    for name in ('sharp_edge', 'sharp_face'):
        if name in o.data.attributes: o.data.attributes.remove(o.data.attributes[name])
    o.name = 'body_v3'
    return o, K


def slice_coord(o, rig):
    """H3b ring coordinate: per vertex, the weighted distance along the deform-bone chain from the pelvis."""
    bones = {b.name: b for b in rig.data.bones if b.use_deform}
    off = {}
    def offset(b):
        if b.name in off: return off[b.name]
        p = b.parent
        while p is not None and p.name not in bones: p = p.parent
        if p is None: off[b.name] = .80
        else:
            d = (p.tail_local - p.head_local).normalized()
            off[b.name] = offset(p) + float((b.head_local - p.head_local) @ d)
        return off[b.name]
    for b in bones.values(): offset(b)
    gi = {g.index: g.name for g in o.vertex_groups}; V = verts(o)
    acc = np.zeros(len(V)); ws = np.zeros(len(V))
    for i, v in enumerate(o.data.vertices):
        for g in v.groups:
            n = gi.get(g.group)
            if n in bones and g.weight > 0:
                b = bones[n]; d = Vector((0, 0, 1)) if n == 'DEF-spine' else (b.tail_local - b.head_local).normalized()
                acc[i] += g.weight * (off[n] + float((Vector(V[i]) - b.head_local) @ d)); ws[i] += g.weight
    return np.where(ws > 0, acc / np.maximum(ws, 1e-6), V[:, 2])


RIG_CACHE = os.path.join(SRC, 'blender-human-base-meshes', 'figure_v3_rig_cache.blend')


def build():
    if os.environ.get('REUSE') and os.path.exists(RIG_CACHE):          # pose iteration: skip head, remesh, rig and weights
        bpy.ops.wm.open_mainfile(filepath=RIG_CACHE)
        o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']
        site_idx = json.loads(o['site_idx']); heart = Vector(o['heart'])
        if os.environ.get('CLEAN'): rf.clean_weights(o, rig)
        SLICE = np.zeros(len(o.data.vertices), np.float32); o.data.attributes['_SLICE_rest'].data.foreach_get('value', SLICE)
    else:
        o, K = body_mesh()
        o.shape_key_add(name='Basis'); sk = o.shape_key_add(name='breath')
        sk.data.foreach_set('co', (verts(o) + breath_key(verts(o) / K) * K).astype(np.float32).ravel())
        Vr = verts(o)
        zh = .715 * TARGET_H                                                 # heart: behind the sternum, 4th–5th rib, a little left
        ring = Vr[(np.abs(Vr[:, 2] - zh) < .01) & (np.abs(Vr[:, 0]) < .05)]
        heart = Vector((.025, ring[:, 1].min() + .075, zh))
        bvh = BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get()); site_idx = {}
        for nm, (a, b) in SITES3.items():
            a, b = Vector(a) * K, Vector(b) * K; hit = bvh.ray_cast(a, (b - a).normalized())
            site_idx[nm] = int(np.argmin(np.linalg.norm(Vr - np.array(hit[0]), axis=1)))
        J = rf.measure(Vr)
        rig, meta = rf.build_rig(J)
        if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
        rf.skin(o, rig)
        SLICE = slice_coord(o, rig).astype(np.float32)
        o['site_idx'] = json.dumps(site_idx); o['heart'] = list(heart)
        o.data.attributes.new('_SLICE_rest', 'FLOAT', 'POINT').data.foreach_set('value', SLICE)
        bpy.ops.wm.save_as_mainfile(filepath=RIG_CACHE)
    if 'csmooth' not in o.modifiers:                                         # skinning creases (back, flanks when an arm goes overhead)
        cs = o.modifiers.new('csmooth', 'CORRECTIVE_SMOOTH'); cs.factor = .5; cs.iterations = 8; cs.rest_source = 'ORCO'
        cs.smooth_type = 'SIMPLE'
    F = [list(p.vertices) for p in o.data.polygons]
    P = rf.Poser(rig)
    E = np.array([e.vertices[:] for e in o.data.edges]); TRI = np.array([[f[0], f[k], f[k + 1]] for f in F for k in range(1, len(f) - 1)])
    DEG = np.bincount(E.ravel(), minlength=len(o.data.vertices))[:, None]

    def untangle(A, ref=None, iters=12):
        """Tight bends (fingers, knee against the thigh, elbow) fold a few hundred skinned triangles over, which shade as
        dark pits. Relax only the vertices of faces whose normal turned against their neighbourhood (plus one ring)."""
        B = A if ref is None else ref
        n = np.cross(B[TRI[:, 1]] - B[TRI[:, 0]], B[TRI[:, 2]] - B[TRI[:, 0]]); n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-15
        vn = np.zeros_like(B); [np.add.at(vn, TRI[:, k], n) for k in range(3)]
        m = vn[TRI].sum(1); m /= np.linalg.norm(m, axis=1, keepdims=True) + 1e-15
        bad = np.zeros(len(B), bool); bad[TRI[(n * m).sum(1) < .2].ravel()] = True
        ring = bad.copy(); ring[E[bad[E[:, 0]], 1]] = True; ring[E[bad[E[:, 1]], 0]] = True
        out = A.copy()
        for _ in range(iters):
            acc = np.zeros_like(out); np.add.at(acc, E[:, 0], out[E[:, 1]]); np.add.at(acc, E[:, 1], out[E[:, 0]])
            out[ring] = (acc / np.maximum(DEG, 1))[ring]
        return out, int(ring.sum())
    X = Vector((1, 0, 0))
    y0, z0 = -.13, -RUNG_R                                                   # rung 0 under the right foot's ball (figure frame)

    def evaluated(breath=0.0):
        o.data.shape_keys.key_blocks['breath'].value = breath; bpy.context.view_layer.update()
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
        A = np.array([v.co[:] for v in me.vertices]); ev.to_mesh_clear(); return A

    def sit(h, lean=0.0, dy=0.0):
        """Lower the torso so the sitting bones rest on a seat of height h (hip joint ≈ 9.5 cm above the seat)."""
        hz = P.head('ORG-thigh.L').z
        P.move('torso', (0, dy, h + .095 - hz))
        if lean: P.turn('torso', lean, X)

    def reach(side, target, what):
        """Skill pose-anatomy step 3: compare the shoulder → target distance with the arm length before solving."""
        rb_ = rig.data.bones; L = rb_[f'ORG-upper_arm.{side}'].length + rb_[f'ORG-forearm.{side}'].length
        d = (Vector(target) - P.head(f'ORG-upper_arm.{side}')).length
        print(f'   reach {side} {what}: {d:.3f} m of {L:.3f} m arm ({d / L * 100:.0f} %)')
        return d / L

    def pose_floor():
        """User reference images 2026-10-05 (verification/r1-rigify-20261004/floor_ref_*): sitting on the floor, back to the
        shelf; right knee up, foot flat in front; the right forearm lies across the knee top, the hand hangs past it;
        left leg folded flat, its foot tucked in front; the left hand rests on the left shin by the ankle; head down-right."""
        sit(0.0, lean=-28)                                                      # floor sitting rolls the pelvis back (posterior tilt)
        P.turn('chest', 34, X); P.turn('chest', 7, (0, 1, 0))                    # chest brought forward again; left shoulder dropped to the left hand
        P.turn('neck', 28, X); P.turn('head', 40, X); P.turn('head', -22, (0, 0, 1)); P.turn('head', 10, (0, 1, 0))   # head down, turned and tilted right
        P.leg('R', (-.15, -.36, .085), (-.05, -1, 0), (-.2, -1.3, 1.3))                          # right knee up high, foot flat close in
        # left leg folded flat (cross-legged half): solve the knee and ankle from the measured norm for cross-legged sitting —
        # hip flexion 88°, abduction 29°, external rotation 62° (BMC Musculoskelet Disord 2021) — then hand them to the IK
        Dp = P.pb['ORG-spine'].matrix.to_3x3().normalized() @ rig.data.bones['ORG-spine'].matrix_local.to_3x3().normalized().inverted()
        hipL = P.head('ORG-thigh.L'); LT, LS = rig.data.bones['ORG-thigh.L'].length, rig.data.bones['ORG-shin.L'].length
        def fold(fl_, ab_, er_, kf_=148):
            fl, ab, er, kf = map(math.radians, (fl_, ab_, er_, kf_))
            tl = Vector((math.sin(ab), -math.sin(fl) * math.cos(ab), -math.cos(fl) * math.cos(ab))).normalized()
            nX = Vector((1, 0, 0)).cross(tl).normalized(); pl = nX * math.cos(er) - tl.cross(nX) * math.sin(er)   # left: sg = +1
            sl = (tl * math.cos(kf) + pl * math.sin(kf)).normalized()
            k_ = hipL + (Dp @ tl) * LT; return k_, k_ + (Dp @ sl) * LS, Dp @ sl
        # inside the measured ranges, pick the fold nearest the means whose ankle and knee rest on the floor (z ≈ 0.07 / ≤ 0.14)
        best = min(((abs(fl_ - 88) / 23 + abs(ab_ - 29) / 17 + abs(er_ - 62) / 20 + abs(fold(fl_, ab_, er_)[1].z - .085) / .01
                     + max(0, fold(fl_, ab_, er_)[0].z - .14) / .01, fl_, ab_, er_)
                    for fl_ in range(62, 106, 4) for ab_ in range(12, 46, 4) for er_ in range(40, 80, 4)))
        print('   left fold (flex, abd, ext rot):', best[1:], 'score', round(best[0], 2))
        kneeL, ankL, sdir = fold(*best[1:])
        print('   left fold: knee', tuple(round(v, 3) for v in kneeL), 'ankle', tuple(round(v, 3) for v in ankL))
        tdir = Vector((sdir.x, sdir.y, 0)).normalized() * .6 + Vector((0, -.8, 0))          # toes forward-in, sole near the floor
        P.leg('L', ankL, Vector((tdir.x, tdir.y, 0)), kneeL + (kneeL - hipL) * .8, up=(.25, 0, 1))
        rb = rig.data.bones; L1 = rb['ORG-upper_arm.R'].length; L2 = rb['ORG-forearm.R'].length
        K = P.head('ORG-shin.R'); top = K + Vector((0, -.02, .055))             # knee cap top surface
        E = top + Vector((-.035, .07, .065))                                    # elbow just outside and behind the knee top (refs)
        fd = (top + Vector((-.03, -.05, .02)) - E).normalized()                  # forearm passes over the knee top, forward and a little down
        for _ in range(12):                                                     # skill rule: fit the torso to the contact, not the target
            S = P.head('ORG-upper_arm.R'); dd = (E - S).length
            if dd > L1 * .98: P.turn('chest', 2, X)                             # too far: lean in
            elif dd < L1 * .93: P.turn('chest', -2, X)                          # too close: sit up
            else: break
        if (E - S).length > L1 * .98: E = S + (E - S).normalized() * L1 * .98
        print('   floor R elbow on the knee: |S-E|', round((E - S).length, 3), 'of', round(L1, 3))
        W = E + fd * L2 * .98
        reach('R', W, 'wrist past the knee')
        u_ = (W - S).normalized(); foot = S + u_ * (E - S).dot(u_)               # pole straight out from the S–W line through the wanted elbow
        P.arm_relaxed('R', W, None, E + ((E - foot) + Vector((-.25, .3, -.5))).normalized() * .5, flex=55, dev=22, pronation=55)   # prior: elbow points down-back-out
        fa_ = (P.tail('ORG-forearm.R') - P.head('ORG-forearm.R')).normalized(); hd_ = (P.tail('ORG-hand.R') - P.head('ORG-hand.R')).normalized()
        print('   floor R hand: forearm', tuple(round(v, 2) for v in fa_), 'hand', tuple(round(v, 2) for v in hd_), 'palm', tuple(round(v, 2) for v in P.palm_normal('R')),
              'finger tip', tuple(round(v, 2) for v in P.tail('ORG-f_middle.03.R')), 'wrist', tuple(round(v, 2) for v in P.head('ORG-hand.R')))
        print('   floor R elbow: wanted', tuple(round(v, 3) for v in E), 'got', tuple(round(v, 3) for v in P.head('ORG-forearm.R')))
        shin_L = P.head('ORG-foot.L').lerp(P.head('ORG-shin.L'), .22)            # left shin just above the ankle
        WL = shin_L + Vector((.0, -.01, .10))
        reach('L', WL, 'hand on the left shin')
        P.arm_relaxed('L', WL, None, P.head('ORG-upper_arm.L') + Vector((.7, .25, -.3)), flex=10, pronation=50)
        P.curl('R', 50, thumb=15); P.curl('L', 55, thumb=20)
        hf = (P.pb['ORG-spine.006'].matrix.to_3x3().normalized() @ rig.data.bones['ORG-spine.006'].matrix_local.to_3x3().normalized().inverted()) @ Vector((0, -1, 0))
        print('   floor face direction', tuple(round(v, 2) for v in hf), '(want down-right: x<0, z<0)')

    def pose_chair():
        h = SEAT_H['chair']; sit(h, lean=-7, dy=.02)
        P.turn('neck', 6, X); P.turn('head', 4, X)
        for s, sg in (('L', 1), ('R', -1)):
            P.leg(s, (sg * .12, -.43, .11), (sg * .05, -1, -.25), (sg * .12, -1.5, h + .2))       # heels up a little: thighs clear the raised seat front (0.449 m)
            th = P.head(f'ORG-thigh.{s}').lerp(P.head(f'ORG-shin.{s}'), .62)       # hands rest on the thigh top, 62 % toward the knee
            P.arm_relaxed(s, th + Vector((sg * .01, .05, .105)), None, (sg * .55, .45, h + .45), flex=-22, dev=-30, pronation=72)   # hand laid along the thigh
            P.curl(s, 40, thumb=10)

    def pose_desk():
        h = SEAT_H['desk']; sit(h, lean=9)
        P.turn('neck', 8, X); P.turn('head', 6, X)
        for s, sg in (('L', 1), ('R', -1)):
            P.leg(s, (sg * .12, -.22, .27), (sg * .06, -1, -.5), (sg * .14, -1.5, h + .3))        # feet on the stool's foot rung (high stool): thighs level
            P.arm_relaxed(s, (sg * .12, -.40, .80), None, (sg * .7, .1, .45), flex=-8, pronation=70)   # typing: palms down, wrists level
            P.curl(s, 35, thumb=8)

    def pose_wall():
        P.move('torso', (0, .03, -.01)); P.turn('torso', -4, X)
        P.turn('chest', -5, X); P.turn('neck', -10, X); P.turn('head', -14, X)
        for s, sg in (('L', 1), ('R', -1)):
            P.leg(s, (sg * .12, -.10, .085), (sg * .15, -1, 0), (sg * .15, -1.5, .5))
            P.arm(s, (sg * .26, .07, .84), Vector((sg * .08, .08, -1)), Vector((-sg, .3, 0)), (sg * .4, 1.0, 1.1))
            P.curl(s, 30, thumb=8)

    def rung(m, x):
        z = z0 + m * RUNG_DZ; return Vector((x, y0 - (z - z0) * LAD_TAN, z))

    def grip_at(side, c, curl, thumb, out=.9):
        """Hand over a horizontal rung (centre c): fingers point up-forward over the top, palm toward the rung."""
        f = Vector((0, -.55, 1)).normalized(); n = Vector((0, -1, -.25)); n = (n - n.dot(f) * f).normalized()
        rb = rig.data.bones                                                  # wrist → middle knuckle (MCP) at rest
        Lp = (rb[f'ORG-f_middle.01.{side}'].head_local - rb[f'ORG-hand.{side}'].head_local).length
        mcp = c - n * (RUNG_R + .015)                                        # knuckle 15 mm off the rung surface
        wrist = mcp - f * Lp
        sh = P.head(f'ORG-upper_arm.{side}'); sg = 1 if side == 'L' else -1
        P.arm(side, wrist, f, n, sh + Vector((sg * out, .2, -.05)))
        for _ in range(3):                                                   # hand half way between the forearm and 'over the top' (wrist in range)
            fa = (P.tail(f'ORG-forearm.{side}') - P.head(f'ORG-forearm.{side}')).normalized()
            f = (fa + Vector((0, -.55, 1)).normalized()).normalized(); n = Vector((0, -.75, -.65)); n = (n - n.dot(f) * f).normalized()
            mcp = c - n * (RUNG_R + .015); wrist = mcp - f * Lp
            P.arm(side, wrist, f, n, sh + Vector((sg * out, .25, -.2)))          # elbow out: the shoulder shares the overhand turn
        print('   wrist', side, 'target', tuple(round(v, 3) for v in wrist), 'got', tuple(round(v, 3) for v in P.head(f'ORG-hand.{side}')),
              'mcp target', tuple(round(v, 3) for v in mcp), 'got', tuple(round(v, 3) for v in P.head(f'ORG-f_middle.01.{side}')))
        b = RUNG_R + curl                                                    # finger axis ≈ r + 9 mm (squeeze r + 6 mm) at mid-phalanx
        P.wrap_bar(side, c, (1, 0, 0), (b + .006, b + .004, b + .003), fingers=('f_index', 'f_middle'))
        P.curl(side, 150, fingers=('f_ring', 'f_pinky'), shares=(.265, .44, .295))   # ring and pinky follow the wrapped pair
        P.curl(side, 0, thumb=thumb)

    def pose_climb(squeeze=False):
        P.move('torso', (0, -.04, 0)); P.turn('chest', 4, X); P.turn('neck', -14, X); P.turn('head', -26, X)
        P.leg('R', (-.11, .0, .085), (-.05, -1, 0), (-.15, -1.5, .5))                            # right sole on rung 0
        c1 = rung(1, .11)
        P.leg('L', c1 + Vector((0, .115, .105)), (.05, -1, -.3), (.25, -1.4, 1.1))             # left foot up on rung 1 (toes a little down)
        k = .006 if squeeze else .009
        grip_at('R', rung(6, -.16), k, 22); grip_at('L', rung(5, .16), k, 22, out=.55)

    # validator specs: floor / seat surfaces, intended contacts (part, part | 'floor' | point, tolerance m), accepted WARNs
    def seat_rect(h, front=.19, back=.16, half=.2): return dict(h=h, rect=(-half, half, -front, back))   # seat footprint round the buttock contact (y ≈ 0)
    CHECK = {
        'floor': dict(floor_z=0.0, contacts=[('fore.R', 'shin.R', .03), ('hand.L', 'shin.L', .03), ('foot.R', 'floor', .03), ('shin.L', 'floor', .03)],
                      override={'hip.L rotation external': (82, 70, 'cross-legged norm 62 (38–82)'), 'hip.L abduction': (46, 35, 'cross-legged norm 29 (10–46)')},
                      allow_warn=('knee.L flexion', 'ankle.L')),
        'chair': dict(floor_z=0.0, seat=seat_rect(SEAT_H['chair']), contacts=[('hand.L', 'thigh.L', .03), ('hand.R', 'thigh.R', .03), ('foot.L', 'floor', .03), ('foot.R', 'floor', .03)]),
        'desk': dict(floor_z=0.0, seat=seat_rect(SEAT_H['desk'], .15, .15, .15), contacts=[]),       # feet on the stool rung (scene check)
        'wall': dict(floor_z=0.0, balance=True, supports=[(0, .22, 1.0)], contacts=[('foot.L', 'floor', .03), ('foot.R', 'floor', .03)]),
        'climb': dict(contacts=[]),
    }
    CHECK_DIR = os.path.normpath(os.path.join(HERE, '..', '..', 'verification', 'pose-check')); os.makedirs(CHECK_DIR, exist_ok=True)
    fails = {}
    P.reset(); pc.report(pc.check(rig, None, {}), 'rest (sanity: every row should be OK)')
    POSES = {'floor': ('seat', pose_floor), 'chair': ('seat', pose_chair), 'desk': ('seat', pose_desk),
             'wall': ('feet', pose_wall), 'climb': ('feet', pose_climb)}
    results = {}
    for pname, (anchor_kind, fn) in POSES.items():
        if os.environ.get('POSES') and pname not in os.environ['POSES'].split(','): continue
        print('pose', pname)
        PG = None
        if pname == 'climb':
            P.reset(); pose_climb(squeeze=True); PG = evaluated(0.0)
        P.reset(); fn()
        P0, P1 = evaluated(0.0), evaluated(1.0)
        rows = pc.check(rig, P0, CHECK.get(pname, {}))
        n = pc.report(rows, pname, os.path.join(CHECK_DIR, f'{pname}.json'))
        if n['FAIL']: fails[pname] = [r['name'] for r in rows if r['status'] == 'FAIL']
        P0u, nr = untangle(P0); P1, _ = untangle(P1, ref=P0)
        if PG is not None: PG, _ = untangle(PG)
        P0 = P0u; print('   untangled', nr, 'vertices')
        if pname == 'climb':                                                 # grip check: finger joints vs the rung axes
            for side, m, x in (('R', 6, -.16), ('L', 4, .16)):
                c = rung(m, x)
                for f in ('f_index', 'f_middle', 'thumb'):
                    mid = lambda j: (P.tail(f'ORG-{f}.0{j}.{side}') + P.head(f'ORG-{f}.0{j}.{side}')) / 2 - c
                    ds = [round(math.hypot(mid(j).y, mid(j).z), 3) for j in (1, 2, 3)]
                    m0 = P.head(f'ORG-{f}.01.{side}') - c
                    print('   grip', side, f, 'mcp→axis', round(math.hypot(m0.y, m0.z), 3), 'phalanx middle→rung axis', ds)
        if anchor_kind == 'seat':                                            # lowest point of the buttocks (not a heel)
            hy = P.head('ORG-thigh.L').y
            bt = P0[(np.abs(P0[:, 0]) < .14) & (P0[:, 1] > hy - .05) & (P0[:, 1] < hy + .18)]
            anchor = bt[np.argmin(bt[:, 2])].copy()
            anchor[0] = (P.head('ORG-thigh.L').x + P.head('ORG-thigh.R').x) / 2   # centred between the sitting bones
        else:
            anchor = P0[np.argmin(P0[:, 2])]
        me = bpy.data.meshes.new(f'body_v3_{pname}'); me.from_pydata([tuple(p) for p in P0], [], F); me.update()
        so = bpy.data.objects.new(f'body_v3_{pname}', me); bpy.context.scene.collection.objects.link(so)
        if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
        bpy.context.view_layer.objects.active = so; bpy.ops.object.select_all(action='DESELECT'); so.select_set(True); bpy.ops.object.shade_smooth()
        so.shape_key_add(name='Basis'); so.shape_key_add(name='breath').data.foreach_set('co', P1.astype(np.float32).ravel())
        if PG is not None: so.shape_key_add(name='grip').data.foreach_set('co', PG.astype(np.float32).ravel())
        so.data.attributes.new('_SLICE', 'FLOAT', 'POINT').data.foreach_set('value', SLICE.astype(np.float32))
        Nv = np.array([v.normal[:] for v in me.vertices])
        electrodes = {k: {'p': [round(float(x), 4) for x in P0[i]], 'n': [round(float(x), 4) for x in Nv[i]], 'v': i, 'torso': True}
                      for k, i in site_idx.items()}
        cb = P.pb['DEF-spine.003']; bpy.context.view_layer.update(); Dm = cb.matrix @ cb.bone.matrix_local.inverted()
        hb_ = Dm @ heart; q = Dm.to_quaternion()
        JN = {'upper.L': 'ORG-upper_arm.L', 'upper.R': 'ORG-upper_arm.R', 'fore.L': 'ORG-forearm.L', 'fore.R': 'ORG-forearm.R',
              'hand.L': 'ORG-hand.L', 'hand.R': 'ORG-hand.R', 'thigh.L': 'ORG-thigh.L', 'thigh.R': 'ORG-thigh.R', 'shin.L': 'ORG-shin.L',
              'shin.R': 'ORG-shin.R', 'foot.L': 'ORG-foot.L', 'foot.R': 'ORG-foot.R', 'chest': 'ORG-spine.003', 'spine': 'ORG-spine.001'}
        joints = {k: [round(float(x), 4) for x in P.head(v)] for k, v in JN.items()}
        out = {'anchor': [round(float(x), 4) for x in anchor], 'anchor_kind': anchor_kind, 'seat': [round(float(x), 4) for x in anchor],
               'heart_b': [round(x, 4) for x in hb_], 'heart_q_wxyz': [round(x, 5) for x in q], 'electrodes': electrodes, 'joints': joints,
               'keys': ['breath'] + (['grip'] if PG is not None else []), 'rig': 'rigify',
               'source': 'blender-human-base-meshes GEO-body_male_realistic (CC0), mannequin head B2'}
        if pname in SEAT_H: out['seat_h'] = SEAT_H[pname]
        if pname == 'climb':
            out['hand_r'] = [round(float(x), 4) for x in P.head('ORG-f_middle.01.R')]
            out['stile'] = {'axis_point': [round(float(x), 4) for x in rung(6, 0)], 'axis_dir': [1, 0, 0], 'r': RUNG_R, 'dx': .24,
                            'plane_y0': round(y0, 4), 'feet_z': round(z0, 4), 'rung0': [0, round(y0, 4), round(z0, 4)], 'rung_dz': RUNG_DZ}
        fname = f'body_v3_{pname}.glb'
        export(so, os.path.join(OUT, fname), morphs=True)
        bpy.data.objects.remove(so, do_unlink=True)
        results[pname] = out
        print('  ', fname, os.path.getsize(os.path.join(OUT, fname)), 'bytes; anchor', out['anchor'], flush=True)
    if fails and not os.environ.get('POSE_ALLOW_FAIL'):
        print('POSE CHECK FAILED — not writing figure.json:', fails); sys.stdout.flush(); os._exit(2)
    fig_path = os.path.join(OUT, 'figure.json')
    fig = json.load(open(fig_path, encoding='utf-8'))
    fig.setdefault('poses_v3', {}).update(results)
    with open(fig_path, 'w', encoding='utf-8') as fh: json.dump(fig, fh)
    if '--save' in sys.argv: bpy.ops.wm.save_as_mainfile(filepath=sys.argv[sys.argv.index('--save') + 1])


if __name__ == '__main__':
    build()
    os._exit(0)                                                              # bpy + Rigify hang on interpreter shutdown
