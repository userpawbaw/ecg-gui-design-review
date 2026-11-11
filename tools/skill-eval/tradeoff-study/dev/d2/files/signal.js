// Deterministic synthetic long ECG-like record (no external data needed).
function makeSignal(n = 3_000_000, fs = 500) {
  const s = new Float32Array(n);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const beat = Math.round(fs * 0.83);
  for (let i = 0; i < n; i++) {
    const p = i % beat;
    let v = 0.05 * Math.sin((2 * Math.PI * i) / (fs * 4)) + (rnd() - 0.5) * 0.04;
    if (p === 60) v += 1.0 + 0.5 * rnd();            // narrow R peak, one sample wide
    else if (p === 59 || p === 61) v += 0.35;
    else if (p > 150 && p < 230) v += 0.18 * Math.sin((Math.PI * (p - 150)) / 80);
    s[i] = v;
  }
  return s;
}
module.exports = { makeSignal };
