// Overview strip of a whole record: draws every sample into a width x height 1-bit raster.
// renderOverview(samples, width, height, vmin, vmax) -> Uint8Array(width*height), 1 = ink
function yOf(v, height, vmin, vmax) {
  const y = Math.round((1 - (v - vmin) / (vmax - vmin)) * (height - 1));
  return Math.min(height - 1, Math.max(0, y));
}

function drawSegment(img, width, height, x0, y0, x1, y1) {
  // integer line between two points
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (;;) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  for (const [px, py] of pts) img[py * width + px] = 1;
}

function renderOverview(samples, width, height, vmin, vmax) {
  const img = new Uint8Array(width * height);
  const n = samples.length;
  const points = [];
  for (let i = 0; i < n; i++) {
    points.push({ x: Math.floor((i * width) / n), y: yOf(samples[i], height, vmin, vmax) });
  }
  for (let i = 1; i < points.length; i++) {
    drawSegment(img, width, height, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  return img;
}

module.exports = { renderOverview };
