import json, os, shutil, subprocess, sys, tempfile, time, importlib.util, sqlite3
work, base = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
def load(d, name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(d, "server.py")); m = importlib.util.module_from_spec(spec)
    cwd = os.getcwd(); os.chdir(d); sys.path.insert(0, d)
    try: spec.loader.exec_module(m)
    finally: os.chdir(cwd); sys.path.pop(0)
    return m
def norm(rows): return json.dumps(rows, sort_keys=True, default=str)
res = {"metrics": {}, "assertions": []}
try:
    tmp = tempfile.mkdtemp(); dbb, dbw = os.path.join(tmp, "b.db"), os.path.join(tmp, "w.db")
    subprocess.run([sys.executable, os.path.join(base, "make_db.py"), dbb], check=True, capture_output=True)
    shutil.copy(dbb, dbw)
    B, W = load(base, "srv_base"), load(work, "srv_work")
    cb, cw = B.open_db(dbb), W.open_db(dbw)
    t = time.time(); rb = B.get_dashboard(cb, 3); tb = time.time() - t
    W.get_dashboard(cw, 3)                                  # warm (index build / first call)
    tw = 1e9
    for _ in range(3):
        t = time.time(); rw = W.get_dashboard(cw, 3); tw = min(tw, time.time() - t)
    same = norm(rb) == norm(rw)
    same_all = all(norm(B.get_dashboard(cb, w)) == norm(W.get_dashboard(cw, w)) for w in (1, 8))
    # freshness: a new alert and a new vital written by another connection must show on the very next call
    pid = rw[0]["patient_id"]
    ext = sqlite3.connect(dbw); ext.execute("insert into alerts(patient_id,ts,level,message,acked) values(?,?,?,?,0)", (pid, 1_999_999_999, "crit", "check-fresh")); ext.execute("insert into vitals(patient_id,ts,hr,spo2) values(?,?,?,?)", (pid, 1_999_999_999, 33, 77)); ext.commit(); ext.close()
    r2 = W.get_dashboard(cw, 3); p0 = [p for p in r2 if p["patient_id"] == pid][0]
    fresh_alert = any(a.get("message") == "check-fresh" for a in p0["open_alerts"]); fresh_vital = p0["hr"] == 33
    res["metrics"] = {"baseline_ms": round(tb * 1000), "after_ms": round(tw * 1000, 1), "speedup": round(tb / max(tw, 1e-6), 1)}
    res["assertions"] = [
     {"text": "get_dashboard returns exactly the same data as the original for three wards", "passed": same and same_all, "evidence": f"ward3 {same}, wards1/8 {same_all}"},
     {"text": "a newly inserted open alert appears on the very next call (5-second alarm requirement not broken by caching)", "passed": fresh_alert, "evidence": str(fresh_alert)},
     {"text": "a newly inserted vital sign appears on the next call", "passed": fresh_vital, "evidence": str(fresh_vital)},
     {"text": "a warm get_dashboard call is at least 20x faster than the original", "passed": tb / max(tw, 1e-6) >= 20, "evidence": f"{tb*1000:.0f} ms -> {tw*1000:.1f} ms"}]
except Exception as e:
    res["assertions"] = [{"text": "server.py still provides open_db(path) and get_dashboard(conn, ward_id) and runs", "passed": False, "evidence": repr(e)[:500]}]
print(json.dumps(res, ensure_ascii=False))
