// D-161 링 스트립 파형 그리기 — 실험실 파형 효과(D-073: 용지 격자 · 잔광 · 선단 사라짐 · 3단 번짐 · 빛기둥 · 선단 빛점)를
// 매 프레임 다시 래스터화하지 않고 그린다. 계약은 D-073과 같다: 모든 꼭짓점은 받은(저장된) 표본이고, 효과는 꼭짓점을 옮기지 않는 층이다.
//
// 왜 싸지나 — 스윕에서 표본의 x는 고정이고 스크롤에서도 표본끼리의 상대 x는 고정이다. 그래서
//  1) 표본은 화면 폭 링 캔버스에 도착할 때 한 번만 긋는다(새 표본 몇 개 폭만 잘라 지우고 다시 이음 — clip → clear → stroke).
//  2) 번짐 원본(½ · ¼ · ⅛ 해상도)도 그 띠만 다시 만든다.
//  3) 잔광(흰빛)과 선단 앞 사라짐은 나이(초)에만 달린 1 px 높이 램프를 미리 굽고, 선단 위치에 붙인다(source-atop / destination-out).
//  4) 선단 빛점은 미리 그린 스프라이트.
// 매 프레임 남는 것은 이미지 붙이기 몇 번이다. 축 · 크기 · 창 길이 · 시점 이동이 바뀔 때만 전체를 다시 긋는다(그 한 번의 비용 = 이전 방식 한 프레임).
import {GLOW_TAU} from './labFx';

export type StripTrace = {y: (t: number) => number, color: string, width: number, alpha?: number, lit: boolean, glow: boolean, ok?: (t: number) => boolean};
export type StripGeom = {l: number, t: number, w: number, h: number, nCols: number, dx: number, dpr: number};

const mk = () => { const c = document.createElement('canvas'); return {c, g: c.getContext('2d')!}; };
const PAD = 8;

/** 한 칸(행)의 링 캔버스 묶음: 밝히지 않는 선(base: Reference 등) · 밝히는 선(lit) · 번짐 3단. */
export class StripRow {
  base = mk(); lit = mk(); gl = [mk(), mk(), mk()]; sum = mk(); levels = 2; hasBase = false;
  key = ''; drawnTo = -1; first = 0; geom!: StripGeom; rebuilds = 0;
  /** 기하·축·자료가 바뀌면(key) 비우고 처음부터. */
  configure(key: string, geom: StripGeom, levels = 2) {
    key += '|L' + levels; if (key === this.key) return;
    this.key = key; this.levels = levels; this.geom = geom; this.drawnTo = -1; this.rebuilds++;
    const W = Math.ceil((geom.nCols * geom.dx + 2 * PAD) * geom.dpr), H = Math.ceil(geom.h * geom.dpr);
    for (const L of [this.base, this.lit]) { L.c.width = W; L.c.height = H; }
    // 번짐은 흐린 빛이라 화면 밀도(dpr)와 무관하게 CSS 픽셀의 ½ · ¼ · ⅛ 로 계산한다(dpr 2에서 화소 4배 절약)
    const Wc = Math.ceil(geom.nCols * geom.dx + 2 * PAD), Hc = Math.ceil(geom.h);
    this.gl.forEach((L, i) => { L.c.width = Math.ceil(Wc / 2 ** (i + 1)); L.c.height = Math.ceil(Hc / 2 ** (i + 1)); });
    this.sum.c.width = this.gl[0].c.width; this.sum.c.height = this.gl[0].c.height;
  }
  invalidate() { this.drawnTo = -1; }
  /** 선단 앞 n열(빈칸)을 링에서 미리 비운다 — 빈칸은 램프로 지울 필요가 없어진다. 선(+2 px)과 번짐(+6 px)은 선단 바로 뒤를 남긴다. */
  clearAhead(head: number, n: number) {
    if (head < 0 || n <= 0) return;
    const G = this.geom, N = G.nCols, ch = head % N;
    const spans: [number, number][] = [], a = this.rx(ch), b = this.rx(ch + n);
    const R = this.rx(N) + PAD;
    if (b <= R) spans.push([a, b]); else { spans.push([a, R]); spans.push([0, this.rx(ch + n - N)]); }
    for (const [x0, x1] of spans) {
      const lead = x0 === 0 ? 0 : 1;
      for (const L of [this.base, this.lit]) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect((x0 + 2 * lead) * G.dpr, 0, (x1 - x0 - 2 * lead) * G.dpr, L.c.height); }
      this.gl.forEach((L, i) => { const k = 2 ** (i + 1); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect((x0 + 6 * lead) / k, 0, (x1 - x0 - 6 * lead) / k, L.c.height); });
      this.sum.g.setTransform(1, 0, 0, 1, 0, 0); this.sum.g.clearRect((x0 + 6 * lead) / 2, 0, (x1 - x0 - 6 * lead) / 2, this.sum.c.height);
    }
  }
  private rx(c: number) { return PAD + c * this.geom.dx; }
  /** 새 표본(drawnTo+1 … head)만 긋는다. first = 이 칸에서 쓸 수 있는 가장 이른 표본. */
  update(head: number, first: number, traces: StripTrace[]) {
    const G = this.geom, N = G.nCols;
    if (head < 0) return;
    this.first = first;
    let s0: number;
    if (this.drawnTo < 0 || head < this.drawnTo || head - this.drawnTo >= N - 2) {
      for (const L of [this.base, this.lit, ...this.gl, this.sum]) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, L.c.width, L.c.height); }
      s0 = Math.max(first, head - N + 1); this.band(s0, head, traces, true);
    } else if (head > this.drawnTo) { s0 = this.drawnTo; this.band(s0, head, traces, false); }
    this.drawnTo = head;
  }
  /** [a, b] 표본 띠: 링 열이 감기면 둘로 나눈다. a는 이미 그어진 표본(이음점) — 그 오른쪽만 지우고 다시 잇는다. */
  private band(a: number, b: number, traces: StripTrace[], full: boolean) {
    const N = this.geom.nCols, ca = a % N, cb = b % N;
    if (cb >= ca && b - a < N) { this.paint(a, b, ca, traces, full); return; }
    const wrapT = a + (N - 1 - ca);                    // 열 N-1에 놓이는 표본
    this.paint(a, wrapT + 1, ca, traces, full);        // 오른쪽 끝을 한 열 넘겨 이음(스크롤 이음매용)
    this.paint(wrapT, b, -1, traces, full);            // 왼쪽은 열 -1에서 시작
  }
  private paint(a: number, b: number, colA: number, traces: StripTrace[], full: boolean) {
    const G = this.geom, d = G.dpr, x1 = this.rx(colA + (b - a)) + 3;
    // 지울 왼쪽 경계: 처음부터면 전부, 이어 그리기면 이음점(이미 그은 마지막 표본) 오른쪽만, 감긴 둘째 조각은 왼쪽 여백부터
    const clipL = full || colA < 0 ? 0 : this.rx(colA);
    const xs = (t: number) => this.rx(colA + (t - a));
    const draw = (L: {c: HTMLCanvasElement, g: CanvasRenderingContext2D}, scale: number, list: StripTrace[], widthK: number | null) => {
      const g = L.g; g.setTransform(scale, 0, 0, scale, 0, -G.t * scale);
      g.save(); g.beginPath(); g.rect(clipL, G.t - 50, x1 - clipL, G.h + 100); g.clip();
      g.clearRect(clipL, G.t - 50, x1 - clipL, G.h + 100);
      g.lineJoin = 'round'; g.lineCap = 'round';
      for (const tr of list) {
        g.strokeStyle = tr.color; g.globalAlpha = tr.alpha ?? 1; g.lineWidth = widthK ?? tr.width;
        g.beginPath(); let pen = false, n = 0;
        for (let t = Math.max(a - 1, this.first); t <= b; t++) {
          if (tr.ok && !tr.ok(t)) { pen = false; continue; }
          const x = xs(t), y = tr.y(t);
          if (pen) { g.lineTo(x, y); if (++n >= 48) { g.stroke(); g.beginPath(); g.moveTo(x, y); n = 0; } } else { g.moveTo(x, y); pen = true; n = 0; }
        }
        g.stroke();
      }
      g.restore(); g.globalAlpha = 1;
    };
    this.hasBase = traces.some(t => !t.lit);
    if (this.hasBase) draw(this.base, d, traces.filter(t => !t.lit), null);
    draw(this.lit, d, traces.filter(t => t.lit), null);
    const gt = traces.filter(t => t.glow);
    if (gt.length) {
      draw(this.gl[0], .5, gt, 2.4);
      // ¼ · ⅛: 띠(여유 포함)만 위 단계에서 다시 줄여 옮긴다
      for (let i = 1; i < 3; i++) {
        const S = this.gl[i - 1], D = this.gl[i], k = 2 ** (i + 1), ks = 2 ** i;
        const lx = Math.max(0, Math.floor((clipL - 8 * ks) / k)), rx = Math.min(D.c.width, Math.ceil((x1 + 8 * ks) / k));
        D.g.setTransform(1, 0, 0, 1, 0, 0); D.g.clearRect(lx, 0, rx - lx, D.c.height); D.g.imageSmoothingEnabled = true;
        D.g.drawImage(S.c, lx * 2, 0, (rx - lx) * 2, S.c.height, lx, 0, rx - lx, D.c.height);
      }
      // 번짐 합: ½ · ¼ · ⅛ 를 ½ 해상도 한 장으로 미리 더해 둔다(실험실 가중치 .35 · .65 · .8). 합성 때 확대 붙이기가 3번 → 1번.
      const U = this.sum, lx = Math.max(0, Math.floor((clipL - 40) / 2)), rx = Math.min(U.c.width, Math.ceil((x1 + 40) / 2));
      U.g.setTransform(1, 0, 0, 1, 0, 0); U.g.clearRect(lx, 0, rx - lx, U.c.height); U.g.imageSmoothingEnabled = true;
      U.g.globalCompositeOperation = 'lighter';
      U.g.globalAlpha = .35; U.g.drawImage(this.gl[0].c, lx, 0, rx - lx, U.c.height, lx, 0, rx - lx, U.c.height);
      U.g.globalAlpha = .65; U.g.drawImage(this.gl[1].c, lx / 2, 0, (rx - lx) / 2, this.gl[1].c.height, lx, 0, rx - lx, U.c.height);
      if (this.levels >= 2) { U.g.globalAlpha = .8; U.g.drawImage(this.gl[2].c, lx / 4, 0, (rx - lx) / 4, this.gl[2].c.height, lx, 0, rx - lx, U.c.height); }
      U.g.globalAlpha = 1; U.g.globalCompositeOperation = 'source-over';
    }
  }
  /** 링 → 화면 칸: 스윕은 그대로, 스크롤은 선단 열이 오른쪽 끝(rightX)에 오도록 두 조각. */
  blit(g: CanvasRenderingContext2D, src: HTMLCanvasElement, scale: number, sweep: boolean, head: number, rightX: number) {
    const G = this.geom, d = G.dpr / scale, N = G.nCols, sx = (x: number) => x * d;
    if (sweep) { g.drawImage(src, sx(PAD), 0, sx(N * G.dx), src.height, G.l, G.t, N * G.dx, G.h); return; }
    const ch = head % N, xHeadRing = this.rx(ch), off = rightX - xHeadRing;     // 링 x + off = 화면 x
    // 조각 A: 열 ch+1 … N(감기 직전, 한 열 넘김 포함) → 화면 왼쪽, 조각 B: 열 0 … ch → 화면 오른쪽
    const aL = this.rx(ch + 1), aR = this.rx(N), bL = this.rx(0), bR = this.rx(ch) + 3;
    const offA = off - N * G.dx;
    if (aR > aL) g.drawImage(src, sx(aL), 0, sx(aR - aL), src.height, aL + offA, G.t, aR - aL, G.h);
    g.drawImage(src, sx(bL), 0, sx(bR - bL), src.height, bL + off, G.t, bR - bL, G.h);
  }
}

/** 나이 램프: 왼쪽 끝 = 나이 span, 오른쪽 끝 = 나이 0. white = 잔광 흰빛 정도, erase = 1 − 세기(선단 앞 빈칸·사라짐 · 오래된 표본 0.72). */
export class AgeRamps {
  white = mk(); erase = mk(); key = '';
  build(span: number, gap: number, fade: number, oldK = .72) {
    const key = [span, gap, fade, oldK].join('|'); if (key === this.key) return; this.key = key;
    const W = 1024;
    for (const L of [this.white, this.erase]) { L.c.width = W; L.c.height = 1; }
    const wi = this.white.g.createImageData(W, 1), ei = this.erase.g.createImageData(W, 1), end = span - gap;
    for (let j = 0; j < W; j++) {
      const age = (1 - (j + .5) / W) * span, glow = Math.exp(-age / GLOW_TAU);
      let k = 0; if (age < end) { const f = fade > 0 && age > end - fade ? (end - age) / fade : 1, e = f * f * (3 - 2 * f); k = (oldK + (1 - oldK) * glow) * e; }
      wi.data.set([255, 255, 255, Math.round(255 * glow)], j * 4); ei.data.set([0, 0, 0, Math.round(255 * (1 - k))], j * 4);
    }
    this.white.g.putImageData(wi, 0, 0); this.erase.g.putImageData(ei, 0, 0);
  }
  /** 화면 칸 [l, r]에 램프를 선단(headX) 기준으로 붙인다. 스윕은 선단 오른쪽에 한 바퀴 전 램프를 이어 붙인다. */
  put(g: CanvasRenderingContext2D, ramp: HTMLCanvasElement, l: number, r: number, t: number, h: number, headX: number, sweep: boolean) {
    const pw = r - l; g.imageSmoothingEnabled = true;
    if (sweep) { g.drawImage(ramp, headX - pw, t, pw, h); g.drawImage(ramp, headX, t, pw, h); }
    else g.drawImage(ramp, l, t, pw, h);
  }
}

/** 선단 빛점 스프라이트(반지름 R, 중심 흰빛 a). */
const sprites = new Map<string, HTMLCanvasElement>();
export function headSprite(R: number, a: number, dpr: number) {
  const key = [R, a, dpr].join('|'); let c = sprites.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = c.height = Math.ceil(2 * R * dpr); const g = c.getContext('2d')!;
    const rg = g.createRadialGradient(R * dpr, R * dpr, 0, R * dpr, R * dpr, R * dpr); rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, c.width, c.height); sprites.set(key, c); }
  return c;
}

/** 한 칸의 합성.
 *  먼 구간(세기 = oldK 일정, 흰빛 없음): 링을 화면에 바로 붙인다(층 없음).
 *  선 창: 선단 뒤 hotS(흰빛) + 사라짐 구간 — 작은 층에서 램프. 번짐 창: 사라짐 구간만, CSS ½ 해상도 층.
 *  선단 앞 빈칸은 StripRow.clearAhead 가 링에서 이미 비웠다. */
const glowLayer = mk();
export function composeRow(g: CanvasRenderingContext2D, row: StripRow, ramps: AgeRamps, layer: {c: HTMLCanvasElement, g: CanvasRenderingContext2D}, o: {
  sweep: boolean, head: number, headX: number, rightX: number, r: number, white: number, glow: number, level: number, liveK: number, span: number, gapS: number, tailS: number, oldK?: number,
}) {
  const G = row.geom, d = G.dpr, l = G.l, r = o.r, pw = r - l, k = pw / o.span, oldK = o.oldK ?? .72, hotS = Math.min(o.span, 3 * GLOW_TAU);
  const clipTo = (list: [number, number][]) => list.map(([a, b]) => [Math.max(l, a), Math.min(r, b)] as [number, number]).filter(([a, b]) => b > a);
  const wrap = (a: number, b: number) => clipTo([-pw, 0, pw].map(off => [a + off, b + off] as [number, number]));
  // 사라짐 구간(나이 span−tailS … span−gapS)과 흰빛 구간(나이 0 … hotS)의 화면 x
  const fade = o.sweep ? wrap(o.headX + o.gapS * k - 2, o.headX + o.tailS * k + 2) : clipTo([[o.rightX - (o.span - o.gapS) * k - 2, o.rightX - (o.span - o.tailS) * k + 2]]);
  const hot = o.sweep ? wrap(o.headX - hotS * k - 2, o.headX + 3) : clipTo([[o.rightX - hotS * k - 2, r]]);
  const lineWins = [...fade, ...hot].sort((a, b) => a[0] - b[0]);
  const glowOn = o.level > 0 && o.glow > .003;
  const clipOut = (wins: [number, number][]) => { g.beginPath(); let x = l; for (const [a, b] of wins) { if (a > x) g.rect(x, G.t, a - x, G.h); x = Math.max(x, b); } if (x < r) g.rect(x, G.t, r - x, G.h); g.clip(); };
  // 1) 먼 구간
  if (glowOn) { g.save(); clipOut(fade); g.globalCompositeOperation = 'lighter'; g.globalAlpha = oldK * o.glow; row.blit(g, row.sum.c, 2 * d, o.sweep, o.head, o.rightX); g.restore(); }
  g.save(); clipOut(lineWins); g.globalAlpha = oldK;
  if (row.hasBase) row.blit(g, row.base.c, 1, o.sweep, o.head, o.rightX);
  row.blit(g, row.lit.c, 1, o.sweep, o.head, o.rightX);
  g.restore();
  // 2) 창
  const run = (Lr: {c: HTMLCanvasElement, g: CanvasRenderingContext2D}, a: number, b: number, s: number, fn: (L: CanvasRenderingContext2D) => void, op: GlobalCompositeOperation) => {
    const W = Math.ceil((b - a) * s) + 2, H = Math.ceil(G.h * s);
    if (Lr.c.width < W || Lr.c.height < H) { Lr.c.width = Math.max(W, Lr.c.width); Lr.c.height = Math.max(H, Lr.c.height); }
    const L = Lr.g; L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, W, H);
    L.setTransform(s, 0, 0, s, -a * s, -G.t * s); L.imageSmoothingEnabled = true; fn(L);
    L.globalCompositeOperation = 'destination-out'; L.globalAlpha = 1; ramps.put(L, ramps.erase.c, l, r, G.t, G.h, o.headX, o.sweep);
    g.save(); g.globalCompositeOperation = op; g.imageSmoothingEnabled = true; g.setTransform(1, 0, 0, 1, 0, 0);
    // 2026-11-12 사용자(사라지는 구간 오른쪽 끝이 밝게 빛남): 층은 2 px 여유를 두고 만들지만 화면에는 창 폭 [a, b]만 붙인다 —
    // 여유까지 붙이면 그 2 px가 먼 구간(이미 그은 선 · 'lighter' 번짐) 위에 한 번 더 겹쳐 밝은 띠가 생겼다.
    const Wd = (b - a) * s;
    g.drawImage(Lr.c, 0, 0, Wd, H, a * d, G.t * d, (b - a) * d, H / s * d); g.restore();
  };
  if (glowOn) for (const [a, b] of fade) run(glowLayer, a, b, .5, L => { L.globalCompositeOperation = 'lighter'; L.globalAlpha = o.glow; row.blit(L, row.sum.c, 2 * d, o.sweep, o.head, o.rightX); }, 'lighter');
  for (const [a, b] of lineWins) run(layer, a, b, d, L => {
    row.blit(L, row.lit.c, 1, o.sweep, o.head, o.rightX);
    if (o.white > 0 && o.liveK > 0) { L.globalCompositeOperation = 'source-atop'; L.globalAlpha = Math.min(1, .75 * o.white) * o.liveK; ramps.put(L, ramps.white.c, l, r, G.t, G.h, o.headX, o.sweep); }
    if (row.hasBase) { L.globalCompositeOperation = 'destination-over'; L.globalAlpha = 1; row.blit(L, row.base.c, 1, o.sweep, o.head, o.rightX); }
  }, 'source-over');
}
