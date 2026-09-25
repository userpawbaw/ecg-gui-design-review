import * as THREE from 'three';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './style.css';

gsap.registerPlugin(ScrollTrigger);
const params=new URLSearchParams(location.search);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const autoplay=params.has('autoplay');
const state={progress:0,rotationY:0,frames:[] as number[],ready:false,webgl:'',mode:''};
(window as any).__spike=state;

// ---------- WebGL scene ----------
const canvas=document.getElementById('gl') as HTMLCanvasElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
state.webgl=renderer.getContext().getParameter(renderer.getContext().VERSION);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,0,9);
const loader=new THREE.TextureLoader();
const tex=(f:string,srgb=true)=>{const t=loader.load('./textures/'+f);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;};

const sun=new THREE.Vector3(-.4,.55,1).normalize();
const earthMat=new THREE.ShaderMaterial({
 uniforms:{day:{value:tex('earth_atmos_2048.jpg')},night:{value:tex('earth_lights_2048.png')},spec:{value:tex('earth_specular_2048.jpg',false)},sun:{value:sun}},
 vertexShader:`varying vec2 vUv;varying vec3 vN;varying vec3 vView;
 void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vView=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform sampler2D day,night,spec;uniform vec3 sun;varying vec2 vUv;varying vec3 vN;varying vec3 vView;
 void main(){float l=dot(vN,sun);float dayMix=smoothstep(-.18,.28,l);
  vec3 d=texture2D(day,vUv).rgb*vec3(.72,.8,1.)*max(l,0.)*1.35;
  vec3 n=texture2D(night,vUv).rgb*vec3(1.,.82,.55)*1.6;
  vec3 c=mix(n,d,dayMix);
  float s=texture2D(spec,vUv).r;vec3 h=normalize(sun+vView);c+=pow(max(dot(vN,h),0.),48.)*s*.55*dayMix;
  float rim=pow(1.-max(dot(vN,vView),0.),3.);c+=vec3(.55,.75,1.)*rim*(.25+.75*dayMix);
  gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
 }`});
const earth=new THREE.Mesh(new THREE.SphereGeometry(2,128,128),earthMat);
const atmo=new THREE.Mesh(new THREE.SphereGeometry(2.16,96,96),new THREE.ShaderMaterial({
 transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{sun:{value:sun}},
 vertexShader:`varying vec3 vN;varying vec3 vView;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vView=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform vec3 sun;varying vec3 vN;varying vec3 vView;void main(){float i=pow(.72-dot(vN,vView),3.2);float lit=.35+.65*smoothstep(-.4,.6,dot(-vN,sun)*-1.);gl_FragColor=vec4(vec3(.62,.8,1.)*i*lit*2.2,1.);}`}));
const globe=new THREE.Group();globe.add(earth,atmo);globe.rotation.z=THREE.MathUtils.degToRad(-12);scene.add(globe);

const starGeo=new THREE.BufferGeometry();const sp=new Float32Array(1800*3);let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<sp.length;i+=3){const r=30+rnd()*20,t=rnd()*Math.PI*2,p=Math.acos(2*rnd()-1);sp[i]=r*Math.sin(p)*Math.cos(t);sp[i+1]=r*Math.sin(p)*Math.sin(t);sp[i+2]=-Math.abs(r*Math.cos(p));}
starGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({size:.06,color:0xaab4c0,transparent:true,opacity:.7}));scene.add(stars);

const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
addEventListener('resize',resize);resize();

// ---------- Choreography: one timeline, 0..1 ----------
const headlines=gsap.utils.toArray<HTMLElement>('.headline');
const labels=gsap.utils.toArray<HTMLElement>('.cta-label');
const chips=gsap.utils.toArray<HTMLElement>('.chip');
gsap.set(headlines.slice(1),{yPercent:60,opacity:0,filter:'blur(8px)'});
gsap.set(labels.slice(1),{yPercent:100,opacity:0});
gsap.set(chips,{opacity:0,y:24,scale:.94});
globe.position.y=-3.4;

const tl=gsap.timeline({paused:true,defaults:{ease:'none'}});
// 3D layer — whole duration (10 units)
tl.to(globe.position,{y:-.35,duration:4,ease:'power2.out'},0)
  .to(globe.rotation,{y:Math.PI*1.25,duration:10},0)
  .to(camera.position,{z:6.4,duration:6,ease:'power1.inOut'},3)
  .to(sun,{x:.9,y:.2,z:.35,duration:10,onUpdate:()=>sun.normalize()},0)
  .to(stars.rotation,{y:.35,duration:10},0);
// DOM layer — step swaps
const swap=(from:number,to:number,at:number)=>{
 tl.to(headlines[from],{yPercent:-60,opacity:0,filter:'blur(8px)',duration:.8,ease:'power2.in'},at)
   .to(headlines[to],{yPercent:0,opacity:1,filter:'blur(0px)',duration:.9,ease:'power2.out'},at+.5)
   .to(labels[from],{yPercent:-100,opacity:0,duration:.5},at+.1)
   .to(labels[to],{yPercent:0,opacity:1,duration:.5},at+.45)
   .to('#cta',{width:from===0?260:210,duration:.6,ease:'power2.inOut'},at+.1);};
swap(0,1,3);swap(1,2,6.4);
tl.to(chips,{opacity:1,y:0,scale:1,stagger:.6,duration:.7,ease:'back.out(1.6)'},2.2);
tl.to('.copy',{yPercent:-8,duration:10},0);

const setProgress=(p:number)=>{state.progress=p;tl.progress(p);state.rotationY=globe.rotation.y;};

// ---------- Input drivers ----------
let lenis:Lenis|null=null;
if(autoplay){
 // Kiosk translation: no visitor scroll; time drives the same timeline (ping-pong).
 state.mode='autoplay';document.querySelector('.scroller')!.setAttribute('style','height:100vh');
 const period=reduced?0:24;let t0=performance.now();
 gsap.ticker.add(()=>{if(!period){setProgress(.5);return;}const u=((performance.now()-t0)/1000/period)%2;setProgress(u<1?u:2-u);});
}else{
 state.mode=reduced?'scroll-native-reduced':'scroll-lenis';
 if(!reduced){lenis=new Lenis({lerp:.085,wheelMultiplier:.9});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis!.raf(t*1000));gsap.ticker.lagSmoothing(0);}
 ScrollTrigger.create({trigger:'#scroller',start:'top top',end:'bottom bottom',pin:'#stage',pinSpacing:false,scrub:reduced?true:.6,onUpdate:s=>setProgress(s.progress)});
 setProgress(0);
}
document.getElementById('mode')!.textContent=state.mode.toUpperCase();
document.getElementById('cta')!.addEventListener('click',()=>{if(lenis)lenis.scrollTo('bottom',{duration:2.4});else scrollTo({top:document.body.scrollHeight});});

// ---------- Render loop (always on; spike measures frame intervals) ----------
let last=0;
renderer.setAnimationLoop(now=>{if(last)state.frames.push(now-last);if(state.frames.length>2000)state.frames.shift();last=now;
 earth.rotation.y+=reduced?0:.0004; // idle drift independent of scroll
 renderer.render(scene,camera);state.ready=true;});
