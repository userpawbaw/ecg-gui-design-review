"""재생 브리지에 흘릴 신호 CSV 만들기 (docs/DEMO_BRIDGE.md §4.1, 2026-11-08 사용자 요청).

원본 저장소(ECG_denoising_method_comparision)의 자료 · 잡음 · 혼합 코드를 그대로 쓴다. 원본 저장소 폴더를 작업 폴더로 하고
`npm run bridge:replay -- --signal mitdb:100 --noise ma --snr 5` 처럼 부른다(run.mjs 가 이 파일을 부른 뒤 브리지를
`--replay csv --csv <만든 파일>` 로 띄운다).

신호: synth(원본 합성 심전도) · mitdb:<기록>(MLII, 250 Hz로 리샘플)
잡음: none · mixed(원본 재생 기본과 같은 1~3종 무작위 혼합) · 합성 pli · bw_synth · ma_synth · em_synth · awgn · impulse
      · 실제 NSTDB bw · ma · em(시험 구간에서 자름)
출력 CSV: `# fs_hz=250, ...` 머리줄 + `t_ms,adc_raw`. 브리지는 이 값을 ADC 카운트로 다시 맞추므로 진폭 단위는 상대값이다.
"""
import argparse
import os
import sys
from pathlib import Path

FS = 250


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--signal", default="synth", help="synth 또는 mitdb:<기록 번호> (예: mitdb:100)")
    ap.add_argument("--noise", default="mixed", help="none · mixed · pli · bw_synth · ma_synth · em_synth · awgn · impulse · bw · ma · em")
    ap.add_argument("--snr", type=float, default=8.0, help="입력 SNR [dB]. 원본 재생 기본 8")
    ap.add_argument("--start", type=float, default=0.0, help="mitdb 기록에서 시작 시각 [s]")
    ap.add_argument("--sec", type=float, default=120.0, help="길이 [s]. 브리지는 끝에서 처음으로 되돌아간다")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    sys.path.insert(0, os.getcwd())                       # 원본 저장소 루트(ecgdn 패키지)
    import numpy as np
    from ecgdn.data.mixer import mix_at_snr
    from ecgdn.data.noise import make_noise, mixed_noise, unit_var, NOISE_FNS

    gen = np.random.default_rng(a.seed)
    n = int(round(a.sec * FS))
    if a.signal == "synth":
        from ecgdn.data.synthetic import synth_ecg
        clean = synth_ecg(duration_s=a.sec, fs=FS, seed=a.seed).x[:n]
        sig_note = "synth"
    elif a.signal.startswith("mitdb:"):
        from ecgdn.data.mitdb import available_records, load_record
        rec = a.signal.split(":", 1)[1]
        have = available_records("data/raw/mitdb")
        if rec not in have:
            print(f"MIT-BIH 기록 {rec} 없음. 있는 기록: {' '.join(have)}", file=sys.stderr)
            return 2
        r = load_record(rec, "data/raw/mitdb", fs_out=FS)
        i0 = int(round(a.start * FS))
        clean = r.x[i0:i0 + n]
        sig_note = f"mitdb {rec} {r.lead} from {a.start:g}s"
    else:
        print("--signal 은 synth 또는 mitdb:<기록>", file=sys.stderr)
        return 2
    clean = np.asarray(clean, dtype=np.float64)

    real = ("bw", "ma", "em")
    if a.noise == "none":
        x, noise_note = clean, "none"
    else:
        banks = {}
        if a.noise in real or a.noise == "mixed":
            from ecgdn.data.nstdb import make_banks
            banks = make_banks("test", "data/raw/nstdb", fs_out=FS)
        if a.noise == "mixed":
            noise, w = mixed_noise(clean.size, FS, gen, banks=banks or None)
            noise_note = "mixed " + "+".join(f"{k}:{v:.2f}" for k, v in w.items())
        elif a.noise in real:
            if a.noise not in banks:
                print(f"NSTDB {a.noise} 기록을 읽지 못함(data/raw/nstdb, wfdb 패키지 필요)", file=sys.stderr)
                return 2
            noise, noise_note = unit_var(banks[a.noise].sample(clean.size, gen)), f"nstdb {a.noise}"
        elif a.noise in NOISE_FNS:
            noise, noise_note = make_noise(a.noise, clean.size, FS, gen), a.noise
        else:
            print(f"알 수 없는 잡음 {a.noise}. none · mixed · {' · '.join(NOISE_FNS)} · bw · ma · em", file=sys.stderr)
            return 2
        x, _, snr = mix_at_snr(clean, noise, a.snr)
        noise_note += f" {snr:.1f}dB"

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="\n") as f:
        f.write(f"# fs_hz={FS}, signal={sig_note}, noise={noise_note}, seed={a.seed}\n")
        f.write("t_ms,adc_raw\n")
        for i, v in enumerate(x):
            f.write(f"{i * 1000.0 / FS:.1f},{v:.6f}\n")
    print(f"재생 신호: {sig_note} · 잡음 {noise_note} · {x.size / FS:.0f} s → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
