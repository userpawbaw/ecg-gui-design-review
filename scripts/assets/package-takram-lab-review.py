"""Package actual renderer captures and explicit evidence limits; no image transforms. Documentation is maintained separately."""
import json, hashlib, html
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = root / 'verification/a-takram-lab-20261008'
out.mkdir(exist_ok=True)
captures = root / 'verification/a-cloud-sculpt-20261006/native-captures/takram-lab'
report = 'docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_cloud_reproduction_review_2026-10-08.md'
def write(path, text):
    (root/path).write_text(text, encoding='utf-8')
def append(path, text):
    with (root/path).open('a', encoding='utf-8') as f: f.write('\n\n'+text+'\n')
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

for name in ['package.json','package-lock.json']:
    path=root/'prototype/spikes/a-climb'/name
    data=json.loads(path.read_text(encoding='utf-8'))
    dependencies=data['dependencies'] if name=='package.json' else data['packages']['']['dependencies']
    dependencies['@takram/three-clouds']='0.7.6'
    dependencies['@takram/three-geospatial-effects']='0.6.4'
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
decision=root/'docs/uiux_system/records/D_DECISIONS.md'
decision.write_text(decision.read_text(encoding='utf-8').replace('バ뀌는','바뀌는'),encoding='utf-8')
rows=[]
cards=[]
for path in sorted(captures.glob('*.json')):
    data=json.loads(path.read_text(encoding='utf-8'))
    s=data['state']; png=path.with_suffix('.png')
    rows.append({'file':str(path.relative_to(root)).replace('\\','/'),'sha256':sha(path),'pngSha256':sha(png),'state':s,'renderer':data['renderer']})
    src='../a-cloud-sculpt-20261006/native-captures/takram-lab/'+png.name
    cards.append(f'<section><h2>{html.escape(path.stem)}</h2><a href="{src}"><img src="{src}"></a><p>Actual WebGL candidate; high; optical/texture quality TUNE.</p></section>')
manifest={'decision':'D104','status':'RUNTIME_PASS_VISUAL_TUNE','sourceCommit':'b012ad06d858fc035d88aacfd73f092f93c994e4','captures':rows,'limitations':['Not pixel-identical source Basic: observer camera, half-float LUT, no SMAA','North uses source terrain geometry/maps at 1.5x but albedo-to-Lambert optical lighting, not original PBR','GPU query scopes composer only; not CPU, cloud incremental cost, FPS or target-PC proof','Persistent fine grain, pale highlights, terrain lighting and normals require further review','No complete globe-to-archive integration']}
write('verification/a-takram-lab-20261008/manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
write('verification/a-takram-lab-20261008/gallery.html','<!doctype html><meta charset="utf-8"><title>Takram cloud candidate D104</title><style>body{background:#101820;color:#e2edf4;font:16px system-ui;margin:24px}img{width:100%;max-width:1400px}section{margin:36px 0}a{color:#9fe6ff}</style><h1>D104 · 실제 구름 렌더러 비교 후보</h1><p>6개 기준 구도 + 시간 누적 OFF / 구름 OFF 대조. 질감·노출 TUNE. 기존 기본 화면 미교체.</p><a href="http://127.0.0.1:4198/cloud-lab.html">실시간 비교 열기</a>'+''.join(cards))
lut=root/'assets/research/cloud-reference-20261008/atmosphere-assets/higher_order_scattering.bin'
write('assets/research/cloud-reference-20261008/d104-runtime-pins.json',json.dumps({'sourceManifest':'manifest.json','clouds':'0.7.6','atmosphere':'0.19.1','effects':'0.6.4','helperEvidence':{str(p.relative_to(root)).replace(chr(92),'/'):sha(p) for p in (root/'assets/research/cloud-reference-20261008/basic-helper-source').glob('*.tsx')},'higherOrderScattering':{'url':'https://media.githubusercontent.com/media/takram-design-engineering/three-geospatial/eac103980f20c0956f2d3215833e73514be08462/packages/atmosphere/assets/higher_order_scattering.bin','bytes':lut.stat().st_size,'sha256':sha(lut),'type':'HalfFloat binary LUT'},'runtimeFiles':{p:sha(root/p) for p in ['prototype/spikes/a-climb/cloud-lab.ts','prototype/spikes/a-climb/cloud-lab.html','prototype/spikes/a-climb/package-lock.json','prototype/spikes/a-climb/vite.config.mjs']}},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'captures':len(rows),'status':'TUNE'},ensure_ascii=False))
