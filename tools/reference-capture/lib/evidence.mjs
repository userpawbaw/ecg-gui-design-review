// Interaction evidence (read-only): which sites really have drag/orbit interaction, found from what the page loads and registers —
// never from guessing. Used to gate the drag script, so a press-and-move is only ever done on a site that shows evidence for it.
// Script bodies are scanned for library names and only counts are kept (no site code is stored).

const SCRIPT_PATTERNS = {
  orbit: /OrbitControls|TrackballControls|ArcballControls|DragControls|FlyControls|MapControls/g,
  draggable: /\bDraggable\b|InertiaPlugin|draggabilly|dragula|sortablejs|react-draggable|interact\.js/g,
  gesture: /use-gesture|hammerjs|Hammer\.js/gi,
  spline: /@splinetool|spline-viewer/g,
};

/** Count library hits in script responses; call stop() for {orbit, draggable, gesture, spline, scanned}. */
export function attachScriptScan(page, {maxBytes = 8e6} = {}) {
  const counts = {orbit: 0, draggable: 0, gesture: 0, spline: 0, scanned: 0}, pending = [];
  const note = (url) => {if (/splinetool|spline/i.test(url)) counts.spline++;};
  page.on('response', (r) => {
    const type = r.request().resourceType();
    note(r.url());
    if (type !== 'script' && !/javascript|wasm/.test(r.headers()['content-type'] || '')) return;
    pending.push((async () => {
      try {
        const len = Number(r.headers()['content-length'] || 0);
        if (len > maxBytes) return;
        const text = await r.text();
        counts.scanned++;
        for (const [k, re] of Object.entries(SCRIPT_PATTERNS)) {const m = text.match(re);if (m) counts[k] += m.length;}
      } catch {}
    })());
  });
  return {async stop() {await Promise.allSettled(pending);return counts;}};
}

/**
 * ev = {scripts: attachScriptScan result, page: window.__ecg.interaction()}. Verdict 'likely' | 'possible' | 'none' with reasons.
 * likely: orbit/drag library in the page's scripts, a grab cursor, draggable elements, or a press listener on a canvas.
 * possible: press listener on window/document/body together with a move listener there (or a Spline runtime).
 */
export function dragVerdict(ev) {
  const L = ev.page?.listeners || {}, has = (k) => (L[k] || 0) > 0, S = ev.scripts || {}, reasons = [];
  const downs = ['pointerdown', 'mousedown', 'touchstart'];
  if (S.orbit > 0) reasons.push(`orbit/drag controls in scripts (${S.orbit})`);
  if (S.draggable > 0) reasons.push(`draggable library in scripts (${S.draggable})`);
  if ((ev.page?.grabCursor || 0) > 0) reasons.push(`grab cursor on ${ev.page.grabCursor} element(s)`);
  if ((ev.page?.draggableAttr || 0) > 0) reasons.push(`[draggable=true] ×${ev.page.draggableAttr}`);
  for (const t of downs) if (has(t + '@canvas')) reasons.push(`${t} listener on a canvas`);
  if (reasons.length) return {verdict: 'likely', reasons};
  const globalDown = downs.some((t) => has(t + '@window') || has(t + '@document') || has(t + '@body')), globalMove = ['pointermove', 'mousemove'].some((t) => has(t + '@window') || has(t + '@document') || has(t + '@canvas'));
  if (S.spline > 0) reasons.push('Spline runtime (orbit/drag is on by default in viewers)');
  if (S.gesture > 0) reasons.push(`gesture library in scripts (${S.gesture})`);
  if (globalDown && globalMove) reasons.push('press and move listeners on window/document');
  return reasons.length ? {verdict: 'possible', reasons} : {verdict: 'none', reasons: ['no drag library, grab cursor, draggable element or press listener on a canvas']};
}
