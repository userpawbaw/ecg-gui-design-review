// Post-processing of saved frames: frame-to-frame change energy (diff.json), first-N hashes (determinism), tracked-element curves.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {decodePng} from './png.mjs';
import {runPython} from './py.mjs';
import {fileURLToPath} from 'node:url';
import {rmSync} from 'node:fs';
import {activeWindow, curveStats, diffEnergy, findJumps, frameHash} from './analysis.mjs';

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const r4 = (v) => Math.round(v * 1e4) / 1e4;

/** frames: [{stage, i, vt, file}] in capture order. Reads PNGs from dir. Returns {diff, hashes}. */
export function analyzeSavedFrames(dir, frames, {step, hashCount = 60} = {}) {
  const stages = {}, hashes = [];
  let prev = null;
  frames.forEach((f, n) => {
    const img = decodePng(readFileSync(join(dir, f.file)));
    if (n < hashCount) hashes.push({stage: f.stage, i: f.i, hash: frameHash(img)});
    const d = prev ? diffEnergy(prev, img) : null;
    (stages[f.stage] ||= {frames: []}).frames.push({i: f.i, vt: f.vt, file: 'frames/' + f.file, all: d ? r4(d.all) : null, regions: d ? d.regions : null});
    prev = img;
  });
  for (const s of Object.values(stages)) {
    const e = s.frames.map((x) => x.all).filter((v) => v !== null);
    s.count = s.frames.length;s.meanEnergy = r4(mean(e));s.maxEnergy = e.length ? Math.max(...e) : 0;
    s.activeWindow = activeWindow(s.frames.map((x) => x.all ?? 0));
    s.jumps = findJumps(s.frames.map((x) => x.all ?? NaN));
  }
  const diff = {frameStepMs: step, energyScale: 'mean absolute RGB difference per pixel, 0–255, sampled every 2nd pixel; regions = 3×3 grid row-major', stages};
  return {diff, hashes};
}

export const saveJson = (dir, name, obj) => writeFileSync(join(dir, name), JSON.stringify(obj, null, 1), 'utf8');

/** Compare two hash lists. exact = every frame identical; maxDiff is measured by the caller for mismatching frames. */
export function compareHashes(a, b) {
  const n = Math.min(a.length, b.length), mismatches = [];
  for (let k = 0; k < n; k++) if (a[k].hash !== b[k].hash) mismatches.push(k);
  return {compared: n, identical: n - mismatches.length, mismatches};
}

const PROPS = ['x', 'y', 'w', 'h', 'opacity'];
/** Per stage and selector: curve statistics for position/size/opacity series. */
export function trackCurves(tracks, selectors, step) {
  const out = {};
  const byStage = {};
  for (const t of tracks) (byStage[t.stage] ||= []).push(t);
  for (const [stage, rows] of Object.entries(byStage)) {
    out[stage] = {};
    selectors.forEach((sel, k) => {
      const series = rows.map((r) => r.values[k]);
      if (series.some((v) => v === null)) {out[stage][sel] = {found: series.filter(Boolean).length === 0 ? false : 'partial'};return;}
      out[stage][sel] = Object.fromEntries(PROPS.map((p) => [p, curveStats(series.map((v) => v[p]), step)]).filter(([, v]) => v && v.moving));
    });
  }
  return out;
}

/** Build diff.json from per-tick energies (python/OpenCV path: JPEG screencast frames, hover analysis). ticks: [{stage, i, vt, file, rect?}] */
export function diffFromEnergies(ticks, energies, step, note = '') {
  const stages = {};
  ticks.forEach((t, n) => {
    const e = energies[n];
    (stages[t.stage] ||= {frames: []}).frames.push({i: t.i, vt: t.vt, file: t.file, all: e.all === null ? null : r4(e.all), regions: e.regions});
  });
  for (const s of Object.values(stages)) {
    const e = s.frames.map((x) => x.all).filter((v) => v !== null);
    s.count = s.frames.length;s.meanEnergy = r4(mean(e));s.maxEnergy = e.length ? Math.max(...e) : 0;
    s.activeWindow = activeWindow(s.frames.map((x) => x.all ?? 0));
    s.jumps = findJumps(s.frames.map((x) => x.all ?? NaN));
  }
  return {frameStepMs: step, energyScale: 'mean absolute RGB difference per pixel, 0–255, sampled every 2nd pixel; regions = 3×3 grid row-major' + note, stages};
}

/** Run frame_diff.py (OpenCV) over ticks [{file(abs), rect?}] → energies [{all, regions, local, outside}]. */
export function pythonEnergies(dir, ticks) {
  const script = fileURLToPath(new URL('../frame_diff.py', import.meta.url)), tin = join(dir, '_ticks.json'), tout = join(dir, '_energy.json');
  writeFileSync(tin, JSON.stringify({ticks: ticks.map((t) => ({file: t.file, rect: t.rect || null}))}), 'utf8');
  try {runPython(script, [tin, tout]);return JSON.parse(readFileSync(tout, 'utf8'));} finally {rmSync(tin, {force: true});rmSync(tout, {force: true});}
}
