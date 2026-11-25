/* D-192 정상 기준 행(N1) · 심실 조기 수축 투어 계획 — 실제 질환 자료(data/disease/pvc.json, 기록 228)로 시험한다. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decode} from '../src/engine.ts';
import {buildNormalRow, pvcTour, buildTour, ROW_CFG, needsRef} from '../src/disease/tour.ts';
const f = JSON.parse(readFileSync(new URL('../../../data/disease/pvc.json', import.meta.url), 'utf8'));
const x = decode(f.scenes[0].traces.clean, f.scenes[0].scale, f.n), fs = f.fs;
const row = buildNormalRow(x, f.beats, fs)!;
test('normal row: one placed beat per N beat at its R, abnormal beats at prev R + normal R–R', () => {
  const nN = f.beats.filter((b: {s: string}) => b.s === 'N').length;
  assert.equal(row.placed.filter(p => p.kind === 'N').length, nN);
  for (const p of row.placed.filter(q => q.kind === 'exp')) { const prev = row.placed.filter(q => q.r < p.r).at(-1)!; assert.ok(Math.abs((p.r - prev.r) / fs - row.rr) < 2 / fs); }
  // 평균 박동의 최댓값은 놓인 R 근처(±20 ms)
  const r = row.placed[3].r; let k = r - 25; for (let i = r - 25; i <= r + 25; i++) if (row.trace[i] > row.trace[k]) k = i; assert.ok(Math.abs(k - r) <= 5);
});
test('pvc tour: three steps in time order with values computed from the waveform', () => {
  const t = pvcTour(x, f.beats, fs, row, 5)! as Required<ReturnType<typeof pvcTour> & {}>;
  assert.deepEqual(t.steps.map(s => s.id), ['early', 'wide', 'pause']);
  assert.ok(t.early > .1 && t.early < .6, 'early ' + t.early);
  assert.ok((t.pvc.v.off - t.pvc.v.on) / fs >= .12, 'PVC QRS wide');
  assert.ok(t.normalQrs < .12, 'normal QRS narrow ' + t.normalQrs);
  assert.ok(t.steps[0].stop === t.steps[1].stop && t.steps[2].stop > t.steps[1].stop, 'same frame for 1→2, later for 3');
  assert.ok(t.start < t.steps[0].stop - 2 && t.start >= 0);
  // 멈춘 화면 오른쪽 끝(stop)보다 다음 정상 박동 R이 뒤(①에서 아직 안 보임), ③에서는 보임
  assert.ok(t.pvc.next.r / fs > t.steps[0].stop && t.pvc.next.r / fs < t.steps[2].stop);
});

const load = (id: string) => { const d = JSON.parse(readFileSync(new URL(`../../../data/disease/${id}.json`, import.meta.url), 'utf8')); return {d, x: decode(d.scenes[0].traces.clean, d.scenes[0].scale, d.n)}; };
const ref = (() => { const {d, x: rx} = load('normal'); return {x: rx, beats: d.beats}; })();
for (const id of Object.keys(ROW_CFG)) test(`D-193 ${id}: normal row + three steps, in order, visible at their stop`, () => {
  const {d, x: dx} = load(id), r = buildNormalRow(dx, d.beats, d.fs, ROW_CFG[id], needsRef(id) ? ref : undefined);
  assert.ok(r, 'row'); const span = 5, t = buildTour(id, dx, d.beats, d.fs, r!, span, d.rhythm); assert.ok(t, 'tour');
  assert.equal(t!.steps.length, 3); const sp = t!.span ?? span, dur = d.n / d.fs;
  t!.steps.forEach((s, i) => { assert.ok(s.stop <= dur && s.stop - sp >= -1e-6, `${s.id} stop ${s.stop}`); if (i) assert.ok(s.stop >= t!.steps[i - 1].stop);
    for (const g of s.regions) assert.ok(g.t0 >= s.stop - sp - 1e-6 && g.t1 <= s.stop + 1e-6 && g.t1 > g.t0, `${s.id} region ${g.row} ${g.t0.toFixed(2)}–${g.t1.toFixed(2)} @${s.stop.toFixed(2)}`);
    assert.ok(!/NaN|Infinity/.test(s.value), s.value); });
  assert.ok(t!.start <= t!.steps[0].stop - 2);
});
import {stepView} from '../src/disease/tour.ts';
for (const id of Object.keys(ROW_CFG)) test(`D-194 ${id}: step spans on a 0.25 s grid, wide → narrow within a pause, zoom window holds the focus and never passes the playhead`, () => {
  const {d, x: dx} = load(id), r = buildNormalRow(dx, d.beats, d.fs, ROW_CFG[id], needsRef(id) ? ref : undefined)!, t = buildTour(id, dx, d.beats, d.fs, r, 5, d.rhythm)!, base = t.span!;
  t.steps.forEach((s, i) => { assert.ok(Math.abs(s.span! * 4 - Math.round(s.span! * 4)) < 1e-9 && s.span! >= 1.25 && s.span! <= base, `${s.id} span ${s.span}`);
    if (i && Math.abs(s.stop - t.steps[i - 1].stop) < 1e-9) assert.ok(s.span! <= t.steps[i - 1].span!, `${s.id} narrows`);
    const v = stepView(s, base); assert.ok(v.right <= s.stop + 1e-9);
    for (const g of s.regions) assert.ok(g.t0 >= v.right - v.span - 1e-6 && g.t1 <= v.right + 1e-6, `${s.id} ${g.row} in view`); });
});
