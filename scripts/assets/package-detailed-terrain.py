from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'verification/a-terrain-detailed-20261007';P=R/'assets/processed/a-terrain-detailed-20261007'
m=json.loads((O/'render-manifest.json').read_text());assert len(m['frames'])==6
for f in m['frames']:
 p=O/(f['name']+'.png');assert Image.open(p).size==(1600,900);assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
sheet=Image.new('RGB',(1200,1092),'#111820');draw=ImageDraw.Draw(sheet)
shots=['low-orbit','cloud-approach','ridge-close']
for y,shot in enumerate(shots):
 for x,gain in enumerate([1,2.5]):
  tag=f'{shot}-height{gain:g}';im=Image.open(O/(tag+'.png'));sheet.paste(im.resize((600,337)),(x*600,y*364));draw.text((x*600+8,y*364+343),tag,fill='white')
sheet.save(O/'contact.jpg',quality=94)
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>상세 지형 제작 비교</title><style>body{margin:32px;background:#10151c;color:#eef3f7;font:16px/1.7 system-ui}main{max-width:1500px;margin:auto}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%}figure{margin:0}figcaption{padding:10px}h2{margin-top:40px}a{color:#a8e5ff}</style><main><h1>실제 상세 지도와 산악 지형</h1><p>왼쪽은 원본 높이1×, 오른쪽은 연출용2.5×입니다. 실제 EOX Sentinel 모자이크와 ArcticDEM32m 정보를 사용합니다. 지도 타일 샘플은 광역 약73m/국소 약18m이며 native10m 파일 확보로 표시하지 않습니다.</p><p>지역 지형·조명 후보입니다. global Earth/고궤도 대기·도시/구름/서고를 연결한 완성 전이는 아직 아닙니다. 낮은 접근45km → 구름 접근14km → 능선6km 카메라를 비교합니다. 물리 궤도 모델·측량 재현은 아닙니다.</p>'''
for shot in shots:
 html+=f'<h2>{shot}</h2><div class="grid">'
 for gain in [1,2.5]:
  tag=f'{shot}-height{gain:g}';html+=f'<figure><a href="{tag}.png"><img src="{tag}.png"></a><figcaption>높이 {gain}×</figcaption></figure>'
 html+='</div>'
html+='<p>높이1×만으로도 가까운 능선·골짜기가 읽힙니다. 최종 카메라/재질/고궤도 룩·거리 인계는 TUNE입니다. 원본 scene에는 texture가 packed되어 있습니다.</p></main></html>'
(O/'gallery.html').write_text(html,encoding='utf-8')
reg=json.loads((R/'assets/registry.json').read_text(encoding='utf-8'));meta=json.loads((P/'metadata.json').read_text());native=json.loads((O/'native-asset.json').read_text())
items=[('eox-detailed-broad-20261007','texture',meta['maps'][0]['output'],'https://cloudless.eox.at/documentation/usage'),('eox-detailed-near-20261007','texture',meta['maps'][1]['output'],'https://cloudless.eox.at/documentation/usage'),('arcticdem-detailed-20261007','terrain',meta['dem']['output'],'https://www.pgc.umn.edu/data/arcticdem/'),('jotunheimen-detailed-scene-20261007','scene-source',native,'https://www.pgc.umn.edu/data/arcticdem/')]
for aid,kind,output,url in items:
 item={'id':aid,'title':aid,'kind':kind,'status':'test-only','source':{'type':'page','page':url},'licence':'unknown','attribution_required':True,'attribution':'EOX Sentinel-2 cloudless 2023 / PGC ArcticDEM','original':None,'processed':{k:output[k] for k in ['file','bytes','sha256']},'used_by':['scripts/assets/render-detailed-terrain.py'],'review':'D091 internal concept use. Actual map samples/DEM density and gain recorded; global orbit/web integration pending.'}
 reg['assets']=[e for e in reg['assets'] if e['id']!=aid]+[item]
(R/'assets/registry.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('six rendered PNGs verified; gallery/native/source registry ready')
