"""Builds ward.db with sample data. Deterministic. Usage: python3 make_db.py [path]"""
import random, sqlite3, sys, os
path = sys.argv[1] if len(sys.argv) > 1 else "ward.db"
if os.path.exists(path): os.remove(path)
random.seed(11)
c = sqlite3.connect(path)
c.executescript("""
create table patients(id integer primary key, ward_id integer, name text, bed text);
create table vitals(id integer primary key, patient_id integer, ts integer, hr integer, spo2 integer);
create table alerts(id integer primary key, patient_id integer, ts integer, level text, message text, acked integer default 0);
""")
pid = 0
for ward in range(1, 9):
    for b in range(40):
        pid += 1
        c.execute("insert into patients values(?,?,?,?)", (pid, ward, f"P{pid:04d}", f"{ward}-{b:02d}"))
rows = [(random.randrange(1, pid + 1), 1_700_000_000 + i * 7, random.randrange(45, 150), random.randrange(85, 100)) for i in range(400_000)]
c.executemany("insert into vitals(patient_id,ts,hr,spo2) values(?,?,?,?)", rows)
al = [(random.randrange(1, pid + 1), 1_700_000_000 + random.randrange(0, 2_800_000), random.choice(["info", "warn", "crit"]), "auto", random.randrange(0, 2)) for _ in range(6000)]
c.executemany("insert into alerts(patient_id,ts,level,message,acked) values(?,?,?,?,?)", al)
c.commit(); c.close()
print("built", path)
