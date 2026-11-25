/* D-195 도입부 영상 경로 — 3D 장면은 미리 렌더한 영상, 파형 · 글자 · 겹침 조절은 실시간(엔진 계산은 그대로, GL 그리기만 생략).
 * 렌더: verification/intro-video-20261125/render_frames.cjs → make_assets.py → data/intro-video/(prepare-v2가 public으로 복사).
 *  first.mp4   첫 화면(진행 PV0) 반복 — 끝 1 s를 처음과 교차 페이드해 이음매 없음
 *  descent.mp4 클릭 뒤 하강(엔진과 같은 코사인 진행, 렌더 시계 T0 + 재생 시각) — 재생하는 동안 엔진 시계 = T0 + currentTime
 *  heart/*.webp 파형 단계 심장 박동 프레임(R 뒤 0–0.5 s 심실 hv00–15, R 앞 심방 ha00–05) — 쉬는 화면(idle.jpg) 위 심장 둘레만
 * 심장은 엔진의 박동 위상(파형과 같은 시계)으로 프레임을 골라 그린다 → 파형 R 피크와 박동이 맞음. */
export type VideoManifest = {W: number, H: number, FPS: number, T0: number, AUTO_S: number, PV0: number, PVA: number,
  heart: {x: number, y: number, w: number, h: number, hv: number, ha: number, aU0: number}};
export type IntroVideo = {clock(): number | null, k(): number | null, start(): void, reset(): void, heart(ph: {sincePrev: number, untilNext: number}): void,
  heartScreen(): {x: number, y: number}, resize(): void, dispose(): void, manifest: VideoManifest};

const BASE = './intro-video/';
export async function loadIntroVideo(host: HTMLElement, reduced: boolean): Promise<IntroVideo | null> {
  let m: VideoManifest;
  try { const r = await fetch(BASE + 'manifest.json'); if (!r.ok) return null; m = await r.json(); } catch { return null; }
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string) => { const e = document.createElement(tag); e.className = 'it-vid ' + cls; e.setAttribute('aria-hidden', 'true'); host.insertBefore(e, host.firstChild); return e; };
  const heartCv = mk('canvas', 'heart'), descent = mk('video', 'descent'), first = mk('video', 'first');
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
    heartScreen: () => { const c = cover(); return {x: c.ox + (m.heart.x + m.heart.w / 2) * c.s, y: c.oy + (m.heart.y + m.heart.h / 2) * c.s}; },
    resize: () => { cur = ''; },
    dispose: () => { descent.removeEventListener('ended', onEnded); for (const e of [first, descent, heartCv]) { if (e instanceof HTMLVideoElement) { e.pause(); e.removeAttribute('src'); e.load(); } e.remove(); } },
  };
}
