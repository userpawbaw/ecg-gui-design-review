// Slow-scroll double-image check (F-021) and depth parallax capture (F-022). Needs `npm run preview` (:4193).
//   node scripts/qa-density.mjs → qa-output/density/*.png + results.json
// Sharpness (Laplacian variance of the ladder area) is sampled while one wheel notch plays out; a crossfade between
// frames that are far apart shows as a double image and drops the sharpness below the resting value.
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const base = `http://127.0.0.1:${process.argv[2] || 4193}/`, dir = 'qa-output/density'; await mkdir(dir, {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const res = {};
async function open(q) {
  const p = await b.newPage({viewport: {width: 1280, height: 720}});
  await p.goto(`${base}?hud=0&overlay=0&fx=0&${q}`); await p.waitForFunction(() => window.__vs?.ready, null, {timeout: 120000});
  await p.waitForFunction(() => document.getElementById('loader').hidden, null, {timeout: 5000});
  const geo = await p.evaluate(() => { const t = document.getElementById('track'); return {top: t.offsetTop, len: t.offsetHeight - innerHeight}; });
  return {p, geo};
}
for (const clip of ['attic_grid', 'attic']) {
  const {p, geo} = await open(`clip=${clip}`);
  await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), geo.top + geo.len * 0.4); await p.waitForTimeout(800);
  await p.mouse.move(640, 360);
  const shots = [];
  await p.screenshot({path: `${dir}/${clip}-rest.png`, clip: {x: 0, y: 140, width: 560, height: 420}});
  await p.mouse.wheel(0, 100);
  for (let i = 0; i < 10; i++) { await p.waitForTimeout(45); const f = await p.evaluate(() => window.__vs.frame); await p.screenshot({path: `${dir}/${clip}-s${i}.png`, clip: {x: 0, y: 140, width: 560, height: 420}}); shots.push(+f.toFixed(3)); }
  res[clip] = {frames: shots};
  await p.close();
}
for (const [id, clip] of [['depthTrue', 'attic'], ['depthEst', 'attic_est']]) {
  const {p, geo} = await open(`clip=${clip}&depth=1&depthAmp=0.03`);
  await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), geo.top + geo.len * 0.5); await p.waitForTimeout(800);
  for (const g of [-1, 1]) { await p.evaluate(g => window.__vs.setGaze(g, 0), g); await p.waitForTimeout(300); await p.screenshot({path: `${dir}/${id}-${g}.png`, clip: {x: 0, y: 140, width: 560, height: 420}}); }
  await p.close();
}
await b.close();
await writeFile(`${dir}/results.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
