from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'verification/a-north-handoff-20261007';N=O/'native-captures';m=json.loads((O/'native-vdb-manifest.json').read_text());assert len(m['frames'])==3
for f in m['frames']:
 p=O/(f['name']+'.png');assert Image.open(p).size==(1280,720);assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
frames=[]
for p in sorted(N.glob('north-0*.png')):
 meta=json.loads(p.with_suffix('.json').read_text());state=meta['state'];arrival=state.get('arrival',{});frames.append({'file':str(p.relative_to(O)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'state':state,'renderer':meta.get('renderer')})
frames.sort(key=lambda f:f['state']['p'])
assert len(frames)>=9
sheet=Image.new('RGB',(1200,5*350),'#111b23');d=ImageDraw.Draw(sheet)
for i,f in enumerate(frames[:10]):
 x=i%2*600;y=i//2*350;sheet.paste(Image.open(O/f['file']).convert('RGB').resize((600,323)),(x,y));d.text((x+8,y+330),f['file'].split('/')[-1],fill='white')
sheet.save(O/'contact.jpg',quality=94)
html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>북반구 지구·지역 지형 연결 검토</title><style>body{background:#111923;color:#eee;margin:32px;font:16px/1.7 system-ui}img{max-width:100%}main{max-width:1400px;margin:auto}</style><main><h1>지구 → 북유럽 지도 → 1.5배 지형 → 가림 → 같은 서고</h1><p>실제 WebGL 후보. VDB는 아래 native 기준 렌더에서 진짜 볼륨/지형 receiver, 웹에서는 가림용 bake만 적용. 지역 실시간 볼륨·움직임 품질은 미완료입니다.</p>'
for f in frames:html+=f'<h2>{f["file"].split("/")[-1]}</h2><img src="{f["file"]}">'
html+='<h1>실제 VDB와 지형을 같은 빛 아래서 렌더한 기준</h1>'
for f in m['frames']:html+=f'<h2>{f["name"]}</h2><img src="{f["name"]}.png">'
(O/'gallery.html').write_text(html+'</main>',encoding='utf-8')
pins=[]
for name in ['day.webp','night.webp','bump.webp','macro.jpg','cloud-cover.png']:
 p=R/'prototype/spikes/a-climb/public/north-earth'/name;pins.append({'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(O/'browser-manifest.json').write_text(json.dumps({'frames':frames,'pins':pins,'scope':'real fixed-pose WebGL screen checks; not long-motion, targetPC or final cloud feedback','cloud_cover_bake':True,'regional_live_vdb':False},indent=2)+'\n')
regpath=R/'assets/registry.json';reg=json.loads(regpath.read_text(encoding='utf-8'))
for aid,file,kind,page in [('north-parent-map-20261007','macro.jpg','texture','https://cloudless.eox.at/documentation/usage'),('north-vdb-cover-bake-20261007','cloud-cover.png','texture','https://jangafx.com/software/embergen/download/free-vdb-animations/')]:
 output=next(p for p in pins if p['file'].endswith('/'+file));item={'id':aid,'title':aid,'kind':kind,'status':'test-only','source':{'type':'page','page':page},'licence':'unknown','attribution_required':True,'attribution':'EOX Sentinel-2 cloudless / JangaFX cloud pack; see original registry and manifest','original':None,'processed':output,'used_by':['prototype/spikes/a-climb/arrival-north.ts'],'review':'D093 scoped northern handoff; optical/edge/motion TUNE; cover is actual VDB bake, not live volume'};reg['assets']=[a for a in reg['assets'] if a['id']!=aid]+[item]
regpath.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('native3/WebGL',len(frames),'pins verified')
