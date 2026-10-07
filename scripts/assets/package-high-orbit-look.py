"""Validate isolated high-look renders and retain the failed first optical trial."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];O=R/'verification/a-high-orbit-look-20261007'
m=json.loads((O/'render-manifest.json').read_text());assert len(m['frames'])==4
sheet=Image.new('RGB',(1200,728),'#111820');d=ImageDraw.Draw(sheet);stats=[]
html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>지구 광학 비교</title><style>body{background:#10151c;color:#eee;margin:32px;font:16px/1.7 system-ui}img{width:100%}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}</style><h1>고시점 지구 재질·광학 후보</h1><p>왼쪽 대기 off / 오른쪽 대기 on. Moto 공개 4K 지도 재질의 Blender 번역이며 원작 shader·카메라 재현이 아닙니다. 극지는 실측 DEM이 아닌 제한된 조형 근사, 대기는 단색 방사형 산란 근사입니다. 높은 시점 외관 시험이며 실제 궤도 모델·지역지형 인계·완성 구름 장면은 아닙니다.</p>'
for y,shot in enumerate(['earth-hero','high-orbit']):
 html+=f'<h2>{shot}</h2><div class="grid">'
 arrays=[]
 for x,mode in enumerate(['volume-off','volume-on']):
  name=f'{shot}-{mode}';p=O/(name+'.png');im=Image.open(p);assert im.size==(1600,900)
  f=next(v for v in m['frames'] if v['name']==name);assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
  arrays.append(np.asarray(im.convert('RGB'),np.float32));sheet.paste(im.resize((600,337)),(600*x,364*y));d.text((600*x+8,364*y+343),name,fill='white')
  html+=f'<figure><img src="{name}.png"><figcaption>{mode}</figcaption></figure>'
 html+='</div>';delta=np.abs(arrays[0]-arrays[1]);stats.append({'shot':shot,'mean_absolute_RGB_delta':float(delta.mean()),'scope':'contribution check only, not visual quality score'})
sheet.save(O/'contact.jpg',quality=94)
html+='<p>TUNE: 대기광 목표 강도/낮밤 경계, 해양 반사 hotspot, 극지 윤곽 재질. 구름 및 지역 DEM은 별도 제작분과 통합해야 합니다.</p>'
(O/'gallery.html').write_text(html,encoding='utf-8')
sourcepins=[]
for name in ['day.webp','night.webp','bump.webp']:
 p=R/'assets/source/moto-reference-20261007'/name;sourcepins.append({'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
previous=R/'assets/source/a-high-orbit-look-20261007/initial/render-manifest.json'
(O/'verification.json').write_text(json.dumps({'frames_verified':4,'dimensions':[1600,900],'source_pins':sourcepins,'volume_contribution':stats,'previous_trial_manifest_sha256':hashlib.sha256(previous.read_bytes()).hexdigest(),'correction':'polar geometry gain .012 -> .002; atmosphere density 6 ->24 and scale height .0013 ->.002; still TUNE','runtime_integration':False},indent=2)+'\n',encoding='utf-8')
print('four high-look PNGs verified; contact and source pins ready')
