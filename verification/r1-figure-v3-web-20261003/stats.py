"""Image statistics for stills vs web (method: handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md §3).
python stats.py a.png b.jpg ... → mean luma, p5/p50/p95, mean HSV saturation, mean R−B (0–255)."""
import sys, json, os
import numpy as np
from PIL import Image
def stats(f):
    a = np.asarray(Image.open(f).convert('RGB').resize((640, 360)), dtype=np.float32)
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(-1), a.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return dict(mean=round(float(y.mean()), 1), p5=int(np.percentile(y, 5)), p50=int(np.percentile(y, 50)), p95=int(np.percentile(y, 95)),
                sat=round(float(sat.mean()), 3), warm=round(float((a[..., 0] - a[..., 2]).mean()), 1))
if __name__ == '__main__':
    for f in sys.argv[1:]: print(json.dumps({'file': os.path.basename(f), **stats(f)}))
