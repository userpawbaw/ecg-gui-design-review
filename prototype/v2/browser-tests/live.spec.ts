/* D-157 실시간 측정 B안 — 앱 서버의 같은 출처 프록시(bridge/…)로 브리지 스트림을 받아 그리는지.
 * 브리지 프로토콜(원본 저장소 scripts/serial_bridge.py --serve: SSE /stream, GET·POST /fe)을 흉내 내는 시험용 대역을
 * 127.0.0.1:8765 에 잠깐 띄운다. 그 파형은 시험 자료이고 측정값이 아니다. 이미 브리지가 떠 있으면 그것을 쓴다. */
import {test, expect} from '@playwright/test';
import http from 'node:http';

let server: http.Server | null = null;
test.beforeAll(async () => {
  const clients = new Set<http.ServerResponse>(); let i = 0, fe = 'zerophase';
  const MODES = {causal: {label: '인과 o1', note: '지연 0'}, zerophase: {label: '블록 영위상', note: '+548 ms'}};
  const s = http.createServer((req, res) => {
    const p = (req.url ?? '').split('?')[0];
    if (p === '/fe' && req.method === 'GET') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify({modes: MODES, current: fe})); return; }
    if (p === '/fe' && req.method === 'POST') {
      let b = ''; req.on('data', d => b += d); req.on('end', () => {
        fe = JSON.parse(b || '{}').mode; i = 0;
        for (const c of clients) c.write('data: ' + JSON.stringify({reset: true, fe, fe_label: (MODES as any)[fe].label, fe_lat_ms: 0}) + '\n\n');
        res.writeHead(200, {'Content-Type': 'application/json'}); res.end('{"ok":true}');
      }); return;
    }
    if (p === '/stream') { res.writeHead(200, {'Content-Type': 'text/event-stream'}); clients.add(res); req.on('close', () => clients.delete(res)); return; }
    res.writeHead(404); res.end();
  });
  const timer = setInterval(() => {
    const n = 12, wave = (k: number) => Math.exp(-((((((i + k) / 250) * 1.2) % 1 - .3) / .012) ** 2));
    const m = {i, n, fs: 250, raw: Array.from({length: n}, (_, k) => 2.3 + wave(k)), ok: Array(n).fill(1),
      out: {M_FE: Array.from({length: n}, (_, k) => wave(k)), M04: Array.from({length: n}, (_, k) => .97 * wave(k))},
      stat: {fe, lat_ms: 548, lost: 0, leadoff: 0, bad: 0, resync: 0, qdrop: 0, rtf: .2, gap_ms: 48}};
    i += n; for (const c of clients) c.write('data: ' + JSON.stringify(m) + '\n\n');
  }, 48);
  s.on('close', () => clearInterval(timer));
  await new Promise<void>(ok => { s.once('error', () => { clearInterval(timer); ok(); }); s.listen(8765, '127.0.0.1', () => { server = s; ok(); }); });
});
test.afterAll(() => { server?.closeAllConnections?.(); server?.close(); });

test('live tab draws the bridge stream itself, switches front-end, shows no metrics (D-157)', async ({page}) => {
  await page.goto('/?route=lab'); await expect(page.getByRole('button', {name: '크게 비교'})).toBeEnabled();
  await page.getByRole('button', {name: '실시간 측정', exact: true}).click();
  await expect(page.locator('.live-conn')).toHaveText(/연결됨/, {timeout: 15000});
  await expect(page.locator('canvas.live-canvas[data-series="M_FE"]')).toBeVisible();
  await expect(page.locator('canvas.lab-backdrop')).toHaveCount(1);
  const ink = () => page.locator('canvas.live-canvas[data-series="M_FE"]').evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 17) + Math.abs(d[i + 1] - 43) + Math.abs(d[i + 2] - 57) > 90) n++; return n; });
  await expect.poll(ink, {timeout: 10000}).toBeGreaterThan(500);
  await expect(page.locator('.live-native')).not.toContainText(/SNR\s*개선|dB 개선|차이 보기/);
  await expect(page.locator('.live-src')).not.toHaveText(/^실보드 실측/);
  const tools = page.getByRole('group', {name: '실시간 표시 도구'});

  const before = await tools.locator('button[aria-pressed=true]').allTextContents();
  const target = before.some(t => t.includes('인과')) ? '블록 영위상' : '인과';
  await tools.getByRole('button', {name: new RegExp(target)}).click();
  await expect(page.locator('.live-note')).toContainText('바꿨다');
  await expect(tools.getByRole('button', {name: new RegExp(target)})).toHaveAttribute('aria-pressed', 'true');

  await tools.getByRole('button', {name: '겹치기', exact: true}).click();
  await expect(page.locator('canvas.live-canvas.tall')).toBeVisible();
  await page.getByRole('button', {name: '출처·규약'}).click();
  await expect(page.locator('.source-dialog pre')).toContainText('LIVE_BRIDGE_STREAM');
});
