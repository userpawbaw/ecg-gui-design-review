import hashlib, html, json
from pathlib import Path

root=Path(__file__).resolve().parents[2]
native=root/'verification/a-cloud-sculpt-20261006/native-captures/takram-defect-final-20261008'
out=root/'verification/a-takram-defect-20261008';out.mkdir(exist_ok=True)
settings=['baseline','shadowoff','margin','jitteroff','march','far','fast','nohistory','cloudfilter']
names=['기준','지형 그림자 OFF','그림자 깊이 여유20km','그림자 jitter OFF','촘촘한 볼륨 샘플','그림자 범위200km','그림자 현재 반영10%','그림자 시간 누적OFF','구름 현재 반영5%']
rows=[]
for setting in settings:
 for p in [3000,3450,3650]:
  f=native/f'{setting}-p{p}-fixed.json';meta=json.loads(f.read_text(encoding='utf-8'));s=meta['state']
  assert s['ready'] and not s['contextLost'] and s['cloudPassAttached']
  assert s['renderSize']==[942,672] and s['gpu']['count']>=60
  files=[f,f.with_suffix('.png')];assert files[1].read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
  rows.append({'setting':setting,'p':s['p'],'meta':meta,'files':{str(x.relative_to(root)).replace('\\','/'):hashlib.sha256(x.read_bytes()).hexdigest() for x in files}})
videos=[]
for setting in ['baseline','cloudfilter','fast','march']:
 f=native/f'video-{setting}.json';meta=json.loads(f.read_text(encoding='utf-8'));v=f.with_suffix('.webm')
 assert meta['motion']['completed'] and meta['state']['ready'] and not meta['state']['contextLost']
 assert v.read_bytes().startswith(b'\x1a\x45\xdf\xa3')
 assert meta['motion']['trace'][-1]['elapsed']==8000
 videos.append({'setting':setting,'meta':meta,'files':{str(x.relative_to(root)).replace('\\','/'):hashlib.sha256(x.read_bytes()).hexdigest() for x in [f,v]}})
manifest={'decision':'D111','fixedPairs':27,'videos':videos,'captures':rows,'displaySize':[942,672],'cloudBufferNominal':[471,336],'quality':'high','scope':'9 independent settings x3 fixed poses plus4 actual renderer 8-second path videos; video encoding timing not performance benchmark','visualVerdict':'TUNE: no established fix for movement noise/camera-dependent shadows','sourceAtPackaging':{str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'prototype/spikes/a-climb/cloud-lab.ts',root/'prototype/spikes/a-climb/vite.config.mjs']},'provenance':'Initial24 fixed images preceded addition of MediaRecorder UI/cloud-alpha control; baseline parameters unchanged. Cloudfilter3 images/video use final code. Code hashes describe packaging source.'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
body='<h1>D111 · 하강 결함 분리 비교</h1><p>같은 DEM1.5×/커튼빛 · display942×672 · high50%/전체 cloud-buffer TAA. 아홉 설정의 정착27프레임과 실제 렌더 정역영상4개. 아직 해결 판정 전입니다.</p><p><a href="/cloud-lab.html?pose=north300&quality=high&scale=.5&cluster=1.6&recipe=curtain&diagnostic=cloudFilter&reviewRound=takram-defect-interactive-20261008">실시간 구름 TAA 보완 후보</a></p><h2>같은8초 경로의 실제 렌더 영상</h2><p>카메라 .265→.365→.265, 바람OFF. 첫번째 기준과 두번째 구름 현재 반영5%를 먼저 비교하세요. 원본 canvas 녹화, AI영상 아닙니다. 녹화 중 GPU 값은 성능표에 사용하지 않습니다.</p><section class="motion">'
for r in videos:
 path=next(x for x in r['files'] if x.endswith('.webm'))
 label={'baseline':'기준 · 구름10%/그림자1%','cloudfilter':'구름5% · 잡음/잔상 비교','fast':'그림자10% · 반응 비교','march':'촘촘march · 비용 증가'}[r['setting']]
 body+=f'<figure><video controls preload="metadata" src="../../{path}"></video><figcaption>{html.escape(label)}</figcaption></figure>'
body+='</section>'
for setting,name in zip(settings,names):
 body+=f'<h2>{name}</h2><section>'
 for r in rows:
  if r['setting']!=setting:continue
  path=next(x for x in r['files'] if x.endswith('.png'));s=r['meta']['state'];g=s['gpu'];d=s['diagnostic']
  body+=f'<figure><a href="../../{path}"><img loading="lazy" src="../../{path}"></a><figcaption>p{r["p"]} · GPU p50 {g["p50"]:.2f}ms/p95 {g["p95"]:.2f}ms · {g["count"]}query<br>shadow alpha {d["shadowAlpha"]} · minStep {d["minStep"]}</figcaption></figure>'
 body+='</section>'
(out/'gallery.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>D111 · 구름 결함 분리</title><style>body{background:#0b121b;color:#eee;font:16px system-ui;margin:32px}a{color:#a9d9ff}section{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.motion{grid-template-columns:repeat(2,1fr)}figure{margin:0;background:#19212c;padding:8px}img,video{width:100%}figcaption{padding:8px;font-size:13px}</style>'+body,encoding='utf-8')
print(json.dumps({'fixedPairs':27,'videos':4}))
