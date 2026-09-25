// Headless evidence (v2, mode C): fixed angles incl. between two bakes, post on/off, drag + inertia, console errors.
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const url = process.env.LAB_URL || 'http://127.0.0.1:4190/';
const out = new URL('../qa-output/', import.meta.url).pathname; await mkdir(out, {recursive: true});
const b = await chromium.launch({executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const result = {runs: {}};
for (const fx of (process.env.FX || '1,0').split(',')) {
  const shots = [];
  for (const angle of (process.env.ANGLES || '0,22.5,45,90,135,180,225,270,315').split(',').map(Number)) {
    const p = await b.newPage({viewport: {width: 1440, height: 900}}); const errors = [];
    p.on('pageerror', e => errors.push(String(e))); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await p.goto(`${url}?fx=${fx}&angle=${angle}`); await p.waitForFunction(() => window.__lab?.ready, null, {timeout: 120000});
    await p.waitForTimeout(800);
    const file = `c-fx${fx}-${String(angle).replace('.', '_')}.png`; await p.screenshot({path: out + file});
    shots.push({angle, file, errors}); await p.close();
  }
  result.runs[`fx${fx}`] = shots;
}
// v3: scroll path (camera descends to the monitor) at a window-light angle
const scrollShots = [];
for (const sp of (process.env.SCROLLS || '0,0.3,0.55,0.8,1').split(',').map(Number)) {
  const q = await b.newPage({viewport: {width: 1440, height: 900}}); const errors = [];
  q.on('pageerror', e => errors.push(String(e))); q.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await q.goto(`${url}?angle=${process.env.SCROLL_ANGLE || 90}&p=${sp}`); await q.waitForFunction(() => window.__lab?.ready, null, {timeout: 120000});
  await q.waitForTimeout(1500);
  const file = `scroll-${String(sp).replace('.', '_')}.png`; await q.screenshot({path: out + file});
  scrollShots.push({p: sp, camP: await q.evaluate(() => window.__lab.scroll), file, errors}); await q.close();
}
result.scroll = scrollShots;
const p = await b.newPage({viewport: {width: 1440, height: 900}});
await p.goto(url + '?angle=0'); await p.waitForFunction(() => window.__lab?.ready, null, {timeout: 120000});
const a0 = await p.evaluate(() => window.__lab.angle);
await p.mouse.move(500, 450); await p.mouse.down();
for (let i = 1; i <= 10; i++) { await p.mouse.move(500 + i * 30, 450); await p.waitForTimeout(16); }
await p.mouse.up();
const a1 = await p.evaluate(() => window.__lab.angle); await p.waitForTimeout(600);
const a2 = await p.evaluate(() => window.__lab.angle); await p.waitForTimeout(1500);
const a3 = await p.evaluate(() => window.__lab.angle);
await p.evaluate(() => { window.__lab.frames.length = 0; }); await p.waitForTimeout(2000);
const frames = await p.evaluate(() => [...window.__lab.frames].sort((x, y) => x - y));
result.drag = {start: a0, atRelease: +a1.toFixed(1), after600ms: +a2.toFixed(1), after2100ms: +a3.toFixed(1)};
result.frameIntervalsMs = {samples: frames.length, median: +frames[frames.length >> 1]?.toFixed(1)};
await b.close(); await writeFile(out + 'results.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify({drag: result.drag, frames: result.frameIntervalsMs, errors: Object.values(result.runs).flat().flatMap(s => s.errors)}, null, 1));
