// Lab backdrop (D-074, user 2026-10-18 "서고를 뒷 배경으로 … 스크롤에 따라 leoparpeix처럼 위에서 내려오는 광경 … 화면을 좌우로
// 움직이면 시점이 바뀌는 것도"): the baked archive behind the Lab page. Scroll through the hero descends from above the stacks
// through the light shafts to the aisle and settles on calm shelves behind the waveform panel; the pointer turns the view a little.
// Laptop budget: draws only when the camera changes (scroll, pointer, resize), at 0.6 × the screen resolution and at most
// 1.2 M pixels, not at all while a waveform plays (the last frame stays, the pointer turn waits; the waveform comes first — a
// software-rendered full-page capture took ~1.2 s longer per shot with the backdrop redrawing) or the large viewer covers the page; a resize
// redraws once after it settles (a full-page screenshot or a window drag resizes many times); the sun depth map is rendered
// once; one post pass (the archive shafts), no bloom; at most 30 frames a second.
// Software rendering (SwiftShader / llvmpipe — a machine without GPU acceleration, and the QA browser) is a low-power mode: no
// pointer turn, 0.35 × resolution, one draw after scrolling stops. Measured 2026-10-18: with the full backdrop the Lab browser
// test went from 11.6 s to over 45 s there, the pointer easing alone costing tens of ~1 s frames.
// Viewpoints: verification/lab-backdrop-survey-20261018 (three frame).
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createArchive} from './story/intro/archive';

type Key={pos:THREE.Vector3,look:THREE.Vector3,fov:number};
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const KEYS:Key[]=[
 {pos:V(-1.5,4.7,-1.0),look:V(1.2,.4,-3.5),fov:55},     // ① above the stacks, looking down on the sun patches and the lamp
 {pos:V(-.3,3.3,1.4),look:V(.4,1.2,-3.6),fov:44},       // ③ shaft height
 {pos:V(0,1.9,3.2),look:V(.5,1.6,-4.2),fov:36},         // ④ the aisle at eye level, shafts across the stacks (s3_aisle)
 {pos:V(-.35,1.8,-1.0),look:V(1.05,1.2,-4.0),fov:46},   // calm shelves behind the panel (i1_wide)
];
const RES_Q=new URLSearchParams(location.search).get('bgres');

export async function createLabBackdrop(canvas:HTMLCanvasElement){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x05090b,1);
 const gl=renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
 const soft=/swiftshader|llvmpipe|software|basic render/i.test(gpu),RES=RES_Q!==null?Number(RES_Q):soft?.35:.6;
 const scene=new THREE.Scene(),arch=await createArchive();scene.add(arch.room,arch.dust);arch.setFade(1);arch.renderSunDepth(renderer);
 const camera=new THREE.PerspectiveCamera(50,1,.05,60);
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)}));
 composer.addPass(new RenderPass(scene,camera));composer.addPass(arch.vol);composer.addPass(new OutputPass());
 const ease=(k:number)=>k<.5?4*k*k*k:1-(-2*k+2)**3/2;
 const curve=(pick:(k:Key)=>THREE.Vector3)=>new THREE.CatmullRomCurve3(KEYS.map(pick),false,'centripetal');
 const posC=curve(k=>k.pos),lookC=curve(k=>k.look);
 let p=0,px=0,pxShown=0,dirty=true,raf=0,last=0,frame=0,playing=false,paused=false,settle:ReturnType<typeof setTimeout>|undefined;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||soft;
 function resize(){const w=innerWidth,h=innerHeight,pr=Math.min(Math.min(2,devicePixelRatio||1)*RES,Math.sqrt(1.2e6/(w*h)));renderer.setPixelRatio(pr);renderer.setSize(w,h,false);composer.setPixelRatio(pr);composer.setSize(w,h);
  camera.aspect=w/h;camera.updateProjectionMatrix();arch.setPx(h,pr);dirty=true;kick();}
 function place(){
  const u=ease(Math.min(1,Math.max(0,p))),seg=u*(KEYS.length-1),i=Math.min(KEYS.length-2,Math.floor(seg)),f=seg-i;
  const pos=posC.getPoint(u),look=lookC.getPoint(u);camera.fov=THREE.MathUtils.lerp(KEYS[i].fov,KEYS[i+1].fov,f);camera.updateProjectionMatrix();
  // pointer: turn the view ±5° about the camera and slide it ±0.12 m sideways
  const d=look.clone().sub(pos),right=d.clone().cross(new THREE.Vector3(0,1,0)).normalize();
  d.applyAxisAngle(new THREE.Vector3(0,1,0),-pxShown*THREE.MathUtils.degToRad(5));pos.addScaledVector(right,pxShown*.12);
  camera.position.copy(pos);camera.lookAt(pos.clone().add(d));
 }
 function tick(now:number){raf=0;if(paused||playing)return;
  if(!reduced)pxShown+=(px-pxShown)*.16;
  const moving=Math.abs(px-pxShown)>.01;if(!moving)pxShown=px;
  if(!dirty&&!moving)return;
  if(now-last<33){kick();return;}                                                // ≤ 30 fps
  if(dirty||moving){last=now;dirty=false;place();
   arch.update(now/1000,frame++,camera,(composer.readBuffer as THREE.WebGLRenderTarget).depthTexture,1);composer.render();}
  if(moving)kick();}
 function kick(){if(!raf)raf=requestAnimationFrame(tick);}
 const onResize=()=>{clearTimeout(settle);settle=setTimeout(resize,150);};
 addEventListener('resize',onResize);resize();
 return{
  /** descent progress 0 (above the stacks) … 1 (calm shelves) */
  setProgress(v:number){if(Math.abs(v-p)>1e-4){p=v;dirty=true;if(soft){clearTimeout(settle);settle=setTimeout(kick,180);}else kick();}},
  /** pointer x in −1 … 1 */
  setPointer(v:number){if(reduced)return;px=Math.max(-1,Math.min(1,v));kick();},
  /** software rendering detected (low-power mode) */
  soft,
  /** a waveform plays: hold the last frame until it stops */
  setPlaying(v:boolean){playing=v;if(!v){dirty=true;kick();}},
  /** stop drawing (the large viewer covers the page) */
  setPaused(v:boolean){paused=v;if(!v){dirty=true;kick();}},
  dispose(){cancelAnimationFrame(raf);clearTimeout(settle);removeEventListener('resize',onResize);arch.dispose();composer.dispose();renderer.dispose();},
 };
}
export type LabBackdrop=Awaited<ReturnType<typeof createLabBackdrop>>;
