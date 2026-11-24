/* D-192 정상 기준 행(N1) · 심실 조기 수축 투어 계획 — 실제 질환 자료(data/disease/pvc.json, 기록 228)로 시험한다. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decode} from '../src/engine.ts';
import {buildNormalRow, pvcTour} from '../src/disease/tour.ts';
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
  const t = pvcTour(x, f.beats, fs, row, 5)!;
  assert.deepEqual(t.steps.map(s => s.id), ['early', 'wide', 'pause']);
  assert.ok(t.early > .1 && t.early < .6, 'early ' + t.early);
  assert.ok((t.pvc.v.off - t.pvc.v.on) / fs >= .12, 'PVC QRS wide');
  assert.ok(t.normalQrs < .12, 'normal QRS narrow ' + t.normalQrs);
  assert.ok(t.steps[0].stop === t.steps[1].stop && t.steps[2].stop > t.steps[1].stop, 'same frame for 1→2, later for 3');
  assert.ok(t.start < t.steps[0].stop - 2 && t.start >= 0);
  // 멈춘 화면 오른쪽 끝(stop)보다 다음 정상 박동 R이 뒤(①에서 아직 안 보임), ③에서는 보임
  assert.ok(t.pvc.next.r / fs > t.steps[0].stop && t.pvc.next.r / fs < t.steps[2].stop);
});
