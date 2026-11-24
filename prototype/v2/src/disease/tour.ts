/* D-192 질환 특징 투어 — 정상 기준 행(N1)과 특징 단계 계획(DOM 없음, 시험 가능).
 * 정상 기준 행: 같은 기록의 정상(N) 박동을 R에 맞춰 중앙값으로 만든 평균 박동을, 질환 행의 정상 박동 R에는 그대로, 이상 박동 자리에는
 * 「앞 R + 정상 R–R」(정상이면 왔을 자리)에 놓는다. 실측 파형이 아니므로 화면 이름에 「합성」을 밝힌다.
 * 특징 위치: R = 전문의 주석, QRS 시작 · 끝 = features.beatGeo(기울기 + 기준선 추정). 수치는 여기서 계산한 고정값. */
import {beatGeo, baseline, rrMedian, type Beat, type BeatGeo} from './features';

const BEAT = new Set('NLRAaJSVFejE/fQ'.split(''));
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

export type NormalRow = {trace: Float32Array, rr: number, placed: {r: number, kind: 'N' | 'exp'}[], pre: number, post: number};
/** N1 정상 기준 행. x = 질환 원파형(mV), beats = 같은 구간 박동 주석(표본 위치). */
export function buildNormalRow(x: Float32Array, beats: Beat[], fs: number): NormalRow | null {
  const rr = rrMedian(beats, 'N', fs); if (!Number.isFinite(rr)) return null;
  const rrS = Math.round(rr * fs), pre = Math.round(.3 * fs), post = Math.min(Math.round(.55 * fs), rrS - pre - 2);
  const src = beats.filter((b, k) => b.s === 'N' && beats[k - 1]?.s === 'N' && beats[k + 1]?.s === 'N' && b.i - pre >= 0 && b.i + post < x.length).slice(0, 80);
  if (src.length < 3) return null;
  const L = pre + post + 1, tpl = new Float32Array(L), col: number[] = [];
  const bases = src.map(b => baseline(x, b.i, fs));
  for (let j = 0; j < L; j++) { col.length = 0; src.forEach((b, q) => col.push(x[b.i - pre + j] - bases[q])); tpl[j] = med(col); }
  // 양 끝을 0으로: 끝점 사이 직선을 빼고 30 ms 코사인 테이퍼(이웃 박동과 더할 때 이음매가 생기지 않게)
  const e0 = tpl[0], e1 = tpl[L - 1], tw = Math.round(.03 * fs);
  for (let j = 0; j < L; j++) { tpl[j] -= e0 + (e1 - e0) * j / (L - 1); const w = j < tw ? j / tw : L - 1 - j < tw ? (L - 1 - j) / tw : 1; tpl[j] *= .5 - .5 * Math.cos(Math.PI * w); }
  const out = new Float32Array(x.length), placed: NormalRow['placed'] = [], seq = beats.filter(b => BEAT.has(b.s));
  let last = -Infinity;
  seq.forEach((b, k) => {
    let r: number, kind: 'N' | 'exp';
    if (b.s === 'N') { r = b.i; kind = 'N'; }
    else { if (!Number.isFinite(last)) return; r = last + rrS; kind = 'exp';
      const nx = seq.slice(k + 1).find(z => z.s === 'N'); if (nx && nx.i - r < .6 * rrS) return; }   // 바로 뒤 정상 박동과 겹치면 놓지 않음
    for (let j = 0; j < L; j++) { const i = r - pre + j; if (i >= 0 && i < out.length) out[i] += tpl[j]; }
    placed.push({r, kind}); last = r;
  });
  return {trace: out, rr, placed, pre, post};
}

/** 특징 한 단계: 초점 구간(행별, 초), 멈출 시각, 유령, 측정 표식. 시간은 모두 자료 시작 기준 초. */
export type Region = {row: 'input' | 'normal', t0: number, t1: number};
export type Caliper = {row: 'input' | 'normal', kind: 'arrow' | 'bracket' | 'vline', t0: number, t1: number, label: string, at: 'top' | 'bottom'};
export type Ghost = {t0: number, t1: number, shift: number, base: number};   // 정상 행 [t0,t1]을 shift 초 옮겨 질환 행(기준선 base mV)에 겹침
export type Step = {id: string, title: string, value: string, stop: number, regions: Region[], ghost?: Ghost, calipers: Caliper[], mark: {t: number}};
export type Tour = {steps: Step[], start: number, pvc: {prev: BeatGeo, v: BeatGeo, next: BeatGeo}, normalQrs: number, early: number, rr: number};

/** 심실 조기 수축: N → V → N 중 보상 휴지가 정상 R–R × 2에 가장 가깝고, 화면 앞쪽 여유(lead s)가 있는 것. span = 표시 구간(초). */
export function pvcTour(x: Float32Array, beats: Beat[], fs: number, row: NormalRow, span: number, lead = 2.5): Tour | null {
  const rr = row.rr, dur = x.length / fs; let best = -1, err = Infinity;
  for (let k = 2; k < beats.length - 1; k++) {
    if (beats[k].s !== 'V' || beats[k - 1].s !== 'N' || beats[k + 1].s !== 'N' || beats[k - 2].s !== 'N') continue;
    const tPrev = beats[k - 1].i / fs, tNext = beats[k + 1].i / fs;
    if (tPrev - lead - .4 * span < 0 || tNext + .5 * span > dur) continue;
    const e = Math.abs((beats[k + 1].i - beats[k - 1].i) / fs / (2 * rr) - 1); if (e < err) { err = e; best = k; }
  }
  if (best < 0) return null;
  const prev = beatGeo(x, beats[best - 1].i, fs), v = beatGeo(x, beats[best].i, fs), next = beatGeo(x, beats[best + 1].i, fs);
  const T = (i: number) => i / fs, exp = row.placed.find(p => p.kind === 'exp' && Math.abs(p.r - (prev.r + Math.round(rr * fs))) < 3);
  const expR = exp ? exp.r : prev.r + Math.round(rr * fs), nGeo = beatGeo(row.trace, expR, fs), early = T(expR - v.r);
  const base = baseline(x, v.r, fs), at = (frac: number, endT: number) => endT + (1 - frac) * span;   // endT가 화면 frac 자리에 오도록 멈출 시각
  const nq = T(nGeo.off - nGeo.on), vq = T(v.off - v.on), a = T(v.r - prev.r), b = T(next.r - v.r);
  const s1 = at(.9, T(expR) + .2), s3 = at(.92, T(next.off) + .2);   // 특징 끝이 오른쪽 끝 가까이 — 다음 박동은 아직 그려지지 않은 채 멈춤
  const steps: Step[] = [
    {id: 'early', title: 'R파 조기 출현', value: `예상 R 시점보다 ${early.toFixed(2)} s 선행`, stop: s1,
      regions: [{row: 'input', t0: T(v.on) - .12, t1: T(expR) + .14}, {row: 'normal', t0: T(v.on) - .12, t1: T(expR) + .14}],
      ghost: {t0: T(expR) - .2, t1: T(expR) + .3, shift: 0, base},
      calipers: [{row: 'input', kind: 'vline', t0: T(expR), t1: T(expR), label: '예상 R', at: 'top'}, {row: 'normal', kind: 'vline', t0: T(expR), t1: T(expR), label: '', at: 'top'},
        {row: 'input', kind: 'arrow', t0: T(expR), t1: T(v.r), label: `${early.toFixed(2)} s`, at: 'top'}], mark: {t: T(v.r)}},
    {id: 'wide', title: 'QRS 폭 확장', value: `QRS ${vq.toFixed(2)} s · 정상 ${nq.toFixed(2)} s (기준 ≥ 0.12 s)`, stop: s1,
      regions: [{row: 'input', t0: T(v.on) - .07, t1: T(v.off) + .07}, {row: 'normal', t0: T(nGeo.on) - .07, t1: T(nGeo.off) + .07}],
      ghost: {t0: T(nGeo.on) - .12, t1: T(nGeo.off) + .18, shift: T(v.on - nGeo.on), base},
      calipers: [{row: 'input', kind: 'bracket', t0: T(v.on), t1: T(v.off), label: `${vq.toFixed(2)} s`, at: 'top'},
        {row: 'normal', kind: 'bracket', t0: T(nGeo.on), t1: T(nGeo.off), label: `${nq.toFixed(2)} s`, at: 'top'}], mark: {t: (T(v.on) + T(v.off)) / 2}},
    {id: 'pause', title: '보상성 휴지', value: `전후 R–R ${(a + b).toFixed(2)} s = 정상 R–R ${rr.toFixed(2)} s × ${((a + b) / rr).toFixed(2)}`, stop: s3,
      regions: [{row: 'input', t0: T(prev.r) - .1, t1: T(next.r) + .12}, {row: 'normal', t0: T(prev.r) - .1, t1: T(next.r) + .12}],
      ghost: {t0: T(prev.r) + .25, t1: T(next.r) - .2, shift: 0, base},
      calipers: [{row: 'input', kind: 'bracket', t0: T(prev.r), t1: T(v.r), label: `${a.toFixed(2)} s`, at: 'bottom'}, {row: 'input', kind: 'bracket', t0: T(v.r), t1: T(next.r), label: `${b.toFixed(2)} s`, at: 'bottom'},
        {row: 'normal', kind: 'bracket', t0: T(prev.r), t1: T(next.r), label: `2 × R–R`, at: 'bottom'}], mark: {t: (T(v.r) + T(next.r)) / 2}},
  ];
  return {steps, start: Math.max(0, s1 - lead - 1), pvc: {prev, v, next}, normalQrs: nq, early, rr};
}
