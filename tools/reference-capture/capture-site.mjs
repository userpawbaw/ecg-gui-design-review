// Run on YOUR PC (normal internet) when this cloud session cannot reach a reference site.
// Captures what the analysis needs without manual work:
//   network HAR (every JS/asset request, with bodies), detected libraries, asset inventory,
//   screenshots at scroll steps and a video. Output: ./capture-<host>-<date>/ → zip and upload.
// Setup once:  npm i -D @playwright/test && npx playwright install chromium
// Run:         node capture-site.mjs https://www.moto-card.com/ [--headed]
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';

const url = process.argv[2];
if (!url) { console.error('usage: node capture-site.mjs <url> [--headed]'); process.exit(1); }
const headed = process.argv.includes('--headed');
const out = `capture-${new URL(url).host}-${new Date().toISOString().slice(0, 10)}`;
await mkdir(out, {recursive: true});

const browser = await chromium.launch({headless: !headed});
const context = await browser.newContext({
  viewport: {width: 1920, height: 1080},
  recordHar: {path: `${out}/network.har`, content: 'embed'},
  recordVideo: {dir: out, size: {width: 1920, height: 1080}},
});
const page = await context.newPage();
const requests = [];
page.on('response', async r => {
  const q = r.request();
  requests.push({url: r.url(), type: q.resourceType(), status: r.status(),
    mime: r.headers()['content-type'] || '', bytes: Number(r.headers()['content-length'] || 0)});
});
await page.goto(url, {waitUntil: 'networkidle', timeout: 90000});
await page.waitForTimeout(3000);

const libs = await page.evaluate(() => ({
  three: window.THREE?.REVISION || document.querySelector('script[src*="three"]')?.src || null,
  gsap: window.gsap?.version || null,
  scrollTrigger: !!window.ScrollTrigger,
  lenis: !!(window.lenis || window.Lenis || document.documentElement.classList.contains('lenis')),
  webflow: !!window.Webflow || !!document.querySelector('html[data-wf-site]'),
  canvases: [...document.querySelectorAll('canvas')].map(c => ({w: c.width, h: c.height, cls: c.className})),
  videos: [...document.querySelectorAll('video')].map(v => v.currentSrc || v.src),
  scripts: [...document.scripts].map(s => s.src).filter(Boolean),
  docHeight: document.documentElement.scrollHeight,
}));

const H = libs.docHeight - 1080, steps = 24;
for (let i = 0; i <= steps; i++) {
  await page.mouse.wheel(0, H / steps);
  await page.waitForTimeout(900);
  await page.screenshot({path: `${out}/scroll-${String(i).padStart(2, '0')}.png`});
}
const interesting = /\.(glb|gltf|bin|ktx2|basis|hdr|exr|mp4|webm|m3u8|json|splinecode|woff2?|png|jpe?g|webp|avif|svg|js)(\?|$)/i;
await writeFile(`${out}/assets.json`, JSON.stringify(requests.filter(r => interesting.test(r.url)), null, 2));
await writeFile(`${out}/libs.json`, JSON.stringify(libs, null, 2));
await context.close(); await browser.close();
console.log(`done → ${out}/ (network.har, assets.json, libs.json, scroll-*.png, *.webm)`);
