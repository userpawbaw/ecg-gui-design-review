"""Pose validator for the Rigify figure (skill .claude/skills/pose-anatomy; limits in its references/rom.md).

check(rig, verts, spec) measures a posed rig in anatomical terms and grades each value OK / WARN / FAIL:
  ROM       hip, knee, ankle, shoulder, elbow, forearm, wrist, neck, trunk, finger joints (from ORG bones, pose vs rest)
  hinge     elbow / knee bend direction (no hyperextension), elbow hinge twist
  collide   body capsules round the ORG bones: non-adjacent parts may touch, not sink into each other
  ground    floor / seat penetration of the posed mesh
  contacts  the pose's intended contacts (part ↔ part, part ↔ floor / point) must actually touch
  balance   standing poses: centre of mass over the feet (plus named supports)
Figure frame: z up, front −y, person's left +x. Rest = A-pose, palms facing the body (forearm neutral).
User 2026-10-05: "관절이나 발목 위치 … 자체 피드백 루프가 없는 것 같아 … 다른 객체와 충돌, 관절 가동 범위 등을 검토할 수 있어야".
"""
import json, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

# (limit, comfort) in degrees — references/rom.md
ROM = {
    'hip_flex': (125, 110), 'hip_ext': (30, 15), 'hip_abd': (45, 35), 'hip_add': (30, 20), 'hip_rot_ext': (55, 45), 'hip_rot_int': (40, 30),
    'knee_flex': (150, 140), 'ankle_dorsi': (30, 20), 'ankle_plantar': (50, 40), 'foot_turn': (35, 25),
    'sh_elev': (180, 120), 'sh_ext': (50, 35), 'sh_cross': (50, 35), 'sh_rot_ext': (90, 60), 'sh_rot_int': (70, 60),
    'elbow_flex': (145, 125), 'elbow_twist': (15, 8), 'pronation': (80, 60), 'supination': (80, 60),
    'wrist_flex': (70, 50), 'wrist_ext': (70, 45), 'wrist_radial': (20, 15), 'wrist_ulnar': (35, 25),
    'neck_flex': (60, 45), 'neck_ext': (70, 50), 'neck_lat': (45, 30), 'neck_rot': (80, 60),
    'trunk_flex': (80, 50), 'trunk_ext': (30, 20), 'trunk_lat': (30, 20), 'trunk_rot': (35, 25),
    'mcp': (90, 75), 'pip': (110, 95), 'dip': (80, 65), 'finger_hyper': (20, 10),
}
RADIUS = {'pelvis': .13, 'chest': .13, 'head': .095, 'upper': .045, 'fore': .037, 'hand': .028, 'thigh': .07, 'shin': .05, 'foot': .04}
ADJ = {('pelvis', 'chest'), ('chest', 'head'), ('chest', 'upper'), ('pelvis', 'thigh'), ('upper', 'fore'), ('fore', 'hand'),
       ('thigh', 'shin'), ('shin', 'foot')}
FRONT, UP = Vector((0, -1, 0)), Vector((0, 0, 1))


def _deg(x): return math.degrees(x)


def _grade(v, lim, com):
    a = abs(v)
    return 'FAIL' if a > lim + 1e-6 else 'WARN' if a > com + 1e-6 else 'OK'


def _twist(q, axis):
    """Signed twist angle (deg) of quaternion q about unit axis."""
    p = Vector((q.x, q.y, q.z)).dot(axis)
    return _deg(2 * math.atan2(p, q.w)) if abs(p) > 1e-9 or q.w else 0.0


def _seg_dist(p1, q1, p2, q2):
    """Closest distance between segments p1q1 and p2q2 (numpy 3-vectors)."""
    d1, d2, r = q1 - p1, q2 - p2, p1 - p2
    a, e, f = d1 @ d1, d2 @ d2, d2 @ r
    if a < 1e-12 and e < 1e-12: return float(np.linalg.norm(r))
    if a < 1e-12: s, t = 0.0, np.clip(f / e, 0, 1)
    else:
        c = d1 @ r
        if e < 1e-12: t, s = 0.0, np.clip(-c / a, 0, 1)
        else:
            b = d1 @ d2; den = a * e - b * b
            s = np.clip((b * f - c * e) / den, 0, 1) if den > 1e-12 else 0.0
            t = (b * s + f) / e
            if t < 0: t, s = 0.0, np.clip(-c / a, 0, 1)
            elif t > 1: t, s = 1.0, np.clip((b - c) / a, 0, 1)
    return float(np.linalg.norm(p1 + d1 * s - (p2 + d2 * t)))


class Body:
    def __init__(self, rig):
        self.rig = rig; self.pb = rig.pose.bones; self.b = rig.data.bones
    def D(self, n):
        """Rotation carrying the bone's rest frame to its pose frame (armature space)."""
        return (self.pb[n].matrix.to_3x3().normalized() @ self.b[n].matrix_local.to_3x3().normalized().inverted())
    def dir(self, n): return (self.pb[n].tail - self.pb[n].head).normalized()
    def rdir(self, n): return (self.b[n].tail_local - self.b[n].head_local).normalized()
    def head(self, n): return self.pb[n].head.copy()
    def tail(self, n): return self.pb[n].tail.copy()
    def capsules(self):
        C = {'pelvis': (self.head('ORG-spine'), self.tail('ORG-spine.001'), 'pelvis'),
             'chest': (self.head('ORG-spine.002'), self.tail('ORG-spine.003'), 'chest'),
             'head': (self.head('ORG-spine.006') + (self.tail('ORG-spine.006') - self.head('ORG-spine.006')) * .35, self.tail('ORG-spine.006') - (self.tail('ORG-spine.006') - self.head('ORG-spine.006')) * .3, 'head')}
        for s in 'LR':
            C[f'upper.{s}'] = (self.head(f'ORG-upper_arm.{s}'), self.tail(f'ORG-upper_arm.{s}'), 'upper')
            C[f'fore.{s}'] = (self.head(f'ORG-forearm.{s}'), self.tail(f'ORG-forearm.{s}'), 'fore')
            C[f'hand.{s}'] = (self.head(f'ORG-hand.{s}'), self.tail(f'ORG-f_middle.01.{s}'), 'hand')
            C[f'thigh.{s}'] = (self.head(f'ORG-thigh.{s}'), self.tail(f'ORG-thigh.{s}'), 'thigh')
            C[f'shin.{s}'] = (self.head(f'ORG-shin.{s}'), self.tail(f'ORG-shin.{s}'), 'shin')
            C[f'foot.{s}'] = (self.head(f'ORG-foot.{s}'), self.tail(f'ORG-toe.{s}'), 'foot')
        return C


def _in_frame(R, v): return (R.inverted() @ v).normalized()


def finger_axis(B, s, f, j, posed=True):
    """Hinge axis of finger joint j (1 = MCP): the rest axis (parent bone × palm normal) carried by the parent bone.
    Measuring about this axis stays defined in a fist (2026-10-06: the old palm-normal projection went singular once the
    proximal phalanx pointed along the palm normal, ≈ 90° MCP, and reported PIP 'hyperextension −101°')."""
    k = ('f_index', 'f_middle', 'f_ring', 'f_pinky').index(f) + 1
    par = f'ORG-palm.0{k}.{s}' if j == 1 else f'ORG-{f}.0{j - 1}.{s}'
    n0 = Vector((-1 if s == 'L' else 1, 0, 0))                          # rest palm normal (palms face the body)
    a0 = B.rdir(par).cross(n0).normalized()
    return ((B.D(par) @ a0).normalized() if posed else a0), par


def finger_flexes(B, s, posed=True):
    """Signed flexion (deg) of every long-finger joint about its hinge axis; + = toward the palm."""
    out = {}
    for f in ('f_index', 'f_middle', 'f_ring', 'f_pinky'):
        for j in (1, 2, 3):
            a, par = finger_axis(B, s, f, j, posed)
            g = B.dir if posed else B.rdir; p, d = g(par), g(f'ORG-{f}.0{j}.{s}')
            out[(f, j)] = _deg(math.atan2(p.cross(d).dot(a), p.dot(d)))
    return out


def check(rig, verts=None, spec=None):
    """Return a list of rows {group, name, value, limit, comfort, status, note}."""
    spec = spec or {}; B = Body(rig); rows = []
    over = spec.get('override', {})                                   # posture-specific norms, e.g. cross-legged hip rotation
    def add(group, name, value, key=None, lim=None, com=None, status=None, note=''):
        if key: lim, com = ROM[key]
        for k_, (l_, c_, why) in over.items():
            if k_ in name: lim, com, note = l_, c_, (note + ' ' + why).strip()
        st = status or _grade(value, lim, com)
        rows.append(dict(group=group, name=name, value=round(float(value), 1), limit=lim, comfort=com, status=st, note=note))
    allow = set(spec.get('allow_warn', ()))
    Dp, Dc, Dh = B.D('ORG-spine'), B.D('ORG-spine.003'), B.D('ORG-spine.006')
    # ---- trunk and neck ----
    for nm, Ra, Rb, keys in (('trunk', Dp, Dc, ('trunk_flex', 'trunk_ext', 'trunk_lat', 'trunk_rot')), ('neck', Dc, Dh, ('neck_flex', 'neck_ext', 'neck_lat', 'neck_rot'))):
        q = (Ra.inverted() @ Rb).to_quaternion(); u = q @ UP
        flex = _deg(math.atan2(u.dot(FRONT), u.dot(UP)))
        add('ROM', f'{nm} flexion' if flex >= 0 else f'{nm} extension', flex, keys[0] if flex >= 0 else keys[1])
        add('ROM', f'{nm} lateral', _deg(math.asin(max(-1, min(1, u.x)))), keys[2])
        add('ROM', f'{nm} rotation', _twist(q, UP), keys[3])
    for s, sg in (('L', 1), ('R', -1)):
        OUT = Vector((sg, 0, 0))
        # ---- hip ----
        t = _in_frame(Dp, B.dir(f'ORG-thigh.{s}'))
        flex = _deg(math.atan2(t.dot(FRONT), -t.z))
        add('ROM', f'hip.{s} flexion' if flex >= 0 else f'hip.{s} extension', flex, 'hip_flex' if flex >= 0 else 'hip_ext')
        ab = _deg(math.asin(max(-1, min(1, t.dot(OUT)))))
        add('ROM', f'hip.{s} abduction' if ab >= 0 else f'hip.{s} adduction', ab, 'hip_abd' if ab >= 0 else 'hip_add')
        t0 = B.rdir(f'ORG-thigh.{s}'); a0 = (FRONT - FRONT.dot(t0) * t0).normalized()
        sh = _in_frame(Dp, B.dir(f'ORG-shin.{s}')); kf_ = _deg(t.angle(sh))
        nX = Vector((1, 0, 0)).cross(t)                                      # neutral fold direction of the shin (goniometry)
        if kf_ > 30 and nX.length > .3:
            nX.normalize(); p = (sh - sh.dot(t) * t).normalized()
            rot = _deg(math.atan2(-sg * p.dot(t.cross(nX)), p.dot(nX)))       # + = external (foot swings toward the midline)
            add('ROM', f'hip.{s} rotation ' + ('external' if rot >= 0 else 'internal'), rot, 'hip_rot_ext' if rot >= 0 else 'hip_rot_int')
        # ---- knee ----
        T, S_ = B.dir(f'ORG-thigh.{s}'), B.dir(f'ORG-shin.{s}')
        kf = _deg(T.angle(S_)); add('ROM', f'knee.{s} flexion', kf, 'knee_flex')
        aT = B.D(f'ORG-thigh.{s}') @ a0; p = S_ - S_.dot(T) * T
        if kf > 10 and p.length > 1e-6:
            back = _deg(p.normalized().angle(aT))                            # 180 = shin folds behind the thigh (correct)
            add('hinge', f'knee.{s} bend direction', 180 - back, lim=90, com=35, note='0 = shin folds straight back; >90 = knee bends forward')
        # ---- ankle ----
        qa = (B.D(f'ORG-shin.{s}').inverted() @ B.D(f'ORG-foot.{s}')).to_quaternion()
        f0 = B.rdir(f'ORG-foot.{s}'); fl = qa @ f0; up0 = (UP - UP.dot(f0) * f0).normalized()
        df = _deg(math.atan2(fl.dot(up0), fl.dot(f0)))
        add('ROM', f'ankle.{s} dorsiflexion' if df >= 0 else f'ankle.{s} plantarflexion', df, 'ankle_dorsi' if df >= 0 else 'ankle_plantar')
        add('ROM', f'ankle.{s} turn', _deg(math.atan2(fl.dot(OUT), fl.dot(f0))), 'foot_turn')
        # ---- shoulder ----
        u = _in_frame(Dc, B.dir(f'ORG-upper_arm.{s}'))
        elev = _deg(u.angle(Vector((0, 0, -1)))); add('ROM', f'shoulder.{s} elevation', elev, 'sh_elev')
        if u.dot(FRONT) < 0: add('ROM', f'shoulder.{s} extension', _deg(math.atan2(-u.dot(FRONT), -u.z)), 'sh_ext')
        cross = _deg(math.asin(max(-1, min(1, -u.dot(OUT)))))
        if cross > 0: add('ROM', f'shoulder.{s} adduction across body', cross, 'sh_cross')
        u0 = B.rdir(f'ORG-upper_arm.{s}'); au0 = (FRONT - FRONT.dot(u0) * u0).normalized()
        fa = _in_frame(Dc, B.dir(f'ORG-forearm.{s}')); nX = u.cross(Vector((1, 0, 0)))   # neutral: forearm folds forward
        if _deg(u.angle(fa)) > 30 and nX.length > .3:
            nX.normalize(); p = (fa - fa.dot(u) * u).normalized()
            rot = _deg(math.atan2(-sg * p.dot(u.cross(nX)), p.dot(nX)))       # + = external (forearm swings outward)
            add('ROM', f'shoulder.{s} rotation ' + ('external' if rot >= 0 else 'internal'), rot, 'sh_rot_ext' if rot >= 0 else 'sh_rot_int')
        # ---- elbow ----
        U_, F_ = B.dir(f'ORG-upper_arm.{s}'), B.dir(f'ORG-forearm.{s}')
        ef = _deg(U_.angle(F_)); add('ROM', f'elbow.{s} flexion', ef, 'elbow_flex')
        aU = B.D(f'ORG-upper_arm.{s}') @ au0; p = F_ - F_.dot(U_) * U_
        if ef > 10 and p.length > 1e-6:
            add('hinge', f'elbow.{s} bend direction', _deg(p.normalized().angle(aU)), lim=90, com=35, note='0 = forearm folds forward onto the biceps')
        qe = (B.D(f'ORG-upper_arm.{s}').inverted() @ B.D(f'ORG-forearm.{s}')).to_quaternion()
        add('hinge', f'elbow.{s} hinge twist', _twist(qe, B.rdir(f'ORG-forearm.{s}')), 'elbow_twist')
        # ---- forearm rotation and wrist ----
        qh = (B.D(f'ORG-forearm.{s}').inverted() @ B.D(f'ORG-hand.{s}')).to_quaternion()
        h0 = B.rdir(f'ORG-hand.{s}'); pr = _twist(qh, h0) * sg                 # + = pronation (palm turns down/back)
        add('ROM', f'forearm.{s} ' + ('pronation' if pr >= 0 else 'supination'), pr, 'pronation' if pr >= 0 else 'supination')
        n0 = Vector((-sg, 0, 0)); n0 = (n0 - n0.dot(h0) * h0).normalized(); r0 = FRONT - FRONT.dot(h0) * h0 - FRONT.dot(n0) * n0; r0.normalize()
        hl = qh @ h0
        wf = _deg(math.atan2(hl.dot(n0), hl.dot(h0)))
        add('ROM', f'wrist.{s} flexion' if wf >= 0 else f'wrist.{s} extension', wf, 'wrist_flex' if wf >= 0 else 'wrist_ext')
        dv = _deg(math.atan2(hl.dot(r0), hl.dot(h0)))
        add('ROM', f'wrist.{s} radial deviation' if dv >= 0 else f'wrist.{s} ulnar deviation', dv, 'wrist_radial' if dv >= 0 else 'wrist_ulnar')
        # ---- fingers ----
        cur, rest = finger_flexes(B, s, True), finger_flexes(B, s, False)
        for (f, j), v in cur.items():
            # rest-relative: the base mesh's rest hand is flat (fingers straight); its raw rest angles (MCP 18–33°) are the
            # metacarpal-vs-finger bone offset of the fit, not flexion (counting them made a real 60° fist read 90°, 2026-10-06)
            key = ('mcp', 'pip', 'dip')[j - 1]; fl = v - rest[(f, j)]
            if fl >= 0: add('ROM', f'{f}.{s} {key.upper()}', fl, key)
            else: add('ROM', f'{f}.{s} {key.upper()} hyperextension', fl, 'finger_hyper')
    # ---- self-collision ----
    C = B.capsules(); names = list(C)
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]; ka, kb = C[a][2], C[b][2]
            sa, sb = a.split('.')[-1] if '.' in a else '', b.split('.')[-1] if '.' in b else ''
            if ((ka, kb) in ADJ or (kb, ka) in ADJ) and (not sa or not sb or sa == sb): continue
            if {ka, kb} == {'upper', 'chest'} or {ka, kb} == {'thigh', 'pelvis'}: continue
            ra, rb = RADIUS[ka], RADIUS[kb]
            d = _seg_dist(np.array(C[a][0]), np.array(C[a][1]), np.array(C[b][0]), np.array(C[b][1]))
            pen = (ra + rb - d) / (ra + rb)
            if pen > .1: add('collide', f'{a} ↔ {b} penetration', pen * 100, lim=45, com=25, note='% of summed radii')
    # ---- ground and seat ----
    if verts is not None:
        V = np.asarray(verts)
        fz = spec.get('floor_z')
        if fz is not None:
            lw = V[np.argmin(V[:, 2])]
            add('ground', 'below floor', max(0.0, (fz - lw[2]) * 1000), lim=25, com=15, note=f'mm, lowest at ({lw[0]:.2f}, {lw[1]:.2f})')
        if spec.get('seat'):
            h, (x0, x1, y0, y1) = spec['seat']['h'], spec['seat']['rect']
            m = (V[:, 0] > x0) & (V[:, 0] < x1) & (V[:, 1] > y0) & (V[:, 1] < y1) & (V[:, 2] > h - .10)   # the seat slab only; legs/rungs below: scene check
            if m.any():
                k = np.argmin(np.where(m, V[:, 2], 9)); lw = V[k]
                add('ground', 'into the seat', max(0.0, (h - lw[2]) * 1000), lim=25, com=15, note=f'mm, lowest at ({lw[0]:.2f}, {lw[1]:.2f}, {lw[2]:.2f})')
        # ---- balance (standing) ----
        if spec.get('balance'):
            com_ = V.mean(0); low = V[V[:, 2] < V[:, 2].min() + .03]
            pts = np.vstack([low[:, :2]] + [np.array([p[:2]]) for p in spec.get('supports', [])])
            lo, hi = pts.min(0) - .04, pts.max(0) + .04
            out = max(0.0, *(lo - com_[:2]), *(com_[:2] - hi))
            add('balance', 'centre of mass outside support', out * 1000, lim=60, com=20, note='mm (support box of feet + supports)')
    # ---- intended contacts ----
    pts = {'floor': None}
    for c in spec.get('contacts', ()):
        a, b, tol = c[0], c[1], (c[2] if len(c) > 2 else .03)
        A = C[a]; ra = RADIUS[A[2]]
        if b == 'floor':
            if verts is None: continue
            gap = min(A[0].z, A[1].z) - ra - spec.get('floor_z', 0.0)
        elif isinstance(b, str):
            Bc = C[b]; gap = _seg_dist(np.array(A[0]), np.array(A[1]), np.array(Bc[0]), np.array(Bc[1])) - ra - RADIUS[Bc[2]]
        else:
            p = np.array(b); gap = _seg_dist(np.array(A[0]), np.array(A[1]), p, p) - ra
        add('contact', f'{a} → {b if isinstance(b, str) else "point"} gap', gap * 1000, lim=tol * 2000, com=tol * 1000, note='mm (− = pressed in)')
    for r in rows:
        if r['status'] == 'WARN' and any(k in r['name'] for k in allow): r['status'] = 'WARN*'
    return rows


def report(rows, title='', path=None, show_ok=False):
    n = {k: sum(r['status'].startswith(k) for r in rows) for k in ('OK', 'WARN', 'FAIL')}
    print(f'   pose-check {title}: OK {n["OK"]}  WARN {n["WARN"]}  FAIL {n["FAIL"]}')
    for r in rows:
        if show_ok or r['status'] != 'OK':
            print(f'     {r["status"]:5} {r["group"]:8} {r["name"]:42} {r["value"]:7.1f}  (comfort {r["comfort"]}, limit {r["limit"]}) {r["note"]}')
    if path:
        with open(path, 'w', encoding='utf-8') as fh: json.dump(dict(title=title, summary=n, rows=rows), fh, ensure_ascii=False, indent=1)
    return n


def scene_collisions(fig, objects, step=4, ignore=(), reach=.2):
    """Figure (evaluated mesh, world space) vs scene meshes: max penetration (mm) per object, by nearest-surface normal test
    on every step-th figure vertex inside the object's bounding box. `reach` caps the search: for thin parts (chair arms, ~3 cm)
    a vertex 15 cm from any surface cannot be inside, yet a single-sided face seen from behind reads as 'inside' (2026-10-06:
    158 mm reported in the empty gap between the hip and the GreenChair_01 armrest). Use reach ≈ 2 × the part thickness."""
    import bpy
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get()
    ev = fig.evaluated_get(dg); me = ev.to_mesh(); M = fig.matrix_world
    P = [M @ v.co for i, v in enumerate(me.vertices) if i % step == 0]; ev.to_mesh_clear()
    out = {}
    for o in objects:
        if o is fig or o.type != 'MESH' or o.name.startswith(tuple(ignore)) or o.hide_render: continue
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        lo = Vector((min(p.x for p in bb), min(p.y for p in bb), min(p.z for p in bb))); hi = Vector((max(p.x for p in bb), max(p.y for p in bb), max(p.z for p in bb)))
        cand = [p for p in P if lo.x < p.x < hi.x and lo.y < p.y < hi.y and lo.z < p.z < hi.z]
        if not cand: continue
        bvh = BVHTree.FromObject(o, dg); Mi = o.matrix_world.inverted(); Mw = o.matrix_world; worst, where = 0.0, None
        for p in cand:
            loc, nrm, _, d = bvh.find_nearest(Mi @ p, reach)
            if loc is None: continue
            if (Mi @ p - loc).dot(nrm) < 0:
                dd = ((Mw @ loc) - p).length
                if dd > worst: worst, where = dd, p
        if worst > 0:
            local = M.inverted() @ where                                  # figure frame: which body part
            out[o.name] = (round(worst * 1000, 1), tuple(round(v, 2) for v in local))
    return out
