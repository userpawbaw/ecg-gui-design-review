"""Stage the baked archive and pinned minimal Three.js runtime for local or Pages preview."""
import argparse
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'verification/r1-archive-web-bake-20261018'
DEFAULT_DEST = ROOT / 'prototype/v2/public/archive-bake-preview'
THREE_ROOT = ROOT / 'prototype/v2/node_modules/three'

parser = argparse.ArgumentParser()
parser.add_argument('--destination', type=Path, default=DEFAULT_DEST,
                    help='destination directory (default: ignored Vite public preview path)')
args = parser.parse_args()
DEST = args.destination.resolve()

manifest_path = SOURCE / 'manifest.json'
if not (SOURCE / 'archive.glb').is_file() or not manifest_path.is_file():
    raise SystemExit('Missing packaged archive.glb or manifest.json')

manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
files = {'archive.glb', 'manifest.json', 'preview.html', 'light-study.html'}
files.update({'study/curtain-field.js', 'study/window-study.js', 'study/contact-shadows.js', 'study/ceiling-apertures.js', 'study/volume-shaders.js', 'study/lighting-state.js', 'study/volumetric-light.js'})
files.update(info['file'] for info in manifest['groups'].values() if info.get('file'))
missing = [name for name in sorted(files) if not (SOURCE / name).is_file()]
if missing:
    raise SystemExit('Missing package dependencies: ' + ', '.join(missing))

lock = json.loads((ROOT / 'prototype/v2/package-lock.json').read_text(encoding='utf-8'))
locked_version = lock['packages']['node_modules/three']['version']
three_package = json.loads((THREE_ROOT / 'package.json').read_text(encoding='utf-8')) if (THREE_ROOT / 'package.json').is_file() else {}
if three_package.get('version') != locked_version:
    raise SystemExit(f"Three.js version mismatch: lockfile={locked_version}, installed={three_package.get('version', 'missing')}; run npm ci --prefix prototype/v2")

three_files = (
    'build/three.module.js',
    'build/three.core.js',
    'examples/jsm/controls/OrbitControls.js',
    'examples/jsm/loaders/GLTFLoader.js',
    'examples/jsm/libs/meshopt_decoder.module.js',
    'examples/jsm/utils/BufferGeometryUtils.js',
    'examples/jsm/utils/SkeletonUtils.js',
    'examples/jsm/postprocessing/Pass.js',
    'examples/jsm/postprocessing/OutputPass.js',
    'examples/jsm/shaders/OutputShader.js',
    'LICENSE',
)
missing_three = [name for name in three_files if not (THREE_ROOT / name).is_file()]
if missing_three:
    raise SystemExit('Missing Three.js runtime files: ' + ', '.join(missing_three))

DEST.mkdir(parents=True, exist_ok=True)
for name in sorted(files):
    target = DEST / name
    target.parent.mkdir(parents=True, exist_ok=True)
    if name.endswith('.html'):
        html = (SOURCE / name).read_text(encoding='utf-8')
        marker = '<script type="importmap">'
        start = html.find(marker)
        end = html.find('</script>', start)
        if start < 0 or end < 0:
            raise SystemExit(f'Could not rewrite the import map in {name}')
        json_start = start + len(marker)
        import_map = json.loads(html[json_start:end].strip())
        imports = import_map.get('imports', {})
        if set(imports) != {'three', 'three/addons/'}:
            raise SystemExit(f'Unexpected import map entries in {name}: ' + ', '.join(imports))
        imports['three'] = './node_modules/three/build/three.module.js'
        imports['three/addons/'] = './node_modules/three/examples/jsm/'
        html = html[:json_start] + '\n    ' + json.dumps(import_map, separators=(',', ':')) + '\n  ' + html[end:]
        target.write_text(html, encoding='utf-8')
        shutil.copystat(SOURCE / name, target)
    else:
        shutil.copy2(SOURCE / name, target)
for name in three_files[:-1]:
    target = DEST / 'node_modules/three' / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(THREE_ROOT / name, target)
shutil.copy2(THREE_ROOT / 'LICENSE', DEST / 'THREE-LICENSE.txt')

staged = [DEST / name for name in files]
staged.extend(DEST / 'node_modules/three' / name for name in three_files[:-1])
staged.append(DEST / 'THREE-LICENSE.txt')
print('staged', len(staged), 'web/runtime files,',
      round(sum(path.stat().st_size for path in staged) / 1e6, 2),
      'MB at', DEST)
