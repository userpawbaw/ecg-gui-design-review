import * as THREE from 'three';
import Lenis from 'lenis';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './style.css';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {createArchive} from '../../v2/src/story/intro/archive';
import {createSweep} from '../../v2/src/story/intro/sweep';
import {createGrid,mvPerBoxFor} from '../../v2/src/story/intro/waveUi';
import {detectR,makeLoop,beatPhase} from '../../v2/src/story/intro/beats';
import {decode} from '../../v2/src/engine';
import {createGrade} from '../../v2/src/story/intro/space';
import {createArrival} from './arrival';
import {createArrival as createLegacyArrival} from './arrival-legacy';
import {createNorthernArrival} from './arrival-north';
const $=(id:string)=>document.getElementById(id)!;
$('labels').querySelector('h2')!.textContent='잡음이 섞인 심전도';
$('labels').querySelector('small')!.textContent='MIXED INPUT · 0 dB / 2.5 s';
const ss=(a:number,b:number,x:number)=>{let v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v)};
const URLs={body:new URL('../../v2/src/story/intro/assets/a-climb/body_climb.glb',import.meta.url).href,
 heart:new URL('../../v2/src/story/intro/assets/heart.glb',import.meta.url).href,
 electrodes:new URL('../../v2/src/story/intro/assets/a-climb/electrodes_climb.glb',import.meta.url).href,
 manifest:new URL('../../v2/src/story/intro/assets/a-climb/manifest.json',import.meta.url).href};
async function start(){
const params=new URLSearchParams(location.search);
const full=params.get('stage')!=='room';
if(params.get('terrain')==='north'){$('title').style.maxWidth='310px';$('title').style.fontSize='clamp(36px,4.5vw,68px)';$('title').style.lineHeight='1.13';}
if(full)$('content').style.height='760vh';
const aa=params.get('aa')||'msaa';
const initialSteps=[48,64,96].includes(Number(params.get('steps')))?Number(params.get('steps')):96;
const grainStrength=THREE.MathUtils.clamp(Number(params.get('grain')??.35),0,1);
const glSamples=(gl:WebGL2RenderingContext)=>Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES) as Int32Array);
const renderer=new THREE.WebGLRenderer({canvas:$('gl') as HTMLCanvasElement,antialias:true,powerPreference:'high-performance'});
const gl=renderer.getContext(),supportedSamples=glSamples(gl);
const actualSamples=['msaa','hybrid'].includes(aa)?Math.max(0,...supportedSamples.filter(n=>n<=4)):0;
const timer=params.get('timing')==='1'?gl.getExtension('EXT_disjoint_timer_query_webgl2'):null;
const gpuPending:WebGLQuery[]=[],gpuTimes:number[]=[],frameTimes:number[]=[];
const pct=(a:number[],q:number)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*q))]:null;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.setClearColor(0x070605);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.025,40);
const arrival=full?(params.get('terrain')==='north'?await createNorthernArrival(renderer):params.get('planet')==='legacy'?await createLegacyArrival():await createArrival(renderer,camera)):null;
arrival?.setEffects({flare:params.get('flare')!=='0',cloud:params.get('cloud')!=='0',cloudShadow:params.get('cloudShadow')!=='0',atmosphere:params.get('atmosphere')!=='0',specular:params.get('specular')!=='0'});
const loader=new GLTFLoader();
const [arch,b,h,e,meta,w]=await Promise.all([createArchive(),loader.loadAsync(URLs.body),loader.loadAsync(URLs.heart),loader.loadAsync(URLs.electrodes),fetch(URLs.manifest).then(r=>r.json()),fetch('/wave.json').then(r=>r.json())]);
scene.add(arch.room,arch.dust);arch.setFade(1);
const person=new THREE.Group();person.position.set(meta.archive_root_blender[0],meta.archive_root_blender[2],-meta.archive_root_blender[1]);person.rotation.y=Math.PI;scene.add(person);
person.add(b.scene,e.scene);
const normalMats=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
const black=new THREE.MeshStandardMaterial({color:0x030405,roughness:.9,metalness:.04});
black.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(.13,.067,.025) * pow(1. - abs(dot(normalize(vViewPosition), normal)), 4.);');};
b.scene.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.material=black;m.castShadow=true;m.receiveShadow=true;normalMats.set(m,black);}});
e.scene.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.castShadow=true;normalMats.set(m,m.material);}});
const heart=h.scene;person.add(heart);heart.position.fromArray(meta.heart_local_web);
const q=meta.chest_q_wxyz;heart.quaternion.set(q[1],q[3],-q[2],q[0]);
const heartMat=new THREE.MeshStandardMaterial({color:0x9a451b,emissive:0xff7926,emissiveIntensity:.6,roughness:.5,metalness:.08,transparent:true,depthTest:false,depthWrite:false});
heartMat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance *= .08 + .65 * pow(1. - abs(dot(normalize(vViewPosition), normal)), 2.);');};
heart.traverse(o=>{if((o as THREE.Mesh).isMesh){(o as THREE.Mesh).material=heartMat;o.renderOrder=4;}});
const leadMat=new THREE.MeshStandardMaterial({color:0x28201a,roughness:.65,metalness:.2});
const yoke=new THREE.Vector3(-.06,.94,.14);
for(const s of Object.values(meta.electrodes) as any[]){
 const a=new THREE.Vector3().fromArray(s.p_web),n=new THREE.Vector3().fromArray(s.n_web);
 a.addScaledVector(n,.006);const curve=new THREE.CatmullRomCurve3([a,a.clone().addScaledVector(n,.06),a.clone().lerp(yoke,.55).add(new THREE.Vector3(0,-.03,.025)),yoke]);
 const m=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.0035,6,false),leadMat);m.castShadow=true;person.add(m);
}
person.updateMatrixWorld(true);
const cartSocket=new THREE.Vector3(-1.29,.88,-3.9); // build_archive.py CART + device input offset
const trunk=new THREE.CatmullRomCurve3([yoke,new THREE.Vector3(.14,.7,.2),new THREE.Vector3(.35,.48,.22),new THREE.Vector3(1,.16,.23),person.worldToLocal(cartSocket.clone())]);
person.add(new THREE.Mesh(new THREE.TubeGeometry(trunk,56,.004,6,false),leadMat));
// Room bake stays canonical; actual silhouette is included in the shaft occlusion map.
arch.renderSunDepth(renderer,[person]);
const sun=new THREE.DirectionalLight(0xffd5a1,2);sun.position.copy(person.position).add(new THREE.Vector3(-4,5,3));sun.target.position.copy(person.position).add(new THREE.Vector3(0,1.1,0));scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-2;sun.shadow.camera.right=2;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-1;sun.shadow.bias=-.0003;
const fill=new THREE.HemisphereLight(0x858c92,0x100c08,.18);scene.add(fill);
const heartLight=new THREE.PointLight(0xffb677,.035,.7,2);person.add(heartLight);heartLight.position.copy(heart.position).add(new THREE.Vector3(.13,.06,-.18));
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:actualSamples,resolveDepthBuffer:true,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)}));
const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);if(arrival&&'atmospherePass' in arrival)composer.addPass(arrival.atmospherePass);composer.addPass(arch.vol);
if(arrival&&params.get('terrain')!=='north')composer.addPass(arrival.cloudPass);
if(arrival)composer.addPass(arrival.flarePass);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.35,.4,.65);composer.addPass(bloom);
// r186 SMAA expects linear-sRGB, before OutputPass. Keep the ECG/DOM layers separate.
const smaa=['smaa','hybrid'].includes(aa)||(['msaa','hybrid'].includes(aa)&&actualSamples===0)?new SMAAPass():null;
if(smaa)composer.addPass(smaa);
composer.addPass(new OutputPass());if(arrival&&params.get('terrain')==='north')composer.addPass(arrival.cloudPass);const grade=createGrade();composer.addPass(grade);
// Local diagnostics only: existing product shaders/defaults remain unchanged.
grade.uniforms.uGrain={value:1};
grade.material.fragmentShader=grade.material.fragmentShader.replace('uniform float uTime,uAspect,uSpace;','uniform float uTime,uAspect,uSpace,uGrain;').replace('(.012+.014*uSpace);','(.012+.014*uSpace)*uGrain;');
arch.vol.material.fragmentShader=arch.vol.material.fragmentShader.replace('const int N=48;','const int N='+initialSteps+';');
const clean=decode(w.clean,w.scale,w.n),input=decode(w.input,w.scale,w.n),output=decode(w.output,w.scale,w.n);
const loop=makeLoop(detectR(clean,w.fs),[clean,input,output],w.fs);
const grid=createGrid($('grid') as HTMLCanvasElement);
const sweep=createSweep($('sweep') as HTMLCanvasElement,{fs:w.fs,loop,input:{values:input,color:[255,188,121],glow:.45,core:.78,white:.35},output:{values:output,color:[103,231,195]},mvPerBox:3.6});
let W=1,H=1;
const renderScale=THREE.MathUtils.clamp(Number(params.get('scale')||1),1,1.5);
function resize(){W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio*renderScale,1.5);renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);arch.setPx(H,pr);camera.aspect=W/H;
 if(arrival)arrival.cloudPass.uniforms.uAspect.value=W/H;
 const box={l:W*.47,r:W*.95,t:H*.46,b:H*.77},mv=mvPerBoxFor(box,2.5);sweep.resize(box,mv);grid.resize(box,2.5,mv);camera.updateProjectionMatrix();}
resize();addEventListener('resize',resize);
const reduced=new URLSearchParams(location.search).get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis=new Lenis({wrapper:$('wrap'),content:$('content'),duration:reduced?.1:1.5,autoRaf:false});
let targetP=0,p=0,t=0,prev=performance.now(),frame=0,playing=true,locked=false,volumeOn=true,bloomOn=true,clay=false,frozenTime:number|null=null;
let grainOn=true,jitter=true,testFrame:number|null=null,steps=initialSteps,pathStart:number|null=null,pathDuration=8,pathReverse=false;
lenis.on('scroll',ev=>{if(!locked)targetP=ev.progress;});
// Return from the QA slider/path to user scrolling on real input.
const resumeScroll=()=>{if(params.has('reviewP')||params.has('reviewPath'))return;locked=false;pathStart=null;frozenTime=null;testFrame=null;};
addEventListener('wheel',resumeScroll,{passive:true});
addEventListener('touchstart',resumeScroll,{passive:true});
addEventListener('keydown',ev=>{if((ev.target as HTMLElement)?.closest('select,input,textarea'))return;if(['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(ev.key))resumeScroll();});
const pointer={x:0,y:0,sx:0,sy:0};addEventListener('pointermove',ev=>{pointer.x=ev.clientX/W-.5;pointer.y=ev.clientY/H-.5;});
const clayMat=new THREE.MeshStandardMaterial({color:0x777b7d,roughness:.9});
function configure(pv:number,time:number,opts:any={}){
 locked=true;pathStart=null;targetP=p=pv;frozenTime=time;
 if(opts.volume!==undefined)volumeOn=opts.volume;if(opts.bloom!==undefined)bloomOn=opts.bloom;if(opts.clay!==undefined)clay=opts.clay;
 arrival?.setEffects(opts);
 if(opts.grain!==undefined)grainOn=opts.grain;if(opts.jitter!==undefined)jitter=opts.jitter;
 if(opts.frame!==undefined)testFrame=opts.frame;
 if(opts.steps!==undefined&&[48,64,96].includes(opts.steps)&&steps!==opts.steps){arch.vol.material.fragmentShader=arch.vol.material.fragmentShader.replace('const int N='+steps+';','const int N='+opts.steps+';');steps=opts.steps;arch.vol.material.needsUpdate=true;}
 draw(0);return state();
}
const samples:number[]=[];
function state(){const phase=beatPhase(loop,w.fs,t),sample=Math.floor(t*w.fs+1e-6);return{ready:true,scroll:{top:$('wrap').scrollTop,max:$('wrap').scrollHeight-$('wrap').clientHeight,locked,targetProgress:targetP},p,t,arrival:arrival?.state(),scene:w.id,record:w.record,fs:w.fs,winner:w.winner,sample,sourceSample:loop.start+sample%(loop.end-loop.start),rAbs:Math.round(phase.prev*w.fs),rOffsets:loop.beats.map(i=>i-loop.start),beatAge:phase.sincePrev,heartScale:heart.scale.x,sharedClock:true,bodyVisible:person.visible,heartVisible:heart.visible&&person.visible,heartScreen:heart.position.clone().applyMatrix4(person.matrixWorld).project(camera).toArray(),camera:camera.position.toArray(),cameraTarget:lastTarget.toArray(),cartSocket:cartSocket.toArray(),volume:volumeOn,bloom:bloomOn,clay,aa,actualSamples,supportedSamples,smaa:!!smaa,dpr:devicePixelRatio,pixelRatio:renderer.getPixelRatio(),renderSize:renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),grain:grainOn,jitter,steps,frame:testFrame??frame,gpu:{available:!!timer,count:gpuTimes.length,p50:pct(gpuTimes,.5),p95:pct(gpuTimes,.95)},raf:{count:frameTimes.length,p50:pct(frameTimes,.5),p95:pct(frameTimes,.95)},cpuRenderMsMean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
 let lastTarget=new THREE.Vector3(),lastPersonVisible=true;
function draw(dt:number){
 t=frozenTime??t;
 const roomP=full?THREE.MathUtils.clamp((p-.55)/.45,0,1):p;
 const northPath=params.get('terrain')==='north',spaceEnd=northPath?.37:.32;
 const inSpace=full&&p<spaceEnd,entryP=northPath&&p<.55?.32+THREE.MathUtils.clamp((p-.37)/.18,0,1)*.23:p;
 $('status').textContent=inSpace?(params.get('terrain')==='north'?'EOX · ARCTICDEM · NORTHERN TRIAL':'NASA EARTH OBSERVATORY · A 제작 중'):'A · 제작 중';
 const wave=ss(.78,.96,roomP),phase=beatPhase(loop,w.fs,t);
 const pulse=Math.exp(-phase.sincePrev/.085);
 const pos0=arch.shot('s2_beams').pos,pos1=new THREE.Vector3(.55,2.15,-.7),pos2=new THREE.Vector3(2.5,1.97,-4.32);
 // Stay in the central aisle until beyond the last stack; the side orbit lives in the back bay.
 const clearance=new THREE.Vector3(.55,2.65,-3.2);
 let pos=roomP<.25?pos0.clone().lerp(pos1,ss(0,.25,roomP)):roomP<.63?pos1.clone().lerp(clearance,ss(.25,.63,roomP)):clearance.clone().lerp(pos2,ss(.63,.92,roomP));
 lastTarget.set(.55,1.65,-3.76);
 if(roomP<.25)lastTarget.lerpVectors(arch.shot('s2_beams').look,new THREE.Vector3(.55,1.65,-3.76),ss(0,.25,roomP));
 if(full&&p>=spaceEnd&&p<.55){
  const portal=new THREE.Vector3(-4.25,4.575,3.58),inside=new THREE.Vector3(-3.05,4.575,3.58),aisle=new THREE.Vector3(0,4.35,3.58);
  pos=entryP<.42?new THREE.Vector3(-8,5,5.5).lerp(portal,ss(.32,.42,entryP)):entryP<.46?portal.clone().lerp(inside,ss(.42,.46,entryP)):entryP<.49?inside.clone().lerp(aisle,ss(.46,.49,entryP)):aisle.clone().lerp(pos0,ss(.49,.55,entryP));
  lastTarget.set(-2.6,4.575,3.58);lastTarget.lerp(arch.shot('s2_beams').look,ss(.46,.55,entryP));
 }
 camera.position.copy(pos);camera.position.x+=pointer.sx*.03*(1-wave);camera.position.y-=pointer.sy*.03*(1-wave);
   camera.near=.025;camera.far=40;camera.fov=roomP<.25?THREE.MathUtils.lerp(26,44,ss(0,.25,roomP)):THREE.MathUtils.lerp(44,34,wave);camera.up.set(0,1,0);camera.setViewOffset(W,H,W*.19*wave,0,W,H);camera.lookAt(lastTarget);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 if(arrival){arrival.cloudPass.uniforms.uCover.value=arrival.cover(p);arrival.cloudPass.uniforms.uProgress.value=ss(.24,.4,p);arrival.cloudPass.uniforms.uTime.value=reduced?0:t;if(arrival.cloudPass.uniforms.uExit)arrival.cloudPass.uniforms.uExit.value=1-ss(.335,.4,p);if(inSpace)lastTarget.copy(arrival.update(p,t,reduced,camera));else if(arrival.cover(p)>.001&&'prepareCover' in arrival)arrival.prepareCover(p,t,reduced,camera);}
 if(arrival&&!inSpace)arrival.flarePass.uniforms.uStrength.value=0;
 renderPass.scene=inSpace?arrival!.scene:scene;
 if(arrival)arrival.cloudPass.enabled=inSpace||arrival.cover(p)>.001;
 if(arrival&&'atmospherePass' in arrival)arrival.atmospherePass.enabled=inSpace&&arrival.state().atmosphere;
 person.visible=roomP>.08;heart.visible=roomP>.7;heartMat.opacity=ss(.7,.8,roomP);
 if(person.visible!==lastPersonVisible){lastPersonVisible=person.visible;arch.renderSunDepth(renderer,person.visible?[person]:[]);}
 heart.scale.setScalar(reduced?1:1+pulse*.07);heartMat.emissiveIntensity=.62+(reduced?0:pulse*.4);heartLight.intensity=(.035+(reduced?0:pulse*.01))*ss(.45,.7,roomP);
 const roomLevel=1-wave*.78;arch.setFade(roomLevel);sun.intensity=1.8*roomLevel;fill.intensity=.16*roomLevel;
 // Only the exterior approach is re-exposed; the user-kept interior grade/bake remains identical.
 arch.shared.uExposure.value=full&&entryP<.46?THREE.MathUtils.lerp(.35,1.3,ss(.44,.46,entryP)):1.3;
 const bodyMesh=Array.from(normalMats.keys()).find(m=>m.morphTargetInfluences?.length);
 if(bodyMesh?.morphTargetInfluences)bodyMesh.morphTargetInfluences[0]=reduced?0:.025*(.5+.5*Math.sin(t*1.5));
 normalMats.forEach((mat,m)=>m.material=clay?clayMat:mat);bloom.enabled=bloomOn;
 grade.uniforms.uAspect.value=W/H;grade.uniforms.uTime.value=t;grade.uniforms.uSpace.value=full?.65*ss(.32,.48,entryP):.65;
 grade.uniforms.uGrain.value=grainOn?grainStrength:0;
 renderer.info.autoReset=false;renderer.info.reset();
 arch.update(t,jitter?(testFrame??frame):0,camera,composer.readBuffer.depthTexture,volumeOn&&!inSpace&&(!full||entryP>=.46)?roomLevel:0);
 if(timer){const disjoint=gl.getParameter(timer.GPU_DISJOINT_EXT);while(gpuPending.length&&(disjoint||gl.getQueryParameter(gpuPending[0],gl.QUERY_RESULT_AVAILABLE))){const q=gpuPending.shift()!;if(!disjoint){gpuTimes.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);if(gpuTimes.length>600)gpuTimes.shift();}gl.deleteQuery(q);}}
 const query=timer&&gpuPending.length<8?gl.createQuery():null;
 if(query)gl.beginQuery(timer.TIME_ELAPSED_EXT,query);composer.render(dt);if(query){gl.endQuery(timer.TIME_ELAPSED_EXT);gpuPending.push(query);}
 const blend=wave; $('wavebox').style.opacity=String(blend);$('labels').style.opacity=String(blend);
 $('title').style.opacity=String(full?1-ss(params.get('terrain')==='north'?.07:.12,params.get('terrain')==='north'?.14:.25,p):1-ss(.25,.5,p));$('hint').style.opacity=String(full?1-ss(.1,.2,p):1-ss(.2,.5,p));
 sweep.draw({t,startAbs:0,mix:0,alpha:blend,reduced,ring:null,comet:null,gridAlpha:.2});
 frame++;
}
$('progress').oninput=ev=>{locked=true;targetP=+(ev.target as HTMLInputElement).value;};
$('volume').onchange=ev=>volumeOn=(ev.target as HTMLInputElement).checked;
$('bloom').onchange=ev=>bloomOn=(ev.target as HTMLInputElement).checked;
$('clay').onchange=ev=>clay=(ev.target as HTMLInputElement).checked;
$('play').onclick=()=>{playing=!playing;frozenTime=null;($('play') as HTMLButtonElement).textContent=playing?'재생 정지':'재생';};
addEventListener('keydown',ev=>{if(ev.key.toLowerCase()==='d')$('qa').style.display=$('qa').style.display==='block'?'none':'block';});
(window as any).aPreview={set:configure,state,live:(pv:number)=>{locked=true;targetP=p=pv;frozenTime=null;testFrame=null;playing=true;return state();},path:(seconds=8,reverse=false)=>{pathStart=performance.now();pathDuration=seconds;pathReverse=reverse;locked=true;frozenTime=null;testFrame=null;t=0;playing=true;gpuTimes.length=frameTimes.length=0;return state();}};
$('loading').remove();
// Review-only URL harness: deterministic native-browser frames and same-engine timing.
if(params.has('reviewP')||params.has('reviewPath')||params.has('reviewCapture')){
 const fixed=Number(params.get('reviewP')??0),fixedTime=Number(params.get('reviewTime')??2.4);
 if(!params.has('reviewCapture'))configure(THREE.MathUtils.clamp(Number.isFinite(fixed)?fixed:0,0,1),Number.isFinite(fixedTime)?fixedTime:2.4,{frame:12,grain:false,bloom:params.get('bloom')!=='0',cloudShadow:params.get('cloudShadow')!=='0',thick:params.get('thick')!=='0',thin:params.get('thin')!=='0'});
 const save=document.createElement('button');save.textContent='프레임 저장';save.id='review-save';save.style.cssText='position:fixed;right:16px;top:16px;z-index:99;padding:8px 14px;background:#121a20;color:white;border:1px solid #46515a';
 const saveFrame=async()=>{draw(0);const response=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:params.get('reviewRound')||'manual',shot:!locked?('scroll-'+Math.round(p*10000)):params.get('reviewShot')||('frame-'+Math.round(p*1000)),image:renderer.domElement.toDataURL('image/png'),meta:{renderer:(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null;})(),state:state(),url:location.href}})});if(!response.ok)throw Error(await response.text());save.textContent='프레임 저장 완료';console.info('CLOUD_REVIEW_SAVED '+await response.text());};
 save.onclick=()=>void saveFrame().catch(console.error);document.body.append(save);if(params.has('reviewShot')&&!params.has('reviewCapture'))requestAnimationFrame(()=>requestAnimationFrame(()=>void saveFrame().catch(console.error)));
 if(params.get('terrain')==='north'){const selector=document.createElement('select');selector.setAttribute('aria-label','전이 검토 구도');selector.style.cssText='position:fixed;right:16px;top:62px;z-index:99;padding:8px;background:#121a20;color:white';for(const [name,value] of [['원형 지구',0],['궤도 수평선',.10],['광역 지형 시작',.15],['북유럽 확대',.18],['인계 1',.19],['인계 2',.20],['인계 3',.21],['인계 4',.215],['인계 5',.22],['인계 6',.225],['인계 7',.23],['지역 인계',.235],['인계 완료',.245],['상세 지형',.265],['능선 접근',.274],['베이크 접합',.28],['구름 접근',.300],['구름 양감',.320],['구름 진입',.345],['구름 내부',.365],['서고 인계',.410],['서고 입구',.445],['서고',.55],['심장·파형',.95]] as const){const o=document.createElement('option');o.value=String(value);o.textContent=name;selector.append(o);}selector.onchange=()=>{save.textContent='프레임 저장';params.set('reviewShot','north-'+selector.value.replace('.','-'));configure(Number(selector.value),2.4,{frame:12,grain:false});};document.body.append(selector);}
 const info=gl.getExtension('WEBGL_debug_renderer_info');console.info('CLOUD_REVIEW_META '+JSON.stringify({renderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,state:state(),url:location.href}));
 if(['forward','reverse'].includes(params.get('reviewPath')||'')){(window as any).aPreview.path(8,params.get('reviewPath')==='reverse');setTimeout(()=>{console.info('CLOUD_REVIEW_TIMING '+JSON.stringify(state()));},8600);}
}

function tick(now:number){frameTimes.push(now-prev);if(frameTimes.length>600)frameTimes.shift();const dt=Math.min((now-prev)/1000,.05);prev=now;lenis.raf(now);if(frozenTime===null&&playing)t+=dt;
 if(pathStart!==null){const pathPhase=THREE.MathUtils.clamp((now-pathStart)/1000/pathDuration,0,1);p=targetP=pathReverse?1-pathPhase:pathPhase;if(pathPhase===1)pathStart=null;}
 p=reduced?targetP:p+(targetP-p)*(1-Math.exp(-dt/ .35));pointer.sx=reduced?0:pointer.sx+(pointer.x-pointer.sx)*(1-Math.exp(-dt/.4));pointer.sy=reduced?0:pointer.sy+(pointer.y-pointer.sy)*(1-Math.exp(-dt/.4));
 const before=performance.now();draw(dt);samples.push(performance.now()-before);if(samples.length>120)samples.shift();if(!(params.has('reviewP')&&!params.has('reviewPath')))requestAnimationFrame(tick);}
requestAnimationFrame(tick);
}
start().catch(err=>{console.error(err);$('loading').textContent='장면을 준비하지 못했습니다: '+err.message;});

