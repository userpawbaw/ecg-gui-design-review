/* D-188 심박 추정(2026-11-19 사용자 「r 피크를 추정해서 심장 모형이 작게 뛰도록 … 박동마다의 최근 bpm … 말이 안되는 수치가 나온다면 이걸 검출하지 않도록 …
 * 이상 심박수의 경우 아예 -- … 심박수 200 이렇게 나오면 안된다」). 실험실 · 실시간 공통, DOM과 무관(시험 가능).
 *
 * 1) 신호마다 인과(과거 표본만) R 검출기: 5–15 Hz 대역통과 → 제곱 → 150 ms 이동 평균(Pan–Tompkins 계열) → 적응 문턱(신호 · 잡음 수준) +
 *    불응기 250 ms. R 위치 = 그 창 안 대역통과 신호 절댓값 최대(극성 무관).
 * 2) 투표: 입력과 기법 출력 각각의 검출이 ±80 ms 안에서 정족수(2개 이상이면 절반 이상, 최소 2)를 넘을 때만 박동으로 인정 —
 *    한 필터(예: 잡음 속 칼만)만 만든 가짜 피크는 박동이 되지 않는다.
 * 3) 표시 문턱: R–R 이 40–180 bpm 밖이면 버림, 처음엔 연속 3간격이 서로 ±20 % 안이어야 숫자를 낸다(고정). 고정 뒤 새 간격이 최근 중앙값에서
 *    ±30 % 넘게 벗어나면 숫자를 바꾸지 않고, 그런 간격이 2번 이어지면 고정을 풀고 「--」. 최근 박동이 끊기면(2 s 또는 중앙 간격 × 1.8) 「--」.
 *    전극 떨어짐(ok 0) · 신호 평탄 · 자료 끊김은 이유를 붙여 「--」.
 * 표시 bpm = 60 / 최근 4간격 중앙값(박동마다 갱신). */
export const HR = {band: [5, 15] as [number, number], mwiS: .15, refrS: .25, tolS: .08, minBpm: 40, maxBpm: 180, lockN: 3, lockTol: .2, jumpTol: .3, badRun: 2, recentN: 4, staleS: 2, staleK: 1.8, decideS: .45};

/** 2차 버터워스 대역통과(쌍선형) 두 단 = 저역 + 고역. */
function biquad(b0: number, b1: number, b2: number, a1: number, a2: number) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number) => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }
function lowpass(fc: number, fs: number) { const k = Math.tan(Math.PI * fc / fs), q = Math.SQRT2, n = 1 / (1 + q * k + k * k);
  return biquad(k * k * n, 2 * k * k * n, k * k * n, 2 * (k * k - 1) * n, (1 - q * k + k * k) * n); }
function highpass(fc: number, fs: number) { const k = Math.tan(Math.PI * fc / fs), q = Math.SQRT2, n = 1 / (1 + q * k + k * k);
  return biquad(n, -2 * n, n, 2 * (k * k - 1) * n, (1 - q * k + k * k) * n); }

/** 신호 하나의 인과 R 검출기. push(x, i): 절대 표본 번호 i의 값. 확정된 R(절대 번호)을 돌려준다(확정은 R 뒤 약 0.15–0.3 s). */
export function createDetector(fs: number) {
  const hp = highpass(HR.band[0], fs), lp = lowpass(HR.band[1], fs), W = Math.max(1, Math.round(HR.mwiS * fs)), refr = Math.round(HR.refrS * fs);
  const ring = new Float64Array(W), bpRing = new Float64Array(W * 2 + 2); let acc = 0, k = 0;
  let spk = 0, npk = 0, learnMax = 0, learnSum = 0, learnN = 0; const learnLen = Math.round(2 * fs);
  let prev2 = 0, prev1 = 0, last = -1e9, warm = 0, lastDecay = -1e9;
  return {
    push(x: number, i: number): number | null {
      const bp = lp(hp(x)); bpRing[i % bpRing.length] = bp;
      const e = bp * bp; acc += e - ring[k]; ring[k] = e; k = (k + 1) % W; const m = acc / W;
      warm++; let out: number | null = null;
      if (warm <= learnLen) { learnMax = Math.max(learnMax, m); learnSum += m; learnN++; if (warm === learnLen) { spk = .25 * learnMax; npk = .5 * learnSum / learnN; } }
      else if (prev1 > prev2 && prev1 >= m) {   // 이동 평균의 꼭짓점(한 표본 전)
        const thr = npk + .25 * (spk - npk), at = i - 1;
        if (prev1 > thr && at - last > refr) {
          // R = 꼭짓점 앞 창 안 |대역통과| 최대
          let best = at, bv = -1; for (let j = at - W; j <= at; j++) { const v = Math.abs(bpRing[((j % bpRing.length) + bpRing.length) % bpRing.length]); if (v > bv) { bv = v; best = j; } }
          // 큰 잡음 하나가 문턱을 오래 올려 두지 않게: 신호 수준 갱신은 지금 수준의 3배까지만
          if (best - last > refr) { out = best; last = best; spk = .125 * Math.min(prev1, 3 * spk) + .875 * spk; } else npk = .125 * prev1 + .875 * npk;
        } else npk = .125 * prev1 + .875 * npk;
      }
      // 1.5 s 동안 박동이 없으면 신호 수준을 절반으로(놓치고 있을 수 있음 — 다시 잡게)
      if (warm > learnLen && i - Math.max(last, lastDecay) > 1.5 * fs) { spk *= .5; lastDecay = i; }
      prev2 = prev1; prev1 = m; return out;
    },
  };
}

export type HrReason = 'learning' | 'leadoff' | 'flat' | 'nodata' | 'unstable' | 'lost' | null;
export type HrView = {bpm: number | null, reason: HrReason, beats: number[]};
/** 여러 신호의 검출을 모아 박동 인정 · 표시 상태를 만든다. names: 투표 신호 이름(입력 포함). */
export function createHeartRate(fs: number, names: string[]) {
  const det = new Map(names.map(n => [n, createDetector(fs)])), cand = new Map<string, number[]>(names.map(n => [n, []]));
  const need = names.length <= 1 ? 1 : Math.max(2, Math.ceil(names.length / 2)), tol = Math.round(HR.tolS * fs), decide = Math.round(HR.decideS * fs);
  const beats: number[] = [], rr: number[] = []; let locked = false, bad = 0, bpm: number | null = null, head = -1, lastBad = -1e9, flatSince = -1, lastPush = -1;
  let pendShort = 0, hold = false, flatMin = Infinity, flatMax = -Infinity, flatStart = 0; let reasonX: HrReason = 'learning';
  const accept = (r: number) => {
    const prev = beats[beats.length - 1]; beats.push(r); if (beats.length > 64) beats.shift();
    if (prev === undefined) return true;
    const iv = (r - prev) / fs, b = 60 / iv;
    if (b < HR.minBpm || b > HR.maxBpm) { bad++; if (bad >= HR.badRun) unlock(); return false; }
    if (!locked) { rr.push(iv); if (rr.length > HR.lockN) rr.shift();
      if (rr.length === HR.lockN) { const md = median(rr); if (rr.every(v => Math.abs(v - md) / md <= HR.lockTol)) { locked = true; bad = 0; bpm = Math.round(60 / median(rr.slice(-HR.recentN))); } }
      return true; }
    const md = median(rr.slice(-HR.recentN));
    if (Math.abs(iv - md) / md > HR.jumpTol) {
      // 조기 박동: 짧은 간격 + 보상 휴지기 — 두 간격의 합이 평소 두 간격(±20 %)이면 고정 유지(숫자는 바꾸지 않음)
      if (bad === 1 && pendShort > 0 && Math.abs(pendShort + iv - 2 * md) / (2 * md) <= HR.lockTol) { bad = 0; pendShort = 0; hold = false; return false; }
      bad++; pendShort = iv < md ? iv : 0; hold = iv > md; if (bad >= HR.badRun) unlock(); return false; }
    pendShort = 0; hold = false;
    bad = 0; rr.push(iv); if (rr.length > 16) rr.shift(); bpm = Math.round(60 / median(rr.slice(-HR.recentN))); return true;
  };
  const unlock = () => { locked = false; bpm = null; rr.length = 0; bad = 0; hold = false; };
  const shown: number[] = [];   // 심장을 뛰게 할 박동(인정 + 표시 문턱 통과)
  return {
    /** 표본 하나씩(같은 절대 번호 i의 모든 신호 값). ok: 전극 연결(없으면 true). */
    push(i: number, vals: Record<string, number>, ok = true) {
      head = i; lastPush = i; if (!ok) lastBad = i;
      const xin = vals[names[0]];
      if (xin !== undefined) { if (i - flatStart > fs) { flatStart = i; flatMin = xin; flatMax = xin; } else { flatMin = Math.min(flatMin, xin); flatMax = Math.max(flatMax, xin); }
        if (flatMax - flatMin < 1e-4) { if (flatSince < 0) flatSince = i; } else flatSince = -1; }
      for (const n of names) { const v = vals[n]; if (v === undefined || !Number.isFinite(v)) continue; const r = det.get(n)!.push(v, i); if (r !== null) cand.get(n)!.push(r); }
      // 결정: 가장 이른 후보가 decide 만큼 지났으면 그 주변 투표를 센다
      for (;;) { let early = Infinity; for (const c of cand.values()) if (c.length && c[0] < early) early = c[0];
        if (early === Infinity || i - early < decide) break;
        const votes: number[] = []; for (const c of cand.values()) { const j = c.findIndex(r => Math.abs(r - early) <= tol); if (j >= 0) { votes.push(c[j]); c.splice(0, j + 1); } }
        if (votes.length >= need) { const r = Math.round(median(votes)); if (!beats.length || r - beats[beats.length - 1] > Math.round(HR.refrS * fs)) { if (accept(r) && locked) { shown.push(r); if (shown.length > 64) shown.shift(); } } } }
    },
    view(): HrView {
      let reason: HrReason = null;
      if (head - lastBad < fs) reason = 'leadoff';   // 최근 1 s 안에 전극 떨어짐
      else if (flatSince >= 0 && head - flatSince > fs) reason = 'flat';
      else if (locked) { const last = beats[beats.length - 1] ?? -1e9, md = median(rr.slice(-HR.recentN)) * fs;
        if (head - last > Math.max(HR.staleS * fs, HR.staleK * md) + decide) { unlock(); reason = 'lost'; } }
      else reason = beats.length < 2 ? 'learning' : 'unstable';
      if (!reason && hold) reason = 'unstable';   // 간격이 갑자기 길어짐(놓친 박동 · 리듬 변화) — 다음 정상 간격까지 숫자 내림
      if (reason) { reasonX = reason; return {bpm: null, reason, beats: shown}; }
      reasonX = null; return {bpm, reason: null, beats: shown};
    },
    get reason() { return reasonX; }, get lastPush() { return lastPush; },
  };
}
export function median(a: number[]) { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
export const REASON_TEXT: Record<Exclude<HrReason, null>, string> = {learning: '측정 중', leadoff: '연결 불량', flat: '신호 없음', nodata: '신호 없음', unstable: '신호 불안정', lost: '박동 확인 안 됨'};
