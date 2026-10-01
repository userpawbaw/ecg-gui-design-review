#!/usr/bin/env node
// `npm run ref:capture -- <url|story> [options]` — frame-level analysis of a reference site or of our own app (D-045).
//   A: virtual-clock frames (complete 16 ms sequence, repeatable)   B: real-time trace (actual frame pacing)   C: user OBS recording (out of scope)
// Output (outside the repository by default): %USERPROFILE%\ecg-captures\<host>-<YYYYMMDD-HHMM>\ — see tools/reference-capture/README.md.
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {parseArgs, outName} from './lib/args.mjs';
import {gpuInfo, launchBrowser, launchHeadless} from './lib/browser.mjs';
import {framesPass} from './lib/frames.mjs';
import {tracePass} from './lib/trace.mjs';
import {analyzeSavedFrames, compareHashes, diffFromEnergies, pythonEnergies, saveJson, trackCurves} from './lib/post.mjs';
import {fastPass} from './lib/fast.mjs';
import {probePass} from './lib/probe.mjs';
import {dragReport, hoverReport, rectOf} from './lib/hover.mjs';
import {diffEnergy, frameHash, pixelDelta} from './lib/analysis.mjs';
import {decodePng} from './lib/png.mjs';
import {stageSheets, surveySheets} from './lib/sheet.mjs';
import {pairByProgress, surveyReport} from './lib/survey.mjs';
import {rmSync} from 'node:fs';
import {ensureDevServer} from './server.mjs';
import {fileURLToPath} from 'node:url';

const say = (s) => console.log(s);
const HASH_FRAMES = 60;

function uniqueDir(base) {
  let d = base, n = 2;
  while (existsSync(d) && readdirSync(d).length) d = `${base}-${n++}`;
  mkdirSync(d, {recursive: true});
  return d;
}

async function determinism(browser, o, mainHashes) {
  say(`  결정성 검사: 같은 대본으로 처음 ${HASH_FRAMES}프레임을 한 번 더 캡처해 해시 비교`);
  const second = await framesPass(browser, o, {stopAfter: HASH_FRAMES, memoryFrames: true});
  const hashes = second.shots.map((buf, k) => ({stage: second.frames[k].stage, i: second.frames[k].i, hash: null, buf}));
  const imgs = hashes.map((h) => decodePng(h.buf));
  hashes.forEach((h, k) => {h.hash = frameHash(imgs[k]);delete h.buf;});
  const cmp = compareHashes(mainHashes.list, hashes);
  let maxMean = 0, maxPixels = 0, maxChannel = 0;
  for (const k of cmp.mismatches) {
    maxMean = Math.max(maxMean, diffEnergy(mainHashes.imgs[k], imgs[k]).all);
    const d = pixelDelta(mainHashes.imgs[k], imgs[k]);maxPixels = Math.max(maxPixels, d.count);maxChannel = Math.max(maxChannel, d.maxChannel);
  }
  const exact = cmp.compared > 0 && cmp.mismatches.length === 0;
  const rounding = !exact && cmp.compared > 0 && maxPixels <= 20 && maxChannel <= 2;   // GPU rounding noise: a handful of pixels, at most 2 levels
  const verdict = exact ? 'PASS — 처음 60프레임 픽셀 해시 완전 동일'
    : rounding ? `PASS(GPU 반올림 수준) — ${cmp.mismatches.length}프레임에서 최대 ${maxPixels}픽셀이 최대 ${maxChannel}단계 다름`
    : cmp.compared === 0 ? 'FAIL — 비교할 프레임 없음'
    : maxMean <= 0.5 ? 'CONDITIONAL — 해시가 다르고 차이가 반올림 수준을 넘음(평균 ≤ 0.5). 원인 후보: 비동기 자산 로드·디코딩 시점, 시계 밖 타이머(워커), GPU 드라이버'
    : 'FAIL — 같은 입력인데 프레임이 다름. 원인 후보: 난수/매 방문 경로 재생성, 시계 밖 타이머, 워커·영상, 비동기 자산 로드';
  return {
    framesCompared: cmp.compared, identical: cmp.identical, exact, deterministic: exact || rounding, firstMismatchFrame: cmp.mismatches[0] ?? null,
    mismatchingFrames: cmp.mismatches.length, maxMeanAbsDiffOfMismatches: Math.round(maxMean * 1e5) / 1e5, maxDifferingPixels: maxPixels, maxChannelDifference: maxChannel,
    verdict, secondPassWarnings: second.warnings,
  };
}

function printSurvey(rep) {
  const s = rep.summary;
  say(`    정지 지점 내려감 ${s.stopsDown}·올라감 ${s.stopsUp} · 정착 시간 중앙값 ${s.medianSettleMs} ms · 느린 정착 ${s.slowSettleStops.length}곳 · 정착 못함 ${s.neverSettled.length}곳 · 평소 움직임 있는 지점 ${s.ambientMotionStops.length}곳`);
  if (s.hysteresis) say(`    왕복 비교 ${s.hysteresis.pairs}쌍 · 중앙 차이 ${s.hysteresis.medianDiff} · 다른 지점 ${s.hysteresis.differing}곳 → ${s.hysteresis.reading}`);
  say('    이동 중 변화가 큰 지점: ' + s.hotspots.map((h) => `${h.stage}(${h.progress ?? h.px + 'px'}, Δ${h.travelMeanEnergy})`).join(', '));
}

function printHover(rep) {
  for (const [stage, h] of Object.entries(rep)) {
    const m = h.metrics;
    say(`    ${stage} [${h.target.tag} "${h.target.label}"] ${m.reacted ? '반응 있음(' + (m.scope === 'local' ? '영역' : '화면 전체') + ')' : '반응 없음/약함'} · 전체 피크 ${m.peakAll}(평소 ${m.calmLevel}) · 영역 피크 ${m.peakLocal} · 영역/바깥 ${m.localToOutsideRatio}배 · 효과 t90 ${m.effectT90Ms} ms · 이탈 후 변화 비율 ${m.changeAfterExitShare}`);
  }
}

export async function main(argv) {
  if (argv[0] === 'selftest') return (await import('./selftest.mjs')).main();
  let o;
  try {o = parseArgs(argv);} catch (e) {console.error('\n' + e.message);process.exit(1);}
  const outDir = uniqueDir(o.out ? resolve(o.out) : join(homedir(), 'ecg-captures', outName(o)));
  const manifest = {tool: 'tools/reference-capture (D-045)', createdAt: new Date().toISOString(), target: o.target, url: o.url, mode: o.mode, script: o.script, scriptOptions: {from: o.from ?? null, to: o.to ?? null}, outDir, warnings: []};
  say(`\n레퍼런스 캡처 — ${o.isStory ? '우리 앱(story)' : o.url}\n  출력: ${outDir}`);
  let server = null;
  try {
    if (o.isStory) server = await ensureDevServer(o.base);
    const runA = o.mode === 'all' || o.mode === 'frames', runB = o.mode === 'all' || o.mode === 'trace', runFast = o.mode === 'fast', runProbe = o.mode === 'probe';
    let gpu = null, frames = null, fastDone = false;

    if (runA) {
      say('\n[A층] 가상 시계 프레임 캡처 시작 (창이 뜹니다 — 가리거나 최소화하지 마세요)');
      const {browser, info, warnings} = await launchBrowser({browser: o.browser, extraArgs: ['--disable-smooth-scrolling']});
      manifest.browser = info;manifest.warnings.push(...warnings);
      try {
        gpu = await gpuInfo(browser);manifest.gpu = gpu;
        say(`  브라우저: ${info.used} ${info.version} · GPU: ${gpu.renderer ?? 'WebGL 없음'}${gpu.software ? '  ← 소프트웨어 렌더(성능 판단 불가)' : ''}`);
        const framesDir = join(outDir, 'frames');
        const t0 = Date.now();
        frames = await framesPass(browser, o, {save: {dir: framesDir}, collectInfo: true, har: o.har ? join(outDir, 'network.har') : null, onProgress: (n, st) => say(`    …${n}프레임 (${st})`)});
        say(`  캡처 ${frames.frames.length}프레임 (가상 ${(frames.virtualMs / 1000).toFixed(1)} s, 실제 ${((Date.now() - t0) / 1000).toFixed(0)} s) · 로드 단계 가상 ${(frames.loadVirtualMs / 1000).toFixed(1)} s / 실제 ${(frames.loadMs / 1000).toFixed(1)} s(시계 정지 대기 ${(frames.loadFrozenMs / 1000).toFixed(1)} s)`);
        manifest.warnings.push(...frames.warnings);
        say('  프레임 분석(차이 에너지·해시)…');
        const {diff, hashes} = analyzeSavedFrames(framesDir, frames.frames, {step: o.step, hashCount: HASH_FRAMES});
        saveJson(outDir, 'diff.json', diff);
        saveJson(outDir, 'input.json', frames.log);
        saveJson(outDir, 'assets.json', {url: o.url, ...frames.info});
        if (o.track.length) saveJson(outDir, 'tracks.json', {selectors: o.track, frameStepMs: o.step, curves: trackCurves(frames.tracks, o.track, o.step), frames: frames.tracks});
        if (o.script === 'hover') {
          say('  호버 분석(대상 영역 변화 에너지, OpenCV)…');
          const ticks = frames.frames.map((f) => ({...f, file: join(framesDir, f.file), rect: rectOf(frames.log.notes, f.stage)}));
          const rep = hoverReport(ticks, pythonEnergies(outDir, ticks), frames.log.notes, o.step);
          saveJson(outDir, 'hover.json', rep);printHover(rep);
        }
        writeFileSync(join(outDir, 'frames.json'), JSON.stringify(frames.frames.map((f) => [f.stage, f.i, f.vt])), 'utf8');
        for (const [name, s] of Object.entries(diff.stages)) say(`    ${name.padEnd(14)} ${String(s.count).padStart(3)}프레임 · 평균 Δ ${s.meanEnergy.toFixed(2)} · 최대 Δ ${s.maxEnergy.toFixed(2)} · 급등 ${s.jumps.length}`);
        manifest.frameStepMs = o.step;
        manifest.virtualClock = {api: 'Playwright page.clock', frozenBeforePageStart: true, loadStage: '시계를 멈춘 채 실제 시간으로 ready' + (o.ready ? '(' + o.ready + ')' : '(없음)') + ' + 네트워크 조용 1.5 s를 기다림(최대 20 s), 안 되면 한 프레임씩 진행; 이어서 고정 ' + o.settleMs + ' ms(가상). 단계 사이마다 진행 중 요청이 끝나길 기다림(네트워크 장벽)', loadVirtualMs: frames.loadVirtualMs, loadFrozenRealMs: frames.loadFrozenMs, loadRealMs: frames.loadMs, frameStepMs: o.step,
          stepReason: '정확한 60 fps(정수 ms 시계에서 17·17·16 ms 교대, 평균 16.667). 시계의 rAF 대신 페이지의 rAF를 단계마다 한 번씩 우리가 실행(타임스탬프 = 가상 시각)하고 performance.now를 Date.now 기준으로 고정 — Playwright 시계의 rAF·performance.now는 실행마다 2–5 ms 어긋남. 시각은 vt(ms, 스크립트 시작 기준)로 기록',
          why: '시계를 로드 중에 흘리면 장면 위상이 실제 로드 시간에 달려 실행마다 달라짐(우리 앱 처음 60프레임 0/60 일치)'};
        manifest.cssAnimationCorrection = {applied: frames.anim.driven > 0, ...frames.anim, method: 'document.getAnimations(): pause + currentTime = 가상 시각 (시계가 CSS/WAAPI를 제어하지 않음 — 확인됨)'};
        manifest.totals = {frames: frames.frames.length, virtualMs: frames.virtualMs, stages: Object.keys(diff.stages).length, maxFramesPerStage: o.maxFrames};
        // keep decoded images of the hashed frames for the mismatch measurement
        const hashed = {list: hashes, imgs: []};
        if (o.determinism) {
          hashed.imgs = frames.frames.slice(0, HASH_FRAMES).map((f) => decodePng(readFileSync(join(framesDir, f.file))));
          try {manifest.determinism = await determinism(browser, o, hashed);} catch (e) {
            const why = String(e.message).split(String.fromCharCode(10))[0];
            manifest.determinism = {error: why, verdict: 'FAIL — 결정성 검사 중 페이지가 닫힘/충돌(무거운 사이트): ' + why};
          }
          manifest.determinism.likelyCauses = frames.warnings.filter((w) => /Web Worker|<video>|OffscreenCanvas|무한 반복/.test(w));   // what the capture itself says can break repeatability
          say(`  결정성: ${manifest.determinism.verdict}`);
        } else manifest.determinism = {skipped: true, hashes: hashes.slice(0, HASH_FRAMES).map((h) => h.hash)};
        manifest.determinism.firstHashes = hashes.map((h) => h.hash);
        saveJson(outDir, 'manifest.json', manifest);   // checkpoint — frames done
      } finally {await browser.close();}
    }

    if (runB) {
      say('\n[B층] 실시간 성능 추적 시작');
      const {browser, info, warnings} = await launchBrowser({browser: o.browser});
      try {
        manifest.browserTrace = info;manifest.warnings.push(...warnings);
        gpu = await gpuInfo(browser);manifest.gpu = gpu;
        say(`  GPU: ${gpu.renderer ?? 'WebGL 없음'}${gpu.software ? '  ← 소프트웨어 렌더(성능 판단 불가)' : ''}`);
        const t = await tracePass(browser, o, gpu, outDir);
        manifest.warnings.push(...t.warnings);
        const r = t.summary.rafRecorder.overall, d = t.summary.trace?.drawFrame.overall;
        say(`  rAF 간격: 중앙 ${r.medianMs} ms (${r.medianFps} fps) · p95 ${r.p95Ms} · 최대 ${r.maxMs} · 16.7 초과 ${r.over16_7} · 33.3 초과 ${r.over33_3} · 50 ms↑ 긴 작업 ${t.summary.rafRecorder.longTasksOver50ms}`);
        if (d?.count) say(`  추적 DrawFrame: 중앙 ${d.medianMs} ms · p95 ${d.p95Ms} · 최대 ${d.maxMs} · 33.3 초과 ${d.over33_3} · 긴 작업(추적) ${t.summary.trace.longTasks.total}`);
        say(`  판정: ${t.summary.verdict}`);
        manifest.perfVerdict = t.summary.verdict;
        if (!runA) saveJson(outDir, 'input.json', t.log);
      } finally {await browser.close();}
    }

    if (runProbe) {
      say('\n[probe] 페이지 읽기 전용 조사 — 라이브러리·자산·상호작용 증거(드래그·호버)·입장 버튼 후보');
      const {browser, info, warnings} = await launchBrowser({browser: o.browser});
      manifest.browser = info;manifest.warnings.push(...warnings);
      try {
        const p = await probePass(browser, o);
        manifest.warnings.push(...p.warnings);
        saveJson(outDir, 'probe.json', p);saveJson(outDir, 'assets.json', {url: o.url, libs: p.libs, fonts: p.fonts, requests: p.requests});
        const d = p.drag;
        say(`  라이브러리: three ${p.libs.three ?? '-'} · gsap ${p.libs.gsap ?? '-'} · lenis ${p.libs.lenis ? '있음' : '-'} · spline ${p.libs.spline ? '있음' : '-'} · 캔버스 ${p.libs.canvases.length}개 ${JSON.stringify(p.libs.contextKinds)}`);
        say(`  드래그 증거: ${d.verdict.verdict} — ${d.verdict.reasons.join('; ')}`);
        say(`  호버/포인터 리스너: ${Object.entries(d.page.listeners).map(([k, v]) => k + '×' + v).join(', ') || '없음'}`);
        say(`  입장 버튼 후보: ${p.enterCandidates.length ? p.enterCandidates.map((c) => '"' + c.label + '"').join(', ') : '없음'}`);
        manifest.drag = {verdict: d.verdict.verdict, reasons: d.verdict.reasons};manifest.probe = true;
      } finally {await browser.close();}
    }

    if (runFast) {
      say('\n[빠른 모드] 실시간 실행 + 화면 녹화(screencast) — 프레임 정확도는 화면 주사율·PC 성능에 묶임');
      const {browser, info, warnings} = await launchBrowser({browser: o.browser});
      manifest.browser = info;manifest.warnings.push(...warnings);
      try {
        gpu = await gpuInfo(browser);manifest.gpu = gpu;
        say(`  브라우저: ${info.used} ${info.version} · GPU: ${gpu.renderer ?? 'WebGL 없음'}${gpu.software ? '  ← 소프트웨어 렌더' : ''}`);
        const t0 = Date.now();
        const f = await fastPass(browser, o, outDir);
        manifest.warnings.push(...f.warnings);
        if (f.evidence) {saveJson(outDir, 'drag-evidence.json', f.evidence);manifest.drag = {verdict: f.evidence.verdict.verdict, reasons: f.evidence.verdict.reasons};}
        if (f.skipped) {
          say(`  드래그 건너뜀 — 증거 없음: ${f.evidence.verdict.reasons.join('; ')} (강제하려면 --force)`);
          manifest.drag.skipped = true;
        } else {
        say(`  녹화 ${f.times.length}프레임(변화가 있을 때만 도착), 60 Hz 격자 ${f.ticks.length}틱 · 실제 ${((Date.now() - t0) / 1000).toFixed(0)} s. 분석(OpenCV)…`);
        const ticks = f.ticks.map((t) => ({stage: t.stage, i: t.i, vt: t.vt, file: 'frames/raw/' + String(t.src).padStart(6, '0') + '.jpg', rect: rectOf(f.log.notes, t.stage)}));
        const energies = pythonEnergies(outDir, ticks.map((t) => ({...t, file: join(outDir, t.file)})));
        const diff = diffFromEnergies(ticks, energies, f.step, '; fast mode: frames resampled to 60 Hz by holding the latest screencast frame');
        saveJson(outDir, 'diff.json', diff);saveJson(outDir, 'input.json', f.log);
        saveJson(outDir, 'video-summary.json', {layer: 'fast (real time, CDP screencast JPEG q85)', screencastFrames: f.times.length, delivery: f.delivery,
          caveat: '프레임은 화면이 바뀔 때만 도착한다(정지 구간은 간격이 길어도 정상). 움직이는 구간의 간격이 16.7 ms를 넘으면 화면 주사율 또는 PC 성능 한계 — A층(가상 시계)으로 확인할 것'});
        for (const [name, s] of Object.entries(diff.stages)) say(`    ${name.padEnd(14)} ${String(s.count).padStart(3)}틱 · 평균 Δ ${s.meanEnergy.toFixed(2)} · 최대 Δ ${s.maxEnergy.toFixed(2)} · 급등 ${s.jumps.length}`);
        if (o.script === 'hover') {const rep = hoverReport(ticks, energies, f.log.notes, f.step);saveJson(outDir, 'hover.json', rep);printHover(rep);}
        if (o.script === 'drag') {
          const rep = dragReport(ticks, energies, f.log.notes, f.step);saveJson(outDir, 'drag.json', rep);
          say(`  드래그 증거: ${f.evidence.verdict.verdict} (${f.evidence.verdict.reasons.join('; ')})`);
          for (const [st, d] of Object.entries(rep)) say(`    ${st} [${d.label}] ${d.metrics.reacted ? '반응 있음' : '반응 없음'} · 드래그 중 피크 ${d.metrics.peakDuringDrag}(평소 ${d.metrics.calmLevel}) · 놓은 뒤 정착 ${d.metrics.inertiaMs ?? '못 함'} ms · 놓은 뒤 변화 비율 ${d.metrics.afterShare}`);
        }
        if (o.script === 'survey') {
          const byStage = {};ticks.forEach((t, n) => {(byStage[t.stage] ||= []).push(energies[n].all);});
          const stops = f.log.notes.filter((n) => n.key === 'stop').map((n) => n.value), pairs = [];
          pairs.push(...pairByProgress(stops).map(([d, u]) => [d, u]));
          const hyst = {};
          if (pairs.length) {
            const seq = pairs.flatMap(([d, u]) => [d, u].map((st) => ({file: join(outDir, 'frames', 'stills', st + '.jpg')})));
            const en = pythonEnergies(outDir, seq);
            pairs.forEach(([d, u], k) => {hyst[d] = hyst[u] = en[2 * k + 1].all;});
          }
          const rep = surveyReport(byStage, f.log.notes, hyst, f.step);
          saveJson(outDir, 'survey.json', rep);printSurvey(rep);manifest.survey = rep.summary;
          if (!o.keepFrames) rmSync(join(outDir, 'frames', 'raw'), {recursive: true, force: true});   // low-res energy frames are not needed afterwards; stills stay
        }
        manifest.frameStepMs = f.step;manifest.layer = 'fast';fastDone = true;
        }
      } finally {await browser.close();}
    }

    manifest.sheets = [];
    if (fastDone && o.script === 'survey') {
      say(String.fromCharCode(10) + '위치 조사 시트…');
      const hb = await launchHeadless();
      try {manifest.sheets = await surveySheets(hb, outDir, JSON.parse(readFileSync(join(outDir, 'survey.json'), 'utf8')), {meta: o.isStory ? 'story' : new URL(o.url).host});} finally {await hb.close();}
      say('  ' + manifest.sheets.join(', '));
    } else if ((runA && frames) || fastDone) {
      say('\n시트 생성(구간별 12장)…');
      const hb = await launchHeadless();
      try {manifest.sheets = await stageSheets(hb, outDir, JSON.parse(readFileSync(join(outDir, 'diff.json'), 'utf8')), {meta: `${o.isStory ? 'story' : new URL(o.url).host} · ${o.script}`});}
      finally {await hb.close();}
      say(`  ${manifest.sheets.length}장: ${manifest.sheets.join(', ')}`);
    }
    saveJson(outDir, 'manifest.json', manifest);   // so the handoff list can include it
    manifest.handoff = ['manifest.json', 'perf-summary.json', 'video-summary.json', 'hover.json', 'drag.json', 'drag-evidence.json', 'probe.json', 'survey.json', 'diff.json', 'input.json', 'assets.json', 'tracks.json', ...manifest.sheets].filter((f) => existsSync(join(outDir, f)));
    saveJson(outDir, 'manifest.json', manifest);
    if (manifest.warnings.length) say('\n경고:\n  - ' + manifest.warnings.join('\n  - '));
    say(`\n끝. 다른 세션에 넘길 파일: ${manifest.handoff.join(', ')}\n폴더: ${outDir}\n`);
  } catch (e) {
    manifest.error = String(e.stack || e).split('\n').slice(0, 6).join('\n');
    try {saveJson(outDir, 'manifest.json', manifest);} catch {}
    console.error('\n실패: ' + (e.message || e));
    process.exitCode = 1;
  } finally {server?.stop();}
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) await main(process.argv.slice(2));
