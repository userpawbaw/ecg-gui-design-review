// Hover analysis from per-frame change energy inside the target's rectangle (local) and elsewhere (outside).
// Timeline of a hover stage is fixed by HOVER_TIMING: glide in → dwell → glide out → settle.
import {HOVER_TIMING as T} from './script.mjs';

const r2 = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * local / outside / all: change energy per frame of the stage (frame 0 may be null), stepMs: frame length.
 * reacted = the picture changes while the pointer rests on the target (peak of the whole frame well above its calm level after the pointer left).
 * scope = 'local' when the target's box changes ≥ 3× more than the rest, else 'global' (e.g. the whole scene dims on a nav-link hover).
 */
export function hoverMetrics(local, outside, all, stepMs, {minPeak = 1.5, factor = 4, ratio = 3} = {}) {
  const arrive = Math.round(T.glideIn / stepMs), exit = Math.round((T.glideIn + T.dwell) / stepMs);
  const val = (a) => a.map((v) => (Number.isFinite(v) ? v : 0)), mean = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const med = (a) => {const s = [...a].sort((x, y) => x - y);return s.length ? s[s.length >> 1] : 0;};
  const L = val(local), O = val(outside), A = val(all);
  const dwellL = L.slice(arrive, exit), dwellO = O.slice(arrive, exit), dwellA = A.slice(arrive, exit);
  if (dwellA.length < 3) return {reacted: false, reason: 'dwell window too short'};
  const calm = med(A.slice(-15)), peakAll = Math.max(...dwellA), peakIdx = dwellA.indexOf(peakAll);
  const ex = (v) => Math.max(0, v - calm);   // timing is measured on the change above the calm level, not on background motion
  const total = dwellA.reduce((s, v) => s + ex(v), 0);
  const cumAt = (q) => {let c = 0;for (let i = 0; i < dwellA.length; i++) {c += ex(dwellA[i]);if (c >= q * total) return i;}return dwellA.length - 1;};
  const afterExit = A.slice(exit), exitTotal = afterExit.reduce((s, v) => s + ex(v), 0);
  const ratioLO = mean(dwellL) / Math.max(mean(dwellO), 0.02);
  // a small element (button colour, underline) barely moves the whole-frame mean: also count a clear change inside the target's own box
  const lPeak = Math.max(...dwellL), lCalm = med(L.slice(-15));
  const reactedLocal = lPeak >= Math.max(1, 6 * lCalm) && ratioLO >= ratio;
  const reacted = peakAll >= Math.max(minPeak, factor * calm) || reactedLocal;
  return {
    reacted, scope: !reacted ? null : ratioLO >= ratio ? 'local' : 'global', peakLocal: r2(lPeak), peakAll: r2(peakAll), calmLevel: r2(calm), peakAtMsAfterArrival: r2(peakIdx * stepMs, 0),
    dwellMeanLocal: r2(mean(dwellL)), dwellMeanOutside: r2(mean(dwellO)), localToOutsideRatio: r2(ratioLO),
    effectT50Ms: r2(cumAt(0.5) * stepMs, 0), effectT90Ms: r2(cumAt(0.9) * stepMs, 0),
    changeAfterExitShare: r2(exitTotal / Math.max(1e-6, exitTotal + total), 2),   // share of all change that happens after the pointer left: > 0.3 = a visible reverse animation
    rule: `reacted = whole-frame peak during dwell ≥ max(${minPeak}, ${factor} × calm level); scope local if box/outside ≥ ${ratio}; arrival at ${T.glideIn} ms, exit at ${T.glideIn + T.dwell} ms into the stage`,
  };
}

/** ticks [{stage}] with energies [{local, outside}] and script notes → {stage: {target, metrics}} for every hover stage. */
export function hoverReport(ticks, energies, notes, stepMs) {
  const targets = (notes || []).filter((n) => n.key === 'stageTarget').map((n) => n.value), out = {};
  for (const t of targets) {
    const idx = ticks.map((x, i) => (x.stage === t.stage ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) continue;
    out[t.stage] = {target: {label: t.label, tag: t.tag, rect: [t.l, t.t, t.w, t.h]}, frames: idx.length, metrics: hoverMetrics(idx.map((i) => energies[i].local), idx.map((i) => energies[i].outside), idx.map((i) => energies[i].all), stepMs)};
  }
  return out;
}

/** Rectangle to measure for a stage: the target's box (the python helper pads it). */
export const rectOf = (notes, stage) => {const n = (notes || []).find((x) => x.key === 'stageTarget' && x.value.stage === stage);return n ? [n.value.l, n.value.t, n.value.w, n.value.h] : null;};

import {DRAG_TIMING as DT} from './script.mjs';

/**
 * Drag stage: press at 0, move for DT.glide, hold DT.hold, release at glide+hold, then DT.after of watching.
 * reacted = the picture changes while dragging; inertiaMs = how long it keeps moving after the release before it is calm again
 * (null = never calm within the window); afterShare = share of all change that happens after the release.
 */
export function dragMetrics(all, stepMs, {minPeak = 1, factor = 4} = {}) {
  const A = all.map((v) => (Number.isFinite(v) ? v : 0)), rel = Math.round((DT.glide + DT.hold) / stepMs), hold = Math.round(300 / stepMs);
  if (A.length < rel + hold) return {reacted: false, reason: 'stage too short'};
  const med = (a) => {const s = [...a].sort((x, y) => x - y);return s.length ? s[s.length >> 1] : 0;};
  const calm = med(A.slice(-15)), during = A.slice(0, rel), after = A.slice(rel), peak = Math.max(...during), thr = Math.max(calm * 1.5 + 0.1, 0.3);
  let inertia = null;
  for (let k = 0; k + hold <= after.length; k++) if (after.slice(k, k + hold).every((v) => v <= thr)) {inertia = r2(k * stepMs, 0);break;}
  const ex = (v) => Math.max(0, v - calm), sumD = during.reduce((s, v) => s + ex(v), 0), sumA = after.reduce((s, v) => s + ex(v), 0);
  return {reacted: peak >= Math.max(minPeak, factor * calm), peakDuringDrag: r2(peak), calmLevel: r2(calm), inertiaMs: inertia, afterShare: r2(sumA / Math.max(1e-6, sumA + sumD)),
    meanDuring: r2(during.reduce((s, v) => s + v, 0) / during.length), meanAfter: r2(after.reduce((s, v) => s + v, 0) / after.length),
    rule: 'reacted = peak while pressed ≥ max(' + minPeak + ', ' + factor + ' × calm); inertia = ms after release until change stays at calm level for 300 ms'};
}

/** ticks [{stage}] + energies [{all}] + notes → {stage: {target, metrics}} for the drag stages. */
export function dragReport(ticks, energies, notes, stepMs) {
  const out = {};
  for (const n of (notes || []).filter((x) => x.key === 'stageTarget' && /^g\d-drag/.test(x.value.stage))) {
    const idx = ticks.map((x, i) => (x.stage === n.value.stage ? i : -1)).filter((i) => i >= 0);
    if (idx.length) out[n.value.stage] = {label: n.value.label, frames: idx.length, metrics: dragMetrics(idx.map((i) => energies[i].all), stepMs)};
  }
  return out;
}
