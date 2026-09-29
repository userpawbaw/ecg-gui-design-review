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
import {createSweep,type SweepView} from './sweep';
import {beatPhase,type Loop} from './beats';

export type IntroData={fs:number,loop:Loop,input:Float32Array,output:Float32Array};
export type IntroDom={wrapper:HTMLElement,content:HTMLElement,gl:HTMLCanvasElement,sweep:HTMLCanvasElement,
 title:HTMLElement,noiseChars:HTMLElement[],sub:HTMLElement,hint:HTMLElement,labels:HTMLElement,labelIn:HTMLElement,labelOut:HTMLElement,
 scale:HTMLElement,end:HTMLElement,parallax:HTMLElement[]};
export type IntroOptions={reduced:boolean,frozenT:number|null,frozenP:number|null};

const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(p:number,a:number,b:number)=>clamp((p-a)/(b-a));
const inOut=(t:number)=>t<.5?2*t*t:1-(-2*t+2)**2/2;
const out2=(t:number)=>1-(1-t)**2;
const damp=(dt:number,tau:number)=>1-Math.exp(-dt/tau);        // frame-rate independent smoothing
export const GATE_WAVE=.735;
// scroll map (fraction of the whole intro). Globe segment follows REF-001 EFX-001-02 (rotation, shrink, fade).
export const MAP={title:[.015,.11],globe:[0,.3],globeScale:[.03,.3],globeFade:[.19,.27],rim:[.15,.21],morph:[.22,.39],
 body:[.36,.45],lineOut:[.42,.56],heart:[.38,.47],cam:[.52,.72],waveFade:[.72,.745],mix:[.79,.94],end:[.955,.99]} as const;
const SWEEP_COLORS={input:[255,188,121] as [number,number,number],output:[103,231,195] as [number,number,number]};

export async function createIntro(dom:IntroDom,data:IntroData,opt:IntroOptions){
 const urls={body:new URL('./assets/body.glb',import.meta.url).href,heart:new URL('./assets/heart.glb',import.meta.url).href,
  fig:new URL('./assets/figure.json',import.meta.url).href,day:new URL('./assets/earth_day.jpg',import.meta.url).href,
  night:new URL('./assets/earth_night.jpg',import.meta.url).href,clouds:new URL('./assets/earth_clouds.jpg',import.meta.url).href};
 // --- renderer (REF-001: ACES, exposure 1.16, pixel ratio capped) ---
 const renderer=new THREE.WebGLRenderer({canvas:dom.gl,antialias:true,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x000000,1);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(25,1,.02,60);
 const tl=new THREE.TextureLoader(),gl=new GLTFLoader();
 const tex=async(u:string,srgb=true)=>{const t=await tl.loadAsync(u);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=4;return t;};
 const geom=async(u:string)=>{const g=await gl.loadAsync(u);let out:THREE.BufferGeometry|null=null;g.scene.traverse(o=>{if((o as THREE.Mesh).isMesh&&!out)out=(o as THREE.Mesh).geometry;});if(!out)throw Error('no mesh in '+u);return out as THREE.BufferGeometry;};
 const [day,night,clouds,bodyGeo,heartGeo,fig]=await Promise.all([tex(urls.day),tex(urls.night),tex(urls.clouds,false),geom(urls.body),geom(urls.heart),fetch(urls.fig).then(r=>r.json() as Promise<FigureData>)]);
 const globe=createGlobe({day,night,clouds});scene.add(globe.group);
 const figure=createFigure(bodyGeo,heartGeo,fig);scene.add(figure.group,figure.line);
 // --- post: bloom only on bright parts (threshold), never on the Canvas 2D data layer ---
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.35,.78);composer.addPass(bloom);composer.addPass(new OutputPass());
 const sweep=createSweep(dom.sweep,{fs:data.fs,loop:data.loop,input:{values:data.input,color:SWEEP_COLORS.input},output:{values:data.output,color:SWEEP_COLORS.output},mvPerBox:3.6});

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
 const box=()=>({l:.47*W,r:.93*W,t:.29*H,b:.69*H});
 function resize(){
  W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio||1,1.25);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);bloom.resolution.set(W*pr/2,H*pr/2);
  camera.aspect=W/H;camera.updateProjectionMatrix();figure.setResolution(W*pr,H*pr);
  const b=box();sweep.resize(b);
  Object.assign(dom.labels.style,{left:b.l+'px',top:(b.t-44)+'px'});
  Object.assign(dom.scale.style,{left:b.l+'px',top:(b.b+16)+'px'});
  dom.scale.style.setProperty('--sec',((b.r-b.l)/2.5)+'px');dom.scale.style.setProperty('--mv',((b.b-b.t)/3.6)+'px');
 }
 resize();addEventListener('resize',resize);

 // --- clock + W4 state ---
 const t0=performance.now();let frozenT=opt.frozenT;
 const clock=()=>frozenT??(performance.now()-t0)/1000;
 type Wave={state:'off'|'flying'|'on',t0:number,t1:number,start:number|null};
 const wave:Wave={state:'off',t0:0,t1:0,start:null};
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
 const proj=new THREE.Vector3();
 const toScreen=(v:THREE.Vector3)=>{proj.copy(v).project(camera);return{x:(proj.x+1)/2*W,y:(1-proj.y)/2*H};};

 // title: centred headline → small persistent label at the top left
 function titleAt(k:number){
  const e=inOut(k),el=dom.title;const w=el.offsetWidth,h=el.offsetHeight;
  const x0=(W-w)/2,y0=H*.12,x1=W*.035,y1=H*.045,s=1-.64*e;
  el.style.transform=`translate(${x0+(x1-x0)*e}px,${y0+(y1-y0)*e}px) scale(${s})`;
  const small=el.firstElementChild as HTMLElement|null;if(small)small.style.opacity=String(1-e);   // the eyebrow is unreadable once shrunk
 }

 const state={p:0,t:0,frame:0,headAbs:0,heart:{V:0,flash:0},wave:wave as Wave};
 let raf=0,disposed=false;
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
  const rimA=seg(p,...MAP.rim)*(1-seg(p,...MAP.lineOut));
  const circR=gScale*1.04*1.035;
  figure.setMorph(seg(p,...MAP.morph),{cx:0,cy:-1.32,r:circR},rimA);
  // body + heart
  const cam=seg(p,...MAP.cam);
  const bodyA=seg(p,...MAP.body)*(1.7-.7*seg(p,.5,.6))*(1-.95*THREE.MathUtils.smoothstep(cam,.1,.8));   // brighter while it takes over from the neon line
  figure.bodyMat.uniforms.uOpacity.value=bodyA;figure.group.children[0].visible=bodyA>.002;
  const heartA=seg(p,...MAP.heart);figure.heartMat.uniforms.uOpacity.value=heartA*1.6;figure.heartMesh.visible=heartA>.002;
  figure.beat(ph,heartA>0?1:0);
  state.heart.V=figure.heartMat.uniforms.uV.value;state.heart.flash=figure.heartMat.uniforms.uFlash.value;
  cameraAt(cam);

  // W4: arm at the gate, fire a pulse on the next R, land it on the sweep head at the following R
  const waveA=seg(p,...MAP.waveFade);
  if(p>=GATE_WAVE&&wave.state==='off'){const n1=ph.untilNext<.08?beatPhase(L,data.fs,ph.next+1e-3).next:ph.next;wave.t0=n1;wave.t1=beatPhase(L,data.fs,n1+1e-3).next;
   wave.start=Math.floor((opt.reduced?wave.t0:wave.t1-.05)*data.fs+1e-6);wave.state='flying';}
  if(waveA<=0&&p<GATE_WAVE&&wave.state!=='off'){wave.state='off';wave.start=null;}
  if(wave.state==='flying'&&t>=wave.t1)wave.state='on';
  const headAbs=Math.floor(t*data.fs+1e-6);state.headAbs=headAbs;
  const hs=toScreen(H3);
  const v:SweepView={t,startAbs:wave.start,mix:inOut(seg(p,...MAP.mix)),alpha:wave.state==='off'?0:waveA,reduced:opt.reduced,ring:null,comet:null};
  if(wave.state==='flying'&&!opt.reduced&&t>=wave.t0){
   const k=clamp((t-wave.t0)/(wave.t1-wave.t0)),a1=Math.floor(wave.t1*data.fs+1e-6);
   v.ring={x:hs.x,y:hs.y,r:30+(t-wave.t0)*420,a:.85*Math.exp(-(t-wave.t0)/.32)*waveA};
   const trace=v.mix<.5?data.input:data.output;
   v.comet={x0:hs.x,y0:hs.y,x1:sweep.slotX(a1),y1:sweep.yOf(valueAtAbs(trace,a1)),k,a:waveA};
  }
  if(draw)sweep.draw(v);

  // DOM
  titleAt(seg(p,...MAP.title));
  const jitter=opt.reduced?0:1.7*(1-v.mix);
  dom.noiseChars.forEach((c,i)=>{const dx=Math.sin(t*41+i*1.7)*Math.sin(t*17.3+i*.6)*jitter,dy=Math.sin(t*33.1+i*2.3)*Math.cos(t*21.7)*jitter*.8;c.style.transform=`translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`;});
  dom.sub.style.opacity=String(1-seg(p,.015,.07));dom.hint.style.opacity=String(1-seg(p,0,.035));
  const labA=wave.state==='on'?waveA:0;dom.labels.style.opacity=String(labA);dom.scale.style.opacity=String(labA*.8);
  dom.labelIn.style.opacity=String(1-v.mix);dom.labelOut.style.opacity=String(v.mix);
  const endA=seg(p,...MAP.end);dom.end.style.opacity=String(endA);dom.end.style.pointerEvents=endA>.5?'auto':'none';
  if(!opt.reduced)dom.parallax.forEach((el,i)=>{const d=i===0?6:3;el.style.translate=`${(-pointer.sx*d).toFixed(2)}px ${(-pointer.sy*d*.6).toFixed(2)}px`;});

  if(draw)composer.render(dt);
 }
 let paused=false;
 const tick=(_time:number,deltaMs:number)=>{if(disposed||paused)return;lenis?.raf(performance.now());frame(Math.min(.1,deltaMs/1000||1/60));};
 gsap.ticker.lagSmoothing(0);gsap.ticker.add(tick);

 return{
  state,lenis,
  renderOnce(draw=true){frame(1/60,draw);},
  pause(v:boolean){paused=v;},
  set(o:{p?:number,t?:number|null}){if(o.p!==undefined){opt.frozenP=o.p;p=o.p;}if(o.t!==undefined)frozenT=o.t;},
  scrollToEnd(){lenis?.scrollTo('bottom');},
  scrollTop(){lenis?.scrollTo(0,{immediate:true});pRaw=0;p=0;wave.state='off';wave.start=null;},
  dispose(){disposed=true;gsap.ticker.remove(tick);cancelAnimationFrame(raf);lenis?.destroy();dom.wrapper.removeEventListener('wheel',onWheel);
   removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);removeEventListener('resize',resize);
   globe.dispose();figure.dispose();[day,night,clouds].forEach(x=>x.dispose());composer.dispose();renderer.dispose();},
 };
}
export type Intro=Awaited<ReturnType<typeof createIntro>>;
