// Holter viewer: loads a whole 24 h record and prepares it for drawing.
export async function loadRecord(url) {
  const buf = await (await fetch(url)).arrayBuffer();          // raw file: little-endian int16, one lead
  const raw = new Int16Array(buf);
  const mv = new Float64Array(raw.length);                      // millivolts
  for (let i = 0; i < raw.length; i++) mv[i] = raw[i] * 0.005;  // 5 µV per LSB
  const filtered = baselineFilter(mv);                          // Float64Array, same length
  const points = [];                                            // pre-built points for canvas
  for (let i = 0; i < filtered.length; i++) points.push({ t: i / 250, v: filtered[i] });
  return { raw, mv, filtered, points };
}

export function drawWindow(ctx, rec, t0, t1, width, height) {
  const i0 = Math.max(0, Math.floor(t0 * 250)), i1 = Math.min(rec.points.length, Math.ceil(t1 * 250));
  ctx.beginPath();
  for (let i = i0; i < i1; i++) {
    const p = rec.points[i];
    const x = ((p.t - t0) / (t1 - t0)) * width, y = height / 2 - p.v * 80;
    if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function baselineFilter(x) {
  // one-pole high-pass, 0.5 Hz
  const y = new Float64Array(x.length), a = 0.9875;
  for (let i = 1; i < x.length; i++) y[i] = a * (y[i - 1] + x[i] - x[i - 1]);
  return y;
}
