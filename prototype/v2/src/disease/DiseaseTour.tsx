/* D-192 질환 특징 투어 — 실험실 Plot 캔버스 위 DOM/SVG 한 층.
 * 재생 → (감속) 정지 → 어둡게 + 초점(+ 흐림) · 카드 · 측정 표식 · 정상 유령 → 해제 → (가속) 재생 → 다음 특징.
 * 매 프레임 값은 React 상태가 아니라 이 층의 DOM 속성으로 바꾼다(재생 중 Plot은 그대로). 시각 → 화면 좌표는 Plot이 내준 기하(PlotGeom)로 계산.
 * 연출 하나하나를 옵션으로 끌 수 있다(사용자 2026-11-24 「옵션으로 하나씩 확인」). */
import React, {useEffect, useRef} from 'react';
import type {Transport, Mode} from '../engine';
import type {PlotGeom} from '../Plot';
import type {NormalRow, Tour, Step, Region, Caliper} from './tour';

export type TourOpts = {decel: boolean, dof: boolean, move: boolean, ghost: boolean, caliper: boolean, glass: boolean, progress: boolean, recap: boolean};
export const TOUR_OPT_LABELS: [keyof TourOpts, string, string][] = [
  ['decel', '감속 정지 · 가속 재개', 'A1'], ['dof', '초점 밖 흐림', 'A2'], ['move', '같은 화면 안 초점 이동', 'A3'], ['ghost', '정상 유령 투영', 'A4'],
  ['caliper', '측정선 그리기', 'A5'], ['glass', '유리 카드', 'A6'], ['progress', '왼쪽 제목 진행선', 'A7'], ['recap', '끝 요약 표식', 'A8']];
export const TOUR_DEFAULT: TourOpts = {decel: true, dof: true, move: true, ghost: true, caliper: true, glass: true, progress: true, recap: true};
export type TourApi = {start: (k?: number) => void, stop: () => void, running: () => boolean, done: () => boolean};
export type TourStatus = {k: number, hold: boolean, holdS: number, seq: number} | null;

type Phase = 'idle' | 'run' | 'decel' | 'in' | 'hold' | 'move' | 'out' | 'accel';
const DUR: Record<Phase, number> = {idle: 0, run: 0, decel: .5, in: .6, hold: 4, move: .7, out: .6, accel: .4};
const clamp = (v: number) => Math.max(0, Math.min(1, v)), ease = (u: number) => u * u * (3 - 2 * u);
const NO_MOVE_GAP = .5;   // 초점 이동을 끄면 같은 화면 특징 사이 재생(초) — 다음 박동이 들어오기 전

export function DiseaseTour({tour, normal, transport, geom, opts, reduced, setMode, getMode, beginPlay, onStatus, apiRef}: {
  tour: Tour, normal: NormalRow, transport: Transport, geom: {current: PlotGeom | null}, opts: TourOpts, reduced: boolean,
  setMode: (m: Mode) => void, getMode: () => Mode, beginPlay: (t: number) => void, onStatus: (s: TourStatus) => void, apiRef: {current: TourApi | null}}) {
  const root = useRef<HTMLDivElement>(null), dim = useRef<HTMLDivElement>(null), dof = useRef<HTMLDivElement>(null), card = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null);
  const live = useRef({opts, reduced, onStatus});live.current = {opts, reduced, onStatus};
  useEffect(() => {
    const S = {phase: 'idle' as Phase, k: 0, from: -1, ph0: 0, clock: 0, last: 0, lastTime: transport.time, d0: 0, stopAt: 0, prevMode: 'sweep' as Mode, userSpeed: 1, done: false, seen: new Set<number>(), seq: 0};
    const steps = tour.steps;
    const stopOf = (k: number): number => !live.current.opts.move && k > 0 && Math.abs(steps[k].stop - steps[k - 1].stop) < 1e-6 ? stopOf(k - 1) + NO_MOVE_GAP : steps[k].stop;
    const status = () => live.current.onStatus(S.phase === 'idle' ? null : {k: S.k, hold: S.phase === 'hold', holdS: holdS(S.k), seq: S.seq});
    const holdS = (k: number) => (k === 0 ? 4.5 : DUR.hold);
    const go = (ph: Phase) => { S.phase = ph; S.ph0 = S.clock; if (ph === 'hold') S.seq++; if (ph === 'hold' || ph === 'in' || ph === 'idle' || ph === 'run') status(); };
    const finish = (restore: boolean) => { transport.speed = S.userSpeed; if (restore && S.phase !== 'idle') setMode(S.prevMode); S.phase = 'idle'; status(); };
    apiRef.current = {
      start: (k = 0) => { if (S.phase === 'idle') { S.prevMode = getMode(); S.userSpeed = transport.speed || 1; }
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
          S.clock += dt; const dur = S.phase === 'hold' ? holdS(S.k) : DUR[S.phase] * (red ? .4 : 1), u = dur ? (S.clock - S.ph0) / dur : 0;
          if (S.phase === 'run') { const st = stopOf(S.k);
            if (o.decel && !red && transport.time >= st - .25) { S.d0 = transport.time; S.stopAt = st; transport.speed = 0; go('decel'); }
            else if (transport.time >= st) { transport.time = st; transport.speed = 0; go('in'); } }
          else if (S.phase === 'decel') { const e = 1 - (1 - clamp(u)) ** 2; transport.time = S.d0 + (S.stopAt - S.d0) * e; if (u >= 1) go('in'); }
          else if (S.phase === 'in' && u >= 1) go('hold');
          else if (S.phase === 'hold' && u >= 1) { S.seen.add(S.k);
            if (S.k + 1 < steps.length && o.move && Math.abs(steps[S.k + 1].stop - steps[S.k].stop) < 1e-6) { S.from = S.k; S.k++; go('move'); } else go('out'); }
          else if (S.phase === 'move' && u >= 1) { S.from = -1; go('hold'); }
          else if (S.phase === 'out' && u >= 1) { S.from = -1;
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
      const g = geom.current, el = root.current; if (!g || !el) return;
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
      if (ph === 'in') { dimA = ease(u(D('in'))); cardA = ease(clamp((st.clock - st.ph0 - .2) / .5)); drawK = ease(u(D('in'))); ghostK = ease(u(D('in'))); }
      else if (ph === 'hold') { dimA = cardA = drawK = ghostK = 1; }
      else if (ph === 'move') { const m = u(D('move')); dimA = 1; mix = ease(m); oldA = 1 - clamp(m * 2); cardA = clamp(m * 2 - 1); drawK = ghostK = ease(clamp(m * 2 - 1)); }
      else if (ph === 'out') { const m = u(D('out')); dimA = 1 - ease(m); cardA = 1 - clamp(m * 1.6); drawK = ghostK = cardA; }
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
      if (show) { const L = Math.min(...es.map(e => e.cx - e.rx * .7)), R = Math.max(...es.map(e => e.cx + e.rx * .7)), cw = c.offsetWidth || 300, chh = c.offsetHeight || 110;
        const rows = g.rows.slice(0, 2), mid = rows.length > 1 ? (rows[0].b + rows[1].t) / 2 : g.h / 2;
        let x = L - 36 - cw; if (x < g.left + 6) x = R + 36; if (x + cw > g.w - 8) x = Math.max(g.left + 6, Math.min(g.w - cw - 8, L - cw - 12));
        const y = Math.max(8, Math.min(g.h - chh - 8, mid - chh / 2)); cardBox = {x, y, w: cw, h: chh}; }
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
      el.dataset.phase = st.phase; el.dataset.step = String(st.k);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); if (S.phase !== 'idle') { transport.speed = S.userSpeed; setMode(S.prevMode); } apiRef.current = null; live.current.onStatus(null); };
  }, [tour, normal, transport, geom]);
  return <div ref={root} className="dt-layer" aria-hidden="true">
    <div ref={dof} className="dt-dof"/><div ref={dim} className="dt-dim"/>
    <svg ref={svg} className="dt-svg"/>
    <div ref={card} className="dt-card"><span className="dt-k"/><b className="dt-t"/><span className="dt-v"/></div>
  </div>;
}
