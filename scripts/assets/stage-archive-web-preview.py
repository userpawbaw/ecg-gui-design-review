"""Copy an isolated baked archive package into Vite's ignored public preview path."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'verification/r1-archive-web-bake-20261018'
DEST = ROOT / 'prototype/v2/public/archive-bake-preview'

manifest_path = SOURCE / 'manifest.json'
if not (SOURCE / 'archive.glb').is_file() or not manifest_path.is_file():
    raise SystemExit('Missing packaged archive.glb or manifest.json')

import json
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
files = {'archive.glb', 'manifest.json', 'preview.html'}
files.update(info['file'] for info in manifest['groups'].values() if info.get('file'))
missing = [name for name in sorted(files) if not (SOURCE / name).is_file()]
if missing:
    raise SystemExit('Missing package dependencies: ' + ', '.join(missing))

DEST.mkdir(parents=True, exist_ok=True)
for name in sorted(files):
    shutil.copy2(SOURCE / name, DEST / name)
print('staged', len(files), 'web files,',
      round(sum((DEST / name).stat().st_size for name in files) / 1e6, 2),
      'MB at prototype/v2/public/archive-bake-preview (ignored Vite output)')
