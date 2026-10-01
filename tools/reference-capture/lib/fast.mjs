// Fast mode — real time, no virtual clock: the same input script runs once while Chromium streams the window (CDP screencast, JPEG with
// timestamps). Frames arrive only when the screen changes, so they are resampled onto a 60 Hz grid per stage and analysed with OpenCV.
// Quick first look (≈ script length + analysis); NOT frame-exact: limited by the screen refresh and by what the PC can render in real time.
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {SCRIPTS, makeContext} from './script.mjs';
import {buildGrid, intervalsOf, summarizeIntervals} from './analysis.mjs';
import {newCapturePage} from './browser.mjs';
import {attachScriptScan, dragVerdict} from './evidence.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(6, '0');

export async function fastPass(browser, o, outDir) {
  const warnings = [];
  const {context, page} = await newCapturePage(browser, {width: o.width, height: o.height});
  const scan = o.script === 'drag' ? attachScriptScan(page) : null;
  page.on('pageerror', (e) => warnings.push('pageerror: ' + String(e.message).slice(0, 160)));
  await page.goto(o.url, {waitUntil: 'load', timeout: 90000});
  await page.waitForLoadState('networkidle', {timeout: 30000}).catch(() => warnings.push('networkidle 30 s 안에 오지 않음 — 계속 진행'));
  if (o.ready) await page.waitForFunction(o.ready, null, {timeout: 180000});
  await sleep(o.settleMs);
  await page.mouse.move(o.width / 2, o.height / 2);
  let evidence = null;
  if (o.script === 'drag') {   // gate: drag only where the page shows evidence for it
    await page.mouse.move(o.width * 0.4, o.height * 0.5);await page.mouse.move(o.width * 0.6, o.height * 0.5);
    if (o.enter) {const c = await page.evaluate((s) => window.__ecg.enterCandidates(s), o.enterSelector || null);if (c.length) {await page.mouse.click(c[0].x, c[0].y);await sleep(4000);}}
    evidence = {scripts: await scan.stop(), page: await page.evaluate(() => window.__ecg.interaction())};
    evidence.verdict = dragVerdict(evidence);
    if (evidence.verdict.verdict === 'none' && !o.force) {await context.close();return {skipped: true, evidence, warnings};}
  }

  const rawDir = join(outDir, 'frames', 'raw');
  mkdirSync(rawDir, {recursive: true});
  const cdp = await context.newCDPSession(page), times = [];
  cdp.on('Page.screencastFrame', (ev) => {
    const n = times.length;times.push(ev.metadata.timestamp * 1000);
    writeFileSync(join(rawDir, pad(n) + '.jpg'), Buffer.from(ev.data, 'base64'));
    cdp.send('Page.screencastFrameAck', {sessionId: ev.sessionId}).catch(() => {});
  });
  const log = {stages: [], events: []}, marks = [];
  const t0 = performance.now();
  // survey: long run → low-resolution, every 2nd compositor frame (energy only); full-resolution stills are taken separately
  const lite = o.script === 'survey';
  await cdp.send('Page.startScreencast', lite ? {format: 'jpeg', quality: 60, maxWidth: 960, maxHeight: 540, everyNthFrame: 2} : {format: 'jpeg', quality: 85, maxWidth: o.width, maxHeight: o.height, everyNthFrame: 1});
  const exec = {
    now: () => performance.now() - t0,
    onStage: (name) => {marks.push({name, t: Date.now()});},
    wait: (ms) => sleep(ms),
    wheel: (dy) => page.mouse.wheel(0, dy),
    move: (x, y) => page.mouse.move(x, y),
    progress: () => page.evaluate(() => window.__ecg.progress()),
    range: () => page.evaluate(() => window.__ecg.scroller().range),
    key: (k) => page.keyboard.press(k),
    resolve: (v) => page.evaluate((v) => window.__ecg.resolve(v), v),
    targets: (spec, n) => page.evaluate(([s, c]) => window.__ecg.targets(s, c), [spec, n]),
    viewport: () => page.evaluate(() => window.__ecg.viewport()),
    down: () => page.mouse.down(),
    up: () => page.mouse.up(),
    dragTarget: async () => (await page.evaluate(() => window.__ecg.dragTarget())) || (evidence?.verdict?.verdict && evidence.verdict.verdict !== 'none' ? {kind: 'viewport', x: Math.round(o.width / 2), y: Math.round(o.height / 2), w: o.width, h: o.height} : null),   // canvas not in the DOM (worker/shadow): drag the middle of the view, only when evidence exists
    async enter() {
      const c = await page.evaluate((s) => window.__ecg.enterCandidates(s), o.enterSelector || null);
      if (!c.length) return {clicked: false, reason: 'no entry button found'};
      await page.mouse.click(c[0].x, c[0].y);
      return {clicked: true, label: c[0].label, tag: c[0].tag};
    },
    async still(name) {mkdirSync(join(outDir, 'frames', 'stills'), {recursive: true});await page.screenshot({path: join(outDir, 'frames', 'stills', name + '.jpg'), type: 'jpeg', quality: 90});},
  };
  await SCRIPTS[o.script](makeContext(exec, log), {from: o.from, to: o.to, hover: o.hover, count: o.hoverCount, stops: o.stops, stopPx: o.stopPx, enter: o.enter && o.script !== 'drag'});
  const endT = Date.now();
  await sleep(200);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await context.close();

  const step = 1000 / 60;
  const ticks = buildGrid(times, marks, endT, step);
  const delivery = {};
  marks.forEach((m, k) => {
    const t1 = k + 1 < marks.length ? marks[k + 1].t : endT, ts = times.filter((t) => t >= m.t && t < t1);
    delivery[m.name] = {screencastFrames: ts.length, ...summarizeIntervals(intervalsOf(ts))};
  });
  if (!times.length) warnings.push('screencast 프레임을 받지 못함');
  return {ticks, times, marks, log, delivery, warnings, step, rawDir, evidence};
}
