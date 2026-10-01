// Layer B — real performance. Same input script, real time, no virtual clock. Chromium trace (compositor DrawFrame events,
// long tasks, console.timeStamp stage marks) plus an in-page requestAnimationFrame recorder to cross-check the trace.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {SCRIPTS, makeContext} from './script.mjs';
import {analyzeTrace, intervalsOf, longTasksByStage, summarizeByStage, summarizeIntervals} from './analysis.mjs';
import {newCapturePage} from './browser.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CATEGORIES = ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'blink.user_timing', 'benchmark', 'viz'];

export async function tracePass(browser, o, gpu, outDir) {
  const warnings = [];
  const {context, page} = await newCapturePage(browser, {width: o.width, height: o.height});
  page.on('pageerror', (e) => warnings.push('pageerror: ' + String(e.message).slice(0, 160)));
  await page.goto(o.url, {waitUntil: 'load', timeout: 90000});
  await page.waitForLoadState('networkidle', {timeout: 30000}).catch(() => warnings.push('networkidle 30 s 안에 오지 않음 — 계속 진행'));
  if (o.ready) await page.waitForFunction(o.ready, null, {timeout: 180000});
  await sleep(o.settleMs);
  await page.mouse.move(o.width / 2, o.height / 2);

  const tracePath = join(outDir, 'trace.json'), log = {stages: [], events: []};
  const t0 = performance.now();
  await browser.startTracing(page, {path: tracePath, categories: CATEGORIES});
  await page.evaluate(() => window.__ecg.startRecording());
  const exec = {
    now: () => performance.now() - t0,
    onStage: (name) => page.evaluate((n) => window.__ecg.mark(n), name),
    wait: (ms) => sleep(ms),
    wheel: (dy) => page.mouse.wheel(0, dy),
    progress: () => page.evaluate(() => window.__ecg.progress()),
    resolve: (v) => page.evaluate((v) => window.__ecg.resolve(v), v),
  };
  await SCRIPTS[o.script](makeContext(exec, log), {from: o.from, to: o.to});
  const rec = await page.evaluate(() => {window.__ecg.stopRecording();return {raf: window.__ecg.raf, stages: window.__ecg.stages, longTasks: window.__ecg.longTasks, end: performance.now()};});
  await browser.stopTracing();
  await context.close();

  const marks = rec.stages.map((s) => ({name: s.name, t: s.t}));
  const raf = {overall: summarizeIntervals(intervalsOf(rec.raf)), stages: summarizeByStage(rec.raf, marks, rec.end)};
  let trace = null;
  try {
    const parsed = JSON.parse(readFileSync(tracePath, 'utf8')), events = Array.isArray(parsed) ? parsed : parsed.traceEvents;
    const a = analyzeTrace(events), endUs = (a.drawFrames.at(-1) ?? 0) + 1;
    trace = {
      eventCount: events.length, rendererMainFound: a.rendererFound, stageMarksFound: a.stages.length,
      drawFrame: {overall: summarizeIntervals(intervalsOf(a.drawFrames).map((x) => x / 1000)), stages: a.stages.length ? summarizeByStage(a.drawFrames, a.stages, endUs, (x) => x / 1000) : null},
      longTasks: {total: a.longTasks.length, over50ms: a.longTasks, byStage: a.stages.length ? longTasksByStage(a.longTasks, a.stages, endUs) : null},
    };
    if (!a.drawFrames.length) warnings.push('추적에 DrawFrame 이벤트가 없음 — 프레임 간격은 rAF 기록 기준만 유효');
    if (!a.stages.length) warnings.push('추적에 구간 표식(console.timeStamp)이 없음 — 추적 구간별 값 없음, rAF 기록으로 구간 분리');
  } catch (e) {warnings.push('추적 JSON 해석 실패: ' + String(e.message).slice(0, 120));}

  const pageLong = rec.longTasks.filter((l) => l.dur >= 50);
  const summary = {
    layer: 'B (real time, no virtual clock)', gpu, input: log,
    verdict: gpu.software === true ? '성능 판단 불가 — WebGL이 소프트웨어 렌더(SwiftShader 등)로 그려짐' : gpu.software === false ? '실제 GPU 렌더: 이 PC에서의 값으로 유효(전시 PC 성능과는 별개)' : 'WebGL 컨텍스트를 만들지 못해 GPU 판정 불가',
    rafRecorder: {...raf, longTasksOver50ms: pageLong.length}, trace, warnings,
    notes: ['rAF 기록은 화면 주사율(Hz)에 묶임: 중앙값 간격이 16.7 ms면 60 Hz 화면', '16.7 / 33.3 ms 초과 개수는 1 ms 지터 여유를 둔 값'],
  };
  writeFileSync(join(outDir, 'perf-summary.json'), JSON.stringify(summary, null, 1), 'utf8');
  return {summary, log, warnings};
}
