// Idle indicator behaviour over time (12 shots, ~170 ms apart) for variants A and B — the reference fires 3 expanding rings every 2 s.
import {chromium} from '@playwright/test';
const out = new URL('../qa-output/route/', import.meta.url).pathname;
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
for (const [k, url, comp, ind] of [['A', 'ref003.html', '#travelComp', '#indicator'], ['B', 'ref003b.html', 'div.overflow-clip', 'div.z-10']]) {
  const p = await b.newPage({viewport: {width: 1600, height: 900}});
  await p.goto('http://127.0.0.1:4191/' + url); await p.waitForFunction(() => window.__repro?.ready && window.__lenis); await p.waitForTimeout(1200);
  const top = await p.evaluate(sel => document.querySelector(sel).getBoundingClientRect().top + scrollY, comp);
  await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), top + 900); await p.waitForTimeout(1500);
  const r = await p.evaluate(sel => { const q = document.querySelector(sel).getBoundingClientRect(); return {x: q.left + q.width / 2, y: q.top + q.height / 2}; }, ind);
  for (let i = 0; i < 12; i++) { await p.screenshot({path: `${out}S${k}-${String(i).padStart(2, '0')}.png`, clip: {x: r.x - 80, y: r.y - 80, width: 160, height: 160}}); await p.waitForTimeout(170); }
  await p.close();
}
await b.close();
