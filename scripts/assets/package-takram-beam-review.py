import json, hashlib, html
from pathlib import Path
root=Path(__file__).resolve().parents[2]
out=root/'verification/a-takram-beam-20261008'; out.mkdir(exist_ok=True)
native=root/'verification/a-cloud-sculpt-20261006/native-captures/takram-beam-20261008'
rows=[]
for p in sorted(native.glob('*.json')):
    meta=json.loads(p.read_text(encoding='utf-8')); s=meta['state']; image=p.with_suffix('.png')
    assert image.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    assert s['ready'] and not s['contextLost'] and s['cloudPassAttached']
    assert s['temporalAntialiasing'] and not s['temporalUpscale'] and s['resolutionScale']==.5
    rows.append({'shot':p.stem,'meta':meta,'files':{str(q.relative_to(root)).replace('\\','/'):{'sha256':hashlib.sha256(q.read_bytes()).hexdigest(),'bytes':q.stat().st_size} for q in (p,image)}})
def baseline(r):
    t=r['meta']['state']['opticalTrial'];return t['sunAzimuth']==43.75 and t['hazeExponent']==.001 and t['layerDepth']==1
def candidate(r):
    t=r['meta']['state']['opticalTrial'];s=r['meta']['state'];return t['sunAzimuth']==0 and t['sunElevation']==15 and t['hazeExponent']==.00018 and t['layerDepth']==1.2 and t['layerDensity']==1 and t['weatherX']==0 and t['weatherY']==0 and t['groundShadow'] and s['lightShafts']
fixed=[r for r in rows if r['meta']['state'].get('capturePhase','fixed')=='fixed']
posepairs=[]
for progress in [.265,.285,.300,.320,.345,.365]:
    b=next(r for r in fixed if r['meta']['state']['p']==progress and baseline(r))
    c=next(r for r in fixed if r['meta']['state']['p']==progress and candidate(r))
    posepairs.append((progress,b,c))
motion=[r for r in rows if r['meta']['state'].get('capturePhase','fixed')!='fixed'];assert len(motion)==6
manifest={'decision':'D108','nativePairs':len(rows),'samePosePairs':6,'motionFrames':6,'captures':rows,'sourceCommit':'b012ad06d858fc035d88aacfd73f092f93c994e4','sourceAtPackaging':{'cloud-lab.ts':hashlib.sha256((root/'prototype/spikes/a-climb/cloud-lab.ts').read_bytes()).hexdigest()},'provenanceLimits':'Early isolated trial captures preceded UI recipe/replay additions; capture metadata is actual. Packaging code hash is not an attestation of early capture code bytes. Final six pairs/replay used final optical implementation.'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
def card(r,label):
    path=next(k for k in r['files'] if k.endswith('.png'));s=r['meta']['state'];t=s['opticalTrial']
    return f'<figure><a href="../../{path}"><img src="../../{path}" loading="lazy"></a><figcaption>{html.escape(label)}<br><small>p{s["p"]} · 태양{t["sunElevation"]}/{t["sunAzimuth"]} · 감쇠{t["hazeExponent"]} · 두께{t["layerDepth"]} · 밀도{t["layerDensity"]}</small></figcaption></figure>'
body='<h1>D108 · 구름 커튼빛 보완</h1><p>TAA/high50%, 같은 DEM1.5×/카메라. 왼쪽 이전 기준, 오른쪽 개선 후보. 광선 ON/OFF와 지형 그림자 OFF를 별도로 확인했습니다. 품질TUNE, main 미통합.</p><p><a href="/cloud-lab.html?pose=north300&quality=high&scale=.5&cluster=1.6&recipe=curtain&reviewRound=takram-beam-interactive-20261008">실시간 후보 · 슬라이더 / 정역 이동 검증</a></p>'
for progress,b,c in posepairs:body+=f'<h2>진행 {progress}</h2><section>'+card(b,'이전 기준')+card(c,'커튼빛 후보')+'</section>'
body+='<h2>광학 단독 대조</h2><section>'
for r in fixed:
    if not baseline(r) and not candidate(r):body+=card(r,r['shot'])
body+='</section><h2>연속 정역 진행 직후 프레임</h2><p>진행값 자동 재생 중 촬영. 실제 마우스 휠·전체 도입부 검증이나 영상 증거와 다릅니다.</p><section>'
for r in motion:body+=card(r,r['meta']['state']['capturePhase'])
body+='</section>'
(out/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><title>D108 · 구름 커튼빛</title><style>body{margin:28px;background:#101720;color:#e9eff5;font:16px system-ui}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:#202c39;padding:12px}img{width:100%}figcaption{padding-top:10px}a{color:#9cdcff}small{font-size:12px}</style>'+body,encoding='utf-8')
print(f'Validated {len(rows)} pairs, six matched poses, six moving frames; saved isolated gallery/manifest')
