import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const v2 = join(root, 'prototype/v2');
const require = createRequire(join(v2, 'package.json'));
const { chromium } = require('playwright');
const previewUrl = process.env.ARCHIVE_PREVIEW_URL || 'http://127.0.0.1:5197/archive-bake-preview/preview.html';
const displayUrl = (() => {
  const parsed = new URL(previewUrl);
  return ['localhost', '127.0.0.1'].includes(parsed.hostname) ? parsed.pathname : previewUrl;
})();
const resultPath = process.env.ARCHIVE_PREVIEW_RESULT_PATH
  ? resolve(root, process.env.ARCHIVE_PREVIEW_RESULT_PATH)
  : join(root, 'verification/r1-archive-web-bake-20261018/browser-result.json');
const vite = join(v2, 'node_modules/vite/bin/vite.js');
const server = process.env.ARCHIVE_PREVIEW_URL ? null : spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '5197', '--strictPort'], {
  cwd: v2, stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server?.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server?.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

const evidence = { url: displayUrl, errors: [], failedRequests: [], responses: [], orbitMoved: false };
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(previewUrl);
      if (response.ok) { ready = true; break; }
    } catch {}
    if (server && server.exitCode !== null) throw new Error('Vite exited early: ' + serverLog);
    await delay(500);
  }
  if (!ready) throw new Error('Vite did not serve the preview: ' + serverLog);

  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  page.on('pageerror', (error) => evidence.errors.push(String(error)));
  page.on('console', (msg) => { if (msg.type() === 'error') evidence.errors.push(msg.text()); });
  page.on('requestfailed', (request) => evidence.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => {
    const responseUrl = new URL(response.url());
    evidence.responses.push({
      status: response.status(),
      url: ['localhost', '127.0.0.1'].includes(responseUrl.hostname) ? responseUrl.pathname : response.url()
    });
  });
  const response = await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 120000 });
  if (!response?.ok()) throw new Error('Preview page HTTP ' + response?.status());
  await page.waitForFunction(() => document.querySelector('#status')?.textContent?.startsWith('베이크 조명 적용'), null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  evidence.status = await page.locator('#status').innerText();
  evidence.preview = await page.evaluate(() => ({
    viewport: [innerWidth, innerHeight],
    groups: window.__archivePreview.groups,
    lightmaps: window.__archivePreview.lightmaps
  }));

  const before = await page.evaluate(() => window.__archivePreview.camera.position.toArray());
  await page.mouse.move(720, 360); await page.mouse.down(); await page.mouse.move(850, 325, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => window.__archivePreview.camera.position.toArray());
  evidence.orbitMoved = before.some((v, i) => Math.abs(v - after[i]) > 0.01);
  evidence.camera = { initial: before, afterDrag: after };
  if (!evidence.orbitMoved) throw new Error('OrbitControls did not move the camera');
  await page.locator('#reset').click();
  await page.waitForTimeout(300);
  evidence.camera.afterReset = await page.evaluate(() => window.__archivePreview.camera.position.toArray());
  evidence.camera.resetError = Math.max(...evidence.camera.afterReset.map((v, i) => Math.abs(v - evidence.camera.initial[i])));
  if (evidence.camera.resetError > 0.01) throw new Error('Reset did not restore the initial camera position');
  await page.screenshot({ path: join(root, 'verification/r1-archive-web-bake-20261018/web-preview.png') });
  const errorsText = await page.locator('#error').innerText();
  if (errorsText) evidence.errors.push(errorsText);
  const assetFailures = evidence.responses.filter((entry) => entry.status >= 400);
  if (assetFailures.length || evidence.failedRequests.length || evidence.errors.length) {
    throw new Error('Browser preview has errors; see browser-result.json');
  }
  evidence.result = 'PASS';
  await writeFile(resultPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(evidence, null, 2) + '\n');
} catch (error) {
  evidence.result = 'FAIL';
  evidence.errors.push(String(error?.stack || error));
  evidence.serverLog = serverLog;
  await writeFile(resultPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  process.stderr.write(JSON.stringify(evidence, null, 2) + '\n');
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
}
