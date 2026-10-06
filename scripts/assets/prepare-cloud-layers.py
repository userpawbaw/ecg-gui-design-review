"""D-074 synthetic sculpted density + periodic macro/erosion. No weather simulation."""
from pathlib import Path
import numpy as np,json,hashlib
r=Path(__file__).resolve().parents[2];out=r/'prototype/spikes/a-climb/assets/cloud-layers';out.mkdir(parents=True,exist_ok=True)
n=64;z,y,x=np.mgrid[:n,:n,:n].astype(np.float32)/n
def rand(x,y,z):return np.mod(np.sin(x*127.1+y*311.7+z*74.7)*43758.5453,1)
def value(freq):
 X=x*freq;Y=y*freq;Z=z*freq;ix=np.floor(X);iy=np.floor(Y);iz=np.floor(Z);fx=X-ix;fy=Y-iy;fz=Z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);a=np.zeros_like(x)
 for dz in [0,1]:
  for dy in [0,1]:
   for dx in [0,1]:a+=rand((ix+dx)%freq,(iy+dy)%freq,(iz+dz)%freq)*(fx if dx else 1-fx)*(fy if dy else 1-fy)*(fz if dz else 1-fz)
 return a
def worley(freq):
 X=x*freq;Y=y*freq;Z=z*freq;ix=np.floor(X);iy=np.floor(Y);iz=np.floor(Z);a=np.full_like(x,9)
 for dz in [-1,0,1]:
  for dy in [-1,0,1]:
   for dx in [-1,0,1]:
    cx=(ix+dx)%freq;cy=(iy+dy)%freq;cz=(iz+dz)%freq
    d=(ix+dx+rand(cx,cy,cz)-X)**2+(iy+dy+rand(cx+11,cy+7,cz+2)-Y)**2+(iz+dz+rand(cx+3,cy+17,cz+9)-Z)**2;a=np.minimum(a,d)
 return np.clip(np.sqrt(a)/1.3,0,1)
macro=value(3)*.65+(1-worley(4))*.35;edge=worley(12);medium=worley(7);flow=value(6)
rgba=np.uint8(np.clip(np.stack([macro,edge,medium,flow],axis=-1),0,1)*255);(out/'shape-erosion.rgba8').write_bytes(rgba.tobytes())
n=128;z,y,x=np.mgrid[:n,:n,:n].astype(np.float32)/(n-1)*2-1;field=np.zeros_like(x)
# Deliberate billows, broad lower shelf, asymmetric towers and empty corridors.
lobes=[(-.25,-.17,-.38,.70,.52,.78),(.32,-.10,-.25,.56,.48,.65),(-.4,.32,-.18,.43,.55,.42),(.13,.38,-.10,.48,.54,.52),(.45,.24,.14,.34,.43,.39),(-.25,.25,.45,.48,.48,.40),(.55,-.25,.66,.30,.32,.32),(-.72,-.12,.74,.25,.28,.27)]
for cx,cy,cz,rx,ry,rz in lobes:
 q=np.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2);f=np.clip((1-q)*3.5,0,1);f=f*f*(3-2*f);field=np.maximum(field,f)
base=np.clip((y+.72)/.18,0,1);field*=base*base*(3-2*base)
(out/'billow-density.r8').write_bytes(np.uint8(np.clip(field,0,1)*255).tobytes())
manifest={'author':'project procedural cloud trial','licence':'CC0-1.0','noise_size':[64,64,64],'noise_channels':['Perlin-like value/Worley macro','fine Worley erosion','medium Worley','flow value'],'density_size':[128,128,128],'density_lobes':lobes,'axis_order':'z,y,x interleaved channels; local x side/y height/z forward','world_km_extent':[50.88,10.176,50.88],'scientific_weather':False,'files':{}}
for f in out.iterdir():
 if f.suffix in ['.r8','.rgba8']:
  b=f.read_bytes();manifest['files'][f.name]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
p=r/'assets/registry.json';reg=json.loads(p.read_text(encoding='utf-8'))
for filename,info in manifest['files'].items():
 id='cloud-layers-'+filename.split('.')[0];a={'id':id,'title':id,'kind':'scene-source','status':'test-only','source':{'type':'generated','script':'scripts/assets/prepare-cloud-layers.py'},'licence':'CC0-1.0','attribution_required':False,'original':None,'processed':None,'generated':{'file':str((out/filename).relative_to(r)).replace('\\','/'),**info},'used_by':['prototype/spikes/a-climb'],'review':'D-074 synthetic sculpted density / noise; no Blender or measured weather claim.'}
 old=next((i for i,a in enumerate(reg['assets']) if a['id']==id),None)
 if old is None:reg['assets'].append(a)
 else:reg['assets'][old]=a
p.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))
