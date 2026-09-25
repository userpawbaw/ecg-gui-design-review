import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import './style.css';

// v3: + scroll-driven camera descent (iso overview → monitor close-up, REF-002 EFX-002-02 practice), pointer head-turn
// (EFX-002-01), specular-only environment reflections, dust motes in the sun.
// v2 (mode C only): real-time sun (direct light + shadow map) + baked sky light (once) + baked sun bounce
// blended between 8 azimuths. The bakes are albedo-free and exclude the sun's direct light, so nothing is counted twice.
type Az = {index: number; azimuth_deg: number; sun_dir: number[]; bounce_files: Record<string, string>};
type Manifest = {lm_scale: number; elevation: number; azimuths: Az[]; sky_files: Record<string, string>;
  probes: Record<string, number[]>; groups: Record<string, {object: string}>; sun: {energy: number; color: number[]}};

const params = new URLSearchParams(location.search);
const state = {ready: false, angle: Number(params.get('angle') ?? 60), fx: params.get('fx') !== '0', frames: [] as number[], scroll: Number(params.get('p') ?? 0)};
(window as any).__lab = state;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;   // r186: soft PCF = Vogel disk, blur set by shadow.radius
const scene = new THREE.Scene();

// studio backdrop: soft radial gradient behind the diorama (display colours, not part of the lighting)
const bgCanvas = Object.assign(document.createElement('canvas'), {width: 512, height: 512});
const bgc = bgCanvas.getContext('2d')!, bgGrad = bgc.createRadialGradient(256, 230, 30, 256, 256, 380);
bgGrad.addColorStop(0, '#3a3d42'); bgGrad.addColorStop(1, '#141619');
bgc.fillStyle = bgGrad; bgc.fillRect(0, 0, 512, 512);
scene.background = new THREE.CanvasTexture(bgCanvas); (scene.background as THREE.Texture).colorSpace = THREE.SRGBColorSpace;

const base = './scene/';
const manifest: Manifest = await (await fetch(base + 'manifest.json')).json();
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(base + 'lab_corner.glb');
const texLoader = new THREE.TextureLoader();
const loadLinear = async (f: string) => {const t = await texLoader.loadAsync(base + f); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.channel = 1; return t;};
const mapped = Object.keys(manifest.sky_files);                   // groups with lightmaps (shell, props)
const sky: Record<string, THREE.Texture> = {}, bounce: Record<string, THREE.Texture[]> = {};
for (const g of mapped) {
  sky[g] = await loadLinear(manifest.sky_files[g]);
  bounce[g] = await Promise.all(manifest.azimuths.map(a => loadLinear(a.bounce_files[g])));
}
const probe = (k: string) => new THREE.Vector3(...(manifest.probes[k] ?? [0, 0, 0]));
const skyProbe = probe('sky_foliage'), bounceProbes = manifest.azimuths.map((_, i) => probe(`bounce_foliage_${String(i).padStart(2, '0')}`));
const groupNames = Object.keys(manifest.groups);
const groupOf = (m: THREE.Object3D) => {let o: THREE.Object3D | null = m; while (o) {for (const g of groupNames) if (o.name === manifest.groups[g].object) return g; o = o.parent;} return groupNames[0];};
scene.add(gltf.scene);

// ---------- camera: narrow-FOV perspective along the glb's isometric direction (reads as iso), then a scroll path ----------
const src = gltf.cameras[0] as THREE.OrthographicCamera; src.updateMatrixWorld();
const isoDir = new THREE.Vector3().setFromMatrixColumn(src.matrixWorld, 2).normalize();        // towards the viewer
const ROOM = new THREE.Vector3(1.9, 1.05, -2.2);                                               // Blender (1.9, 2.2, 1.05)
const SCREEN = new THREE.Vector3(1.35, 1.26, -3.66);                                           // monitor centre, faces +z
const camera = new THREE.PerspectiveCamera(20, 1, 0.05, 80);
const orthoHalfH = 3.2 * 0.62, D0 = 12;
// keyframes (p = 0 … 1): position / look-at / vertical FOV. p0 = iso overview, p1 = descending over the desk, p2 = at the screen
const KEYS = [
  {p: 0.0, pos: ROOM.clone().addScaledVector(isoDir, D0), look: ROOM.clone(), fov: 0},     // fov 0 → fit-to-frame
  {p: 0.55, pos: new THREE.Vector3(3.4, 2.3, 0.2), look: new THREE.Vector3(1.6, 0.95, -3.0), fov: 34},
  {p: 1.0, pos: new THREE.Vector3(1.38, 1.36, -2.86), look: SCREEN.clone().add(new THREE.Vector3(0, -0.01, 0)), fov: 30},
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map(k => k.pos), false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(KEYS.map(k => k.look), false, 'centripetal');
let fitFov = 20;

// ---------- materials: standard PBR + baked indirect injected after three's own light maps ----------
const shared = {lmT: {value: 0}, lmScale: {value: manifest.lm_scale}};
const bounceU: Record<string, {bA: {value: THREE.Texture}; bB: {value: THREE.Texture}}> = {};
for (const g of mapped) bounceU[g] = {bA: {value: bounce[g][0]}, bB: {value: bounce[g][1]}};
const foliageU = {pSky: {value: skyProbe}, pA: {value: bounceProbes[0]}, pB: {value: bounceProbes[1]}};
gltf.scene.traverse(o => {
  const m = o as THREE.Mesh;
  if (!m.isMesh) return;
  const g = groupOf(m), mat = (m.material as THREE.MeshStandardMaterial).clone();
  m.castShadow = m.receiveShadow = true;
  // Poly Haven parquet is near-glossy; at backlit angles the sun's mirror highlight blew out the frame (v2 QA, 135°)
  const minRough = mat.name === 'herringbone_parquet' ? 0.62 : 0.3;
  const clampRough = (sh: THREE.WebGLProgramParametersWithUniforms) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = max(roughnessFactor, ${minRough.toFixed(2)});`);
  };
  if (mapped.includes(g)) {
    mat.lightMap = sky[g]; mat.lightMapIntensity = 0;              // only to get vLightMapUv (TEXCOORD_1)
    mat.onBeforeCompile = sh => {
      clampRough(sh);
      Object.assign(sh.uniforms, shared, bounceU[g], {skyMap: {value: sky[g]}});
      sh.fragmentShader = 'uniform sampler2D skyMap, bA, bB; uniform float lmT, lmScale;\n' + sh.fragmentShader.replace(
        '#include <lights_fragment_maps>',
        `#include <lights_fragment_maps>
         vec3 s = texture2D(skyMap, vLightMapUv).rgb, a = texture2D(bA, vLightMapUv).rgb, b = texture2D(bB, vLightMapUv).rgb;
         irradiance += PI * (s * s + mix(a * a, b * b, lmT)) * lmScale;   // sqrt-encoded, albedo-free
         #ifdef USE_ENVMAP
         iblIrradiance = vec3(0.0);                                          // environment = reflections only
         #endif`);
    };
  } else {                                                         // foliage: one mean probe per bake
    mat.onBeforeCompile = sh => {
      clampRough(sh);
      Object.assign(sh.uniforms, shared, foliageU);
      sh.fragmentShader = 'uniform vec3 pSky, pA, pB; uniform float lmT;\n' + sh.fragmentShader.replace(
        '#include <lights_fragment_maps>',
        `#include <lights_fragment_maps>
         irradiance += PI * (pSky + mix(pA, pB, lmT));
         #ifdef USE_ENVMAP
         iblIrradiance = vec3(0.0);
         #endif`);
    };
  }
  m.material = mat;
});

// ---------- monitor: redraw the screen at 2048 px from the stored trace (the glb texture is 512 px — too soft for the close-up) ----------
const trace: {fs: number; samples: number[]} = await (await fetch(base + 'ecg_trace.json')).json();
const scr = Object.assign(document.createElement('canvas'), {width: 2048, height: 1152}), sx = scr.getContext('2d')!;
sx.fillStyle = '#05121a'; sx.fillRect(0, 0, 2048, 1152);
const mmPerMv = 1152 / 4, secW = (2048 - 64) / (trace.samples.length / trace.fs);             // ±2 mV tall, 5 s wide (as v1)
sx.strokeStyle = '#0d2b33'; sx.lineWidth = 2;
for (let x = 32; x < 2048; x += secW / 5) { sx.beginPath(); sx.moveTo(x, 0); sx.lineTo(x, 1152); sx.stroke(); }    // 0.2 s grid
for (let y = 576 % (mmPerMv / 2); y < 1152; y += mmPerMv / 2) { sx.beginPath(); sx.moveTo(0, y); sx.lineTo(2048, y); sx.stroke(); } // 0.5 mV grid
sx.strokeStyle = '#6fe8c6'; sx.lineWidth = 7; sx.lineJoin = 'round'; sx.shadowColor = '#6fe8c6'; sx.shadowBlur = 18; sx.beginPath();
trace.samples.forEach((v, i) => { const x = 32 + i / trace.fs * secW, y = 576 - v * mmPerMv; i ? sx.lineTo(x, y) : sx.moveTo(x, y); }); sx.stroke();
sx.shadowBlur = 0; sx.fillStyle = '#6fe8c699'; sx.font = '500 34px system-ui'; sx.fillText('STORED REPLAY · d1-mixed-10 · M08 · decorative', 40, 1110);
const screenTex = new THREE.CanvasTexture(scr); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.flipY = false; screenTex.anisotropy = 8;
gltf.scene.traverse(o => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mat = m.material as THREE.MeshStandardMaterial;
  if (mat.name === 'Screen') { mat.map = screenTex; mat.emissiveMap = screenTex; mat.emissive.set(0xffffff); mat.emissiveIntensity = 1.1; mat.needsUpdate = true; } });

// ---------- real-time sun ----------
const sun = new THREE.DirectionalLight(new THREE.Color(...manifest.sun.color), manifest.sun.energy);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.015;
sun.shadow.radius = 3.5;                                           // ≈ the 2.5° sun disc used in the bakes
Object.assign(sun.shadow.camera, {left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 1, far: 26});
const target = new THREE.Object3D(); target.position.set(1.9, 1.0, -2.0); scene.add(target); sun.target = target;
scene.add(sun);

// ---------- specular-only environment: metal/lamp/monitor get reflections, diffuse stays = bake + sun ----------
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

// ---------- dust motes: slow drift, brighter when looking toward the sun (forward scattering) ----------
const DUST = 700, dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) { dustPos.set([0.2 + Math.random() * 3.6, 0.1 + Math.random() * 2.4, -0.2 - Math.random() * 3.7], i * 3); dustSeed[i] = Math.random(); }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
const dustMat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {uTime: {value: 0}, uSun: {value: new THREE.Vector3(0, 1, 0)}, uScale: {value: 1}},
  vertexShader: `attribute float aSeed; uniform float uTime, uScale; uniform vec3 uSun; varying float vA;
    void main(){ vec3 p = position; float t = uTime * (0.03 + 0.04 * aSeed) + aSeed * 40.;
      p += vec3(sin(t * 1.3), sin(t * 0.7 + 1.7) * 0.6, cos(t * 1.1)) * 0.12;
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
      vec3 viewDir = normalize(cameraPosition - p);
      float fwd = pow(max(dot(-viewDir, uSun), 0.), 3.);                  // looking into the sun → motes light up
      vA = (0.05 + 0.6 * fwd) * (0.5 + 0.5 * sin(uTime * 0.8 + aSeed * 30.));
      gl_PointSize = min(uScale * (1.2 + 1.8 * aSeed) / -mv.z, 3.0); vA *= min(1., 2.5 / max(0.3, -mv.z)) ; }`,
  fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .95, .85) * vA * smoothstep(.5, 0., d), 1.); }`});
const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);

// ---------- window backdrop: sky seen through the window (camera-only, casts no shadow) ----------
const winCanvas = Object.assign(document.createElement('canvas'), {width: 256, height: 256});
const wc = winCanvas.getContext('2d')!, wg = wc.createLinearGradient(0, 0, 0, 256);
wg.addColorStop(0, '#6f9fd6'); wg.addColorStop(0.62, '#cfe0ee'); wg.addColorStop(0.63, '#9fb3a2'); wg.addColorStop(1, '#6f8a74');
wc.fillStyle = wg; wc.fillRect(0, 0, 256, 256);
wc.fillStyle = '#7d9480'; for (let i = 0; i < 9; i++) {wc.beginPath(); wc.arc(i * 34 + 8, 165, 18 + (i * 37 % 13), 0, Math.PI * 2); wc.fill();}  // distant tree line
const winTex = new THREE.CanvasTexture(winCanvas); winTex.colorSpace = THREE.SRGBColorSpace;
const winMat = new THREE.MeshBasicMaterial({map: winTex, color: new THREE.Color(1, 1, 1)});
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.8), winMat);
backdrop.position.set(2.3, 1.25, -4.6);                            // Blender (x, y, z) = (2.3, 4.6, 1.25)
scene.add(backdrop);

// ---------- post: bloom (screen + sunlit window) → tone map → grade/vignette ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: 4}));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.4, 1.4);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: {tDiffuse: {value: null}, aspect: {value: 1}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float aspect; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.06);                                   // slight saturation
      c = c + (vec3(0.012, 0.004, -0.010) * (1.0 - l));            // warm lift in the shadows
      c = (c - 0.5) * 1.04 + 0.5;                                  // gentle contrast
      vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
      c *= mix(1.0, 0.78, smoothstep(0.35, 1.05, length(p)));      // vignette
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
});
composer.addPass(grade);

const resize = () => {
  const w = innerWidth, h = innerHeight, a = w / h;
  const halfH = Math.max(orthoHalfH, 3.3 / a);
  fitFov = THREE.MathUtils.radToDeg(2 * Math.atan(halfH / D0));                 // same framing as the v2 orthographic view
  camera.aspect = a; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h);
  grade.uniforms.aspect.value = a; dustMat.uniforms.uScale.value = h * 0.9 * renderer.getPixelRatio() / 100;
};
addEventListener('resize', resize); resize();

const fxBtn = document.getElementById('fx') as HTMLButtonElement;
const setFx = (on: boolean) => {state.fx = on; fxBtn.setAttribute('aria-pressed', String(on));};
fxBtn.addEventListener('click', () => setFx(!state.fx)); setFx(state.fx);

// ---------- angle → sun direction, bake blend, backdrop, dial ----------
const N = manifest.azimuths.length, step = 360 / N;
const dialSun = document.getElementById('dial-sun') as unknown as SVGCircleElement;
const camRight = new THREE.Vector3().setFromMatrixColumn(src.matrixWorld, 0).setY(0).normalize();
const camFwd = isoDir.clone().setY(0).normalize();                                             // towards the viewer
const applyAngle = (deg: number) => {
  const a = ((deg % 360) + 360) % 360, f = a / step, i = Math.floor(f) % N, j = (i + 1) % N;
  for (const g of mapped) {bounceU[g].bA.value = bounce[g][i]; bounceU[g].bB.value = bounce[g][j];}
  foliageU.pA.value = bounceProbes[i]; foliageU.pB.value = bounceProbes[j];
  shared.lmT.value = f - Math.floor(f);
  const az = THREE.MathUtils.degToRad(a), el = THREE.MathUtils.degToRad(manifest.elevation);
  const d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)); // Blender z-up → glTF y-up
  sun.position.copy(target.position).addScaledVector(d, 12); dustMat.uniforms.uSun.value.copy(d);
  // sky behind the window is brighter when the sun is on that side (Blender +y = three -z)
  const behind = Math.max(0, Math.sin(az));
  winMat.color.setScalar(1.0 + 1.6 * behind * behind);
  // dial: sun position on the floor as seen from the camera (ellipse = isometric ground)
  const x = d.dot(camRight), z = d.dot(camFwd);
  dialSun.setAttribute('cx', String(24 + 17 * x)); dialSun.setAttribute('cy', String(24 + 9 * z));
  (document.getElementById('angle') as HTMLElement).textContent = `${a.toFixed(0)}°`;
};

// ---------- drag → angle with inertia (RCP-08 exponential damping) ----------
let targetAngle = state.angle, vel = 0, dragging = false, lastX = 0, lastT = 0;
canvas.addEventListener('pointerdown', e => {dragging = true; lastX = e.clientX; lastT = performance.now(); vel = 0; canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT) / 1000;
  targetAngle += dx * 0.45; vel = THREE.MathUtils.lerp(vel, dx * 0.45 / dt, 0.35); lastX = e.clientX; lastT = now;
});
const release = () => {dragging = false; if (reduced) vel = 0;};
canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
addEventListener('keydown', e => {if (e.key === 'ArrowLeft') targetAngle -= 15; if (e.key === 'ArrowRight') targetAngle += 15;});
(window as any).__setAngle = (a: number) => { targetAngle = a; vel = 0; };   // capture hook

// ---------- scroll → camera path (RCP-08 damped, frame-rate independent), pointer → small head turn ----------
const scrollP = () => { const max = document.documentElement.scrollHeight - innerHeight; return max > 0 ? scrollY / max : 0; };
if (params.has('p')) { const max = document.documentElement.scrollHeight - innerHeight; scrollTo(0, state.scroll * max); }
let camP = scrollP(); const look = new THREE.Vector3(), head = {x: 0, y: 0, tx: 0, ty: 0};
addEventListener('pointermove', e => { head.tx = (e.clientX / innerWidth) * 2 - 1; head.ty = (e.clientY / innerHeight) * 2 - 1; });
const caption = document.getElementById('caption')!;
const ease = (t: number) => t * t * (3 - 2 * t);
function placeCamera(p: number) {
  const t = ease(p);
  camera.position.copy(posCurve.getPoint(t)); look.copy(lookCurve.getPoint(t));
  // head turn: ±0.9° yaw, ±0.4° pitch, stronger when close
  const k = 0.4 + 0.6 * t; look.x += head.x * 0.03 * k * camera.position.distanceTo(look); look.y -= head.y * 0.014 * k * camera.position.distanceTo(look);
  camera.lookAt(look);
  const f1 = KEYS[1].fov, f2 = KEYS[2].fov;
  camera.fov = t < KEYS[1].p ? THREE.MathUtils.lerp(fitFov, f1, ease(t / KEYS[1].p)) : THREE.MathUtils.lerp(f1, f2, ease((t - KEYS[1].p) / (1 - KEYS[1].p)));
  camera.updateProjectionMatrix();
  caption.style.opacity = String(THREE.MathUtils.clamp((p - 0.86) / 0.12, 0, 1));
}

let last = 0;
renderer.setAnimationLoop(now => {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; if (last) state.frames.push(now - last); last = now;
  if (!dragging) {targetAngle += vel * dt; vel *= Math.pow(0.9, 60 * dt);}
  state.angle = reduced ? targetAngle : THREE.MathUtils.damp(state.angle, targetAngle, 10, dt);
  applyAngle(state.angle);
  camP = reduced ? scrollP() : THREE.MathUtils.damp(camP, scrollP(), 6, dt);   // ~0.17 s time constant
  head.x = THREE.MathUtils.damp(head.x, reduced ? 0 : head.tx, 2, dt); head.y = THREE.MathUtils.damp(head.y, reduced ? 0 : head.ty, 2, dt);
  placeCamera(camP); state.scroll = camP;
  dustMat.uniforms.uTime.value = reduced ? 0 : now / 1000;
  if (state.fx) composer.render(); else renderer.render(scene, camera);
  state.ready = true;
});
