import '@fontsource-variable/oswald';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter-tight';
import './ref003.css';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {DrawSVGPlugin} from 'gsap/DrawSVGPlugin';
import {MotionPathPlugin} from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {ready: false, progress: 0};
(window as any).__repro = state;

// ---------- RCP-01: Lenis inertial scroll driven by the GSAP ticker (one time axis) ----------
const lenis = new Lenis({lerp: reduced ? 1 : 0.1, smoothWheel: !reduced});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
(window as any).__lenis = lenis;

const $ = (id: string) => document.getElementById(id)!;
const hero = $('hero');

// ---------- EFX-003-01: pinned hero, two cloud layers at different speeds, title blur ----------
// wrapper y: 0 → heroHeight − 100svh over the hero (reads as pinned); clouds start one screen below and rise
gsap.to('#heroWrap', {y: () => hero.offsetHeight - innerHeight, ease: 'none',
  scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true}});
document.querySelectorAll<HTMLElement>('.cloud').forEach(el => {
  // screen-space rise speed per scrolled px = data-speed × 0.5 (front 0.9, back 0.55 — REF-003 measurement)
  const k = Number(el.dataset.speed);
  // start 0.55 screen below the top: the rendered cloud bank sits in the lower half of its frame, so its edge shows at the first wheel step
  gsap.fromTo(el, {y: () => innerHeight * 0.55}, {y: () => innerHeight * 0.55 + hero.offsetHeight * (1 - k * 0.5), ease: 'none',
    scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true}});
});
gsap.fromTo('#heroTitle', {filter: 'blur(0px)'}, {filter: 'blur(10px)', ease: 'none',
  scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom top', scrub: true}});

// ---------- EFX-003-05: text mask scrub ----------
document.querySelectorAll<HTMLElement>('.mask-fade').forEach(el => gsap.fromTo(el, {'--mask': -40}, {'--mask': 100, ease: 'none',
  scrollTrigger: {trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true}}));

// ---------- EFX-003-04: mist board tilts up (rotateX 90° → 0°) ----------
gsap.fromTo('#mist', {rotateX: 90}, {rotateX: 0, ease: 'none', scrollTrigger: {trigger: '.hero2', start: 'top top-=10%', end: 'bottom bottom', scrub: true}});
gsap.fromTo('#hero2Title', {filter: 'blur(0px)'}, {filter: 'blur(8px)', ease: 'none', scrollTrigger: {trigger: '.hero2', start: 'top top', end: 'bottom top', scrub: true}});

// ---------- EFX-003-02 + 03: route drawn by scroll, indicator follows, sonar rings (CSS) ----------
const route = await (await fetch('./ref003/route.json')).json();
const W = route.map.w, H = route.map.h;
const svg = $('route') as unknown as SVGSVGElement; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
const [x0, y0] = route.start.px, [x1, y1] = route.end.px;
// gentle westward bow (cubic), like a flight arc drawn on a flat map
const d = `M${x0} ${y0} C ${x0 - 170} ${y0 + (y1 - y0) * 0.35}, ${x1 - 260} ${y1 - (y1 - y0) * 0.45}, ${x1} ${y1}`;
$('routeBase').setAttribute('d', d); $('routeFlown').setAttribute('d', d);
const place = (el: HTMLElement, x: number, y: number) => { el.style.left = `${x / W * 100}%`; el.style.top = `${y / H * 100}%`; };
place($('ptStart'), x0, y0); place($('ptEnd'), x1, y1);
place($('lblStart'), x0 + 20, y0 + 38); place($('lblEnd'), x1 + 10, y1 + 36);
$('dist').textContent = `${route.distance_km.toLocaleString('en-US')} km`;
$('latSpan').textContent = `${Math.abs(route.start.lat).toFixed(1)}° → ${Math.abs(route.end.lat).toFixed(1)}° S`;

// indicator in % of the inner box so it scales with the map; motionPath gives the point, we convert to %
const ind = $('indicator'), flown = $('routeFlown') as unknown as SVGPathElement;
const L = flown.getTotalLength();
const setIndicator = (p: number) => { const pt = flown.getPointAtLength(p * L); place(ind, pt.x, pt.y); ind.style.transform = 'translate(-50%,-50%)'; };
gsap.set(flown, {drawSVG: '0%'}); setIndicator(0);
const comp = $('travelComp');
// v2 follow mapping (fix after a 12-frame comparison): the reference's indicator stays near the middle of the screen
// while the map scrolls under it. Instead of a fixed scroll window, solve p each frame so the indicator sits at
// FOLLOW_Y of the viewport (path y is monotonic in p because the route runs south), clamped to the ends.
const FOLLOW_Y = 0.56;
const screenYAt = (p: number, r: DOMRect) => r.top + flown.getPointAtLength(p * L).y / H * r.height;
function solveP() {
  const r = svg.getBoundingClientRect(), target = innerHeight * FOLLOW_Y;
  if (screenYAt(0, r) >= target) return 0;
  if (screenYAt(1, r) <= target) return 1;
  let lo = 0, hi = 1; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; screenYAt(m, r) < target ? lo = m : hi = m; } return (lo + hi) / 2;
}
let followP = 0;
gsap.ticker.add(() => {
  const p = solveP();
  followP = reduced ? p : followP + (p - followP) * 0.35;           // light smoothing on top of Lenis
  if (Math.abs(p - followP) < 1e-4) followP = p;
  gsap.set(flown, {drawSVG: `0% ${(followP * 100).toFixed(3)}%`}); setIndicator(followP);
  state.progress = followP; $('prog').textContent = `${Math.round(followP * 100)}%`;
});
// map parallax: inner moves down while the component scrolls → map travels slower than the page
gsap.to('#travelInner', {y: () => innerHeight * 0.55, ease: 'none', scrollTrigger: {trigger: comp, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true}});
gsap.fromTo('#infoCard', {y: 0}, {y: () => innerHeight * 0.1, ease: 'none', scrollTrigger: {trigger: comp, start: 'top bottom', end: 'bottom bottom', scrub: true}});
gsap.fromTo('#filmCard', {y: () => innerHeight * 0.6}, {y: () => -innerHeight * 0.2, ease: 'none', scrollTrigger: {trigger: comp, start: 'top bottom', end: 'bottom top', scrub: true}});

addEventListener('load', () => ScrollTrigger.refresh());
ScrollTrigger.refresh();
state.ready = true;
