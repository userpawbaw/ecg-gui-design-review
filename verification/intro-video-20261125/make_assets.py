# D-195: 렌더한 프레임(render_frames.cjs) → 도입부 영상 자료(data/intro-video/).
#   first.mp4   첫 화면 반복: 300장 중 30–269 + (270–299를 0–29와 교차 페이드) → 끝이 처음으로 이어짐(9 s)
#   descent.mp4 하강 331장(11 s)
#   idle.jpg + heart/hv*.webp · ha*.webp  심장 박동 프레임(쉬는 화면과 다른 영역만 잘라냄), first_poster.jpg, manifest.json
# 사용: python3 make_assets.py <frames dir(first/ descent/ heart/)> <out dir>
import json, os, shutil, subprocess, sys
from PIL import Image, ImageChops

src, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'heart'), exist_ok=True)
tmp = os.path.join(src, '_loop'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
meta = json.load(open(os.path.join(src, 'descent', 'meta_descent.json'), encoding='utf-8'))
FPS = meta['FPS']

# 첫 화면 반복
f = sorted(x for x in os.listdir(os.path.join(src, 'first')) if x.endswith('.jpg'))
assert len(f) == 10 * FPS, len(f)
fr = lambda i: Image.open(os.path.join(src, 'first', f[i])).convert('RGB')
n = 0
for i in range(FPS, 9 * FPS):
    fr(i).save(os.path.join(tmp, f'{n:05d}.png')); n += 1
for j in range(FPS):
    Image.blend(fr(9 * FPS + j), fr(j), (j + 1) / FPS).save(os.path.join(tmp, f'{n:05d}.png')); n += 1
fr(FPS).save(os.path.join(out, 'first_poster.jpg'), quality=88)

def enc(pattern, dst, loop=False):
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pattern, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
           '-pix_fmt', 'yuv420p', '-g', str(FPS), '-movflags', '+faststart', dst]
    subprocess.run(cmd, check=True)
enc(os.path.join(tmp, '%05d.png'), os.path.join(out, 'first.mp4'), loop=True)
enc(os.path.join(src, 'descent', 'd%05d.jpg'), os.path.join(out, 'descent.mp4'))

# 심장 박동 프레임: 쉬는 화면과의 차이 영역(모든 프레임 합) + 여백 → 잘라서 WebP
hd = os.path.join(src, 'heart'); idle = Image.open(os.path.join(hd, 'hidle.jpg')).convert('RGB')
hv = sorted(x for x in os.listdir(hd) if x.startswith('hv')); ha = sorted(x for x in os.listdir(hd) if x.startswith('ha'))
box = None
for x in hv + ha:
    d = ImageChops.difference(Image.open(os.path.join(hd, x)).convert('RGB'), idle).convert('L').point(lambda v: 255 if v > 10 else 0)   # 박동 빛 둘레(문턱 10/255)
    b = d.getbbox()
    if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
M = 48; W, H = idle.size
box = (max(0, box[0] - M), max(0, box[1] - M), min(W, box[2] + M), min(H, box[3] + M))
idle.save(os.path.join(out, 'idle.jpg'), quality=90)
# 가장자리 40 px 투명 그라디언트 — 쉬는 화면 위에 겹칠 때 이음매가 없게
bw, bh = box[2] - box[0], box[3] - box[1]; F = 40
alpha = Image.new('L', (bw, bh)); ap = alpha.load()
for yy in range(bh):
    for xx in range(bw):
        ap[xx, yy] = int(255 * min(1, xx / F, (bw - 1 - xx) / F, yy / F, (bh - 1 - yy) / F))
for x in hv + ha:
    im = Image.open(os.path.join(hd, x)).convert('RGB').crop(box); im.putalpha(alpha)
    im.save(os.path.join(out, 'heart', x.replace('.jpg', '.webp')), quality=88)
man = {k: meta[k] for k in ('W', 'H', 'FPS', 'T0', 'AUTO_S', 'PV0', 'PVA')}
man['heart'] = {'x': box[0], 'y': box[1], 'w': box[2] - box[0], 'h': box[3] - box[1], 'hv': len(hv), 'ha': len(ha), 'aU0': .22}
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
shutil.rmtree(tmp)
print('ok', man, {x: os.path.getsize(os.path.join(out, x)) for x in ('first.mp4', 'descent.mp4', 'idle.jpg')})
