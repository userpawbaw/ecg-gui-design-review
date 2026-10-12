"""D133 package only our renders; supplied Disney beauty images stay in local source."""
from pathlib import Path
import json,hashlib,urllib.request
from PIL import Image,ImageDraw
r=Path(__file__).resolve().parents[2];out=r/'verification/a-disney-cloud-20261012'
m=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
by={f['file']:f for f in m['frames']}
names=['quarter-b64.png','half-b64.png','half-b6.png','quarter-b64-fov27-ev1.png','half-b64-fov27-ev1.png']
assert all(name in by for name in names)
for f in m['frames']:
 assert hashlib.sha256((out/f['file']).read_bytes()).hexdigest()==f['sha256']
 assert hashlib.sha256((r/f['source']).read_bytes()).hexdigest()==f['sourceSha256']
 assert Image.open(out/f['file']).size==tuple(f['size'])
for pair,title in [(names[:2],'resolution'),([names[2],names[1]],'bounces'),(names[3:],'close')]:
 board=Image.new('RGB',(1024,554),'#324c80');d=ImageDraw.Draw(board)
 for i,name in enumerate(pair):
  im=Image.open(out/name).convert('RGBA').crop((256,160,768,416))
  bg=Image.new('RGBA',im.size,'#324c80');bg.alpha_composite(im)
  board.paste(bg.convert('RGB'),(i*512,50));d.text((i*512+10,14),name,fill='white')
  im.save(out/(Path(name).stem+'-crop.png'))
 # No supplied reference pixels are present in this board.
 board=board.crop((0,0,1024,330));board.save(out/f'{title}-comparison.png')
def cards(files):
 return '<section>'+''.join(f'<article><h3>{name}</h3><a href="{name}"><img src="{name}"></a><p>새 렌더 · {by[name]["seconds"]:.1f}초 · 최대96 samples/OIDN</p><p>1:1 실제 픽셀 crop</p><img class="crop" src="{Path(name).stem}-crop.png"></article>' for name in files)+'</section>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Disney 구름 원본 비교 D133</title><style>body{margin:24px;background:#18283d;color:#eef4fc;font:16px sans-serif;line-height:1.6}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}img{display:block;width:100%;background:#324c80}.crop{width:512px;max-width:100%}a{color:#b8deff}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>Disney 구름 · 원본 해상도와 빛의 재산란</h1><p><b>국소 에셋 시험 / TUNE.</b> 고해상도 원본을 확보했지만 북유럽 실제씬이나 스크롤에 적용한 결과는 아닙니다. 공식 예제의 camera/light/density4/HG.877/albedo1을 Cycles로 번안했습니다. 원형 Mitsuba 또는 Hyperion과 동일한 렌더가 아닙니다.</p><h2>확대했을 때 원본 디테일</h2><p>같은 부분을 FOV27°로 확대한 두 원본입니다. 두 장 모두 display exposure +1EV를 적용했습니다. +1EV는 밝기 표시 변경이며 디테일을 추가한 것이 아닙니다. 1/4과1/2의 차이는 같은 구도·노출 안에서 보세요.</p>'''+cards(names[3:])+'''<h2>공식 예제 구도 번안 · 해상도 비교</h2><p>가로FOV54.43°, exposure0. 구름 전체를 담으면 작은 source 차이가 화면 표본화에 가려질 수 있습니다.</p>'''+cards(names[:2])+'''<h2>같은 1/2 원본 · 빛 재산란 상한</h2><p>6/64 bounces만 변경. 최대 깊이 상한이지 모든 광선이64회 산란했다는 뜻은 아닙니다. OIDN·adaptive sampling 노이즈 차이도 남습니다.</p>'''+cards([names[2],names[1]])+'''<h2>제작사 제공 원형 결과 · 참고용</h2><p>아래 이미지는 <b>Disney가 제공한 Hyperion beauty</b>이며 이번에 직접 렌더한 화면이 아닙니다. 원형사진 Kevin Udy / 원형 데이터 Copyright2017 Disney Enterprises Inc / CC BY-SA3.0. 원형 이미지와 VDB는 로컬 source에만 보관해, 소스 확보 없이 Git에서 이 비교페이지를 열면 아래 이미지는 표시되지 않을 수 있습니다.</p><img src="../../assets/source/disney-cloud/unpacked/wdas_cloud/wdas_cloud_hyperion_render.png"><p><a href="https://www.disneyanimation.com/resources/clouds/">공식 데이터</a> · <a href="acquisition.json">획득 hash·출처</a> · <a href="manifest.json">실제 렌더 조건</a> · <a href="grid-metadata.json">원본 voxel metadata</a> · <a href="fidelity.md">남은 차이</a></p><h2>미리보기 / 기각 방향 보존</h2><p>512×277/최대32samples. 잘못된90° import 회전 결과는 품질 판정에서 제외하고 기록만 남깁니다.</p><section><article><p>축 수정 후 미리보기</p><img src="eighth-b64-preview.png"></article><article><p>기각: 자동90°회전</p><img src="rejected-import-axis/eighth-b64-preview.png"></article></section></html>'''
(out/'gallery.html').write_text(html,encoding='utf-8')
files=['gallery.html','manifest.json','close-comparison.png',*names]
base='http://127.0.0.1:4198/@fs/'+out.as_posix()+'/'
for file in files:
 with urllib.request.urlopen(base+file,timeout=15) as resp:assert resp.status==200;assert len(resp.read())>0
(out/'validation.json').write_text(json.dumps({'newNativeFrames':5,'previewFrames':1,'rejectedPreviewFrames':1,'fileSourceHashes':'PASS','dimensions':'PASS','http200':files,'scope':'offline native and HTTP resources; not browser motion/realtime/target GPU performance','actualSceneChanged':False,'suppliedBeautyIncludedInOwnBoards':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('D133 five native + corrected/rejected preview, hashes/dimensions/HTTP verified')
