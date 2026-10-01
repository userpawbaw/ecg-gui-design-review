// Requests, assets, library detection and headline type specs (absorbs the old capture-site.mjs; HAR is optional via --har).
const ASSET_RE = /\.(glb|gltf|drc|ktx2|basis|hdr|exr|splinecode|mp4|webm|m3u8|woff2?|ttf|otf)(\?|$)/i;

/** Start logging responses; call stop() for the list. Sizes come from Playwright's request.sizes() (encoded body size). */
export function attachRequestLog(page) {
  const rows = [], pending = [];
  page.on('response', (r) => {
    const q = r.request();
    pending.push((async () => {
      let bytes = Number(r.headers()['content-length'] || 0);
      try {bytes = (await q.sizes()).responseBodySize || bytes;} catch {}
      rows.push({url: r.url().slice(0, 300), type: q.resourceType(), status: r.status(), mime: (r.headers()['content-type'] || '').split(';')[0], bytes});
    })());
  });
  return {async stop() {await Promise.allSettled(pending);return rows;}};
}

export function summarizeRequests(rows) {
  const byType = {};
  for (const r of rows) {const t = (byType[r.type] ||= {count: 0, bytes: 0});t.count++;t.bytes += r.bytes;}
  const assets = rows.filter((r) => ASSET_RE.test(r.url) || /^(font|media)$/.test(r.type));
  const hosts = {};for (const r of rows) {try {const h = new URL(r.url).host;hosts[h] = (hosts[h] || 0) + 1;} catch {}}
  return {totalRequests: rows.length, totalBytes: rows.reduce((s, r) => s + r.bytes, 0), byType, hosts, assets, scripts: rows.filter((r) => r.type === 'script').map((r) => ({url: r.url, bytes: r.bytes}))};
}

/** In-page detection. Everything is read-only. */
export function detectLibs(page) {
  return page.evaluate(() => {
    const w = window, doc = document, scripts = [...doc.scripts].map((s) => s.src).filter(Boolean);
    const lenisEl = doc.documentElement.classList.contains('lenis') || !!doc.querySelector('.lenis');
    const H = w.__ecg || {};
    return {
      three: w.__THREE__ || w.THREE?.REVISION || null,
      gsap: w.gsap?.version || null, scrollTrigger: !!w.ScrollTrigger, scrollTriggerVersion: w.ScrollTrigger?.version || null,
      lenis: !!(w.lenis || w.Lenis || lenisEl), lenisVersion: w.lenis?.version || w.Lenis?.version || null,
      spline: !!doc.querySelector('spline-viewer') || scripts.some((s) => /splinetool|spline/i.test(s)),
      webflow: !!w.Webflow || !!doc.querySelector('html[data-wf-site]'),
      barba: !!w.barba, locomotive: !!(w.LocomotiveScroll || doc.querySelector('[data-scroll-container]')), pixi: !!w.PIXI, p5: !!w.p5, d3: w.d3?.version || null,
      canvases: [...doc.querySelectorAll('canvas')].map((c) => ({w: c.width, h: c.height, cls: String(c.className || '').slice(0, 60)})),
      contextKinds: (H.contexts || []).reduce((a, c) => ({...a, [c.type]: (a[c.type] || 0) + 1}), {}),
      webgpuAdapterRequests: H.webgpuAdapters || 0, workers: H.workers || 0, offscreenCanvases: H.offscreen || 0,
      videos: [...doc.querySelectorAll('video')].map((v) => ({src: (v.currentSrc || v.src || '').slice(0, 200), playing: !v.paused, loop: v.loop, muted: v.muted, w: v.videoWidth, h: v.videoHeight})),
      cssAnimations: doc.getAnimations().length,
      docHeight: doc.documentElement.scrollHeight,
    };
  });
}

/** Headline/title type specs (D-044): family, size, weight, tracking, leading for the largest visible text blocks. */
export function detectFonts(page, limit = 8) {
  return page.evaluate((limit) => {
    const out = [], seen = new Set();
    for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,button,span,div,li')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight * 3) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
      if (own.length < 2) continue;
      const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      const key = `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.letterSpacing}`; if (seen.has(key)) continue; seen.add(key);
      out.push({tag: el.tagName.toLowerCase(), sample: own.slice(0, 32), family: s.fontFamily.slice(0, 80), sizePx: parseFloat(s.fontSize), weight: s.fontWeight, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, textTransform: s.textTransform});
    }
    return out.sort((a, b) => b.sizePx - a.sizePx).slice(0, limit);
  }, limit);
}

/** Elements to follow per frame (--track): geometry + opacity + transform, null when the selector matches nothing. */
export function sampleTracks(page, selectors) {
  return page.evaluate((sels) => sels.map((q) => {
    const el = document.querySelector(q); if (!el) return null;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return {x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), opacity: +Number(s.opacity).toFixed(4), transform: s.transform === 'none' ? null : s.transform};
  }), selectors);
}
