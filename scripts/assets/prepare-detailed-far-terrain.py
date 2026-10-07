"""Coarser surrounding DEM keeps the local hero patch connected to a real landscape."""
from pathlib import Path
import sys,json,xml.etree.ElementTree as ET,hashlib
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'.tools/geodeps'))
import numpy as np,rasterio
from rasterio.warp import transform_bounds,reproject,Resampling
from rasterio.transform import from_bounds
P=R/'assets/processed/a-terrain-detailed-20261007'; S=R/'assets/source/a-terrain-detailed-20261007'
meta=json.loads((P/'metadata.json').read_text());bounds=meta['maps'][0]['bounds']
tree=ET.parse(R/'assets/source/a-norway-region-20261007/arcticdem32.vrt');root=tree.getroot();band=root.find('VRTRasterBand');gt=[float(x) for x in root.find('GeoTransform').text.split(',')]
b=transform_bounds('EPSG:4326','EPSG:3413',*bounds,densify_pts=32);x0,x1=(b[0]-gt[0])/32,(b[2]-gt[0])/32;y0,y1=(gt[3]-b[3])/32,(gt[3]-b[1])/32;urls=[]
for el in list(band.findall('ComplexSource')):
    rc=el.find('DstRect');x,y,w,h=[float(rc.get(k)) for k in ['xOff','yOff','xSize','ySize']]
    if x+w<x0 or x>x1 or y+h<y0 or y>y1:band.remove(el);continue
    node=el.find('SourceFilename');url=node.text.replace('/vsis3/pgc-opendata-dems/','https://pgc-opendata-dems.s3.us-west-2.amazonaws.com/');node.text='/vsicurl/'+url;urls.append(url)
tree.write(S/'far-dem.vrt',encoding='utf-8'); dem=np.full((513,513),-9999,np.float32)
with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',GDAL_HTTP_TIMEOUT='30',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
    with rasterio.open(S/'far-dem.vrt') as src:reproject(rasterio.band(src,1),dem,src_transform=src.transform,src_crs=src.crs,src_nodata=-9999,dst_transform=from_bounds(*bounds,513,513),dst_crs='EPSG:4326',dst_nodata=-9999,resampling=Resampling.average)
valid=dem!=-9999;assert valid.mean()>.9
np.save(P/'far-height.npy',dem)
meta['far_dem']={'bounds':bounds,'size':[513,513],'resampling':'average, coarse surrounding terrain only','source_urls':urls,'valid_fraction':float(valid.mean()),'file':'far-height.npy','sha256':hashlib.sha256((P/'far-height.npy').read_bytes()).hexdigest()}
(P/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n');print('FAR TERRAIN READY',len(urls),float(valid.mean()),flush=True)
