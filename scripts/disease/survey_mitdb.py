"""D-189: survey MIT-BIH test records (DS2) — beat-symbol counts and rhythm episodes (aux_note) from the cardiologist .atr annotations.
python scripts/disease/survey_mitdb.py <mitdb dir>"""
import sys, collections, wfdb
ROOT = sys.argv[1]
TEST = [100,103,105,111,113,117,121,123,200,202,210,212,213,214,219,221,222,228,231,232,233,234]
for r in TEST:
    a = wfdb.rdann(f"{ROOT}/{r}", "atr"); fs = 360
    beats = collections.Counter(s for s in a.symbol if s not in "+~|\"!x[]")
    rh = collections.defaultdict(float); cur = None; t0 = 0
    for s, aux, t in zip(a.symbol, a.aux_note, a.sample):
        if s == "+" and aux:
            if cur: rh[cur] += (t - t0) / fs
            cur, t0 = aux.strip("\x00").strip(), t
    if cur: rh[cur] += (650000 - t0) / fs
    print(r, dict(beats.most_common(6)), {k: round(v) for k, v in sorted(rh.items(), key=lambda kv: -kv[1])})
