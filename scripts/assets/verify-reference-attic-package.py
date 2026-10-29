"""Verify the exact staged package on public hosting; preserves normal TLS validation."""
import argparse,hashlib,json
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'verification/r1-reference-attic-clone-20261030'
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--release',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
expected=json.loads((OUT/'asset-boundary-result.json').read_text())['staged_files'];r={'base':a.base,'source_sha':a.release,'assets':[],'excluded':{},'tls':'Default system CA verification'}
for info in expected:
 url=a.base.rstrip('/')+'/'+info['path']+'?release='+a.release
 with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=90) as response:data=response.read();status=response.status
 observed=hashlib.sha256(data).hexdigest();assert status==200 and observed==info['sha256'],(info['path'],status,observed,info['sha256'])
 r['assets'].append({**info,'status':status});print('PASS',info['path'],flush=True)
for name in ['scene_v9.glb','TexProps.ktx2','index-djk_Apyr.js','README.md','clone/README.md','clone/kit-spec.json']:
 try:
  with urlopen(a.base.rstrip('/')+'/'+name+'?release='+a.release,timeout=30) as response:status=response.status
 except HTTPError as e:status=e.code
 assert status==404,(name,status);r['excluded'][name]=status
r['result']='PASS';a.output.write_text(json.dumps(r,indent=2)+'\n');print('PUBLIC PACKAGE PASS',len(r['assets']),flush=True)
