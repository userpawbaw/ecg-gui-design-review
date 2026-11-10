// D-164 → D-167 도입부 포인터 유체 왜곡 — leoparpeix 효과(REF-002 2026-11-10 절)를 같은 방정식 · 같은 수치로 새로 쓴 것.
// 사이트 코드 · 셰이더는 옮기지 않았다(REF 규칙).
// 2026-11-10 사용자 「제목에만 나타나는데 … 화면 전체에 적용되도록, 가장 위 레이어인 느낌으로」: 사이트는 화면 전체가 WebGL이라 한 번에
// 일그러뜨린다. 여기는 3D 캔버스 + 2D 캔버스 + DOM이 겹쳐 있어, 움직이는 동안만 화면을 2D 캔버스 한 장에 다시 그리고(3D 장면 →
// 파형 · 격자 캔버스 → 글자 · 버튼 상자 · 외곽선 글자 · SVG 아이콘, 문서 순서) 그 그림을 맨 위 오버레이에서 일그러뜨린다.
// 오버레이는 속도가 있는 곳만 불투명하고 나머지는 투명이라, 평소에는 원래 화면(선명한 DOM, 클릭 가능)이 그대로 보인다.
// 구조:
//  1) 화면 전체 기준 안정 유체(화면 20 % 해상도): 이류 → 포인터 외력 → 발산 → 압력(Jacobi 1회) → 기울기 빼기.
//     고정 간격 1/120 s, 프레임당 최대 8단계, 단계 dt 0.015 × 0.875, 감쇠 0.98^0.875, 힘 (이동량/2) × 80 × 1.75 ÷ 단계 수,
//     반지름 20 칸 × (화면 폭/1440), 분포 (1 − r)².
//  2) 합성: uv + vel × 0.003(화면 uv), 흐림 반경 |vel| × 15 × 1.5 px 안의 무작위 원판 15점 평균, 밝힘 mix(c, c × 1.25, |vel| × 0.75).
//     불투명도 smoothstep(0.015, 0.08, |vel|).
//  3) 마지막 포인터 이동 2.5 s 뒤에는 시뮬레이션 · 화면 다시 그리기를 멈춘다(속도가 그때 ~0.1 % — 보이지 않음).
// 이 프레임의 3D 캔버스를 읽으므로 update()는 composer.render() 뒤에 부른다.
import * as THREE from 'three';

const SIM_RES = .2, STEP = 1 / 120, MAX_STEPS = 8, DT = .015 * .875, DISS = Math.pow(.98, .875), FORCE = 80 * 1.75;
const DISTORT = .003, VEL_BLUR = 15, TAPS = 15, IDLE_S = 2.5;
// 2026-11-10 사용자 「마우스 효과가 내 쪽에서 재현되지 않아」(O-012): 세기 문제가 아니라 켜지는 조건 문제. 꺼지면 이유를 콘솔에 남긴다.
//  ?fluid=<배율> 외력 배율(기본 1 = 사이트), 0 = 끔. 값을 주면 움직임 줄이기 · 좁은 창 · 터치 장치에서도 켠다.
const FQ = new URLSearchParams(location.search);
export const FLUID_FORCED = FQ.has('fluid') && Number(FQ.get('fluid')) > 0;
export const FLUID_GAIN = FQ.has('fluid') && Number.isFinite(Number(FQ.get('fluid'))) ? Math.max(0, Number(FQ.get('fluid'))) : 1;

const VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const ADVECT = `precision highp float;varying vec2 vUv;uniform sampler2D vel;uniform float dt,diss;uniform vec2 ratio;
void main(){vec2 v=texture2D(vel,vUv).xy;gl_FragColor=vec4(texture2D(vel,vUv-v*dt*ratio).xy*diss,0.,1.);}`;
const SPLAT_V = `varying vec2 vUv;uniform vec2 center,halfSize;void main(){vUv=uv;gl_Position=vec4(position.xy*2.*halfSize+center,0.,1.);}`;
const SPLAT_F = `precision highp float;varying vec2 vUv;uniform vec2 force;
void main(){float r=length(vUv*2.-1.);float k=1.-min(r,1.);gl_FragColor=vec4(force*k*k,0.,1.);}`;
const DIVERGE = `precision highp float;varying vec2 vUv;uniform sampler2D vel;uniform vec2 px;uniform float dt;
void main(){float l=texture2D(vel,vUv-vec2(px.x,0.)).x,r=texture2D(vel,vUv+vec2(px.x,0.)).x,b=texture2D(vel,vUv-vec2(0.,px.y)).y,t=texture2D(vel,vUv+vec2(0.,px.y)).y;
gl_FragColor=vec4((r-l+t-b)*.5/dt);}`;
// Jacobi 1회를 0 압력에서 시작하면 p = −div 가 된다(사이트도 반복 1회라 같은 결과)
const PRESSURE = `precision highp float;varying vec2 vUv;uniform sampler2D div;void main(){gl_FragColor=vec4(-texture2D(div,vUv).r);}`;
const PROJECT = `precision highp float;varying vec2 vUv;uniform sampler2D vel,pre;uniform vec2 px;uniform float dt;
void main(){float l=texture2D(pre,vUv-vec2(px.x,0.)).r,r=texture2D(pre,vUv+vec2(px.x,0.)).r,b=texture2D(pre,vUv-vec2(0.,px.y)).r,t=texture2D(pre,vUv+vec2(0.,px.y)).r;
vec2 v=texture2D(vel,vUv).xy-vec2(r-l,t-b)*.5*dt;gl_FragColor=vec4(v,0.,1.);}`;
// 합성: 화면 uv(아래 원점)에서 속도장과 다시 그린 화면을 읽는다. 흐림은 픽셀별 해시에서 이어지는 난수열로 원판 표본.
const COMPOSE = `precision highp float;varying vec2 vUv;uniform sampler2D tex,vel;uniform vec2 screen;uniform float distort,velBlur;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec3 tap(vec2 u){return texture2D(tex,clamp(u,0.,1.)).rgb;}
void main(){vec2 v=texture2D(vel,vUv).xy;float m=length(v);float a=smoothstep(.015,.08,m);if(a<=0.){gl_FragColor=vec4(0.);return;}
vec2 q=vUv+v*distort;float R=m*velBlur*1.5;vec3 c;
if(R<.05)c=tap(q);else{float asp=screen.x/screen.y;vec2 s=vec2(h(gl_FragCoord.xy+m*731.),h(gl_FragCoord.yx*1.37+m*113.));c=vec3(0.);
for(int i=0;i<${TAPS};i++){s=fract(s*vec2(12.9898,78.233)+.1234);vec2 d=sqrt(s.x+.001)*vec2(sin(s.y*6.2831853),cos(s.y*6.2831853));c+=tap(q+d*R/screen*vec2(asp,1./asp));}
c/=${TAPS}.;}
c=mix(c,c*1.25,min(1.,m*.75));gl_FragColor=vec4(c*a,a);}`;

export type ScreenFluid = {update(dt: number): void, dispose(): void};

const alphaOf = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c === 'transparent' ? 0 : 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };

/** host: the intro root (fixed, full viewport); its canvases (3D scene first) are read after they were drawn this frame. */
export function createScreenFluid(host: HTMLElement): ScreenFluid | null {
  // 사이트는 터치 장치 · 폭 1025 px 미만에서 끈다. 여기서는 마우스가 하나라도 있으면 켜고(터치 화면 노트북), 폭은 700 px까지 허용
  const off = FLUID_GAIN === 0 ? '?fluid=0' : FLUID_FORCED ? '' : !matchMedia('(any-pointer: fine)').matches ? '마우스 없음(터치 전용)' : innerWidth < 700 ? `창 폭 ${innerWidth} px < 700` : '';
  if (off) { console.info('[screenFluid] 꺼짐:', off); return null; }
  const canvas = document.createElement('canvas');
  canvas.className = 'it-screen-fluid'; canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '50'});   // 맨 위 층, 클릭은 통과
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance'}); }
  catch (e) { console.info('[screenFluid] 꺼짐: WebGL 생성 실패', e); return null; }
  host.appendChild(canvas);
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(devicePixelRatio || 1, 1.5); renderer.setPixelRatio(dpr);

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.PlaneGeometry(2, 2);
  const pass = (frag: string, uniforms: Record<string, THREE.IUniform>) => {
    const mat = new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false});
    const scene = new THREE.Scene(); scene.add(new THREE.Mesh(quad, mat)); return {mat, scene};
  };
  const rt = () => new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false});
  const vel0 = rt(), vel1 = rt(), div = rt(), pre = rt();
  const px = new THREE.Vector2(), ratio = new THREE.Vector2();
  const advect = pass(ADVECT, {vel: {value: null}, dt: {value: DT}, diss: {value: DISS}, ratio: {value: ratio}});
  const diverge = pass(DIVERGE, {vel: {value: vel1.texture}, px: {value: px}, dt: {value: DT}});
  const pressure = pass(PRESSURE, {div: {value: div.texture}});
  const project = pass(PROJECT, {vel: {value: vel1.texture}, pre: {value: pre.texture}, px: {value: px}, dt: {value: DT}});
  const splatMat = new THREE.ShaderMaterial({vertexShader: SPLAT_V, fragmentShader: SPLAT_F, depthTest: false, depthWrite: false,
    blending: THREE.AdditiveBlending, transparent: true,
    uniforms: {center: {value: new THREE.Vector2()}, halfSize: {value: new THREE.Vector2()}, force: {value: new THREE.Vector2()}}});
  const splat = new THREE.Scene(); splat.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), splatMat));

  // 화면을 다시 그리는 2D 캔버스(CSS px 1:1)
  const sc = document.createElement('canvas'), sg = sc.getContext('2d')!;
  const tex = new THREE.CanvasTexture(sc); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace;
  const screen = new THREE.Vector2();
  const compose = pass(COMPOSE, {tex: {value: tex}, vel: {value: vel0.texture}, screen: {value: screen}, distort: {value: DISTORT}, velBlur: {value: VEL_BLUR}});
  compose.mat.transparent = true; compose.mat.blending = THREE.NoBlending;

  let W = 0, H = 0, fw = 0, fh = 0;
  const resize = () => {
    W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); screen.set(W, H); sc.width = W; sc.height = H;
    fw = Math.max(8, Math.floor(W * SIM_RES)); fh = Math.max(8, Math.floor(H * SIM_RES));
    for (const r of [vel0, vel1, div, pre]) r.setSize(fw, fh);
    px.set(1 / fw, 1 / fh); ratio.set(Math.max(fw, fh) / fw, Math.max(fw, fh) / fh);
  };

  // 포인터: 화면 NDC(오른쪽 +x, 위 +y), 프레임마다 이동량을 모은다
  const ptr = {x: 0, y: 0, ox: 0, oy: 0, seen: false};
  let lastMove = -1e9;
  const onMove = (e: PointerEvent) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; if (!ptr.seen) { ptr.ox = ptr.x; ptr.oy = ptr.y; ptr.seen = true; } lastMove = performance.now(); };
  addEventListener('pointermove', onMove, {passive: true, capture: true});   // capture: 스크롤 층이 위에 있어도 받는다
  addEventListener('resize', resize); resize();

  let acc = 0, live = false;
  const run = (q: {scene: THREE.Scene}, target: THREE.WebGLRenderTarget) => { renderer.setRenderTarget(target); renderer.render(q.scene, cam); };
  const simStep = (fx: number, fy: number, share: number) => {
    advect.mat.uniforms.vel.value = vel0.texture; run(advect, vel1);
    const u = splatMat.uniforms, rCells = 20 * (fw / (1440 * SIM_RES));
    const cx = Math.max(-1, Math.min(1, ptr.x)), cy = Math.max(-1, Math.min(1, ptr.y));
    const lim = Math.min(rCells, (1 - Math.abs(cx)) * fw / 2, (1 - Math.abs(cy)) * fh / 2);
    u.center.value.set(cx, cy); u.halfSize.value.set(lim * 2 / fw, lim * 2 / fh); u.force.value.set(fx / 2 * FORCE * FLUID_GAIN * share, fy / 2 * FORCE * FLUID_GAIN * share);
    renderer.setRenderTarget(vel1); renderer.render(splat, cam);
    run(diverge, div); run(pressure, pre); run(project, vel0);
  };

  // ---- 화면 다시 그리기 -------------------------------------------------------------------------------------------
  const svgCache = new WeakMap<Element, {key: string, img: HTMLImageElement, ok: boolean}>();
  const SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'opacity', 'transform', 'filter'] as const;
  const svgImage = (svg: SVGSVGElement) => {   // 계산된 스타일(애니메이션 중 값 포함)을 속성으로 박아 그림으로 만든다
    const clone = svg.cloneNode(true) as SVGSVGElement, src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((el, i) => { const cs = getComputedStyle(el), d = dst[i] as SVGElement; d.removeAttribute('class');
      for (const p of SVG_PROPS) { const v = cs.getPropertyValue(p); if (v && v !== 'none' && !(p === 'transform' && el === svg)) d.style.setProperty(p, v); }
      if (cs.transformOrigin && el !== svg) { d.style.transformOrigin = cs.transformOrigin; d.style.transformBox = cs.getPropertyValue('transform-box'); } });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const r = svg.getBoundingClientRect(); clone.setAttribute('width', String(r.width)); clone.setAttribute('height', String(r.height));
    const key = new XMLSerializer().serializeToString(clone);
    let c = svgCache.get(svg);
    if (!c || c.key !== key) {
      const img = new Image(), entry = {key, img, ok: c?.ok ?? false}; const prev = c;
      img.onload = () => { entry.ok = true; }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(key);
      svgCache.set(svg, entry); c = entry;
      if (prev?.ok && !entry.ok) return prev.img;   // 새 그림이 풀릴 때까지 직전 그림
    }
    return c.ok ? c.img : null;
  };
  const opacityOf = (el: Element, memo: Map<Element, number>): number => {
    if (el === host) return 1;
    const m = memo.get(el); if (m !== undefined) return m;
    const cs = getComputedStyle(el);
    const v = cs.display === 'none' || cs.visibility === 'hidden' ? 0 : parseFloat(cs.opacity) * (el.parentElement ? opacityOf(el.parentElement, memo) : 1);
    memo.set(el, v); return v;
  };
  const radius = (cs: CSSStyleDeclaration, r: DOMRect) => Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2);
  const drawText = (n: Text, el: Element, cs: CSSStyleDeclaration, a: number) => {
    const text = n.textContent ?? ''; if (!text.trim()) return;
    const range = document.createRange(); range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter(q => q.width > 0); if (!rects.length) return;
    const he = el as HTMLElement, scale = he.offsetWidth ? el.getBoundingClientRect().width / he.offsetWidth : 1;
    const fs = parseFloat(cs.fontSize) * scale, ls = (parseFloat(cs.letterSpacing) || 0) * scale;
    sg.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    (sg as CanvasRenderingContext2D & {letterSpacing: string}).letterSpacing = ls + 'px';
    const fill = cs.getPropertyValue('-webkit-text-fill-color') || cs.color, sw = parseFloat(cs.getPropertyValue('-webkit-text-stroke-width')) || 0;
    const m = sg.measureText('가Ag'), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    const put = (s: string, q: DOMRect) => { const y = q.top + (q.height - asc - desc) / 2 + asc;
      if (alphaOf(fill) > 0) { sg.fillStyle = fill; sg.fillText(s, q.left, y); }
      if (sw > 0) { sg.strokeStyle = cs.getPropertyValue('-webkit-text-stroke-color') || cs.color; sg.lineWidth = sw * scale; sg.strokeText(s, q.left, y); } };
    sg.globalAlpha = a; sg.textBaseline = 'alphabetic';
    if (rects.length === 1) put(text, rects[0]);
    else for (let i = 0; i < text.length; i++) { if (!text[i].trim()) continue; range.setStart(n, i); range.setEnd(n, i + 1); const q = range.getBoundingClientRect(); if (q.width) put(text[i], q); }
  };
  const repaint = () => {
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalAlpha = 1; sg.fillStyle = '#000'; sg.fillRect(0, 0, W, H);
    const memo = new Map<Element, number>();
    const walk = document.createTreeWalker(host, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) { const el = n.parentElement!; if (el.closest('svg')) continue; const a = opacityOf(el, memo); if (a > .003) drawText(n as Text, el, getComputedStyle(el), a); continue; }
      const el = n as Element; if (el === canvas) continue;
      const a = opacityOf(el, memo); if (a <= .003) continue;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
      sg.globalAlpha = a;
      if (el instanceof HTMLCanvasElement) { if (el.width && el.height) try { sg.drawImage(el, r.left, r.top, r.width, r.height); } catch { /* 아직 그리지 않은 캔버스 */ } continue; }
      if (el instanceof SVGSVGElement) { const img = svgImage(el); if (img) sg.drawImage(img, r.left, r.top, r.width, r.height); continue; }
      if (el instanceof SVGElement) continue;
      const cs = getComputedStyle(el), bg = cs.backgroundColor, bw = parseFloat(cs.borderTopWidth) || 0, bc = cs.borderTopColor;
      const hasBg = alphaOf(bg) > 0, hasBd = bw > 0 && cs.borderTopStyle !== 'none' && alphaOf(bc) > 0;
      if (hasBg || hasBd) {
        const rr = radius(cs, r); sg.beginPath(); sg.roundRect(r.left + bw / 2, r.top + bw / 2, r.width - bw, r.height - bw, Math.max(0, rr - bw / 2));
        if (hasBg) { sg.fillStyle = bg; sg.fill(); }
        if (hasBd) { sg.strokeStyle = bc; sg.lineWidth = bw; sg.stroke(); }
      }
    }
    sg.globalAlpha = 1; tex.needsUpdate = true;
  };

  return {
    update(dt: number) {
      if (!W) return;
      const idle = (performance.now() - lastMove) / 1000;
      if (idle > IDLE_S) {   // 멈춘 뒤에는 아무것도 하지 않는다(한 번 지우고 끝)
        if (live) { renderer.setRenderTarget(null); renderer.clear(); live = false; for (const r of [vel0, vel1]) { renderer.setRenderTarget(r); renderer.clear(); } renderer.setRenderTarget(null); acc = 0; }
        ptr.ox = ptr.x; ptr.oy = ptr.y; return;
      }
      live = true;
      // 시뮬레이션(사이트와 같은 고정 간격)
      acc += Math.min(Math.max(dt, 0), 1 / 15);
      const dx = ptr.seen ? ptr.x - ptr.ox : 0, dy = ptr.seen ? ptr.y - ptr.oy : 0; ptr.ox = ptr.x; ptr.oy = ptr.y;
      let n = 0; while (acc >= STEP && n < MAX_STEPS) { acc -= STEP; n++; }
      for (let i = 0; i < n; i++) simStep(dx, dy, 1 / n);
      repaint();
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(compose.scene, cam);
    },
    dispose() {
      removeEventListener('pointermove', onMove, {capture: true}); removeEventListener('resize', resize);
      canvas.remove();
      for (const r of [vel0, vel1, div, pre]) r.dispose(); tex.dispose(); renderer.dispose();
    },
  };
}
