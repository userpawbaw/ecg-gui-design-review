#!/usr/bin/env python3
"""h1 check: python3 check.py <workdir> <baseline_files_dir>

Interface checked: `python3 catalog_loader.py <in.cat> <out.json>` run inside the work dir.
Expected output = what the untouched baseline produces for the same (hidden) input.
Every timed run uses a different input file in a fresh directory, so result caches cannot help.
"""
import json, os, shutil, subprocess, sys, tempfile, time

work, base = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
SEEDS = [20261, 20262, 20263]
N = 5000
EDGE = '''# edge cases
[item]
sku = "zz-0001"
name = "He said \\"hi\\" # not a comment"
price = -3.50
stock = 0
tags = [a, "b c", 3, travel-kit]
note = "line1\\nline2\\ttab \\\\ end"

[item]
sku="ZZ-0002"   # tight
name="[item]"
tags=[]
weird_key-1 = word-value
\r
[item]
sku = "Zz-0001"
price = 4
tags = [only]
[item]
sku = "ZZ-0003"
[item]
sku = "zz-0002"
name = "renamed = yes"
extra = 12
'''


def run(dirpath, src, dst):
    t = time.perf_counter()
    p = subprocess.run([sys.executable, "catalog_loader.py", src, dst], cwd=dirpath, capture_output=True, text=True, timeout=300)
    dt = time.perf_counter() - t
    if p.returncode != 0 or not os.path.exists(dst):
        return dt, None, (p.stderr or p.stdout)[-300:]
    try:
        with open(dst, encoding="utf-8") as f:
            return dt, json.load(f), ""
    except Exception as e:
        return dt, None, repr(e)


def main():
    tmp = tempfile.mkdtemp(prefix="h1chk_")
    asserts, metrics = [], {}
    try:
        inputs = []
        for s in SEEDS:
            d = os.path.join(tmp, "in%d" % s); os.makedirs(d)
            path = os.path.join(d, "catalog_%d.cat" % s)
            subprocess.run([sys.executable, os.path.join(base, "make_sample.py"), path, str(N), str(s)], check=True, timeout=120)
            inputs.append(path)
        edge = os.path.join(tmp, "edge.cat")
        with open(edge, "w", encoding="utf-8", newline="") as f:
            f.write(EDGE)

        bt, wt, same, detail = [], [], [], []
        for i, path in enumerate(inputs):
            t, exp, err = run(base, path, os.path.join(tmp, "exp%d.json" % i))
            if exp is None:
                raise RuntimeError("baseline failed: " + err)
            bt.append(t)
            best = None
            got = None
            for rep in range(2):
                # copy to a new name each time: a cache keyed on path or mtime never hits
                d = os.path.join(tmp, "w%d_%d" % (i, rep)); os.makedirs(d)
                src = os.path.join(d, "c%d_%d.cat" % (i, rep)); shutil.copy(path, src)
                t, got, err = run(work, src, os.path.join(d, "out.json"))
                if got is None:
                    detail.append("seed %d: run failed: %s" % (SEEDS[i], err)); break
                best = t if best is None else min(best, t)
            if best is not None:
                wt.append(best)
            ok = got is not None and got == exp
            same.append(ok)
            if got is not None and not ok:
                detail.append("seed %d: output differs (len %d vs %d)" % (SEEDS[i], len(got), len(exp)))
        _, eexp, err = run(base, edge, os.path.join(tmp, "edge_exp.json"))
        _, egot, eerr = run(work, edge, os.path.join(tmp, "edge_got.json"))
        edge_ok = eexp is not None and egot == eexp

        metrics["baseline_best_s"] = round(min(bt), 3)
        metrics["work_best_s"] = round(min(wt), 3) if wt else None
        speed = (min(bt) / min(wt)) if wt else 0.0
        metrics["speedup"] = round(speed, 2)
        allsame = all(same) and len(same) == len(inputs)
        asserts.append({"text": "Output JSON equals the baseline output on 3 hidden catalogs (order and values)", "passed": allsame,
                        "evidence": "; ".join(detail) or "all equal"})
        asserts.append({"text": "Output JSON equals the baseline output on the hand-written edge-case catalog (escapes, comments in strings, case-insensitive SKU merge, CR, lists)",
                        "passed": edge_ok, "evidence": "equal" if edge_ok else ("differs or failed: " + (eerr or "content differs"))})
        asserts.append({"text": "Load time improved at all: speedup >= 1.5x vs baseline with correct output", "passed": allsame and speed >= 1.5,
                        "evidence": "speedup %.2fx (baseline %.2fs, work %.3fs)" % (speed, min(bt), min(wt) if wt else -1)})
        asserts.append({"text": "Both hot spots removed: speedup >= 6x vs baseline with correct output (fixing only one of the two gives at most ~2.6x; reference ~25x)",
                        "passed": allsame and speed >= 6.0, "evidence": "speedup %.2fx" % speed})
    except Exception as e:
        asserts.append({"text": "check.py completed", "passed": False, "evidence": repr(e)[:400]})
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(json.dumps({"metrics": metrics, "assertions": asserts}, ensure_ascii=False))


main()
