"""D-189 심질환 파형 탭 자료. MIT-BIH **시험(DS2) 기록**에서 질환마다 10 s 구간을 전문의 주석(.atr 박동 기호 · 리듬)으로 고르고,
실험실 자료(원본 scripts/build_demo_bank.py)와 같은 방식으로 만든다: 20 s를 처리하고 가운데 10 s를 저장, 참조 = 공통 전처리(FE)를 통과한
원본, 잡음은 원본에 섞음(SNR과 무관한 한 번의 실현), 한 장면의 모든 파형이 같은 int16 스케일.
구간 선택 기준은 기법 성능이 아니라 **주석 조건 + 원기록이 가장 깨끗한 후보**(잡음은 우리가 정해서 섞으므로).

    cd <원본 저장소>; python3 <이 파일> <이 저장소>/data/disease   # 출력: index.json + <질환>.json (prepare-v2.cjs가 public 으로 복사)
"""
import sys, json, base64, hashlib, subprocess
from pathlib import Path
import numpy as np, wfdb
SRC = Path.cwd(); sys.path[:0] = [str(SRC), str(SRC / 'scripts')]
import ecgdn.methods  # noqa: F401
from ecgdn.config import EVAL_GUARD_S
from ecgdn.data.sources import get_source
from ecgdn.data.nstdb import make_banks
from ecgdn.data.noise import mixed_noise, make_noise
from ecgdn.data.mixer import mix_at_snr
from ecgdn.data.dataset import make_rng
from ecgdn.data.splits import MITDB_SPLIT
from ecgdn.methods.frontend import FrontEnd
from ecgdn.eval.engine import trim_guard
from run_exp import build_methods

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SHOW_S = float(__import__('os').environ.get('DISEASE_SHOW_S', 60)); SEG_S = SHOW_S + 2 * EVAL_GUARD_S   # 2026-11-22 사용자 「10초는 너무 짧다 … 60초」: 가운데 60 s 저장(앞뒤 5 s는 처리 가장자리)
CONDS = ['mixed', 'ma_synth', 'em_synth']; SNRS = [0.0, 10.0, 20.0]
CFG = {"methods": ["M_FE", "M01", "M02", "M03", "M04", "M05", "B01"],
       "dl_methods": {"M06": {"ckpt": "results/{tag}/m06_l1/best.pt"}, "M06L6": {"ckpt": "results/{tag}/m06_l6/best.pt"},
                      "M08": {"ckpt": "results/{tag}/m08_l1/best.pt"}, "M09": {"ckpt": "results/{tag}/m09_l1/best.pt"}}, "frontend": True}

# 질환: (id, 이름, 기록, 조건). 조건은 가운데 구간의 박동 기호 목록 b 와 리듬 비율 cov(리듬 → 구간 중 차지하는 비율)에 대해 본다.
# 60 s 기준(10 s 때의 「V 2–4개」 같은 개수는 길이에 맞게 바꿈). 리듬은 구간 전체가 그 리듬이어야 하는 것(심방세동 · 조동 · 2도 차단 · 동서맥)과
# 특정 박동이 섞여 있으면 되는 것(조기 수축 · 이단맥 · 빈맥 연발)으로 나눈다.
def all_(beats, s): return bool(beats) and all(b in s for b in beats)
def only(cov, r, k=.999): return cov.get(r, 0) >= k
DISEASES = [
    ('normal', '정상 동리듬', '100', lambda b, cov: only(cov, '(N') and all_(b, 'N')),
    ('sbr', '동서맥', '232', lambda b, cov: only(cov, '(SBR')),
    ('apc', '심방 조기 수축', '222', lambda b, cov: only(cov, '(N') and b.count('A') >= 3 and all_(b, 'NA') and 'AA' not in ''.join(b)),
    ('afib', '심방세동', '219', lambda b, cov: only(cov, '(AFIB') and all_(b, 'N')),
    ('afl', '심방 조동', '222', lambda b, cov: only(cov, '(AFL') and all_(b, 'N')),
    ('pvc', '심실 조기 수축', '233', lambda b, cov: only(cov, '(N') and 4 <= b.count('V') <= 20 and all_(b, 'NV') and 'VV' not in ''.join(b)),
    ('bigeminy', '심실 이단맥', '200', lambda b, cov: cov.get('(B', 0) >= .8 and all_(b, 'NV')),
    ('vt', '심실 빈맥(짧은 연발)', '200', lambda b, cov: '(VT' in cov and 'VVV' in ''.join(b) and all_(b, 'NV')),
    ('lbbb', '좌각 차단', '111', lambda b, cov: only(cov, '(N') and all_(b, 'L')),
    ('rbbb', '우각 차단', '212', lambda b, cov: only(cov, '(N') and all_(b, 'R')),
    ('avb2', '2도 방실 차단', '231', lambda b, cov: only(cov, '(BII')),
]
assert all(d[2] in MITDB_SPLIT['test'] for d in DISEASES), 'DL 학습 누출: 시험 기록만'

src = get_source('mitdb'); fe = FrontEnd(); banks = make_banks('test')
methods = build_methods(CFG, 'd1')
def rhythm_spans(name, fs, n):
    a = wfdb.rdann(f'data/raw/mitdb/{name}', 'atr'); k = fs / 360.0; out = []; cur = None; t0 = 0
    for s, aux, t in zip(a.symbol, a.aux_note, a.sample):
        if s == '+' and aux: 
            if cur: out.append((cur, t0, int(t * k)))
            cur, t0 = aux.strip('\x00').strip(), int(t * k)
    if cur: out.append((cur, t0, n))
    noise = [int(t * k) for s, t in zip(a.symbol, a.sample) if s in '~|']
    return out, noise
def q(sig, scale): return base64.b64encode(np.clip(np.round(sig / scale), -32768, 32767).astype('<i2').tobytes()).decode('ascii')

index = []
for did, label, name, ok in DISEASES:
    rec = src.get(name); fs = rec.fs; n = int(SEG_S * fs); show = int(SHOW_S * fs); g0 = int(EVAL_GUARD_S * fs)
    spans, noise = rhythm_spans(name, fs, rec.x.size)
    cands = []
    for st in range(0, rec.x.size - n, int(1 * fs)):
        c0, c1 = st + g0, st + g0 + show
        if any(st <= t < st + n for t in noise): continue
        sel = (rec.r_peaks >= c0) & (rec.r_peaks < c1); beats = list(rec.symbols[sel])
        cov = {}
        for r, a, b in spans:
            o = min(b, c1) - max(a, c0)
            if o > 0: cov[r] = cov.get(r, 0) + o / show
        if not ok(beats, cov): continue
        w = rec.x[st:st + n]; amp = np.percentile(np.abs(w - np.median(w)), 99)
        rough = float(np.median(np.abs(np.diff(w, 2)))) / max(amp, 1e-6)
        cands.append((rough, st))
    if not cands: print('[skip] 후보 없음', did); continue
    cands.sort(); st = cands[0][1]; si = st
    x_raw = rec.x[st:st + n].astype(np.float64); x = fe(x_raw, fs)
    sl = trim_guard(n, fs, EVAL_GUARD_S)
    sel = (rec.r_peaks >= st + g0) & (rec.r_peaks < st + g0 + show)
    beats = [{'i': int(p - st - g0), 's': str(s)} for p, s in zip(rec.r_peaks[sel], rec.symbols[sel])]
    rhythm = [{'r': r, 'a': max(0, a - st - g0), 'b': min(show, b - st - g0)} for r, a, b in spans if a < st + g0 + show and b > st + g0]
    scenes = []
    for cond in CONDS:
        gen = make_rng('disease', name, si, cond)
        nz = mixed_noise(n, fs, gen, banks=banks)[0] if cond == 'mixed' else make_noise(cond, n, fs, gen, banks=banks)
        for snr in SNRS:
            y, _, _ = mix_at_snr(x_raw, nz, snr)
            tr = {'clean': x[sl], 'input': y[sl]}
            for mid, fn in methods.items():
                ctx = {'x_clean': x} if getattr(fn, 'needs_clean', False) else {}
                tr[mid] = np.asarray(fn(y, fs, ctx), dtype=np.float64)[sl]
            scale = max(float(np.max(np.abs(v))) for v in tr.values()) / 32000
            scenes.append({'id': f'{did}-{cond}-{snr:g}', 'axis': 'd1', 'cond': cond, 'snr': snr, 'record': name, 'scale': scale,
                           'traces': {k: q(v, scale) for k, v in tr.items()}})
            print(did, cond, snr, flush=True)
    body = {'fs': fs, 'n': show, 'disease': did, 'label': label, 'record': name, 'startSample': int(st + g0), 'startSeconds': round((st + g0) / fs, 2),
            'beats': beats, 'rhythm': rhythm, 'candidates': len(cands), 'scenes': scenes}
    (OUT / f'{did}.json').write_text(json.dumps(body, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    index.append({'id': did, 'label': label, 'record': name, 'startSeconds': body['startSeconds'], 'candidates': len(cands),
                  'beatCounts': {s: sum(1 for b in beats if b['s'] == s) for s in sorted({b['s'] for b in beats})}, 'rhythm': sorted({r['r'] for r in rhythm})})
sha = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
(OUT / 'index.json').write_text(json.dumps({'schema': 1, 'fs': 250, 'n': int(SHOW_S * 250), 'seconds': SHOW_S, 'conds': CONDS, 'snrs': SNRS, 'diseases': index,
    'provenance': {'repository': 'userpawbaw/ECG_denoising_method_comparision', 'sourceCommit': sha, 'builder': 'scripts/disease/build_disease_bank.py',
                   'data': 'MIT-BIH Arrhythmia Database (PhysioNet, ODC-By 1.0), lead MLII, resampled to 250 Hz; DS2 test records only (not used to train the DL methods)',
                   'annotations': 'cardiologist beat symbols and rhythm labels (.atr)', 'reference': 'FE(x_raw)', 'noise': 'mixed = NSTDB test split; ma_synth/em_synth synthetic',
                   'selection': 'annotation criteria per disease, then the candidate with the lowest raw roughness (not by method performance)',
                   'traceEncoding': 'signed int16 little-endian base64; mV = integer * scene.scale', 'time': f'central {SHOW_S:g} s of a processed {SEG_S:g} s segment'}},
    ensure_ascii=False, indent=1), encoding='utf-8')
print('done', len(index))
