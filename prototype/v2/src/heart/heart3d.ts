/* D-188 작은 3D 심장 — 도입 화면과 같은 모형(heart.glb) · 같은 윤곽선 재질(figure.ts rimMaterial) · 같은 심실 수축 모양.
 * 박동이 들어오면 0.7 s 동안만 그리고, 그 밖에는 마지막 그림 그대로(연속 그리기 없음). */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {rimMaterial} from '../story/intro/figure';
let geoP: Promise<THREE.BufferGeometry> | null = null;
const loadGeo = () => geoP ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../story/intro/assets/heart.glb', import.meta.url).href).then(g => {
  let m: THREE.Mesh | null = null; g.scene.traverse(o => { if ((o as THREE.Mesh).isMesh && !m) m = o as THREE.Mesh; }); return (m as unknown as THREE.Mesh).geometry; });
export async function mountHeart(canvas: HTMLCanvasElement) {
  const geo = await loadGeo(); geo.computeBoundingBox(); const bb = geo.boundingBox!, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  const r = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'}); r.setClearColor(0, 0);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, .01, 100);
  const mat = rimMaterial('#ff7482', 2.4, .09, true); mat.uniforms.uMinY.value = bb.min.y; mat.uniforms.uMaxY.value = bb.max.y;
  const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(c).multiplyScalar(-1); const g = new THREE.Group(); g.add(mesh); g.rotation.y = -.35; scene.add(g);
  const d = Math.max(size.x, size.y) / 2 / Math.tan(THREE.MathUtils.degToRad(14)) * 1.15; cam.position.set(0, 0, d); cam.lookAt(0, 0, 0);
  let raf = 0, t0 = -1, dim = 1, gone = false;
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const draw = (s: number) => { // figure.ts beat(): 심실 — R에서 빠르게 수축, T파 즈음 이완 / 섬광
    const V = s < .07 ? Math.sin(s / .07 * Math.PI / 2) : s < .14 ? 1 : Math.max(0, 1 - (s - .14) / .24) ** 2, u = mat.uniforms;
    u.uV.value = V; u.uA.value = 0; u.uFlash.value = Math.exp(-s / .12) * 1.3; u.uOpacity.value = 1.6 * dim; r.render(scene, cam); };
  const loop = (now: number) => { if (gone) return; const s = (now - t0) / 1000; draw(s); if (s < .7) raf = requestAnimationFrame(loop); };
  resize(); draw(9);
  const ro = new ResizeObserver(() => { resize(); draw(t0 < 0 ? 9 : (performance.now() - t0) / 1000); }); ro.observe(canvas);
  return {
    beat() { if (gone) return; cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(loop); },
    setDim(on: boolean) { const v = on ? .35 : 1; if (v !== dim) { dim = v; if (!raf || (performance.now() - t0) / 1000 >= .7) draw(9); } },
    dispose() { gone = true; cancelAnimationFrame(raf); ro.disconnect(); mat.dispose(); r.dispose(); },
  };
}
