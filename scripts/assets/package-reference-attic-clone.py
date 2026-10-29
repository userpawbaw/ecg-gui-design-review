"""Lossless WebP packaging of our own new D-159 Cycles atlases. No reference inputs."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'verification/r1-reference-attic-clone-20261030'
p=argparse.ArgumentParser();p.add_argument('--bakes',type=Path,default=Path('/tmp/ecg-authored-attic'));a=p.parse_args()
manifest=json.loads((OUT/'manifest.json').read_text());report={'scope':'RGB8 display-colour source bake versus lossless WebP; not source-linear HDR equality','atlases':{}}
for key,info in manifest['groups'].items():
 src=a.bakes/(key+'.png');image=Image.open(src).convert('RGB');assert image.size==(4096,4096);dest=OUT/info['file']
 if not dest.is_file() or not np.array_equal(np.asarray(image),np.asarray(Image.open(dest).convert('RGB'))):image.save(dest,'WEBP',lossless=True,method=4)
 decoded=Image.open(dest).convert('RGB');assert np.array_equal(np.asarray(image),np.asarray(decoded)),key
 report['atlases'][key]={'rgb8_exact':True,'source_png_bytes':src.stat().st_size,'webp_bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'width':image.width,'height':image.height}
 manifest['groups'][key]['bytes']=dest.stat().st_size;manifest['groups'][key]['sha256']=report['atlases'][key]['sha256']
manifest['glb_bytes']=(OUT/'attic-clone.glb').stat().st_size
manifest['inputs']={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in {'kit-spec':OUT/'kit-spec.json','builder':ROOT/'scripts/blender/build_reference_attic_clone.py'}.items()}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'packaging-result.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
