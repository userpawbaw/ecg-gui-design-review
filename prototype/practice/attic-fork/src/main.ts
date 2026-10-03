// Practice build (D-047). Stage 1 = the ORIGINAL REF-002 home scene loaded as-is (local-only public/_original).
// Structure ported from the original (EFX-002-01/02/03): bake-textured meshes matched by node name, glb camera,
// 3-level camera hierarchy (model → pointer → scroll), exp-smoothed pointer look (±0.75° / ±0.2°), scroll descent.
// URL: ?p=0..2 (fixed scroll phase) · ?orbit (free orbit) · ?hud=0
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';

const O='./_original/assets/';
const q=new URLSearchParams(location.search);
const canvas=document.getElementById('c') as HTMLCanvasElement,hud=document.getElementById('hud')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
// time of day (D-047 stage 2 test): 0 = baked day, 1 = night. Baked 'beauty' textures cannot be relit, so night = grade curve + sky + (later) lamp pools.
const uNight={value:q.has('t')?Number(q.get('t')):0};

const draco=new DRACOLoader().setDecoderPath(O+'models/draco/');
const gltf=new GLTFLoader().setDRACOLoader(draco);
const ktx=new KTX2Loader().setTranscoderPath(O+'basis/').detectSupport(renderer);

// original home-scene texture set (Mc.home); mesh node names contain the texture name (e.g. "TexWalls.001")
const HOME=['TexFleur','TexProps','TexMobilier','TexDecor','TexTableaux','TexBibli','TexFloor','TexWalls'];
const textures:Record<string,THREE.Texture>={};

// background: ellipsoid gradient (original: BgGradient sphere at (-10,3,0), scale 16×4×16, top #B1C1CB bottom #C2BFAE)
function makeBg(){
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0xb1c1cb)},bot:{value:new THREE.Color(0xc2bfae)},nTop:{value:new THREE.Color(0x070d26)},nBot:{value:new THREE.Color(0x1d2748)},uNight},
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;uniform vec3 nTop;uniform vec3 nBot;uniform float uNight;varying vec3 vP;void main(){float t=smoothstep(-1.,1.,vP.y);vec3 d=mix(bot,top,t);vec3 n=mix(nBot,nTop,t);gl_FragColor=vec4(mix(d,n,uNight),1.);\n#include <colorspace_fragment>\n}'});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,16),m);mesh.position.set(-10,3,0);mesh.scale.set(16,4,16);scene.add(mesh);return mesh;
}
makeBg();

// camera hierarchy: modelCamera (glb camera transform) → pointer → scroll → camera
const modelCamera=new THREE.Group(),pointer=new THREE.Group(),scroll=new THREE.Group();
const camera=new THREE.PerspectiveCamera(22.9,innerWidth/innerHeight,.1,1000);
scene.add(modelCamera);modelCamera.add(pointer);pointer.add(scroll);scroll.add(camera);

const state={p:q.has('p')?Number(q.get('p')):0,pt:q.has('p')?Number(q.get('p')):0,mx:0,my:0};
addEventListener('pointermove',e=>{state.mx=e.clientX/innerWidth*2-1;state.my=e.clientY/innerHeight*2-1;});
addEventListener('wheel',e=>{if(q.has('p'))return;state.pt=Math.max(0,Math.min(2,state.pt+e.deltaY*.0006));},{passive:true});

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

async function init(){
 hud.textContent='loading original assets…';
 const [g]=await Promise.all([gltf.loadAsync(O+'models/home/scene_v9.glb'),
  ...HOME.map(async n=>{const t=await ktx.loadAsync(O+`textures/home/scene-ktx/4096/${n}.ktx2`);t.colorSpace=THREE.SRGBColorSpace;textures[n]=t;})]);
 const root=g.scene;let camNode:THREE.Object3D|null=null;
 root.traverse(o=>{if((o as THREE.Camera).isCamera&&!camNode)camNode=o;
  const m=o as THREE.Mesh;if(!m.isMesh)return;
  const hit=HOME.find(n=>m.name.includes(n));
  if(hit){const mat=new THREE.MeshBasicMaterial({map:textures[hit],toneMapped:false});
   mat.onBeforeCompile=sh=>{sh.uniforms.uNight=uNight;
    sh.fragmentShader='uniform float uNight;\n'+sh.fragmentShader.replace('#include <opaque_fragment>',
     // night grade: crush mids, keep highlights (baked sun patches) as cool moonlight, blue shift, tiny floor lift
     'vec3 nc=pow(max(outgoingLight,vec3(0.)),vec3(1.85))*vec3(.26,.34,.62)+vec3(.006,.010,.028);outgoingLight=mix(outgoingLight,nc,uNight);\n#include <opaque_fragment>');};
   m.material=mat;}
  else console.warn('no texture for mesh',m.name);});
 scene.add(root);root.updateMatrixWorld(true);
 const c=camNode as unknown as THREE.PerspectiveCamera|null;
 if(c){const wp=new THREE.Vector3(),wq=new THREE.Quaternion();c.getWorldPosition(wp);c.getWorldQuaternion(wq);
  modelCamera.position.copy(wp);modelCamera.quaternion.copy(wq);camera.fov=c.fov||22.9; // three stores fov in degrees already (glb yfov 0.3996 rad = 22.9°)
  if(c.parent)c.parent.remove(c);}
 camera.updateProjectionMatrix();
 hud.textContent='';
 (window as any).__fork={THREE,scene,camera,modelCamera,pointer,scroll,root};
 console.log('loaded',{meshes:HOME.length,cam:wpStr(modelCamera.position)});
 tick();
}
const wpStr=(v:THREE.Vector3)=>v.toArray().map(x=>x.toFixed(2)).join(',');

// scroll phases (original EFX-002-02/03): header p∈[0,1] → local (0,−2.4p,−4p); section p∈[1,2] → y down to −5.5.
// The original sets the two phases from separate DOM sections (offset y −2.75 → −5.5); here they are chained
// continuously so the whole descent can be scrubbed: z is held at the header end value, y continues downward.
function applyScroll(p:number){
 if(p<=1)scroll.position.set(0,-2.4*p,-4*p);
 else scroll.position.set(0,THREE.MathUtils.lerp(-2.4,-5.5,p-1),-4);
}
let last=performance.now();
function tick(){
 const now=performance.now(),dt=Math.min((now-last)/1000,.1);last=now;
 state.p+=(state.pt-state.p)*(1-Math.exp(-6*dt));applyScroll(state.p);
 if(q.has('cycle'))uNight.value=.5-.5*Math.cos(now/1000/Number(q.get('cycle')||20)*Math.PI*2);
 // EFX-002-01 pointer look: target rot X = deg(y·0.2), rot Y = deg(−x·0.75); k = 1−exp(−2dt)
 const k=1-Math.exp(-2*dt),tx=THREE.MathUtils.degToRad(state.my*.2),ty=THREE.MathUtils.degToRad(-state.mx*.75);
 pointer.rotation.x+=(tx-pointer.rotation.x)*k;pointer.rotation.y+=(ty-pointer.rotation.y)*k;
 renderer.render(scene,camera);
 if(q.get('hud')!=='0')hud.textContent=`p ${state.p.toFixed(2)}  night ${uNight.value.toFixed(2)}  (wheel ↕ · ?p= ?t= ?cycle=s)`;
 requestAnimationFrame(tick);
}
init().catch(e=>{hud.textContent='load failed: '+(e as Error).message;console.error(e);});
