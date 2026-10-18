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
export async function createArchive(){
 const manifest:ArchiveManifest=await (await fetch(ASSET.manifest)).json();
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(ASSET.glb);
 const tl=new THREE.TextureLoader(),lightmaps:Record<string,THREE.Texture>={};
 for(const [g,info] of Object.entries(manifest.groups))if(info.file){
  const url=ASSET[info.file];if(!url)throw Error('archive: unknown lightmap '+info.file);
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
 // shafts can fold like silk along the beam (B); the dust drifts with the same wind (C). One time base: gusts also speed the clouds.
 const amb={cloud:{value:0},silk:{value:0},wind:{value:0},gust:{value:0},windOff:{value:new THREE.Vector3()},cloudT:{value:0},
  cloudDir:{value:new THREE.Vector2(1,0)},tCloud:{value:null as THREE.Texture|null}};
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
  const g=.5+.5*Math.sin(t*.21)*Math.sin(t*.13+1),gust=g*g;amb.gust.value=gust;
  const w=new THREE.Vector3(sunTo.x,0,sunTo.z).normalize();   // the wind follows the light in from the windows
  amb.windOff.value.addScaledVector(w,dt*(.04+.16*gust)*amb.wind.value);
  amb.cloudT.value+=dt*(.05+.08*gust);
  const wl=w.clone().transformDirection(lightCam.matrixWorldInverse);amb.cloudDir.value.set(wl.x,wl.y).normalize();
  const rt=renderer.getRenderTarget();renderer.setRenderTarget(cloudRT);cloudQuad.render(renderer);renderer.setRenderTarget(rt);
 }

 // dust: motes in the room's air, bright only inside a sunbeam (same depth map) and when scattering toward the camera
 const N=2600,pos=new Float32Array(N*3),seed=new Float32Array(N);let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<N;i++){pos.set([box.min.x+rnd()*(box.max.x-box.min.x),box.min.y+.3+rnd()*(box.max.y-box.min.y-.6),box.min.z+rnd()*(box.max.z-box.min.z)],i*3);seed[i]=rnd();}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));dg.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
 const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},tLight:{value:lightRT.depthTexture},uLightVP:{value:lightVP},uSun:{value:sunTo},uCol:{value:sunCol},uPx:{value:1},uFade:shared.uFade,
   uWind:amb.wind,uGust:amb.gust,uWindOff:amb.windOff,uCloud:amb.cloud,tCloud:amb.tCloud,uBoxMin:{value:box.min.clone()},uBoxSize:{value:box.getSize(new THREE.Vector3())},
   // D-075: the Lab draws the dust over a stored frame without a depth buffer → test against the stored depth here (off = 0)
   uDepthOn:{value:0},tSceneDepth:{value:null as THREE.Texture|null},uRes:{value:new THREE.Vector2(1,1)}},
  vertexShader:`attribute float aSeed;uniform float uTime,uPx,uWind,uGust,uCloud;uniform sampler2D tLight,tCloud;uniform mat4 uLightVP;uniform vec3 uSun,uWindOff,uBoxMin,uBoxSize;varying float vA;
   void main(){float t=uTime*(.02+.03*aSeed)+aSeed*50.;vec3 p=position+vec3(sin(t*1.3),sin(t*.7+2.)*.5,cos(t*1.1))*.15;
    float edge=1.;
    if(uWind>0.){   // C: drift with the wind (faster motes nearer the light), swirl in gusts, wrap around the room
     float ts=uTime*.35+aSeed*20.;
     p+=uWindOff*(.6+.8*aSeed)+uWind*(.12+.3*uGust)*vec3(sin(ts+position.y*1.7),.5*sin(ts*.8+position.x*1.3),cos(ts*.9+position.z*1.5));
     vec3 r=mod(p-uBoxMin,uBoxSize);p=uBoxMin+r;vec3 e=min(r,uBoxSize-r);edge=smoothstep(0.,.4,min(e.x,e.z));}
    vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
    float lit=(all(greaterThan(l.xy,vec2(0.)))&&all(lessThan(l.xy,vec2(1.))))?step(l.z-.002,texture2D(tLight,l.xy).x):0.;
    if(uCloud>0.)lit*=1.-uCloud*.8*(1.-texture2D(tCloud,l.xy).r);lit*=edge;
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
   uCloud:{value:0},uSilk:{value:0},tCloud:{value:null},   // replaced by the shared ambient uniforms below (ShaderPass clones)
   // D-067: optional spot-light cone (Story desk lamp) in the same pass — a second pass sampling this depth would read the
   // target it writes (feedback loop). Marched only inside a sphere around the cone; cut below uCMinY (desk top).
   uCOn:{value:0},uCLP:{value:new THREE.Vector3()},uCLD:{value:new THREE.Vector3(0,-1,0)},uCCos:{value:new THREE.Vector2(.8,.93)},uCCol:{value:new THREE.Vector3(1,.78,.52)},uCMinY:{value:0},uCSh:{value:0},uCDepth:{value:null as THREE.Texture|null},uCVP:{value:new THREE.Matrix4()}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
   uniform sampler2D tDiffuse,tDepth,tLight;uniform mat4 uInvProj,uInvView,uLightVP;uniform vec3 uCam,uSun,uCol;
   uniform float uDensity,uIntensity,uTime,uFrame,uOn,uHaze,uCloud,uSilk;uniform vec3 uHazeCol;uniform sampler2D tCloud;varying vec2 vUv;
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
    if(uOn<.002&&uCOn<.002){gl_FragColor=vec4(col,1.);return;}
    float d=texture2D(tDepth,vUv).x;
    vec4 v=uInvProj*vec4(vUv*2.-1.,d*2.-1.,1.);v/=v.w;vec3 wp=(uInvView*v).xyz;
    vec3 rd=wp-uCam;float len=min(length(rd),9.);rd=normalize(rd);
    const int N=48;float dt=len/float(N),j=ign(gl_FragCoord.xy+uFrame*5.588),acc=0.,tr=1.;
    // D-075 B: silk — the noise is stretched along the beam and folded across it, the folds drifting slowly (0 = the old haze)
    vec3 sa=normalize(cross(uSun,vec3(0.,1.,0.))),sb=cross(sa,uSun);
    for(int i=0;i<N;i++){
     vec3 p=uCam+rd*(float(i)+j)*dt;
     vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
     float lit=(l.x>0.&&l.x<1.&&l.y>0.&&l.y<1.)?step(l.z-.0015,texture2D(tLight,l.xy).x):0.;
     if(uCloud>0.&&lit>0.)lit*=1.-uCloud*.85*(1.-texture2D(tCloud,l.xy).r);   // A: a cloud dims the whole beam
     float u=dot(p,sa),v=dot(p,sb),s=dot(p,uSun);
     vec3 q=mix(p*2.2+vec3(0.,uTime*.05,uTime*.03),vec3(u*1.6+uTime*.035,s*.25-uTime*.02,v*1.6),uSilk>0.?1.:0.);
     float n=noise(q);
     if(uSilk>0.){float fold=.5+.5*sin(u*5.5+v*2.3+n*4.+uTime*.16);n=mix(n,fold*fold*(.6+.8*n),min(1.,uSilk));}
     float dens=uDensity*(.55+.9*n);
     acc+=lit*dens*tr*dt;tr*=exp(-dens*.15*dt);
    }
    if(uCloud>0.){   // A: sun-lit surfaces (the baked sun patches) dim under the same cloud
     vec4 sp=uLightVP*vec4(wp,1.);vec3 sl=sp.xyz/sp.w*.5+.5;
     if(sl.x>0.&&sl.x<1.&&sl.y>0.&&sl.y<1.&&sl.z-.004<texture2D(tLight,sl.xy).x)col*=1.-uCloud*.6*(1.-texture2D(tCloud,sl.xy).r);}
    float ph=hg(dot(uSun,-rd),.55)*4.*3.14159*.25+.25;
    // room air lit by the bounce light (the stills' uniform volume): lifts the shade and softens saturation with depth
    float hz=(1.-exp(-uHaze*min(length(wp-uCam),14.)))*uOn;
    vec3 cone=uCOn>.002?lampCone(uCam,rd,length(wp-uCam),j):vec3(0.);
    gl_FragColor=vec4(mix(col,uHazeCol,hz)+uCol*acc*ph*uIntensity*uOn+cone,1.);
   }`});
 vol.uniforms.uCloud=amb.cloud;vol.uniforms.uSilk=amb.silk;vol.uniforms.tCloud=amb.tCloud;
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
  dispose(){lightRT.dispose();cloudRT.dispose();cloudQuad.dispose();dg.dispose();dustMat.dispose();mats.forEach(m=>m.dispose());Object.values(lightmaps).forEach(t=>t.dispose());}};
}
export type Archive=Awaited<ReturnType<typeof createArchive>>;
