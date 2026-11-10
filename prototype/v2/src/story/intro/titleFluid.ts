// D-164 도입부 제목의 포인터 유체 왜곡 — leoparpeix 효과(REF-002 2026-11-10 절)를 같은 방정식 · 같은 수치로 새로 쓴 것.
// 사이트 코드 · 셰이더는 옮기지 않았다(REF 규칙). 구조:
//  1) 화면 전체 기준 안정 유체(화면 20 % 해상도): 이류 → 포인터 외력 → 발산 → 압력(Jacobi 1회) → 기울기 빼기.
//     고정 간격 1/120 s, 프레임당 최대 8단계, 단계 dt 0.015 × 0.875, 감쇠 0.98^0.875, 힘 (이동량/2) × 80 × 1.75 ÷ 단계 수,
//     반지름 20 칸 × (화면 폭/1440), 분포 (1 − r)².
//  2) 제목 글자를 2D 캔버스로 래스터한 텍스처에 합성: uv + vel × 0.003(화면 uv), 흐림 반경 |vel| × 15 × 1.5 px 안의
//     무작위 원판 15점 평균, 밝힘 mix(c, c × 1.25, |vel| × 0.75). 제목 상자(+ 여유) 안만 그린다(scissor).
// DOM 제목은 글자색만 투명하게 남겨 화면 읽기와 배치를 유지한다. 터치 · 폭 1025 px 미만 · WebGL 실패면 만들지 않는다(사이트와 같음).
import * as THREE from 'three';

const SIM_RES = .2, STEP = 1 / 120, MAX_STEPS = 8, DT = .015 * .875, DISS = Math.pow(.98, .875), FORCE = 80 * 1.75;
const DISTORT = .003, VEL_BLUR = 15, TAPS = 15, MARGIN = 90;

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
// 합성: 화면 px(아래 원점) → 속도장 uv, 글자 텍스처 uv. 흐림은 픽셀별 해시에서 이어지는 난수열로 원판 표본.
const COMPOSE = `precision highp float;uniform sampler2D tex,vel;uniform vec2 screen,texOrigin,texSize;uniform float dpr,distort,velBlur;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec4 tap(vec2 px){vec2 u=(px-texOrigin)/texSize;if(u.x<0.||u.y<0.||u.x>1.||u.y>1.)return vec4(0.);return texture2D(tex,u);}
void main(){vec2 p=gl_FragCoord.xy/dpr;vec2 v=texture2D(vel,p/screen).xy;float m=length(v);
vec2 q=p+v*distort*screen;float R=m*velBlur*1.5/dpr;vec4 c;
if(R<.05)c=tap(q);else{float a=screen.x/screen.y;vec2 s=vec2(h(gl_FragCoord.xy+m*731.),h(gl_FragCoord.yx*1.37+m*113.));c=vec4(0.);
for(int i=0;i<${TAPS};i++){s=fract(s*vec2(12.9898,78.233)+.1234);vec2 d=sqrt(s.x+.001)*vec2(sin(s.y*6.2831853),cos(s.y*6.2831853));c+=tap(q+d*R*vec2(a,1./a));}
c/=${TAPS}.;}
c.rgb=mix(c.rgb,c.rgb*1.25,min(1.,m*.75));gl_FragColor=c;}`;

export type TitleFluid = {update(dt: number): void, dispose(): void};

export function createTitleFluid(title: HTMLElement, host: HTMLElement): TitleFluid | null {
  if (matchMedia('(pointer: coarse)').matches || innerWidth < 1025) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'it-title-fluid'; canvas.setAttribute('aria-hidden', 'true');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance'}); }
  catch { return null; }
  host.appendChild(canvas);
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(devicePixelRatio || 1, 1.5); renderer.setPixelRatio(dpr);

  // 글자색은 투명 처리 전에 읽어 둔다
  const small = title.querySelector('small') as HTMLElement | null;
  const colTitle = getComputedStyle(title).color, colSmall = small ? getComputedStyle(small).color : colTitle;
  title.classList.add('fluid-on');

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

  // 글자 텍스처
  const tc = document.createElement('canvas'), tg = tc.getContext('2d')!;
  const tex = new THREE.CanvasTexture(tc); tex.premultiplyAlpha = true; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const texOrigin = new THREE.Vector2(), texSize = new THREE.Vector2(1, 1), screen = new THREE.Vector2();
  const compose = pass(COMPOSE, {tex: {value: tex}, vel: {value: vel0.texture}, screen: {value: screen}, texOrigin: {value: texOrigin}, texSize: {value: texSize},
    dpr: {value: dpr}, distort: {value: DISTORT}, velBlur: {value: VEL_BLUR}});
  compose.mat.transparent = true; compose.mat.blending = THREE.NoBlending;

  let W = 0, H = 0, fw = 0, fh = 0, textKey = '';
  const resize = () => {
    W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); screen.set(W, H);
    fw = Math.max(8, Math.floor(W * SIM_RES)); fh = Math.max(8, Math.floor(H * SIM_RES));
    for (const r of [vel0, vel1, div, pre]) r.setSize(fw, fh);
    px.set(1 / fw, 1 / fh); ratio.set(Math.max(fw, fh) / fw, Math.max(fw, fh) / fh); textKey = '';
  };

  // 포인터: 화면 NDC(오른쪽 +x, 위 +y), 프레임마다 이동량을 모은다
  const ptr = {x: 0, y: 0, ox: 0, oy: 0, seen: false};
  const onMove = (e: PointerEvent) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; if (!ptr.seen) { ptr.ox = ptr.x; ptr.oy = ptr.y; ptr.seen = true; } };
  addEventListener('pointermove', onMove, {passive: true});
  addEventListener('resize', resize); resize();

  let acc = 0;
  const run = (q: {scene: THREE.Scene}, target: THREE.WebGLRenderTarget) => { renderer.setRenderTarget(target); renderer.render(q.scene, cam); };
  const simStep = (fx: number, fy: number, share: number) => {
    advect.mat.uniforms.vel.value = vel0.texture; run(advect, vel1);
    const u = splatMat.uniforms, rCells = 20 * (fw / (1440 * SIM_RES));
    const cx = Math.max(-1, Math.min(1, ptr.x)), cy = Math.max(-1, Math.min(1, ptr.y));
    const lim = Math.min(rCells, (1 - Math.abs(cx)) * fw / 2, (1 - Math.abs(cy)) * fh / 2);
    u.center.value.set(cx, cy); u.halfSize.value.set(lim * 2 / fw, lim * 2 / fh); u.force.value.set(fx / 2 * FORCE * share, fy / 2 * FORCE * share);
    renderer.setRenderTarget(vel1); renderer.render(splat, cam);
    run(diverge, div); run(pressure, pre); run(project, vel0);
  };

  // 제목 글자 래스터: 현재 화면 위치 · 크기(transform 포함)로, 바뀔 때만
  const rasterize = () => {
    const r = title.getBoundingClientRect(), so = small ? getComputedStyle(small).opacity : '1', to = getComputedStyle(title).opacity;
    const key = [r.left, r.top, r.width, r.height, so, to, W, H].map(v => typeof v === 'number' ? v.toFixed(1) : v).join('|');
    if (key === textKey) return r; textKey = key;
    const x0 = Math.floor(r.left - MARGIN), y0 = Math.floor(r.top - MARGIN), w = Math.ceil(r.width + 2 * MARGIN), h = Math.ceil(r.height + 2 * MARGIN);
    tc.width = Math.max(1, Math.round(w * dpr)); tc.height = Math.max(1, Math.round(h * dpr));
    tg.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); tg.clearRect(x0, y0, w, h);
    const scale = r.width / Math.max(1, title.offsetWidth);
    const walk = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = n.textContent ?? ''; if (!text.trim()) continue;
      const el = n.parentElement!, cs = getComputedStyle(el), isSmall = !!small && small.contains(el);
      const range = document.createRange(); range.selectNodeContents(n);
      const rect = [...range.getClientRects()].find(q => q.width > 0); if (!rect) continue;
      const fs = parseFloat(cs.fontSize) * scale, ls = (parseFloat(cs.letterSpacing) || 0) * scale;
      tg.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      (tg as CanvasRenderingContext2D & {letterSpacing: string}).letterSpacing = ls + 'px';
      tg.fillStyle = isSmall ? colSmall : colTitle; tg.globalAlpha = (isSmall ? +so : 1) * +to;
      const m = tg.measureText(text), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      tg.textBaseline = 'alphabetic'; tg.fillText(text, rect.left, rect.top + (rect.height - asc - desc) / 2 + asc);
    }
    tg.globalAlpha = 1; tex.needsUpdate = true;
    texOrigin.set(x0, H - (y0 + h)); texSize.set(w, h);
    renderer.setRenderTarget(null); renderer.setScissorTest(false); renderer.clear();   // 위치가 바뀌면 이전 자리를 지운다
    return r;
  };

  return {
    update(dt: number) {
      if (!W) return;
      // 시뮬레이션(사이트와 같은 고정 간격)
      acc += Math.min(Math.max(dt, 0), 1 / 15);
      const dx = ptr.seen ? ptr.x - ptr.ox : 0, dy = ptr.seen ? ptr.y - ptr.oy : 0; ptr.ox = ptr.x; ptr.oy = ptr.y;
      let n = 0; while (acc >= STEP && n < MAX_STEPS) { acc -= STEP; n++; }
      for (let i = 0; i < n; i++) simStep(dx, dy, 1 / n);
      // 합성(제목 상자 + 여유만)
      const r = rasterize();
      renderer.setRenderTarget(null);
      const sx = Math.max(0, Math.floor(r.left - MARGIN)), sy = Math.max(0, Math.floor(H - r.bottom - MARGIN));
      renderer.setScissorTest(true); renderer.setScissor(sx, sy, Math.ceil(r.width + 2 * MARGIN), Math.ceil(r.height + 2 * MARGIN));
      renderer.clear(); renderer.render(compose.scene, cam); renderer.setScissorTest(false);
    },
    dispose() {
      removeEventListener('pointermove', onMove); removeEventListener('resize', resize);
      title.classList.remove('fluid-on'); canvas.remove();
      for (const r of [vel0, vel1, div, pre]) r.dispose(); tex.dispose(); renderer.dispose();
    },
  };
}
