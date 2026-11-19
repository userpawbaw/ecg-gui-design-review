/* D-188 심박 추정: 투표 · 생리 범위 · 일관성 고정 · 이유 표시를 합성 신호로 시험한다. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHeartRate} from '../src/heart/heartRate.ts';
const FS = 250;
const g = (d: number, w: number) => Math.exp(-(d * d) / (w * w));
/** R 시각들(초)에 좁은 QRS(가우스 20 ms) + 약한 T파 + 잡음 */
function ecg(rs: number[], dur: number, noise = .02, seed = 1) { let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647 - .5);
  return Float64Array.from({length: Math.round(dur * FS)}, (_, i) => { const t = i / FS; let v = noise * rnd();
    for (const r of rs) { const d = t - r; if (Math.abs(d) < .5) v += g(d, .012) - .25 * g(d + .02, .01) + .25 * g(d - .3, .06); } return v; }); }
const regular = (bpm: number, dur: number, t0 = .4) => { const r: number[] = []; for (let t = t0; t < dur; t += 60 / bpm) r.push(t); return r; };
function run(sig: Record<string, Float64Array>, ok?: (i: number) => boolean) { const names = Object.keys(sig), hr = createHeartRate(FS, names), N = sig[names[0]].length, views: {i: number, bpm: number | null, reason: string | null}[] = [];
  for (let i = 0; i < N; i++) { const v: Record<string, number> = {}; for (const n of names) v[n] = sig[n][i]; hr.push(i, v, ok ? ok(i) : true); if (i % 25 === 0) { const w = hr.view(); views.push({i, bpm: w.bpm, reason: w.reason}); } }
  return {views, beats: hr.view().beats}; }

test('규칙적 72 bpm: 몇 박 뒤 숫자가 나오고 72 ± 1, 심장은 박동마다', () => {
  const x = ecg(regular(72, 20), 20), {views, beats} = run({input: x, A: x, B: x});
  const shown = views.filter(v => v.bpm !== null); assert.ok(shown.length > views.length * .6, `표시 ${shown.length}/${views.length}`);
  assert.ok(shown.every(v => Math.abs(v.bpm! - 72) <= 1)); assert.ok(beats.length >= 14);
  assert.equal(views[0].reason, 'learning');
});
test('한 기법만 만든 가짜 피크(사이마다 하나 더 = 144 bpm처럼 보임)는 박동이 되지 않는다', () => {
  const r = regular(72, 20), x = ecg(r, 20), fake = ecg([...r, ...r.map(t => t + 60 / 72 / 2)].sort((a, b) => a - b), 20, .02, 7);
  const {views} = run({input: x, A: x, KAL: fake});
  const shown = views.filter(v => v.bpm !== null); assert.ok(shown.length > 0); assert.ok(shown.every(v => Math.abs(v.bpm! - 72) <= 1), JSON.stringify(shown.slice(0, 3)));
});
test('200 bpm 처럼 범위 밖이면 숫자를 내지 않는다(모든 신호가 동의해도)', () => {
  const x = ecg(regular(200, 15), 15), {views} = run({input: x, A: x});
  assert.ok(views.every(v => v.bpm === null || v.bpm <= 180)); assert.ok(views.filter(v => v.bpm !== null).length === 0, '200 bpm 표시');
});
test('전극 떨어짐은 「연결 불량」, 평탄은 「신호 없음」, 박동이 끊기면 숫자를 내린다', () => {
  const x = ecg(regular(70, 30), 30);
  const lo = run({input: x, A: x}, i => !(i > 15 * FS && i < 18 * FS)).views; assert.ok(lo.some(v => v.i > 15 * FS && v.i < 18 * FS && v.reason === 'leadoff'));
  const flat = Float64Array.from(x, (v, i) => i > 15 * FS && i < 20 * FS ? 0 : v); const fl = run({input: flat, A: flat}).views;
  assert.ok(fl.some(v => v.i > 17 * FS && v.i < 20 * FS && v.reason === 'flat'));
  const gap = Float64Array.from(x, (v, i) => i > 15 * FS && i < 20 * FS ? .02 * Math.sin(i) : v); const gp = run({input: gap, A: gap}).views;
  assert.ok(gp.some(v => v.i > 17.5 * FS && v.i < 20 * FS && v.bpm === null), '끊겨도 숫자 유지');
});
test('조기 박동(짧은 간격 + 보상 휴지기)은 숫자를 유지, 리듬이 갑자기 느려지면 「--」 뒤 새 값', () => {
  const r = regular(75, 30), p = 60 / 75; const ect = r.map(t => Math.abs(t - r[15]) < 1e-9 ? t - .35 * p : t);   // 16번째 박동이 35 % 일찍
  const e = ecg(ect, 30), ev = run({input: e, A: e}).views;
  const after = ev.filter(v => v.i > (r[15] + .5) * FS && v.i < (r[18]) * FS); assert.ok(after.every(v => v.bpm !== null && Math.abs(v.bpm - 75) <= 1), JSON.stringify(after.map(v => v.bpm)));
  const slow = [...regular(80, 15), ...regular(50, 35, 15 + 60 / 50)], s = ecg(slow, 35), sv = run({input: s, A: s}).views;
  assert.ok(sv.some(v => v.i > 15 * FS && v.i < 22 * FS && v.bpm === null), '바뀐 직후 「--」 없음');
  assert.ok(sv.filter(v => v.i > 30 * FS).every(v => v.bpm !== null && Math.abs(v.bpm - 50) <= 1), JSON.stringify(sv.filter(v => v.i > 30 * FS).map(v => v.bpm)));
  assert.ok(sv.every(v => v.bpm === null || Math.abs(v.bpm - 80) <= 1 || Math.abs(v.bpm - 50) <= 1), '중간 값');
});
