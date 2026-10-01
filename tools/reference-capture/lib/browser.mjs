// Browser launch for the capture tool: headed Edge (real GPU) via the Playwright already installed in prototype/v2,
// falling back to Playwright Chromium. No certificate-check bypass flags (R-016): the user's PC trusts the sites normally.
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export function loadPlaywright() {
  return createRequire(join(root, 'prototype/v2/package.json'))('playwright');
}

/** Installed Microsoft Edge executable (Windows/macOS/Linux) or null — used by `npm run doctor` and as a launch pre-check. */
export function findEdge(env = process.env, platform = process.platform, exists = existsSync) {
  const c = platform === 'win32'
    ? [env['PROGRAMFILES(X86)'], env.PROGRAMFILES, env.LOCALAPPDATA].filter(Boolean).map((b) => join(b, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    : platform === 'darwin' ? ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'] : ['/opt/microsoft/msedge/msedge', '/usr/bin/microsoft-edge'];
  return c.find((p) => exists(p)) || null;
}

// Keep timers/rAF running even if another window covers the capture window, and keep wheel scrolling instant in the virtual-clock layer.
const BASE_ARGS = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];

export async function launchBrowser({browser = 'edge', extraArgs = []} = {}) {
  const {chromium} = loadPlaywright();
  const args = [...BASE_ARGS, ...extraArgs];
  const tries = browser === 'edge' ? [{label: 'edge', opts: {channel: 'msedge'}}, {label: 'chromium', opts: {}}] : [{label: 'chromium', opts: {}}];
  const warnings = [];
  for (const t of tries) {
    try {
      const b = await chromium.launch({...t.opts, headless: false, args});
      if (browser === 'edge' && t.label !== 'edge') warnings.push('Edge를 실행하지 못해 Playwright Chromium으로 대체함');
      return {browser: b, info: {requested: browser, used: t.label, version: b.version(), headed: true, launchArgs: args, executable: t.label === 'edge' ? findEdge() : chromium.executablePath()}, warnings};
    } catch (e) {
      warnings.push(`${t.label} 실행 실패: ${String(e.message).split('\n')[0]}`);
    }
  }
  throw new Error(`브라우저를 실행하지 못함. Edge 설치를 확인하거나 npm run browsers 후 --browser chromium\n  ${warnings.join('\n  ')}`);
}

/** Page-side hooks (installed before any site script runs): wheel counter, canvas context kinds, workers, WebGPU, rAF/long-task recorder. */
export const INIT_SCRIPT = `(() => {
  if (window.__ecg) return;
  const H = window.__ecg = {wheelCount: 0, contexts: [], workers: 0, offscreen: 0, webgpuAdapters: 0, raf: [], stages: [], longTasks: [], recording: false};
  addEventListener('wheel', () => { H.wheelCount++; }, {capture: true, passive: true});
  const seen = new WeakSet(), gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (!seen.has(this)) { seen.add(this); H.contexts.push({type: String(type), width: this.width, height: this.height, cls: String(this.className || '').slice(0, 60)}); }
    return gc.call(this, type, ...rest);
  };
  if (window.Worker) window.Worker = new Proxy(window.Worker, {construct(t, a, n) { H.workers++; return Reflect.construct(t, a, n); }});
  if (window.OffscreenCanvas) window.OffscreenCanvas = new Proxy(window.OffscreenCanvas, {construct(t, a, n) { H.offscreen++; return Reflect.construct(t, a, n); }});
  const toff = HTMLCanvasElement.prototype.transferControlToOffscreen;
  if (toff) HTMLCanvasElement.prototype.transferControlToOffscreen = function () { H.offscreen++; return toff.call(this); };
  if (navigator.gpu && navigator.gpu.requestAdapter) { const ra = navigator.gpu.requestAdapter.bind(navigator.gpu); navigator.gpu.requestAdapter = (...a) => { H.webgpuAdapters++; return ra(...a); }; }
  H.startRecording = () => {
    H.raf = []; H.recording = true;
    const tick = (t) => { if (!H.recording) return; H.raf.push(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) H.longTasks.push({start: e.startTime, dur: e.duration}); }).observe({type: 'longtask', buffered: false}); } catch {}
  };
  H.stopRecording = () => { H.recording = false; };
  H.mark = (name) => { H.stages.push({name, t: performance.now()}); try { console.timeStamp('ecg-stage:' + name); } catch {} };
  // scroll progress 0–1 of the page or of the largest inner scroller (Lenis wrappers, custom scroll containers)
  H.scroller = () => {
    const doc = document.scrollingElement || document.documentElement;
    let best = {el: doc, range: doc.scrollHeight - innerHeight};
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollHeight - el.clientHeight > best.range + 8 && el.clientHeight > innerHeight * 0.5) {
        const o = getComputedStyle(el).overflowY; if (o === 'auto' || o === 'scroll') best = {el, range: el.scrollHeight - el.clientHeight};
      }
    }
    return best;
  };
  H.progress = () => { const s = H.scroller(), top = s.el === (document.scrollingElement || document.documentElement) ? scrollY : s.el.scrollTop; return s.range > 0 ? top / s.range : NaN; };
  H.resolve = (v) => {
    if (typeof v === 'number') return v;
    const el = document.querySelector(v); if (!el) return NaN;
    const s = H.scroller(), top = s.el === (document.scrollingElement || document.documentElement) ? scrollY : s.el.scrollTop;
    return s.range > 0 ? Math.min(1, Math.max(0, (top + el.getBoundingClientRect().top) / s.range)) : NaN;
  };
})();`;

export async function newCapturePage(browser, {width = 1920, height = 1080, har = null} = {}) {
  const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1, ...(har ? {recordHar: {path: har, content: 'omit'}} : {})});
  await context.addInitScript({content: INIT_SCRIPT});
  const page = await context.newPage();
  return {context, page};
}

const SOFT = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;
export async function gpuInfo(browser) {
  const ctx = await browser.newContext({viewport: {width: 400, height: 300}});
  const page = await ctx.newPage();
  try {
    const g = await page.evaluate(() => {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return {webgl: false, webgpu: !!navigator.gpu};
      const e = gl.getExtension('WEBGL_debug_renderer_info');
      return {webgl: true, webgl2: gl instanceof WebGL2RenderingContext, webgpu: !!navigator.gpu, glVersion: gl.getParameter(gl.VERSION),
        vendor: e ? gl.getParameter(e.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)};
    });
    return {...g, software: g.webgl ? SOFT.test(`${g.renderer} ${g.vendor}`) : null};
  } finally {await ctx.close();}
}

/** Headless browser for rendering sheets (no window pops up). Same Edge → Chromium fallback. */
export async function launchHeadless() {
  const {chromium} = loadPlaywright();
  for (const opts of [{channel: 'msedge'}, {}]) {try {return await chromium.launch({...opts, headless: true});} catch {}}
  throw new Error('시트를 그릴 브라우저를 실행하지 못함 — npm run browsers');
}
