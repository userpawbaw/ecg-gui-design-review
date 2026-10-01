// Layer A — designed motion on a virtual clock. Playwright Clock freezes Date / performance.now / timers / requestAnimationFrame;
// we advance it one frame (16 ms: the clock's rAF grid, one rAF per step) at a time and screenshot after each step, so the sequence is
// a complete frame-by-frame record independent of the PC's speed.
// The clock is frozen BEFORE the page starts and moved only by us, so the page's age at the first captured frame is a fixed number of
// steps rather than the varying real load time (the first version let the clock run during load: 0/60 identical frames on our own app).
// CSS transitions/animations and Web Animations are NOT driven by the clock (verified: they keep running in real time while it is
// paused), so after each step we pause them and set currentTime from the virtual clock (SYNC_ANIMATIONS).
// <video>, Web Workers and OffscreenCanvas are reported as untrusted, not corrected.
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {SCRIPTS, makeContext} from './script.mjs';
import {attachRequestLog, detectFonts, detectLibs, sampleTracks, summarizeRequests} from './info.mjs';
import {newCapturePage} from './browser.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n, w = 4) => String(n).padStart(w, '0');

// Runs inside the page after every clock step and right after each wheel notch (a wheel handler creates animations between steps).
// A newly seen animation starts at virtual age 0 (its real elapsed time is meaningless) and is then driven by virtual time.
const SYNC_ANIMATIONS = `async (vt) => {
  const S = (window.__ecgAnim ||= {map: new WeakMap(), seen: 0, max: 0, driven: 0, infinite: 0});
  const list = document.getAnimations(); S.max = Math.max(S.max, list.length);
  const fresh = [];
  for (const a of list) {
    if (a.timeline !== document.timeline) continue;   // scroll-driven timelines follow the scroll position, leave them
    if (S.map.has(a)) continue;
    const r = {v0: vt, c0: 0, rate: a.playbackRate, ours: false};
    if (a.playState === 'running' || a.playState === 'pending') { a.pause(); r.ours = true; S.driven++; fresh.push(a); }
    S.map.set(a, r); S.seen++;
    try { if (a.effect.getComputedTiming().iterations === Infinity) S.infinite++; } catch {}
  }
  // a pause() stays pending until the next real frame; setting currentTime before it completes lets the real timeline leak back in
  if (fresh.length) await Promise.all(fresh.map((a) => a.ready.catch(() => {})));
  for (const a of list) { const r = S.map.get(a); if (r && r.ours) a.currentTime = r.c0 + (vt - r.v0) * r.rate; }
  return list.length;
}`;

// Clock epoch: 2026-ish ms. Date.now() under the frozen clock is exactly this + the time we advance, identical every run.
const CLOCK_EPOCH = 1790000000000;

// Two run-dependent offsets of Playwright's clock are removed here (installed AFTER clock.install so it wraps the clock's functions):
//  1. performance.now() = fake ticks + the REAL time between page time-origin and script start (2–5 ms, differs per run) while Date.now() is exact
//     → performance.now is pinned to Date.now() (0 at the freeze point).
//  2. the clock's own requestAnimationFrame fires on a tick grid carrying that same offset, so rAF-driven motion shifted by up to 0.5 px between runs
//     → rAF is replaced by a queue that WE flush once per step (window.__ecgFlushRaf) with timestamp = virtual time. Callbacks queued during a flush
//     run in the next step, like a browser.
const pinTimeScript = (originMs) => `(() => {
  const origin = ${originMs}, nowFn = () => Date.now() - origin;
  Object.defineProperty(performance, 'now', {value: nowFn, configurable: true, writable: true});
  let id = 0, queue = [];
  window.requestAnimationFrame = (cb) => { queue.push({id: ++id, cb}); return id; };
  window.cancelAnimationFrame = (i) => { queue = queue.filter((q) => q.id !== i); };
  window.__ecgFlushRaf = () => {
    const run = queue; queue = []; const t = nowFn();
    for (const q of run) { try { q.cb(t); } catch (e) { (window.reportError || console.error)(e); } }
    return run.length;
  };
})();`;

class StopScript extends Error {}

/**
 * One virtual-clock pass. save: {dir} writes frames/<stage>/NNNN.png; memoryFrames keeps screenshots in memory (determinism pass);
 * stopAfter ends the script after that many captured frames. Returns {frames, shots, log, info, warnings, tracks, anim, ...}.
 * Frame times (vt) are virtual ms since the end of the load/settle stage (script start).
 */
export async function framesPass(browser, o, {save = null, stopAfter = Infinity, collectInfo = false, har = null, memoryFrames = false, onProgress = null} = {}) {
  const warnings = [], t0 = Date.now();
  const {context, page} = await newCapturePage(browser, {width: o.width, height: o.height, har});
  page.on('pageerror', (e) => warnings.push('pageerror: ' + String(e.message).slice(0, 160)));
  const reqLog = collectInfo ? attachRequestLog(page) : null;

  let vt = 0, inflight = 0, lastNetVt = 0;   // vt = virtual ms since the clock was frozen (page start)
  const ignore = (r) => /^(websocket|eventsource|media)$/.test(r.resourceType());
  page.on('request', (r) => {if (!ignore(r)) {inflight++;lastNetVt = vt;}});
  page.on('requestfinished', (r) => {if (!ignore(r)) {inflight = Math.max(0, inflight - 1);lastNetVt = vt;}});
  page.on('requestfailed', (r) => {if (!ignore(r)) {inflight = Math.max(0, inflight - 1);lastNetVt = vt;}});
  await page.clock.install({time: CLOCK_EPOCH});
  await page.clock.pauseAt(CLOCK_EPOCH + 16);   // frozen before any page script runs
  await context.addInitScript({content: pinTimeScript(CLOCK_EPOCH + 16)});
  await context.addInitScript({content: pinTimeScript(CLOCK_EPOCH + 16)});
  await page.goto(o.url, {waitUntil: 'load', timeout: 90000});

  const syncAnims = () => page.evaluate(`(${SYNC_ANIMATIONS})(${vt})`);
  // 60 fps on an integer-ms clock: cumulative rounding gives steps of 17, 17, 16 ms (average 16.667)
  let steps = 0;
  const tick = async () => {
    const target = Math.round(++steps * o.step);
    await page.clock.runFor(target - vt);vt = target;   // timers due in this step
    await page.evaluate(`window.__ecgFlushRaf()`);       // then the page's animation frame, once
    await syncAnims();
  };
  // Network barrier: requests started by a step are finished before the next step, so "which step does the texture arrive in" is the same every run.
  // A request that never ends (long poll, stream) would stall every step: after one 1 s timeout the barrier switches itself off and says so.
  let barrierOff = false;
  const barrier = async () => {
    if (barrierOff) return;
    let k = 0;for (; inflight > 0 && k < 500; k++) await sleep(2);
    if (inflight > 0) {barrierOff = true;warnings.push(`진행 중 요청 ${inflight}개가 1 s 안에 끝나지 않아 네트워크 장벽을 끔 — 이후 단계는 비동기 완료 시점에 따라 흔들릴 수 있음`);}
  };
  const isReady = async () => !o.ready || !!(await page.evaluate(`!!(${o.ready})`).catch(() => false));
  // load stage 1 — clock stays frozen: wait in REAL time for the page's own asynchronous loading (fetch, decode) to finish. When the page needs no
  // timers/rAF to get ready, it becomes ready at the same virtual instant (0) on every run, whatever the real load time was.
  const loadStart = Date.now();let ready = false, quietSince = Date.now(), lastSeen = 0;
  for (; Date.now() - loadStart < 20000;) {
    if (inflight > 0 || lastNetVt !== lastSeen) {quietSince = Date.now();lastSeen = lastNetVt;}
    await syncAnims().catch(() => {});   // CSS keeps running in real time while the clock is frozen: pin animations to age 0 as soon as they appear
    ready = await isReady();
    if (ready && inflight === 0 && Date.now() - quietSince >= 1500) break;
    await sleep(100);
  }
  // load stage 2 — only if the page could not get ready with a frozen clock (it needs timers/rAF to boot): step with the barrier until ready
  let gaveUp = false, stepped = 0;
  if (!ready) {
    for (; Date.now() - loadStart < 90000; stepped++) {await tick();await barrier();ready = await isReady();if (ready && inflight === 0) break;await sleep(2);}
    gaveUp = !ready;
  }
  if (stepped) warnings.push(`페이지가 시계를 멈춘 채로는 준비되지 않아(타이머·rAF 필요) ${stepped}단계(가상 ${Math.round(stepped * o.step)} ms) 진행해서 준비시킴 — 이 경우 준비 시각이 비동기 완료 시점에 달려 결정성이 1–2프레임 흔들릴 수 있음`);
  if (gaveUp) warnings.push(`로드 단계가 90 s 안에 준비되지 않음(ready=${o.ready}, 진행 중 요청 ${inflight}) — 그대로 진행`);
  const loadFrozenMs = Date.now() - loadStart;
  for (let k = 0, n = Math.round(o.settleMs / o.step); k < n; k++) {await tick();await barrier();await sleep(1);}
  let info = null;
  if (collectInfo) {
    info = {libs: await detectLibs(page), fonts: await detectFonts(page)};
    info.requests = summarizeRequests(await reqLog.stop());
  }
  await page.mouse.move(o.width / 2, o.height / 2);
  const probe = o.probe ? await page.evaluate(o.probe).catch((e) => ({error: String(e.message).slice(0, 120)})) : null;   // page state at script start (debugging determinism)
  const loadMs = Date.now() - t0, loadVt = vt;

  const log = {stages: [], events: []}, frames = [], shots = [], tracks = [];
  const state = {stage: '', stageIdx: 0, wheelSent: 0, truncated: new Set(), wheelTimeouts: 0, total: 0};
  const rel = () => vt - loadVt;   // script time starts at 0 when capture starts
  const ext = 'png';
  if (save) mkdirSync(save.dir, {recursive: true});
  const frame = async () => {
    await tick();await barrier();state.total++;
    if (state.stageIdx >= o.maxFrames) {state.truncated.add(state.stage);return;}
    const rec = {stage: state.stage, i: state.stageIdx++, vt: rel()};
    if (save) {
      mkdirSync(join(save.dir, rec.stage), {recursive: true});
      rec.file = `${rec.stage}/${pad(rec.i)}.${ext}`;
      await page.screenshot({path: join(save.dir, rec.file), type: 'png'});
    } else if (memoryFrames) shots.push(await page.screenshot({type: 'png'}));
    frames.push(rec);
    if (onProgress && frames.length % 100 === 0) onProgress(frames.length, rec.stage);
    if (o.track.length) tracks.push({stage: rec.stage, i: rec.i, vt: rec.vt, values: await sampleTracks(page, o.track)});
    if (frames.length >= stopAfter) throw new StopScript();
  };
  const exec = {
    now: rel,
    onStage: (name) => {state.stage = name;state.stageIdx = 0;},
    async wait(ms) {const n = ms > 0 ? Math.max(1, Math.round(ms / o.step)) : 0;for (let k = 0; k < n; k++) await frame();},
    async wheel(dy) {
      state.wheelSent++;
      await page.mouse.wheel(0, dy);
      let ok = false;   // the page has seen the event before the clock moves on → same order every run
      for (let k = 0; k < 100 && !ok; k++) {ok = await page.evaluate((n) => window.__ecg.wheelCount >= n, state.wheelSent);if (!ok) await sleep(10);}
      if (!ok) state.wheelTimeouts++;
      await syncAnims();
      await sleep(o.wheelSettleMs);   // native (compositor) scrolling reaches the main thread asynchronously
    },
    progress: () => page.evaluate(() => window.__ecg.progress()),
    resolve: (v) => page.evaluate((v) => window.__ecg.resolve(v), v),
  };
  try {
    await SCRIPTS[o.script](makeContext(exec, log), {from: o.from, to: o.to});
  } catch (e) {
    if (!(e instanceof StopScript)) throw e;
  }
  if (state.wheelTimeouts) warnings.push(`휠 이벤트 ${state.wheelTimeouts}회가 페이지에서 확인되지 않음(1 s 대기 초과)`);
  for (const s of state.truncated) warnings.push(`구간 ${s}: ${o.maxFrames}프레임에서 캡처 중단(--max-frames) — 이후는 시계만 진행`);
  const anim = await page.evaluate(() => ({seen: window.__ecgAnim?.seen || 0, driven: window.__ecgAnim?.driven || 0, infinite: window.__ecgAnim?.infinite || 0, maxConcurrent: window.__ecgAnim?.max || 0}));
  if (anim.infinite) warnings.push(`무한 반복 CSS 애니메이션 ${anim.infinite}개 — 가상 시각으로 구동됨(페이지 시작 = 나이 0)`);
  const late = await detectLibs(page);   // workers / videos / canvases appear after interaction too
  if (collectInfo) info.libsAfter = {videos: late.videos, workers: late.workers, offscreenCanvases: late.offscreenCanvases, contextKinds: late.contextKinds, canvases: late.canvases};
  if (late.videos.length) warnings.push(`<video> ${late.videos.length}개 — 가상 시계와 무관하게 재생됨: 영상이 보이는 구간은 A층 신뢰 불가`);
  if (late.workers) warnings.push(`Web Worker ${late.workers}개 생성 — 시계가 적용되지 않음`);
  if (late.offscreenCanvases) warnings.push(`OffscreenCanvas ${late.offscreenCanvases}개 — 시계가 적용되지 않음`);
  await context.close();
  return {frames, shots, log, info, warnings, tracks, anim, probe, loadMs, loadFrozenMs, loadVirtualMs: loadVt, totalSteps: state.total, virtualMs: rel(), ext};
}
