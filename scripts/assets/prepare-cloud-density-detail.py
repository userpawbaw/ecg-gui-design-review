"""D131: local scalar-grid deformation, preserving original file and transform."""
from pathlib import Path
import os,json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
_dll=os.add_dll_directory(str(ROOT/'.tools/vdb-native/Library/bin'))
import openvdb
out=ROOT/'verification/a-cloud-density-20261012/density';out.mkdir(parents=True,exist_ok=True)
source=ROOT/'assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/cloud_06_variant_0000.vdb'
g=openvdb.read(str(source),'density');lo,hi=g.evalActiveVoxelBoundingBox()
shape=tuple(hi[i]-lo[i]+1 for i in range(3));a=np.zeros(shape,np.float32);g.copyToArray(a,ijk=lo)
def trilerp(field,p):
 p=np.clip(p,0,np.array(field.shape)-1);q=p.astype(np.int32);f=p-q;v=np.zeros(len(p),np.float32)
 for dx in [0,1]:
  for dy in [0,1]:
   for dz in [0,1]:
    ix=np.minimum(q[:,0]+dx,field.shape[0]-1);iy=np.minimum(q[:,1]+dy,field.shape[1]-1);iz=np.minimum(q[:,2]+dz,field.shape[2]-1)
    v+=field[ix,iy,iz]*(f[:,0] if dx else 1-f[:,0])*(f[:,1] if dy else 1-f[:,1])*(f[:,2] if dz else 1-f[:,2])
 return v
rng=np.random.default_rng(615);macro=[rng.random((40,50,30),dtype=np.float32) for _ in range(3)];fine=[rng.random((24,70,40),dtype=np.float32) for _ in range(3)]
outputs=[]
for kind in ['billow','billow-wisp']:
 b=np.zeros_like(a)
 for start in range(0,shape[0],8):
  end=min(start+8,shape[0]);x,y,z=np.meshgrid(np.arange(start,end),np.arange(shape[1]),np.arange(shape[2]),indexing='ij')
  p=np.stack([x.ravel(),y.ravel(),z.ravel()],axis=1).astype(np.float32);original=a[start:end].ravel()
  mask=np.clip((.22-original)/.20,0,1)
  displacement=np.stack([(trilerp(n,p/14)*2-1)*5 for n in macro],axis=1)*mask[:,None]
  if kind=='billow-wisp':
   stretch=np.array([24,8,6],np.float32)
   displacement+=np.stack([(trilerp(n,p/stretch)*2-1)*amp for n,amp in zip(fine,[4,2,2])],axis=1)*mask[:,None]
  d=trilerp(a,p+displacement)
  # Soft support preserves the original broad envelope; no unrelated new cloud islands.
  support=np.clip(original/.018,0,1);d*=support
  b[start:end]=d.reshape((end-start,shape[1],shape[2]))
 grid=openvdb.FloatGrid();grid.name='density';grid.transform=g.transform;grid.copyFromArray(b,ijk=lo)
 path=out/(kind+'.vdb');openvdb.write(str(path),grids=[grid])
 outputs.append({'kind':kind,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sumDensityRatio':float(b.sum()/a.sum()),'maxDensity':float(b.max()),'activeVoxels':int(np.count_nonzero(b))})
 print('DENSITY_READY',kind,flush=True)
(out/'manifest.json').write_text(json.dumps({'source':str(source.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceBounds':[lo,hi],'sourceVoxelSize':list(g.transform.voxelSize()),'sourceDensityRange':list(g.evalMinMax()),'fieldDims':shape,'method':'trilinear original-density sampling at bounded 3D value-noise displaced positions; dense cores protected; original support mask','seed':615,'macroCellVoxels':14,'macroAmplitudeVoxels':5,'wispCellVoxels':[24,8,6],'wispAmplitudeVoxels':[4,2,2],'outputs':outputs,'limits':['not Houdini/Nubis implementation','no new wisps outside original broad footprint','scalar mass ratio is not final optical depth or shape approval']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
