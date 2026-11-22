/* D-191 질환 특징 비교 — 정상 · 질환 원파형에서 특징 부위를 계산한다(DOM 없음, 시험 가능).
 * 근거: R = MIT-BIH 전문의 박동 주석(beats.i · beats.s). QRS 시작 · 끝 = R 주변 원파형 기울기가 그 박동 최대 기울기의 12 % 아래로
 * 내려가는 첫 점(추정). P 자리 = R − 0.22 ~ − 0.08 s, T 자리 = QRS 끝 + 0.05 ~ + 0.35 s(시간 창), 방향 = 그 창의 기준선 대비 최대 편위 부호. */
export type Beat = {i: number, s: string};
export type BeatGeo = {r: number, on: number, off: number, qrsSign: number, tSign: number, p: [number, number], t: [number, number], qrsS: number};
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
/** 기준선: R 주변 ±0.6 s 중앙값(대부분 등전위선). R 앞 짧은 구간으로 잡았더니 조기 박동은 앞 박동의 T파가 걸려 기준선이 올라갔다(PVC 시험에서 발견). */
function baseline(x: ArrayLike<number>, r: number, fs: number) { const a: number[] = []; for (let k = r - Math.round(.6 * fs); k < r + Math.round(.6 * fs); k++) if (k >= 0 && k < x.length) a.push(x[k]); return a.length ? med(a) : 0; }
export function beatGeo(x: ArrayLike<number>, r: number, fs: number): BeatGeo {
  const W = Math.round(.2 * fs), d = (k: number) => Math.abs((x[Math.min(x.length - 1, k + 1)] ?? 0) - (x[Math.max(0, k - 1)] ?? 0));
  let dmax = 0; for (let k = r - W; k <= r + W; k++) if (k > 0 && k < x.length - 1) dmax = Math.max(dmax, d(k));
  const thr = .12 * dmax, run = Math.max(2, Math.round(.012 * fs)), b0 = baseline(x, r, fs);   // 문턱 아래가 12 ms 이어져야 끝
  let amp = 0; for (let k = r - W; k <= r + W; k++) if (k >= 0 && k < x.length) amp = Math.max(amp, Math.abs(x[k] - b0));
  // 기울기가 작고 기준선 가까이(진폭의 25 % 안) 돌아왔을 때 — 넓은 QRS의 골짜기 바닥(기울기 0, 기준선에서 멂)을 끝으로 보지 않게(PVC 시험에서 발견)
  const edge = (dir: number) => { let k = r, quiet = 0; for (let n = 0; n < W; n++, k += dir) { if (k <= 1 || k >= x.length - 2) break; quiet = d(k) < thr && Math.abs(x[k] - b0) < .25 * amp ? quiet + 1 : 0; if (quiet >= run) return k - dir * (run - 1); } return r + dir * Math.round(.05 * fs); };
  const on = edge(-1), off = edge(1);
  let qx = 0; for (let k = on; k <= off; k++) if (Math.abs(x[k] - b0) > Math.abs(qx)) qx = x[k] - b0;
  const t: [number, number] = [off + Math.round(.05 * fs), off + Math.round(.35 * fs)];
  let tx = 0; for (let k = t[0]; k <= t[1] && k < x.length; k++) if (Math.abs(x[k] - b0) > Math.abs(tx)) tx = x[k] - b0;
  return {r, on, off, qrsSign: Math.sign(qx), tSign: Math.sign(tx), p: [r - Math.round(.22 * fs), r - Math.round(.08 * fs)], t, qrsS: (off - on) / fs};
}
/** 같은 기호 박동 사이 R–R 중앙값(초) */
export function rrMedian(beats: Beat[], sym: string, fs: number) { const a: number[] = []; for (let k = 1; k < beats.length; k++) if (beats[k].s === sym && beats[k - 1].s === sym) a.push((beats[k].i - beats[k - 1].i) / fs); return med(a); }

/** 심실 조기 수축: N(앞) → V → N(뒤) 를 고른다 — 앞 · 뒤가 정상, 앞의 앞도 정상(정상 R–R를 볼 수 있게). 보상 휴지 비(앞 N → 뒤 N) / (2 × 정상 R–R)가 1에 가장 가까운 것. */
export function pickPvc(beats: Beat[], fs: number) {
  const rr = rrMedian(beats, 'N', fs); let best = -1, err = Infinity;
  for (let k = 2; k < beats.length - 1; k++) {
    if (beats[k].s !== 'V' || beats[k - 1].s !== 'N' || beats[k + 1].s !== 'N' || beats[k - 2].s !== 'N') continue;
    const e = Math.abs((beats[k + 1].i - beats[k - 1].i) / fs / (2 * rr) - 1); if (e < err) { err = e; best = k; }
  }
  return best < 0 ? null : {prev: beats[best - 1].i, v: beats[best].i, next: beats[best + 1].i, rr, pause: (beats[best + 1].i - beats[best - 1].i) / fs / rr};
}
/** 정상 세 박동(N N N) 중 R–R가 중앙값에 가장 가까운 것 — 정상 줄의 시작 박동 */
export function pickNormal(beats: Beat[], fs: number) {
  const rr = rrMedian(beats, 'N', fs); let best = -1, err = Infinity;
  for (let k = 0; k < beats.length - 2; k++) { if (beats[k].s !== 'N' || beats[k + 1].s !== 'N' || beats[k + 2].s !== 'N') continue;
    const e = Math.abs((beats[k + 1].i - beats[k].i) / fs - rr) + Math.abs((beats[k + 2].i - beats[k + 1].i) / fs - rr); if (e < err) { err = e; best = k; } }
  return best < 0 ? null : {a: beats[best].i, b: beats[best + 1].i, c: beats[best + 2].i, rr};
}
