// D-188: the recorded live stream (bridge replay d1 mixed 0 dB, 250 Hz: raw + M04 SWT, M06 U-Net, M05S streaming Kalman). For each voter set:
// (a) UNGATED: one detector per signal, bpm from each consecutive RR (what a naive display would show) — range and how many beats > 150 / < 40,
// (b) GATED (heartRate.ts): shown values (min / median / max), share of time shown, reasons for "--".
// Also stress copies of the input: lead-off (ok = 0 for 3 s), flat (0 for 3 s), motion bursts (±2 mV, 0.6 s, every 8 s).
// node --experimental-strip-types eval_stream.mts <rec.json>
import fs from 'node:fs';
import {createDetector, createHeartRate, median} from '../../prototype/v2/src/heart/heartRate.ts';
const {fs: FS, S} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const N = S.raw.length;
function ungated(name: string, x: number[]) { const d = createDetector(FS), r: number[] = []; x.forEach((v, i) => { const p = d.push(v, i); if (p !== null) r.push(p); });
  const b = r.slice(1).map((p, j) => 60 * FS / (p - r[j])); return `${name.padEnd(5)} beats ${String(r.length).padStart(3)} bpm ${Math.min(...b).toFixed(0)}–${Math.max(...b).toFixed(0)} (>150: ${b.filter(x => x > 150).length}, <40: ${b.filter(x => x < 40).length})`; }
function gated(label: string, sig: Record<string, number[]>, ok?: (i: number) => boolean) {
  const names = Object.keys(sig), hr = createHeartRate(FS, names), shown: number[] = [], why: Record<string, number> = {}; let t = 0;
  for (let i = 0; i < N; i++) { const v: Record<string, number> = {}; for (const n of names) v[n] = sig[n][i]; hr.push(i, v, ok ? ok(i) : true);
    if (i > 2 * FS && i % 25 === 0) { t++; const w = hr.view(); if (w.bpm !== null) shown.push(w.bpm); else why[w.reason!] = (why[w.reason!] || 0) + 1; } }
  console.log(label.padEnd(30), `shown ${(100 * shown.length / t).toFixed(0)} %`, shown.length ? `bpm ${Math.min(...shown)} / ${median(shown)} / ${Math.max(...shown)}` : '', '-- reasons', JSON.stringify(why), 'pulses', hr.view().beats.length);
}
console.log(`${N} samples (${(N / FS).toFixed(0)} s) @ ${FS} Hz\nUNGATED (one detector, every RR shown):`);
for (const n of Object.keys(S)) console.log(' ', ungated(n, S[n]));
console.log('GATED (heartRate.ts):');
gated('입력+SWT+U-Net+칼만', {raw: S.raw, M04: S.M04, M06: S.M06, M05S: S.M05S});
gated('입력+칼만', {raw: S.raw, M05S: S.M05S});
gated('칼만만', {M05S: S.M05S});
gated('입력만', {raw: S.raw});
const burst = (a: number[]) => a.map((v, i) => (i % (8 * FS)) < .6 * FS && i > 10 * FS ? v + 2 * Math.sin(i / 3) * Math.sign(Math.sin(i / 17)) : v);
gated('스트레스: 움직임 잡음(입력·출력)', {raw: burst(S.raw), M04: burst(S.M04), M06: S.M06, M05S: burst(S.M05S)});
gated('스트레스: 전극 떨어짐 20–23 s', {raw: S.raw, M04: S.M04, M06: S.M06, M05S: S.M05S}, i => !(i > 20 * FS && i < 23 * FS));
const flat = (a: number[]) => a.map((v, i) => i > 30 * FS && i < 34 * FS ? 0 : v);
gated('스트레스: 평탄 30–34 s', {raw: flat(S.raw), M04: flat(S.M04), M06: flat(S.M06), M05S: flat(S.M05S)});
