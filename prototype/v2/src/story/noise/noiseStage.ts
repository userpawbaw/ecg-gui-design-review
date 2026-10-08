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
import {createGrid,createBeatMix,mvPerBoxFor} from '../intro/waveUi';
import {beatPhase,type Loop} from '../intro/beats';

export type Cond='pli'|'bw'|'ma';
export type NoiseData={cond:Cond,fs:number,loop:Loop,input:Float32Array,output:Float32Array,clean:Float32Array};
export type NoiseDom={gl:HTMLCanvasElement,grid:HTMLCanvasElement,sweep:HTMLCanvasElement,overlay:HTMLCanvasElement,cells:HTMLElement[]};
export type NoiseOptions={frozenT:number|null,reduced:boolean,onEnd?:()=>void};
type Story={figure_anchor:number[],morphs:string[],fist_s:number[],ra_arc_m:number,sternum_v:number,heart_approx:number[],
 electrodes:Record<'RA'|'LA'|'LL',{v:number,p:number[],n:number[]}>,cams:Record<string,{type:string,loc:number[],rot_euler:number[],lens?:number,sensor_width?:number,ortho_scale?:number}>};

const SPOT={x:-.7505,y:3.0995,yaw:-.0106};                       // build_archive.py r2 chair_fit (measurement spot, archive frame)
const RED=new THREE.Color('#ff3048');
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ss=(a:number,b:number,t:number)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k);};
const CLOSE=.56,HOLD=.45,OPEN=.39;                               // D-053: the video's clench timing (s)

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
export function clenchStarts(input:Float32Array,clean:Float32Array,fs:number){   // noise 0.5 s RMS above threshold → clench
 const n=input.length,w=Math.round(.5*fs),e=new Float32Array(n);let acc=0;
 for(let i=0;i<n;i++){const d=input[i]-clean[i];acc+=d*d;if(i>=w){const o=input[i-w]-clean[i-w];acc-=o*o;}e[i]=Math.sqrt(Math.max(0,acc)/Math.min(i+1,w));}
 let lo=Infinity,hi=-Infinity;for(const v of e){lo=Math.min(lo,v);hi=Math.max(hi,v);}
 const thr=lo+.35*(hi-lo),starts:number[]=[];let busyUntil=-1;
 for(let i=1;i<n;i++){const t=i/fs-.25;                              // the RMS window lags by half its length
  if(e[i]>=thr&&e[i-1]<thr&&t>=busyUntil){starts.push(Math.max(0,t));busyUntil=t+CLOSE+HOLD+OPEN;}}   // overlaps merge
 return starts;
}

export async function createNoiseStage(dom:NoiseDom,data:NoiseData,opt:NoiseOptions){
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
 // P-b field (pli): nested translucent shells around the archive's power line (rig_v3.glb PowerLine, room-fixed path);
 // they grow from the cable until they wrap the figure, then fade as the difference shows at RA (inflow-field-v3 in the web)
 const shells:{m:THREE.Mesh,u:{uK:{value:number}}}[]=[];let cablePts:THREE.Vector3[]=[];
 if(data.cond==='pli'){
  const rg=await loader.loadAsync(new URL('../intro/assets/rig_v3.glb',import.meta.url).href);rg.scene.updateMatrixWorld(true);
  let pl:THREE.Mesh|null=null;rg.scene.traverse(o=>{if(o.name.startsWith('PowerLine')&&(o as THREE.Mesh).isMesh)pl=o as THREE.Mesh;});
  if(pl){const m=pl as THREE.Mesh,pa=m.geometry.getAttribute('position'),ua=m.geometry.getAttribute('uv');const B=80,acc=Array.from({length:B},()=>({p:new THREE.Vector3(),n:0}));let umax=0;
   for(let i=0;i<pa.count;i++)umax=Math.max(umax,ua.getX(i));
   for(let i=0;i<pa.count;i++){const b=Math.min(B-1,Math.floor(ua.getX(i)/umax*B)),v=new THREE.Vector3().fromBufferAttribute(pa,i).applyMatrix4(m.matrixWorld);acc[b].p.add(v);acc[b].n++;}
   cablePts=acc.filter(a=>a.n).map(a=>a.p.divideScalar(a.n));
   const curve=new THREE.CatmullRomCurve3(cablePts);
   for(let i=0;i<3;i++){const u={uK:{value:0},uA:{value:1-.25*i}};
    const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
     vertexShader:'varying vec3 vN,vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
     fragmentShader:'uniform float uK,uA;varying vec3 vN,vV;void main(){float f=1.-abs(dot(normalize(vN),vV));gl_FragColor=vec4(vec3(1.,.19,.28)*pow(f,1.6)*.55*uK*uA,1.);}'});
    const sh=new THREE.Mesh(new THREE.TubeGeometry(curve,160,1,24),mat);sh.visible=false;scene.add(sh);shells.push({m:sh,u});}}
 }
 // nearest distance cable → body (sets how far the field must grow)
 let reach=.64;
 if(cablePts.length){reach=Infinity;const mw=figure.group.matrixWorld,q=new THREE.Vector3();
  for(let i=0;i<P0.count;i+=37){q.fromBufferAttribute(P0,i).applyMatrix4(mw);for(const c of cablePts)reach=Math.min(reach,q.distanceTo(c));}}
 // camera from story.json ('ma' for pli/ma, 'side' for bw — the person's right, D-054)
 const camDef=story.cams[data.cond==='bw'?'side':'ma'];
 const camLoc=toThree(camDef.loc,A),e=camDef.rot_euler,eul=new THREE.Euler(e[0],e[1],e[2],'ZYX');   // Blender XYZ euler = Rz·Ry·Rx = three order ZYX
 const fwdB=new THREE.Vector3(0,0,-1).applyEuler(eul),camLook=toThree([camDef.loc[0]+fwdB.x,camDef.loc[1]+fwdB.y,camDef.loc[2]+fwdB.z],A);
 const camera=new THREE.PerspectiveCamera(60,1,.05,60);camera.up.set(0,1,0);
 // second pass (IDEA-R1-NOISE §10): per-scene camera path that settles on the first pass's composition. Keys are
 // (time, position, look, horizontal fov); between keys the view direction turns about the look point (orbit-like) and
 // the distance / look / fov ease, so pull-backs, orbits, tracking and the crane read as one continuous move.
 type Key={t:number,pos:THREE.Vector3,look:THREE.Vector3,hfov:number,ease?:'whip'};
 const deg=(r:number)=>r*180/Math.PI,hfovOf=(lens:number)=>2*Math.atan(18/lens);
 const V3=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const H0=heartWorld.clone(),Fo=origin.clone();
 const STRIP=V3(-.97,.05,-3.62),DESK=V3(-2.35,1.0,-3.55);         // archive power strip / desk (Blender archive frame → three)
 let finalPos=camLoc.clone(),finalLook=camLook.clone(),finalH=hfovOf(camDef.lens??16);
 if(camDef.type==='ortho'){                                       // B-b side view: the stills' orthographic camera becomes a long
  const fwd=camLook.clone().sub(camLoc).normalize(),pivot=camLoc.clone().addScaledVector(fwd,Math.abs(camDef.loc[0]));   // lens far away
  finalLook=pivot.clone().add(V3(0,.05,0));finalPos=pivot.clone().addScaledVector(fwd,-4.5).add(V3(0,.9,0));finalH=2*Math.atan((camDef.ortho_scale??1.9)/2/4.5);}   // a little from above: the near armrest no longer crosses the body
 const maDef=story.cams.ma,maE=maDef.rot_euler,maF=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(maE[0],maE[1],maE[2],'ZYX'));
 const maPos=toThree(maDef.loc,A),maLook=toThree([maDef.loc[0]+maF.x,maDef.loc[1]+maF.y,maDef.loc[2]+maF.z],A),maH=hfovOf(maDef.lens??16);
 const K:Record<Cond,Key[]>={
  pli:[{t:0,pos:H0.clone().add(V3(0,.05,.75)),look:H0,hfov:.42},
   {t:3,pos:H0.clone().add(V3(.1,.1,.95)),look:H0,hfov:.85},
   {t:7,pos:Fo.clone().add(V3(1.25,1.15,1.35)),look:H0.clone().lerp(DESK,.55),hfov:.95},          // orbit: desk + computer behind
   {t:10,pos:STRIP.clone().add(V3(-.6,.32,.5)),look:STRIP,hfov:.9},                               // down along the power line (from the person's right: the chair hid it)
   {t:13,pos:STRIP.clone().add(V3(-.34,.14,.22)),look:STRIP,hfov:.7},                            // the strip, close
   {t:15,pos:STRIP.clone().add(V3(-.55,1.3,.85)),look:STRIP.clone().add(V3(.25,.25,.15)),hfov:.95},              // crane rises beside the cable first (not through the body)
   {t:17,pos:Fo.clone().add(V3(.73,2.27,1.65)),look:Fo.clone().add(V3(-.35,.55,-.25)),hfov:hfovOf(24)},   // crane up, wide
   {t:18.6,pos:finalPos,look:finalLook,hfov:finalH,ease:'whip'}],                               // whip zoom on a beat
  bw:[{t:0,pos:maPos,look:maLook,hfov:maH},{t:4,pos:finalPos,look:finalLook,hfov:finalH}],         // 90° orbit to the side view
  ma:[{t:0,pos:Fo.clone().add(V3(-1.3,1.0,.6)),look:H0,hfov:.9},{t:4,pos:finalPos,look:finalLook,hfov:finalH},
   {t:31,pos:finalPos,look:finalLook,hfov:finalH},{t:35,pos:Fo.clone().add(V3(.9,3.2,2.4)),look:Fo.clone().add(V3(-.6,.4,-.4)),hfov:hfovOf(22)}]};   // end: crane up over the archive → Lab   // down to the arm, low angle
 const END={pli:35,bw:33,ma:35}[data.cond];let ended=false;
 const keys=K[data.cond],TP={pli:19,bw:11,ma:11}[data.cond];      // panel (right curtain + wave) from TP
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
  const h=THREE.MathUtils.lerp(a.hfov,b.hfov,k);camera.fov=deg(2*Math.atan(Math.tan(h/2)/camera.aspect));
  camera.near=dist>2.5?Math.max(.05,dist-.8):.03;                // long views skip the stacks between camera and figure
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 // post (as the intro archive): depth-carrying buffers for the shaft pass, bloom, output, grade
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.FloatType)}));
 composer.addPass(new RenderPass(scene,camera));composer.addPass(arch.vol);
 // M-b shallow focus (§10.4): focus rides the wave — fist → shoulder → RA
 const bokeh=data.cond==='ma'?new BokehPass(scene,camera,{focus:1,aperture:.006,maxblur:.008}):null;if(bokeh)composer.addPass(bokeh);
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.35,.8);composer.addPass(bloom);composer.addPass(new OutputPass());
 const grade=createGrade();composer.addPass(grade);
 // wave panel (stored samples, intro sweep rules) + 4-cell processing strip above it
 const grid=createGrid(dom.grid);
 const sweep=createSweep(dom.sweep,{gridHot:grid.hot,fs:data.fs,loop:data.loop,input:{values:data.input,color:[255,188,121],glow:.45,core:.78,white:.35},output:{values:data.output,color:[103,231,195]},mvPerBox:3.6});
 const mix=createBeatMix(4);
 const og=dom.overlay.getContext('2d')!;
 let W=0,H=0,panelMid=0;
 const sternumPx=()=>{const p=skin(VID.sternum).project(camera);return{x:(p.x*.5+.5)*W,y:(-p.y*.5+.5)*H};};
 function resize(){
  W=innerWidth;H=innerHeight;const pr=Math.min(devicePixelRatio||1,1.25);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);composer.setPixelRatio(pr);composer.setSize(W,H);bloom.resolution.set(W*pr/2,H*pr/2);
  arch.setPx(H,pr);grade.uniforms.uAspect.value=W/H;
  camera.aspect=W/H;camAt(1e9);                                  // panel layout is measured on the settled composition
  // B-b: the panel's 0 mV sits at the exhaled chest height (layout only); other scenes centre it
  setMorphs(0,0);figure.group.updateMatrixWorld(true);panelMid=data.cond==='bw'?sternumPx().y:.5*H;
  const half=.2*H,b={l:.64*W,r:.97*W,t:panelMid-half,b:panelMid+half},mv=mvPerBoxFor(b,2.5);sweep.resize(b,mv);grid.resize(b,2.5,mv);
  dom.overlay.width=W*pr;dom.overlay.height=H*pr;og.setTransform(pr,0,0,pr,0,0);
  const strip=dom.cells[0]?.parentElement;if(strip)Object.assign(strip.style,{left:b.l+'px',top:Math.max(12,b.t-46)+'px',width:(b.r-b.l)+'px'});
 }
 resize();addEventListener('resize',resize);

 // stored-trace timings
 const T=data.input.length/data.fs;
 const bw=data.cond==='bw'?breathFromBaseline(data.input,data.fs):null;
 const clenches=data.cond==='ma'?clenchStarts(data.input,data.clean,data.fs):[];
 const breathFixed=(t:number)=>{const u=t%5;return u<2?ss(0,2,u):1-ss(2,5,u);};              // D-053: 2 per 10 s
 const fistAt=(t:number)=>{for(const c of clenches){const d=t-c;if(d<0||d>CLOSE+HOLD+OPEN)continue;return d<CLOSE?ss(0,CLOSE,d):d<CLOSE+HOLD?1:1-ss(CLOSE+HOLD,CLOSE+HOLD+OPEN,d);}return 0;};
 const waveAt=(t:number)=>{let best=-1;for(const c of clenches){const d=t-c-.3;if(d>=0&&d<1.6)best=d;}return best;};   // wave starts as the fist tightens
 const PROC=TP+3;                                                    // the processing strip starts after the inflow is shown

 const t0=performance.now();let frozen=opt.frozenT,frame=0;
 const clock=()=>frozen??(performance.now()-t0)/1000;
 function update(){
  const t=clock(),tl=((t%T)+T)%T;frame++;
  // motion
  const breath=bw?bw.breath[Math.min(bw.breath.length-1,Math.floor(tl*data.fs))]:breathFixed(t);
  const fist=data.cond==='ma'&&t>2?fistAt(tl):0;
  const panelK=ss(TP,TP+.6,t);camAt(t,bw&&t>4?.015*(2*breath-1):0);    // camera before anything is projected
  setMorphs(breath,fist);placeElectrodes();
  // inflow markers
  let common=0,ringK=0,leadK=0,front=-1,waveK=0;
  if(data.cond==='pli'){const p=t-16.6;common=.7*ss(0,1.2,p)*(1-.85*ss(1.4,2.2,p));ringK=ss(1.4,2.2,p);leadK=ss(1.6,2.4,p);}   // field reaches the body as the crane ends
  if(data.cond==='ma'&&t>4){const d=waveAt(tl);if(d>=0){front=(ss(0,1.2,d)*1.15-.05)*story.ra_arc_m;waveK=12;ringK=ss(1.05,1.3,d)*(1-ss(1.3,1.6,d)*.6);leadK=ringK;}}
  if(shells.length){const grow=ss(13,16.6,t),fade=1-.9*ss(17,18.2,t),rOut=.06+grow*(reach+.12);   // around the cable → wraps the body
   shells.forEach(({m,u},i)=>{const r=Math.max(.01,rOut*(i+1)/3);m.visible=t>12.6&&fade>.02;m.geometry.dispose();
    m.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts),160,r,24);u.uK.value=ss(12.6,13.6,t)*fade;});}
  if(bokeh){const fistP=skin(VID.fist),raP=skin(VID.RA),k=front<0?0:clamp(front/story.ra_arc_m);
   const target=fistP.lerp(raP,k*k*(3-2*k));(bokeh.uniforms as Record<string,{value:number}>).focus.value=camera.position.distanceTo(target);
   (bokeh.uniforms as Record<string,{value:number}>).aperture.value=t<4?.0005:.006;}
  bu.uCommon.value=common;bu.uFront.value=front;bu.uWaveK.value=waveK;
  ringMat.opacity=ringK;leadMat.opacity=leadK;
  // heart + sweep on the same clock
  const ph=beatPhase(data.loop,data.fs,t);figure.beat(ph,1);
  const procOn=t>PROC;mix.update(procOn?1:0,ph.prev,t,opt.reduced);
  sweep.draw({t,startAbs:0,mix:mix.value,alpha:panelK,reduced:opt.reduced,ring:null,comet:null,flash:mix.flash,gridAlpha:1});
  const filled=Math.round(mix.goal*4);dom.cells.forEach((c,i)=>c.classList.toggle('on',i<filled));
  dom.grid.style.opacity=String(panelK);const sp=dom.cells[0]?.parentElement;if(sp)sp.style.opacity=String(panelK);
  // overlay: right ~40 % darkened to 70 % (left → right ramp) + B-b thread
  og.clearRect(0,0,W,H);const gr=og.createLinearGradient(.58*W,0,.66*W,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.7)');
  og.fillStyle=gr;og.globalAlpha=panelK;og.fillRect(.58*W,0,.42*W,H);
  if(bw&&panelK>.01){const c=sternumPx(),hx=sweep.slotX(Math.floor(t*data.fs)),base=bw.base[Math.min(bw.base.length-1,Math.floor(tl*data.fs))],hy=sweep.yOf(base);
   og.lineCap='round';for(const [w,col] of [[7,'rgba(120,80,40,.5)'],[3,'rgba(255,196,120,.9)'],[1,'rgba(255,240,210,1)']] as const){og.strokeStyle=col;og.lineWidth=w;og.beginPath();og.moveTo(c.x,c.y);og.lineTo(hx,hy);og.stroke();}
   og.fillStyle='rgba(255,205,140,1)';og.beginPath();og.arc(c.x,c.y,4,0,7);og.fill();}
  og.globalAlpha=1;
  const out=ss(END-1.2,END,t);if(out>0){og.fillStyle=`rgba(0,0,0,${out})`;og.fillRect(0,0,W,H);}      // scene ends in black → next scene / Lab
  if(t>=END&&!ended&&frozen===null){ended=true;opt.onEnd?.();}
  arch.update(t,frame,camera,(composer.readBuffer as THREE.WebGLRenderTarget).depthTexture,.6);
  grade.uniforms.uTime.value=t;composer.render();
 }
 gsap.ticker.add(update);
 return{set:(o:{t?:number|null})=>{if(o.t!==undefined)frozen=o.t;},renderOnce:update,figure,arch,
  dispose(){gsap.ticker.remove(update);removeEventListener('resize',resize);renderer.dispose();composer.dispose();arch.dispose();figure.dispose();}};
}
