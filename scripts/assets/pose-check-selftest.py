"""Self-test for the pose validator (skill pose-anatomy): known-bad poses must FAIL, the rest pose must pass.

Cases
  rest            A-pose                                                   → every row OK
  floor_v1_arm    the 2026-10-04 floor arm the user flagged ("floor34 팔이 꺾여있다"): wrist target outside the knee,
                  elbow pole inside and above it → the forearm wraps round the knee                 → FAIL expected
  elbow_hyper     wrist pulled behind the body with the pole in front (elbow bends backwards)      → FAIL expected
  through_floor   torso lowered below the floor                                                    → FAIL expected
  fist_ok         right hand curled 200° per finger (MCP ≈ 80°, end range by design, WARN allowed)  → no FAIL expected
  dip_back        the same fist with the ring DIP bent to −28° (the 2026-10-06 climb defect was −43°,
                  F-035 — hidden while measure and pose tool shared the palm-normal axis)           → FAIL expected
Needs the rig cache written by build-figure-v3.py. Run: python scripts/assets/pose-check-selftest.py
"""
import importlib.util, os, sys
import numpy as np, bpy
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
def _load(n, f):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, f)); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
rf = _load('rf', 'rigify-fit-v3.py'); pc = _load('pc', 'pose-check-v3.py'); bif = _load('bif', 'build-intro-figure.py')
bpy.ops.wm.open_mainfile(filepath=os.path.join(bif.SRC, 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
o, rig = bpy.data.objects['body_v3'], bpy.data.objects['rig']; P = rf.Poser(rig); X = Vector((1, 0, 0))

def verts():
    bpy.context.view_layer.update(); ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    A = np.array([v.co[:] for v in me.vertices]); ev.to_mesh_clear(); return A

def floor_v1_arm():                                  # verbatim intent of the first Rigify floor pose (commit 4d77db5)
    hz = P.head('ORG-thigh.L').z; P.move('torso', (0, 0, .095 - hz)); P.turn('torso', 8, X)
    P.turn('chest', 12, X); P.turn('neck', 16, X); P.turn('head', 24, X)
    P.leg('R', (-.13, -.42, .09), (0, -1, 0), (-.18, -1.4, .9))
    knee = P.head('ORG-shin.R')
    P.arm('R', knee + Vector((-.17, -.06, .01)), Vector((-.15, -.25, -1)), Vector((.35, .6, 0)), knee + Vector((.45, .1, .25)))

def elbow_hyper():
    sh = P.head('ORG-upper_arm.L')
    P.arm('L', sh + Vector((.05, .45, -.25)), Vector((0, 1, -.3)), Vector((-1, 0, 0)), sh + Vector((0, -.6, -.3)))

def through_floor():
    P.move('torso', (0, 0, -.9))

def fist_ok():
    P.curl('R', 200)

def dip_back():
    P.curl('R', 200); P.turn('f_ring.03.R', -80, P.hinge('R', 'f_ring', 3)); P.unscale('f_ring.03.R')   # 52° curl → −28°

CASES = [('rest', None, False, {}), ('floor_v1_arm', floor_v1_arm, True, dict(floor_z=0.0)),
         ('elbow_hyper', elbow_hyper, True, {}), ('through_floor', through_floor, True, dict(floor_z=0.0)),
         ('fist_ok', fist_ok, False, dict(allow_warn=['MCP', 'PIP', 'DIP'])), ('dip_back', dip_back, True, {})]
ok = True
for name, fn, expect_fail, spec in CASES:
    P.reset()
    if fn: fn()
    rows = pc.check(rig, verts(), spec); n = pc.report(rows, name)
    got_fail = n['FAIL'] > 0
    plain_warn = sum(r['status'] == 'WARN' for r in rows)                  # WARN* = allowed by the case spec
    verdict = 'PASS' if got_fail == expect_fail and (expect_fail or plain_warn == 0) else 'FAIL'
    print(f'  selftest {name}: expected {"FAIL" if expect_fail else "clean"}, got FAIL={n["FAIL"]} WARN={n["WARN"]} → {verdict}')
    ok &= verdict == 'PASS'
print('SELFTEST', 'PASS' if ok else 'FAIL'); sys.stdout.flush()
os._exit(0 if ok else 1)
