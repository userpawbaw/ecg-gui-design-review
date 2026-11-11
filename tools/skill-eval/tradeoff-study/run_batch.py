#!/usr/bin/env python3
"""python3 run_batch.py <set:dev|heldout> <iteration> <configs,comma> [cases,comma] [runs]  — runs cases in parallel (4 at a time), then exec checks."""
import subprocess, sys, pathlib, concurrent.futures as cf
here = pathlib.Path(__file__).resolve().parent
st, it, configs = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
cases = sys.argv[4].split(",") if len(sys.argv) > 4 and sys.argv[4] != "all" else sorted(p.name for p in (here / st).iterdir() if (p / "prompt.md").exists())
runs = int(sys.argv[5]) if len(sys.argv) > 5 else 1
jobs = [(c, g, r) for c in cases for g in configs for r in range(1, runs + 1)]
def go(j):
    c, g, r = j; out = here / "runs" / it / c / g / f"run-{r}"
    if (out / "final.md").exists() and (out / "final.md").stat().st_size > 0: return f"skip {c} {g} {r}"
    try:
        a = subprocess.run([sys.executable, str(here / "run_case.py"), str(here / st / c), g, str(out)], capture_output=True, text=True, timeout=1800)
        b = subprocess.run([sys.executable, str(here / "grade_exec.py"), str(here / st / c), str(out)], capture_output=True, text=True, timeout=1000)
        return (a.stdout.strip() or a.stderr[-300:]) + (" | " + b.stdout.strip() if st == "dev" else " | exec check done")
    except Exception as e: return f"ERR {c} {g} {r} {e!r}"
with cf.ThreadPoolExecutor(4) as ex:
    for res in ex.map(go, jobs): print(res, flush=True)
