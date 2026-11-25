/* D-188 작은 3D 심장 — 도입 화면과 같은 모형(heart.glb) · 같은 윤곽선 재질(figure.ts rimMaterial) · 같은 심실 수축 모양.
 * D-200(F-112): 박동 0.7 s를 60 fps 프레임으로 미리 렌더해 두고(크기가 바뀔 때만), 박동은 2D로 그 프레임을 붙여 재생한다.
 * 전에는 박동마다 0.7 s 동안 WebGL로 매 프레임 렌더했다(시간의 약 85 %) — 소프트웨어 합성에서는 그 캔버스를 매 프레임 다시 읽어 와
 * 실시간 탭 화면 합성 CPU의 약 3분의 1을 차지했다. 미리 렌더가 끝나면 WebGL 문맥은 버린다. ?heartlive=1 : 이전(매 프레임 WebGL). */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {rimMaterial} from '../story/intro/figure';
let geoP: Promise<THREE.BufferGeometry> | null = null;
const loadGeo = () => geoP ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../story/intro/assets/heart.glb', import.meta.url).href).then(g => {
  let m: THREE.Mesh | null = null; g.scene.traverse(o => { if ((o as THREE.Mesh).isMesh && !m) m = o as THREE.Mesh; }); return (m as unknown as THREE.Mesh).geometry; });
const LIVE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('heartlive');
const FPS = 60, DUR = .7, NB = Math.ceil(DUR * FPS) + 1;   // 박동 프레임 0 … 0.7 s
/** 박동 위상 s(초) → 셰이더 값(figure.ts beat(): 심실 — R에서 빠르게 수축, T파 즈음 이완 / 섬광) */
const beatAt = (s: number) => ({V: s < .07 ? Math.sin(s / .07 * Math.PI / 2) : s < .14 ? 1 : Math.max(0, 1 - (s - .14) / .24) ** 2, flash: Math.exp(-s / .12) * 1.3});

export async function mountHeart(canvas: HTMLCanvasElement) {
  const geo = await loadGeo(); geo.computeBoundingBox(); const bb = geo.boundingBox!, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, .01, 100);
  const mat = rimMaterial('#ff7482', 2.4, .09, true); mat.uniforms.uMinY.value = bb.min.y; mat.uniforms.uMaxY.value = bb.max.y;
  const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(c).multiplyScalar(-1); const g = new THREE.Group(); g.add(mesh); g.rotation.y = -.35; scene.add(g);
  const d = Math.max(size.x, size.y) / 2 / Math.tan(THREE.MathUtils.degToRad(14)) * 1.15; cam.position.set(0, 0, d); cam.lookAt(0, 0, 0);
  let raf = 0, t0 = -1, dim = 1, gone = false;
  const shade = (s: number, dm: number) => { const b = beatAt(s), u = mat.uniforms; u.uV.value = b.V; u.uA.value = 0; u.uFlash.value = b.flash; u.uOpacity.value = 1.6 * dm; };

  if (LIVE) {   // 이전 방식(비교용)
    const r = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'}); r.setClearColor(0, 0);
    const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const draw = (s: number) => { shade(s, dim); r.render(scene, cam); };
    const loop = (now: number) => { if (gone) return; const s = (now - t0) / 1000; draw(s); if (s < DUR) raf = requestAnimationFrame(loop); };
    resize(); draw(9);
    const ro = new ResizeObserver(() => { resize(); draw(t0 < 0 ? 9 : (performance.now() - t0) / 1000); }); ro.observe(canvas);
    return {
      beat() { if (gone) return; cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(loop); },
      setDim(on: boolean) { const v = on ? .35 : 1; if (v !== dim) { dim = v; if (!raf || (performance.now() - t0) / 1000 >= DUR) draw(9); } },
      dispose() { gone = true; cancelAnimationFrame(raf); ro.disconnect(); mat.dispose(); r.dispose(); },
    };
  }

  // 미리 렌더: 가로로 NB(박동) + 2(쉼 · 쉼 흐림) 칸짜리 한 장
  const g2 = canvas.getContext('2d')!;
  let sheet: HTMLCanvasElement | null = null, W = 0, H = 0, shown = -2;
  const bake = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return false;
    const pr = Math.min(2, devicePixelRatio || 1), cw = Math.round(w * pr), ch = Math.round(h * pr);
    if (sheet && cw === W && ch === H) return true;
    const gl = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({canvas: gl, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: true}); r.setClearColor(0, 0);
    r.setPixelRatio(1); r.setSize(cw, ch, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    const sh = document.createElement('canvas'); sh.width = cw * (NB + 2); sh.height = ch; const sg = sh.getContext('2d')!;
    for (let i = 0; i < NB + 2; i++) { const s = i < NB ? i / FPS : 9, dm = i === NB + 1 ? .35 : 1; shade(s, dm); r.render(scene, cam); sg.drawImage(gl, i * cw, 0); }
    r.dispose(); r.forceContextLoss();
    sheet = sh; W = cw; H = ch; canvas.width = cw; canvas.height = ch; shown = -2; return true;
  };
  const show = (i: number) => { if (!sheet || i === shown) return; shown = i; g2.clearRect(0, 0, W, H); g2.drawImage(sheet, i * W, 0, W, H, 0, 0, W, H); };
  const idle = () => show(dim < 1 ? NB + 1 : NB);
  const loop = (now: number) => { if (gone) return; const s = (now - t0) / 1000; if (s >= DUR) { raf = 0; idle(); return; } show(Math.min(NB - 1, Math.floor(s * FPS))); raf = requestAnimationFrame(loop); };
  if (bake()) idle();
  const ro = new ResizeObserver(() => { if (bake()) { if (raf) show(Math.min(NB - 1, Math.floor((performance.now() - t0) / 1000 * FPS))); else idle(); } }); ro.observe(canvas);
  return {
    beat() { if (gone) return; cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(loop); },
    setDim(on: boolean) { const v = on ? .35 : 1; if (v !== dim) { dim = v; if (!raf) idle(); } },
    dispose() { gone = true; cancelAnimationFrame(raf); ro.disconnect(); mat.dispose(); sheet = null; },
  };
}
