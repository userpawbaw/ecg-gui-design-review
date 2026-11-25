/* D-195 도입부 영상 경로 — 3D 장면은 미리 렌더한 영상, 파형 · 글자 · 겹침 조절은 실시간(엔진 계산은 그대로, GL 그리기만 생략).
 * 렌더: verification/intro-video-20261125/render_frames.cjs → make_assets.py → data/intro-video/(prepare-v2가 public으로 복사).
 *  first.mp4   첫 화면(진행 PV0) 반복 — 끝 1 s를 처음과 교차 페이드해 이음매 없음
 *  descent.mp4 클릭 뒤 하강(엔진과 같은 코사인 진행, 렌더 시계 T0 + 재생 시각) — 재생하는 동안 엔진 시계 = T0 + currentTime
 *  heart/*.webp 파형 단계 심장 박동 프레임(R 뒤 0–0.5 s 심실 hv00–15, R 앞 심방 ha00–05) — 쉬는 화면(idle.jpg) 위 심장 둘레만
 * 심장은 엔진의 박동 위상(파형과 같은 시계)으로 프레임을 골라 그린다 → 파형 R 피크와 박동이 맞음. */
export type VideoManifest = {W: number, H: number, FPS: number, T0: number, AUTO_S: number, PV0: number, PVA: number,
  heart: {x: number, y: number, w: number, h: number, hv: number, ha: number, aU0: number}};
export type IntroVideo = {clock(): number | null, k(): number | null, start(): void, reset(): void, heart(ph: {sincePrev: number, untilNext: number}): void, tick(dt: number): void,
  heartScreen(): {x: number, y: number}, resize(): void, dispose(): void, manifest: VideoManifest};

const BASE = './intro-video/';
/* 시점 흔들림(사용자 2026-11-25 「화면 가장자리를 마우스 위치에 따라 드러나게 하는 leoparpeix 예제 수준 … 가속 방식」):
 * REF-002 EFX-002-01 상수 — 영상을 6 % 크게 깔고(overscan) 그 여백 안에서 이동, 따라가기 k = 1 − exp(−2·dt)(멈춘 뒤 ≈1.5 s에 95 %),
 * 세로 폭 = 가로 × 0.27. 포인터 쪽 가장자리가 드러난다(포인터가 오른쪽이면 화면이 왼쪽으로). 움직임 줄이기면 끔. */
const OVERSCAN = .06, PITCH = .27;
export async function loadIntroVideo(host: HTMLElement, reduced: boolean): Promise<IntroVideo | null> {
  let m: VideoManifest;
  try { const r = await fetch(BASE + 'manifest.json'); if (!r.ok) return null; m = await r.json(); } catch { return null; }
  const wrap = document.createElement('div'); wrap.className = 'it-vid-wrap'; wrap.setAttribute('aria-hidden', 'true'); host.insertBefore(wrap, host.firstChild);
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string) => { const e = document.createElement(tag); e.className = 'it-vid ' + cls; wrap.appendChild(e); return e; };
  const heartCv = mk('canvas', 'heart'), descent = mk('video', 'descent'), first = mk('video', 'first');
  const target = [0, 0], gaze = [0, 0], onMove = (e: PointerEvent) => { target[0] = e.clientX / innerWidth * 2 - 1; target[1] = e.clientY / innerHeight * 2 - 1; };
  addEventListener('pointermove', onMove);
  const view = () => ({S: 1 + OVERSCAN, tx: -gaze[0] * OVERSCAN / 2 * innerWidth, ty: -gaze[1] * OVERSCAN / 2 * innerHeight * PITCH});
  for (const [v, src, loop] of [[first, 'first.mp4', true], [descent, 'descent.mp4', false]] as const) { v.src = BASE + src; v.muted = true; v.playsInline = true; v.loop = loop; v.preload = 'auto'; }
  first.poster = BASE + 'first_poster.jpg'; descent.style.opacity = '0'; heartCv.style.opacity = '0';
  void first.play().catch(() => {});
  // 심장: 쉬는 화면 + 박동 프레임(모두 미리 디코딩)
  const img = (src: string) => new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = BASE + src; });
  const idle = img('idle.jpg'), hv = Array.from({length: m.heart.hv}, (_, j) => img(`heart/hv${String(j).padStart(2, '0')}.webp`)), ha = Array.from({length: m.heart.ha}, (_, j) => img(`heart/ha${String(j).padStart(2, '0')}.webp`));
  const frames = Promise.all([idle, Promise.all(hv), Promise.all(ha)]);
  let phase: 'first' | 'descent' | 'heart' = 'first', endAt = 0, cur = '', loaded: [HTMLImageElement, HTMLImageElement[], HTMLImageElement[]] | null = null;
  void frames.then(f => { loaded = f; cur = ''; }).catch(e => console.warn('intro heart frames', e));
  // object-fit: cover 와 같은 변환(영상 좌표 → 화면 CSS px)
  const cover = () => { const W = innerWidth, H = innerHeight, s = Math.max(W / m.W, H / m.H); return {s, ox: (W - m.W * s) / 2, oy: (H - m.H * s) / 2}; };
  const drawHeart = (key: string, sprite: HTMLImageElement | null) => {
    if (!loaded || key === cur) return; cur = key;
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (heartCv.width !== Math.round(W * dpr) || heartCv.height !== Math.round(H * dpr)) { heartCv.width = Math.round(W * dpr); heartCv.height = Math.round(H * dpr); }
    const g = heartCv.getContext('2d')!, c = cover(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.drawImage(loaded[0], c.ox, c.oy, m.W * c.s, m.H * c.s);
    if (sprite) g.drawImage(sprite, c.ox + m.heart.x * c.s, c.oy + m.heart.y * c.s, m.heart.w * c.s, m.heart.h * c.s);
  };
  const toHeart = () => { phase = 'heart'; endAt = performance.now(); cur = ''; heartCv.style.opacity = '1'; descent.style.opacity = '0'; first.style.opacity = '0'; first.pause(); };
  const onEnded = () => { if (phase === 'descent') toHeart(); };
  descent.addEventListener('ended', onEnded);
  return {
    manifest: m,
    clock: () => phase === 'descent' ? m.T0 + Math.min(descent.currentTime, m.AUTO_S) : phase === 'heart' ? m.T0 + m.AUTO_S + (performance.now() - endAt) / 1000 : null,
    k: () => phase === 'descent' ? Math.min(1, descent.currentTime / m.AUTO_S) : phase === 'heart' ? 1 : null,
    start: () => { if (phase !== 'first') return; if (reduced) { toHeart(); return; }
      phase = 'descent'; descent.currentTime = 0; void descent.play().catch(() => toHeart());
      descent.style.opacity = '1'; first.style.opacity = '0'; },   // 겹친 상태로 바로 바꿈(첫 프레임이 같은 진행값)
    reset: () => { phase = 'first'; descent.pause(); descent.currentTime = 0; descent.style.opacity = '0'; heartCv.style.opacity = '0'; first.style.opacity = '1'; void first.play().catch(() => {}); },
    heart: ph => { if (phase !== 'heart' || !loaded) return; const s = ph.sincePrev, u = ph.untilNext, nv = loaded[1].length, na = loaded[2].length;
      const j = Math.floor(s * m.FPS);
      if (j < nv) drawHeart('v' + j, loaded[1][j]);
      else if (u <= m.heart.aU0 && u > m.heart.aU0 - na / m.FPS) { const a = Math.min(na - 1, Math.floor((m.heart.aU0 - u) * m.FPS)); drawHeart('a' + a, loaded[2][a]); }
      else drawHeart('idle', null); },
    heartScreen: () => { const c = cover(), v = view(), x = c.ox + (m.heart.x + m.heart.w / 2) * c.s, y = c.oy + (m.heart.y + m.heart.h / 2) * c.s;
      return {x: innerWidth / 2 + (x - innerWidth / 2) * v.S + v.tx, y: innerHeight / 2 + (y - innerHeight / 2) * v.S + v.ty}; },   // 흔들림 변환까지
    tick: dt => { const k = reduced ? 0 : 1 - Math.exp(-2 * dt); gaze[0] += (target[0] - gaze[0]) * k; gaze[1] += (target[1] - gaze[1]) * k;
      const v = view(); wrap.style.transform = `translate3d(${v.tx.toFixed(2)}px,${v.ty.toFixed(2)}px,0) scale(${v.S})`; },
    resize: () => { cur = ''; },
    dispose: () => { removeEventListener('pointermove', onMove); wrap.remove(); descent.removeEventListener('ended', onEnded); for (const e of [first, descent, heartCv]) { if (e instanceof HTMLVideoElement) { e.pause(); e.removeAttribute('src'); e.load(); } e.remove(); } },
  };
}
