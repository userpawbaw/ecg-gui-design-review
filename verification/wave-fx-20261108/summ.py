import json,sys,statistics as st
rows=[json.loads(l) for l in open(sys.argv[1],encoding='utf-8') if l.startswith('{')]
from collections import defaultdict
g=defaultdict(list)
for r in rows:g[(r['case'],r['dpr'])].append(r)
print('| 조건 | dpr | 반복 | 초당 그리기 | 그리기 스크립트 ms | 브라우저 CPU % | 프레임당 CPU (CPU % ÷ fps) |')
print('|---|---|---|---|---|---|---|')
for (c,d),L in g.items():
    m=lambda k:st.median(x[k] for x in L)
    fps=m('drawsPerSec');cpu=m('browserCpuPct');per=st.median(x['browserCpuPct']/x['drawsPerSec'] for x in L if x['drawsPerSec']>0) if any(x['drawsPerSec']>0 for x in L) else 0
    print(f"| {c} | {d} | {len(L)} | {fps:.1f} | {m('scriptMsPerDraw'):.2f} | {cpu:.0f} | {per:.2f} |")
