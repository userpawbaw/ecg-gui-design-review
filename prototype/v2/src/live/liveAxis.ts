/* 실시간 측정 B안 (D-157) — 화면의 축: 이득 · 중심 · «어느 자리에 정말 값이 있는가».
 * 원본 저장소 userpawbaw/ECG_denoising_method_comparision 의 demo/live_axis.js (브랜치 claude/adoring-cray-nv6pvq,
 * 커밋 1651985)를 동작 그대로 옮겼다. 그 파일은 두 번 재발한 자리라(F-32 이득이 심박 주기로 들썩임, F-51 사다리
 * 단차보다 좁은 밴드로 다시 들썩임, F-52 절대 인덱스와 «받은 개수»를 섞어 화면 한가운데서 신호가 돋아남) 원본
 * tests/test_live_axis.py 의 기대값을 tests/live-axis.test.ts 가 같은 숫자로 다시 잰다. DOM 도 캔버스도 없다. */

/** 사다리. 이웃한 두 단의 최대 비(1.25 → 1.6 = 1.28)가 히스테리시스 밴드 폭(HI/LO = 2)보다 좁아야 한다 —
 *  넓으면 한 칸 올라가자마자 내려올 조건이 성립해 이득이 왕복한다(F-51). D-44: 잡은 직후 69~88 % 를 채운다. */
export const STEPS = [1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.4, 8];
export const STEP_MAX = 1.28;
export const LO = 0.5, HI = 1.0, AIM = 1.13, HOLD_MS = 2000;

/** `v` 이상인 가장 작은 사다리 값. */
export function ladder(v: number): number {
  if (!(v > 0) || !isFinite(v)) return STEPS[0];
  const e = Math.floor(Math.log10(v)), p = Math.pow(10, e), b = v / p;
  for (const s of STEPS) if (b <= s * (1 + 1e-12)) return s * p;
  return STEPS[0] * p * 10;
}

export type Gain = {fit(need: number, now: number): number; value(): number; changes(): number; reset(): void};

/** 이득 하나 — 화면 전체가 같이 쓴다(계열마다 따로 잡으면 겹쳐도 크기를 비교할 수 없다). */
export function makeGain(o: {lo?: number, hi?: number, aim?: number, holdMs?: number} = {}): Gain {
  const lo = o.lo ?? LO, hi = o.hi ?? HI, aim = o.aim ?? AIM, hold = o.holdMs ?? HOLD_MS;
  let s = 0, t = 0, n = 0;
  return {
    fit(need, now) {
      if (!(need > 0) || !isFinite(need)) return s;      // 잴 것이 없으면 잡지 않는다(warm-up 동안 터무니없는 이득 방지)
      if (!s) { s = ladder(need * aim); t = now; n = 1; return s; }
      if ((need > s * hi || need < s * lo) && now - t >= hold) { s = ladder(Math.max(need, 1e-9) * aim); t = now; n++; }
      return s;
    },
    value: () => s, changes: () => n, reset() { s = 0; t = 0; n = 0; },
  };
}

/** 중심은 계열마다 따로(입력은 front-end 이전이라 전극 DC가 실려 있다). 이득은 같이 쓴다. */
export function makeCenter(o: {dead?: number, holdMs?: number} = {}) {
  const dead = o.dead ?? 0.2, hold = o.holdMs ?? HOLD_MS;
  let st: Record<string, {m: number, t: number}> = {};
  return {
    at(key: string, want: number, s: number, now: number) {
      const c = st[key];
      if (!c) { st[key] = {m: want, t: now}; return want; }
      if (Math.abs(want - c.m) > dead * s && now - c.t >= hold) { c.m = want; c.t = now; }
      return c.m;
    },
    clear() { st = {}; },
  };
}

export type Play = 'scroll' | 'sweep';

/** 화면에 남아 있는 가장 오래된 절대 인덱스. */
export const windowStart = (first: number, head: number, cap: number) => Math.max(first, head - cap + 1);

/** 화면 칸 `i`(0..cap−1)가 보이는 절대 샘플. 스크롤은 오른쪽 끝이 head, 스윕은 칸 자리가 고정
 *  (`i ≡ a (mod cap)`인 가장 최근 샘플). «받은 개수»로 대신하면 F-52가 재발한다. */
export function absAt(i: number, head: number, cap: number, play: Play): number {
  if (play === 'sweep') { const back = ((((head % cap) - i) % cap) + cap) % cap; return head - back; }
  return head - (cap - 1 - i);
}

/** 그 절대 자리에 정말 받은 샘플이 있나. */
export const have = (a: number, first: number, head: number, cap: number) => a >= windowStart(first, head, cap) && a <= head;

/** 진폭: 최대값을 쓰되 99.5 백분위의 SPIKE 배로 묶는다(R 피크는 다 담고 스파이크 한 점에는 안 끌려간다). */
export const SPIKE = 1.4;
export function scan(a: ArrayLike<number>, lo: number, hi: number, cap: number, q = 0.995): {m: number, peak: number, n: number} {
  const n = hi - lo + 1, at = (k: number) => a[((k % cap) + cap) % cap];
  if (n <= 0) return {m: 0, peak: 0, n: 0};
  let m = 0; for (let k = lo; k <= hi; k++) m += at(k); m /= n;
  let mad = 0, mx = 0;
  for (let k = lo; k <= hi; k++) { const v = Math.abs(at(k) - m); mad += v; if (v > mx) mx = v; }
  mad /= n;
  if (!(mad > 0)) return {m, peak: mx, n};
  const NB = 96, W = 0.5, h = new Int32Array(NB + 1);
  for (let k = lo; k <= hi; k++) { const b = Math.abs(at(k) - m) / mad / W; h[b >= NB ? NB : b | 0]++; }
  const want = Math.ceil(n * q); let c = 0, bin = NB;
  for (let k = 0; k <= NB; k++) { c += h[k]; if (c >= want) { bin = k; break; } }
  return {m, peak: Math.min(mx, (bin + 1) * W * mad * SPIKE), n};
}

/** 지우기 경계 — 화면 폭의 고정 비율(기본 10 %, D-42), 비움 3 : 페이드 2(v2.2.1 비). */
export const ERASE_FRAC = 0.1, ERASE_CHOICES = [0.05, 0.1, 0.15, 0.2], ERASE_GAP_PART = 0.6;
export function eraseSpans(cap: number, frac = ERASE_FRAC) {
  const tot = Math.max(0, frac) * cap;
  return {gap: tot * ERASE_GAP_PART, fade: tot * (1 - ERASE_GAP_PART)};
}
/** 나이 `age`(head − 절대 인덱스) 표본의 투명도, 스윕 전용. */
export function sweepAlpha(age: number, cap: number, frac = ERASE_FRAC, soft = true): number {
  const d = cap - age, {gap, fade} = eraseSpans(cap, frac);
  if (d > 0 && d < gap) return 0;
  if (d >= gap && d < gap + fade) return soft ? (d - gap) / fade : 0;
  return 1;
}
/** 스크롤의 왼쪽 끝(사라지는 쪽) 투명도 — 같은 비율의 페이드만. */
export function scrollAlpha(i: number, cap: number, frac = ERASE_FRAC, soft = true): number {
  if (!soft) return 1;
  const w = eraseSpans(cap, frac), n = w.gap + w.fade;
  return n > 0 ? Math.max(0, Math.min(1, i / n)) : 1;
}

/** 표시 보간 — 받은 블록을 표본 REVEAL_STEP 개씩의 단계로 나눠 도착 간격 동안 드러낸다(D-42 · D-49). 값을 지어내지 않는다. */
export const REVEAL_STEP = 6;
export function makeReveal(step = REVEAL_STEP) {
  let base = -1, target = -1, k = 1, tArr = 0, dt = 50;
  return {
    push(h: number, now: number) {
      if (target >= 0 && h > target && h - target < 4096) {
        const gapMs = now - tArr;
        if (gapMs > 0 && gapMs < 500) dt = 0.8 * dt + 0.2 * gapMs;
        base = target; k = Math.max(2, Math.ceil((h - base) / step));
      } else { base = h; k = 1; }                       // 첫 블록 · 끊긴 시간축은 그대로
      target = h; tArr = now;
    },
    at(now: number) {
      if (target < 0) return -1;
      if (k <= 1) return target;
      const j = Math.min(k, 1 + Math.floor((now - tArr) / (dt / k)));
      return base + Math.floor((target - base) * j / k);
    },
    interval: () => dt,
    reset() { base = target = -1; k = 1; tArr = 0; },
  };
}

/** 선단 밝기(잔광, D-41) — 폭은 그림 너비의 6 %(48~120 px), 흰색 최대 60 %, 위치가 아니라 나이로. */
export const GLOW_FRAC = 0.06, GLOW_MIN_PX = 48, GLOW_MAX_PX = 120, GLOW_MAX = 0.6;
export function glowWidth(pw: number, cap: number): number {
  if (!(pw > 0)) return 0;
  const px = Math.min(GLOW_MAX_PX, Math.max(GLOW_MIN_PX, GLOW_FRAC * pw));
  return Math.max(1, Math.round(px / pw * cap));
}
export function glowLevel(age: number, width: number, pos = Infinity): number {
  if (!(width > 0) || age < 0 || age >= width || age > pos) return 0;
  return 1 - age / width;
}
export const glowMix = (age: number, width: number, pos?: number) => GLOW_MAX * Math.pow(glowLevel(age, width, pos), 1.5);
/** 스트림이 멈추면 장식을 정리한다 — 0.3 s 까지 그대로, 그 뒤 0.3 s 동안 0으로. */
export const glowLive = (sinceMs: number) => !(sinceMs > 300) ? 1 : Math.max(0, 1 - (sinceMs - 300) / 300);
export function mixWhite(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, x = Math.max(0, Math.min(1, f));
  return `rgb(${Math.round(r + (255 - r) * x)},${Math.round(g + (255 - g) * x)},${Math.round(b + (255 - b) * x)})`;
}
