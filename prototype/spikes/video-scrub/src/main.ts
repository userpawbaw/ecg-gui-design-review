import Lenis from 'lenis';

// AI-video → scroll player (D-023, docs/uiux_system/22_AI_VIDEO_SCROLL_PIPELINE.md).
// URL: ?clip=<name> &remap=1|0 &blend=1|0 &depth=0|1 &fx=1|0 &kiosk=0|1 &hud=0|1
//      &live=0|1        idle option 1: time layer over the video (dust motes lit by the image, drifting haze)
//      &idle=scroll|play idle option 2: 'play' = slow autonomous playback, scroll speed adds playback speed
//      &grid=0|1        head-offset variants (l / c / r clips) blended by pointer x
// Details carried over from references so they are not lost in the video route:
//  - REF-002 EFX-002-01 pointer gaze: ±0.75° yaw / ±0.2° pitch, k = 1 − exp(−2·dt) → overscan pan (+ depth parallax)
//  - REF-002 Lenis lerp 0.085; REF-004 EFX-004-06: all frames downloaded before start, never substitute a far frame,
//    ≤ 1 frame per scroll px, interpolate between frames
//  - REF-001 EFX (moto globe, F-012): idle spin + scroll impulse with damping — the model for idle=play
type Seq = {pattern: string};
type Manifest = {name: string; frames: number; size: [number, number]; pattern: string; pad: number; remap: number[]; qa: string;
  depth: string | null; depth_pattern?: string; depth_is_synthetic: boolean; depth_source?: string; loopable?: boolean;
  variants?: {l?: Seq; r?: Seq; offset?: string}};
const P = new URLSearchParams(location.search);
const flag = (k: string, d: boolean) => (P.has(k) ? P.get(k) !== '0' : d);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const opt = {clip: P.get('clip') || 'pan', remap: flag('remap', true), blend: flag('blend', true), depth: flag('depth', false),
  fx: flag('fx', true), kiosk: flag('kiosk', false), hud: flag('hud', true), live: flag('live', false), grid: flag('grid', false),
  idle: P.get('idle') || 'scroll', idleFps: +(P.get('idleFps') || 4), boost: +(P.get('boost') || 0.02),
  overscan: +(P.get('overscan') || 0.06), depthAmp: +(P.get('depthAmp') || 0.018)};
const $ = (id: string) => document.getElementById(id)!;
const state: any = {ready: false, progress: 0, frame: 0, gaze: [0, 0], opt};
(window as any).__vs = state;

const base = `./clips/${opt.clip}/`;
const man: Manifest = await (await fetch(base + 'manifest.json')).json();
const N = man.frames;

// 1) Sequences: every compressed frame is downloaded before start (no missing-frame substitution — REF-004),
//    but only a window around the playhead is decoded: 240 decoded 1280×720 frames ≈ 885 MB (F-018).
let loadedN = 0, totalN = 0;
const stats = {holds: 0, decodedPeak: 0};
class Sequence {
  blobs: Blob[] = []; decoded = new Map<number, ImageBitmap>(); pending = new Set<number>();
  constructor(public pattern: string, public window = 24) {}
  async load() {
    this.blobs = await Promise.all(Array.from({length: N}, async (_, i) => {
      const b = await (await fetch(base + this.pattern.replace('{i}', String(i).padStart(man.pad, '0')))).blob();
      $('lp').textContent = `${Math.round(++loadedN / totalN * 100)}%`; return b;
    }));
  }
  ensure(c: number) {
    for (let d = 0; d <= this.window; d++) for (const i of [(c + d) % N, (c - d + N) % N]) {   // wraps for loop clips
      if (this.decoded.has(i) || this.pending.has(i)) continue;
      this.pending.add(i);
      createImageBitmap(this.blobs[i]).then(b => { this.pending.delete(i); this.decoded.set(i, b); });
    }
    for (const [i, b] of this.decoded) { const dist = Math.min(Math.abs(i - c), N - Math.abs(i - c)); if (dist > this.window * 2) { b.close(); this.decoded.delete(i); } }
  }
  has(i: number) { return this.decoded.has(i); }
  get(i: number) { return this.decoded.get(i)!; }
}
const main = new Sequence(man.pattern);
const depthSeq = opt.depth && man.depth_pattern ? new Sequence(man.depth_pattern, 4) : null;
const side = opt.grid && man.variants ? {l: man.variants.l && new Sequence(man.variants.l.pattern), r: man.variants.r && new Sequence(man.variants.r.pattern)} : null;
const seqs = [main, depthSeq, side?.l, side?.r].filter(Boolean) as Sequence[];
totalN = seqs.length * N;
await Promise.all(seqs.map(s => s.load()));
seqs.forEach(s => s.ensure(0));
await new Promise<void>(r => { const w = () => (seqs.every(s => s.has(0) && s.has(1 % N)) ? r() : setTimeout(w, 16)); w(); });
const staticDepth = opt.depth && !depthSeq && man.depth ? await createImageBitmap(await (await fetch(base + man.depth)).blob()) : null;

// 2) WebGL2: centre frames A/B, side-variant frames C/E, depth D; blended in one pass with the time layer and film post
const cv = $('view') as HTMLCanvasElement;
const gl = cv.getContext('webgl2', {antialias: false, premultipliedAlpha: false})!;
const vs = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; uv.y = 1.-uv.y; gl_Position = vec4(p,0,1); }`;
const fs = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D A, B, C, E, D; uniform float mixAB, mixSide, overscan, depthAmp, useDepth, fx, live, time, aspectFix;
uniform vec2 gaze;
float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898,78.233))) * 43758.5453); }
float noise(vec2 q){ vec2 i = floor(q), f = fract(q); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
// dust motes: 3 depth layers of sparse cells, each mote drifts on its own slow path; parallax follows gaze
float motes(vec2 q, float t){
  float s = 0.;
  for (int l = 0; l < 3; l++) {
    float z = 1. + float(l) * .8;                         // farther layers: smaller, slower
    vec2 g = q * vec2(24., 14.) * z + vec2(t * .03 / z, -t * .05 / z) + gaze * (.6 / z);
    vec2 id = floor(g), f = fract(g) - .5;
    float h = hash(id + float(l) * 17.);
    if (h > .78) {
      vec2 c = vec2(sin(t * .4 + h * 40.), cos(t * .33 + h * 23.)) * .28;
      float r = length(f - c);
      float tw = .6 + .4 * sin(t * (1.5 + h * 2.) + h * 60.);   // twinkle
      s += smoothstep(.11 / z, 0., r) * tw / z;
    }
  }
  return s;
}
void main(){
  vec2 c = (uv - .5) * vec2(aspectFix, 1.) * (1. - overscan) + .5;          // cover-fit, keep overscan margin
  c += gaze * overscan * .5;                                               // gaze = pan inside the margin (exact for pure rotation)
  if (useDepth > .5) { float d = texture(D, c).r; c += gaze * (d - .5) * depthAmp; }   // near (bright) moves more
  vec3 col = mix(texture(A, c).rgb, texture(B, c).rgb, mixAB);
  if (mixSide > 0.) col = mix(col, mix(texture(C, c).rgb, texture(E, c).rgb, mixAB), mixSide);
  if (live > .5) {
    float lum = dot(col, vec3(.299, .587, .114));
    float lit = smoothstep(.35, .85, lum);                                  // motes only show where the image is lit (beam)
    col += vec3(1., .93, .8) * motes(uv, time) * (.35 + 1.8 * lit);
    float haze = noise(uv * vec2(3., 2.) + vec2(time * .05, time * .02)) - .5;  // slow drifting air
    col *= 1. + haze * .06 * (.3 + lit);
  }
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
const units = {A: 0, B: 1, C: 2, E: 3, D: 4} as const;
const texs: Record<string, WebGLTexture> = {};
for (const [n, u] of Object.entries(units)) {
  const t = gl.createTexture()!; gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, t);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.uniform1i(U(n), u); texs[n] = t;
}
const uploaded: Record<string, unknown> = {};
const upload = (n: keyof typeof units, key: unknown, img: TexImageSource) => {
  if (uploaded[n] === key) return;
  gl.activeTexture(gl.TEXTURE0 + units[n]); gl.bindTexture(gl.TEXTURE_2D, texs[n]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); uploaded[n] = key;
};
if (staticDepth) upload('D', 'static', staticDepth);

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
  if (!opt.remap) return p * (N - 1);
  const x = p * (man.remap.length - 1), i = Math.floor(x), f = x - i;
  return man.remap[i] + ((man.remap[Math.min(i + 1, man.remap.length - 1)] ?? man.remap[i]) - man.remap[i]) * f;
};
// idle=play: playhead is a phase, not a scroll position. Loop clips wrap; non-loop clips drift ahead of the scroll
// position and clamp at the end (the failure mode this test is meant to show).
let phase = 0, prevP = 0;

// 4) pointer gaze (REF-002 EFX-002-01 constants) + kiosk auto-gaze
const target = [0, 0], gaze = [0, 0];
addEventListener('pointermove', e => { target[0] = e.clientX / innerWidth * 2 - 1; target[1] = e.clientY / innerHeight * 2 - 1; });
const layers = [...document.querySelectorAll<HTMLElement>('.layer')].map(el => ({el, d: +el.dataset.depth!}));
if (P.get('overlay') === '0') layers.forEach(({el}) => (el.hidden = true));   // stand-in clips other than the REF-003 pan

let last = performance.now();
function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  lenis.raf(now);
  const r = track.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  const scrollF = frameAt(p);
  let f: number;
  if (opt.idle === 'play' && !reduced) {
    const dF = (p - prevP) * (N - 1);                          // frames the scroll itself asked for this tick
    phase += opt.idleFps * dt + Math.abs(dF) * (1 + opt.boost * Math.abs(lenis.velocity));   // idle speed + scroll push
    f = man.loopable ? ((phase % N) + N) % N : Math.min(N - 1, Math.max(scrollF, phase));
    if (!man.loopable) phase = f;
  } else f = scrollF;
  prevP = p;
  const i = Math.floor(f) % N, j = man.loopable ? (i + 1) % N : Math.min(i + 1, N - 1);
  seqs.forEach(s => s.ensure(i));
  // a frame not decoded yet (after a large jump) holds the previous image for a tick — never a far substitute
  const ready = seqs.every(s => s.has(i) && s.has(j));
  if (ready) {
    upload('A', i, main.get(i)); upload('B', j, main.get(j));
    if (depthSeq) upload('D', i, depthSeq.get(i));
  } else stats.holds++;
  stats.decodedPeak = Math.max(stats.decodedPeak, main.decoded.size);
  if (opt.kiosk) { target[0] = Math.sin(now / 1000 * 0.21) * 0.6; target[1] = Math.sin(now / 1000 * 0.13) * 0.3; }
  const k = reduced ? 0 : 1 - Math.exp(-2 * dt);
  gaze[0] += (target[0] - gaze[0]) * k; gaze[1] += (target[1] - gaze[1]) * k;
  let mixSide = 0;
  if (side && ready) {
    const s = gaze[0] >= 0 ? side.r : side.l;
    if (s) { upload('C', `${gaze[0] >= 0}${i}`, s.get(i)); upload('E', `${gaze[0] >= 0}${j}`, s.get(j)); mixSide = Math.abs(gaze[0]); }
  }
  gl.uniform1f(U('mixAB'), opt.blend && uploaded.A === i ? f - Math.floor(f) : 0);
  gl.uniform1f(U('mixSide'), mixSide);
  gl.uniform2f(U('gaze'), side ? 0 : gaze[0], gaze[1] * 0.27);    // grid mode: x comes from the variants, not the pan
  gl.uniform1f(U('overscan'), opt.overscan); gl.uniform1f(U('depthAmp'), opt.depthAmp);
  gl.uniform1f(U('useDepth'), depthSeq || staticDepth ? 1 : 0); gl.uniform1f(U('fx'), opt.fx ? 1 : 0);
  gl.uniform1f(U('live'), opt.live && !reduced ? 1 : 0); gl.uniform1f(U('time'), reduced ? 0 : (now / 1000) % 1000);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  // DOM layers parallax against the video (foreground moves more → depth cue without a depth map)
  for (const {el, d} of layers) el.style.transform = `translate3d(${(-gaze[0] * 14 * d).toFixed(2)}px, ${(-gaze[1] * 6 * d - (p - 0.5) * 60 * d).toFixed(2)}px, 0)`;
  state.progress = p; state.frame = f; state.scrollFrame = scrollF; state.gaze = [gaze[0], gaze[1]];
  if (opt.hud) $('hud').textContent = `clip ${man.name} (QA ${man.qa})  frame ${f.toFixed(2)}/${N - 1}  scroll→${scrollF.toFixed(1)}  p ${(p * 100).toFixed(1)}%\n` +
    `remap ${+opt.remap} blend ${+opt.blend} depth ${depthSeq ? (man.depth_source || 'seq') : staticDepth ? 'static' : 'off'} live ${+opt.live} idle ${opt.idle} grid ${side ? 'on' : 'off'} fx ${+opt.fx}`;
  requestAnimationFrame(tick);
}
const loader = $('loader');
loader.addEventListener('transitionend', () => { loader.hidden = true; }, {once: true});   // 12-frame QA: the fading loader text showed over frame 0
loader.classList.add('done');
state.ready = true; state.stats = stats; (window as any).__lenis = lenis;
state.setGaze = (x: number, y: number) => { target[0] = x; target[1] = y; gaze[0] = x; gaze[1] = y; };   // QA: jump the gaze without the ease
requestAnimationFrame(tick);
