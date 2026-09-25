// Headless shots of the attic spike at several scroll positions (SwiftShader: look only, no GPU timing).
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const out = new URL('../qa-output/', import.meta.url).pathname; await mkdir(out, {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const res = {shots: [], errors: []};
const p = await b.newPage({viewport: {width: 1600, height: 900}});
p.on('pageerror', e => res.errors.push(String(e))); p.on('console', m => m.type() === 'error' && res.errors.push(m.text()));
await p.goto('http://127.0.0.1:4192/' + (process.env.Q || '')); await p.waitForFunction(() => window.__attic?.ready !== undefined); await p.waitForTimeout(4000);
const [top, h] = await p.evaluate(() => { const r = document.getElementById('win').getBoundingClientRect(); return [r.top + scrollY, r.height]; });
for (const f of (process.env.PS || '0.3,0.5,0.7,0.9').split(',').map(Number)) {
  const y = top - 900 + f * (h + 900);
  await p.evaluate(y => window.__lenis.scrollTo(y, {immediate: true}), y); await p.evaluate(() => window.__renderOnce()); await p.waitForTimeout(400);
  const file = `attic-${String(f).replace('.', '_')}${process.env.TAG || ''}.png`; await p.screenshot({path: out + file});
  res.shots.push({p: await p.evaluate(() => window.__attic.p), file});
}
await b.close(); await writeFile(out + 'results.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res));
