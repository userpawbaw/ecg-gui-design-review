// D-188: run the causal heart-rate pipeline over every lab archive scene (98 × 10 s, d0/d1 × 4 noises × 6 SNRs) for several voter sets and
// compare with the Reference: R peaks of the clean trace (story/intro/beats.ts detectR, whole trace). Per voter set and SNR:
//   cov  = share of time (after 2 s) a number is shown, err = max |shown − Reference bpm| (Reference bpm = 60 / median of its last 4 RR),
//   >150 = frames showing > 150 bpm, ppv/sens = pulses (shown beats) matching a Reference R within 100 ms.
// node --experimental-strip-types eval_archive.mts <archive.json>
import fs from 'node:fs';
import {decode} from '../../prototype/v2/src/engine.ts';
import {detectR} from '../../prototype/v2/src/story/intro/beats.ts';
import {createHeartRate, median} from '../../prototype/v2/src/heart/heartRate.ts';
const bank = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), FS = bank.fs, N = bank.n;
const SETS: [string, string[]][] = [['입력+SWT+칼만+U-Net', ['input', 'M04', 'M05', 'M06']], ['입력+M08', ['input', 'M08']], ['입력+칼만', ['input', 'M05']], ['입력만', ['input']], ['칼만만', ['M05']]];
const agg: Record<string, Record<string, {cov: number, t: number, err: number, over: number, tp: number, fp: number, ref: number}>> = {};
for (const s of bank.scenes) {
  const tr: Record<string, Float32Array> = {}; for (const [k, v] of Object.entries(s.traces)) tr[k] = decode(v as string, s.scale, N);
  const ref = detectR(tr.clean, FS);
  for (const [label, names] of SETS) {
    if (!names.every(n => tr[n])) continue;
    const hr = createHeartRate(FS, names); const a = ((agg[label] ??= {})[String(s.snr)] ??= {cov: 0, t: 0, err: 0, over: 0, tp: 0, fp: 0, ref: 0});
    for (let i = 0; i < N; i++) { const vals: Record<string, number> = {}; for (const n of names) vals[n] = tr[n][i]; hr.push(i, vals);
      if (i >= 2 * FS && i % 25 === 0) { const v = hr.view(); a.t++; if (v.bpm !== null) { a.cov++; const rr = ref.filter(r => r <= i).slice(-5); if (rr.length >= 3) { const d = rr.slice(1).map((r, j) => (r - rr[j]) / FS); a.err = Math.max(a.err, Math.abs(v.bpm - 60 / median(d))); } if (v.bpm > 150) a.over++; } } }
    const shown = hr.view().beats; for (const b of shown) { if (ref.some(r => Math.abs(r - b) <= .1 * FS)) a.tp++; else a.fp++; }
    a.ref += ref.filter(r => r > 2 * FS).length;
  }
}
console.log('voters'.padEnd(20), 'SNR  cov%  maxErr  >150  pulsesOK  pulsesWrong  refBeats');
for (const [label, by] of Object.entries(agg)) for (const snr of Object.keys(by).sort((a, b) => +a - +b)) { const a = by[snr];
  console.log(label.padEnd(20), snr.padStart(3), (100 * a.cov / a.t).toFixed(0).padStart(5), a.err.toFixed(1).padStart(7), String(a.over).padStart(5), String(a.tp).padStart(9), String(a.fp).padStart(12), String(a.ref).padStart(9)); }
