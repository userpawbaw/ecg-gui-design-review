import json, hashlib, html
from pathlib import Path
root=Path(__file__).resolve().parents[2]
out=root/'verification/a-takram-parameters-20261008'
native=root/'verification/a-cloud-sculpt-20261006/native-captures/takram-parameters-20261008'
rows=[]
for p in sorted(native.glob('*.json')):
    meta=json.loads(p.read_text(encoding='utf-8')); state=meta['state']; img=p.with_suffix('.png')
    assert img.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    assert state['ready'] and not state['contextLost'] and state['cloudPassAttached']
    assert state['temporalAntialiasing'] and not state['temporalUpscale'] and state['resolutionScale']==.5
    rows.append({'shot':p.stem,'meta':meta,'files':{str(q.relative_to(root)).replace('\\','/'):{'bytes':q.stat().st_size,'sha256':hashlib.sha256(q.read_bytes()).hexdigest()} for q in [p,img]}})
manifest={'decision':'D107','sourceCommit':'b012ad06d858fc035d88aacfd73f092f93c994e4','nativePairs':len(rows),'evidence':'actual renderer PNG/JSON, not generated still','benchmark':'rolling samples; not matched benchmark','captures':rows}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for r in rows:
    s=r['meta']['state']; opt=s['opticalTrial']; image=next(k for k in r['files'] if k.endswith('.png'))
    caption=f"양 {s['coverage']:.2f} · 위치X {opt['weatherX']} · 고도 {opt['sunElevation']}° · 방위 {opt['sunAzimuth']}° · 연무감쇠 {opt['hazeExponent']} · 빛 {'ON' if s['lightShafts'] else 'OFF'}"
    cards.append(f'<figure><a href="../../{image}"><img src="../../{image}" loading="lazy"></a><figcaption>{html.escape(caption)}<br><small>{html.escape(r["shot"])}</small></figcaption></figure>')
(out/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><title>D107 구름 파라미터 비교</title><style>body{margin:28px;background:#101720;color:#e9eff5;font:16px system-ui}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:#202c39;padding:12px}img{width:100%}figcaption{padding-top:10px}a{color:#9cdcff}small{font-size:11px}</style><h1>D107 · 구름 양 / 위치 / 태양 / 연무</h1><p>같은 p.365 구도, high50% + 전체 cloud-buffer TAA, 응집대비1.6. 실제 캡처9쌍. 품질TUNE: 커튼빛 아직 불충분. 양.42는 기준 유지, 태양/연무 후보 미채택.</p><p><a href="../../docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_parameter_review_2026-10-08.md">파라미터 검토 보고서</a></p><main>'+''.join(cards)+'</main>',encoding='utf-8')
print(f'Validated {len(rows)} native pairs; generated isolated gallery/manifest')
