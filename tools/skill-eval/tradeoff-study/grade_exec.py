#!/usr/bin/env python3
"""Run a case's hidden/check.py against a finished run and store the result as exec_check.json."""
import json, subprocess, sys, pathlib
case, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
chk = case / "hidden" / "check.py"
if not chk.exists(): print("{}"); sys.exit(0)
p = subprocess.run([sys.executable, "-I", str(chk), str(out / "work"), str(case / "files")], capture_output=True, text=True, timeout=900)
try: r = json.loads(p.stdout.strip().splitlines()[-1])
except Exception: r = {"metrics": {}, "assertions": [{"text": "check.py ran", "passed": False, "evidence": (p.stdout + p.stderr)[-800:]}]}
(out / "exec_check.json").write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps({"case": case.name, "metrics": r.get("metrics"), "pass": [a["passed"] for a in r.get("assertions", [])]}, ensure_ascii=False))
