# D-198 A안 측정: 같은 입력에서 추론 간격(hop) 16 · 32 · 48 의 출력 차이와 계산 시간
# 원본 저장소의 StreamProcessor · build_stream_method 를 그대로 쓴다(브리지와 같은 경로: front-end 한 번 → 처리기 frontend 없음).
# 사용: python hop_compare.py <원본 저장소> [초]
import sys, time
src = sys.argv[1]; sec = float(sys.argv[2]) if len(sys.argv) > 2 else 40
sys.path.insert(0, src + '/scripts'); sys.argv = [sys.argv[0]]
import serial_bridge as sb   # _bootstrap 가 cwd · import path 를 원본 루트로
import numpy as np, torch
from ecgdn.config import FS
from ecgdn.data.synthetic import synth_ecg
from ecgdn.data.noise import mixed_noise
from ecgdn.data.mixer import mix_at_snr
from ecgdn.realtime.frontend_modes import build_fe
from ecgdn.realtime.stream import StreamProcessor
torch.set_num_threads(2)
g = np.random.default_rng(13)
clean = synth_ecg(duration_s=sec, fs=FS, seed=7).x
noise, _ = mixed_noise(clean.size, FS, g)
x, _, _ = mix_at_snr(clean, noise, 0.0)
fe = build_fe('zerophase', FS); xf = np.concatenate([fe.push(x[i:i + 25]) for i in range(0, x.size, 25)])
lag = x.size - xf.size
print(f'신호 {sec:.0f} s, front-end 출력 {xf.size} 표본(늦음 {lag})')
for m in ['M04', 'M06', 'M08', 'M09']:
    try: meth = sb.build_stream_method(m, 'd1')
    except Exception as e: print(m, '건너뜀:', e); continue
    outs = {}
    for hop in (16, 32, 48):
        sp = StreamProcessor(meth, fs=FS, hop=hop, d=12, frontend='none')
        t = time.perf_counter(); y = np.concatenate([sp.push(xf[j:j + 25]) for j in range(0, xf.size, 25)]); dt = time.perf_counter() - t
        outs[hop] = (y, sp.origin, dt)
    y16, o16, t16 = outs[16]
    # 참값(깨끗한 신호)과의 RMSE — 정렬 이동은 hop 16 에서 찾아 모든 hop 에 같게 씀
    def err(y, o, sh): o = int(o); i = np.arange(int(2 * FS), y.size); j = o + i + sh; ok = (j >= 0) & (j < clean.size); return float(np.sqrt(np.mean((y[i[ok]] - clean[j[ok]]) ** 2)))
    sh = min(range(-300, 301), key=lambda k: err(y16, o16, k))
    for hop, (y, o, dt) in outs.items():
        o, o16 = int(o), int(o16); lo = max(o, o16) + int(2 * FS); hi = min(o + y.size, o16 + y16.size)   # 절대 표본 위치(origin)로 맞추고 앞 2 s(준비)는 뺌
        a, b = y16[lo - o16:hi - o16], y[lo - o:hi - o]
        rms = lambda v: float(np.sqrt(np.mean(v ** 2)))
        print(f'{m} hop {hop:2d}: 계산 {dt / sec:.3f} s/s(실시간 대비) · hop16 과 차이 RMS {rms(a - b) * 1000:.2f} µV(신호 RMS {rms(a) * 1000:.0f} µV, {rms(a - b) / rms(a) * 100:.2f} %) · 최대 {np.max(np.abs(a - b)) * 1000:.1f} µV · 참값 RMSE {err(y, o, sh) * 1000:.1f} µV · 지연 +{(hop - 16) / FS * 1000:.0f} ms')
