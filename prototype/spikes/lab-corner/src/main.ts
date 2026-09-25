import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import './style.css';

type Az = {index: number; azimuth_deg: number; sun_dir: number[]; files: Record<string, string>; indirect_files: Record<string, string>};
type Mode = 'baked' | 'realtime' | 'hybrid';
type Manifest = {lm_scale: number; elevation: number; azimuths: Az[]; groups: Record<string, {object: string; materials: string[]}>; sun: {energy: number; color: number[]}; world: {color: number[]; strength: number}};

const params = new URLSearchParams(location.search);
const state = {ready: false, mode: (['realtime', 'hybrid'].includes(params.get('mode') ?? '') ? params.get('mode') : 'baked') as Mode, angle: Number(params.get('angle') ?? 60), frames: [] as number[]};
(window as any).__lab = state;
(window as any).__THREE = THREE;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8f9aa6);

const base = './scene/';
const manifest: Manifest = await (await fetch(base + 'manifest.json')).json();
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(base + 'lab_corner.glb');
const texLoader = new THREE.TextureLoader();
const loadLinear = async (f: string) => {const t = await texLoader.loadAsync(base + f); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.channel = 1; return t;};
const groupNames = Object.keys(manifest.groups);
const lightmaps: Record<string, THREE.Texture[]> = {}, indirectMaps: Record<string, THREE.Texture[]> = {}, aoMaps: Record<string, THREE.Texture> = {};
for (const g of groupNames) {
  lightmaps[g] = await Promise.all(manifest.azimuths.map(a => loadLinear(a.files[g])));
  indirectMaps[g] = await Promise.all(manifest.azimuths.map(a => loadLinear(a.indirect_files[g])));
  aoMaps[g] = await loadLinear(`ao_${g}.webp`);
}
const groupOf = (m: THREE.Mesh) => {let o: THREE.Object3D | null = m; while (o) {for (const g of groupNames) if (o.name === manifest.groups[g].object) return g; o = o.parent;} return groupNames[0];};
scene.add(gltf.scene); (window as any).__gltf = gltf;

// ---------- camera: orthographic from the glb ----------
const src = gltf.cameras[0] as THREE.OrthographicCamera;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
src.updateMatrixWorld(); camera.matrix.copy(src.matrixWorld); camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
const orthoHalfH = 3.2 * 0.62; // ortho_scale 6.4 is the width in Blender; fit height with margin
const resize = () => {
  const w = innerWidth, h = innerHeight, a = w / h;
  const halfH = Math.max(orthoHalfH, 3.3 / a);
  camera.left = -halfH * a; camera.right = halfH * a; camera.top = halfH; camera.bottom = -halfH;
  camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
};
addEventListener('resize', resize); resize();

// ---------- mode A: albedo × blend(lightmap_i, lightmap_i+1) ----------
const shared = {lmT: {value: 0}, lmScale: {value: manifest.lm_scale}, exposure: {value: 1.0}};
const groupUniforms: Record<string, {lmA: {value: THREE.Texture}; lmB: {value: THREE.Texture}}> = {};
const indUniforms: Record<string, {indA: {value: THREE.Texture}; indB: {value: THREE.Texture}}> = {};
for (const g of groupNames) {
  groupUniforms[g] = {lmA: {value: lightmaps[g][0]}, lmB: {value: lightmaps[g][1]}};
  indUniforms[g] = {indA: {value: indirectMaps[g][0]}, indB: {value: indirectMaps[g][1]}};
}
const baked = new Map<THREE.Mesh, THREE.Material>(), standard = new Map<THREE.Mesh, THREE.Material>(), hybrid = new Map<THREE.Mesh, THREE.Material>();
gltf.scene.traverse(o => {
  const m = o as THREE.Mesh;
  if (!m.isMesh) return;
  const std = m.material as THREE.MeshStandardMaterial;
  const g = groupOf(m);
  std.aoMap = aoMaps[g]; std.aoMapIntensity = 1.0; std.needsUpdate = true;
  m.castShadow = m.receiveShadow = true;
  standard.set(m, std);
  const sm = new THREE.ShaderMaterial({
    uniforms: {...shared, ...groupUniforms[g], map: {value: std.map}, useMap: {value: !!std.map}, color: {value: std.color},
      mapChannel: {value: std.map?.channel ?? 0}, emissiveChannel: {value: std.emissiveMap?.channel ?? 0},
      mapTransform: {value: (std.map ? (std.map.updateMatrix(), std.map.matrix) : new THREE.Matrix3())},
      emissiveTransform: {value: (std.emissiveMap ? (std.emissiveMap.updateMatrix(), std.emissiveMap.matrix) : new THREE.Matrix3())},
      emissive: {value: std.emissive.clone().multiplyScalar(std.emissiveIntensity)}, emissiveMap: {value: std.emissiveMap}, useEmissiveMap: {value: !!std.emissiveMap},
      alphaTest: {value: std.alphaTest}},
    vertexShader: `
      attribute vec2 uv1; attribute vec2 uv2; uniform int mapChannel, emissiveChannel;
      uniform mat3 mapTransform, emissiveTransform; varying vec2 vUv; varying vec2 vEUv; varying vec2 vUv1;
      vec2 pick(int c){ return c == 2 ? uv2 : (c == 1 ? uv1 : uv); }   // glTF texCoord index (palette textures use TEXCOORD_2)
      // KHR_texture_transform (added by gltf-transform palette/quantize) must be applied like three's built-in materials do
      void main(){ vUv = (mapTransform * vec3(pick(mapChannel), 1.0)).xy; vEUv = (emissiveTransform * vec3(pick(emissiveChannel), 1.0)).xy; vUv1 = uv1;
                   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D lmA, lmB, map, emissiveMap; uniform float lmT, lmScale, exposure, alphaTest;
      uniform bool useMap, useEmissiveMap; uniform vec3 color, emissive;
      varying vec2 vUv; varying vec2 vEUv; varying vec2 vUv1;
      vec3 dec(vec3 v){ return v * v * lmScale; }                 // sqrt-encoded linear irradiance
      void main(){
        vec4 alb = useMap ? texture2D(map, vUv) : vec4(1.0);
        if (alphaTest > 0.0 && alb.a < alphaTest) discard;
        vec3 light = mix(dec(texture2D(lmA, vUv1).rgb), dec(texture2D(lmB, vUv1).rgb), lmT);
        vec3 e = emissive * (useEmissiveMap ? texture2D(emissiveMap, vEUv).rgb : vec3(1.0));
        gl_FragColor = vec4(alb.rgb * color * light * exposure + e, 1.0);   // bake = albedo-free light
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: std.side,
  });
  (sm as any).toneMapped = true;
  baked.set(m, sm);
  // mode C: real-time direct sun (shadow map) + baked indirect bounce blended between azimuths
  const hy = std.clone(); hy.aoMap = null;
  hy.lightMap = indirectMaps[g][0]; hy.lightMapIntensity = 0;       // only to get vLightMapUv (channel 1)
  hy.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, shared, indUniforms[g]);
    sh.fragmentShader = 'uniform sampler2D indA, indB; uniform float lmT, lmScale;\n' + sh.fragmentShader.replace(
      '#include <lights_fragment_maps>',
      `#include <lights_fragment_maps>
       vec3 iA = texture2D(indA, vLightMapUv).rgb, iB = texture2D(indB, vLightMapUv).rgb;
       irradiance += PI * mix(iA * iA, iB * iB, lmT) * lmScale;`);
  };
  hybrid.set(m, hy);
});

// ---------- mode B: real-time sun + hemisphere + baked AO ----------
const sun = new THREE.DirectionalLight(new THREE.Color(...manifest.sun.color), manifest.sun.energy * 0.9);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, {left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 30});
const target = new THREE.Object3D(); target.position.set(1.9, 1.05, -2.2); scene.add(target); sun.target = target;
const hemi = new THREE.HemisphereLight(new THREE.Color(...manifest.world.color), 0x6b5a48, 0.9);
scene.add(sun, hemi);

const setMode = (mode: Mode) => {
  state.mode = mode;
  for (const [m, mat] of ({baked, realtime: standard, hybrid})[mode]) m.material = mat;
  sun.visible = mode !== 'baked'; hemi.visible = mode !== 'baked';
  hemi.intensity = mode === 'hybrid' ? 0.45 : 0.9;   // hybrid: sky's direct light is not in the indirect-only bake
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
};
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode as any)));
setMode(state.mode);

const N = manifest.azimuths.length, step = 360 / N;
const applyAngle = (deg: number) => {
  const a = ((deg % 360) + 360) % 360, f = a / step, i = Math.floor(f) % N, j = (i + 1) % N;
  for (const g of groupNames) {
    groupUniforms[g].lmA.value = lightmaps[g][i]; groupUniforms[g].lmB.value = lightmaps[g][j];
    indUniforms[g].indA.value = indirectMaps[g][i]; indUniforms[g].indB.value = indirectMaps[g][j];
  }
  shared.lmT.value = f - Math.floor(f);
  const az = THREE.MathUtils.degToRad(a), el = THREE.MathUtils.degToRad(manifest.elevation);
  const d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)); // Blender z-up → glTF y-up
  sun.position.copy(target.position).addScaledVector(d, 12);
  (document.getElementById('angle') as HTMLElement).textContent = `${a.toFixed(0)}°`;
};

// ---------- drag → angle with inertia (RCP-08 exponential damping, RCP-12 style release) ----------
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

let last = 0;
renderer.setAnimationLoop(now => {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; if (last) state.frames.push(now - last); last = now;
  if (!dragging) {targetAngle += vel * dt; vel *= Math.pow(0.9, 60 * dt);}
  state.angle = reduced ? targetAngle : THREE.MathUtils.damp(state.angle, targetAngle, 10, dt);
  applyAngle(state.angle);
  renderer.render(scene, camera);
  state.ready = true;
});
