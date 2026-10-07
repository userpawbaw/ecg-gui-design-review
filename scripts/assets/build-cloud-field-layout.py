# D102 deterministic 4+16+60 cloud placement, shared actual sources, fixed sun shadow projection.
import json,hashlib,math
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2];P=R/'prototype/spikes/a-climb/public/north-earth/cloud-field';P.mkdir(exist_ok=True)
names=['06','01','10'];meta=[json.loads((P/('cloud'+n)/'manifest.json').read_text(encoding='utf8')) for n in names]
rng=np.random.default_rng(10207);groups=[]
def add(tier,source,x,z,scale,alt):
 extent=np.array(meta[source]['extentKm'])*scale;center=[float(x),float(alt-(x*x+z*z)/(2*6371)),float(z)];groups.append({'id':len(groups),'tier':tier,'source':source,'scale':float(scale),'center':center,'extent':extent.tolist()})
add(0,0,0,-4,.65,7);add(0,2,-19,6,.48,7);add(0,1,19,-9,.42,7.2);add(0,0,-9,25,.36,6.7)
# Seeded irregular spacing avoids the visible grid in round2. Positions only; no lighting-cache rotation.
for tier,count,bounds,minDist,scales in [(1,16,[-43,-67,42,3],13,(.38,.64)),(2,60,[-136,-213,136,-67],14,(.45,.82))]:
 accepted=[];attempts=0
 while len(accepted)<count:
  attempts+=1
  if attempts>20000:raise RuntimeError('spacing failed')
  x=rng.uniform(bounds[0],bounds[2]);z=rng.uniform(bounds[1],bounds[3])
  if any(math.hypot(x-px,z-pz)<minDist for px,pz in accepted):continue
  if tier==1 and any(math.hypot(x-g['center'][0],z-g['center'][2])<15 for g in groups if g['tier']==0):continue
  accepted.append((x,z));add(tier,int(rng.integers(3)),x,z,rng.uniform(*scales),rng.uniform(6.1,7.8))
def sample(arr,q):
 size=np.array(arr.shape[::-1]);valid=np.all((q>=0)&(q<=size-1),axis=-1);q=np.clip(q,0,size-1);i=np.floor(q).astype(np.int32);f=q-i;j=np.minimum(i+1,size-1);a=np.zeros(q.shape[:-1],np.float32)
 for dz in (0,1):
  for dy in (0,1):
   for dx in (0,1):a+=arr[j[...,2] if dz else i[...,2],j[...,1] if dy else i[...,1],j[...,0] if dx else i[...,0]]*(f[...,0] if dx else 1-f[...,0])*(f[...,1] if dy else 1-f[...,1])*(f[...,2] if dz else 1-f[...,2])
 return a*valid
lights=[np.fromfile(P/('cloud'+n)/'light.f16','<f2').astype(np.float32).reshape(96,32,64) for n in names];sun=np.array(meta[0]['sun']);shadowFiles={}
for label,n,b,lev in [(name,512,bounds,lev) for lev in [1,2,3] for name,bounds in [('wide-'+str(lev),[-180,-260,180,100]),('near-'+str(lev),[-60,-90,60,50])]]:
 z,x=np.meshgrid(np.linspace(b[1],b[3],n),np.linspace(b[0],b[2],n),indexing='ij');origin=np.stack([x,np.full_like(x,2),z],axis=-1);opt=np.zeros((n,n),np.float32)
 for g in [g for g in groups if g['tier']<lev]:
  size=np.array(g['extent']);lo=np.array(g['center'])-size/2;hi=lo+size;ta=(lo-origin)/sun;tb=(hi-origin)/sun;entry=np.max(np.minimum(ta,tb),axis=-1);end=np.min(np.maximum(ta,tb),axis=-1);ok=end>np.maximum(0,entry)
  point=origin+sun*(np.maximum(0,entry)+.005)[...,None];q=(point-lo)/size*np.array([64,32,96])-.5
  # Cache stores source-km optical path; uniform scale restores world-km optical depth.
  opt+=sample(lights[g['source']],q)*ok*g['scale']*12
 tr=np.exp(-opt).astype('<f2');f=P/('shadow-'+label+'.f16');tr.tofile(f);shadowFiles[label]={'boundsXZ':b,'size':n,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'receiverPlaneYKm':2}
manifest={'decision':'D102','sources':names,'groups':groups,'counts':[4,16,60],'sun':sun.tolist(),'rotation':'none; source fixed-sun cache retained','uniformScaleOpticalDepth':True,'shadow':shadowFiles,'sourceManifests':meta,'limits':['receiver plane Y2 projection; curvature/terrain height shadow shift approximate','three sources repeated, no fluid simulation']};(P/'field.json').write_text(json.dumps(manifest,indent=2),encoding='utf8');print('FIELD_COMPLETE',len(groups),sum(sum(v['bytes'] for v in m['files'].values()) for m in meta),flush=True)
