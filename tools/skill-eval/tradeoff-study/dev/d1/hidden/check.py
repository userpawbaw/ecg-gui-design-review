import json, os, shutil, subprocess, sys, tempfile, time
work, base = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
def run(src, n=1):
    d = tempfile.mkdtemp()
    for f in os.listdir(src):
        p = os.path.join(src, f)
        if os.path.isfile(p) and f.endswith(".py"): shutil.copy(p, d)
    shutil.copy(os.path.join(base, "make_data.py"), d)      # always the original generator
    subprocess.run([sys.executable, "make_data.py"], cwd=d, check=True, capture_output=True)
    best = 1e9; err = ""
    for _ in range(n):
        t = time.time(); p = subprocess.run([sys.executable, "report.py"], cwd=d, capture_output=True, text=True, timeout=600); best = min(best, time.time() - t)
        if p.returncode: err = p.stderr[-400:]
    out = None
    try: out = json.load(open(os.path.join(d, "report.json"), encoding="utf-8"))
    except Exception as e: err += str(e)
    return best, out, err
tb, ob, _ = run(base)
tw, ow, err = run(work, 3)
src = open(os.path.join(work, "report.py"), encoding="utf-8").read()
par = any(k in src for k in ("multiprocessing", "concurrent.futures", "ProcessPool", "threading"))
print(json.dumps({"metrics": {"baseline_s": round(tb, 2), "after_s": round(tw, 3), "speedup": round(tb / max(tw, 1e-6), 1), "uses_parallelism": par},
 "assertions": [
  {"text": "report.json is identical to the original program's output", "passed": ob == ow and ow is not None, "evidence": err or "equal" if ob == ow else "differs " + err},
  {"text": "report.py runs at least 20x faster than the original on the sample data", "passed": ow is not None and tb / max(tw, 1e-6) >= 20, "evidence": f"{tb:.2f}s -> {tw:.3f}s"},
  {"text": "the delivered report.py does not rely on multiprocessing/threads to get its speed", "passed": not par, "evidence": "parallel constructs found" if par else "none"}]}, ensure_ascii=False))
