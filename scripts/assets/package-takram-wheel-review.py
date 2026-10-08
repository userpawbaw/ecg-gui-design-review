import hashlib, html, json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
native = root / 'verification/a-cloud-sculpt-20261006/native-captures/takram-wheel-final-20261008'
out = root / 'verification/a-takram-wheel-20261008'
out.mkdir(exist_ok=True)
rows = []
for p in sorted(native.glob('*.json'), key=lambda p: int(p.stem.split('-')[1])):
    meta = json.loads(p.read_text(encoding='utf-8'))
    s = meta['state']
    assert s['ready'] and not s['contextLost'] and s['cloudPassAttached']
    assert not s['temporalUpscale'] and s['input']['settled']
    assert abs(s['input']['current'] - s['input']['target']) < .00011
    files = [p, p.with_suffix('.png')]
    assert files[1].read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    rows.append({'shot': p.stem, 'meta': meta, 'files': {str(f.relative_to(root)).replace('\\', '/'): hashlib.sha256(f.read_bytes()).hexdigest() for f in files}})
assert len(rows) == 10
assert [r['meta']['state']['p'] for r in rows[:5]] == [.235, .271, .307, .343, .365]
assert [r['meta']['state']['p'] for r in rows[5:9]] == [.329, .293, .257, .235]
manifest = {'decision': 'D109', 'nativePairs': len(rows), 'scope': 'Actual browser wheel inputs; captures after settling, not continuous video or main integration', 'panelTest': {'beforeScrollTop': 240, 'afterScrollTop': 0, 'progressBefore': .235, 'progressAfter': .235}, 'captures': rows, 'sourceAtPackaging': hashlib.sha256((root / 'prototype/spikes/a-climb/cloud-lab.ts').read_bytes()).hexdigest(), 'limits': 'GPU samples 16–39 only, transient spikes; no stable performance PASS. p.235 distant cloud texture remains TUNE. Main/earth/archive not integrated.'}
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
body = '<h1>D109 · 실제 휠 하강·상승 검토</h1><p>같은 DEM 1.5× · high50% · full cloud-buffer TAA · 커튼빛 후보. 실제 브라우저 휠 입력 뒤 정착한 프레임입니다. 전체 도입부 통합/연속 영상/성능 승인과 구별합니다.</p><p><a href="/cloud-lab.html?pose=north300&quality=high&scale=.5&cluster=1.6&recipe=curtain&reviewRound=takram-wheel-interactive-20261008">실시간 휠 후보 열기</a> · 화면 위 휠=카메라 / 패널 안 휠=설정</p><p>남은 사항: 초기 p.235의 먼 구름 질감과 전체 지구→서고 인계. 짧은 GPU 측정에서 일시적 상승 관찰, 안정 성능 PASS 미부여.</p><section>'
for r in rows:
    s = r['meta']['state']; path = next(k for k in r['files'] if k.endswith('.png'))
    body += f'<figure><a href="../../{path}"><img loading="lazy" src="../../{path}"></a><figcaption>{html.escape(r["shot"])}<br>p{s["p"]} · target{s["input"]["target"]:.4f} · settled{s["input"]["settled"]}</figcaption></figure>'
body += '</section>'
(out / 'gallery.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>D109 · 실제 휠 구름 검토</title><style>body{background:#0b121b;color:#eee;font:16px system-ui;margin:32px}a{color:#a9d9ff}section{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;background:#19212c;padding:10px}img{width:100%}figcaption{padding:8px;font-size:13px}</style>' + body, encoding='utf-8')
print(json.dumps({'nativePairs': len(rows), 'gallery': str(out / 'gallery.html')}))
