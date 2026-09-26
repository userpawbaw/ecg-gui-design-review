// Headless QA for the scrub player (D-019 frame rule + D-023 acceptance).
//   node scripts/qa.mjs [port]   (needs `npm run preview` on that port)
// For each config: 12 evenly spaced scroll captures → per-step visual motion (measured in Python afterwards),
// frames-per-scroll-px, pointer gaze settle time. Writes qa-output/<config>/NN.png and qa-output/results.json.
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const port = process.argv[2] || 4193, base = `http://127.0.0.1:${port}/`;
const configs = [
  {id: 'pan', q: 'clip=pan&hud=0&fx=0'},
  {id: 'eased-remap', q: 'clip=eased&remap=1&hud=0&fx=0'},
  {id: 'eased-noremap', q: 'clip=eased&remap=0&hud=0&fx=0'},
  {id: 'pan-full', q: 'clip=pan&depth=1&hud=1'},
];
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const res = {};
for (const c of configs) {
  const pg = await b.newPage({viewport: {width: 1280, height: 720}});
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(`${base}?${c.q}`); await pg.waitForFunction(() => window.__vs?.ready, null, {timeout: 120000});
  await pg.waitForFunction(() => document.getElementById('loader').hidden, null, {timeout: 5000});
  const geo = await pg.evaluate(() => { const t = document.getElementById('track'); return {top: t.offsetTop, len: t.offsetHeight - innerHeight}; });
  const dir = `qa-output/${c.id}`; await mkdir(dir, {recursive: true});
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const y = geo.top + geo.len * i / 11;
    await pg.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y);
    await pg.waitForTimeout(250);
    const s = await pg.evaluate(() => ({p: window.__vs.progress, f: window.__vs.frame}));
    await pg.screenshot({path: `${dir}/${String(i).padStart(2, '0')}.png`});
    rows.push({i, y: Math.round(y), ...s});
  }
  // pointer gaze: move to the right edge at mid-scroll, sample gaze every 100 ms
  await pg.mouse.move(640, 360); await pg.waitForTimeout(1500);
  const t0 = Date.now(); await pg.mouse.move(1279, 360);
  const gz = [];
  for (let k = 0; k < 30; k++) { await pg.waitForTimeout(100); gz.push({t: Date.now() - t0, g: await pg.evaluate(() => window.__vs.gaze[0])}); }
  const settle = gz.find(s => s.g >= 0.95 * 0.998)?.t ?? null;
  res[c.id] = {rows, framesPerScrollPx: +((await pg.evaluate(() => fetch(`./clips/${window.__vs.opt.clip}/manifest.json`).then(r => r.json()).then(m => m.frames - 1))) / geo.len).toFixed(4), trackScrollPx: geo.len, gazeSettle95ms: settle, gaze: gz, errors: errs, holds: await pg.evaluate(() => window.__vs.stats.holds), decodedPeak: await pg.evaluate(() => window.__vs.stats.decodedPeak)};
  await pg.close();
}
await b.close();
await writeFile('qa-output/results.json', JSON.stringify(res, null, 2));
for (const [k, v] of Object.entries(res)) console.log(k, 'frames', v.rows.map(r => r.f.toFixed(1)).join(' '), '| gaze95', v.gazeSettle95ms, 'ms | errors', v.errors.length, '| holds', v.holds, 'decodedPeak', v.decodedPeak);
