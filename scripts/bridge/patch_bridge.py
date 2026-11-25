# D-198 (C): 원본 브리지(scripts/serial_bridge.py)에 실행 시 덧대는 패치. 원본 저장소는 건드리지 않고 바꾼 사본을 만든다.
#   1) RTF = 루프 전체가 쉬지 않은 비율(큐 대기를 뺀 시간 ÷ 벽시계). 예전 값(처리기만)은 rtf_proc 로 같이 보낸다(F-111).
#   2) 입력이 SKIP_S(기본 2 s, 환경 변수 ECG_BRIDGE_SKIP_S, 0 = 끔)보다 오래 밀리면 큐를 비우고 기법 전환과 같은 방식으로 다시 채운다
#      (reset 알림에 skip · skip_s). 연속 건너뛰기는 SKIP_GAP_S(8 s) 간격 이상.
#   3) 발행 stat 에 lag_ms(지금 − 처리한 마지막 입력의 도착 시각) · skip(건너뛴 횟수) · patch 표시.
#   4) ROOT 를 환경 변수 ECG_BRIDGE_ROOT 로 줄 수 있게(사본이 원본 폴더 밖에 있을 때 demo/ · results/ 를 찾도록).
# 찾는 문장이 정확히 한 번씩 있어야 한다 — 하나라도 없으면 아무것도 쓰지 않고 종료 코드 2(실행 도구는 원본으로 띄우고 경고).
# 사용: python patch_bridge.py <원본 serial_bridge.py> <출력 경로>
import sys

PATCH = 'gui-d198'   # D-201 모델 고정을 더해도 이름은 그대로(자체 시험이 이 이름을 본다)
EDITS = [
    ('ROOT', 'ROOT = Path(__file__).resolve().parents[1]\n',
     'ROOT = Path(__import__("os").environ.get("ECG_BRIDGE_ROOT") or Path(__file__).resolve().parents[1])   # [GUI 패치 D-198]\n'),
    ('init', '    gap_m = GapMeter(2.0)             # 도착 최대 간격 (D-38 R4)\n',
     '    gap_m = GapMeter(2.0)             # 도착 최대 간격 (D-38 R4)\n'
     '    # [GUI 패치 D-198] 루프가 큐를 기다린 시간 · 밀림 건너뛰기\n'
     '    idle = 0.0\n'
     '    skip_n, t_skip, t_last_arr = 0, 0.0, time.perf_counter()\n'
     '    SKIP_S = float(__import__("os").environ.get("ECG_BRIDGE_SKIP_S", "2.0"))\n'
     '    SKIP_GAP_S = 8.0\n'),
    ('get', '            try:\n'
            '                t_arr, data = q.get(timeout=0.5)\n'
            '            except queue.Empty:\n'
            '                continue\n',
     '            tw = time.perf_counter()\n'
     '            try:\n'
     '                t_arr, data = q.get(timeout=0.5)\n'
     '            except queue.Empty:\n'
     '                idle += time.perf_counter() - tw\n'
     '                continue\n'
     '            idle += time.perf_counter() - tw\n'
     '            t_first = t_arr\n'),
    ('skip', '            if len(parts) > 1:\n'
             '                data = b"".join(parts)\n',
     '            if len(parts) > 1:\n'
     '                data = b"".join(parts)\n'
     '            t_last_arr = t_arr\n'
     '            # [GUI 패치 D-198] 오래 밀렸으면 쌓인 입력을 버리고 지금부터 다시 채운다 — 남는 여유로만 따라잡으면\n'
     '            # 몇 분 동안 몰렸다 끊긴다(F-111). 표본 번호가 끊기므로 이어 붙이지 않고 기법 전환과 같은 reset.\n'
     '            age = time.perf_counter() - t_first\n'
     '            if SKIP_S > 0 and age > SKIP_S and time.perf_counter() - t_skip > SKIP_GAP_S:\n'
     '                n_drop = len(parts)\n'
     '                while True:\n'
     '                    try:\n'
     '                        q.get_nowait()\n'
     '                        n_drop += 1\n'
     '                    except queue.Empty:\n'
     '                        break\n'
     '                t_skip = t_last_arr = time.perf_counter()\n'
     '                skip_n += 1\n'
     '                parser.reset()\n'
     '                dec = CausalDecimator(args.board_fs, FS)\n'
     '                fe.reset()\n'
     '                for pr in procs.values():\n'
     '                    pr.reset()\n'
     '                al = Aligner(names)\n'
     '                raw, rawok, raw_base, n_in, n_input = [], [], 0, 0, 0\n'
     '                gap_m = GapMeter(2.0)\n'
     '                rate_m = RateMeter(10.0)\n'
     '                fs_chk.bad_streak, fs_chk.t_last = 0, t_skip\n'
     '                hub.publish({"reset": True, "skip": True, "skip_s": round(age, 1), "skip_n": skip_n,\n'
     '                             "fe": switch.mode, "fe_label": FE_MODES[switch.mode]["label"],\n'
     '                             "fe_lat_ms": round(fe.latency_samples / FS * 1000.0, 0)})\n'
     '                if not args.quiet:\n'
     '                    print(f"\\n[밀림] 입력이 {age:.1f} s 밀려 쌓인 {n_drop} 덩어리를 버리고 지금부터 다시 채운다 "\n'
     '                          f"(CPU 부족 — 다른 프로그램을 닫거나 가벼운 기법) · {skip_n} 번째", flush=True)\n'
     '                continue\n'),
    ('rtf', '                         "rtf": round(cpu / max(el, 1e-9), 3),\n',
     '                         "rtf": round(max(0.0, 1.0 - idle / max(el, 1e-9)), 3),\n'
     '                         "rtf_proc": round(cpu / max(el, 1e-9), 3),\n'
     '                         "lag_ms": round((now - t_last_arr) * 1000.0),\n'
     '                         "skip": skip_n, "patch": "' + PATCH + '",\n'),
    ('dlfreeze', '        return DLDenoiser(ckpt=ck, name=mid, frontend=False)\n',
     '        _d = DLDenoiser(ckpt=ck, name=mid, frontend=False)\n'
     '        # [GUI 패치 D-201] 모델을 입력 모양마다 한 번 고정(TorchScript freeze + optimize_for_inference) — 출력이 같은지 확인하고,\n'
     '        # 다르면 원래 모델 그대로. 측정: 추론 CPU 10–30 % 감소, 출력 차이 0(verification/dl-light-20261125). ECG_BRIDGE_FREEZE=0 이면 끔.\n'
     '        if __import__("os").environ.get("ECG_BRIDGE_FREEZE", "1") != "0" and not getattr(_d.model, "needs_cond", False):\n'
     '            import torch as _t\n'
     '            class _Frozen(_t.nn.Module):\n'
     '                def __init__(s, m):\n'
     '                    super().__init__(); s.m = m; s.c = {}\n'
     '                def forward(s, x, *a):\n'
     '                    if a:\n'
     '                        return s.m(x, *a)\n'
     '                    k = tuple(x.shape); f = s.c.get(k)\n'
     '                    if f is None:\n'
     '                        f = s.m\n'
     '                        try:\n'
     '                            import warnings\n'
     '                            with warnings.catch_warnings(), _t.no_grad():\n'
     '                                warnings.simplefilter("ignore")\n'
     '                                g = _t.jit.optimize_for_inference(_t.jit.freeze(_t.jit.trace(s.m.eval(), x)))\n'
     '                                if float((g(x) - s.m(x)).abs().max()) <= 1e-4:\n'
     '                                    f = g\n'
     '                        except Exception:\n'
     '                            pass\n'
     '                        s.c[k] = f\n'
     '                    return f(x)\n'
     '            _d.model = _Frozen(_d.model).eval()\n'
     '        return _d\n'),
    ('reset', '            cpu = core = 0.0\n'
              '            t_pub = now\n',
     '            cpu = core = 0.0\n'
     '            idle = 0.0\n'
     '            t_pub = now\n'),
]


def main() -> int:
    src, out = sys.argv[1], sys.argv[2]
    s = open(src, encoding='utf-8').read()
    miss = [name for name, old, _ in EDITS if s.count(old) != 1]
    if miss:
        print(f'patch_bridge: 원본 브리지가 예상과 다름 — 못 찾은 곳: {", ".join(miss)} (패치 안 함)', file=sys.stderr)
        return 2
    for _, old, new in EDITS:
        s = s.replace(old, new, 1)
    compile(s, out, 'exec')
    open(out, 'w', encoding='utf-8', newline='\n').write(s)
    print(f'patch_bridge: {PATCH} → {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
