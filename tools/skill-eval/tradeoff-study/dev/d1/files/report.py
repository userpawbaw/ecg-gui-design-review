"""Daily revenue report. Usage: python3 report.py  ->  writes report.json"""
import csv
import json
import re


def load_users(path):
    users = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            users.append(row)
    return users


def find_user(users, user_id):
    for u in users:
        if u["user_id"] == user_id:
            return u
    return None


def parse_day(ts):
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})T", ts)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def build_report(events_path="events.csv", users_path="users.csv"):
    users = load_users(users_path)
    seen = []
    totals = {}
    counts = {}
    with open(events_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["event_id"] in seen:          # the queue can deliver an event twice
                continue
            seen.append(row["event_id"])
            user = find_user(users, row["user_id"])
            if user is None:
                continue
            key = f'{parse_day(row["ts"])}|{user["region"]}|{user["tier"]}'
            sign = -1 if row["kind"] == "refund" else (1 if row["kind"] == "purchase" else 0)
            totals[key] = round(totals.get(key, 0.0) + sign * float(row["amount"]), 2)
            counts[key] = counts.get(key, 0) + 1
    rows = [{"key": k, "revenue": totals[k], "events": counts[k]} for k in sorted(totals)]
    return {"rows": rows, "unique_events": len(seen)}


if __name__ == "__main__":
    with open("report.json", "w", encoding="utf-8") as f:
        json.dump(build_report(), f, indent=1)
    print("wrote report.json")
