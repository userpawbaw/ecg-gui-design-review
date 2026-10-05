"""D-071: REMA1km EPSG3031 -> Antarctic texture grid and periodic cloud density.
DEM heights stay measured metres in the source; rendering exaggeration is separate.
No tif/source extraction to arbitrary paths: tar members are read in memory.
"""
from pathlib import Path
import tarfile,hashlib,json,gzip,io
from PIL import Image
import numpy as np
r=Path(__file__).resolve().parents[2];src=r/'assets/source/planet-v2';out=r/'prototype/spikes/a-climb/assets/planet-v2';out.mkdir(parents=True,exist_ok=True)
regpath=r/'assets/registry.json';reg=json.loads(regpath.read_text(encoding='utf-8'))
# fetch.mjs did receive the LUT/REMA files, then its trailing snow request timed
# out before the batch wrote pins. Pin only these received successes, never snow.
for a in reg['assets']:
 if a['id'].startswith('planet-v2-') and a.get('original') and (r/a['original']['file']).exists():
  for slot in ['original','processed']:
   if not a.get(slot):continue
   f=r/a[slot]['file'];b=f.read_bytes();sha=hashlib.sha256(b).hexdigest()
   if a[slot].get('sha256') and a[slot]['sha256']!=sha:raise ValueError('hash mismatch '+str(f))
   a[slot].update(sha256=sha,bytes=len(b))
t=tarfile.open(src/'rema.tar.gz');dem_member=next(m for m in t.getmembers() if m.name.endswith('_dem.tif'));im=Image.open(io.BytesIO(t.extractfile(dem_member).read()))
assert im.mode=='F' and 3031 in im.tag_v2[34735]
step=im.tag_v2[33550];tie=im.tag_v2[33922];dem=np.asarray(im,dtype=np.float32);assert step[:2]==(1000.,1000.)
w,h=2048,512;u=(np.arange(w,dtype=np.float64)+.5)/w;v=(np.arange(h,dtype=np.float64)+.5)/h
lon=(u*2-1)*np.pi;lat=(60+v*30)*np.pi/180;a=6378137.;e=np.sqrt(.0066943799901413165);ts=71*np.pi/180
def polar_t(phi):return np.tan(np.pi/4-phi/2)/((1-e*np.sin(phi))/(1+e*np.sin(phi)))**(e/2)
rho=a*np.cos(ts)/np.sqrt(1-e*e*np.sin(ts)**2)*polar_t(lat)/polar_t(ts)
x=rho[:,None]*np.sin(lon)[None,:];y=rho[:,None]*np.cos(lon)[None,:]
px=(x-tie[3])/step[0]-.5;py=(tie[4]-y)/step[1]-.5
ix=np.clip(np.floor(px).astype(int),0,dem.shape[1]-2);iy=np.clip(np.floor(py).astype(int),0,dem.shape[0]-2);fx=px-ix;fy=py-iy
vals=[dem[iy,ix],dem[iy,ix+1],dem[iy+1,ix],dem[iy+1,ix+1]];valid=np.logical_and.reduce([z>-9000 for z in vals])&(px>=0)&(py>=0)&(px<dem.shape[1]-1)&(py<dem.shape[0]-1)
height=np.where(valid,(vals[0]*(1-fx)+vals[1]*fx)*(1-fy)+(vals[2]*(1-fx)+vals[3]*fx)*fy,0).clip(0,6000).astype('<f4')
with (out/'antarctic-height.f32.bin').open('wb') as f:
 with gzip.GzipFile(fileobj=f,mode='wb',mtime=0,filename='') as z:z.write(height.tobytes())
Image.fromarray(np.uint8(height/6000*255)).save(out/'antarctic-height-preview.png')
# Noise is our deterministic procedural material, not observed NASA weather.
n=64;z,y,x=np.mgrid[0:n,0:n,0:n].astype(np.float32)/n
def hash3(x,y,z):return np.mod(np.sin(x*127.1+y*311.7+z*74.7)*43758.5453,1)
def value_noise(freq):
 X=x*freq;Y=y*freq;Z=z*freq;ix=np.floor(X);iy=np.floor(Y);iz=np.floor(Z);fx=X-ix;fy=Y-iy;fz=Z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz)
 result=np.zeros_like(X)
 for dz in [0,1]:
  for dy in [0,1]:
   for dx in [0,1]:result+=hash3((ix+dx)%freq,(iy+dy)%freq,(iz+dz)%freq)*(fx if dx else 1-fx)*(fy if dy else 1-fy)*(fz if dz else 1-fz)
 return result
noise=value_noise(4)*.55+value_noise(8)*.3+value_noise(16)*.15
(out/'cloud-noise.r8').write_bytes(np.uint8(np.clip(noise,0,1)*255).tobytes())
manifest={'source_dem':dem_member.name,'source_size':list(im.size),'epsg':3031,'pixel_m':1000,'grid':[w,h],'latitude_range':[-60,-90],'valid_fraction':float(valid.mean()),'height_max_m':float(height.max()),'projection':'WGS84 Antarctic polar stereographic lat_ts=-71, bilinear; ocean/no-data=0','render_height_exaggeration':'set in Antarctic mesh code; not baked as scientific DEM','noise':{'size':[64,64,64],'kind':'periodic value FBM; synthetic cloud material'}}
manifest['files']={}
for f in [out/'antarctic-height.f32.bin',out/'cloud-noise.r8']:
 b=f.read_bytes();manifest['files'][f.name]={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
manifest['source_sha256']=hashlib.sha256((src/'rema.tar.gz').read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
for id,file,lic in [('planet-v2-antarctic-grid','antarctic-height.f32.bin','CC-BY-4.0'),('planet-v2-cloud-noise','cloud-noise.r8','CC0-1.0')]:
 info=manifest['files'][file];entry={'id':id,'title':id,'kind':'scene-source','status':'test-only','source':{'type':'generated','script':'scripts/assets/prepare-planet-v2.py'},'licence':lic,'attribution_required':lic=='CC-BY-4.0','original':None,'processed':None,'generated':{'file':str((out/file).relative_to(r)).replace('\\','/'),**info},'used_by':['prototype/spikes/a-climb'],'review':'REMA derived grid or explicitly synthetic cloud noise; experimental.'}
 if lic=='CC-BY-4.0':entry['derived_from']=[{'file':'assets/source/planet-v2/rema.tar.gz','sha256':manifest['source_sha256']}]
 old=next((i for i,a in enumerate(reg['assets']) if a['id']==id),None)
 if old is None:reg['assets'].append(entry)
 else:reg['assets'][old]=entry
regpath.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))
