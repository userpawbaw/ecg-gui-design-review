/* D-200 실시간 파형을 미리 그린 층으로 — 사용자 2026-11-25 「미리 만들어놓고 저장한 다음 오버레이하는 방식 … 스크롤은 더더욱」.
 *
 * 전(D-161): 링 스트립에 새 표본만 긋는 것까지는 같았지만, 매 프레임 칸 전체를 다시 합성했다(링 붙이기 · 번짐 붙이기 · 잔광 · 사라짐 창).
 *   스크롤에서는 모든 것이 매 프레임 움직이므로 칸 4개 × 화면 크기 붙이기가 프레임마다 — F-112 측정에서 파형 비용의 대부분.
 * 지금: 파형을 창 길이(cap 표본) 단위 「블록」 캔버스 두 장(짝 · 홀)에 새 표본만 긋는다(선 · 번짐, 그리고 잔광용 흰 선).
 *   그 캔버스들을 DOM에 두고 CSS transform으로 옮긴다 — 브라우저 합성기가 이미 그린 그림을 옮길 뿐 다시 칠하지 않는다.
 *   스크롤: 효과는 모두 화면에 고정된 위치라 미리 만든 마스크로 —
 *     선 세기(왼쪽 사라짐 · 먼 구간 0.72 · 선단 쪽 1) = 선 층 마스크, 번짐 세기 = 번짐 층 마스크, 선단 흰빛 = 흰 선 층 마스크 × 불투명도,
 *     빛기둥 = 미리 만든 밝은 격자 띠(불투명도), 선단 빛점 = 작은 요소(위치만). 매 프레임: 새 표본 긋기 + transform 몇 개.
 *   스윕: 블록을 고정 위치에 두고 창 A(지금 블록, 선단 왼쪽) · 창 B(앞 블록, 사라짐 창 오른쪽)로 잘라 보이고, 선단 앞뒤 창만 아래 캔버스에
 *     매 프레임(composeRow farOff). 위치는 표본 번호로 정해지므로 멈췄다 다시 가도 효과와 파형 위치가 같다.
 * 블록 경계의 번짐이 끊기지 않게 각 블록은 양옆 M px만큼 이웃 표본까지 긋고(겹침), 화면에서는 자기 구간만 보이게 자른다. */
import {StripRow, type StripTrace} from '../waveStrip';
import {GLOW_TAU} from '../labFx';

const M = 48;                      // 블록 양옆 겹침(px) — 번짐(⅛ 해상도 + 합) 폭보다 넓게
const PAD = 8;                     // waveStrip 의 PAD 와 같아야 한다(열 → x)
export type Geo = {l: number, r: number, t: number, b: number, pw: number, ph: number};

/** 블록 하나: 표본 [base − m, base + cap + m]을 열 0 … 에 긋는다. row = 선 · 번짐, white = 잔광용 흰 선(스크롤만). */
class BlockRow {
  row = new StripRow(); white = new StripRow(); base = NaN; drawnTo = -1; wTo = -1; m = 0; cap = 0;
  configure(key: string, cap: number, dx: number, P: Geo, dpr: number, level: number) {
    this.m = Math.ceil(M / dx); this.cap = cap;
    const r0 = this.row.rebuilds, nCols = cap + 2 * this.m + 2, geom = {l: 0, t: P.t, w: nCols * dx, h: P.ph, nCols, dx, dpr};
    this.row.configure(key + '|blk', geom, level);
    if (this.row.rebuilds !== r0) this.drawnTo = -1;
    const w0 = this.white.rebuilds; this.white.configure(key + '|blkw', geom, 0); if (this.white.rebuilds !== w0) this.wTo = -1;
  }
  setBase(b: number) { if (b !== this.base) { this.base = b; this.drawnTo = -1; this.wTo = -1; } }
  private static clear(R: StripRow) { for (const L of [R.base, R.lit, ...R.gl, R.sum]) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, L.c.width, L.c.height); } }
  private static step(R: StripRow, to: number, lo: number, hi: number, head: number, first: number, traces: StripTrace[]) {
    const b = Math.min(head, hi); R.first = Math.max(first, lo);
    if (to < 0 || to > b) { BlockRow.clear(R); const a = Math.max(first, lo); if (b < a) return -1; R.paint(a, b, a - lo, traces, true); return b; }
    if (b > to) R.paint(to, b, to - lo, traces, false);
    return Math.max(to, b);
  }
  /** 이 블록 구간에 드는 새 표본만 긋는다. withWhite = 잔광용 흰 선도. */
  paint(head: number, first: number, traces: StripTrace[], withWhite: boolean) {
    const lo = this.base - this.m, hi = this.base + this.cap + this.m;
    if (!Number.isFinite(lo) || head < lo) return;
    this.drawnTo = BlockRow.step(this.row, this.drawnTo, lo, hi, head, first, traces);
    if (withWhite) this.wTo = BlockRow.step(this.white, this.wTo, lo, hi, head, first, traces.filter(t => t.lit).map(t => ({...t, color: '#ffffff', glow: false})));
  }
  /** 화면 x(t) = slotLeft + PAD + (t − lo)·dx 가 되는 slotLeft(블록 캔버스 왼쪽 끝 CSS px). */
  left(xOf: (t: number) => number) { return xOf(this.base - this.m) - PAD; }
}

/** 블록 하나의 DOM: 번짐 · 선(base + lit) · 흰 선 — 층마다 다른 창에 들어간다. */
type Slot = {blk: BlockRow, gEl: HTMLDivElement, lEl: HTMLDivElement, wEl: HTMLDivElement};
type Win = {c1: HTMLDivElement, c2: HTMLDivElement, content: HTMLDivElement};
/** 계열(묶음) 하나: 블록 두 장 + 스크롤용 창 셋(번짐 · 선 · 흰빛, 마스크) + 빛점. */
type GroupL = {slots: [Slot, Slot], box: HTMLDivElement, wg: HTMLDivElement, wl: HTMLDivElement, ww: HTMLDivElement, dots: HTMLCanvasElement[]};

const css = (e: HTMLElement, s: string) => { e.style.cssText = s; return e; };
const div = (s: string) => css(document.createElement('div'), s) as HTMLDivElement;
const ABS = 'position:absolute;left:0;top:0';

/** 나이 램프 마스크(왼쪽 = 나이 span, 오른쪽 = 0) — composeRow 의 AgeRamps 와 같은 식. kind: line = 선 세기 k, glow = 번짐(먼 구간 0.72 상한), white = 잔광. */
const maskCache = new Map<string, string>();
function rampMask(kind: 'line' | 'glow' | 'white', span: number, gap: number, fade: number, oldK = .72) {
  const key = [kind, span.toFixed(4), gap.toFixed(4), fade.toFixed(4), oldK].join('|'); let u = maskCache.get(key); if (u) return u;
  const W = 512, c = document.createElement('canvas'); c.width = W; c.height = 1; const g = c.getContext('2d')!, im = g.createImageData(W, 1), end = span - gap;
  for (let j = 0; j < W; j++) {
    const age = (1 - (j + .5) / W) * span, glow = Math.exp(-age / GLOW_TAU);
    let k = 0; if (age < end) { const f = fade > 0 && age > end - fade ? (end - age) / fade : 1, e = f * f * (3 - 2 * f); k = (oldK + (1 - oldK) * glow) * e; }
    const a = kind === 'line' ? k : kind === 'glow' ? Math.min(k, oldK) / oldK : glow;
    im.data[j * 4] = im.data[j * 4 + 1] = im.data[j * 4 + 2] = 255; im.data[j * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, a)));
  }
  g.putImageData(im, 0, 0); u = `url(${c.toDataURL()})`; maskCache.set(key, u); if (maskCache.size > 64) maskCache.delete(maskCache.keys().next().value!);
  return u;
}

export class PanelLayers {
  root = div('position:absolute;pointer-events:none;overflow:hidden');
  clipP = div('position:absolute;overflow:hidden');
  wins: [Win, Win];
  band = document.createElement('canvas');
  groups = new Map<string, GroupL>();
  key = ''; bandKey = ''; maskKey = ''; mode: '' | 'scroll' | 'sweep' = ''; P: Geo = {l: 0, r: 0, t: 0, b: 0, pw: 0, ph: 0};
  constructor(public canvas: HTMLCanvasElement) {
    const mk = (): Win => { const c1 = div(ABS + ';height:100%;overflow:hidden;will-change:transform'), c2 = div(ABS + ';height:100%;overflow:hidden;will-change:transform'), content = div(ABS + ';height:100%;will-change:transform');
      c2.appendChild(content); c1.appendChild(c2); this.clipP.appendChild(c1); return {c1, c2, content}; };
    this.wins = [mk(), mk()]; this.root.appendChild(this.clipP);
    css(this.band, ABS + ';will-change:transform,opacity;opacity:0'); this.root.appendChild(this.band);
  }
  attach() { const par = this.canvas.parentElement; if (par && this.root.parentElement !== par) { if (getComputedStyle(par).position === 'static') par.style.position = 'relative'; par.appendChild(this.root); } }
  hide(on: boolean) { const d = on ? 'none' : ''; if (this.root.style.display !== d) this.root.style.display = d; }
  /** 칸 크기 · 판 · 표본 수가 바뀌면 자리를 다시 잡는다. */
  layout(w: number, h: number, P: Geo, key: string) {
    if (key === this.key) return; this.key = key; this.P = P;
    const c = this.canvas; css(this.root, `position:absolute;pointer-events:none;overflow:hidden;left:${c.offsetLeft}px;top:${c.offsetTop}px;width:${w}px;height:${h}px`);
    css(this.clipP, `position:absolute;overflow:hidden;left:${P.l}px;top:${P.t}px;width:${P.pw}px;height:${P.ph}px`);
    for (const W of this.wins) { W.c1.style.width = W.c2.style.width = P.pw + 'px'; }
    for (const g of this.groups.values()) for (const e of [g.wg, g.wl, g.ww]) { e.style.width = P.pw + 'px'; e.style.height = P.ph + 'px'; }
  }
  /** 스크롤 · 스윕 전환: 블록 층을 알맞은 창으로 옮긴다. */
  setMode(m: 'scroll' | 'sweep') {
    if (m === this.mode) return; this.mode = m;
    for (const W of this.wins) W.c1.style.display = m === 'sweep' ? '' : 'none';
    for (const g of this.groups.values()) g.box.style.display = m === 'scroll' ? '' : 'none';
    if (m === 'sweep') { this.band.style.opacity = '0'; for (const g of this.groups.values()) for (const d of g.dots) d.style.opacity = '0'; }   // 스윕은 빛기둥 · 빛점을 아래 캔버스에 그린다
  }
  group(id: string): GroupL {
    let g = this.groups.get(id);
    if (!g) {
      const mkSlot = (): Slot => { const blk = new BlockRow(), R = blk.row, gEl = div(ABS + ';will-change:transform'), lEl = div(ABS + ';will-change:transform'), wEl = div(ABS + ';will-change:transform');
        for (const [el, cvs] of [[gEl, [R.sum.c]], [lEl, [R.base.c, R.lit.c]], [wEl, [blk.white.lit.c]]] as const) for (const cv of cvs) { cv.style.cssText = ABS; el.appendChild(cv); }
        return {blk, gEl, lEl, wEl}; };
      const win = () => div(ABS + `;overflow:hidden;width:${this.P.pw}px;height:${this.P.ph}px;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat`);
      const box = div(ABS + ';width:100%;height:100%'), wg = win(), wl = win(), ww = win(); box.append(wg, wl, ww); box.style.display = this.mode === 'scroll' ? '' : 'none';
      this.clipP.appendChild(box);
      g = {slots: [mkSlot(), mkSlot()], box, wg, wl, ww, dots: []}; this.groups.set(id, g); this.maskKey = '';
    }
    return g;
  }
  prune(ids: string[]) { for (const [id, g] of this.groups) if (!ids.includes(id)) { for (const s of g.slots) for (const e of [s.gEl, s.lEl, s.wEl]) e.remove(); g.box.remove(); for (const d of g.dots) d.remove(); this.groups.delete(id); } }
  /** 묶음 순서(아래 → 위) — 겹치기 강조 순서가 바뀔 때만 다시 쌓는다. */
  order(ids: string[]) { const k = ids.join(); if (this.root.dataset.order === k) return; this.root.dataset.order = k; for (const id of ids) { const g = this.groups.get(id); if (g) this.clipP.appendChild(g.box); } }
  /** 스크롤 마스크(구간 · 지우기 설정이 바뀔 때만). */
  masks(span: number, gap: number, fade: number) {
    const k = [span, gap, fade, this.groups.size].join('|'); if (k === this.maskKey) return; this.maskKey = k;
    const set = (e: HTMLElement, u: string) => { e.style.maskImage = u; e.style.setProperty('-webkit-mask-image', u); };
    for (const g of this.groups.values()) { set(g.wl, rampMask('line', span, gap, fade)); set(g.wg, rampMask('glow', span, gap, fade)); set(g.ww, rampMask('white', span, gap, fade)); }
  }
  /** 창 하나를 화면 [x0, x1](칸 기준 CSS px)만 보이게 — transform 셋(합성기만). 비면 숨김. (스윕) */
  setWin(i: 0 | 1, x0: number, x1: number) {
    const W = this.wins[i], P = this.P; x0 = Math.max(P.l, x0); x1 = Math.min(P.r, x1);
    if (!(x1 > x0 + .5)) { if (W.c1.style.visibility !== 'hidden') W.c1.style.visibility = 'hidden'; return; }
    if (W.c1.style.visibility) W.c1.style.visibility = ''; const L1 = x1 - P.pw;
    W.c1.style.transform = `translate3d(${(L1 - P.l).toFixed(2)}px,0,0)`;
    W.c2.style.transform = `translate3d(${(x0 - L1).toFixed(2)}px,0,0)`;
    W.content.style.transform = `translate3d(${(P.l - x0).toFixed(2)}px,0,0)`;
  }
  /** 블록 캔버스 크기(CSS)를 링 캔버스 크기에 맞춘다(배치가 바뀔 때만). */
  sizeSlot(s: Slot, dpr: number) {
    const R = s.blk.row, lw = R.lit.c.width / dpr, lh = R.lit.c.height / dpr, sw = R.sum.c.width * 2, sh = R.sum.c.height * 2, k = `${lw}x${lh}|${sw}x${sh}`;
    if (s.lEl.dataset.k === k) return; s.lEl.dataset.k = k;
    for (const cv of [R.base.c, R.lit.c, s.blk.white.lit.c]) { cv.style.width = lw + 'px'; cv.style.height = lh + 'px'; }
    R.sum.c.style.width = sw + 'px'; R.sum.c.style.height = sh + 'px';
  }
  /** 빛기둥 띠: 밝은 격자(hot)를 선단 뒤 BAND 폭만큼 5단 세기로 미리 굽는다(스크롤 — 선단이 오른쪽 끝에 고정). */
  bakeBand(hot: HTMLCanvasElement, P: Geo, bandPx: number, dpr: number, key: string) {
    if (key === this.bandKey) return; this.bandKey = key;
    const c = this.band, W = Math.ceil(bandPx * dpr), H = Math.ceil(P.ph * dpr); c.width = W; c.height = H; c.style.width = bandPx + 'px'; c.style.height = P.ph + 'px';
    const g = c.getContext('2d')!; g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    const x0 = P.r - bandPx;   // 띠 왼쪽(선단 = P.r 기준)
    for (let i = 0; i < 5; i++) { const sx = P.r - bandPx * (i + 1) / 5, bw = bandPx / 5; g.globalAlpha = (1 - i / 5) * .7; g.drawImage(hot, sx * dpr, P.t * dpr, bw * dpr, P.ph * dpr, (sx - x0) * dpr, 0, bw * dpr, H); }
  }
}

const panels = new WeakMap<HTMLCanvasElement, PanelLayers>();
export const layersFor = (c: HTMLCanvasElement) => { let p = panels.get(c); if (!p) { p = new PanelLayers(c); panels.set(c, p); } return p; };
export const layersOff = (c: HTMLCanvasElement) => { panels.get(c)?.hide(true); };
export {BlockRow};
