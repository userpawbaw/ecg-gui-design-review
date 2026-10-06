"""Summarize saved native captures; no browser control, no GPU inference."""
import hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
evidence=root/'verification/a-cloud-sculpt-20261006'
captures=evidence/'native-captures/sculpt-native-final'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def compare(a,b):
    x=np.asarray(Image.open(captures/(a+'.png')).convert('RGB'),dtype=np.int16)
    y=np.asarray(Image.open(captures/(b+'.png')).convert('RGB'),dtype=np.int16)
    d=np.abs(x-y)
    return {'meanRGB':float(d.mean()),'maxRGB':int(d.max()),'pixelsOver2':float((d.max(axis=2)>2).mean()),'scope':'same software renderer, fixed frame 12/grain off; no physical correctness claim'}
meta={p.stem:json.loads(p.read_text(encoding='utf-8')) for p in captures.glob('*.json')}
metrics={'captureCount':len(meta),'ready':all(m['state']['ready'] for m in meta.values()),'renderers':list(set(m['renderer'] for m in meta.values())), 'archive':compare('archive','archive-baseline'), 'effects':{key:compare('near-295',key) for key in ['shadow-off','thin-off','bloom-off']},'r883':{key:meta['heart-r883']['state'][key] for key in ['sample','rAbs','beatAge','heartScale','sharedClock']},'gpu':'UNVERIFIED; native renderer software; no comparable GPU timing','sources':{str(p.relative_to(root)):sha(p) for p in [root/'prototype/spikes/a-climb'/name for name in ['planet-cloud-sculpt.ts','arrival.ts','main.ts','vite.config.mjs']]+[root/'scripts/assets'/name for name in ['prepare-cloud-sculpt.py','render-cloud-sculpt.py']]}}
(evidence/'metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf-8')
checkpoint=json.loads((evidence/'checkpoint.json').read_text(encoding='utf-8-sig'))
checkpoint['stage']='candidate implemented; native software static-frame QA verified; fidelity FAIL/TUNE; GPU and motion QA pending'
checkpoint['environment']['browser']='CLI minimal WebGL fails; native IAB renders using Microsoft Basic Render Driver software'
checkpoint['final_runtime']='native-captures/sculpt-native-final + metrics.json; 3D canvas PNG only, DOM waveform excluded'
checkpoint['sources']=metrics['sources']
checkpoint['quality']='billows/under-shadow more readable; cotton detail and mockup lighting FAIL; not adopted as default'
(evidence/'checkpoint.json').write_text(json.dumps(checkpoint,indent=2),encoding='utf-8')
assets=root/'prototype/spikes/a-climb/assets/cloud-sculpt'
manifest=json.loads((assets/'manifest.json').read_text(encoding='utf-8'))
manifest['sources']={name:sha(root/'scripts/assets'/name) for name in ['prepare-cloud-sculpt.py','render-cloud-sculpt.py']}
(assets/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
registryPath=root/'assets/registry.json'
registry=json.loads(registryPath.read_text(encoding='utf-8'))
def refresh(node):
    if isinstance(node,dict):
        if str(node.get('id','')).startswith('cloud-sculpt'):
            node['review']='D-075 native software static QA; fidelity FAIL/TUNE; GPU/motion verification pending; experimental only'
        for value in node.values():refresh(value)
    elif isinstance(node,list):
        for value in node:refresh(value)
refresh(registry)
registryPath.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=root.parents[1]/'outputs/A_cloud_sculpt_review';out.mkdir(parents=True,exist_ok=True)
shots=['wide','orbit','approach','near-295','side','entry','cut','fade-middle','window','archive','heart-r883','shadow-off']
board=Image.new('RGB',(1200,1080),'#101722');draw=ImageDraw.Draw(board)
for i,name in enumerate(shots):
    x=(i%3)*400;y=(i//3)*270
    img=Image.open(captures/(name+'.png')).convert('RGB');img.thumbnail((400,225))
    board.paste(img,(x,y+25));draw.text((x+8,y+7),name,fill='white')
board.save(out/'native-runtime-twelve.jpg',quality=91)
print(json.dumps(metrics,indent=2))
