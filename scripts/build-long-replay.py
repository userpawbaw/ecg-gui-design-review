"""Generate real 600s method outputs from the pinned research implementation. No training.

Run with source dependencies installed, --source pointing to fetch-inference-source.py output.
Outputs are resumable per condition and contain the same input for every method.
"""
import argparse,base64,hashlib,json,os,pathlib,sys,time,platform
p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--out',required=True);p.add_argument('--axis',choices=['d0','d1'],required=True);p.add_argument('--limit',type=int,default=0);a=p.parse_args()
root=pathlib.Path(a.source).resolve();out=pathlib.Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True);os.chdir(root);sys.path[:0]=[str(root),str(root/'scripts')]
import numpy as np
import torch
torch.set_num_threads(4)
from ecgdn.data.sources import SyntheticSource,MITDBSource
from ecgdn.data.noise import mixed_noise,make_noise
from ecgdn.data.mixer import mix_at_snr
from ecgdn.methods.frontend import FrontEnd
from ecgdn.eval.signal_metrics import metrics_signal
from ecgdn.utils import rng,derive_seed
from run_exp import build_methods
SHA='5eb27946087faca3c6e70b3925e2ba132b2ee680';fs=250;n=150000;guard=1250;total=n+guard*2
axis=a.axis;source=MITDBSource(root=root/'data/raw/mitdb') if axis=='d1' else SyntheticSource(dur_s=610)
record='111' if axis=='d1' else source.records('test')[0]
rec=source.get(record);raw=rec.x[:total].copy();assert len(raw)==total
reference=FrontEnd()(raw,fs)
cfg={'methods':['M_FE','M01','M02','M03','M04','M05','B01'],'frontend':True,'dl_methods':{mid:{'ckpt':f'results/{axis}/{folder}/best.pt','batch':64} for mid,folder in [('M06','m06_l1'),('M06L6','m06_l6'),('M08','m08_l1'),('M09','m09_l1')]}}
models=build_methods(cfg,axis);assert len(models)==11,models.keys()
checkpoint={mid:{'path':s['ckpt'],'sha256':hashlib.sha256(pathlib.Path(s['ckpt']).read_bytes()).hexdigest(),'data_win':getattr(models[mid],'win',None),'data_hop':getattr(models[mid],'hop',None),'frontend':getattr(models[mid],'frontend',None)} for mid,s in cfg['dl_methods'].items()}
expected=['mixed','impulse','pli','bw_synth','ma_synth','em_synth','awgn'];snrs=[-5,0,5,10,15,20,25];entries=[];start=time.time();count=0
def cleanjson(x):
 if isinstance(x,dict):return {k:cleanjson(v) for k,v in x.items()}
 if isinstance(x,(list,tuple)):return [cleanjson(v) for v in x]
 if isinstance(x,(np.floating,float)):return float(x) if np.isfinite(x) else None
 if isinstance(x,np.integer):return int(x)
 return x
def atomic(path,data):
 tmp=path.with_suffix(path.suffix+'.part');tmp.write_text(json.dumps(cleanjson(data),ensure_ascii=False,separators=(',',':')),encoding='utf-8');tmp.replace(path)
for cond in expected:
 seed=['expo-long-v2',axis,record,cond];gen=rng(*seed)
 if cond=='mixed':noise,weights=mixed_noise(total,fs,gen)
 else:noise=make_noise(cond,total,fs,gen);weights={cond:1.0}
 for snr in snrs:
  sid=f'{axis}-{cond}-{snr}';path=out/(sid+'.json')
  if path.exists():
   saved=json.loads(path.read_text());assert saved['metadata']['sourceCommit']==SHA and len(saved['traces'])==13
   entries.append({k:saved[k] for k in ['id','axis','cond','snr','record','scale']});continue
  begin=time.time();y,_,_=mix_at_snr(raw,noise,float(snr));traces={'clean':reference[guard:-guard],'input':y[guard:-guard]};metrics={};runtime={}
  for mid,model in models.items():
   tick=time.time();result=model(y.copy(),fs,ctx={'x_clean':reference} if mid=='B01' else None)
   result=result[guard:-guard];assert result.size==n and np.isfinite(result).all(),mid
   traces[mid]=result;metrics[mid]=metrics_signal(traces['clean'],traces['input'],result);runtime[mid]=time.time()-tick
  scale=max(float(np.max(np.abs(v))) for v in traces.values())/32760
  encoded={k:base64.b64encode(np.round(v/scale).astype('<i2').tobytes()).decode('ascii') for k,v in traces.items()}
  assert all(len(base64.b64decode(s))==n*2 for s in encoded.values())
  meta={'sourceCommit':SHA,'record':record,'split':'test','lead':'MLII' if axis=='d1' else 'synthetic','sourceStartSeconds':5,'sourceStartSample':1800 if axis=='d1' else guard,'sourceFs':360 if axis=='d1' else fs,'processedStartSample':guard,'durationSeconds':600,'guardSecondsEachSide':5,'noiseKind':'synthetic','noiseSeedParts':seed,'noiseSeed':derive_seed(*seed),'noiseWeights':weights,'snrNormalization':'whole 610s raw input before FE, guards excluded for displayed metrics','reference':'FE(x_raw)','checkpoints':checkpoint,'methodConfig':cfg,'swtTuning':json.loads((root/f'results/{axis}/tune_swt/best.json').read_text()),'methodSeconds':runtime,'torch':torch.__version__,'numpy':np.__version__,'python':platform.python_version(),'rawSha256':hashlib.sha256(raw.astype('<f8').tobytes()).hexdigest(),'inputSha256':hashlib.sha256(y.astype('<f8').tobytes()).hexdigest(),'annotationsShown':False}
  payload={'id':sid,'axis':axis,'cond':cond,'snr':snr,'record':record,'scale':scale,'traces':encoded,'metadata':meta,'storedMetrics':metrics}
  atomic(path,payload);entries.append({k:payload[k] for k in ['id','axis','cond','snr','record','scale']});count+=1
  print(json.dumps({'scene':sid,'seconds':round(time.time()-begin,2),'completed':len(entries),'elapsed':round(time.time()-start,1)}),flush=True)
  atomic(out/f'{axis}-progress.json',{'sourceCommit':SHA,'scenes':entries,'elapsedSeconds':time.time()-start})
  if a.limit and count>=a.limit:break
 if a.limit and count>=a.limit:break
atomic(out/f'{axis}-progress.json',{'sourceCommit':SHA,'scenes':entries,'elapsedSeconds':time.time()-start,'complete':len(entries)==49})
