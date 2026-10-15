from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,shutil
r=Path(__file__).resolve().parents[2];o=r/'verification/a-cloud-regional-volume-20261014';raw=r/'verification/a-cloud-sculpt-20261006/native-captures/regional-volume-20261014';out=o/'runtime';out.mkdir(parents=True,exist_ok=True);rows=[]
for p in [1800,2000,2100,2200,2350,2500,2700,2900]:
 camera=None
 for mode in ['off','on']:
  stem=f'volume-{mode}-p{p}';m=json.loads((raw/(stem+'.json')).read_text(encoding='utf-8'));s=m['state'];assert s['ready'] and not s['contextLost'];assert s['renderSize']==[1280,720];assert s['regionalVolume']['enabled']==(mode=='on');assert s['regionalVolume']['steps']==192
  if camera is None:camera=s['camera']
  assert camera==s['camera'];assert abs(s['p']-p/10000)<1e-6
  for ext in ['.png','.json']:shutil.copyfile(raw/(stem+ext),out/(stem+ext))
  im=Image.open(out/(stem+'.png'));assert im.size==(1280,720);im.crop((320,120,940,470)).save(out/(stem+'-crop.png'))
  rows.append({'file':'runtime/'+stem+'.png','meta':'runtime/'+stem+'.json','p':p/10000,'enabled':mode=='on','sha256':hashlib.sha256((out/(stem+'.png')).read_bytes()).hexdigest(),'gpu':s['gpu'],'camera':s['camera'],'morph':s['regionalVolume']['morph']})
(o/'runtime-manifest.json').write_text(json.dumps({'frames':rows,'scope':'actual local 3D density trial, no final visual acceptance','source':'prototype/spikes/a-climb/assets/disney-volume/manifest.json'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
url='http://127.0.0.1:4198/cloud-lab.html?cloudDetail=1&orbital=1&handoff=1&terrainSeam=1&pose=north300&recipe=curtain&regionalVolume=1&reviewRound=regional-volume-20261014'
sections=''
for p in [2100,2200,2350,2500,2700,2900,2000,1800]:
 sections+=f'<h2>p{p/10000:.4f}</h2><section>'+''.join(f'<article><h3>{"기존 얕은 구름" if mode=="off" else "지역 세부 구름 · 3D 밀도"}</h3><a href="runtime/volume-{mode}-p{p}.png"><img src="runtime/volume-{mode}-p{p}.png"></a><p>같은 영역 확대 · 원본 픽셀</p><img src="runtime/volume-{mode}-p{p}-crop.png"></article>' for mode in ['off','on'])+'</section>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>지역 확대 세부 구름 D138</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.65}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img,video{width:100%;display:block}a{color:#b8deff}article{background:#23364c;padding:12px}@media(max-width:850px){section{grid-template-columns:1fr}}</style><h1>지역 확대 · 실제 3D 밀도 구름</h1><p><b>실제 lab 후보 · TUNE · 주 도입부 채택 전.</b> 확대 경로 주변 두 군집에 보유 Disney VDB의 밀도를 사용합니다. 전체 투명도를 켜고 끄는 대신, 멀리 보이는 큰 형태가 가까워지며 세부 밀도·높이로 변합니다. 햇빛 가림과 표면 방향도 실제 밀도에서 계산합니다.</p><p><a href="'''+url+'''">실행 화면 열기</a> · 상단 ‘지역 세부 구름’으로 기준/후보를 전환하고 카메라 슬라이더 또는 화면 휠로 이동하세요. p.2100부터 .2900까지 확인합니다.</p><h2>확대·역방향 8초</h2><p>아래 영상은 로컬 생성본입니다. GitHub에는 업로드하지 않으므로 새 checkout에서는 실행 화면의 영상 저장 버튼으로 생성해야 합니다.</p><video controls preload="metadata" src="video-volume-on.webm"></video>'''+sections+'''<details><summary>첫 72단계 계산판 · 근접 줄무늬 반례</summary><p>최종은192단계. 계산 단계를 늘린 효과와 남은 기존층의 흐림은 구별합니다.</p><img src="first-72-step/volume-on-p2900.png"></details><p>Copyright Disney Enterprises Inc 2017 / CC BY-SA 3.0 / Kevin Udy photo reference. quarter source를192×96×192로 재표본화한 연출 배치이며 북유럽 실제 날씨가 아닙니다. 최종 Hyperion 렌더 재현이나 원본 전체 해상도도 아닙니다.</p><p>추가 R8 두 벌 계산치6.75MiB. 전체VRAM 실측은 아닙니다. 지형 그림자·구름 통과·서고 연결은 이번 검증에 포함하지 않습니다.</p><p><a href="runtime-manifest.json">16구도·GPU·카메라</a> · <a href="fidelity.md">결과·한계·통과 기준</a></p></html>'''
(o/'gallery.html').write_text(html,encoding='utf-8');(o/'validation.json').write_text(json.dumps({'runtimeFrames':16,'firstStepTrialFramesPreserved':16,'dimensions':'PASS','sameCamera':'PASS','densityEncoding':'R8 sqrt, actual quarter VDB resampling','motionQuality':'pending review','mainIntroAdopted':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print([(f['p'],f['enabled'],f['gpu']['p50']) for f in rows],flush=True)
