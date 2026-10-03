// GPU trace: the stored waveform drawn as instanced quads (one per sample interval), swept / aged / cross-faded / pulsed in the shader.
// No per-frame canvas, no texture upload (the first version repainted a 1200×1600 canvas every frame: 28–250 ms, see F-034).
// Positions are in canvas-pixel space of the paper (PLOT), so the mesh is placed on a page by one scale/rotation.
// Data contract: x = stored time (250 Hz) mod the sweep window, y = stored value × 108 px/mV; nothing is smoothed or resampled.
import * as THREE from 'three';
import type {Ecg} from './ecg';
import {PLOT,WIN} from './paper';

export type Trace={group:THREE.Group,update:(o:{t:number,mix:number,glow:number})=>void};
export type TraceOpts={lift?:number,pageW?:number};            // lift: page-curve height (page world); pageW in px for the curve parameter

const VERT=`
attribute vec2 aT; attribute vec2 aV;               // sample times (s) and values (mV) of the two interval ends
uniform float uT,uWin,uDur,uPxS,uPxMv,uX0,uYB,uHalf,uLift,uPageW;
varying float vAge,vHead,vFade; varying vec2 vSide;
float latest(float tau){ return tau + floor((uT - tau)/uDur)*uDur; }   // latest occurrence of this sample at or before now (the loop repeats)
void main(){
  float t0=latest(aT.x), t1=latest(aT.y);
  float x0=uX0+mod(t0,uWin)*uPxS, x1=uX0+mod(t1,uWin)*uPxS;
  vec2 p0=vec2(x0,uYB-aV.x*uPxMv), p1=vec2(x1,uYB-aV.y*uPxMv);
  // collapse intervals that straddle the head, the loop seam or the window wrap (they would draw a line across the page)
  float bad = (abs(t1-t0)>.05 || abs(x1-x0)>uPxS*.5) ? 1. : 0.;
  vec2 d=p1-p0; float len=max(length(d),1e-4); vec2 dir=d/len, n=vec2(-dir.y,dir.x);
  float s=position.x+.5;                           // 0..1 along the interval
  vec2 p=mix(p0,p1,s) + n*position.y*uHalf*2. + dir*position.x*uHalf*1.4;
  vAge=uT-mix(t0,t1,s); vHead=mod(uT,uWin); vSide=vec2(position.y*2.,0.);
  vFade = bad>.5 ? 0. : 1.;
  float u=clamp(p.x/uPageW,0.,1.);
  float lift=uLift*(1.-pow(1.-u,2.2));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,-lift,1.);
}`;
const FRAG=`
uniform vec3 uInk,uGlowCol; uniform float uAlpha,uOld,uGain,uWin,uMode;     // uMode 0 = ink, 1 = additive halo
varying float vAge,vHead,vFade; varying vec2 vSide;
void main(){
  if(vFade<.5||vAge<0.||vAge>=uWin) discard;
  float fresh = vAge<vHead ? 1. : 0.;
  float gap = smoothstep(vHead, vHead+.14, vAge);                          // erase bar just ahead of the head
  float a = mix(fresh, uOld*gap, 1.-fresh);
  float e = 1.-smoothstep(.55,1.,abs(vSide.x));                            // soft edge across the line
  if(uMode<.5){ vec3 c=mix(uInk,uGlowCol,uGain); gl_FragColor=vec4(c,uAlpha*a*e); }
  else { gl_FragColor=vec4(uGlowCol*uGain,uAlpha*a*e*uGain*.55); }
}`;

export function makeTrace(ecg:Ecg,o:TraceOpts={}):Trace{
 const n=ecg.n,fs=ecg.fs,dur=ecg.dur;
 // one interval per consecutive sample pair inside the loop
 const i0=ecg.start,i1=ecg.end,N=i1-i0-1;
 const mk=(arr:Float32Array)=>{
  const g=new THREE.InstancedBufferGeometry();const q=new THREE.PlaneGeometry(1,1);g.index=q.index;g.setAttribute('position',q.attributes.position);
  const T=new Float32Array(N*2),V=new Float32Array(N*2);
  for(let i=0;i<N;i++){T[i*2]=i/fs;T[i*2+1]=(i+1)/fs;V[i*2]=arr[i0+i];V[i*2+1]=arr[i0+i+1];}
  g.setAttribute('aT',new THREE.InstancedBufferAttribute(T,2));g.setAttribute('aV',new THREE.InstancedBufferAttribute(V,2));g.instanceCount=N;return g;};
 const base={uT:{value:0},uWin:{value:WIN},uDur:{value:dur},uPxS:{value:(PLOT.X1-PLOT.X0)/WIN},uPxMv:{value:PLOT.PXMV},uX0:{value:PLOT.X0},uYB:{value:PLOT.YB},uLift:{value:o.lift??0},uPageW:{value:o.pageW??1200}};
 const mat=(ink:string,glow:string,half:number,mode:number)=>new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:mode?THREE.AdditiveBlending:THREE.NormalBlending,
  uniforms:{...base,uHalf:{value:half},uInk:{value:new THREE.Color(ink)},uGlowCol:{value:new THREE.Color(glow)},uAlpha:{value:1},uOld:{value:.22},uGain:{value:mode?0:0},uMode:{value:mode}}});
 const group=new THREE.Group();
 const parts=[
  {geo:mk(ecg.input),ink:'#7a5538',glow:'#ffb878',half:1.7,halo:false,role:'in'},
  {geo:mk(ecg.out),ink:'#0d4a5a',glow:'#5ff0d8',half:2.3,halo:false,role:'out'},
  {geo:mk(ecg.out),ink:'#0d4a5a',glow:'#5ff0d8',half:9,halo:true,role:'outHalo'},
  {geo:mk(ecg.input),ink:'#7a5538',glow:'#ffb878',half:7,halo:true,role:'inHalo'}];
 const meshes=parts.map(p=>{const m=new THREE.Mesh(p.geo,mat(p.ink,p.glow,p.half,p.halo?1:0));m.frustumCulled=false;m.renderOrder=p.halo?9:8;group.add(m);return{m,role:p.role};});
 return{group,update:({t,mix,glow})=>{
  for(const {m,role} of meshes){const u=(m.material as THREE.ShaderMaterial).uniforms;u.uT.value=t;
   const isOut=role.startsWith('out'),a=isOut?.12+.88*mix:1-.88*mix;
   if(role==='in'||role==='out'){u.uAlpha.value=a;u.uGain.value=Math.min(1,glow*(isOut?.9:.45));u.uOld.value=.22;}
   else{u.uAlpha.value=a;u.uGain.value=Math.min(1.2,glow*(isOut?1:.5));}}
 }};
}
