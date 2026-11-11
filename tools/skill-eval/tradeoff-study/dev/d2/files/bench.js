const { makeSignal } = require('./signal');
const { renderOverview } = require('./overview');
const s = makeSignal();
const t = process.hrtime.bigint();
const img = renderOverview(s, 1600, 240, -0.5, 2.0);
let ink = 0; for (const v of img) ink += v;
console.log(`render ${(Number(process.hrtime.bigint() - t) / 1e6).toFixed(0)} ms, ink ${ink}`);
