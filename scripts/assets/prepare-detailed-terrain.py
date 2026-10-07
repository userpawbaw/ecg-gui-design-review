"""Acquire bounded EOX map tiles + retain ArcticDEM detail for a mountain hero patch."""
from pathlib import Path
import sys,json,math,hashlib,urllib.request,concurrent.futures,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'.tools/geodeps'))
import numpy as np,rasterio
from rasterio.warp import transform_bounds,reproject,Resampling
from rasterio.transform import from_bounds
from PIL import Image
SRC=R/'assets/source/a-terrain-detailed-20261007'; SRC.mkdir(exist_ok=True)
OUT=R/'assets/processed/a-terrain-detailed-20261007'; OUT.mkdir(parents=True,exist_ok=True)
lat,lon=61.63,8.4
meta={'target':[lat,lon],'scope':'Jotunheimen mountain candidate; regional target not final adopted','maps':[]}
def pin(p):return {'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def tilexy(lon,lat,z):return ((lon+180)/360*2**z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z)
for tag,bounds,z in [('broad',(7.1,61.0,9.7,62.2),10),('near',(8.12,61.5,8.65,61.75),12)]:
    w,s,e,n=bounds; x0,y0=tilexy(w,n,z); x1,y1=tilexy(e,s,z)
    xa,ya,xb,yb=map(int,[x0,y0,x1,y1]); tasks=[(x,y) for y in range(ya,yb+1) for x in range(xa,xb+1)]
    def fetch(xy):
        x,y=xy; p=SRC/f'eox-{z}-{x}-{y}.jpg';url=f'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg'
        if not p.exists(): p.write_bytes(urllib.request.urlopen(url,timeout=30).read())
        assert Image.open(p).size==(256,256)
        return p,url,x,y
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: got=list(pool.map(fetch,tasks))
    mosaic=Image.new('RGB',((xb-xa+1)*256,(yb-ya+1)*256))
    for p,url,x,y in got:mosaic.paste(Image.open(p),((x-xa)*256,(y-ya)*256))
    span=20037508.342789244; size=2**z
    sb=(xa/size*2*span-span,span-(yb+1)/size*2*span,(xb+1)/size*2*span-span,span-ya/size*2*span)
    arr=np.asarray(mosaic); width=round((x1-x0)*256);height=round((y1-y0)*256)
    dst=np.zeros((height,width,3),np.uint8)
    for c in range(3):reproject(arr[:,:,c],dst[:,:,c],src_transform=from_bounds(*sb,arr.shape[1],arr.shape[0]),src_crs='EPSG:3857',dst_transform=from_bounds(*bounds,width,height),dst_crs='EPSG:4326',resampling=Resampling.bilinear)
    p=OUT/(tag+'.jpg');Image.fromarray(dst).save(p,quality=96)
    meta['maps'].append({'tag':tag,'bounds':bounds,'zoom':z,'dimensions':[width,height],'nominal_map_pixel_metres_at_target':156543.03392*math.cos(math.radians(lat))/2**z,'note':'WMTS samples of Sentinel composite; native source10m and server sample resolution distinct','output':pin(p),'tiles':[dict(pin(p),url=url) for p,url,x,y in got]})
    print('MAP READY',tag,len(got),flush=True)
bounds=(8.12,61.5,8.65,61.75); tree=ET.parse(R/'assets/source/a-norway-region-20261007/arcticdem32.vrt');root=tree.getroot();band=root.find('VRTRasterBand');gt=[float(x) for x in root.find('GeoTransform').text.split(',')]
b=transform_bounds('EPSG:4326','EPSG:3413',*bounds,densify_pts=32); x0,x1=(b[0]-gt[0])/32,(b[2]-gt[0])/32;y0,y1=(gt[3]-b[3])/32,(gt[3]-b[1])/32; urls=[]
for el in list(band.findall('ComplexSource')):
    rc=el.find('DstRect');x,y,w,h=[float(rc.get(k)) for k in ['xOff','yOff','xSize','ySize']]
    if x+w<x0 or x>x1 or y+h<y0 or y>y1:band.remove(el);continue
    node=el.find('SourceFilename');url=node.text.replace('/vsis3/pgc-opendata-dems/','https://pgc-opendata-dems.s3.us-west-2.amazonaws.com/');node.text='/vsicurl/'+url;urls.append(url)
tree.write(SRC/'selected-dem.vrt',encoding='utf-8');dem=np.full((1025,1025),-9999,np.float32)
with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',GDAL_HTTP_TIMEOUT='30',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
    with rasterio.open(SRC/'selected-dem.vrt') as src:reproject(rasterio.band(src,1),dem,src_transform=src.transform,src_crs=src.crs,src_nodata=-9999,dst_transform=from_bounds(*bounds,1025,1025),dst_crs='EPSG:4326',dst_nodata=-9999,resampling=Resampling.bilinear)
valid=dem!=-9999;assert valid.mean()>.95
np.save(OUT/'height-metres.npy',dem)
meta['dem']={'bounds':bounds,'native_resolution_m':32,'output_dimensions':[1025,1025],'resampling':'bilinear at approx27m; mildly oversamples native32m, no added detail claimed','valid_fraction':float(valid.mean()),'min':float(dem[valid].min()),'max':float(dem[valid].max()),'source_urls':urls,'datum':'ellipsoid DSM; visual local origin only, not geoid-corrected survey','output':pin(OUT/'height-metres.npy'),'selected_vrt':pin(SRC/'selected-dem.vrt')}
(OUT/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n');print('DETAILED ASSETS READY',meta['dem']['max'],flush=True)
