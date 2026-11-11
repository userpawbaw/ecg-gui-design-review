function yOf(v, height, vmin, vmax) {
  const y = Math.round((1 - (v - vmin) / (vmax - vmin)) * (height - 1));
  return Math.min(height - 1, Math.max(0, y));
}
function renderOverview(samples, width, height, vmin, vmax) {
  const img = new Uint8Array(width * height), n = samples.length;
  const lo = new Int32Array(width).fill(1 << 30), hi = new Int32Array(width).fill(-1);
  let px = -1, py = 0;
  const mark = (x, y) => { if (y < lo[x]) lo[x] = y; if (y > hi[x]) hi[x] = y; };
  for (let i = 0; i < n; i++) {
    const x = Math.floor((i * width) / n), y = yOf(samples[i], height, vmin, vmax);
    if (px >= 0 && x !== px) {
      // bresenham between (px,py) and (x,y) spans columns; emulate with exact integer line
      const dx = Math.abs(x - px), dy = Math.abs(y - py), sx = px < x ? 1 : -1, sy = py < y ? 1 : -1;
      let err = dx - dy, cx = px, cy = py;
      for (;;) { mark(cx, cy); if (cx === x && cy === y) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; cx += sx; } if (e2 < dx) { err += dx; cy += sy; } }
    } else mark(x, y);
    px = x; py = y;
  }
  for (let x = 0; x < width; x++) for (let y = lo[x]; y <= hi[x]; y++) img[y * width + x] = 1;
  return img;
}
module.exports = { renderOverview };
