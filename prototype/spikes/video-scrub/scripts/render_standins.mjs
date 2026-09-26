// Render stand-in clips from our own spikes for the video-pipeline tests (D-023). Not AI video.
//   node scripts/render_standins.mjs <outDir> [frames] [--probes-only]   (needs attic preview :4192 and ref-repro preview :4191)
// attic: descent p 0.15→0.85 for head offsets dx ∈ {-0.12, 0, +0.12} + true depth for dx 0; rotation/translation probes at p 0.5.
// globe: one full turn (loopable) for the idle-playback test.
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const out = process.argv[2]; const N = +(process.argv[3] || 48); const probesOnly = process.argv.includes('--probes-only');
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const onlyCanvas = p => p.addStyleTag({content: 'body > *:not(canvas):not(:has(canvas)) { visibility: hidden !important } [data-l], header, nav, .hud, .lede { visibility: hidden !important }'});
const pad = i => String(i).padStart(4, '0');
{ // attic
  const p = await b.newPage({viewport: {width: 1280, height: 720}});
  await p.goto('http://127.0.0.1:4192/?capture=1'); await p.waitForFunction(() => window.__attic?.ready, null, {timeout: 120000}); await p.waitForTimeout(2000);
  await p.evaluate(() => { const w = document.getElementById('win'); window.__lenis.scrollTo(w.getBoundingClientRect().top + scrollY, {immediate: true}); });
  await onlyCanvas(p); await p.waitForTimeout(300);
  const shot = async (dir, i, o) => { await mkdir(`${out}/${dir}`, {recursive: true}); await p.evaluate(o => window.__shot(o), o); await p.screenshot({path: `${out}/${dir}/f${pad(i)}.png`}); };
  // probes at p = 0.5 (t fixed so the dust is identical): rotation vs translation, plus wide-FOV overscan frame
  const probes = [['rot0', {yaw: 0}], ['rotR', {yaw: 0.75}], ['rotL', {yaw: -0.75}], ['wide', {fov: 27 * 1.1}], ['trR', {dx: 0.12}], ['trR2', {dx: 0.3}], ['trMid', {dx: 0.06}]];
  for (const [n, o] of probes) { await shot('probe', 0, {p: 0.5, t: 1, fov: 27, ...o}); await p.evaluate(() => 0); await (await import('node:fs/promises')).rename(`${out}/probe/f0000.png`, `${out}/probe/${n}.png`); }
  await shot('probe', 0, {p: 0.5, fov: 27, depth: true}); await (await import('node:fs/promises')).rename(`${out}/probe/f0000.png`, `${out}/probe/depth.png`);
  if (!probesOnly) for (const [dir, dx] of [['attic_c', 0], ['attic_r', 0.12], ['attic_l', -0.12]]) {
    for (let i = 0; i < N; i++) { const t0 = Date.now(); await shot(dir, i, {p: 0.15 + 0.7 * i / (N - 1), dx, t: i / 24, fov: 27}); if (i % 12 === 0) console.log(dir, i, Date.now() - t0, 'ms'); }
  }
  if (!probesOnly) for (let i = 0; i < N; i++) await shot('attic_depth', i, {p: 0.15 + 0.7 * i / (N - 1), fov: 27, depth: true});
  await p.close();
}
if (!probesOnly) { // globe loop
  const p = await b.newPage({viewport: {width: 1280, height: 720}});
  await p.goto('http://127.0.0.1:4191/ref004.html?manual=1'); await p.waitForFunction(() => window.__globe?.ready, null, {timeout: 120000}); await p.waitForTimeout(1500);
  await onlyCanvas(p);
  const G = 144; await mkdir(`${out}/globe`, {recursive: true});
  for (let i = 0; i < G; i++) { await p.evaluate(th => window.__setTheta(th), i / G * Math.PI * 2); await p.evaluate(() => window.__tick(1 / 24)); await p.screenshot({path: `${out}/globe/f${pad(i)}.png`}); }
  await p.close();
}
await b.close();
await writeFile(`${out}/DONE`, new Date().toISOString());
console.log('done');
