from pathlib import Path
import os,json,hashlib
import numpy as np
r=Path(__file__).resolve().parents[2]
dll=os.add_dll_directory(str(r/'.tools/vdb-native/Library/bin'))
import openvdb
src=r/'assets/source/disney-cloud/unpacked/wdas_cloud/wdas_cloud_quarter.vdb'
g=openvdb.read(str(src),'density');lo,hi=g.evalActiveVoxelBoundingBox();shape=tuple(hi[i]-lo[i]+1 for i in range(3));print('bounds',lo,hi,shape,flush=True)
a=np.zeros(shape,np.float32);g.copyToArray(a,ijk=lo)
# Preserve actual source proportions; runtime chooses an artistic world scale.
dims=np.array([192,96,192]);axes=[np.linspace(0,shape[i]-1,int(dims[i])) for i in range(3)]
b=np.zeros(dims,np.float32)
for j in range(dims[1]):
 x,z=np.meshgrid(axes[0],axes[2],indexing='ij');y=np.full_like(x,axes[1][j]);p=np.stack([x.ravel(),y.ravel(),z.ravel()],1);q=p.astype(int);f=p-q;v=np.zeros(len(p),np.float32)
 for dx in [0,1]:
  for dy in [0,1]:
   for dz in [0,1]:
    idx=np.minimum(q+np.array([dx,dy,dz]),np.array(shape)-1)
    v+=a[idx[:,0],idx[:,1],idx[:,2]]*(f[:,0] if dx else 1-f[:,0])*(f[:,1] if dy else 1-f[:,1])*(f[:,2] if dz else 1-f[:,2])
 b[:,j,:]=v.reshape(dims[0],dims[2])
positive=b[b>0];scale=float(np.quantile(positive,.995));fine=np.clip(b/scale,0,1)
coarse=fine.copy()
# Deterministic separable Gaussian, sigma 3 voxels; density morphology, not light residual.
k=np.exp(-np.arange(-9,10,dtype=float)**2/18);k/=k.sum()
for axis in range(3):coarse=np.apply_along_axis(lambda v:np.convolve(np.pad(v,(9,9)),k,'valid'),axis,coarse)
out=r/'prototype/spikes/a-climb/assets/disney-volume';out.mkdir(exist_ok=True);files=[]
for name,v in [('fine',fine),('coarse',coarse)]:
 # x fastest, then y, then z: WebGL 3D texture convention. sqrt encode protects wisps.
 data=np.round(np.sqrt(np.clip(v,0,1))*255).astype(np.uint8).transpose(2,1,0).tobytes();(out/(name+'.r8')).write_bytes(data);files.append({'file':name+'.r8','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
m={'source':src.relative_to(r).as_posix(),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'dimensions':dims.tolist(),'sourceBounds':[lo,hi],'sourceVoxelSize':list(g.transform.voxelSize()),'sourceDensityNormalizer':scale,'sourceRange':list(g.evalMinMax()),'encoding':'sqrt density/normalizer; decode red squared; x-fastest y z','coarseGaussianSigmaVoxels':3,'files':files,'nominalR8MiB':sum(f['bytes'] for f in files)/2**20,'license':'Copyright Disney Enterprises Inc 2017, CC BY-SA 3.0, Kevin Udy photo reference','limitations':['resampled quarter VDB; not full-resolution original','artistic world scale; not measured northern weather','no baked lighting/normal or original integrator equivalence']};(out/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');print('READY',m,flush=True)
