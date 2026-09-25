/* Reference capture HUD — paste into the browser DevTools console on the reference page
   (or save as a bookmarklet). Shows scroll input on screen so a recording captures it.
   Read-only: it only listens to events and draws a small fixed overlay. Remove: reload the page. */
(() => {
  if (window.__refHud) return;
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;pointer-events:none;' +
    'font:12px/1.35 ui-monospace,Consolas,monospace;color:#fff;background:rgba(0,0,0,.72);' +
    'padding:8px 10px;border-radius:8px;min-width:230px;white-space:pre';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:8px;margin-top:6px;background:#333;border-radius:4px;overflow:hidden';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0;background:#4fd1ff';
  bar.appendChild(fill);
  const text = document.createElement('div');
  el.append(text, bar);
  (document.body || document.documentElement).appendChild(el);
  const t0 = performance.now();
  let wheelCount = 0, lastWheel = -1e9, lastDelta = 0, keyLabel = '', lastKey = -1e9;
  let prevY = scrollY, prevT = performance.now(), vel = 0;
  addEventListener('wheel', e => { wheelCount++; lastWheel = performance.now(); lastDelta = e.deltaY; }, {passive: true, capture: true});
  addEventListener('keydown', e => { keyLabel = e.key; lastKey = performance.now(); }, {capture: true});
  const tick = now => {
    const dt = Math.max(1, now - prevT), y = scrollY;
    vel = (y - prevY) / dt * 1000; prevY = y; prevT = now;
    const wheelOn = now - lastWheel < 120, keyOn = now - lastKey < 250;
    const doc = document.documentElement.scrollHeight - innerHeight;
    text.textContent =
      `t        ${((now - t0) / 1000).toFixed(2)} s\n` +
      `WHEEL    ${wheelOn ? '■ ' + (lastDelta > 0 ? '▼' : '▲') + ' ' + Math.abs(lastDelta).toFixed(0) : '·'}   #${wheelCount}\n` +
      `KEY      ${keyOn ? '■ ' + keyLabel : '·'}\n` +
      `scrollY  ${y.toFixed(0)} / ${doc.toFixed(0)}\n` +
      `velocity ${vel.toFixed(0)} px/s`;
    el.style.outline = wheelOn || keyOn ? '2px solid #4fd1ff' : 'none';
    fill.style.width = (doc > 0 ? 100 * y / doc : 0) + '%';
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__refHud = el;
})();
