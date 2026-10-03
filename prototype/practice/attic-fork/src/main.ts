// Practice build (D-047). The ORIGINAL REF-002 home scene loaded as-is (local-only public/_original), extended step by step:
//   time of day (tod) · warm lamps + Ha room pulse · hero book (hand-built hardcover, book2.ts) on the original bookcase · the same scene
//   becomes the stage: slit key light (rig.ts), page turn, ECG plate (trace.ts), anatomical heart (heartmesh.ts), pulse FX (pulsefx.ts).
//   The separate page world is legacy (?pw=1) pending D-048 approval.
// Structure ported from the original (EFX-002-01/02/03): bake-textured meshes matched by node name, glb camera,
// 3-level camera hierarchy (model → pointer → scroll), exp-smoothed pointer look (±0.75° / ±0.2°), scroll descent.
// URL: ?p=0..3 scroll phase (0–1 gallery · 1–1.5 descent to the bookcase · 1.5–2 book pulled out · 2–2.5 cover opens ·
//      2.4–2.8 page turn · 2.5–3 camera looks down, book lies back: ECG plate + heart pop-up) · ?story=1 (night until the book opens, dawn arrives as the noise clears) · ?tod=0..1
//      (day · dusk .25 · night .5 · dawn .75) · ?cycle=sec · ?clock=sec (freeze the beat clock) · ?ha=0..1.5 · ?lamps=0 · ?hud=0
import * as THREE from 'three';
import {makeLoaders,O} from './loaders';
import {sample,apply,graded,type Tod} from './tod';
import {makeLamps,setHA,HA} from './lamps';
import {loadEcg,pulse,type Ecg} from './ecg';
import {makeHeroBook,BOOK,SPREAD,type HeroBook} from './book2';
import {makePulseFx,type PulseFx} from './pulsefx';
import {makeRig,type RigState} from './rig';
import {createBeatMix,prevR} from './beatmix';
import {makePageWorld,type PageWorld} from './pageworld';
import {buildHeartGeometry,heartMaterial} from './heartmesh';

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
let ecg:Ecg|null=null,pw:PageWorld|null=null;let fx:PulseFx|null=null,heartAO:THREE.Mesh|null=null;let heartMesh:THREE.Mesh|null=null,heartZ=.5;const heartRoot=new THREE.Group(),HEART_H=.2;
const lamps=makeLamps();if(q.get('lamps')!=='0')scene.add(lamps.group);

// hero book on the original bookcase: middle row, between the neighbouring books (measured by raycast: boards y −1.43/−1.87, back wall x 6.24)
let book!:HeroBook;const bookPivot=new THREE.Group();scene.add(bookPivot);const rigPost=!q.has('nopost'),beatMix=createBeatMix(4);let rig!:ReturnType<typeof makeRig>;
const SHELF={x:6.62,y:-1.87+BOOK.H/2+.004,z:-.05},PRESENT={x:7.62,y:-1.6,z:.2};

// camera hierarchy: modelCamera (glb camera transform) → pointer → scroll → camera
const modelCamera=new THREE.Group(),pointer=new THREE.Group(),scroll=new THREE.Group();
const camera=new THREE.PerspectiveCamera(22.9,innerWidth/innerHeight,.1,1000);
scene.add(modelCamera);modelCamera.add(pointer);pointer.add(scroll);scroll.add(camera);
const GLB_CAM=new THREE.Vector3();   // filled from the glb camera node (14.76, 2.31, 0)

const pMax=3,state={p:q.has('p')?Number(q.get('p')):0,pt:q.has('p')?Number(q.get('p')):0,mx:0,my:0};
addEventListener('pointermove',e=>{state.mx=e.clientX/innerWidth*2-1;state.my=e.clientY/innerHeight*2-1;});
addEventListener('wheel',e=>{if(q.has('p'))return;state.pt=Math.max(0,Math.min(pMax,state.pt+e.deltaY*.0006));},{passive:true});
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();pw?.resize();rig?.resize(innerWidth,innerHeight,renderer.getPixelRatio());}
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
 book=await makeHeroBook();bookPivot.add(book.group);book.attach(ecg);if(q.has('pw'))pw=await makePageWorld(pwCanvas,ecg);
 heartMesh=new THREE.Mesh(await buildHeartGeometry(),heartMaterial());heartMesh.castShadow=true;heartMesh.receiveShadow=true;{heartMesh.geometry.computeBoundingBox();const z=new THREE.Vector3();heartMesh.geometry.boundingBox!.getSize(z);heartZ=z.z;}heartRoot.add(heartMesh);{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!;const q=g.createRadialGradient(64,64,10,64,64,64);q.addColorStop(0,'rgba(20,6,6,.8)');q.addColorStop(1,'rgba(20,6,6,0)');g.fillStyle=q;g.fillRect(0,0,128,128);
  heartAO=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,toneMapped:false,opacity:0}));heartAO.renderOrder=6;heartRoot.add(heartAO);}heartRoot.visible=false;book.anchorL.add(heartRoot);
 fx=makePulseFx({w:2*SPREAD.PWD+.012,h:SPREAD.PHT},new THREE.Vector2(-SPREAD.DP/2,-.02));fx.ring.position.set(SPREAD.DP/2,0,.0016);book.anchorL.add(fx.ring);heartRoot.add(fx.motes);
 rig=makeRig(renderer,scene,camera,{post:rigPost,shadow:!q.has('noshadow')});resize();
 (window as any).__fork={rigOf:()=>rig,bookPivot,beatTimes:()=>ecg?ecg.beats.map(b=>(b-ecg!.start)/ecg!.fs):[],THREE,scene,camera,modelCamera,pointer,scroll,root,lamps,book,state,sample,apply,get ecg(){return ecg;}};
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
 // stage c (2.5–3): the camera rises and looks down while the book lies back — one continuous move in the same scene
 const c=smooth((p-2.5)/.5);x=lerp(x,9.0,c);y=lerp(y,-1.04,c);z=lerp(z,.2,c);fov=lerp(fov,30,c);
 scroll.position.set(-z,y-GLB_CAM.y,x-GLB_CAM.x);scroll.rotation.x=-lerp(0,.39,c);
 if(Math.abs(camera.fov-fov)>1e-3){camera.fov=fov;camera.updateProjectionMatrix();}
}
const SHELF_Y=-1.87;
const bookInfo={pull:0,show:0,under:null as THREE.Object3D|null};
function placeBook(p:number,beat:number,time:number,lampLevel:number){
 const pull=smooth((p-1.62)/.34),open=smooth((p-2.0)/.4),turn=smooth((p-2.42)/.36);
 const move=smooth(pull/.5),rot=smooth((pull-.35)/.65);
 bookPivot.position.set(lerp(SHELF.x,PRESENT.x,move),lerp(SHELF.y,PRESENT.y,smooth((pull-.3)/.7)),lerp(SHELF.z,PRESENT.z,rot));
 book.group.rotation.y=lerp(Math.PI,Math.PI/2,rot);
 bookPivot.scale.setScalar(lerp(1,1.3,smooth(pull))*lerp(1,1.12,smooth((p-2.5)/.5)));bookPivot.rotation.z=lerp(0,.72,smooth((p-2.5)/.5));
 book.set({open,turn,beat,time});
 if(ecg){beatMix.update(smooth((p-2.78)/.2),prevR(ecg,time),time);
  book.trace({t:time,mix:beatMix.value,glow:Math.min(1,beat*.9),flash:beatMix.flash,alpha:smooth((p-2.46)/.12)});}
 book.glow(Math.min(1,.2*beat*lampLevel*(1-pull)));
 if(heartMesh){const u=Math.max(0,Math.min(1,(p-2.84)/.16)),up=u<=0?0:1+2.70158*Math.pow(u-1,3)+1.70158*Math.pow(u-1,2);   // easeOutBack: grows out of the page with a small overshoot
  const sw=1+.07*HA*beat,sc=HEART_H*Math.max(up,1e-3);heartRoot.visible=u>0;heartMesh.scale.set(sc*sw,sc*(1-.03*HA*beat),sc*sw*(1+.04*HA*beat));heartRoot.position.set(0,-.02,heartZ*sc*.5+.002);if(heartAO){heartAO.position.set(.012,-.012,-heartZ*sc*.5-.0015);heartAO.scale.set(sc*1.05,sc*.85,1);(heartAO.material as THREE.MeshBasicMaterial).opacity=.75*Math.min(1,up);}
  if(fx&&ecg)fx.update({age:time-prevR(ecg,time),time,mix:beatMix.value,show:smooth((u-.35)/.5),beat});}
 bookInfo.pull=pull;bookInfo.show=smooth((pull-.35)/.5);
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
 sample(tod,todNow);todNow.exposure*=1-.55*smooth((p-2.5)/.4);apply(todNow);sky.top.value.copy(todNow.top);sky.bot.value.copy(todNow.bot);
 const clk=q.has('clock')?Number(q.get('clock')):now/1000,beat=ecg?pulse(ecg,clk):0;
 placeBook(p,beat,clk,Math.max(todNow.lamp,.35));lamps.set(todNow.lamp*(1-.93*bookInfo.pull),clk,beat);   // the room falls dark as the book is pulled into the slit of light (chiaroscuro)
 // EFX-002-01 pointer look: target rot X = deg(y·0.2), rot Y = deg(−x·0.75); k = 1−exp(−2dt)
 const k=1-Math.exp(-2*dt),tx=THREE.MathUtils.degToRad(state.my*.2),ty=THREE.MathUtils.degToRad(-state.mx*.75);
 pointer.rotation.x+=(tx-pointer.rotation.x)*k;pointer.rotation.y+=(ty-pointer.rotation.y)*k;
 // overlay: page world cross-fades in over the open book
 const ov=pw?smooth((p-2.5)/.22):0;pwCanvas.style.opacity=String(ov);
 const m0=performance.now();if(ov<.999&&!q.has('nomain')){rig.render({night:todNow.night,warm:todNow.warm,lamp:todNow.lamp,beat,mix:beatMix.value,pull:bookInfo.pull,show:bookInfo.show,time:clk,book:bookPivot,under:book.under,shelfY:SHELF_Y});finish('main');}ema('main',performance.now()-m0);
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
