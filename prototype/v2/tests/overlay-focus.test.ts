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

/* D-187 높이 영역 */
import {alignTo, zoneStep, qrsMask, zonePeaks, zoneCenter, zoneBands, zoneAt, holdZones, createZoneHold, zoneHit} from '../src/live/overlayFocus.ts';
test('높이 영역: 비슷한 폭은 한 단계(동시), 큰 것은 바깥 단계, 위 · 아래 따로, 순간 튐 하나에 흔들리지 않음', () => {
  const n = 1000, C = 200, wave = (amp: number, dn: number) => Float64Array.from({length: n}, (_, t) => { const v = Math.sin(t / 20); return C - (v > 0 ? amp * v : dn * v); });
  const swt = wave(50, 20), unet = wave(55, 22), kal = wave(80, 21), raw = wave(120, 60); kal[500] = C - 300;   // 칼만에 한 표본 튐
  const pk = zonePeaks(new Map([['SWT', swt], ['UNet', unet], ['KAL', kal], ['raw', raw]]), C);
  assert.ok(Math.abs(pk.get('KAL')!.up - 80) < 2, `튐에 끌려감 ${pk.get('KAL')!.up}`);
  const z = zoneBands(pk);
  assert.deepEqual(z.up.map(b => b.names.sort().join(',')), ['SWT,UNet', 'KAL', 'raw']);
  assert.deepEqual(z.down.map(b => b.names.sort().join(',')), ['KAL,SWT,UNet', 'raw']);   // 아래쪽은 세 기법이 비슷 → 한 단계
  assert.deepEqual(zoneAt(z, 30)!.names.sort(), ['SWT', 'UNet']);
  assert.deepEqual(zoneAt(z, 70)!.names, ['KAL']);
  assert.deepEqual(zoneAt(z, 100)!.names, ['raw']);
  assert.equal(zoneAt(z, 120 * 1.1 + 7), null);                 // 바깥 여유 너머
  assert.equal(zoneAt(z, -15)!.names.length, 3); assert.deepEqual(zoneAt(z, -40)!.names, ['raw']);
  assert.equal(zoneCenter([Float64Array.from([1, 2, 3]), Float64Array.from([4, 5])]), 3);
});
test('높이 영역: 구성 바뀜은 1 s 이어질 때만, 경계만 바뀌면 바로', () => {
  const h = createZoneHold(), A = {up: [{names: ['a'], edge: 10}, {names: ['b'], edge: 30}], down: []}, A2 = {up: [{names: ['a'], edge: 12}, {names: ['b'], edge: 31}], down: []}, B = {up: [{names: ['a', 'b'], edge: 30}], down: []};
  holdZones(h, A, 0); assert.equal(holdZones(h, A2, 250).up[0].edge, 12);
  assert.equal(holdZones(h, B, 500).up.length, 2); assert.equal(holdZones(h, B, 1000).up.length, 2); assert.equal(holdZones(h, B, 1600).up.length, 1);
});
test('높이 영역: 같은 단계 계열 동시 강조, 클릭으로 고른 것은 그 단계 안에서 유지', () => {
  const s = createFocus(); setPointer(s, 10, 10); const names = ['raw', 'SWT', 'UNet', 'KAL'];
  const zIn = {key: 'up0:SWT,UNet', names: ['SWT', 'UNet']}, zK = {key: 'up1:KAL', names: ['KAL']};
  let t = 0; for (; t < 800; t += FR) step(s, t, names, zoneHit(s, zIn));
  assert.ok(s.e.get('SWT')! > .99 && s.e.get('UNet')! > .99 && s.e.get('KAL')! < .01);
  cycle(s, [{name: 'UNet', dist: 3}, {name: 'SWT', dist: 4}], new Map([['SWT', 5], ['UNet', 5.001]]), 10, 10); s.clickZone = zIn.key;
  for (const end = t + 800; t < end; t += FR) step(s, t, names, zoneHit(s, zIn));
  assert.ok(s.e.get('UNet')! > .99 && s.e.get('SWT')! < .02, '클릭한 것만 남아야');
  for (const end = t + 800; t < end; t += FR) step(s, t, names, zoneHit(s, zK));
  assert.ok(s.e.get('KAL')! > .99 && s.e.get('UNet')! < .02 && s.clickZone === null, '단계를 벗어나면 단계 규칙');
});
test('높이 영역: 함께 강조된 묶음에서 첫 클릭은 그 중 가장 앞 하나만, 이어서 누르면 거리 · 앞 순서대로 돈다', () => {
  const s = createFocus(); setPointer(s, 10, 10); const names = ['raw', 'SWT', 'UNet', 'KAL'], front = new Map([['raw', 0], ['SWT', 5.001], ['UNet', 5.002], ['KAL', 4]]);
  let t = 0; for (; t < 300; t += FR) step(s, t, names, ['SWT', 'UNet']);
  assert.equal(cycle(s, [{name: 'SWT', dist: 2}, {name: 'UNet', dist: 3}, {name: 'raw', dist: 9}], front, 10, 10), 'UNet');
  assert.deepEqual(s.hov, ['UNet']);
  assert.equal(cycle(s, [{name: 'SWT', dist: 2}, {name: 'UNet', dist: 3}, {name: 'raw', dist: 9}], front, 10, 10), 'SWT');
  // 선이 반경 안에 하나도 없어도(빈 곳 클릭) 묶음이면 앞 하나로
  for (; t < 600; t += FR) step(s, t, names, ['SWT', 'UNet']); assert.equal(cycle(s, [], front, 50, 50), 'UNet');
});
test('QRS 빼기: 모두 함께 큰 구간은 빼고, 한 기법만의 튐은 남긴다', () => {
  const n = 400, C = 0, R = (t: number) => (t % 100 < 4 ? -100 : 0);
  const a = Float64Array.from({length: n}, (_, t) => R(t) + Math.sin(t)), b = Float64Array.from({length: n}, (_, t) => R(t) - Math.sin(t)), k = Float64Array.from({length: n}, (_, t) => R(t) + (t === 250 ? -60 : 0));
  const m = qrsMask([a, b, k], C, 3);
  assert.equal(m[1], 1); assert.equal(m[6], 1); assert.equal(m[50], 0); assert.equal(m[250], 0);
  const pk = zonePeaks(new Map([['a', a], ['k', k]]), C, .999, m);
  assert.ok(pk.get('a')!.up < 2 && pk.get('k')!.up > 50);
});
test('높이 영역 안정: 튐으로 넓어진 값은 천천히 줄고, 묶였던 둘은 35 %를 넘어야 갈라진다', () => {
  const h = createZoneHold(); const P = (a: number, b: number) => new Map([['A', {up: a, down: 10}], ['B', {up: b, down: 10}], ['raw', {up: 100, down: 50}]]);
  zoneStep(h, P(20, 22), 0); assert.deepEqual(h.cur!.up[0].names.sort(), ['A', 'B']);
  zoneStep(h, P(20, 26), 250); zoneStep(h, P(20, 26), 4000); assert.equal(h.cur!.up[0].names.length, 2, '30 % 차이로는 갈라지지 않아야');
  const h2 = createZoneHold(); zoneStep(h2, P(20, 60), 0); zoneStep(h2, P(20, 25), 250);
  assert.ok(h2.pk!.get('B')!.up > 55, '튐 값이 바로 사라짐'); zoneStep(h2, P(20, 25), 60000); assert.ok(h2.pk!.get('B')!.up < 30);
});
test('입력 중앙값 맞춤: 기저선이 치우친 입력도 제 폭으로 바깥 단계가 된다', () => {
  const C = 100, out = Float64Array.from({length: 500}, (_, t) => C - 10 * Math.sin(t / 9)), inp = Float64Array.from({length: 500}, (_, t) => C + 40 - 30 * Math.sin(t / 3));   // 입력이 40 px 아래
  const before = zoneBands(zonePeaks(new Map([['out', out], ['input', inp]]), C));
  assert.equal(before.up[0].names[0], 'input');
  const after = zoneBands(zonePeaks(new Map([['out', out], ['input', alignTo(inp, C)]]), C));
  assert.deepEqual(after.up.map(b => b.names[0]), ['out', 'input']); assert.deepEqual(after.down.map(b => b.names[0]), ['out', 'input']);
});
