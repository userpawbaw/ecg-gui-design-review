// Lab backdrop (D-074, user 2026-10-18 "서고를 뒷 배경으로 … 스크롤에 따라 leoparpeix처럼 위에서 내려오는 광경 … 화면을 좌우로
// 움직이면 시점이 바뀌는 것도"): the baked archive behind the Lab page. Revised 2026-10-18 (user: no empty hero, "파형 부분이 바로
// 보이게 하되 스크롤하면 … 서고가 배경으로 은은하게 바뀌는", "천장의 램프가 보이는게 마음에 들지 않아서", "사다리를 타고 쭉 내려오는 느낌",
// "가감속"): the whole page scroll maps to one slow ladder descent, from the top of the stacks (no ceiling lamp) to the floor,
// followed by a spring; the pointer turns the view only a little.
// Laptop budget: draws only while the camera moves (scroll spring, pointer, resize), at 0.6 × the screen resolution and at most
// 1.2 M pixels, not at all while a waveform plays (the last frame stays, the pointer turn waits; the waveform comes first — a
// software-rendered full-page capture took ~1.2 s longer per shot with the backdrop redrawing) or the large viewer covers the page; a resize
// redraws once after it settles (a full-page screenshot or a window drag resizes many times); the sun depth map is rendered
// once; one post pass (the archive shafts), no bloom; at most 30 frames a second.
// Software rendering (SwiftShader / llvmpipe — a machine without GPU acceleration, and the QA browser) is a low-power mode: no
// pointer turn, 0.35 × resolution, one draw after scrolling stops. Measured 2026-10-18: with the full backdrop the Lab browser
// test went from 11.6 s to over 45 s there, the pointer easing alone costing tens of ~1 s frames.
// Viewpoints: verification/lab-backdrop-survey-20261018 (three frame).
import * as THREE from 'three';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createArchive} from './story/intro/archive';

type Key={pos:THREE.Vector3,look:THREE.Vector3,fov:number};
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const KEYS:Key[]=[
 {pos:V(-.2,3.0,1.6),look:V(.4,1.4,-4.3),fov:44},       // top of the ladder: the stacks under the shafts, the ceiling lamp out of frame (user screenshot)
 {pos:V(.3,2.5,-.6),look:V(.35,1.8,-4.3),fov:50},       // halfway down, the upper shelves at eye level
 {pos:V(.3,.95,-1.0),look:V(.35,.9,-4.3),fov:50},       // the floor: the lower shelves and the sun patches
];
const SPRING=2.6;   // rad/s, critically damped: 80 % of a scroll step in ~1.2 s, settled in ~2 s (eases in and out)
const Q=new URLSearchParams(location.search),RES_Q=Q.get('bgres');
// D-075 ambient: ?amb=0 off (?amb=1 forces it on in the low-power mode); ?wind= ?silk= ?cloud= 0–100 in 10 % steps, 50 = designed
const lvl=(k:string)=>{const r=Q.get(k),v=Number(r);return r===null||!Number.isFinite(v)?1:Math.min(100,Math.max(0,Math.round(v/10)*10))/50;};
const AMB={on:Q.get('amb')!=='0',forced:Q.get('amb')==='1',wind:lvl('wind'),silk:lvl('silk'),cloud:lvl('cloud')};

export async function createLabBackdrop(canvas:HTMLCanvasElement){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x05090b,1);
 const gl=renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
 const soft=/swiftshader|llvmpipe|software|basic render/i.test(gpu),RES=RES_Q!==null?Number(RES_Q):soft?.35:.6;
 const arch=await createArchive(Q.get('sun')==='0'?'base':'sun35');arch.setFade(1);arch.renderSunDepth(renderer);   // D-075 ?sun=0: the original grazing sun
 const roomScene=new THREE.Scene(),dustScene=new THREE.Scene();roomScene.add(arch.room);dustScene.add(arch.dust);
 const camera=new THREE.PerspectiveCamera(50,1,.05,60);
 // D-075 frame: the room (colour + depth) is drawn into `base` only when the camera moves; every frame then adds the moving light
 // over it — shafts (+ cloud on the sun patches) into `work`, the dust into `work` against the stored depth, tone map to the screen
 const base=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)});
 const work=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
 const out=new OutputPass();out.renderToScreen=true;arch.vol.renderToScreen=false;
 const du=arch.dustMat.uniforms;du.uDepthOn.value=1;du.tSceneDepth.value=base.depthTexture;
 if(Q.get('shaft')!==null)arch.vol.uniforms.uIntensity.value*=lvl('shaft');   // ?shaft= 0–100, 50 = designed
 arch.amb.wind.value=AMB.wind;arch.amb.silk.value=AMB.silk;arch.amb.cloud.value=AMB.cloud;
 const ambient=AMB.on&&!(matchMedia('(prefers-reduced-motion: reduce)').matches)&&(!soft||AMB.forced);
 const curve=(pick:(k:Key)=>THREE.Vector3)=>new THREE.CatmullRomCurve3(KEYS.map(pick),false,'centripetal');
 const posC=curve(k=>k.pos),lookC=curve(k=>k.look);
 let p=0,ps=0,pv=0,px=0,pxShown=0,dirty=true,raf=0,last=0,frame=0,playing=false,paused=false,lastT=0,clock=0,settle:ReturnType<typeof setTimeout>|undefined;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||soft;
 if(!ambient){arch.amb.wind.value=arch.amb.silk.value=arch.amb.cloud.value=0;}
 function resize(){const w=innerWidth,h=innerHeight,pr=Math.min(Math.min(2,devicePixelRatio||1)*RES,Math.sqrt(1.2e6/(w*h)));renderer.setPixelRatio(pr);renderer.setSize(w,h,false);
  const W=Math.max(1,Math.round(w*pr)),H=Math.max(1,Math.round(h*pr));base.setSize(W,H);work.setSize(W,H);du.uRes.value.set(W,H);
  camera.aspect=w/h;camera.updateProjectionMatrix();arch.setPx(h,pr);dirty=true;kick();}
 function place(){
  const u=Math.min(1,Math.max(0,ps)),seg=u*(KEYS.length-1),i=Math.min(KEYS.length-2,Math.floor(seg)),f=seg-i;
  const pos=posC.getPoint(u),look=lookC.getPoint(u);camera.fov=THREE.MathUtils.lerp(KEYS[i].fov,KEYS[i+1].fov,f);camera.updateProjectionMatrix();
  // pointer: turn the view ±3° about the camera and slide it ±0.06 m sideways (user 2026-10-18 "약하게 좌우로")
  const d=look.clone().sub(pos),right=d.clone().cross(new THREE.Vector3(0,1,0)).normalize();
  d.applyAxisAngle(new THREE.Vector3(0,1,0),-pxShown*THREE.MathUtils.degToRad(3));pos.addScaledVector(right,pxShown*.06);
  camera.position.copy(pos);camera.lookAt(pos.clone().add(d));
 }
 function draw(camMoved:boolean,dt:number){
  if(camMoved){place();renderer.setRenderTarget(base);renderer.clear();renderer.render(roomScene,camera);}
  if(ambient){clock+=dt;arch.stepAmbient(renderer,clock,dt);}
  arch.update(clock,frame++,camera,base.depthTexture,1);
  arch.vol.render(renderer,work,base,0,false);
  renderer.setRenderTarget(work);renderer.autoClear=false;renderer.render(dustScene,camera);renderer.autoClear=true;
  out.render(renderer,null as unknown as THREE.WebGLRenderTarget,work,0,false);
 }
 function tick(now:number){raf=0;if(paused){lastT=0;return;}
  const dt=lastT?Math.min(.05,(now-lastT)/1000):1/60;lastT=now;
  // a waveform plays: the camera holds (scroll and pointer wait), only the ambient light keeps moving at a lower rate
  if(!playing){
   // scroll: a critically damped spring follows the page position, so the descent speeds up and settles instead of jumping
   if(reduced){ps=p;pv=0;}else{pv+=(-2*SPRING*pv-SPRING*SPRING*(ps-p))*dt;ps+=pv*dt;if(Math.abs(ps-p)<1e-4&&Math.abs(pv)<1e-3){ps=p;pv=0;}}
   if(!reduced)pxShown+=(px-pxShown)*Math.min(1,dt*4);
   if(Math.abs(px-pxShown)<=.005)pxShown=px;
  }
  const moving=!playing&&(Math.abs(px-pxShown)>.005||ps!==p);if(moving)dirty=true;
  const camMoved=dirty&&!playing;
  if(!camMoved&&!ambient){lastT=0;return;}
  const gap=camMoved?33:playing?83:42;                                        // ≤ 30 fps moving · 24 idle · 12 while playing
  if(now-last<gap){kick();return;}
  draw(camMoved,Math.min(.1,(now-(last||now))/1000)||dt);last=now;if(camMoved)dirty=false;
  if(moving||ambient)kick();}
 function kick(){if(!raf)raf=requestAnimationFrame(tick);}
 const onResize=()=>{clearTimeout(settle);settle=setTimeout(resize,150);};
 addEventListener('resize',onResize);resize();
 return{
  /** descent progress 0 (top of the ladder) … 1 (the floor): the whole page scroll */
  setProgress(v:number){if(Math.abs(v-p)>1e-4){p=v;dirty=true;if(soft){clearTimeout(settle);settle=setTimeout(kick,180);}else kick();}},
  /** pointer x in −1 … 1 */
  setPointer(v:number){if(reduced)return;px=Math.max(-1,Math.min(1,v));kick();},
  /** software rendering detected (low-power mode) */
  soft,
  /** a waveform plays: hold the camera until it stops (the ambient light keeps moving at 12 fps) */
  setPlaying(v:boolean){playing=v;kick();},
  /** stop drawing (the large viewer covers the page) */
  setPaused(v:boolean){paused=v;if(!v){dirty=true;kick();}},
  dispose(){cancelAnimationFrame(raf);clearTimeout(settle);removeEventListener('resize',onResize);arch.dispose();base.dispose();work.dispose();out.dispose();renderer.dispose();},
 };
}
export type LabBackdrop=Awaited<ReturnType<typeof createLabBackdrop>>;
