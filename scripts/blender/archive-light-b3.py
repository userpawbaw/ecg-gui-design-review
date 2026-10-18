"""D-141: opt-in (b), L2, existing 30 degrees and underside x0.35.

Keep build_archive.py, r8 and --b2 defaults intact. Heavy outputs go to dist.
Local plan: npm run py -- scripts/blender/archive-light-b3.py --plan
Use --python to select the independently prepared bpy 4.5.3 interpreter.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / 'scripts/blender/build_archive.py'
SHOTS = {
    'p2_z28': [[0, -0.8, 2.8], [0, 4.7, 2.8], 32],
    'p3_z20': [[0, -0.8, 2.0], [0, 4.7, 2.0], 32],
}
SOURCES = {
    'ash_veneer': '2k', 'walnut_veneer': '2k',
    **dict.fromkeys(('painted_plaster_wall', 'herringbone_parquet',
                    'binder_notebook', 'cardboard_box_01', 'desk_lamp_arm_01',
                    'drawer_cabinet', 'hanging_industrial_lamp',
                    'painted_wooden_table', 'power_box_01', 'vintage_suitcase',
                    'vintage_wooden_drawer_01', 'wooden_crate_01',
                    'wooden_stool_01', 'GreenChair_01'), '1k'),
}
VERSIONS = {'bpy': '4.5.3', 'numpy': '1.26.4', 'OpenEXR': '3.5.2',
            'PIL': '12.3.0', 'scipy': '1.17.1'}


def recipe(python, out, underside):
    """Return the selected recipe with inherited builder knobs removed."""
    source = BUILDER.read_text(encoding='utf-8')
    knobs = sorted(set(re.findall(
        r'os\.environ(?:\.get\(\s*|\[\s*)[\'"]([^\'"]+)', source)))
    env = {k: v for k, v in os.environ.items() if k not in knobs}
    selected = {
        'B2_FOLIAGE': 'branch', 'B2_EDGE': '0', 'B2_BRANCHES': '7',
        'HOLES': '1.75,3.3,2.6,3.85', 'HOLES_ADD': '',
        'LAD_MODE': 'wall', 'LAD_YAW': '60', 'UNDERSIDE_K': str(underside),
        'SHELF_LIP': '0', 'LIGHTGROUPS': '1',
        'SHOTS_JSON': json.dumps(SHOTS, separators=(',', ':')),
        'PYTHONUTF8': '1', 'PYTHONIOENCODING': 'utf-8',
        'OMP_NUM_THREADS': '4', 'OPENBLAS_NUM_THREADS': '4',
    }
    env.update(selected)
    tag = '_r2_off_r6_pastel_dress'
    build = [python, str(BUILDER), '--intro2', '--art', 'r6', '--dress',
             '--palette', 'pastel', '--look', 'h5', '--b2',
             '--preview', str(out), '--samples', '64', '--res', '1280x720',
             '--save', str(out / 'scene.blend')]
    mixes = [[python, str(ROOT / 'scripts/assets/light-group-mix.py'),
              str(out / (name + tag + '_lg0001.exr')),
              str(out / (name + '_mixed.png')),
              'key=0.5', 'sun=0.6', 'sky=4', 'rest=1', 'expo=0.3']
             for name in SHOTS]
    return env, {'decision': 'D-141', 'underside': underside,
                 'builder_sha256': hashlib.sha256(BUILDER.read_bytes()).hexdigest(),
                 'environment': selected, 'cleared_builder_knobs': knobs,
                 'build': build, 'mixes': mixes,
                 'scope': 'lighting stills; climber/hatch choreography not approved'}


def preflight(python, env):
    errors = []
    probe = (
        'import sys,bpy,numpy,OpenEXR,PIL,scipy,json;'
        'print(json.dumps({"python":sys.version.split()[0],'
        '"bpy":".".join(map(str,bpy.app.version)),'
        '"numpy":numpy.__version__,"OpenEXR":OpenEXR.__version__,'
        '"PIL":PIL.__version__,"scipy":scipy.__version__}))'
    )
    result = subprocess.run([python, '-c', probe], cwd=ROOT, env=env,
                            capture_output=True, text=True, encoding='utf-8')
    if result.returncode:
        errors.append('bpy interpreter probe failed: ' + result.stderr.strip())
    else:
        versions = json.loads(result.stdout.strip().splitlines()[-1])
        if not versions['python'].startswith('3.11.'):
            errors.append('Expected Python 3.11; got ' + versions['python'])
        errors += [f'{name}: expected {want}, got {versions.get(name)}'
                   for name, want in VERSIONS.items() if versions.get(name) != want]
    for slug, resolution in SOURCES.items():
        directory = ROOT / 'assets/source' / ('ph-' + slug)
        gltf = directory / f'{slug}_{resolution}.gltf'
        if not gltf.is_file():
            errors.append('Missing Poly Haven source: ' + str(gltf.relative_to(ROOT)))
            continue
        data = json.loads(gltf.read_text(encoding='utf-8'))
        for entry in data.get('buffers', []) + data.get('images', []):
            uri = entry.get('uri', '')
            if uri and not uri.startswith('data:') and not (directory / uri).is_file():
                errors.append('Missing glTF dependency: ' + str(directory / uri))
    for name in ['figure.json', 'body_v3_ar_climb.glb', 'body_v3_ar_floor.glb', 'heart.glb']:
        if not (ROOT / 'prototype/v2/src/story/intro/assets' / name).is_file():
            errors.append('Missing maintained intro asset: ' + name)
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--plan', action='store_true')
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--render', action='store_true')
    parser.add_argument('--python', default=sys.executable)
    parser.add_argument('--out', type=Path, default=ROOT / 'dist/archive-light-b3')
    parser.add_argument('--underside', type=float, choices=[0.35, 1.0], default=0.35,
                        help='1.0 is the matched baseline, 0.35 the selected candidate')
    args = parser.parse_args()
    out = args.out.resolve()
    env, plan = recipe(args.python, out, args.underside)
    if not args.check and not args.render:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    errors = preflight(args.python, env)
    if errors:
        print(json.dumps({'status': 'BLOCKED', 'errors': errors}, ensure_ascii=False, indent=2))
        return 2
    if args.check:
        print('PASS: interpreter versions and asset presence; download hashes are a separate gate')
        return 0
    if out.exists() and any(out.iterdir()):
        parser.error('Output directory must be empty; preserve existing renders in a different directory')
    out.mkdir(parents=True, exist_ok=True)
    (out / 'recipe.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    subprocess.run(plan['build'], cwd=ROOT, env=env, check=True)
    if hashlib.sha256(BUILDER.read_bytes()).hexdigest() != plan['builder_sha256']:
        raise RuntimeError('Builder changed during rendering; do not use uncertain outputs')
    for command in plan['mixes']:
        subprocess.run(command, cwd=ROOT, env=env, check=True)
    print('Lighting stills complete; pose/hatch and web checks remain separate')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
