"""Validate and package D132 native source/optical probes, retaining reused provenance."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'verification/a-cloud-source-optics-20261012'
survey = OUT/'survey'
sm = json.loads((survey/'manifest.json').read_text(encoding='utf-8'))
assert len(sm['frames']) == 10
contact = Image.new('RGB',(1920,848),'#283746'); label=ImageDraw.Draw(contact)
for i,f in enumerate(sm['frames']):
 im=Image.open(survey/f['file']).convert('RGBA'); assert im.size==(384,384)
 assert hashlib.sha256((survey/f['file']).read_bytes()).hexdigest()==f['sha256']
 x=i%5*384; y=i//5*424;contact.paste(im,(x,y),im)
 label.text((x+12,y+390),Path(f['file']).stem,fill='white')
contact.save(survey/'contact.jpg')
m = json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
old = ROOT/'verification/a-cloud-sampling-20261012'
oldm = json.loads((old/'manifest.json').read_text(encoding='utf-8'))
f = next(f for f in oldm['frames'] if f['stepRate']==.35 and f['denoising'])
assert hashlib.sha256((old/f['file']).read_bytes()).hexdigest()==f['sha256']
shutil.copy2(old/f['file'],OUT/'cloud_06-d1-g0.35.png')
baseline = {**f,'file':'cloud_06-d1-g0.35.png','densityMultiplier':1,'anisotropy':.35,
 'reusedFrom':'verification/a-cloud-sampling-20261012/'+f['file']}
m['frames']=[baseline]+[f for f in m['frames'] if f['file']!=baseline['file']]
assert len(m['frames'])==5
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
cards=[];metrics=[];board=Image.new('RGB',(1920,460),'#283746');draw=ImageDraw.Draw(board)
import numpy as np
for i,f in enumerate(m['frames']):
 im=Image.open(OUT/f['file']).convert('RGBA');assert im.size==(1024,1024)
 assert hashlib.sha256((OUT/f['file']).read_bytes()).hexdigest()==f['sha256']
 assert hashlib.sha256((ROOT/f['source']).read_bytes()).hexdigest()==f['sourceSha256']
 arr=np.asarray(im)/255;mask=arr[:,:,3]>.9
 lum=arr[:,:,:3]@np.array([.2126,.7152,.0722])
 # Display-encoded RGB luminance proxy, not linear radiometric lighting or quality score.
 metrics.append({'file':f['file'],'opaquePixelCount':int(mask.sum()),
 'displayRgbLumaP10P50P90':np.percentile(lum[mask],[10,50,90]).tolist() if mask.any() else [],
 'meanAlpha':float(arr[:,:,3].mean())})
 crop=im.crop((130,210,514,594));fn=Path(f['file']).stem+'-crop.png';crop.save(OUT/fn)
 bg=Image.new('RGBA',crop.size,'#507297');bg.alpha_composite(crop)
 board.paste(bg.convert('RGB'),(i*384,45));draw.text((i*384+6,12),Path(f['file']).stem,fill='white')
 title=Path(f['file']).stem
 cards.append(f'<article><h3>{title}</h3><a href="{f["file"]}"><img src="{f["file"]}"></a><p>1:1 crop（384px）</p><img class="crop" src="{fn}"><p>{"D130 baseline 재사용" if f.get("reusedFrom") else "새 native 렌더"} · {f["seconds"]:.1f}초</p></article>')
board.save(OUT/'comparison.png')
(OUT/'validation.json').write_text(json.dumps({'scope':'native file/source hashes and dimensions; not browser motion or realtime GPU performance','nativeFrames':5,'newNativeRenders':4,'reusedBaseline':1,'surveyFrames':10,'metrics':metrics,'metricWarning':'display RGB luma proxy over alpha>.9; different opaque masks, not a fidelity score','runtimeChanged':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>D132 구름 원본·광학 비교</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.6}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}img{display:block;width:100%;background:#507297}.crop{width:384px;max-width:100%}a{color:#b8deff}h3{font-size:18px}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>원본 형태와 광학두께를 나눠 보기 · D132</h1><p>06과08을 같은빛·카메라에서 density1/4로 비교합니다. 마지막08은 density4를 유지하고 산란방향 g만 .35→0으로 바꿨습니다. density4는 실험값이며 해상도를 올린 것이 아닙니다.</p><p>원본10종 조사에서08의 갈라진 외곽을 후보로 골랐습니다. 새 고해상도 원본을 확보한 비교는 아닙니다. 서로 다른 구름은 형상과 빛의 통과길이가 달라 완전히 같은 조형 비교가 아닙니다.</p><p><b>TUNE · 국소 에셋 비교.</b> 실제 북유럽 씬 적용, 하강 인계, 스크롤 품질 및 GPU frame 성능은 미검증입니다. 흰 면·골의 가독성과 가장자리 질감을 따로 봐 주세요.</p><p><a href="manifest.json">실제 조건·원본 SHA</a> · <a href="validation.json">검증 범위·측정</a> · <a href="comparison.png">동일 좌표 crop</a></p><section>'''+''.join(cards)+'''</section><h2>원본10종 조사</h2><p>384² / 최대32samples / ortho10. 위1024² 가까운뷰와 품질·구도가 다릅니다.</p><img src="survey/contact.jpg"><p><a href="survey/manifest.json">조사 원본·시간·조건</a></p></html>'''
(OUT/'gallery.html').write_text(html,encoding='utf-8')
print('D132 five native images + ten survey images verified and packaged')
