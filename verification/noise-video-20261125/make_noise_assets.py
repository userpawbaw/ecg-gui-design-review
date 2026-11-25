# D-196: 잡음 장면 렌더 프레임(render_noise.cjs) → data/noise-video/
#   <cond>_in.mp4    장면 시작 → 카메라가 멈춘 뒤 1 s(프레임 0 … h+29, h = 멈춤 시각 인덱스)
#   <cond>_loop.mp4  반복 원본 L_i = 프레임 h+i(i = 0 … T·fps+29) → L[30 … T·fps−1] + (L[T·fps+j]를 L[j]로 교차 페이드, j < fps)
#                    → 반복의 처음 = 멈춤 + 1 s(= 들어옴 영상의 다음 장), 끝 = 멈춤 + 1 s 직전(이음매 없음 — 먼지 · 입자만 섞임)
#   ma_out.mp4       근육 장면 나가기(크레인 4 s)
#   manifest.json    장면 시작 · 멈춤 시각, 반복 주기 T(신호 길이 10 s)
# 사용: python3 make_noise_assets.py <frames dir(pli/ bw/ ma/)> <out dir>
import json, os, shutil, subprocess, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
T = 10.0

def enc(pattern, dst, crf=21):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pattern, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
                    '-pix_fmt', 'yuv420p', '-g', '9999', '-x264-params', 'scenecut=0:ipratio=1.0:pbratio=1.0', '-movflags', '+faststart', dst], check=True)   # 키프레임 처음 한 장(도입부와 같은 이유)

man = {'scenes': {}}
for c in ('pli', 'bw', 'ma'):
    d = os.path.join(src, c); meta = json.load(open(os.path.join(d, 'meta.json'), encoding='utf-8'))
    FPS = meta['FPS']; man.update(W=meta['W'], H=meta['H'], FPS=FPS, T=T)
    fr = sorted(x for x in os.listdir(d) if x.startswith('s') and x.endswith('.jpg'))
    h = round((meta['hold'] - meta['start']) * FPS); n = int(T * FPS)
    assert len(fr) >= h + n + FPS, (c, len(fr), h + n + FPS)
    tmp = os.path.join(d, '_tmp'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    for i in range(h + FPS): shutil.copy(os.path.join(d, fr[i]), os.path.join(tmp, f'i{i:05d}.jpg'))
    enc(os.path.join(tmp, 'i%05d.jpg'), os.path.join(out, f'{c}_in.mp4'))
    L = lambda i: Image.open(os.path.join(d, fr[h + i])).convert('RGB')
    k = 0
    for i in range(FPS, n): L(i).save(os.path.join(tmp, f'l{k:05d}.png')); k += 1
    for j in range(FPS): Image.blend(L(n + j), L(j), (j + 1) / FPS).save(os.path.join(tmp, f'l{k:05d}.png')); k += 1
    enc(os.path.join(tmp, 'l%05d.png'), os.path.join(out, f'{c}_loop.mp4'))
    sm = {'start': meta['start'], 'hold': meta['hold']}
    if meta.get('out'):
        enc(os.path.join(d, 'o%05d.jpg'), os.path.join(out, f'{c}_out.mp4')); sm['out'] = meta['out']
    man['scenes'][c] = sm; shutil.rmtree(tmp)
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', man, {f: os.path.getsize(os.path.join(out, f)) for f in sorted(os.listdir(out)) if f.endswith('.mp4')})
