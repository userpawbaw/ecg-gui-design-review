"""Contact sheet: python verification/r1-figure-v3-web-20261003/sheet.py OUT.jpg COLS img1 [img2 ...] (caption = file stem)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W = 800
tiles = []
for f in files:
    im = Image.open(f).convert('RGB'); h = round(im.height * W / im.width); im = im.resize((W, h), Image.LANCZOS)
    t = Image.new('RGB', (W, h + 26), (14, 15, 18)); t.paste(im, (0, 26))
    ImageDraw.Draw(t).text((8, 6), Path(f).stem, fill=(235, 235, 235)); tiles.append(t)
rows = (len(tiles) + cols - 1) // cols; th = max(t.height for t in tiles)
sheet = Image.new('RGB', (cols * W + (cols - 1) * 10, rows * th + (rows - 1) * 10), (14, 15, 18))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * (W + 10), (i // cols) * (th + 10)))
sheet.save(out, quality=86)
