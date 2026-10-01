// `npm run ref:capture -- selftest` — proves the virtual clock + CSS correction on a fixture whose answer is known:
// a CSS animation, a CSS transition and a requestAnimationFrame loop all move 1000 px in 2 s from the first wheel notch.
// Expected: the three stay within 2 px of each other every frame, advance ~8 px per 16 ms frame, and a second pass is pixel-identical.
import {pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchBrowser} from './lib/browser.mjs';
import {framesPass} from './lib/frames.mjs';
import {frameHash} from './lib/analysis.mjs';
import {decodePng} from './lib/png.mjs';

export async function main() {
  const o = {url: pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/clock-probe.html')).href, script: 'standard', track: ['#a', '#b', '#c'], width: 800, height: 450,
    step: 1000 / 60, settleMs: 300, maxFrames: 400, wheelSettleMs: 40, ready: null};
  const {browser, info} = await launchBrowser({extraArgs: ['--disable-smooth-scrolling']});
  const fails = [];
  try {
    console.log(`\n자체 시험(고정 입력·정답이 알려진 페이지) — ${info.used} ${info.version}`);
    const run = () => framesPass(browser, o, {stopAfter: 260, memoryFrames: true});
    const a = await run(), b = await run();
    const xs = (k) => a.tracks.map((t) => t.values[k]?.x ?? NaN);
    const ax = xs(0), bx = xs(1), cx = xs(2);
    const moving = ax.map((v, i) => i).filter((i) => ax[i] > 5 && ax[i] < 995);
    let maxGap = 0;for (const i of moving) maxGap = Math.max(maxGap, Math.abs(ax[i] - bx[i]), Math.abs(ax[i] - cx[i]));
    const steps = moving.slice(1).map((i) => ax[i] - ax[i - 1]), perFrame = steps.reduce((s, v) => s + v, 0) / Math.max(1, steps.length);
    const want = 1000 / (2000 / o.step);
    if (moving.length < 100) fails.push(`움직이는 프레임이 ${moving.length}개뿐(≥100 필요) — 이동이 가상 시계를 따르지 않음`);
    if (maxGap > 2) fails.push(`CSS 애니메이션/전환/rAF 가 서로 ${maxGap.toFixed(1)} px 벌어짐(≤2 필요) — CSS 보정 실패`);
    if (Math.abs(perFrame - want) > 1) fails.push(`프레임당 이동 ${perFrame.toFixed(2)} px (기대 ${want} ± 1)`);
    const ha = a.shots.map((s) => frameHash(decodePng(s))), hb = b.shots.map((s) => frameHash(decodePng(s)));
    const same = ha.length === hb.length && ha.every((h, i) => h === hb[i]);
    if (!same) fails.push(`두 번째 실행과 프레임이 다름(${ha.filter((h, i) => h !== hb[i]).length}/${ha.length})`);
    console.log(`  움직인 프레임 ${moving.length} · 프레임당 이동 ${perFrame.toFixed(2)} px(기대 ${want}) · 세 방식 최대 간격 ${maxGap.toFixed(2)} px · CSS 보정 ${JSON.stringify(a.anim)}`);
    console.log(`  결정성: ${ha.length}프레임 중 ${ha.filter((h, i) => h === hb[i]).length}프레임 동일`);
  } finally {await browser.close();}
  console.log(fails.length ? `\n[selftest] FAIL\n  - ${fails.join('\n  - ')}\n` : '\n[selftest] PASS — 가상 시계가 JS 타이머·rAF·CSS 애니메이션·CSS 전환을 같은 시각으로 맞추고, 두 번 실행한 프레임이 같음\n');
  process.exitCode = fails.length ? 1 : 0;
}
if (fileURLToPath(import.meta.url) === process.argv[1]) await main();
