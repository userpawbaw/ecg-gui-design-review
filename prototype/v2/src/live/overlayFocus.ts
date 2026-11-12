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

export type Focus = {target: string | null, e: Map<string, number>, f: number, last: number, missSince: number, px: number | null, py: number | null, label: string | null};
export const createFocus = (): Focus => ({target: null, e: new Map(), f: 0, last: -1, missSince: 0, px: null, py: null, label: null});

/** 마우스 위치(캔버스 CSS px). 캔버스를 벗어나면 null. */
export function setPointer(s: Focus, x: number | null, y: number | null) { s.px = x; s.py = y; }

/** 후보(계열, 마우스까지 거리 px) 중 고르기 — 반경 · 유지 · 넘어감 규칙. */
export function pick(cands: {name: string, dist: number}[], current: string | null): string | null {
  let best: {name: string, dist: number} | null = null;
  for (const c of cands) if (!best || c.dist < best.dist) best = c;
  const cur = current ? cands.find(c => c.name === current) : undefined;
  if (cur && cur.dist <= FOCUS_R + FOCUS_KEEP && (!best || best.dist > cur.dist - FOCUS_SWITCH)) return cur.name;
  return best && best.dist <= FOCUS_R ? best.name : null;
}

/** 한 프레임 진행. hit = 이번 프레임에 마우스가 가리킨 계열(없으면 null). 움직이는 중이면 true(다시 그려야 함). */
export function step(s: Focus, now: number, names: string[], hit: string | null): boolean {
  const dt = s.last >= 0 ? Math.min(100, Math.max(0, now - s.last)) : 16.7; s.last = now;
  if (hit) { s.target = hit; s.missSince = 0; }
  else if (s.target) { if (!s.missSince) s.missSince = now; if (now - s.missSince > FOCUS_GRACE_MS || s.px === null) { s.target = null; s.missSince = 0; } }
  if (s.target && !names.includes(s.target)) s.target = null;     // 기법이 바뀌어 사라짐
  let moving = false;
  const approach = (v: number, want: number) => { const tau = want > v ? TAU_IN : TAU_OUT, nv = want + (v - want) * Math.exp(-dt / tau);
    const done = Math.abs(nv - want) < .002; if (!done) moving = true; return done ? want : nv; };
  for (const n of names) s.e.set(n, approach(s.e.get(n) ?? 0, s.target === n ? 1 : 0));
  for (const n of [...s.e.keys()]) if (!names.includes(n)) s.e.delete(n);
  s.f = approach(s.f, s.target ? 1 : 0);
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
