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
import {createFocus, setPointer, pick, cycle, step, emphasis, togglePin, roughness, tierOf, type Focus} from './overlayFocus';
export {roughness, tierOf};

const BG = 'rgba(10,26,33,.94)';
type Per = {row: StripRow, rows: Map<string, StripRow>, st: {key: string, bg: HTMLCanvasElement, hot: HTMLCanvasElement}};
/** D-184: 겹치기에서 계열마다 따로 합성할 묶음(링은 그대로, 합성 때 불투명도 · 번짐 · 흰빛 배율만). */
export type Group = {id: string, names: string[], alphaK: number, glowK: number, whiteK: number};
export type PanelGeom = {P: Rect, dx: number, H: number, cap: number, sweep: boolean, headX: number, ys: Map<string, (t: number) => number>};
const per = new WeakMap<HTMLCanvasElement, Per>();
const ramps = new AgeRamps();
const layer = (() => { const c = document.createElement('canvas'); return {c, g: c.getContext('2d')!}; })();
export const fxStats = {frames: 0, ms: 0, rebuilds: 0, level: 2};
// 실험실(D-073)과 같은 안전장치: 신호가 흐르는 동안 그리기 간격이 26 ms(약 38 fps)를 넘게 이어지면 번짐 단계를 2 → 1 → 0으로 낮추고
// 다시 올리지 않는다(깜빡임 방지). ?labfx= 로 고정.
// D-177: 링 스트립에서는 단계 1과 2의 그리기 비용이 같아(실험실 측정) 기본은 단계 2 고정, ?labfx=auto 일 때만 낮춘다.
const FX_PIN = (() => { const v = new URLSearchParams(location.search).get('labfx'); return v === 'auto' ? null : v === null ? 2 : Math.max(0, Math.min(2, Number(v) || 0)); })();
const pace = {level: FX_PIN ?? 2, ema: 0, n: 0, last: 0};
const LIVE_W = Number(new URLSearchParams(location.search).get('livew')) || 1.7;
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
  if (!p) { p = {row: new StripRow(), rows: new Map(), st: {key: '', bg: document.createElement('canvas'), hot: document.createElement('canvas')}}; per.set(c, p); }
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

type Series = {name: string, color: string, width: number, alpha: number, lit: boolean, glow: boolean, casing?: boolean};
const CASING = '#0a1a21';   // D-183 테두리: 겹치기 칸 배경색
function drawPanel(S: LiveStream, v: View, c: HTMLCanvasElement, list: Series[], ax: Map<string, Axis>, frameAx: Axis | undefined, k: {white: number, glow: number, dotR: number, dotA: number}, now: number, groups?: Group[]): PanelGeom | null {
  const {g, w, h, dpr} = fit(c), P = plotRect(w, h);
  paintStatic(c, g, w, h, dpr, P, frameAx, S.winS, v.play);
  if (!list.length || S.vh < 0) return null;
  shadeBad(g, P, S, v);
  const cap = S.cap, dx = P.pw / (cap - 1), sweep = v.play === 'sweep', H = S.vh, fs = S.fs;
  const headX = sweep ? P.l + (H % cap) * dx : P.r - S.vhFrac * dx, liveK = v.glowOn ? AX.glowLive(now - S.lastData) : 0;
  const yOf = (q: Axis, a: Float32Array) => (t: number) => Math.min(P.b + 4, Math.max(P.t - 4, P.t + P.ph / 2 - (a[((t % cap) + cap) % cap] - q.m) / q.s * (P.ph / 2 - 6)));
  const traces: StripTrace[] = [], dots: StripTrace[] = [], ys = new Map<string, (t: number) => number>(), byName = new Map<string, {tr: StripTrace[], dot?: StripTrace}>();
  for (const s of list) { const a = S.bufs.get(s.name), q = ax.get(s.name); if (!a || !q) continue;
    const y = yOf(q, a), mine: StripTrace[] = []; ys.set(s.name, y);
    if (s.casing) mine.push({y, color: CASING, width: s.width + 3.4, alpha: .92, lit: s.lit, glow: false, ok: t => S.seen(t)});   // D-183: 밑에 깔린 거친 선을 끊어 낸다
    const tr: StripTrace = {y, color: s.color, width: s.width, alpha: s.alpha, lit: s.lit, glow: s.glow, ok: t => S.seen(t)}; mine.push(tr); traces.push(...mine); if (s.lit) dots.push(tr);
    byName.set(s.name, {tr: mine, dot: s.lit ? tr : undefined}); }
  const geom: PanelGeom = {P, dx: P.pw / (S.cap - 1), H: S.vh, cap: S.cap, sweep: v.play === 'sweep', headX: 0, ys};
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
    if (liveK > 0 && S.seen(H)) for (const tr of dots) { const y = tr.y(H), rg = g.createRadialGradient(headX, y, 0, headX, y, k.dotR);
      rg.addColorStop(0, `rgba(255,255,255,${k.dotA})`); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg; g.fillRect(headX - k.dotR, y - k.dotR, 2 * k.dotR, 2 * k.dotR); g.restore(); }
    if (liveK > 0) { const band = P.pw / S.winS * BAND_S; g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { let x0 = headX - band * (i + 1) / 5; const bw = band / 5; if (x0 + bw < P.l) x0 += P.pw; if (x0 < P.l - 1) continue; g.globalAlpha = (1 - i / 5) * .7 * liveK; g.drawImage(p.st.hot, x0 * dpr, P.t * dpr, bw * dpr, P.ph * dpr, x0, P.t, bw, P.ph); }
      g.restore(); }
    geom.headX = headX; return geom;
  }
  geom.headX = headX;
  const gs: (Group & {row: StripRow, tr: StripTrace[], dots: StripTrace[], series: Series[]})[] = (groups ?? [{id: 'all', names: list.map(x => x.name), alphaK: 1, glowK: 1, whiteK: 1}]).map(gr => {
    const ser = list.filter(x => gr.names.includes(x.name)), r = gr.id === 'all' ? row : (p.rows.get(gr.id) ?? (p.rows.set(gr.id, new StripRow()), p.rows.get(gr.id)!));
    return {...gr, row: r, series: ser, tr: ser.flatMap(x => byName.get(x.name)?.tr ?? []), dots: ser.map(x => byName.get(x.name)?.dot).filter((d): d is StripTrace => !!d)};
  });
  for (const id of [...p.rows.keys()]) if (!gs.some(x => x.id === id)) p.rows.delete(id);
  const key0 = [w, h, dpr, cap, v.play, ].join('|');
  for (const gr of gs) { const kk = key0 + '|' + gr.series.map(x => x.name + ':' + (ax.get(x.name)?.m.toFixed(5)) + ',' + ax.get(x.name)?.s + ',' + [x.width, x.alpha, x.lit, x.glow, !!x.casing].join(',')).join('|');
    gr.row.configure(kk, {l: P.l, t: P.t, w: P.pw, h: P.ph, nCols: cap, dx, dpr}, pace.level); gr.row.update(H, Math.max(S.first, H - cap + 1), gr.tr); }
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
  g.save(); g.beginPath(); g.rect(P.l, P.t, P.pw, P.ph); g.clip();
  for (const gr of gs) { gr.row.clearAhead(H, Math.floor(v.softEdge ? e.gap : e.gap + e.fade) - 1);
    composeRow(g, gr.row, ramps, layer, {sweep, head: H, headX, rightX: sweep ? P.r : headX, r: P.r, white: k.white * gr.whiteK, glow: k.glow * gr.glowK, level: v.glowOn ? pace.level : 0, liveK, span, gapS: (v.softEdge ? e.gap : e.gap + e.fade) / fs, tailS: (e.gap + e.fade) / fs, alphaK: gr.alphaK}); }
  g.restore();
  // 선단 빛점
  if (liveK > 0 && S.seen(H)) for (const gr of gs) for (const tr of gr.dots) {
    const sp = headSprite(k.dotR, k.dotA, dpr), y = tr.y(H);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, liveK * gr.alphaK * Math.min(1.25, gr.whiteK)); g.drawImage(sp, headX - k.dotR, y - k.dotR, 2 * k.dotR, 2 * k.dotR); g.restore();
  }
  fxStats.rebuilds = gs.reduce((a, gr) => a + gr.row.rebuilds, 0);
  return geom;
}

/** 분리 보기 — 계열마다 한 칸. 입력(raw)은 실험실 입력 행, 나머지는 출력 행의 세기. */
export function drawSplitFx(S: LiveStream, v: View, canvases: Map<string, HTMLCanvasElement>) {
  const t0 = performance.now(), ax = S.axesFor([...canvases.keys()], v.amp);
  tick(t0, t0 - S.lastData < 300);
  for (const [name, c] of canvases) {
    if (!c.clientWidth) continue;
    const raw = name === 'raw', on = v.glowOn;
    // 2026-11-11 (사용자: 실시간 파형이 실험실보다 어둡고 흐림 — 측정: 선 중심 밝기 145 vs 171, 빛 폭 3 vs 5 px): 실험실 기법 행은 회색
    // Reference(1.8 px) 위에 겹쳐 그려 굵어 보인다. 실시간에는 Reference 가 없으므로 선을 LIVE_W 로 굵게, 빛 · 머리는 실험실 값(.55 · 16 · .75)
    drawPanel(S, v, c, [{name, color: S.color(name), width: raw ? 1.2 : LIVE_W, alpha: 1, lit: true, glow: on}], ax, ax.get(name),
      {white: on ? (raw ? .8 : 1.15) : 0, glow: raw ? .35 : .55, dotR: raw ? 11 : 16, dotA: raw ? .4 : .75}, t0);
  }
  fxStats.frames++; fxStats.ms += performance.now() - t0;
}

/** 중첩 표시 — 같은 축 · 같은 이득. 입력은 옅은 회색(밝히지 않음), 기법 출력은 밝힘 · 번짐. */
// D-183 겹치기 가시성(사용자 2026-11-13 「노이즈가 많은 기법에 비해 깨끗한 신호는 가시성이 매우 떨어져」):
// 보이는 구간의 거칠기(2차 차분 절댓값 중앙값)를 입력 신호의 거칠기와 비교해 세 단계로 나눈다 — 입력 대비 0.3배 미만 = 깨끗,
// 0.6배 미만 = 중간, 그 이상 = 거침(재생 d1 0 dB 실측: 공통 전처리 · M01 0.86–0.96, M04 · M05S · M06 0.03–0.16). 처음 안은 가장
// 매끄러운 계열 대비였는데, 1등만 남고 충분히 깨끗한 계열(M04)까지 흐려져 버렸다(자체 검토). 모두 거칠면 아무것도 흐리게 하지 않는다. 거친 계열은 아래층(빛 번짐 · 선단 빛점 없음)에 얇고 흐리게, 깨끗한 계열은 위층에 굵게 + 배경색
// 테두리로 그린다. 꼭짓점 · 진폭 · 축은 그대로(가시성만). 단계는 0.25 s마다 재고, 바뀐 단계가 1 s 이어질 때만 바꾼다(깜빡임 방지).
// ?overlaytier=0 이면 이전 그리기(모두 같은 무게).
// ?overlayfocus=0 이면 마우스 강조 끔(D-184)
const FOCUS_ON = typeof location === 'undefined' || new URLSearchParams(location.search).get('overlayfocus') !== '0';
const OV_DBG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('ovdbg');
const TIER_ON = typeof location === 'undefined' || new URLSearchParams(location.search).get('overlaytier') !== '0';
const TIER_STYLE = [{width: 1.6, alpha: 1, lit: true, glow: true, casing: true}, {width: 1.2, alpha: .62, lit: false, glow: false, casing: false}, {width: 1.0, alpha: .4, lit: false, glow: false, casing: false}];
const tiers = new Map<string, {tier: number, want: number, since: number}>(); let tierAt = 0;
function updateTiers(S: LiveStream, on: string[], now: number) {
  if (now - tierAt < 250) return; tierAt = now;
  const lo = Math.max(S.first, S.vh - S.cap + 1), r = on.map(n => roughness(S.bufs.get(n)!, S.cap, lo, S.vh));
  const ref = S.bufs.has('raw') ? roughness(S.bufs.get('raw')!, S.cap, lo, S.vh) : Math.max(...r);
  let want0 = r.map(x => ref > 0 && x > 0 ? tierOf(x / ref) : 0); if (!want0.includes(0)) want0 = want0.map(() => 0);   // 모두 거칠면 같은 무게
  on.forEach((n, i) => { const want = want0[i], st = tiers.get(n);
    if (!st) { tiers.set(n, {tier: want, want, since: now}); return; }
    if (want !== st.want) { st.want = want; st.since = now; } else if (want !== st.tier && now - st.since > 1000) st.tier = want; });
}
// D-184 겹치기 강조: 계열마다 링 한 줄(최대 밝기로 구움) + 합성 배율. 마우스 판정은 지난 프레임의 기하로.
const focusOf = new WeakMap<HTMLCanvasElement, {f: Focus, geom: PanelGeom | null, labels: {name: string, x0: number, x1: number, y0: number, y1: number}[], moving: boolean}>();
const fstate = (c: HTMLCanvasElement) => { let o = focusOf.get(c); if (!o) { o = {f: createFocus(), geom: null, labels: [], moving: false}; focusOf.set(c, o); } return o; };
/** 겹치기 캔버스 위 마우스(CSS px, 캔버스 기준). 벗어나면 null. */
export function overlayPointer(c: HTMLCanvasElement, x: number | null, y: number | null) { setPointer(fstate(c).f, x, y); }
/** 강조 애니메이션이 진행 중이거나 마우스가 올라 있으면 true — 스트림이 멈춰도 다시 그리게. */
/** D-185 범례 단추: 가리킨 계열(null = 없음) · 고정 토글 · 단추에 쓸 상태(고정 목록 · 단계). */
export function overlayChip(c: HTMLCanvasElement, n: string | null) { fstate(c).f.chip = n; }
/** D-185 클릭: 다음 그림에서 마우스 아래 선들을 앞쪽부터 돌아 강조를 바꾼다(overlayFocus.cycle). */
export function overlayClick(c: HTMLCanvasElement, x: number, y: number) { fstate(c).f.click = {x, y}; }
export function overlayTogglePin(c: HTMLCanvasElement, n: string) { return togglePin(fstate(c).f, n); }
export function overlayInfo(c: HTMLCanvasElement) { return {pinned: [...fstate(c).f.pinned], tier: (n: string) => TIER_ON ? tiers.get(n)?.tier ?? 0 : 0}; }
export function overlayBusy(c: HTMLCanvasElement) { const o = focusOf.get(c); return !!o && (o.moving || o.f.px !== null || o.f.chip !== null); }
/** 마우스에서 각 계열 선까지 거리(px) — 커서 열 주변 ±4 표본의 선분 거리. */
function hitDistances(S: LiveStream, geom: PanelGeom, px: number, py: number, names: string[]) {
  const {P, dx, H, cap, sweep, headX, ys} = geom; if (px < P.l || px > P.r || py < P.t - 8 || py > P.b + 8) return [];
  const xOf = (t: number) => sweep ? P.l + (((t % cap) + cap) % cap) * dx : headX - (H - t) * dx;
  const tc = sweep ? AX.absAt(Math.max(0, Math.min(cap - 1, Math.round((px - P.l) / dx))), H, cap, 'sweep') : Math.round(H - (headX - px) / dx);
  const out: {name: string, dist: number}[] = [];
  for (const n of names) { const y = ys.get(n); if (!y) continue; let best = Infinity;
    for (let t = tc - 4; t < tc + 4; t++) { if (!S.seen(t) || !S.seen(t + 1)) continue; const x0 = xOf(t), x1 = xOf(t + 1); if (x1 < x0) continue;
      const y0 = y(t), y1 = y(t + 1), vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy, u = L > 0 ? Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / L)) : 0;
      best = Math.min(best, Math.hypot(px - (x0 + u * vx), py - (y0 + u * vy))); }
    if (best < Infinity) out.push({name: n, dist: best}); }
  return out;
}
export function drawOverlayFx(S: LiveStream, v: View, c: HTMLCanvasElement) {
  if (!c.clientWidth) return;
  const t0 = performance.now();
  tick(t0, t0 - S.lastData < 300);
  const on = S.names().filter(n => n !== 'raw' && !S.hidden.has(n)), raw = !S.hidden.has('raw') && S.bufs.has('raw') ? 'raw' : null;
  const ax = S.axesFor(raw ? [raw, ...on] : on, v.amp);
  if (TIER_ON && S.vh >= 0) updateTiers(S, on, t0);
  const tierOfN = (n: string) => TIER_ON ? tiers.get(n)?.tier ?? 0 : -1;
  const all = [...(raw ? [raw] : []), ...on];
  // 그리는 순서(아래 → 위): 입력 → 거친 것 → 중간 → 깨끗한 것. (2026-11-13 고침: 이전 식은 입력에 10을 줘 입력이 맨 위에 그려졌다)
  const baseRank = (n: string) => n === 'raw' ? 0 : 5 - Math.max(0, tierOfN(n)), front = new Map(all.map(n => [n, baseRank(n)]));
  // 강조 대상: 범례 글자 위면 그 계열, 아니면 파형까지 거리(지난 프레임 기하)
  const fo = fstate(c), F = fo.f; let hit: string | null = null;
  if (FOCUS_ON && F.click && fo.geom) { cycle(F, hitDistances(S, fo.geom, F.click.x, F.click.y, all), front, F.click.x, F.click.y); F.click = undefined; }
  if (FOCUS_ON && F.px !== null && F.py !== null) {
    const lab = fo.labels.find(r => F.px! >= r.x0 && F.px! <= r.x1 && F.py! >= r.y0 && F.py! <= r.y1);
    const dd = fo.geom ? hitDistances(S, fo.geom, F.px, F.py, all) : [];
    hit = lab ? lab.name : fo.geom ? pick(dd, F.target, front) : null;
    if (OV_DBG) (globalThis as unknown as {__ovDbg: unknown}).__ovDbg = {px: F.px, py: F.py, dd, hit};   // ?ovdbg=1: 시험이 파형 위치 · 고른 계열을 읽는다
  }
  fo.moving = FOCUS_ON && step(F, t0, all, hit);
  c.style.cursor = F.target && F.px !== null ? 'pointer' : ''; c.dataset.focus = F.target ?? '';
  // 굽는 모양(단계 굵기 · 테두리)은 정적, 불투명도 · 번짐 · 흰빛은 합성 배율(D-183 단계 값 × D-184 강조)
  const base = (n: string) => { if (n === 'raw') return {a: .55, g: 0, w: 0}; const t = tierOfN(n); return t < 0 ? {a: .85, g: 1, w: 1} : {a: TIER_STYLE[t].alpha, g: TIER_STYLE[t].glow ? 1 : 0, w: t === 0 ? 1 : 0}; };
  const ser = (n: string): Series => { if (n === 'raw') return {name: n, color: '#8fa3ad', width: 1.2, alpha: 1, lit: true, glow: v.glowOn};
    const t = tierOfN(n); return {name: n, color: S.color(n), width: t < 0 ? 1.2 : TIER_STYLE[t].width, alpha: 1, lit: true, glow: v.glowOn, casing: t === 0}; };
  // 아래부터: 입력 → 거친 것 → 깨끗한 것, 강조가 절반을 넘은 계열은 맨 위
  const rank = (n: string) => baseRank(n) + ((F.e.get(n) ?? 0) > .5 ? 100 : 0);
  const ordered = [...all].sort((a, b) => rank(a) - rank(b));
  const groups: Group[] = ordered.map(n => { const em = FOCUS_ON ? emphasis(F, n, base(n)) : {alphaK: base(n).a, glowK: base(n).g, whiteK: base(n).w};
    return {id: n, names: [n], alphaK: em.alphaK, glowK: em.glowK, whiteK: em.whiteK}; });
  fo.geom = drawPanel(S, v, c, ordered.map(ser), ax, on.length ? ax.get(on[0]) : raw ? ax.get(raw) : undefined, {white: v.glowOn ? .9 : 0, glow: .35, dotR: 12, dotA: .5}, t0, groups);
  fo.labels = [];   // D-185: 범례는 캔버스 위 단추(OverlayChips)로 — 캔버스 글자는 그리지 않는다
  fxStats.frames++; fxStats.ms += performance.now() - t0;
}
