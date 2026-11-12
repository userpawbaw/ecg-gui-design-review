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

/* D-186 포함 비율 앞뒤 순서 */
import {containment, layerDepths, layerTier, hold, type Held} from '../src/live/overlayFocus.ts';
test('포함 비율: 넓게 흔들리는 선(공통 전처리 같은)은 매끈한 두 선을 덮어 뒤로, 서로 비슷한 두 선은 같은 층', () => {
  const n = 600, base = (t: number) => 40 * Math.sin(t / 30);
  const wide = Float64Array.from({length: n}, (_, t) => base(t) + 10 * Math.sin(t * 2.1));      // 굵게 흔들림
  const s1 = Float64Array.from({length: n}, (_, t) => base(t) + 1.0 * Math.sin(t / 7));
  const s2 = Float64Array.from({length: n}, (_, t) => base(t) - 1.0 * Math.sin(t / 7));
  const cov = containment([wide, s1, s2], 2);
  assert.ok(cov[0][1] > .9 && cov[0][2] > .9, `넓은 선이 덮지 못함 ${cov[0][1]}`);
  assert.ok(cov[1][0] < .5, `매끈한 선이 넓은 선을 덮음 ${cov[1][0]}`);
  const d = layerDepths(['W', 'S1', 'S2'], cov);
  assert.deepEqual([d.get('W'), d.get('S1'), d.get('S2')], [1, 0, 0]);
});
test('포함 비율: 사용자 측정값(재생 d1 0 dB)으로 공통 전처리만 뒤, SWT · 칼만 같은 층', () => {
  const cov = [[0, 1, .82], [.55, 0, .73], [.39, .58, 0]];
  const d = layerDepths(['M_FE', 'M04', 'M05S'], cov);
  assert.deepEqual([d.get('M_FE'), d.get('M04'), d.get('M05S')], [1, 0, 0]);
});
test('포함 비율: 사슬은 깊이가 쌓이고, 순환(이론상)이어도 끝난다', () => {
  const chain = [[0, .9, .95], [.2, 0, .9], [.1, .3, 0]];
  assert.deepEqual([...layerDepths(['A', 'B', 'C'], chain).values()], [2, 1, 0]);
  const loop = [[0, .9, 0], [0, 0, .9], [.9, 0, 0]];
  const d = layerDepths(['A', 'B', 'C'], loop); assert.equal(d.size, 3);
});
test('단계 = 거칠기와 깊이 중 큰 쪽, 1 s 유지', () => {
  assert.equal(layerTier(0, 1), 1); assert.equal(layerTier(2, 1), 2); assert.equal(layerTier(0, 3), 2);
  const m = new Map<string, Held>();
  assert.equal(hold(m, 'a', 0, 0), 0); assert.equal(hold(m, 'a', 1, 100), 0); assert.equal(hold(m, 'a', 1, 900), 0); assert.equal(hold(m, 'a', 1, 1200), 1);
  assert.equal(hold(m, 'a', 0, 1300), 1); assert.equal(hold(m, 'a', 1, 1400), 1);   // 잠깐 흔들려도 그대로
});
