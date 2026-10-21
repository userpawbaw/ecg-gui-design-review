"""Run scripts/blender/build_archive.py with another sun direction, without editing it (D-075, user 2026-10-18).

Why: the Lab backdrop's sun grazed the stack faces (86.5° from their normal); the user asked for light that strikes one
bookcase obliquely, about 30° to its face, re-baked ("가)로 한번 해보자"). build_archive.py belongs to the archive-light
session (WORK_STATE active_jobs), so this wrapper reads it, swaps the r1 sun line in memory and runs it; the file on disk
and every default stay unchanged. --lab-shots replaces the preview shots with the Lab backdrop's three camera keys
(--lab-shots c1: six frames along the C1 path of D-077; --lab-shots v: the D-154 level descents).
D-077 options: several skylights (';'), --sun-angle DEG, --no-lamps (the two aisle lamps and their bulbs), --leaves
"x,y,z,radius,count;…" (branch-and-leaf clusters above the roof: soft dappled sun, group decor so the web's sun depth map
casts them into the shafts too).
D-078 options: --win-width C:W (window at centre y C gets width W), --open-window C (no blinds there: one large clean pool),
--hidden-bulbs (the aisle lamp meshes go, their warm bulbs stay — F-053: they gave half the room's light), --sky '#hex' (sky tint).
D-080: --open-window takes several centres (';'), --wz0 Z lowers the window sills (taller windows), --sun-energy K (sun × K).
D-154: --lab-shots v (level descents), --sun-list 'name:x,y,z[,angle];…' (one build, every shot per sun),
--front-window x0,x1,z0,z1,mullion,transom (a front wall with one large gridded window; the front was open sky).

    python scripts/assets/archive-sun-variant.py --sun 0.746,0.5,-0.439 [--skylight x0,x1,y0,y1[;…]] [--sun-angle 0.5]
        [--no-lamps | --hidden-bulbs] [--leaves x,y,z,r,n[;…]] [--win-width C:W] [--open-window C] [--sky '#hex']
        [--lab-shots [c1]] -- <build_archive.py args>
Sun is the direction the light travels, Blender frame (x right, y into the room, z up).
"""
import math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'scripts', 'blender', 'build_archive.py')
SUN_LINE = 'SUN_TO = Vector((0.85, 0.06, -0.50)).normalized()'
CEIL_LINE = "    box('Ceiling', (2 * XW, Y1 - Y0, 0.15), (0, (Y0 + Y1) / 2, H + 0.075), M_WALL, tile=2.0)\n"
PREVIEW_LINE = 'if args.preview:\n'
SUNANG_LINE = "sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 11.0; sun.angle = math.radians(1.2); sun.color = srgb('#ffd9a8')"
LAMP_LINES = ("for y in ((-1.8,) if args.art in ('r3', 'r4', 'r5', 'r6') else (-1.8, 1.3)):", "for y in (() if args.art in ('r3', 'r4', 'r5', 'r6') else (-1.8, 1.3)):")
SHOTS_LINE = '# ---------------- preview shots (SPACE-R1-ARCHIVE §3–4) ----------------\n'
WIN_LINE = 'WIN = [(-3.8, 0.9), (-2.2, 0.9), (-0.6, 0.9), (1.0, 0.9), (2.6, 0.9), (3.95, 1.0)]'
SLAT_DEF = 'def slat_layout(c, role):\n'
ROLE_LINE = "WIN_ROLE = {3.95: 'hero', 1.0: 'support', -2.2: 'support'} if args.light == 'r2' else {}"
SKY_COL = "w.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('#7d96c4'), 1)"
# D-077 C1 path (prototype/v2/src/labBackdrop.ts PATHS.c1), Blender frame: (pos, look, vfov) keys
C1 = [((0.15, -3.4, 3.3), (0.35, 4.3, 1.6), 46), ((0.25, -1.2, 2.4), (0.35, 4.3, 1.5), 48), ((0.3, 1.0, 0.95), (0.35, 4.3, 0.9), 50)]
def c1_at(u):
    seg = u * (len(C1) - 1); i = min(len(C1) - 2, int(seg)); f = seg - i
    lerp = lambda a, b: tuple(round(x + (y - x) * f, 3) for x, y in zip(a, b))
    return lerp(C1[i][0], C1[i + 1][0]), lerp(C1[i][1], C1[i + 1][1]), round(C1[i][2] + (C1[i + 1][2] - C1[i][2]) * f, 1)
# the Lab backdrop keys (prototype/v2/src/labBackdrop.ts), three (x, y, z) → Blender (x, −z, y)
# D-154 vertical descents (level camera looking +y at the back wall, like REF-002): v1 from the aisle front, v2 inside the aisle
V_SHOTS = "SHOTS = {" + ', '.join(f"'v1_{int(z * 100)}': ((0.2, -4.5, {z}), (0.2, 4.5, {z}), 26)" for z in (4.0, 3.1, 2.2, 1.3)) + ', ' + \
          ', '.join(f"'v2_{int(z * 100)}': ((0.2, -1.0, {z}), (0.2, 4.5, {z}), 34)" for z in (3.5, 1.5)) + "}\n"
LAB_SHOTS = "SHOTS = {'lab_top': ((-.2, -1.6, 3.0), (.4, 4.3, 1.4), 44), 'lab_mid': ((.3, .6, 2.5), (.35, 4.3, 1.8), 50), 'lab_low': ((.3, 1.0, .95), (.35, 4.3, .9), 50)}\n"

argv = sys.argv[1:]
own, rest = (argv[:argv.index('--')], argv[argv.index('--') + 1:]) if '--' in argv else (argv, [])
sun = own[own.index('--sun') + 1] if '--sun' in own else None
src = open(SRC, encoding='utf-8').read()
if sun:
    v = [float(x) for x in sun.split(',')]; n = math.sqrt(sum(x * x for x in v)); v = [x / n for x in v]
    assert src.count(SUN_LINE) == 1, 'build_archive.py: the r1 sun line changed — update this wrapper'
    src = src.replace(SUN_LINE, f'SUN_TO = Vector(({v[0]:.4f}, {v[1]:.4f}, {v[2]:.4f})).normalized()   # archive-sun-variant.py')
    print('sun', [round(x, 4) for x in v], 'elevation', round(math.degrees(math.asin(-v[2])), 1), 'deg; to the stack face (normal -y)', round(math.degrees(math.asin(abs(v[1]))), 1), 'deg')
if '--skylight' in own:   # D-076/D-077: ceiling skylights (x0, x1, y0, y1, Blender; ';' between) with beam-wood trims
    sks = [tuple(float(x) for x in h.split(',')) for h in own[own.index('--skylight') + 1].split(';')]
    assert src.count(CEIL_LINE) == 1, 'build_archive.py: the r1 ceiling line changed — update this wrapper'
    src = src.replace(CEIL_LINE, f'''    _sks = {sks}; _xs = sorted({{-XW, XW, *[h[0] for h in _sks], *[h[1] for h in _sks]}}); _ys = sorted({{Y0, Y1, *[h[2] for h in _sks], *[h[3] for h in _sks]}})
    for xa, xb in zip(_xs, _xs[1:]):
        for ya, yb in zip(_ys, _ys[1:]):
            if any(h[0] < (xa + xb) / 2 < h[1] and h[2] < (ya + yb) / 2 < h[3] for h in _sks): continue
            box('Ceiling', (xb - xa, yb - ya, 0.15), ((xa + xb) / 2, (ya + yb) / 2, H + 0.075), M_WALL, tile=2.0)
    for _sk in _sks:
        for (sx, sy, cx, cy) in ((_sk[1] - _sk[0] + .12, .06, (_sk[0] + _sk[1]) / 2, _sk[2] - .03), (_sk[1] - _sk[0] + .12, .06, (_sk[0] + _sk[1]) / 2, _sk[3] + .03),
                                 (.06, _sk[3] - _sk[2], _sk[0] - .03, (_sk[2] + _sk[3]) / 2), (.06, _sk[3] - _sk[2], _sk[1] + .03, (_sk[2] + _sk[3]) / 2)):
            box('APR_skylight_trim', (sx, sy, .22), (cx, cy, H + .075 - .11), M_BEAM, grain=True)
''')
    print('skylights', sks)
if '--sun-angle' in own:   # D-077: a smaller sun = crisper near shadows, leaf shadows keep their outline (archive-light F-045, D-085: 0.5°)
    assert src.count(SUNANG_LINE) == 1, 'build_archive.py: the r1 sun line changed — update this wrapper'
    src = src.replace(SUNANG_LINE, SUNANG_LINE.replace('math.radians(1.2)', f"math.radians({float(own[own.index('--sun-angle') + 1])})"))
if '--sun-energy' in own:  # D-080: sun strength × factor (user: keep D with the sun ×1.6 to compare)
    assert src.count('sun.energy = 11.0;') == 1, 'build_archive.py: the r1 sun energy changed — update this wrapper'
    src = src.replace('sun.energy = 11.0;', f"sun.energy = {11.0 * float(own[own.index('--sun-energy') + 1]):.2f};")
if '--win-width' in own:   # D-078: a wider window → a larger pool
    import re
    assert src.count(WIN_LINE) == 1, 'build_archive.py: the window list changed — update this wrapper'
    new = WIN_LINE
    for spec in own[own.index('--win-width') + 1].split(';'):
        c, w = spec.split(':'); new, k = re.subn(rf'\({re.escape(c)}, [0-9.]+\)', f'({c}, {w})', new); assert k == 1, f'no window at y {c}'
    src = src.replace(WIN_LINE, new)
if '--open-window' in own:  # D-078: no blinds on these windows (';' between centres) — clean pools with the mullion lines in them
    cs = [float(c) for c in own[own.index('--open-window') + 1].split(';')]
    assert src.count(SLAT_DEF) == 1 and src.count(ROLE_LINE) == 1, 'build_archive.py: the blind code changed — update this wrapper'
    src = src.replace(SLAT_DEF, SLAT_DEF + "    if role == 'open': return []\n").replace(ROLE_LINE, ROLE_LINE + "\nWIN_ROLE = {**WIN_ROLE, " + ', '.join(f"{c}: 'open'" for c in cs) + "}")
if '--wz0' in own:          # D-080: taller windows (lower sill) → taller light curtains through the stack gaps
    WZ = 'WZ0, WZ1 = 3.45, 4.7'; assert src.count(WZ) == 1, 'build_archive.py: the window height line changed — update this wrapper'
    src = src.replace(WZ, f"WZ0, WZ1 = {float(own[own.index('--wz0') + 1])}, 4.7")
if '--hidden-bulbs' in own: # D-078 (F-053): the lamp meshes leave the aisle, the two warm bulbs stay
    assert src.count(LAMP_LINES[0]) == 1, 'build_archive.py: a lamp line changed — update this wrapper'
    src = src.replace(LAMP_LINES[0], 'for y in ():')
if '--sky' in own:          # D-078 (F-053): the blue sky fill cools the shade
    assert src.count(SKY_COL) == 1, 'build_archive.py: the sky colour line changed — update this wrapper'
    src = src.replace(SKY_COL, SKY_COL.replace('#7d96c4', own[own.index('--sky') + 1]))
if '--no-lamps' in own:    # D-077: the C1 path flies down the aisle where the two lamps hang (user: no ceiling lamp in view)
    for ln in LAMP_LINES:
        assert src.count(ln) == 1, 'build_archive.py: a lamp line changed — update this wrapper'
        src = src.replace(ln, 'for y in ():')
if '--leaves' in own:      # D-077: branch-and-leaf clusters above the roof — soft dappled sun on the far shelves (penumbra ≈ distance × sun size)
    lv = [tuple(float(x) for x in c.split(',')) for c in own[own.index('--leaves') + 1].split(';')]
    assert src.count(SHOTS_LINE) == 1, 'build_archive.py: the preview-shots header changed — update this wrapper'
    src = src.replace(SHOTS_LINE, f'''_lr = random.Random(7); _ml = mat('leaf', srgb('#3d4a2a'), .8); _lbm = bmesh.new()
def _quad(p, u, v):
    vs = [_lbm.verts.new(p + u), _lbm.verts.new(p + v), _lbm.verts.new(p - u), _lbm.verts.new(p - v)]; _lbm.faces.new(vs)
for (_cx, _cy, _cz, _rad, _n) in {lv}:
    _nb = max(3, int(_n) // 50)
    for _b in range(_nb):                      # a drooping branch: a twig strip with pointed leaves along it
        _a = _lr.uniform(0, 2 * math.pi); _L = _rad * _lr.uniform(.6, 1.0)
        _dv = Vector((math.cos(_a), math.sin(_a), _lr.uniform(-.15, .25))).normalized(); _base = Vector((_cx, _cy, _cz))
        _pts = [_base + _dv * _L * t + Vector((0, 0, -.3 * t * t * _L)) for t in [i / 6 for i in range(7)]]
        for _p0, _p1 in zip(_pts, _pts[1:]):
            _side = (_p1 - _p0).cross(Vector((0, 0, 1))).normalized() * .012; _quad((_p0 + _p1) / 2, (_p1 - _p0) / 2, _side)
        for _k in range(int(_n) // _nb):
            _t = _lr.random(); _p = _base + _dv * _L * _t + Vector((0, 0, -.3 * _t * _t * _L)) + Vector((_lr.gauss(0, .1), _lr.gauss(0, .1), _lr.gauss(0, .06)))
            _u = Vector((_lr.uniform(-1, 1), _lr.uniform(-1, 1), _lr.uniform(-.4, .4))).normalized(); _w = _u.cross(Vector((_lr.uniform(-1, 1), _lr.uniform(-1, 1), 1))).normalized()
            _quad(_p, _u * _lr.uniform(.06, .1), _w * _lr.uniform(.02, .03))
_lme = bpy.data.meshes.new('Leaves'); _lbm.to_mesh(_lme); _lbm.free(); _lme.materials.append(_ml)
_lo = bpy.data.objects.new('Leaves', _lme); scene.collection.objects.link(_lo); _lo['group'] = 'decor'
''' + SHOTS_LINE)
    print('leaves', lv)
if '--lab-shots' in own:
    assert src.count(PREVIEW_LINE) == 1, 'build_archive.py: the preview block changed — update this wrapper'
    i = own.index('--lab-shots'); which = own[i + 1] if i + 1 < len(own) and not own[i + 1].startswith('--') else ''
    shots = V_SHOTS if which == 'v' else LAB_SHOTS if which != 'c1' else 'SHOTS = {' + ', '.join(f"'c1_{int(u * 100):03d}': {c1_at(u)}" for u in (0, .24, .42, .6, .8, 1)) + '}\n'
    src = src.replace(PREVIEW_LINE, shots + PREVIEW_LINE)
if '--front-window' in own:  # D-154: the room's front (y −5) is open sky; a front wall with one large gridded window far from the back
    # bookcase (~9.5 m) draws the soft window-grid shadows of REF-002 (archive-light F-045) when the sun comes in from the front
    BW = "box('BackWall', (2 * XW, 0.15, H), (0, Y1 + 0.075, H / 2), M_WALL, tile=2.0)\n"
    assert src.count(BW) == 1, 'build_archive.py: the back wall line changed — update this wrapper'
    x0, x1, z0, z1, mx, mz = (float(v) for v in own[own.index('--front-window') + 1].split(','))   # opening + mullion / transom spacing
    src = src.replace(BW, BW + f'''_fx0, _fx1, _fz0, _fz1, _fmx, _fmz = {x0}, {x1}, {z0}, {z1}, {mx}, {mz}
for (_sx, _sz, _cx, _cz) in ((_fx0 + XW, H, (-XW + _fx0) / 2, H / 2), (XW - _fx1, H, (_fx1 + XW) / 2, H / 2),
                             (_fx1 - _fx0, _fz0, (_fx0 + _fx1) / 2, _fz0 / 2), (_fx1 - _fx0, H - _fz1, (_fx0 + _fx1) / 2, (_fz1 + H) / 2)):
    if _sx > .01 and _sz > .01: box('FrontWall', (_sx, 0.15, _sz), (_cx, Y0 - 0.075, _cz), M_WALL, tile=2.0)
_n = max(1, round((_fx1 - _fx0) / _fmx))
for _i in range(1, _n): box('WinMullion', (0.07, 0.12, _fz1 - _fz0), (_fx0 + _i * (_fx1 - _fx0) / _n, Y0 - 0.075, (_fz0 + _fz1) / 2), M_WALL)
_m = max(1, round((_fz1 - _fz0) / _fmz))
for _i in range(1, _m): box('WinMullion', (_fx1 - _fx0, 0.12, 0.07), ((_fx0 + _fx1) / 2, Y0 - 0.075, _fz0 + _i * (_fz1 - _fz0) / _m), M_WALL)
''')
    print('front window', (x0, x1, z0, z1, mx, mz))
if '--sun-list' in own:    # D-154: one scene build, many sun directions — 'name:x,y,z;…' renders every shot once per sun (file name_<sun>)
    RENDER = "        scene.render.filepath = os.path.join(args.preview, name + tag + '.png')\n        bpy.ops.render.render(write_still=True)\n"
    assert src.count(RENDER) == 1, 'build_archive.py: the preview render lines changed — update this wrapper'
    suns = [(n, tuple(float(x) for x in d.split(','))) for n, d in (e.split(':') for e in own[own.index('--sun-list') + 1].split(';'))]
    src = src.replace(RENDER, f'''        for _sn, _sd in {suns}:
            so.rotation_euler = Vector(_sd[:3]).normalized().to_track_quat('-Z', 'Y').to_euler()
            if len(_sd) > 3: sun.angle = math.radians(_sd[3])   # optional 4th value: the sun's angular size (penumbra)
            scene.render.filepath = os.path.join(args.preview, name + '_' + _sn + tag + '.png')
            bpy.ops.render.render(write_still=True)
''')
    print('suns', len(suns))
sys.argv = [SRC] + rest
exec(compile(src, SRC, 'exec'), {'__name__': '__main__', '__file__': SRC})
