"""Run scripts/blender/build_archive.py with another sun direction, without editing it (D-075, user 2026-10-18).

Why: the Lab backdrop's sun grazed the stack faces (86.5° from their normal); the user asked for light that strikes one
bookcase obliquely, about 30° to its face, re-baked ("가)로 한번 해보자"). build_archive.py belongs to the archive-light
session (WORK_STATE active_jobs), so this wrapper reads it, swaps the r1 sun line in memory and runs it; the file on disk
and every default stay unchanged. --lab-shots replaces the preview shots with the Lab backdrop's three camera keys.

    python scripts/assets/archive-sun-variant.py --sun 0.746,0.5,-0.439 [--skylight x0,x1,y0,y1] [--lab-shots] -- <build_archive.py args>
Sun is the direction the light travels, Blender frame (x right, y into the room, z up).
"""
import math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'scripts', 'blender', 'build_archive.py')
SUN_LINE = 'SUN_TO = Vector((0.85, 0.06, -0.50)).normalized()'
CEIL_LINE = "    box('Ceiling', (2 * XW, Y1 - Y0, 0.15), (0, (Y0 + Y1) / 2, H + 0.075), M_WALL, tile=2.0)\n"
PREVIEW_LINE = 'if args.preview:\n'
# the Lab backdrop keys (prototype/v2/src/labBackdrop.ts), three (x, y, z) → Blender (x, −z, y)
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
if '--skylight' in own:   # D-076: one ceiling skylight (x0, x1, y0, y1, Blender) with a beam-wood trim, so the oblique sun crosses the aisle
    sk = tuple(float(x) for x in own[own.index('--skylight') + 1].split(','))
    assert src.count(CEIL_LINE) == 1, 'build_archive.py: the r1 ceiling line changed — update this wrapper'
    src = src.replace(CEIL_LINE, f'''    _sk = {sk}; _xs = sorted({{-XW, XW, _sk[0], _sk[1]}}); _ys = sorted({{Y0, Y1, _sk[2], _sk[3]}})
    for xa, xb in zip(_xs, _xs[1:]):
        for ya, yb in zip(_ys, _ys[1:]):
            if _sk[0] < (xa + xb) / 2 < _sk[1] and _sk[2] < (ya + yb) / 2 < _sk[3]: continue
            box('Ceiling', (xb - xa, yb - ya, 0.15), ((xa + xb) / 2, (ya + yb) / 2, H + 0.075), M_WALL, tile=2.0)
    for (sx, sy, cx, cy) in ((_sk[1] - _sk[0] + .12, .06, (_sk[0] + _sk[1]) / 2, _sk[2] - .03), (_sk[1] - _sk[0] + .12, .06, (_sk[0] + _sk[1]) / 2, _sk[3] + .03),
                             (.06, _sk[3] - _sk[2], _sk[0] - .03, (_sk[2] + _sk[3]) / 2), (.06, _sk[3] - _sk[2], _sk[1] + .03, (_sk[2] + _sk[3]) / 2)):
        box('APR_skylight_trim', (sx, sy, .22), (cx, cy, H + .075 - .11), M_BEAM, grain=True)
''')
    print('skylight', sk)
if '--lab-shots' in own:
    assert src.count(PREVIEW_LINE) == 1, 'build_archive.py: the preview block changed — update this wrapper'
    src = src.replace(PREVIEW_LINE, LAB_SHOTS + PREVIEW_LINE)
sys.argv = [SRC] + rest
exec(compile(src, SRC, 'exec'), {'__name__': '__main__', '__file__': SRC})
