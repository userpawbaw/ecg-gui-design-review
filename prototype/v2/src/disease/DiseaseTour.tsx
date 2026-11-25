/* D-192 질환 특징 투어 — 실험실 Plot 캔버스 위 DOM/SVG 한 층.
 * 재생 → (감속) 정지 → 어둡게 + 초점(+ 흐림) · 카드 · 측정 표식 · 정상 유령 → 해제 → (가속) 재생 → 다음 특징.
 * 매 프레임 값은 React 상태가 아니라 이 층의 DOM 속성으로 바꾼다(재생 중 Plot은 그대로). 시각 → 화면 좌표는 Plot이 내준 기하(PlotGeom)로 계산.
 * 연출 하나하나를 옵션으로 끌 수 있다(사용자 2026-11-24 「옵션으로 하나씩 확인」). */
import React, {useEffect, useRef} from 'react';
import type {Transport, Mode} from '../engine';
import type {PlotGeom} from '../Plot';
import {stepView, focusOf, type NormalRow, type Tour, type Step, type Region, type Caliper} from './tour';

export type TourOpts = {decel: boolean, dof: boolean, move: boolean, ghost: boolean, caliper: boolean, glass: boolean, progress: boolean, recap: boolean, zoom: boolean, minimap: boolean};
export const TOUR_OPT_LABELS: [keyof TourOpts, string, string][] = [
  ['decel', '감속 정지 · 가속 재개', 'A1'], ['dof', '초점 밖 흐림', 'A2'], ['move', '같은 화면 안 초점 이동', 'A3'], ['ghost', '정상 유령 투영', 'A4'],
  ['caliper', '측정선 그리기', 'A5'], ['glass', '유리 카드', 'A6'], ['progress', '왼쪽 제목 진행선', 'A7'], ['recap', '끝 요약 표식', 'A8'], ['zoom', '특징별 구간 확대 · 축소', 'A9'], ['minimap', '확대 중 개관 띠', 'A10']];
export const TOUR_DEFAULT: TourOpts = {decel: true, dof: true, move: true, ghost: true, caliper: true, glass: true, progress: true, recap: true, zoom: true, minimap: true};
export type TourApi = {start: (k?: number) => void, stop: () => void, running: () => boolean, done: () => boolean};
export type TourStatus = {k: number, hold: boolean, holdS: number, seq: number} | null;

type Phase = 'idle' | 'run' | 'decel' | 'in' | 'hold' | 'move' | 'out' | 'accel';
const DUR: Record<Phase, number> = {idle: 0, run: 0, decel: .5, in: .6, hold: 4, move: .7, out: .6, accel: .4};
const clamp = (v: number) => Math.max(0, Math.min(1, v)), ease = (u: number) => u * u * (3 - 2 * u);
const NO_MOVE_GAP = .5;   // 초점 이동을 끄면 같은 화면 특징 사이 재생(초) — 다음 박동이 들어오기 전

type View = {span: number, right: number, phase: number};
const ZOOM_S = .8, GRID_MAJOR = .2;

export function DiseaseTour({tour, normal, transport, geom, viewRef, redraw, opts, reduced, setMode, getMode, setSpan, getSpan, beginPlay, onStatus, apiRef}: {
  tour: Tour, normal: NormalRow, transport: Transport, geom: {current: PlotGeom | null}, viewRef: {current: View | null}, redraw: {current: (() => void) | null}, opts: TourOpts, reduced: boolean,
  setMode: (m: Mode) => void, getMode: () => Mode, setSpan: (s: number) => void, getSpan: () => number, beginPlay: (t: number) => void, onStatus: (s: TourStatus) => void, apiRef: {current: TourApi | null}}) {
  const root = useRef<HTMLDivElement>(null), zoomEl = useRef<HTMLDivElement>(null), dim = useRef<HTMLDivElement>(null), dof = useRef<HTMLDivElement>(null), card = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null);
  const live = useRef({opts, reduced, onStatus});live.current = {opts, reduced, onStatus};
  useEffect(() => {
    const S = {phase: 'idle' as Phase, k: 0, from: -1, ph0: 0, clock: 0, last: 0, lastTime: transport.time, d0: 0, stopAt: 0, prevMode: 'sweep' as Mode, prevSpan: 0, userSpeed: 1, done: false, seen: new Set<number>(), seq: 0,
      view: null as View | null, zoom: null as null | {from: View, to: View, c: number, t0: number, dur: number, L0: number, L1: number}, pdur: 0};
    const steps = tour.steps, base = () => tour.span ?? getSpan();
    // ---- D-194 구간 확대 · 축소: 멈춘 동안만, 특징 중심이 화면에서 곧게 움직이도록(구간은 log 보간), 격자 위상은 시작 · 끝 모두 왼쪽 기준이 되게 반 칸 안에서 보간 ----
    const setView = (v: View | null) => { S.view = v; viewRef.current = v; redraw.current?.(); };
    const nowView = (): View => S.view ?? {span: base(), right: transport.time, phase: 0};
    const zoomTo = (to: View, c: number) => { const from = nowView(); if (Math.abs(from.span - to.span) < 1e-3 && Math.abs(from.right - to.right) < 1e-3) { S.zoom = null; return; }
      const L0 = from.right - from.span - from.phase, L1r = to.right - to.span, L1 = L1r - GRID_MAJOR * Math.round((L1r - L0) / GRID_MAJOR);
      S.zoom = {from, to, c, t0: S.clock, dur: live.current.reduced ? .001 : ZOOM_S, L0, L1}; };
    const zoomStep = () => { const z = S.zoom; if (!z) return; const u = clamp((S.clock - z.t0) / z.dur), e = ease(u);
      const span = Math.exp(Math.log(z.from.span) + (Math.log(z.to.span) - Math.log(z.from.span)) * e);
      const f0 = (z.c - (z.from.right - z.from.span)) / z.from.span, f1 = (z.c - (z.to.right - z.to.span)) / z.to.span, f = f0 + (f1 - f0) * e;
      const right = Math.min(transport.time, z.c + (1 - f) * span), gridT = z.L0 + (z.L1 - z.L0) * e;
      const ph = (((gridT - (right - span)) % GRID_MAJOR) + GRID_MAJOR) % GRID_MAJOR;
      if (u >= 1) { S.zoom = null; const done = Math.abs(z.to.span - base()) < 1e-3 && Math.abs(z.to.right - transport.time) < 1e-3; setView(done ? null : {...z.to, phase: 0}); }
      else setView({span, right, phase: ph}); };
    const stepTarget = (k: number): View | null => { if (!live.current.opts.zoom) return null; const v = stepView(steps[k], base()); return Math.abs(v.span - base()) < 1e-3 ? null : {...v, phase: 0}; };
    const beginStepZoom = (k: number) => { const t = stepTarget(k); if (t) zoomTo(t, focusOf(steps[k]).c); else if (S.view) zoomTo({span: base(), right: transport.time, phase: 0}, focusOf(steps[k]).c); else S.zoom = null; };
    const stopOf = (k: number): number => !live.current.opts.move && k > 0 && Math.abs(steps[k].stop - steps[k - 1].stop) < 1e-6 ? stopOf(k - 1) + NO_MOVE_GAP : steps[k].stop;
    const status = () => live.current.onStatus(S.phase === 'idle' ? null : {k: S.k, hold: S.phase === 'hold', holdS: holdS(S.k), seq: S.seq});
    const holdS = (k: number) => (k === 0 ? 4.5 : DUR.hold);
    const go = (ph: Phase) => { S.phase = ph; S.ph0 = S.clock;
      if (ph === 'in') { beginStepZoom(S.k); S.pdur = (S.zoom ? S.zoom.dur : .2) + .5; }
      else if (ph === 'move') { beginStepZoom(S.k); S.pdur = S.zoom ? S.zoom.dur + .45 : DUR.move; }
      else if (ph === 'out') { if (S.view) zoomTo({span: base(), right: transport.time, phase: 0}, focusOf(steps[S.k]).c); else S.zoom = null; S.pdur = S.zoom ? Math.max(DUR.out, S.zoom.dur) : DUR.out; }
      else S.pdur = 0; if (ph === 'hold') S.seq++; if (ph === 'hold' || ph === 'in' || ph === 'idle' || ph === 'run') status(); };
    const finish = (restore: boolean) => { transport.speed = S.userSpeed; S.zoom = null; if (S.view) setView(null); if (restore && S.phase !== 'idle') { setMode(S.prevMode); if (S.prevSpan && S.prevSpan !== getSpan()) setSpan(S.prevSpan); } S.phase = 'idle'; status(); };
    apiRef.current = {
      start: (k = 0) => { if (S.phase === 'idle') { S.prevMode = getMode(); S.prevSpan = getSpan(); S.userSpeed = transport.speed || 1; }
        if (tour.span && tour.span !== getSpan()) setSpan(tour.span);   // 긴 휴지처럼 5 s 화면에 안 들어오는 특징
        S.k = k; S.from = -1; S.done = false; if (k === 0) S.seen.clear(); transport.speed = S.userSpeed; setMode('scroll');
        const t0 = k === 0 ? tour.start : Math.max(0, stopOf(k) - 2.2); S.lastTime = t0; beginPlay(t0); go('run'); },
      stop: () => finish(true), running: () => S.phase !== 'idle', done: () => S.done};
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = S.last ? Math.min(.1, (now - S.last) / 1000) : 0; S.last = now;
      const o = live.current.opts, red = live.current.reduced;
      if (S.phase !== 'idle') {
        // 사용자가 탐색 막대 · 처음으로 등으로 시각을 옮기면 투어를 끝낸다(재생 흐름이 깨짐)
        if (Math.abs(transport.time - S.lastTime) > .35 + dt * 2) finish(true);
        else if (transport.playing) {
          S.clock += dt; zoomStep(); const dur = S.phase === 'hold' ? holdS(S.k) : S.pdur || DUR[S.phase] * (red ? .4 : 1), u = dur ? (S.clock - S.ph0) / dur : 0;
          if (S.phase === 'run') { const st = stopOf(S.k);
            if (o.decel && !red && transport.time >= st - .25) { S.d0 = transport.time; S.stopAt = st; transport.speed = 0; go('decel'); }
            else if (transport.time >= st) { transport.time = st; transport.speed = 0; go('in'); } }
          else if (S.phase === 'decel') { const e = 1 - (1 - clamp(u)) ** 2; transport.time = S.d0 + (S.stopAt - S.d0) * e; if (u >= 1) go('in'); }
          else if (S.phase === 'in' && u >= 1) go('hold');
          else if (S.phase === 'hold' && u >= 1) { S.seen.add(S.k);
            if (S.k + 1 < steps.length && o.move && Math.abs(steps[S.k + 1].stop - steps[S.k].stop) < 1e-6) { S.from = S.k; S.k++; go('move'); } else go('out'); }
          else if (S.phase === 'move' && u >= 1) { S.from = -1; go('hold'); }
          else if (S.phase === 'out' && u >= 1) { S.from = -1; S.zoom = null; if (S.view) setView(null);
            if (S.k + 1 < steps.length) { S.k++; if (o.decel && !red) go('accel'); else { transport.speed = S.userSpeed; go('run'); } }
            else { S.done = true; finish(true); } }
          else if (S.phase === 'accel') { transport.speed = S.userSpeed * clamp(u) ** 2; if (u >= 1) { transport.speed = S.userSpeed; go('run'); } }
        }
      }
      S.lastTime = transport.time;
      paint(S, o, red);
    };
    // ---- 그리기 ----
    let lastMask = '', lastCard = '', lastSvg = '';
    const paint = (st: typeof S, o: TourOpts, red: boolean) => {
      const g0 = geom.current, el = root.current; if (!g0 || !el) return;
      const g = st.view ? {...g0, span: st.view.span, t: st.view.right, mode: 'scroll' as Mode, inspect: false} : g0;   // 덧층은 투어 자신의 구간 값으로(그래프와 같은 프레임)
      const count = Math.round(g.span * g.fs);
      const xOf = (T: number) => { const i = T * g.fs, t = g.t * g.fs;
        if (g.inspect) { const end = Math.round(t), s0 = Math.max(0, end - count), w = Math.max(1, Math.min(count, end)); return g.left + (i - s0) / w * g.pw; }
        if (g.mode === 'scroll') return g.left + (i - (t + 1 - count)) / count * g.pw;
        return t - i >= 0 && t - i < count ? g.left + ((Math.floor(i) % count) / count) * g.pw : NaN; };
      const box = (id: string) => g.rows.find(r => r.id === id);
      const yOf = (id: string, v: number) => { const b = box(id)!; const ph = b.b - b.t; return b.t + ph / 2 - v / g.amplitude * ph / 2; };
      const u = (d: number) => clamp((st.clock - st.ph0) / d);
      const k = st.k, ph = st.phase, D = (p: Phase) => DUR[p] * (red ? .4 : 1);
      // 투명도: 어둡게 · 카드 · 표식 · 유령
      let dimA = 0, cardA = 0, drawK = 0, ghostK = 0, oldA = 0, mix = 1;
      const lead = Math.max(0, (st.pdur || .7) - .5);   // 확대가 있으면 확대가 끝난 뒤 글자 · 측정선
      if (ph === 'in') { dimA = ease(u(D('in'))); cardA = ease(clamp((st.clock - st.ph0 - lead) / .5)); drawK = ghostK = cardA; }
      else if (ph === 'hold') { dimA = cardA = drawK = ghostK = 1; }
      else if (ph === 'move') { const T0 = st.clock - st.ph0, md = st.pdur || D('move'), zl = Math.max(.35, md - .35); dimA = 1; mix = ease(clamp(T0 / zl)); oldA = 1 - clamp(T0 / .3); cardA = ease(clamp((T0 - zl) / .35)); drawK = ghostK = cardA; }
      else if (ph === 'out') { const m = u(st.pdur || D('out')); dimA = 1 - ease(m); cardA = 1 - clamp(m * 1.6); drawK = ghostK = cardA; }
      const cur = tour.steps[k], prev = st.from >= 0 ? tour.steps[st.from] : null;
      // 초점 타원(행마다 하나) — 이동 중에는 앞 단계 모양에서 보간
      const ell = (r: Region) => { const b = box(r.row); if (!b) return null; const x0 = xOf(r.t0), x1 = xOf(r.t1); if (!Number.isFinite(x0) || !Number.isFinite(x1)) return null;
        return {cx: (x0 + x1) / 2, cy: (b.t + b.b) / 2, rx: Math.max(26, (x1 - x0) / 2) * 1.32 + 10, ry: (b.b - b.t) * .62}; };
      const es = cur.regions.map((r, i) => { const a = ell(r); const p = prev ? ell(prev.regions[i]) : null; if (!a) return null; if (!p || ph !== 'move') return a;
        return {cx: p.cx + (a.cx - p.cx) * mix, cy: p.cy + (a.cy - p.cy) * mix, rx: p.rx + (a.rx - p.rx) * mix, ry: p.ry + (a.ry - p.ry) * mix}; }).filter(Boolean) as {cx: number, cy: number, rx: number, ry: number}[];
      const mask = dimA > .001 && es.length ? es.map(e => `radial-gradient(ellipse ${e.rx.toFixed(1)}px ${e.ry.toFixed(1)}px at ${e.cx.toFixed(1)}px ${e.cy.toFixed(1)}px,transparent 0,transparent 58%,#000 100%)`).join(',') : '';
      const mkey = mask + '|' + dimA.toFixed(3) + o.dof;
      if (mkey !== lastMask) { lastMask = mkey;
        for (const [d, on] of [[dim.current!, true], [dof.current!, o.dof && !red]] as const) {
          d.style.opacity = on ? String(dimA) : '0'; d.style.visibility = on && dimA > .001 ? 'visible' : 'hidden';
          d.style.maskImage = mask || 'none'; (d.style as unknown as Record<string, string>).webkitMaskImage = mask || 'none'; } }
      // 카드: 초점 묶음 왼쪽(공간 없으면 오른쪽), 두 행 경계 높이
      const c = card.current!; const show = (ph === 'in' || ph === 'hold' || ph === 'move' || ph === 'out') && es.length > 0;
      let cardBox: {x: number, y: number, w: number, h: number} | null = null;
      if (show) {
        // 카드 자리: 후보(초점 왼쪽 · 오른쪽 × 가운데 · 위 · 아래, 그래프 왼쪽 끝) 중 초점 타원 · 측정 표식과 가장 덜 겹치는 곳(같으면 초점에 가까운 곳).
        // 이동 중에도 자리가 흔들리지 않게 보간 전 「이번 단계」의 초점으로 계산.
        const fin = cur.regions.map(ell).filter(Boolean) as {cx: number, cy: number, rx: number, ry: number}[], E = fin.length ? fin : es;
        const cw = c.offsetWidth || 300, chh = c.offsetHeight || 110, L = Math.min(...E.map(e => e.cx - e.rx * .75)), R = Math.max(...E.map(e => e.cx + e.rx * .75));
        const rows = g.rows.slice(0, 2), mid = rows.length > 1 ? (rows[0].b + rows[1].t) / 2 : g.h / 2, top = (rows[0]?.t ?? 0) + 4, bot = g.h - chh - 26;
        const obs: [number, number, number, number, number][] = E.map(e => [e.cx - e.rx * .8, e.cy - e.ry * .8, e.cx + e.rx * .8, e.cy + e.ry * .8, 1]);
        if (o.caliper) for (const cp of cur.calipers) { const b = box(cp.row); if (!b) continue; const x0 = xOf(cp.t0), x1 = xOf(cp.t1); if (!Number.isFinite(x0) || !Number.isFinite(x1)) continue;
          const y = cp.kind === 'vline' ? b.t + 30 : cp.at === 'top' ? b.t + 16 : b.b - 14; obs.push([Math.min(x0, x1) - 30, y - 24, Math.max(x0, x1) + 30, y + 24, 6]); }   // 측정 글자는 가리면 안 됨(무게 6)
        const xs = [L - 36 - cw, R + 36, ...Array.from({length: 9}, (_, i) => g.left + 10 + i * (g.w - g.left - cw - 18) / 8)], ys = [mid - chh / 2, (rows[0]?.b ?? mid) + 12, top, bot]; let best = Infinity;
        for (const x0 of xs) for (const y0 of ys) { const x = Math.max(g.left + 6, Math.min(g.w - cw - 8, x0)), y = Math.max(6, Math.min(g.h - chh - 6, y0));
          let ov = 0; for (const [a, b2, c2, d, wgt] of obs) ov += wgt * Math.max(0, Math.min(x + cw, c2) - Math.max(x, a)) * Math.max(0, Math.min(y + chh, d) - Math.max(y, b2));
          const sc = ov + .02 * Math.hypot(x + cw / 2 - (L + R) / 2, y + chh / 2 - mid) * cw; if (sc < best) { best = sc; cardBox = {x, y, w: cw, h: chh}; } } }
      const ckey = `${show}|${k}|${cardA.toFixed(3)}|${cardBox ? Math.round(cardBox.x) + ',' + Math.round(cardBox.y) : ''}|${o.glass}`;
      if (ckey !== lastCard) { lastCard = ckey;
        c.style.visibility = show && cardA > .001 ? 'visible' : 'hidden'; c.style.opacity = String(cardA);
        c.classList.toggle('glass', o.glass);
        if (cardBox) { const lift = o.glass && !red ? (1 - cardA) * 8 : 0, sc = o.glass && !red ? .97 + .03 * cardA : 1; c.style.transform = `translate(${cardBox.x.toFixed(1)}px,${(cardBox.y + lift).toFixed(1)}px) scale(${sc.toFixed(4)})`; }
        c.querySelector('.dt-k')!.textContent = `특징 ${k + 1} / ${tour.steps.length}`;
        c.querySelector('.dt-t')!.textContent = cur.title; c.querySelector('.dt-v')!.textContent = cur.value; }
      // SVG: 지시선 · 측정 표식 · 유령 · 요약 표식
      const parts: string[] = [];
      const clip = `<clipPath id="dt-clip"><rect x="${g.left}" y="0" width="${g.pw}" height="${g.h}"/></clipPath>`;
      const stepSvg = (s: Step, a: number, dk: number, gk: number) => {
        if (a <= .001) return;
        if (o.ghost && s.ghost && gk > .001) { const gh = s.ghost, ib = box('input'), nb = box('normal'); if (ib && nb) {
          const pts: string[] = []; for (let T = gh.t0; T <= gh.t1; T += 1 / g.fs) { const x = xOf(T + gh.shift); if (!Number.isFinite(x)) continue; const i = Math.round(T * g.fs); pts.push(`${pts.length ? 'L' : 'M'}${x.toFixed(1)},${yOf('input', normal.trace[i] + gh.base).toFixed(1)}`); }
          const dy = red ? 0 : (1 - gk) * ((nb.t + nb.b) / 2 - (ib.t + ib.b) / 2);
          parts.push(`<path class="dt-ghost" clip-path="url(#dt-clip)" d="${pts.join('')}" transform="translate(0 ${dy.toFixed(1)})" opacity="${(.9 * gk * a).toFixed(3)}"/>`); } }
        if (o.caliper) for (const cp of s.calipers) parts.push(caliperSvg(cp, dk, a));
      };
      const caliperSvg = (cp: Caliper, dk: number, a: number) => { const b = box(cp.row); if (!b) return ''; const x0 = xOf(cp.t0), x1 = xOf(cp.t1); if (!Number.isFinite(x0) || !Number.isFinite(x1)) return '';
        const top = cp.at === 'top', y = top ? b.t + 16 : b.b - 14, sgn = top ? 1 : -1, off = (1 - dk).toFixed(3), lbl = cp.label ? `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${(y - sgn * 6).toFixed(1)}" text-anchor="middle" dominant-baseline="${top ? 'auto' : 'hanging'}" opacity="${dk.toFixed(3)}">${cp.label}</text>` : '';
        let d = '';
        if (cp.kind === 'vline') { d = `M${x0.toFixed(1)},${(b.t + 4).toFixed(1)}V${(b.b - 4).toFixed(1)}`; return `<g class="dt-cal v" opacity="${a.toFixed(3)}"><path d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${off}"/>${cp.label ? `<text x="${(x0 + 6).toFixed(1)}" y="${(b.t + 30).toFixed(1)}" opacity="${dk.toFixed(3)}">${cp.label}</text>` : ''}</g>`; }
        if (cp.kind === 'arrow') { const dir = Math.sign(x1 - x0) || 1; d = `M${x0.toFixed(1)},${y}H${x1.toFixed(1)}M${(x1 - dir * 8).toFixed(1)},${y - 5}L${x1.toFixed(1)},${y}L${(x1 - dir * 8).toFixed(1)},${y + 5}`; }
        else d = `M${x0.toFixed(1)},${y + sgn * 6}V${y}H${x1.toFixed(1)}V${y + sgn * 6}`;
        return `<g class="dt-cal" opacity="${a.toFixed(3)}"><path d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${off}"/>${lbl}</g>`; };
      if (show) { if (ph === 'move' && prev) stepSvg(prev, oldA, 1, 1); stepSvg(cur, ph === 'move' ? clamp(mix * 2 - 1) : 1, drawK, ghostK);
        // 지시선: 카드 가장자리 → 가까운 초점 타원 가장자리
        if (cardBox && es[0] && cardA > .01) { const e = es[0], cx = cardBox.x + cardBox.w / 2 < e.cx ? cardBox.x + cardBox.w : cardBox.x, cy = cardBox.y + 26, ex = e.cx + (cx < e.cx ? -1 : 1) * e.rx * .55, ey = e.cy;
          parts.push(`<path class="dt-lead" d="M${cx.toFixed(1)},${cy.toFixed(1)}C${((cx + ex) / 2).toFixed(1)},${cy.toFixed(1)} ${((cx + ex) / 2).toFixed(1)},${ey.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" opacity="${(cardA * .8).toFixed(3)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - drawK).toFixed(3)}"/><circle class="dt-dot" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3" opacity="${(cardA * drawK).toFixed(3)}"/>`); } }
      // 요약 표식: 본 특징 자리에 번호(투어가 쉬는 동안만)
      if (o.recap && st.seen.size && (st.phase === 'idle' || st.phase === 'run' || st.phase === 'accel')) { const ib = box('input'); let px = -1e9; if (ib) for (const i of [...st.seen].sort()) { let x = xOf(tour.steps[i].mark.t); if (!Number.isFinite(x) || x < g.left || x > g.right) continue; x = Math.max(x, px + 22); px = x;   // 가까운 표식은 옆으로 밀어 겹치지 않게
        parts.push(`<g class="dt-pin" transform="translate(${x.toFixed(1)} ${(ib.t + 14).toFixed(1)})"><title>${tour.steps[i].title}</title><circle r="9"/><text text-anchor="middle" dominant-baseline="central">${i + 1}</text></g>`); } }
      const html = parts.length ? `<defs>${clip}</defs>${parts.join('')}` : '';
      if (html !== lastSvg) { lastSvg = html; svg.current!.innerHTML = html; }
      const sv = svg.current!; if (sv.getAttribute('viewBox') !== `0 0 ${g.w} ${g.h}`) sv.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`);
      el.dataset.phase = st.phase; el.dataset.step = String(st.k); el.dataset.span = (st.view?.span ?? g0.span).toFixed(3);
      // 배율 표식 · 개관 띠(D-194 Z5 · Z6): 기본 구간과 다를 때만
      const ze = zoomEl.current!, B = tour.span ?? g0.span, zv = st.view && Math.abs(st.view.span - B) > .01 ? st.view : null;
      if (zv) { ze.style.opacity = '1'; ze.querySelector('b')!.textContent = `${zv.span.toFixed(2)} s · ×${(B / zv.span).toFixed(1)}`;
        const mm = ze.querySelector('i') as HTMLElement, win = mm.firstElementChild as HTMLElement, T = transport.time; mm.style.display = o.minimap ? 'block' : 'none';
        win.style.left = `${Math.max(0, 100 * (zv.right - zv.span - (T - B)) / B)}%`; win.style.width = `${Math.min(100, 100 * zv.span / B)}%`; }
      else ze.style.opacity = '0';
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); if (S.phase !== 'idle') { transport.speed = S.userSpeed; setMode(S.prevMode); if (S.prevSpan) setSpan(S.prevSpan); } apiRef.current = null; live.current.onStatus(null); };
  }, [tour, normal, transport, geom]);
  return <div ref={root} className="dt-layer" aria-hidden="true">
    <div ref={dof} className="dt-dof"/><div ref={dim} className="dt-dim"/>
    <svg ref={svg} className="dt-svg"/>
    <div ref={zoomEl} className="dt-zoom"><b/><i><span/></i></div>
    <div ref={card} className="dt-card"><span className="dt-k"/><b className="dt-t"/><span className="dt-v"/></div>
  </div>;
}
