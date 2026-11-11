"""Ward dashboard backend (excerpt).

    conn = open_db("ward.db")
    get_dashboard(conn, ward_id) -> list of patient dicts, ordered by bed
"""
import sqlite3


def open_db(path="ward.db"):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def get_dashboard(conn, ward_id):
    out = []
    patients = conn.execute("select * from patients where ward_id = ? order by bed", (ward_id,)).fetchall()
    for p in patients:
        latest = conn.execute(
            "select hr, spo2, ts from vitals where patient_id = ? order by ts desc limit 1", (p["id"],)
        ).fetchone()
        alerts = conn.execute(
            "select id, level, message, ts from alerts where patient_id = ? and acked = 0 order by ts desc", (p["id"],)
        ).fetchall()
        out.append({
            "patient_id": p["id"],
            "name": p["name"],
            "bed": p["bed"],
            "hr": latest["hr"] if latest else None,
            "spo2": latest["spo2"] if latest else None,
            "vitals_ts": latest["ts"] if latest else None,
            "open_alerts": [dict(a) for a in alerts],
        })
    return out


if __name__ == "__main__":
    import time
    conn = open_db()
    t = time.time()
    rows = get_dashboard(conn, 3)
    print(f"{len(rows)} patients in {(time.time() - t) * 1000:.0f} ms")
