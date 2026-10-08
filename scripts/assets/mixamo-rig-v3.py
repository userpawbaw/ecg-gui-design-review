"""Our v3 figure re-bound to a Mixamo skeleton (user 2026-10-08: "아예 우리 모델을 저 골격에 맞춰 다시 만들어줘도 괜찮아 …
비율이나 얼굴의 표현 세밀도, 외형 질감 … 그 부분만 조절한다면 뼈대를 이용해 자연스럽게 쓸 수 있게"; run in parallel with the
user's Mixamo auto-rig upload). The direct route; see .claude/skills/pose-anatomy/references/deform-qa.md §1.

Why: retargeting Mixamo motion onto the Rigify rig copied angles between skeletons that cut the trunk at different heights and
pivot the clavicle elsewhere — hunched back, forward head, dropped shoulder (user review 2026-10-08). With the SAME skeleton
(names, hierarchy, trunk split, clavicle pivot) the motion maps bone for bone.

  joints   trunk (Hips, Spine, Spine1, Spine2, Neck, Head) and clavicles at the Y Bot's relative positions on our trunk;
           limbs at our mesh's anatomical joints, or moved toward the Y Bot's limb lengths by MORPH (0 … 1, mesh follows)
  weights  our DEF weights summed into the Mixamo bones, then game-style cleanup: buttock follows the thigh near the fold,
           no pelvis weight above the waist, upper-arm weight only near the arm, light smoothing
  motion   per bone: the source's posed direction, its twist from the rest-to-pose delta (no constraints in between)
Run: python scripts/assets/mixamo-rig-v3.py <mixamo.fbx> <frame> <out_dir> [floor]   env NAME, MORPH (default 0), CS (0/1)
Output: <name>_f<frame>.npy (same vertex order as body_v3, for deform-check-v3), fidelity table, 4-view clay renders.
The Mixamo FBX stays outside the repository (Adobe terms); only results on our mesh are kept.
"""
import importlib.util, json, math, os, sys
import numpy as np, bpy
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
def _load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
dc = _load('dc', 'deform-check-v3.py')
FBX, FRAME, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]; MODE = sys.argv[4] if len(sys.argv) > 4 else 'free'
NAME = os.environ.get('NAME', 'mx'); MORPH = float(os.environ.get('MORPH', 0)); os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']
for m in list(o.modifiers): o.modifiers.remove(m)
V0 = np.array([v.co[:] for v in o.data.vertices]); assert o.matrix_world == Matrix.Identity(4)
def oh(n): return Vector(rig.data.bones[n].head_local)
def ot(n): return Vector(rig.data.bones[n].tail_local)
before = set(bpy.data.objects); bpy.ops.import_scene.fbx(filepath=FBX)
new = [x for x in bpy.data.objects if x not in before]; mx = [x for x in new if x.type == 'ARMATURE'][0]
for x in new:
    if x.type == 'MESH': bpy.data.objects.remove(x, do_unlink=True)
sc = bpy.context.scene
def mr(n): b = mx.data.bones['mixamorig:' + n]; return mx.matrix_world @ b.head_local
our_h = float(V0[:, 2].max()); mix_h = mr('HeadTop_End').z - min(mr('LeftToeBase').z, 0.0); k = our_h / mix_h

# ── joints on our mesh ──────────────────────────────────────────────────────────────────────────────────────────────────
J = {}
hipmid_o = (oh('ORG-thigh.L') + oh('ORG-thigh.R')) / 2; hipmid_m = (mr('LeftUpLeg') + mr('RightUpLeg')) / 2
J['Hips'] = hipmid_o + (mr('Hips') - hipmid_m) * k
trunk_o = [J['Hips'], oh('ORG-spine.001'), oh('ORG-spine.002'), oh('ORG-spine.003'), oh('ORG-spine.004'), oh('ORG-spine.006')]
cum = np.r_[0, np.cumsum([(b - a).length for a, b in zip(trunk_o, trunk_o[1:])])]
names_m = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head']; pts_m = [mr(n) for n in names_m]
cum_m = np.r_[0, np.cumsum([(b - a).length for a, b in zip(pts_m, pts_m[1:])])]
def along(f):                                                          # point at length fraction f of our trunk polyline
    s = f * cum[-1]; i = min(int(np.searchsorted(cum, s, 'right')) - 1, len(trunk_o) - 2)
    t = (s - cum[i]) / max(cum[i + 1] - cum[i], 1e-9); return trunk_o[i].lerp(trunk_o[i + 1], t)
for n, c in zip(names_m[1:], cum_m[1:]): J[n] = along(c / cum_m[-1])
J['HeadTop_End'] = Vector((J['Head'].x, J['Head'].y, our_h))
S = {'L': 'Left', 'R': 'Right'}
for s, X in S.items():
    J[f'{X}Shoulder'] = J['Spine2'] + (mr(f'{X}Shoulder') - mr('Spine2')) * k        # clavicle pivot where the Y Bot has it
    sh = oh(f'ORG-upper_arm.{s}'); el = oh(f'ORG-forearm.{s}'); wr = oh(f'ORG-hand.{s}')
    L_ua_m, L_fa_m = (mr(f'{X}ForeArm') - mr(f'{X}Arm')).length * k, (mr(f'{X}Hand') - mr(f'{X}ForeArm')).length * k
    tot = (el - sh).length + (wr - el).length; d = (el - sh).normalized()
    el_m = sh + d * (tot * L_ua_m / (L_ua_m + L_fa_m))                  # Y Bot's elbow split of OUR arm length
    J[f'{X}Arm'], J[f'{X}ForeArm'], J[f'{X}Hand'] = sh, el.lerp(el_m, MORPH), wr
    for f, mf in (('f_index', 'Index'), ('f_middle', 'Middle'), ('f_ring', 'Ring'), ('f_pinky', 'Pinky'), ('thumb', 'Thumb')):
        for j in (1, 2, 3): J[f'{X}Hand{mf}{j}'] = oh(f'ORG-{f}.0{j}.{s}')
        J[f'{X}Hand{mf}4'] = ot(f'ORG-{f}.03.{s}')
    J[f'{X}UpLeg'], J[f'{X}Leg'], J[f'{X}Foot'] = oh(f'ORG-thigh.{s}'), oh(f'ORG-shin.{s}'), oh(f'ORG-foot.{s}')
    J[f'{X}ToeBase'], J[f'{X}Toe_End'] = oh(f'ORG-toe.{s}'), ot(f'ORG-toe.{s}')
J['LeftEye'] = J['RightEye'] = None

# ── arm morph (MORPH > 0): the mesh's elbow moves with the joint, upper arm / forearm segments rescaled along the arm ──────
names = {g.index: g.name for g in o.vertex_groups}
if MORPH > 0:
    for s, X in S.items():
        sh, el0, el1, wr = oh(f'ORG-upper_arm.{s}'), oh(f'ORG-forearm.{s}'), J[f'{X}ForeArm'], oh(f'ORG-hand.{s}')
        a = np.array(sh); u = np.array((wr - sh).normalized()); L = (wr - sh).length
        t0, t1 = (el0 - sh).dot(Vector(u)), (el1 - sh).dot(Vector(u))
        w = np.zeros(len(V0))
        for v in o.data.vertices:
            w[v.index] = sum(g.weight for g in v.groups if names[g.group].startswith((f'DEF-upper_arm.{s}', f'DEF-forearm.{s}')))
        t = (V0 - a) @ u
        tn = np.where(t < t0, t * t1 / t0, t1 + (t - t0) * (L - t1) / (L - t0))   # piecewise-linear remap along the arm
        tn = np.where((t < 0) | (t > L), t, tn)
        V0 = V0 + (w * (tn - t))[:, None] * u[None]
    for v, p in zip(o.data.vertices, V0): v.co = p
    print(f'   morph {MORPH:.2f}: elbow moved to the Y Bot split')

# ── armature with the Mixamo names / hierarchy ──────────────────────────────────────────────────────────────────────────
arm = bpy.data.armatures.new('mixrig'); ao = bpy.data.objects.new('mixrig', arm); sc.collection.objects.link(ao)
bpy.context.view_layer.objects.active = ao; bpy.ops.object.mode_set(mode='EDIT')
mb = {b.name.split(':')[-1]: b for b in mx.data.bones}
for n, b in mb.items():
    if n not in J or J[n] is None: continue
    eb = arm.edit_bones.new(n); eb.head = J[n]
    kids = [c.name.split(':')[-1] for c in b.children if c.name.split(':')[-1] in J and J[c.name.split(':')[-1]] is not None]
    pref = {'Hips': 'Spine', 'Spine2': 'Neck', 'LeftHand': 'LeftHandMiddle1', 'RightHand': 'RightHandMiddle1'}.get(n)
    tgt = J[pref] if pref else (J[kids[0]] if kids else None)
    if tgt is None or (tgt - J[n]).length < 1e-4:                       # leaf: continue the parent's direction
        pn = b.parent.name.split(':')[-1] if b.parent else None
        d = (J[n] - J[pn]).normalized() if pn in J and J[pn] is not None else Vector((0, 0, 1)); tgt = J[n] + d * .03
    eb.tail = tgt
for n, b in mb.items():
    if n in arm.edit_bones and b.parent and b.parent.name.split(':')[-1] in arm.edit_bones:
        arm.edit_bones[n].parent = arm.edit_bones[b.parent.name.split(':')[-1]]
bpy.ops.object.mode_set(mode='OBJECT')

# ── weights: our DEF groups → Mixamo bones, then game-style cleanup ─────────────────────────────────────────────────────
def dmap(d):
    d = d[4:]; s = 'L' if '.L' in d else ('R' if '.R' in d else None)
    base = d.split('.')[0]; X = S.get(s, '')
    fing = {'f_index': 'Index', 'f_middle': 'Middle', 'f_ring': 'Ring', 'f_pinky': 'Pinky', 'thumb': 'Thumb'}
    if base in fing: return f'{X}Hand{fing[base]}{int(d.split(".")[1])}'
    return {'spine': {'spine': 'Hips', '001': 'Spine', '002': 'Spine1', '003': 'Spine2', '004': 'Neck', '005': 'Neck', '006': 'Head'}
            .get(d.split('.')[1] if '.' in d else 'spine'),
            'pelvis': 'Hips', 'shoulder': f'{X}Shoulder', 'upper_arm': f'{X}Arm', 'forearm': f'{X}ForeArm', 'hand': f'{X}Hand',
            'palm': f'{X}Hand', 'thigh': f'{X}UpLeg', 'shin': f'{X}Leg', 'foot': f'{X}Foot', 'toe': f'{X}ToeBase'}.get(base)
B = [b.name for b in arm.bones]; bi = {n: i for i, n in enumerate(B)}
W = np.zeros((len(V0), len(B))); unk = set()
for v in o.data.vertices:
    for g in v.groups:
        n = names[g.group]
        if not n.startswith('DEF-'): continue
        t = dmap(n)
        if t in bi: W[v.index, bi[t]] += g.weight
        else: unk.add(n)
print('   unmapped DEF groups:', sorted(unk))
if os.environ.get('WEIGHTS') == 'auto':                                # fresh bone-heat weights on the Mixamo skeleton instead
    o.vertex_groups.clear(); bpy.ops.object.select_all(action='DESELECT')   # of our Rigify weights summed
    o.select_set(True); ao.select_set(True); bpy.context.view_layer.objects.active = ao
    bpy.ops.object.parent_set(type='ARMATURE_AUTO'); o.modifiers.clear()
    gn = {g.index: g.name for g in o.vertex_groups}; W[:] = 0
    for v in o.data.vertices:
        for g in v.groups:
            if gn[g.group] in bi: W[v.index, bi[gn[g.group]]] = g.weight
    print(f'   bone-heat weights: {int((W.sum(1) > 0).sum())} of {len(V0)} vertices weighted')
for s, X in S.items():                                                  # buttock follows the thigh toward the fold; no pelvis
    up, hp, sp = bi[f'{X}UpLeg'], bi['Hips'], bi['Spine']               # weight above the waist (it reached z ≈ 1.07)
    hz, hy = J[f'{X}UpLeg'].z, J[f'{X}UpLeg'].y
    side = (V0[:, 0] > 0) if s == 'L' else (V0[:, 0] < 0)
    fall = np.clip((hz + .06 - V0[:, 2]) / .14, 0, 1); fall = fall * fall * (3 - 2 * fall)
    m = side & (V0[:, 1] > hy - .02) & (W[:, hp] > 0)
    d_ = W[m, hp] * float(os.environ.get('BUTT', .7)) * fall[m]; W[m, hp] -= d_; W[m, up] += d_
    up_ = np.clip((V0[:, 2] - (hz + .05)) / .06, 0, 1); m = side & (W[:, hp] > 0) & (up_ > 0)
    d_ = W[m, hp] * up_[m]; W[m, hp] -= d_; W[m, sp] += d_
    a_ = bi[f'{X}Arm']; H = np.array(J[f'{X}Arm']); u = np.array((J[f'{X}ForeArm'] - J[f'{X}Arm']).normalized())
    t = (V0 - H) @ u; r = np.linalg.norm((V0 - H) - t[:, None] * u, axis=1)
    keep = np.where(t > .12, 1, np.clip((.10 - r) / .04, 0, 1))         # arm weight only within ~10 cm of the arm axis
    if os.environ.get('ARMLEAK', '1') == '0': keep[:] = 1
    freed = W[:, a_] * (1 - keep); W[:, a_] *= keep
    W[:, bi['Spine2']] += freed * .7; W[:, bi[f'{X}Shoulder']] += freed * .3
from scipy.sparse import coo_matrix
E = np.array([e.vertices[:] for e in o.data.edges])
Adj = coo_matrix((np.ones(2 * len(E)), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(V0),) * 2).tocsr()
deg = np.asarray(Adj.sum(1)).ravel()
for _ in range(int(os.environ.get('WSMOOTH', 4))): W = .5 * W + .5 * (Adj @ W) / deg[:, None]
W /= np.maximum(W.sum(1, keepdims=True), 1e-9)
o.vertex_groups.clear()
for n in B:
    g = o.vertex_groups.new(name=n); col = W[:, bi[n]]
    for i in np.where(col > 1e-3)[0]: g.add([int(i)], float(col[i]), 'REPLACE')
md = o.modifiers.new('arm', 'ARMATURE'); md.object = ao; o.parent = ao
if os.environ.get('CS', '0') == '1':
    cs = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.smooth_type = 'LENGTH_WEIGHTED'; cs.factor = .5; cs.iterations = 6

# ── motion: bone for bone ───────────────────────────────────────────────────────────────────────────────────────────────
sc.frame_set(FRAME); bpy.context.view_layer.update()
def mrest(n):
    b = mx.data.bones['mixamorig:' + n]; M = mx.matrix_world @ b.matrix_local
    return M.to_3x3().normalized(), mx.matrix_world @ b.head_local, mx.matrix_world @ b.tail_local
def mpose(n):
    b = mx.pose.bones['mixamorig:' + n]; M = mx.matrix_world @ b.matrix
    return M.to_3x3().normalized(), mx.matrix_world @ b.head, mx.matrix_world @ b.tail
pb = ao.pose.bones
def order(b):
    yield b
    for c in b.children: yield from order(c)
for b in order(arm.bones['Hips']):
    n = b.name; Rr, hr, tr = mrest(n); Rp, hp_, tp = mpose(n)
    R0 = b.matrix_local.to_3x3().normalized()
    RT = (R0 @ Vector((0, 1, 0))).rotation_difference((tr - hr).normalized()).to_matrix() @ R0   # our bone on the source rest dir
    tgt = (Rp @ Rr.inverted()) @ RT
    if (tp - hp_).length > 1e-6:
        tgt = (tgt @ Vector((0, 1, 0))).rotation_difference((tp - hp_).normalized()).to_matrix() @ tgt
    p = pb[n]; M = p.matrix.copy()
    loc = (b.head_local + (hp_ - hr) * k) if n == 'Hips' else M.translation
    p.matrix = Matrix.Translation(loc) @ tgt.to_4x4(); bpy.context.view_layer.update()
    p.scale = (1, 1, 1); bpy.context.view_layer.update()

def evaluated():
    bpy.context.view_layer.update(); ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    A = np.array([(o.matrix_world @ v.co)[:] for v in me.vertices]); ev.to_mesh_clear(); return A
A = evaluated()
if MODE == 'floor':
    pb['Hips'].location.z -= 0; ao.location.z -= float(A[:, 2].min()); A = evaluated()

if float(os.environ.get('FLAT', 0)) > 0 or os.environ.get('IRON', '0') == '1':   # finishing passes on the baked result
    from scipy.sparse import coo_matrix as _coo
    T_ = dc.tris([list(p_.vertices) for p_ in o.data.polygons]); E_ = np.array([e.vertices[:] for e in o.data.edges])
    Adj_ = _coo((np.ones(2 * len(E_)), (np.r_[E_[:, 0], E_[:, 1]], np.r_[E_[:, 1], E_[:, 0]])), shape=(len(A),) * 2).tocsr()
    if MODE == 'floor' and float(os.environ.get('FLAT', 0)) > 0:
        A = dc.flatten_floor(A, Adj_, float(os.environ['FLAT'])); print(f'   floor contact flattened ({float(os.environ["FLAT"]) * 100:.1f} cm sink)')
    if os.environ.get('IRON', '0') == '1':
        A, f0, f1 = dc.iron_flips(A, T_, Adj_); print(f'   flipped triangles {f0} → {f1}')
# fidelity: joints vs the scaled source, pelvis-relative (deform-qa.md §1.1)
def ph(n): return ao.matrix_world @ pb[n].head
hm, ho = (mpose('LeftUpLeg')[1] + mpose('RightUpLeg')[1]) / 2, (ph('LeftUpLeg') + ph('RightUpLeg')) / 2
rows = []
for n in ('LeftLeg', 'LeftFoot', 'Spine2', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'RightLeg'):
    d = ((ph(n) - ho) - (mpose(n)[1] - hm) * k).length * 100; rows.append((n, round(d, 1)))
print('   fidelity (cm):', ', '.join(f'{n} {d}' for n, d in rows))
el, kn = ph('LeftForeArm'), ph('LeftLeg'); print(f'   left elbow–knee joint distance {(el - kn).length * 100:.1f} cm (source ×k {(mpose("LeftForeArm")[1] - mpose("LeftLeg")[1]).length * k * 100:.1f})')
np.save(os.path.join(OUT, f'{NAME}_f{FRAME}.npy'), A.astype(np.float32))
json.dump({'fidelity_cm': rows, 'morph': MORPH, 'k': k}, open(os.path.join(OUT, f'{NAME}_f{FRAME}_fidelity.json'), 'w', encoding='utf-8'), indent=1)

# clay renders, the 4 cameras of the source comparison
me_r = bpy.data.meshes.new('result'); me_r.from_pydata([tuple(p) for p in A], [], [list(p.vertices) for p in o.data.polygons]); me_r.update()
for p_ in me_r.polygons: p_.use_smooth = True
res = bpy.data.objects.new('result', me_r); sc.collection.objects.link(res)
for x in list(bpy.data.objects):
    if x is not res: bpy.data.objects.remove(x, do_unlink=True)
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (.62, .6, .57); sc.display.shading.show_cavity = True; sc.render.resolution_x, sc.render.resolution_y = 640, 720
lo, hi = Vector(A.min(0)), Vector(A.max(0)); c = (lo + hi) / 2; size = max(hi - lo)
cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co; cam.type = 'ORTHO'; cam.ortho_scale = size * 1.25
for tag, off in (('front', (0, -1, 0)), ('side', (1, 0, 0)), ('rside', (-1, 0, 0)), ('back', (0, 1, 0))):
    off = Vector(off); co.location = c + off * 4; co.rotation_euler = (-off).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'{NAME}_f{FRAME}_{tag}.png'); bpy.ops.render.render(write_still=True)
print('   renders →', OUT); sys.stdout.flush(); os._exit(0)
