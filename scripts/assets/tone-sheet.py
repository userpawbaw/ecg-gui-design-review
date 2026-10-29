"""Two-column comparison sheet with frame-tone-stats.py numbers under each label (used for every archive art round, D-058 … D-062).
Run: python scripts/assets/tone-sheet.py out.jpg "label|frame.png" "label|frame.png@x0,y0,x1,y1" ...
Reference frames are analysis input only — never commit them; label them "analysis only, not an asset".
"""
import os, subprocess, sys
from PIL import Image, ImageDraw

STATS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frame-tone-stats.py')
out, W, rows = sys.argv[1], 800, []
for a in sys.argv[2:]:
    lab, p = a.split('|', 1); box = None
    if '@' in p: p, b = p.rsplit('@', 1); box = tuple(int(v) for v in b.split(','))
    r = subprocess.run([sys.executable, STATS, p] + (['--box', ','.join(map(str, box))] if box else []), capture_output=True, text=True).stdout
    st = r.split(' ', 1)[1].strip() if r else ''
    im = Image.open(p).convert('RGB'); im = im.crop(box) if box else im
    rows.append((lab, st, im.resize((W, int(W * im.height / im.width)))))
h = max(r[2].height for r in rows) + 40
S = Image.new('RGB', (2 * W, h * ((len(rows) + 1) // 2)), 'black'); d = ImageDraw.Draw(S)
for i, (lab, st, im) in enumerate(rows):
    x, y = (i % 2) * W, (i // 2) * h; S.paste(im, (x, y + 40)); d.text((x + 6, y + 4), lab, fill=(255, 220, 120)); d.text((x + 6, y + 20), st.replace("'", '')[:150], fill=(200, 220, 255))
S.save(out, quality=86); print(out, S.size)
