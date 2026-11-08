/* D-161 파형 그리기 비교 스위치(?wave=prev|live|all): 실험실 그래프가 세 경우 모두 재생 중 파형을 그리고,
 * 링 스트립(wave=all)이 원래 그리기(wave=live)와 같은 자리에 같은 양의 선을 남기는지(밝은 화소 수 ±35 %). */
import {test, expect, type Page} from '@playwright/test';

const ink = (page: Page) => page.locator('canvas.ecg-canvas').first().evaluate((c: HTMLCanvasElement) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && d[i] + d[i + 1] + d[i + 2] > 300) n++; return n; });

async function playAt(page: Page, wave: string, mode: '스윕' | '스크롤') {
  await page.goto(`/?route=lab&bg=0&labfx=2&wave=${wave}`);
  const viewer = page.locator('.viewer');
  await expect(viewer.getByRole('button', {name: '재생', exact: true})).toBeEnabled();
  await viewer.getByRole('button', {name: mode, exact: true}).click();
  await viewer.getByRole('button', {name: '재생', exact: true}).click();
  await page.waitForTimeout(3000);
  return ink(page);
}

for (const mode of ['스윕', '스크롤'] as const) test(`lab waveform draws in every wave mode (${mode})`, async ({page}) => {
  const base = await playAt(page, 'live', mode), strip = await playAt(page, 'all', mode), prev = await playAt(page, 'prev', mode);
  expect(base).toBeGreaterThan(2000); expect(prev).toBeGreaterThan(2000);
  expect(strip / base).toBeGreaterThan(.65); expect(strip / base).toBeLessThan(1.35);
});
