/* D-196 잡음 장면(전원 간섭 · 기저선 · 근육) 영상 경로 — 3D 장면은 미리 렌더한 영상, 파형 패널 · 휠 겹침 · 안내 · 오버레이는 실시간.
 * 렌더: verification/noise-video-20261125/render_noise.cjs → make_noise_assets.py → data/noise-video/(prepare-v2가 public으로 복사).
 *  <cond>_in.mp4   장면 시작 → 카메라가 멈춘 뒤 1 s(앞 장면 끝 카메라에서 이어받음 — 실제 흐름과 같은 순서로 렌더)
 *  <cond>_loop.mp4 멈춘 구간 10 s 반복(신호 반복 주기 = 숨 · 주먹 · 심장 · 파문도 같은 주기), 끝 1 s를 처음과 교차 페이드
 *  ma_out.mp4      근육 장면 나가기(크레인 4 s)
 * 장면 시계 = 영상 재생 시각에서 계산 → 파형(같은 시계)과 영상 속 숨 · 주먹 · 심장 박동이 맞는다. 영상이 멈칫하면 시계도 함께 멈칫.
 * 시점 흔들림: 도입부와 같은 REF-002 상수(overscan 6 %, k = 1 − exp(−2·dt), 세로 × 0.27). */
export type NoiseCond = 'pli' | 'bw' | 'ma';
type SceneM = {start: number, hold: number, out?: number};
export type NoiseVideoManifest = {W: number, H: number, FPS: number, T: number, scenes: Record<NoiseCond, SceneM>};
export type NoiseVideo = {setScene(c: NoiseCond): void, clock(): number | null, leave(t: number): void, tick(dt: number): void,
  toScreen(nx: number, ny: number): {x: number, y: number}, aspect: number, dispose(): void};

const BASE = './noise-video/', OVERSCAN = .06, PITCH = .27, FADE_S = .3;
export async function loadNoiseVideo(host: HTMLElement, reduced: boolean): Promise<NoiseVideo | null> {
  let m: NoiseVideoManifest;
  try { const r = await fetch(BASE + 'manifest.json'); if (!r.ok) return null; m = await r.json(); } catch { return null; }
  const wrap = document.createElement('div'); wrap.className = 'ns-vid-wrap'; wrap.setAttribute('aria-hidden', 'true'); host.insertBefore(wrap, host.firstChild);
  const mk = (src: string, loop: boolean) => { const v = document.createElement('video'); v.className = 'ns-vid'; v.src = BASE + src; v.muted = true; v.playsInline = true; v.loop = loop; v.preload = 'auto'; v.style.opacity = '0'; wrap.appendChild(v); return v; };
  const conds: NoiseCond[] = ['pli', 'bw', 'ma'];
  const V = Object.fromEntries(conds.map(c => [c, {in: mk(`${c}_in.mp4`, false), loop: mk(`${c}_loop.mp4`, true), out: m.scenes[c].out ? mk(`${c}_out.mp4`, false) : null}])) as Record<NoiseCond, {in: HTMLVideoElement, loop: HTMLVideoElement, out: HTMLVideoElement | null}>;
  let cond: NoiseCond = 'pli', phase: 'in' | 'loop' | 'out' = 'in', loops = 0, lastCT = 0, leaveT = 0, shown: HTMLVideoElement | null = null;
  const show = (v: HTMLVideoElement, fade: boolean) => { const prev = shown; shown = v; v.style.transition = fade ? `opacity ${FADE_S}s linear` : 'none'; v.style.opacity = '1';
    if (prev && prev !== v) { prev.style.transition = fade ? `opacity ${FADE_S}s linear` : 'none'; prev.style.opacity = '0'; setTimeout(() => { if (shown !== prev) prev.pause(); }, fade ? FADE_S * 1000 + 50 : 0); } };
  // 들어옴 → 반복: 반복 영상이 실제로 재생되기 시작할 때 바꾼다(검은 틈 없이)
  const onEnded = (c: NoiseCond) => () => { if (cond !== c || phase !== 'in') return; const L = V[c].loop; L.currentTime = 0; loops = 0; lastCT = 0;
    L.addEventListener('playing', () => { if (cond === c && phase === 'in') { phase = 'loop'; show(L, false); } }, {once: true}); void L.play().catch(() => {}); };
  const ended = conds.map(c => { const f = onEnded(c); V[c].in.addEventListener('ended', f); return [c, f] as const; });
  const target = [0, 0], gaze = [0, 0], onMove = (e: PointerEvent) => { target[0] = e.clientX / innerWidth * 2 - 1; target[1] = e.clientY / innerHeight * 2 - 1; };
  addEventListener('pointermove', onMove);
  const cover = () => { const W = innerWidth, H = innerHeight, s = Math.max(W / m.W, H / m.H); return {s, ox: (W - m.W * s) / 2, oy: (H - m.H * s) / 2}; };
  const view = () => ({S: 1 + OVERSCAN, tx: -gaze[0] * OVERSCAN / 2 * innerWidth, ty: -gaze[1] * OVERSCAN / 2 * innerHeight * PITCH});
  return {
    aspect: m.W / m.H,
    setScene: c => { const first = shown === null; cond = c; phase = 'in'; loops = 0; const v = V[c].in; v.currentTime = 0; void v.play().catch(() => {}); show(v, !first); },
    clock: () => { const s = m.scenes[cond];
      if (phase === 'in') return s.start + V[cond].in.currentTime;
      if (phase === 'loop') { const L = V[cond].loop, ct = L.currentTime, P = Number.isFinite(L.duration) && L.duration > 0 ? L.duration : m.T; if (ct + .05 < lastCT) loops++; lastCT = ct; return s.hold + 1 + loops * P + ct; }   // 재생 위치가 뒤로 가면 한 바퀴(재생 중 영상은 앞으로만 감)
      return leaveT + (V[cond].out?.currentTime ?? 0); },
    leave: t => { const o = V[cond].out; if (!o) return; leaveT = t; phase = 'out'; o.currentTime = 0; void o.play().catch(() => {}); show(o, true); },   // 근육: 크레인(시작 자세가 다를 수 있어 교차 페이드)
    tick: dt => { const k = reduced ? 0 : 1 - Math.exp(-2 * dt); gaze[0] += (target[0] - gaze[0]) * k; gaze[1] += (target[1] - gaze[1]) * k;
      const v = view(); wrap.style.transform = `translate3d(${v.tx.toFixed(2)}px,${v.ty.toFixed(2)}px,0) scale(${v.S})`; },
    /** 3D 투영 좌표(NDC, 영상과 같은 16:9 카메라) → 화면 CSS px(object-fit: cover + 흔들림) */
    toScreen: (nx, ny) => { const c = cover(), v = view(), x = c.ox + (nx * .5 + .5) * m.W * c.s, y = c.oy + (-ny * .5 + .5) * m.H * c.s;
      return {x: innerWidth / 2 + (x - innerWidth / 2) * v.S + v.tx, y: innerHeight / 2 + (y - innerHeight / 2) * v.S + v.ty}; },
    dispose: () => { removeEventListener('pointermove', onMove); for (const [c, f] of ended) V[c].in.removeEventListener('ended', f);
      wrap.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); }); wrap.remove(); },
  };
}
