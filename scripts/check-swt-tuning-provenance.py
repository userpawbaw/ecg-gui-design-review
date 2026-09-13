"""Read-only provenance diagnostic. Loader stub checks record selection, not ECG accuracy."""
from pathlib import Path
import sys,json,hashlib,os,dataclasses,importlib.util,ast
from types import SimpleNamespace
root=Path(__file__).resolve().parents[1];workspace=root.parent;source=workspace/'swt-version-source';runtime=workspace/'inference-source'
sys.path[:0]=[str(runtime),str(runtime/'scripts')]
import numpy as np
import ecgdn.data.sources as sources
import ecgdn.data.mitdb as mitdb
import run_exp
# Only execute the pinned local selector after proving it matches the latest inspected selector.
expected=(source/'ecgdn/data/sources.py').read_text(encoding='utf-8')
actual=Path(sources.__file__).read_text(encoding='utf-8')
def function_ast(text,name):
 return ast.dump(next(n for n in ast.parse(text).body if isinstance(n,ast.FunctionDef)and n.name==name),include_attributes=False)
assert function_ast(expected,'real_clean_segments')==function_ast(actual,'real_clean_segments')
latest_tune=(source/'scripts/tune_swt.py').read_text(encoding='utf-8')
historical=json.loads((source/'historical-selection.json').read_text(encoding='utf-8'))
assert function_ast(historical['sources'],'real_clean_segments')==function_ast(expected,'real_clean_segments')
assert function_ast(historical['tune'],'build_cases')==function_ast(latest_tune,'build_cases')
spec=importlib.util.spec_from_file_location('audited_tune',source/'scripts/tune_swt.py');tune=importlib.util.module_from_spec(spec);spec.loader.exec_module(tune)
loaded=[];original=mitdb.load_record
# The real selector/filter/noise generator run; only file IO uses a deterministic stand-in.
def fake_record(name,root,fs_out):
 loaded.append(name);fs=float(fs_out);n=int(90*fs);t=np.arange(n)/fs
 return SimpleNamespace(x=(1+int(name)/1000)*np.sin(2*np.pi*t)+.1*np.cos(7*t),fs=fs,r_peaks=np.arange(250,n,250),symbols=['N']*len(np.arange(250,n,250)))
mitdb.load_record=fake_record
try:
 a=tune.build_cases([0,1,2,3],[5,10,15],90,source='mitdb');first=list(loaded);loaded.clear()
 b=tune.build_cases([4,5,6,7],[5,10,15],90,source='mitdb');second=list(loaded)
finally:mitdb.load_record=original
assert first==second and len(set(first))==4
assert all(np.array_equal(x[0].x_raw,y[0].x_raw)for x,y in zip(a,b))
assert not np.array_equal(a[0][1],b[0][1])
# Factory route unchanged for the relevant functions despite unrelated runner updates.
old_runner=Path(run_exp.__file__).read_text(encoding='utf-8');new_runner=(source/'scripts/run_exp.py').read_text(encoding='utf-8')
for name in ['load_swt_tuning','_build_with_fe']:
 assert function_ast(old_runner,name)==function_ast(new_runner,name),name
os.chdir(runtime);configs={}
for axis in ['d0','d1']:
 methods=run_exp.build_methods({'methods':['M03','M04'],'frontend':True},axis)
 configs[axis]={k:json.loads(json.dumps(dataclasses.asdict(v.cfg)))for k,v in methods.items()}
 assert configs[axis]['M04']==json.loads((source/f'results/{axis}/tune_swt/best.json').read_text(encoding='utf-8'))
bank=json.loads((root/'prototype/v2/public/replay/manifest.json').read_text(encoding='utf-8'))
for s in bank['scenes']:assert s['metadata']['swtTuning']==configs[s['axis']]['M04']
comparisons=[]
for s in bank['scenes']:
 m=s['sessionMetrics'];comparisons.append({'id':s['id'],'axis':s['axis'],'noise':s['cond'],'snr':s['snr'],'swtMinusDwtStrictDb':m['M04']['strict']-m['M03']['strict'],'swtMinusDwtScaledDb':m['M04']['scaled']-m['M03']['scaled']})
report={'selectionDiagnostic':{'loader':'deterministic stand-in, not real ECG','latestAndManifestVersionSelectionASTIdentical':True,'tuneRecords':first,'holdoutRecords':second,'recordOverlap':len(set(first)&set(second)),'casesPerSet':len(a),'cleanSegmentsEqual':True,'noiseRealizationsDiffer':True,'independentPatientHoldout':False,'testSplitUsedForTuning':False},'activeConfigs':configs,'all98GuiTuningMetadataMatch':True,'gui600sComparisons':comparisons,'productionChanged':False}
(root/'verification/swt-tuning-version-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report['selectionDiagnostic'],indent=2));print(json.dumps(configs,indent=2))
for axis in ['d0','d1']:
 rows=[x for x in comparisons if x['axis']==axis];print(axis,'SWT lower strict',sum(x['swtMinusDwtStrictDb']<0 for x in rows),'of',len(rows))
