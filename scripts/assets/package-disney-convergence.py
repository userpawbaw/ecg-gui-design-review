"""D134 deterministic comparisons; raw passes are not independent native frames."""
from pathlib import Path
import json,hashlib,urllib.request
from PIL import Image,ImageDraw
import numpy as np
r=Path(__file__).resolve().parents[2];o=r/'verification/a-disney-convergence-20261012'
m=json.loads((o/'manifest.json').read_text(encoding='utf-8'));frames=m['frames'];assert len(frames)==3
for f in frames:
 assert hashlib.sha256((r/f['source']).read_bytes()).hexdigest()==f['sourceSha256']
 for field,hfield in [('file','sha256'),('noisyFile','noisySha256')]:
  p=o/f[field];assert hashlib.sha256(p.read_bytes()).hexdigest()==f[hfield];assert Image.open(p).size==tuple(f['size'])
 assert f['adaptiveSampling']==False and f['camera']['horizontalFov']==27 and f['displayExposureEv']==1
by={(f['maxSamples'],f['volumeBounces']):f for f in frames}
a,b,c=[by[k] for k in [(32,64),(128,64),(128,128)]]
assert a['sourceSha256']==b['sourceSha256']==c['sourceSha256']
def rgb(name):
 im=Image.open(o/name).convert('RGBA');bg=Image.new('RGBA',im.size,'#324c80');bg.alpha_composite(im);return bg.convert('RGB')
def pair(rows,title):
 board=Image.new('RGB',(1024,330),'#324c80');d=ImageDraw.Draw(board)
 for i,(name,label) in enumerate(rows):
  im=rgb(name).crop((256,160,768,416));board.paste(im,(i*512,50));d.text((i*512+8,15),label,fill='white')
 board.save(o/(title+'.png'))
pair([(a['file'],'32 samples / b64'),(b['file'],'128 samples / b64')],'samples-comparison')
pair([(b['file'],'128 samples / b64'),(c['file'],'128 samples / b128')],'depth-comparison')
pair([(b['noisyFile'],'same paths / noisy'),(b['file'],'same paths / OIDN')],'denoise-comparison')
metrics={}
for title,f1,f2 in [('samples',a,b),('depth',b,c)]:
 x=np.asarray(rgb(f1['file']),dtype=float)/255;y=np.asarray(rgb(f2['file']),dtype=float)/255
 metrics[title]={'displayRgbMeanAbsoluteDifference':float(abs(x-y).mean()),'note':'AgX +1EV RGB display diagnostic, not radiometric convergence or aesthetic score'}
(o/'comparison-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
def card(f,raw=False):
 name=f['noisyFile'] if raw else f['file'];label='노이즈 제거 전 · 같은 경로 샘플' if raw else 'OIDN 결과'
 return f'<article><h3>{f["maxSamples"]} samples / {f["volumeBounces"]} bounces · {label}</h3><a href="{name}"><img src="{name}"></a><p>렌더 {f["seconds"]:.1f}초 · 1024×554 · fixed sampling</p></article>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Disney 샘플·산란 대조 D134</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.6}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{display:block;width:100%;background:#324c80}a{color:#b8deff}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>Disney 구름 · 샘플 수와 빛 전달 대조</h1><p><b>국소 에셋 시험 / TUNE</b> · 동일 quarter 원본·빛·밀도4·HG.877·FOV27°·노출+1EV 고정. 새 native3장과 같은 렌더의 noisy pass3장. 실제 북유럽 씬 적용 전입니다.</p><h2>1. 샘플 수만 변경</h2><p>32→128 fixed samples. adaptive sampling은 두 장 모두 끔. 아래 원본 링크로 확대해서 보세요.</p><section>'''+card(a)+card(b)+'''</section><img src="samples-comparison.png"><h2>2. 산란 상한만 변경</h2><p>128 samples 고정, total/volume bounces64→128. 모든 광선이 상한까지 산란했다는 뜻은 아닙니다.</p><section>'''+card(b)+card(c)+'''</section><img src="depth-comparison.png"><h2>3. 같은 샘플의 노이즈 제거 전후</h2><p>noisy 화면의 작은 점을 실제 source 디테일로 평가하지 마세요. 두 화면은 하나의 렌더에서 저장했습니다.</p><section>'''+card(b,True)+card(b)+'''</section><img src="denoise-comparison.png"><details><summary>나머지 noisy pass</summary><section>'''+card(a,True)+card(c,True)+'''</section></details><p>출처: Copyright2017 Disney Enterprises Inc · CC BY-SA3.0 · 모델 사진 Kevin Udy. Cycles4.5.3 번안이며 Hyperion/Mitsuba 재현이 아닙니다.</p><p><a href="manifest.json">실제 조건·해시</a> · <a href="fidelity.md">판정과 다음 단계</a> · <a href="../a-disney-cloud-20261012/gallery.html">D133 원본 비교</a></p></html>'''
(o/'gallery.html').write_text(html,encoding='utf-8')
resources=['gallery.html','manifest.json','samples-comparison.png','depth-comparison.png','denoise-comparison.png']+[f[k] for f in frames for k in ['file','noisyFile']]
for name in resources:
 with urllib.request.urlopen('http://127.0.0.1:4198/@fs/'+o.as_posix()+'/'+name,timeout=15) as resp:assert resp.status==200;assert len(resp.read())>0
(o/'validation.json').write_text(json.dumps({'nativeFrames':3,'sameRenderNoisyPasses':3,'sourceAndOutputHashes':'PASS','dimensions':'PASS','http200':resources,'actualSceneChanged':False,'convergenceProven':False,'scope':'static offline render comparison only'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metrics));print('D134 package/hash/dimensions/HTTP PASS')
