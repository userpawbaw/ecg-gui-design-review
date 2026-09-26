// Continuous wheel scroll through the track (100 px notches every 50 ms) — counts decode holds.
import {chromium} from '@playwright/test';
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const pg = await b.newPage({viewport: {width: 1280, height: 720}});
await pg.goto(`http://127.0.0.1:${process.argv[2] || 4193}/?clip=pan&hud=0`); await pg.waitForFunction(() => window.__vs?.ready);
await pg.mouse.move(640, 360);
const n = await pg.evaluate(() => Math.ceil((document.getElementById('track').offsetTop + document.getElementById('track').offsetHeight) / 100));
for (let k = 0; k < n; k++) { await pg.mouse.wheel(0, 100); await pg.waitForTimeout(50); }
await pg.waitForTimeout(1500);
console.log(JSON.stringify(await pg.evaluate(() => ({holds: window.__vs.stats.holds, decodedPeak: window.__vs.stats.decodedPeak, finalFrame: window.__vs.frame}))), 'notches', n);
await b.close();
