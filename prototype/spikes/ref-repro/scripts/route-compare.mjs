// 12-frame route comparison for variant A (ref003.html, vanilla + GSAP) and B (ref003b.html, React components).
// Records the indicator's screen position per frame (reference behaviour: it stays near mid-screen).
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const out = new URL('../qa-output/route/', import.meta.url).pathname; await mkdir(out, {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const V = {A: {url: 'ref003.html', comp: '#travelComp', ind: '#indicator'}, B: {url: 'ref003b.html', comp: 'div.overflow-clip', ind: 'div.z-10'}};
const res = {};
for (const [k, v] of Object.entries(V)) {
  const p = await b.newPage({viewport: {width: 1600, height: 900}}); const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:4191/' + v.url); await p.waitForFunction(() => window.__repro?.ready && window.__lenis, null, {timeout: 120000}); await p.waitForTimeout(1500);
  const [top, h] = await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.top + scrollY, r.height]; }, v.comp);
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const y = top - 900 * 0.6 + (i / 11) * (h - 900 * 0.2);
    await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y); await p.waitForTimeout(900);
    const ind = await p.evaluate(sel => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null; }, v.ind);
    const f = `${k}-${String(i).padStart(2, '0')}.png`; await p.screenshot({path: out + f}); rows.push({i, scroll: Math.round(y), indicator: ind, f});
  }
  res[k] = {rows, errors: errs}; await p.close();
}
await b.close(); await writeFile(out + 'results.json', JSON.stringify(res, null, 1));
for (const [k, r] of Object.entries(res)) console.log(k, r.rows.map(x => x.indicator ? x.indicator[1] : null).join(' '), r.errors.slice(0, 2));
