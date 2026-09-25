// Deterministic frame-stepped capture of the spikes → mp4 (headless SwiftShader is too slow for real-time recording).
// Usage: node tools/spike-capture/capture-frames.mjs <which: ref003|ref004|lab> <outDir>
// Needs the spike previews running: ref-repro on :4191, lab-corner on :4190. Uses @playwright/test from a spike's node_modules.
import {createRequire} from 'node:module';
import {mkdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const require = createRequire(new URL('../../prototype/spikes/ref-repro/package.json', import.meta.url));
const {chromium} = require('@playwright/test');
const [which, outDir] = process.argv.slice(2);
const FF = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const frames = `${outDir}/${which}-frames`; await rm(frames, {recursive: true, force: true}); await mkdir(frames, {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
let n = 0; const shot = async p => p.screenshot({path: `${frames}/f${String(n++).padStart(4, '0')}.png`});
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const raf = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
if (which === 'ref003') {
  const p = await b.newPage({viewport: {width: 1600, height: 860}});
  await p.goto('http://127.0.0.1:4191/ref003.html'); await p.waitForFunction(() => window.__repro?.ready); await p.waitForTimeout(2000);
  const end = await p.evaluate(() => document.querySelector('#travelComp').getBoundingClientRect().top + scrollY + 2300);
  const N = 240;
  for (let i = 0; i < N; i++) { const y = ease(i / (N - 1)) * end; await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y); await p.waitForTimeout(60); await shot(p); }
  for (let i = 0; i < 36; i++) { await p.waitForTimeout(83); await shot(p); }        // hold: sonar rings keep pulsing while idle
}
if (which === 'ref004') {
  const p = await b.newPage({viewport: {width: 1600, height: 860}});
  await p.goto('http://127.0.0.1:4191/ref004.html?manual=1'); await p.waitForFunction(() => window.__globe?.ready); await p.waitForTimeout(1500);
  const step = async (k, dt = 1 / 24) => { for (let i = 0; i < k; i++) { await p.evaluate(dt => window.__tick(dt), dt); await shot(p); } };
  await step(48);                                                   // idle: tick rings, bobbing vessels
  const pos = await p.evaluate(() => 'abcdefghijklmn'.split('').map(id => ({id, ...window.__screenOf(id)})));
  const c = pos.filter(q => q.facing && q.x > 400 && q.x < 1200 && q.y > 300 && q.y < 700).sort((a, b) => Math.abs(a.x - 800) - Math.abs(b.x - 800))[0];
  if (c) { await p.mouse.move(c.x, c.y); await p.evaluate(({x, y}) => window.__hoverAt(x, y), c); for (let i = 0; i < 30; i++) { await p.evaluate(() => window.__tick(1 / 24)); await p.waitForTimeout(12); await shot(p); } }
  await p.mouse.move(20, 840); await p.evaluate(() => window.__hoverAt(-99, -99)); await step(12);
  for (const f of ['polar', 'offshore', '']) { await p.click(`button[data-f="${f}"]`).catch(() => {}); await p.evaluate(f => window.__setFilter(f), f); await step(60); }
}
if (which === 'lab') {
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4190/?angle=90'); await p.waitForFunction(() => window.__lab?.ready, null, {timeout: 120000}); await p.waitForTimeout(1500);
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let i = 0; i < 36; i++) { const a = i / 35 * 360 - 90; await p.evaluate(a => window.__setAngle(a), a); await raf(p); await shot(p); }   // light 360° at the overview
  await p.evaluate(() => window.__setAngle(90)); await raf(p);
  for (let i = 0; i < 60; i++) { await p.evaluate(y => scrollTo(0, y), ease(i / 59) * max); await raf(p); await shot(p); }          // camera descends to the monitor
  for (let i = 0; i < 6; i++) { await raf(p); await shot(p); }
}
if (which === 'attic') {
  const p = await b.newPage({viewport: {width: 1600, height: 900}});
  await p.goto('http://127.0.0.1:4192/'); await p.waitForFunction(() => window.__attic !== undefined); await p.waitForTimeout(3000);
  const [top, h] = await p.evaluate(() => { const r = document.getElementById('win').getBoundingClientRect(); return [r.top + scrollY, r.height]; });
  const y0 = top - 900 * 0.35, y1 = top + h - 900 * 0.2, N = 96;          // enter the window → walk down the bookcase
  for (let i = 0; i < N; i++) { await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y0 + ease(i / (N - 1)) * (y1 - y0)); await raf(p); await shot(p); }
  for (let i = 0; i < 12; i++) { await raf(p); await shot(p); }
}
await b.close();
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', which === 'lab' ? '12' : which === 'attic' ? '16' : '24', '-i', `${frames}/f%04d.png`,
  '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${outDir}/${which}.mp4`]);
console.log(which, n, 'frames →', `${outDir}/${which}.mp4`);
