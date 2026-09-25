// Headless evidence for the repro pages (SwiftShader: no GPU timing, no H.264 → webm/poster used).
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const url = process.env.URL || 'http://127.0.0.1:4191/';
const out = new URL('../qa-output/', import.meta.url).pathname; await mkdir(out, {recursive: true});
const b = await chromium.launch({executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
const which = (process.env.PAGES || 'ref004,ref003').split(',');
const res = {};
const errs = p => { const e = []; p.on('pageerror', x => e.push(String(x))); p.on('console', m => m.type() === 'error' && e.push(m.text())); return e; };
if (which.includes('ref004')) {
  const p = await b.newPage({viewport: {width: 1920, height: 1032}}); const e = errs(p);
  await p.goto(url + 'ref004.html'); await p.waitForFunction(() => window.__globe?.ready, null, {timeout: 120000}); await p.waitForTimeout(1500);
  await p.screenshot({path: out + 'ref004-default.png'});
  // hover the most central visible vessel
  const ids = 'abcdefghijklmn'.split('');
  const pos = await p.evaluate(ids => ids.map(id => ({id, ...window.__screenOf(id)})), ids);
  const vis = pos.filter(q => q.facing && q.x > 300 && q.x < 1620 && q.y > 250 && q.y < 950).sort((a, b) => Math.abs(a.x - 960) - Math.abs(b.x - 960));
  if (vis[0]) { await p.mouse.move(vis[0].x, vis[0].y); await p.waitForTimeout(1500); }
  const hovered = await p.evaluate(() => window.__globe.hovered);
  await p.screenshot({path: out + 'ref004-hover.png'});
  await p.mouse.move(40, 1000); await p.waitForTimeout(600);
  const t0 = await p.evaluate(() => [window.__globe.theta, window.__globe.phi]);
  await p.click('button[data-f=polar]'); await p.waitForTimeout(4000);
  const t1 = await p.evaluate(() => [window.__globe.theta, window.__globe.phi]);
  await p.screenshot({path: out + 'ref004-polar.png'});
  await p.click('button[data-f=offshore]'); await p.waitForTimeout(4000);
  await p.screenshot({path: out + 'ref004-offshore.png'});
  // drag + inertia
  await p.mouse.move(900, 700); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(900 + i * 25, 700); await p.waitForTimeout(16); } await p.mouse.up();
  const d0 = await p.evaluate(() => window.__globe.theta); await p.waitForTimeout(1500); const d1 = await p.evaluate(() => window.__globe.theta);
  res.ref004 = {hoverTarget: vis[0]?.id, hovered, filterRotation: {before: t0, afterPolar: t1}, drag: {atRelease: d0, after1500ms: d1}, errors: e};
  await p.close();
}
if (which.includes('ref003')) {
  const p = await b.newPage({viewport: {width: 1920, height: 1032}}); const e = errs(p);
  await p.goto(url + 'ref003.html'); await p.waitForFunction(() => window.__repro?.ready, null, {timeout: 120000}); await p.waitForTimeout(2500);
  const shots = [];
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const tops = await p.evaluate(() => ({hero: 0, intro: document.querySelector('.intro').offsetTop, hero2: document.querySelector('.hero2').offsetTop, travel: document.querySelector('#travelComp').getBoundingClientRect().top + scrollY}));
  const stops = [0, 450, 900, 1300, tops.intro + 200, tops.hero2 + 300, tops.hero2 + 900, tops.travel - 300, tops.travel + 700, tops.travel + 1500, tops.travel + 2300];
  for (const y of stops) {
    await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y); await p.waitForTimeout(900);
    const f = `ref003-${String(Math.round(y)).padStart(5, '0')}.png`; await p.screenshot({path: out + f});
    shots.push({y, f, progress: await p.evaluate(() => window.__repro.progress)});
  }
  res.ref003 = {height: H, tops, shots, errors: e};
  await p.close();
}
await b.close(); await writeFile(out + 'results.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
