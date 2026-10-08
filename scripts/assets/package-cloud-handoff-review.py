import json,hashlib,html
from pathlib import Path
root=Path(__file__).resolve().parents[2]
roundname='takram-handoff-review-20261008'
native=root/'verification/a-cloud-sculpt-20261006/native-captures'/roundname
out=root/'verification/a-cloud-handoff-20261008';out.mkdir(exist_ok=True)
points=[1800,2350,3000,3650,3870,4100]
names=['북유럽 광역','지역 확대','구름 접근','구름 아래 빛 커튼','가장자리 진입','구름 내부 가림']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def url(p):return '/@fs/'+p.as_posix()
items=[]
for point,name in zip(points,names):
 p=native/f'handoff-p{point}-fixed.png';j=p.with_suffix('.json');m=json.loads(j.read_text(encoding='utf-8'));s=m['state']
 assert p.exists() and s['ready'] and not s['contextLost'] and s['handoff']['macroWeather'] and s['gpu']['count']>=120
 assert s['renderSize']==[942,672] and s['coverage']==.42 and s['localWeatherRepeat']==[9,9] and not s['wind']
 assert s['diagnostic']['shadowAlpha']==.01 and s['diagnostic']['shadowFar']==100000
 items.append({'name':name,'p':s['p'],'png':p.relative_to(root).as_posix(),'pngSha256':sha(p),'json':j.relative_to(root).as_posix(),'jsonSha256':sha(j),'state':s})
v=native/'video-handoff.webm';vm=json.loads(v.with_suffix('.json').read_text(encoding='utf-8'))
assert v.read_bytes()[:4]==bytes.fromhex('1a45dfa3') and vm['motion']['completed'] and vm['motion']['nominalMs']==24000
manifest={'decision':'D112','source':'native WebGL renderer, not generated imagery','latestRound':roundname,'fixedPairs':6,'videos':1,'display':[942,672],'archiveIntegrated':False,'candidateAdopted':False,'fullOcclusionSample':items[-1]['state']['handoff']['cover'],'previousRoundsPreserved':[p.name for p in sorted(native.parent.glob('takram-handoff*-20261008')) if p.name!=roundname],'codeSha256':{p:sha(root/p) for p in ['prototype/spikes/a-climb/cloud-lab.ts','prototype/spikes/a-climb/cloud-handoff.ts','prototype/spikes/a-climb/arrival-north.ts','prototype/spikes/a-climb/terrain-parent.ts']},'frames':items,'video':{'path':v.relative_to(root).as_posix(),'sha256':sha(v),'metadata':vm}}
wheel=json.loads((native/'handoff-p2136-fixed.json').read_text(encoding='utf-8'))
assert wheel['state']['input']['settled'] and wheel['state']['input']['source']=='wheel'
manifest['physicalWheel']={'forward':wheel['state']['input'],'reverse':'browser UI wheel2 current/target .18 confirmed, no extra fixed capture'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for item in items:
 s=item['state'];c=s['handoff']['cover'];cards.append(f'<figure><a href="{url(root/item["png"])}"><img src="{url(root/item["png"])}" alt="{item["name"]}"></a><figcaption><b>{item["name"]}</b> · p{s["p"]}<br>구름·연무 불투명도 평균 {c["meanAlpha"]:.3f} / 95%不透明標本 {c["opaqueFraction"]:.1%}<br>GPU p50 {s["gpu"]["p50"]:.2f} / p95 {s["gpu"]["p95"]:.2f} ms · 120queries</figcaption></figure>')
live='http://127.0.0.1:4198/cloud-lab.html?pose=north300&quality=high&scale=.5&cluster=1.6&recipe=curtain&diagnostic=cloudFilter&handoff=1&reviewRound=takram-handoff-interactive-20261008'
page=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><title>D112 · 같은 구름군 원경–근경 연결</title><style>body{{margin:32px;background:#0c141e;color:#dce6ee;font:16px system-ui;line-height:1.6}}a{{color:#9fdaff}}section{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}}figure{{margin:0}}img,video{{width:100%;display:block;border-radius:6px}}figcaption{{padding:10px;background:#172433}}video{{max-width:1100px}}small{{color:#becad6}}@media(max-width:700px){{section{{grid-template-columns:1fr}}}}</style><h1>D112 · 같은 구름군 원경–근경 연결</h1><p>실제 렌더 후보 · 6구도 + 24초 정역 영상. 지형1.5× / 같은 고정 기상장 / high50% / 전체 cloud-buffer TAA. 서고 연결과 최종 채택 전입니다.</p><p><a href="{html.escape(live)}">실시간 후보 열기 — 연결 구도 메뉴 또는 화면 휠</a></p><h2>실제 카메라 연결 영상</h2><video controls preload="metadata" src="{url(v)}"></video><p>광역 → 지역 → 접근 → 커튼 → 가장자리 → 가림 → 역방향. 실제 canvas 녹화, 물리 휠 녹화와 구분합니다. 서고 컷은 아직 적용하지 않았습니다.</p><h2>6개 정착 구도</h2><section>{''.join(cards)}</section><h2>현재 판정: TUNE</h2><p>원경 구름띠 내부의 작은 점 질감과 지도 광학은 아직 보완 대상입니다. 마지막 가림 성공은 전체 품질 승인과 다릅니다.</p><h2>확인할 부분</h2><p>광역에서 구름띠와 해안선이 읽히는지, 확대하면서 같은 구름군으로 이어지는지, 가장자리 진입에 갑작스러운 출현이 없는지 확인하세요. 가림 수치는32×18 표본이며 전체 픽셀/최종 품질 증명이 아닙니다. 그림자 추가 튜닝은 보류입니다.</p><small>원본 Takram 기상 세부에 고정 비대칭 구름띠를 곱한 새 후보이며 실제 북유럽 기상 관측이 아닙니다. GPU는 정착구도의composer범위, 대상PC/장기성능 미검증.</small></html>'''
page=page.replace('alpha平均','불투명도 평균').replace('不透明標本','불투명 표본')
(out/'gallery.html').write_text(page,encoding='utf-8')
print('PASS: 6 native pairs + completed 24s WebM; manifest/gallery created')
