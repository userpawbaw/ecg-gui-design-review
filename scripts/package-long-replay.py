"""Validate 600s outputs and package lossless 30s channel-major chunks."""
from pathlib import Path
import json,base64,hashlib,argparse
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--allow-partial',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parents[1];source=root/'prototype/v2/public/long';target=root/'prototype/v2/public/replay';target.mkdir(exist_ok=True)
sha='5eb27946087faca3c6e70b3925e2ba132b2ee680';scenes=[];metrics_count=0;max_error=0;files=[]
def write(p,b):
 p.parent.mkdir(exist_ok=True,parents=True);temp=p.with_suffix(p.suffix+'.part');temp.write_bytes(b);temp.replace(p)
def metrics(ref,out,inp):
 r=ref-ref.mean();o=out-out.mean();i=inp-inp.mean();rr=np.mean(r*r);oo=np.mean(o*o);alpha=np.mean(r*o)/oo
 sn=lambda e:float(10*np.log10(rr/np.mean(e*e)))
 return dict(strict=sn(r-o),scaled=sn(r-alpha*o),input=sn(r-i),alpha=float(alpha),cc=float(np.mean(r*o)/np.sqrt(rr*oo)),rmse=float(np.sqrt(np.mean((r-o)**2))),n=len(r))
for axis in ['d0','d1']:
 raw_hash=None;clean_previous=None
 for noise in ['mixed','impulse','pli','bw_synth','ma_synth','em_synth','awgn']:
  for snr in [-5,0,5,10,15,20,25]:
   sid=f'{axis}-{noise}-{snr}';file=source/(sid+'.json')
   if not file.exists():
    assert a.allow_partial,f'Missing {sid}'
    continue
   j=json.loads(file.read_text());meta=j['metadata'];assert j['id']==sid and meta['sourceCommit']==sha and meta['durationSeconds']==600
   assert len(j['traces'])==13 and j['scale']>0
   if raw_hash:assert raw_hash==meta['rawSha256'],'base ECG changed across conditions'
   raw_hash=meta['rawSha256'];ids=list(j['traces']);binary={k:base64.b64decode(v,validate=True)for k,v in j['traces'].items()};assert all(len(v)==300000 for v in binary.values())
   arrays={k:np.frombuffer(v,dtype='<i2').astype(float)*j['scale'] for k,v in binary.items()};assert all(np.isfinite(v).all()for v in arrays.values())
   if clean_previous is not None:assert np.max(np.abs(arrays['clean']-clean_previous[0]))<=(j['scale']+clean_previous[1])*.501
   clean_previous=(arrays['clean'],j['scale']);summary={}
   for k in ids:
    if k=='clean':continue
    m=metrics(arrays['clean'],arrays[k],arrays['input']);summary['M00' if k=='input' else k]=m
    if k in j['storedMetrics']:
     original=j['storedMetrics'][k]
     for ours,theirs,tolerance in [('strict','snr_out_strict',.05),('scaled','snr_out_scaled',.05),('input','snr_in',.05),('cc','cc',.001),('rmse','rmse',.001),('alpha','gain_bias',.01)]:
      error=abs(m[ours]-original[theirs]);assert error<=tolerance,(sid,k,ours,error);max_error=max(max_error,error)
     metrics_count+=1
   chunks=[]
   for index in range(20):
    start=index*7500;count=7500;buf=b''.join(binary[k][start*2:(start+count)*2]for k in ids);rel=f'{sid}/{index:02}.bin';digest=hashlib.sha256(buf).hexdigest();write(target/rel,buf)
    for c,k in enumerate(ids):assert buf[c*count*2:(c+1)*count*2]==binary[k][start*2:(start+count)*2]
    chunks.append(dict(path=rel,start=start,n=count,bytes=len(buf),sha256=digest))
   scenes.append({**{k:j[k]for k in ['id','axis','cond','snr','record','scale']},'traces':{},'channels':ids,'chunks':chunks,'metadata':meta,'sessionMetrics':summary})
   files.append(dict(scene=sid,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
assert a.allow_partial or len(scenes)==98
archive=json.loads((root/'prototype/v2/public/archive.json').read_text())
manifest=dict(schema=3,fs=250,n=150000,long=True,chunkSamples=7500,scenes=scenes,provenance={'sourceCommit':sha,'mode':'GENERATED REPLAY','reference':'FE(x_raw)','noise':'synthetic presets, not NSTDB recordings','retrained':False,'continuousSeconds':600,'quantization':'shared int16 scale; metrics verified against float source'},evidence=archive['evidence'])
write(target/'manifest.json',json.dumps(manifest,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode())
report=dict(sceneCount=len(scenes),durationSeconds=600,samples=150000,traceArrays=len(scenes)*13,verifiedMethodMetrics=metrics_count,chunks=len(scenes)*20,chunkReassembly='byte-identical',metricTolerances={'snrDb':.05,'cc':.001,'rmseMv':.001,'alpha':.01},maxMixedUnitMetricDifference=max_error,sourceCommit=sha,files=files,complete=len(scenes)==98)
write(root/'verification/v2-long-data.json',json.dumps(report,indent=2).encode());print(json.dumps({k:v for k,v in report.items()if k!='files'},indent=2))
