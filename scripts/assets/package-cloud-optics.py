from pathlib import Path
from PIL import Image
import json,shutil,hashlib
r=Path(__file__).resolve().parents[2];raw=r/'verification/a-cloud-sculpt-20261006/native-captures/cloud-optics-20261016';o=r/'verification/a-cloud-optics-20261016';out=o/'runtime';out.mkdir(parents=True,exist_ok=True);rows=[]
poses=[1800,2100,2350,2500,2700,2900];modes=['legacy','haze','scatter'];labels=['현재 조명','현재 조명 + 안개','산란 조명 + 안개']
for p in poses:
 camera=None
 for mode in modes:
  stem=f'optics-{mode}-p{p}';m=json.loads((raw/(stem+'.json')).read_text(encoding='utf-8'));s=m['state'];assert s['ready'] and not s['contextLost'];assert s['renderSize']==[1280,720];assert abs(s['p']-p/10000)<1e-6;assert s['regionalVolume']['joined']
  if camera is None:camera=s['camera']
  assert camera==s['camera']
  for ext in ['png','json']:shutil.copyfile(raw/(stem+'.'+ext),out/(stem+'.'+ext))
  im=Image.open(out/(stem+'.png'));assert im.size==(1280,720);im.crop((320,100,960,460)).save(out/(stem+'-crop.png'))
  rows.append({'file':'runtime/'+stem+'.png','meta':'runtime/'+stem+'.json','p':p/10000,'variant':mode,'sha256':hashlib.sha256((out/(stem+'.png')).read_bytes()).hexdigest(),'gpu':s['gpu'],'camera':s['camera']})
(o/'runtime-manifest.json').write_text(json.dumps({'frames':rows,'source':'D138 Disney derived fine/coarse R8 reused','scope':'D140 custom phase/multiple-scattering approximation and bounded altitude haze; not full Takram optics'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
url='http://127.0.0.1:4198/cloud-lab.html?cloudDetail=1&orbital=1&handoff=1&terrainSeam=1&pose=north300&recipe=curtain&regionalVolume=1&reviewRound=cloud-optics-20261016'
sections=''
for p in [2350,2500,2700,2900,2100,1800]:
 sections+=f'<h2>p{p/10000:.4f}</h2><section>'+''.join(f'<article><h3>{label}</h3><a href="runtime/optics-{mode}-p{p}.png"><img loading="lazy" src="runtime/optics-{mode}-p{p}.png"></a><p>원본 픽셀 부분 비교</p><img loading="lazy" src="runtime/optics-{mode}-p{p}-crop.png"></article>' for mode,label in zip(modes,labels))+'</section>'
html="""<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>구름 산란·고도 안개 비교 D140</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.65}section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}img,video{width:100%;display:block}a{color:#b8deff}article{background:#23364c;padding:12px}@media(max-width:850px){section{grid-template-columns:1fr}}</style><h1>업계 방식 점검 · 산란 조명과 고도 안개</h1><p><b>실제 후보 · TUNE · 최종 채택 전.</b> 현재 궤도 패스는 Takram CloudsEffect를 사용하지 않아 원본 다중 산란·구름 대기 합성·TAA가 모두 적용된 상태가 아니었습니다. 이 비교는 동일한 밀도 에셋·카메라에서 현재판 / 안개만 / 산란 조명+안개를 분리합니다.</p><p>안개는 고도6.5–14.5km에 놓이며 실제 지형 깊이와 구름의 대표 거리를 고려합니다. 전체 화면 blur가 아닙니다. 새 산란은 dualHG/3octave 근사이며 완전한 물리 정확성·Takram 재현을 뜻하지 않습니다.</p><p><a href="LAB_URL">실행 화면 열기</a> · 상단 ‘산란·안개’에서 전환하고 p.21–.29를 정역 확인하세요.</p><details><summary>진단 영상 · 연속 모션 품질 미검증</summary><p>로컬 진단 영상: background 진행 제한으로9표본뿐이므로 연속 모션 검증용이 아닙니다. 실행 화면에서 움직임을 확인하세요. 영상은 GitHub 업로드 제외이므로 새 clone에는 없습니다.</p><video controls preload="metadata" src="video-optics-scatter.webm"></video></details>"""+sections+"""<h2>남은 항목</h2><ol><li>기존 얕은 구름과 실제 밀도 군집을 같은 조명·밀도 체계로 합성.</li><li>필요한 근접 영역의 source 해상도 / 필터 보완.</li><li>깊이·이동 벡터를 갖춘 시간 누적과 정역 안정성.</li></ol><p>지형 그림자 보류, 서고KEEP, 실패2/2 및 대안 유지. 주 Intro 미채택. Disney2017 CC BY-SA3.0 / Kevin Udy photo reference, 실제 북유럽 기상자료 아님.</p><p><a href="runtime-manifest.json">18장 metadata</a> · <a href="fidelity.md">업계 점검과 통과 기준</a></p></html>"""
(o/'gallery.html').write_text(html.replace('LAB_URL',url),encoding='utf-8');(o/'validation.json').write_text(json.dumps({'runtimeFrames':18,'sameCamera':'PASS','renderSize':[1280,720],'readyContext':'PASS','build':'host Vite PASS','adopted':False,'motion':'pending'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print([(f['p'],f['variant'],f['gpu']['p50']) for f in rows])
