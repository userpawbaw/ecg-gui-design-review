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

    def pose_floor():
        sit(0.0, lean=-12)                                                      # back against the shelf (D-050)
        P.turn('chest', 10, X); P.turn('neck', 22, X); P.turn('head', 26, X); P.turn('head', -8, (0, 0, 1))
        P.leg('R', (-.12, -.31, .09), (0, -1, 0), (-.18, -1.2, 1.2))                              # right knee up high, heel near the seat
        P.leg('L', (-.02, -.36, .06), (-.85, -.45, 0), (1.4, -.35, .05), up=(.15, .25, 1))        # left leg folded flat, knee out
        # right arm draped over the raised knee (user 2026-10-05: the first try wrapped the forearm round the knee): the
        # elbow rests on the top front of the knee, the forearm reaches forward past it, the hand hangs
        rb = rig.data.bones; L1 = rb['ORG-upper_arm.R'].length; L2 = rb['ORG-forearm.R'].length
        S = P.head('ORG-upper_arm.R'); K = P.head('ORG-shin.R')
        top = K + Vector((0, -.035, .05))                                        # knee cap top
        d = (top - S); E = S + d.normalized() * min(L1 * .985, d.length + .03)  # elbow on the knee top (just past it)
        if (E - S).length < L1 * .95:                                            # shoulder closer than the upper arm: elbow drops beside the knee
            h = math.sqrt(max(L1 ** 2 - d.length ** 2, 0)) * .9; E = top + Vector((-.6, -.8, 0)).normalized() * h * .5 + Vector((0, 0, -h * .5))
        W = E + Vector((-.30, -.85, -.42)).normalized() * L2 * .985
        pole = E + (E - (S + W) / 2).normalized() * .5
        P.arm('R', W, Vector((-.08, -.30, -1)), Vector((.15, 1, 0)), pole)
        print('   floor R arm: shoulder', tuple(round(v, 3) for v in S), 'knee top', tuple(round(v, 3) for v in top),
              '|S-top|', round((top - S).length, 3), 'L1', round(L1, 3), 'elbow target', tuple(round(v, 3) for v in E),
              'got', tuple(round(v, 3) for v in P.head('ORG-forearm.R')))
        ank = P.head('ORG-foot.L')
        P.arm('L', ank + Vector((.02, -.02, .085)), Vector((-.35, -.55, -.75)), Vector((0, 0, -1)), P.head('ORG-upper_arm.L') + Vector((.9, .3, -.2)))
        P.curl('R', 55, thumb=20); P.curl('L', 70, thumb=25)

    def pose_chair():
        h = SEAT_H['chair']; sit(h, lean=-7, dy=.02)
        P.turn('neck', 6, X); P.turn('head', 4, X)
        for s, sg in (('L', 1), ('R', -1)):
            P.leg(s, (sg * .12, -.47, .085), (sg * .05, -1, 0), (sg * .12, -1.5, h + .1))
            P.arm(s, (sg * .14, -.30, h + .17), Vector((0, -1, -.45)), Vector((0, 0, -1)), (sg * .55, .45, h + .45))
            P.curl(s, 45, thumb=10)

    def pose_desk():
        h = SEAT_H['desk']; sit(h, lean=9)
        P.turn('neck', 8, X); P.turn('head', 6, X)
        for s, sg in (('L', 1), ('R', -1)):
            P.leg(s, (sg * .13, -.40, .085), (sg * .08, -1, 0), (sg * .14, -1.5, h + .1))
            P.arm(s, (sg * .12, -.40, .80), Vector((-sg * .15, -1, -.25)), Vector((0, 0, -1)), (sg * .7, .1, .45))
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

    def grip_at(side, c, curl, thumb):
        """Hand over a horizontal rung (centre c): fingers point up-forward over the top, palm toward the rung."""
        f = Vector((0, -.55, 1)).normalized(); n = Vector((0, -1, -.25)); n = (n - n.dot(f) * f).normalized()
        rb = rig.data.bones                                                  # wrist → middle knuckle (MCP) at rest
        Lp = (rb[f'ORG-f_middle.01.{side}'].head_local - rb[f'ORG-hand.{side}'].head_local).length
        mcp = c - n * (RUNG_R + .015)                                        # knuckle 15 mm off the rung surface
        wrist = mcp - f * Lp
        sh = P.head(f'ORG-upper_arm.{side}'); sg = 1 if side == 'L' else -1
        P.arm(side, wrist, f, n, sh + Vector((sg * .6, .35, -.35)))
        print('   wrist', side, 'target', tuple(round(v, 3) for v in wrist), 'got', tuple(round(v, 3) for v in P.head(f'ORG-hand.{side}')),
              'mcp target', tuple(round(v, 3) for v in mcp), 'got', tuple(round(v, 3) for v in P.head(f'ORG-f_middle.01.{side}')))
        b = RUNG_R + curl                                                    # finger axis ≈ r + 9 mm (squeeze r + 6 mm) at mid-phalanx
        P.wrap_bar(side, c, (1, 0, 0), (b + .006, b + .004, b + .003))
        P.curl(side, 0, thumb=thumb)

    def pose_climb(squeeze=False):
        P.move('torso', (0, -.04, 0)); P.turn('chest', 4, X); P.turn('neck', -14, X); P.turn('head', -26, X)
        P.leg('R', (-.11, .0, .085), (-.05, -1, 0), (-.15, -1.5, .5))                            # right sole on rung 0
        c1 = rung(1, .11)
        P.leg('L', c1 + Vector((0, .115, .105)), (.05, -1, 0), (.25, -1.4, 1.1))               # left foot up on rung 1
        k = .006 if squeeze else .009
        grip_at('R', rung(6, -.16), k, 22); grip_at('L', rung(4, .16), k, 22)

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
    fig_path = os.path.join(OUT, 'figure.json')
    fig = json.load(open(fig_path, encoding='utf-8'))
    fig.setdefault('poses_v3', {}).update(results)
    with open(fig_path, 'w', encoding='utf-8') as fh: json.dump(fig, fh)
    if '--save' in sys.argv: bpy.ops.wm.save_as_mainfile(filepath=sys.argv[sys.argv.index('--save') + 1])


if __name__ == '__main__':
    build()
    os._exit(0)                                                              # bpy + Rigify hang on interpreter shutdown
