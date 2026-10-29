/* D-157: 옮긴 축 로직이 원본 저장소 tests/test_live_axis.py (claude/adoring-cray-nv6pvq, 1651985)와 같은 기대값을 내는지
 * 같은 자극으로 다시 잰다. 숫자·자극은 그 파일 그대로다. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as AX from '../src/live/liveAxis.ts';

test('다시 잡은 직후의 need/s 가 밴드 안쪽 — 사다리 단차보다 밴드가 넓다 (F-51)', () => {
  let lo = Infinity, hi = -Infinity;
  for (let v = 1e-3; v < 1e3; v *= 1.0007) { const s = AX.ladder(v * AX.AIM), q = v / s; if (q < lo) lo = q; if (q > hi) hi = q; }
  assert.ok(lo > AX.LO, '다시 잡자마자 밴드 아래로 떨어진다 = 왕복한다');
  assert.ok(hi <= AX.HI, '다시 잡자마자 밴드 위로 벗어난다 = 왕복한다');
  assert.ok(AX.HI / AX.LO > AX.STEP_MAX);
});

const wave = (c: number, k: number) => c * (1 + 0.12 * Math.sin(k / 18));
const CENTERS: number[] = []; for (let b = 1.0; b < 10; b += 0.05) CENTERS.push(b * 0.1);

test('진폭이 ±12 % 로 숨쉬어도 160 s 동안 이득이 한 번 넘게 바뀌지 않는다', () => {
  let worst = 0;
  for (const c of CENTERS) {
    const g = AX.makeGain(); let t = 0, flips = 0, last = 0;
    for (let k = 0; k < 4000; k++) { t += 40; const s = g.fit(wave(c, k), t); if (last && s !== last) flips++; last = s; }
    worst = Math.max(worst, flips);
  }
  assert.ok(worst <= 1, `이득이 ${worst} 번 바뀌었다`);
});

test('같은 자극에서 옛 규칙(1-2-5 · +10 %/−45 %)은 정말 흔들린다 — 위 검사가 무언가를 지킨다', () => {
  const old = (v: number) => { const e = Math.floor(Math.log10(v)), b = v / 10 ** e; return (b <= 1 ? 1 : b <= 2 ? 2 : b <= 5 ? 5 : 10) * 10 ** e; };
  let worst = 0;
  for (const c of CENTERS) {
    let s = 0, flips = 0, last = 0;
    for (let k = 0; k < 4000; k++) { const need = wave(c, k); if (!s || need > s * 1.1 || need < s * 0.55) s = old(need); if (last && s !== last) flips++; last = s; }
    worst = Math.max(worst, flips);
  }
  assert.ok(worst > 50);
});

for (const play of ['scroll', 'sweep'] as const) test(`화면 칸 ↔ 절대 샘플이 일대일이고 창 안 (${play})`, () => {
  const cap = 2500, head = 31499 + 777, slot = new Set<number>();
  let bad = 0, newest: number | null = null, fixed = 0;
  for (let i = 0; i < cap; i++) {
    const a = AX.absAt(i, head, cap, play), m = ((a % cap) + cap) % cap;
    slot.add(m); if (m === i) fixed++; if (a === head) newest = i; if (a > head || a <= head - cap) bad++;
  }
  assert.equal(bad, 0); assert.equal(slot.size, cap);
  if (play === 'scroll') assert.equal(newest, cap - 1); else assert.equal(fixed, cap);
});

test('스트림 중간에 붙으면 오른쪽 끝부터 채워진다 — 한가운데에서 선이 돋지 않는다 (F-52)', () => {
  const cap = 2500, first = 31500;
  for (const got of [12, 300, 1200, 2600]) {
    const head = first + got - 1; let n = 0, lo = cap, hi = -1;
    for (let i = 0; i < cap; i++) if (AX.have(AX.absAt(i, head, cap, 'scroll'), first, head, cap)) { n++; if (i < lo) lo = i; if (i > hi) hi = i; }
    const want = Math.min(got, cap);
    assert.equal(n, want); assert.equal(hi, cap - 1); assert.equal(lo, cap - want);
  }
});

test('절대 인덱스가 되돌아가도(front-end 전환) 옛 구간이 살아나지 않는다', () => {
  const cap = 2500, first = 0, head = 1443; let n = 0, hi = -1;
  for (let i = 0; i < cap; i++) if (AX.have(AX.absAt(i, head, cap, 'scroll'), first, head, cap)) { n++; hi = i; }
  assert.equal(n, 1444); assert.equal(hi, cap - 1);
});

const beats = (tip = false) => {
  const cap = 2500, a = new Float32Array(cap);
  for (let i = 0; i < cap; i++) a[i] = 0.02 * Math.sin(i / 3);
  for (let k = 0; k < cap; k += 250) { for (let j = 0; j < 5; j++) a[k + j] = 1.0; if (tip) a[k + 2] = 1.12; }
  return a;
};

test('R 피크는 끝까지 담고 스파이크 한 점에는 안 끌려간다', () => {
  const a = beats(), base = AX.scan(a, 0, 2499, 2500).peak; a[1234] = 12; const hit = AX.scan(a, 0, 2499, 2500).peak;
  assert.ok(base >= 0.96 && base <= 2.0, String(base)); assert.ok(hit <= base * 1.6);
});

test('밴드 위 끝까지 흘러가도 R 피크가 잘리지 않는다', () => {
  const a = beats(true), r = AX.scan(a, 0, 2499, 2500); let mx = 0;
  for (let i = 0; i < 2500; i++) mx = Math.max(mx, Math.abs(a[i] - r.m));
  assert.ok(mx <= r.peak / AX.HI, `max ${mx} > 반높이 ${r.peak / AX.HI}`);
});

test('잴 것이 없으면 이득을 잡지 않고, 첫 표본이 오면 바로 잡는다', () => {
  const g = AX.makeGain(); const empty = g.fit(0, 0); const firstReal = g.fit(0.4, 40);
  assert.equal(empty, 0); assert.ok(firstReal > 0.4); assert.equal(g.changes(), 1);
});

test('지우기 영역은 화면 폭의 고정 비율(기본 10 %, 비움 3 : 페이드 2)', () => {
  assert.equal(AX.ERASE_FRAC, 0.1); assert.deepEqual(AX.ERASE_CHOICES, [0.05, 0.1, 0.15, 0.2]);
  for (const cap of [625, 1250, 2500]) {
    const e = AX.eraseSpans(cap, 0.1), at = (d: number) => AX.sweepAlpha(cap - d, cap, 0.1, true);
    assert.ok(Math.abs((e.gap + e.fade) / cap - 0.1) < 1e-9);
    assert.equal(AX.sweepAlpha(0, cap, 0.1, true), 1); assert.equal(at(e.gap - 1), 0); assert.equal(at(e.gap + e.fade + 1), 1);
    assert.ok(Math.abs(at(e.gap + e.fade / 2) - 0.5) < 1e-9);
    assert.equal(AX.sweepAlpha(cap - (e.gap + e.fade / 2), cap, 0.1, false), 0);
  }
  const f = AX.eraseSpans(2500, 0.2); assert.ok(Math.abs(f.gap - 300) < 1e-9 && Math.abs(f.fade - 200) < 1e-9);
});

test('스크롤은 왼쪽 끝을 같은 비율로 페이드하고, 선단 밝기는 주기 없이 빛난다', () => {
  const cap = 2500, n = 0.1 * cap;
  assert.equal(AX.scrollAlpha(0, cap, 0.1, true), 0); assert.ok(Math.abs(AX.scrollAlpha(n / 2, cap, 0.1, true) - 0.5) < 1e-9);
  assert.equal(AX.scrollAlpha(n + 1, cap, 0.1, true), 1); assert.equal(AX.scrollAlpha(0, cap, 0.1, false), 1);
  assert.ok(AX.glowLevel(3, 50) > 0); assert.equal(AX.glowLevel(60, 50), 0);
});

test('표시 보간: 블록을 ceil(n/6) 단계(최소 2)로, 첫 블록과 끊긴 시간축은 그대로', () => {
  for (const [hop, steps] of [[12, 2], [16, 3], [32, 6]]) {
    const R = AX.makeReveal(), dt = hop / 250 * 1000; R.push(99, 0);
    for (let k = 1; k <= 10; k++) R.push(99 + hop * k, dt * k);
    const t = dt * 10, last = 99 + hop * 10, seen: number[] = [];
    for (let f = 0; f < dt; f += dt / 64) seen.push(R.at(t + f));
    const u = [...new Set(seen)];
    assert.equal(u.length, steps, `${hop}: ${u}`); assert.equal(u[u.length - 1], last); assert.ok(R.at(t) > last - hop);
    for (let i = 1; i < u.length; i++) assert.ok(u[i] > u[i - 1]);
  }
  const R = AX.makeReveal(); R.push(99, 0); assert.equal(R.at(1), 99); R.push(130, 48); R.push(5, 96); assert.equal(R.at(97), 5);
});

test('선단 밝기는 나이로 — 옛 주기·wrap 꼬리는 빛나지 않는다', () => {
  const cap = 2500, w = AX.glowWidth(1300, cap);
  assert.equal(w, Math.round(78 / 1300 * 2500)); assert.equal(AX.glowWidth(400, cap), Math.round(48 / 400 * 2500)); assert.equal(AX.glowWidth(4000, cap), Math.round(120 / 4000 * 2500));
  const head = AX.glowMix(0, w, 500), mid = AX.glowMix(Math.floor(w / 2), w, 500);
  assert.equal(head, AX.GLOW_MAX); assert.ok(AX.GLOW_MAX >= 0.5 && AX.GLOW_MAX <= 0.7); assert.ok(mid > 0 && mid < head);
  assert.equal(AX.glowMix(w, w, 500), 0); assert.equal(AX.glowMix(cap - 5, w, 500), 0); assert.equal(AX.glowMix(10, w, 3), 0);
});

test('스트림이 멈추면 잔광이 사라지고, 흰색 섞기가 정확하다', () => {
  assert.equal(AX.glowLive(100), 1); assert.ok(Math.abs(AX.glowLive(450) - 0.5) < 1e-9); assert.equal(AX.glowLive(700), 0);
  assert.equal(AX.mixWhite('#000000', 0.4), 'rgb(102,102,102)'); assert.equal(AX.mixWhite('#67e7c3', 0), 'rgb(103,231,195)');
});
