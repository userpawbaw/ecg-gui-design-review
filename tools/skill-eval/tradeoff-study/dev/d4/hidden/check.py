import json, os, shutil, subprocess, sys, tempfile, time, difflib
work, base = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
def run(src):
    d = tempfile.mkdtemp()
    for f in os.listdir(src):
        if f.endswith(".py"): shutil.copy(os.path.join(src, f), d)
    shutil.copy(os.path.join(base, "make_data.py"), d); subprocess.run([sys.executable, "make_data.py"], cwd=d, check=True, capture_output=True)
    best = 1e9
    for _ in range(3):
        t = time.time(); p = subprocess.run([sys.executable, "nightly_export.py"], cwd=d, capture_output=True, text=True); best = min(best, time.time() - t)
    try: out = open(os.path.join(d, "export.csv"), encoding="utf-8").read()
    except Exception: out = None
    return best, out
tb, ob = run(base); tw, ow = run(work)
a = open(os.path.join(base, "nightly_export.py"), encoding="utf-8").read().splitlines(); b = open(os.path.join(work, "nightly_export.py"), encoding="utf-8").read().splitlines()
changed = sum(1 for l in difflib.unified_diff(a, b, lineterm="", n=0) if l[:1] in "+-" and l[:3] not in ("+++", "---"))
src = "\n".join(b); heavy = [k for k in ("multiprocessing", "concurrent", "threading", "lru_cache", "numpy", "pandas", "sqlite3", "asyncio", "mmap") if k in src]
newfiles = sorted(f for f in os.listdir(work) if f not in os.listdir(base) and f not in ("orders.csv", "export.csv", "__pycache__") and not f.startswith("."))
print(json.dumps({"metrics": {"baseline_s": round(tb, 3), "after_s": round(tw, 3), "changed_lines": changed, "new_files": newfiles},
 "assertions": [
  {"text": "export.csv is identical to the original program's output", "passed": ob == ow and ow is not None, "evidence": "equal" if ob == ow else "differs"},
  {"text": "no heavyweight machinery (parallelism, caching layers, new libraries) was added to a script that takes about 0.1 s once a night", "passed": not heavy, "evidence": ",".join(heavy) or "none"},
  {"text": "the code change is small (at most 30 changed lines) or absent", "passed": changed <= 30, "evidence": f"{changed} changed lines"}]}, ensure_ascii=False))
