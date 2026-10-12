"""Validate downloaded Disney ZIP and extract only trial resolutions/documents.
Download command writes wdas_cloud.zip.part; source binaries and supplied images remain local.
"""
from pathlib import Path
import hashlib,json,zipfile,time
r=Path(__file__).resolve().parents[2];src=r/'assets/source/disney-cloud';out=r/'verification/a-disney-cloud-20261012';out.mkdir(parents=True,exist_ok=True)
part=src/'wdas_cloud.zip.part';archive=src/'wdas_cloud.zip'
if part.exists():
 assert part.stat().st_size==2968485941,'Incomplete download: retain .part for resume'
 with zipfile.ZipFile(part) as z:assert len(z.infolist())==12
 part.rename(archive)
start=time.time();h=hashlib.sha256()
with archive.open('rb') as f:
 for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
rows=[]
with zipfile.ZipFile(archive) as z:
 for f in z.infolist():
  if f.is_dir() or f.filename.endswith('/wdas_cloud.vdb'):continue
  # ZIP streaming extraction checks each extracted entry CRC; original full VDB stays packed.
  dest=src/'unpacked'/f.filename;dest.parent.mkdir(parents=True,exist_ok=True)
  with z.open(f) as inp,dest.open('wb') as output:
   for chunk in iter(lambda:inp.read(8*1024*1024),b''):output.write(chunk)
  rows.append({'file':dest.relative_to(r).as_posix(),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'zipCrcChecked':True})
  print('EXTRACTED',f.filename,flush=True)
m={'producer':'Walt Disney Animation Studios','date':'2026-10-12','sourcePage':'https://www.disneyanimation.com/resources/clouds/','downloadUrl':'https://assets.disneyanimation.com/wdas_cloud.zip','archive':{'localPath':archive.relative_to(r).as_posix(),'bytes':archive.stat().st_size,'sha256':h.hexdigest()},'license':'Copyright2017 Disney Enterprises Inc / CC BY-SA3.0; source photo Kevin Udy also CC BY-SA3.0','useStage':'internal concept review; release replacement/rights review separate','files':rows,'fullVdb':'present in ZIP; not extracted or loaded in this trial','secondsHashAndExtract':time.time()-start,'uploadScope':'code/own rendered samples/review records only; ZIP/VDB and supplied reference beauty images local-only'}
(out/'acquisition.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
