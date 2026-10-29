// P2 space (PLAN-R1-INTRO-STORY-V2 §4.3, D-045): the ECG-paper world made "warm and full" with the techniques the
// REF-002 attic study proved (handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md §4):
//  - baked floor light: Cycles direct + indirect light of the warm back light, with the figure's long contact shadow
//    toward the camera (scripts/assets/bake-intro-floor.py → floor_light.png)
//  - light shafts: the back light is on screen behind the figure, so screen-space radial shafts work here (the attic
//    needed depth ray-marching only because its sun was off screen); the body silhouette cuts the beams
//  - dust that sparkles only inside the beam, a faint floor reflection of the figure, then grade + vignette + grain
// The grid keeps the wave stage's 1 : 5 square proportion. Decorative space: no data values, no fake signal.
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FEET_Y} from './figure';

export const LIGHT_POS=new THREE.Vector3(0,FEET_Y+1.8,-3.2);   // = bake light (Blender (0, 3.2, 1.8)): chest height, so the figure cuts the beams
const LM_SIZE=16;                                             // baked floor square, metres, centred on the figure

const floorVert=/* glsl */`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const floorFrag=/* glsl */`
uniform float uOpacity,uCell,uWaveT,uWaveAmp,uFog,uLmSize;uniform vec3 uLine,uWarm;uniform sampler2D tLm;
varying vec3 vW;
float grid(vec2 p,float cell){vec2 g=p/cell,fw=max(fwidth(g),vec2(1e-4));vec2 d=min(fract(g),1.-fract(g));
 vec2 l=1.-smoothstep(.5*fw,1.5*fw,d);float fade=1.-smoothstep(.25,.6,max(fw.x,fw.y));return max(l.x,l.y)*fade;}
void main(){
 vec2 uv=vec2(vW.x/uLmSize+.5,-vW.z/uLmSize+.5);
 float inside=smoothstep(0.,.3,min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y)));
 float lm=texture2D(tLm,clamp(uv,0.,1.)).r;lm*=lm;                    // stored sqrt-encoded
 float L=lm*inside;                                                    // fades to black well before the bake edge
 float r=length(vW.xz),fog=exp(-r/uFog);
 float minor=grid(vW.xz,uCell),major=grid(vW.xz,uCell*5.);
 float ring=exp(-pow((r-uWaveT*2.2)/.06,2.))*exp(-uWaveT/.55)*uWaveAmp;
 // lit floor: warm diffuse light + grid lines that catch the light (ink on lit paper), dark where the figure shadows
 vec3 col=uWarm*L*.16+uLine*((minor*.03+major*.09)*(.25+2.2*L)+ring*(.18+major*.6)*(.4+L))*fog;
 gl_FragColor=vec4(col*uOpacity,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const lampFrag=/* glsl */`
uniform float uOpacity,uPulse;uniform vec3 uWarm;varying vec2 vUv;
void main(){vec2 q=vUv-.5;float r=length(q);
 float g=exp(-r*r/.0012)*.42+exp(-r*r/.01)*.16+exp(-r*r/.06)*.06;   // bright source, soft halo, wide haze
 gl_FragColor=vec4(uWarm*g*(1.+uPulse)*uOpacity,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createSpace(lm:THREE.Texture){
 const group=new THREE.Group();
 const floorMat=new THREE.ShaderMaterial({vertexShader:floorVert,fragmentShader:floorFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uOpacity:{value:0},uCell:{value:.1},uWaveT:{value:9},uWaveAmp:{value:0},uFog:{value:4.5},uLmSize:{value:LM_SIZE},tLm:{value:lm},
   uLine:{value:new THREE.Color('#67e7c3')},uWarm:{value:new THREE.Color('#ffb070')}}});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=FEET_Y;floor.renderOrder=-2;
 const lampMat=new THREE.ShaderMaterial({vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:lampFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uOpacity:{value:0},uPulse:{value:0},uWarm:{value:new THREE.Color('#ff9a4a')}}});
 const lamp=new THREE.Mesh(new THREE.PlaneGeometry(7,7),lampMat);lamp.position.copy(LIGHT_POS);lamp.renderOrder=-1;

 // dust: drifting motes in a slab between the light and the camera, bright only inside the beam (cone from the
 // light through the figure) and when scattering toward the camera — the attic rule, with an analytic beam instead of
 // a sun depth map (the figure's own occlusion is carried by the shaft pass)
 const N=1200,pos=new Float32Array(N*3),seed=new Float32Array(N);
 let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<N;i++){pos.set([(rnd()-.5)*2.4,FEET_Y+.2+rnd()*2.4,-3+rnd()*4.2],i*3);seed[i]=rnd();}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));dg.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
 const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},uPx:{value:1},uOpacity:{value:0},uLight:{value:LIGHT_POS.clone()},uCol:{value:new THREE.Color('#ffc890')}},
  vertexShader:`attribute float aSeed;uniform float uTime,uPx;uniform vec3 uLight;varying float vA;
   void main(){float t=uTime*(.02+.03*aSeed)+aSeed*50.;vec3 p=position+vec3(sin(t*1.3),sin(t*.7+2.)*.5,cos(t*1.1))*.15;
    vec3 axis=normalize(vec3(0.,${(FEET_Y+.9).toFixed(3)},0.)-uLight),d=p-uLight;float along=dot(d,axis);
    float off=length(d-axis*along),beam=smoothstep(.22+.16*along,.0,off)*step(0.,along);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float fwd=pow(max(dot(normalize(p-cameraPosition),-axis),0.),2.);
    vA=beam*(.25+1.4*fwd)*(.4+.6*sin(uTime*1.3+aSeed*40.)*sin(uTime*1.3+aSeed*40.));
    gl_PointSize=min(uPx*(1.+2.2*aSeed)/-mv.z,4.);}`,
  fragmentShader:`uniform vec3 uCol;uniform float uOpacity;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uCol*vA*smoothstep(.5,0.,d)*1.6*uOpacity,1.);}`});
 const dust=new THREE.Points(dg,dustMat);dust.frustumCulled=false;dust.renderOrder=4;
 group.add(lamp,floor,dust);
 return{group,floorMat,lampMat,dustMat,
  set(a:number,beat:{sincePrev:number},amp:number,t:number,lampA=a){
   floorMat.uniforms.uOpacity.value=a;lampMat.uniforms.uOpacity.value=lampA;dustMat.uniforms.uOpacity.value=a;group.visible=a>.002;
   floorMat.uniforms.uWaveT.value=beat.sincePrev;floorMat.uniforms.uWaveAmp.value=amp;
   lampMat.uniforms.uPulse.value=.12*Math.exp(-beat.sincePrev/.2)*amp;dustMat.uniforms.uTime.value=t;
  },
  setPx(h:number,pr:number){dustMat.uniforms.uPx.value=h*pr/55;},
  dispose(){floor.geometry.dispose();lamp.geometry.dispose();dg.dispose();floorMat.dispose();lampMat.dispose();dustMat.dispose();}};
}

// Light shafts: an occlusion buffer (the lamp drawn bright, the figure drawn black) radially blurred toward the
// lamp's screen position (GPU Gems 3 ch. 13 method), added over the scene. Half resolution.
export function createShafts(renderer:THREE.WebGLRenderer,camera:THREE.Camera,occluders:THREE.Object3D[]){
 const occScene=new THREE.Scene();occScene.background=new THREE.Color(0x000000);
 const black=new THREE.MeshBasicMaterial({color:0x000000});
 const srcMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uA:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uA;varying vec2 vUv;void main(){float r=length(vUv-.5);float g=exp(-r*r/.004)+exp(-r*r/.03)*.25;gl_FragColor=vec4(vec3(1.,.62,.34)*g*uA,1.);}`});
 const src=new THREE.Mesh(new THREE.PlaneGeometry(4,4),srcMat);src.position.copy(LIGHT_POS);occScene.add(src);
 const occ=occluders.map(o=>{const m=new THREE.Mesh((o as THREE.Mesh).geometry,black);m.matrixAutoUpdate=false;occScene.add(m);return{src:o,m};});
 let rt=new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType});
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},tOcc:{value:null},uLight:{value:new THREE.Vector2(.5,.5)},uAmount:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse,tOcc;uniform vec2 uLight;uniform float uAmount;varying vec2 vUv;
   void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
    vec2 d=(vUv-uLight)*(.92/64.);vec2 p=vUv;float decay=1.;vec3 acc=vec3(0.);
    for(int i=0;i<64;i++){p-=d;acc+=texture2D(tOcc,p).rgb*decay;decay*=.962;}
    gl_FragColor=vec4(c+acc*(.04*uAmount),1.);}`});
 const v=new THREE.Vector3();
 return{pass,
  render(a:number){
   pass.uniforms.uAmount.value=a;if(a<=.002)return;
   srcMat.uniforms.uA.value=1;
   for(const o of occ){o.src.updateWorldMatrix(true,false);o.m.matrix.copy(o.src.matrixWorld);o.m.matrixWorld.copy(o.src.matrixWorld);o.m.visible=o.src.visible;}
   v.copy(LIGHT_POS).project(camera);pass.uniforms.uLight.value.set(v.x*.5+.5,v.y*.5+.5);
   const prev=renderer.getRenderTarget(),tm=renderer.toneMapping;renderer.toneMapping=THREE.NoToneMapping;
   renderer.setRenderTarget(rt);renderer.clear();renderer.render(occScene,camera);renderer.setRenderTarget(prev);renderer.toneMapping=tm;
   pass.uniforms.tOcc.value=rt.texture;
  },
  setSize(w:number,h:number){rt.dispose();rt=new THREE.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{type:THREE.HalfFloatType});},
  dispose(){rt.dispose();black.dispose();srcMat.dispose();src.geometry.dispose();}};
}

// Grade + vignette + grain after the output transform (attic grade pass, gentler). uWarm scales with the space, so
// the globe keeps its REF-001 colour; vignette and grain stay faint everywhere. The Canvas 2D data layer is separate.
export function createGrade(){
 return new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0},uAspect:{value:1},uSpace:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uAspect,uSpace;varying vec2 vUv;
   float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
   void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));
    c*=mix(vec3(1.),vec3(1.05,1.,.92),uSpace);                 // warm
    c=mix(vec3(l),c,1.+.12*uSpace);                              // saturation
    c=mix(c,smoothstep(0.,1.,c),.35*uSpace);                     // S-curve
    vec2 q=(vUv-.5)*vec2(uAspect,1.);c*=mix(1.,.78,smoothstep(.5,1.15,length(q))*(.4+.6*uSpace));
    c+=(h(vUv*1000.+uTime)-.5)*(.012+.014*uSpace);              // grain
    gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
}
