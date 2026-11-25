# F-111: 브리지 --trace-io 기록(R 읽기 시각 · 바이트 · 큐 길이, P 발행 시각 · idx · n · gap_ms)을 6 s 단위로 요약
# 사용: python backlog_analyze.py <trace.txt>
import sys
R, P = [], []
for l in open(sys.argv[1]):
    a = l.split()
    if a[0] == 'R': R.append((float(a[1]), int(a[3])))
    elif a[0] == 'P': P.append((float(a[1]), int(a[3]), float(a[4])))
t0 = R[0][0]
for s in range(0, int(R[-1][0] - t0), 6):
    q = [x for t, x in R if s <= t - t0 < s + 6]; p = [x for x in P if s <= x[0] - t0 < s + 6]
    print(f"{s:3d}s 큐최대 {max(q) if q else 0:4d} 발행 {len(p):3d} gap_ms최대 {max([x[2] for x in p] or [0]):6.0f} 발행당표본 {sum(x[1] for x in p) / max(1, len(p)):5.0f}")
