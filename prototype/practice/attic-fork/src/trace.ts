// GPU trace v2 — the earlier intro's waveform display design (prototype/v2/src/story/intro/sweep.ts + waveUi.ts) on the GPU.
// Same look rules: amber input / mint output on a dark ECG grid · neon sweep with age-based white-hot afterglow ·
// blank gap + local fade ahead of the head · three bloom levels · head marker · input↔output is a PURE cross-fade with a
// focus pull (the fading trace defocuses into its glow instead of staying as a faint overlay) · beat-stepped mix + flash.
// Instanced quads per sample interval (no per-frame canvas, no texture upload — F-034). Positions are in canvas-pixel space
// of the page (PLOT). Data contract: x = stored time (250 Hz) mod the sweep window, y = stored value × px/mV; nothing is
// smoothed or resampled. Values > 1 on the cores are meant for the bloom pass.
import * as THREE from 'three';
import type {Ecg} from './ecg';
import {PLOT,WIN} from './paper';

export type Trace={group:THREE.Group,update:(o:{t:number,mix:number,glow:number,flash:number,alpha?:number})=>void};
export type TraceOpts={lift?:number,pageW?:number};

export const GAP_S=.12,ERASE_S=.3,GLOW_TAU=.2;
export const AMBER=[255,188,121].map(v=>v/255) as [number,number,number],MINT=[103,231,195].map(v=>v/255) as [number,number,number];

const VERT=`
attribute vec2 aT; attribute vec2 aV;
uniform float uT,uWin,uDur,uPxS,uPxMv,uX0,uYB,uHalf,uLift,uPageW;
varying float vAge,vFade; varying vec2 vSide;
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
  vAge=uT-mix(t0,t1,s); vSide=vec2(position.y*2.,0.);
  vFade = bad>.5 ? 0. : 1.;
  float u=clamp(p.x/uPageW,0.,1.);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,-uLift*(1.-pow(1.-u,2.2)),1.);
}`;
// age (s) → [intensity, whiteness]: fresh samples are hot and near-white, then cool to the trace colour; the oldest samples
// just ahead of the head fade out locally before the blank gap (same numbers as sweep.ts look()).
const FRAG=`
uniform vec3 uCol; uniform float uWin,uGap,uErase,uTau,uGain,uAlpha,uBoost,uMax;
varying float vAge,vFade; varying vec2 vSide;
void main(){
  if(vFade<.5||vAge<0.||vAge>=uWin-uGap) discard;
  float glow=exp(-vAge/uTau);
  float fade=vAge>uWin-uGap-uErase ? (uWin-uGap-vAge)/uErase : 1.;
  float e=fade*fade*(3.-2.*fade);
  float k=(.72+.28*glow)*e;
  vec3 c=mix(uCol,vec3(1.),clamp(glow*.75*uBoost,0.,1.));
  float edge=1.-smoothstep(.0,1.,abs(vSide.x));
  if(uMax>.5) gl_FragColor=vec4(c*uGain*uAlpha*k*edge,1.);                 // core/inner: MAX blend (dense noise must not pile up into white)
  else gl_FragColor=vec4(c*uGain,uAlpha*k*edge);
}`;

function radialTex(){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;
 const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}

export function makeTrace(ecg:Ecg,o:TraceOpts={}):Trace{
 const fs=ecg.fs,dur=ecg.dur,i0=ecg.start,i1=ecg.end,N=i1-i0-1;
 const mk=(arr:Float32Array)=>{
  const g=new THREE.InstancedBufferGeometry();const q=new THREE.PlaneGeometry(1,1);g.index=q.index;g.setAttribute('position',q.attributes.position);
  const T=new Float32Array(N*2),V=new Float32Array(N*2);
  for(let i=0;i<N;i++){T[i*2]=i/fs;T[i*2+1]=(i+1)/fs;V[i*2]=arr[i0+i];V[i*2+1]=arr[i0+i+1];}
  g.setAttribute('aT',new THREE.InstancedBufferAttribute(T,2));g.setAttribute('aV',new THREE.InstancedBufferAttribute(V,2));g.instanceCount=N;return g;};
 const base={uT:{value:0},uWin:{value:WIN},uDur:{value:dur},uPxS:{value:(PLOT.X1-PLOT.X0)/WIN},uPxMv:{value:PLOT.PXMV},uX0:{value:PLOT.X0},uYB:{value:PLOT.YB},uLift:{value:o.lift??0},uPageW:{value:o.pageW??1200},
  uGap:{value:GAP_S},uErase:{value:ERASE_S},uTau:{value:GLOW_TAU}};
 const layerMat=(col:[number,number,number],half:number,boost:number,mx:boolean)=>{const m=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:mx?THREE.CustomBlending:THREE.AdditiveBlending,
  uniforms:{...base,uHalf:{value:half},uCol:{value:new THREE.Color().setRGB(col[0],col[1],col[2],THREE.SRGBColorSpace)},uGain:{value:1},uAlpha:{value:0},uBoost:{value:boost},uMax:{value:mx?1:0}}});
  if(mx){m.blendEquation=THREE.MaxEquation;m.blendSrc=THREE.OneFactor;m.blendDst=THREE.OneFactor;m.blendEquationAlpha=THREE.AddEquation;m.blendSrcAlpha=THREE.OneFactor;m.blendDstAlpha=THREE.OneFactor;}return m;};
 const group=new THREE.Group();
 // layers (px half-widths on the 1200-px page): hot core · inner glow · mid glow · wide bloom
 const LAYERS=[{r:'core',half:2.1},{r:'inner',half:5.5},{r:'mid',half:13},{r:'wide',half:30}] as const;
 const traces=[{tr:'in' as const,arr:ecg.input,col:AMBER,boost:1},{tr:'out' as const,arr:ecg.out,col:MINT,boost:1.15}];
 const mats:{m:THREE.ShaderMaterial,tr:'in'|'out',r:typeof LAYERS[number]['r']}[]=[];
 for(const t of traces){const geo=mk(t.arr);for(const L of LAYERS){
  const m=layerMat(t.col,L.half,t.boost,L.r==='core'||L.r==='inner'),mesh=new THREE.Mesh(geo,m);mesh.frustumCulled=false;mesh.renderOrder=8;group.add(mesh);mats.push({m,tr:t.tr,r:L.r});}}
 // head marker: small hot point at the newest sample (position marker only)
 const hm=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:radialTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:0}));
 hm.scale.set(46,46,1);hm.renderOrder=9;hm.frustumCulled=false;group.add(hm);
 const pxS=(PLOT.X1-PLOT.X0)/WIN;
 return{group,update:({t,mix,glow,flash,alpha=1})=>{
  const fl=1+.9*flash,pulse=.8+.35*glow;                       // brightness breathes with the beat
  for(const {m,tr,r} of mats){
   const u=m.uniforms,isOut=tr==='out';u.uT.value=t;
   const a=Math.min(1,alpha*(isOut?mix:1-mix)*fl),focus=isOut?1-mix:mix;       // pure cross-fade; the fading trace defocuses
   const ga=a,ca=a;
   let amp=0,gain=1;
   if(r==='core'){amp=ca*(1-focus);gain=.95*pulse;}
   else if(r==='inner'){amp=.28*ga+.55*focus*ca;gain=.7*pulse;}
   else if(r==='mid'){amp=.06*ga*(1+.6*glow);gain=.55;}
   else{amp=.03*ga*(1+.9*glow);gain=.55;}
   u.uAlpha.value=Math.min(1,amp);u.uGain.value=gain;}
  // head marker rides the trace that is currently dominant
  const tt=((t%dur)+dur)%dur,fi=tt*fs,i=Math.floor(fi),f=fi-i,arr=mix<.5?ecg.input:ecg.out,v=arr[i0+i]*(1-f)+arr[Math.min(i1-1,i0+i+1)]*f;
  hm.position.set(PLOT.X0+(t%WIN)*pxS,PLOT.YB-v*PLOT.PXMV,.2);(hm.material as THREE.MeshBasicMaterial).opacity=.75*alpha;
 }};
}
