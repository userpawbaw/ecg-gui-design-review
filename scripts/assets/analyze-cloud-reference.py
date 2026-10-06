from pathlib import Path
import numpy as np,json,hashlib,math
r=Path(__file__).resolve().parents[2]
assets=r/'prototype/spikes/a-climb/assets/cloud-sculpt'
d=np.frombuffer((assets/'density.r8').read_bytes(),np.uint8).reshape(128,128,128).astype(float)/255
tau=np.frombuffer((assets/'light-depth.f16').read_bytes(),np.float16).reshape(128,128,128).astype(float)
idx=np.arange(4,128,8);z,y,x=np.meshgrid(idx,idx,idx,indexing='ij');X=x/127*2-1;Y=y/127*2-1;Z=z/127*2-1
sun=np.array([.70583314,.51757557,-.4836477]);sun/=np.linalg.norm(sun)
def sample(X,Y,Z):
    inside=(abs(X)<=1)&(abs(Y)<=1)&(abs(Z)<=1)
    xx=np.clip((X+1)*.5*127,0,127);yy=np.clip((Y+1)*.5*127,0,127);zz=np.clip((Z+1)*.5*127,0,127)
    i=xx.astype(int);j=yy.astype(int);k=zz.astype(int);fx=xx-i;fy=yy-j;fz=zz-k;result=np.zeros_like(xx)
    for dz in [0,1]:
      for dy in [0,1]:
       for dx in [0,1]:result+=d[np.minimum(k+dz,127),np.minimum(j+dy,127),np.minimum(i+dx,127)]*(fx if dx else 1-fx)*(fy if dy else 1-fy)*(fz if dz else 1-fz)
    return result*inside
full=np.zeros_like(X);short=np.zeros_like(X)
for j in range(80):
    dist=(j+.5)*.09;v=sample(X+sun[0]*dist/2,Y+sun[1]*dist,Z+sun[2]*dist/2)*.09*12
    full+=v
    if j<24:short+=v
mask=d[z,y,x]>.02;extra=(full-short)[mask]
s=lambda a,b,p:(lambda v:v*v*(3-2*v))(min(1,max(0,(p-a)/(b-a))))
result={'source_commit':'919a63d461b6f7a2ff20553745bc1d0143650606','source_hashes':{n:hashlib.sha256((r/n).read_bytes()).hexdigest() for n in ['scripts/assets/prepare-cloud-sculpt.py','prototype/spikes/a-climb/planet-cloud-sculpt.ts','prototype/spikes/a-climb/arrival.ts']},'handoff':[{'p':p,'far_weight':1-s(.01,.18,s(.24,.4,p)),'camera_height_km':math.exp(math.log(.16)+(math.log(.0012)-math.log(.16))*s(.23,.30,p))*6360} for p in [.26,.27,.28,.283,.29,.30]],'voxel_pitch_metres_approx':[31.25,15.625,31.25],'light_path_audit':{'positions':int(mask.sum()),'grid':'16^3 stratified voxel centres with density>0.02; final R8 density; same midpoint step .09km','short_path_km':2.16,'long_path_km':7.2,'extra_tau_max':float(extra.max()),'extra_tau_mean':float(extra.mean()),'fraction_extra_tau_above_point1':float((extra>.1).mean()),'mean_transmittance_change':float((np.exp(-short[mask])-np.exp(-full[mask])).mean()),'scope':'CPU density-only integration; isolates truncation, not browser radiance, GPU or rendered shadow quality; bake uses prequantized float field'} }
out=r/'verification/a-cloud-reference-20261006';out.mkdir(exist_ok=True)
(out/'source-audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
