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
  const H = window.__ecg = {wheelCount: 0, moveCount: 0, contexts: [], workers: 0, offscreen: 0, webgpuAdapters: 0, raf: [], stages: [], longTasks: [], recording: false};
  // which interaction listeners the page registers (counts per event@target kind) — evidence for hover/drag, read-only
  const watched = new Set(['pointerdown', 'mousedown', 'touchstart', 'pointermove', 'mousemove', 'dragstart', 'wheel', 'pointerenter', 'mouseenter', 'mouseover', 'pointerover']);
  H.listeners = {};
  const kindOf = (t) => (t === window ? 'window' : t === document ? 'document' : t === document.body ? 'body' : (typeof HTMLCanvasElement !== 'undefined' && t instanceof HTMLCanvasElement) ? 'canvas' : (typeof Element !== 'undefined' && t instanceof Element) ? 'element' : 'other');
  const ael = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, ...rest) { if (watched.has(type)) { const k = type + '@' + kindOf(this); H.listeners[k] = (H.listeners[k] || 0) + 1; } return ael.call(this, type, ...rest); };
  addEventListener('wheel', () => { H.wheelCount++; }, {capture: true, passive: true});
  addEventListener('mousemove', () => { H.moveCount++; }, {capture: true, passive: true});
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
  // Hover candidates (read-only): visible interactive elements inside the viewport, outermost only, spread evenly in reading order.
  H.targets = (spec, n) => {
    const vw = innerWidth, vh = innerHeight;
    let els;
    if (spec === 'auto') {
      const sel = 'a[href],button,[role=button],[role=link],[onclick],summary,input[type=button],[tabindex]:not([tabindex="-1"])';
      const set = new Set(document.querySelectorAll(sel));
      let k = 0;
      for (const el of document.querySelectorAll('body *')) { if (++k > 4000) break; if (getComputedStyle(el).cursor === 'pointer') set.add(el); }
      els = [...set];
    } else {
      els = String(spec).split(',').map((q) => q.trim()).filter(Boolean).map((q) => document.querySelector(q)).filter(Boolean);
    }
    const info = (el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('alt') || '').trim().replace(/\\s+/g, ' ').slice(0, 24);
      return {el, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), t: Math.round(r.top), tag: el.tagName.toLowerCase(), label,
        ok: r.width >= 14 && r.height >= 14 && r.width * r.height <= 0.35 * vw * vh && r.left + r.width / 2 > 0 && r.left + r.width / 2 < vw && r.top + r.height / 2 > 0 && r.top + r.height / 2 < vh
          && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05 && cs.pointerEvents !== 'none'};
    };
    let c = els.map(info).filter((i) => i.ok);
    if (spec === 'auto') {
      const set = new Set(c.map((i) => i.el));
      c = c.filter((i) => { for (let p = i.el.parentElement; p; p = p.parentElement) if (set.has(p)) return false; return true; });   // outermost only
      c.sort((a, b) => a.t - b.t || a.l - b.l);
      if (c.length > n) c = Array.from({length: n}, (_, i) => c[Math.round(i * (c.length - 1) / Math.max(1, n - 1))]);
    } else c = c.slice(0, n);
    return c.map((i, k) => ({id: k + 1, x: i.x, y: i.y, w: i.w, h: i.h, l: i.l, t: i.t, tag: i.tag, label: i.label}));
  };
  H.viewport = () => ({w: innerWidth, h: innerHeight});
  H.interaction = () => {
    let grab = 0, k = 0;
    for (const el of document.querySelectorAll('body *')) { if (++k > 4000) break; const c = getComputedStyle(el).cursor; if (c === 'grab' || c === 'grabbing' || c === '-webkit-grab') grab++; }
    return {listeners: H.listeners, grabCursor: grab, draggableAttr: document.querySelectorAll('[draggable=true]').length, canvases: document.querySelectorAll('canvas').length};
  };
  // the biggest visible canvas (or a grab-cursor element): where a drag would act
  H.dragTarget = () => {
    const vw = innerWidth, vh = innerHeight; let best = null;
    for (const el of document.querySelectorAll('canvas, body *')) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 120 || r.height < 120 || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
      const isCanvas = el.tagName === 'CANVAS', grab = /grab/.test(cs.cursor);
      if (!isCanvas && !grab) continue;
      const vx = Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left)), vy = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
      const area = vx * vy; if (area < 120 * 120) continue;
      if (!best || area > best.area) best = {area, kind: grab ? 'grab' : 'canvas', x: Math.round(Math.max(0, r.left) + vx / 2), y: Math.round(Math.max(0, r.top) + vy / 2), w: Math.round(vx), h: Math.round(vy)};
    }
    return best;
  };
  // an entry/start gate: ONE visible, same-page button whose label says enter/start/…; the only click the tool ever makes (user decision 2026-10-01)
  H.enterCandidates = (sel) => {
    const re = /(enter|start|begin|launch|explore|discover|continue|입장|시작)/i, vw = innerWidth, vh = innerHeight, out = [];
    const reClass = /(^|[-_ ])(cta|enter|start|begin|launch)([-_ ]|$)/i;   // icon-only buttons (SVG labels) are recognised by class name, e.g. intro__cta
    for (const el of (sel ? document.querySelectorAll(sel) : document.querySelectorAll('button, a, [role=button], [onclick], div, span'))) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 24 || r.height < 14 || r.width > vw * 0.6 || r.height > vh * 0.4) continue;
      if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.3 || cs.pointerEvents === 'none') continue;
      let label = (el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\\s+/g, ' ');
      if (!label && typeof el.className === 'string') label = el.className.trim().slice(0, 40);
      if (!sel && (!label || label.length > 40 || !(re.test(label) || (typeof el.className === 'string' && reClass.test(el.className))))) continue;
      const tag = el.tagName.toLowerCase(), clickable = tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button' || el.hasAttribute('onclick') || cs.cursor === 'pointer';
      if (!clickable) continue;
      if (tag === 'a') { const h = el.getAttribute('href') || ''; try { const u = new URL(h, location.href); if (u.origin !== location.origin) continue; } catch { continue; } }
      out.push({x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), tag, label});
    }
    out.sort((a, b) => a.w * a.h - b.w * b.h);   // innermost (smallest) match first
    return out.slice(0, 3);
  };
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
