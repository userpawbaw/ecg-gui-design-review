import '@fontsource-variable/inter-tight';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import {StrictMode, useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useMotionValueEvent} from 'motion/react';
import {ReactLenis, useLenis} from 'lenis/react';
import {Ripple} from '@/components/ui/ripple';

// Variant B of the REF-003 route: built from public component vocabulary instead of hand-made GSAP code.
//  - motion (framer-motion) scroll hooks + `pathLength` for the drawn route (the technique used by Aceternity / Magic UI)
//  - Aceternity "Tracing Beam" idea: a userSpace linear gradient that follows the scroll with a spring (stiffness 500, damping 90)
//  - Magic UI "Ripple" around the indicator (registry component, MIT)
//  - Tailwind utility classes, lenis/react for inertial scroll
// Same data and map as variant A (ref003.html) so the two can be compared frame by frame.
type Route = {map: {w: number; h: number}; start: {px: number[]; lat: number; name: string}; end: {px: number[]; lat: number; name: string}; distance_km: number};
const FOLLOW_Y = 0.56;

function RouteMap({route}: {route: Route}) {
  const comp = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null), path = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(1);
  const W = route.map.w, H = route.map.h, [x0, y0] = route.start.px, [x1, y1] = route.end.px;
  const d = `M${x0} ${y0} C ${x0 - 170} ${y0 + (y1 - y0) * 0.35}, ${x1 - 260} ${y1 - (y1 - y0) * 0.45}, ${x1} ${y1}`;
  useEffect(() => { if (path.current) setLen(path.current.getTotalLength()); }, [d]);

  // map parallax (same 0.55 vh as variant A)
  const {scrollYProgress} = useScroll({target: comp, offset: ['start start', 'end start']});
  const innerY = useTransform(scrollYProgress, [0, 1], [0, typeof window !== 'undefined' ? innerHeight * 0.55 : 0]);

  // follow mapping: component libraries give scroll progress of an element, not "keep a point on screen" — solved per frame
  const raw = useMotionValue(0);
  const p = useSpring(raw, {stiffness: 500, damping: 90});      // Tracing Beam's spring
  useAnimationFrame(() => {
    const el = path.current, box = svg.current; if (!el || !box) return;
    const r = box.getBoundingClientRect(), target = innerHeight * FOLLOW_Y;
    const yAt = (q: number) => r.top + el.getPointAtLength(q * len).y / H * r.height;
    let v: number;
    if (yAt(0) >= target) v = 0; else if (yAt(1) <= target) v = 1;
    else { let lo = 0, hi = 1; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; yAt(m) < target ? lo = m : hi = m; } v = (lo + hi) / 2; }
    raw.set(v);
  });
  const [pt, setPt] = useState({x: x0, y: y0}); const [pct, setPct] = useState(0);
  useMotionValueEvent(p, 'change', v => { const el = path.current; if (!el) return; const q = el.getPointAtLength(Math.max(0, Math.min(1, v)) * len); setPt({x: q.x, y: q.y}); setPct(Math.round(v * 100)); });
  // Tracing Beam gradient: bright head at the indicator, fading tail behind it
  const gy2 = useTransform(p, v => (path.current ? path.current.getPointAtLength(Math.max(0, Math.min(1, v)) * len).y : y0));
  const gy1 = useTransform(gy2, v => v - 520);

  return (
    <div ref={comp} className="relative overflow-clip bg-[#07090d] text-white">
      <motion.div style={{y: innerY}} className="relative will-change-transform">
        <img src="./ref003/map.webp" alt="Satellite map, Patagonia to the Antarctic Peninsula" className="block h-auto w-full" />
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <motion.linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={gy1} y2={gy2}>
              <stop stopColor="#72e6f5" stopOpacity="0.55" />
              <stop offset="0.85" stopColor="#72e6f5" />
              <stop offset="1" stopColor="#e6fbff" />
            </motion.linearGradient>
          </defs>
          <path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.38} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <motion.path ref={path} d={d} fill="none" stroke="url(#beam)" strokeWidth={2.6} strokeLinecap="round" vectorEffect="non-scaling-stroke"
            style={{pathLength: p}} className="drop-shadow-[0_0_4px_rgba(114,230,245,0.65)]" />
        </svg>
        <span className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#72e6f5]" style={{left: `${x0 / W * 100}%`, top: `${y0 / H * 100}%`}} />
        <span className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{left: `${x1 / W * 100}%`, top: `${y1 / H * 100}%`}} />
        <div className="absolute z-10 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2" style={{left: `${pt.x / W * 100}%`, top: `${pt.y / H * 100}%`}}>
          <Ripple mainCircleSize={15} numCircles={3} ringStep={22} mainCircleOpacity={0.6} className="mask-none" />
          <div className="absolute inset-0 rounded-full bg-[#72e6f5] shadow-[0_0_16px_#72e6f580]" />
        </div>
        <div className="absolute -translate-x-1/2 text-center text-xs uppercase tracking-[0.14em]" style={{left: `${(x0 + 20) / W * 100}%`, top: `${(y0 + 38) / H * 100}%`}}>
          <em className="block font-['Instrument_Serif'] text-[15px] normal-case tracking-normal opacity-70">Starting point</em><b>Punta Arenas, Chile</b>
        </div>
        <div className="absolute -translate-x-1/2 text-center text-xs uppercase tracking-[0.14em]" style={{left: `${(x1 + 10) / W * 100}%`, top: `${(y1 + 36) / H * 100}%`}}>
          <em className="block font-['Instrument_Serif'] text-[15px] normal-case tracking-normal opacity-70">King George Island</em><b className="text-[#72e6f5]">King Sejong Station</b>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 flex h-svh items-end p-[3vw]">
          <div className="pointer-events-auto grid w-[min(360px,24vw)] gap-5 rounded-md bg-[#1d264073] px-6 py-8 backdrop-blur-md">
            <div><em className="font-['Instrument_Serif'] text-base opacity-80">Great-circle distance</em><h4 className="mt-1 text-4xl font-medium tabular-nums">{route.distance_km.toLocaleString('en-US')} km</h4></div>
            <div className="border-t border-dashed border-white/25" />
            <div><em className="font-['Instrument_Serif'] text-base opacity-80">Progress</em><h4 className="mt-1 text-4xl font-medium tabular-nums">{pct}%</h4></div>
            <p className="m-0 text-[11px] opacity-55">Demo content — variant B (components).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExposeLenis() { const lenis = useLenis(); useEffect(() => { (window as any).__lenis = lenis; }, [lenis]); return null; }

function App() {
  const [route, setRoute] = useState<Route | null>(null);
  useEffect(() => { fetch('./ref003/route.json').then(r => r.json()).then(setRoute); }, []);
  useEffect(() => { if (route) (window as any).__repro = {ready: true}; }, [route]);
  return (
    <ReactLenis root options={{lerp: 0.1}}>
      <ExposeLenis />
      <header className="px-[6vw] pt-[20vh] pb-[12vh] text-[#1d2640]">
        <p className="m-0 text-sm opacity-60">Variant B · built from Magic UI / Aceternity-style components (React + motion + Tailwind)</p>
        <h1 className="mt-4 font-['Instrument_Serif'] text-6xl uppercase">To the edge of the map</h1>
      </header>
      {route && <RouteMap route={route} />}
      <footer className="bg-[#07090d] px-[3vw] py-10 text-xs text-white/60">Imagery: NASA Blue Marble (public domain). Ripple: Magic UI (MIT). Gradient-beam technique after Aceternity UI Tracing Beam.</footer>
    </ReactLenis>
  );
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
