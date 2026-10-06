from pathlib import Path
import numpy as np,json,hashlib
from PIL import Image
r=Path(__file__).resolve().parents[2];out=r/'prototype/spikes/a-climb/assets/cloud-sculpt';out.mkdir(parents=True,exist_ok=True)
n=128;z,y,x=np.mgrid[:n,:n,:n].astype(np.float32)/(n-1)*2-1;field=np.zeros_like(x)
# Separate towers, narrow saddles: local x side/y altitude/z forward. No broad shelf.
lobes=[(-.57,-.30,-.18,.28,.38,.33),(-.21,-.28,-.10,.29,.44,.30),(.15,-.27,.03,.31,.40,.32),(.47,-.31,-.11,.25,.34,.28),(-.43,.17,-.16,.20,.35,.22),(-.06,.31,-.05,.23,.44,.25),(.29,.15,.12,.19,.33,.20),(-.60,-.20,.45,.20,.29,.22),(.55,-.22,.43,.20,.28,.22)]
# Multiple smaller bubbles anchored to each tower, not arbitrary global white-noise.
rng=np.random.default_rng(75)
for cx,cy,cz,rx,ry,rz in list(lobes):
 for j in range(18):
  a=rng.normal(size=3);a/=np.linalg.norm(a);u=.76;rad=rng.uniform(.045,.095);lobes.append((cx+a[0]*rx*u,cy+a[1]*ry*u,cz+a[2]*rz*u,rad,rad*.95,rad))
wx=x+.025*np.sin(y*31+np.sin(z*17));wy=y+.025*np.sin(z*27+np.sin(x*19));wz=z+.025*np.sin(x*29+np.sin(y*23))
for cx,cy,cz,rx,ry,rz in lobes:
 q=np.sqrt(((wx-cx)/rx)**2+((wy-cy)/ry)**2+((wz-cz)/rz)**2);d=np.clip((1-q)*5,0,1);field=np.maximum(field,d*d*(3-2*d))
# coherent fine-scale edge roughness, core remains solid. Synthetic, not weather.
noise=(np.sin(x*51+np.sin(z*13))*np.sin(y*43+np.sin(x*17))*np.sin(z*47+np.sin(y*19)))*.07
detail=np.frombuffer((r/'prototype/spikes/a-climb/assets/cloud-layers/shape-erosion.rgba8').read_bytes(),dtype=np.uint8).reshape(64,64,64,4).astype(np.float32)/255
ix=np.mod((x*2.1+.5)*64,64).astype(int);iy=np.mod((y*2.7+.5)*64,64).astype(int);iz=np.mod((z*2.3+.5)*64,64).astype(int)
erode=detail[iz,iy,ix,1];field=np.clip(field-.44*erode+noise*np.minimum(field*4,1)*(1-field),0,1);base=np.clip((y+.70)/.08,0,1);field*=base
raw=np.uint8(field*255);(out/'density.r8').write_bytes(raw.tobytes())
atlas=np.zeros((8*n,16*n),np.uint8)
for k in range(n):atlas[k//16*n:(k//16+1)*n,k%16*n:(k%16+1)*n]=raw[k]
Image.fromarray(np.flipud(atlas)).save(out/'density-atlas.png')
# Bake optical depth in local direction of the locked incoming sunlight, 24 midpoint taps.
sun=np.array([.70583314,.51757557,-.4836477],np.float32);sun/=np.linalg.norm(sun)
def sample(X,Y,Z):
 ix=np.clip((X+1)*.5*(n-1),0,n-1);iy=np.clip((Y+1)*.5*(n-1),0,n-1);iz=np.clip((Z+1)*.5*(n-1),0,n-1);i=ix.astype(int);j=iy.astype(int);k=iz.astype(int);f=ix-i;g=iy-j;h=iz-k;a=np.zeros_like(X)
 for dz in [0,1]:
  for dy in [0,1]:
   for dx in [0,1]:a+=field[np.minimum(k+dz,n-1),np.minimum(j+dy,n-1),np.minimum(i+dx,n-1)]*(f if dx else 1-f)*(g if dy else 1-g)*(h if dz else 1-h)
 return a*((abs(X)<=1)&(abs(Y)<=1)&(abs(Z)<=1))
tau=np.zeros_like(x);step=.09 # kilometres; 2.16km path, density sigma=12/km
for j in range(24):
 t=(j+.5)*step;tau+=sample(x+sun[0]*t/2,y+sun[1]*t,z+sun[2]*t/2)*step*12
light=np.uint8(np.clip(tau/24,0,1)*255);(out/'light-depth.r8').write_bytes(light.tobytes());(out/'light-depth.f16').write_bytes(tau.astype(np.float16).tobytes())
gz,gx=np.mgrid[:128,:128].astype(np.float32)/127*4-2;gy=np.full_like(gx,-1.25);gt=np.zeros_like(gx)
for j in range(48):
 t=(j+.5)*.10;gt+=sample(gx+sun[0]*t/2,gy+sun[1]*t,gz+sun[2]*t/2)*.10*12
(out/'ground-depth.r8').write_bytes(np.uint8(np.clip(gt/24,0,1)*255).tobytes());(out/'ground-depth.f16').write_bytes(gt.astype(np.float16).tobytes())
manifest={'model':'Blender/Cycles shared raw-density atlas candidate','synthetic':True,'licence':'CC0-1.0','size':[n,n,n],'axes':'x side/y altitude/z forward','extent_km':[4,2,4],'sigma_per_km':12,'local_sun':sun.tolist(),'bake_steps':24,'light_depth_range':24,'lobes':lobes,'files':{}}
for f in out.glob('*'):
 if f.suffix in ['.r8','.png','.f16']:manifest['files'][f.name]={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');
regp=r/'assets/registry.json';reg=json.loads(regp.read_text(encoding='utf-8'))
for name,info in manifest['files'].items():
 id='cloud-sculpt-'+name.replace('.','-');a={'id':id,'title':id,'kind':'scene-source','status':'test-only','source':{'type':'generated','script':'scripts/assets/prepare-cloud-sculpt.py'},'licence':'CC0-1.0','attribution_required':False,'original':None,'processed':None,'generated':{'file':str((out/name).relative_to(r)).replace('\\','/'),**info},'used_by':['prototype/spikes/a-climb'],'review':'D-075 shared Blender density atlas and fixed-sun light/ground depth; not measured weather, experimental.'};reg['assets']=[x for x in reg['assets'] if x['id']!=id]+[a]
regp.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('sculpt density/atlas/light-depth bake complete')
