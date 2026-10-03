// ECG electrodes, lead wires, trunk, communication cable, power line and the inside-body signal paths (D-048, 3-lead),
// exported from scripts/blender/build_archive.py --export-rig (same paths as the stills) and drawn with a dashed-line
// shader that flows from the source: heart → electrode → yoke → cart → computer, power strip → computer.
// Story state display only (D-048 colour rule): the dashes are decoration, never a waveform, an amplitude or a live value —
// their brightness and speed are constants, not tied to any stored or measured signal (brief §6).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

export type SignalState='off'|'clean'|'noise';
export type SignalGroup='sig'|'lead'|'trunk'|'comm'|'power';
export type Signal=Record<SignalGroup,SignalState>;
export const SIGNAL_CLEAN:Signal={sig:'clean',lead:'clean',trunk:'clean',comm:'clean',power:'clean'};
export const SIGNAL_NOISE:Signal={sig:'noise',lead:'noise',trunk:'noise',comm:'noise',power:'noise'};
export const SIGNAL_OFF:Signal={sig:'off',lead:'off',trunk:'off',comm:'off',power:'off'};

// D-048 colours (same hex as the stills): blue heart → electrode, red where noise enters, purple cart → computer
const BLUE=new THREE.Color('#3d8bff'),RED=new THREE.Color('#ff3048'),PURPLE=new THREE.Color('#b24dff');
// colour of a group in a state; null = no dashes (plain cable)
function dashColour(g:SignalGroup,s:SignalState):THREE.Color|null{
 if(s==='off')return null;
 if(g==='sig')return BLUE;                       // the heart's own signal stays blue inside the body
 if(g==='comm')return PURPLE;                    // the cable to the computer is purple in both states
 if(g==='power')return s==='noise'?RED:null;     // the power line is colourless until it couples noise in
 return s==='noise'?RED:BLUE;                    // leads and trunk
}
// dash period (m) and duty per group — the stills' dash_mat values (lead 4.5 cm, trunk 6, comm 7, power 5, body 3, ring 1.2)
const DASH:Record<SignalGroup|'ring',{period:number,duty:number}>={sig:{period:.03,duty:.5},lead:{period:.045,duty:.42},trunk:{period:.06,duty:.42},
 comm:{period:.07,duty:.42},power:{period:.05,duty:.42},ring:{period:.012,duty:.6}};

// emission kept below the bloom threshold's white-out: with ACES a strong saturated blue turns white (the stills had the
// same problem), so the dash stays near 1× and the bloom pass adds the halo
const GLOW={wire:1.15,comm:1.8,sig:1.5,ring:3};   // sig and ring sit under / on the frosted body, which dims them; purple is dark in luminance
const vert=/* glsl */`
uniform float uFeet;varying vec2 vUv;varying vec3 vN,vW;
void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
// one shader for wires (dark base + glowing dashes), light-only paths (inside the body, additive) and solid parts
// (electrodes, yoke: no dashes). Light: sky fill + sun where the room's sun depth map reaches (the room itself is baked).
const frag=/* glsl */`
uniform vec3 uBase,uDash,uSunCol,uSunTo;uniform float uDashOn,uTime,uSpeed,uPeriod,uDuty,uGlow,uLightOnly,uFade,uPerson,uScan,uFeet,uExposure,uShade;
uniform sampler2D tLight;uniform mat4 uLightVP;
varying vec2 vUv;varying vec3 vN,vW;
void main(){
 // dashes travel toward increasing u (metres from the source); fwidth keeps the edges soft at any distance
 float d=(vUv.x-uTime*uSpeed)/uPeriod,f=fract(d),aa=min(.25,fwidth(d)*1.2);
 float dash=smoothstep(0.,aa,f)*(1.-smoothstep(uDuty-aa,uDuty,f))*uDashOn;
 float reveal=uPerson<0.?1.:smoothstep(uScan-.004,uScan+.012,vW.y-uFeet)*uPerson;   // skin parts appear with the body scan
 if(uLightOnly>.5){float a=dash*reveal*uFade;gl_FragColor=vec4(uDash*uGlow*a,a);return;}
 vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;
 vec4 lp=uLightVP*vec4(vW,1.);vec3 l=lp.xyz/lp.w*.5+.5;
 float lit=(l.x>0.&&l.x<1.&&l.y>0.&&l.y<1.)?step(l.z-.003,texture2D(tLight,l.xy).x):0.;
 vec3 v=normalize(cameraPosition-vW);
 vec3 c=uBase*((.5+.5*(n.y*.5+.5))*uShade+uSunCol*max(dot(n,-uSunTo),0.)*lit*1.2)+uBase*pow(1.-abs(dot(n,v)),3.)*.25;
 c=mix(c*uExposure,uDash*uGlow,dash);
 gl_FragColor=vec4(c*uFade,reveal);
}`;

export async function createSignalRig(url:string,room:{lightRT:THREE.WebGLRenderTarget,lightVP:THREE.Matrix4,sunTo:THREE.Vector3,sunCol:THREE.Color},
 person:{uScan:{value:number},uFeet:{value:number}}){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
 const group=gltf.scene;group.name='SignalRig';
 const time={value:0},speed={value:.6},fade={value:0},personA={value:0},exposure={value:1};
 const common={uSunCol:{value:room.sunCol},uSunTo:{value:room.sunTo},tLight:{value:room.lightRT.depthTexture},uLightVP:{value:room.lightVP},
  uTime:time,uFade:fade,uScan:person.uScan,uFeet:person.uFeet,uExposure:exposure};
 type Part={mesh:THREE.Mesh,group:SignalGroup|'ring'|'solid',mat:THREE.ShaderMaterial};
 const parts:Part[]=[];
 const solid:Record<string,string>={foam:'#e9e6df',gel:'#9aa3ad',snap:'#c9ccd1',clip:'#33363b'};
 const groupOf=(n:string):Part['group']=>n.startsWith('Sig_')?'sig':n.startsWith('Lead_')?'lead':n.startsWith('TrunkCable')?'trunk':
  n.startsWith('CommCable')?'comm':n.startsWith('PowerLine')?'power':n.startsWith('RA_noise_ring')?'ring':'solid';
 group.traverse(o=>{
  const m=o as THREE.Mesh;if(!m.isMesh)return;
  const name=(m.name||m.parent?.name||'');const g=groupOf(name);
  const base=g==='solid'?new THREE.Color(solid[name.split('_')[2]]??'#33363b'):new THREE.Color(g==='power'?'#202020':'#2a2c30');
  const dash=DASH[g==='solid'?'lead':g];
  // attached to the person: revealed with the scan (the trunk too — before the person appears it would hang from nothing)
  const onSkin=g==='sig'||g==='lead'||g==='ring'||g==='solid'||g==='trunk';
  const mat=new THREE.ShaderMaterial({vertexShader:vert,fragmentShader:frag,transparent:true,
   depthWrite:g!=='sig'&&g!=='ring',blending:g==='sig'||g==='ring'?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide,
   uniforms:{...common,uBase:{value:base},uDash:{value:new THREE.Color()},uDashOn:{value:0},uSpeed:{value:speed.value*dash.period},uPeriod:{value:dash.period},
    uDuty:{value:dash.duty},uGlow:{value:g==='sig'?GLOW.sig:g==='ring'?GLOW.ring:g==='comm'?GLOW.comm:GLOW.wire},uLightOnly:{value:g==='sig'||g==='ring'?1:0},uShade:{value:.32},
    uPerson:onSkin?personA:{value:-1}}});
  m.material=mat;m.frustumCulled=false;
  // draw order with the H5 body: inside-body paths before the body's depth pre-pass (seen through it), skin parts after
  m.renderOrder=g==='sig'?2:5;
  parts.push({mesh:m,group:g,mat});
 });
 let state:Signal={...SIGNAL_OFF};
 function apply(flow:number){
  for(const p of parts){
   if(p.group==='solid')continue;
   const st=p.group==='ring'?(state.lead==='noise'?'noise':'off'):state[p.group];
   const c=p.group==='ring'?(st==='noise'?RED:null):dashColour(p.group,st);
   p.mat.uniforms.uDashOn.value=c?flow:0;if(c)p.mat.uniforms.uDash.value.copy(c);
  }
 }
 let flow=0;
 return{group,parts,
  /** Story hook (P5): per-group state. clean = blue body/leads/trunk + purple comm, power colourless; noise = red leads,
   * trunk and power line, blue stays inside the body, purple comm, red ring at RA (D-048). */
  setSignal(s:Partial<Signal>){state={...state,...s};apply(flow);},
  get signal(){return {...state};},
  /** dash visibility 0–1 (scene fades), flow speed in dash periods per second */
  setFlow(k:number,periodsPerSecond=speed.value){flow=k;speed.value=periodsPerSecond;for(const p of parts)p.mat.uniforms.uSpeed.value=periodsPerSecond*p.mat.uniforms.uPeriod.value;apply(flow);},
  setFade(a:number){fade.value=a;group.visible=a>.002;},
  setPerson(a:number){personA.value=a;},
  setExposure(e:number){exposure.value=e;},
  update(t:number){time.value=t;},
  dispose(){parts.forEach(p=>{p.mat.dispose();p.mesh.geometry.dispose();});}};
}
export type SignalRig=Awaited<ReturnType<typeof createSignalRig>>;
