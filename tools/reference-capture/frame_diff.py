"""Frame-to-frame change energy for a list of image files (OpenCV).
Usage: frame_diff.py <ticks.json> <out.json>
ticks.json: {"ticks": [{"file": "<path>", "rect": [left, top, width, height] | null}, ...]}
Output: one entry per tick (the first has nulls): all (mean abs RGB difference, 0-255, sampled every 2nd pixel),
regions (3x3 grid, row-major), local (inside the inflated rect), outside (everywhere else).
"""
import json
import sys

import cv2
import numpy as np

PAD = 40


def energy(prev, cur, rect):
    d = np.abs(prev[::2, ::2].astype(np.int16) - cur[::2, ::2].astype(np.int16)).mean(axis=2)
    h, w = d.shape
    regions = [round(float(d[r * h // 3:(r + 1) * h // 3, c * w // 3:(c + 1) * w // 3].mean()), 4) for r in range(3) for c in range(3)]
    out = {"all": round(float(d.mean()), 4), "regions": regions, "local": None, "outside": None}
    if rect:
        l, t, rw, rh = rect
        x0, y0 = max(0, int((l - PAD) / 2)), max(0, int((t - PAD) / 2))
        x1, y1 = min(w, int((l + rw + PAD) / 2)), min(h, int((t + rh + PAD) / 2))
        if x1 > x0 and y1 > y0:
            inside = d[y0:y1, x0:x1]
            n_in, n_all = inside.size, d.size
            out["local"] = round(float(inside.mean()), 4)
            out["outside"] = round(float((d.sum() - inside.sum()) / max(1, n_all - n_in)), 4)
    return out


def main():
    with open(sys.argv[1], encoding="utf-8") as f:
        ticks = json.load(f)["ticks"]
    res, prev, prev_file = [], None, None
    for t in ticks:
        if t["file"] == prev_file:
            res.append({"all": 0.0, "regions": [0.0] * 9, "local": 0.0 if t.get("rect") else None, "outside": 0.0 if t.get("rect") else None})
            continue
        img = cv2.imread(t["file"], cv2.IMREAD_COLOR)
        if img is None:
            raise SystemExit("cannot read " + t["file"])
        res.append(energy(prev, img, t.get("rect")) if prev is not None else {"all": None, "regions": None, "local": None, "outside": None})
        prev, prev_file = img, t["file"]
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(res, f)


main()
