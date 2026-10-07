"""Package native browser evidence; do not generate or retouch rendered images."""
from pathlib import Path
import json, hashlib, html
root=Path(__file__).resolve().parents[2]
out=root/'verification/a-cloud-field-20261007'
captures=root/'verification/a-cloud-sculpt-20261006/native-captures/north-field-1080'
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
bench=[]; frames=[]; pins={}
for p in sorted(captures.glob('*.json')):
    j=json.loads(p.read_text(encoding='utf-8'))
    s=j['state']; gpu=s.get('gpu',{})
    row={'file':p.name,'p':s['p'],'groups':s['arrival']['cloudPath']['activeGroups'],
         'size':s['renderSize'],'gpu':gpu,'terrainReveal':s['arrival']['terrain']['detailReveal'],
         'locked':s['scroll']['locked'],'renderer':j['renderer']}
    (bench if p.name.startswith('bench-') else frames).append(row)
    for f in (p,p.with_suffix('.png')):
        pins[str(f.relative_to(root)).replace('\\','/')]={'bytes':f.stat().st_size,'sha256':sha(f)}
for rel in ['prototype/spikes/a-climb/cloud-field.ts','prototype/spikes/a-climb/arrival-north.ts','prototype/spikes/a-climb/main.ts','scripts/assets/export-cloud-field-native.py','scripts/assets/build-cloud-field-layout.py']:
    p=root/rel;pins[rel]={'bytes':p.stat().st_size,'sha256':sha(p)}
(out/'browser-manifest.json').write_text(json.dumps({'benchmark':bench,'frames':frames,'files':pins,'scope':'native canvas, same-camera fixed samples; no target-PC or continuous-video certification'},indent=2),encoding='utf-8')
cards=[]
for f in frames:
    if f['file'].startswith('scroll-'):continue
    rel='../a-cloud-sculpt-20261006/native-captures/north-field-1080/'+f['file'].replace('.json','.png')
    cards.append(f'<figure><a href="{rel}"><img loading="lazy" src="{rel}"></a><figcaption>p={f["p"]} · {f["groups"]} groups · native {f["size"]}</figcaption></figure>')
rows=''.join(f'<tr><td>{b["p"]}</td><td>{b["groups"]}</td><td>{b["gpu"]["count"]}</td><td>{b["gpu"]["p50"]:.3f}</td><td>{b["gpu"]["p95"]:.3f}</td></tr>' for b in bench)
(out/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><title>A · 80 VDB cloud field review</title><style>body{background:#10151b;color:#e9eef3;font:16px system-ui;margin:30px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}figure{margin:0}img{width:100%}figcaption{padding:8px}td,th{padding:8px;border-bottom:1px solid #46515a}a{color:#aee7ff}</style><h1>A · 80개 실제 VDB 구름 필드 / TUNE</h1><p>근경4·중경16·원경60. 동일 지형·태양·카메라. 생성 목업이 아닌 실제 브라우저 렌더.</p><p>구름 밝은 면·밀도 배치·먼 지형 수평선 경계는 리뷰 대상. GPU는 RTX3070 composer 고정뷰 120샘플, FPS/전체 프레임 보증 아님. 일부 모드 순차 측정 편차 존재.</p><table><tr><th>p</th><th>groups</th><th>samples</th><th>GPU p50 ms</th><th>GPU p95 ms</th></tr>'+rows+'</table><main>'+''.join(cards)+'</main>',encoding='utf-8')
print('PACKAGED',len(bench),len(frames))
