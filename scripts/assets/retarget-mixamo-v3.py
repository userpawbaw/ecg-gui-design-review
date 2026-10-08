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
A = evaluated()
sc_bad = [(p.name, tuple(round(v, 3) for v in p.matrix.to_scale())) for p in rig.pose.bones if p.name.startswith('DEF-') and max(abs(v - 1) for v in p.matrix.to_scale()) > .02]
print('   deform bones with scale ≠ 1:', len(sc_bad), sc_bad[:6])
if MODE == 'floor':                                                    # sit on the floor: lowest skin point at z = 0
    P.move('torso', (0, 0, -float(A[:, 2].min()))); A = evaluated()
rows = pc.check(rig, A, {})
n = pc.report(rows, f'{NAME}_f{FRAME}', os.path.join(OUT, f'{NAME}_f{FRAME}_check.json'))
print('   pose-check', n, [f"{r['status']} {r['name']} {r['value']}" for r in rows if r['status'] in ('FAIL', 'WARN')][:12])
np.save(os.path.join(OUT, f'{NAME}_f{FRAME}.npy'), A.astype(np.float32))

# clay renders
for x in list(bpy.data.objects):
    if x not in (o, rig): bpy.data.objects.remove(x, do_unlink=True)
rig.hide_render = True
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (.62, .6, .57); sc.display.shading.show_cavity = True
sc.render.resolution_x, sc.render.resolution_y = 640, 720
lo, hi = Vector(A.min(0)), Vector(A.max(0)); c = (lo + hi) / 2; size = max(hi - lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
cam.type = 'ORTHO'; cam.ortho_scale = size * 1.25
for tag, d in (('front', Vector((0, -1, 0))), ('side', Vector((-1, 0, 0)))):          # the figure faces −y; side = its right
    co.location = c - d * 4; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'{NAME}_f{FRAME}_{tag}.png'); bpy.ops.render.render(write_still=True)
print('   renders →', OUT)
sys.stdout.flush(); os._exit(0)
