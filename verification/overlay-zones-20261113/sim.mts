// Offline zone tuning on a recorded stream: slide a 5 s window every 250 ms, run the zone pipeline with variant parameters, count
// (a) zone-composition changes per minute, (b) emphasis changes per minute for a pointer parked at fixed heights (mV from the outputs' centre).
// node --experimental-strip-types sim.mts <rec.json>
import fs from 'node:fs';
import {zonePeaks, zoneCenter, qrsMask, zoneBands, holdZones, createZoneHold, zoneAt, ZONE_TOL} from '../../prototype/v2/src/live/overlayFocus.ts';
const {fs: FS, S} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const names = Object.keys(S), outsN = names.filter(n => n !== 'raw');
const W = 5 * FS, STEP = Math.round(FS / 4), N = S.raw.length;
const mid = (a: number[]) => { let lo = Infinity, hi = -Infinity; for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); } return (lo + hi) / 2; };
const H = [.05, .1, .15, .2, .3, -.05, -.1, -.15];
function run(v: {rise: number, decay: number, hold: number, label: string}) {
  const h = createZoneHold(); let pk: Map<string, {up: number, down: number}> | null = null; let comp = 0, last = '', em = H.map(() => ({c: 0, l: ''})), t0 = 0;
  for (let e = W; e <= N; e += STEP) {
    const win = Object.fromEntries(names.map(n => [n, S[n].slice(e - W, e)])); const mo = mid(outsN.flatMap(n => win[n])), mr = mid(win.raw);
    const px = new Map(names.map(n => [n, win[n].map((x: number) => -(x + (n === 'raw' ? mo - mr : 0)))] as [string, number[]]));
    const outs = outsN.map(n => px.get(n)!), c = zoneCenter(outs), raw = zonePeaks(px, c, undefined, qrsMask(outs, c, Math.round(.08 * FS)));
    const now = (e - W) / FS * 1000; const dt = pk ? 250 : 0;
    const next = new Map<string, {up: number, down: number}>();
    for (const [n, p] of raw) { const o = pk?.get(n); const f = (nv: number, ov?: number) => ov === undefined ? nv : nv >= ov ? (v.rise ? nv + (ov - nv) * Math.exp(-dt / v.rise) : nv) : nv + (ov - nv) * Math.exp(-dt / v.decay); next.set(n, {up: f(p.up, o?.up), down: f(p.down, o?.down)}); }
    pk = next; holdZones(h, zoneBands(pk, ZONE_TOL, h.cur), now, v.hold);
    const z = h.cur!, sg = [...z.up, ...z.down].map(b => [...b.names].sort().join('+')).join('/'); if (last && sg !== last) comp++; last = sg;
    H.forEach((y, i) => { const zz = zoneAt(z, y, 0.02); const k = zz ? [...zz.names].sort().join('+') : '-'; if (em[i].l && k !== em[i].l) em[i].c++; em[i].l = k; });
    t0 = now;
  }
  const min = t0 / 60000; console.log(v.label.padEnd(34), 'composition changes/min', (comp / min).toFixed(1).padStart(5), '· parked-pointer changes/min', em.map(x => (x.c / min).toFixed(1)).join(' '));
}
console.log('heights (mV):', H.join(' '));
for (const v of [{rise: 0, decay: 8000, hold: 1000, label: 'now: rise instant, decay 8 s, hold 1 s'}, {rise: 0, decay: 20000, hold: 1000, label: 'decay 20 s'}, {rise: 0, decay: 8000, hold: 3000, label: 'hold 3 s'},
  {rise: 0, decay: 20000, hold: 3000, label: 'decay 20 s + hold 3 s'}, {rise: 0, decay: 30000, hold: 5000, label: 'decay 30 s + hold 5 s'}, {rise: 1500, decay: 20000, hold: 3000, label: 'rise 1.5 s, decay 20 s, hold 3 s'}]) run(v);
