/* 실시간 측정 B안 (D-157) — 캔버스 그리기. 원본 저장소 demo/live.html 의 그리기 규약을 옮겼다:
 * v2.2.1 판 색 #112b39 · 격자 · 실제 mV/시간 눈금(D-36), 파형은 따로 한 층에 긋고 지우기 경계는 그 층을 그라데이션으로
 * 깎는다(D-46), 선단 밝기·빛점(D-41 개정), 측정값이 아닌 구간(ok=0) 음영, 스윕 커서. 프레임 값은 React 를 거치지 않는다. */
import * as AX from './liveAxis';
import type {LiveStream} from './liveStream';

export type View = {mode: 'split' | 'overlay', play: AX.Play, amp: number, eraseFrac: number, softEdge: boolean, glowOn: boolean};
type Axis = {m: number, s: number};
type Rect = {l: number, r: number, t: number, b: number, pw: number, ph: number};

const plotRect = (w: number, h: number): Rect => { const l = 58, r = w - 14, t = 6, b = h - 20; return {l, r, t, b, pw: r - l, ph: b - t}; };

function fit(c: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0); return {g, w, h, dpr};
}

function drawFrame(g: CanvasRenderingContext2D, P: Rect, ax: Axis | undefined, winS: number, play: AX.Play) {
  g.strokeStyle = '#304955'; g.lineWidth = .6;
  for (let k = 0; k <= 10; k++) { const x = P.l + k * P.pw / 10; g.beginPath(); g.moveTo(x, P.t); g.lineTo(x, P.b); g.stroke(); }
  for (let k = 0; k <= 4; k++) { const y = P.t + k * P.ph / 4; g.beginPath(); g.moveTo(P.l, y); g.lineTo(P.r, y); g.stroke(); }
  g.font = '11px system-ui'; g.fillStyle = '#acc2cd';
  if (ax) {                                            // 눈금은 실제 mV — 이득 하나와 그 계열의 중심으로 환산
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let k = 0; k <= 4; k++) {
      const v = ax.m + (1 - k / 2) * ax.s * (P.ph / 2 - 6) / (P.ph / 2), txt = v.toFixed(Math.abs(ax.s) < .5 ? 2 : 1);
      g.fillText(/^-0\.0+$/.test(txt) ? txt.slice(1) : txt, P.l - 8, P.t + k * P.ph / 4);
    }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('[mV]', 6, P.b + 15);
  }
  g.textBaseline = 'alphabetic';
  for (let k = 0; k <= 4; k++) {
    const sec = k * winS / 4, f = (v: number) => (Math.round(v * 100) / 100).toFixed(Number.isInteger(v * 2) ? 1 : 2);
    g.textAlign = k === 0 ? 'left' : k === 4 ? 'right' : 'center';
    g.fillText(play === 'sweep' ? f(sec) + 's 위치' : f(sec - winS) + 's', P.l + k * P.pw / 4, P.b + 15);
  }
  g.textAlign = 'left';
}

/** 격자·눈금은 축·길이·방식이 바뀔 때만 다시 그린다(D-46). */
const statics = new WeakMap<HTMLCanvasElement, {key: string, cv: HTMLCanvasElement}>();
function paintStatic(c: HTMLCanvasElement, g: CanvasRenderingContext2D, w: number, h: number, dpr: number, P: Rect, ax: Axis | undefined, winS: number, play: AX.Play) {
  const key = [w, h, dpr, play, winS, ax ? ax.m.toFixed(5) + ',' + ax.s : '-'].join('|');
  let st = statics.get(c);
  if (!st || st.key !== key) {
    const o = st?.cv ?? document.createElement('canvas'); o.width = Math.round(w * dpr); o.height = Math.round(h * dpr);
    const og = o.getContext('2d')!; og.setTransform(dpr, 0, 0, dpr, 0, 0); og.fillStyle = '#112b39'; og.fillRect(0, 0, w, h);
    drawFrame(og, P, ax, winS, play); st = {key, cv: o}; statics.set(c, st);
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(st.cv, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const LAYER = typeof document !== 'undefined' ? document.createElement('canvas') : (null as unknown as HTMLCanvasElement);
function layerBegin(w: number, h: number, dpr: number) {
  if (LAYER.width !== Math.round(w * dpr) || LAYER.height !== Math.round(h * dpr)) { LAYER.width = Math.round(w * dpr); LAYER.height = Math.round(h * dpr); }
  const lg = LAYER.getContext('2d')!; lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, LAYER.width, LAYER.height); lg.setTransform(dpr, 0, 0, dpr, 0, 0); return lg;
}
function eraseRamp(gr: CanvasGradient, from: number, to: number) {
  for (let k = 0; k <= 8; k++) { const u = k / 8, e = u * u * (3 - 2 * u); gr.addColorStop(u, `rgba(0,0,0,${(from + (to - from) * e).toFixed(4)})`); }
}
function eraseEdges(lg: CanvasRenderingContext2D, P: Rect, S: LiveStream, v: View) {
  if (S.vh < 0) return;
  const sweep = v.play === 'sweep'; if (!sweep && !v.softEdge) return;
  const e = AX.eraseSpans(S.cap, v.eraseFrac), pxN = (n: number) => n / (S.cap - 1) * P.pw;
  lg.save(); lg.beginPath(); lg.rect(P.l, P.t, P.pw, P.ph); lg.clip(); lg.globalCompositeOperation = 'destination-out';
  if (sweep) {
    const x0 = P.l + ((S.vh + 1) % S.cap) / (S.cap - 1) * P.pw, gw = pxN(e.gap), fw = pxN(e.fade);
    for (const off of [0, -P.pw]) {                    // 오른쪽 끝을 넘으면 왼쪽에서 이어진다
      const a = x0 + off; lg.fillStyle = '#000';
      if (!v.softEdge) { lg.fillRect(a, P.t, gw + fw, P.ph); continue; }
      lg.fillRect(a, P.t, gw, P.ph); const gr = lg.createLinearGradient(a + gw, 0, a + gw + fw, 0); eraseRamp(gr, 1, 0); lg.fillStyle = gr; lg.fillRect(a + gw, P.t, fw, P.ph);
    }
  } else { const n = pxN(e.gap + e.fade), gr = lg.createLinearGradient(P.l, 0, P.l + n, 0); eraseRamp(gr, 1, 0); lg.fillStyle = gr; lg.fillRect(P.l, P.t, n, P.ph); }
  lg.restore();
}
function layerEnd(g: CanvasRenderingContext2D, lg: CanvasRenderingContext2D, P: Rect, dpr: number, S: LiveStream, v: View) {
  eraseEdges(lg, P, S, v); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(LAYER, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function strokeBuf(g: CanvasRenderingContext2D, S: LiveStream, a: Float32Array, P: Rect, ax: Axis, color: string, lw: number, v: View, alpha = 1, now = performance.now()) {
  const cap = S.cap, H = S.vh, sweep = v.play === 'sweep';
  const x = (i: number) => P.l + i / (cap - 1) * P.pw, yLo = P.t - 4, yHi = P.b + 4;
  const y = (val: number) => Math.min(yHi, Math.max(yLo, P.t + P.ph / 2 - (val - ax.m) / ax.s * (P.ph / 2 - 6)));
  g.save(); g.beginPath(); g.rect(P.l, P.t, P.pw, P.ph); g.clip();
  g.strokeStyle = color; g.lineWidth = lw; g.lineJoin = 'round'; g.globalAlpha = alpha;
  const CHUNK = 24; let pen = false, nseg = 0, prev = -2;      // 한 획을 24 선분으로 끊는다(D-44: 촘촘한 선의 합집합 계산 회피)
  for (let i = 0; i < cap; i++) {
    const t = AX.absAt(i, H, cap, v.play);
    if (!S.seen(t)) { if (pen) { g.stroke(); pen = false; } continue; }
    const px = x(i), py = y(a[t % cap]);
    if (!pen || t !== prev + 1) { if (pen) g.stroke(); g.beginPath(); g.moveTo(px, py); pen = true; nseg = 0; }
    else { g.lineTo(px, py); if (++nseg >= CHUNK) { g.stroke(); g.beginPath(); g.moveTo(px, py); nseg = 0; } }
    prev = t;
  }
  if (pen) g.stroke();
  if (v.glowOn && H >= 0) {                             // 선단 밝기 — 흰빛 혼합 + 선단 굵기 + 빛점, 나이로 정한다
    const live = AX.glowLive(now - S.lastData), W = AX.glowWidth(P.pw, cap);
    const col = sweep ? (k: number) => k % cap : (k: number) => cap - 1 - (H - k);
    if (live > 0 && W > 0) {
      g.lineCap = 'round';
      for (let age = W; age >= 1; age--) {
        const t1 = H - age + 1, t0 = t1 - 1; if (!S.seen(t0)) continue;
        const c0 = col(t0), c1 = col(t1); if (c1 < c0) continue;
        const u = AX.glowLevel(age - 1, W) * live; if (u <= 0) continue;
        const e = u * u * (3 - 2 * u);
        g.strokeStyle = AX.mixWhite(color, AX.GLOW_MAX * e); g.lineWidth = lw + 1.4 * e;
        g.beginPath(); g.moveTo(x(c0), y(a[t0 % cap])); g.lineTo(x(c1), y(a[t1 % cap])); g.stroke();
      }
      if (S.seen(H)) { g.fillStyle = AX.mixWhite(color, .75 * live); g.beginPath(); g.arc(x(col(H)), y(a[H % cap]), (lw + 1.6) * (.6 + .4 * live), 0, 2 * Math.PI); g.fill(); }
    }
  }
  g.restore();
}

/** 채운 구간(측정값 아님 — lead-off·손실을 브리지가 메운 자리)을 음영으로. */
function shadeBad(g: CanvasRenderingContext2D, P: Rect, S: LiveStream, v: View) {
  const ok = S.okBuf; if (!ok || S.head < 0) return;
  const bad = (i: number) => { const t = AX.absAt(i, S.vh, S.cap, v.play); return S.seen(t) && ok[t % S.cap] < .5; };
  const x = (i: number) => P.l + i / (S.cap - 1) * P.pw; g.fillStyle = '#2b4350';
  for (let i = 0; i < S.cap;) { if (bad(i)) { let j = i; while (j < S.cap && bad(j)) j++; g.fillRect(x(i), P.t, Math.max(1, x(j) - x(i)), P.ph); i = j; } else i++; }
}
function cursorLine(g: CanvasRenderingContext2D, P: Rect, S: LiveStream, v: View) {
  if (v.play !== 'sweep' || S.vh < 0) return;
  const px = P.l + ((S.vh + 1) % S.cap) / (S.cap - 1) * P.pw;
  g.save(); g.strokeStyle = '#bfd8e0'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, P.t); g.lineTo(px, P.b); g.stroke(); g.restore();
}

/** 분리 보기 — 켠 계열마다 한 칸. 이득은 하나. */
export function drawSplit(S: LiveStream, v: View, canvases: Map<string, HTMLCanvasElement>) {
  const ax = S.axesFor([...canvases.keys()], v.amp);
  for (const [name, c] of canvases) {
    if (!c.clientWidth) continue;
    const {g, w, h, dpr} = fit(c), P = plotRect(w, h), a = S.bufs.get(name), q = ax.get(name);
    paintStatic(c, g, w, h, dpr, P, q, S.winS, v.play);
    if (!a || !q) continue;
    shadeBad(g, P, S, v);
    const lg = layerBegin(w, h, dpr); strokeBuf(lg, S, a, P, q, S.color(name), 1.6, v); layerEnd(g, lg, P, dpr, S, v);
    cursorLine(g, P, S, v);
  }
}

/** 겹쳐 보기 — 같은 축·같은 이득, 입력은 옅은 회색(전극 DC만 뺐다), 방법 이름을 직접 붙인다. */
export function drawOverlay(S: LiveStream, v: View, c: HTMLCanvasElement) {
  if (!c.clientWidth) return;
  const {g, w, h, dpr} = fit(c), P = plotRect(w, h);
  const on = S.names().filter(n => n !== 'raw' && !S.hidden.has(n)), raw = !S.hidden.has('raw') && S.bufs.has('raw') ? 'raw' : null;
  const ax = S.axesFor(raw ? [raw, ...on] : on, v.amp);
  paintStatic(c, g, w, h, dpr, P, on.length ? ax.get(on[0]) : raw ? ax.get(raw) : undefined, S.winS, v.play);
  shadeBad(g, P, S, v);
  const lg = layerBegin(w, h, dpr);
  if (raw && ax.has(raw)) strokeBuf(lg, S, S.bufs.get(raw)!, P, ax.get(raw)!, '#8fa3ad', 1.2, v, .55);
  for (const n of on) { const q = ax.get(n); if (q) strokeBuf(lg, S, S.bufs.get(n)!, P, q, S.color(n), 1.6, v, .85); }
  layerEnd(g, lg, P, dpr, S, v);
  g.font = '700 11px ui-monospace,monospace'; g.textAlign = 'right';
  on.forEach((n, k) => { g.fillStyle = S.color(n); g.fillText(n, P.r - 6, P.t + 14 + k * 14); });
  g.textAlign = 'left'; cursorLine(g, P, S, v);
}
