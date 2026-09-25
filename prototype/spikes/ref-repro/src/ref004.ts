import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './ref004.css';
import * as THREE from 'three';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';

// REF-004 repro (vanilla three.js). Rendering = 3 render targets + one compositor (RCP-20):
//   globeRT  : lit globe (MSAA)               → tone-mapped ×2 exposure in the compositor
//   glowRT   : facing-ratio halo, 1/2 res     → only behind the globe
//   markRT   : vessels, tick rings, trails as R = opacity, occluded by a depth-only sphere → painted pure white
// Interaction: drag + inertia (RCP-12), hover raycast → DOM card with iris photo (RCP-21), filter → biggest cluster (RCP-22).

type Station = {id: string; name: string; type: 'coastal' | 'offshore' | 'polar'; lat: number; lng: number; trail?: [number, number][]; photo: string; text: string; rings?: number};
const P = (s: string) => `./ref004/photo_${s}.webp`;
// Demo content only — invented stations, not real deployments.
const STATIONS: Station[] = [
  {id: 'a', name: 'Kelp Shelf Survey', type: 'coastal', lat: 36.6, lng: -122.0, photo: P('dalkey_view'), text: 'Near-shore current and temperature profiling along a kelp shelf.', trail: [[37.8, -123.6], [37.0, -122.9], [36.6, -122.0]]},
  {id: 'b', name: 'Gulf Buoy Line', type: 'offshore', lat: 27.2, lng: -90.4, photo: P('blue_lagoon'), text: 'Autonomous line of drifting buoys logging wave spectra.', trail: [[25.6, -93.8], [26.4, -92.1], [27.2, -90.4]]},
  {id: 'c', name: 'Harbour Acoustics', type: 'coastal', lat: 40.4, lng: -73.6, photo: P('bell_park_pier'), text: 'Passive acoustic monitoring at a busy harbour mouth.'},
  {id: 'd', name: 'Sargasso Transect', type: 'offshore', lat: 31.0, lng: -64.0, photo: P('aristea_wreck'), text: 'Long transect across the gyre, sampling every 20 km.', trail: [[27.5, -70.5], [29.2, -67.4], [31.0, -64.0]], rings: 120},
  {id: 'e', name: 'Labrador Ice Edge', type: 'polar', lat: 57.8, lng: -54.5, photo: P('abandoned_slipway'), text: 'Tracking the seasonal ice edge with a hardened hull.', trail: [[54.8, -52.0], [56.4, -53.0], [57.8, -54.5]]},
  {id: 'f', name: 'Caribbean Reef Watch', type: 'coastal', lat: 18.2, lng: -66.5, photo: P('fish_hoek_beach'), text: 'Reef temperature and turbidity, hourly.'},
  {id: 'g', name: 'Mid-Atlantic Relay', type: 'offshore', lat: 38.5, lng: -41.0, photo: P('aristea_wreck'), text: 'Relay vessel bridging two sensor clusters.', trail: [[36.0, -47.5], [37.2, -44.0], [38.5, -41.0]]},
  {id: 'h', name: 'Gulf of Maine Mooring', type: 'coastal', lat: 43.4, lng: -68.8, photo: P('dalkey_view'), text: 'Moored profiler over a cold-water shelf.'},
  {id: 'i', name: 'Pacific Swell Array', type: 'offshore', lat: 29.5, lng: -128.5, photo: P('blue_lagoon'), text: 'Swell and wind array west of the coast.', trail: [[27.0, -133.5], [28.2, -131.0], [29.5, -128.5]]},
  {id: 'j', name: 'Greenland Fjord Run', type: 'polar', lat: 64.0, lng: -40.5, photo: P('abandoned_slipway'), text: 'Meltwater outflow sampling at a fjord mouth.'},
  {id: 'k', name: 'North Sea Survey', type: 'offshore', lat: 56.0, lng: 3.0, photo: P('bell_park_pier'), text: 'Seabed mapping block, day and night.', trail: [[54.2, 1.0], [55.1, 2.1], [56.0, 3.0]]},
  {id: 'l', name: 'Biscay Glider', type: 'offshore', lat: 45.5, lng: -8.0, photo: P('fish_hoek_beach'), text: 'Glider transect across the shelf break.'},
  {id: 'm', name: 'Svalbard Shelf', type: 'polar', lat: 77.5, lng: 12.0, photo: P('abandoned_slipway'), text: 'High-latitude shelf survey in the summer window.'},
  {id: 'n', name: 'Florida Strait Watch', type: 'coastal', lat: 25.0, lng: -80.0, photo: P('fish_hoek_beach'), text: 'Current meter line across the strait.', trail: [[23.8, -82.2], [24.4, -81.1], [25.0, -80.0]]},
];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {ready: false, theta: 0, phi: 0, hovered: '' as string, filter: '', frames: [] as number[]};
(window as any).__globe = state;

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: true, premultipliedAlpha: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

// narrow-FOV camera (near-orthographic look), globe centre below the fold so only the upper cap shows
const camera = new THREE.PerspectiveCamera(12, 1, 1, 30);
camera.position.set(0, 0, 7.6);
const GLOBE_Y = -0.92;
const R = 1, MARK_R = R * 1.00625;

// orientation: phi about X, theta about Y (same model as REF-004); applied to every layer
const rot = {theta: THREE.MathUtils.degToRad(88), phi: THREE.MathUtils.degToRad(72)};
const target = {theta: rot.theta, phi: rot.phi, active: false};
const vel = {theta: 0, phi: 0};
const PHI_MIN = 0.1 * Math.PI, PHI_MAX = 0.9 * Math.PI;
const orient = new THREE.Quaternion();
const qx = new THREE.Quaternion(), qy = new THREE.Quaternion();
const updateOrient = () => { qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rot.phi - Math.PI / 2); qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot.theta); orient.multiplyQuaternions(qx, qy); };
const latLngToVec = (lat: number, lng: number, r = MARK_R) => { const p = THREE.MathUtils.degToRad(lat), l = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)); };

const tex = new THREE.TextureLoader();
const load = (u: string, srgb = true) => tex.loadAsync(u).then(t => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; });
const [colorMap, normalMap] = await Promise.all([load('./ref004/earth_color.webp'), load('./ref004/earth_normal.webp', false)]);

// ---------- scene 1: globe (lit) ----------
const globeScene = new THREE.Scene();
const globeRoot = new THREE.Group(); globeRoot.position.y = GLOBE_Y; globeScene.add(globeRoot);
const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 128),
  new THREE.MeshStandardMaterial({map: colorMap, normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1, metalness: 0}));
globe.rotation.y = -Math.PI / 2;           // align texture seam: u = 0.5 ↔ lng 0 on +Z
globeRoot.add(globe);
// lights follow the camera (not the globe) → the lit face is always the one we look at
const key = new THREE.DirectionalLight(0xffffff, 0.5 * Math.PI); key.position.set(0, 2, 0.5);
const fill = new THREE.DirectionalLight(0xffffff, 0.5 * Math.PI); fill.position.set(0, 2, -0.5);
const hemi = new THREE.HemisphereLight(0xffffff, 0x0e2a22, 0.55);
globeScene.add(key, fill, hemi);

// ---------- scene 2: halo ----------
const glowScene = new THREE.Scene();
const glow = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  uniforms: {uColor: {value: new THREE.Color('#CCF8BD')}},
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
    void main(){ float f = max(dot(normalize(vV), normalize(vN)), 0.); float a = pow(smoothstep(0., 1., f), 2.) * 0.9; gl_FragColor = vec4(uColor * a, a); }`,
}));
glow.scale.setScalar(1.1); glow.position.y = GLOBE_Y; glowScene.add(glow);

// ---------- scene 3: marks (R = opacity), occluded by a depth-only sphere ----------
const markScene = new THREE.Scene();
const markRoot = new THREE.Group(); markRoot.position.y = GLOBE_Y; markScene.add(markRoot);
const occluder = new THREE.Mesh(new THREE.SphereGeometry(R * 0.999, 96, 64), new THREE.MeshBasicMaterial({colorWrite: false}));
occluder.renderOrder = -1; markRoot.add(occluder);
const markRot = new THREE.Group(); markRoot.add(markRot);

const shared = {uTime: {value: 0}};
const opacityFrag = `uniform float uOpacity; varying float vOp; void main(){ gl_FragColor = vec4(vOp * uOpacity, 0., 0., 1.); }`;
// tick ring: instanced dashes; brightness wave travels around the ring (dashes stay in place)
const ringVert = `attribute float aPhase; uniform float uTime, uFreq, uHi; varying float vOp;
  void main(){ float s = sin(uTime * uFreq + aPhase), s2 = sin(uTime * uFreq * .6 + aPhase + .54);
    vec3 p = position; p.y += s * .006; p.z += s2 * .0015;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);
    vOp = (1. - clamp(pow((s + 1.) * .5, 2.) - .2, 0., .6)) * (1. - uHi); }`;
const boatVert = `uniform float uTime, uSeed; varying float vOp;
  void main(){ float t = uSeed + uTime * 3. * (0.8 + 0.4 * fract(uSeed * 7.3)); vec3 p = position;
    float rx = sin(t) * .06, ry = cos(t) * .06; p.yz = mat2(cos(rx), -sin(rx), sin(rx), cos(rx)) * p.yz; p.xz = mat2(cos(ry), -sin(ry), sin(ry), cos(ry)) * p.xz;
    p.z += (sin(t) + 1.) * .5 * .004; vOp = 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`;

// low-poly vessel (extruded hull + cabin), ~0.08 long in globe units
const hull = new THREE.Shape(); hull.moveTo(-0.5, -0.18); hull.lineTo(0.35, -0.18); hull.quadraticCurveTo(0.62, 0, 0.35, 0.18); hull.lineTo(-0.5, 0.18); hull.lineTo(-0.5, -0.18);
const boatGeo = new THREE.ExtrudeGeometry(hull, {depth: 0.12, bevelEnabled: false}); boatGeo.translate(0, 0, 0);
const cabin = new THREE.BoxGeometry(0.3, 0.26, 0.16); cabin.translate(-0.15, 0, 0.18);
const boatGeom = mergeGeos([boatGeo, cabin]); boatGeom.scale(0.026, 0.026, 0.026);
function mergeGeos(gs: THREE.BufferGeometry[]) { const pos: number[] = []; for (const g of gs) { const ng = g.index ? g.toNonIndexed() : g; pos.push(...(ng.attributes.position.array as Float32Array)); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return out; }
const dashGeo = new THREE.BoxGeometry(0.0042, 0.0042, 0.001);

type Mark = {st: Station; group: THREE.Group; ringMats: THREE.ShaderMaterial[]; boatMat: THREE.ShaderMaterial; trail?: Line2; trailBoats: THREE.ShaderMaterial[]; collider: THREE.Mesh; vis: number; visTarget: number; hi: number; pos: THREE.Vector3};
const marks: Mark[] = [];
const up = new THREE.Vector3(0, 0, 1);
const lineMats: LineMaterial[] = [];
function surfaceFrame(pos: THREE.Vector3, tangent?: THREE.Vector3) {
  // local frame: +Z = surface normal, +X = heading along the trail (or east)
  const n = pos.clone().normalize(); const east = new THREE.Vector3(0, 1, 0).cross(n).normalize();
  const x = tangent ? tangent.clone().sub(n.clone().multiplyScalar(tangent.dot(n))).normalize() : east; const y = n.clone().cross(x);
  return new THREE.Matrix4().makeBasis(x, y, n).setPosition(pos);
}
for (const st of STATIONS) {
  const g = new THREE.Group(); markRot.add(g);
  const pos = latLngToVec(st.lat, st.lng);
  const pts = st.trail?.map(([a, b]) => latLngToVec(a, b)) ?? [];
  let heading: THREE.Vector3 | undefined;
  const trailBoats: THREE.ShaderMaterial[] = [];
  let trail: Line2 | undefined;
  if (pts.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    heading = curve.getTangentAt(1);
    const line = curve.getPoints(80).map(p => p.normalize().multiplyScalar(MARK_R + 0.002));
    const lg = new LineGeometry(); lg.setPositions(line.flatMap(p => [p.x, p.y, p.z]));
    const lm = new LineMaterial({color: 0xff0000, linewidth: 1.8, dashed: true, dashSize: 0.008, gapSize: 0.007, transparent: true});
    lineMats.push(lm);
    trail = new Line2(lg, lm); trail.computeLineDistances(); g.add(trail);
    // smaller "ghost" vessels along the trail
    for (let k = 0; k < 2; k++) { const t = (k + 1) / 3, p = curve.getPointAt(t).normalize().multiplyScalar(MARK_R);
      const m = new THREE.ShaderMaterial({uniforms: {...shared, uSeed: {value: Math.random() * 10}, uOpacity: {value: 1}}, vertexShader: boatVert, fragmentShader: opacityFrag, side: THREE.DoubleSide});
      const b = new THREE.Mesh(boatGeom, m); b.applyMatrix4(surfaceFrame(p, curve.getTangentAt(t))); b.scale.setScalar(0.6); g.add(b); trailBoats.push(m); }
  }
  const frame = surfaceFrame(pos, heading);
  const holder = new THREE.Group(); holder.applyMatrix4(frame); g.add(holder);
  const boatMat = new THREE.ShaderMaterial({uniforms: {...shared, uSeed: {value: Math.random() * 10}, uOpacity: {value: 1}}, vertexShader: boatVert, fragmentShader: opacityFrag, side: THREE.DoubleSide});
  holder.add(new THREE.Mesh(boatGeom, boatMat));
  const s = (st.rings ?? 100) / 100, ringMats: THREE.ShaderMaterial[] = [];
  for (const [r, n, freq, dir] of [[0.14 * s * 0.32, Math.round(28 * Math.sqrt(s)), 0.3 * 2 * Math.PI / 3, -1], [0.21 * s * 0.32, Math.round(16 * Math.sqrt(s)), 2 * Math.PI / 3, 1]] as const) {
    const mat = new THREE.ShaderMaterial({uniforms: {...shared, uFreq: {value: freq}, uHi: {value: 0}, uOpacity: {value: 1}}, vertexShader: ringVert, fragmentShader: opacityFrag});
    const inst = new THREE.InstancedMesh(dashGeo, mat, n); const phase = new Float32Array(n); const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; m4.makeRotationZ(a).setPosition(Math.cos(a) * r, Math.sin(a) * r, 0.002); inst.setMatrixAt(i, m4); phase[i] = dir * a; }
    inst.geometry = dashGeo.clone(); inst.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    holder.add(inst); ringMats.push(mat);
  }
  const collider = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({visible: false}));
  collider.position.copy(pos); collider.userData.id = st.id; g.add(collider);
  marks.push({st, group: g, ringMats, boatMat, trail, trailBoats, collider, vis: 1, visTarget: 1, hi: 0, pos});
}

// ---------- render targets + compositor ----------
const rtOpts = {type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace};
const globeRT = new THREE.WebGLRenderTarget(1, 1, {...rtOpts, samples: 8});
const glowRT = new THREE.WebGLRenderTarget(1, 1, {...rtOpts});
const markRT = new THREE.WebGLRenderTarget(1, 1, {...rtOpts, samples: 4});
const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
  uniforms: {tGlobe: {value: globeRT.texture}, tGlow: {value: glowRT.texture}, tMark: {value: markRT.texture}, uRes: {value: new THREE.Vector2()}, uOutline: {value: new THREE.Color('#C7DBBE')}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: `uniform sampler2D tGlobe, tGlow, tMark; uniform vec2 uRes; uniform vec3 uOutline; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
    float outline(vec2 uv){ vec2 px = 1.5 / uRes; float c = texture2D(tGlobe, uv).a, e = 0.;
      for (int i = 0; i < 8; i++){ float a = float(i) * .785398; float n = texture2D(tGlobe, uv + vec2(cos(a), sin(a)) * px).a;
        e = max(e, (1. - step(.1, c)) * step(.1, n)); } return e; }
    void main(){
      vec4 g = texture2D(tGlobe, vUv), h = texture2D(tGlow, vUv); float m = texture2D(tMark, vUv).r;
      vec3 gc = g.a > .001 ? aces(g.rgb / g.a * 1.45) : vec3(0.);           // globe only: exposure ×2 + ACES
      vec3 col = gc * g.a + h.rgb * (1. - g.a); float a = g.a + h.a * (1. - g.a);
      float e = outline(vUv) * .4; col = col * (1. - e) + uOutline * e; a = max(a, e);
      col = mix(col, vec3(1.), clamp(m, 0., 1.)); a = a + m * (1. - a);    // marks: pure white
      col = pow(col, vec3(1. / 2.2));                                       // linear → display
      gl_FragColor = vec4(col * a, a);
    }`,
}));
const compScene = new THREE.Scene(); compScene.add(comp);
const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const resize = () => {
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = renderer.getPixelRatio();
  renderer.setSize(w, h, false); camera.aspect = w / h;
  // keep the globe ~93 % of the width (REF-004 framing) on wide screens, cap by height on narrow ones
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.max(1.08 / camera.aspect, 0.56) / camera.position.z * 1.0));
  camera.updateProjectionMatrix();
  globeRT.setSize(w * dpr, h * dpr); markRT.setSize(w * dpr, h * dpr); glowRT.setSize(w * dpr / 2, h * dpr / 2);
  (comp.material as THREE.ShaderMaterial).uniforms.uRes.value.set(w * dpr, h * dpr);
  for (const lm of lineMats) lm.resolution.set(w, h);
};
addEventListener('resize', resize); resize();

// ---------- interaction: drag + inertia ----------
let dragging = false, lastX = 0, lastY = 0, lastT = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); vel.theta = vel.phi = 0; target.active = false; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  pointer.set(e.offsetX / canvas.clientWidth * 2 - 1, -(e.offsetY / canvas.clientHeight) * 2 + 1); pointerMoved = true; lastPointer = [e.offsetX, e.offsetY];
  if (!dragging) return;
  const now = performance.now(), k = 16.67 / Math.max(now - lastT, 1), dx = e.clientX - lastX, dy = e.clientY - lastY, s = e.pointerType === 'touch' ? 0.01 : 0.005;
  vel.theta = THREE.MathUtils.clamp(dx * k * s * 0.5, -0.2, 0.2); vel.phi = THREE.MathUtils.clamp(dy * k * s * 0.25, -0.2, 0.2);
  rot.theta += dx * s; rot.phi = THREE.MathUtils.clamp(rot.phi + dy * s, PHI_MIN, PHI_MAX);
  lastX = e.clientX; lastY = e.clientY; lastT = now;
});
const end = () => { dragging = false; if (reduced) vel.theta = vel.phi = 0; };
canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
canvas.addEventListener('pointerleave', () => { pointerMoved = true; pointer.set(9, 9); });

// ---------- hover → DOM card ----------
const pointer = new THREE.Vector2(9, 9); let pointerMoved = false, lastPointer = [0, 0], frameN = 0;
const ray = new THREE.Raycaster();
const overlay = document.getElementById('overlay')!;
const pops = new Map<string, HTMLElement>();
for (const m of marks) {
  const el = document.createElement('div'); el.className = 'pop';
  el.innerHTML = `<div class="photo"><div class="inner"><img alt="" src="${m.st.photo}"></div></div>
    <div class="card"><span class="tag">${m.st.type} · demo</span><h3>${m.st.name}</h3><p>${m.st.text}</p><button type="button">READ MORE <span>+</span></button></div>`;
  overlay.appendChild(el); pops.set(m.st.id, el);
}
const tmpV = new THREE.Vector3();
function pickHover() {
  if (dragging || target.active) return '';
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObjects([occluder, ...marks.filter(m => m.vis > 0.5).map(m => m.collider)], false);
  for (const h of hits) { if (h.object === occluder) return ''; return h.object.userData.id as string; }
  return '';
}

// ---------- filters → fade + rotate to the biggest cluster ----------
const buttons = [...document.querySelectorAll<HTMLButtonElement>('#filters button')];
const hav = (a: Station, b: Station) => { const p1 = THREE.MathUtils.degToRad(a.lat), p2 = THREE.MathUtils.degToRad(b.lat), dp = p2 - p1, dl = THREE.MathUtils.degToRad(b.lng - a.lng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
function focusBiggestCluster(list: Station[]) {
  const thr = 0.45; const clusters: Station[][] = [];
  for (const s of list) { const c = clusters.find(c => c.some(o => hav(o, s) < thr)); c ? c.push(s) : clusters.push([s]); }
  const big = clusters.reduce((a, c) => c.length > a.length ? c : a, [] as Station[]); if (!big.length) return;
  const lat = big.reduce((a, s) => a + s.lat, 0) / big.length, lng = big.reduce((a, s) => a + s.lng, 0) / big.length;
  // centre the cluster slightly above the globe's visible top-centre
  target.theta = THREE.MathUtils.degToRad(-lng); target.phi = THREE.MathUtils.clamp(Math.PI / 2 + THREE.MathUtils.degToRad(lat) - THREE.MathUtils.degToRad(48), PHI_MIN, PHI_MAX);
  target.active = true;
}
function setFilter(f: string) {
  state.filter = f; buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
  for (const m of marks) m.visTarget = !f || m.st.type === f ? 1 : 0;
  setTimeout(() => focusBiggestCluster(STATIONS.filter(s => !f || s.type === f)), reduced ? 0 : 350);
}
buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.f ?? '')));

// ---------- loop ----------
updateOrient();
let last = 0; const clock = new THREE.Clock();
const shortAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
// ?manual=1 → deterministic frame stepping for capture (window.__tick(dt)); otherwise real time
const manual = new URLSearchParams(location.search).has('manual'); let simTime = 0;
function frame(now: number, fixedDt?: number) {
  const dt = fixedDt ?? (last ? Math.min(0.05, (now - last) / 1000) : 1 / 60); if (last && fixedDt === undefined) state.frames.push(now - last); last = now;
  simTime += dt;
  shared.uTime.value = reduced ? 0 : (manual ? simTime : clock.getElapsedTime());
  // inertia (frame-rate independent version of REF-004's 0.9 / 0.81 per frame)
  if (!dragging && !target.active && (Math.abs(vel.theta) + Math.abs(vel.phi) > 1e-4)) {
    rot.theta += vel.theta * dt * 60; rot.phi = THREE.MathUtils.clamp(rot.phi + vel.phi * dt * 60, PHI_MIN, PHI_MAX);
    vel.theta *= Math.pow(0.9, dt * 60); vel.phi *= Math.pow(0.81, dt * 60);
  }
  if (target.active) {       // RCP-08: k = 1 − 0.95^(60·dt) ≈ REF-004's min(60·dt·0.05, 1)
    const k = reduced ? 1 : 1 - Math.pow(0.95, dt * 60);
    const dth = shortAngle(target.theta - rot.theta); rot.theta += dth * k; rot.phi += (target.phi - rot.phi) * k;
    if (Math.abs(dth) < 0.002 && Math.abs(target.phi - rot.phi) < 0.002) target.active = false;
  }
  updateOrient(); globe.quaternion.copy(orient).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
  markRot.quaternion.copy(orient); occluder.quaternion.copy(orient);
  state.theta = rot.theta; state.phi = rot.phi;

  // hover every 3rd frame unless the pointer moved
  frameN++;
  if (pointerMoved || frameN % 3 === 0) { pointerMoved = false; const id = pickHover(); if (id !== state.hovered) { state.hovered = id; for (const [k, el] of pops) el.classList.toggle('on', k === id); } }

  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const m of marks) {
    m.vis += (m.visTarget - m.vis) * (1 - Math.pow(0.85, dt * 60)); if (Math.abs(m.vis - m.visTarget) < 0.001) m.vis = m.visTarget;
    const hiT = m.st.id === state.hovered ? 1 : 0; m.hi += (hiT - m.hi) * Math.min(1, 1.5 * dt * 4);
    for (const r of m.ringMats) { r.uniforms.uOpacity.value = m.vis; r.uniforms.uHi.value = m.hi; }
    m.boatMat.uniforms.uOpacity.value = m.vis * (1 - m.hi * 0.9); for (const t of m.trailBoats) t.uniforms.uOpacity.value = m.vis * 0.9;
    m.group.visible = m.vis > 0.001;
    if (m.trail) { (m.trail.material as LineMaterial).opacity = m.vis; }
    // card position = projected vessel position
    const el = pops.get(m.st.id)!;
    if (m.st.id === state.hovered || el.classList.contains('on')) {
      tmpV.copy(m.pos).applyQuaternion(orient); tmpV.y += GLOBE_Y; tmpV.project(camera);
      const x = (tmpV.x + 1) / 2 * w, y = (1 - tmpV.y) / 2 * h; const oy = (y / h) * 2 - 1;
      el.style.transform = `translate(${x}px, ${y}px)`; el.style.setProperty('--oy', (Math.abs(oy) < .3 ? 0 : Math.sign(oy) * ((Math.abs(oy) - .3) / .7) ** 2).toFixed(3));
    }
  }
  for (const lm of lineMats) lm.opacity = 1;   // opacity lives in R via the line colour below
  marks.forEach(m => { if (m.trail) (m.trail.material as LineMaterial).color.setRGB(m.vis, 0, 0); });

  // lights follow the camera
  renderer.setRenderTarget(glowRT); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(glowScene, camera);
  renderer.setRenderTarget(globeRT); renderer.clear(); renderer.render(globeScene, camera);
  renderer.setRenderTarget(markRT); renderer.clear(); renderer.render(markScene, camera);
  renderer.setRenderTarget(null); renderer.clear(); renderer.render(compScene, compCam);
  state.ready = true;
}
if (manual) { (window as any).__tick = (dt: number, n = 1) => { for (let i = 0; i < n; i++) frame(performance.now(), dt); }; frame(0, 1 / 60); }
else renderer.setAnimationLoop(now => frame(now));
(window as any).__setFilter = (f: string) => { state.filter = f; buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f))); for (const m of marks) m.visTarget = !f || m.st.type === f ? 1 : 0; focusBiggestCluster(STATIONS.filter(s => !f || s.type === f)); };
(window as any).__hoverAt = (x: number, y: number) => { pointer.set(x / canvas.clientWidth * 2 - 1, -(y / canvas.clientHeight) * 2 + 1); pointerMoved = true; };
(window as any).__screenOf = (id: string) => { const m = marks.find(m => m.st.id === id)!; const v = m.pos.clone().applyQuaternion(orient); v.y += GLOBE_Y;
  const facing = v.clone().sub(new THREE.Vector3(0, GLOBE_Y, 0)).z > 0; v.project(camera); return {x: (v.x + 1) / 2 * canvas.clientWidth, y: (1 - v.y) / 2 * canvas.clientHeight, facing}; };
