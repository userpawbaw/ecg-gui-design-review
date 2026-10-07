"""D092: 1.5x regional terrain tiles, measured height error, shared normals and skirts."""
from pathlib import Path
import numpy as np,json,gzip,hashlib,math
from PIL import Image
R=Path(__file__).resolve().parents[2];P=R/'assets/processed/a-terrain-detailed-20261007';O=R/'prototype/spikes/a-climb/public/terrain-lod';O.mkdir(parents=True,exist_ok=True)
m=json.loads((P/'metadata.json').read_text());lat0,lon0=m['target'];nb=m['dem']['bounds'];fb=m['far_dem']['bounds'];kx=111.32*math.cos(math.radians(lat0));ky=111.32
lon=np.unique(np.r_[np.linspace(fb[0],fb[2],129),np.linspace(nb[0],nb[2],513)]);lat=np.unique(np.r_[np.linspace(fb[1],fb[3],129),np.linspace(nb[1],nb[3],513)])
lo,la=np.meshgrid(lon,lat);x=(lo-lon0)*kx;y=(la-lat0)*ky
def sample(a,b):
 w,so,e,no=b;xx=np.clip((lo-w)/(e-w)*(a.shape[1]-1),0,a.shape[1]-1.001);yy=np.clip((no-la)/(no-so)*(a.shape[0]-1),0,a.shape[0]-1.001);i=xx.astype(int);j=yy.astype(int);dx=xx-i;dy=yy-j;a=a.copy();a[a==-9999]=0
 return (a[j,i]*(1-dx)+a[j,i+1]*dx)*(1-dy)+(a[j+1,i]*(1-dx)+a[j+1,i+1]*dx)*dy
edge=np.minimum.reduce([(lo-nb[0])/(nb[2]-nb[0]),(nb[2]-lo)/(nb[2]-nb[0]),(la-nb[1])/(nb[3]-nb[1]),(nb[3]-la)/(nb[3]-nb[1])]);mask=np.clip(edge/.05,0,1)
height=(sample(np.load(P/'far-height.npy'),fb)*(1-mask)+sample(np.load(P/'height-metres.npy'),nb)*mask)/1000
z=height*1.5-(x*x+y*y)/(2*6371);gy,gx=np.gradient(z,(lat-lat0)*ky,(lon-lon0)*kx);norm=np.stack([-gx,np.ones_like(gx),gy],-1);norm/=np.linalg.norm(norm,axis=-1)[...,None]
uv=np.stack([(lo-fb[0])/(fb[2]-fb[0]),(la-fb[1])/(fb[3]-fb[1])],-1)
axis=np.rint(np.linspace(0,len(lat)-1,9)).astype(int);tiles=[]
for ty in range(8):
 for tx in range(8):
  y0,y1=axis[ty:ty+2];x0,x1=axis[tx:tx+2];levels=[];full=z[y0:y1+1,x0:x1+1]
  for level,stride in enumerate([8,4,2,1]):
   ys=np.unique(np.r_[np.arange(y0,y1+1,stride),y1]);xs=np.unique(np.r_[np.arange(x0,x1+1,stride),x1]);YY,XX=np.meshgrid(ys,xs,indexing='ij');zz=z[YY,XX]
   # Compare the actual diagonal triangles, rather than a bilinear quad that could underestimate error.
   xx=lon[x0:x1+1];yy=lat[y0:y1+1];ix=np.clip(np.searchsorted(lon[xs],xx,side='right')-1,0,len(xs)-2);iy=np.clip(np.searchsorted(lat[ys],yy,side='right')-1,0,len(ys)-2)
   fx=(xx-lon[xs[ix]])/(lon[xs[ix+1]]-lon[xs[ix]]);fy=(yy-lat[ys[iy]])/(lat[ys[iy+1]]-lat[ys[iy]]);FX,FY=np.meshgrid(fx,fy);IX,IY=np.meshgrid(ix,iy)
   z00=zz[IY,IX];z10=zz[IY,IX+1];z01=zz[IY+1,IX];z11=zz[IY+1,IX+1]
   approx=np.where(FX+FY<=1,z00+(z10-z00)*FX+(z01-z00)*FY,z11+(z01-z11)*(1-FX)+(z10-z11)*(1-FY))
   error=float(np.max(np.abs(full-approx)));data=np.concatenate([np.stack([x[YY,XX],zz,-y[YY,XX]],-1),norm[YY,XX],uv[YY,XX]],-1).reshape(-1,8).astype('<f4');h,w=zz.shape;faces=[]
   for j in range(h-1):
    for i in range(w-1):
     k=j*w+i;faces.extend([k,k+1,k+w,k+1,k+w+1,k+w])
   # A 500m downward skirt covers mismatched edge subdivisions. Shared full-resolution normals avoid lighting seams.
   ring=list(range(w))+[j*w+w-1 for j in range(1,h)]+list(range((h-1)*w+w-2,(h-1)*w-1,-1))+[j*w for j in range(h-2,0,-1)]
   start=len(data);skirt=data[ring].copy();skirt[:,1]-=.5;data=np.concatenate([data,skirt]);
   for i,a in enumerate(ring):
    j=(i+1)%len(ring);b=ring[j];faces.extend([a,start+i,b,b,start+i,start+j])
   indices=np.array(faces,dtype='<u4');blob=gzip.compress(data.tobytes()+indices.tobytes(),mtime=0);name=f'tile-{tx}-{ty}-l{level}.bin.gz';(O/name).write_bytes(blob)
   levels.append({'level':level,'stride':stride,'errorKm':error,'file':name,'vertices':len(data),'indices':len(indices),'bytes':len(blob),'gpuBytes':data.nbytes+indices.nbytes,'sha256':hashlib.sha256(blob).hexdigest()})
  points=np.stack([x[y0:y1+1,x0:x1+1],z[y0:y1+1,x0:x1+1],-y[y0:y1+1,x0:x1+1]],-1).reshape(-1,3);bmin=points.min(0);bmin[1]-=.5;bmax=points.max(0)
  tiles.append({'id':f'{tx}-{ty}','min':bmin.tolist(),'max':bmax.tolist(),'levels':levels})
Image.open(P/'broad.jpg').resize((1024,994)).save(O/'broad-low.jpg',quality=90)
for f in ['broad.jpg','near.jpg']:(O/f).write_bytes((P/f).read_bytes())
manifest={'heightGain':1.5,'units':'km; x east/y height/z south','ssePixels':1.2,'hysteresis':.2,'skirtKm':.5,'cacheGpuBytes':48*1024*1024,'target':m['target'],'broadBounds':fb,'nearBounds':nb,'nearUV':[(nb[0]-fb[0])/(fb[2]-fb[0]),(nb[1]-fb[1])/(fb[3]-fb[1]),(nb[2]-fb[0])/(fb[2]-fb[0]),(nb[3]-fb[1])/(fb[3]-fb[1])],'tiles':tiles,'fullSurfaceTriangles':2*(len(lat)-1)*(len(lon)-1),'fullTiledTriangles':sum(t['levels'][-1]['indices']//3 for t in tiles),'maxNearHeightMetres':float(height.max()*1000),'scope':'regional production candidate, not global Earth handoff'}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('64 tiles / 256 LOD files,',sum(l['bytes'] for t in tiles for l in t['levels']),'compressed bytes')
