"""Light structure maps (F-040, 2026-10-09): for each frame, three panels side by side — photo / stops (log2 luminance over the frame
median, blue −5 … green 0 … red +4) / room-scale stops (luminance blurred at 5 % of the height, so only the layout of light remains:
shade zones, pools, falloff). Prints the room-scale p10/50/90 and the share of the frame at ≥ +1.5 stops.
Used to compare our archive renders with the REF-002 attic frame: REF has one flat shade zone (left third), one coherent pool with
distance falloff, sun accents inside it.
Run: python scripts/assets/light-structure-maps.py out.jpg "label|frame.png" "label|frame.png@x0,y0,x1,y1" ...
Reference frames are analysis input only — never commit them; label any sheet that shows one "analysis only, not an asset".
"""
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

CM = np.array([[48, 18, 59], [70, 107, 227], [40, 187, 236], [49, 242, 153], [162, 252, 60], [237, 208, 58], [251, 128, 34], [210, 48, 5], [122, 4, 3]], float) / 255


def cmap(t):
    t = np.clip(t, 0, 1) * (len(CM) - 1); i = np.minimum(t.astype(int), len(CM) - 2); f = (t - i)[..., None]
    return CM[i] * (1 - f) + CM[i + 1] * f


def lin(im):
    a = np.asarray(im.convert('RGB')).astype(float) / 255
    return np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)


def maps(path, box=None, h=360):
    im = Image.open(path).convert('RGB')
    if box: im = im.crop(box)
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS); Y = lin(im) @ [.2126, .7152, .0722]; m = np.median(Y)
    st = np.log2(np.maximum(Y, 1e-5) / m); sb = np.log2(np.maximum(gaussian_filter(Y, .05 * h), 1e-5) / m)
    as_img = lambda x: Image.fromarray((cmap((x + 5) / 9) * 255).astype(np.uint8))
    return im, as_img(st), as_img(sb), sb


if __name__ == '__main__':
    out, rows = sys.argv[1], []
    for a in sys.argv[2:]:
        lab, p = a.split('|', 1); box = None
        if '@' in p: p, b = p.rsplit('@', 1); box = tuple(int(v) for v in b.split(','))
        im, fs, fr, sb = maps(p, box); rows.append((lab, im, fs, fr))
        print(f'{lab}: room-scale stops p10/50/90 {np.percentile(sb, 10):.1f} {np.percentile(sb, 50):.1f} {np.percentile(sb, 90):.1f}, share >= +1.5 stops {(sb >= 1.5).mean() * 100:.0f} %')
    W, H = 640, 380; S = Image.new('RGB', (3 * W + 20, H * len(rows)), 'black'); d = ImageDraw.Draw(S)
    for i, (lab, *ims) in enumerate(rows):
        for j, x in enumerate(ims): S.paste(x.resize((W, 360)), (j * (W + 10), i * H + 20))
        d.text((4, i * H + 4), lab + '   |   photo / stops / room-scale stops', fill=(255, 220, 120))
    S.save(out, quality=85); print(out, S.size)
