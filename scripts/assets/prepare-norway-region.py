"""NASA full-resolution crop plus a bounded read of official ArcticDEM COG tiles."""
import sys, os, json, hashlib, xml.etree.ElementTree as ET
from pathlib import Path
R=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(R/'.tools/geodeps'))
import numpy as np, rasterio
from rasterio.warp import transform_bounds, reproject, Resampling
from rasterio.transform import from_bounds
from PIL import Image
SRC=R/'assets/source/a-norway-region-20261007'
OUT=R/'assets/processed/a-norway-region-20261007'; OUT.mkdir(parents=True,exist_ok=True)
Image.MAX_IMAGE_PIXELS=None
im=Image.open(SRC/'bmng-july-C1.jpg')
assert im.size==(21600,21600)
# C1 is longitude 0..90, latitude 0..90. Native samples retained without enlargement.
box=(0,3600,10800,10800) # west0 east45 south45 north75
im.crop(box).save(OUT/'bmng-region.jpg',quality=95)
bounds=(10.0,63.5,14.8,64.7) # lonW,latS,lonE,latN; bounded detailed land patch
tree=ET.parse(SRC/'arcticdem32.vrt'); root=tree.getroot(); band=root.find('VRTRasterBand')
gt=[float(x) for x in root.find('GeoTransform').text.split(',')]
b=transform_bounds('EPSG:4326','EPSG:3413',*bounds,densify_pts=32)
x0=(b[0]-gt[0])/32; x1=(b[2]-gt[0])/32
y0=(gt[3]-b[3])/32; y1=(gt[3]-b[1])/32
selected=[]
for source in list(band.findall('ComplexSource')):
    rect=source.find('DstRect'); x=float(rect.get('xOff')); y=float(rect.get('yOff'))
    w=float(rect.get('xSize')); h=float(rect.get('ySize'))
    if x+w<x0 or x>x1 or y+h<y0 or y>y1:
        band.remove(source); continue
    filename=source.find('SourceFilename')
    url=filename.text.replace('/vsis3/pgc-opendata-dems/','https://pgc-opendata-dems.s3.us-west-2.amazonaws.com/')
    filename.text='/vsicurl/'+url
    selected.append(url)
assert 1<=len(selected)<80
tree.write(SRC/'arcticdem32-selected.vrt',encoding='utf-8')
N=513; dem=np.full((N,N),-9999,dtype=np.float32)
with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',GDAL_HTTP_TIMEOUT='30',GDAL_HTTP_MAX_RETRY='1',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif',VSI_CACHE='TRUE'):
    with rasterio.open(SRC/'arcticdem32-selected.vrt') as src:
        reproject(rasterio.band(src,1),dem,src_transform=src.transform,src_crs=src.crs,src_nodata=-9999,dst_transform=from_bounds(*bounds,N,N),dst_crs='EPSG:4326',dst_nodata=-9999,resampling=Resampling.average,num_threads=2)
valid=dem!=-9999
assert valid.mean()>.4, 'regional DEM coverage insufficient'
np.save(OUT/'height-metres.npy',dem)
Image.fromarray(np.uint8(np.clip(np.where(valid,dem,0)/1800,0,1)*255)).save(OUT/'height-preview.png')
def pin(p): return {'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
metadata={'date':'2026-10-07','imagery':{'page':'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/','url':'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/july/world.topo.bathy.200407.3x21600x21600.C1.jpg','source':pin(SRC/'bmng-july-C1.jpg'),'source_size':im.size,'crop_pixels':box,'bounds':[0,45,45,75],'nominal_resolution_m':500,'output':pin(OUT/'bmng-region.jpg'),'note':'July 2004 monthly composite, baked topography shading; not current Sentinel imagery'},'dem':{'page':'https://www.pgc.umn.edu/data/arcticdem/','vrt_url':'https://pgc-opendata-dems.s3.us-west-2.amazonaws.com/arcticdem/mosaics/v4.1/32m_dem_tiles.vrt','vrt':pin(SRC/'arcticdem32.vrt'),'selected_vrt':pin(SRC/'arcticdem32-selected.vrt'),'native_resolution_m':32,'native_crs':'EPSG:3413','height_datum':'WGS84 ellipsoidal DSM, not geoid sea-level corrected','bounds':bounds,'output_size':[N,N],'resampling':'average to geographic grid; approx 455m east-west and 260m north-south at center; native32m detail intentionally reduced for orbit trial','valid_fraction':float(valid.mean()),'height_min_m':float(dem[valid].min()),'height_max_m':float(dem[valid].max()),'height_median_m':float(np.median(dem[valid])),'tiles_read_by_range':selected,'source_pin_limit':'VRT and extracted output hashes pinned; remote COG full-file bytes/hash not acquired','output':pin(OUT/'height-metres.npy'),'nodata':-9999},'use_stage':'internal concept D084; credit NASA BMNG and PGC ArcticDEM on exhibition transition'}
(OUT/'metadata.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'tiles':len(selected),'valid_fraction':float(valid.mean()),'height_max_m':float(dem[valid].max()),'output':str(OUT)},indent=2),flush=True)
