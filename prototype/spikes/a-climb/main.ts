import * as THREE from 'three';
import Lenis from 'lenis';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './style.css';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createArchive} from '../../v2/src/story/intro/archive';
import {createSweep} from '../../v2/src/story/intro/sweep';
import {createGrid,mvPerBoxFor} from '../../v2/src/story/intro/waveUi';
import {detectR,makeLoop,beatPhase} from '../../v2/src/story/intro/beats';
import {decode} from '../../v2/src/engine';
import {createGrade} from '../../v2/src/story/intro/space';
const $=(id:string)=>document.getElementById(id)!;
$('labels').querySelector('h2')!.textContent='잡음이 섞인 심전도';
$('labels').querySelector('small')!.textContent='MIXED INPUT · 0 dB / 2.5 s';
const ss=(a:number,b:number,x:number)=>{let v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v)};
const URLs={body:new URL('../../v2/src/story/intro/assets/a-climb/body_climb.glb',import.meta.url).href,
 heart:new URL('../../v2/src/story/intro/assets/heart.glb',import.meta.url).href,
 electrodes:new URL('../../v2/src/story/intro/assets/a-climb/electrodes_climb.glb',import.meta.url).href,
 manifest:new URL('../../v2/src/story/intro/assets/a-climb/manifest.json',import.meta.url).href};
async function start(){
const renderer=new THREE.WebGLRenderer({canvas:$('gl') as HTMLCanvasElement,antialias:true,powerPreference:'high-performance'});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.setClearColor(0x070605);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.025,40);
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
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)}));
composer.addPass(new RenderPass(scene,camera));composer.addPass(arch.vol);
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.35,.4,.65);composer.addPass(bloom);composer.addPass(new OutputPass());const grade=createGrade();composer.addPass(grade);
const clean=decode(w.clean,w.scale,w.n),input=decode(w.input,w.scale,w.n),output=decode(w.output,w.scale,w.n);
const loop=makeLoop(detectR(clean,w.fs),[clean,input,output],w.fs);
const grid=createGrid($('grid') as HTMLCanvasElement);
const sweep=createSweep($('sweep') as HTMLCanvasElement,{fs:w.fs,loop,input:{values:input,color:[255,188,121],glow:.45,core:.78,white:.35},output:{values:output,color:[103,231,195]},mvPerBox:3.6});
let W=1,H=1;
function resize(){W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);arch.setPx(H,pr);camera.aspect=W/H;
 const box={l:W*.47,r:W*.95,t:H*.46,b:H*.77},mv=mvPerBoxFor(box,2.5);sweep.resize(box,mv);grid.resize(box,2.5,mv);camera.updateProjectionMatrix();}
resize();addEventListener('resize',resize);
const reduced=new URLSearchParams(location.search).get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis=new Lenis({wrapper:$('wrap'),content:$('content'),duration:reduced?.1:1.5,autoRaf:false});
let targetP=0,p=0,t=0,prev=performance.now(),frame=0,playing=true,locked=false,volumeOn=true,bloomOn=true,clay=false,frozenTime:number|null=null;
lenis.on('scroll',ev=>{if(!locked)targetP=ev.progress;});
const pointer={x:0,y:0,sx:0,sy:0};addEventListener('pointermove',ev=>{pointer.x=ev.clientX/W-.5;pointer.y=ev.clientY/H-.5;});
const clayMat=new THREE.MeshStandardMaterial({color:0x777b7d,roughness:.9});
function configure(pv:number,time:number,opts:any={}){
 locked=true;targetP=p=pv;frozenTime=time;
 if(opts.volume!==undefined)volumeOn=opts.volume;if(opts.bloom!==undefined)bloomOn=opts.bloom;if(opts.clay!==undefined)clay=opts.clay;
 draw(0);return state();
}
const samples:number[]=[];
function state(){const phase=beatPhase(loop,w.fs,t),sample=Math.floor(t*w.fs+1e-6);return{ready:true,p,t,scene:w.id,record:w.record,fs:w.fs,winner:w.winner,sample,sourceSample:loop.start+sample%(loop.end-loop.start),rAbs:Math.round(phase.prev*w.fs),rOffsets:loop.beats.map(i=>i-loop.start),beatAge:phase.sincePrev,heartScale:heart.scale.x,sharedClock:true,bodyVisible:person.visible,heartVisible:heart.visible&&person.visible,heartScreen:heart.position.clone().applyMatrix4(person.matrixWorld).project(camera).toArray(),camera:camera.position.toArray(),cameraTarget:lastTarget.toArray(),cartSocket:cartSocket.toArray(),volume:volumeOn,bloom:bloomOn,clay,cpuRenderMsMean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
 let lastTarget=new THREE.Vector3(),lastPersonVisible=true;
function draw(dt:number){
 t=frozenTime??t;
 const wave=ss(.78,.96,p),phase=beatPhase(loop,w.fs,t);
 const pulse=Math.exp(-phase.sincePrev/.085);
 const pos0=arch.shot('s2_beams').pos,pos1=new THREE.Vector3(.55,2.15,-.7),pos2=new THREE.Vector3(2.5,1.97,-4.32);
 // Stay in the central aisle until beyond the last stack; the side orbit lives in the back bay.
 const clearance=new THREE.Vector3(.55,2.65,-3.2);
 let pos=p<.25?pos0.clone().lerp(pos1,ss(0,.25,p)):p<.63?pos1.clone().lerp(clearance,ss(.25,.63,p)):clearance.clone().lerp(pos2,ss(.63,.92,p));
 lastTarget.set(.55,1.65,-3.76);
 if(p<.25)lastTarget.lerpVectors(arch.shot('s2_beams').look,new THREE.Vector3(.55,1.65,-3.76),ss(0,.25,p));
 camera.position.copy(pos);camera.position.x+=pointer.sx*.03*(1-wave);camera.position.y-=pointer.sy*.03*(1-wave);
 camera.fov=p<.25?THREE.MathUtils.lerp(26,44,ss(0,.25,p)):THREE.MathUtils.lerp(44,34,wave);camera.setViewOffset(W,H,W*.19*wave,0,W,H);camera.lookAt(lastTarget);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 person.visible=p>.08;heart.visible=p>.7;heartMat.opacity=ss(.7,.8,p);
 if(person.visible!==lastPersonVisible){lastPersonVisible=person.visible;arch.renderSunDepth(renderer,person.visible?[person]:[]);}
 heart.scale.setScalar(reduced?1:1+pulse*.07);heartMat.emissiveIntensity=.62+(reduced?0:pulse*.4);heartLight.intensity=(.035+(reduced?0:pulse*.01))*ss(.45,.7,p);
 const roomLevel=1-wave*.78;arch.setFade(roomLevel);sun.intensity=1.8*roomLevel;fill.intensity=.16*roomLevel;
 const bodyMesh=Array.from(normalMats.keys()).find(m=>m.morphTargetInfluences?.length);
 if(bodyMesh?.morphTargetInfluences)bodyMesh.morphTargetInfluences[0]=reduced?0:.025*(.5+.5*Math.sin(t*1.5));
 normalMats.forEach((mat,m)=>m.material=clay?clayMat:mat);bloom.enabled=bloomOn;
 grade.uniforms.uAspect.value=W/H;grade.uniforms.uTime.value=t;grade.uniforms.uSpace.value=.65;
 renderer.info.autoReset=false;renderer.info.reset();
 arch.update(t,frame,camera,composer.readBuffer.depthTexture,volumeOn?roomLevel:0);composer.render(dt);
 const blend=wave; $('wavebox').style.opacity=String(blend);$('labels').style.opacity=String(blend);
 $('title').style.opacity=String(1-ss(.25,.5,p));$('hint').style.opacity=String(1-ss(.2,.5,p));
 sweep.draw({t,startAbs:0,mix:0,alpha:blend,reduced,ring:null,comet:null,gridAlpha:.2});
 frame++;
}
$('progress').oninput=ev=>{locked=true;targetP=+(ev.target as HTMLInputElement).value;};
$('volume').onchange=ev=>volumeOn=(ev.target as HTMLInputElement).checked;
$('bloom').onchange=ev=>bloomOn=(ev.target as HTMLInputElement).checked;
$('clay').onchange=ev=>clay=(ev.target as HTMLInputElement).checked;
$('play').onclick=()=>{playing=!playing;frozenTime=null;($('play') as HTMLButtonElement).textContent=playing?'재생 정지':'재생';};
addEventListener('keydown',ev=>{if(ev.key.toLowerCase()==='d')$('qa').style.display=$('qa').style.display==='block'?'none':'block';});
(window as any).aPreview={set:configure,state,live:(pv:number)=>{locked=true;targetP=p=pv;frozenTime=null;playing=true;return state();}};
$('loading').remove();
function tick(now:number){const dt=Math.min((now-prev)/1000,.05);prev=now;lenis.raf(now);if(frozenTime===null&&playing)t+=dt;
 p=reduced?targetP:p+(targetP-p)*(1-Math.exp(-dt/ .35));pointer.sx=reduced?0:pointer.sx+(pointer.x-pointer.sx)*(1-Math.exp(-dt/.4));pointer.sy=reduced?0:pointer.sy+(pointer.y-pointer.sy)*(1-Math.exp(-dt/.4));
 const before=performance.now();draw(dt);samples.push(performance.now()-before);if(samples.length>120)samples.shift();requestAnimationFrame(tick);}
requestAnimationFrame(tick);
}
start().catch(err=>{console.error(err);$('loading').textContent='장면을 준비하지 못했습니다: '+err.message;});

