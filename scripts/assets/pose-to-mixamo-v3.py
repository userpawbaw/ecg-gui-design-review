"""Move a pose made on the Rigify v3 rig onto the Mixamo auto-rig of the same mesh (user 2026-10-08: "의자 자세랑 주먹 테스트
렌더해서 비교해줘"). Both rigs are bound to the same mesh in the same rest pose (53,286 vertices, same order), so each Mixamo bone
takes the world rotation its Rigify counterpart made from rest: R_mixamo = (R_rigify_pose · R_rigify_rest⁻¹) · R_mixamo_rest.
The pelvis takes the Rigify pelvis translation. Only the bone motion moves across; the skin is the Mixamo auto-rig's.
Run: python scripts/assets/pose-to-mixamo-v3.py <autorig.fbx> <bones.json> <out.npy>
  bones.json: world matrices of the Rigify ORG/DEF bones (chair-motion-v3.py SAVE_NPY writes <base>_{open,fist}_bones.json).
The auto-rig FBX stays outside the repository (Mixamo output); only results on our mesh are kept.
"""
import json, os, sys
import numpy as np, bpy
from mathutils import Matrix, Vector
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
FBX, BONES, OUT = sys.argv[1:4]
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
rig = bpy.data.objects['rig']
rest = {b.name: rig.matrix_world @ b.matrix_local for b in rig.data.bones}
for x in list(bpy.data.objects): bpy.data.objects.remove(x, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=FBX)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
arm.animation_data_clear()
for p in arm.pose.bones: p.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
pose = {k: Matrix(v) for k, v in json.load(open(BONES, encoding='utf-8')).items()}

S = {'L': 'Left', 'R': 'Right'}
MAP = [('Hips', 'ORG-spine'), ('Spine', 'DEF-spine.001'), ('Spine1', 'DEF-spine.002'), ('Spine2', 'DEF-spine.003'),
       ('Neck', 'DEF-spine.004'), ('Head', 'DEF-spine.006')]
for s, X in S.items():
    MAP += [(f'{X}Shoulder', f'ORG-shoulder.{s}'), (f'{X}Arm', f'ORG-upper_arm.{s}'), (f'{X}ForeArm', f'ORG-forearm.{s}'),
            (f'{X}Hand', f'ORG-hand.{s}'), (f'{X}UpLeg', f'ORG-thigh.{s}'), (f'{X}Leg', f'ORG-shin.{s}'),
            (f'{X}Foot', f'ORG-foot.{s}'), (f'{X}ToeBase', f'ORG-toe.{s}')]
    for f, mf in (('f_index', 'Index'), ('f_middle', 'Middle'), ('f_ring', 'Ring'), ('f_pinky', 'Pinky'), ('thumb', 'Thumb')):
        MAP += [(f'{X}Hand{mf}{j}', f'ORG-{f}.0{j}.{s}') for j in (1, 2, 3)]
src = dict(MAP)
W = arm.matrix_world; Wi = W.inverted()
def order(b):
    yield b
    for c in b.children: yield from order(c)
n_done = 0
for b in order(arm.data.bones['mixamorig:Hips']):
    n = b.name.split(':')[-1]
    if n not in src or src[n] not in pose: continue
    r = src[n]
    D = pose[r].to_3x3().normalized() @ rest[r].to_3x3().normalized().inverted()     # world rotation since rest (Rigify)
    Rm = (W @ b.matrix_local).to_3x3().normalized()
    p = arm.pose.bones[b.name]; cur = W @ p.matrix
    loc = cur.translation if n != 'Hips' else (W @ b.matrix_local).translation + (pose[r].translation - rest[r].translation)
    p.matrix = Wi @ (Matrix.Translation(loc) @ (D @ Rm).to_4x4()); bpy.context.view_layer.update()
    p.scale = (1, 1, 1); bpy.context.view_layer.update(); n_done += 1
# contacts: the hands stay where the Rigify pose put them (the Mixamo elbow sits ~5 cm higher, so copied angles move the hand).
# 2-bone IK per arm: wrist onto the Rigify wrist, elbow in the current bend plane, hand keeps its world rotation.
def wp(n): return W @ arm.pose.bones['mixamorig:' + n].head
def setw(n, R):
    p = arm.pose.bones['mixamorig:' + n]; t = (W @ p.matrix).translation
    p.matrix = Wi @ (Matrix.Translation(t) @ R.to_4x4()); bpy.context.view_layer.update(); p.scale = (1, 1, 1); bpy.context.view_layer.update()
def wr(n): return (W @ arm.pose.bones['mixamorig:' + n].matrix).to_3x3().normalized()
for s, X in S.items():
    goal = pose[f'ORG-hand.{s}'].translation; Rh = wr(f'{X}Hand')
    sh, el = wp(f'{X}Arm'), wp(f'{X}ForeArm'); la, lb = (el - sh).length, (wp(f'{X}Hand') - el).length
    d = goal - sh; L = min(d.length, (la + lb) * .999); u = d.normalized()
    pole = el - sh; pole = (pole - pole.dot(u) * u).normalized()
    a = (la * la + L * L - lb * lb) / (2 * L); el2 = sh + u * a + pole * max(la * la - a * a, 0) ** .5
    for bn, want in ((f'{X}Arm', el2 - sh), (f'{X}ForeArm', None)):
        if want is None: want = goal - wp(f'{X}ForeArm')
        cur = wr(bn) @ Vector((0, 1, 0)); setw(bn, cur.rotation_difference(want.normalized()).to_matrix() @ wr(bn))
    setw(f'{X}Hand', Rh)
    print(f'   {X} wrist {(wp(f"{X}Hand") - goal).length * 100:.1f} cm from the Rigify wrist')
ev = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
A = np.array([(mesh.matrix_world @ v.co)[:] for v in me.vertices]); ev.to_mesh_clear()
np.save(OUT, A.astype(np.float32)); print(f'   {n_done} Mixamo bones posed from the Rigify pose → {OUT}')
sys.stdout.flush(); os._exit(0)
