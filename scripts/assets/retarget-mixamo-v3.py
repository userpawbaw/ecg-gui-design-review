"""Mixamo animation → the v3 figure's Rigify rig (user 2026-10-08: intro climbs the ladder, then sits on the floor to its right;
REVIEW-R1-WEB-20261008 §3-1). The Mixamo FBX stays outside the repository (Adobe terms: no redistribution of the raw files);
only poses baked onto our own mesh are kept.

Retarget per mapped bone, parents first (world frames, so the Mixamo T-pose rest and our relaxed A-pose rest need not match):
  delta   = R_mixamo(pose) · R_mixamo(rest)⁻¹          the Mixamo bone's world rotation since its rest
  R_T     = swing(our rest axis → Mixamo rest axis) · R_ours(rest)   our bone brought to the Mixamo T-pose direction first
  target  = delta · R_T                                  (applying delta to our A-pose rest twisted the shoulders −110°)
  swing   = shortest rotation taking target's bone axis onto the Mixamo bone's posed direction (limbs, fingers): removes
            the rest-pose difference left in the direction, keeps delta's twist
The FK control is then set so that its ORG bone gets `target` (Rigify FK controls share their ORG bone's rest frame up to a
fixed offset, which is carried over). Arms and legs are switched to FK. The torso takes the hip translation scaled by the
height ratio; a floor pose is then lowered until the lowest skin point touches the floor.
Run: python scripts/assets/retarget-mixamo-v3.py <fbx> <frame> <out_dir> [floor|free]
Output: <out_dir>/<name>_f<frame>_{front,side}.png (clay), pose-check JSON, and the evaluated mesh as .npy for later export.
"""
import importlib.util, json, math, os, sys
import numpy as np, bpy
from mathutils import Vector, Matrix, Quaternion
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
def _load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
rf = _load('rf', 'rigify-fit-v3.py'); pc = _load('pc', 'pose-check-v3.py')
FBX, FRAME, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]; MODE = sys.argv[4] if len(sys.argv) > 4 else 'free'
NAME = os.environ.get('NAME', os.path.splitext(os.path.basename(FBX))[0].split('-')[-1])
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']; P = rf.Poser(rig)
before = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=FBX)
new = [x for x in bpy.data.objects if x not in before]; mx = [x for x in new if x.type == 'ARMATURE'][0]
for x in new:
    if x.type == 'MESH': x.hide_render = True; x.hide_viewport = True     # the Mixamo Alpha mesh is never used
sc = bpy.context.scene

def mrest(name):                                                       # Mixamo bone rest frame in world
    b = mx.data.bones['mixamorig:' + name]; M = mx.matrix_world @ b.matrix_local
    return M.to_3x3().normalized(), (mx.matrix_world @ b.head_local), (mx.matrix_world @ b.tail_local)
def mpose(name):
    b = mx.pose.bones['mixamorig:' + name]; M = mx.matrix_world @ b.matrix
    return M.to_3x3().normalized(), (mx.matrix_world @ b.head), (mx.matrix_world @ b.tail)

P.reset()
for side in 'LR':
    for ctl in (f'upper_arm_parent.{side}', f'thigh_parent.{side}'): P.pb[ctl]['IK_FK'] = 1.0   # FK
P.up()
sc.frame_set(FRAME); bpy.context.view_layer.update()

S = {'L': 'Left', 'R': 'Right'}
MAP = [('torso', 'ORG-spine', 'Hips', False),                      # the spine bend is spread over the FK spine (one chest
       ('spine_fk.001', 'ORG-spine.001', 'Spine', False), ('spine_fk.002', 'ORG-spine.002', 'Spine1', False),   # control
       ('spine_fk.003', 'ORG-spine.003', 'Spine2', False),            # put it all in one joint and tore the back skin)
       ('neck', 'ORG-spine.004', 'Neck', False), ('head', 'ORG-spine.006', 'Head', False)]
for s in 'LR':
    X = S[s]
    MAP += [(f'shoulder.{s}', f'ORG-shoulder.{s}', f'{X}Shoulder', True),
            (f'upper_arm_fk.{s}', f'ORG-upper_arm.{s}', f'{X}Arm', True), (f'forearm_fk.{s}', f'ORG-forearm.{s}', f'{X}ForeArm', True),
            (f'hand_fk.{s}', f'ORG-hand.{s}', f'{X}Hand', True),
            (f'thigh_fk.{s}', f'ORG-thigh.{s}', f'{X}UpLeg', True), (f'shin_fk.{s}', f'ORG-shin.{s}', f'{X}Leg', True),
            (f'foot_fk.{s}', f'ORG-foot.{s}', f'{X}Foot', True), (f'toe_fk.{s}', f'ORG-toe.{s}', f'{X}ToeBase', False)]
    for f, mf in (('f_index', 'Index'), ('f_middle', 'Middle'), ('f_ring', 'Ring'), ('f_pinky', 'Pinky'), ('thumb', 'Thumb')):
        for j in (1, 2, 3):
            MAP.append((f'{f}.0{j}.{s}', f'ORG-{f}.0{j}.{s}', f'{X}Hand{mf}{j}', True))

# hips translation: Mixamo height → ours
_, top, _ = mrest('HeadTop_End'); _, foot, _ = mrest('LeftToeBase')
mix_h = top.z - min(foot.z, 0.0); our_h = max(v.co.z for v in o.data.vertices)
k = our_h / mix_h
_, hip_rest, _ = mrest('Hips'); _, hip_pose, _ = mpose('Hips')
P.move('torso', tuple((hip_pose - hip_rest) * k))

done = 0
for ctl, org, mb, swing in MAP:
    if ctl not in P.pb or org not in rig.data.bones or ('mixamorig:' + mb) not in mx.data.bones: continue
    Rr, _, _ = mrest(mb); Rp, ph, pt = mpose(mb)
    delta = Rp @ Rr.inverted()
    ob = rig.data.bones[org]; Rb_rest = (rig.matrix_world @ ob.matrix_local).to_3x3().normalized()
    Rb_T = Rb_rest
    if swing:                                                          # our bone swung onto the Mixamo rest direction first
        mr_dir = (mrest(mb)[2] - mrest(mb)[1]).normalized()           # (T-pose), so delta's twist acts on a matching frame
        Rb_T = (Rb_rest @ Vector((0, 1, 0))).rotation_difference(mr_dir).to_matrix() @ Rb_rest
    tgt = delta @ Rb_T
    if swing and (pt - ph).length > 1e-6:
        cur = tgt @ Vector((0, 1, 0)); want = (pt - ph).normalized()
        tgt = cur.rotation_difference(want).to_matrix() @ tgt
    cb = rig.data.bones[ctl]; Rc_rest = (rig.matrix_world @ cb.matrix_local).to_3x3().normalized()
    off = Rb_rest.inverted() @ Rc_rest                                 # control frame relative to its ORG bone at rest
    M = P.M(ctl); P.set_world(ctl, M.translation, tgt @ off); done += 1
    pbn = P.pb[ctl]; pbn.scale = (1, 1, 1); P.up()                    # pose_bone.matrix writes leak scale (fist-v3 Poser.unscale)
print(f'   retarget {NAME} frame {FRAME}: {done} controls, height ratio {k:.3f}')

print('   body modifiers', [(m.name, m.type) for m in o.modifiers])
if not any(m.type == 'CORRECTIVE_SMOOTH' for m in o.modifiers):        # as fist-v3 / build-figure-v3 renders: relax folded skin
    cs = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.smooth_type = 'SIMPLE'; cs.factor = .5; cs.iterations = 8
def evaluated():
    for m in o.modifiers: m.show_viewport = True
    bpy.context.view_layer.update(); ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    A = np.array([(o.matrix_world @ v.co)[:] for v in me.vertices]); ev.to_mesh_clear(); return A
# ── post-retarget fixes (deform-qa.md §5; env FIX = JSON) ──────────────────────────────────────────────────────────────
#   lean      posterior pelvic tilt in degrees, thighs kept where they were in world: hip flexion drops by the same angle and
#             the chest moves away from the knees (Mixamo body is slimmer than ours: its knee-to-chest contact is our knee
#             inside the flank)
#   turn      [[control, deg, [axis]], …] extra world turns after the lean (arm off the knee)
#   butt      fraction of DEF-pelvis weight handed to the thigh on the buttock (saddle-shaped pelvis weights, the forum fix
#             for the buttock left behind by a flexed thigh)
#   relax     rounds of automatic weight relaxing where deform-check finds strain/crease clusters (the rigger's smooth brush)
FIX = json.loads(os.environ.get('FIX', '{}'))
dc = _load('dc', 'deform-check-v3.py')
for c in ('shoulder.L', 'shoulder.R', 'upper_arm_fk.L', 'upper_arm_fk.R', 'spine_fk.001', 'spine_fk.002', 'spine_fk.003', 'torso'):
    q = P.pb[c].matrix_basis.to_quaternion(); print(f'   {c}: {math.degrees(q.angle):.0f}° about {tuple(round(x, 2) for x in q.axis)}')
if FIX.get('spine'):                                                   # spine flexion: spread evenly over the three FK segments
    from mathutils import Quaternion as _Q                             # (Mixamo put 56° in one) and scale the total by `spine`
    sp = ('spine_fk.001', 'spine_fk.002', 'spine_fk.003'); armw = {c: P.M(c).to_3x3() for c in ('upper_arm_fk.L', 'upper_arm_fk.R')}
    keep_h = P.M('head').to_3x3()
    tot = _Q()
    for c in sp: tot = tot @ P.pb[c].matrix_basis.to_quaternion()
    part = _Q().slerp(tot, FIX['spine'] / 3)
    for c in sp: P.pb[c].rotation_mode = 'QUATERNION'; P.pb[c].rotation_quaternion = part
    P.up(); P.set_world('head', None, keep_h); P.pb['head'].scale = (1, 1, 1)
    for c, R in armw.items(): P.set_world(c, None, R); P.pb[c].scale = (1, 1, 1)
    P.up(); print(f'   spine: total {math.degrees(tot.angle):.0f}° → {math.degrees(tot.angle) * FIX["spine"]:.0f}°, 3 equal parts')
if FIX.get('lean'):
    keep = {c: P.M(c).to_3x3() for c in ('thigh_fk.L', 'thigh_fk.R', *FIX.get('keep', []))}   # keep: e.g. head (same gaze)
    P.turn('torso', -FIX['lean'], (1, 0, 0))
    for c, R in keep.items(): P.set_world(c, None, R); P.pb[c].scale = (1, 1, 1); P.up()
for s in ('L', 'R') if FIX.get('rhythm') else ():                     # scapulohumeral rhythm: the shoulder girdle takes a share
    u0 = (rig.data.bones[f'ORG-upper_arm.{s}'].tail_local - rig.data.bones[f'ORG-upper_arm.{s}'].head_local).normalized()
    keep = P.M(f'upper_arm_fk.{s}').to_3x3(); u = (P.tail(f'ORG-upper_arm.{s}') - P.head(f'ORG-upper_arm.{s}')).normalized()
    q = u0.rotation_difference(u); ang = math.degrees(q.angle) * FIX['rhythm']   # of the arm's swing from rest (≈ 1 : 2)
    P.turn(f'shoulder.{s}', ang, q.axis); P.pb[f'shoulder.{s}'].scale = (1, 1, 1)
    P.set_world(f'upper_arm_fk.{s}', None, keep); P.pb[f'upper_arm_fk.{s}'].scale = (1, 1, 1); P.up()
    print(f'   rhythm {s}: shoulder +{ang:.0f}°')
for ctl, deg, ax in FIX.get('turn', []):
    P.turn(ctl, deg, ax); P.pb[ctl].scale = (1, 1, 1); P.up()
for ctl, org, deg in FIX.get('twist', []):                              # turn a limb about its own long axis (hip/shoulder rotation)
    P.turn(ctl, deg, (P.tail(org) - P.head(org)).normalized()); P.pb[ctl].scale = (1, 1, 1); P.up()
for ctl, up_, lo_, deg in FIX.get('hinge', []):                         # open (−) / close (+) a joint in its own bend plane
    u = (P.tail(up_) - P.head(up_)).normalized(); f = (P.tail(lo_) - P.head(lo_)).normalized()
    P.turn(ctl, deg, u.cross(f).normalized()); P.pb[ctl].scale = (1, 1, 1); P.up()
DEF = [g for g in o.vertex_groups if g.name.startswith('DEF-')]; GI = {g.index: k for k, g in enumerate(DEF)}
V0 = np.array([v.co[:] for v in o.data.vertices])
def weights():
    W = np.zeros((len(V0), len(DEF)))
    for v in o.data.vertices:
        for g in v.groups:
            if g.group in GI: W[v.index, GI[g.group]] = g.weight
    return W
def write(W, rows):
    for i in rows:
        for k, g in enumerate(DEF):
            if W[i, k] > 1e-4: g.add([int(i)], float(W[i, k]), 'REPLACE')
            else: g.remove([int(i)])
if FIX.get('butt'):
    W = weights(); rows = []
    for s in 'LR':
        p, t = [k for k, g in enumerate(DEF) if g.name == f'DEF-pelvis.{s}'][0], [k for k, g in enumerate(DEF) if g.name == f'DEF-thigh.{s}'][0]
        hz = rig.data.bones[f'ORG-thigh.{s}'].head_local.z; hy = rig.data.bones[f'ORG-thigh.{s}'].head_local.y
        back = V0[:, 1] > hy                                           # behind the hip joint (figure faces −y)
        fall = np.clip((hz + .08 - V0[:, 2]) / .16, 0, 1); fall = fall * fall * (3 - 2 * fall)   # 0 at the iliac crest → 1 at the fold
        m = back & (W[:, p] > 0) & (fall > 0)
        d = W[m, p] * FIX['butt'] * fall[m]; W[m, p] -= d; W[m, t] += d; rows += list(np.where(m)[0])
    write(W, rows); print(f'   butt: {len(rows)} vertices, {FIX["butt"]:.2f} of pelvis → thigh')
if FIX.get('armleak'):                                                  # automatic weights leak the upper arm deep into the back/flank
    W = weights(); rows = []; r_keep, r_zero = FIX['armleak']          # (a triangle to the spine): torso skin dragged by the arm
    for s in 'LR':
        ua = [k for k, g in enumerate(DEF) if g.name.startswith(f'DEF-upper_arm.{s}')]
        b = rig.data.bones[f'ORG-upper_arm.{s}']; H, Tl = np.array(b.head_local), np.array(b.tail_local); a = (Tl - H) / np.linalg.norm(Tl - H)
        d = V0 - H; t = d @ a; r = np.linalg.norm(d - t[:, None] * a, axis=1)
        keep = np.clip((r_zero - r) / (r_zero - r_keep), 0, 1); keep = keep * keep * (3 - 2 * keep)
        keep = np.where(t > .14, 1, keep)                              # down the arm everything is arm
        m = (W[:, ua].sum(1) > 0) & (keep < 1)
        for i in np.where(m)[0]:
            arm = W[i, ua].sum(); rest = W[i].sum() - arm; W[i, ua] *= keep[i]; freed = arm * (1 - keep[i])
            others = [k for k in range(len(DEF)) if k not in ua and W[i, k] > 0]
            if rest > 1e-6: W[i, others] += freed * W[i, others] / rest
            else: W[i, [k for k, g in enumerate(DEF) if g.name == f'DEF-shoulder.{s}'][0]] += freed
        rows += list(np.where(m)[0])
    write(W, rows); print(f'   armleak: {len(rows)} vertices limited to r < {r_zero} m of the arm axis')
A = evaluated()
if FIX.get('relax'):
    from mathutils.bvhtree import BVHTree
    Fp = [list(p.vertices) for p in o.data.polygons]; reg = dc.regions(o)
    E = np.array([e.vertices[:] for e in o.data.edges]); from scipy.sparse import coo_matrix
    Adj = coo_matrix((np.ones(2 * len(E)), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(V0),) * 2).tocsr()
    deg = np.asarray(Adj.sum(1)).ravel()
    for rnd in range(FIX['relax']):
        rows_, tri, T = dc.check(V0, A, Fp, reg, None, None, None)
        bad = (tri['strain'] | tri['crease']) & ~tri['hand']
        m = np.zeros(len(V0), bool); m[T[bad].ravel()] = True
        for _ in range(3): m = m | (Adj @ m.astype(float) > 0)          # dilate 3 rings
        W = weights(); tot = W.sum(1, keepdims=True)
        for _ in range(FIX.get('relax_it', 12)):
            Wn = (Adj @ W) / np.maximum(deg, 1)[:, None]; W[m] = .5 * W[m] + .5 * Wn[m]
        W[m] *= tot[m] / np.maximum(W[m].sum(1, keepdims=True), 1e-9)
        write(W, np.where(m)[0]); A = evaluated()
        print(f'   relax round {rnd + 1}: {int(m.sum())} vertices, bad triangles {int(bad.sum())}')
if FIX.get('mush'):                                                     # local Delta-Mush-style relax where the strain concentrates
    Fp = [list(p.vertices) for p in o.data.polygons]; reg = dc.regions(o)
    E = np.array([e.vertices[:] for e in o.data.edges]); from scipy.sparse import coo_matrix
    Adj = coo_matrix((np.ones(2 * len(E)), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(V0),) * 2).tocsr()
    _, tri, T = dc.check(V0, A, Fp, reg, None, None, None)
    bad = (tri['strain'] | tri['crease']) & ~tri['hand']
    w = np.zeros(len(V0)); w[T[bad].ravel()] = 1
    deg = np.maximum(np.asarray(Adj.sum(1)).ravel(), 1)
    for _ in range(6): w = np.maximum(w, (Adj @ w) / deg * 1.0); w = np.minimum(1, .5 * w + .5 * (Adj @ w) / deg)
    vg = o.vertex_groups.new(name='qa_mush')
    for i in np.where(w > .02)[0]: vg.add([int(i)], float(w[i]), 'REPLACE')
    cs2 = o.modifiers.new('qa_mush', 'CORRECTIVE_SMOOTH'); cs2.smooth_type = 'LENGTH_WEIGHTED'; cs2.factor = 1.0
    cs2.iterations = FIX['mush']; cs2.vertex_group = 'qa_mush'; cs2.use_pin_boundary = False
    A = evaluated(); print(f'   mush: {int((w > .02).sum())} vertices, {FIX["mush"]} iterations')
CONTACT = FIX.get('contact', 0)                                         # applied to the evaluated mesh A (baked result), after the floor
sc_bad = [(p.name, tuple(round(v, 3) for v in p.matrix.to_scale())) for p in rig.pose.bones if p.name.startswith('DEF-') and max(abs(v - 1) for v in p.matrix.to_scale()) > .02]
print('   deform bones with scale ≠ 1:', len(sc_bad), sc_bad[:6])
if MODE == 'floor':                                                    # sit on the floor: lowest skin point at z = 0
    P.move('torso', (0, 0, -float(A[:, 2].min()))); A = evaluated()
if CONTACT:
    from mathutils.bvhtree import BVHTree; from scipy.sparse import coo_matrix
    E = np.array([e.vertices[:] for e in o.data.edges]); T = dc.tris([list(p.vertices) for p in o.data.polygons])
    Adj = coo_matrix((np.ones(2 * len(E)), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(V0),) * 2).tocsr()
    A, left = dc.resolve_contacts(V0, A, T, Adj, BVHTree, Vector, rounds=CONTACT); print(f'   contact: {left} crossing pairs left')
    if MODE == 'floor': A[:, 2] = np.maximum(A[:, 2], 0) if FIX.get('floor_flatten') else A[:, 2] - A[:, 2].min()
rows = pc.check(rig, A, {})
n = pc.report(rows, f'{NAME}_f{FRAME}', os.path.join(OUT, f'{NAME}_f{FRAME}_check.json'))
print('   pose-check', n, [f"{r['status']} {r['name']} {r['value']}" for r in rows if r['status'] in ('FAIL', 'WARN')][:12])
np.save(os.path.join(OUT, f'{NAME}_f{FRAME}.npy'), A.astype(np.float32))

# clay renders of the saved result A (contact fixes live only in A, not in the rigged object)
me_r = bpy.data.meshes.new('result'); me_r.from_pydata([tuple(p) for p in A], [], [list(p.vertices) for p in o.data.polygons])
me_r.update(); [setattr(p_, 'use_smooth', True) for p_ in me_r.polygons]
res = bpy.data.objects.new('result', me_r); sc.collection.objects.link(res)
for x in list(bpy.data.objects):
    if x is not res: bpy.data.objects.remove(x, do_unlink=True)
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (.62, .6, .57); sc.display.shading.show_cavity = True
sc.render.resolution_x, sc.render.resolution_y = 640, 720
lo, hi = Vector(A.min(0)), Vector(A.max(0)); c = (lo + hi) / 2; size = max(hi - lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
cam.type = 'ORTHO'; cam.ortho_scale = size * 1.25
for tag, off in (('front', (0, -1, 0)), ('side', (1, 0, 0)), ('rside', (-1, 0, 0)), ('back', (0, 1, 0))):   # camera offsets;
    off = Vector(off); co.location = c + off * 4; co.rotation_euler = (-off).to_track_quat('-Z', 'Y').to_euler()  # faces −y:
    sc.render.filepath = os.path.join(OUT, f'{NAME}_f{FRAME}_{tag}.png'); bpy.ops.render.render(write_still=True)  # side = its left
print('   renders →', OUT)
sys.stdout.flush(); os._exit(0)
