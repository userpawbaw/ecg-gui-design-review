"""Bake the selected B3 archive recipe to an isolated web package.

Use the bpy 4.5.3 interpreter. This does not write Story assets or builder defaults.
  python scripts/blender/archive-light-b3-web.py --plan
  python scripts/blender/archive-light-b3-web.py --render
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'scripts/blender/archive-light-b3.py'
BUILDER = ROOT / 'scripts/blender/build_archive.py'
DEFAULT_OUT = ROOT / 'verification/r1-archive-web-bake-20261018'


def load_base():
    spec = importlib.util.spec_from_file_location('archive_light_b3', BASE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_plan(python, out, size, samples):
    base = load_base()
    _, base_plan = base.recipe(python, out, 0.35)
    # Do not propagate or record ambient credentials from the cloud shell.
    safe_keys = ('PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'LD_LIBRARY_PATH', 'PYTHONPATH')
    env = {key: os.environ[key] for key in safe_keys if os.environ.get(key)}
    env.update(base_plan['environment'])
    # Apply the selected D-144 ratios to the r6 source light energies before baking.
    env.update({'KEY_E': '2275', 'SUN_E': '19.8', 'SKY_E': '1.2', 'EXPO': '0.3'})
    rel_out = out.relative_to(ROOT).as_posix()
    cmd = [python, str(BUILDER), '--intro2', '--art', 'r6', '--dress',
           '--palette', 'pastel', '--look', 'h5', '--b2', '--bake', rel_out,
           '--size', str(size), '--bsamples', str(samples)]
    plan = {
        'decision': 'D-145', 'base_decision': 'D-141', 'light_mix': 'D-144',
        'builder_sha256': base_plan['builder_sha256'],
        'output': rel_out, 'bake_size': size, 'bake_samples': samples,
        'selected': {'foliage': 'branch', 'ladder': 'L2/wall', 'angle_degrees': 30,
                     'underside_factor': 0.35},
        'light_group_ratios': {'key': 0.5, 'sun': 0.6, 'sky': 4.0, 'rest': 1.0,
                               'exposure': 0.3},
        'baked_source_energies': {'key': 2275, 'sun': 19.8, 'sky': 1.2,
                                  'rest': 'builder default'},
        'environment': {key: value for key, value in env.items()
                        if key in base_plan['environment'] or key in ('KEY_E', 'SUN_E', 'SKY_E', 'EXPO')},
        'build': cmd,
        'scope': 'isolated web bake; Story source assets and defaults unchanged'
    }
    return base, env, plan


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument('--plan', action='store_true')
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--render', action='store_true')
    ap.add_argument('--python', default=sys.executable)
    ap.add_argument('--out', type=Path, default=DEFAULT_OUT)
    ap.add_argument('--size', type=int, default=2048)
    ap.add_argument('--samples', type=int, default=128)
    args = ap.parse_args()
    out = args.out.resolve()
    try:
        out.relative_to(ROOT)
    except ValueError:
        ap.error('--out must remain inside the repository workspace')
    if BUILDER.resolve() == BASE.resolve():
        raise RuntimeError('builder path collision')
    base, env, plan = make_plan(args.python, out, args.size, args.samples)
    if not args.check and not args.render:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    errors = base.preflight(args.python, env)
    if errors:
        print(json.dumps({'status': 'BLOCKED', 'errors': errors}, ensure_ascii=False, indent=2))
        return 2
    if args.check:
        print('PASS: bpy/assets preflight; output stays separate from Story assets')
        return 0
    if out.exists() and any(out.iterdir()):
        ap.error('Output directory must be empty; preserve existing evidence elsewhere')
    out.mkdir(parents=True, exist_ok=True)
    (out / 'recipe.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    subprocess.run(plan['build'], cwd=ROOT, env=env, check=True)
    if hashlib.sha256(BUILDER.read_bytes()).hexdigest() != plan['builder_sha256']:
        raise RuntimeError('Builder changed during bake; do not use the uncertain output')
    print('PASS: B3 light baked to isolated web output; packaging and browser validation remain')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
