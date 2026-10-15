// Story noise scenes, first pass (brief 3 IMPL_BRIEF_STORY_NOISE_WEB_2026-10-08, D-053/D-054, IDEA-R1-NOISE §10).
// One seated figure on GreenChair_01 at the archive's measurement spot; per noise only the inflow marker and the motion
// that makes the noise change. Second pass: per-scene camera paths (§10) that settle on the first pass's composition. Vanilla module mounted by React (D-028):
// one GSAP ticker drives the WebGL scene and the Canvas 2D wave panel from one playback clock t.
// Data contract: the panel draws stored samples only (input / stored output of d0-*--5, cross-faded per beat as in the intro);
// breath (bw) and clench (ma) timings are computed from the stored traces (F-030); the red markers are illustration, not data.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import gsap from 'gsap';
import {createArchive} from '../intro/archive';
import {createFigure} from '../intro/figure';
import {createGrade} from '../intro/space';
import {createSweep} from '../intro/sweep';
import {createGrid,mvPerBoxFor} from '../intro/waveUi';
import {createFistDrive} from './fistDrive';
import {createWaveMode} from './waveMode';
import {emissionTimes,shell} from './fieldPulse';
import {beatPhase,type Loop} from '../intro/beats';
import {createChecker} from './storyCheck';

export type Cond='pli'|'bw'|'ma';
export type NoiseData={cond:Cond,fs:number,loop:Loop,input:Float32Array,output:Float32Array,clean:Float32Array};
export type NoiseDom={gl:HTMLCanvasElement,grid:HTMLCanvasElement,sweep:HTMLCanvasElement,overlay:HTMLCanvasElement,cells:HTMLElement[]};
export type WaveUi={atEnd:boolean,overlay:boolean,phase:string};
export type NoiseOptions={frozenT:number|null,reduced:boolean,onEnd?:()=>void,last?:boolean,onUi?:(u:WaveUi)=>void};
type Story={figure_anchor:number[],morphs:string[],fist_s:number[],ra_arc_m:number,sternum_v:number,heart_approx:number[],
 electrodes:Record<'RA'|'LA'|'LL',{v:number,p:number[],n:number[]}>,cams:Record<string,{type:string,loc:number[],rot_euler:number[],lens?:number,sensor_width?:number,ortho_scale?:number}>};

const SPOT={x:-.7505,y:3.0995,yaw:-.0106};                       // build_archive.py r2 chair_fit (measurement spot, archive frame)
const RED=new THREE.Color('#ff3048');
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ss=(a:number,b:number,t:number)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k);};

/** Blender figure frame (z up) → three (y up) inside the archive: p_arch = spot + Rz(yaw)(p − anchor), then (x, z, −y). */
function toThree(p:number[]|THREE.Vector3,anchor:number[]){
 const v=Array.isArray(p)?p:[p.x,p.y,p.z],dx=v[0]-anchor[0],dy=v[1]-anchor[1],c=Math.cos(SPOT.yaw),s=Math.sin(SPOT.yaw);
 const ax=SPOT.x+c*dx-s*dy,ay=SPOT.y+s*dx+c*dy;return new THREE.Vector3(ax,v[2],-ay);
}

/** F-030 timings from the stored traces. */
export function breathFromBaseline(x:Float32Array,fs:number){        // 1 s moving average, normalised 0..1 (inhale = rise)
 const k=Math.round(fs),out=new Float32Array(x.length);let acc=0;
 for(let i=0;i<x.length;i++){acc+=x[i];if(i>=k)acc-=x[i-k];out[i]=acc/Math.min(i+1,k);}
 // centre the window (the stills used a centred average)
 const c=new Float32Array(x.length);for(let i=0;i<x.length;i++)c[i]=out[Math.min(x.length-1,i+(k>>1))];
 let lo=Infinity,hi=-Infinity;for(const v of c){lo=Math.min(lo,v);hi=Math.max(hi,v);}
 return{base:c,breath:c.map(v=>(v-lo)/(hi-lo||1))};
}

export async function createNoiseStage(dom:NoiseDom,data0:NoiseData,opt:NoiseOptions){
 let data=data0;
 // QA candidates (2026-10-14 user: "후보 아이디어를 제시하고 실제 시연에서 비교할 수 있도록 디버깅용 버튼"): strip close-up composition,
 // shell speed by camera distance, the AC mark, sonar rhythm and the continuous sonar's fade. URL (?comp= …) or the ?debug panel.
 const qp=new URLSearchParams(location.search);
 const QA:Record<string,string>={comp:qp.get('comp')??'A0',speed:qp.get('speed')??'B0',ac:qp.get('ac')??'C0',sonar:qp.get('sonar')??'D0',fade:qp.get('fade')??'Eb',light:qp.get('light')??'L1'};
 // QA: ?cam=x,y,z,lx,ly,lz,vfov freezes the camera (three frame) for still comparisons
 let qaBreath:number|null=null;   // QA (S-10 measurement): fixed breath 0..1
 const camFix=(()=>{const c=qp.get('cam')?.split(',').map(Number);return c&&c.length>=7?{p:new THREE.Vector3(c[0],c[1],c[2]),l:new THREE.Vector3(c[3],c[4],c[5]),fov:c[6]}:null;})();
 const U=(f:string)=>new URL(`./assets/${f}`,import.meta.url).href;
 const story:Story=await (await fetch(U('story.json'))).json();
 const A=story.figure_anchor;
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const renderer=new THREE.WebGLRenderer({canvas:dom.gl,antialias:true,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.setClearColor(0x000000,1);
 const scene=new THREE.Scene();
 const arch=await createArchive();scene.add(arch.room,arch.dust);arch.setFade(1);arch.renderSunDepth(renderer);
 // chair: plain PBR lit by a soft warm key + fill that stand in for the baked room light (the room's r1 bake has no chair)
 const chair=(await loader.loadAsync(U('chair_v3_story.glb'))).scene;
 scene.add(chair);
 scene.add(new THREE.HemisphereLight(0xffe2c4,0x2a1d14,.55));
 const key=new THREE.DirectionalLight(0xffd6a8,1.3);key.position.set(-2.5,3.2,-1.5);scene.add(key);
 // figure
 const g=await loader.loadAsync(U('body_v3_story.glb'));let mesh:THREE.Mesh|null=null;g.scene.traverse(o=>{if((o as THREE.Mesh).isMesh&&!mesh)mesh=o as THREE.Mesh;});
 const bm=mesh as unknown as THREE.Mesh,body=bm.geometry,dict=bm.morphTargetDictionary??{};
 // meshopt quantised the positions under a node transform: bake it into the geometry and its (relative) morph deltas
 g.scene.updateMatrixWorld(true);{const M=bm.matrixWorld.clone(),L3=new THREE.Matrix4().extractRotation(M),lin=M.clone().setPosition(0,0,0);
  const deq=(a:THREE.BufferAttribute|THREE.InterleavedBufferAttribute)=>{const f=new THREE.Float32BufferAttribute(a.count*3,3);for(let i=0;i<a.count;i++)f.setXYZ(i,a.getX(i),a.getY(i),a.getZ(i));return f;};
  body.setAttribute('position',deq(body.getAttribute('position')));body.setAttribute('normal',deq(body.getAttribute('normal')));
  body.morphAttributes.position=(body.morphAttributes.position??[]).map(a=>deq(a).applyMatrix4(lin));
  body.applyMatrix4(M);void L3;}
 const morphNames=Object.keys(dict).sort((a,b)=>dict[a]-dict[b]);
 const heartGeo=await (async()=>{const h=await loader.loadAsync(new URL('../intro/assets/heart.glb',import.meta.url).href);let m:THREE.Mesh|null=null;h.scene.traverse(o=>{if((o as THREE.Mesh).isMesh&&!m)m=o as THREE.Mesh;});return (m as unknown as THREE.Mesh).geometry;})();
 const hb=story.heart_approx;
 const figure=createFigure(body,heartGeo,{height:1.3,heart:[hb[0],hb[2],-hb[1]],silhouette:[]},'h5',morphNames);
 // glb vertices are three(figure frame) → put the figure frame's anchor on the spot
 const origin=toThree(A,A),anchor3=new THREE.Vector3(A[0],A[2],-A[1]);
 figure.group.position.copy(origin).sub(anchor3.clone().applyAxisAngle(new THREE.Vector3(0,1,0),SPOT.yaw));figure.group.rotation.y=SPOT.yaw;
 figure.line.visible=false;scene.add(figure.group);
 chair.position.copy(figure.group.position);chair.rotation.y=SPOT.yaw;   // chair glb shares the figure frame
 figure.group.updateMatrixWorld(true);
 const heartWorld=new THREE.Vector3(hb[0],hb[2],-hb[1]).applyMatrix4(figure.group.matrixWorld);
 figure.heartWorld.copy(heartWorld);
 const bu=figure.bodyMat.uniforms;bu.uHeart.value.copy(heartWorld);bu.uFeet.value=0;bu.uRefDist.value=2.6;bu.uSunOn.value=1;
 bu.tLight.value=arch.lightRT.depthTexture;bu.uLightVP.value=arch.lightVP;bu.uSunTo.value=arch.sunTo;figure.setBodyOpacity(1);
 bu.uScan.value=-1;bu.uScanOn.value=0;figure.heartMat.uniforms.uOpacity.value=1;   // fully revealed (the intro scan is not used here)
 {const q=new URLSearchParams(location.search),g=Number(q.get('heart')??1.6),f=Number(q.get('hfill')??.05);   // S-13: the intro's heart gain (1.6) + a faint fill so the R squeeze reads as area
  figure.heartMat.uniforms.uOpacity.value=g;figure.heartMat.uniforms.uFill.value=f;}
 // meshopt reorders vertices: find the electrode / sternum vertices by position (figure frame → three: x, z, −y)
 const P0=body.getAttribute('position');
 const nearest=(q:THREE.Vector3)=>{let bi=0,bd=Infinity;for(let i=0;i<P0.count;i++){const dx=P0.getX(i)-q.x,dy=P0.getY(i)-q.y,dz=P0.getZ(i)-q.z,d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;bi=i;}}return bi;};
 const VID:Record<string,number>={};
 for(const k of ['RA','LA','LL'] as const){const p=story.electrodes[k].p;VID[k]=nearest(new THREE.Vector3(p[0],p[2],-p[1]));}
 {const ra=story.electrodes.RA.p;let bi=-1,bz=-Infinity;for(let i=0;i<P0.count;i++){if(Math.abs(P0.getX(i))<.015&&Math.abs(P0.getY(i)-(ra[2]-.06))<.015&&P0.getZ(i)>bz){bz=P0.getZ(i);bi=i;}}VID.sternum=bi;}
 {const mw=figure.group.matrixWorld,q=new THREE.Vector3(),cp=toThree(story.cams.ma.loc,A);let bi=0,bd=Infinity;
  for(let i=0;i<P0.count;i++){q.fromBufferAttribute(P0,i).applyMatrix4(mw);const d=q.distanceTo(cp);if(d<bd){bd=d;bi=i;}}VID.fist=bi;}   // the fist is the body point nearest the low camera
 const infl=morphNames.map(()=>0);
 const setMorphs=(breath:number,fist:number)=>{             // fist 0..1 → neighbouring sampled shapes (PIP still leads MCP)
  const fs_=story.fist_s,mi=figure.bodyMesh.morphTargetInfluences!;mi.fill(0);
  const b=morphNames.indexOf('breath');if(b>=0)mi[b]=breath;
  if(fist>0){let j=0;while(j<fs_.length-1&&fist>fs_[j])j++;
   const lo=j===0?0:fs_[j-1],w=(fist-lo)/(fs_[j]-lo),name=(s:number)=>'fist'+Math.round(s*100);
   const ih=morphNames.indexOf(name(fs_[j]));if(ih>=0)mi[ih]=w;
   if(j>0){const il=morphNames.indexOf(name(fs_[j-1]));if(il>=0)mi[il]=1-w;}}
  for(let i=0;i<infl.length;i++)infl[i]=mi[i];
 };
 // electrodes follow the morphed skin: base + Σ w·delta for three vertices (glTF morphs are relative)
 const pos=body.getAttribute('position'),deltas=body.morphAttributes.position??[],nrm=body.getAttribute('normal');
 const skin=(v:number)=>{const p=new THREE.Vector3().fromBufferAttribute(pos,v);deltas.forEach((d,i)=>{if(infl[i])p.addScaledVector(new THREE.Vector3().fromBufferAttribute(d,v),infl[i]);});return p.applyMatrix4(figure.group.matrixWorld);};
 const foam=new THREE.MeshStandardMaterial({color:0xd8d4cc,roughness:.85});
 const ringMat=new THREE.MeshBasicMaterial({color:RED.clone(),transparent:true,opacity:0,toneMapped:false});
 const leadMat=new THREE.MeshBasicMaterial({color:RED.clone(),transparent:true,opacity:0,toneMapped:false});
 const discs=(['RA','LA','LL'] as const).map(k=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.019,.019,.003,24),foam);scene.add(m);return{k,m};});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.024,.0024,8,40),ringMat);scene.add(ring);
 let lead:THREE.Mesh|null=null;
 const nWorld=(v:number)=>new THREE.Vector3().fromBufferAttribute(nrm,v).applyQuaternion(figure.group.quaternion).normalize();
 function placeElectrodes(){
  for(const {k,m} of discs){const v=VID[k],p=skin(v),n=nWorld(v);m.position.copy(p).addScaledVector(n,.002);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),n);
   if(k==='RA'){ring.position.copy(p).addScaledVector(n,.004);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
    const c=new THREE.CatmullRomCurve3([p.clone().addScaledVector(n,.006),p.clone().addScaledVector(n,.03).add(new THREE.Vector3(0,-.08,0)),
     p.clone().multiply(new THREE.Vector3(1,1,1)).add(new THREE.Vector3((origin.x-p.x)*.6,-.26,0)).addScaledVector(n,.05)]);
    lead?.geometry.dispose();if(!lead){lead=new THREE.Mesh(new THREE.TubeGeometry(c,24,.0018,6),leadMat);scene.add(lead);}else lead.geometry=new THREE.TubeGeometry(c,24,.0018,6);}}
 }
 // P-b field (pli), S-05 (REVIEW-R1-STORY-20261011): sphere shells centred on the power strip, emitted on eighth notes
 // (4 + 5 rest, twice; fieldPulse.ts) and fading as they travel out — illustration of the strip's 60 Hz field, not a measurement
 const STRIP_C=new THREE.Vector3(-.95,.035,-3.62);               // power strip centre (archive frame → three), on the floor
 const shellMat=(u:{uA:{value:number},uBody:{value:number}})=>new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vN,vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  // rim (fresnel) for the shell's edge, a faint body so the inside reads as a volume, front faces a touch brighter
  fragmentShader:'uniform float uA,uBody;varying vec3 vN,vV;void main(){float c=abs(dot(normalize(vN),normalize(vV))),f=max(0.,1.-c);float rim=pow(f,2.4)*.95+pow(f,7.)*.9,body=uBody;gl_FragColor=vec4(vec3(1.,.27,.38)*(rim+body)*(gl_FrontFacing?1.:.55)*uA,1.);}'});
 const shells=Array.from({length:8},()=>{const u={uA:{value:0},uBody:{value:.06}};const m=new THREE.Mesh(new THREE.SphereGeometry(1,72,36),shellMat(u));m.visible=false;m.position.copy(STRIP_C);m.renderOrder=3;scene.add(m);return{m,u};});
 // nearest distance strip → body (the field must pass the figure)
 let reach=Infinity;{const mw=figure.group.matrixWorld,q=new THREE.Vector3();for(let i=0;i<P0.count;i+=17){q.fromBufferAttribute(P0,i).applyMatrix4(mw);reach=Math.min(reach,q.distanceTo(STRIP_C));}}
 const R_MAX=Math.max(1.6,reach*2.2),EMIT=emissionTimes(13.0);
 // S-04 (plan IDEA-R1-NOISE §8.3): at the strip close-up a speech-bubble board pops up with an AC sine and "교류 60 Hz".
 // The sine scrolls at a symbolic speed (a real 60 Hz would strobe at 60 fps) — said in the small line.
 function drawBubble(t:number){
  const pop=ss(10.7,11.0,t),out=1-ss(12.9,13.3,t),k=pop*out;if(k<=.003)return;
  const a=STRIP_C.clone().add(new THREE.Vector3(.06,.045,0)).project(camera);if(a.z>1)return;   // tail tip on the strip top, between sockets 2 and 3
  // above-right of the strip, but never into the scene title (top 18 %); when that would put it below the anchor, beside it (left)
  const ax=(a.x*.5+.5)*W,ay=(-a.y*.5+.5)*H,bw=Math.min(300,.2*W),bh=bw*.56,top=.18*H;
  let bx=ax+.05*W,by=ay-bh-.1*H,side=false;
  if(by<top){by=top;if(by+bh>ay-.03*H){side=true;bx=ax-bw-.06*W;by=clamp(ay-bh*.85,top,H-bh-.12*H);}}
  const over=1+.12*Math.sin(Math.PI*clamp((t-10.7)/.42))*(1-ss(10.95,11.15,t));   // one overshoot (0.3 s pop)
  const px=side?bx+bw:bx,py=side?by+bh*.7:by+bh;                                   // scale about the tail root
  og.save();og.globalAlpha=k;og.translate(px,py);og.scale(pop*over,pop*over);og.translate(-px,-py);
  if(QA.ac!=='C0'){   // C1: the AC source symbol only (circle, sine, two leads) · C2: + "60 Hz" in the small mono tier
   const r=Math.min(bw,bh)*.34,lead=r*.75,cx0=clamp(ax,r+lead+16,W-r-lead-16),cy0=Math.max(top+r,ay-r*3.1);   // straight above the strip, under the title band
   og.lineCap='round';og.strokeStyle='rgba(255,236,220,.95)';og.lineWidth=Math.max(2,r*.09);og.shadowColor='rgba(255,90,100,.8)';og.shadowBlur=12;
   og.beginPath();og.arc(cx0,cy0,r,0,Math.PI*2);og.moveTo(cx0-r-lead,cy0);og.lineTo(cx0-r,cy0);og.moveTo(cx0+r,cy0);og.lineTo(cx0+r+lead,cy0);og.stroke();
   const draw=ss(11.0,11.6,t),ph=.35*t;og.strokeStyle='rgba(255,98,112,1)';og.lineWidth=Math.max(2.2,r*.1);og.beginPath();
   for(let i=0;i<=60*draw;i++){const u=i/60,x=cx0-r*.62+u*r*1.24,y=cy0-r*.38*Math.sin(2*Math.PI*(u-ph*.0));i?og.lineTo(x,y):og.moveTo(x,y);}og.stroke();og.shadowBlur=0;
   // tail: a thin line from the symbol to the strip
   og.strokeStyle='rgba(255,214,170,.5)';og.lineWidth=1.2;og.beginPath();og.moveTo(cx0,cy0+r+(QA.ac==='C2'?r*.75:4));og.lineTo(ax,ay-6);og.stroke();
   if(QA.ac==='C2'){og.fillStyle='rgba(255,233,210,.85)';og.font=`500 ${Math.max(11,Math.round(r*.32))}px 'IBM Plex Mono', monospace`;og.textAlign='center';og.fillText('60 Hz',cx0,cy0+r+Math.max(14,r*.55));og.textAlign='start';}
   og.restore();return;}
  og.fillStyle='rgba(16,13,12,.86)';og.strokeStyle='rgba(255,214,170,.85)';og.lineWidth=1.4;
  og.beginPath();og.roundRect(bx,by,bw,bh,12);
  if(side){og.moveTo(bx+bw,by+bh*.55);og.lineTo(ax-4,ay-2);og.lineTo(bx+bw,by+bh*.78);}else{og.moveTo(bx+22,by+bh);og.lineTo(ax+2,ay-4);og.lineTo(bx+46,by+bh);}
  og.closePath();og.fill();og.stroke();
  // sine: drawn left → right, then scrolls slowly
  const draw=ss(11.0,11.8,t),pad=18,sx=bx+pad,sw=bw-2*pad,sy=by+bh*.33,amp=bh*.15;
  og.beginPath();for(let i=0;i<=120*draw;i++){const u=i/120,x=sx+u*sw,y=sy-amp*Math.sin(2*Math.PI*(2*u-.35*t));i?og.lineTo(x,y):og.moveTo(x,y);}
  og.strokeStyle='rgba(255,98,112,1)';og.lineWidth=2.4;og.shadowColor='rgba(255,60,80,.9)';og.shadowBlur=10;og.stroke();og.shadowBlur=0;
  og.strokeStyle='rgba(255,214,170,.25)';og.lineWidth=1;og.beginPath();og.moveTo(sx,sy);og.lineTo(sx+sw,sy);og.stroke();
  og.fillStyle='#fff3e6';og.font=`600 ${Math.round(bh*.17)}px Pretendard, sans-serif`;og.textBaseline='alphabetic';og.fillText('교류 60 Hz',sx,by+bh*.73);
  og.fillStyle='rgba(255,233,210,.6)';og.font=`500 ${Math.max(10,Math.round(bh*.075))}px 'IBM Plex Mono', monospace`;og.fillText('AC · 물결 속도는 상징',sx,by+bh*.89);
  og.restore();
 }

 // S-03: the detailed strip replaces the baked box (scripts/assets/power-strip-v1.py; same spot)
 // archive.glb is merged by material, so the baked box strip (build_archive.py PowerStrip/StripHole/StripSwitch/Plug: 0.30 ×
 // 0.07 m, up to 8.5 cm with the plug) is removed here by dropping the triangles whose centre lies in its volume (floor kept).
 // 2026-10-14 (user: "컴퓨터쪽 에셋들은 퀄리티가 … 구식 게임의 에셋같은"): the baked PC case, CRT, keyboard and ECG device boxes go the
 // same way and scripts/assets/workstation-v1.py replaces them. Archive frame (x, y, z) → three (x, z, −y); desk top z 0.77 kept.
 const A2T=(x0:number,y0:number,z0:number,x1:number,y1:number,z1:number)=>new THREE.Box3(new THREE.Vector3(x0,z0,-y1),new THREE.Vector3(x1,z1,-y0));
 const trimBoxes=[new THREE.Box3(STRIP_C.clone().add(new THREE.Vector3(-.165,-.032,-.04)),STRIP_C.clone().add(new THREE.Vector3(.165,.055,.04))),
  A2T(-2.63,3.46,.775,-2.17,4.04,1.28),      // PC case + CRT body/back/screen (DESK −2.35, 3.55)
  A2T(-2.63,3.18,.775,-2.17,3.36,.83),       // keyboard
  A2T(-1.71,3.74,.815,-1.29,4.06,.94),       // ECG device on the cart (CART −1.5, 3.9)
  A2T(-1.96,3.54,.775,-1.84,3.86,1.23)];     // baked desk lamp (shade toward the back of the desk) → desk_lamp.glb, turned to the keyboard (D-067)
 {const inAny=(p:THREE.Vector3)=>trimBoxes.some(b=>b.containsPoint(p));
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  arch.room.updateMatrixWorld(true);arch.room.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;const g=m.geometry,P=g.getAttribute('position');
   const idx=g.index?Array.from(g.index.array):Array.from({length:P.count},(_,i)=>i),keep:number[]=[];
   const groups=g.groups.length?g.groups.map(x=>({...x})):[{start:0,count:idx.length,materialIndex:0}],out:{start:number,count:number,materialIndex?:number}[]=[];
   for(const gr of groups){const s0=keep.length;
    for(let i=gr.start;i<gr.start+gr.count;i+=3){a.fromBufferAttribute(P,idx[i]).applyMatrix4(m.matrixWorld);b.fromBufferAttribute(P,idx[i+1]).applyMatrix4(m.matrixWorld);c.fromBufferAttribute(P,idx[i+2]).applyMatrix4(m.matrixWorld);
     if(!inAny(a.add(b).add(c).multiplyScalar(1/3)))keep.push(idx[i],idx[i+1],idx[i+2]);}
    out.push({start:s0,count:keep.length-s0,materialIndex:gr.materialIndex});}
   if(keep.length<idx.length){g.setIndex(keep);if(g.groups.length){g.clearGroups();out.forEach(x=>g.addGroup(x.start,x.count,x.materialIndex));}}});}
 const strip=(await loader.loadAsync(U('power_strip.glb'))).scene;scene.add(strip);
 const workstation=(await loader.loadAsync(U('workstation.glb'))).scene;scene.add(workstation);
 // D-067 (user 2026-10-15 "조명은 A+B로"): A desk lamp on (warm pool on the desk + a light cone), B screens glow (no content).
 // Added on top of the bake: archive.ts practical() for the baked room, three lights for the PBR props, a light cone marched in the archive shaft pass.
 const lampInfo:{bulb:number[],dir:number[]}=await (await fetch(U('desk_lamp.json'))).json();
 const LAMP_P=new THREE.Vector3(...lampInfo.bulb),LAMP_D=new THREE.Vector3(...lampInfo.dir).normalize(),DESK_TOP=.775;
 const lamp=(await loader.loadAsync(U('desk_lamp.glb'))).scene;scene.add(lamp);
 const bulbMats:THREE.MeshStandardMaterial[]=[],screenMats:THREE.MeshStandardMaterial[]=[],emit0=new Map<THREE.MeshStandardMaterial,[THREE.Color,number]>();
 lamp.traverse(o=>{const m=(o as THREE.Mesh).material as THREE.MeshStandardMaterial|undefined;if(m?.name?.endsWith('_light'))bulbMats.push(m);});
 // CRT glass: a soft radial glow, brighter in the middle (no picture, no waveform — decorative space)
 const crtTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!,r=g.createRadialGradient(64,64,6,64,64,78);
  r.addColorStop(0,'#ffffff');r.addColorStop(.55,'#9aa6b4');r.addColorStop(1,'#1c2026');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 workstation.traverse(o=>{const m=(o as THREE.Mesh).material as THREE.MeshStandardMaterial|undefined;if(!m)return;
  if(m.name==='ws_crt_glass'||m.name==='ws_ecg_screen')emit0.set(m,[m.emissive.clone(),m.emissiveIntensity]);   // L0 = as before
  if(m.name==='ws_crt_glass'){m.roughness=.4;screenMats.push(m);}   // rougher: no point-light hotspot on the glass
  else if(m.name==='ws_ecg_screen'){m.roughness=.6;screenMats.push(m);}});
 const V3t=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const CRT_P=V3t(-2.40,1.155,-3.49),CRT_N=new THREE.Vector3(0,0,1),ECG_P=V3t(-1.44,.985,-3.82),ECG_N=new THREE.Vector3(0,.42,.91).normalize();
 const lampLight=new THREE.SpotLight(0xffc98f,0,2.4,.62,.55,2);lampLight.position.copy(LAMP_P);lampLight.target.position.copy(LAMP_P.clone().add(LAMP_D));scene.add(lampLight,lampLight.target);
 const crtLight=new THREE.PointLight(0x9fc4e6,0,1.8,2);crtLight.position.copy(CRT_P).addScaledVector(CRT_N,.3);scene.add(crtLight);
 const ecgLight=new THREE.PointLight(0x39d27a,0,1.2,2);ecgLight.position.copy(ECG_P).addScaledVector(ECG_N,.3);scene.add(ecgLight);
 const LK=Number(qp.get('lamp')??1),SK=Number(qp.get('scr')??1),CK=Number(qp.get('cone')??1);   // QA strengths
 {const su=arch.shared;su.uLampP.value.copy(LAMP_P);su.uLampD.value.copy(LAMP_D);su.uLampMinY.value=DESK_TOP;
  su.uScrP.value[0].copy(CRT_P);su.uScrN.value[0].copy(CRT_N);su.uScrP.value[1].copy(ECG_P);su.uScrN.value[1].copy(ECG_N);}
 function setLights(on:boolean){const k=on?1:0,su=arch.shared;
  su.uPrac.value=k;su.uLampCol.value.set(1,.74,.46).multiplyScalar(.21*LK);su.uScrCol.value[0].set(.55,.68,.85).multiplyScalar(.05*SK);su.uScrCol.value[1].set(.2,.8,.4).multiplyScalar(.025*SK);
  lampLight.intensity=.9*LK*k;crtLight.intensity=.18*SK*k;ecgLight.intensity=.04*SK*k;
  bulbMats.forEach(m=>{m.emissive.set(0xffd9a8);m.emissiveIntensity=on?6:0;});
  screenMats.forEach(m=>{const [c0,i0]=emit0.get(m)!;if(!on){m.emissive.copy(c0);m.emissiveIntensity=i0;m.emissiveMap=null;m.needsUpdate=true;return;}
   if(m.name==='ws_crt_glass'){m.emissive.set(0x9fc4e6);m.emissiveMap=crtTex;m.emissiveIntensity=.38*SK;}else{m.emissive.set(0x2fa865);m.emissiveIntensity=.22*SK;}m.needsUpdate=true;});cone.uniforms.uOn.value=on?CK:0;}
 // camera from story.json ('ma' for pli/ma, 'side' for bw — the person's right, D-054)
 const camFrom=(name:string)=>{const d=story.cams[name],e=d.rot_euler,eul=new THREE.Euler(e[0],e[1],e[2],'ZYX');   // Blender XYZ euler = Rz·Ry·Rx = three order ZYX
  const f=new THREE.Vector3(0,0,-1).applyEuler(eul);return{def:d,loc:toThree(d.loc,A),look:toThree([d.loc[0]+f.x,d.loc[1]+f.y,d.loc[2]+f.z],A)};};
 const camera=new THREE.PerspectiveCamera(60,1,.05,60);camera.up.set(0,1,0);
 // second pass (IDEA-R1-NOISE §10): per-scene camera path that settles on the first pass's composition. Keys are
 // (time, position, look, horizontal fov); between keys the view direction turns about the look point (orbit-like) and
 // the distance / look / fov ease, so pull-backs, orbits, tracking and the crane read as one continuous move.
 type Key={t:number,pos:THREE.Vector3,look:THREE.Vector3,hfov:number,ease?:'whip',cut?:false};   // cut:false — no near-plane cutaway at this key
 const deg=(r:number)=>r*180/Math.PI,hfovOf=(lens:number)=>2*Math.atan(18/lens);
 figure.group.updateMatrixWorld(true);const figSphere=new THREE.Box3().setFromObject(figure.bodyMesh).getBoundingSphere(new THREE.Sphere());
 const V3=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const H0=heartWorld.clone(),Fo=origin.clone();
 const STRIP=V3(-.97,.05,-3.62),DESK=V3(-2.35,1.0,-3.55);         // archive power strip / desk (Blender archive frame → three)
 function finalFor(cond:Cond){
  const c=camFrom(cond==='bw'?'side':'ma');
  // K-06 (user 2026-10-12): the ma framing at fist height, fist and heart filling the frame. The 10/8 recording shows it
  // ~12 % tighter than a 16:9 canvas does (narrower browser canvas); the default keeps the camera and narrows the lens to match
  const zoom=cond==='ma'&&new URLSearchParams(location.search).get('macam')!=='a'?.88:1;   // B is the default (user 2026-10-12); ?macam=a = the full 16:9 lens
  if(c.def.type!=='ortho')return{pos:c.loc,look:c.look,h:hfovOf(c.def.lens??16)*zoom};
  // B-b side view: the stills' orthographic camera becomes a long lens far away, a little from above (the near armrest)
  const fwd=c.look.clone().sub(c.loc).normalize(),pivot=c.loc.clone().addScaledVector(fwd,Math.abs(c.def.loc[0]));
  // S-09: inside the room (2.4 m, above the desk and monitor) — the 4.5 m position was behind the wall, so the orbit to it
  // crossed the stack row and the desk (story-check 2026-10-11). Same framing width as the stills' ortho scale.
  const D=2.4;return{pos:pivot.clone().addScaledVector(fwd,-D).add(V3(0,.62,0)),look:pivot.clone().add(V3(0,.05,0)),h:2*Math.atan((c.def.ortho_scale??1.9)/2/D)};
 }
 const maDef=story.cams.ma,maE=maDef.rot_euler,maF=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(maE[0],maE[1],maE[2],'ZYX'));
 const maPos=toThree(maDef.loc,A),maLook=toThree([maDef.loc[0]+maF.x,maDef.loc[1]+maF.y,maDef.loc[2]+maF.z],A),maH=hfovOf(maDef.lens??16);
 // strip close-up candidates (offsets from the strip; t10 approach, t13 close-up, close-up hfov)
 //  A0 current: ~0.4 m, low · A1 farther: ~0.85 m, the whole strip and floor around it · A2 above: ~0.9 m looking down, shells read as rings
 const COMP:Record<string,[THREE.Vector3,THREE.Vector3,number]>={A0:[V3(.5,.45,-.5),V3(.28,.17,-.24),.7],A1:[V3(.75,.65,-.7),V3(.55,.38,-.48),.75],A2:[V3(.6,.95,-.55),V3(.3,.85,-.3),.8]};
 function keysFor(cond:Cond):Key[]{
 const {pos:finalPos,look:finalLook,h:finalH}=finalFor(cond);
 const K:Record<Cond,Key[]>={
  pli:[{t:0,pos:H0.clone().add(V3(0,.05,.75)),look:H0,hfov:.42},
   {t:3,pos:H0.clone().add(V3(.1,.1,.95)),look:H0,hfov:.85},
   {t:7,pos:Fo.clone().add(V3(1.25,1.15,1.35)),look:H0.clone().lerp(DESK,.55),hfov:.95},          // orbit: desk + computer behind
   {t:10,pos:STRIP.clone().add(COMP[QA.comp]?.[0]??COMP.A0[0]),look:STRIP,hfov:.9},                    // down to the strip from behind-right (open floor; S-02/S-09)
   {t:13,pos:STRIP.clone().add(COMP[QA.comp]?.[1]??COMP.A0[1]),look:STRIP,hfov:(COMP[QA.comp]??COMP.A0)[2] as number},   // the strip close-up (bubble + first shells); candidates A0–A2
   {t:15,pos:STRIP.clone().add(V3(.45,1.45,-.5)),look:STRIP.clone().add(V3(.1,.3,.2)),hfov:.95},                  // crane rises straight up behind the strip (clear of chair and figure)
   {t:17,pos:Fo.clone().add(V3(1.6,2.35,.85)),look:Fo.clone().add(V3(-.2,.55,-.25)),hfov:hfovOf(24),cut:false},   // crane up, wide — right of the lamp over the chair (④ foreground, 2026-10-12)
   {t:18.6,pos:finalPos,look:finalLook,hfov:finalH,ease:'whip'}],                               // whip zoom on a beat
  bw:[{t:0,pos:maPos,look:maLook,hfov:maH},{t:4,pos:finalPos,look:finalLook,hfov:finalH}],         // 90° orbit to the side view
  ma:[{t:0,pos:Fo.clone().add(V3(-1.3,1.0,.6)),look:H0,hfov:.9},{t:4,pos:finalPos,look:finalLook,hfov:finalH},
   {t:31,pos:finalPos,look:finalLook,hfov:finalH},{t:35,pos:Fo.clone().add(V3(1.4,2.8,1.9)),look:Fo.clone().add(V3(-.4,.4,-.4)),hfov:hfovOf(22),cut:false}]};   // end: crane up over the archive → Lab (right of the hanging lamp, below the stack tops: ④ + clearance, 2026-10-12)
 return K[cond];}
 // S-07: a scene ends only on the explicit button. HOLD = key time of the settled composition; after leave() the camera
 // plays the outro keys (if any) and the scene hands over after OUTLEN (curtain lift, or black into Lab for the last one)
 let HOLD=0,OUTLEN=1.2,leaveT=-1,ended=false,keys:Key[]=[],TP=0,last=!!opt.last;
 const cur={look:new THREE.Vector3(),h:1};                        // the camera's current look point / fov (scene hand-over)
 const ez=(k:number)=>k<.5?4*k*k*k:1-(-2*k+2)**3/2,whip=(k:number)=>1-(1-k)**4;
 const tmpD=new THREE.Vector3();
 function camAt(t:number,breathOff=0){
  let i=0;while(i<keys.length-1&&t>=keys[i+1].t)i++;
  const a=keys[i],b=keys[Math.min(i+1,keys.length-1)],u=b===a?1:clamp((t-a.t)/(b.t-a.t)),k=b.ease==='whip'?whip(u):ez(u);
  const look=a.look.clone().lerp(b.look,k),da=a.pos.clone().sub(a.look),db=b.pos.clone().sub(b.look);
  const dist=THREE.MathUtils.lerp(da.length(),db.length(),k);
  const qa=new THREE.Quaternion(),q=new THREE.Quaternion().setFromUnitVectors(da.clone().normalize(),db.clone().normalize());
  tmpD.copy(da).normalize().applyQuaternion(qa.slerp(q,k)).multiplyScalar(dist);
  camera.position.copy(look).add(tmpD);camera.position.y+=breathOff;camera.lookAt(look.x,look.y+breathOff,look.z);
  const h=THREE.MathUtils.lerp(a.hfov,b.hfov,k);cur.look.copy(look);cur.h=h;camera.fov=deg(2*Math.atan(Math.tan(h/2)/camera.aspect));
  // long views skip the stacks between camera and figure — but the near plane must never cut the figure (S-02: the 0:10
  // "camera inside the body" was this plane slicing the body), so it stops 15 cm short of the figure's bounding sphere
  // ④ (2026-10-12): the cutaway also slices furniture beside the line of sight (a stack side panel became a wedge in the
  // cranes), so keys marked cut:false fade it out — the room then frames the shot as it really stands
  const cutK=THREE.MathUtils.lerp(a.cut===false?0:1,b.cut===false?0:1,k);
  const nearCut=dist>2.5?Math.max(.05,Math.min(dist-.8,camera.position.distanceTo(figSphere.center)-figSphere.radius-.15)):.03;
  camera.near=THREE.MathUtils.lerp(Math.min(.05,nearCut),nearCut,cutK);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 // D-067 A: the lamp's light cone is marched in the archive shaft pass (archive.ts lampCone; one pass, no mesh edges; the desk
 // top, the monitor and the figure cut it through the scene depth)
 {const u=arch.vol.uniforms;u.uCLP.value.copy(LAMP_P);u.uCLD.value.copy(LAMP_D);u.uCMinY.value=DESK_TOP;}
 const cone={uniforms:{uOn:arch.vol.uniforms.uCOn}};
 // post (as the intro archive): depth-carrying buffers for the shaft pass, bloom, output, grade
 // MSAA on the composer target (2026-10-12 user: "테두리에 계단 현상"): the canvas antialias flag does not reach a post chain
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:Math.min(Number(new URLSearchParams(location.search).get('msaa')??4),renderer.capabilities.maxSamples),depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)}));
 composer.addPass(new RenderPass(scene,camera));composer.addPass(arch.vol);setLights(QA.light==='L1');
 // M-b shallow focus (§10.4): focus rides the wave — fist → shoulder → RA
 const bokeh=new BokehPass(scene,camera,{focus:1,aperture:0,maxblur:.008});composer.addPass(bokeh);bokeh.enabled=false;
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.35,.8);composer.addPass(bloom);composer.addPass(new OutputPass());
 const grade=createGrade();composer.addPass(grade);
 // wave panel (stored samples, intro sweep rules) + 4-cell processing strip above it
 const grid=createGrid(dom.grid);
 const mkSweep=()=>createSweep(dom.sweep,{gridHot:grid.hot,fs:data.fs,loop:data.loop,input:{values:data.input,color:[255,188,121],glow:.45,core:.78,white:.35},output:{values:data.output,color:[103,231,195]},mvPerBox:3.6});
 let sweep=mkSweep();const wave=createWaveMode();let lastT=0,ui='';
 const og=dom.overlay.getContext('2d')!;
 let W=0,H=0,panelMid=0;
 const sternumPx=()=>{const p=skin(VID.sternum).project(camera);return{x:(p.x*.5+.5)*W,y:(-p.y*.5+.5)*H};};
 function resize(){
  W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio||1,1.25);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);bloom.resolution.set(W*pr/2,H*pr/2);
  arch.setPx(H,pr);grade.uniforms.uAspect.value=W/H;
  // panel layout is measured on the settled composition (TP), then the camera goes back where it was (scene hand-over)
  const keep={p:camera.position.clone(),q:camera.quaternion.clone(),fov:camera.fov,near:camera.near,look:cur.look.clone(),h:cur.h};
  camera.aspect=W/H;camAt(TP);
  // B-b: the panel's 0 mV sits at the exhaled chest height (layout only); other scenes centre it
  setMorphs(0,0);figure.group.updateMatrixWorld(true);panelMid=data.cond==='bw'?sternumPx().y:.5*H;
  const half=.2*H,b={l:.64*W,r:.97*W,t:panelMid-half,b:panelMid+half},mv=mvPerBoxFor(b,2.5);sweep.resize(b,mv);grid.resize(b,2.5,mv);
  dom.overlay.width=W*pr;dom.overlay.height=H*pr;og.setTransform(pr,0,0,pr,0,0);
  const strip=dom.cells[0]?.parentElement;if(strip)Object.assign(strip.style,{left:b.l+'px',top:Math.max(12,b.t-46)+'px',width:(b.r-b.l)+'px'});
  camera.position.copy(keep.p);camera.quaternion.copy(keep.q);camera.fov=keep.fov;camera.near=keep.near;camera.updateProjectionMatrix();camera.updateMatrixWorld();cur.look.copy(keep.look);cur.h=keep.h;
 }
 // stored-trace timings (per scene)
 // shell clock (B1/B2 slow it near the camera), first contact with the body and each shell's arrival (D1 inflow pulses)
 const REF_D=1.6;let sClock=0,contactT=-1;const arrive:number[]=[],arrived=new Set<number>();
 let T=0,bw:ReturnType<typeof breathFromBaseline>|null=null,drive:ReturnType<typeof createFistDrive>|null=null,PROC=0;
 const breathFixed=(t:number)=>{const u=t%5;return u<2?ss(0,2,u):1-ss(2,5,u);};              // D-053: 2 per 10 s
 // S-14 (user 2026-10-12): fist and red marker follow the stored muscle noise itself (fistDrive.ts) — the fist closes at a
 // constant speed while a burst lasts and opens when it subsides; the red band climbs the forearm while the noise lasts,
 // as bright as the noise is loud. (The old clench-start timing also broke when the S-07 scene HOLD shadowed the fist HOLD.)
 const RELAUNCH=.7;
 /** Pose of the figure and the camera's breath offset at scene time t (shared by the frame update and the self-check). */
 const BREATH_WEAK=Number(new URLSearchParams(location.search).get('breathk')??.5);   // S-12: breath outside bw, ×0.5 (user 2026-10-12: ×0.3 hard to see; QA: ?breathk=1 is the 10/8 strength)
 // S-10 legibility in the side view (bw): ?legib=0 none, 1 cyan outline, 2 denser body, 3 both (default 3, user to choose)
 const LEGIB=Number(new URLSearchParams(location.search).get('legib')??1);   // S-15: outline only by default (the denser body was whiter and hid the heart)
 const CHEST=Number(new URLSearchParams(location.search).get('chest')??.8);
 const BW_EXPO=Number(new URLSearchParams(location.search).get('bwexpo')??.45),BW_RAY=Number(new URLSearchParams(location.search).get('bwray')??.9),BW_EDGE=Number(new URLSearchParams(location.search).get('bwedge')??.6);   // S-15 (QA: ?bwexpo= ?bwray=)   // S-13 chest window strength (QA: ?chest=0..1)
 function poseAt(t:number){
  const tl=((t%T)+T)%T,breath=bw?bw.breath[Math.min(bw.breath.length-1,Math.floor(tl*data.fs))]:breathFixed(t);
  // S-12 / A-02: outside the baseline-wander scene the breath stays visible but small (×0.5), so it does not suggest a
  // baseline wander the shown noise does not have
  return{breath:bw?breath:breath*BREATH_WEAK,fist:data.cond==='ma'&&t>2&&drive?drive.fist(tl):0,breathOff:bw&&t>4?.015*(2*breath-1):0};
 }
 let t0=performance.now(),frozen=opt.frozenT,frame=0;
 /** Start a scene on the same stage: the camera path begins where the previous scene's camera is (no cut, no reload). */
 function setScene(d:NoiseData,o:{last?:boolean}={}){
  const handover=keys.length>0;data=d;last=!!o.last;ended=false;leaveT=-1;
  T=data.input.length/data.fs;bw=data.cond==='bw'?breathFromBaseline(data.input,data.fs):null;
  drive=data.cond==='ma'?createFistDrive(data.input,data.clean,data.fs):null;
  HOLD={pli:18.6,bw:4,ma:31}[data.cond];OUTLEN=data.cond==='ma'?4:1.2;TP={pli:19,bw:11,ma:11}[data.cond];PROC=TP+3;   // panel (right curtain + wave) from TP; strip after the inflow
  keys=keysFor(data.cond);sClock=0;contactT=-1;arrive.length=0;arrived.clear();
  if(handover)keys[0]={t:0,pos:camera.position.clone(),look:cur.look.clone(),hfov:cur.h};
  bokeh.enabled=data.cond==='ma';shells.forEach(({m})=>{m.visible=false;});
  sweep=mkSweep();wave.reset();ui='';t0=performance.now();if(frozen!==null)frozen=0;resize();
 }
 setScene(data0,{last:opt.last});addEventListener('resize',resize);
 const clock=()=>frozen??(performance.now()-t0)/1000;
 function update(){
  const t=clock(),tl=((t%T)+T)%T;frame++;
  // motion
  const pz=poseAt(t),breath=qaBreath??pz.breath,{fist,breathOff}=pz;
  const panelK=ss(TP,TP+.6,t)*(last||leaveT<0?1:1-ss(leaveT,leaveT+1.2,t));   // the curtain lifts before the next scene
  camAt(leaveT<0?Math.min(t,HOLD):HOLD+(t-leaveT),breathOff);    // camera before anything is projected
  if(camFix){camera.position.copy(camFix.p);camera.lookAt(camFix.l);camera.fov=camFix.fov;camera.near=.05;camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  setMorphs(breath,fist);placeElectrodes();
  // inflow markers
  let common=0,ringK=0,leadK=0,front=-1,waveK=0;
  // shells (pli): D0 = 4 + 5 eighth notes ×2 (S-05); D1 = one per second from 13 s until the scene ends (2026-10-14 candidate)
  if(data.cond==='pli'){
   const dts=Math.min(.1,Math.max(0,t-lastT)),dc=camera.position.distanceTo(STRIP_C),kd=clamp(dc/REF_D,.3,1);
   const raw=t-lastT;
   if(t<lastT-1e-3){contactT=-1;arrive.length=0;arrived.clear();}
   if(t<12.5||QA.speed==='B0'||raw<0||raw>.5)sClock=t;else sClock+=dts*kd;   // jumps (seek, capture) resync to real time
   shells.forEach(({m,u},i)=>{
    const n=Math.floor((sClock-13)/1.0)-i,emit=QA.sonar==='D1'?(n>=0?13+n:-1):EMIT[i];
    const st=emit>=0?shell(sClock,emit,R_MAX):null;m.visible=!!st&&st.a>.004;if(!st)return;
    m.scale.setScalar(st.r);const inside=camera.position.distanceTo(STRIP_C)/st.r,fr=Math.max(0,1-st.r/R_MAX);
    let a=st.a*.85*(inside<1?.06+.94*ss(.82,1,inside):1);
    if(QA.speed==='B2')a*=clamp(dc/REF_D,.4,1);                                 // close: fainter too
    if(QA.sonar==='D1'){if(QA.fade==='Ea')a*=.5;else if(QA.fade==='Ec')a*=fr>0?.35*fr**.6/fr**1.35:0;else a*=.8;}   // Ea low start · Eb rim only · Ec slow fade, low peak
    u.uA.value=a;u.uBody.value=QA.sonar==='D1'&&QA.fade==='Eb'?0:.06;m.visible=a>.004;
    if(st.r>=reach&&!arrived.has(emit)){arrived.add(emit);arrive.push(t);if(contactT<0)contactT=t;}
   });
   if(contactT>=0){const p=t-contactT;
    if(QA.sonar==='D1'){let pulse=0;for(const ta of arrive){const d=t-ta;if(d>=0&&d<1)pulse=Math.max(pulse,Math.sin(Math.PI*d));}   // each arrival: the RA lead brightens and fades
     common=.7*ss(0,1.2,p)*(1-.85*ss(1.4,2.2,p))+.12*pulse;ringK=Math.max(.35*ss(1.4,2.2,p),pulse);leadK=Math.max(.35*ss(1.6,2.4,p),pulse);}
    else{common=.7*ss(0,1.2,p)*(1-.85*ss(1.4,2.2,p));ringK=ss(1.4,2.2,p);leadK=ss(1.6,2.4,p);}}   // field reaches the body as the crane ends
  }
  if(data.cond==='ma'&&t>4&&drive){const b=drive.burstAt(tl),lv=Math.min(1,drive.level(tl)*1.6);
   if(b){const k=b.active?b.since%RELAUNCH:b.since-Math.floor(b.len/RELAUNCH)*RELAUNCH;   // relaunch while the noise lasts; the last climb finishes
    if(k<RELAUNCH){front=(ss(0,.6,k)*1.15-.05)*story.ra_arc_m;waveK=12*lv;ringK=ss(.45,.55,k)*(1-ss(.55,RELAUNCH,k)*.6)*lv;leadK=ringK;}}}
  if(data.cond!=='pli')shells.forEach(({m})=>{m.visible=false;});
  if(bokeh.enabled){const fistP=skin(VID.fist),raP=skin(VID.RA),k=front<0?0:clamp(front/story.ra_arc_m);
   const target=fistP.lerp(raP,k*k*(3-2*k));(bokeh.uniforms as Record<string,{value:number}>).focus.value=camera.position.distanceTo(target);
   (bokeh.uniforms as Record<string,{value:number}>).aperture.value=t<4?.0005:.006;}
  bu.uCommon.value=common;bu.uFront.value=front;bu.uWaveK.value=waveK;
  {const k=data.cond==='bw'?ss(1,4,t):0;bu.uEdgeK.value=LEGIB&1?BW_EDGE*k:0;bu.uDense.value=LEGIB&2?.35*k:0;
   // S-15 (user 2026-10-12): side view — body darker ("너무 밝은 느낌") and see-through along the heart → camera line
   bu.uExposure.value=.42*(1-(1-BW_EXPO)*k);bu.uRay.value=BW_RAY*k;}
  bu.uChest.value=CHEST;   // eases in with the orbit (no pop)
  ringMat.opacity=ringK;leadMat.opacity=leadK;
  // heart + sweep on the same clock
  const ph=beatPhase(data.loop,data.fs,t);figure.beat(ph,1);
  const dtF=Math.min(.1,Math.max(0,t-lastT));lastT=t;
  wave.update({procOn:t>PROC,prevR:ph.prev,t,dt:dtF,reduced:opt.reduced});
  sweep.draw({t,startAbs:0,mix:wave.mix,alpha:panelK,reduced:opt.reduced,ring:null,comet:null,flash:wave.flash,gridAlpha:1,weights:wave.weights()});
  const filled=wave.quarters;dom.cells.forEach((c,i)=>c.classList.toggle('on',i<filled));
  const u=`${wave.atEnd&&leaveT<0}|${wave.phase==='overlay'}|${wave.phase}`;if(u!==ui){ui=u;opt.onUi?.({atEnd:wave.atEnd&&leaveT<0,overlay:wave.phase==='overlay',phase:wave.phase});}
  dom.grid.style.opacity=String(panelK);const sp=dom.cells[0]?.parentElement;if(sp)sp.style.opacity=String(panelK);
  // overlay: right ~40 % darkened to 70 % (left → right ramp) + B-b thread
  og.clearRect(0,0,W,H);const gr=og.createLinearGradient(.58*W,0,.66*W,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.7)');
  og.fillStyle=gr;og.globalAlpha=panelK;og.fillRect(.58*W,0,.42*W,H);
  if(bw&&panelK>.01){const c=sternumPx(),hx=sweep.slotX(Math.floor(t*data.fs)),base=bw.base[Math.min(bw.base.length-1,Math.floor(tl*data.fs))],hy=sweep.yOf(base);
   og.lineCap='round';for(const [w,col] of [[7,'rgba(120,80,40,.5)'],[3,'rgba(255,196,120,.9)'],[1,'rgba(255,240,210,1)']] as const){og.strokeStyle=col;og.lineWidth=w;og.beginPath();og.moveTo(c.x,c.y);og.lineTo(hx,hy);og.stroke();}
   og.fillStyle='rgba(255,205,140,1)';og.beginPath();og.arc(c.x,c.y,4,0,7);og.fill();}
  og.globalAlpha=1;if(data.cond==='pli')drawBubble(t);
  const out=last&&leaveT>=0?ss(leaveT+OUTLEN-1.2,leaveT+OUTLEN,t):0;if(out>0){og.fillStyle=`rgba(0,0,0,${out})`;og.fillRect(0,0,W,H);}      // only the last scene ends in black (→ Lab)
  if(leaveT>=0&&t>=leaveT+OUTLEN&&!ended){ended=true;opt.onEnd?.();}
  arch.update(t,frame,camera,(composer.readBuffer as THREE.WebGLRenderTarget).depthTexture,.6);
  grade.uniforms.uTime.value=t;composer.render();
 }
 /** REVIEW-R1-STORY-20261011 §5: run the geometry checks over the scene sequence as the viewer sees it (camera hand-over
  included). Returns per-scene worst values and every failing sample. QA only (window.__noise.check()). */
 function selfCheck(seq:NoiseData[],o:{dt?:number,minClear?:number,pathOnly?:boolean,viewOnly?:boolean,maxFg?:number}={}){
  const dt=o.dt??.1,minClear=o.minClear??.08,maxFg=o.maxFg??.05;gsap.ticker.remove(update);
  const extra=[...discs.map(d=>d.m),ring,...(lead?[lead]:[])],hide=[arch.dust,...shells.map(x=>x.m)];
  const ck=createChecker({renderer,scene,camera,body:figure.bodyMesh,heart:figure.heartMesh,hide,named:[chair,...arch.room.children]});
  const report:{cond:Cond,heart:{state:string,out:number,n:number}[],minClear:number,minClearT:number,inBody:number[],near:{t:number,d:number}[],occl:{t:number,subject:string,by:string}[],fg:{t:number,frac:number}[],path:number[][],sliced:number[],sync?:number}[]=[];
  keys=[];
  seq.forEach((d,k)=>{
   setScene(d,{last:k===seq.length-1});const r={cond:d.cond,heart:[] as {state:string,out:number,n:number}[],minClear:Infinity,minClearT:0,inBody:[] as number[],near:[] as {t:number,d:number}[],occl:[] as {t:number,subject:string,by:string}[],fg:[] as {t:number,frac:number}[],path:[] as number[][],sliced:[] as number[],sync:undefined as number|undefined};
   if(!o.pathOnly&&!o.viewOnly)for(const b of [0,.5,1])for(const f of d.cond==='ma'?[0,1]:[0]){setMorphs(b,f);figure.group.updateMatrixWorld(true);const h=ck.heartOutside();r.heart.push({state:`breath ${b} fist ${f}`,...h});}
   const tEnd=keys[keys.length-1].t;
   for(let t=0;t<=tEnd+1e-6;t+=dt){
    const ps=poseAt(t);camAt(t,ps.breathOff);setMorphs(ps.breath,ps.fist);placeElectrodes();scene.updateMatrixWorld(true);
    {let md=Infinity;const mw=figure.bodyMesh.matrixWorld,q=new THREE.Vector3();for(let i=0;i<P0.count;i+=23){q.fromBufferAttribute(P0,i).applyMatrix4(mw);md=Math.min(md,q.distanceTo(camera.position));}
     if(camera.near>md-.02)r.sliced.push(+t.toFixed(2));}                 // ② near plane cutting the figure
    if(o.pathOnly){r.path.push([+t.toFixed(2),...camera.position.toArray().map(v=>+v.toFixed(3)),-1,+camera.near.toFixed(2)]);continue;}
    if(!o.viewOnly){
     if(ck.cameraInBody())r.inBody.push(+t.toFixed(2));
     const cl=ck.clearance(camera.position);if(cl<r.minClear){r.minClear=cl;r.minClearT=+t.toFixed(2);}
     if(camera.near<.5&&cl<minClear)r.near.push({t:+t.toFixed(2),d:+cl.toFixed(3)});
     r.path.push([+t.toFixed(2),...camera.position.toArray().map(v=>+v.toFixed(3)),+cl.toFixed(3),+camera.near.toFixed(2)]);}
    const subj:[string,THREE.Vector3][]=[['heart',heartWorld]];if(d.cond==='pli'&&t>8&&t<15)subj.push(['strip',STRIP]);
    let fg=0;for(const [nm,p] of subj){const oc=ck.occluded(p,[figure.group,...extra]);fg=oc.fg;   // the shot's subject is the last one (strip in its window)
     if(oc.occ)r.occl.push({t:+t.toFixed(2),subject:nm,by:oc.by});}
    if(fg>maxFg)r.fg.push({t:+t.toFixed(2),frac:+fg.toFixed(3)});                         // ④ foreground intrusion
   }
   // ⑪ (O-011) motion ↔ signal sync: in the muscle scene the fist must follow the stored noise envelope
   if(d.cond==='ma'&&drive){const xs:number[]=[],ys:number[]=[];for(let t=4;t<=tEnd;t+=.05){const tl=((t%T)+T)%T;xs.push(poseAt(t).fist);ys.push(drive.level(tl));}
    const m=(a:number[])=>a.reduce((u,v)=>u+v,0)/a.length,mx=m(xs),my=m(ys);let sxy=0,sxx=0,syy=0;xs.forEach((x,i)=>{sxy+=(x-mx)*(ys[i]-my);sxx+=(x-mx)**2;syy+=(ys[i]-my)**2;});
    r.sync=+(sxy/Math.sqrt(Math.max(1e-12,sxx*syy))).toFixed(3);}
   report.push(r);
  });
  ck.dispose();setScene(seq[0],{last:seq.length===1});gsap.ticker.add(update);
  // floor plan helpers: room objects within 3.5 m of the figure (x/z boxes), the figure, the strip
  const boxes:{name:string,min:number[],max:number[]}[]=[];arch.room.updateMatrixWorld(true);
  arch.room.traverse(o=>{if(!(o as THREE.Mesh).isMesh)return;const b=new THREE.Box3().setFromObject(o);if(b.isEmpty())return;const c=b.getCenter(new THREE.Vector3());
   if(c.distanceTo(origin)<3.5&&b.getSize(new THREE.Vector3()).length()<4)boxes.push({name:o.name||o.parent?.name||'',min:b.min.toArray(),max:b.max.toArray()});});
  return{scenes:report,boxes,figure:origin.toArray(),heart:heartWorld.toArray(),strip:STRIP_C.toArray()};
 }
 gsap.ticker.add(update);
 return{set:(o:{t?:number|null})=>{if(o.t!==undefined)frozen=o.t;},renderOnce:update,setScene,selfCheck,
  /** QA candidates (debug panel): set one and rebuild the camera keys when the composition changes */
  setQa(k:string,v:string){QA[k]=v;if(k==='light')setLights(v==='L1');if(k==='comp'&&data.cond==='pli'){const t=clock();keys=keysFor('pli');void t;}},get qa(){return {...QA};},
  /** QA (S-10): fix the breath morph (null = data) and show the figure alone on black for a body mask */
  qaPose(o:{breath?:number|null,mask?:boolean}){if(o.breath!==undefined)qaBreath=o.breath;if(o.mask!==undefined){arch.setFade(o.mask?0:1);[chair,strip,workstation,lamp].forEach(x=>x.visible=!o.mask);}},
  /** QA: jump the scene clock (e.g. back to the strip) */
  jump(tt:number){if(frozen!==null)frozen=tt;else t0=performance.now()-tt*1000;lastT=tt;if(tt<12.5){sClock=tt;contactT=-1;arrive.length=0;arrived.clear();}},
  scroll:(dy:number)=>wave.scroll(dy),toggleOverlay:()=>wave.toggleOverlay(),leave:()=>{if(leaveT<0)leaveT=clock();},get cond(){return data.cond;},figure,arch,
  /** QA: the muscle-noise bursts the fist follows (loop seconds) and the stored loop length */
  bursts:()=>({T,bursts:drive?.bursts??[]}),
  /** QA: camera state and what lies under a screen point (NDC), by object and material name */
  around(x:number,y:number,z:number,rad:number){const c=new THREE.Vector3(x,y,z),q=new THREE.Vector3(),lo=new THREE.Vector3(1e9,1e9,1e9),hi=lo.clone().negate();arch.room.updateMatrixWorld(true);
   arch.room.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;const P=m.geometry.getAttribute('position');for(let i=0;i<P.count;i++){q.fromBufferAttribute(P,i).applyMatrix4(m.matrixWorld);if(q.distanceTo(c)<rad){lo.min(q);hi.max(q);}}});
   return{lo:lo.toArray().map(v=>+v.toFixed(3)),hi:hi.toArray().map(v=>+v.toFixed(3)),fig:figSphere.center.toArray().map(v=>+v.toFixed(3)),figR:+figSphere.radius.toFixed(3),heart:heartWorld.toArray().map(v=>+v.toFixed(3)),strip:STRIP.toArray()};},
  probe(nx:number,ny:number){const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(nx,ny),camera);
   const h=r.intersectObjects(scene.children,true).filter(x=>(x.object as THREE.Mesh).isMesh&&x.distance>1e-3).slice(0,4).map(x=>({d:+x.distance.toFixed(3),o:x.object.name,m:((Array.isArray((x.object as THREE.Mesh).material)?((x.object as THREE.Mesh).material as THREE.Material[])[0]:(x.object as THREE.Mesh).material) as THREE.Material)?.name,p:x.point.toArray().map(v=>+v.toFixed(3))}));
   return{near:camera.near,pos:camera.position.toArray().map(v=>+v.toFixed(3)),hits:h};},
  dispose(){gsap.ticker.remove(update);removeEventListener('resize',resize);renderer.dispose();composer.dispose();arch.dispose();figure.dispose();}};
}
