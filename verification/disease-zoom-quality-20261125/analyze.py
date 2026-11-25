# 정석(full) 대 빠른 길(fast) 같은 확대 순간 비교: 평균 절대 차이, PSNR, 선 선명도(밝기 기울기 에너지 비), 크게 다른 화소 비율
import sys, glob, numpy as np
from PIL import Image, ImageFilter
def load(f):
    a = Image.open(f).convert('RGBA'); bg = Image.new('RGBA', a.size, (10, 26, 33, 255))
    return np.asarray(Image.alpha_composite(bg, a).convert('RGB')).astype(np.float32)
def grad(x):
    L = x.mean(2); gx = np.abs(np.diff(L, axis=1))[:-1]; gy = np.abs(np.diff(L, axis=0))[:, :-1]; return (gx + gy).mean()
for d in sys.argv[1:]:
    for e in ('0', '0.25', '0.5', '0.75', '1'):
        A, B = load(f'{d}_e{e}_full.png'), load(f'{d}_e{e}_fast.png')
        A, B = A[:, 72:-18], B[:, 72:-18]              # 그래프 칸(왼쪽 눈금 글자 제외)
        diff = np.abs(A - B); mse = (diff ** 2).mean(); psnr = 10 * np.log10(255 ** 2 / max(mse, 1e-9))
        big = (diff.max(2) > 40).mean() * 100
        print(f'{d} e={e:4s}  평균 차이 {diff.mean():5.2f}/255 · PSNR {psnr:5.1f} dB · 크게 다른 화소(>40) {big:5.2f} % · 선명도 비(빠른/정석) {grad(B) / grad(A):.3f}')
