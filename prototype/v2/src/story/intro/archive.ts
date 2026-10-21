// ECG record archive stacks (D-046, rounds/R1/SPACE-R1-ARCHIVE.md) — the attic pipeline (REF-002 study,
// prototype/spikes/attic) moved into the intro: the room's light is fully baked in Blender (scripts/blender/build_archive.py,
// lightmap for the shell, per-corner light for books and dense props), and the page only adds what a bake cannot:
// sun shafts ray-marched against a sun depth map (the blinds, stacks and ladder cut the beams), dust that sparkles only
// inside a beam, and the same depth map lets the figure's rings glow where a beam crosses them.
// Decorative space only: no data values. Paper rolls and the ECG cart carry blank grid, never a waveform.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

export type ArchiveManifest={lm_scale:number,groups:Record<string,{object:string,file?:string,vertex_color?:string}>,
 sun:{to_dir:number[],color:number[]},shots:Record<string,{pos:number[],look:number[],fov_v_deg:number}>,
 room:{min:number[],max:number[]},figure:{location:number[],heart:number[],heart_q_wxyz_blender:number[],hand_r:number[]},
 // intro2 (REVIEW-R1-WEB-20261008 I-4/I-5): the climber on the ladder, before the floor-sitter (figure) appears
 climb?:{location:number[],pitch_x_rad:number,glb:string,rung_dz:number}};

// Packaged assets live in src/story/intro/assets/archive/ (tracked; prototype/v2/public/ is gitignored). Static URLs so
// Vite fingerprints them; lightmap files are looked up by name from the manifest.
const ASSET={manifest:new URL('./assets/archive/manifest.json',import.meta.url).href,glb:new URL('./assets/archive/archive.glb',import.meta.url).href,
 'light_shell.webp':new URL('./assets/archive/light_shell.webp',import.meta.url).href} as Record<string,string>;
// D-075/D-076/D-077: the same room re-baked for the Lab backdrop (its default; intro and Story keep the original): the sun
// strikes the stack faces at 30° (35° elevation, 0.5° disc), five ceiling skylights traced back from the C1 path (two curtains the
// camera passes through), five leaf clusters outside, no aisle lamps — archive-sun-variant.py, arguments in
// verification/lab-c1-20261018/README.md
const ASSET_SUN35={manifest:new URL('./assets/archive-sun35/manifest.json',import.meta.url).href,glb:new URL('./assets/archive-sun35/archive.glb',import.meta.url).href,
 'light_shell.webp':new URL('./assets/archive-sun35/light_shell.webp',import.meta.url).href} as Record<string,string>;
// D-078: sun 15° to the stack faces at 15° elevation, the back window widened without blinds (one large pool), the aisle lamp
// meshes gone but their warm bulbs kept, warm grey sky (F-053) — ?sun=15 in the Lab
const ASSET_SUN15={manifest:new URL('./assets/archive-sun15/manifest.json',import.meta.url).href,glb:new URL('./assets/archive-sun15/archive.glb',import.meta.url).href,
 'light_shell.webp':new URL('./assets/archive-sun15/light_shell.webp',import.meta.url).href} as Record<string,string>;
// D-079 (user choice C + a larger hatch): sun 30° to the stack faces at 35° elevation, a 3.4 m ceiling hatch over the back bay (one
// pool on the back shelves), two front skylights for the curtain crossings, the back window widened without blinds, hidden warm
// bulbs, warm grey sky, leaves over the hatch and outside a window — the Lab default
const ASSET_LAB={manifest:new URL('./assets/archive-lab/manifest.json',import.meta.url).href,glb:new URL('./assets/archive-lab/archive.glb',import.meta.url).href,
 'light_shell.webp':new URL('./assets/archive-lab/light_shell.webp',import.meta.url).href} as Record<string,string>;
// D-080: the original sun with five skylights, window sills at 2.6 m, two centre windows without blinds, hidden warm bulbs (e3);
// the D layout of D-079 with the left hatch and the sun ×1.6, kept for comparison at the user's request (d16)
const vAsset=(dir:string)=>({manifest:new URL(`./assets/${dir}/manifest.json`,import.meta.url).href,glb:new URL(`./assets/${dir}/archive.glb`,import.meta.url).href,
 'light_shell.webp':new URL(`./assets/${dir}/light_shell.webp`,import.meta.url).href} as Record<string,string>);
const ASSET_E3=vAsset('archive-e3'),ASSET_D16=vAsset('archive-d16');
export async function createArchive(variant:'base'|'sun35'|'sun15'|'lab'|'e3'|'d16'='base'){
 const A=({sun35:ASSET_SUN35,sun15:ASSET_SUN15,lab:ASSET_LAB,e3:ASSET_E3,d16:ASSET_D16} as Record<string,Record<string,string>>)[variant]??ASSET;
 const manifest:ArchiveManifest=await (await fetch(A.manifest)).json();
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(A.glb);
 const tl=new THREE.TextureLoader(),lightmaps:Record<string,THREE.Texture>={};
 for(const [g,info] of Object.entries(manifest.groups))if(info.file){
  const url=A[info.file];if(!url)throw Error('archive: unknown lightmap '+info.file);
  const t=await tl.loadAsync(url);t.flipY=false;t.colorSpace=THREE.NoColorSpace;t.channel=1;lightmaps[g]=t;}
 const groupOf=(o:THREE.Object3D)=>{let x:THREE.Object3D|null=o;while(x){for(const [g,i] of Object.entries(manifest.groups))if(x.name===i.object||x.name.startsWith(i.object+'_'))return g;x=x.parent;}return 'shell';};
 const room=gltf.scene;
 // baked material: albedo × decoded light (lightmap on UV1 or per-corner colour), × uFade for scene transitions
 const shared={lmScale:{value:manifest.lm_scale},uFade:{value:0},uExposure:{value:1.3},uSat:{value:.72},
  // D-067 practical lights added on top of the bake (Story desk corner; off by default so the intro is unchanged):
  // one spot (desk lamp, only above uLampMinY — no baked shadow, so the desk top stops it) + two emitters facing uScrN (screens)
  uPrac:{value:0},uLampP:{value:new THREE.Vector3()},uLampD:{value:new THREE.Vector3(0,-1,0)},uLampCos:{value:new THREE.Vector2(.82,.95)},
  uLampCol:{value:new THREE.Vector3()},uLampMinY:{value:0},uScrP:{value:[new THREE.Vector3(),new THREE.Vector3()]},uScrN:{value:[new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,1)]},
  uScrCol:{value:[new THREE.Vector3(),new THREE.Vector3()]},
  // lamp shadow (H1, LIGHT-REF-R1-DESK): depth seen from the bulb, compared like the sun map; off (0) = unshadowed
  uLampSh:{value:0},uLampDepth:{value:null as THREE.Texture|null},uLampVP:{value:new THREE.Matrix4()}};
 const mats:THREE.ShaderMaterial[]=[];
 room.traverse(o=>{
  const m=o as THREE.Mesh;if(!m.isMesh)return;
  const g=groupOf(m),src=m.material as THREE.MeshStandardMaterial,vc=!lightmaps[g],map=src.map;if(map)map.updateMatrix();
  const mat=new THREE.ShaderMaterial({
   uniforms:{...shared,map:{value:map},useMap:{value:!!map},color:{value:src.color.clone()},lm:{value:lightmaps[g]??null},
    mapChannel:{value:map?.channel??0},mapTransform:{value:map?map.matrix:new THREE.Matrix3()},alphaTest:{value:src.alphaTest||(src.transparent?.4:0)}},
   defines:vc?{VC:''}:{},
   vertexShader:`attribute vec2 uv1;attribute vec2 uv2;uniform int mapChannel;uniform mat3 mapTransform;
    #ifdef VC
    attribute vec4 color;varying vec3 vLight;
    #endif
    varying vec2 vUv,vUv1;varying vec3 vWP,vWN;
    vec2 pick(int c){return c==2?uv2:(c==1?uv1:uv);}
    void main(){vUv=(mapTransform*vec3(pick(mapChannel),1.)).xy;vUv1=uv1;vWP=(modelMatrix*vec4(position,1.)).xyz;vWN=normalize(mat3(modelMatrix)*normal);
     #ifdef VC
     vLight=color.rgb;
     #endif
     gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform sampler2D map,lm;uniform bool useMap;uniform vec3 color;uniform float lmScale,alphaTest,uFade,uExposure,uSat;varying vec2 vUv,vUv1;
    uniform float uPrac,uLampMinY,uLampSh;uniform vec3 uLampP,uLampD,uLampCol,uScrP[2],uScrN[2],uScrCol[2];uniform vec2 uLampCos;varying vec3 vWP,vWN;
    uniform sampler2D uLampDepth;uniform mat4 uLampVP;
    float lampVis(vec3 p){if(uLampSh<.5)return 1.;vec4 q=uLampVP*vec4(p,1.);if(q.w<=0.)return 1.;vec3 l=q.xyz/q.w*.5+.5;
     if(l.x<0.||l.x>1.||l.y<0.||l.y>1.)return 1.;float v=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)v+=step(l.z-.0006,texture2D(uLampDepth,l.xy+vec2(x,y)*(1.5/1024.)).x);return v/9.;}
    float win(float d,float r){float k=clamp(1.-pow(min(d/r,1.),4.),0.,1.);return k*k;}   // smooth range cut (bases >= 0, F-042)
    vec3 practical(vec3 p,vec3 n){
     vec3 o=vec3(0.);vec3 l=uLampP-p;float d=max(length(l),1e-3);l/=d;
     float cone=smoothstep(uLampCos.x,uLampCos.y,dot(-l,uLampD));
     o+=uLampCol*cone*max(dot(n,l),0.)/(d*d+.02)*win(d,2.2)*smoothstep(uLampMinY-.015,uLampMinY+.004,p.y)*lampVis(p+n*.004);
     for(int i=0;i<2;i++){vec3 s=uScrP[i]-p;float e=max(length(s),1e-3);s/=e;
      o+=uScrCol[i]*max(dot(uScrN[i],-s),0.)*max(dot(n,s),0.)/(e*e+.04)*win(e,1.8);}
     return o;}
    #ifdef VC
    varying vec3 vLight;
    #endif
    void main(){vec4 a=useMap?texture2D(map,vUv):vec4(1.);if(alphaTest>0.&&a.a<alphaTest)discard;
     #ifdef VC
     vec3 e=vLight;
     #else
     vec3 e=texture2D(lm,vUv1).rgb;
     #endif
     vec3 L=e*e*lmScale;
     if(uPrac>0.){vec3 n=normalize(vWN);if(!gl_FrontFacing)n=-n;L+=practical(vWP,n)*uPrac;}
     vec3 c=a.rgb*color*L*uExposure*uFade;c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,uSat);   // T3: stills match
     gl_FragColor=vec4(c,1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`,
   side:src.side});
  m.material=mat;mats.push(mat);
 });

 // sun depth map (static room → rendered once, figure excluded so it casts no shadow)
 const sunTo=new THREE.Vector3(...manifest.sun.to_dir).normalize();
 const sunCol=new THREE.Color(...(manifest.sun.color as [number,number,number]));
 const rmin=new THREE.Vector3(...manifest.room.min),rmax=new THREE.Vector3(...manifest.room.max);
 const box=new THREE.Box3(rmin.clone().min(rmax),rmin.clone().max(rmax)),centre=box.getCenter(new THREE.Vector3()),R=box.getSize(new THREE.Vector3()).length()/2;
 const lightCam=new THREE.OrthographicCamera(-R,R,R,-R,.1,4*R);
 lightCam.position.copy(centre).addScaledVector(sunTo,-2*R);lightCam.lookAt(centre);lightCam.updateMatrixWorld();lightCam.updateProjectionMatrix();
 const lightRT=new THREE.WebGLRenderTarget(2048,2048,{depthTexture:new THREE.DepthTexture(2048,2048,THREE.FloatType)});
 const lightVP=new THREE.Matrix4().multiplyMatrices(lightCam.projectionMatrix,lightCam.matrixWorldInverse);
 const depthOnly=new THREE.MeshBasicMaterial({colorWrite:false});
 function renderSunDepth(renderer:THREE.WebGLRenderer,obj:THREE.Object3D=room){
  const sc=new THREE.Scene();const parent=obj.parent,vis=obj.visible;obj.visible=true;sc.add(obj);sc.overrideMaterial=depthOnly;
  renderer.setRenderTarget(lightRT);renderer.clear();renderer.render(sc,lightCam);renderer.setRenderTarget(null);
  sc.remove(obj);if(parent)parent.add(obj);obj.visible=vis;
 }
 // D-071 (Story route C): another baked room with its own sun takes over the sun map. The direction and light matrix are
 // updated in place, so everything holding sunTo / lightVP (shafts, dust, the figure's sun shading) follows. null → the archive's.
 const sun0=sunTo.clone();
 function setSun(renderer:THREE.WebGLRenderer,to:THREE.Vector3|null,obj:THREE.Object3D|null){
  sunTo.copy(to??sun0).normalize();
  lightCam.position.copy(centre).addScaledVector(sunTo,-2*R);lightCam.lookAt(centre);lightCam.updateMatrixWorld();lightCam.updateProjectionMatrix();
  lightVP.multiplyMatrices(lightCam.projectionMatrix,lightCam.matrixWorldInverse);
  renderSunDepth(renderer,obj??room);
 }

 // D-075 ambient (Lab backdrop; every strength 0 by default, so the intro and Story are unchanged): one cloud field in the sun's
 // light space, drawn into a small texture each frame, dims the shafts, the sun-lit surfaces and the dust together (A); the
 // silk folds in the air (B) were replaced by D-077 S1 (F-052: folds in the air average out along the view ray). User
 // 2026-10-18 after the first look: the wind (C) is removed and the cloud is off in the Lab (F-051: stair-step patterns on the
 // ladder and the floor), kept here behind uCloud for a later fix.
 // D-077 S1 "aurora": the light's cross-section carries a leaf/streak pattern that sways a little (leaves moving in front of the
 // openings). The pattern is constant along the beam, so summing along a view ray keeps the streaks; strength uAur (0 = off).
 const amb={cloud:{value:0},aur:{value:0},cloudT:{value:0},
  cloudDir:{value:new THREE.Vector2(1,0)},tCloud:{value:null as THREE.Texture|null}};
 const goboTex=(()=>{const S=128,C=8,g=new Uint8Array(S*S*4),r=(i:number,j:number)=>{const x=Math.sin(((i%C)+C)%C*127.1+(((j%C)+C)%C)*311.7)*43758.5453;return x-Math.floor(x);};
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const fx=x/S*C,fy=y/S*C,i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j,su=u*u*(3-2*u),sv=v*v*(3-2*v);
   const n=(r(i,j)*(1-su)+r(i+1,j)*su)*(1-sv)+(r(i,j+1)*(1-su)+r(i+1,j+1)*su)*sv;g.fill(Math.round(n*255),(y*S+x)*4,(y*S+x)*4+4);}
  const t=new THREE.DataTexture(g,S,S);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();   // tileable value noise, 8 cells
 const cloudRT=new THREE.WebGLRenderTarget(256,256,{type:THREE.UnsignedByteType,depthBuffer:false});cloudRT.texture.wrapS=cloudRT.texture.wrapT=THREE.ClampToEdgeWrapping;
 amb.tCloud.value=cloudRT.texture;
 const cloudQuad=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{uT:amb.cloudT,uDir:amb.cloudDir},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uT;uniform vec2 uDir;
   float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
   float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   void main(){vec2 q=vUv*3.2-uDir*uT;   // light-space uv spans the whole room (~13 m): one cell ≈ 4 m
    float c=.55*n(q)+.3*n(q*2.07+vec2(7.3,1.7)-uDir*uT*.6)+.15*n(q*4.31-3.1);
    gl_FragColor=vec4(vec3(smoothstep(.36,.7,c)),1.);}`}));   // 1 = clear sun, 0 = under a cloud
 /** advance the ambient clock (dt s) and redraw the cloud texture; call before rendering a frame */
 function stepAmbient(renderer:THREE.WebGLRenderer,t:number,dt:number){
  if(amb.cloud.value<=0)return;
  const g=.5+.5*Math.sin(t*.21)*Math.sin(t*.13+1);amb.cloudT.value+=dt*(.05+.08*g*g);
  const w=new THREE.Vector3(sunTo.x,0,sunTo.z).normalize();   // the clouds drift the way the light comes in
  const wl=w.clone().transformDirection(lightCam.matrixWorldInverse);amb.cloudDir.value.set(wl.x,wl.y).normalize();
  const rt=renderer.getRenderTarget();renderer.setRenderTarget(cloudRT);cloudQuad.render(renderer);renderer.setRenderTarget(rt);
 }

 // dust: motes in the room's air, bright only inside a sunbeam (same depth map) and when scattering toward the camera
 const N=2600,pos=new Float32Array(N*3),seed=new Float32Array(N);let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<N;i++){pos.set([box.min.x+rnd()*(box.max.x-box.min.x),box.min.y+.3+rnd()*(box.max.y-box.min.y-.6),box.min.z+rnd()*(box.max.z-box.min.z)],i*3);seed[i]=rnd();}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));dg.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
 const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},tLight:{value:lightRT.depthTexture},uLightVP:{value:lightVP},uSun:{value:sunTo},uCol:{value:sunCol},uPx:{value:1},uFade:shared.uFade,
   uCloud:amb.cloud,tCloud:amb.tCloud,
   // D-075: the Lab draws the dust over a stored frame without a depth buffer → test against the stored depth here (off = 0)
   uDepthOn:{value:0},tSceneDepth:{value:null as THREE.Texture|null},uRes:{value:new THREE.Vector2(1,1)}},
  vertexShader:`attribute float aSeed;uniform float uTime,uPx,uCloud;uniform sampler2D tLight,tCloud;uniform mat4 uLightVP;uniform vec3 uSun;varying float vA;
   void main(){float t=uTime*(.02+.03*aSeed)+aSeed*50.;vec3 p=position+vec3(sin(t*1.3),sin(t*.7+2.)*.5,cos(t*1.1))*.15;
    vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
    float lit=(all(greaterThan(l.xy,vec2(0.)))&&all(lessThan(l.xy,vec2(1.))))?step(l.z-.002,texture2D(tLight,l.xy).x):0.;
    if(uCloud>0.)lit*=1.-uCloud*.8*(1.-texture2D(tCloud,l.xy).r);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float fwd=pow(max(dot(normalize(p-cameraPosition),uSun),0.),2.);
    vA=lit*(.25+1.6*fwd)*(.4+.6*sin(uTime*1.3+aSeed*40.)*sin(uTime*1.3+aSeed*40.));
    gl_PointSize=min(uPx*(1.+2.2*aSeed)/-mv.z,4.);}`,
  fragmentShader:`uniform vec3 uCol;uniform float uFade,uDepthOn;uniform sampler2D tSceneDepth;uniform vec2 uRes;varying float vA;void main(){
   if(uDepthOn>0.&&gl_FragCoord.z>texture2D(tSceneDepth,gl_FragCoord.xy/uRes).x)discard;float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uCol*vA*smoothstep(.5,0.,d)*2.2*uFade,1.);}`});
 const dust=new THREE.Points(dg,dustMat);dust.frustumCulled=false;dust.renderOrder=5;

 // volumetric shafts: ray-march from the camera to the scene depth, sampling the sun depth map (attic spike)
 const vol=new ShaderPass({
  uniforms:{tDiffuse:{value:null},tDepth:{value:null},tLight:{value:lightRT.depthTexture},
   uInvProj:{value:new THREE.Matrix4()},uInvView:{value:new THREE.Matrix4()},uLightVP:{value:lightVP},uCam:{value:new THREE.Vector3()},
   uSun:{value:sunTo},uCol:{value:sunCol},uDensity:{value:.05},uIntensity:{value:1.8},uTime:{value:0},uFrame:{value:0},uOn:{value:0},
   uHaze:{value:.018},uHazeCol:{value:new THREE.Color(.22,.17,.13)},
   // D-153 (Lab ?ray=): march length, isotropic share of the phase, density inside the beams, in-scatter compression, grain
   // stretched along the sun, thin shadow streaks across the opening. The defaults keep the intro and Story as they were.
   uMaxLen:{value:9},uIso:{value:0},uDensIn:{value:1},uComp:{value:0},uGrain:{value:0},uStria:{value:0},
   uCloud:{value:0},uAur:{value:0},tCloud:{value:null},tGobo:{value:null},   // replaced by the shared ambient uniforms below (ShaderPass clones)
   // D-067: optional spot-light cone (Story desk lamp) in the same pass — a second pass sampling this depth would read the
   // target it writes (feedback loop). Marched only inside a sphere around the cone; cut below uCMinY (desk top).
   uCOn:{value:0},uCLP:{value:new THREE.Vector3()},uCLD:{value:new THREE.Vector3(0,-1,0)},uCCos:{value:new THREE.Vector2(.8,.93)},uCCol:{value:new THREE.Vector3(1,.78,.52)},uCMinY:{value:0},uCSh:{value:0},uCDepth:{value:null as THREE.Texture|null},uCVP:{value:new THREE.Matrix4()}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
   uniform sampler2D tDiffuse,tDepth,tLight;uniform mat4 uInvProj,uInvView,uLightVP;uniform vec3 uCam,uSun,uCol;
   uniform float uDensity,uIntensity,uTime,uFrame,uOn,uHaze,uCloud,uAur;uniform vec3 uHazeCol;uniform sampler2D tCloud,tGobo;varying vec2 vUv;
   uniform float uMaxLen,uIso,uDensIn,uComp,uGrain,uStria;
   #ifndef NSTEPS
   #define NSTEPS 48
   #endif
   uniform float uCOn,uCMinY,uCSh;uniform vec3 uCLP,uCLD,uCCol;uniform vec2 uCCos;uniform sampler2D uCDepth;uniform mat4 uCVP;
   float coneVis(vec3 p){if(uCSh<.5)return 1.;vec4 q=uCVP*vec4(p,1.);if(q.w<=0.)return 1.;vec3 l=q.xyz/q.w*.5+.5;if(l.x<0.||l.x>1.||l.y<0.||l.y>1.)return 1.;return step(l.z-.0006,texture2D(uCDepth,l.xy).x);}
   vec3 lampCone(vec3 cam,vec3 rd,float far,float j){
    vec3 C=uCLP+uCLD*.34;float R=.62;vec3 oc=cam-C;float b=dot(oc,rd),c=dot(oc,oc)-R*R,h=b*b-c;if(h<=0.)return vec3(0.);
    h=sqrt(h);float t0=max(-b-h,0.),t1=min(-b+h,far);if(t1<=t0)return vec3(0.);
    const int M=28;float dt=(t1-t0)/float(M),acc=0.;
    for(int i=0;i<M;i++){vec3 p=cam+rd*(t0+(float(i)+j)*dt);vec3 l=p-uCLP;float dl=max(length(l),1e-3);
     acc+=smoothstep(uCCos.x,uCCos.y,dot(l/dl,uCLD))*smoothstep(uCMinY-.01,uCMinY+.03,p.y)*coneVis(p)/(dl*dl+.05)*dt;}
    return uCCol*acc*.05*uCOn;}
   float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
   float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float hg(float c,float g){float g2=g*g;return (1.-g2)/(4.*3.14159*pow(max(1e-4,1.+g2-2.*g*c),1.5));}
   void main(){
    vec3 col=texture2D(tDiffuse,vUv).rgb;
    #ifdef FOG_ONLY
    if(uOn<.002&&uCOn<.002){gl_FragColor=vec4(0.);return;}
    #else
    if(uOn<.002&&uCOn<.002){gl_FragColor=vec4(col,1.);return;}
    #endif
    float d=texture2D(tDepth,vUv).x;
    vec4 v=uInvProj*vec4(vUv*2.-1.,d*2.-1.,1.);v/=v.w;vec3 wp=(uInvView*v).xyz;
    vec3 rd=wp-uCam;float len=min(length(rd),uMaxLen);rd=normalize(rd);
    const int N=NSTEPS;float dt=len/float(N),j=ign(gl_FragCoord.xy+uFrame*5.588),acc=0.,tr=1.;
    // D-077 S1: cross-section coordinates of the light (a, b ⟂ the sun), the same for every point along one beam
    vec3 sa=normalize(cross(uSun,vec3(0.,1.,0.))),sb=cross(sa,uSun);
    for(int i=0;i<N;i++){
     vec3 p=uCam+rd*(float(i)+j)*dt;
     vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
     float lit=(l.x>0.&&l.x<1.&&l.y>0.&&l.y<1.)?step(l.z-.0015,texture2D(tLight,l.xy).x):0.;
     if(uCloud>0.&&lit>0.)lit*=1.-uCloud*.85*(1.-texture2D(tCloud,l.xy).r);   // A: a cloud dims the whole beam
     if(uAur>0.&&lit>0.){   // leaves swaying in front of the opening: ~0.3 m cells, ±0.15 m sway with a phase that varies across the light
      vec2 c=vec2(dot(p,sa),dot(p,sb))*.4;
      c+=.06*vec2(sin(uTime*1.1+c.y*9.),sin(uTime*.83+c.x*7.))+vec2(uTime*.004,0.);
      float g=.62*texture2D(tGobo,c).r+.38*texture2D(tGobo,c*2.3+vec2(uTime*.02,-uTime*.013)).r;
      lit*=mix(1.,.2+1.4*smoothstep(.3,.72,g),min(1.,uAur));}
     if(uStria>0.&&lit>0.){   // D-153 ?ray=3: thin shadow streaks from leaves / glazing bars in front of the opening (0.1–0.3 m)
      vec2 c=vec2(dot(p,sa),dot(p,sb));
      float g=.6*texture2D(tGobo,c*.9+vec2(uTime*.003,0.)).r+.4*texture2D(tGobo,c*2.1-vec2(0.,uTime*.004)).r;
      lit*=mix(1.,.06+1.45*smoothstep(.4,.62,g),uStria);}
     if(uGrain>0.&&lit>0.){   // D-153 ?ray=2: dust grain stretched along the light (0.12 m across, 4 m along) → streaks in the ray direction
      vec3 q=vec3(dot(p,sa)/.12,dot(p,sb)/.12,dot(p,uSun)/4.-uTime*.04);
      float gr=noise(q+vec3(uTime*.05,0.,0.));lit*=mix(1.,.3+1.4*gr*gr,uGrain);}
     float n=noise(p*2.2+vec3(0.,uTime*.05,uTime*.03));
     float dens=uDensity*(.55+.9*n)*uDensIn;
     acc+=lit*dens*tr*dt;tr*=exp(-dens*.15*dt);
    }
    if(uCloud>0.){   // A: sun-lit surfaces (the baked sun patches) dim under the same cloud
     vec4 sp=uLightVP*vec4(wp,1.);vec3 sl=sp.xyz/sp.w*.5+.5;
     if(sl.x>0.&&sl.x<1.&&sl.y>0.&&sl.y<1.&&sl.z-.004<texture2D(tLight,sl.xy).x)col*=1.-uCloud*.6*(1.-texture2D(tCloud,sl.xy).r);}
    float ph=mix(hg(dot(uSun,-rd),.55)*4.*3.14159*.25+.25,1.,uIso);
    if(uComp>0.)acc=(1.-exp(-acc*uComp))/uComp;   // D-153: long views along a beam saturate, short side views keep their share
    // room air lit by the bounce light (the stills' uniform volume): lifts the shade and softens saturation with depth
    float hz=(1.-exp(-uHaze*min(length(wp-uCam),14.)))*uOn;
    vec3 cone=uCOn>.002?lampCone(uCam,rd,length(wp-uCam),j):vec3(0.);
    #ifdef FOG_ONLY
    gl_FragColor=vec4(uCol*acc*ph*uIntensity*uOn+cone,length(wp-uCam));   // D-153: in-scatter + view distance (the Lab composites)
    #else
    gl_FragColor=vec4(mix(col,uHazeCol,hz)+uCol*acc*ph*uIntensity*uOn+cone,1.);
    #endif
   }`});
 vol.uniforms.uCloud=amb.cloud;vol.uniforms.uAur=amb.aur;vol.uniforms.tCloud=amb.tCloud;vol.uniforms.tGobo={value:goboTex};
 vol.uniforms.tLight.value=lightRT.depthTexture;vol.uniforms.uLightVP.value=lightVP;vol.uniforms.uSun.value=sunTo;vol.uniforms.uCol.value=sunCol;

 const V=(a:number[])=>new THREE.Vector3(...a);
 const fig=manifest.figure;
 const hq=fig.heart_q_wxyz_blender;                               // Blender (w, x, y, z) z-up → three y-up: (x, z, −y)
 const heartQuat=new THREE.Quaternion(hq[1],hq[3],-hq[2],hq[0]);
 return{manifest,room,dust,dustMat,vol,mats,shared,lightRT,lightVP,sunTo,sunCol,renderSunDepth,setSun,amb,stepAmbient,
  figureLocation:V(fig.location),heart:V(fig.heart),heartQuat,handR:V(fig.hand_r),climb:manifest.climb?{location:V(manifest.climb.location),pitch:manifest.climb.pitch_x_rad}:null,
  shot:(k:string)=>({pos:V(manifest.shots[k].pos),look:V(manifest.shots[k].look),fov:manifest.shots[k].fov_v_deg}),
  setFade(a:number){shared.uFade.value=a;room.visible=a>.002;dust.visible=a>.002;},
  update(t:number,frame:number,camera:THREE.Camera,depth:THREE.DepthTexture|null,shafts:number){
   dustMat.uniforms.uTime.value=t;
   const u=vol.uniforms;u.uOn.value=depth?shafts:0;u.tDepth.value=depth;
   u.uInvProj.value.copy((camera as THREE.PerspectiveCamera).projectionMatrixInverse);u.uInvView.value.copy(camera.matrixWorld);
   u.uCam.value.copy((camera as THREE.PerspectiveCamera).position);u.uTime.value=t;u.uFrame.value=frame%64;
  },
  setPx(h:number,pr:number){dustMat.uniforms.uPx.value=h*pr/55;},
  dispose(){lightRT.dispose();cloudRT.dispose();cloudQuad.dispose();goboTex.dispose();dg.dispose();dustMat.dispose();mats.forEach(m=>m.dispose());Object.values(lightmaps).forEach(t=>t.dispose());}};
}
export type Archive=Awaited<ReturnType<typeof createArchive>>;
