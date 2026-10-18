"""Fetch the Poly Haven glTF sources build_archive.py needs into assets/source/ph-<slug>/ (gitignored); md5 per file (API),
sha256 of the .gltf vs assets/registry.json. `?nocache=1` defeats a stale CDN copy (vintage_wooden_drawer_01 was republished,
so its sha256 now differs from the registry: a DIFF there is expected, the md5 check still passes).
  python scripts/assets/fetch-polyhaven-sources.py .            (all)
  python scripts/assets/fetch-polyhaven-sources.py . GreenChair_01 (some)
"""
import hashlib, json, os, sys, urllib.request
ROOT = sys.argv[1]
SLUGS = {'ash_veneer': '2k', 'walnut_veneer': '2k', 'painted_plaster_wall': '1k', 'herringbone_parquet': '1k'}
for s in 'binder_notebook cardboard_box_01 desk_lamp_arm_01 drawer_cabinet hanging_industrial_lamp painted_wooden_table power_box_01 vintage_suitcase vintage_wooden_drawer_01 wooden_crate_01 wooden_stool_01 GreenChair_01'.split():
    SLUGS[s] = '1k'
UA = {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'}
reg = {a['id']: a for a in json.load(open(os.path.join(ROOT, 'assets/registry.json'), encoding='utf-8'))['assets']}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
bad = 0
for slug, res in [(s, r) for s, r in SLUGS.items() if s in sys.argv[2:] or len(sys.argv) == 2]:
    files = json.loads(get(f'https://api.polyhaven.com/files/{slug}'))
    f = files['gltf'][res]['gltf']
    d = os.path.join(ROOT, f'assets/source/ph-{slug}'); os.makedirs(d, exist_ok=True)
    for rel, inc in {**f.get('include', {}), f'{slug}_{res}.gltf': f}.items():
        b = get(inc['url'] + '?nocache=1')
        if hashlib.md5(b).hexdigest() != inc['md5']: print('MD5 MISMATCH', slug, rel); bad += 1; continue
        p = os.path.join(d, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(b)
    g = open(os.path.join(d, f'{slug}_{res}.gltf'), 'rb').read()
    want = (reg.get(f'ph-{slug}') or {}).get('original', {}).get('sha256')
    got = hashlib.sha256(g).hexdigest()
    print(slug, res, 'sha256', 'OK' if want == got else f'DIFF want={want} got={got}')
    if want != got: bad += 1
print('bad', bad)
