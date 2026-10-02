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

export type ArchiveManifest={lm_scale:number,groups:Record<string,{object:string,file?:string,vertex_color?:string}>,
 sun:{to_dir:number[],color:number[]},shots:Record<string,{pos:number[],look:number[],fov_v_deg:number}>,
 room:{min:number[],max:number[]},figure:{location:number[],heart:number[],heart_q_wxyz_blender:number[],hand_r:number[]}};

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
 const shared={lmScale:{value:manifest.lm_scale},uFade:{value:0},uExposure:{value:1.0}};
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
    varying vec2 vUv,vUv1;
    vec2 pick(int c){return c==2?uv2:(c==1?uv1:uv);}
    void main(){vUv=(mapTransform*vec3(pick(mapChannel),1.)).xy;vUv1=uv1;
     #ifdef VC
     vLight=color.rgb;
     #endif
     gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform sampler2D map,lm;uniform bool useMap;uniform vec3 color;uniform float lmScale,alphaTest,uFade,uExposure;varying vec2 vUv,vUv1;
    #ifdef VC
    varying vec3 vLight;
    #endif
    void main(){vec4 a=useMap?texture2D(map,vUv):vec4(1.);if(alphaTest>0.&&a.a<alphaTest)discard;
     #ifdef VC
     vec3 e=vLight;
     #else
     vec3 e=texture2D(lm,vUv1).rgb;
     #endif
     gl_FragColor=vec4(a.rgb*color*e*e*lmScale*uExposure*uFade,1.);
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
 function renderSunDepth(renderer:THREE.WebGLRenderer){
  const sc=new THREE.Scene();const parent=room.parent;sc.add(room);sc.overrideMaterial=depthOnly;
  renderer.setRenderTarget(lightRT);renderer.clear();renderer.render(sc,lightCam);renderer.setRenderTarget(null);
  sc.remove(room);if(parent)parent.add(room);
 }

 // dust: motes in the room's air, bright only inside a sunbeam (same depth map) and when scattering toward the camera
 const N=2600,pos=new Float32Array(N*3),seed=new Float32Array(N);let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<N;i++){pos.set([box.min.x+rnd()*(box.max.x-box.min.x),box.min.y+.3+rnd()*(box.max.y-box.min.y-.6),box.min.z+rnd()*(box.max.z-box.min.z)],i*3);seed[i]=rnd();}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));dg.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
 const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},tLight:{value:lightRT.depthTexture},uLightVP:{value:lightVP},uSun:{value:sunTo},uCol:{value:sunCol},uPx:{value:1},uFade:shared.uFade},
  vertexShader:`attribute float aSeed;uniform float uTime,uPx;uniform sampler2D tLight;uniform mat4 uLightVP;uniform vec3 uSun;varying float vA;
   void main(){float t=uTime*(.02+.03*aSeed)+aSeed*50.;vec3 p=position+vec3(sin(t*1.3),sin(t*.7+2.)*.5,cos(t*1.1))*.15;
    vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
    float lit=(all(greaterThan(l.xy,vec2(0.)))&&all(lessThan(l.xy,vec2(1.))))?step(l.z-.002,texture2D(tLight,l.xy).x):0.;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float fwd=pow(max(dot(normalize(p-cameraPosition),uSun),0.),2.);
    vA=lit*(.25+1.6*fwd)*(.4+.6*sin(uTime*1.3+aSeed*40.)*sin(uTime*1.3+aSeed*40.));
    gl_PointSize=min(uPx*(1.+2.2*aSeed)/-mv.z,4.);}`,
  fragmentShader:`uniform vec3 uCol;uniform float uFade;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uCol*vA*smoothstep(.5,0.,d)*2.2*uFade,1.);}`});
 const dust=new THREE.Points(dg,dustMat);dust.frustumCulled=false;dust.renderOrder=5;

 // volumetric shafts: ray-march from the camera to the scene depth, sampling the sun depth map (attic spike)
 const vol=new ShaderPass({
  uniforms:{tDiffuse:{value:null},tDepth:{value:null},tLight:{value:lightRT.depthTexture},
   uInvProj:{value:new THREE.Matrix4()},uInvView:{value:new THREE.Matrix4()},uLightVP:{value:lightVP},uCam:{value:new THREE.Vector3()},
   uSun:{value:sunTo},uCol:{value:sunCol},uDensity:{value:.05},uIntensity:{value:2.4},uTime:{value:0},uFrame:{value:0},uOn:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
   uniform sampler2D tDiffuse,tDepth,tLight;uniform mat4 uInvProj,uInvView,uLightVP;uniform vec3 uCam,uSun,uCol;
   uniform float uDensity,uIntensity,uTime,uFrame,uOn;varying vec2 vUv;
   float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
   float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float hg(float c,float g){float g2=g*g;return (1.-g2)/(4.*3.14159*pow(1.+g2-2.*g*c,1.5));}
   void main(){
    vec3 col=texture2D(tDiffuse,vUv).rgb;
    if(uOn<.002){gl_FragColor=vec4(col,1.);return;}
    float d=texture2D(tDepth,vUv).x;
    vec4 v=uInvProj*vec4(vUv*2.-1.,d*2.-1.,1.);v/=v.w;vec3 wp=(uInvView*v).xyz;
    vec3 rd=wp-uCam;float len=min(length(rd),9.);rd=normalize(rd);
    const int N=48;float dt=len/float(N),j=ign(gl_FragCoord.xy+uFrame*5.588),acc=0.,tr=1.;
    for(int i=0;i<N;i++){
     vec3 p=uCam+rd*(float(i)+j)*dt;
     vec4 lp=uLightVP*vec4(p,1.);vec3 l=lp.xyz/lp.w*.5+.5;
     float lit=(l.x>0.&&l.x<1.&&l.y>0.&&l.y<1.)?step(l.z-.0015,texture2D(tLight,l.xy).x):0.;
     float dens=uDensity*(.55+.9*noise(p*2.2+vec3(0.,uTime*.05,uTime*.03)));
     acc+=lit*dens*tr*dt;tr*=exp(-dens*.15*dt);
    }
    float ph=hg(dot(uSun,-rd),.55)*4.*3.14159*.25+.25;
    gl_FragColor=vec4(col+uCol*acc*ph*uIntensity*uOn,1.);
   }`});
 vol.uniforms.tLight.value=lightRT.depthTexture;vol.uniforms.uLightVP.value=lightVP;vol.uniforms.uSun.value=sunTo;vol.uniforms.uCol.value=sunCol;

 const V=(a:number[])=>new THREE.Vector3(...a);
 const fig=manifest.figure;
 const hq=fig.heart_q_wxyz_blender;                               // Blender (w, x, y, z) z-up → three y-up: (x, z, −y)
 const heartQuat=new THREE.Quaternion(hq[1],hq[3],-hq[2],hq[0]);
 return{manifest,room,dust,vol,mats,shared,lightRT,lightVP,sunTo,sunCol,renderSunDepth,
  figureLocation:V(fig.location),heart:V(fig.heart),heartQuat,handR:V(fig.hand_r),
  shot:(k:string)=>({pos:V(manifest.shots[k].pos),look:V(manifest.shots[k].look),fov:manifest.shots[k].fov_v_deg}),
  setFade(a:number){shared.uFade.value=a;room.visible=a>.002;dust.visible=a>.002;},
  update(t:number,frame:number,camera:THREE.Camera,depth:THREE.DepthTexture|null,shafts:number){
   dustMat.uniforms.uTime.value=t;
   const u=vol.uniforms;u.uOn.value=depth?shafts:0;u.tDepth.value=depth;
   u.uInvProj.value.copy((camera as THREE.PerspectiveCamera).projectionMatrixInverse);u.uInvView.value.copy(camera.matrixWorld);
   u.uCam.value.copy((camera as THREE.PerspectiveCamera).position);u.uTime.value=t;u.uFrame.value=frame%64;
  },
  setPx(h:number,pr:number){dustMat.uniforms.uPx.value=h*pr/55;},
  dispose(){lightRT.dispose();dg.dispose();dustMat.dispose();mats.forEach(m=>m.dispose());Object.values(lightmaps).forEach(t=>t.dispose());}};
}
export type Archive=Awaited<ReturnType<typeof createArchive>>;
