// Pure analysis helpers for the capture tool (no browser, no file access) so they can be unit-tested with fake frames/traces.
import {createHash} from 'node:crypto';

export const REGION_GRID = 3;

/** Mean absolute RGB difference (0–255) between two equally sized RGBA images, whole frame plus a 3×3 region grid. */
export function diffEnergy(a, b, {stride = 2} = {}) {
  if (a.width !== b.width || a.height !== b.height) throw new Error(`frame size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  const sum = new Float64Array(REGION_GRID * REGION_GRID), cnt = new Float64Array(REGION_GRID * REGION_GRID);
  for (let y = 0; y < a.height; y += stride) {
    const ry = Math.min(REGION_GRID - 1, Math.floor(y * REGION_GRID / a.height));
    for (let x = 0; x < a.width; x += stride) {
      const i = (y * a.width + x) * 4, r = ry * REGION_GRID + Math.min(REGION_GRID - 1, Math.floor(x * REGION_GRID / a.width));
      sum[r] += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
      cnt[r] += 3;
    }
  }
  const regions = [...sum].map((s, k) => round(s / Math.max(1, cnt[k])));
  return {all: round(sum.reduce((p, c) => p + c, 0) / Math.max(1, cnt.reduce((p, c) => p + c, 0))), regions};
}

/** Number of differing pixels and the largest per-channel difference — tells GPU rounding noise (a few pixels, ±1 level) from real divergence. */
export function pixelDelta(a, b) {
  if (a.width !== b.width || a.height !== b.height) throw new Error('frame size mismatch');
  let count = 0, maxChannel = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d) {count++;if (d > maxChannel) maxChannel = d;}
  }
  return {count, maxChannel};
}

export const frameHash = (img) => createHash('sha1').update(img.data).digest('hex').slice(0, 16);
const round = (v, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

/** Evenly spaced frame indices (first and last included) — n=12 gives the per-segment contact sheet. */
export function selectFrames(total, n = 12) {
  if (total <= 0) return [];
  if (total <= n) return Array.from({length: total}, (_, i) => i);
  return Array.from({length: n}, (_, i) => Math.round(i * (total - 1) / (n - 1)));
}

/** Frames where the picture actually changes: [start, end] around energies above ratio × max (padded). Null when nothing moves. */
export function activeWindow(energies, {ratio = 0.1, pad = 2} = {}) {
  const max = Math.max(0, ...energies.filter(Number.isFinite));
  if (max <= 0) return null;
  let s = -1, e = -1;
  energies.forEach((v, i) => {if (v >= max * ratio) {if (s < 0) s = i;e = i;}});
  return {start: Math.max(0, s - pad), end: Math.min(energies.length - 1, e + pad)};
}

/** Frames whose change energy jumps well above their neighbours — a skipped intermediate state shows up as one. */
export function findJumps(energies, {window = 4, factor = 3, floor = 1} = {}) {
  const out = [];
  energies.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const nb = [];
    for (let k = Math.max(0, i - window); k <= Math.min(energies.length - 1, i + window); k++) if (k !== i && Number.isFinite(energies[k])) nb.push(energies[k]);
    if (nb.length && v > factor * median(nb) + floor) out.push({index: i, energy: v, neighbourMedian: round(median(nb))});
  });
  return out;
}

export function median(a) {if (!a.length) return NaN;const s = [...a].sort((x, y) => x - y), m = s.length >> 1;return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;}
export const percentile = (a, p) => {if (!a.length) return NaN;const s = [...a].sort((x, y) => x - y);return s[Math.min(s.length - 1, Math.floor(p * s.length))];};

/**
 * Motion curve of one tracked value (e.g. translateY per frame). Normalises to progress 0→1 and reports onset/settle,
 * the frames where progress reaches 10/50/90 %, peak velocity and a coarse easing class. dtMs = frame step.
 */
export function curveStats(values, dtMs, {eps = 0.02} = {}) {
  const v = values.map(Number), n = v.length;
  if (n < 3 || v.some((x) => !Number.isFinite(x))) return null;
  const v0 = v[0], v1 = v[n - 1], range = v1 - v0;
  if (Math.abs(range) < 1e-9) return {moving: false, v0, v1};
  const prog = v.map((x) => (x - v0) / range);
  const cross = (q) => prog.findIndex((p) => p >= q);
  let onset = prog.findIndex((p) => Math.abs(p) > eps);
  let settle = n - 1;
  while (settle > 0 && Math.abs(prog[settle - 1] - 1) <= eps) settle--;
  if (onset < 0) onset = 0;
  const vel = prog.slice(1).map((p, i) => (p - prog[i]) / (dtMs / 1000));
  let peak = 0;vel.forEach((x, i) => {if (Math.abs(x) > Math.abs(vel[peak])) peak = i;});
  const span = Math.max(1, settle - onset), pos = (peak - onset) / span;
  const meanVel = 1 / (span * dtMs / 1000), ratio = Math.abs(vel[peak]) / meanVel;
  const shape = ratio < 1.25 ? 'linear' : pos < 0.3 ? 'ease-out' : pos > 0.7 ? 'ease-in' : 'ease-in-out';
  return {
    moving: true, v0, v1, onsetFrame: onset, settleFrame: settle, durationMs: round((settle - onset) * dtMs, 1),
    t10Frame: cross(0.1), t50Frame: cross(0.5), t90Frame: cross(0.9),
    peakVelocityFrame: peak + 1, peakVelocityPerSec: round(vel[peak], 3), peakToMeanRatio: round(ratio, 2), shape,
    overshoot: round(Math.max(...prog) - 1, 4),
  };
}

/** Frame-interval summary (ms). Margin 1 ms keeps ordinary vsync jitter from counting as a dropped frame. */
export function summarizeIntervals(ms, {jitterMs = 1} = {}) {
  const a = ms.filter((x) => Number.isFinite(x) && x > 0);
  if (!a.length) return {count: 0};
  const med = median(a);
  return {
    count: a.length, medianMs: round(med, 2), p95Ms: round(percentile(a, 0.95), 2), maxMs: round(Math.max(...a), 2), medianFps: round(1000 / med, 1),
    over16_7: a.filter((x) => x > 16.7 + jitterMs).length, over33_3: a.filter((x) => x > 33.3 + jitterMs).length, rule: `interval > 16.7 / 33.3 ms + ${jitterMs} ms jitter margin`,
  };
}

export const intervalsOf = (stamps) => stamps.slice(1).map((t, i) => t - stamps[i]);

/** Split stamps (same unit as marks) by stage marks [{name, t}] and summarise each stage. endT closes the last stage. */
export function summarizeByStage(stamps, marks, endT, convert = (x) => x) {
  const out = {};
  marks.forEach((m, i) => {
    const t0 = m.t, t1 = i + 1 < marks.length ? marks[i + 1].t : endT;
    out[m.name] = {durationMs: round(convert(t1 - t0), 1), ...summarizeIntervals(intervalsOf(stamps.filter((t) => t >= t0 && t < t1)).map(convert))};
  });
  return out;
}

/** Pull what the summary needs out of a Chromium trace: compositor frames, stage stamps (console.timeStamp), long tasks. Times in µs. */
export function analyzeTrace(events, {longTaskMs = 50, stagePrefix = 'ecg-stage:'} = {}) {
  const main = events.find((e) => e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
  const draws = [], stages = [], longTasks = [];
  for (const e of events) {
    if (e.name === 'DrawFrame') draws.push(e.ts);
    else if (e.name === 'TimeStamp' && typeof e.args?.data?.message === 'string' && e.args.data.message.startsWith(stagePrefix)) stages.push({name: e.args.data.message.slice(stagePrefix.length), t: e.ts});
    else if (e.ph === 'X' && /RunTask$/.test(e.name) && e.dur >= longTaskMs * 1000 && (!main || (e.pid === main.pid && e.tid === main.tid))) longTasks.push({ts: e.ts, durMs: round(e.dur / 1000, 1)});
  }
  draws.sort((a, b) => a - b);stages.sort((a, b) => a.t - b.t);
  return {drawFrames: [...new Set(draws)], stages, longTasks: longTasks.sort((a, b) => a.ts - b.ts), rendererFound: !!main};
}

/** Count long tasks per stage window. */
export function longTasksByStage(longTasks, marks, endT) {
  const out = {};
  marks.forEach((m, i) => {const t1 = i + 1 < marks.length ? marks[i + 1].t : endT;out[m.name] = longTasks.filter((l) => l.ts >= m.t && l.ts < t1).length;});
  return out;
}

/**
 * Resample screencast frames (delivered only when the screen changes) onto a uniform grid per stage: every stepMs, hold the latest frame.
 * frameTimes ascending (ms); stageMarks [{name, t}] ascending; endT closes the last stage. vt = ms since the first stage start.
 */
export function buildGrid(frameTimes, stageMarks, endT, stepMs = 1000 / 60) {
  const ticks = [];
  if (!frameTimes.length || !stageMarks.length) return ticks;
  const find = (t) => {let lo = 0, hi = frameTimes.length - 1, ans = 0;while (lo <= hi) {const m = (lo + hi) >> 1;if (frameTimes[m] <= t) {ans = m;lo = m + 1;} else hi = m - 1;}return ans;};
  const t0 = stageMarks[0].t;
  stageMarks.forEach((m, k) => {
    const t1 = k + 1 < stageMarks.length ? stageMarks[k + 1].t : endT;
    for (let i = 0, t = m.t; t < t1; i++, t = m.t + i * stepMs) ticks.push({stage: m.name, i, vt: Math.round((t - t0) * 10) / 10, src: find(t)});
  });
  return ticks;
}
