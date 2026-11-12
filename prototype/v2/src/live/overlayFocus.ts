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
export type Focus = {target: string | null, e: Map<string, number>, f: number, last: number, missSince: number, px: number | null, py: number | null, label: string | null, pinned: Set<string>, chip: string | null, cyc?: {x: number, y: number, list: string[]}, click?: {x: number, y: number}};
export const createFocus = (): Focus => ({target: null, e: new Map(), f: 0, last: -1, missSince: 0, px: null, py: null, label: null, pinned: new Set(), chip: null});
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
  if (!list.length) return s.target;
  const same = s.cyc && Math.abs(s.cyc.x - x) < 8 && Math.abs(s.cyc.y - y) < 8 && s.cyc.list.join() === list.join();
  let idx: number;
  if (same && s.target && list.includes(s.target)) idx = (list.indexOf(s.target) + 1) % list.length;
  else idx = list[0] === s.target && list.length > 1 ? 1 : 0;
  s.cyc = {x, y, list}; s.target = list[idx]; s.missSince = 0;
  return s.target;
}

/** 한 프레임 진행. hit = 이번 프레임에 마우스가 가리킨 계열(없으면 null). 움직이는 중이면 true(다시 그려야 함). */
export function step(s: Focus, now: number, names: string[], hit: string | null): boolean {
  const dt = s.last >= 0 ? Math.min(100, Math.max(0, now - s.last)) : 16.7; s.last = now;
  if (s.chip) hit = s.chip;                                         // 범례 단추 위가 캔버스 판정보다 먼저
  if (hit) { s.target = hit; s.missSince = 0; }
  else if (s.target) { if (!s.missSince) s.missSince = now; if (now - s.missSince > FOCUS_GRACE_MS || s.px === null) { s.target = null; s.missSince = 0; } }
  if (s.target && !names.includes(s.target)) s.target = null;     // 기법이 바뀌어 사라짐
  for (const p of [...s.pinned]) if (!names.includes(p)) s.pinned.delete(p);
  let moving = false;
  const approach = (v: number, want: number) => { const tau = want > v ? TAU_IN : TAU_OUT, nv = want + (v - want) * Math.exp(-dt / tau);
    const done = Math.abs(nv - want) < .002; if (!done) moving = true; return done ? want : nv; };
  for (const n of names) s.e.set(n, approach(s.e.get(n) ?? 0, s.target === n || s.pinned.has(n) ? 1 : 0));
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
