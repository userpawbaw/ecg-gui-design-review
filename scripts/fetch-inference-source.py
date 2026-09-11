"""Fetch only pinned research source/assets needed for the 600s replay build."""
import argparse, concurrent.futures, hashlib, json, pathlib, urllib.request
SHA='5eb27946087faca3c6e70b3925e2ba132b2ee680'
REPO='userpawbaw/ECG_denoising_method_comparision'
p=argparse.ArgumentParser();p.add_argument('--tree',required=True);p.add_argument('--out',required=True);a=p.parse_args()
tree=json.loads(pathlib.Path(a.tree).read_text())
assert tree['sha']=='8292544f1813e753536a427daf4a6dfc44984552' and not tree.get('truncated')
root=pathlib.Path(a.out)
def needed(path):
 return path.startswith('ecgdn/') or path in ['scripts/run_exp.py','scripts/_bootstrap.py','scripts/build_demo_bank.py','requirements.txt'] or path.startswith('configs/') or path.startswith('data/raw/mitdb/111.') or any(path.startswith(f'results/{axis}/{model}/') and path.endswith(('best.pt','config.yaml')) for axis in ['d0','d1'] for model in ['m06_l1','m06_l6','m08_l1','m09_l1','m07_l1','m10_l1']) or path in ['results/d0/tune_swt/best.json','results/d1/tune_swt/best.json']
def fetch(e):
 path=root/e['path'];path.parent.mkdir(parents=True,exist_ok=True)
 def valid(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()==e['sha']
 if path.exists() and valid(path.read_bytes()):return e['path']
 with urllib.request.urlopen(f'https://raw.githubusercontent.com/{REPO}/{SHA}/{e["path"]}',timeout=90) as r:b=r.read()
 if not valid(b):raise ValueError('Git blob mismatch: '+e['path'])
 tmp=path.with_suffix(path.suffix+'.part');tmp.write_bytes(b);tmp.replace(path);return e['path']
entries=[e for e in tree['tree'] if e['type']=='blob' and needed(e['path'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:done=list(pool.map(fetch,entries))
(root/'source-receipt.json').write_text(json.dumps({'sourceCommit':SHA,'files':entries},indent=2))
print(json.dumps({'verifiedFiles':len(done),'sourceCommit':SHA,'output':str(root)}))
