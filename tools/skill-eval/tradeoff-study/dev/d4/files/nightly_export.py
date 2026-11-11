"""Nightly export of the day's orders for the accounting team. Usage: python3 nightly_export.py -> export.csv"""
import csv


def load(path="orders.csv"):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def summarize(orders):
    customers = []
    for o in orders:
        if o["customer"] not in customers:
            customers.append(o["customer"])
    rows = []
    for c in sorted(customers):
        total = 0.0
        items = 0
        for o in orders:
            if o["customer"] == c:
                total += int(o["qty"]) * float(o["price"])
                items += int(o["qty"])
        rows.append({"customer": c, "items": items, "total": f"{total:.2f}"})
    return rows


def main():
    rows = summarize(load())
    with open("export.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["customer", "items", "total"])
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
