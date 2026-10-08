"""Web export of a Mixamo auto-rig pose of our v3 figure (user 2026-10-08: "자동 리깅으로 도입부 다음 단계 진행해줘").
Same mesh as body_v3 (53,286 vertices, same order), so the Rigify-era per-vertex data carry over unchanged: the bone-axis ring
coordinate (_SLICE, H5 shader), the electrode sites (vertex ids), the heart (rest point, moved with the chest bone).

Writes prototype/v2/src/story/intro/assets/body_v3_<name>.glb and figure.json "poses_v3"[<name>] in the format build_archive.py
and the web already read (anchor, heart_b, heart_q_wxyz, electrodes, joints, hand_r), plus "contacts": the source pose's hand and
foot points with whether each rests on the ladder plane (climb), for placing the figure on the rungs.
Run: python scripts/assets/autorig-export-v3.py <autorig.fbx> <frame> <name> [anchor: seat|feet]
The auto-rig FBX stays outside the repository (Mixamo output); only the baked pose on our mesh is kept.
"""
import json, math, os, sys
import numpy as np, bpy
from mathutils import Matrix, Vector
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
FBX, FRAME, NAME = sys.argv[1], int(sys.argv[2]), sys.argv[3]; ANCHOR = sys.argv[4] if len(sys.argv) > 4 else 'seat'
A_DIR = os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets')

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
body = bpy.data.objects['body_v3']; V0 = np.array([v.co[:] for v in body.data.vertices]); F = [list(p.vertices) for p in body.data.polygons]
site_idx = json.loads(body['site_idx']); heart_rest = Vector(body['heart'])
SLICE = np.zeros(len(V0), np.float32); body.data.attributes['_SLICE_rest'].data.foreach_get('value', SLICE)
for x in list(bpy.data.objects): bpy.data.objects.remove(x, do_unlink=True)

bpy.ops.import_scene.fbx(filepath=FBX)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
R = np.array([(mesh.matrix_world @ v.co)[:] for v in mesh.data.vertices])
assert len(R) == len(V0) and np.abs(R - V0).max() < 1e-4, 'auto-rig mesh is not body_v3 (vertex order / rest differ)'
bpy.context.scene.frame_set(FRAME); bpy.context.view_layer.update()
ev = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
P0 = np.array([(mesh.matrix_world @ v.co)[:] for v in me.vertices]); ev.to_mesh_clear()
W = arm.matrix_world
def head(n): return W @ arm.pose.bones['mixamorig:' + n].head
def drot(n):                                                          # world deformation of a bone since rest
    b = arm.pose.bones['mixamorig:' + n]; return (W @ b.matrix) @ (W @ b.bone.matrix_local).inverted()

# anchor: lowest buttock point between the sitting bones (seat) or the lowest point (feet); the figure frame keeps the source frame
if ANCHOR == 'seat':
    hy = head('LeftUpLeg').y
    bt = P0[(np.abs(P0[:, 0] - (head('LeftUpLeg').x + head('RightUpLeg').x) / 2) < .14) & (np.abs(P0[:, 1] - hy) < .2)]
    anchor = bt[np.argmin(bt[:, 2])].copy(); anchor[0] = (head('LeftUpLeg').x + head('RightUpLeg').x) / 2
else:
    anchor = P0[np.argmin(P0[:, 2])].copy()
Dm = drot('Spine2'); hb = Dm @ heart_rest; q = Dm.to_quaternion()

me2 = bpy.data.meshes.new(f'body_v3_{NAME}'); me2.from_pydata([tuple(p) for p in P0], [], F); me2.update()
so = bpy.data.objects.new(f'body_v3_{NAME}', me2); bpy.context.scene.collection.objects.link(so)
for p in me2.polygons: p.use_smooth = True
so.data.attributes.new('_SLICE', 'FLOAT', 'POINT').data.foreach_set('value', SLICE)
me2.update(); Nv = np.array([v.normal[:] for v in me2.vertices])
electrodes = {k: {'p': [round(float(x), 4) for x in P0[i]], 'n': [round(float(x), 4) for x in Nv[i]], 'v': i, 'torso': True} for k, i in site_idx.items()}
JN = {'upper.L': 'LeftArm', 'upper.R': 'RightArm', 'fore.L': 'LeftForeArm', 'fore.R': 'RightForeArm', 'hand.L': 'LeftHand', 'hand.R': 'RightHand',
      'thigh.L': 'LeftUpLeg', 'thigh.R': 'RightUpLeg', 'shin.L': 'LeftLeg', 'shin.R': 'RightLeg', 'foot.L': 'LeftFoot', 'foot.R': 'RightFoot',
      'chest': 'Spine2', 'spine': 'Spine'}
joints = {k: [round(float(x), 4) for x in head(v)] for k, v in JN.items()}
grip = {s: (head(f'{X}HandMiddle1') + head(f'{X}HandMiddle2')) / 2 for s, X in (('L', 'Left'), ('R', 'Right'))}
step = {s: head(f'{X}ToeBase') for s, X in (('L', 'Left'), ('R', 'Right'))}
out = {'anchor': [round(float(x), 4) for x in anchor], 'anchor_kind': ANCHOR, 'seat': [round(float(x), 4) for x in anchor],
       'heart_b': [round(x, 4) for x in hb], 'heart_q_wxyz': [round(x, 5) for x in q], 'electrodes': electrodes, 'joints': joints,
       'keys': [], 'rig': 'mixamo-autorig', 'frame': FRAME, 'hand_r': [round(float(x), 4) for x in grip['R']],
       'source': 'blender-human-base-meshes GEO-body_male_realistic (CC0), mannequin head B2; Mixamo auto-rig + motion (user upload 2026-10-08)',
       'contacts': {f'hand.{s}': [round(float(x), 4) for x in grip[s]] for s in 'LR'} | {f'foot.{s}': [round(float(x), 4) for x in step[s]] for s in 'LR'}}
# the glb: same export settings as build-figure-v3 (meshopt is applied later by the web packer if at all)
bpy.ops.object.select_all(action='DESELECT'); so.select_set(True); bpy.context.view_layer.objects.active = so
bpy.ops.export_scene.gltf(filepath=os.path.join(A_DIR, f'body_v3_{NAME}.glb'), export_format='GLB', use_selection=True,
                          export_attributes=True, export_normals=True, export_texcoords=False, export_materials='NONE',
                          export_morph=False, export_apply=False)
fp = os.path.join(A_DIR, 'figure.json'); fig = json.load(open(fp, encoding='utf-8'))
fig.setdefault('poses_v3', {})[NAME] = out
with open(fp, 'w', encoding='utf-8') as fh: json.dump(fig, fh)
print(f'   body_v3_{NAME}.glb {os.path.getsize(os.path.join(A_DIR, f"body_v3_{NAME}.glb"))} bytes; anchor {out["anchor"]}, heart {out["heart_b"]}')
print('   contacts', out['contacts'])
sys.stdout.flush(); os._exit(0)
