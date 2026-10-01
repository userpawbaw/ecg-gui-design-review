// Unit tests for tools/reference-capture/lib (fake images, fake traces, fake executors) — no browser needed.
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {decodePng, encodePng} from '../tools/reference-capture/lib/png.mjs';
import {pixelDelta, activeWindow, analyzeTrace, curveStats, diffEnergy, findJumps, frameHash, intervalsOf, longTasksByStage, selectFrames, summarizeByStage, summarizeIntervals} from '../tools/reference-capture/lib/analysis.mjs';
import {SCRIPTS, makeContext} from '../tools/reference-capture/lib/script.mjs';
import {outName, parseArgs} from '../tools/reference-capture/lib/args.mjs';
import {compareHashes, trackCurves} from '../tools/reference-capture/lib/post.mjs';
import {pickForSheet} from '../tools/reference-capture/lib/sheet.mjs';
import {findEdge} from '../tools/reference-capture/lib/browser.mjs';

let n = 0;
const t = (name, fn) => {Promise.resolve(fn()).then(() => {n++;}, (e) => {console.error(`[reference-capture] FAIL ${name}\n`, e);process.exit(1);});};
const solid = (w, h, r, g, b) => {const data = new Uint8Array(w * h * 4);for (let i = 0; i < w * h; i++) {data[i * 4] = r;data[i * 4 + 1] = g;data[i * 4 + 2] = b;data[i * 4 + 3] = 255;}return {width: w, height: h, data};};
const paint = (img, x0, y0, x1, y1, v) => {for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {const i = (y * img.width + x) * 4;img.data[i] = img.data[i + 1] = img.data[i + 2] = v;}};

// Hand-filtered PNG: every row uses a different filter type (1 Sub, 2 Up, 3 Average, 4 Paeth) so the decoder's unfilter paths are checked against known pixels.
const filtered = (w, h, rgb) => {
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    const f = [0, 1, 2, 3, 4][y % 5];raw[y * (stride + 1)] = f;
    for (let x = 0; x < stride; x++) {
      const cur = rgb[y * stride + x], a = x >= 3 ? rgb[y * stride + x - 3] : 0, b = y ? rgb[(y - 1) * stride + x] : 0, c = x >= 3 && y ? rgb[(y - 1) * stride + x - 3] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
      raw[y * (stride + 1) + 1 + x] = (cur - pred) & 255;
    }
  }
  const png = encodePng({width: w, height: h, data: new Uint8Array(w * h * 4)});   // reuse signature/IHDR layout, then swap IDAT + colour type
  const ihdr = Buffer.from(png.subarray(8, 33));ihdr[8 + 9] = 2;   // colour type 2 (RGB)
  const chunk = (type, body) => {const head = Buffer.alloc(8);head.writeUInt32BE(body.length, 0);head.write(type, 4, 'latin1');return Buffer.concat([head, body, Buffer.alloc(4)]);};
  return Buffer.concat([png.subarray(0, 8), ihdr, chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};
t('png decode: Sub/Up/Average/Paeth filters reproduce the original pixels', () => {
  const w = 9, h = 10, rgb = Uint8Array.from({length: w * h * 3}, (_, i) => (i * 37 + (i >> 3) * 11) & 255);
  const img = decodePng(filtered(w, h, rgb));
  for (let i = 0; i < w * h; i++) assert.deepEqual([...img.data.subarray(i * 4, i * 4 + 4)], [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], 255]);
});

t('png round trip (RGBA encode → decode)', () => {
  const img = solid(6, 4, 10, 20, 30);img.data[(2 * 6 + 3) * 4] = 200;
  const back = decodePng(encodePng(img));
  assert.equal(back.width, 6);assert.equal(back.height, 4);assert.deepEqual([...back.data], [...img.data]);
  assert.throws(() => decodePng(Buffer.from('nope')), /not a PNG/);
});

t('diffEnergy: identical = 0; changed region shows only in its 3×3 cell; mean is scaled 0–255', () => {
  const a = solid(30, 30, 0, 0, 0), b = solid(30, 30, 0, 0, 0);
  assert.equal(diffEnergy(a, b, {stride: 1}).all, 0);
  paint(b, 0, 0, 10, 10, 90);   // exactly the top-left cell
  const d = diffEnergy(a, b, {stride: 1});
  assert.equal(d.regions[0], 90);assert.ok(d.regions.slice(1).every((v) => v === 0));
  assert.equal(d.all, 10);   // 1 of 9 cells × 90
  assert.throws(() => diffEnergy(a, solid(10, 10, 0, 0, 0)), /size mismatch/);
});

t('pixelDelta counts differing pixels and the largest channel step (rounding noise vs real change)', () => {
  const a = solid(10, 10, 5, 5, 5), b = solid(10, 10, 5, 5, 5);
  assert.deepEqual(pixelDelta(a, b), {count: 0, maxChannel: 0});
  b.data[0] = 6;b.data[4 * 7 + 1] = 9;
  assert.deepEqual(pixelDelta(a, b), {count: 2, maxChannel: 4});
});

t('frameHash is stable and sensitive to a single pixel', () => {
  const a = solid(8, 8, 5, 5, 5), b = solid(8, 8, 5, 5, 5);
  assert.equal(frameHash(a), frameHash(b));b.data[0] = 6;assert.notEqual(frameHash(a), frameHash(b));
});

t('selectFrames: 12 evenly spaced incl. first/last; short segments keep all', () => {
  const s = selectFrames(125, 12);
  assert.equal(s.length, 12);assert.equal(s[0], 0);assert.equal(s[11], 124);assert.ok(s.every((v, i) => i === 0 || v > s[i - 1]));
  assert.deepEqual(selectFrames(5, 12), [0, 1, 2, 3, 4]);assert.deepEqual(selectFrames(0, 12), []);
});

t('activeWindow trims idle lead/tail; null when nothing moves', () => {
  const e = [0, 0, 0, 0, 0, 5, 9, 8, 6, 0, 0, 0, 0, 0];
  assert.deepEqual(activeWindow(e, {pad: 1}), {start: 4, end: 9});
  assert.equal(activeWindow([0, 0, 0]), null);
});

t('findJumps flags a skipped-state spike but not smooth motion', () => {
  const smooth = Array.from({length: 40}, (_, i) => 2 + Math.sin(i / 6));
  assert.deepEqual(findJumps(smooth), []);
  const spiky = [...smooth];spiky[20] = 40;
  assert.deepEqual(findJumps(spiky).map((j) => j.index), [20]);
});

t('curveStats classifies ease-out / ease-in / linear and finds onset, t50 and overshoot', () => {
  const N = 61, f = (fn) => Array.from({length: N}, (_, i) => 100 * fn(i / (N - 1)));
  const out = curveStats(f((x) => 1 - (1 - x) ** 3), 1000 / 60), inn = curveStats(f((x) => x ** 3), 1000 / 60), lin = curveStats(f((x) => x), 1000 / 60);
  assert.equal(out.shape, 'ease-out');assert.equal(inn.shape, 'ease-in');assert.equal(lin.shape, 'linear');
  assert.ok(out.t50Frame < lin.t50Frame && lin.t50Frame < inn.t50Frame);
  assert.ok(out.peakVelocityFrame <= 2);
  const delayed = curveStats([0, 0, 0, 0, 10, 40, 80, 100, 100, 100, 100], 16);
  assert.equal(delayed.onsetFrame, 4);assert.equal(delayed.moving, true);
  assert.ok(curveStats([0, 50, 120, 100, 100, 100, 100], 16).overshoot > 0.15);
  assert.equal(curveStats([5, 5, 5, 5], 16).moving, false);assert.equal(curveStats([1, 2], 16), null);
});

t('summarizeIntervals counts dropped frames with a jitter margin', () => {
  const s = summarizeIntervals([16.6, 16.7, 16.8, 17, 33.4, 50, 16.7, 16.6]);
  assert.equal(s.count, 8);assert.equal(s.over16_7, 2);assert.equal(s.over33_3, 1);assert.equal(s.maxMs, 50);assert.ok(Math.abs(s.medianFps - 60) < 1);
  assert.deepEqual(summarizeIntervals([]), {count: 0});
});

t('summarizeByStage / analyzeTrace / longTasksByStage with a fake trace', () => {
  const ev = [
    {ph: 'M', name: 'thread_name', pid: 7, tid: 9, args: {name: 'CrRendererMain'}},
    {ph: 'I', name: 'TimeStamp', ts: 1000, args: {data: {message: 'ecg-stage:a'}}}, {ph: 'I', name: 'TimeStamp', ts: 101000, args: {data: {message: 'ecg-stage:b'}}},
    ...[1000, 17667, 34333, 51000, 67667, 101000, 151000].map((ts) => ({ph: 'I', name: 'DrawFrame', ts})),
    {ph: 'X', name: 'ThreadControllerImpl::RunTask', pid: 7, tid: 9, ts: 110000, dur: 80000},
    {ph: 'X', name: 'ThreadControllerImpl::RunTask', pid: 7, tid: 9, ts: 5000, dur: 3000},
    {ph: 'X', name: 'ThreadControllerImpl::RunTask', pid: 1, tid: 2, ts: 6000, dur: 90000},
  ];
  const a = analyzeTrace(ev);
  assert.equal(a.rendererFound, true);assert.deepEqual(a.stages.map((s) => s.name), ['a', 'b']);
  assert.equal(a.longTasks.length, 1);assert.equal(a.longTasks[0].durMs, 80);
  const per = summarizeByStage(a.drawFrames, a.stages, 200000, (x) => x / 1000);
  assert.equal(per.a.count, 4);assert.equal(per.b.count, 1);assert.equal(per.b.maxMs, 50);
  assert.deepEqual(longTasksByStage(a.longTasks, a.stages, 200000), {a: 0, b: 1});
  assert.deepEqual(intervalsOf([0, 16, 33]), [16, 17]);
});

t('scripts: standard keeps the D-017 order and totals; context logs identical shape for any executor', async () => {
  const log = {stages: [], events: []};let now = 0;
  const exec = {now: () => now, wait: async (ms) => {now += ms;}, wheel: async () => {}, progress: () => 0, resolve: (v) => v};
  await SCRIPTS.standard(makeContext(exec, log));
  assert.deepEqual(log.stages.map((s) => s.name), ['1-idle', '2-notches', '3-continuous', '4-idle', '5-fast', '6-idle', '7-back']);
  assert.equal(log.events.filter((e) => e.stage === '2-notches').length, 3);
  assert.equal(log.events.filter((e) => e.stage === '5-fast').reduce((s, e) => s + e.deltaY, 0), 1200);
  assert.equal(log.events.at(-1).deltaY, -300);
  assert.ok(Math.abs(now - 11350) < 1, `total ${now} ms`);   // 2000 + 3×700 + 20×100 + 2000 + 0.25 s + 1500 + 1500
});

t('scripts: transition approaches --from, then passes in 2.5 s segments until --to', async () => {
  let progress = 0;const log = {stages: [], events: []};let now = 0;
  const exec = {now: () => now, wait: async (ms) => {now += ms;}, wheel: async (dy) => {progress = Math.min(1, progress + dy / 4000);}, progress: () => progress, resolve: (v) => v};
  await SCRIPTS.transition(makeContext(exec, log), {from: 0.18, to: 0.3});
  assert.ok(progress >= 0.3 && progress < 0.34, `progress ${progress}`);
  assert.equal(log.stages[0].name, '0-approach');assert.ok(log.stages.some((s) => s.name === 'pass-01'));assert.equal(log.stages.at(-1).name, 'end-idle');
  const pass = log.events.filter((e) => e.stage.startsWith('pass-'));assert.ok(pass.length >= 4 && pass.every((e) => e.deltaY === 100));
  // unreadable progress (NaN) must not loop forever
  const nanExec = {...exec, progress: () => NaN};const l2 = {stages: [], events: []};await SCRIPTS.transition(makeContext(nanExec, l2), {from: 0.1, to: 0.2});
  assert.equal(l2.events.length, 0);
});

t('args: url/story, options, validation, output folder name', () => {
  const a = parseArgs(['https://oryzo.ai', '--mode', 'frames', '--track=.a,.b', '--max-frames', '90']);
  assert.equal(a.mode, 'frames');assert.deepEqual(a.track, ['.a', '.b']);assert.equal(a.maxFrames, 90);assert.equal(a.isStory, false);assert.equal(a.url, 'https://oryzo.ai/');
  const s = parseArgs(['story', '--mode', 'trace']);assert.equal(s.isStory, true);assert.equal(s.url, 'http://127.0.0.1:5173/');
  const tr = parseArgs(['atmos.leeroy.ca', '--script', 'transition', '--from', '0.18', '--to', '.section-b']);
  assert.equal(tr.from, 0.18);assert.equal(tr.to, '.section-b');assert.equal(tr.url, 'https://atmos.leeroy.ca/');
  assert.throws(() => parseArgs([]), /사용법/);assert.throws(() => parseArgs(['story', '--mode', 'x']), /--mode/);
  assert.throws(() => parseArgs(['story', '--script', 'transition']), /--from/);assert.throws(() => parseArgs(['story', '--bogus']), /알 수 없는/);
  assert.equal(outName(a, new Date(2026, 8, 30, 7, 5)), 'oryzo.ai-20260930-0705');assert.equal(outName(s, new Date(2026, 8, 30, 7, 5)), 'story-20260930-0705');
});

t('compareHashes reports mismatching frame positions', () => {
  const h = (a) => a.map((x) => ({hash: x}));
  assert.deepEqual(compareHashes(h(['a', 'b', 'c']), h(['a', 'b', 'c'])), {compared: 3, identical: 3, mismatches: []});
  assert.deepEqual(compareHashes(h(['a', 'b', 'c']), h(['a', 'x', 'y', 'z'])), {compared: 3, identical: 1, mismatches: [1, 2]});
});

t('trackCurves: per stage and selector, only moving properties; missing selector reported', () => {
  const rows = Array.from({length: 40}, (_, i) => ({stage: 's', i, vt: i * 16, values: [{x: 100 * (1 - (1 - i / 39) ** 3), y: 5, w: 10, h: 10, opacity: 1, transform: null}, null]}));
  const c = trackCurves(rows, ['.a', '.gone'], 16).s;
  assert.deepEqual(Object.keys(c['.a']), ['x']);assert.equal(c['.a'].x.shape, 'ease-out');assert.deepEqual(c['.gone'], {found: false});
});

t('pickForSheet: moving part of a mostly idle stage, else the whole stage; always 12 frames', () => {
  const mk = (e) => ({frames: e.map((v, i) => ({i, vt: i * 16, all: v})), activeWindow: null});
  const idle = Array.from({length: 120}, (_, i) => (i >= 50 && i < 90 ? 5 : 0)), st = mk(idle);
  st.activeWindow = activeWindow(idle);
  const a = pickForSheet(st);assert.equal(a.frames.length, 12);assert.ok(a.frames[0].i >= 48 && a.frames[11].i <= 91, a.note);
  const busy = mk(Array.from({length: 120}, () => 3));busy.activeWindow = activeWindow(busy.frames.map((f) => f.all));
  const b = pickForSheet(busy);assert.equal(b.frames[0].i, 0);assert.equal(b.frames[11].i, 119);
});

t('findEdge looks in the standard Windows install folders only', () => {
  const env = {'PROGRAMFILES(X86)': 'C:/PF86', PROGRAMFILES: 'C:/PF', LOCALAPPDATA: 'C:/L'};
  const slash = (p) => p.split(String.fromCharCode(92)).join('/');   // path.join gives backslashes on Windows, slashes elsewhere
  assert.equal(slash(findEdge(env, 'win32', (p) => slash(p).endsWith('PF86/Microsoft/Edge/Application/msedge.exe'))), 'C:/PF86/Microsoft/Edge/Application/msedge.exe');
  assert.equal(findEdge(env, 'win32', () => false), null);
});

process.on('exit', (c) => {if (c === 0) console.log(`[reference-capture] PASS — ${n} unit tests (png, diff energy, frame selection, jumps, curves, trace summary, scripts, args, sheets, edge lookup)`);});
