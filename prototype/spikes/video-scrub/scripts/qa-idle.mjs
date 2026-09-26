// Idle-life + head-turn tests (D-023 follow-up). Needs `npm run preview` (:4193) with clips attic, attic_est, globe.
//   node scripts/qa-idle.mjs → qa-output/idle/*.png + qa-output/idle/results.json
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const base = `http://127.0.0.1:${process.argv[2] || 4193}/`, dir = 'qa-output/idle'; await mkdir(dir, {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const res = {};
async function open(q) {
  const pg = await b.newPage({viewport: {width: 1280, height: 720}}); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(`${base}?hud=0&overlay=0&${q}`); await pg.waitForFunction(() => window.__vs?.ready, null, {timeout: 120000});
  await pg.waitForFunction(() => document.getElementById('loader').hidden, null, {timeout: 5000});
  const geo = await pg.evaluate(() => { const t = document.getElementById('track'); return {top: t.offsetTop, len: t.offsetHeight - innerHeight}; });
  return {pg, geo, errs};
}
const at = (pg, geo, p) => pg.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), geo.top + geo.len * p);
const vs = pg => pg.evaluate(() => ({f: window.__vs.frame, sf: window.__vs.scrollFrame, p: window.__vs.progress}));

// 1) idle option 1 — time layer: same scroll position, 12 frames 170 ms apart, live off vs on
for (const live of [0, 1]) {
  const {pg, geo} = await open(`clip=attic&live=${live}&fx=0`); await at(pg, geo, 0.5); await pg.waitForTimeout(600);
  for (let i = 0; i < 12; i++) { await pg.screenshot({path: `${dir}/live${live}-${String(i).padStart(2, '0')}.png`}); await pg.waitForTimeout(170); }
  await pg.close();
}
// 2) idle option 2 — play: loop clip (globe) and non-loop clip (attic)
for (const clip of ['globe', 'attic']) {
  const {pg, geo, errs} = await open(`clip=${clip}&idle=play&idleFps=4`); await at(pg, geo, 0.2); await pg.waitForTimeout(400);
  const series = []; const t0 = Date.now();
  const sample = async (phase, n, gap) => { for (let k = 0; k < n; k++) { await pg.waitForTimeout(gap); series.push({t: Date.now() - t0, phase, ...(await vs(pg))}); } };
  await sample('rest', 10, 200);
  await pg.mouse.move(640, 360);
  for (let k = 0; k < 8; k++) { await pg.mouse.wheel(0, 120); series.push({t: Date.now() - t0, phase: 'scroll', ...(await vs(pg))}); await pg.waitForTimeout(60); }
  await sample('after', 15, 200);
  if (clip === 'globe') for (let i = 0; i < 12; i++) { await pg.screenshot({path: `${dir}/globe-play-${String(i).padStart(2, '0')}.png`}); await pg.waitForTimeout(250); }
  res[`play_${clip}`] = {series, errors: errs}; await pg.close();
}
// 3) head turn: grid variants (crossfade) vs overscan pan vs depth parallax (true / estimated), gaze = −1, −0.5, 0, 0.5, 1 at p = 0.5
for (const [id, q] of [['grid', 'clip=attic&grid=1'], ['pan', 'clip=attic'], ['depthTrue', 'clip=attic&depth=1&depthAmp=0.03'], ['depthEst', 'clip=attic_est&depth=1&depthAmp=0.03']]) {
  const {pg, geo} = await open(`${q}&fx=0`); await at(pg, geo, 0.5); await pg.waitForTimeout(500);
  for (const g of [-1, -0.5, 0, 0.5, 1]) { await pg.evaluate(g => window.__vs.setGaze(g, 0), g); await pg.waitForTimeout(300); await pg.screenshot({path: `${dir}/head-${id}-${g}.png`}); }
  await pg.close();
}
await b.close();
await writeFile(`${dir}/results.json`, JSON.stringify(res, null, 1));
for (const [k, v] of Object.entries(res)) console.log(k, v.series.map(s => `${s.phase[0]}${s.f.toFixed(1)}/${s.sf.toFixed(1)}`).join(' '), 'errors', v.errors.length);
