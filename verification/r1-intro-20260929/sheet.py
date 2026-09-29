"""Contact sheet of captured frames: python sheet.py <label> [cols]  → sheet-<label>.jpg"""
import glob, os, sys
from PIL import Image, ImageDraw
here = os.path.dirname(os.path.abspath(__file__))
label = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4
files = sorted(glob.glob(os.path.join(here, 'frames', label + '-*.jpg')))
w, h = 480, 270
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 22)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 5), os.path.basename(f)[len(label) + 1:-4], fill=(220, 220, 220))
sheet.save(os.path.join(here, f'sheet-{label}.jpg'), quality=85)
print(len(files), 'frames')
