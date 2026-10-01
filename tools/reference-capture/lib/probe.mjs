// Probe mode — read-only look at a page: libraries, assets, fonts, interaction evidence (drag / hover listeners, grab cursors),
// entry-button candidates. No screenshots, no clicks. Decides whether a drag study makes sense for the site.
import {newCapturePage} from './browser.mjs';
import {attachScriptScan, dragVerdict} from './evidence.mjs';
import {attachRequestLog, detectFonts, detectLibs, summarizeRequests} from './info.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function probePass(browser, o) {
  const warnings = [];
  const {context, page} = await newCapturePage(browser, {width: o.width, height: o.height});
  page.on('pageerror', (e) => warnings.push('pageerror: ' + String(e.message).slice(0, 160)));
  const req = attachRequestLog(page), scan = attachScriptScan(page);
  await page.goto(o.url, {waitUntil: 'load', timeout: 90000});
  await page.waitForLoadState('networkidle', {timeout: 30000}).catch(() => warnings.push('networkidle 30 s 안에 오지 않음 — 계속 진행'));
  if (o.ready) await page.waitForFunction(o.ready, null, {timeout: 180000});
  await sleep(o.settleMs);
  await page.mouse.move(o.width * 0.4, o.height * 0.5);await page.mouse.move(o.width * 0.6, o.height * 0.5);await sleep(500);   // lets pointer-gated code register its listeners
  const libs = await detectLibs(page), fonts = await detectFonts(page);
  const evidence = {scripts: await scan.stop(), page: await page.evaluate(() => window.__ecg.interaction())};
  evidence.verdict = dragVerdict(evidence);
  const enter = await page.evaluate(() => window.__ecg.enterCandidates());
  const requests = summarizeRequests(await req.stop());
  await context.close();
  return {libs, fonts, requests, drag: evidence, enterCandidates: enter, warnings};
}
