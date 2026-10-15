from pathlib import Path
from PIL import Image
import json,shutil,hashlib
r=Path(__file__).resolve().parents[2];raw=r/'verification/a-cloud-sculpt-20261006/native-captures/regional-join-20261016';o=r/'verification/a-cloud-regional-join-20261016';out=o/'runtime';out.mkdir(parents=True,exist_ok=True);rows=[]
for p in [2000,2100,2350,2500,2700,2900]:
 camera=None
 for mode in ['on','joined']:
  stem=f'volume-{mode}-p{p}';m=json.loads((raw/(stem+'.json')).read_text(encoding='utf-8'));s=m['state'];assert s['ready'] and not s['contextLost'];assert s['renderSize']==[1280,720];assert s['regionalVolume']['variant']==mode;assert s['regionalVolume']['joined']==(mode=='joined')
  if camera is None:camera=s['camera']
  assert camera==s['camera'];assert abs(s['p']-p/10000)<1e-6
  for ext in ['png','json']:shutil.copyfile(raw/(stem+'.'+ext),out/(stem+'.'+ext))
  im=Image.open(out/(stem+'.png'));assert im.size==(1280,720);im.crop((320,100,960,460)).save(out/(stem+'-crop.png'))
  rows.append({'file':'runtime/'+stem+'.png','meta':'runtime/'+stem+'.json','p':p/10000,'variant':mode,'sha256':hashlib.sha256((out/(stem+'.png')).read_bytes()).hexdigest(),'gpu':s['gpu'],'camera':s['camera']})
(o/'runtime-manifest.json').write_text(json.dumps({'frames':rows,'source':'same D138 derived R8; no new asset data','scope':'fixed-height and lower-support combined trial; not isolated causal attribution'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
url='http://127.0.0.1:4198/cloud-lab.html?cloudDetail=1&orbital=1&handoff=1&terrainSeam=1&pose=north300&recipe=curtain&regionalVolume=1&reviewRound=regional-join-20261016'
sections=''
for p in [2100,2350,2500,2700,2900,2000]:
 sections+=f'<h2>p{p/10000:.4f}</h2><section>'+''.join(f'<article><h3>{"이전 · 높이 성장" if mode=="on" else "보완 · 높이 고정 + 하단 연결"}</h3><a href="runtime/volume-{mode}-p{p}.png"><img src="runtime/volume-{mode}-p{p}.png"></a><p>같은 영역 · 원본 픽셀</p><img src="runtime/volume-{mode}-p{p}-crop.png"></article>' for mode in ['on','joined'])+'</section>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>지역 구름 연결감 D139</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.65}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img,video{width:100%;display:block}a{color:#b8deff}article{background:#23364c;padding:12px}@media(max-width:850px){section{grid-template-columns:1fr}}</style><h1>지역 구름 · 높이 고정과 하단 연결</h1><p><b>실제 후보 · TUNE · 최종 채택 전.</b> 이전의 확대 중 높이 성장을 제거하고 군집을 낮췄습니다. 하단 밀도만 기존 위성 구름 분포와 연결하고 세부 윗면은 유지합니다. 광량·태양·source는 같습니다.</p><p><a href="'''+url+'''">실행 화면 열기</a> · 상단 ‘지역 세부 구름’에서 이전/보완/구름층만 비교할 수 있습니다. p.2100–.2900을 정역으로 확인하세요.</p><h2>8초 정역 · 보완 후보</h2><p>로컬 생성 영상. GitHub에는 영상을 업로드하지 않습니다.</p><video controls preload="metadata" src="video-volume-joined.webm"></video>'''+sections+'''<h2>다음 튜닝 우선순위</h2><ol><li>기존층과 새 군집의 재질 연결: 작은 골·밝은 면을 유지하면서 별개 덩어리감을 줄이기.</li><li>근접 source 해상도: p.27–.29에서 필요한 부분만 세부 밀도 해상도 보완.</li><li>이동 안정성: 형태 변화·sampling 줄무늬·shimmering 확인.</li></ol><p>지형 그림자 보류, 주 도입부 미채택. 추가 데이터 없음; D138 R8 두 벌6.75MiB 재사용. 고정 높이와 하단 지지 분포를 함께 바꿨으므로 한 요소의 인과만 증명하는 대조는 아닙니다.</p><p>Disney2017 CC BY-SA3.0 / Kevin Udy photo reference. 실제 북유럽 기상자료 아님.</p><p><a href="runtime-manifest.json">12구도·카메라·GPU</a> · <a href="fidelity.md">기록과 통과 기준</a></p></html>'''
(o/'gallery.html').write_text(html,encoding='utf-8');(o/'validation.json').write_text(json.dumps({'runtimeFrames':12,'sameCamera':'PASS','renderSize':[1280,720],'readyContext':'PASS','build':'host Vite PASS','adopted':False,'motion':'pending'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print([(f['p'],f['variant'],f['gpu']['p50']) for f in rows])
