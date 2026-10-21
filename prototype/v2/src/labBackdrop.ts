// Lab backdrop (D-074, user 2026-10-18 "서고를 뒷 배경으로 … 스크롤에 따라 leoparpeix처럼 위에서 내려오는 광경 … 화면을 좌우로
// 움직이면 시점이 바뀌는 것도"): the baked archive behind the Lab page. Revised 2026-10-18 (user: no empty hero, "파형 부분이 바로
// 보이게 하되 스크롤하면 … 서고가 배경으로 은은하게 바뀌는", "천장의 램프가 보이는게 마음에 들지 않아서", "사다리를 타고 쭉 내려오는 느낌",
// "가감속"): the whole page scroll maps to one slow ladder descent, from the top of the stacks (no ceiling lamp) to the floor,
// followed by a spring; the pointer turns the view only a little.
// Laptop budget: draws only while the camera moves (scroll spring, pointer, resize), not at all while a waveform plays (the last frame stays, the pointer turn waits; the waveform comes first — a
// software-rendered full-page capture took ~1.2 s longer per shot with the backdrop redrawing) or the large viewer covers the page; a resize
// redraws once after it settles (a full-page screenshot or a window drag resizes many times); the sun depth map is rendered
// once; no bloom; at most 30 frames a second.
// D-153 (user 2026-10-21 "계단 현상이 너무 심해", F-109): the room used to be drawn at 0.6 × without anti-aliasing and stretched,
// and the shaft march jitter was never filtered (a honeycomb over the whole air). Now the room (baked, redrawn only when the camera
// moves) is drawn at the screen resolution (≤ 2.1 M pixels) with 4 × MSAA; the shafts are marched at half that resolution into
// their own target (in-scatter + view distance) and composited with a 3 × 3 depth-aware blur that removes the jitter pattern;
// the jitter no longer changes per frame (no shimmer when idle). ?msaa=0 · ?bgres= (room scale) · ?fogres= (shaft scale).
// Software rendering (SwiftShader / llvmpipe — a machine without GPU acceleration, and the QA browser) is a low-power mode: no
// pointer turn, 0.35 × resolution, one draw after scrolling stops. Measured 2026-10-18: with the full backdrop the Lab browser
// test went from 11.6 s to over 45 s there, the pointer easing alone costing tens of ~1 s frames.
// Viewpoints: verification/lab-backdrop-survey-20261018 (three frame).
import * as THREE from 'three';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {createArchive} from './story/intro/archive';

type Key={pos:THREE.Vector3,look:THREE.Vector3,fov:number};
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
// D-077 paths (three frame; Blender (x, y, z) → (x, z, −y)), ?path=c1 (default) | c2 | c3:
//  c1 — down the ladder while moving up the aisle; it passes through two light curtains (skylights in the front ceiling bay) at
//       ~21–27 % and ~56–64 % of the page scroll (scratch design: ray test of the path against the skylight beams)
//  c2 — c1, then over the last quarter the view turns into the last gap of the left stacks, where the window light strikes
//       a stack face at 30° (the D-075 contrast up close)
//  c3 — the D-074 descent (top of the ladder without the ceiling lamp → upper shelves → floor)
const Q0=new URLSearchParams(location.search);
const PATHS:Record<string,Key[]>={
 c1:[{pos:V(.15,3.3,3.4),look:V(.35,1.6,-4.3),fov:46},{pos:V(.25,2.4,1.2),look:V(.35,1.5,-4.3),fov:48},{pos:V(.3,.95,-1.0),look:V(.35,.9,-4.3),fov:50}],
 c2:[{pos:V(.15,3.3,3.4),look:V(.35,1.6,-4.3),fov:46},{pos:V(.22,2.7,1.9),look:V(.35,1.55,-4.3),fov:47},{pos:V(.26,2.0,.4),look:V(.35,1.4,-4.3),fov:48},
  {pos:V(.3,1.25,-.75),look:V(.2,1.1,-4.3),fov:50},{pos:V(.1,1.3,-1.0),look:V(-2.7,3.0,-1.6),fov:55}],   // the window light lands high (z 2.8–4.1) on the face at y 1.55
 c3:[{pos:V(-.2,3.0,1.6),look:V(.4,1.4,-4.3),fov:44},{pos:V(.3,2.5,-.6),look:V(.35,1.8,-4.3),fov:50},{pos:V(.3,.95,-1.0),look:V(.35,.9,-4.3),fov:50}],
 // D-154 (user 2026-10-21 "위에서 내리는 방향으로", "이동하는 거리가 너무 큰 것 같아"): a level camera that only moves down, like
 // REF-002 (22.9°, ~8.5 m from the wall, 2.75 m down) — v1 from the aisle front (back wall 9 m away, 26°), v2 inside the aisle (34°).
 // ?vz=top,bottom (m) trims the descent to the stretch where the light reads best (default: the chosen segment).
 v1:vPath(-4.5,26),v2:vPath(-1.0,34),
};
function vPath(y:number,fov:number):Key[]{const [a,b]=(Q0.get('vz')??'3.6,2.2').split(',').map(Number);
 return [a,b].map(z=>({pos:V(.2,z,-y),look:V(.2,z,-4.5),fov}));}
const KEYS:Key[]=PATHS[new URLSearchParams(location.search).get('path')??'c1']??PATHS.c1;
const SPRING=2.6;   // rad/s, critically damped: 80 % of a scroll step in ~1.2 s, settled in ~2 s (eases in and out)
const Q=new URLSearchParams(location.search),RES_Q=Q.get('bgres');
// D-075 ambient: ?amb=0 off (?amb=1 forces it on in the low-power mode); ?aurora= (D-077 S1, replaced ?silk=) ?shaft= 0–100 in
// 10 % steps, 50 = designed.
// User 2026-10-18 after the first look: wind and cloud removed (F-051), the dust smaller and sparser, nothing moves during playback.
const lvl=(k:string)=>{const r=Q.get(k),v=Number(r);return r===null||!Number.isFinite(v)?1:Math.min(100,Math.max(0,Math.round(v/10)*10))/50;};
const AMB={on:Q.get('amb')!=='0',forced:Q.get('amb')==='1',aur:lvl('aurora')};
// D-153 ?ray= — how visible the light curtains are from the side (user 2026-10-21 "해 쪽을 바라보는게 아닌데도 광선의 방향이나 결이
// 보이잖아"): 0 as before · 1 visible (two-lobe phase, denser beams with saturating in-scatter, half the room haze, 14 m march) ·
// 2 = 1 + grain stretched along the light · 3 = 2 + thin shadow streaks across the openings. Factors on the archive defaults.
type Ray={len:number,iso:number,dens:number,comp:number,int:number,haze:number,grain:number,stria:number};
const RAYS:Record<string,Ray>={
 '0':{len:9,iso:0,dens:1,comp:0,int:1,haze:1,grain:0,stria:0},
 '1':{len:14,iso:.5,dens:2,comp:3,int:1.6,haze:.5,grain:0,stria:0},
 '2':{len:14,iso:.5,dens:2,comp:3,int:1.7,haze:.5,grain:1,stria:0},
 '3':{len:14,iso:.5,dens:2,comp:3,int:1.9,haze:.5,grain:1,stria:1},
};
const RAY=RAYS[Q.get('ray')??'0']??RAYS['0'];

export async function createLabBackdrop(canvas:HTMLCanvasElement){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
 // D-154: ?tone=agx — the stills are judged in Blender AgX; the web used ACES (a missed difference, archive-light F-045)
 renderer.toneMapping=Q.get('tone')==='agx'?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x05090b,1);
 const gl=renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
 const soft=/swiftshader|llvmpipe|software|basic render/i.test(gpu),RES=RES_Q!==null?Number(RES_Q):soft?.35:1;
 const MSAA=Q.get('msaa')!==null?Number(Q.get('msaa'))||0:soft?0:4,FOG=Number(Q.get('fogres'))||.5,CAP=2.1e6;
 // default the original archive (user 2026-10-19: "바닥과 사다리에 빛이 비치는 처음 버젼이 제일 낫다", D-080) · ?sun=lab the
 // D-079 bake (C + larger hatch) · 30 the D-077 C1 bake · 15 the D-078 bake · e3 / d16 the D-080 bakes
 const SUN=Q.get('sun'),arch=await createArchive(({lab:'lab','15':'sun15','30':'sun35',e3:'e3',d16:'d16'} as Record<string,'lab'|'sun15'|'sun35'|'e3'|'d16'>)[SUN??'']??'base');arch.setFade(1);arch.renderSunDepth(renderer);
 // D-077: the Lab variant has no aisle lamps (their bulbs lit the room) → exposure ×1.8 brings the frame mean back to the
 // D-074 level (0.10–0.17 → measured in verification/lab-c1-20261018)
 if(SUN==='30')arch.shared.uExposure.value*=1.8;   // only the lamp-less D-077 bake; the later bakes keep their bulbs (F-053)
 const roomScene=new THREE.Scene(),dustScene=new THREE.Scene();roomScene.add(arch.room);dustScene.add(arch.dust);
 const camera=new THREE.PerspectiveCamera(50,1,.05,60);
 // D-075 frame: the room (colour + depth) is drawn into `base` only when the camera moves; every frame then adds the moving light
 // over it — shafts (+ cloud on the sun patches) into `work`, the dust into `work` against the stored depth, tone map to the screen
 const base=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:MSAA,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)});
 const work=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
 const fog=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
 const out=new OutputPass();out.renderToScreen=true;arch.vol.renderToScreen=false;
 // D-153: the archive's shaft shader in its fog-only form, sharing the pass uniforms (arch.update keeps driving them)
 const vu=arch.vol.uniforms,vm=arch.vol.material as THREE.ShaderMaterial;
 const fogQuad=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:vu,vertexShader:vm.vertexShader,fragmentShader:vm.fragmentShader,defines:{FOG_ONLY:'',NSTEPS:64}}));
 vu.uMaxLen.value=RAY.len;vu.uIso.value=RAY.iso;vu.uDensIn.value=RAY.dens;vu.uComp.value=RAY.comp;vu.uIntensity.value*=RAY.int;
 vu.uHaze.value*=RAY.haze;vu.uGrain.value=RAY.grain;vu.uStria.value=RAY.stria;
 const comp=new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms:{tBase:{value:base.texture},tDepth:{value:base.depthTexture},tFog:{value:fog.texture},uFogSize:{value:new THREE.Vector2(1,1)},
   uInvProj:vu.uInvProj,uInvView:vu.uInvView,uCam:vu.uCam,uHaze:vu.uHaze,uHazeCol:vu.uHazeCol,uOn:vu.uOn},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`precision highp float;uniform sampler2D tBase,tDepth,tFog;uniform vec2 uFogSize;uniform mat4 uInvProj,uInvView;uniform vec3 uCam,uHazeCol;uniform float uHaze,uOn;varying vec2 vUv;
   void main(){vec3 col=texture2D(tBase,vUv).rgb;float d=texture2D(tDepth,vUv).x;
    vec4 v=uInvProj*vec4(vUv*2.-1.,d*2.-1.,1.);v/=v.w;float dist=length((uInvView*v).xyz-uCam);
    float hz=(1.-exp(-uHaze*min(dist,14.)))*uOn;
    // 3 × 3 half-resolution texels around this pixel: Gaussian in screen space × similarity of view distance (no bleed across edges)
    vec2 f=vUv*uFogSize-.5,c=floor(f)+.5;vec3 s=vec3(0.);float w=0.;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 t=c+vec2(float(i),float(j));vec4 q=texture2D(tFog,t/uFogSize);
     vec2 o=t-.5-f;float k=exp(-dot(o,o)*.45)*exp(-abs(q.a-dist)/(.04+.06*dist)*3.);s+=q.rgb*k;w+=k;}
    vec3 fogc=w>1e-4?s/w:texture2D(tFog,vUv).rgb;
    gl_FragColor=vec4(mix(col,uHazeCol,hz)+fogc,1.);}`,depthTest:false,depthWrite:false}));
 const du=arch.dustMat.uniforms;du.uDepthOn.value=1;du.tSceneDepth.value=base.depthTexture;
 if(Q.get('shaft')!==null)arch.vol.uniforms.uIntensity.value*=lvl('shaft');   // ?shaft= 0–100, 50 = designed
 arch.amb.aur.value=AMB.aur;
 arch.dust.geometry.setDrawRange(0,1100);   // 2600 motes in the intro; the Lab keeps 1100 (user: "먼지도 약간 과한 감")
 const ambient=AMB.on&&!(matchMedia('(prefers-reduced-motion: reduce)').matches)&&(!soft||AMB.forced);
 const curve=(pick:(k:Key)=>THREE.Vector3)=>new THREE.CatmullRomCurve3(KEYS.map(pick),false,'centripetal');
 const posC=curve(k=>k.pos),lookC=curve(k=>k.look);
 let p=0,ps=0,pv=0,px=0,pxShown=0,dirty=true,raf=0,last=0,playing=false,paused=false,lastT=0,clock=0,settle:ReturnType<typeof setTimeout>|undefined;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||soft;
 if(!ambient)arch.amb.aur.value=0;
 function resize(){const w=innerWidth,h=innerHeight,pr=Math.min(Math.min(2,devicePixelRatio||1)*RES,Math.sqrt(CAP/(w*h)));renderer.setPixelRatio(pr);renderer.setSize(w,h,false);
  const W=Math.max(1,Math.round(w*pr)),H=Math.max(1,Math.round(h*pr));base.setSize(W,H);work.setSize(W,H);du.uRes.value.set(W,H);
  const fw=Math.max(1,Math.round(W*FOG)),fh=Math.max(1,Math.round(H*FOG));fog.setSize(fw,fh);(comp.material as THREE.ShaderMaterial).uniforms.uFogSize.value.set(fw,fh);
  camera.aspect=w/h;camera.updateProjectionMatrix();arch.setPx(h,pr*.6);dirty=true;kick();}   // motes 0.6 × the intro size
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
  arch.update(clock,0,camera,base.depthTexture,1);   // D-153: a fixed jitter pattern (the composite blur removes it; no shimmer)
  renderer.setRenderTarget(fog);fogQuad.render(renderer);
  renderer.setRenderTarget(work);comp.render(renderer);
  renderer.autoClear=false;renderer.render(dustScene,camera);renderer.autoClear=true;
  out.render(renderer,null as unknown as THREE.WebGLRenderTarget,work,0,false);
 }
 function tick(now:number){raf=0;if(paused||playing){lastT=0;return;}   // playback: the waveform comes first (user video 2 at 28 s)
  const dt=lastT?Math.min(.05,(now-lastT)/1000):1/60;lastT=now;
  // scroll: a critically damped spring follows the page position, so the descent speeds up and settles instead of jumping
  if(reduced){ps=p;pv=0;}else{pv+=(-2*SPRING*pv-SPRING*SPRING*(ps-p))*dt;ps+=pv*dt;if(Math.abs(ps-p)<1e-4&&Math.abs(pv)<1e-3){ps=p;pv=0;}}
  if(!reduced)pxShown+=(px-pxShown)*Math.min(1,dt*4);
  if(Math.abs(px-pxShown)<=.005)pxShown=px;
  const moving=Math.abs(px-pxShown)>.005||ps!==p;if(moving)dirty=true;
  const camMoved=dirty;
  if(!camMoved&&!ambient){lastT=0;return;}
  const gap=camMoved?33:42;                                                   // ≤ 30 fps moving · 24 idle
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
  /** a waveform plays: hold the last frame until it stops */
  setPlaying(v:boolean){playing=v;if(!v){dirty=true;kick();}},
  /** stop drawing (the large viewer covers the page) */
  setPaused(v:boolean){paused=v;if(!v){dirty=true;kick();}},
  dispose(){cancelAnimationFrame(raf);clearTimeout(settle);removeEventListener('resize',onResize);arch.dispose();base.dispose();work.dispose();fog.dispose();fogQuad.dispose();comp.dispose();out.dispose();renderer.dispose();},
 };
}
export type LabBackdrop=Awaited<ReturnType<typeof createLabBackdrop>>;
