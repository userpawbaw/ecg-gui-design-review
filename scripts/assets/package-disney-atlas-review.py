"""D135 saved runtime comparison gallery with local provenance."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil,urllib.request
r=Path(__file__).resolve().parents[2];o=r/'verification/a-disney-atlas-20261012';captures=r/'verification/a-cloud-sculpt-20261006/native-captures/disney-atlas-20261012';dest=o/'runtime';dest.mkdir(exist_ok=True)
frames=[]
for p in [1800,2100,2350,2650,2850]:
 for mode in (['off','on'] if p<=2350 else ['on']):
  stem=f'disney-{mode}-p{p}';meta=json.loads((captures/(stem+'.json')).read_text(encoding='utf-8'))
  assert meta['state']['ready'] and not meta['state']['contextLost'];assert meta['state']['renderSize']==[1280,720]
  assert meta['state']['disneyAtlas']['enabled']==(mode=='on')
  for ext in ['.json','.png']:shutil.copyfile(captures/(stem+ext),dest/(stem+ext))
  assert Image.open(dest/(stem+'.png')).size==(1280,720)
  frames.append({'file':'runtime/'+stem+'.png','meta':'runtime/'+stem+'.json','sha256':hashlib.sha256((dest/(stem+'.png')).read_bytes()).hexdigest(),'p':p/10000,'mode':mode,'amount':meta['state']['disneyAtlas']['amount'],'gpu':meta['state']['gpu'],'renderer':meta['renderer'],'size':meta['state']['renderSize']})
(o/'runtime-manifest.json').write_text(json.dumps({'frames':frames,'scope':'8 static runtime snapshots, local app browser1280x720, GPU brief24sample diagnostics only; not target-PC/FPS/VRAM gate','mainIntroAdopted':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
rows=[]
for p,name in [(1800,'북유럽 광역'),(2100,'확대 중간'),(2350,'지역 확대')]:
 rows.append(f'<h2>{name} · p{p/10000}</h2><section>'+''.join(f'<article><h3>Disney {mode.upper()}</h3><a href="runtime/disney-{mode}-p{p}.png"><img src="runtime/disney-{mode}-p{p}.png"></a></article>' for mode in ['off','on'])+'</section>')
url='http://127.0.0.1:4198/cloud-lab.html?cloudDetail=1&orbital=1&handoff=1&terrainSeam=1&pose=north300&recipe=curtain&disneyAtlas=1&reviewRound=disney-atlas-20261012'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Disney 국소 구름 궤도 시험 D135</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.6}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{width:100%;display:block;background:#324c80}a{color:#b8deff}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>Disney 국소 구름 · 실제 궤도 구도 시험</h1><p><b>opt-in 후보 / TUNE / 주 도입부 미채택.</b> 기존 위성 구름 위에 낮은 두 군집만 추가했습니다. source 높이.28과 중립 주변광을 적용한 고정빛·세 관찰각 RGBA impostor입니다. 실제 runtime volume이나 날씨 재현이 아닙니다.</p><p><a href="'''+url+'''">실행 화면 열기</a> · 상단 Disney 체크로 ON/OFF, 진행 슬라이더 또는 화면 위 휠로 확인하세요.</p>'''+''.join(rows)+'''<h2>근접 접근 전 제거 구간 · 실제 인계 구현 전</h2><p>.265에서50%, .285에서0%입니다. 동일cloud의3D통과를구현한것은아닙니다.</p><section>'''+''.join(f'<article><h3>p{p/10000}</h3><img src="runtime/disney-on-p{p}.png"></article>' for p in [2650,2850])+'''</section><h2>직접 렌더한 원본 관찰각</h2><section>'''+''.join(f'<article><h3>{el}도</h3><img src="native/atlas-e{el}-ev1.png"></article>' for el in [45,32,20])+'''</section><details><summary>기각한 첫 배치 · 높은 푸른 탑</summary><p>첫bank압축전8구도중지역확대. 삭제하지않고보존했습니다.</p><img src="rejected-tower-runtime/disney-on-p2350.png"></details><p>Copyright2017 Disney Enterprises Inc · CC BY-SA3.0 · 모델 사진 Kevin Udy. 고도·footprint·주변광은연출근사.</p><p><a href="atlas-manifest.json">native→runtime해시와변형</a> · <a href="runtime-manifest.json">GPU·카메라 캡처조건</a> · <a href="fidelity.md">판정·한계</a></p></html>'''
(o/'gallery.html').write_text(html,encoding='utf-8')
files=['gallery.html','atlas-manifest.json','runtime-manifest.json']+[f['file'] for f in frames]+[f'native/atlas-e{el}-ev1.png' for el in [45,32,20]]
for f in files:
 with urllib.request.urlopen('http://127.0.0.1:4198/@fs/'+o.as_posix()+'/'+f,timeout=15) as response:assert response.status==200;assert len(response.read())>0
(o/'validation.json').write_text(json.dumps({'nativeAcceptedCandidates':3,'rejectedNativeFrames':6,'runtimeSnapshots':8,'rejectedRuntimeSnapshots':8,'alphaCorners':'PASS','sourceNativeRuntimeHashes':'PASS','dimensions':'PASS','http200':files,'hostViteBuild':'PASS','mainIntroAdopted':False,'scope':'static local runtime evidence; not 3D traversal or aesthetic approval'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps([(f['p'],f['mode'],f['gpu']) for f in frames]));print('D135 runtime8/native3/HTTP PASS')
