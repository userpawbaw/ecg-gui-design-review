"""Frame budget (playbook P-007, F-043): judge a new space / set / light design per camera frame against the adopted one.

Why: route C (D-071) improved preview after preview against its own last render, yet ended with about half of the adopted
route's darks, sunlit area, decisive edges, soft-shadow area and texture density (F-043). This puts the comparison first:
  derive  measure the adopted route's frames → budget json (lower bounds = value x keep, upper bounds = value x allow)
  check   measure a candidate's frames against the budget → PASS/FAIL table (markdown) + side-by-side sheet; exit 1 on FAIL
Frames come from scripts/qa/frame-capture.cjs (<cond>@<t>.png, web tone pipeline). Metrics (L* = CIE lightness, HUD rows cropped):
  dark%       share of L* < 10 — how much of the frame is deep shadow (D-070: darkness gradation)        band (both sides)
  L25         25th percentile of L* — a fill that lifts every shadow raises it                          upper bound
  lit%        share of L* > 70 — directly lit surface                                                    band (both sides)
Bands: a first process test (C2 round 1, 2026-10-17) passed a frame that was 84 % deep shadow (A 45 %) and one whose sun patch
covered 42 % (A 5 %) — one-sided bounds let a crushed or blown frame through, so these two are capped too.
  crisp20‰    crisp, decisive light/shadow edges (frame-tone-stats.py)                                    lower bound
  soft_area%  area under soft (blurred) shadow edges (frame-tone-stats.py)                                lower bound
  edge        99th percentile of the L* gradient — texture / object density                               lower bound
  empty%      share of 24 px blocks (720 p) that are plain (L* std < 1.2) and not deep shadow — blank wall    upper bound
Run: python3 scripts/qa/frame-budget.py derive --dir A_FRAMES --out budget.json [--keep .8] [--allow 1.25]
     python3 scripts/qa/frame-budget.py check --budget budget.json --dir CAND_FRAMES [--baseline A_FRAMES] [--sheet out.jpg] [--report out.md]
"""
import argparse, json, os, runpy, sys, datetime
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
_argv = sys.argv; sys.argv = ['frame-tone-stats']                     # the stats script parses argv at import: load it with none
FTS = runpy.run_path(os.path.join(HERE, '..', 'assets', 'frame-tone-stats.py')); sys.argv = _argv
BOX = (0, 60, 1600, 840)                                               # 1600 x 900 capture minus the title / footer HUD rows
LOWER = ('dark%', 'lit%', 'crisp20‰', 'soft_area%', 'edge')
UPPER = ('L25', 'empty%', 'dark%', 'lit%')                              # dark% / lit% sit in both lists: a band


def measure(path):
    im = Image.open(path).convert('RGB').crop(BOX)
    L = FTS['lstar'](im)
    im7 = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS); L7 = FTS['lstar'](im7)
    w, _ = FTS['width_stats'](L7)
    gy, gx = np.gradient(L)
    h, wd = (L7.shape[0] // 24) * 24, (L7.shape[1] // 24) * 24
    blk = L7[:h, :wd].reshape(h // 24, 24, wd // 24, 24)
    empty = ((blk.std((1, 3)) < 1.2) & (blk.mean((1, 3)) >= 10)).mean()
    return {'dark%': round(float((L < 10).mean() * 100), 1), 'L25': round(float(np.percentile(L, 25)), 1), 'lit%': round(float((L > 70).mean() * 100), 1),
            'crisp20‰': w['crisp20‰'], 'soft_area%': w['soft_area%'], 'edge': round(float(np.percentile(np.hypot(gx, gy), 99)), 1),
            'empty%': round(float(empty * 100), 1)}


def frames(d):
    return sorted(f[:-4] for f in os.listdir(d) if f.endswith('.png') and '@' in f)


def derive(a):
    out = {'made': datetime.date.today().isoformat(), 'baseline_dir': os.path.basename(os.path.normpath(a.dir)), 'keep': a.keep, 'allow': a.allow, 'note': a.note, 'frames': {}}
    for f in frames(a.dir):
        m = measure(os.path.join(a.dir, f + '.png'))
        cap = {'L25': lambda v: v * a.allow + 1.0, 'empty%': lambda v: v * a.allow + 3.0,
               'dark%': lambda v: min(100., v * 1.3 + 5.0), 'lit%': lambda v: v * 2.0 + 3.0}
        out['frames'][f] = {'baseline': m, 'min': {k: round(m[k] * a.keep, 2) for k in LOWER}, 'max': {k: round(cap[k](m[k]), 2) for k in UPPER}}
        print(f, m, flush=True)
    with open(a.out, 'w', encoding='utf-8') as fh: json.dump(out, fh, indent=1, ensure_ascii=False)
    print('budget written', a.out)


def check(a):
    B = json.load(open(a.budget, encoding='utf-8')); rows, fails, total = [], 0, 0
    names = [f for f in B['frames'] if os.path.exists(os.path.join(a.dir, f + '.png'))]
    missing = [f for f in B['frames'] if f not in names]
    keys = list(dict.fromkeys(LOWER + UPPER))
    head = '| 프레임 | ' + ' | '.join(keys) + ' | 판정 |'
    rows += [head, '|' + '---|' * (len(keys) + 2)]
    for f in names:
        m, b = measure(os.path.join(a.dir, f + '.png')), B['frames'][f]; cells, bad = [], 0
        for k in keys:
            lo, hi = (b['min'].get(k) if k in LOWER else None), (b['max'].get(k) if k in UPPER else None)
            ok = (lo is None or m[k] >= lo) and (hi is None or m[k] <= hi)
            rng = f'{lo}–{hi}' if lo is not None and hi is not None else (f'≥{lo}' if lo is not None else f'≤{hi}')
            cells.append(f"{m[k]}{'' if ok else ' ✗'} ({rng}, A {b['baseline'][k]})"); bad += (not ok); total += 1
        fails += bad; rows.append(f'| {f} | ' + ' | '.join(cells) + f" | {'PASS' if bad == 0 else f'FAIL {bad}'} |")
    passed = total - fails
    summary = f"{passed}/{total} 항목 통과 ({len(names)} 프레임" + (f", 빠진 프레임 {', '.join(missing)}" if missing else '') + ')'
    rows.append(''); rows.append(f"**{'PASS' if fails == 0 and not missing else 'FAIL'}** — {summary}")
    text = '\n'.join(rows); print(text)
    if a.report:
        with open(a.report, 'w', encoding='utf-8') as fh: fh.write(f"# 프레임 예산 판정 — {os.path.basename(os.path.normpath(a.dir))}\n\n예산: `{a.budget}`\n\n" + text + '\n')
    if a.sheet and a.baseline:
        W, H = 640, 360; sheet = Image.new('RGB', (2 * W, H * len(names)), (20, 20, 20))
        for i, f in enumerate(names):
            for j, d in enumerate((a.baseline, a.dir)):
                p = os.path.join(d, f + '.png')
                if os.path.exists(p): sheet.paste(Image.open(p).convert('RGB').resize((W, H)), (j * W, i * H))
        sheet.save(a.sheet, quality=86); print('sheet', a.sheet)
    sys.exit(0 if fails == 0 and not missing else 1)


ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
d = sp.add_parser('derive'); d.add_argument('--dir', required=True); d.add_argument('--out', required=True)
d.add_argument('--keep', type=float, default=.8); d.add_argument('--allow', type=float, default=1.25); d.add_argument('--note', default='')
c = sp.add_parser('check'); c.add_argument('--budget', required=True); c.add_argument('--dir', required=True)
c.add_argument('--baseline', default=''); c.add_argument('--sheet', default=''); c.add_argument('--report', default='')
a = ap.parse_args()
derive(a) if a.cmd == 'derive' else check(a)
