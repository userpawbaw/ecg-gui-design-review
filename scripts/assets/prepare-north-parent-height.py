"""D094: bounded low-detail actual terrain, not synthetic relief or detailed hero replacement."""
from pathlib import Path
import sys,math,json,hashlib,urllib.request,concurrent.futures
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'.tools/geodeps'))
import numpy as np
from PIL import Image
import rasterio
from rasterio.warp import reproject,Resampling
from rasterio.transform import from_bounds
S=R/'assets/source/a-north-parent-20261007';S.mkdir(parents=True,exist_ok=True)
O=R/'prototype/spikes/a-climb/public/north-earth'
bounds=(0.,56.,16.,68.);z=7
def tile(lon,lat):return (lon+180)/360*2**z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z
xa,ya=map(int,tile(bounds[0],bounds[3]));xb,yb=map(int,tile(bounds[2],bounds[1]))
def get(xy):
 x,y=xy;p=S/f'{z}-{x}-{y}.png';url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
 if not p.exists():p.write_bytes(urllib.request.urlopen(url,timeout=30).read())
 a=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32);assert a.shape==(256,256,3)
 return x,y,a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768,{'url':url,'file':str(p.relative_to(R)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
tasks=[(x,y) for y in range(ya,yb+1) for x in range(xa,xb+1)]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(get,tasks))
mosaic=np.zeros(((yb-ya+1)*256,(xb-xa+1)*256),np.float32)
for x,y,a,pin in results:mosaic[(y-ya)*256:(y-ya+1)*256,(x-xa)*256:(x-xa+1)*256]=a
span=20037508.342789244;size=2**z;sb=(xa/size*2*span-span,span-(yb+1)/size*2*span,(xb+1)/size*2*span-span,span-ya/size*2*span)
h=np.zeros((513,513),np.float32)
reproject(mosaic,h,src_transform=from_bounds(*sb,mosaic.shape[1],mosaic.shape[0]),src_crs='EPSG:3857',dst_transform=from_bounds(*bounds,513,513),dst_crs='EPSG:4326',resampling=Resampling.bilinear)
# Ocean bathymetry is not displayed as negative surface terrain; no surveyed sea mask claim.
h=np.maximum(0,h);encoded=np.round(h).astype('<u2');p=O/'parent-height.bin';p.write_bytes(encoded.tobytes())
metadata={'bounds':bounds,'size':513,'encoding':'uint16 little endian height metres, north row first','source':'AWS Mapzen Terrain Tiles z7','heightGain':1.5,'sourceTiles':[x[3] for x in results],'output':{'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()},'note':'coarse source sample ~650m; raster cell ~1.3-2km, resampling adds no detail; negative bathymetry clamped to sea level; mixed DEM datum not surveyed alignment','min':float(h.min()),'max':float(h.max())}
(O/'parent-height.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8');print('PARENT READY',len(results),metadata['output'],flush=True)

