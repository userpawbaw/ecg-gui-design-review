/* D-192 · D-193 질환 특징 투어 — 정상 기준 행과 특징 단계 계획(DOM 없음, 시험 가능).
 * 정상 기준 행: 평균 박동(R에 맞춘 중앙값, 끝 0 + 30 ms 테이퍼)을 질환 행의 시간에 놓은 합성 행. 실측 파형이 아니므로 화면 이름에 「합성」과 출처를 밝힌다.
 *   평균 박동 출처: 같은 기록(조기 수축류 · 휴지 · 2:1 차단) / 정상 기록 100(같은 기록에 정상 모양 박동이 없는 심방세동 · 조동 · 각 차단 — 진폭은 이 기록 박동 높이에 맞춤).
 *   배치: 따라가기(정상 박동 R에, 이상 박동은 「앞 R + 정상 R–R」) · 긴 간격 채우기(정상이면 왔을 박동) · 규칙 격자(심방세동).
 * 특징 위치: R = 전문의 주석, QRS 시작 · 끝 = features.beatGeo(기울기 + 기준선 추정 — 정상 QRS를 짧게 잰다, 그래서 폭은 같은 추정기의 정상 박동과 견준다). */
import {beatGeo, baseline, rrMedian, type Beat, type BeatGeo} from './features';

const BEAT = new Set('NLRAaJSVFejE/fQ'.split(''));
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const f2 = (v: number) => v.toFixed(2);

export type Placed = {r: number, kind: 'N' | 'exp' | 'fill' | 'grid'};
export type NormalRow = {trace: Float32Array, rr: number, placed: Placed[], pre: number, post: number, source: string};
export type RowCfg = {tpl: 'self' | 'ref', sym: string[], place: 'follow' | 'regular', expect?: boolean, fill?: 'median' | 'half'};
/** 질환별 정상 기준 행 설정(D-193). 없는 질환은 투어 없음. */
export const ROW_CFG: Record<string, RowCfg> = {
  pvc: {tpl: 'self', sym: ['N'], place: 'follow', expect: true},
  apc: {tpl: 'self', sym: ['N'], place: 'follow', expect: true},
  bigeminy: {tpl: 'self', sym: ['N'], place: 'follow', expect: true},
  vt: {tpl: 'self', sym: ['N'], place: 'follow', expect: true},
  sbr: {tpl: 'self', sym: ['A', 'N'], place: 'follow', fill: 'median'},
  avb2: {tpl: 'self', sym: ['N'], place: 'follow', fill: 'half'},
  afib: {tpl: 'ref', sym: ['N'], place: 'regular'},
  afl: {tpl: 'ref', sym: ['N'], place: 'follow'},
  lbbb: {tpl: 'ref', sym: ['L'], place: 'follow'},
  rbbb: {tpl: 'ref', sym: ['R'], place: 'follow'},
};
export const needsRef = (id: string) => ROW_CFG[id]?.tpl === 'ref';

/** 평균 박동: syms 박동 중 앞뒤도 같은 기호인 것(최대 80개)의 R 정렬 중앙값. */
function template(x: ArrayLike<number>, beats: Beat[], fs: number, syms: string[], pre: number, post: number) {
  const ok = (s?: string) => !!s && syms.includes(s);
  let src = beats.filter((b, k) => ok(b.s) && ok(beats[k - 1]?.s) && ok(beats[k + 1]?.s) && b.i - pre >= 0 && b.i + post < x.length).slice(0, 80);
  if (src.length < 3) src = beats.filter(b => ok(b.s) && b.i - pre >= 0 && b.i + post < x.length).slice(0, 80);
  if (src.length < 3) return null;
  const L = pre + post + 1, tpl = new Float32Array(L), col: number[] = [], bases = src.map(b => baseline(x, b.i, fs));
  for (let j = 0; j < L; j++) { col.length = 0; src.forEach((b, q) => col.push(x[b.i - pre + j] - bases[q])); tpl[j] = med(col); }
  const e0 = tpl[0], e1 = tpl[L - 1], tw = Math.round(.03 * fs);
  for (let j = 0; j < L; j++) { tpl[j] -= e0 + (e1 - e0) * j / (L - 1); const w = j < tw ? j / tw : L - 1 - j < tw ? (L - 1 - j) / tw : 1; tpl[j] *= .5 - .5 * Math.cos(Math.PI * w); }
  return tpl;
}
/** R 주변 ±0.1 s 최대 − 최소(진폭 맞춤용) */
const p2p = (x: ArrayLike<number>, r: number, fs: number) => { let lo = Infinity, hi = -Infinity; for (let k = r - Math.round(.1 * fs); k <= r + Math.round(.1 * fs); k++) if (k >= 0 && k < x.length) { lo = Math.min(lo, x[k]); hi = Math.max(hi, x[k]); } return hi - lo; };

/** 정상 기준 행. cfg 없으면 D-192(같은 기록 N 박동 · 따라가기 · 이상 박동은 예상 자리). ref = 정상 기록(평균 박동 출처). */
export function buildNormalRow(x: Float32Array, beats: Beat[], fs: number, cfg: RowCfg = ROW_CFG.pvc, ref?: {x: Float32Array, beats: Beat[]}): NormalRow | null {
  const seq = beats.filter(b => BEAT.has(b.s)), allRR = seq.slice(1).map((b, k) => (b.i - seq[k].i) / fs);
  let rr = cfg.tpl === 'self' ? med(cfg.sym.map(s => rrMedian(beats, s, fs)).filter(Number.isFinite)) : med(allRR);
  if (!Number.isFinite(rr)) rr = med(allRR);
  if (cfg.fill === 'half') rr = med(allRR) / 2;   // 2:1 차단: 정상이면 P마다(R–R의 절반) 박동
  if (!Number.isFinite(rr)) return null;
  const rrS = Math.round(rr * fs), pre = Math.round(.3 * fs), post = Math.max(Math.round(.3 * fs), Math.min(Math.round(.55 * fs), rrS - pre - 2));
  let tpl: Float32Array | null, source: string;
  if (cfg.tpl === 'ref') { if (!ref) return null; tpl = template(ref.x, ref.beats, fs, ['N'], pre, post); source = '정상 기록 100 평균 박동';
    if (tpl) { const k = med(seq.slice(0, 40).map(b => p2p(x, b.i, fs))) / Math.max(1e-6, p2p(tpl, pre, fs)); if (Number.isFinite(k) && k > 0) tpl = tpl.map(v => v * k); } }
  else { tpl = template(x, beats, fs, cfg.sym, pre, post); source = '같은 기록 평균 박동'; }
  if (!tpl) return null;
  const out = new Float32Array(x.length), placed: Placed[] = [], add = (r: number, kind: Placed['kind']) => { for (let j = 0; j < tpl!.length; j++) { const i = r - pre + j; if (i >= 0 && i < out.length) out[i] += tpl![j]; } placed.push({r, kind}); };
  if (cfg.place === 'regular') { for (let r = seq[0]?.i ?? 0; r < x.length + pre; r += rrS) add(r, 'grid'); }
  else { let last = -Infinity;
    seq.forEach((b, k) => {
      if (cfg.fill && Number.isFinite(last)) while (b.i - last > 1.6 * rrS) { last += rrS; if (b.i - last < .6 * rrS) break; add(last, 'fill'); }
      if (cfg.tpl === 'ref' || cfg.sym.includes(b.s)) { add(b.i, 'N'); last = b.i; return; }
      if (!cfg.expect || !Number.isFinite(last)) { if (!cfg.expect) { add(b.i, 'N'); last = b.i; } return; }
      const r = last + rrS, nx = seq.slice(k + 1).find(z => cfg.sym.includes(z.s)); if (nx && nx.i - r < .6 * rrS) return;
      add(r, 'exp'); last = r; });
  }
  return {trace: out, rr, placed, pre, post, source};
}

/** 특징 한 단계: 초점 구간(행별, 초), 멈출 시각, 유령, 측정 표식. 시간은 모두 자료 시작 기준 초. */
export type Region = {row: 'input' | 'normal', t0: number, t1: number};
export type Caliper = {row: 'input' | 'normal', kind: 'arrow' | 'bracket' | 'vline', t0: number, t1: number, label: string, at: 'top' | 'bottom'};
export type Ghost = {t0: number, t1: number, shift: number, base: number};   // 정상 행 [t0,t1]을 shift 초 옮겨 질환 행(기준선 base mV)에 겹침
export type Step = {id: string, title: string, value: string, stop: number, regions: Region[], ghost?: Ghost, calipers: Caliper[], mark: {t: number}, span?: number};
export type Tour = {steps: Step[], start: number, span?: number, pvc?: {prev: BeatGeo, v: BeatGeo, next: BeatGeo}, normalQrs?: number, early?: number, rr: number};

type Ctx = {x: Float32Array, beats: Beat[], fs: number, row: NormalRow, span: number, dur: number};
const T = (c: Ctx, i: number) => i / c.fs;
const both = (t0: number, t1: number): Region[] => [{row: 'input', t0, t1}, {row: 'normal', t0, t1}];
const near = (c: Ctx, r: number, kinds?: Placed['kind'][]) => c.row.placed.filter(p => !kinds || kinds.includes(p.kind)).reduce((a, p) => Math.abs(p.r - r) < Math.abs(a.r - r) ? p : a, c.row.placed[0]);
/** endT가 화면 오른쪽 90 % 자리에 오도록 멈출 시각 */
const stopAt = (c: Ctx, endT: number, span = c.span) => endT + .1 * span;
/** 멈춘 화면에 t0부터 보이고, 앞에 재생할 여유(3 s)와 끝에 여유가 있는가 */
const fits = (c: Ctx, t0: number, stop: number, span = c.span) => t0 >= stop - .97 * span && stop >= Math.max(span, 3.2) && stop <= c.dur - .05;
const width = (c: Ctx, g: BeatGeo) => (g.off - g.on) / c.fs;
const crit = (q: number) => q >= .12 ? ' (기준 ≥ 0.12 s)' : '';
/** 질환 행 박동 g와 정상 기준 행의 평균 박동을 QRS 시작에 맞춰 겹친 유령 + 두 폭 괄호 */
function widthStep(c: Ctx, id: string, title: string, g: BeatGeo, stop: number, value: (q: number, nq: number) => string): Step {
  const p = near(c, g.r), n = beatGeo(c.row.trace, p.r, c.fs), q = width(c, g), nq = width(c, n);
  return {id, title, value: value(q, nq), stop,
    regions: [{row: 'input', t0: T(c, g.on) - .07, t1: T(c, g.off) + .07}, {row: 'normal', t0: T(c, n.on) - .07, t1: T(c, n.off) + .07}],
    ghost: {t0: T(c, n.on) - .12, t1: T(c, n.off) + .18, shift: T(c, g.on - n.on), base: baseline(c.x, g.r, c.fs)},
    calipers: [{row: 'input', kind: 'bracket', t0: T(c, g.on), t1: T(c, g.off), label: `${f2(q)} s`, at: 'top'}, {row: 'normal', kind: 'bracket', t0: T(c, n.on), t1: T(c, n.off), label: `${f2(nq)} s`, at: 'top'}],
    mark: {t: (T(c, g.on) + T(c, g.off)) / 2}};
}
/** 투어 계획 기본 표시 구간(초) — 사용자가 고른 구간과 무관하게 이 값으로 세우고, 질환을 고를 때 화면도 이 구간으로 맞춘다(2026-11-25 사용자: 초기 설정이 안 먹음). */
export const TOUR_SPAN = 5;
/** 단계의 내용 폭(초점 구간 + 측정 표식, 두 행 합) */
export function focusOf(s: Step) { const a = Math.min(...s.regions.map(g => g.t0), ...s.calipers.map(c => Math.min(c.t0, c.t1))), b = Math.max(...s.regions.map(g => g.t1), ...s.calipers.map(c => Math.max(c.t0, c.t1)));
  return {a, b, c: (a + b) / 2, vis: Math.max(...s.regions.map(g => (g.t1 - g.t0) * 1.32 + .08))}; }
/** D-194 특징별 표시 구간: 보이는 초점이 약 35 %가 되는 길이와 최소 1.5 박동(1.25 s 이상) 중 넓은 쪽, 0.25 s 단위, 상한 = 기본 구간.
 * (측정: 5 s에서 리듬 특징 34–61 %, 형태 특징 4–11 % — verification/disease-zoom-20261125) */
export function stepSpan(s: Step, rr: number, base: number) { const f = focusOf(s), minS = Math.max(1.25, 1.5 * rr);
  return Math.min(base, Math.max(Math.ceil(minS * 4) / 4, Math.round(f.vis / .35 * 4) / 4)); }
/** 확대 창: 특징 중심이 화면 55 % 자리, 오른쪽 끝은 멈춘 재생 위치를 넘지 않음(아직 재생 안 된 파형을 보이지 않게), 내용은 창 안에. */
export function stepView(s: Step, base: number) { const span = s.span ?? base; if (span >= base - 1e-6) return {span: base, right: s.stop};
  const f = focusOf(s); let right = Math.min(s.stop, f.c + .45 * span); if (f.b > right) right = Math.min(s.stop, f.b + .05); return {span, right}; }
/** 마무리: 단계별 구간을 정하고, 같은 멈춤 안에서는 넓게 → 좁게(개관 → 세부) 순서로(확대는 한 방향으로만, 사용자 2026-11-25). */
const finish = (steps: Step[], rr: number, extra: Partial<Tour> = {}): Tour => {
  const base = extra.span ?? TOUR_SPAN;
  steps.forEach(s => { s.span = stepSpan(s, rr, base); });
  const order = steps.map((s, i) => ({s, i})).sort((p, q) => p.s.stop - q.s.stop || (q.s.span! - p.s.span!) || p.i - q.i).map(x => x.s);
  return {steps: order, start: Math.max(0, order[0].stop - 3.5), rr, span: base, ...extra}; };

/** 조기 박동(심실 V · 심방 A): N N X N, ③은 보상성(V) · 비보상성(A) 휴지. */
function earlyTour(c: Ctx, sym: 'V' | 'A'): Tour | null {
  const {beats, fs, row} = c, rr = row.rr; let best = -1, err = Infinity;
  for (let k = 2; k < beats.length - 1; k++) {
    if (beats[k].s !== sym || beats[k - 1].s !== 'N' || beats[k + 1].s !== 'N' || beats[k - 2].s !== 'N') continue;
    const e0 = beats[k - 1].i + Math.round(rr * fs); if (!fits(c, T(c, beats[k].i) - .2, stopAt(c, T(c, e0) + .2)) || T(c, beats[k + 1].i) + .3 > c.dur - .2) continue;
    const ratio = (beats[k + 1].i - beats[k - 1].i) / fs / rr, e = sym === 'V' ? Math.abs(ratio - 2) : (beats[k].i - beats[k - 1].i) / fs / rr;   // 심방: 가장 이른 것
    if (e < err) { err = e; best = k; } }
  if (best < 0) return null;
  const prev = beatGeo(c.x, beats[best - 1].i, fs), v = beatGeo(c.x, beats[best].i, fs), next = beatGeo(c.x, beats[best + 1].i, fs);
  const exp = row.placed.find(p => p.kind === 'exp' && Math.abs(p.r - (prev.r + Math.round(rr * fs))) < 3), expR = exp ? exp.r : prev.r + Math.round(rr * fs);
  const early = T(c, expR - v.r), base = baseline(c.x, v.r, fs), a = T(c, v.r - prev.r), b = T(c, next.r - v.r);
  const s1 = stopAt(c, T(c, expR) + .2), s3 = Math.max(s1 + .3, stopAt(c, T(c, next.off) + .2) - .02 * c.span);
  const w = widthStep(c, 'wide', sym === 'V' ? 'QRS 폭 확장' : 'QRS 폭 유지', v, s1, (q, nq) => sym === 'V' ? `QRS ${f2(q)} s · 정상 ${f2(nq)} s${crit(q)}` : `QRS ${f2(q)} s · 정상 ${f2(nq)} s — 심실 전도는 정상 경로`);
  const steps: Step[] = [
    {id: 'early', title: 'R파 조기 출현', value: `예상 R 시점보다 ${f2(early)} s 선행`, stop: s1,
      regions: both(T(c, v.on) - .12, T(c, expR) + .14), ghost: {t0: T(c, expR) - .2, t1: T(c, expR) + .3, shift: 0, base},
      calipers: [{row: 'input', kind: 'vline', t0: T(c, expR), t1: T(c, expR), label: '예상 R', at: 'top'}, {row: 'normal', kind: 'vline', t0: T(c, expR), t1: T(c, expR), label: '', at: 'top'},
        {row: 'input', kind: 'arrow', t0: T(c, expR), t1: T(c, v.r), label: `${f2(early)} s`, at: 'top'}], mark: {t: T(c, v.r)}},
    w,
    {id: 'pause', title: sym === 'V' ? '보상성 휴지' : '비보상성 휴지', value: `전후 R–R ${f2(a + b)} s = 정상 R–R ${f2(rr)} s × ${f2((a + b) / rr)}${sym === 'A' ? ' (보상성이면 × 2)' : ''}`, stop: s3,
      regions: both(T(c, prev.r) - .1, T(c, next.r) + .12), ghost: {t0: T(c, prev.r) + .25, t1: T(c, next.r) - .2, shift: 0, base},
      calipers: [{row: 'input', kind: 'bracket', t0: T(c, prev.r), t1: T(c, v.r), label: `${f2(a)} s`, at: 'bottom'}, {row: 'input', kind: 'bracket', t0: T(c, v.r), t1: T(c, next.r), label: `${f2(b)} s`, at: 'bottom'},
        {row: 'normal', kind: 'bracket', t0: T(c, prev.r), t1: T(c, next.r), label: '2 × R–R', at: 'bottom'}], mark: {t: (T(c, v.r) + T(c, next.r)) / 2}},
  ];
  return finish(steps, rr, {pvc: {prev, v, next}, normalQrs: width(c, beatGeo(row.trace, expR, fs)), early});
}

/** 심실 이단맥: N V N V 두 쌍 */
function bigeminyTour(c: Ctx): Tour | null {
  const {beats, fs} = c;
  for (let k = 1; k + 4 < beats.length; k++) {
    const q = beats.slice(k, k + 4); if (q.map(b => b.s).join('') !== 'NVNV') continue;
    const g = q.map(b => beatGeo(c.x, b.i, fs)), stop = stopAt(c, T(c, g[3].off) + .3); if (!fits(c, T(c, g[0].r) - .2, stop)) continue;
    const a = T(c, g[3].r - g[2].r), b = T(c, g[2].r - g[1].r);
    const steps: Step[] = [
      {id: 'alt', title: '정상 · 조기 박동 교대', value: '정상(N) · 심실 조기(V) 박동이 1 : 1로 번갈아 반복', stop, regions: both(T(c, g[0].r) - .15, T(c, g[3].off) + .12),
        calipers: g.map((x, i) => ({row: 'input' as const, kind: 'vline' as const, t0: T(c, x.r), t1: T(c, x.r), label: i % 2 ? 'V' : 'N', at: 'top' as const})), mark: {t: T(c, g[1].r)}},
      widthStep(c, 'wide', 'QRS 폭 확장', g[3], stop, (qq, nq) => `조기 박동 QRS ${f2(qq)} s · 정상 ${f2(nq)} s${crit(qq)}`),
      {id: 'rr', title: '짧은 · 긴 R–R 교대', value: `N → V ${f2(a)} s · V → N ${f2(b)} s 반복`, stop, regions: both(T(c, g[1].r) - .1, T(c, g[3].r) + .12),
        calipers: [{row: 'input', kind: 'bracket', t0: T(c, g[1].r), t1: T(c, g[2].r), label: `${f2(b)} s`, at: 'bottom'}, {row: 'input', kind: 'bracket', t0: T(c, g[2].r), t1: T(c, g[3].r), label: `${f2(a)} s`, at: 'bottom'}], mark: {t: T(c, g[2].r)}},
    ];
    return finish(steps, c.row.rr);
  }
  return null;
}

/** 심실 빈맥 짧은 연발: 주석 (VT 구간의 V 박동들 */
function vtTour(c: Ctx, rhythm: {r: string, a: number, b: number}[]): Tour | null {
  const {beats, fs} = c;
  for (const z of rhythm.filter(r => r.r === '(VT')) {
    const run = beats.filter(b => b.s === 'V' && b.i >= z.a - fs * .05 && b.i <= z.b + fs * .3); if (run.length < 3) continue;
    const before = beats.filter(b => b.i < run[0].i).slice(-2), g = run.map(b => beatGeo(c.x, b.i, fs)), last = g[g.length - 1];
    const stop = stopAt(c, T(c, last.off) + .25), t0 = before.length ? T(c, before[0].i) - .1 : T(c, g[0].on) - .2; if (!fits(c, t0, stop)) continue;
    const rrRun = med(run.slice(1).map((b, k) => (b.i - run[k].i) / fs)), rrPre = before.length === 2 ? (before[1].i - before[0].i) / fs : c.row.rr;
    const steps: Step[] = [
      {id: 'run', title: '넓은 QRS 연발', value: `넓은 QRS ${run.length}개 연속 (3개 이상 = 빈맥 연발)`, stop, regions: both(T(c, g[0].on) - .1, T(c, last.off) + .1),
        calipers: [{row: 'input', kind: 'bracket', t0: T(c, g[0].on), t1: T(c, last.off), label: `${run.length}개`, at: 'bottom'}], mark: {t: T(c, g[0].r)}},
      {id: 'rate', title: '심박수 급상승', value: `연발 중 ${Math.round(60 / rrRun)} bpm · 직전 ${Math.round(60 / rrPre)} bpm`, stop, regions: both(t0, T(c, last.r) + .1),
        calipers: [...(before.length === 2 ? [{row: 'input' as const, kind: 'bracket' as const, t0: T(c, before[0].i), t1: T(c, before[1].i), label: `${f2(rrPre)} s`, at: 'bottom' as const}] : []),
          {row: 'input', kind: 'bracket', t0: T(c, run[0].i), t1: T(c, run[1].i), label: `${f2((run[1].i - run[0].i) / fs)} s`, at: 'top'}], mark: {t: T(c, run[1].i)}},
      widthStep(c, 'wide', 'QRS 폭 확장', g[1], stop, (q, nq) => `연발 QRS ${f2(q)} s · 정상 ${f2(nq)} s${crit(q)}`),
    ];
    return finish(steps, c.row.rr);
  }
  return null;
}

/** 동서맥 · 긴 휴지: 표시 구간 10 s, 화면에 들어오는 가장 긴 휴지 */
function pauseTour(c: Ctx): Tour | null {
  const span = Math.max(c.span, 10), cc = {...c, span}, seq = c.beats.filter(b => BEAT.has(b.s)), fs = c.fs; let best = -1, len = 0;
  for (let k = 1; k + 1 < seq.length; k++) { const L = (seq[k].i - seq[k - 1].i) / fs, stop = stopAt(cc, T(c, seq[k].i) + .35); if (L > len && L < span - 2 && fits(cc, T(c, seq[k - 1].i) - .3, stop)) { len = L; best = k; } }
  if (best < 0 || len < 1.6 * c.row.rr) return null;
  const pg = beatGeo(c.x, seq[best - 1].i, fs), ng = beatGeo(c.x, seq[best].i, fs), stop = stopAt(cc, T(c, ng.off) + .3);
  const fills = c.row.placed.filter(p => p.kind === 'fill' && p.r > pg.r && p.r < ng.r);
  const steps: Step[] = [
    {id: 'pause', title: '긴 휴지', value: `R–R ${f2(len)} s · 평소 ${f2(c.row.rr)} s의 ${(len / c.row.rr).toFixed(1)}배`, stop, regions: both(T(c, pg.r) - .2, T(c, ng.r) + .2),
      calipers: [{row: 'input', kind: 'bracket', t0: T(c, pg.r), t1: T(c, ng.r), label: `${f2(len)} s`, at: 'bottom'}], mark: {t: (T(c, pg.r) + T(c, ng.r)) / 2}},
    {id: 'absent', title: '휴지 중 박동 부재', value: `정상이면 ${fills.length}번 뛰었을 자리 — P파 · QRS 모두 없음`, stop, regions: both(T(c, pg.off) + .1, T(c, ng.on) - .05),
      ghost: {t0: T(c, pg.r) + .3, t1: T(c, ng.r) - .3, shift: 0, base: baseline(c.x, ng.r, fs)},
      calipers: fills.map(p => ({row: 'normal' as const, kind: 'vline' as const, t0: T(c, p.r), t1: T(c, p.r), label: '', at: 'top' as const})), mark: {t: T(c, (fills[0]?.r ?? pg.r))}},
    widthStep(cc, 'shape', 'QRS 모양 유지', ng, stop, (q, nq) => `휴지 뒤 QRS ${f2(q)} s · 평소 ${f2(nq)} s — 박동 모양은 그대로`),
  ];
  return finish(steps, c.row.rr, {span});
}

/** 구간 [a,b)의 진동 폭: 양 끝을 잇는 직선(느린 기저선)을 뺀 최대 − 최소(mV) */
function swing(x: ArrayLike<number>, a: number, b: number) { let lo = Infinity, hi = -Infinity; const n = Math.max(1, b - a);
  for (let i = a; i < b; i++) { const v = x[i] - (x[a] + (x[b] - x[a]) * (i - a) / n); lo = Math.min(lo, v); hi = Math.max(hi, v); } return hi - lo; }
/** 주기 추정(자기상관, lag 0.15–0.32 s) — 박동/분, 상관이 약하면 NaN */
function flutterRate(x: ArrayLike<number>, a: number, b: number, fs: number) { const n = b - a; if (n < .45 * fs) return NaN; const m = Array.from({length: n}, (_, i) => x[a + i]), mu = m.reduce((p, q) => p + q, 0) / n, v = m.map(q => q - mu), e = v.reduce((p, q) => p + q * q, 0);
  let best = 0, lag = 0; for (let L = Math.round(.15 * fs); L <= Math.round(.32 * fs) && L < n - 10; L++) { let s = 0; for (let i = 0; i + L < n; i++) s += v[i] * v[i + L]; s /= e * (n - L) / n; if (s > best) { best = s; lag = L; } }
  return best > .45 && lag ? 60 / (lag / fs) : NaN; }

/** 심방세동 · 심방 조동 */
function atrialTour(c: Ctx, kind: 'afib' | 'afl'): Tour | null {
  const seq = c.beats.filter(b => BEAT.has(b.s)), fs = c.fs;
  let best = -1, score = -Infinity;
  for (let k = 3; k < seq.length; k++) { const q = seq.slice(k - 3, k + 1), rrs = q.slice(1).map((b, i) => (b.i - q[i].i) / fs), stop = stopAt(c, T(c, q[3].i) + .3);
    if (!fits(c, T(c, q[0].i) - .15, stop)) continue;
    const sc = kind === 'afib' ? Math.max(...rrs) - Math.min(...rrs) : rrs[2] + .3 * (Math.max(...rrs) - Math.min(...rrs));   // 세동: 불규칙이 큰 곳, 조동: 마지막 간격이 길어 톱니가 보이는 곳
    if (sc > score) { score = sc; best = k; } }
  if (best < 0) return null;
  const q = seq.slice(best - 3, best + 1), g = q.map(b => beatGeo(c.x, b.i, fs)), stop = stopAt(c, T(c, g[3].off) + .3), rrs = g.slice(1).map((b, i) => T(c, b.r - g[i].r));
  const tq0 = g[2].off + Math.round(.32 * fs), tq1 = g[3].on - Math.round(.03 * fs), last = g[3], pn = near(c, last.r);
    const pWin: Region[] = [{row: 'input', t0: T(c, last.r) - .3, t1: T(c, last.r) - .02}, {row: 'normal', t0: T(c, pn.r) - .3, t1: T(c, pn.r) - .02}];
  const pGhost = {t0: T(c, pn.r) - .32, t1: T(c, pn.r) + .08, shift: T(c, last.r - pn.r), base: baseline(c.x, last.r, fs)};
  if (kind === 'afib') {
    const steps: Step[] = [
      {id: 'irr', title: 'R–R 불규칙', value: `R–R ${rrs.map(f2).join(' · ')} s — 정상 기준은 ${f2(c.row.rr)} s 일정`, stop, regions: both(T(c, g[0].r) - .12, T(c, g[3].r) + .12),
        calipers: g.slice(1).map((b, i) => ({row: 'input' as const, kind: 'bracket' as const, t0: T(c, g[i].r), t1: T(c, b.r), label: `${f2(rrs[i])} s`, at: 'bottom' as const})), mark: {t: T(c, g[1].r)}},
      {id: 'nop', title: 'P파 소실', value: 'QRS 앞 P파 자리에 뚜렷한 P파 없음 — 정상은 P파가 선행', stop, regions: pWin, ghost: pGhost,
        calipers: [{row: 'input', kind: 'bracket', t0: T(c, last.r) - .25, t1: T(c, last.r) - .08, label: 'P파 자리', at: 'top'}, {row: 'normal', kind: 'bracket', t0: T(c, pn.r) - .25, t1: T(c, pn.r) - .08, label: 'P파', at: 'top'}], mark: {t: T(c, last.r) - .15}},
      {id: 'fwave', title: '기저선 잔물결(f파)', value: `QRS 사이 기저선이 불규칙하게 떨림 — 진동 폭 ${f2(swing(c.x, tq0, tq1))} mV, 정상은 평탄`, stop,
        regions: [{row: 'input', t0: T(c, tq0), t1: T(c, tq1)}, {row: 'normal', t0: T(c, tq0), t1: T(c, tq1)}],
        calipers: [{row: 'input', kind: 'bracket', t0: T(c, tq0), t1: T(c, tq1), label: 'f파', at: 'bottom'}], mark: {t: (T(c, tq0) + T(c, tq1)) / 2}},
    ];
    return finish(steps, c.row.rr);
  }
  const rate = flutterRate(c.x, tq0, tq1, fs), okRate = rate >= 200 && rate <= 350;
  const steps: Step[] = [
    {id: 'fwave', title: '톱니 모양 F파', value: okRate ? `QRS 사이 규칙적 톱니(F파) ≈ ${Math.round(rate / 10) * 10} /분 — P파 대신` : 'QRS 사이 규칙적 톱니(F파) — P파 대신', stop,
      regions: [{row: 'input', t0: T(c, g[2].off) + .05, t1: T(c, tq1)}, {row: 'normal', t0: T(c, g[2].off) + .05, t1: T(c, tq1)}], ghost: pGhost,
      calipers: [{row: 'input', kind: 'bracket', t0: T(c, g[2].off) + .08, t1: T(c, tq1), label: 'F파', at: 'bottom'}], mark: {t: (T(c, g[2].off) + T(c, tq1)) / 2}},
    {id: 'cond', title: '전도 변동', value: okRate ? `R–R ${rrs.map(f2).join(' · ')} s ≈ F파 ${rrs.map(v => Math.round(v * rate / 60)).join(' · ')}개마다 한 번 전도` : `R–R ${rrs.map(f2).join(' · ')} s — F파 몇 개마다 한 번씩 전도`, stop,
      regions: both(T(c, g[0].r) - .1, T(c, g[3].r) + .1),
      calipers: g.slice(1).map((b, i) => ({row: 'input' as const, kind: 'bracket' as const, t0: T(c, g[i].r), t1: T(c, b.r), label: `${f2(rrs[i])} s`, at: 'bottom' as const})), mark: {t: T(c, g[1].r)}},
    widthStep(c, 'narrow', 'QRS 폭 유지', last, stop, (qq, nq) => `QRS ${f2(qq)} s · 정상 기준 ${f2(nq)} s — 심실 전도는 정상 경로`),
  ];
  return finish(steps, c.row.rr);
}

/** 좌각 · 우각 차단 */
function bundleTour(c: Ctx, kind: 'lbbb' | 'rbbb'): Tour | null {
  const seq = c.beats.filter(b => BEAT.has(b.s)), fs = c.fs;
  const k = seq.findIndex((b, i) => i >= 3 && fits(c, T(c, seq[i - 3].i), stopAt(c, T(c, b.i) + .45)) && seq[i - 1].s === b.s && seq[i + 1]?.s === b.s); if (k < 0) return null;
  const g = beatGeo(c.x, seq[k].i, fs), stop = stopAt(c, T(c, g.r) + .45), pn = near(c, g.r), n = beatGeo(c.row.trace, pn.r, fs), base = baseline(c.x, g.r, fs);
  const w = widthStep(c, 'wide', 'QRS 폭 확장', g, stop, (q, nq) => `QRS ${f2(q)} s · 정상 기준 ${f2(nq)} s · ${(q / Math.max(.01, nq)).toFixed(1)}배${q >= .12 ? ', 기준 ≥ 0.12 s' : ''}`);
  const alignR: Ghost = {t0: T(c, n.on) - .1, t1: T(c, n.off) + .3, shift: T(c, g.r - n.r), base};
  if (kind === 'lbbb') {
    // 꼭대기 갈라짐: QRS 안 극대점(주 방향, 진폭 40 % 이상) 개수
    const sgn = g.qrsSign || 1, amp = Math.max(...Array.from({length: g.off - g.on + 1}, (_, i) => sgn * (c.x[g.on + i] - base))); let peaks = 0;
    for (let i = g.on + 2; i < g.off - 2; i++) { const v = sgn * (c.x[i] - base); if (v > .4 * amp && v >= sgn * (c.x[i - 2] - base) && v > sgn * (c.x[i + 2] - base)) { peaks++; i += Math.round(.02 * fs); } }
    const opp = g.tSign !== 0 && g.qrsSign !== 0 && g.tSign !== g.qrsSign;
    const third: Step = opp ? {id: 'tinv', title: 'T파 역방향', value: 'T파가 QRS 주 방향과 반대 — 재분극도 바뀐 경로(이차성 변화)', stop, regions: [{row: 'input', t0: T(c, g.t[0]), t1: T(c, g.t[1])}, {row: 'normal', t0: T(c, n.t[0]), t1: T(c, n.t[1])}],
      ghost: alignR, calipers: [{row: 'input', kind: 'bracket', t0: T(c, g.t[0]), t1: T(c, g.t[1]), label: g.tSign > 0 ? 'T ↑' : 'T ↓', at: g.tSign > 0 ? 'bottom' : 'top'}, {row: 'normal', kind: 'bracket', t0: T(c, n.t[0]), t1: T(c, n.t[1]), label: n.tSign > 0 ? 'T ↑' : 'T ↓', at: n.tSign > 0 ? 'bottom' : 'top'}], mark: {t: T(c, (g.t[0] + g.t[1]) / 2)}}
      : rhythmStep(c, seq, k, stop);
    return finish([w, {id: 'shape', title: 'QRS 형태 변화', value: peaks >= 2 ? 'R파 꼭대기가 갈라짐(홈) — 정상은 뾰족한 한 봉우리' : '넓고 뭉툭한 R파 — 정상은 좁고 뾰족한 R파', stop,
      regions: [{row: 'input', t0: T(c, g.on) - .06, t1: T(c, g.off) + .06}, {row: 'normal', t0: T(c, n.on) - .06, t1: T(c, n.off) + .06}], ghost: alignR, calipers: [], mark: {t: T(c, g.r)}}, third], c.row.rr);
  }
  // 우각: R 정점(가장 큰 편위) → QRS 끝 길이 비교
  const peak = (x: ArrayLike<number>, geo: BeatGeo, b0: number) => { let p = geo.on; for (let i = geo.on; i <= geo.off; i++) if (Math.abs(x[i] - b0) > Math.abs(x[p] - b0)) p = i; return p; };
  const pk = peak(c.x, g, base), pkn = peak(c.row.trace, n, 0), tl = T(c, g.off - pk), tln = T(c, n.off - pkn);
  return finish([w,
    {id: 'term', title: 'QRS 말단 지연', value: `정점 → QRS 끝 ${f2(tl)} s · 정상 기준 ${f2(tln)} s — 우심실이 늦게 탈분극`, stop,
      regions: [{row: 'input', t0: T(c, pk) - .03, t1: T(c, g.off) + .05}, {row: 'normal', t0: T(c, pkn) - .03, t1: T(c, n.off) + .05}], ghost: alignR,
      calipers: [{row: 'input', kind: 'bracket', t0: T(c, pk), t1: T(c, g.off), label: `${f2(tl)} s`, at: 'top'}, {row: 'normal', kind: 'bracket', t0: T(c, pkn), t1: T(c, n.off), label: `${f2(tln)} s`, at: 'top'}], mark: {t: T(c, g.off)}},
    rhythmStep(c, seq, k, stop)], c.row.rr);
}
function rhythmStep(c: Ctx, seq: Beat[], k: number, stop: number): Step {
  const q = seq.slice(Math.max(0, k - 3), k + 1), rrs = q.slice(1).map((b, i) => (b.i - q[i].i) / c.fs), m = med(rrs);
  return {id: 'regular', title: '리듬 규칙 유지', value: `R–R ${rrs.map(f2).join(' · ')} s 일정(${Math.round(60 / m)} bpm) — 박자는 정상, 전도 경로만 다름`, stop, regions: both(T(c, q[0].i) - .1, T(c, q[q.length - 1].i) + .1),
    calipers: q.slice(1).map((b, i) => ({row: 'input' as const, kind: 'bracket' as const, t0: T(c, q[i].i), t1: T(c, b.i), label: `${f2(rrs[i])} s`, at: 'bottom' as const})), mark: {t: T(c, q[1].i)}};
}

/** 2도 방실 차단(2:1): 두 QRS 사이의 전도되지 않은 P파 */
function avbTour(c: Ctx): Tour | null {
  const seq = c.beats.filter(b => BEAT.has(b.s)), fs = c.fs;
  for (let k = 2; k < seq.length; k++) {
    const a = beatGeo(c.x, seq[k - 1].i, fs), b = beatGeo(c.x, seq[k].i, fs), stop = stopAt(c, T(c, b.off) + .3); if (!fits(c, T(c, seq[k - 2].i) - .1, stop)) continue;
    const fill = c.row.placed.find(p => p.kind === 'fill' && p.r > a.r && p.r < b.r); if (!fill) continue;
    // 막힌 P: 채운 박동의 P 자리(R − 0.3 ~ − 0.05 s)에서 기준선 대비 가장 큰 양의 편위
    const b0 = baseline(c.x, b.r, fs); let pi = fill.r - Math.round(.3 * fs); for (let i = pi; i < fill.r - Math.round(.03 * fs); i++) if (c.x[i] - b0 > c.x[pi] - b0) pi = i;
    const rr = (b.r - a.r) / fs, nb = beatGeo(c.row.trace, fill.r, fs);
    const steps: Step[] = [
      {id: 'blocked', title: '전도되지 않은 P파', value: 'P파 뒤 QRS 없음 — 정상이면 이 P파 뒤에 QRS', stop, regions: [{row: 'input', t0: T(c, pi) - .14, t1: T(c, pi) + .2}, {row: 'normal', t0: T(c, nb.on) - .22, t1: T(c, nb.off) + .08}],
        ghost: {t0: T(c, fill.r) - .3, t1: T(c, fill.r) + .3, shift: 0, base: b0},
        calipers: [{row: 'input', kind: 'vline', t0: T(c, pi), t1: T(c, pi), label: 'P', at: 'top'}], mark: {t: T(c, pi)}},
      {id: 'half', title: '심실 박동수 절반', value: `QRS ${Math.round(60 / rr)} bpm · P파 ${Math.round(120 / rr)} bpm — P파 2개 중 1개만 전도(2 : 1)`, stop, regions: both(T(c, a.r) - .1, T(c, b.r) + .1),
        calipers: [{row: 'input', kind: 'bracket', t0: T(c, a.r), t1: T(c, b.r), label: `${f2(rr)} s`, at: 'bottom'}, {row: 'normal', kind: 'bracket', t0: T(c, a.r), t1: T(c, fill.r), label: `${f2(T(c, fill.r - a.r))} s`, at: 'bottom'}], mark: {t: (T(c, a.r) + T(c, b.r)) / 2}},
      widthStep(c, 'narrow', 'QRS 폭 유지', b, stop, (q, nq) => `전도된 박동 QRS ${f2(q)} s · 정상 ${f2(nq)} s — 차단은 QRS 앞에서`),
    ];
    return finish(steps, c.row.rr);
  }
  return null;
}

/** 질환별 투어. rhythm = 주석 리듬 구간(심실 빈맥). */
export function buildTour(id: string, x: Float32Array, beats: Beat[], fs: number, row: NormalRow, span: number, rhythm: {r: string, a: number, b: number}[] = []): Tour | null {
  const c: Ctx = {x, beats, fs, row, span, dur: x.length / fs};
  switch (id) {
    case 'pvc': return earlyTour(c, 'V');
    case 'apc': return earlyTour(c, 'A');
    case 'bigeminy': return bigeminyTour(c);
    case 'vt': return vtTour(c, rhythm);
    case 'sbr': return pauseTour(c);
    case 'afib': case 'afl': return atrialTour(c, id);
    case 'lbbb': case 'rbbb': return bundleTour(c, id);
    case 'avb2': return avbTour(c);
    default: return null;
  }
}
/** D-192 호환: 심실 조기 수축 */
export const pvcTour = (x: Float32Array, beats: Beat[], fs: number, row: NormalRow, span: number) => buildTour('pvc', x, beats, fs, row, span);
