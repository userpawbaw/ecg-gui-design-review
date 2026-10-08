"""Skin deformation QA for a posed figure mesh (user 2026-10-08: "엉덩이가 찌그러지는 거나 어깨쪽 팔 피부가 무릎과 닿으며 기괴하게
늘어나는 지점 … 자체적으로 검출할 수 있는 기준"). The joint/capsule validator (pose-check-v3) never looks at the skin itself.
Manual, thresholds and their sources: .claude/skills/pose-anatomy/references/deform-qa.md.

Posed mesh vs rest mesh (same topology), per triangle:
  strain     singular values s1 ≥ s2 of the triangle's 2D deformation gradient (s1 = stretch, s2 = squash)
  crease     dihedral angle across an edge that opened ≥ 60° more than at rest (new sharp line: tear, pinch, crumple)
  intersect  posed triangles crossing triangles that were ≥ 4 cm apart at rest (arm through knee); skin creases excluded
  floor      skin below the floor plane
Bad triangles are grouped into connected clusters; a cluster is graded by its posed AREA (a single sliver is mesh noise,
a few cm² is visible at screen size). Each cluster names its body regions (deform bone with the largest weight).
Usable as a module (check(...)) or: python scripts/assets/deform-check-v3.py <posed.npy> <out_dir> [floor]
Writes <out_dir>/<name>_deform.json, <name>_heat_<view>.png (6 views) and <name>_c<k>.png close-ups of FAIL clusters.
"""
import json, os, sys
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

# (WARN, FAIL) — sources and calibration in deform-qa.md §3
STRAIN = {'body': {'s1': 2.0, 's2': .4}, 'hand': {'s1': 2.6, 's2': .3}}     # "bad" limits on the patch strain below
PATCH_IT = 6        # area-weighted smoothing passes of log strain over neighbouring triangles (≈ 2 cm patch): skin is judged
                    # at the scale a viewer sees; a sliver triangle reshaped by Corrective Smooth is not a skin defect
AREA_CM2 = {'strain': (15, 60), 'crease': (8, 25), 'intersect': (8, 20)}   # calibrated: accepted story chair pose = 0 FAIL
CREASE_DEG = 60
FLOOR_MM = (5, 15)
HAND = ('f_', 'thumb', 'palm', 'hand')


def regions(o):
    """Per-vertex body region = the DEF bone with the largest weight (DEF-upper_arm.L.001 → upper_arm.L)."""
    names = {g.index: g.name for g in o.vertex_groups}; reg = []
    for v in o.data.vertices:
        best = max(((g.weight, names[g.group]) for g in v.groups if names[g.group].startswith('DEF-')), default=(0, '-'))
        reg.append(best[1].replace('DEF-', '').split('.0')[0] if best[1] != '-' else '-')
    return np.array(reg)


def tris(F):
    return np.array([[f[0], f[k], f[k + 1]] for f in F for k in range(1, len(f) - 1)])


def strain(V0, V1, T):
    """Singular values of the per-triangle deformation gradient, each triangle in its own 2D frame."""
    def frame(V):
        a, b = V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]]
        la = np.linalg.norm(a, axis=1); e1 = a / np.maximum(la, 1e-12)[:, None]
        n = np.cross(a, b); A = np.linalg.norm(n, axis=1); e2 = np.cross(n / np.maximum(A, 1e-12)[:, None], e1)
        D = np.zeros((len(T), 2, 2)); D[:, 0, 0] = la; D[:, 0, 1] = (b * e1).sum(1); D[:, 1, 1] = (b * e2).sum(1)
        return D, A / 2, n / np.maximum(A, 1e-12)[:, None]
    D0, A0, n0 = frame(V0); D1, A1, n1 = frame(V1)
    ok = A0 > 1e-12
    Fm = np.einsum('nij,njk->nik', D1, np.linalg.inv(np.where(ok[:, None, None], D0, np.eye(2))))
    s = np.linalg.svd(Fm, compute_uv=False)
    s[~ok] = 1
    return s[:, 0], s[:, 1], A0, A1, n0, n1


def edge_pairs(T):
    """Triangle pairs sharing an edge: (tri_a, tri_b)."""
    e = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]]); e.sort(1)
    tid = np.tile(np.arange(len(T)), 3)
    key = e[:, 0].astype(np.int64) * (int(e.max()) + 1) + e[:, 1]
    o = np.argsort(key, kind='stable'); k = key[o]; same = np.where(k[1:] == k[:-1])[0]
    return np.stack([tid[o][same], tid[o][same + 1]], 1)


def clusters(mask, P, A1):
    """Connected components of masked triangles over shared edges → list of triangle index arrays (largest area first)."""
    idx = np.where(mask)[0]
    if not len(idx): return []
    m = mask[P[:, 0]] & mask[P[:, 1]]; p = P[m]
    loc = -np.ones(len(mask), int); loc[idx] = np.arange(len(idx))
    G = coo_matrix((np.ones(len(p)), (loc[p[:, 0]], loc[p[:, 1]])), shape=(len(idx), len(idx)))
    n, lab = connected_components(G, directed=False)
    out = [idx[lab == i] for i in range(n)]
    return sorted(out, key=lambda c: -A1[c].sum())


def check(V0, V1, F, reg, floor=None, bvh_cls=None, Vec=None):
    """V0 rest, V1 posed (N×3), F faces (vertex index lists), reg per-vertex region names.
    Returns (clusters [dict], per-triangle arrays, T)."""
    T = tris(F)
    s1, s2, A0, A1, n0, n1 = strain(V0, V1, T)
    treg = reg[T[:, 0]]
    P = edge_pairs(T)
    W = coo_matrix((np.r_[A0[P[:, 1]], A0[P[:, 0]]], (np.r_[P[:, 0], P[:, 1]], np.r_[P[:, 1], P[:, 0]])), shape=(len(T),) * 2).tocsr()
    ws = A0 + np.asarray(W.sum(1)).ravel(); l1, l2 = np.log(s1), np.log(s2)
    for _ in range(PATCH_IT): l1 = (A0 * l1 + W @ l1) / ws; l2 = (A0 * l2 + W @ l2) / ws
    s1, s2 = np.exp(l1), np.exp(l2)
    hand = np.array([any(r.startswith(h) for h in HAND) for r in treg])
    lim1 = np.where(hand, STRAIN['hand']['s1'], STRAIN['body']['s1']); lim2 = np.where(hand, STRAIN['hand']['s2'], STRAIN['body']['s2'])
    bad_strain = (s1 >= lim1) | (s2 <= lim2)
    th0 = np.degrees(np.arccos(np.clip((n0[P[:, 0]] * n0[P[:, 1]]).sum(1), -1, 1)))
    th1 = np.degrees(np.arccos(np.clip((n1[P[:, 0]] * n1[P[:, 1]]).sum(1), -1, 1)))
    cr = (th1 - th0 >= CREASE_DEG) & ~hand[P[:, 0]]
    bad_crease = np.zeros(len(T), bool); bad_crease[P[cr].ravel()] = True
    inter = np.zeros(len(T), bool); partner = {}
    if bvh_cls is not None:
        tree = bvh_cls.FromPolygons([Vec(p) for p in V1], T.tolist(), all_triangles=True)
        for i, j in tree.overlap(tree):
            if i >= j or set(T[i]) & set(T[j]): continue
            if np.min(np.linalg.norm(V0[T[i]][:, None] - V0[T[j]][None], axis=2)) < .04: continue   # neighbours at rest
            inter[i] = inter[j] = True; partner.setdefault(i, set()).add(j); partner.setdefault(j, set()).add(i)
    fl = np.zeros(len(V0))
    if floor is not None: fl = np.maximum(0, floor - V1[:, 2]) * 1000

    rows = []
    def regs(c):
        u, k = np.unique(treg[c], return_counts=True); return [str(x) for x in u[np.argsort(-k)][:3]]
    for kind, mask in (('strain', bad_strain), ('crease', bad_crease), ('intersect', inter)):
        w, f = AREA_CM2[kind]
        for c in clusters(mask, P, A1):
            area = float(A1[c].sum() * 1e4)
            if area < w: continue
            row = {'kind': kind, 'status': 'FAIL' if area >= f else 'WARN', 'area_cm2': round(area, 2), 'regions': regs(c),
                   'centre': [round(float(x), 3) for x in V1[T[c]].reshape(-1, 3).mean(0)], 'tris': int(len(c)),
                   'hand': bool(hand[c].mean() > .5)}
            if kind == 'strain':
                row['s1_max'] = round(float(s1[c].max()), 2); row['s2_min'] = round(float(s2[c].min()), 2)
            if kind == 'intersect':
                other = set().union(*(partner.get(int(t), set()) for t in c)); row['against'] = regs(np.array(sorted(other)))
            rows.append(row)
    if floor is not None and fl.max() >= FLOOR_MM[0]:
        rows.append({'kind': 'floor', 'status': 'FAIL' if fl.max() >= FLOOR_MM[1] else 'WARN', 'depth_mm': round(float(fl.max()), 1),
                     'regions': [str(reg[int(np.argmax(fl))])], 'centre': [round(float(x), 3) for x in V1[int(np.argmax(fl))]]})
    rows.sort(key=lambda r: (r['status'] != 'FAIL', -r.get('area_cm2', 0)))
    tri = {'s1': s1, 's2': s2, 'strain': bad_strain, 'crease': bad_crease, 'intersect': inter, 'hand': hand, 'floor_v': fl}
    return rows, tri, T


def intersect_pairs(V0, V1, T, bvh_cls, Vec, gate=.04):
    """Posed triangle pairs that cross although ≥ gate apart at rest."""
    tree = bvh_cls.FromPolygons([Vec(p) for p in V1], T.tolist(), all_triangles=True); out = []
    for i, j in tree.overlap(tree):
        if i >= j or set(T[i]) & set(T[j]): continue
        if np.min(np.linalg.norm(V0[T[i]][:, None] - V0[T[j]][None], axis=2)) < gate: continue
        out.append((i, j))
    return out


def resolve_contacts(V0, V1, T, Adj, bvh_cls, Vec, rounds=6, share=.5, smooth=8, max_depth=.08):
    """Soft-tissue contact (the collide-deformer idea, Maya Muscle multiCollide / iCollide): skin that went through another
    body part is pushed back to that part's surface, both sides taking `share` of the depth, and the push is spread over the
    neighbourhood so the contact flattens instead of denting. Returns the corrected positions and the last pair count."""
    V = V1.copy(); deg = np.maximum(np.asarray(Adj.sum(1)).ravel(), 1); n = 0
    for _ in range(rounds):
        pairs = intersect_pairs(V0, V, T, bvh_cls, Vec); n = len(pairs)
        if not pairs: break
        part = {}
        for i, j in pairs: part.setdefault(i, set()).add(j); part.setdefault(j, set()).add(i)
        D = np.zeros_like(V); hit = np.zeros(len(V), bool)
        for i, js in part.items():
            js = sorted(js); sub = T[js]
            tree = bvh_cls.FromPolygons([Vec(p) for p in V], sub.tolist(), all_triangles=True)
            for v in T[i]:
                if hit[v]: continue
                loc, nrm, _, _ = tree.find_nearest(Vec(V[v]))
                if loc is None: continue
                depth = -float((Vec(V[v]) - loc).dot(nrm))
                if 0 < depth < max_depth: D[v] = np.array(nrm) * (depth * share + .002); hit[v] = True
        m = hit.copy()
        for _ in range(3): m = m | (Adj @ m.astype(float) > 0)
        for _ in range(smooth):                                        # spread the push (keep the largest pushes in place)
            Dn = (Adj @ D) / deg[:, None]; upd = m & ~hit; D[upd] = Dn[upd]
        V = V + D
    return V, n


def summary(rows):
    return {'FAIL': sum(r['status'] == 'FAIL' for r in rows), 'WARN': sum(r['status'] == 'WARN' for r in rows)}


def heat(tri, T, nv):
    """Per-vertex colour: grey ok · continuous strain tint · orange strain/crease cluster · blue intersection · red floor."""
    s = np.clip(np.maximum((tri['s1'] - 1.25) / .55, (.75 - tri['s2']) / .35), 0, 1) * .45
    col = np.tile([.62, .6, .57], (nv, 1)).astype(float)
    def paint(mask, rgb, a):
        v = np.unique(T[mask].ravel()); col[v] = col[v] * (1 - a) + np.array(rgb) * a
    for lvl in (.15, .3, .45):
        paint(s >= lvl, (.85, .55, .3), .35)
    paint(tri['strain'] | tri['crease'], (.95, .25, .05), .95)
    paint(tri['intersect'], (.15, .35, .95), .95)
    fv = tri['floor_v'] > 5; col[fv] = (.9, .05, .1)
    return col


VIEWS = (('front', (0, -1, 0)), ('back', (0, 1, 0)), ('right', (-1, 0, 0)), ('left', (1, 0, 0)), ('34', (-.7, -.7, .3)), ('top', (0, -.2, 1)))
# camera position offset from the centre (the figure faces −y, its right side is −x)


if __name__ == '__main__':
    import bpy
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    src, outd = sys.argv[1], sys.argv[2]; floor = 0.0 if (len(sys.argv) > 3 and sys.argv[3] == 'floor') else None
    os.makedirs(outd, exist_ok=True); name = os.path.splitext(os.path.basename(src))[0]
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
    o = bpy.data.objects['body_v3']
    V0 = np.array([v.co[:] for v in o.data.vertices]); V1 = np.load(src).astype(float); F = [list(p.vertices) for p in o.data.polygons]
    reg = regions(o)
    rows, tri, T = check(V0, V1, F, reg, floor, BVHTree, Vector)
    sm = summary(rows)
    json.dump({'summary': sm, 'issues': rows, 'limits': {'strain': STRAIN, 'area_cm2': AREA_CM2, 'crease_deg': CREASE_DEG, 'floor_mm': FLOOR_MM}},
              open(os.path.join(outd, f'{name}_deform.json'), 'w', encoding='utf-8'), indent=1)
    print(f'   deform-check {name}: FAIL {sm["FAIL"]} WARN {sm["WARN"]}')
    for r in rows:
        print('    ', r['status'], r['kind'], r.get('area_cm2', r.get('depth_mm')), r['regions'], r.get('against', ''),
              r.get('s1_max', ''), r.get('s2_min', ''), r['centre'])
    if os.environ.get('NO_RENDER'): sys.stdout.flush(); os._exit(0)
    col = heat(tri, T, len(V1))
    if os.environ.get('ON_REST'): V1 = V0; name += '_onrest'          # paint the findings on the rest mesh: which skin is it?
    me = bpy.data.meshes.new('posed'); me.from_pydata([tuple(p) for p in V1], [], F); me.update()
    ca = me.color_attributes.new('heat', 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(col): ca.data[i].color = (*c, 1)
    ob = bpy.data.objects.new('posed', me); bpy.context.scene.collection.objects.link(ob)
    for x in list(bpy.data.objects):
        if x is not ob: bpy.data.objects.remove(x, do_unlink=True)
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'VERTEX'; sc.display.shading.show_cavity = True; sc.render.resolution_x = sc.render.resolution_y = 520
    lo_, hi_ = Vector(V1.min(0)), Vector(V1.max(0)); c = (lo_ + hi_) / 2; size = max(hi_ - lo_)
    cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co; cam.type = 'ORTHO'
    def shot(path, centre, off, scale):
        off = Vector(off).normalized(); co.location = centre + off * 4; co.rotation_euler = (-off).to_track_quat('-Z', 'Y').to_euler()
        cam.ortho_scale = scale; sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    for tag, off in VIEWS:
        shot(os.path.join(outd, f'{name}_heat_{tag}.png'), c, off, size * 1.2)
    # close-ups of FAIL clusters: looked at from outside the body, along the cluster's offset from the body centre
    k = 0
    for r in rows:
        if r['status'] != 'FAIL' or 'centre' not in r or r.get('hand'): continue
        p = Vector(r['centre']); off = p - c; off.z *= .3
        if off.length < 1e-3: off = Vector((0, -1, 0))
        shot(os.path.join(outd, f'{name}_c{k}.png'), p, off, .35); r['closeup'] = f'{name}_c{k}.png'; k += 1
        if k >= 6: break
    json.dump({'summary': sm, 'issues': rows, 'limits': {'strain': STRAIN, 'area_cm2': AREA_CM2, 'crease_deg': CREASE_DEG, 'floor_mm': FLOOR_MM}},
              open(os.path.join(outd, f'{name}_deform.json'), 'w', encoding='utf-8'), indent=1)
    print('   heatmaps →', outd); sys.stdout.flush(); os._exit(0)
