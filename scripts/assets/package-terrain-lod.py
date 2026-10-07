from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'verification/a-terrain-lod-20261007';N=O/'native-captures';M=json.loads((O/'render-manifest.json').read_text());assert len(M['frames'])==3
for f in M['frames']:
 p=O/(f['name']+'.png');assert Image.open(p).size==(1600,900);assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
capt=[];sheet=Image.new('RGB',(1200,1092),'#15202b');d=ImageDraw.Draw(sheet)
for y,(name,native) in enumerate(zip(['broad','approach','ridge'],M['frames'])):
 meta=json.loads((N/(name+'.json')).read_text());assert meta['errors']==[] and meta['pending']==0 and meta['heightGain']==1.5
 meta['camera_triangle_reduction_vs_full_tiled']=1-meta['drawTriangles']/meta['fullTiledTriangles'];meta['image_sha256']=hashlib.sha256((N/(name+'.png')).read_bytes()).hexdigest();capt.append({'name':name,**meta})
 for x,p in enumerate([O/(native['name']+'.png'),N/(name+'.png')]):sheet.paste(Image.open(p).convert('RGB').resize((600,337)),(x*600,y*364))
 d.text((8,y*364+343),'Cycles 1.5x',fill='white');d.text((608,y*364+343),'WebGL LOD '+name,fill='white')
sheet.save(O/'contact.jpg',quality=94)
(O/'browser-check.json').write_text(json.dumps({'frames':capt,'verified':'real IAB UI broad -> approach -> ridge -> broad -> approach; final captures; no current loading errors','scope':'primary selection counts differ from renderer total including shadow draws; not GPU time or hardware benchmark','old_warning':'PCFSoftShadowMap warning before replacement with PCFShadowMap; old log retained','native_sha256':json.loads((O/'native-asset.json').read_text())['sha256']},indent=2)+'\n')
html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>1.5배 지형 LOD 비교</title><style>body{background:#111923;color:#eee;font:16px/1.7 system-ui;margin:32px}img{width:100%}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}</style><h1>1.5배 지형 · 기준 렌더 / WebGL LOD</h1><p>왼쪽 Cycles 조명 기준 / 오른쪽 실제 앱 WebGL 화면. 카메라·환경광·재질 구현은 서로 다르므로 동일 픽셀 비교가 아닙니다. 전체 지구/구름/서고 연결 전의 지역 시험입니다.</p>'
for name,f in zip(['broad','approach','ridge'],M['frames']):html+=f'<h2>{name}</h2><div class="grid"><img src="{f["name"]}.png"><img src="native-captures/{name}.png"></div>'
(O/'gallery.html').write_text(html,encoding='utf-8')
regpath=R/'assets/registry.json';reg=json.loads(regpath.read_text(encoding='utf-8'));mp=R/'prototype/spikes/a-climb/public/terrain-lod/manifest.json';native=json.loads((O/'native-asset.json').read_text())
for aid,path,kind in [('jotunheimen-height15-scene-20261007',R/native['file'],'scene-source'),('jotunheimen-tiled-lod-20261007',mp,'terrain')]:
 item={'id':aid,'title':aid,'kind':kind,'status':'test-only','source':{'type':'page','page':'https://www.pgc.umn.edu/data/arcticdem/'},'licence':'unknown','attribution_required':True,'attribution':'EOX Sentinel-2 cloudless 2023 / PGC ArcticDEM','original':None,'processed':{'file':str(path.relative_to(R)).replace('\\','/'),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},'used_by':['prototype/spikes/a-climb/terrain-regional.ts'],'review':'D092 user approved height1.5; terrain detail KEEP; regional LOD/lighting TUNE; manifest pins256 geometry files'}
 reg['assets']=[x for x in reg['assets'] if x['id']!=aid]+[item]
regpath.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('3 native renders / 3 actual WebGL captures validated, gallery and registry ready')
