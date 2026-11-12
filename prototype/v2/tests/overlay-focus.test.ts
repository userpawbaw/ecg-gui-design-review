/* D-184 겹치기 강조 — 전환이 끊기지 않는지(엣지 케이스) 상태 · 애니메이션만 시험한다. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFocus, setPointer, pick, cycle, step, emphasis, FOCUS_GRACE_MS} from '../src/live/overlayFocus.ts';

const N = ['raw', 'A', 'B', 'C'], FR = 1000 / 60;
const run = (s: ReturnType<typeof createFocus>, t0: number, ms: number, hit: string | null, rec?: {t: number, A: number, B: number, f: number}[]) => {
  let t = t0; for (; t < t0 + ms; t += FR) { step(s, t, N, hit); rec?.push({t, A: s.e.get('A') ?? 0, B: s.e.get('B') ?? 0, f: s.f}); } return t;
};
const maxJump = (xs: number[]) => xs.slice(1).reduce((m, x, i) => Math.max(m, Math.abs(x - xs[i])), 0);

test('강조 → 다른 파형 강조(도중 포함): 값이 이어지고 한 프레임 변화가 작다, 전체 초점 f는 내려가지 않는다', () => {
  const s = createFocus(); setPointer(s, 10, 10); const rec: {t: number, A: number, B: number, f: number}[] = [];
  let t = run(s, 0, 60, 'A', rec);                 // A가 차오르는 도중(60 ms)에
  const fAt = s.f; t = run(s, t, 1000, 'B', rec);   // B로
  assert.ok(maxJump(rec.map(r => r.A)) < .16 && maxJump(rec.map(r => r.B)) < .16, '한 프레임에 튐');
  assert.ok(rec.filter(r => r.t > 60).every(r => r.f >= fAt - 1e-9), 'A → B 사이에 초점이 풀렸다');
  assert.ok(s.e.get('B')! > .99 && s.e.get('A')! < .02);
});

test('파형 사이 빈 곳을 잠깐(< 150 ms) 지나면 강조가 풀리지 않는다', () => {
  const s = createFocus(); setPointer(s, 10, 10); let t = run(s, 0, 500, 'A');
  const before = s.e.get('A')!; t = run(s, t, FOCUS_GRACE_MS - 40, null);
  assert.equal(s.target, 'A'); assert.ok(s.e.get('A')! >= before - 1e-9);
  run(s, t, 400, null); assert.equal(s.target, null);
});

test('캔버스를 벗어나면 바로 놓고, 모든 값이 부드럽게 0으로 돌아간다', () => {
  const s = createFocus(); setPointer(s, 10, 10); let t = run(s, 0, 500, 'A');
  setPointer(s, null, null); const rec: {t: number, A: number, B: number, f: number}[] = []; run(s, t, 1500, null, rec);
  assert.ok(maxJump(rec.map(r => r.A)) < .1 && maxJump(rec.map(r => r.f)) < .1);
  assert.ok(rec.at(-1)!.A === 0 && rec.at(-1)!.f === 0);
});

test('다시 들어오기(풀리는 도중 같은 파형): 지금 값에서 다시 올라간다', () => {
  const s = createFocus(); setPointer(s, 10, 10); let t = run(s, 0, 500, 'A'); setPointer(s, null, null);
  t = run(s, t, 80, null); const mid = s.e.get('A')!; setPointer(s, 10, 10);
  step(s, t + FR, N, 'A'); assert.ok(s.e.get('A')! >= mid && s.e.get('A')! - mid < .16);
});

test('고르기: 지금 강조된 것은 반경 + 8 px까지 붙잡고(다른 선이 더 가까워도), 벗어나면 반경 안의 선', () => {
  assert.equal(pick([{name: 'A', dist: 18}, {name: 'B', dist: 2}], 'A'), 'A');
  assert.equal(pick([{name: 'A', dist: 30}, {name: 'B', dist: 10}], 'A'), 'B');
  assert.equal(pick([{name: 'A', dist: 30}, {name: 'B', dist: 20}], 'A'), null);
  assert.equal(pick([{name: 'A', dist: 12}], null), 'A');
});

test('긴 프레임(탭을 가렸다 돌아옴)에도 넘치지 않고, 강조 배율은 끝값 사이에 있다', () => {
  const s = createFocus(); setPointer(s, 10, 10); step(s, 0, N, 'A'); step(s, 5000, N, 'A');
  for (const n of N) { const v = s.e.get(n)!; assert.ok(v >= 0 && v <= 1); }
  const em = emphasis(s, 'B', {a: .4, g: 0, w: 0}); assert.ok(em.alphaK >= .4 * .22 - 1e-9 && em.alphaK <= .4);
  const ea = emphasis(s, 'A', {a: .4, g: 0, w: 0}); assert.ok(ea.alphaK > .4 && ea.alphaK <= 1);
});

test('강조된 기법이 목록에서 사라지면(기법 바꾸기) 초점을 놓는다', () => {
  const s = createFocus(); setPointer(s, 10, 10); step(s, 0, N, 'A'); step(s, 20, ['raw', 'B'], 'A'); assert.equal(s.target, null);
});

test('강조 대상은 차오르는 동안 한 번도 원래보다 어두워지지 않는다(단조 증가)', () => {
  const s = createFocus(); setPointer(s, 10, 10); const a: number[] = [];
  for (let t = 0; t < 800; t += FR) { step(s, t, N, 'A'); a.push(emphasis(s, 'A', {a: .4, g: 0, w: 0}).alphaK); }
  assert.ok(a.every((x, i) => x >= .4 - 1e-9 && (i === 0 || x >= a[i - 1] - 1e-9)), a.slice(0, 6).join(','));
});

test('처음 올릴 때는 앞(위) 선 먼저 — 넓게 덮는 입력 · 거친 선에 묻히지 않게, 강조 중에는 겹친 선 위를 지나도 바뀌지 않는다 (2026-11-13 ① ②)', () => {
  const front = new Map([['raw', 0], ['M_FE', 3], ['M04', 5], ['M05S', 5]]);
  assert.equal(pick([{name: 'raw', dist: 1}, {name: 'M_FE', dist: 3}, {name: 'M04', dist: 12}], null, front), 'M04');
  assert.equal(pick([{name: 'raw', dist: 30}, {name: 'M_FE', dist: 5}, {name: 'M04', dist: 40}], null, front), 'M_FE');
  // 공통 전처리 강조 중 SWT와 겹친 자리를 지나도 그대로(산만하지 않게)
  assert.equal(pick([{name: 'M_FE', dist: 6}, {name: 'M04', dist: 1}], 'M_FE', front), 'M_FE');
});

test('클릭: 겹친 자리의 선을 앞쪽부터 차례로 — 뒤 선 강조 중 첫 클릭은 가장 앞 선, 같은 자리 거듭 클릭은 한 바퀴 (2026-11-13 ②)', () => {
  const front = new Map([['raw', 0], ['M_FE', 3], ['M04', 5], ['M05S', 5]]);
  const c = [{name: 'M_FE', dist: 4}, {name: 'M04', dist: 2}, {name: 'M05S', dist: 6}, {name: 'raw', dist: 9}];
  const s = createFocus(); s.target = 'M_FE';
  assert.equal(cycle(s, c, front, 100, 50), 'M04');      // 가장 앞(같은 층이면 가까운 것)
  assert.equal(cycle(s, c, front, 102, 51), 'M05S');     // 같은 자리 → 다음
  assert.equal(cycle(s, c, front, 101, 50), 'M_FE');
  assert.equal(cycle(s, c, front, 101, 50), 'raw');
  assert.equal(cycle(s, c, front, 100, 50), 'M04');      // 한 바퀴
  // 다른 자리의 첫 클릭: 지금 강조가 이미 가장 앞이면 그다음
  assert.equal(cycle(s, c, front, 300, 80), 'M05S');
  // 클릭으로 바꾼 뒤 그 자리에 머물면 붙잡는다
  assert.equal(pick(c, s.target, front), 'M05S');
});
