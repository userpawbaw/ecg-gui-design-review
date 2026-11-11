"""Generates the sample input (events.csv, users.csv). Deterministic."""
import random
random.seed(7)
N_EVENTS, N_USERS = 24000, 2500
kinds = ["view", "click", "purchase", "refund", "signup"]
with open("users.csv", "w", encoding="utf-8") as f:
    f.write("user_id,tier,region\n")
    for u in range(N_USERS):
        f.write(f"u{u:05d},{random.choice(['free','plus','pro'])},{random.choice(['kr','jp','us','eu'])}\n")
with open("events.csv", "w", encoding="utf-8") as f:
    f.write("event_id,user_id,kind,amount,ts\n")
    ids = []
    for i in range(N_EVENTS):
        if ids and random.random() < 0.08:
            eid = random.choice(ids)            # duplicate delivery of an earlier event
        else:
            eid = f"e{i:07d}"; ids.append(eid)
        f.write(f"{eid},u{random.randrange(N_USERS):05d},{random.choice(kinds)},{random.randrange(0, 50000)/100:.2f},2026-11-{1+i%28:02d}T{i%24:02d}:{i%60:02d}:00\n")
