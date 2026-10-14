"""D137: derive a bounded lighting residual, not measured cloud density/normal."""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json,hashlib
r=Path(__file__).resolve().parents[2];src=r/'verification/a-disney-atlas-20261012/native/atlas-e45-ev1.png';out=r/'prototype/spikes/a-climb/assets/disney-detail';out.mkdir(exist_ok=True)
a=np.asarray(Image.open(src).convert('RGBA'),dtype=np.float32)/255;rgb=np.where(a[:,:,:3]<=.04045,a[:,:,:3]/12.92,((a[:,:,:3]+.055)/1.055)**2.4);y=rgb@np.array([.2126,.7152,.0722]);valid=Image.fromarray(np.uint8(a[:,:,3]>.98)*255).filter(ImageFilter.MinFilter(17));bounds=valid.getbbox();assert bounds
x0,y0,x1,y1=bounds;box=(max(0,x0-20),max(0,y0-20),min(a.shape[1],x1+20),min(a.shape[0],y1+20));lum=Image.fromarray(y.astype(np.float32)).crop(box).resize((512,512),Image.Resampling.BILINEAR)
def blur(v,sigma):
 n=int(sigma*3);x=np.arange(-n,n+1);k=np.exp(-x*x/(2*sigma*sigma));k/=k.sum();w=np.pad(v,((0,0),(n,n)),mode='edge');w=np.apply_along_axis(lambda z:np.convolve(z,k,'valid'),1,w);w=np.pad(w,((n,n),(0,0)),mode='edge');return np.apply_along_axis(lambda z:np.convolve(z,k,'valid'),0,w)
v=np.asarray(lum);mask=np.asarray(valid.crop(box).resize((512,512),Image.Resampling.BILINEAR),dtype=np.float32)/255;res=(blur(v,3)-blur(v,16))*mask;q=float(np.quantile(abs(res[mask>.99]),.95));assert q>0;data=np.round(128+np.clip(res/q,-1,1)*100).astype(np.uint8);data[mask<.01]=128;(out/'detail.r8').write_bytes(data.tobytes())
m={'source':src.relative_to(r).as_posix(),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'file':'detail.r8','sha256':hashlib.sha256(data.tobytes()).hexdigest(),'size':[512,512],'cropPixels':box,'linearLuminance':True,'gaussianSigmaPixels':[3,16],'alphaThreshold':.98,'alphaErosionKernel':17,'quantile95':q,'neutralEncoded':128,'scaleEncoded':100,'interpretation':'bounded baked-light luminance bandpass; not physical density/normal','nominalR8MipmapMiB':1/3,'license':'Disney2017 CC BY-SA3.0 / Kevin Udy reference'};(out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Prepared R8',m['sha256'])
