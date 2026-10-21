"""Light diversity metrics per preview image (D-154): pool (>= +1.5 stops from the median), dark (<= -1 stop), lit blobs, sharp / soft edge share, 5-95 % stop range, median stops of the left / middle / right thirds and right − left (REF-002 zone B, D-155). Usage: python scripts/assets/light-diversity-metrics.py DIR [DIR…] → CSV."""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as nd
def lum(p):
    a = np.asarray(Image.open(p).convert('RGB'), dtype=np.float64) / 255
    a = np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)
    return a @ [.2126, .7152, .0722]
print('dir,file,mean,pool%,dark%,blobs,sharp%,soft%,range95_5,left,mid,right,R-L')
for d in sys.argv[1:]:
    for f in sorted(os.listdir(d)):
        if not f.endswith('.png'): continue
        Y = lum(os.path.join(d, f)) + 1e-4; st = np.log2(Y / np.median(Y))
        pool = st >= 1.5; dark = st <= -1.0
        lab, n = nd.label(nd.binary_opening(st >= 1.0, iterations=1)); sizes = nd.sum(np.ones_like(st), lab, range(1, n + 1)) if n else []
        blobs = int(sum(1 for s in sizes if s > st.size * .002))
        g = np.hypot(*np.gradient(nd.gaussian_filter(st, 1)))          # stops per pixel
        edge = g > .08
        sharp = (g > .5).sum() / st.size * 100; soft = ((g > .08) & (g <= .25)).sum() / st.size * 100
        p5, p95 = np.percentile(st, [5, 95])
        w = st.shape[1] // 3; L, M, R = (float(np.median(st[:, i * w:(i + 1) * w])) for i in range(3))   # D-155 zones: median stops per third
        print(f'{os.path.basename(d)},{f[:-4]},{Y.mean():.3f},{pool.mean()*100:.1f},{dark.mean()*100:.1f},{blobs},{sharp:.1f},{soft:.1f},{p95-p5:.2f},{L:.2f},{M:.2f},{R:.2f},{R-L:.2f}')
