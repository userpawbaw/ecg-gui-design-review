import Lenis from 'lenis';

// AI-video → scroll player (D-023, docs/uiux_system/22_AI_VIDEO_SCROLL_PIPELINE.md).
// URL: ?clip=pan|eased &remap=1|0 &blend=1|0 &depth=0|1 &fx=1|0 &kiosk=0|1 &hud=0|1
// Details carried over from references so they are not lost in the video route:
//  - REF-002 EFX-002-01 pointer gaze: ±0.75° yaw / ±0.2° pitch, k = 1 − exp(−2·dt)  → here as overscan pan (+ depth parallax)
//  - REF-002 Lenis lerp 0.085; REF-004 EFX-004-06 lessons: preload + pre-decode every frame, never substitute a far frame,
//    ≤ 1 frame per scroll px, interpolate between frames
type Manifest = {name: string; frames: number; size: [number, number]; pattern: string; pad: number; remap: number[]; depth: string | null; depth_is_synthetic: boolean; qa: string};
const P = new URLSearchParams(location.search);
const flag = (k: string, d: boolean) => (P.has(k) ? P.get(k) !== '0' : d);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const opt = {clip: P.get('clip') || 'pan', remap: flag('remap', true), blend: flag('blend', true), depth: flag('depth', false),
  fx: flag('fx', true), kiosk: flag('kiosk', false), hud: flag('hud', true), overscan: 0.06, depthAmp: 0.018};
const $ = (id: string) => document.getElementById(id)!;
const state: any = {ready: false, progress: 0, frame: 0, gaze: [0, 0], opt};
(window as any).__vs = state;

const base = `./clips/${opt.clip}/`;
const man: Manifest = await (await fetch(base + 'manifest.json')).json();

// 1) download every compressed frame before activating (no missing-frame substitution — REF-004 acceptance 2),
//    but decode only a window around the playhead: 240 decoded 1280×720 frames would hold ≈ 885 MB (4K ≈ 3.5 GB).
let loaded = 0;
const blobs: Blob[] = await Promise.all(Array.from({length: man.frames}, async (_, i) => {
  const b = await (await fetch(base + man.pattern.replace('{i}', String(i).padStart(man.pad, '0')))).blob();
  $('lp').textContent = `${Math.round(++loaded / man.frames * 100)}%`;
  return b;
}));
const WINDOW = 24;                                    // decoded frames kept on each side of the playhead
const decoded = new Map<number, ImageBitmap>(), pending = new Set<number>();
const stats = {holds: 0, decodedPeak: 0};
function ensure(center: number) {
  for (let d = 0; d <= WINDOW; d++) for (const i of [center + d, center - d]) {
    if (i < 0 || i >= man.frames || decoded.has(i) || pending.has(i)) continue;
    pending.add(i);
    createImageBitmap(blobs[i]).then(b => { pending.delete(i); decoded.set(i, b); stats.decodedPeak = Math.max(stats.decodedPeak, decoded.size); });
  }
  for (const [i, b] of decoded) if (Math.abs(i - center) > WINDOW * 2) { b.close(); decoded.delete(i); }
}
ensure(0);
await new Promise<void>(r => { const w = () => (decoded.has(0) && decoded.has(1) ? r() : setTimeout(w, 16)); w(); });
const depthBmp = opt.depth && man.depth ? await createImageBitmap(await (await fetch(base + man.depth)).blob()) : null;

// 2) WebGL2: two frame textures + optional depth, blended in one pass with film post
const cv = $('view') as HTMLCanvasElement;
const gl = cv.getContext('webgl2', {antialias: false, premultipliedAlpha: false})!;
const vs = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; uv.y = 1.-uv.y; gl_Position = vec4(p,0,1); }`;
const fs = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D A, B, D; uniform float mixAB, overscan, depthAmp, useDepth, fx, time, aspectFix;
uniform vec2 gaze;
float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec2 c = (uv - .5) * vec2(aspectFix, 1.) * (1. - overscan) + .5;          // cover-fit, keep overscan margin
  c += gaze * overscan * .5;                                               // gaze = pan inside the margin
  if (useDepth > .5) { float d = texture(D, c).r; c += gaze * (d - .5) * depthAmp; }   // near moves more
  vec3 col = mix(texture(A, c).rgb, texture(B, c).rgb, mixAB);
  if (fx > .5) {
    float v = smoothstep(1.15, .35, length((uv - .5) * vec2(1.2, 1.)));   // vignette
    col *= mix(.72, 1., v);
    col += (hash(uv * 1024. + time) - .5) * .035;                          // film grain (breaks AI-video banding)
  }
  o = vec4(col, 1.);
}`;
const sh = (t: number, s: string) => { const x = gl.createShader(t)!; gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(x)!); return x; };
const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = (n: string) => gl.getUniformLocation(prog, n);
const tex = (unit: number) => { const t = gl.createTexture()!; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t; };
const texA = tex(0), texB = tex(1), texD = tex(2);
gl.uniform1i(U('A'), 0); gl.uniform1i(U('B'), 1); gl.uniform1i(U('D'), 2);
if (depthBmp) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texD); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, depthBmp); }
let upA = -1, upB = -1;
const upload = (unit: number, t: WebGLTexture, i: number) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, decoded.get(i)!); };

function resize() {
  const dpr = Math.min(devicePixelRatio, 2);
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); gl.viewport(0, 0, cv.width, cv.height);
  const va = cv.width / cv.height, ia = man.size[0] / man.size[1];
  gl.uniform1f(U('aspectFix'), Math.min(1, va / ia));   // wider-than-viewport video: crop sides (portrait phones crop more)
}
addEventListener('resize', resize); resize();

// 3) scroll → progress → frame (motion-normalised remap from the intake QA)
const lenis = new Lenis({lerp: reduced ? 1 : 0.085});
const track = $('track');
const frameAt = (p: number) => {
  if (!opt.remap) return p * (man.frames - 1);
  const x = p * (man.remap.length - 1), i = Math.floor(x), f = x - i;
  return man.remap[i] + ((man.remap[Math.min(i + 1, man.remap.length - 1)] ?? man.remap[i]) - man.remap[i]) * f;
};

// 4) pointer gaze (REF-002 EFX-002-01 constants) + kiosk auto-gaze
const target = [0, 0], gaze = [0, 0];
addEventListener('pointermove', e => { target[0] = e.clientX / innerWidth * 2 - 1; target[1] = e.clientY / innerHeight * 2 - 1; });
const layers = [...document.querySelectorAll<HTMLElement>('.layer')].map(el => ({el, d: +el.dataset.depth!}));

let last = performance.now();
function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  lenis.raf(now);
  const r = track.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  const f = frameAt(p), i = Math.floor(f), j = Math.min(i + 1, man.frames - 1);
  ensure(i);
  // a frame not decoded yet (after a large jump) holds the previous image for a tick — never a far substitute
  if (decoded.has(i) && decoded.has(j)) {
    if (i !== upA) { upload(0, texA, i); upA = i; }
    if (j !== upB) { upload(1, texB, j); upB = j; }
  } else stats.holds++;
  if (opt.kiosk) { target[0] = Math.sin(now / 1000 * 0.21) * 0.6; target[1] = Math.sin(now / 1000 * 0.13) * 0.3; }
  const k = reduced ? 0 : 1 - Math.exp(-2 * dt);
  gaze[0] += (target[0] - gaze[0]) * k; gaze[1] += (target[1] - gaze[1]) * k;
  gl.uniform1f(U('mixAB'), opt.blend && upA === i ? f - i : 0);
  gl.uniform2f(U('gaze'), gaze[0], gaze[1] * 0.27);        // pitch range ≈ 0.2/0.75 of yaw, as REF-002
  gl.uniform1f(U('overscan'), opt.overscan); gl.uniform1f(U('depthAmp'), opt.depthAmp);
  gl.uniform1f(U('useDepth'), depthBmp ? 1 : 0); gl.uniform1f(U('fx'), opt.fx ? 1 : 0); gl.uniform1f(U('time'), (now / 1000) % 100);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  // DOM layers parallax against the video (foreground moves more → depth cue without a depth map)
  for (const {el, d} of layers) el.style.transform = `translate3d(${(-gaze[0] * 14 * d).toFixed(2)}px, ${(-gaze[1] * 6 * d - (p - 0.5) * 60 * d).toFixed(2)}px, 0)`;
  state.progress = p; state.frame = f; state.gaze = [gaze[0], gaze[1]];
  if (opt.hud) $('hud').textContent = `clip ${man.name} (QA ${man.qa})  frame ${f.toFixed(2)}/${man.frames - 1}  p ${(p * 100).toFixed(1)}%\nremap ${+opt.remap} blend ${+opt.blend} depth ${depthBmp ? (man.depth_is_synthetic ? 'synthetic' : 'on') : 'off'} fx ${+opt.fx}`;
  requestAnimationFrame(tick);
}
const loader = $('loader');
loader.addEventListener('transitionend', () => { loader.hidden = true; }, {once: true});   // 12-frame QA: the fading loader text showed over frame 0
loader.classList.add('done');
state.ready = true; state.stats = stats; state.decoded = () => decoded.size; (window as any).__lenis = lenis;
requestAnimationFrame(tick);
