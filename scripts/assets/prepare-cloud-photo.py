from pathlib import Path
import numpy as np,json,hashlib
from PIL import Image
r=Path(__file__).resolve().parents[2];out=r/'prototype/spikes/a-climb/assets/cloud-photo';out.mkdir(parents=True,exist_ok=True)
n=128;z,y,x=np.mgrid[:n,:n,:n].astype(np.float32)/(n-1)*2-1;field=np.zeros_like(x)
# Separate towers, narrow saddles: local x side/y altitude/z forward. No broad shelf.
lobes=[(-.64,-.25,.06,.25,.29,.33),(-.41,-.10,.18,.28,.41,.32),(-.30,.28,.32,.24,.48,.28),(-.52,.03,.0,.26,.31,.24),(-.14,-.27,-.12,.23,.22,.30),(.56,-.19,.12,.24,.32,.33),(.69,.02,.27,.18,.27,.24)]
# Multiple smaller bubbles anchored to each tower, not arbitrary global white-noise.
rng=np.random.default_rng(75)
for cx,cy,cz,rx,ry,rz in list(lobes):
 for j in range(12):
  a=rng.normal(size=3);a/=np.linalg.norm(a);u=1.0;rad=rng.uniform(.09,.18);lobes.append((cx+a[0]*rx*u,cy+a[1]*ry*u,cz+a[2]*rz*u,rad,rad*.95,rad))

# Non-periodic smooth value noise at three scales: avoid sine stripes on vapor.
def smooth_noise(cells,seed):
 rng=np.random.default_rng(seed)
 grid=rng.random((cells+1,cells+1,cells+1),dtype=np.float32)
 X=(x+1)*.5*cells;Y=(y+1)*.5*cells;Z=(z+1)*.5*cells
 ix=np.minimum(X.astype(int),cells-1);iy=np.minimum(Y.astype(int),cells-1);iz=np.minimum(Z.astype(int),cells-1)
 fx=X-ix;fy=Y-iy;fz=Z-iz
 fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz)
 result=np.zeros_like(x)
 for dz in [0,1]:
  for dy in [0,1]:
   for dx in [0,1]:
    result+=grid[iz+dz,iy+dy,ix+dx]*(fx if dx else 1-fx)*(fy if dy else 1-fy)*(fz if dz else 1-fz)
 return result
macro=smooth_noise(7,801)-.5;medium=smooth_noise(18,802)-.5;fine=smooth_noise(39,803)-.5
wx=-x+macro*.10;wy=y+smooth_noise(9,804)*.10-.05;wz=z+smooth_noise(9,805)*.10-.05
for cx,cy,cz,rx,ry,rz in lobes:
 q=np.sqrt(((wx-cx)/rx)**2+((wy-cy)/ry)**2+((wz-cz)/rz)**2)
 d=np.clip((1-q)*2.7,0,1);field=np.maximum(field,d*d*(3-2*d))
# Broader coherent erosion, soft density rather than surface bumping.
field=np.clip(field+macro*.38+medium*.48+fine*.22,0,1)*np.minimum(field*7,1)
field*=np.clip((y+.70)/.10,0,1)
raw=np.uint8(field*255);(out/'density.r8').write_bytes(raw.tobytes())
atlas=np.zeros((8*n,16*n),np.uint8)
for k in range(n):atlas[k//16*n:(k//16+1)*n,k%16*n:(k%16+1)*n]=raw[k]
Image.fromarray(np.flipud(atlas)).save(out/'density-atlas.png')
# Fixed local sun, 40 midpoint taps / 8km light path; broad vapor edge.
sun=np.array([.70583314,.51757557,-.4836477],np.float32);sun/=np.linalg.norm(sun)
def sample(X,Y,Z):
 ix=np.clip((X+1)*.5*(n-1),0,n-1);iy=np.clip((Y+1)*.5*(n-1),0,n-1);iz=np.clip((Z+1)*.5*(n-1),0,n-1);i=ix.astype(int);j=iy.astype(int);k=iz.astype(int);f=ix-i;g=iy-j;h=iz-k;a=np.zeros_like(X)
 for dz in [0,1]:
  for dy in [0,1]:
   for dx in [0,1]:a+=field[np.minimum(k+dz,n-1),np.minimum(j+dy,n-1),np.minimum(i+dx,n-1)]*(f if dx else 1-f)*(g if dy else 1-g)*(h if dz else 1-h)
 return a*((abs(X)<=1)&(abs(Y)<=1)&(abs(Z)<=1))
tau=np.zeros_like(x);step=.20 # kilometres; 8km path, density sigma=12/km
for j in range(40):
 t=(j+.5)*step;tau+=sample(x+sun[0]*t/4,y+sun[1]*t/2,z+sun[2]*t/4)*step*6
light=np.uint8(np.clip(tau/24,0,1)*255);(out/'light-depth.r8').write_bytes(light.tobytes());(out/'light-depth.f16').write_bytes(tau.astype(np.float16).tobytes())
gz,gx=np.mgrid[:128,:128].astype(np.float32)/127*4-2;gy=np.full_like(gx,-1.25);gt=np.zeros_like(gx)
for j in range(90):
 t=(j+.5)*.15;gt+=sample(gx+sun[0]*t/4,gy+sun[1]*t/2,gz+sun[2]*t/4)*.15*6
(out/'ground-depth.r8').write_bytes(np.uint8(np.clip(gt/24,0,1)*255).tobytes());(out/'ground-depth.f16').write_bytes(gt.astype(np.float16).tobytes())
manifest={'model':'photo-guided synthetic broad-vapor density; not a photograph reconstruction','synthetic':True,'licence':'CC0-1.0','size':[n,n,n],'axes':'x side/y altitude/z forward','extent_km':[8,4,8],'sigma_per_km':6,'local_sun':sun.tolist(),'bake_steps':40,'light_depth_range':24,'lobes':lobes,'files':{}}
for f in out.glob('*'):
 if f.suffix in ['.r8','.png','.f16']:manifest['files'][f.name]={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');
regp=r/'assets/registry.json';reg=json.loads(regp.read_text(encoding='utf-8'))
for name,info in manifest['files'].items():
 id='cloud-photo-'+name.replace('.','-');a={'id':id,'title':id,'kind':'scene-source','status':'test-only','source':{'type':'generated','script':'scripts/assets/prepare-cloud-photo.py'},'licence':'CC0-1.0','attribution_required':False,'original':None,'processed':None,'generated':{'file':str((out/name).relative_to(r)).replace('\\','/'),**info},'used_by':['prototype/spikes/a-climb'],'review':'D-080 photo-guided broad density, fixed-sun optical depth; synthetic not measured weather; user feedback 0/2.'};reg['assets']=[x for x in reg['assets'] if x['id']!=id]+[a]
regp.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('sculpt density/atlas/light-depth bake complete')

(out/'NOTICE.md').write_text('Photo-guided synthetic density authored for the project. The user photo and J5v7 are visual references, not voxel measurements. No Blender gold render is claimed. Optical depth uses a fixed world sun and requires rebake if the sun changes.\n',encoding='utf-8')
