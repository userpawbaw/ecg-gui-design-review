// Practice build (D-047). The ORIGINAL REF-002 home scene loaded as-is (local-only public/_original), extended step by step:
//   time of day (tod) · warm lamps + Ha room pulse · hero book on the original bookcase · book portal → page world (Hb).
// Structure ported from the original (EFX-002-01/02/03): bake-textured meshes matched by node name, glb camera,
// 3-level camera hierarchy (model → pointer → scroll), exp-smoothed pointer look (±0.75° / ±0.2°), scroll descent.
// URL: ?p=0..3 scroll phase (0–1 gallery · 1–1.5 descent to the bookcase · 1.5–2 book pulled out · 2–2.5 cover opens ·
//      2.5–3 page world) · ?story=1 (night until the book opens, dawn arrives as the noise clears) · ?tod=0..1
//      (day · dusk .25 · night .5 · dawn .75) · ?cycle=sec · ?clock=sec (freeze the beat clock) · ?ha=0..1.5 · ?lamps=0 · ?hud=0
import * as THREE from 'three';
import {makeLoaders,O} from './loaders';
import {sample,apply,graded,type Tod} from './tod';
import {makeLamps,setHA} from './lamps';
import {loadEcg,pulse,type Ecg} from './ecg';
import {makeHeroBook,BOOK} from './herobook';
import {makePageWorld,type PageWorld} from './pageworld';

const q=new URLSearchParams(location.search);
const canvas=document.getElementById('c') as HTMLCanvasElement,pwCanvas=document.getElementById('pw') as HTMLCanvasElement,hud=document.getElementById('hud')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
const {gltf,tex}=makeLoaders(renderer);
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const lerp=THREE.MathUtils.lerp;

// original home-scene texture set (Mc.home); mesh node names contain the texture name (e.g. "TexWalls.001")
const HOME=['TexFleur','TexProps','TexMobilier','TexDecor','TexTableaux','TexBibli','TexFloor','TexWalls'];
const textures:Record<string,THREE.Texture>={};

// time of day
const story=q.has('story');
const todFixed=q.has('tod')?Number(q.get('tod')):q.has('t')?Number(q.get('t'))*.5:story?.5:0;
const todNow:Tod=sample(todFixed);

// background: ellipsoid gradient (original: BgGradient sphere at (-10,3,0), scale 16×4×16), colours follow tod
const sky={top:{value:todNow.top},bot:{value:todNow.bot}};
{
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:sky,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float t=smoothstep(-1.,1.,vP.y);gl_FragColor=vec4(mix(bot,top,t),1.);\n#include <colorspace_fragment>\n}'});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,16),m);mesh.position.set(-10,3,0);mesh.scale.set(16,4,16);scene.add(mesh);
}
setHA(q.has('ha')?Number(q.get('ha')):1);
let ecg:Ecg|null=null,pw:PageWorld|null=null;
const lamps=makeLamps();if(q.get('lamps')!=='0')scene.add(lamps.group);

// hero book on the original bookcase: middle row, between the neighbouring books (measured by raycast: boards y −1.43/−1.87, back wall x 6.24)
const book=makeHeroBook();scene.add(book.group);
const SHELF={x:6.62,y:-1.87+BOOK.H/2+.004,z:-.05},PRESENT={x:7.62,y:-1.6,z:.2};

// camera hierarchy: modelCamera (glb camera transform) → pointer → scroll → camera
const modelCamera=new THREE.Group(),pointer=new THREE.Group(),scroll=new THREE.Group();
const camera=new THREE.PerspectiveCamera(22.9,innerWidth/innerHeight,.1,1000);
scene.add(modelCamera);modelCamera.add(pointer);pointer.add(scroll);scroll.add(camera);
const GLB_CAM=new THREE.Vector3();   // filled from the glb camera node (14.76, 2.31, 0)

const pMax=3,state={p:q.has('p')?Number(q.get('p')):0,pt:q.has('p')?Number(q.get('p')):0,mx:0,my:0};
addEventListener('pointermove',e=>{state.mx=e.clientX/innerWidth*2-1;state.my=e.clientY/innerHeight*2-1;});
addEventListener('wheel',e=>{if(q.has('p'))return;state.pt=Math.max(0,Math.min(pMax,state.pt+e.deltaY*.0006));},{passive:true});
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();pw?.resize();}
addEventListener('resize',resize);resize();

// baked beauty textures + grade (night curve, warm tint, exposure) injected before the opaque output
const bakedMaterial=(map:THREE.Texture)=>graded(new THREE.MeshBasicMaterial({map,toneMapped:false}));

async function init(){
 hud.textContent='loading original assets…';
 const [g]=await Promise.all([gltf.loadAsync(O+'models/home/scene_v9.glb'),
  ...HOME.map(async n=>{textures[n]=await tex(O+`textures/home/scene-ktx/4096/${n}.ktx2`);})]);
 const root=g.scene;let camNode:THREE.Object3D|null=null;
 root.traverse(o=>{if((o as THREE.Camera).isCamera&&!camNode)camNode=o;
  const m=o as THREE.Mesh;if(!m.isMesh)return;
  const hit=HOME.find(n=>m.name.includes(n));
  if(hit)m.material=bakedMaterial(textures[hit]);else console.warn('no texture for mesh',m.name);});
 scene.add(root);root.updateMatrixWorld(true);
 const c=camNode as unknown as THREE.PerspectiveCamera|null;
 if(c){const wp=new THREE.Vector3(),wq=new THREE.Quaternion();c.getWorldPosition(wp);c.getWorldQuaternion(wq);
  modelCamera.position.copy(wp);modelCamera.quaternion.copy(wq);GLB_CAM.copy(wp);
  camera.fov=c.fov||22.9; // three stores fov in degrees already (glb yfov 0.3996 rad = 22.9°)
  if(c.parent)c.parent.remove(c);}
 camera.updateProjectionMatrix();hud.textContent='';ecg=await loadEcg();
 book.attach(ecg);pw=await makePageWorld(pwCanvas,ecg);
 (window as any).__fork={beatTimes:()=>ecg?ecg.beats.map(b=>(b-ecg!.start)/ecg!.fs):[],THREE,scene,camera,modelCamera,pointer,scroll,root,lamps,book,state,sample,apply,get ecg(){return ecg;}};
 tick();
}

// ---- scroll choreography -------------------------------------------------------------------------------------------
// p 0–1 header (original EFX-002-02), 1–1.5 descent (original EFX-002-03 direction), then our extension.
const BASE_FOV=22.9;
function placeCamera(p:number){
 // world target of the camera; modelCamera looks along −x with +y up, so world x = GLB.x + local z, world y = GLB.y + local y, world z = −local x
 let x:number,y:number,z=0,fov=BASE_FOV;
 if(p<=1){x=GLB_CAM.x-4*p;y=GLB_CAM.y-2.4*p;}
 else if(p<=1.5){x=GLB_CAM.x-4;y=lerp(GLB_CAM.y-2.4,-1.64,(p-1)/.5);}
 else{
  const a=smooth((p-1.5)/.5),b=smooth((p-2)/.5);
  x=lerp(GLB_CAM.x-4,9.1,a);y=lerp(-1.64,-1.58,a);z=lerp(0,.05,a);fov=lerp(BASE_FOV,24,a);
  x=lerp(x,9.25,b);y=lerp(y,-1.56,b);z=lerp(z,.2,b);fov=lerp(fov,28,b);
 }
 scroll.position.set(-z,y-GLB_CAM.y,x-GLB_CAM.x);
 if(Math.abs(camera.fov-fov)>1e-3){camera.fov=fov;camera.updateProjectionMatrix();}
}
function placeBook(p:number,beat:number,time:number,lampLevel:number){
 const pull=smooth((p-1.62)/.34),open=smooth((p-2.0)/.4);
 const move=smooth(pull/.5),turn=smooth((pull-.35)/.65);
 book.group.position.set(lerp(SHELF.x,PRESENT.x,move),lerp(SHELF.y,PRESENT.y,smooth((pull-.3)/.7)),lerp(SHELF.z,PRESENT.z,turn));
 book.group.rotation.y=lerp(Math.PI,Math.PI/2,turn);
 const s=lerp(1,1.3,smooth(pull));book.group.scale.setScalar(s);
 book.set(open,beat,time);if(open>.02)book.trace(time,smooth((p-2.7)/.3),Math.min(1,beat*.9));
 book.glow(Math.min(1,.2*beat*lampLevel*(1-pull)));
}

// ?perf=1: frame-time probe (CPU ms per phase, EMA) in window.__perf · flags to isolate costs: ?noecg ?noshadow ?nodust ?nopw
const perf={frame:16,main:0,book:0,pw:0,fps:60,n:0};(window as any).__perf=perf;
const ema=(k:'frame'|'main'|'book'|'pw',v:number)=>{perf[k]+=(v-perf[k])*.08;};
let last=performance.now(),syncGpu=false;
const px4=new Uint8Array(4);
// readPixels of one pixel forces the GPU to complete the frame (finish() alone may return early under ANGLE)
const sync=(gl:WebGLRenderingContext|WebGL2RenderingContext)=>gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px4);
const finish=(which:'main'|'pw')=>{if(!syncGpu)return;if(which==='main')sync(renderer.getContext());else pw?.finish();};
function frame(now:number,dt:number){
 ema('frame',dt*1000);perf.fps=1000/perf.frame;perf.n++;
 state.p+=(state.pt-state.p)*(1-Math.exp(-6*dt));const p=state.p;
 placeCamera(p);
 // time of day: ?cycle loops it; story mode keeps the night until the book opens, then brings the dawn in with the cleaner trace
 let tod=q.has('cycle')?(now/1000/Number(q.get('cycle')||24))%1:todFixed;
 if(story&&!q.has('cycle'))tod=p<2.1?todFixed:lerp(todFixed,1,smooth((p-2.1)/.9));
 sample(tod,todNow);apply(todNow);sky.top.value.copy(todNow.top);sky.bot.value.copy(todNow.bot);
 const clk=q.has('clock')?Number(q.get('clock')):now/1000,beat=ecg?pulse(ecg,clk):0;
 lamps.set(todNow.lamp,clk,beat);placeBook(p,beat,clk,Math.max(todNow.lamp,.35));
 // EFX-002-01 pointer look: target rot X = deg(y·0.2), rot Y = deg(−x·0.75); k = 1−exp(−2dt)
 const k=1-Math.exp(-2*dt),tx=THREE.MathUtils.degToRad(state.my*.2),ty=THREE.MathUtils.degToRad(-state.mx*.75);
 pointer.rotation.x+=(tx-pointer.rotation.x)*k;pointer.rotation.y+=(ty-pointer.rotation.y)*k;
 // overlay: page world cross-fades in over the open book
 const ov=smooth((p-2.5)/.22);pwCanvas.style.opacity=String(ov);
 const m0=performance.now();if(ov<.999&&!q.has('nomain')){renderer.render(scene,camera);finish('main');}ema('main',performance.now()-m0);
 const w0=performance.now();if(pw&&ov>.002&&!q.has('nopw')){pw.render({t:clk,prog:smooth((p-2.52)/.42),mix:smooth((p-2.7)/.3),sun:smooth((p-2.78)/.22),px:state.mx,py:state.my});finish('pw');}ema('pw',performance.now()-w0);
 if(q.get('hud')!=='0'||q.has('perf'))hud.textContent=(q.has('perf')?`fps ${perf.fps.toFixed(0)} frame ${perf.frame.toFixed(1)}ms  main ${perf.main.toFixed(1)} book ${perf.book.toFixed(1)} pw ${perf.pw.toFixed(1)}
`:'')+`p ${p.toFixed(2)}  tod ${tod.toFixed(2)} (night ${todNow.night.toFixed(2)} lamp ${todNow.lamp.toFixed(2)})  beat ${beat.toFixed(2)}`;
}
function tick(){const now=performance.now(),dt=Math.min((now-last)/1000,.1);last=now;frame(now,dt);requestAnimationFrame(tick);}
// benchmark without rAF (the background tab throttles it): runs n frames synchronously at scroll phase p with GPU sync; returns ms per phase
(window as any).__bench=(p:number,n=60)=>{
 // frames are issued back-to-back inside ONE task and synced once at the end → average real cost, no per-frame vsync quantisation
 syncGpu=false;state.p=state.pt=p;
 for(let w=0;w<6;w++)frame(1000+w*16.7,.0167);sync(renderer.getContext());pw?.finish();            // warm-up (shader compile, uploads)
 const t0=performance.now();
 for(let i=0;i<n;i++)frame(2000+i*16.7,.0167);
 const cpu=(performance.now()-t0)/n;sync(renderer.getContext());pw?.finish();
 const tot=(performance.now()-t0)/n;
 return{p,cfg:location.search,cpuMsPerFrame:+cpu.toFixed(2),msPerFrame:+tot.toFixed(2),fps:+(1000/tot).toFixed(1)};
};
init().catch(e=>{hud.textContent='load failed: '+(e as Error).message;console.error(e);});
