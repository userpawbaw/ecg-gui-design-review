// Contact sheets: 12 evenly spaced frames per segment, and reference ↔ our-app comparison sheets for the same script stage.
// Sheets are rendered by a page (HTML grid → screenshot), so no image library is needed. Sheets contain reference pixels:
// keep them outside the repository.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {selectFrames} from './analysis.mjs';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const CSS = `body{margin:0;background:#101114;color:#cfd3da;font:13px/1.35 Consolas,monospace}h1{font-size:15px;margin:10px 12px;font-weight:500}
.g{display:grid;gap:6px;padding:0 12px 12px}.t{position:relative}.t img{display:block;width:100%;height:auto;background:#000}
.t span{position:absolute;left:0;bottom:0;background:#000b;padding:1px 5px;font-size:12px}.row{margin:6px 12px 2px;color:#8fb4ff}`;

export function loadDiff(dir) {
  const p = join(dir, 'diff.json');
  if (!existsSync(p)) throw new Error(`diff.json 이 없음(프레임 캡처 결과 폴더가 아님): ${dir}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

const tile = (dir, f, label) => `<div class="t"><img src="${pathToFileURL(resolve(dir, f.file)).href}"><span>${esc(label)}</span></div>`;
const label = (f) => `#${f.i} · ${(f.vt / 1000).toFixed(2)} s${f.all === null ? '' : ' · Δ' + f.all.toFixed(2)}`;

/** Frame subset for a stage's own sheet: the moving part when the stage is mostly idle, else the whole stage. */
export function pickForSheet(stage, n = 12) {
  const w = stage.activeWindow, all = stage.frames;
  if (w && w.end - w.start + 1 >= n && w.end - w.start + 1 < all.length * 0.85) return {frames: selectFrames(w.end - w.start + 1, n).map((k) => all[w.start + k]), note: `움직이는 구간 #${all[w.start].i}–#${all[w.end].i}`};
  return {frames: selectFrames(all.length, n).map((k) => all[k]), note: `전체 ${all.length}프레임`};
}

async function render(browser, html, htmlPath, outPng, width) {
  writeFileSync(htmlPath, html, 'utf8');
  const ctx = await browser.newContext({viewport: {width, height: 800}, deviceScaleFactor: 1}), page = await ctx.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, {timeout: 60000});
  await page.screenshot({path: outPng, fullPage: true, type: 'png'});
  await ctx.close();
}

/** One sheet per stage: sheet-<stage>.png (4 × 3). Returns the written file names. */
export async function stageSheets(browser, dir, diff, {meta = ''} = {}) {
  const written = [];
  for (const [name, st] of Object.entries(diff.stages)) {
    const pick = pickForSheet(st), cols = 4, w = 1920, tileW = Math.floor((w - 24 - (cols - 1) * 6) / cols);
    const html = `<style>${CSS}</style><h1>${esc(meta)} — ${esc(name)} · ${esc(pick.note)} · 프레임 간격 ${Number(diff.frameStepMs).toFixed(2)} ms</h1><div class="g" style="grid-template-columns:repeat(${cols},${tileW}px)">${pick.frames.map((f) => tile(dir, f, label(f))).join('')}</div>`;
    const out = `sheet-${name}.png`;
    await render(browser, html, join(dir, '_sheet.html'), join(dir, out), w);
    written.push(out);
  }
  return written;
}

/** Side-by-side for each stage present in both captures: reference rows on top, our app below, same proportional positions in time. */
export async function compareSheets(browser, refDir, appDir, outDir, {refName = 'REF', appName = 'APP'} = {}) {
  const a = loadDiff(refDir), b = loadDiff(appDir), written = [], report = {};
  for (const name of Object.keys(a.stages).filter((k) => b.stages[k])) {
    const A = a.stages[name], B = b.stages[name], n = 12, cols = 6, w = 1920, tileW = Math.floor((w - 24 - (cols - 1) * 6) / cols);
    const pa = selectFrames(A.frames.length, n).map((k) => A.frames[k]), pb = selectFrames(B.frames.length, n).map((k) => B.frames[k]);
    const grid = (dir, fr) => `<div class="g" style="grid-template-columns:repeat(${cols},${tileW}px)">${fr.map((f) => tile(dir, f, label(f))).join('')}</div>`;
    const html = `<style>${CSS}</style><h1>${esc(name)} — 같은 입력 대본, 구간 길이를 12등분한 같은 위치 · 위 ${esc(refName)} / 아래 ${esc(appName)}</h1>`
      + `<div class="row">${esc(refName)} (${A.count}프레임)</div>${grid(refDir, pa.slice(0, 6))}${grid(refDir, pa.slice(6))}`
      + `<div class="row">${esc(appName)} (${B.count}프레임)</div>${grid(appDir, pb.slice(0, 6))}${grid(appDir, pb.slice(6))}`;
    const out = `compare-${name}.png`;
    await render(browser, html, join(outDir, '_compare.html'), join(outDir, out), w);
    written.push(out);
    const stat = (S) => ({frames: S.count, meanEnergy: S.meanEnergy, maxEnergy: S.maxEnergy, active: S.activeWindow ? S.activeWindow.end - S.activeWindow.start + 1 : 0, jumps: S.jumps.length});
    report[name] = {[refName]: stat(A), [appName]: stat(B)};
  }
  const onlyA = Object.keys(a.stages).filter((k) => !b.stages[k]), onlyB = Object.keys(b.stages).filter((k) => !a.stages[k]);
  writeFileSync(join(outDir, 'compare.json'), JSON.stringify({ref: refDir, app: appDir, stages: report, onlyInRef: onlyA, onlyInApp: onlyB}, null, 1), 'utf8');
  return {written, report, onlyA, onlyB};
}

/** Survey stills: survey-down.png (top → bottom) and survey-up.png (back up), with a travel-energy bar per stop. */
export async function surveySheets(browser, dir, report, {meta = ''} = {}) {
  const written = [], cols = 6, w = 1920, tileW = Math.floor((w - 24 - (cols - 1) * 6) / cols);
  const label = (r) => `${r.stage} · ${r.progress === null ? r.px + 'px' : 'p' + r.progress} · settle ${r.settleMs ?? '–'}ms · Δtravel ${r.travelMeanEnergy} · idle ${r.ambientEnergy}` + (r.stillDiffVsOtherDirection === null ? '' : ` · ↔${r.stillDiffVsOtherDirection}`);
  const bars = (rows) => `<div style="display:flex;gap:2px;align-items:flex-end;height:66px;margin:0 12px 8px">${rows.map((r) => `<div title="${esc(r.stage)}" style="width:14px;height:${Math.max(2, Math.min(64, r.travelMeanEnergy * 30))}px;background:${r.dir === 'up' ? '#c18401' : '#4f8cff'}"></div>`).join('')}</div>`;
  const sets = [['survey-down.png', report.stops.filter((r) => r.dir !== 'up'), '내려가며(위→아래)'], ['survey-up.png', report.stops.filter((r) => r.dir === 'up'), '올라가며(아래→위)']];
  for (const [out, rows, title] of sets) {
    if (!rows.length) continue;
    const html = `<style>${CSS}</style><h1>${esc(meta)} — 위치 조사 ${title} · 막대 = 이동 중 평균 변화 에너지 · ↔ = 반대 방향 같은 위치 정지 화면과의 차이</h1>${bars(rows)}<div class="g" style="grid-template-columns:repeat(${cols},${tileW}px)">${rows.map((r) => tile(dir, {file: r.still}, label(r))).join('')}</div>`;
    await render(browser, html, join(dir, '_survey.html'), join(dir, out), w);
    written.push(out);
  }
  return written;
}
