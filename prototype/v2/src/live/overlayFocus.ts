/* D-184 겹치기 모드 강조(사용자 2026-11-13): 파형에 마우스를 올리면 그 파형이 앞으로(밝기 · 빛 번짐 · 불투명도),
 * 나머지는 뒤로 흐려지고, 마우스를 떼면 부드럽게 돌아온다. DOM · 캔버스와 무관한 상태 · 애니메이션만 여기 둔다(시험 가능).
 *
 * 애니메이션: 계열마다 강조 정도 e(0–1)와 전체 초점 f(0–1)를 매 프레임 목표값으로 지수 접근시킨다(올라갈 때 τ 110 ms,
 * 내려갈 때 τ 200 ms). 시간 기준이라 프레임 수와 무관하고, 중간에 목표가 바뀌어도 지금 값에서 그대로 이어진다 —
 * A → B 전환은 A가 내려가고 B가 올라가는 것이 동시에 진행되고(f는 1 유지라 나머지는 흐린 채), 강조가 차오르는 도중에
 * 다른 것을 가리켜도 되감기 · 튐 없이 방향만 바뀐다.
 * 고르기: 마우스에서 가장 가까운 파형(반경 R 안). 지금 강조된 것은 R + 8 px까지 유지하고, 다른 것이 6 px 이상 가까워야
 * 넘어간다(두 선이 겹치는 자리에서 깜빡이지 않게). 파형 사이 빈 곳을 잠깐 지나면 150 ms 기다렸다 놓는다. */
export const FOCUS_R = 16, FOCUS_KEEP = 8, FOCUS_SWITCH = 6, FOCUS_GRACE_MS = 150, TAU_IN = 110, TAU_OUT = 200;

/** pinned: 범례를 눌러 고정한 계열(여럿 가능, 2026-11-13 사용자 「2개정도만 강조 … 토글 형식으로 클릭하면 강조가 유지」).
 *  chip: 범례 단추 위에 마우스가 있는 계열(캔버스 밖이므로 px 는 null). 강조 대상 = 고정 ∪ 지금 가리킨 것. */
export type Focus = {target: string | null, e: Map<string, number>, f: number, last: number, missSince: number, px: number | null, py: number | null, label: string | null, pinned: Set<string>, chip: string | null, cyc?: {x: number, y: number, list: string[]}, click?: {x: number, y: number}, hov: string[], clickZone?: string | null};
export const createFocus = (): Focus => ({target: null, e: new Map(), f: 0, last: -1, missSince: 0, px: null, py: null, label: null, pinned: new Set(), chip: null, hov: []});
/** 고정 토글. 고정 목록을 돌려준다. */
export function togglePin(s: Focus, n: string) { if (s.pinned.has(n)) s.pinned.delete(n); else s.pinned.add(n); return [...s.pinned]; }

/** 마우스 위치(캔버스 CSS px). 캔버스를 벗어나면 null. */
export function setPointer(s: Focus, x: number | null, y: number | null) { s.px = x; s.py = y; }

/** 후보(계열, 마우스까지 거리 px) 중 고르기 — 마우스를 올려 「보기」.
 *  2026-11-13 사용자 ①: 거리만 보면 넓게 덮는 거친 선(입력)이 거의 어디서나 이겨 → 아무것도 강조되지 않았을 때는 반경 안에서 **앞(위)에 그려진 선**부터.
 *  2026-11-13 사용자 ②: 「공통 전처리를 강조하는 중에 SWT와 겹치는 부분 위에 단순히 마우스를 올린다고 산만하게 바뀌지도 않을거고 … 클릭하면 강조되는 파형이
 *  앞쪽 파형으로 바뀌게」 → 지금 강조된 선이 반경 + 8 px 안에 있는 동안은 **다른 선이 겹쳐도 넘어가지 않는다**(붙잡기). 바꾸는 것은 클릭(cycle)이 한다.
 *  front: 계열 → 앞 순서(클수록 위, 원래 그리는 순서 입력 < 거침 < 중간 < 깨끗). */
export function pick(cands: {name: string, dist: number}[], current: string | null, front?: Map<string, number>): string | null {
  const fr = (n: string) => front?.get(n) ?? 0;
  const cur = current ? cands.find(c => c.name === current) : undefined;
  if (cur && cur.dist <= FOCUS_R + FOCUS_KEEP) return cur.name;
  let best: {name: string, dist: number} | null = null;
  for (const c of cands) if (c.dist <= FOCUS_R && (!best || fr(c.name) > fr(best.name) || (fr(c.name) === fr(best.name) && c.dist < best.dist))) best = c;
  return best ? best.name : null;
}

/** 클릭 — 마우스 아래(반경 안) 선들을 앞쪽부터 차례로. 새 자리의 첫 클릭은 가장 앞 선(지금 강조가 가장 앞이면 그다음),
 *  같은 자리(8 px 안 · 같은 후보)에서 다시 누르면 다음 선으로 돌아간다(뒤 → … → 앞 → 다시 처음). 바뀐 강조 대상을 돌려준다. */
export function cycle(s: Focus, cands: {name: string, dist: number}[], front: Map<string, number> | undefined, x: number, y: number): string | null {
  const fr = (n: string) => front?.get(n) ?? 0;
  const list = cands.filter(c => c.dist <= FOCUS_R + FOCUS_KEEP).sort((a, b) => fr(b.name) - fr(a.name) || a.dist - b.dist).map(c => c.name);
  if (!list.length && s.hov.length <= 1) return s.target;
  // D-187(2026-11-13 사용자): 높이 영역으로 여럿이 함께 강조된 상태에서의 첫 클릭은 그 묶음 중 가장 앞(위에 그려지는) 하나만
  if (s.hov.length > 1) { const top = [...s.hov].sort((a, b) => fr(b) - fr(a))[0];
    s.cyc = {x, y, list: list.length ? list : [top]}; s.target = top; s.hov = [top]; s.missSince = 0; return top; }
  const same = s.cyc && Math.abs(s.cyc.x - x) < 8 && Math.abs(s.cyc.y - y) < 8 && s.cyc.list.join() === list.join();
  let idx: number;
  if (same && s.target && list.includes(s.target)) idx = (list.indexOf(s.target) + 1) % list.length;
  else idx = list[0] === s.target && list.length > 1 ? 1 : 0;
  s.cyc = {x, y, list}; s.target = list[idx]; s.hov = [s.target]; s.missSince = 0;
  return s.target;
}

/** 한 프레임 진행. hit = 이번 프레임에 마우스가 가리킨 계열(D-187: 여럿 가능 — 같은 높이 영역의 계열은 함께, 없으면 null). 움직이는 중이면 true(다시 그려야 함). */
export function step(s: Focus, now: number, names: string[], hit: string | string[] | null): boolean {
  const dt = s.last >= 0 ? Math.min(100, Math.max(0, now - s.last)) : 16.7; s.last = now;
  let H = s.chip ? [s.chip] : hit === null ? [] : Array.isArray(hit) ? hit : [hit];   // 범례 단추 위가 캔버스 판정보다 먼저
  H = H.filter(n => names.includes(n));
  if (H.length) { s.target = H[0]; s.hov = H; s.missSince = 0; }
  else if (s.target) { if (!s.missSince) s.missSince = now; if (now - s.missSince > FOCUS_GRACE_MS || s.px === null) { s.target = null; s.hov = []; s.missSince = 0; } }
  if (s.target && !names.includes(s.target)) { s.target = null; s.hov = []; }     // 기법이 바뀌어 사라짐
  if (s.target && !s.hov.includes(s.target)) s.hov = [s.target];
  for (const p of [...s.pinned]) if (!names.includes(p)) s.pinned.delete(p);
  let moving = false;
  const approach = (v: number, want: number) => { const tau = want > v ? TAU_IN : TAU_OUT, nv = want + (v - want) * Math.exp(-dt / tau);
    const done = Math.abs(nv - want) < .002; if (!done) moving = true; return done ? want : nv; };
  for (const n of names) s.e.set(n, approach(s.e.get(n) ?? 0, s.hov.includes(n) || s.pinned.has(n) ? 1 : 0));
  for (const n of [...s.e.keys()]) if (!names.includes(n)) s.e.delete(n);
  s.f = approach(s.f, s.target || s.pinned.size ? 1 : 0);
  return moving;
}

/** 계열 n의 합성 배율. base = 강조가 없을 때의 배율(D-183 단계: 불투명도 a · 번짐 g · 선단 흰빛 w). 링은 최대 밝기로 구워 두고
 *  여기 배율로만 합성한다 — 그래서 흐리게 그리던 거친 계열도 강조하면 끝까지(불투명 · 번짐 · 흰빛) 올라간다.
 *  흐림 d = f − e: 불투명도 22 %까지 · 번짐 · 흰빛은 40 %까지 / 강조 h = min(e, f): 불투명 1, 번짐 1.4, 흰빛 1.3 쪽으로. */
export function emphasis(s: Focus, n: string, base: {a: number, g: number, w: number}) {
  // 흐림 d = f − e, 강조 h = min(e, f). (처음 안 d = f·(1 − e)는 강조가 차오르는 동안 강조 대상도 잠깐 어두워졌다 — 시험에서 발견)
  const e = s.e.get(n) ?? 0, d = Math.max(0, s.f - e), h = Math.min(e, s.f);
  const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
  return {alphaK: lerp(base.a * (1 - .78 * d), 1, h), glowK: lerp(base.g * (1 - .6 * d), 1.4, h), whiteK: lerp(base.w * (1 - .6 * d), 1.3, h), h, d};
}

/** D-183 거칠기: 보이는 구간(최근 500표본)의 2차 차분 절댓값 중앙값. a 는 길이 cap 의 링(절대 인덱스 mod cap). */
export function roughness(a: Float32Array, cap: number, lo: number, hi: number) {
  const v: number[] = []; for (let t = Math.max(lo + 2, hi - Math.min(cap - 1, 500)); t <= hi; t++) { const x = (k: number) => a[((k % cap) + cap) % cap]; v.push(Math.abs(x(t) - 2 * x(t - 1) + x(t - 2))); }
  if (!v.length) return 0; v.sort((p, q) => p - q); return v[v.length >> 1];
}
/** 입력 대비 거칠기 비 → 단계(0 깨끗 · 1 중간 · 2 거침). */
export function tierOf(q: number) { return q < .3 ? 0 : q < .6 ? 1 : 2; }

/* D-186 앞뒤 순서 = 포함 비율(2026-11-13 사용자 안 「뒤에 배치되는 파형이 앞 파형들과 겹치지 않는 비율을 따져」, 권장안 승인 2026-11-13).
 * cover[a][b] = b의 표본 가운데 a의 띠(±W 표본의 최소 · 최대 + 여유 M) 안에 드는 비율. a가 b를 넓게 덮으면 a를 b 뒤로 —
 * cover[a][b] ≥ 0.75 이고 cover[a][b] − cover[b][a] ≥ 0.25 일 때만. 아니면 같은 층(앞 순서 같음 → 마우스는 가까운 것, 클릭은 거리 순).
 * 거칠기(입력 대비) 단계는 보드 입력처럼 입력 자체가 아주 거칠면 비가 작아져 모두 「깨끗」이 되었다(사용자 영상 02:37) — 포함은 기법끼리만 비교해 그런 기준 의존이 없다. */
export const COVER_W = 2, COVER_MARGIN_PX = 2, BEHIND_MIN = .75, BEHIND_ASYM = .25;
/** v[i] = 계열 i의 값(모두 같은 단위 · 같은 길이). m = 여유(같은 단위). */
export function containment(v: ArrayLike<number>[], m: number, w = COVER_W): number[][] {
  const k = v.length, n = k ? Math.min(...v.map(a => a.length)) : 0;
  const band = v.map(a => { const lo = new Float64Array(n), hi = new Float64Array(n);
    for (let t = 0; t < n; t++) { let l = Infinity, h = -Infinity; for (let j = Math.max(0, t - w); j <= Math.min(n - 1, t + w); j++) { const x = a[j]; if (x < l) l = x; if (x > h) h = x; } lo[t] = l - m; hi[t] = h + m; }
    return {lo, hi}; });
  return v.map((_, i) => v.map((b, j) => { if (i === j || !n) return 0; let c = 0; const {lo, hi} = band[i]; for (let t = 0; t < n; t++) if (b[t] >= lo[t] && b[t] <= hi[t]) c++; return c / n; }));
}
/** 깊이(0 = 맨 앞 층): a가 b 뒤이면 깊이(a) ≥ 깊이(b) + 1. 가장 긴 「뒤」 사슬의 길이. 순환(이론상)은 방문 중인 것을 무시해 끊는다. */
export function layerDepths(names: string[], cover: number[][]): Map<string, number> {
  const behind = (i: number, j: number) => cover[i][j] >= BEHIND_MIN && cover[i][j] - cover[j][i] >= BEHIND_ASYM;
  const memo = new Map<number, number>(), busy = new Set<number>();
  const depth = (i: number): number => { if (memo.has(i)) return memo.get(i)!; busy.add(i); let d = 0;
    for (let j = 0; j < names.length; j++) if (j !== i && !busy.has(j) && behind(i, j)) d = Math.max(d, depth(j) + 1);
    busy.delete(i); memo.set(i, d); return d; };
  return new Map(names.map((n, i) => [n, depth(i)]));
}
/** 깨끗 · 흐림 단계 = 거칠기 단계와 깊이 중 큰 쪽(깊이 2 이상은 2). 뒤층은 적어도 한 단계 흐리게. */
export const layerTier = (roughTier: number, depth: number) => Math.max(roughTier, Math.min(2, depth));
/** 바뀐 값이 ms 동안 이어질 때만 바꾼다(깜빡임 방지, D-183과 같은 1 s). */
export type Held = {v: number, want: number, since: number};
export function hold(m: Map<string, Held>, n: string, want: number, now: number, ms = 1000) {
  const st = m.get(n); if (!st) { m.set(n, {v: want, want, since: now}); return want; }
  if (want !== st.want) { st.want = want; st.since = now; } else if (want !== st.v && now - st.since > ms) st.v = want;
  return st.v;
}

/* D-187 마우스 높이 영역(2026-11-13 사용자 안 · 권장값 승인): 마우스가 선 가까이인지가 아니라 기준선(0 mV)에서 얼마나 위 · 아래인지로 강조 대상을 정한다
 * — 마우스를 가만히 두면 파형이 지나가도 바뀌지 않는다. 계열마다 보이는 구간에서 기준선 위 · 아래로 벗어난 정도의 상위 0.5 % 값(순간 튐에 흔들리지 않게)을
 * 위 · 아래 따로 잰다. 작은 것부터 쌓되, 묶음에서 가장 작은 값의 1.2배 안이면 같은 단계로 묶어 함께 강조한다(SWT · U-Net). 단계의 경계 = 그 단계 안 가장 큰 값.
 * 가장 바깥 단계 바깥으로는 10 % + 6 px 까지만(그 너머는 강조 없음). 모두 화면 px. 단계 구성이 바뀐 것은 1 s 이어질 때만 받아들인다. */
export const ZONE_Q = .995, ZONE_TOL = .2, ZONE_OUT = .1, ZONE_OUT_PX = 6;
export type ZoneBand = {names: string[], edge: number};
export type Zones = {up: ZoneBand[], down: ZoneBand[]};
/** QRS 빼기(2026-11-13 측정: 위쪽 상위 0.5 %는 모든 계열이 R파 꼭짓점 0.77–0.83 mV로 같아 단계가 갈리지 않았다 — 기법 차이는 QRS 밖에 있다).
 *  기법들의 합의(표본마다 기법 값의 중앙값)가 기준선에서 그 합의의 상위 0.5 % 값의 35 %보다 멀면 QRS로 보고 앞뒤 dil 표본까지 뺀다.
 *  한 기법의 잡음 튐은 중앙값을 움직이지 못한다(기법 3개 이상일 때). 뺄 표본 = 1. */
export const ZONE_QRS = .35;
export function qrsMask(outs: ArrayLike<number>[], center: number, dil: number, q = ZONE_Q) {
  const n = outs.length ? Math.min(...outs.map(a => a.length)) : 0, m = new Uint8Array(n); if (!n) return m;
  const ab = new Float64Array(n); for (let t = 0; t < n; t++) { const v = outs.map(a => a[t] - center).sort((a, b) => a - b); ab[t] = Math.abs(v.length % 2 ? v[v.length >> 1] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2); }
  const lim = ZONE_QRS * [...ab].sort((a, b) => a - b)[Math.floor(q * (n - 1))];
  for (let t = 0; t < n; t++) if (ab[t] > lim) for (let j = Math.max(0, t - dil); j <= Math.min(n - 1, t + dil); j++) m[j] = 1;
  return m;
}
/** 입력은 기저선이 흔들려 기법들과 다른 높이에 놓이기 쉽다(실험실 실측: 입력이 기법들 아래로 치우쳐 위쪽 폭이 0 → 가장 안쪽 단계가 됨).
 *  입력의 폭은 제 중앙값 기준으로 재도록 중앙값을 기준선에 맞춰 옮긴다. */
export function alignTo(a: ArrayLike<number>, center: number) { const v = Array.from(a), s = [...v].sort((x, y) => x - y), m = s.length ? s[s.length >> 1] : center; return v.map(x => x - m + center); }
/** px: 계열 → 화면 y 값들(px). center: 기준선 y(px). 위 = center − y. drop: 뺄 표본(QRS). */
export function zonePeaks(px: Map<string, ArrayLike<number>>, center: number, q = ZONE_Q, drop?: Uint8Array) {
  const qt = (v: number[]) => { if (!v.length) return 0; v.sort((a, b) => a - b); return Math.max(0, v[Math.min(v.length - 1, Math.floor(q * v.length))]); };
  const out = new Map<string, {up: number, down: number}>();
  for (const [n, a] of px) { const u: number[] = [], d: number[] = []; for (let i = 0; i < a.length; i++) { if (drop?.[i]) continue; u.push(center - a[i]); d.push(a[i] - center); } out.set(n, {up: qt(u), down: qt(d)}); }
  return out;
}
/** 기준선: 기법(입력 제외) 화면 y 전체의 중앙값 — 실시간은 입력과 기법의 중심을 따로 잡으므로 보이는 등전위선 쪽으로. */
export function zoneCenter(vals: ArrayLike<number>[]) { const all: number[] = []; for (const a of vals) for (let i = 0; i < a.length; i++) all.push(a[i]); if (!all.length) return NaN; all.sort((a, b) => a - b); return all[all.length >> 1]; }
/** prev 가 있으면 묶음 이력: 이미 같은 단계였던 둘은 ZONE_TOL_KEEP(35 %)를 넘어야 갈라진다(경계 근처에서 붙었다 떨어졌다 하지 않게). */
export const ZONE_TOL_KEEP = .35;
export function zoneBands(peaks: Map<string, {up: number, down: number}>, tol = ZONE_TOL, prev?: Zones | null): Zones {
  const side = (k: 'up' | 'down') => { const xs = [...peaks].map(([n, p]) => ({n, v: p[k]})).sort((a, b) => a.v - b.v), out: ZoneBand[] = []; let anchor = -1;
    const was = (a: string[], b: string) => !!prev?.[k].some(g => g.names.includes(b) && a.some(n => g.names.includes(n)));
    for (const x of xs) { const last = out[out.length - 1]; if (last && x.v <= anchor * (1 + (was(last.names, x.n) ? ZONE_TOL_KEEP : tol))) { last.names.push(x.n); last.edge = Math.max(last.edge, x.v); } else { out.push({names: [x.n], edge: x.v}); anchor = x.v; } }
    return out; };
  return {up: side('up'), down: side('down')};
}
/** 기준선에서 dy(px, 위 +) 인 마우스가 들어간 단계. key 는 클릭으로 고른 것을 그 단계 안에서 유지하는 데 쓴다. */
export function zoneAt(z: Zones, dy: number, pad = ZONE_OUT_PX): {key: string, names: string[]} | null {
  const k = dy >= 0 ? 'up' : 'down', bands = z[k], a = Math.abs(dy); if (!bands.length) return null;
  for (let i = 0; i < bands.length; i++) if (a <= bands[i].edge) return {key: `${k}${i}:${[...bands[i].names].sort().join(',')}`, names: bands[i].names};
  const last = bands[bands.length - 1], i = bands.length - 1;
  return a <= last.edge * (1 + ZONE_OUT) + pad ? {key: `${k}${i}:${[...last.names].sort().join(',')}`, names: last.names} : null;
}
/** 단위 바꾸기(mV → px 등, 표시용). */
export const scaleZones = (z: Zones, k: number): Zones => ({up: z.up.map(b => ({names: b.names, edge: b.edge * k})), down: z.down.map(b => ({names: b.names, edge: b.edge * k}))});
const zsig = (z: Zones) => [...z.up, {names: ['|'], edge: 0}, ...z.down].map(b => [...b.names].sort().join(',')).join('/');
export type ZoneHold = {cur: Zones | null, sig: string, pend: string, since: number, pk?: Map<string, {up: number, down: number}>, t?: number};
export const createZoneHold = (): ZoneHold => ({cur: null, sig: '', pend: '', since: 0});
/** 값 유지: 계열의 상위 값은 올라가면 바로, 내려가면 τ 20 s로 천천히(칼만의 순간 튐이 한동안 그 계열 영역을 넓혀 둔다 — 2026-11-13 사용자).
 *  구성 바뀜은 3 s 이어질 때만. 측정(재생 70 s, sim.mts): τ 8 s · 1 s 유지는 구성이 분당 4.6번 바뀌었고, 20 s · 3 s는 3.7번 —
 *  잡음이 실제로 세졌다 약해졌다 하므로 매개변수로는 0이 되지 않는다. 그래서 마우스가 그래프 위에 있는 동안은 단계를 아예 고정한다(부르는 쪽). */
export const ZONE_DECAY_MS = 20000, ZONE_HOLD_MS = 3000;
export function zoneStep(h: ZoneHold, peaks: Map<string, {up: number, down: number}>, now: number) {
  const dt = h.t === undefined ? 0 : Math.max(0, now - h.t), k = Math.exp(-dt / ZONE_DECAY_MS), old = h.pk ?? new Map(), pk = new Map<string, {up: number, down: number}>();
  for (const [n, p] of peaks) { const o = old.get(n); const f = (nv: number, ov?: number) => ov === undefined || nv >= ov ? nv : nv + (ov - nv) * k; pk.set(n, {up: f(p.up, o?.up), down: f(p.down, o?.down)}); }
  h.pk = pk; h.t = now;
  return holdZones(h, zoneBands(pk, ZONE_TOL, h.cur), now, ZONE_HOLD_MS);
}
/** 같은 구성이면 경계만 바로 갱신, 구성이 바뀌면 ms 동안 이어질 때만. */
export function holdZones(h: ZoneHold, next: Zones, now: number, ms = 1000) {
  const sg = zsig(next);
  if (!h.cur || sg === h.sig) { h.cur = next; h.sig = sg; h.pend = ''; return h.cur; }
  if (sg !== h.pend) { h.pend = sg; h.since = now; } else if (now - h.since > ms) { h.cur = next; h.sig = sg; h.pend = ''; }
  return h.cur;
}
/** 마우스 강조 대상: 클릭으로 고른 계열은 같은 단계 안에 있는 동안 유지, 단계를 벗어나면 단계 규칙으로. */
export function zoneHit(s: Focus, z: {key: string, names: string[]} | null): string[] | null {
  if (!z) { s.clickZone = null; return null; }
  if (s.clickZone === z.key && s.target) return [s.target];
  s.clickZone = null; return z.names;
}
