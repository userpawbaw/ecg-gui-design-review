"""Audit deployed M04 vs M_FE, then reproduce only the SWT/FE path from pinned source."""
from pathlib import Path
import json,hashlib,sys,os,dataclasses,base64
import numpy as np
root=Path(__file__).resolve().parents[1];source=root.parent/'inference-source';sys.path[:0]=[str(source),str(source/'scripts')];os.chdir(source)
from ecgdn.methods.wavelet import SWTDenoiser,_pad_to_multiple,threshold
from ecgdn.methods.frontend import FrontEnd
from ecgdn.config import SWTCfg
from ecgdn.data.sources import MITDBSource,SyntheticSource
from ecgdn.data.noise import make_noise,mixed_noise
from ecgdn.data.mixer import mix_at_snr
from ecgdn.utils import rng
from ecgdn.eval.signal_metrics import metrics_signal
bank=json.loads((root/'prototype/v2/public/replay/manifest.json').read_text(encoding='utf-8'));rows=[];reproductions=[];diagnostics=[];chunks_verified=0
def arrays(scene,ids):
 global chunks_verified
 result={k:[]for k in ids}
 for c in scene['chunks']:
  b=(root/'prototype/v2/public/replay'/c['path']).read_bytes();assert hashlib.sha256(b).hexdigest()==c['sha256'];chunks_verified+=1
  a=np.frombuffer(b,dtype='<i2').reshape(len(scene['channels']),c['n'])
  for k in ids:result[k].append(a[scene['channels'].index(k)])
 return {k:np.concatenate(v).astype(float)*scene['scale']for k,v in result.items()}
for s in bank['scenes']:
 a=arrays(s,['M04','M_FE']);diff=a['M04']-a['M_FE'];m=s['sessionMetrics']
 rows.append(dict(id=s['id'],axis=s['axis'],noise=s['cond'],snr=s['snr'],differenceRmsMv=float(np.sqrt(np.mean(diff**2))),differenceMaxMv=float(np.max(np.abs(diff))),identicalSamplesFraction=float(np.mean(diff==0)),snrGainOverFeDb=m['M04']['strict']-m['M_FE']['strict']))
for axis in ['d0','d1']:
 src=MITDBSource(root=source/'data/raw/mitdb') if axis=='d1' else SyntheticSource(dur_s=610)
 record='111'if axis=='d1'else src.records('test')[0];raw=src.get(record).x[:152500];cfg=SWTCfg(**json.loads((source/f'results/{axis}/tune_swt/best.json').read_text(encoding='utf-8')));model=SWTDenoiser(cfg);reference=FrontEnd()(raw,250)
 for noise in ['mixed','impulse','pli','bw_synth','ma_synth','em_synth','awgn']:
  scene=next(s for s in bank['scenes']if s['axis']==axis and s['cond']==noise and s['snr']==-5);gen=rng('expo-long-v2',axis,record,noise)
  n=mixed_noise(len(raw),250,gen)[0]if noise=='mixed'else make_noise(noise,len(raw),250,gen)
  y=mix_at_snr(raw,n,-5.)[0];assert hashlib.sha256(y.astype('<f8').tobytes()).hexdigest()==scene['metadata']['inputSha256']
  fe=FrontEnd()(y,250);output=model(y,250);saved=arrays(scene,['M04','M_FE']);errors={}
  for id,x in [('M04',output),('M_FE',fe)]:
   error=float(np.max(np.abs(x[1250:-1250]-saved[id])));assert error<=scene['scale']*.501,(scene['id'],id,error,scene['scale']);errors[id]=error
  reproductions.append(dict(id=scene['id'],maxErrorMv=errors,halfQuantizationStep=scene['scale']/2))
  xp,pl,pr=_pad_to_multiple(fe,32);coeffs=model._decompose(xp);bands=[]
  for j,d in enumerate(coeffs[1:],1):
   sigma=model._sigma(coeffs,j);lam=model._levels_k()[j-1]*sigma*np.sqrt(2*np.log(len(d)));t=threshold(d,lam,cfg.mode)
   bands.append(dict(band='D'+str(6-j),sigma=float(sigma),lambdaUnprotected=float(lam),coefficientRms=float(np.sqrt(np.mean(d*d))),belowThresholdFraction=float(np.mean(np.abs(d)<=lam)),removedEnergyFraction=float(np.sum((d-t)**2)/np.sum(d*d))))
  item=dict(axis=axis,noise=noise,snr=-5,config=dataclasses.asdict(cfg),bands=bands,notes='For protected D0, band thresholds shown before QRS protection; actual output above uses protection.')
  if axis=='d1':
   alt=SWTDenoiser(dataclasses.replace(cfg,sigma_source='d2'))(y,250);actual=metrics_signal(reference[1250:-1250],y[1250:-1250],output[1250:-1250]);alternative=metrics_signal(reference[1250:-1250],y[1250:-1250],alt[1250:-1250]);item['d2OnlyDiagnostic']={'currentStrict':actual['snr_out_strict'],'d2Strict':alternative['snr_out_strict'],'differenceDb':alternative['snr_out_strict']-actual['snr_out_strict'],'adopted':False}
  diagnostics.append(item)
# Direct hard-threshold and zero-threshold reconstruction control, independent of stored output.
assert np.array_equal(threshold(np.array([-.5,-.1,.0,.1,.5]),.2,'hard'),np.array([-.5,0,0,0,.5]))
zero=SWTDenoiser(dataclasses.replace(cfg,k=(0.,)*5))(y,250);zero_error=float(np.max(np.abs(zero-fe)));assert zero_error<1e-8
report=dict(sourceCommit=bank['provenance']['sourceCommit'],scenes=rows,reproductions=reproductions,diagnostics=diagnostics,chunksVerified=chunks_verified,allScenesIdentical=sum(x['identicalSamplesFraction']==1 for x in rows),hardThresholdControl='PASS',zeroThresholdMaxError=zero_error,productionConfigurationChanged=False)
archive=json.loads((root/'prototype/v2/public/archive.json').read_text(encoding='utf-8'));archive_rows=[]
for scene in archive['scenes']:
 a={id:np.frombuffer(base64.b64decode(scene['traces'][id]),dtype='<i2').astype(float)*scene['scale']for id in ['M04','M_FE']};diff=a['M04']-a['M_FE']
 archive_rows.append(dict(id=scene['id'],differenceRmsMv=float(np.sqrt(np.mean(diff**2))),identicalSamplesFraction=float(np.mean(diff==0))))
report['archive10s']={'scenes':archive_rows,'allScenesIdentical':sum(x['identicalSamplesFraction']==1 for x in archive_rows),'sourceReproduced':False}
(root/'verification/swt-replay-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for axis in ['d0','d1']:
 print(axis)
 for noise in ['mixed','impulse','pli','bw_synth','ma_synth','em_synth','awgn']:
  row=next(x for x in rows if x['axis']==axis and x['noise']==noise and x['snr']==-5)
  print(noise,'RMS uV',round(row['differenceRmsMv']*1000,4),'gain dB',round(row['snrGainOverFeDb'],4))
print('exact-identical scenes',report['allScenesIdentical'],'reproductions',len(reproductions),'zero-control-error',zero_error)
for d in diagnostics:
 if d['axis']=='d1':print('D1',d['noise'],'sigma',d['bands'][0]['sigma'],'D2 diagnostic',d['d2OnlyDiagnostic'])
