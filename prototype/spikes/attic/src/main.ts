import '@fontsource-variable/inter-tight';
import './style.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/examples/jsm/postprocessing/SMAAPass.js';
import Lenis from 'lenis';

// REF-002 attic study. Lighting is fully baked (Blender: sun through a skylight + sky + bounces) — the page only
// adds what a bake cannot: ray-marched sun shafts (sampled against a sun depth map, so the ladder cuts the beam),
// dust that sparkles only inside the beam, bloom, grade and grain. Camera: EFX-002-03 descent + EFX-002-01 head turn.
type Manifest = {lm_scale: number; groups: Record<string, {object: string; file?: string; vertex_color?: string}>;
  sun: {to_dir: number[]; color: number[]}; skylight: {center: number[]};
  camera_path: {pos_top: number[]; pos_bottom: number[]; look_top: number[]; look_bottom: number[]; fov_v_deg: number}};

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {ready: false, p: 0, fx: params.get('fx') !== '0', frames: [] as number[]};
(window as any).__attic = state;

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({canvas, antialias: false, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = Number(params.get('exp') ?? 1.45);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1512);

const base = './scene/';
const manifest: Manifest = await (await fetch(base + 'manifest.json')).json();
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(base + 'attic.glb');
scene.add(gltf.scene);
const tl = new THREE.TextureLoader();
const lightmaps: Record<string, THREE.Texture> = {};
for (const [g, info] of Object.entries(manifest.groups)) if (info.file) {
  const t = await tl.loadAsync(base + info.file); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.channel = 1; lightmaps[g] = t;
}
const groupOf = (o: THREE.Object3D) => { let x: THREE.Object3D | null = o; while (x) { for (const [g, i] of Object.entries(manifest.groups)) if (x.name === i.object || x.name.startsWith(i.object + '_')) return g; x = x.parent; }
  console.warn('attic: no group for', o.name); return 'shell'; };

// ---------- baked material: albedo × decoded light (lightmap on UV1, or vertex colour for dense decor) ----------
const lmScale = {value: manifest.lm_scale};
gltf.scene.traverse(o => {
  const m = o as THREE.Mesh; if (!m.isMesh) return;
  const g = groupOf(m); const src = m.material as THREE.MeshStandardMaterial; const vc = !lightmaps[g];
  const map = src.map; if (map) map.updateMatrix();
  m.material = new THREE.ShaderMaterial({
    uniforms: {map: {value: map}, useMap: {value: !!map}, color: {value: src.color.clone()}, lm: {value: lightmaps[g] ?? null}, lmScale,
      mapChannel: {value: map?.channel ?? 0}, mapTransform: {value: map ? map.matrix : new THREE.Matrix3()}, alphaTest: {value: src.alphaTest || (src.transparent ? 0.4 : 0)}},
    defines: vc ? {VC: ''} : {},
    vertexShader: `attribute vec2 uv1; attribute vec2 uv2; uniform int mapChannel; uniform mat3 mapTransform;
      #ifdef VC
      attribute vec4 color; varying vec3 vLight;
      #endif
      varying vec2 vUv, vUv1;
      vec2 pick(int c){ return c == 2 ? uv2 : (c == 1 ? uv1 : uv); }
      void main(){ vUv = (mapTransform * vec3(pick(mapChannel), 1.)).xy; vUv1 = uv1;
        #ifdef VC
        vLight = color.rgb;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D map, lm; uniform bool useMap; uniform vec3 color; uniform float lmScale, alphaTest; varying vec2 vUv, vUv1;
      #ifdef VC
      varying vec3 vLight;
      #endif
      void main(){ vec4 a = useMap ? texture2D(map, vUv) : vec4(1.); if (alphaTest > 0. && a.a < alphaTest) discard;
        #ifdef VC
        vec3 e = vLight;
        #else
        vec3 e = texture2D(lm, vUv1).rgb;
        #endif
        gl_FragColor = vec4(a.rgb * color * e * e * lmScale, 1.); }`,   // linear HDR; tone mapping happens in the output pass
    side: src.side,
  });
});

// ---------- camera ----------
const V = (a: number[]) => new THREE.Vector3(...a);
const cp = manifest.camera_path;
const camera = new THREE.PerspectiveCamera(Number(params.get('fov') ?? 27), 1, 0.05, 40);   // reference framing is tighter than the Blender preview (30°)
const P0 = V(cp.pos_top), P1 = V(cp.pos_bottom), L0 = V(cp.look_top), L1 = V(cp.look_bottom);

// ---------- sun depth map (static scene → rendered once) ----------
const sunTo = V(manifest.sun.to_dir).normalize();
const sunCol = new THREE.Color(...(manifest.sun.color ?? [1, 0.88, 0.72]));
const roomC = new THREE.Vector3(0, 1.9, 1.6);                 // room centre in glTF coords (Blender −y → +z)
const lightCam = new THREE.OrthographicCamera(-4.2, 4.2, 4.2, -4.2, 0.1, 20);
lightCam.position.copy(roomC).addScaledVector(sunTo, -9); lightCam.lookAt(roomC); lightCam.updateMatrixWorld(); lightCam.updateProjectionMatrix();
const lightRT = new THREE.WebGLRenderTarget(2048, 2048, {depthTexture: new THREE.DepthTexture(2048, 2048, THREE.FloatType)});
const depthOnly = new THREE.MeshBasicMaterial({colorWrite: false});
function renderSunDepth() { dust.visible = false; scene.overrideMaterial = depthOnly; renderer.setRenderTarget(lightRT); renderer.clear(); renderer.render(scene, lightCam); renderer.setRenderTarget(null); scene.overrideMaterial = null; dust.visible = true; }
const lightVP = new THREE.Matrix4().multiplyMatrices(lightCam.projectionMatrix, lightCam.matrixWorldInverse);

// ---------- dust: only visible where the sun reaches (sampled against the same depth map) ----------
const DUST = 1400, dp = new Float32Array(DUST * 3), ds = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) { dp.set([-2.1 + Math.random() * 4.2, 0.2 + Math.random() * 3.6, 0.05 + Math.random() * 3.3], i * 3); ds[i] = Math.random(); }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
const dustMat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {uTime: {value: 0}, tLight: {value: lightRT.depthTexture}, uLightVP: {value: lightVP}, uSun: {value: sunTo}, uCol: {value: sunCol}, uPx: {value: 1}},
  vertexShader: `attribute float aSeed; uniform float uTime, uPx; uniform sampler2D tLight; uniform mat4 uLightVP; uniform vec3 uSun; varying float vA;
    void main(){ float t = uTime * (0.02 + 0.03 * aSeed) + aSeed * 50.; vec3 p = position + vec3(sin(t * 1.3), sin(t * .7 + 2.) * .5, cos(t * 1.1)) * .15;
      vec4 lp = uLightVP * vec4(p, 1.); vec3 l = lp.xyz / lp.w * .5 + .5;
      float lit = (all(greaterThan(l.xy, vec2(0.))) && all(lessThan(l.xy, vec2(1.)))) ? step(l.z - .002, texture2D(tLight, l.xy).x) : 0.;
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
      float fwd = pow(max(dot(normalize(p - cameraPosition), uSun), 0.), 2.);
      vA = lit * (0.25 + 1.6 * fwd) * (0.4 + 0.6 * sin(uTime * 1.3 + aSeed * 40.) * sin(uTime * 1.3 + aSeed * 40.));
      gl_PointSize = min(uPx * (1.0 + 2.2 * aSeed) / -mv.z, 4.); }`,
  fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(uCol * vA * smoothstep(.5, .0, d) * 2.2, 1.); }`});
const dust = new THREE.Points(dg, dustMat); dust.frustumCulled = false; scene.add(dust);

// ---------- scene RT with depth → volumetric pass → bloom → AgX output → grade → SMAA ----------
const sceneRT = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(1, 1, THREE.FloatType)});
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType}));
const vol = new ShaderPass({
  uniforms: {tDiffuse: {value: null}, tScene: {value: sceneRT.texture}, tDepth: {value: sceneRT.depthTexture}, tLight: {value: lightRT.depthTexture},
    uInvProj: {value: new THREE.Matrix4()}, uInvView: {value: new THREE.Matrix4()}, uLightVP: {value: lightVP}, uCam: {value: new THREE.Vector3()},
    uSun: {value: sunTo}, uCol: {value: sunCol}, uDensity: {value: Number(params.get('density') ?? 0.05)}, uIntensity: {value: Number(params.get('shaft') ?? 2.6)},
    uTime: {value: 0}, uFrame: {value: 0}, uOn: {value: 1}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `precision highp float;
    uniform sampler2D tScene, tDepth, tLight; uniform mat4 uInvProj, uInvView, uLightVP; uniform vec3 uCam, uSun, uCol;
    uniform float uDensity, uIntensity, uTime, uFrame, uOn; varying vec2 vUv;
    float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }          // interleaved gradient noise
    float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
      return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float hg(float c, float g){ float g2 = g * g; return (1. - g2) / (4. * 3.14159 * pow(1. + g2 - 2. * g * c, 1.5)); }
    void main(){
      vec3 col = texture2D(tScene, vUv).rgb;
      if (uOn < .5) { gl_FragColor = vec4(col, 1.); return; }
      float d = texture2D(tDepth, vUv).x;
      vec4 v = uInvProj * vec4(vUv * 2. - 1., d * 2. - 1., 1.); v /= v.w; vec3 wp = (uInvView * v).xyz;
      vec3 rd = wp - uCam; float len = min(length(rd), 7.5); rd = normalize(rd);
      const int N = 48; float dt = len / float(N), j = ign(gl_FragCoord.xy + uFrame * 5.588), acc = 0., tr = 1.;
      for (int i = 0; i < N; i++) {
        vec3 p = uCam + rd * (float(i) + j) * dt;
        vec4 lp = uLightVP * vec4(p, 1.); vec3 l = lp.xyz / lp.w * .5 + .5;
        float lit = (l.x > 0. && l.x < 1. && l.y > 0. && l.y < 1.) ? step(l.z - .0015, texture2D(tLight, l.xy).x) : 0.;
        float dens = uDensity * (.55 + .9 * noise(p * 2.2 + vec3(0., uTime * .05, uTime * .03)));
        acc += lit * dens * tr * dt; tr *= exp(-dens * .15 * dt);
      }
      float ph = hg(dot(uSun, -rd), .55) * 4. * 3.14159 * .25 + .25;           // forward-scattering + isotropic floor
      gl_FragColor = vec4(col + uCol * acc * ph * uIntensity, 1.);
    }`});
// ShaderPass clones its uniforms and drops render-target textures → reattach after construction
vol.uniforms.tScene.value = sceneRT.texture; vol.uniforms.tDepth.value = sceneRT.depthTexture; vol.uniforms.tLight.value = lightRT.depthTexture;
vol.uniforms.uLightVP.value = lightVP; vol.uniforms.uSun.value = sunTo; vol.uniforms.uCol.value = sunCol;
composer.addPass(vol);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.55, 1.1); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({uniforms: {tDiffuse: {value: null}, uTime: {value: 0}, uAspect: {value: 1},
  uWarm: {value: new THREE.Vector3(1.05, 1.0, 0.93)}, uSat: {value: Number(params.get('sat') ?? 1.18)}, uCurve: {value: Number(params.get('curve') ?? 0.6)}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uAspect, uSat, uCurve; uniform vec3 uWarm; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126, .7152, .0722));
      // grade tuned by measurement against the reference frame (mean / p50 / p95 luminance, saturation, R−B warmth)
      c = c * mix(vec3(1.), uWarm, .9);                                        // warm
      c = mix(vec3(l), c, uSat);                                               // saturation
      c = mix(c, smoothstep(0., 1., c), uCurve);                               // S-curve: deep gaps, bright sun patches
      c = c * .965 + .035 * vec3(1., .95, .88);                               // warm shadow lift (reference p5 ≈ 11/255)
      vec2 q = (vUv - .5) * vec2(uAspect, 1.); c *= mix(1., .8, smoothstep(.45, 1.1, length(q)));
      c += (h(vUv * 1000. + uTime) - .5) * .028;                               // grain
      gl_FragColor = vec4(clamp(c, 0., 1.), 1.); }`});
composer.addPass(grade);
const smaa = new SMAAPass(); composer.addPass(smaa);

const resize = () => {
  const w = innerWidth, h = innerHeight, pr = renderer.getPixelRatio();
  renderer.setSize(w, h, false); composer.setSize(w, h); sceneRT.setSize(w * pr, h * pr);
  camera.aspect = w / h; camera.updateProjectionMatrix(); grade.uniforms.uAspect.value = w / h;
  dustMat.uniforms.uPx.value = h * pr / 55;
};
addEventListener('resize', resize); resize();
renderSunDepth();

// ---------- scroll (Lenis) → camera descent over the window section; pointer → head turn ----------
const lenis = new Lenis({lerp: reduced ? 1 : 0.085, smoothWheel: !reduced}); (window as any).__lenis = lenis;
const win = document.getElementById('win')!, lines = [...document.querySelectorAll<HTMLElement>('[data-l]')];
const sectionP = () => { const r = win.getBoundingClientRect(); return THREE.MathUtils.clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1); };
const head = {x: 0, y: 0, tx: 0, ty: 0};
addEventListener('pointermove', e => { head.tx = (e.clientX / innerWidth) * 2 - 1; head.ty = (e.clientY / innerHeight) * 2 - 1; });
const fxBtn = document.getElementById('fx')!; fxBtn.addEventListener('click', () => { state.fx = !state.fx; fxBtn.setAttribute('aria-pressed', String(state.fx)); });
fxBtn.setAttribute('aria-pressed', String(state.fx));
const look = new THREE.Vector3(), eul = new THREE.Euler(0, 0, 0, 'YXZ');

let last = 0, frame = 0;
function tick(now: number) {
  lenis.raf(now);
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; if (last) state.frames.push(now - last); last = now;
  const p = sectionP(); state.p = p;
  const r = win.getBoundingClientRect(); const visible = r.top < innerHeight && r.bottom > 0;
  lines.forEach((el, i) => { const k = THREE.MathUtils.clamp((p - 0.28 - i * 0.06) / 0.12, 0, 1);
    el.style.clipPath = `inset(0 0 ${(1 - k) * 100}% 0)`; el.style.transform = `translateY(${(1 - k) * 40}%)`; el.style.opacity = String(k); });
  if (!visible && state.ready) { requestAnimationFrame(tick); return; }     // render gate: only while the window is on screen (as the reference)
  head.x = THREE.MathUtils.damp(head.x, reduced ? 0 : head.tx, 2, dt); head.y = THREE.MathUtils.damp(head.y, reduced ? 0 : head.ty, 2, dt);
  camera.position.lerpVectors(P0, P1, p); look.lerpVectors(L0, L1, p); camera.lookAt(look);
  eul.setFromQuaternion(camera.quaternion); eul.y += THREE.MathUtils.degToRad(-head.x * 0.75); eul.x += THREE.MathUtils.degToRad(-head.y * 0.2); camera.quaternion.setFromEuler(eul);
  camera.updateMatrixWorld();
  const t = reduced ? 0 : now / 1000;
  dustMat.uniforms.uTime.value = t;
  vol.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse); vol.uniforms.uInvView.value.copy(camera.matrixWorld);
  vol.uniforms.uCam.value.copy(camera.position); vol.uniforms.uTime.value = t; vol.uniforms.uFrame.value = frame++ % 64; vol.uniforms.uOn.value = state.fx ? 1 : 0;
  grade.uniforms.uTime.value = (frame % 97) * 0.13;
  renderer.setRenderTarget(sceneRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
  composer.render(dt);
  state.ready = true;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
(window as any).__dbg = () => { const out: any[] = []; gltf.scene.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) out.push({n: m.name, attrs: Object.keys(m.geometry.attributes), vc: !!(m.material as any).defines?.VC, lm: !!(m.material as any).uniforms?.lm?.value}); }); return {cam: camera.position.toArray(), look: look.toArray(), meshes: out.slice(0, 12), count: out.length, chains: out.slice(0,0), names: (() => { const r: string[] = []; gltf.scene.traverse(o => { if ((o as THREE.Mesh).isMesh) { let c = o.name, x = o.parent; while (x) { c += ' < ' + x.name; x = x.parent; } r.push(c); } }); return r.filter((_, i) => i % 6 === 0); })()}; };
(window as any).__renderOnce = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
