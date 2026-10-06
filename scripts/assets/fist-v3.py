"""Fist close / open on the Rigify figure, driven by joint curves measured from the user's own hand video (D-052).

  end pose   anatomical fist (rom.md, cross-checked with the video plateaus): MCP 85–92 (index → pinky), PIP 100, DIP 0.7 × PIP,
             each finger scaled back until its tip rests on the palm (capsule gap ≥ −2 mm); thumb solved so its pad lies on the
             index/middle middle phalanges (outside the fist), not inside it
  timing     assets/processed/handcap/fist_profile_v1.json — per joint, normalised flexion vs normalised time (close and open):
             PIP leads the close and MCP completes it; the open starts at MCP/DIP and PIP follows; the thumb IP closes last
             (matches PMC10296280 and the video)
  gate       every sampled frame of the close and the open → pose-check-v3 (finger ROM) + hand_collisions (finger / thumb / palm
             capsules); any FAIL → exit 1 and no output
Run: python scripts/assets/fist-v3.py [OUT_DIR]   (needs the rig cache from build-figure-v3.py)
"""
import importlib.util, json, math, os, sys
import numpy as np, bpy
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
def _load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
rf = _load('rf', 'rigify-fit-v3.py'); pc = _load('pc', 'pose-check-v3.py')
OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].endswith('.py') else os.path.join(ROOT, 'verification', 'r1-fist-20261006')
os.makedirs(OUT, exist_ok=True)
PROF = json.load(open(os.path.join(ROOT, 'assets', 'processed', 'handcap', 'fist_profile_v1.json')))
S = np.array(PROF['s'])
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']; P = rf.Poser(rig); SIDE = 'R'
def _up2():                                                         # Rigify finger drivers (MCH-*_drv) lag one update
    bpy.context.view_layer.update(); bpy.context.view_layer.update()
P.up = _up2
for _m in o.modifiers: _m.show_viewport = False                     # solving reads bones only: skip the 53k-vertex deform on every
                                                                     # update (the joint closure search timed out at 40 min with it on)
CHAIR = None
CHAIR_SPEC = {'allow_warn': ['MCP', 'PIP', 'DIP'], 'contacts': []}   # contacts set when the chair is placed
MODE = os.environ.get('FIST_POSE', 'study')                         # study: hand held up in front | chair: D-053 story pose
CHAIR_H = .43                                                        # build-figure-v3 SEAT_H['chair']
X_ = Vector((1, 0, 0))


def pose_body():
    P.reset()
    if MODE == 'study':                                              # hand study: elbow bent 90°, forearm forward, thumb up
        sh = P.head(f'ORG-upper_arm.{SIDE}')
        P.arm_relaxed(SIDE, sh + Vector((0.0, -.28, -.30)), None, sh + Vector((0.0, .3, -.35)), flex=0, dev=0, pronation=0); return
    # chair (D-053): build-figure-v3 pose_chair at the placed chair's seat height; right forearm along the armrest, fist at its
    # front end (user reference 2026-10-06)
    global CHAIR, CHAIR_H
    if CHAIR is None:
        import importlib.util as _iu
        _sp = _iu.spec_from_file_location('chair_motion', os.path.join(HERE, 'chair-motion-v3.py')); _cm = _iu.module_from_spec(_sp)
        _sp.loader.exec_module(_cm); CHAIR = _cm.place_chair(bpy, Vector, ROOT); CHAIR_H = CHAIR['h']
    h = CHAIR_H - .015; hz = P.head('ORG-thigh.L').z                   # 15 mm into the cushion
    P.move('torso', (0, .02, h + .095 - hz)); P.turn('torso', -1, X_)
    P.turn('chest', -5, Vector((0, 1, 0)))                            # lean 5° onto the right armrest: the seated shoulder sits
    P.turn('neck', 6, X_); P.turn('head', 4, X_); P.turn('neck', 3, Vector((0, 1, 0)))   # 3 cm too high for the elbow to reach it
    for s_, sg in (('L', 1), ('R', -1)):
        P.leg(s_, (sg * .15, -.50, .10), (sg * .08, -1, -.2), (sg * .15, -1.5, h + .2))   # feet 3 cm wider, 5 cm further out:
    th = P.head('ORG-thigh.L').lerp(P.head('ORG-shin.L'), .62)                            # calves clear the chair's front legs
    def l_gap(dz):                                                    # left hand resting on the thigh: solve its height
        P.arm_relaxed('L', th + Vector((.01, .05, dz)), None, (.55, .45, h + .45), flex=-22, dev=-30, pronation=72)
        C = pc.Body(rig).capsules()
        return pc._seg_dist(np.array(C['hand.L'][0]), np.array(C['hand.L'][1]), np.array(C['thigh.L'][0]), np.array(C['thigh.L'][1])) \
            - pc.RADIUS['hand'] - pc.RADIUS['thigh']
    lo_, hi_ = .05, .25
    for _ in range(14):
        mid = (lo_ + hi_) / 2
        if l_gap(mid) < .003: lo_ = mid
        else: hi_ = mid
    l_gap(hi_)
    P.curl('L', 40, thumb=10)
    ar = CHAIR['arms']['R']; zf = ar['z'] + .037                                  # forearm axis = its radius above the armrest top
    Lf = rig.data.bones['ORG-forearm.R'].length
    sh = P.head('ORG-upper_arm.R'); Lu = rig.data.bones['ORG-upper_arm.R'].length
    elbow = Vector((ar['x'], sh.y + .03, zf + .01))                               # elbow on the armrest under the shoulder,
    wrist = elbow + Vector((0, -Lf, -.01))                                        # forearm along it, fist past its front end
    print(f'   reach R elbow: shoulder → elbow on the armrest {(elbow - sh).length:.3f} m of {Lu:.3f} m upper arm')
    P.arm_relaxed('R', wrist, None, elbow + Vector((-.12, .30, -.08)), flex=10, dev=0, pronation=30)
    CHAIR_SPEC['contacts'] = [('fore.R', tuple((wrist + elbow) / 2 - Vector((0, 0, .037))), .03), ('hand.L', 'thigh.L', .03)]

pose_body()
FING = ('f_index', 'f_middle', 'f_ring', 'f_pinky'); VID = {'f_index': 'index', 'f_middle': 'middle', 'f_ring': 'ring', 'f_pinky': 'pinky'}
CTL = [f'{f}.0{j}.{SIDE}' for f in FING for j in (1, 2, 3)] + [f'thumb.0{j}.{SIDE}' for j in (1, 2, 3)]


def zero_hand():
    for n in CTL:
        b = rig.pose.bones[n]; b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = (1, 0, 0, 0); b.location = (0, 0, 0); b.scale = (1, 1, 1)
    P.up()


def flex(ctl, org, deg):
    """Bend one joint toward the palm by deg (world axis bone × palm normal, as Poser.curl)."""
    n = P.palm_normal(SIDE); y = (P.tail(org) - P.head(org)).normalized(); ax = y.cross(n)
    if ax.length > 1e-4 and abs(deg) > 1e-3: P.turn(ctl, deg, ax.normalized()); unscale(ctl)


BODY = pc.Body(rig); REST = pc.finger_flexes(BODY, SIDE, False)


def set_joint(f, j, T):
    """Long-finger joint to flexion T in the validator's own measure (hinge axis, relative to the flat rest hand)."""
    P.up(); a, par = pc.finger_axis(BODY, SIDE, f, j); p, d = BODY.dir(par), BODY.dir(f'ORG-{f}.0{j}.{SIDE}')
    cur = math.degrees(math.atan2(p.cross(d).dot(a), p.dot(d))); r = REST[(f, j)]
    P.turn(f'{f}.0{j}.{SIDE}', (T + r) - cur, a); unscale(f'{f}.0{j}.{SIDE}')


def unscale(ctl):
    """Poser.turn writes pose_bone.matrix; under the Rigify finger chain that leaks a non-uniform scale into the control
    (measured 2026-10-06: f_middle.03 scale (0.12, 10.0, 0.86) after a few turns — the tip stretched away). Keep scale 1."""
    rig.pose.bones[ctl].scale = (1, 1, 1); P.up()


def hand_frame():
    n = P.palm_normal(SIDE); h = (P.tail(f'ORG-palm.02.{SIDE}') - P.head(f'ORG-palm.02.{SIDE}')).normalized()
    h = (h - h.dot(n) * n).normalized(); return n, h, h.cross(n)


def apply(A, T):
    """A[(f, j)] = flexion deg per finger joint (j = 1..3); A[(f, 0)] = closure 0..1 (fingers drawn together until they touch);
    T = (a, b, e, c, d) thumb: CMC turns about the palm normal / the hand axis / the across-palm axis, then MCP and IP flexion."""
    zero_hand()
    for _ in range(3):                                                 # fixed point: the drivers couple the joints
        for f in FING:
            for j in (1, 2, 3): set_joint(f, j, A[(f, j)])
    close_gaps(A)
    thumb(T)


NB = {'f_index': 'f_middle', 'f_ring': 'f_middle', 'f_pinky': 'f_ring'}   # who each finger closes onto (middle = anchor)


def nb_gap(f, j=2):
    """Side-by-side test: capsule gap between phalanx j of f and of its neighbour (the proximal capsules overlap at the knuckles
    in the flat hand; the fitted ORG-f_index.03 is skewed ≈ 40° toward the middle finger, so the index pair uses the middle phalanx)."""
    C = CAPS()
    if j == 3 and 'f_index' in (f, NB[f]): j = 2                     # skewed fitted index tip: middle phalanx stands in
    return gap(C[(f, j)], C[(NB[f], j)])


def close_gaps(A):
    """Move each curled finger sideways at its MCP (about proximal phalanx × flexion axis, toward or away from its neighbour)
    until its middle phalanx just touches the neighbour's, then twist it about the proximal phalanx (≤ 20°) so the fingertips meet
    too — side by side instead of fanning out with the metacarpals (the fitted knuckles are 27 mm apart for 16 mm-thick fingers, so 'keep the knuckle spacing' left them splayed) — by the closure
    fraction A[(f, 0)]: gap = (1 − w)·gap₀ + w·contact. User 2026-10-06: "주먹을 쥘 때 중지, 약지, 소지가 … 벌어지지 말고 영상처럼
    붙어 있어야 자연스러워." (First version: turning the straight fingers about the palm normal before curling — parallel in the
    palm plane, still fanned once curled.)"""
    for f in ('f_index', 'f_ring', 'f_pinky'):
        w = A.get((f, 0), 0.0)
        if w <= 0: continue
        if f in CLOSE_END: turn_mcp(f, A, w * CLOSE_END[f][0], w * CLOSE_END[f][1])
        else: solve_close(f, A, w)


CLOSE_END = {}                                                       # (sideways, twist) solved once at the fist; mid-frames scale it


def turn_mcp(f, A, th, ph, M0=None):
    ctl = f'{f}.01.{SIDE}'; M0 = M0 or P.M(ctl)
    a1 = P.hinge(SIDE, f, 1); d1 = (P.tail(f'ORG-{f}.01.{SIDE}') - P.head(f'ORG-{f}.01.{SIDE}')).normalized()
    R_ = Matrix.Rotation(math.radians(ph), 3, d1) @ Matrix.Rotation(math.radians(th), 3, a1.cross(d1).normalized())
    P.set_world(ctl, M0.translation, R_ @ M0.to_3x3()); unscale(ctl)
    for k in (2, 3): set_joint(f, k, A[(f, k)])                     # keep the measured PIP/DIP flexion while turning


def solve_close(f, A, w=1.0):
    """Coordinate descent on (sideways ≤ 25°, twist ≤ 20°) so the middle phalanges and the fingertips both meet the neighbour."""
    M0 = P.M(f'{f}.01.{SIDE}'); a1 = P.hinge(SIDE, f, 1)
    g0 = (nb_gap(f, 2), nb_gap(f, 3)); tgt = tuple((1 - w) * g + w * CONTACT for g in g0)
    def cost(x):
        turn_mcp(f, A, x[0], x[1], M0)
        e = [nb_gap(f, j) - t for j, t in zip((2, 3), tgt)]
        return max(abs(e[0]), abs(e[1])) + 3 * sum(max(0.0, -x_ - .0015) for x_ in e)   # sinking past 1.5 mm costs more
    x = [0.0, 0.0]; best = cost(x)
    for step in (8.0, 4.0, 2.0, 1.0):
        moved = True
        while moved:
            moved = False
            for i, lim in ((0, 25.0), (1, 20.0)):
                for sg in (-1, 1):
                    y = list(x); y[i] = max(-lim, min(lim, y[i] + sg * step)); c = cost(y)
                    if c < best - 1e-6: best, x, moved = c, y, True
    turn_mcp(f, A, x[0], x[1], M0); return x


def thumb(T):
    for j in (1, 2, 3):
        b_ = rig.pose.bones[f'thumb.0{j}.{SIDE}']; b_.rotation_quaternion = (1, 0, 0, 0); b_.scale = (1, 1, 1)
    P.up(); n, h, s = hand_frame(); a, b, e, c, d = T
    for ang, ax in ((a, n), (b, h), (e, s)):
        if ang: P.turn(f'thumb.01.{SIDE}', ang, ax); unscale(f'thumb.01.{SIDE}')
    for ctl, org, ang in ((f'thumb.02.{SIDE}', f'ORG-thumb.02.{SIDE}', c), (f'thumb.03.{SIDE}', f'ORG-thumb.03.{SIDE}', d)):
        # thumb MCP / IP flex across the palm toward the little finger (not toward the palm normal as the long fingers do —
        # that pointed the thumb straight out of the fist, 2026-10-06)
        u = (P.head(f'ORG-f_pinky.01.{SIDE}') - P.head(f'ORG-f_index.01.{SIDE}')).normalized()
        y = (P.tail(org) - P.head(org)).normalized(); ax = y.cross(u)
        if ax.length > 1e-4 and abs(ang) > 1e-3: P.turn(ctl, ang, ax.normalized()); unscale(ctl)


# ---- capsule radii measured on the mesh (rest) ----
def radii():
    """Cross-section radius of each phalanx / metacarpal: median distance to the bone of the vertices it owns (weight > .9) whose
    projection falls in the middle 60 % of the bone — ends and the thenar web would inflate it (first version: thumb 10.6 mm)."""
    V = np.array([v.co[:] for v in o.data.vertices]); gi = {g.index: g.name for g in o.vertex_groups}
    own = {}
    for i, v in enumerate(o.data.vertices):
        if v.groups:
            g = max(v.groups, key=lambda x: x.weight)
            if g.weight > .9: own.setdefault(gi[g.group], []).append(i)
    def rad(org, grp, dflt):
        b = rig.data.bones[org]; p, q = np.array(b.head_local), np.array(b.tail_local); u = q - p; L = np.linalg.norm(u); u = u / L
        ids = own.get(grp, []); W = V[ids] - p if ids else np.zeros((0, 3)); t = W @ u / L
        W = W[(t > .2) & (t < .8)]
        if len(W) < 8: return dflt
        return float(np.median(np.linalg.norm(W - np.outer(W @ u, u), axis=1)))
    R = {}
    for f in FING + ('thumb',):
        for j in (1, 2, 3): R[(f, j)] = rad(f'ORG-{f}.0{j}.{SIDE}', f'DEF-{f}.0{j}.{SIDE}', .008)
    for k in (1, 2, 3, 4): R[('palm', k)] = rad(f'ORG-palm.0{k}.{SIDE}', f'DEF-palm.0{k}.{SIDE}', .012)
    return R


RAD = radii()
print('   capsule radii mm', {f'{k[0]}{k[1]}': round(v * 1000, 1) for k, v in RAD.items()})
CAPS = lambda: {k: (P.head(f'ORG-{k[0]}.0{k[1]}.{SIDE}'), P.tail(f'ORG-{k[0]}.0{k[1]}.{SIDE}'), RAD[k]) for k in RAD}


def gap(c1, c2):
    return pc._seg_dist(np.array(c1[0]), np.array(c1[1]), np.array(c2[0]), np.array(c2[1])) - c1[2] - c2[2]


def tip_palm_gap(C, f):
    return min(gap(C[(f, j)], C[('palm', k)]) for j in (2, 3) for k in (1, 2, 3, 4))


pose_body()

CONTACT = -.0005                                                    # middle phalanges just touching (skin)


# ---- end pose: fingers ----
MCP_END = {'f_index': 85, 'f_middle': 88, 'f_ring': 90, 'f_pinky': 92}; PIP_END = 100; DIP_K = .7
END = {}
for f in FING:
    lo, hi = 0.0, 1.0
    def at(k):
        A = {(g, j): 0.0 for g in FING for j in (1, 2, 3)}
        A[(f, 0)], A[(f, 1)], A[(f, 2)], A[(f, 3)] = 0.0, MCP_END[f] * k, PIP_END * k, PIP_END * DIP_K * k
        apply(A, (0, 0, 0, 0, 0)); return tip_palm_gap(CAPS(), f)
    if at(1.0) < -.002:                                             # tip sinks into the palm → scale the whole finger back
        for _ in range(12):
            mid = (lo + hi) / 2
            if at(mid) < -.002: hi = mid
            else: lo = mid
        k = lo
    else: k = 1.0
    END[(f, 1)], END[(f, 2)], END[(f, 3)] = MCP_END[f] * k, PIP_END * k, PIP_END * DIP_K * k
    END[(f, 0)] = 1.0                                              # closure: touching its neighbour
    print(f'   fist {f}: scale {k:.2f} → MCP {END[(f, 1)]:.0f} PIP {END[(f, 2)]:.0f} DIP {END[(f, 3)]:.0f}, tip→palm gap {at(k) * 1000:.1f} mm')

zero_hand()
for _ in range(3):
    for f in FING:
        for j in (1, 2, 3): set_joint(f, j, END[(f, j)])
for f in ('f_index', 'f_ring', 'f_pinky'):
    CLOSE_END[f] = solve_close(f, END)
print('   finger closure at the fist (sideways°, twist°)', {f: [round(v, 1) for v in x] for f, x in CLOSE_END.items()},
      ' gaps mid/tip mm', {f: (round(nb_gap(f) * 1000, 1), round(nb_gap(f, 3) * 1000, 1)) for f in NB})


# ---- end pose: thumb (grid search) ----
def thumb_cost(T):
    """Thumb pad resting on the outside of the index and middle middle phalanges: thumb distal capsule touching both (gap ≈ 0),
    lying across them, outside the fist; any thumb capsule sinking more than 3 mm into a finger or the palm is penalised.
    (First try 2026-10-06: a target point offset from the phalanges lay inside the index capsule — unreachable without 19 mm
    penetration.) Fingers stay at END (set once before the search)."""
    thumb(T); C = CAPS(); ctr = lambda c: (c[0] + c[1]) / 2
    g1, g2 = gap(C[('thumb', 3)], C[('f_index', 2)]), gap(C[('thumb', 3)], C[('f_middle', 2)])
    pen = [gap(C[('thumb', j)], C[(f, k)]) for j in (2, 3) for f in FING for k in (1, 2, 3)]
    pen += [gap(C[('thumb', j)], C[('palm', k)]) for j in (2, 3) for k in (2, 3, 4)]
    excess = sum(max(0.0, -g - .003) for g in pen)
    n_ = hand_frame()[0]; front = max(ctr(C[('f_index', 2)]).dot(n_), ctr(C[('f_middle', 2)]).dot(n_))
    inside = max(0.0, front + .8 * (RAD[('f_index', 2)] + RAD[('thumb', 3)]) - ctr(C[('thumb', 3)]).dot(n_))   # in front along the palm normal
    td = (C[('thumb', 3)][1] - C[('thumb', 3)][0]).normalized(); idd = (C[('f_index', 2)][1] - C[('f_index', 2)][0]).normalized()
    across = abs(td.dot(idd))
    over = max(0.0, T[3] - 50) + max(0.0, T[4] - 70)                    # stay inside thumb ROM comfort
    cost = abs(g1) + abs(g2) + 10 * excess + 10 * inside + .02 * across + .0005 * over
    return cost, max(abs(g1), abs(g2)), min(pen)

apply(END, (0, 0, 0, 0, 0))
TESTS = json.loads(os.environ.get('THUMB_TESTS', '[]'))           # debug: evaluate given thumb poses, no search
rng = np.random.default_rng(1); best = None
for T in ((20, 0, 40, 40, 60), (20, 0, 40, 40, 30)):                    # seeds from the 2026-10-06 grid: thumb over the index middle phalanx
    if TESTS: break
    r = thumb_cost(T)
    if best is None or r[0] < best[0]: best = (r[0], T, r)
for _ in range(0 if TESTS else 800):
    T = (rng.uniform(-90, 90), rng.uniform(-90, 90), rng.uniform(-90, 90), rng.uniform(5, 55), 0.0); T = T[:4] + (T[3] * rng.uniform(.6, 1.3),)
    r = thumb_cost(T)
    if best is None or r[0] < best[0]: best = (r[0], T, r)
for step in (() if TESTS else (8, 4, 2, 1)):                         # coordinate descent
    improved = True
    while improved:
        improved = False
        for i in range(5):
            for sg in (-1, 1):
                T = list(best[1]); T[i] += sg * step; T = tuple(T); r = thumb_cost(T)
                if r[0] < best[0] - 1e-6: best = (r[0], T, r); improved = True
if best is None: best = (0, tuple(TESTS[0]), (0.0, 0.0, 0.0))
TEND = best[1]
print(f'   thumb: CMC {TEND[0]:.1f}/{TEND[1]:.1f}/{TEND[2]:.1f}, MCP {TEND[3]:.1f}, IP {TEND[4]:.1f} → pad gap to index/middle (worse) {best[2][1] * 1000:.1f} mm, worst penetration {best[2][2] * 1000:.1f} mm')

OPEN = {(f, j): (0, 4, 6, 3)[j] for f in FING for j in (0, 1, 2, 3)}  # open hand: rest spread (closure 0), near straight, slight curl
TOPEN = (0.0, 0.0, 0.0, 4.0, 3.0)


def prof(direction, f, j, s):
    key = (f'{VID[f]}.' if f != 'thumb' else 'thumb.') + ('PIP', 'MCP', 'PIP', 'DIP')[j]   # j = 0 (closure) follows the leading PIP:
    # in the video the fingers are together as soon as they hook (s ≈ .25), long before the MCP completes
    return float(np.interp(s, S, PROF['profile'][direction][key]))


def state(direction, s):
    """Joint angles at normalised time s of a close (open → fist) or an open (fist → open)."""
    A0, A1, T0, T1 = (OPEN, END, TOPEN, TEND) if direction == 'close' else (END, OPEN, TEND, TOPEN)
    A = {k: A0[k] + (A1[k] - A0[k]) * prof(direction, k[0], k[1], s) for k in A0}
    w = [prof(direction, 'thumb', 3, s)] * 5                        # thumb: last in, first out (video + PMC10296280: completes last)
    T = tuple(T0[i] + (T1[i] - T0[i]) * w[i] + 4 * w[i] * (1 - w[i]) * DETOUR[i] for i in range(5))   # detour: lift over the fingers
    return A, T


def thumb_rom(rows, T):
    """Thumb MCP / IP flexion as applied (rom.md: MCP 50–60, IP 80–90; comfort 45 / 65)."""
    for nm, v, lim, com in (('thumb MCP', T[3], 60, 50), ('thumb IP', T[4], 85, 70)):
        rows.append(dict(group='ROM', name=nm, value=round(v, 1), limit=lim, comfort=com, status=pc._grade(v, lim, com), note='deg as applied'))
    return rows


def hand_collisions(rows):
    C = CAPS(); add = lambda name, v: rows.append(dict(group='hand', name=name, value=round(v, 1), limit=6, comfort=3, status=pc._grade(max(v, 0), 6, 3), note='mm penetration'))
    for f in FING:
        add(f'{f} tip ↔ palm', -tip_palm_gap(C, f) * 1000)
    for j in (2, 3):
        add(f'thumb.0{j} ↔ fingers', -min(gap(C[('thumb', j)], C[(f, k)]) for f in FING for k in (1, 2, 3)) * 1000)
    for f, g in NB.items():                                          # neighbours touch side by side, never sink in
        add(f'{f} ↔ {g} (side by side)', -nb_gap(f) * 1000); add(f'{f} ↔ {g} tips', -nb_gap(f, 3) * 1000)
    for i, f in enumerate(FING):                                      # skip-one pairs never touch
        for g in FING[i + 2:]:
            add(f'{f} ↔ {g}', -min(gap(C[(f, a)], C[(g, b)]) for a in (1, 2, 3) for b in (1, 2, 3)) * 1000)
    return rows


# ---- thumb detour: a straight interpolation of the thumb angles passes through the curled index (gate, 2026-10-06) ----
DETOUR = (0.0, 0.0, 0.0, 0.0, 0.0)
FCTL = [f'{f}.0{j}.{SIDE}' for f in FING for j in (1, 2, 3)]
_cache = {}
def fingers_at(direction, s):
    k = (direction, round(float(s), 3))
    if k not in _cache:
        A, _ = state(direction, s); apply(A, TOPEN)
        _cache[k] = [tuple(rig.pose.bones[n].rotation_quaternion) for n in FCTL]
    for n, q in zip(FCTL, _cache[k]):
        b_ = rig.pose.bones[n]; b_.rotation_quaternion = q; b_.scale = (1, 1, 1)
    P.up()


def path_pen(D):
    global DETOUR
    DETOUR = D; worst = 0.0
    for direction in ('close', 'open'):
        for s_ in np.linspace(0, 1, 21):
            fingers_at(direction, s_); thumb(state(direction, s_)[1]); C = CAPS()
            worst = min(worst, min(gap(C[('thumb', j)], C[(f, k)]) for j in (2, 3) for f in FING for k in (1, 2, 3)))
    return worst


if not TESTS:
    cands = [(a, 0.0, e, m, i) for a in (-20, 0, 20) for e in (-20, 0, 20) for m in (-30, 0) for i in (-40, 0)]
    # least detour that keeps the path within 0.2 mm of the best (ties used to pick a needless swing-out, 2026-10-06)
    res = [(path_pen(D), D) for D in cands]; best_pen = max(p_ for p_, _ in res)
    res = sorted((x for x in res if x[0] >= best_pen - .0002), key=lambda x: sum(abs(v) for v in x[1]))
    DETOUR = res[0][1]
    print(f'   thumb detour {DETOUR}: worst thumb penetration along the path {res[0][0] * 1000:.1f} mm (straight path {path_pen((0.0,) * 5) * 1000:.1f} mm)')
    DETOUR = res[0][1]


SPEC = {'allow_warn': ['MCP', 'PIP', 'DIP']}                          # a fist is an end-range posture by definition (rom.md)

def verts():
    P.up(); ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    A = np.array([v.co[:] for v in me.vertices]); ev.to_mesh_clear(); return A


if TESTS:
    for T in TESTS:
        apply(END, tuple(T)); C = CAPS()
        r_ = thumb_cost(tuple(T)); apply(END, tuple(T)); C = CAPS()
        print('TEST', T, 'cost', round(r_[0] * 1000, 1), 'cap idx2/mid2', round(gap(C[('thumb', 3)], C[('f_index', 2)]) * 1000), round(gap(C[('thumb', 3)], C[('f_middle', 2)]) * 1000),
              'worst', min(((f'thumb{j}-{f}{k}', round(gap(C[('thumb', j)], C[(f, k)]) * 1000)) for j in (2, 3) for f in FING for k in (1, 2, 3)), key=lambda x: x[1]))
    if not os.environ.get('THUMB_RENDER'): sys.stdout.flush(); os._exit(0)
report = {'end': {'fingers': {f'{k[0]}.{k[1]}': round(v, 1) for k, v in END.items()}, 'thumb': [round(x, 1) for x in TEND]}, 'frames': []}
fails = 0
for direction in ('close', 'open'):
    for s in np.linspace(0, 1, 21):
        A, T = state(direction, s); apply(A, T)
        if MODE == 'chair':                                           # whole body: arm ROM, forearm on the thigh, hand vs thigh/shin
            rows = pc.check(rig, None, CHAIR_SPEC)
        else:
            rows = [r for r in pc.check(rig, None, SPEC) if r['name'].startswith(('f_', 'thumb'))]
        rows = thumb_rom(hand_collisions(rows), T)
        nf = sum(r['status'] == 'FAIL' for r in rows); nw = sum(r['status'] == 'WARN' for r in rows); fails += nf
        bad = [f"{r['status']} {r['name']} {r['value']}" for r in rows if r['status'] in ('FAIL', 'WARN')]
        report['frames'].append({'dir': direction, 's': round(float(s), 2), 'FAIL': nf, 'WARN': nw, 'issues': bad})
        if bad: print(f'   {direction} s={s:.2f}: ' + '; '.join(bad))
print(f'   fist sequence frames {len(report["frames"])}: FAIL {fails}')
json.dump(report, open(os.path.join(ROOT, 'verification', 'pose-check', 'fist.json' if MODE == 'study' else 'fist_chair.json'), 'w'), ensure_ascii=False, indent=1)
if fails and not os.environ.get('POSE_ALLOW_FAIL'):
    print('   FIST GATE FAIL — no renders'); sys.stdout.flush(); os._exit(1)

if MODE == 'chair':
    import importlib.util as _iu
    _sp = _iu.spec_from_file_location('chair_motion', os.path.join(HERE, 'chair-motion-v3.py')); _cm = _iu.module_from_spec(_sp)
    _sp.loader.exec_module(_cm); _cm.render(globals()); sys.stdout.flush(); os._exit(0)

# ---- clay renders: hand views at close s = 0, .25, .4, .55, .7, 1 ----
sc = bpy.context.scene
for x in list(bpy.data.objects):                                     # rig widgets (WGT-*) would render as blades
    if x not in (o, rig): bpy.data.objects.remove(x, do_unlink=True)
rig.hide_render = True
for _m in o.modifiers: _m.show_viewport = True
cs = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.smooth_type = 'SIMPLE'; cs.factor = .5; cs.iterations = 8   # as build-figure-v3
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (.62, .6, .57); sc.display.shading.show_cavity = True
sc.render.resolution_x = sc.render.resolution_y = 420; sc.render.film_transparent = False
sc.world = sc.world or bpy.data.worlds.new('w')
cam = bpy.data.cameras.new('hc'); co = bpy.data.objects.new('hc', cam); sc.collection.objects.link(co); sc.camera = co
cam.type = 'ORTHO'; cam.ortho_scale = .2
zero_hand(); n, h, s_ = hand_frame()
centre = (P.head(f'ORG-hand.{SIDE}') + P.tail(f'ORG-palm.02.{SIDE}')) / 2 + h * .03
VIEWS = (('palm', n), ('thumb', -s_ if SIDE == 'R' else s_), ('back', -n), ('34', (n - s_ + h * .3).normalized()))
STEPS = (0, .25, .4, .55, .7, 1.0)
if TESTS: OUT = os.environ['THUMB_RENDER']; sc.render.resolution_x = sc.render.resolution_y = 640; os.makedirs(OUT, exist_ok=True)
for direction in ('close',):
    for s in (range(len(TESTS)) if TESTS else STEPS):
        if TESTS: apply(END, tuple(TESTS[s]))
        else: A, T = state(direction, s); apply(A, T)
        for vn, d in VIEWS:
            co.location = centre + Vector(d) * .6
            zc = Vector(d).normalized(); yc = (h - h.dot(zc) * zc).normalized()          # fingers point up in the image
            co.rotation_euler = Matrix((yc.cross(zc), yc, zc)).transposed().to_euler()
            sc.render.filepath = os.path.join(OUT, f'fist_{vn}_{int(s * 100):03d}.png'); bpy.ops.render.render(write_still=True)
print('   renders →', OUT); sys.stdout.flush(); os._exit(0)
