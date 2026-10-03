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
import {createSpace,createShafts,createGrade} from './space';
import {createArchive} from './archive';
import {createSignalRig,SIGNAL_CLEAN,SIGNAL_NOISE,SIGNAL_OFF,type SignalState} from './signalRig';
import {createSweep,type SweepView} from './sweep';
import {beatPhase,type Loop} from './beats';
import {createGrid,createBeatMix,mvPerBoxFor,scrambled} from './waveUi';

export type IntroData={fs:number,loop:Loop,input:Float32Array,output:Float32Array,metrics:{snrIn:number,snrOut:number,cc:number}};
export type IntroDom={wrapper:HTMLElement,content:HTMLElement,gl:HTMLCanvasElement,sweep:HTMLCanvasElement,
 title:HTMLElement,noiseChars:HTMLElement[],sub:HTMLElement,hint:HTMLElement,labels:HTMLElement,labelIn:HTMLElement,labelOut:HTMLElement,outMono:HTMLElement,steps:HTMLElement[],
 scale:HTMLElement,grid:HTMLCanvasElement,ann:HTMLElement,sweepWrap:HTMLElement,end:HTMLElement,parallax:HTMLElement[]};
export type IntroOptions={reduced:boolean,frozenT:number|null,frozenP:number|null,look?:'v1'|'v2'|'archive',shot?:string|null,signal?:SignalState|null,grip?:number};

const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(p:number,a:number,b:number)=>clamp((p-a)/(b-a));
const inOut=(t:number)=>t<.5?2*t*t:1-(-2*t+2)**2/2;
const out2=(t:number)=>1-(1-t)**2;
const damp=(dt:number,tau:number)=>1-Math.exp(-dt/tau);        // frame-rate independent smoothing
export const GATE_WAVE=.8;
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
  night:new URL('./assets/earth_night.jpg',import.meta.url).href,clouds:new URL('./assets/earth_clouds.jpg',import.meta.url).href,
  floor:new URL('./assets/floor_light.png',import.meta.url).href,seatedV3:new URL('./assets/body_seated_v3.glb',import.meta.url).href,
  rig:new URL('./assets/rig_v3.glb',import.meta.url).href};
 // --- renderer (REF-001: ACES, exposure 1.16, pixel ratio capped) ---
 const renderer=new THREE.WebGLRenderer({canvas:dom.gl,antialias:true,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x000000,1);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(25,1,.02,60);
 const tl=new THREE.TextureLoader(),gl=new GLTFLoader();
 const tex=async(u:string,srgb=true)=>{const t=await tl.loadAsync(u);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=4;return t;};
 const geomMorph=async(u:string)=>{const g=await gl.loadAsync(u);let out:THREE.Mesh|null=null;g.scene.traverse(o=>{if((o as THREE.Mesh).isMesh&&!out)out=o as THREE.Mesh;});if(!out)throw Error('no mesh in '+u);
  const m=out as THREE.Mesh,d=m.morphTargetDictionary??{};return{geo:m.geometry,morph:Object.keys(d).sort((a,b)=>d[a]-d[b])};};
 const geom=async(u:string)=>(await geomMorph(u)).geo;
 const [day,night,clouds,bodyGeo,heartGeo,fig,floorLm]=await Promise.all([tex(urls.day),tex(urls.night),tex(urls.clouds,false),geom(urls.body),geom(urls.heart),fetch(urls.fig).then(r=>r.json() as Promise<FigureData>),tex(urls.floor,false)]);
 const globe=createGlobe({day,night,clouds});scene.add(globe.group);
 const style=opt.look??'archive';   // D-046 archive is the default (brief 1 T9); ?look=v2 keeps the grid world
 // D-046: the ECG record archive (baked room + shafts + dust); D-048: figure v3 (3-lead) seated mid-ladder, H5 frosted body
 const arch=style==='archive'?await createArchive():null;
 const seated=arch?await geomMorph(urls.seatedV3):null;
 const figure=createFigure(seated?seated.geo:bodyGeo,heartGeo,fig,arch?'h5':style==='v1'?'v1':'v2',seated?.morph??[]);scene.add(figure.group,figure.line);
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
 }
 // electrodes, leads, trunk, comm cable, power line and the inside-body paths with the flowing dash shader (C4)
 const rig=arch?await createSignalRig(urls.rig,arch,{uScan:figure.bodyMat.uniforms.uScan,uFeet:figure.bodyMat.uniforms.uFeet}):null;
 if(rig){scene.add(rig.group);rig.setSignal(opt.signal==='noise'?SIGNAL_NOISE:opt.signal==='off'?SIGNAL_OFF:SIGNAL_CLEAN);}
 const space=style==='v2'?createSpace(floorLm):null;if(space)scene.add(space.group);
 const reflection=style==='v2'?figure.mirror():null;if(reflection)scene.add(reflection.group);
 // --- post: bloom only on bright parts (threshold), never on the Canvas 2D data layer ---
 // P2: light shafts (scene-linear, before bloom) and grade/vignette/grain (after the output transform)
 // archive: the composer's buffers carry depth so the shaft pass can ray-march to the scene surface
 const composer=arch?new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)})):new EffectComposer(renderer);
 composer.addPass(new RenderPass(scene,camera));
 if(arch)composer.addPass(arch.vol);
 const shafts=space?createShafts(renderer,camera,[figure.group.children[0],figure.heartMesh]):null;if(shafts)composer.addPass(shafts.pass);
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.35,.78);composer.addPass(bloom);composer.addPass(new OutputPass());
 const grade=createGrade();composer.addPass(grade);
 const grid=createGrid(dom.grid);
 const sweep=createSweep(dom.sweep,{gridHot:grid.hot,fs:data.fs,loop:data.loop,input:{values:data.input,color:SWEEP_COLORS.input,glow:.45,core:.78,white:.35},output:{values:data.output,color:SWEEP_COLORS.output},mvPerBox:3.6});

 // --- input: Lenis smooth scroll + scrub smoothing on top (REF-001: Lenis 1.6 s + scrub 1) ---
 const lenis=opt.frozenP===null?new Lenis({wrapper:dom.wrapper,content:dom.content,duration:opt.reduced?.2:1.6,wheelMultiplier:1.1,autoRaf:false}):null;
 let pRaw=opt.frozenP??0,p=pRaw,spinVel=0,spinExtra=0;
 lenis?.on('scroll',(e:Lenis)=>{pRaw=e.limit>0?e.scroll/e.limit:0;});
 const onWheel=(e:WheelEvent)=>{if(p<MAP.globe[1])spinVel=clamp(spinVel+e.deltaY*.0015,-.8,.8);};   // V1: wheel impulse spins the globe
 dom.wrapper.addEventListener('wheel',onWheel,{passive:true});
 const pointer={x:0,y:0,sx:0,sy:0};
 const onMove=(e:PointerEvent)=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;};
 const onLeave=()=>{pointer.x=0;pointer.y=0;};
 addEventListener('pointermove',onMove);document.addEventListener('pointerleave',onLeave);

 // --- layout ---
 let W=0,H=0;
 const box=()=>({l:.47*W,r:.93*W,t:.34*H,b:.72*H});
 function resize(){
  W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio||1,1.25);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);bloom.resolution.set(W*pr/2,H*pr/2);
  shafts?.setSize(W*pr,H*pr);space?.setPx(H,pr);arch?.setPx(H,pr);grade.uniforms.uAspect.value=W/H;
  camera.aspect=W/H;camera.updateProjectionMatrix();figure.setResolution(W*pr,H*pr);
  const b=box(),mv=mvPerBoxFor(b,2.5);sweep.resize(b,mv);grid.resize(b,2.5,mv);
  Object.assign(dom.labels.style,{left:b.l+'px',top:(H*.075)+'px'});
  Object.assign(dom.scale.style,{left:b.l+'px',top:(b.b+14)+'px',width:(b.r-b.l)+'px'});
 }
 resize();addEventListener('resize',resize);

 // --- clock + W4 state ---
 const t0=performance.now();let frozenT=opt.frozenT;
 const clock=()=>frozenT??(performance.now()-t0)/1000;
 type Wave={state:'off'|'flying'|'on',t0:number,t1:number,start:number|null};
 const wave:Wave={state:'off',t0:0,t1:0,start:null};
 const mix=createBeatMix(4);
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
  const K=['s1_top','s2_beams','s3_aisle','s4_person'].map(k=>arch.shot(k));
  const yaw=.6,dEnd=.62,rightE=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const endPos=arch.heart.clone().add(new THREE.Vector3(Math.sin(yaw)*dEnd,.05,Math.cos(yaw)*dEnd));
  const posC=new THREE.CatmullRomCurve3([...K.map(k=>k.pos),endPos],false,'centripetal');
  const lookPts=[...K.map(k=>k.look),arch.heart.clone()];
  const lookC=new THREE.CatmullRomCurve3(lookPts,false,'centripetal');
  const fovs=[...K.map(k=>k.fov),25],knots=[.25,.33,.45,.55,.72];
  const lk=new THREE.Vector3();
  archCam=(pp:number)=>{
   if(pp<knots[0]){camera.position.copy(A_POS);lk.copy(A_LOOK);if(camera.fov!==25){camera.fov=25;camera.updateProjectionMatrix();}}
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
  const e=inOut(k),el=dom.title;const w=el.offsetWidth,h=el.offsetHeight;
  const x0=(W-w)/2,y0=H*.12,x1=W*.035,y1=H*.045,s=1-.64*e;
  el.style.transform=`translate(${x0+(x1-x0)*e}px,${y0+(y1-y0)*e}px) scale(${s})`;
  const small=el.firstElementChild as HTMLElement|null;if(small)small.style.opacity=String(1-e);   // the eyebrow is unreadable once shrunk
 }

 const state={p:0,t:0,frame:0,headAbs:0,heart:{V:0,flash:0},wave:wave as Wave,get mix(){return mix.value;},get label(){return labelState.current;}};
 let raf=0,disposed=false,shaftA=0,archShaft=0;
 function frame(dt:number,draw=true){
  const t=clock();
  if(opt.frozenP===null)p+=(pRaw-p)*damp(dt,.33);else p=opt.frozenP;
  state.p=p;state.t=t;state.frame++;
  pointer.sx+=(pointer.x-pointer.sx)*damp(dt,.35);pointer.sy+=(pointer.y-pointer.sy)*damp(dt,.35);
  const ph=beatPhase(L,data.fs,t);

  // globe (REF-001): rotation base − π/1.4 → base − π/5 over the pin, scale 1.3 → 0.52 (power2.out), fade
  spinVel*=Math.pow(.92,60*dt);spinExtra+=spinVel*dt;
  const gp=seg(p,...MAP.globe),gs=out2(seg(p,...MAP.globeScale));
  globe.spin.rotation.y=-Math.PI/1.4+(Math.PI/1.4-Math.PI/5)*gp+t*.025+spinExtra;
  const gScale=1.3+(.52-1.3)*gs;globe.group.scale.setScalar(gScale);
  const gOp=1-out2(seg(p,...MAP.globeFade));globe.uniforms.uOpacity.value=gOp;globe.group.visible=gOp>.002;
  globe.uniforms.uPulse.value=.07*Math.exp(-ph.sincePrev/.18);          // G2: rim breathes with the record's R peaks
  globe.uniforms.uCloudShift.value=t*.0006;

  // rim line → body outline morph (M2)
  const rimA=arch?0:seg(p,...MAP.rim)*(1-(style==='v2'?seg(p,.39,.46):seg(p,...MAP.lineOut)));   // v2: the outline hands over to the scan; archive: no morph line
  const circR=gScale*1.04*1.035;
  figure.setMorph(seg(p,...MAP.morph),{cx:0,cy:-1.32,r:circR},rimA);
  // body + heart
  const cam=seg(p,...MAP.cam);
  let bodyA:number;
  if(arch){
   // archive: scan once the figure is in view down the aisle; rings fade as the camera enters the chest
   const sk=seg(p,.45,.54),bu=figure.bodyMat.uniforms,c2=seg(p,.55,.72);
   bu.uScan.value=(1-inOut(sk))*(scanTop+.04)-.02;bu.uScanOn.value=sk>0&&sk<1?1:Math.max(0,1-(sk-1)*20);
   bodyA=(sk>0?1:0)*(1-.85*THREE.MathUtils.smoothstep(c2,.15,.75))*(1-THREE.MathUtils.smoothstep(c2,.7,.95));
   // C3: breath only — a slow cycle (~4 s) unrelated to the beat, small amplitude; grip stays 0 in the intro (?grip=1 checks it)
   figure.setBreath(opt.reduced?0:.35*(.5-.5*Math.cos(2*Math.PI*t/4)));
   // C5: clean flow once the person is revealed (p ≥ .45), slow; the noise staging belongs to the Story (P5)
   rig?.setPerson(Math.min(1,bodyA*1.4));rig?.setFlow(opt.signal?1:inOut(seg(p,.47,.56)),.6);rig?.update(t);
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
  const heartA=arch?seg(p,.48,.56):seg(p,...MAP.heart);figure.heartMat.uniforms.uOpacity.value=heartA*1.6;figure.heartMesh.visible=heartA>.002;
  figure.beat(ph,heartA>0?1:0);
  state.heart.V=figure.heartMat.uniforms.uV.value;state.heart.flash=figure.heartMat.uniforms.uFlash.value;
  if(arch){
   const aF=seg(p,.25,.31)*(1-.88*seg(p,.64,.73));arch.setFade(aF);rig?.setFade(aF);archShaft=aF*(1-seg(p,.6,.7));
   grade.uniforms.uSpace.value=aF;globe.group.visible=globe.group.visible&&p<.3;
   archCam!(p);
   // ?shot=<manifest shot>: verification only — the Blender still's camera, room fully faded in (stills vs web)
   if(opt.shot&&arch.manifest.shots[opt.shot]){const k=arch.shot(opt.shot);arch.setFade(1);rig?.setFade(1);archShaft=1;
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
  // T2: scroll sets the target, R peaks release it a quarter at a time (only once the trace is running)
  mix.update(wave.state==='on'?inOut(seg(p,...MAP.mix)):0,ph.prev,t,opt.reduced);
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
  titleAt(seg(p,...MAP.title));
  const jitter=opt.reduced?0:1.7*(1-mix.value);
  dom.noiseChars.forEach((c,i)=>{const dx=Math.sin(t*41+i*1.7)*Math.sin(t*17.3+i*.6)*jitter,dy=Math.sin(t*33.1+i*2.3)*Math.cos(t*21.7)*jitter*.8;c.style.transform=`translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`;});
  dom.sub.style.opacity=String(1-seg(p,.015,.07));dom.hint.style.opacity=String(1-seg(p,0,.035));
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
  const filled=Math.round(mix.value*4);dom.steps.forEach((el,i)=>el.classList.toggle('on',i<filled));
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

  if(draw){shafts?.render(shaftA);arch?.update(t,state.frame,camera,(composer.readBuffer as THREE.WebGLRenderTarget).depthTexture,archShaft);composer.render(dt);}   // occlusion buffer after the camera update
 }
 let paused=false;
 const tick=(_time:number,deltaMs:number)=>{if(disposed||paused)return;lenis?.raf(performance.now());frame(Math.min(.1,deltaMs/1000||1/60));};
 gsap.ticker.lagSmoothing(0);gsap.ticker.add(tick);

 return{
  state,lenis,arch,rig,figure,
  renderOnce(draw=true){frame(1/60,draw);},
  pause(v:boolean){paused=v;},
  set(o:{p?:number,t?:number|null}){if(o.p!==undefined){opt.frozenP=o.p;p=o.p;}if(o.t!==undefined)frozenT=o.t;},
  scrollToEnd(){lenis?.scrollTo('bottom');},
  scrollTop(){lenis?.scrollTo(0,{immediate:true});pRaw=0;p=0;wave.state='off';wave.start=null;mix.reset();},
  dispose(){disposed=true;gsap.ticker.remove(tick);cancelAnimationFrame(raf);lenis?.destroy();dom.wrapper.removeEventListener('wheel',onWheel);
   removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);removeEventListener('resize',resize);
   globe.dispose();figure.dispose();space?.dispose();arch?.dispose();rig?.dispose();shafts?.dispose();reflection?.dispose();floorLm.dispose();[day,night,clouds].forEach(x=>x.dispose());composer.dispose();renderer.dispose();},
 };
}
export type Intro=Awaited<ReturnType<typeof createIntro>>;
