// R1 intro engine (IDEA-R1-INTRO, D-041). Vanilla module mounted by React (D-028): one GSAP ticker drives Lenis,
// the WebGL scene, the Canvas 2D sweep and the few DOM transforms. Every scroll-driven value is a pure function of the
// smoothed progress P (reversible); every rhythm-driven value is a function of one playback clock t (heart, rim
// pulse, conduction wave, sweep head) — so the R peak and the heartbeat cannot drift apart.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';
import Lenis from 'lenis';
import {createGlobe} from './globe';
import {createFigure,type FigureData} from './figure';
import {createSpace,createShafts,createGrade,createFireflyGuard,createFinal} from './space';
import {FXAAPass} from 'three/addons/postprocessing/FXAAPass.js';
import {createArchive} from './archive';
import {createSignalRig,SIGNAL_CLEAN,SIGNAL_NOISE,SIGNAL_OFF,type SignalState} from './signalRig';
import {createSweep,type SweepView} from './sweep';
import {beatPhase,type Loop} from './beats';
import {createGrid,createScrollMix,mvPerBoxFor,scrambled} from './waveUi';
import {createScreenFluid,FLUID_FORCED} from './screenFluid';

export type IntroData={fs:number,loop:Loop,input:Float32Array,output:Float32Array,metrics:{snrIn:number,snrOut:number,cc:number}};
export type IntroDom={wrapper:HTMLElement,content:HTMLElement,gl:HTMLCanvasElement,sweep:HTMLCanvasElement,
 title:HTMLElement,noiseChars:HTMLElement[],sub:HTMLElement,hint:HTMLElement,wheelHint?:HTMLElement|null,labels:HTMLElement,labelIn:HTMLElement,labelOut:HTMLElement,outMono:HTMLElement,steps:HTMLElement[],
 scale:HTMLElement,grid:HTMLCanvasElement,ann:HTMLElement,sweepWrap:HTMLElement,end:HTMLElement,parallax:HTMLElement[]};
export type IntroOptions={reduced:boolean,frozenT:number|null,frozenP:number|null,look?:'v1'|'v2'|'archive',shot?:string|null,cam?:string|null,signal?:SignalState|null,grip?:number};

const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(p:number,a:number,b:number)=>clamp((p-a)/(b-a));
const inOut=(t:number)=>t<.5?2*t*t:1-(-2*t+2)**2/2;
const out2=(t:number)=>1-(1-t)**2;
const damp=(dt:number,tau:number)=>1-Math.exp(-dt/tau);        // frame-rate independent smoothing
export const GATE_WAVE=.8;
/* D-190 (사용자 2026-11-22 노트북 「도입부 프레임 20도 안 됨 · 스크롤 불가 · 지구 화면은 없는 게 낫다」): 첫 화면 = 어둡게 한 서고(지구 없음),
 * 스크롤 첫 구간은 서고 안에서 조금 이동(s1_top → s2_beams), 그 끝에 닿으면 심장까지는 시간 기준 고정 애니메이션(스크롤 잠금, 3잡음 장면처럼),
 * 끝나면 파형 단계는 다시 스크롤. 위로 되돌리면 짧게 거꾸로 돌아 첫 화면. ?intro=globe 이면 이전 도입(지구 + 전 구간 스크롤). */
const IQ=new URLSearchParams(typeof location==='undefined'?'':location.search);
export const INTRO_GLOBE=IQ.get('intro')==='globe';
const FIRST_S=.3,PV0=.25,PV1=.31,PVA=GATE_WAVE,AUTO_S=Number(IQ.get('introauto'))||9,BACK_S=2.2,DIM=IQ.has('introdim')?Number(IQ.get('introdim')):.55;
// D-190 렉 후보 스위치(노트북에서 하나씩 시험): ?ibloom=0 ?ifog=0 ?igrade=0 ?iguard=0 ?ipr=1 (픽셀 비, 기본 1.25) ?msaa=0 ?fluid=0 ?idust=0 ?irig=0 ?iclimb=0 ?ifps=30 (프레임 상한)
// ?fps=1 화면 왼쪽 아래 FPS · 프레임 시간 표시, ?introprof=1 window.__introProf(프레임별 CPU ms · GPU 대기 ms)
// ?perf=msaa,bloom,fog,grade,guard,dust,rig,climb,fluid,pr75,pr50,fps30 — 같은 스위치를 한 매개변수로(npm run story:perf -- msaa,pr75; Windows 셸에서 & 없이), FPS 표시 켬
export const PERF=new Set((IQ.get('perf')??'').split(',').map(x=>x.trim()).filter(Boolean));
const OFF=(k:string)=>IQ.get(k)==='0'||PERF.has(k.replace(/^i/,'')),PR_CAP=PERF.has('pr50')?.5:PERF.has('pr75')?.75:IQ.has('ipr')?Math.max(.5,Number(IQ.get('ipr'))||1.25):1.25,
 FPS_CAP=PERF.has('fps30')?30:Number(IQ.get('ifps'))||0,PROF=IQ.get('introprof')==='1',HUD=IQ.get('fps')==='1'||IQ.has('perf');
// scroll map (fraction of the whole intro). Globe segment follows REF-001 EFX-001-02 (rotation, shrink, fade).
export const MAP={title:[.015,.11],globe:[0,.3],globeScale:[.03,.3],globeFade:[.19,.27],rim:[.15,.21],morph:[.22,.39],
 body:[.36,.45],lineOut:[.42,.56],heart:[.38,.47],cam:[.52,.72],enter:[.7,.8],waveFade:[.79,.81],mix:[.84,.95],end:[.965,.995]} as const;
// P1 (REF-003 EFX-003-06): screen speeds × scroll — label block 0.85, wave stage 1.45; the wave starts further down,
// enters later and overtakes. Travel over the enter segment is ENTER_D screen heights.
const SPEED={label:.85,wave:1.45},ENTER_D=.7;
const SWEEP_COLORS={input:[255,188,121] as [number,number,number],output:[103,231,195] as [number,number,number]};

export async function createIntro(dom:IntroDom,data:IntroData,opt:IntroOptions){
 const urls={body:new URL('./assets/body.glb',import.meta.url).href,heart:new URL('./assets/heart.glb',import.meta.url).href,
  fig:new URL('./assets/figure.json',import.meta.url).href,day:new URL('./assets/earth_day.jpg',import.meta.url).href,
  night:new URL('./assets/earth_night.jpg',import.meta.url).href,clouds:new URL('./assets/earth_clouds.jpg',import.meta.url).href,height:new URL('./assets/earth_height.jpg',import.meta.url).href,
  floor:new URL('./assets/floor_light.png',import.meta.url).href,seatedV3:new URL('./assets/body_seated_v3.glb',import.meta.url).href,
  rig:new URL('./assets/rig_v3.glb',import.meta.url).href,
  // intro2 (I-4/I-5): Mixamo auto-rig of the story mesh — climber, then the floor-sitter with electrodes (rig_v3_floor)
  arClimb:new URL('./assets/body_v3_ar_climb.glb',import.meta.url).href,arFloor:new URL('./assets/body_v3_ar_floor.glb',import.meta.url).href,
  rigFloor:new URL('./assets/rig_v3_floor.glb',import.meta.url).href};
 // --- renderer (REF-001: ACES, exposure 1.16, pixel ratio capped) ---
 const renderer=new THREE.WebGLRenderer({canvas:dom.gl,antialias:true,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x000000,1);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(25,1,.02,60);
 const tl=new THREE.TextureLoader(),gl=new GLTFLoader();
 const tex=async(u:string,srgb=true)=>{const t=await tl.loadAsync(u);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=4;return t;};
 const geomMorph=async(u:string)=>{const g=await gl.loadAsync(u);let out:THREE.Mesh|null=null;g.scene.traverse(o=>{if((o as THREE.Mesh).isMesh&&!out)out=o as THREE.Mesh;});if(!out)throw Error('no mesh in '+u);
  const m=out as THREE.Mesh,d=m.morphTargetDictionary??{};return{geo:m.geometry,morph:Object.keys(d).sort((a,b)=>d[a]-d[b])};};
 const geom=async(u:string)=>(await geomMorph(u)).geo;
 const noTex=()=>Promise.resolve(null as unknown as THREE.Texture),needGlobe=INTRO_GLOBE||(opt.look!==undefined&&opt.look!=='archive');   // D-190: 지구 텍스처 4장은 지구가 있을 때만 받는다
 const [day,night,clouds,height,bodyGeo,heartGeo,fig,floorLm]=await Promise.all([needGlobe?tex(urls.day):noTex(),needGlobe?tex(urls.night):noTex(),needGlobe?tex(urls.clouds,false):noTex(),needGlobe?tex(urls.height,false):noTex(),geom(urls.body),geom(urls.heart),fetch(urls.fig).then(r=>r.json() as Promise<FigureData>),tex(urls.floor,false)]);
 const globe=needGlobe?createGlobe({day,night,clouds,height}):null;if(globe)scene.add(globe.group);
 const style=opt.look??'archive';   // D-046 archive is the default (brief 1 T9); ?look=v2 keeps the grid world
 // D-046: the ECG record archive (baked room + shafts + dust); D-048: figure v3 (3-lead) seated mid-ladder, H5 frosted body
 const arch=style==='archive'?await createArchive():null;
 const intro2=!!arch?.climb;
 const seated=arch?await geomMorph(intro2?urls.arFloor:urls.seatedV3):null;
 const figure=createFigure(seated?seated.geo:bodyGeo,heartGeo,fig,arch?'h5':style==='v1'?'v1':'v2',seated?.morph??[]);scene.add(figure.group,figure.line);
 // the climber: same H5 look, own uniforms (its own scan), no heart; placed and leaned as the bake placed it
 const climber=intro2?createFigure((await geomMorph(urls.arClimb)).geo,heartGeo.clone(),fig,'h5',[]):null;
 let climbTop=0;
 if(climber&&arch?.climb){climber.heartMesh.visible=false;climber.line.visible=false;climber.group.position.copy(arch.climb.location);climber.group.rotation.x=arch.climb.pitch;
  scene.add(climber.group);climber.group.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(climber.bodyMesh);climbTop=bb.max.y;}
 let scanTop=fig.height;
 if(arch){
  scene.add(arch.room,arch.dust);
  arch.renderSunDepth(renderer);   // static room: the sun depth map (shafts, dust, ring sun glow) is rendered once
  figure.group.position.copy(arch.figureLocation);
  figure.heartMesh.position.copy(arch.heart).sub(arch.figureLocation);figure.heartMesh.quaternion.copy(arch.heartQuat);
  figure.heartWorld.copy(arch.heart);
  const bu=figure.bodyMat.uniforms;bu.uHeart.value.copy(arch.heart);bu.uFeet.value=arch.figureLocation.y;
  bu.uRefDist.value=2.6;bu.uSunOn.value=1;bu.tLight.value=arch.lightRT.depthTexture;bu.uLightVP.value=arch.lightVP;bu.uSunTo.value=arch.sunTo;
  figure.line.visible=false;
  seated!.geo.computeBoundingBox();scanTop=seated!.geo.boundingBox!.max.y;
  figure.setGrip(opt.grip??0);
  if(climber&&OFF('iclimb'))climber.group.visible=false;
  if(climber){const cu=climber.bodyMat.uniforms;cu.uFeet.value=0;cu.uRefDist.value=Number(new URLSearchParams(location.search).get('climbRef')??3.6);   // 2026-10-14 user: rings too sparse as the camera nears the climber (~2 m) — densify from 3.6 m (was 2.6), close to the floor-sitter's spacing
  cu.uSunOn.value=1;cu.tLight.value=arch.lightRT.depthTexture;
   cu.uLightVP.value=arch.lightVP;cu.uSunTo.value=arch.sunTo;cu.uHeart.value.set(0,-9,0);}
 }
 // electrodes, leads, trunk, comm cable, power line and the inside-body paths with the flowing dash shader (C4)
 const rig=arch?await createSignalRig(intro2?urls.rigFloor:urls.rig,arch,{uScan:figure.bodyMat.uniforms.uScan,uFeet:figure.bodyMat.uniforms.uFeet}):null;
 if(rig&&OFF('irig'))rig.group.visible=false;
 if(rig){scene.add(rig.group);rig.setSignal(opt.signal==='noise'?SIGNAL_NOISE:opt.signal==='off'?SIGNAL_OFF:SIGNAL_CLEAN);}
 const space=style==='v2'?createSpace(floorLm):null;if(space)scene.add(space.group);
 const reflection=style==='v2'?figure.mirror():null;if(reflection)scene.add(reflection.group);
 // --- post: bloom only on bright parts (threshold), never on the Canvas 2D data layer ---
 // P2: light shafts (scene-linear, before bloom) and grade/vignette/grain (after the output transform)
 // archive: the composer's buffers carry depth so the shaft pass can ray-march to the scene surface
 // MSAA on the composer target (2026-10-12 user: "테두리에 계단 현상"): the canvas antialias flag does not reach a post chain
 const composer=arch?new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:Math.min(PERF.has('msaa')||PERF.has('fxaa')?0:Number(new URLSearchParams(location.search).get('msaa')??4),renderer.capabilities.maxSamples),depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)})):new EffectComposer(renderer);
 composer.addPass(new RenderPass(scene,camera));
 if(arch&&!OFF('ifog'))composer.addPass(new URLSearchParams(location.search).get('shaftfx')==='raw'?arch.vol:arch.fogPass());   // 2026-11-10: smoothed half-res fog (Lab D-153) — ?shaftfx=raw = the old full-res pass
 const shafts=space?createShafts(renderer,camera,[figure.group.children[0],figure.heartMesh]):null;if(shafts)composer.addPass(shafts.pass);
 if(!OFF('iguard'))composer.addPass(createFireflyGuard());   // NaN / Inf / huge pixels never reach bloom (2026-11-10 flashes)
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.35,.78);if(!OFF('ibloom'))composer.addPass(bloom);
 // D-190 ?perf=merge: 출력 변환 + 색보정 한 단계(createFinal) · ?perf=fxaa: MSAA 대신 마지막에 FXAA 한 단계(sRGB 화면에서)
 const MERGE=PERF.has('merge'),FXAA=PERF.has('fxaa');
 const grade=MERGE?createFinal(renderer.toneMappingExposure):createGrade();
 if(MERGE)composer.addPass(grade);else{composer.addPass(new OutputPass());if(!OFF('igrade'))composer.addPass(grade);}
 const fxaa=FXAA?new FXAAPass():null;if(fxaa)composer.addPass(fxaa);
 const grid=createGrid(dom.grid);
 const sweep=createSweep(dom.sweep,{gridHot:grid.hot,fs:data.fs,loop:data.loop,input:{values:data.input,color:SWEEP_COLORS.input,glow:.45,core:.78,white:.35},output:{values:data.output,color:SWEEP_COLORS.output},mvPerBox:3.6});

 // --- input: Lenis smooth scroll + scrub smoothing on top (REF-001: Lenis 1.6 s + scrub 1) ---
 const lenis=opt.frozenP===null?new Lenis({wrapper:dom.wrapper,content:dom.content,duration:opt.reduced?.2:1.6,wheelMultiplier:1.1,autoRaf:false}):null;
 let pRaw=opt.frozenP??0,p=pRaw,spinVel=0,spinExtra=0;
 lenis?.on('scroll',(e:Lenis)=>{pRaw=e.limit>0?e.scroll/e.limit:0;});
 const NEW=!!arch&&!INTRO_GLOBE;
 let titleW=-1,titleH=-1;   // D-190 제목 크기(창 바뀔 때만 다시 읽음)
 // D-190 도입 진행: first(스크롤 = 서고 안 짧은 이동) → auto(시간 = 심장까지, 스크롤 잠금) → wave(스크롤 = 파형 단계), 위로 되돌리면 back(짧게 거꾸로)
 let mode:'first'|'auto'|'wave'|'back'='first',modeT0=0,modeP0=PV1;
 const lockAt=(s:number)=>{if(!lenis)return;lenis.scrollTo(s*lenis.limit,{immediate:true,force:true});pRaw=s;};
 if(NEW&&opt.frozenP===null){p=PV0;pRaw=0;}
 // D-163: 파형 단계 휠 안내 — 마지막 입력(휠 · 키)에서 1.2 s 지나야 나타난다
 // D-164: 제목 유체 왜곡 오버레이(움직임 줄이기 · 터치 · 좁은 화면 · WebGL 실패면 없음 — DOM 글자 그대로)
 const screenFluid=opt.reduced&&!FLUID_FORCED?(console.info('[screenFluid] 꺼짐: 움직임 줄이기(prefers-reduced-motion — Windows 「애니메이션 효과」 끔이면 켜짐) · ?fluid=1 로 강제'),null):createScreenFluid(dom.title.parentElement!);   // D-167: whole intro, top layer
 const hintEl=dom.wheelHint?.querySelector<HTMLElement>('.it-wheelhint')??null;let lastInput=performance.now(),hintA=0;const introT0=performance.now();let firstA=0;
 const onKey=(e:KeyboardEvent)=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End'].includes(e.key))lastInput=performance.now();};
 addEventListener('keydown',onKey);
 const onWheel=(e:WheelEvent)=>{lastInput=performance.now();if(globe&&p<MAP.globe[1])spinVel=clamp(spinVel+e.deltaY*.0015,-.8,.8);};   // V1: wheel impulse spins the globe
 dom.wrapper.addEventListener('wheel',onWheel,{passive:true});
 const pointer={x:0,y:0,sx:0,sy:0};
 const onMove=(e:PointerEvent)=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;};
 const onLeave=()=>{pointer.x=0;pointer.y=0;};
 addEventListener('pointermove',onMove);document.addEventListener('pointerleave',onLeave);

 // --- layout ---
 let W=0,H=0;
 const box=()=>({l:.47*W,r:.93*W,t:.34*H,b:.72*H});
 function resize(){
  titleW=-1;W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio||1,PR_CAP);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);fxaa?.setSize(W*pr,H*pr);bloom.resolution.set(W*pr/2,H*pr/2);
  shafts?.setSize(W*pr,H*pr);space?.setPx(H,pr);arch?.setPx(H,pr);grade.uniforms.uAspect.value=W/H;
  camera.aspect=W/H;camera.updateProjectionMatrix();figure.setResolution(W*pr,H*pr);
  const b=box(),mv=mvPerBoxFor(b,2.5);sweep.resize(b,mv);grid.resize(b,2.5,mv);
  Object.assign(dom.labels.style,{left:b.l+'px',top:(H*.075)+'px'});
  Object.assign(dom.scale.style,{left:b.l+'px',top:(b.b+14)+'px',width:(b.r-b.l)+'px'});
  if(hintEl)Object.assign(hintEl.style,{left:((b.l+b.r)/2)+'px',top:(b.b+48)+'px'});
 }
 resize();addEventListener('resize',resize);

 // --- clock + W4 state ---
 const t0=performance.now();let frozenT=opt.frozenT;
 const clock=()=>frozenT??(performance.now()-t0)/1000;
 type Wave={state:'off'|'flying'|'on',t0:number,t1:number,start:number|null};
 const wave:Wave={state:'off',t0:0,t1:0,start:null};
 const mix=createScrollMix();   // D-055: follows the scroll (2.5 % steps), reversible
 const labelState={current:'in' as 'in'|'out',handoff:-1,annAbs:NaN};
 const outBase=dom.outMono.textContent||'',outFinal=`SNR ${data.metrics.snrIn} dB → ${data.metrics.snrOut.toFixed(2)} dB · cc ${data.metrics.cc.toFixed(3)}`;
 const L=data.loop;
 const valueAtAbs=(arr:Float32Array,abs:number)=>{const len=L.end-L.start;return arr[L.start+((abs%len)+len)%len];};

 // camera poses (heart-relative spherical) — A = REF-001 hero camera, B = 3/4 view with the heart on the left third
 const H3=figure.heartWorld,A_POS=new THREE.Vector3(0,.2,5),A_LOOK=new THREE.Vector3(0,.2,0);
 const aRel=A_POS.clone().sub(H3),aDist=aRel.length(),aYaw=Math.atan2(aRel.x,aRel.z),aPitch=Math.asin(aRel.y/aDist);
 const B={dist:.62,yaw:.6,pitch:.06};
 const tmpV=new THREE.Vector3(),look=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 function cameraAt(c:number){
  const k=inOut(c);
  const dist=Math.exp(Math.log(aDist)+(Math.log(B.dist)-Math.log(aDist))*k);   // exponential zoom = constant perceived speed
  const yaw=aYaw+(B.yaw-aYaw)*k,pitch=aPitch+(B.pitch-aPitch)*k;
  camera.position.set(H3.x+dist*Math.cos(pitch)*Math.sin(yaw),H3.y+dist*Math.sin(pitch),H3.z+dist*Math.cos(pitch)*Math.cos(yaw));
  // final look target sits to the camera's right so the heart lands on the left third
  right.set(Math.cos(yaw),0,-Math.sin(yaw));
  const off=.42*B.dist*Math.tan(THREE.MathUtils.degToRad(12.5))*camera.aspect;
  const bLook=tmpV.copy(H3).addScaledVector(right,off);
  look.copy(A_LOOK).lerp(bLook,k);
  // pointer parallax: orbit the camera a little around its look target (±2.5° yaw, ±1.5° pitch)
  if(!opt.reduced){
   const rel=camera.position.clone().sub(look);rel.applyAxisAngle(up,-pointer.sx*.044);
   const side=new THREE.Vector3().crossVectors(up,rel).normalize();rel.applyAxisAngle(side,pointer.sy*.026);camera.position.copy(look).add(rel);
  }
  camera.lookAt(look);
 }
 // archive camera: under the roof → below the beams → down the aisle → the figure on the ladder → into the chest
 // (SPACE-R1-ARCHIVE §3). Catmull–Rom through the Blender shot list, constant speed per segment.
 let archCam:((p:number)=>void)|null=null;
 if(arch){
  // intro2: … down the aisle → the climber on the ladder → down to the floor-sitter right of it → into the chest (I-5)
  let K=(intro2?['s1_top','s2_beams','s3_aisle','i2_climb','i3_floor']:['s1_top','s2_beams','s3_aisle','s4_person']).map(k=>arch.shot(k));
  // D-190 첫 화면 = 실험실 배경의 하강 장면(labBackdrop c3, 사용자 「실험실의 스크롤 애니메이션은 렉이 없었으니 그 장면 그대로」):
  // 첫 구간(PV0 → PV1)은 c3 경로 u 0.61 → 0.80(실험실 배경이 쓰는 0.61–0.88의 앞부분), 이어서 고정 애니메이션이 사다리의 사람 → 바닥의 사람 → 가슴으로
  const C3=[{pos:new THREE.Vector3(-.2,3.0,1.6),look:new THREE.Vector3(.4,1.4,-4.3),fov:44},{pos:new THREE.Vector3(.3,2.5,-.6),look:new THREE.Vector3(.35,1.8,-4.3),fov:50},{pos:new THREE.Vector3(.3,.95,-1.0),look:new THREE.Vector3(.35,.9,-4.3),fov:50}];
  const c3P=new THREE.CatmullRomCurve3(C3.map(k=>k.pos),false,'centripetal'),c3L=new THREE.CatmullRomCurve3(C3.map(k=>k.look),false,'centripetal'),U0=.61,U1=.8;
  if(NEW&&intro2)K=[{pos:c3P.getPoint(U1),look:c3L.getPoint(U1),fov:50},...['i2_climb','i3_floor'].map(k=>arch.shot(k))];
  const yaw=.6,dEnd=.62,rightE=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const endPos=arch.heart.clone().add(new THREE.Vector3(Math.sin(yaw)*dEnd,.05,Math.cos(yaw)*dEnd));
  const posC=new THREE.CatmullRomCurve3([...K.map(k=>k.pos),endPos],false,'centripetal');
  const lookPts=[...K.map(k=>k.look),arch.heart.clone()];
  const lookC=new THREE.CatmullRomCurve3(lookPts,false,'centripetal');
  const fovs=[...K.map(k=>k.fov),25],knots=NEW&&intro2?[PV1,.46,.57,.72]:intro2?[.25,.31,.38,.46,.57,.72]:[.25,.33,.45,.55,.72];
  const lk=new THREE.Vector3();
  archCam=(pp:number)=>{
   if(NEW&&intro2&&pp<knots[0]){const u=U0+(U1-U0)*clamp((pp-PV0)/(PV1-PV0));camera.position.copy(c3P.getPoint(u));lk.copy(c3L.getPoint(u));
    const f=u*(C3.length-1),i=Math.min(C3.length-2,Math.floor(f)),fv=C3[i].fov+(C3[i+1].fov-C3[i].fov)*(f-i);if(Math.abs(camera.fov-fv)>1e-3){camera.fov=fv;camera.updateProjectionMatrix();}}
   else if(pp<knots[0]){camera.position.copy(A_POS);lk.copy(A_LOOK);if(camera.fov!==25){camera.fov=25;camera.updateProjectionMatrix();}}
   else{
    let i=0;while(i<knots.length-2&&pp>knots[i+1])i++;
    const f=clamp((pp-knots[i])/(knots[i+1]-knots[i])),u=(i+(i===knots.length-2?out2(f):f))/(knots.length-1);
    camera.position.copy(posC.getPoint(u));lk.copy(lookC.getPoint(u));
    // last segment: slide the look target right so the heart lands on the left third (wave stage on the right)
    if(i===knots.length-2){const off=.42*dEnd*Math.tan(THREE.MathUtils.degToRad(12.5))*camera.aspect;lk.addScaledVector(rightE,off*out2(f));}
    const fv=fovs[i]+(fovs[i+1]-fovs[i])*f;if(Math.abs(camera.fov-fv)>1e-3){camera.fov=fv;camera.updateProjectionMatrix();}
   }
   if(!opt.reduced){const rel=camera.position.clone().sub(lk);rel.applyAxisAngle(up,-pointer.sx*.03);
    const side=new THREE.Vector3().crossVectors(up,rel).normalize();rel.applyAxisAngle(side,pointer.sy*.018);camera.position.copy(lk).add(rel);}
   camera.lookAt(lk);
  };
 }
 const proj=new THREE.Vector3();
 const toScreen=(v:THREE.Vector3)=>{proj.copy(v).project(camera);return{x:(proj.x+1)/2*W,y:(1-proj.y)/2*H};};

 // title: centred headline → small persistent label at the top left
 function titleAt(k:number){
  const e=inOut(k),el=dom.title;if(titleW<0||OFF('icache')){titleW=el.offsetWidth;titleH=el.offsetHeight;}const w=titleW,h=titleH;   // D-190: 크기는 창이 바뀔 때만 읽는다(매 프레임 읽으면 스타일 쓰기 뒤 레이아웃 강제)
  const x0=(W-w)/2,y0=H*.12,x1=W*.035,y1=H*.045,s=1-.64*e;
  el.style.transform=`translate(${x0+(x1-x0)*e}px,${y0+(y1-y0)*e}px) scale(${s})`;
  const small=el.firstElementChild as HTMLElement|null;if(small)small.style.opacity=String(1-e);   // the eyebrow is unreadable once shrunk
 }

 const state={get mode(){return mode;},p:0,t:0,frame:0,headAbs:0,heart:{V:0,flash:0},wave:wave as Wave,get mix(){return mix.value;},get label(){return labelState.current;}};
 let raf=0,disposed=false,shaftA=0,archShaft=0;
 function frame(dt:number,draw=true){
  const t=clock();
  if(opt.frozenP!==null)p=opt.frozenP;
  else if(!NEW)p+=(pRaw-p)*damp(dt,.33);
  else{
   const now=performance.now()/1000;
   if(mode==='first'&&pRaw>=FIRST_S-1e-3){mode='auto';modeT0=now;modeP0=p;lenis?.stop();lockAt(FIRST_S);}
   else if(mode==='wave'&&pRaw<FIRST_S-.01){mode='back';modeT0=now;modeP0=p;lenis?.stop();}
   if(mode==='auto'){const k=clamp((now-modeT0)/(opt.reduced?2:AUTO_S));p=modeP0+(PVA-modeP0)*(.5-.5*Math.cos(Math.PI*k));if(k>=1){mode='wave';lockAt(FIRST_S);lenis?.start();}}
   else if(mode==='back'){const k=clamp((now-modeT0)/BACK_S);p=modeP0+(PV1-modeP0)*(.5-.5*Math.cos(Math.PI*k));if(k>=1){mode='first';lockAt(FIRST_S-.02);lenis?.start();}}
   else{const want=mode==='first'?PV0+(PV1-PV0)*clamp(pRaw/FIRST_S):PVA+(1-PVA)*clamp((pRaw-FIRST_S)/(1-FIRST_S));p+=(want-p)*damp(dt,.33);}
  }
  const firstK=NEW?clamp((p-PV0)/(PV1-PV0)):seg(p,...MAP.title);   // D-190: 제목 · 첫 안내는 첫 구간 진행으로
  state.p=p;state.t=t;state.frame++;
  pointer.sx+=(pointer.x-pointer.sx)*damp(dt,.35);pointer.sy+=(pointer.y-pointer.sy)*damp(dt,.35);
  const ph=beatPhase(L,data.fs,t);

  // globe (REF-001): rotation base − π/1.4 → base − π/5 over the pin, scale 1.3 → 0.52 (power2.out), fade
  spinVel*=Math.pow(.92,60*dt);spinExtra+=spinVel*dt;
  const gp=seg(p,...MAP.globe),gs=out2(seg(p,...MAP.globeScale));
  const gScale=1.3+(.52-1.3)*gs,gOp=globe?1-out2(seg(p,...MAP.globeFade)):0;
  if(globe){globe.spin.rotation.y=-Math.PI/1.4+(Math.PI/1.4-Math.PI/5)*gp+t*.025+spinExtra;globe.group.scale.setScalar(gScale);
   globe.uniforms.uOpacity.value=gOp;globe.group.visible=gOp>.002;
   globe.uniforms.uPulse.value=.07*Math.exp(-ph.sincePrev/.18);globe.uniforms.uCloudShift.value=t*.0006;}
  bloom.strength=.55-.3*gOp;bloom.radius=.35-.25*gOp;   // REF-001's limb glow is thin: the white January polar band must not bloom into a grey haze

  // rim line → body outline morph (M2)
  const rimA=arch?0:seg(p,...MAP.rim)*(1-(style==='v2'?seg(p,.39,.46):seg(p,...MAP.lineOut)));   // v2: the outline hands over to the scan; archive: no morph line
  const circR=gScale*1.04*1.035;
  figure.setMorph(seg(p,...MAP.morph),{cx:0,cy:-1.32,r:circR},rimA);
  // body + heart
  const cam=seg(p,...MAP.cam);
  let bodyA:number;
  if(arch){
   // archive: scan once the figure is in view down the aisle; rings fade as the camera enters the chest
   const sk=intro2?seg(p,.52,.585):seg(p,.45,.54),bu=figure.bodyMat.uniforms,c2=intro2?seg(p,.58,.72):seg(p,.55,.72);
   bu.uScan.value=(1-inOut(sk))*(scanTop+.04)-.02;bu.uScanOn.value=sk>0&&sk<1?1:Math.max(0,1-(sk-1)*20);
   bodyA=(sk>0?1:0)*(1-.85*THREE.MathUtils.smoothstep(c2,.15,.75))*(1-THREE.MathUtils.smoothstep(c2,.7,.95));
   if(climber){
    // I-5 ① appears top-down while the camera comes down the aisle, ② vanishes from the top (the reverse) as the camera
    // moves down to the floor; then ③ the floor-sitter appears with the electrodes (sk above)
    const cin=seg(p,.37,.44),cout=seg(p,.475,.535),cu=climber.bodyMat.uniforms,top=climbTop+.04;
    if(cout>0){cu.uScanDir.value=-1;cu.uScan.value=top-inOut(cout)*(top+.02);cu.uScanOn.value=cout<1?1:0;}
    else{cu.uScanDir.value=1;cu.uScan.value=(1-inOut(cin))*top-.02;cu.uScanOn.value=cin>0&&cin<1?1:0;}
    climber.setBodyOpacity(cin>0&&cout<1?1:0);
   }
   // C3: breath only — a slow cycle (~4 s) unrelated to the beat, small amplitude; grip stays 0 in the intro (?grip=1 checks it)
   figure.setBreath(opt.reduced?0:.35*(.5-.5*Math.cos(2*Math.PI*t/4)));
   // C5: clean flow once the person is revealed (p ≥ .45), slow; the noise staging belongs to the Story (P5)
   rig?.setPerson(Math.min(1,bodyA*1.4));rig?.setFlow(opt.signal?1:inOut(intro2?seg(p,.56,.63):seg(p,.47,.56)),.6);rig?.update(t);
  }else if(style==='v2'){
   // H3: the scan line runs head → feet over the body segment; rings stay, thinning out as the camera dives in
   const sk=seg(p,...MAP.body),bu=figure.bodyMat.uniforms;
   bu.uScan.value=(1-inOut(sk))*(fig.height+.04)-.02;bu.uScanOn.value=sk>0&&sk<1?1:Math.max(0,1-(sk-1)*20);
   bodyA=(sk>0?1:0)*(1-.85*THREE.MathUtils.smoothstep(cam,.15,.75))*(1-THREE.MathUtils.smoothstep(cam,.7,.95));   // gone before the wave stage
  }else bodyA=seg(p,...MAP.body)*(1.7-.7*seg(p,.5,.6))*(1-.95*THREE.MathUtils.smoothstep(cam,.1,.8));   // brighter while it takes over from the neon line
  figure.setBodyOpacity(bodyA);
  const spaceA=seg(p,.33,.42)*(1-THREE.MathUtils.smoothstep(cam,.3,.85));
  if(space)space.set(spaceA,ph,1,t,spaceA*(1-THREE.MathUtils.smoothstep(cam,.1,.4)));   // the lamp leaves before the orbit shows it beside the head
  if(reflection)reflection.group.visible=spaceA>.002;
  shaftA=spaceA*(1-THREE.MathUtils.smoothstep(cam,.15,.6));
  grade.uniforms.uSpace.value=spaceA;grade.uniforms.uTime.value=opt.frozenT!==null?0:(state.frame%97)*.13;
  const heartA=arch?(intro2?seg(p,.56,.62):seg(p,.48,.56)):seg(p,...MAP.heart);figure.heartMat.uniforms.uOpacity.value=heartA*1.6;figure.heartMesh.visible=heartA>.002;
  figure.beat(ph,heartA>0?1:0);
  state.heart.V=figure.heartMat.uniforms.uV.value;state.heart.flash=figure.heartMat.uniforms.uFlash.value;
  if(arch){
   const aF=(NEW?DIM+(1-DIM)*seg(p,PV1,.4):seg(p,.25,.31))*(1-.88*seg(p,.64,.73));   // D-190: 첫 화면은 어둡게(?introdim=, 기본 .55), 내려가며 원래 밝기
   arch.setFade(aF);rig?.setFade(aF);if(OFF('idust'))arch.dust.visible=false;archShaft=aF*(1-seg(p,.6,.7));
   grade.uniforms.uSpace.value=aF;if(globe)globe.group.visible=globe.group.visible&&p<.3;
   archCam!(p);
   // ?shot=<manifest shot>: verification only — the Blender still's camera, room fully faded in (stills vs web)
   // ?cam=x,y,z,lx,ly,lz,vfov (three frame): verification only — any viewpoint of the room (2026-10-18 backdrop viewpoint survey)
   const qc=opt.cam?.split(',').map(Number),k=qc&&qc.length>=7?{pos:new THREE.Vector3(qc[0],qc[1],qc[2]),look:new THREE.Vector3(qc[3],qc[4],qc[5]),fov:qc[6]}:opt.shot&&arch.manifest.shots[opt.shot]?arch.shot(opt.shot):null;
   if(k){arch.setFade(1);rig?.setFade(1);archShaft=1;
    camera.position.copy(k.pos);if(camera.fov!==k.fov){camera.fov=k.fov;camera.updateProjectionMatrix();}camera.lookAt(k.look);}
  }else cameraAt(cam);

  // W4: arm at the gate, fire a pulse on the next R, land it on the sweep head at the following R
  const waveA=seg(p,...MAP.waveFade);
  if(p>=GATE_WAVE&&wave.state==='off'){const n1=ph.untilNext<.08?beatPhase(L,data.fs,ph.next+1e-3).next:ph.next;wave.t0=n1;wave.t1=beatPhase(L,data.fs,n1+1e-3).next;
   wave.start=Math.floor((opt.reduced?wave.t0:wave.t1-.05)*data.fs+1e-6);wave.state='flying';}
  if(waveA<=0&&p<GATE_WAVE&&wave.state!=='off'){wave.state='off';wave.start=null;mix.reset();}
  if(wave.state==='flying'&&t>=wave.t1)wave.state='on';
  const headAbs=Math.floor(t*data.fs+1e-6);state.headAbs=headAbs;
  const hs=toScreen(H3);
  // D-055: the blend follows the scroll once the trace is running (replaces T2's quarter per R peak)
  mix.update(wave.state==='on'?seg(p,...MAP.mix):0,dt,opt.reduced);
  const enterA=seg(p,...MAP.enter);
  const v:SweepView={t,startAbs:wave.start,mix:mix.value,flash:opt.reduced?0:mix.flash,gridAlpha:enterA,alpha:wave.state==='off'?0:waveA,reduced:opt.reduced,ring:null,comet:null};
  if(wave.state==='flying'&&!opt.reduced&&t>=wave.t0){
   const k=clamp((t-wave.t0)/(wave.t1-wave.t0)),a1=Math.floor(wave.t1*data.fs+1e-6);
   v.ring={x:hs.x,y:hs.y,r:30+(t-wave.t0)*420,a:.85*Math.exp(-(t-wave.t0)/.32)*waveA};
   const trace=v.mix<.5?data.input:data.output;
   v.comet={x0:hs.x,y0:hs.y,x1:sweep.slotX(a1),y1:sweep.yOf(valueAtAbs(trace,a1)),k,a:waveA};
  }
  if(draw)sweep.draw(v);

  // DOM
  titleAt(firstK);
  dom.sub.style.opacity=String(1-(NEW?clamp(firstK/.4):seg(p,.015,.07)));{const want=performance.now()-introT0>2000&&(NEW?mode==='first'&&firstK<.05:p<.02)&&!(opt.frozenP!==null&&opt.frozenP>=(NEW?PV0+.003:.02))?1:0;firstA+=(want-firstA)*damp(dt,want?.3:.06);   // 2026-11-10: first-screen wheel hint, 2 s after entry, gone on the first scroll
   dom.hint.style.opacity=(firstA*.85).toFixed(3);dom.hint.querySelector('.it-wheelhint')?.classList.toggle('run',firstA>.02);}
  if(hintEl){const want=wave.state==='on'&&p>=.8&&p<.95&&performance.now()-lastInput>800?1:0;   // 2026-11-10 user 「나타나지 않았어」: from the wave's entry, 0.8 s idle, brighter
   hintA+=(want-hintA)*damp(dt,want?.35:.1);hintEl.style.opacity=(hintA*.85).toFixed(3);
   if(want&&!hintEl.classList.contains('run'))hintEl.classList.add('run');else if(!want&&hintA<.02&&hintEl.classList.contains('run'))hintEl.classList.remove('run');}
  // P1: label block (0.85) arrives first, wave stage (1.45) starts lower and overtakes; both settle at q = 1
  const q=enterA,labA=seg(p,MAP.enter[0],MAP.enter[0]+.06);
  dom.labels.style.opacity=String(labA);dom.labels.style.transform=`translateY(${((1-q)*SPEED.label*ENTER_D*H).toFixed(1)}px)`;
  dom.sweepWrap.style.transform=`translateY(${((1-q)*SPEED.wave*ENTER_D*H).toFixed(1)}px)`;
  dom.grid.style.opacity=String(q);dom.scale.style.opacity=String(q*.9);
  // L1: the current tier is filled with its bar grown; the other is an outline (REF-007 EFX-007-01)
  const cur=mix.value>.999?'out':'in';
  if(cur!==labelState.current){labelState.current=cur;labelState.handoff=t;
   dom.labelIn.classList.toggle('is-current',cur==='in');dom.labelOut.classList.toggle('is-current',cur==='out');}
  if(t<labelState.handoff)labelState.handoff=t;
  const hk=cur==='out'?clamp((t-labelState.handoff)/.35):0;
  const mono=cur==='out'?(opt.reduced||hk>=1?outFinal:scrambled(outFinal,hk,Math.floor(t*30))):outBase;
  if(dom.outMono.textContent!==mono)dom.outMono.textContent=mono;
  const filled=Math.floor(mix.value*4+1e-6);dom.steps.forEach((el,i)=>el.classList.toggle('on',i<filled));   // 25/50/75/100 %
  // L2: annotation pinned to an R sample that is 0.35–1.9 s old (stays with its sample until the sweep erases it)
  let annA=0;
  if(wave.state==='on'&&wave.start!==null){
   let r=ph.prev,pick=NaN;
   for(let k=0;k<5;k++){const age=t-r,abs=Math.floor(r*data.fs+1e-6);if(abs<wave.start)break;if(age>=.35&&age<=1.9){pick=abs;break;}r=beatPhase(L,data.fs,r-1e-3).prev;}
   if(!Number.isNaN(pick)){
    if(pick!==labelState.annAbs){labelState.annAbs=pick;dom.ann.classList.remove('flip');void dom.ann.offsetWidth;dom.ann.classList.add('flip');}
    const x=sweep.slotX(pick),trace=mix.value<.5?data.input:data.output,y=sweep.yOf(valueAtAbs(trace,pick)),top=sweep.box.t+6;
    dom.ann.style.transform=`translate(${x.toFixed(1)}px,${top.toFixed(1)}px)`;dom.ann.style.setProperty('--h',Math.max(0,y-top-6).toFixed(1)+'px');annA=waveA;
   }
  }
  dom.ann.style.opacity=String(annA);
  const endA=seg(p,...MAP.end);dom.end.style.opacity=String(endA);dom.end.style.pointerEvents=endA>.5?'auto':'none';
  if(!opt.reduced)dom.parallax.forEach((el,i)=>{const d=i===0?6:3;el.style.translate=`${(-pointer.sx*d).toFixed(2)}px ${(-pointer.sy*d*.6).toFixed(2)}px`;});

  if(draw){shafts?.render(shaftA);arch?.update(t,state.frame,camera,(composer.readBuffer as THREE.WebGLRenderTarget).depthTexture,archShaft);composer.render(dt);screenFluid?.update(dt);}   // occlusion buffer after the camera update; D-167 fluid right after the 3D frame (it re-reads the canvases before they are presented)
 }
 let paused=false;
 // D-190 프레임 상한(?ifps=) · 측정(?introprof=1: 프레임별 CPU ms와 gl.finish 대기 ms) · FPS 표시(?fps=1)
 const glc=renderer.getContext(),prof:number[][]=[];if(PROF)(globalThis as unknown as {__introProf:number[][]}).__introProf=prof;
 let hud:HTMLDivElement|null=null,hudN=0,hudT=performance.now(),hudMs=0,lastDraw=0,acc=0;
 if(HUD){hud=document.createElement('div');hud.className='it-fpshud';document.body.appendChild(hud);}
 const tick=(_time:number,deltaMs:number)=>{if(disposed||paused)return;
  const now=performance.now();acc+=deltaMs;if(FPS_CAP>0&&now-lastDraw<1000/FPS_CAP-2)return;lastDraw=now;
  lenis?.raf(now);const c0=performance.now();frame(Math.min(.1,acc/1000||1/60));acc=0;const c1=performance.now();
  if(PROF){glc.finish();prof.push([c1-c0,performance.now()-c1,state.p,state.frame]);if(prof.length>4000)prof.shift();}
  if(hud){hudN++;hudMs+=c1-c0;if(now-hudT>=1000){hud.textContent=`${(hudN*1000/(now-hudT)).toFixed(0)} fps · CPU ${(hudMs/hudN).toFixed(1)} ms · ${mode}`;hudN=0;hudMs=0;hudT=now;}}};
 gsap.ticker.lagSmoothing(0);gsap.ticker.add(tick);

 return{
  state,lenis,arch,rig,figure,globe,climber,camera,
  renderOnce(draw=true){frame(1/60,draw);},
  pause(v:boolean){paused=v;},
  set(o:{p?:number,t?:number|null}){if(o.p!==undefined){opt.frozenP=o.p;p=o.p;}if(o.t!==undefined)frozenT=o.t;},
  scrollToEnd(){lenis?.scrollTo('bottom');},
  scrollTop(){lenis?.scrollTo(0,{immediate:true});lenis?.start();pRaw=0;p=NEW?PV0:0;mode='first';wave.state='off';wave.start=null;mix.reset();},
  dispose(){disposed=true;gsap.ticker.remove(tick);hud?.remove();cancelAnimationFrame(raf);lenis?.destroy();dom.wrapper.removeEventListener('wheel',onWheel);removeEventListener('keydown',onKey);screenFluid?.dispose();
   removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);removeEventListener('resize',resize);
   globe?.dispose();figure.dispose();climber?.dispose();space?.dispose();arch?.dispose();rig?.dispose();shafts?.dispose();reflection?.dispose();floorLm.dispose();[day,night,clouds,height].forEach(x=>x?.dispose());composer.dispose();renderer.dispose();},
 };
}
export type Intro=Awaited<ReturnType<typeof createIntro>>;
