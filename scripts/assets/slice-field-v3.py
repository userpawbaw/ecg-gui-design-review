"""Ring coordinate (_SLICE_rest) for the H5 rings, rebuilt 2026-10-09 (user: rings look squashed on the back/buttocks on the ladder
and at the crotch when seated).
Cause in the first version (build-figure-v3.slice_coord): the thigh, upper arm, shoulder and pelvis.L/R deform bones have no deform
parent, so each started at a constant .80 while the trunk ran upward from the pelvis. The coordinate jumped at the shoulders and
hips, ran in opposite directions on the trunk and the thighs, and the diagonal pelvis.L/R axis left local minima on the buttocks.
Rings are level lines of this value, so every jump or local extremum became a whorl or a wavy line.
Now:
  - one tree rooted at the top of the head: down the spine chain, then out along each limb (thigh <- pelvis, shoulder <- chest,
    upper arm <- shoulder); a child starts at the parent's value at its head, so the value is continuous and grows away from the
    head along every branch (no minimum at the crotch or buttocks);
  - pelvis.L/R weights count as the pelvis (spine axis), not their own diagonal axis;
  - vertices that one bone dominates (weight >= CORE) keep the bone-axis value (metric spacing, rings perpendicular to the bone);
    the rest (joint blends) is filled with a harmonic function (cotangent Laplacian), which has no interior extrema.
Reports the number of local extrema (vertices above or below all neighbours) before and after.
Writes _SLICE_rest into the rig cache and keeps the old one as _SLICE_rest_v1.
Run: python scripts/assets/slice-field-v3.py   (then re-export: autorig-export-v3.py, story-export-v3.py)
"""
import os, sys
import numpy as np, bpy
import scipy.sparse as sp, scipy.sparse.linalg as spl
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend')
CORE = float(os.environ.get('CORE', .9))
DRY = bool(os.environ.get('DRY'))

bpy.ops.wm.open_mainfile(filepath=CACHE)
o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']
V = np.array([v.co[:] for v in o.data.vertices]); n = len(V)
T = []
for p in o.data.polygons:
    vs = list(p.vertices)
    for k in range(1, len(vs) - 1): T.append((vs[0], vs[k], vs[k + 1]))
T = np.array(T)
old_attr = '_SLICE_rest_v1' if '_SLICE_rest_v1' in o.data.attributes else '_SLICE_rest'
OLD = np.zeros(n, np.float32); o.data.attributes[old_attr].data.foreach_get('value', OLD)

bones = {b.name: b for b in rig.data.bones if b.use_deform}
SPINE = ['DEF-spine.006', 'DEF-spine.005', 'DEF-spine.004', 'DEF-spine.003', 'DEF-spine.002', 'DEF-spine.001', 'DEF-spine']
def parent(name):
    for side in ('L', 'R'):
        fix = {f'DEF-thigh.{side}': 'DEF-spine', f'DEF-shoulder.{side}': 'DEF-spine.003', f'DEF-upper_arm.{side}': f'DEF-shoulder.{side}'}
        if name in fix: return fix[name]
    p = bones[name].parent
    while p is not None and p.name not in bones: p = p.parent
    return p.name if p else None
ALIAS = {f'DEF-pelvis.{s}': 'DEF-spine' for s in 'LR'} | {f'DEF-breast.{s}': 'DEF-spine.003' for s in 'LR'}

# per bone: value(p) = off + (p - start) . axis, axis pointing away from the head
H = lambda b: np.array(b.head_local[:]); Tl = lambda b: np.array(b.tail_local[:])
field = {}
top = Tl(bones['DEF-spine.006'])
acc = 0.
for nm in SPINE:                                     # spine bones point up; walk them downward from the top of the head
    b = bones[nm]; ax = H(b) - Tl(b); L = np.linalg.norm(ax); ax /= L
    field[nm] = (acc, Tl(b), ax); acc += L
def val(nm, P):
    off, s, ax = field[nm]; return off + (P - s) @ ax
def resolve(nm):
    if nm in field or nm in ALIAS: return
    par = parent(nm); resolve(par)
    b = bones[nm]; ax = Tl(b) - H(b); ax /= np.linalg.norm(ax)
    field[nm] = (float(val(par, H(b)[None])[0]), H(b), ax)
for nm in bones: resolve(nm)

gi = {g.index: g.name for g in o.vertex_groups}
W = {}
for i, v in enumerate(o.data.vertices):
    for g in v.groups:
        nm = gi.get(g.group); nm = ALIAS.get(nm, nm)
        if nm in field and g.weight > 0: W.setdefault(nm, np.zeros(n))[i] += g.weight
ws = sum(W.values()); acc = sum(w * val(nm, V) for nm, w in W.items())
BL = acc / np.maximum(ws, 1e-6)                      # weighted blend (used inside cores and as a fallback)
wmax = np.max(np.stack(list(W.values())), 0) / np.maximum(ws, 1e-6)
core = wmax >= CORE

# cotangent Laplacian, harmonic fill outside the cores
def cot(a, b, c):
    u, w = V[a] - V[c], V[b] - V[c]
    return np.einsum('ij,ij->i', u, w) / np.maximum(np.linalg.norm(np.cross(u, w), axis=1), 1e-12)
I, J, X = [], [], []
for a, b, c in ((0, 1, 2), (1, 2, 0), (2, 0, 1)):
    w = .5 * np.clip(cot(T[:, a], T[:, b], T[:, c]), -1e3, 1e3)
    I += [T[:, a], T[:, b]]; J += [T[:, b], T[:, a]]; X += [w, w]
A = sp.coo_matrix((np.concatenate(X), (np.concatenate(I), np.concatenate(J))), shape=(n, n)).tocsr()
Lp = sp.diags(np.asarray(A.sum(1)).ravel()) - A
f, c = np.where(~core)[0], np.where(core)[0]
NEW = BL.copy()
NEW[f] = spl.spsolve(Lp[f][:, f].tocsc(), -Lp[f][:, c] @ BL[c])

jump = lambda F: float(np.percentile(np.abs(F[E[:, 0]] - F[E[:, 1]]) / np.maximum(np.linalg.norm(V[E[:, 0]] - V[E[:, 1]], axis=1), 1e-6), 99.9))
E = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]]); E = np.unique(np.sort(E, 1), axis=0)
def extrema(F):
    lo = np.full(n, np.inf); hi = np.full(n, -np.inf)
    for a, b in ((0, 1), (1, 0)):
        np.minimum.at(lo, E[:, a], F[E[:, b]]); np.maximum.at(hi, E[:, a], F[E[:, b]])
    return int(((F < lo) | (F > hi)).sum())
print(f'   core vertices {core.sum()}/{n} (weight >= {CORE})')
names = list(W); dom = np.array(names)[np.argmax(np.stack([W[k] for k in names]), 0)]
def where(F):
    lo = np.full(n, np.inf); hi = np.full(n, -np.inf)
    for a, b in ((0, 1), (1, 0)):
        np.minimum.at(lo, E[:, a], F[E[:, b]]); np.maximum.at(hi, E[:, a], F[E[:, b]])
    ix = np.where((F < lo) | (F > hi))[0]; u, k = np.unique(dom[ix], return_counts=True)
    return ', '.join(f'{a.replace("DEF-", "")}×{b}' for a, b in zip(u, k))
for nm, F in (('old', OLD), ('blend', BL), ('new', NEW)):
    print(f'   {nm:5s}: local extrema {extrema(F):5d}   99.9th-pct gradient {jump(F):.2f} (1 = metric)')
    if os.environ.get('WHERE'): print('          ', where(F))
if not DRY:
    if old_attr == '_SLICE_rest': o.data.attributes.new('_SLICE_rest_v1', 'FLOAT', 'POINT').data.foreach_set('value', OLD)
    o.data.attributes['_SLICE_rest'].data.foreach_set('value', NEW.astype(np.float32))
    bpy.ops.wm.save_as_mainfile(filepath=CACHE)
    print('   wrote _SLICE_rest (old kept as _SLICE_rest_v1)')
sys.stdout.flush(); os._exit(0)
