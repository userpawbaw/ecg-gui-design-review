"""Prepare NASA A-P2 textures; originals and pixel conversions have pinned hashes."""
from pathlib import Path
import urllib.request, hashlib, json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'prototype/spikes/a-climb/assets/earth'; OUT.mkdir(parents=True,exist_ok=True)
sources=[('day','https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x5400x2700.jpg','https://visibleearth.nasa.gov/images/74092'),
 ('height','https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg','https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/')]
reg_at_start=json.loads((ROOT/'assets/registry.json').read_text(encoding='utf-8'))
manifest=[]
for name,url,page in sources:
    source=ROOT/('assets/source/a-earth-'+name+'.jpg');source.parent.mkdir(parents=True,exist_ok=True)
    if not source.exists():
        req=urllib.request.Request(url,headers={'User-Agent':'ECG-Signal-Studio-asset-pipeline/1.0'})
        source.write_bytes(urllib.request.urlopen(req,timeout=90).read())
    old=next((a for a in reg_at_start['assets'] if a['id']=='nasa-a-earth-'+name),None)
    if old and hashlib.sha256(source.read_bytes()).hexdigest()!=old['original']['sha256']:raise ValueError('NASA source hash mismatch: '+name)
    im=Image.open(source).convert('RGB' if name=='day' else 'L').resize((4096,2048),Image.Resampling.LANCZOS)
    target=OUT/(name+'.webp');im.save(target,format='WEBP',quality=95 if name=='day' else 100,lossless=name=='height')
    manifest.append({'id':'nasa-a-earth-'+name,'source':url,'page':page,'credit':'NASA Earth Observatory / Jesse Allen; GEBCO elevation','licence':'public-domain','source_file':str(source.relative_to(ROOT)).replace('\\','/'),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'processed_file':str(target.relative_to(ROOT)).replace('\\','/'),'processed_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'size':[4096,2048]})
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
registry_file=ROOT/'assets/registry.json';reg=json.loads(registry_file.read_text(encoding='utf-8'))
for a in manifest:
    item={'id':a['id'],'title':'NASA A-P2 '+a['id'].split('-')[-1]+' 4096x2048','kind':'scene-source','status':'test-only','source':{'type':'url','url':a['source'],'page':a['page']},'licence':a['licence'],'attribution_required':True,'original':{'file':a['source_file'],'sha256':a['source_sha256'],'bytes':(ROOT/a['source_file']).stat().st_size},'processing':'scripts/assets/prepare-a-earth.py; resize Lanczos, color quality95/height lossless WebP','processed':None,'generated':{'file':a['processed_file'],'sha256':a['processed_sha256'],'bytes':a['bytes']},'used_by':['prototype/spikes/a-climb'],'review':'A-P2 experimental; displacement exaggerated for visibility, not physical Earth scale'}
    existing=next((i for i,v in enumerate(reg['assets']) if v['id']==a['id']),None)
    if existing is None:reg['assets'].append(item)
    else:reg['assets'][existing]=item
registry_file.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('NASA textures prepared / hashes and registry pinned')
