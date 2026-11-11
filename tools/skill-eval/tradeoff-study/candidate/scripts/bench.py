#!/usr/bin/env python3
"""Repeatable timing with a noise estimate.

  python3 bench.py [--runs 7] [--warmup 1] [--label NAME] [--save FILE] -- <command...>
  python3 bench.py --compare BEFORE.json AFTER.json

Prints median, min, max and spread (max-min)/median, and saves the samples when --save is given.
--compare says whether two saved results differ by more than their combined run-to-run spread.
"""
import json, statistics, subprocess, sys, time


def measure(cmd, runs, warmup):
    for _ in range(warmup):
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    samples = []
    for _ in range(runs):
        t = time.perf_counter()
        p = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        samples.append(time.perf_counter() - t)
        if p.returncode != 0:
            sys.exit(f"command failed (exit {p.returncode}): {p.stderr.decode(errors='replace')[-400:]}")
    return samples


def summary(s):
    med = statistics.median(s)
    return {"median_s": med, "min_s": min(s), "max_s": max(s), "spread": (max(s) - min(s)) / med if med else 0.0, "runs": len(s)}


def main(argv):
    if "--compare" in argv:
        i = argv.index("--compare")
        a, b = (json.load(open(p, encoding="utf-8")) for p in argv[i + 1:i + 3])
        ratio = a["median_s"] / b["median_s"] if b["median_s"] else float("inf")
        overlap = not (a["min_s"] > b["max_s"] or b["min_s"] > a["max_s"])
        verdict = "within noise: do not claim a difference" if overlap else ("after is faster" if ratio > 1 else "after is slower")
        print(f"before {a['median_s']*1000:.1f} ms (spread {a['spread']:.0%}, n={a['runs']})  after {b['median_s']*1000:.1f} ms (spread {b['spread']:.0%}, n={b['runs']})")
        print(f"ratio before/after {ratio:.2f}x  ->  {verdict}")
        return
    if "--" not in argv:
        sys.exit(__doc__)
    opts, cmd = argv[:argv.index("--")], argv[argv.index("--") + 1:]
    get = lambda k, d: opts[opts.index(k) + 1] if k in opts else d
    runs, warmup = int(get("--runs", 7)), int(get("--warmup", 1))
    s = summary(measure(cmd, runs, warmup))
    s["label"], s["command"] = get("--label", ""), cmd
    print(f"{s['label'] or ' '.join(cmd)}: median {s['median_s']*1000:.1f} ms, min {s['min_s']*1000:.1f}, max {s['max_s']*1000:.1f}, spread {s['spread']:.0%}, n={runs} (+{warmup} warm-up)")
    if "--save" in opts:
        json.dump(s, open(get("--save", "bench.json"), "w", encoding="utf-8"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
