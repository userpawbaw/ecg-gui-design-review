/* D-161 실시간 측정 파형 — 실험실 파형 효과(D-073)를 링 스트립(../waveStrip.ts)으로 옮긴 그리기.
 * 옮긴 것: 심전도 용지 격자(실제 mV · s 단위), 잔광(새 표본 흰빛 → 0.2 s에 식음), 선단 앞 빈칸 · 부드러운 사라짐(지우기 설정 그대로),
 * 3단 축소 번짐 네온, 선단 뒤 빛기둥(세로 스윕 선 대신), 선단 빛점, 얇은 선(1.2 px).
 * 옮기지 않은 것: 출력 − Reference 띠(C) — 실측에는 Reference가 없다(D-157 계약).
 * 「최신 구간 강조」를 끄면 흰빛 · 번짐 · 빛점 · 빛기둥이 꺼지고 세로 스윕 선이 돌아온다. 이전 그리기는 livePlot.ts(?wave=prev). */
import * as AX from './liveAxis';
import {LABEL, type LiveStream} from './liveStream';
import {fit, plotRect, drawFrame, shadeBad, cursorLine, type View, type Axis, type Rect} from './livePlot';
import {paper, BAND_S, ageGradient, createGlow, rgb} from '../labFx';
import {WAVE} from '../waveMode';
// 측정 전용 기준선(?wave=naive): 같은 효과를 실험실 원래 방식(D-073, 매 프레임 전체 경로 · 64단 그라데이션 · 번짐 3단 재생성)으로.
const NAIVE = WAVE === 'naive';
const naiveGlow = createGlow();
import {StripRow, AgeRamps, composeRow, headSprite, type StripTrace} from '../waveStrip';

const BG = 'rgba(10,26,33,.94)';
type Per = {row: StripRow, st: {key: string, bg: HTMLCanvasElement, hot: HTMLCanvasElement}};
const per = new WeakMap<HTMLCanvasElement, Per>();
const ramps = new AgeRamps();
const layer = (() => { const c = document.createElement('canvas'); return {c, g: c.getContext('2d')!}; })();
export const fxStats = {frames: 0, ms: 0, rebuilds: 0, level: 2};
// 실험실(D-073)과 같은 안전장치: 신호가 흐르는 동안 그리기 간격이 26 ms(약 38 fps)를 넘게 이어지면 번짐 단계를 2 → 1 → 0으로 낮추고
// 다시 올리지 않는다(깜빡임 방지). ?labfx= 로 고정.
const FX_PIN = (() => { const v = new URLSearchParams(location.search).get('labfx'); return v === null ? null : Math.max(0, Math.min(2, Number(v) || 0)); })();
const pace = {level: FX_PIN ?? 2, ema: 0, n: 0, last: 0};
function tick(now: number, flowing: boolean) {
  const dt = now - pace.last; pace.last = now;
  if (!flowing || !(dt > 0 && dt < 250)) return;
  pace.ema = pace.n ? pace.ema * .95 + dt * .05 : dt; pace.n++;
  // 2026-11-10 사용자 「실시간 처리 출력 … 주변광이 없으며 … 흐릿」: 칸 3개 + 브리지 + 배경이면 26 ms를 넘기 쉬워 번짐이 0까지 꺼졌다.
  // 실험실과 같은 모습을 우선해 40 ms(25 fps)부터, 1단까지만 낮춘다(번짐은 남는다).
  if (FX_PIN === null && pace.n > 90 && pace.level > 1 && pace.ema > 40) { pace.level--; pace.n = 0; }
  fxStats.level = pace.level;
}
(globalThis as unknown as {__liveStats: typeof fxStats}).__liveStats = fxStats;

/** 2026-11-10 사용자 「모눈종이가 달라서 … 퀄리티가 떨어지는」: 실측 범위가 작으면(±0.04 mV) 0.1 mV 작은 칸이 칸 높이를 넘어 가로선이
 *  사라지고 세로선만 남았다. 작은 칸 간격을 실험실과 비슷한 화면 밀도(약 7 px)가 되는 1 · 2 · 5 × 10ⁿ mV로 고르고, paper()에는
 *  그 간격이 0.1 mV 칸이 되도록 환산한 범위를 넘긴다(축 숫자는 그대로 실제 mV). */
function gridAmp(halfMv: number, halfPx: number) {
  const want = 7 * halfMv / Math.max(1, halfPx), e = Math.pow(10, Math.floor(Math.log10(want))), m = want / e;
  const step = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e;
  return halfMv * .1 / step;
}
function state(c: HTMLCanvasElement): Per {
  let p = per.get(c);
  if (!p) { p = {row: new StripRow(), st: {key: '', bg: document.createElement('canvas'), hot: document.createElement('canvas')}}; per.set(c, p); }
  return p;
}
/** 정적 층: 바탕 · 용지 격자 · 눈금 글자, 그리고 빛기둥용 밝은 용지. 축 · 크기 · 창이 바뀔 때만. */
function paintStatic(c: HTMLCanvasElement, g: CanvasRenderingContext2D, w: number, h: number, dpr: number, P: Rect, ax: Axis | undefined, winS: number, play: AX.Play) {
  const s = state(c).st, key = [w, h, dpr, play, winS, ax ? ax.m.toFixed(5) + ',' + ax.s : '-'].join('|');
  if (s.key !== key) {
    s.key = key;
    const box = {l: P.l, r: P.r, t: P.t + 6, b: P.b - 6};
    for (const [cv, k] of [[s.bg, 1], [s.hot, 4.2]] as const) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); const og = cv.getContext('2d')!; og.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (k === 1) { og.fillStyle = BG; og.fillRect(0, 0, w, h); }
      if (ax) paper(og, box, winS, gridAmp(ax.s, (box.b - box.t) / 2), k);
      if (k === 1) drawFrame(og, P, ax, winS, play, !ax);
    }
  }
  // 정적 층은 캔버스의 CSS 배경으로 한 번만 붙이고, 매 프레임은 지우기만(전체 크기 복사 1회 절약). 기준선(naive)은 실험실처럼 매번 복사.
  if (NAIVE) { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(s.bg, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0); return; }
  if (c.dataset.bgKey !== key) { c.dataset.bgKey = key; c.style.background = `url(${s.bg.toDataURL()}) 0 0 / 100% 100% no-repeat`; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.setTransform(dpr, 0, 0, dpr, 0, 0);
}

type Series = {name: string, color: string, width: number, alpha: number, lit: boolean, glow: boolean};
function drawPanel(S: LiveStream, v: View, c: HTMLCanvasElement, list: Series[], ax: Map<string, Axis>, frameAx: Axis | undefined, k: {white: number, glow: number, dotR: number, dotA: number}, now: number) {
  const {g, w, h, dpr} = fit(c), P = plotRect(w, h);
  paintStatic(c, g, w, h, dpr, P, frameAx, S.winS, v.play);
  if (!list.length || S.vh < 0) return;
  shadeBad(g, P, S, v);
  const cap = S.cap, dx = P.pw / (cap - 1), sweep = v.play === 'sweep', H = S.vh, fs = S.fs;
  const headX = sweep ? P.l + (H % cap) * dx : P.r, liveK = v.glowOn ? AX.glowLive(now - S.lastData) : 0;
  const yOf = (q: Axis, a: Float32Array) => (t: number) => Math.min(P.b + 4, Math.max(P.t - 4, P.t + P.ph / 2 - (a[((t % cap) + cap) % cap] - q.m) / q.s * (P.ph / 2 - 6)));
  const traces: StripTrace[] = [];
  for (const s of list) { const a = S.bufs.get(s.name), q = ax.get(s.name); if (a && q) traces.push({y: yOf(q, a), color: s.color, width: s.width, alpha: s.alpha, lit: s.lit, glow: s.glow, ok: t => S.seen(t)}); }
  const p = state(c), row = p.row;
  if (NAIVE) {   // 기준선: 매 프레임 전부
    const e0 = AX.eraseSpans(cap, v.eraseFrac), span0 = (cap - 1) / fs, gap0 = (v.softEdge ? e0.gap : e0.gap + e0.fade) / fs;
    const ageOf = (x: number) => sweep ? ((((headX - x) / P.pw * span0) % span0) + span0) % span0 : (P.r - x) / P.pw * span0;
    g.save(); g.beginPath(); g.rect(P.l, P.t, P.pw, P.ph); g.clip();
    for (const tr of traces) {
      const pa = new Path2D(); let pen = false;
      for (let i = 0; i < cap; i++) { const t = AX.absAt(i, H, cap, v.play); if (!S.seen(t)) { pen = false; continue; } const x = P.l + i * dx, y = tr.y(t); if (pen) pa.lineTo(x, y); else { pa.moveTo(x, y); pen = true; } }
      const st = ageGradient(g, P.l, P.r, rgb(tr.color.length === 7 ? tr.color : '#8fa3ad'), ageOf, span0, gap0, tr.lit ? k.white : 0, tr.alpha ?? 1);
      if (tr.glow && v.glowOn) naiveGlow(g, {l: P.l, r: P.r, t: P.t, b: P.b}, pa, st, 2, k.glow);
      g.strokeStyle = st; g.lineWidth = tr.width; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(pa);
    }
    g.restore();
    if (liveK > 0 && S.seen(H)) for (const tr of traces.filter(t => t.lit)) { const y = tr.y(H), rg = g.createRadialGradient(headX, y, 0, headX, y, k.dotR);
      rg.addColorStop(0, `rgba(255,255,255,${k.dotA})`); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg; g.fillRect(headX - k.dotR, y - k.dotR, 2 * k.dotR, 2 * k.dotR); g.restore(); }
    if (liveK > 0) { const band = P.pw / S.winS * BAND_S; g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { let x0 = headX - band * (i + 1) / 5; const bw = band / 5; if (x0 + bw < P.l) x0 += P.pw; if (x0 < P.l - 1) continue; g.globalAlpha = (1 - i / 5) * .7 * liveK; g.drawImage(p.st.hot, x0 * dpr, P.t * dpr, bw * dpr, P.ph * dpr, x0, P.t, bw, P.ph); }
      g.restore(); }
    return;
  }
  const key = [w, h, dpr, cap, v.play, ...list.map(s => s.name + ':' + (ax.get(s.name)?.m.toFixed(5)) + ',' + ax.get(s.name)?.s)].join('|');
  row.configure(key, {l: P.l, t: P.t, w: P.pw, h: P.ph, nCols: cap, dx, dpr}, pace.level);
  row.update(H, Math.max(S.first, H - cap + 1), traces);
  // 빛기둥(A): 선단 뒤 BAND_S 동안 밝은 용지 — 세로 스윕 선 대신
  if (liveK > 0) {
    const band = P.pw / S.winS * BAND_S; g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { let x0 = headX - band * (i + 1) / 5; const bw = band / 5; if (x0 + bw < P.l) x0 += P.pw; if (x0 < P.l - 1) continue;
      g.globalAlpha = (1 - i / 5) * .7 * liveK; g.drawImage(p.st.hot, x0 * dpr, P.t * dpr, bw * dpr, P.ph * dpr, x0, P.t, bw, P.ph); }
    g.restore();
  } else cursorLine(g, P, S, v);
  // 지우기 설정 → 나이 램프(스윕: 선단 앞 빈칸 + 사라짐 / 스크롤: 왼쪽 끝 사라짐)
  const e = AX.eraseSpans(cap, v.eraseFrac), span = (cap - 1) / fs;
  ramps.build(span, (v.softEdge ? e.gap : e.gap + e.fade) / fs, v.softEdge ? e.fade / fs : 0);
  row.clearAhead(H, Math.floor(v.softEdge ? e.gap : e.gap + e.fade) - 1);
  g.save(); g.beginPath(); g.rect(P.l, P.t, P.pw, P.ph); g.clip();
  composeRow(g, row, ramps, layer, {sweep, head: H, headX, rightX: P.r, r: P.r, white: k.white, glow: k.glow, level: v.glowOn ? pace.level : 0, liveK, span, gapS: (v.softEdge ? e.gap : e.gap + e.fade) / fs, tailS: (e.gap + e.fade) / fs});
  g.restore();
  // 선단 빛점
  if (liveK > 0 && S.seen(H)) for (const tr of traces.filter(t => t.lit)) {
    const sp = headSprite(k.dotR, k.dotA, dpr), y = tr.y(H);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = liveK; g.drawImage(sp, headX - k.dotR, y - k.dotR, 2 * k.dotR, 2 * k.dotR); g.restore();
  }
  fxStats.rebuilds = row.rebuilds;
}

/** 분리 보기 — 계열마다 한 칸. 입력(raw)은 실험실 입력 행, 나머지는 출력 행의 세기. */
export function drawSplitFx(S: LiveStream, v: View, canvases: Map<string, HTMLCanvasElement>) {
  const t0 = performance.now(), ax = S.axesFor([...canvases.keys()], v.amp);
  tick(t0, t0 - S.lastData < 300);
  for (const [name, c] of canvases) {
    if (!c.clientWidth) continue;
    const raw = name === 'raw', on = v.glowOn;
    drawPanel(S, v, c, [{name, color: S.color(name), width: 1.2, alpha: 1, lit: true, glow: on}], ax, ax.get(name),
      {white: on ? (raw ? .8 : 1.15) : 0, glow: raw ? .35 : .5, dotR: raw ? 11 : 15, dotA: raw ? .4 : .7}, t0);
  }
  fxStats.frames++; fxStats.ms += performance.now() - t0;
}

/** 중첩 표시 — 같은 축 · 같은 이득. 입력은 옅은 회색(밝히지 않음), 기법 출력은 밝힘 · 번짐. */
export function drawOverlayFx(S: LiveStream, v: View, c: HTMLCanvasElement) {
  if (!c.clientWidth) return;
  const t0 = performance.now();
  tick(t0, t0 - S.lastData < 300);
  const on = S.names().filter(n => n !== 'raw' && !S.hidden.has(n)), raw = !S.hidden.has('raw') && S.bufs.has('raw') ? 'raw' : null;
  const ax = S.axesFor(raw ? [raw, ...on] : on, v.amp);
  const list: Series[] = [...(raw ? [{name: raw, color: '#8fa3ad', width: 1.2, alpha: .55, lit: false, glow: false}] : []),
    ...on.map(n => ({name: n, color: S.color(n), width: 1.2, alpha: .85, lit: true, glow: v.glowOn}))];
  drawPanel(S, v, c, list, ax, on.length ? ax.get(on[0]) : raw ? ax.get(raw) : undefined, {white: v.glowOn ? .9 : 0, glow: .35, dotR: 12, dotA: .5}, t0);
  const {g} = {g: c.getContext('2d')!}, P = plotRect(c.clientWidth, c.clientHeight);
  g.font = '600 11px system-ui'; g.textAlign = 'right';
  on.forEach((n, k) => { g.fillStyle = S.color(n); g.fillText(LABEL[n] ?? n, P.r - 6, P.t + 14 + k * 14); });
  g.textAlign = 'left';
  fxStats.frames++; fxStats.ms += performance.now() - t0;
}
