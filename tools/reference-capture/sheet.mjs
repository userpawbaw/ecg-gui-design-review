#!/usr/bin/env node
// `npm run ref:sheet -- <folder>`            → 12-frame sheets for every segment of one capture (sheet-<segment>.png in that folder)
// `npm run ref:sheet -- <ref folder> <app folder> [--out 폴더]` → side-by-side compare-<segment>.png for the stages both captures share
import {mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchHeadless} from './lib/browser.mjs';
import {compareSheets, loadDiff, stageSheets} from './lib/sheet.mjs';
import {hoverReport, rectOf} from './lib/hover.mjs';
import {pythonEnergies, saveJson} from './lib/post.mjs';
import {readFileSync} from 'node:fs';
import {hysteresisSummary, pairByProgress} from './lib/survey.mjs';
import {surveySheets} from './lib/sheet.mjs';

export async function main(argv) {
  const hoverOnly = argv.includes('--hover'), surveyOnly = argv.includes('--survey');argv = argv.filter((a) => a !== '--hover' && a !== '--survey');
  const dirs = [];let out = null;
  for (let i = 0; i < argv.length; i++) {if (argv[i] === '--out') out = argv[++i];else if (argv[i].startsWith('--out=')) out = argv[i].slice(6);else dirs.push(resolve(argv[i]));}
  if (dirs.length < 1 || (dirs.length > 2 && !hoverOnly && !surveyOnly)) {console.error('사용법: npm run ref:sheet -- <캡처 폴더>   또는   npm run ref:sheet -- <레퍼런스 폴더> <우리 앱 폴더>');process.exit(1);}
  if (surveyOnly) {   // re-summarise saved survey.json (comparison rules changed) and redraw its sheets
    const hb = await launchHeadless();
    try {
      for (const dir of dirs) {
        const rep = JSON.parse(readFileSync(join(dir, 'survey.json'), 'utf8'));
        const pairs = pairByProgress(rep.stops), seq = pairs.flatMap(([d, u]) => [d, u].map((st) => ({file: join(dir, 'frames', 'stills', st + '.jpg')}))), en = seq.length ? pythonEnergies(dir, seq) : [];
        const diffs = {};pairs.forEach(([d, u], k) => {diffs[d] = diffs[u] = Math.round(en[2 * k + 1].all * 100) / 100;});
        for (const r of rep.stops) r.stillDiffVsOtherDirection = diffs[r.stage] ?? null;
        rep.summary.hysteresis = hysteresisSummary(rep.stops);
        saveJson(dir, 'survey.json', rep);
        const written = await surveySheets(hb, dir, rep, {meta: basename(dir)});
        console.log(String.fromCharCode(10) + dir + String.fromCharCode(10) + '  왕복 비교: ' + JSON.stringify(rep.summary.hysteresis) + String.fromCharCode(10) + '  ' + written.join(', '));
      }
    } finally {await hb.close();}
    return;
  }
  if (hoverOnly) {   // recompute hover.json from the saved frames (e.g. after the metric changed)
    for (const dir of dirs) {
      const diff = loadDiff(dir), notes = JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')).notes;
      const ticks = Object.entries(diff.stages).flatMap(([stage, st]) => st.frames.map((f) => ({stage, file: join(dir, f.file), rect: rectOf(notes, stage)})));
      const rep = hoverReport(ticks, pythonEnergies(dir, ticks), notes, diff.frameStepMs);
      saveJson(dir, 'hover.json', rep);
      console.log(String.fromCharCode(10) + dir);
      for (const [st, h] of Object.entries(rep)) console.log(`  ${st} [${h.target.tag} "${h.target.label}"] ${h.metrics.reacted ? '반응 있음(' + (h.metrics.scope === 'local' ? '영역' : '화면 전체') + ')' : '반응 없음'} · 전체 피크 ${h.metrics.peakAll}(평소 ${h.metrics.calmLevel}) · 영역 피크 ${h.metrics.peakLocal} · t90 ${h.metrics.effectT90Ms} ms · 이탈 후 ${h.metrics.changeAfterExitShare}`);
    }
    return;
  }
  const browser = await launchHeadless();
  try {
    if (dirs.length === 1) {
      const written = await stageSheets(browser, dirs[0], loadDiff(dirs[0]), {meta: basename(dirs[0])});
      console.log(`\n시트 ${written.length}장 생성: ${dirs[0]}\n  ${written.join('\n  ')}\n`);
    } else {
      const dest = out ? resolve(out) : join(homedir(), 'ecg-captures', `compare-${basename(dirs[0])}-vs-${basename(dirs[1])}`);
      mkdirSync(dest, {recursive: true});
      const r = await compareSheets(browser, dirs[0], dirs[1], dest, {refName: basename(dirs[0]).replace(/-\d{8}-\d{4}.*$/, ''), appName: basename(dirs[1]).replace(/-\d{8}-\d{4}.*$/, '')});
      console.log(`\n나란히 비교 시트 ${r.written.length}장: ${dest}\n  ${r.written.join('\n  ')}`);
      if (r.onlyA.length || r.onlyB.length) console.log(`  한쪽에만 있는 구간: 레퍼런스 ${r.onlyA.join(', ') || '-'} / 우리 앱 ${r.onlyB.join(', ') || '-'}`);
      console.log('  구간별 평균 Δ(레퍼런스 / 우리 앱):');
      for (const [k, v] of Object.entries(r.report)) {const [a, b] = Object.values(v);console.log(`    ${k.padEnd(14)} ${a.meanEnergy.toFixed(2)} / ${b.meanEnergy.toFixed(2)}`);}
      console.log('');
    }
  } finally {await browser.close();}
}
if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) await main(process.argv.slice(2)).catch((e) => {console.error('\n실패: ' + e.message);process.exit(1);});
