from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,numpy as np
R=Path(__file__).resolve().parents[2]; O=R/'verification/a-norway-region-20261007'; P=R/'assets/processed/a-norway-region-20261007'
m=json.loads((O/'render-manifest.json').read_text()); assert len(m['frames'])==9
for f in m['frames']:
 p=O/(f['name']+'.png'); assert Image.open(p).size==(1280,720); assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
shots=['high-orbit','low-orbit','cloud-height']; kinds=['global4k','regional-color','regional-dem']
sheet=Image.new('RGB',(1200,747),'#111820'); draw=ImageDraw.Draw(sheet)
metrics=[]
for y,shot in enumerate(shots):
 arrays=[]
 for x,kind in enumerate(kinds):
  name=shot+'-'+kind; im=Image.open(O/(name+'.png')).convert('RGB'); arrays.append(np.asarray(im).astype(float))
  sheet.paste(im.resize((400,225)),(x*400,y*249)); draw.text((x*400+8,y*249+229),name,fill='white')
 metrics.append({'shot':shot,'mean_abs_RGB_change_global_to_region':float(np.abs(arrays[0]-arrays[1]).mean()),'mean_abs_RGB_change_color_to_DEM':float(np.abs(arrays[1]-arrays[2]).mean()),'note':'pixel change only; not perceptual-quality score'})
sheet.save(O/'contact.jpg',quality=93)
(O/'difference-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>지역 지표 실제 비교</title><style>body{background:#10151c;color:#e9edf2;margin:32px;font:16px/1.7 system-ui}main{max-width:1600px;margin:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}img{width:100%}figure{margin:0}figcaption{padding:12px}h2{margin-top:48px}p{max-width:1100px}a{color:#9be4ff}</style><main><h1>노르웨이 지역 지표 — 실제 자료 비교</h1><p>좌: 기존 4K 색상 / 중: NASA 500m 원본 지역 색상 / 우: 지역 색상 + ArcticDEM 고도. 모든 열의 카메라·낮 조명·재질은 같습니다. 구름·도시불빛·대기는 끈 표면 디테일 진단입니다. 완성 도입부의 룩 또는 사용자 2차 제작 피드백 자료가 아닙니다.</p><p>ArcticDEM 원본32m를513² 궤도용 grid로 평균 리샘플링. 실제 높이1×, 경계8% fade. 고도 datum과 구형 바다 기준은 시안 근사이며 지리 측량 검증이 아닙니다.</p>'''
for shot in shots:
 html+=f'<h2>{shot}</h2><div class="grid">'
 for kind in kinds:
  tag=shot+'-'+kind; html+=f'<figure><a href="{tag}.png"><img src="{tag}.png"></a><figcaption>{kind}</figcaption></figure>'
 html+='</div>'
html+='<h2>판정</h2><p>지역 색상 확보와 지리 정합 시험 PASS. 해안·지표 디테일은 개선됐지만 최종 룩은 TUNE. 이 카메라 거리의 DEM 윤곽 기여는 작아 과장하지 않습니다. 다음은 동일 지역을 웹 거리 인계에 연결하고 대기/구름/빛을 함께 조정합니다.</p></main></html>'
(O/'gallery.html').write_text(html,encoding='utf-8')
registry=json.loads((R/'assets/registry.json').read_text(encoding='utf-8')); meta=json.loads((P/'metadata.json').read_text())
for role,record in [('color',meta['imagery']),('dem',meta['dem'])]:
 e={'id':'norway-regional-'+role+'-20261007','title':'NASA BMNG July crop' if role=='color' else 'PGC ArcticDEM bounded 32m-source sample','kind':'texture' if role=='color' else 'terrain','status':'test-only','source':{'type':'page','page':record['page']},'licence':'unknown','attribution_required':True,'attribution':'NASA Blue Marble Next Generation / PGC ArcticDEM acknowledgement','original':record.get('source',record.get('vrt')),'processed':record['output'],'used_by':['scripts/assets/render-norway-region.py'],'review':'D-089 internal concept trial, metadata records source resolution, resampling, datum and remote full-file hash limit; exhibition review pending'}
 registry['assets']=[a for a in registry['assets'] if a['id']!=e['id']]+[e]
(R/'assets/registry.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('9 PNG hashes/dimensions verified; gallery + source registry complete')
