# D102: actual scalar sources, no occupancy substitution.
# D100: actual OpenVDB density -> padded dense half floats and fixed-sun optical-depth cache.
import os,json,hashlib,time
from pathlib import Path
root=Path(__file__).resolve().parents[2]
os.add_dll_directory(str(root/'.tools/vdb-native/Library/bin'))
import openvdb as vdb
import numpy as np
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--cloud',choices=['06','01','10'],required=True);args=parser.parse_args()
source=root/('assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/cloud_'+args.cloud+'_variant_0000.vdb')
out=root/('prototype/spikes/a-climb/public/north-earth/cloud-field/cloud'+args.cloud);out.mkdir(parents=True,exist_ok=True)
g=vdb.read(str(source),'density');lo,hi=g.evalActiveVoxelBoundingBox()
a=np.zeros(tuple(hi[i]-lo[i]+1 for i in range(3)),np.float32);g.copyToArray(a,ijk=lo)
# VDB native xyz -> WebGL xyz=(nativeX,nativeZ,-nativeY); arrays are z,y,x with x-fast storage.
a=np.transpose(a,(1,2,0))[::-1].copy()
def sample(arr,coords):
 size=np.array(arr.shape[::-1]); valid=np.all((coords>=0)&(coords<=size-1),axis=-1); q=np.clip(coords,0,size-1);i=np.floor(q).astype(np.int32);f=q-i;j=np.minimum(i+1,size-1);val=np.zeros(q.shape[:-1],np.float32)
 for dz in (0,1):
  for dy in (0,1):
   for dx in (0,1):
    ix=j[...,0] if dx else i[...,0];iy=j[...,1] if dy else i[...,1];iz=j[...,2] if dz else i[...,2]
    w=(f[...,0] if dx else 1-f[...,0])*(f[...,1] if dy else 1-f[...,1])*(f[...,2] if dz else 1-f[...,2]);val+=arr[iz,iy,ix]*w
 return val*valid
nx,ny,nz=128,64,192
z,y,x=np.meshgrid((np.arange(nz)+.5)/nz,(np.arange(ny)+.5)/ny,(np.arange(nx)+.5)/nx,indexing='ij');uv=np.stack([x,y,z],axis=-1).astype(np.float32)
pad=.04;coords=(uv-pad)/(1-2*pad)*(np.array(a.shape[::-1])-1)
d=sample(a,coords)
extent=np.array([18,18*(hi[2]-lo[2]+1)/(hi[0]-lo[0]+1),18*(hi[1]-lo[1]+1)/(hi[0]-lo[0]+1)])/(1-2*pad)
sun=np.array([-.67,.28,-.70]);sun/=np.linalg.norm(sun)
# Light cache is an integral of actual density in km, independent of view camera.
lx,ly,lz=64,32,96
z,y,x=np.meshgrid((np.arange(lz)+.5)/lz,(np.arange(ly)+.5)/ly,(np.arange(lx)+.5)/lx,indexing='ij');luv=np.stack([x,y,z],axis=-1).astype(np.float32)
tau=np.zeros((lz,ly,lx),np.float32);ds=.55
for step in range(80):
 q=(luv+sun/extent*((step+.5)*ds))*np.array([nx,ny,nz])-.5;tau+=sample(d,q)*ds
 if step%20==0:print('light cache',step,flush=True)
(d.astype('<f2')).tofile(out/'density.f16');tau.astype('<f2').tofile(out/'light.f16')
# Box-average density for mid/far; conservative maximum for empty-space checks.
mid=d.reshape(nz//2,2,ny//2,2,nx//2,2).mean(axis=(1,3,5));far=d.reshape(nz//4,4,ny//4,4,nx//4,4).mean(axis=(1,3,5));occ=d.reshape(nz//8,8,ny//8,8,nx//8,8).max(axis=(1,3,5))
mid.astype('<f2').tofile(out/'density-mid.f16');far.astype('<f2').tofile(out/'density-far.f16');np.ceil(np.clip(occ,0,1)*255).astype('uint8').tofile(out/'occupancy.r8')
manifest={'source':source.relative_to(root).as_posix(),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'converter':'native OpenVDB13.0.0 copyToArray / numpy2.5.3','grid':'density','indexBounds':[lo,hi],'worldBounds':[g.transform.indexToWorld(lo),g.transform.indexToWorld(hi)],'sourceRange':list(g.evalMinMax()),'sourceActiveCount':int(np.count_nonzero(a)),'dims':[nx,ny,nz],'lightDims':[lx,ly,lz],'extentKm':extent.tolist(),'paddingFraction':pad,'baseKm':4.2-float(extent[1])*pad,'centerXZ':[0,-4],'sun':sun.tolist(),'extinctionPerKm':12,'densityRange':[float(d.min()),float(d.max())],'positiveSamples':int(np.count_nonzero(d)),'lightCache':'80 steps * .55km density integral toward fixed sun; no pixels baked','sourceAxisToWorld':'native X,Z,-Y; x-fast array','sourceToDense':'trilinear actual scalar values; empty padded bounds','files':{}}
for name in ['density.f16','light.f16','density-mid.f16','density-far.f16','occupancy.r8']:
 raw=(out/name).read_bytes();manifest['files'][name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
manifest['midDims']=[64,32,96];manifest['farDims']=[32,16,48];manifest['occupancyDims']=[16,8,24]
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8');print(json.dumps(manifest),flush=True)
