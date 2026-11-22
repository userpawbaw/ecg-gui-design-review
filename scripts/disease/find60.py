"""D-189 60 s 후보 찾기(심방 · 심실 조기 수축): 시험 기록마다 60 s 창(1 s 간격)에서 조건별 후보 수. python3 find60.py <mitdb dir>"""
import sys, wfdb, numpy as np
R = sys.argv[1]; FS = 360; W = 60 * FS
for rec in ['100','103','105','113','117','121','123','200','202','210','213','214','219','221','222','228','231','232','233','234']:
    a = wfdb.rdann(f'{R}/{rec}', 'atr'); sym = np.array(a.symbol); t = a.sample
    beat = np.isin(sym, list('NLRAaJjVFEeSQ/f'))
    rh = []; cur = None; t0 = 0
    for s_, aux, tt in zip(sym, a.aux_note, t):
        if s_ == '+' and aux:
            if cur: rh.append((cur, t0, tt))
            cur, t0 = aux.strip('\x00').strip(), tt
    if cur: rh.append((cur, t0, 650000))
    noise = t[np.isin(sym, ['~', '|'])]
    res = {}
    for st in range(5 * FS, 650000 - W - 5 * FS, FS):
        sel = beat & (t >= st) & (t < st + W); b = ''.join(sym[sel])
        cov = {}
        for r, x0, x1 in rh:
            o = min(x1, st + W) - max(x0, st)
            if o > 0: cov[r] = cov.get(r, 0) + o / W
        quiet = not np.any((noise >= st - 5 * FS) & (noise < st + W + 5 * FS))
        n_ok = cov.get('(N', 0) > .999
        for name, ok in [('pvc_strict', n_ok and 4 <= b.count('V') <= 20 and set(b) <= set('NV') and 'VV' not in b),
                         ('pvc_loose', n_ok and 3 <= b.count('V') and set(b) <= set('NVF') and 'VVV' not in b),
                         ('apc_strict', n_ok and b.count('A') >= 3 and set(b) <= set('NA') and 'AA' not in b),
                         ('apc_loose', n_ok and b.count('A') + b.count('a') >= 2 and set(b) <= set('NAa'))]:
            if ok: res.setdefault(name, [0, 0]); res[name][0] += 1; res[name][1] += quiet
    if res: print(rec, {k: f'{v[0]} (잡음주석없음 {v[1]})' for k, v in res.items()})
