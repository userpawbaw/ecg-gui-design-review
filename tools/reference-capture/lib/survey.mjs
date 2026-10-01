// Position-survey analysis (pure): per stop — travel activity, settle lag, ambient motion, forward/back stillness comparison (hysteresis).
const r2 = (v, d = 2) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : null);
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const median = (a) => {const s = [...a].sort((x, y) => x - y);return s.length ? s[s.length >> 1] : 0;};

/**
 * energyByStage: {stage: [energy per tick]} (60 Hz ticks, first may be null); notes: script notes ('stop', 'travelEndMs');
 * hysteresis: {stage: mean abs difference between this stop's down-still and up-still} (stops visited both ways), stepMs: tick length.
 */
export function surveyReport(energyByStage, notes, hysteresis, stepMs, {settleHold = 300, hystThreshold = 2} = {}) {
  const stops = notes.filter((n) => n.key === 'stop').map((n) => n.value), travel = Object.fromEntries(notes.filter((n) => n.key === 'travelEndMs').map((n) => [n.value.stage, n.value.ms]));
  const hold = Math.round(settleHold / stepMs), tail = Math.round(600 / stepMs);
  const rows = stops.map((s) => {
    const e = (energyByStage[s.stage] || []).map((v) => (Number.isFinite(v) ? v : 0));
    const t0 = Math.round((travel[s.stage] ?? 0) / stepMs), trav = e.slice(0, Math.max(1, t0)), rest = e.slice(t0);
    const calm = median(e.slice(-tail)), thr = Math.max(calm * 1.5 + 0.1, 0.3);
    let settle = null;
    for (let k = 0; k + hold <= rest.length; k++) if (rest.slice(k, k + hold).every((v) => v <= thr)) {settle = r2(k * stepMs, 0);break;}
    return {stage: s.stage, dir: s.dir, i: s.i, px: s.px, progress: r2(s.progress, 3), travelMeanEnergy: r2(mean(trav)), travelPeakEnergy: r2(Math.max(0, ...trav)), settleMs: settle, ambientEnergy: r2(calm), still: `frames/stills/${s.stage}.jpg`,
      stillDiffVsOtherDirection: r2(hysteresis[s.stage] ?? NaN)};
  });
  const down = rows.filter((r) => r.dir === 'down'), up = rows.filter((r) => r.dir === 'up');
  const hysteresis_ = hysteresisSummary(rows, hystThreshold);
  const settles = rows.map((r) => r.settleMs).filter((v) => v !== null);
  const ranked = [...down].sort((a, b) => b.travelMeanEnergy - a.travelMeanEnergy).slice(0, 6).map((r) => ({stage: r.stage, px: r.px, progress: r.progress, travelMeanEnergy: r.travelMeanEnergy}));
  return {
    summary: {
      stopsDown: down.length, stopsUp: up.length, stopPxNote: 'wheel notches of 100, one every 50 ms; dwell 2 s before each still',
      medianSettleMs: settles.length ? r2(median(settles), 0) : null, neverSettled: rows.filter((r) => r.settleMs === null).map((r) => r.stage),
      slowSettleStops: rows.filter((r) => r.settleMs !== null && r.settleMs > 800).map((r) => r.stage),
      ambientMotionStops: rows.filter((r) => r.ambientEnergy >= 0.6).map((r) => r.stage), medianAmbient: r2(median(rows.map((r) => r.ambientEnergy))),
      hysteresis: hysteresis_,
      hotspots: ranked,
    },
    stops: rows,
  };
}

/**
 * Forward/back stop pairs: each down stop is matched with the up stop at the same scroll progress (≤ tol apart) — pairing by index would be wrong
 * once the page end clamps the last down legs. Without a measurable progress, pair by index. Returns [[downStage, upStage, gap]].
 */
export function pairByProgress(stops, tol = 0.01) {
  const ups = stops.filter((s) => s.dir === 'up'), downs = stops.filter((s) => s.dir === 'down' || s.dir === 'top'), used = new Set(), pairs = [];
  for (const d of downs) {
    let best = null, bd = Infinity;
    for (const u of ups) {
      if (used.has(u.stage)) continue;
      const gap = Number.isFinite(d.progress) && Number.isFinite(u.progress) ? Math.abs(d.progress - u.progress) : d.i === u.i ? 0 : Infinity;
      if (gap < bd) {bd = gap;best = u;}
    }
    if (best && bd <= tol) {used.add(best.stage);pairs.push([d.stage, best.stage, r2(bd, 4)]);}
  }
  return pairs;
}

/**
 * Forward vs back comparison over matched pairs. Only calm stops count (idle animation or a live waveform makes stills differ by time alone).
 */
export function hysteresisSummary(rows, hystThreshold = 2) {
  const all = rows.filter((r) => r.stillDiffVsOtherDirection !== null), unmatched = rows.length - all.length;
  const hyst = all.filter((r) => r.ambientEnergy < 0.6).map((r) => r.stillDiffVsOtherDirection);
  if (!hyst.length) return {pairsMatched: all.length, pairs: 0, stopsWithoutMatch: unmatched, reading: 'no comparable pairs (all matched stops have ambient motion, or no stop was revisited at the same position)'};
  return {
    pairsMatched: all.length, pairs: hyst.length, stopsWithoutMatch: unmatched, note: 'matched by scroll progress (≤ 0.01); only stops with ambient energy < 0.6 are compared',
    medianDiff: r2(median(hyst)), differing: hyst.filter((v) => v > hystThreshold).length, threshold: hystThreshold,
    reading: median(hyst) <= hystThreshold ? 'a function of scroll position (scrub): forward and back stills match' : 'history-dependent: forward and back stills differ at the same position (triggered once / direction-dependent)',
  };
}
