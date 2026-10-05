"""Prepare NASA A-P2 textures; originals and pixel conversions have pinned hashes."""
from pathlib import Path
import urllib.request, hashlib, json
from PIL import Image, ImageFilter
import numpy as np
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
# Artistic material maps derived from pinned NASA pixels. These are not measured
# roughness or additional GEBCO observations; the added polar relief is stylized.
rgb=np.asarray(Image.open(OUT/'day.webp').convert('RGB'),dtype=np.float32)/255
elev=np.asarray(Image.open(OUT/'height.webp').convert('L'),dtype=np.float32)/255
ice=np.clip((rgb.min(axis=2)-.38)/.38,0,1)
ocean=np.clip((rgb[:,:,2]-rgb[:,:,0]-.003)/.015,0,1)*np.clip((rgb[:,:,2]-rgb[:,:,1]+.003)/.012,0,1)*np.clip((.05-elev)/.025,0,1)*(1-ice)
rough=.82*(1-ocean)+.4*ocean
rough=rough*(1-ice)+.64*ice
y,x=np.mgrid[0:2048,0:4096].astype(np.float32)
lon=x/4096*2*np.pi;lat=(.5-y/2048)*np.pi
# Periodic longitude and polar fade avoid a seam/singular pole. Low frequencies
# keep ridge detail stable during camera movement rather than pixel noise.
ridges=(np.sin(lon*37+np.sin(lat*23)*2)*.5+.5)*np.cos(lat)**2
ridges+=.35*(np.sin(lon*71+lat*43)*.5+.5)*np.cos(lat)**2
relief=np.clip(elev*.85+ice*(.18+ridges*.12),0,1)
for name,array in [('roughness',rough),('relief',relief)]:
    target=OUT/(name+'.webp')
    Image.fromarray(np.uint8(array*255)).filter(ImageFilter.GaussianBlur(.6)).save(target,format='WEBP',lossless=True)
    a=dict(manifest[0 if name=='roughness' else 1]);a.update(id='nasa-a-earth-'+name,processed_file=str(target.relative_to(ROOT)).replace('\\','/'),processed_sha256=hashlib.sha256(target.read_bytes()).hexdigest(),bytes=target.stat().st_size)
    a['derived_from']=[{'file':m['source_file'],'sha256':m['source_sha256']} for m in manifest[:2]]
    a['artistic_material_map']=True
    manifest.append(a)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
registry_file=ROOT/'assets/registry.json';reg=json.loads(registry_file.read_text(encoding='utf-8'))
for a in manifest:
    item={'id':a['id'],'title':'NASA A-P2 '+a['id'].split('-')[-1]+' 4096x2048','kind':'scene-source','status':'test-only','source':{'type':'url','url':a['source'],'page':a['page']},'licence':a['licence'],'attribution_required':True,'original':{'file':a['source_file'],'sha256':a['source_sha256'],'bytes':(ROOT/a['source_file']).stat().st_size},'processing':'scripts/assets/prepare-a-earth.py; resize Lanczos; roughness and polar relief are artistic derived maps, not measured data','processed':None,'generated':{'file':a['processed_file'],'sha256':a['processed_sha256'],'bytes':a['bytes']},'used_by':['prototype/spikes/a-climb'],'review':'A-P2 experimental; displacement exaggerated for visibility, not physical Earth scale'}
    if a.get('derived_from'):item['derived_from']=a['derived_from']
    existing=next((i for i,v in enumerate(reg['assets']) if v['id']==a['id']),None)
    if existing is None:reg['assets'].append(item)
    else:reg['assets'][existing]=item
registry_file.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('NASA textures prepared / hashes and registry pinned')
