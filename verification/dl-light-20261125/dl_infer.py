# 딥러닝 기법 추론 한 번(창 1024, 배치 1)의 CPU 시간: 그대로 · TorchScript 고정(freeze + optimize_for_inference) · torch 스레드 1/2,
# 그리고 고정 모델 출력이 그대로인지(최대 차이). 사용: python dl_infer.py <원본 저장소>
import sys, time
src = sys.argv[1]; sys.path.insert(0, src + '/scripts'); sys.argv = [sys.argv[0]]
import serial_bridge as sb
import numpy as np, torch
torch.manual_seed(0); x = torch.randn(1, 1, 1024)
def bench(m, n=60, threads=2):
    torch.set_num_threads(threads)
    with torch.inference_mode():
        for _ in range(5): m(x)
        c0, w0 = time.process_time(), time.perf_counter()
        for _ in range(n): m(x)
        return (time.process_time() - c0) / n * 1000, (time.perf_counter() - w0) / n * 1000
for name in ['M06', 'M06L6', 'M08', 'M09']:
    try: d = sb.build_stream_method(name, 'd1')
    except Exception as e: print(name, '건너뜀', e); continue
    m = d.model.eval()
    if getattr(m, 'needs_cond', False): print(name, '조건화 모델 — 건너뜀'); continue
    with torch.inference_mode(): y0 = m(x)
    try:
        with torch.no_grad(): fz = torch.jit.optimize_for_inference(torch.jit.freeze(torch.jit.trace(m, x).eval()))
        with torch.inference_mode(): y1 = fz(x)
        diff = float((y0 - y1).abs().max())
    except Exception as e: fz = None; diff = float('nan'); print(name, '고정 실패', type(e).__name__, str(e)[:120])
    r = []
    for th in (1, 2):
        c, w = bench(m, threads=th); r.append(f'그대로 스레드{th}: CPU {c:.1f} ms · 벽시계 {w:.1f} ms')
        if fz is not None: c, w = bench(fz, threads=th); r.append(f'고정 스레드{th}: CPU {c:.1f} ms · 벽시계 {w:.1f} ms')
    print(f'{name} (고정 출력 최대 차이 {diff:.2e})\n  ' + '\n  '.join(r), flush=True)
