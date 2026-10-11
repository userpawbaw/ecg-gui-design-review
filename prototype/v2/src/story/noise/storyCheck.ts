// Story self-check (REVIEW-R1-STORY-20261011 §5 ①②③): geometry checks that run on the live stage, so the camera path,
// the figure's pose and the room are exactly what the viewer sees. Called from noiseStage.selfCheck (window.__noise.check()).
// ① heart containment — every (sampled) heart vertex inside the body, by ray parity against the morphed body
// ② clearance        — distance from the camera to the nearest surface, from six 90° distance renders around it
// ③ occlusion        — from the real camera, is anything nearer than the subject at the subject's pixel
// Debug/QA only: nothing here changes what is drawn in a normal run.
import * as THREE from 'three';

const distVert=/* glsl */`
#include <common>
#include <morphtarget_pars_vertex>
varying vec3 vW;
void main(){
 #include <morphinstance_vertex>
 #include <begin_vertex>
 #include <morphtarget_vertex>
 vec4 w=modelMatrix*vec4(transformed,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const distFrag=/* glsl */`uniform vec3 uRef;varying vec3 vW;void main(){gl_FragColor=vec4(distance(vW,uRef),0.,0.,1.);}`;

export type CheckCtx={renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.PerspectiveCamera,
 body:THREE.Mesh,heart:THREE.Mesh,hide:THREE.Object3D[],named:THREE.Object3D[]};

export function createChecker(c:CheckCtx){
 const distMat=new THREE.ShaderMaterial({vertexShader:distVert,fragmentShader:distFrag,uniforms:{uRef:{value:new THREE.Vector3()}},side:THREE.DoubleSide});
 const cubeRT=new THREE.WebGLRenderTarget(32,32,{type:THREE.FloatType,depthBuffer:true}),cubeBuf=new Float32Array(32*32*4);
 const viewRT=new THREE.WebGLRenderTarget(192,108,{type:THREE.FloatType,depthBuffer:true}),viewBuf=new Float32Array(192*108*4);
 const faceCam=new THREE.PerspectiveCamera(90,1,.005,1.2);
 const DIRS:[THREE.Vector3,THREE.Vector3][]=[[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0)],[new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0)],
  [new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)],[new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,1)],[new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)],[new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0)]];
 // a double-sided twin of the body for ray parity (shares geometry and morph influences)
 const twin=new THREE.Mesh(c.body.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 const ray=new THREE.Raycaster();
 function syncTwin(){c.body.updateMatrixWorld(true);twin.matrixWorld.copy(c.body.matrixWorld);twin.morphTargetInfluences=c.body.morphTargetInfluences;}
 function parityInside(p:THREE.Vector3){            // two directions must agree (open seams elsewhere on the body)
  let inside=0;for(const d of [new THREE.Vector3(1,.13,.07).normalize(),new THREE.Vector3(-.11,.21,1).normalize()]){
   ray.set(p,d);ray.far=Infinity;inside+=ray.intersectObject(twin,false).length%2;}
  return inside===2;
 }
 function withOverride<T>(fn:()=>T){
  const vis=c.hide.map(o=>o.visible);c.hide.forEach(o=>{o.visible=false;});
  const bg=c.scene.background;c.scene.background=null;c.scene.overrideMaterial=distMat;
  const prev=c.renderer.getRenderTarget(),clear=c.renderer.getClearColor(new THREE.Color()),ca=c.renderer.getClearAlpha();
  c.renderer.setClearColor(new THREE.Color(1e4,0,0),1);   // background = far away
  try{return fn();}finally{c.scene.overrideMaterial=null;c.scene.background=bg;c.renderer.setRenderTarget(prev);c.renderer.setClearColor(clear,ca);c.hide.forEach((o,i)=>{o.visible=vis[i];});}
 }
 /** ② nearest surface around point p (m), up to 1.2 m. */
 function clearance(p:THREE.Vector3){
  return withOverride(()=>{
   let m=Infinity;distMat.uniforms.uRef.value.copy(p);faceCam.position.copy(p);
   for(const [d,up] of DIRS){faceCam.up.copy(up);faceCam.lookAt(p.clone().add(d));faceCam.updateMatrixWorld();
    c.renderer.setRenderTarget(cubeRT);c.renderer.clear();c.renderer.render(c.scene,faceCam);
    c.renderer.readRenderTargetPixels(cubeRT,0,0,32,32,cubeBuf);for(let i=0;i<cubeBuf.length;i+=4)if(cubeBuf[i]>0&&cubeBuf[i]<m)m=cubeBuf[i];}
   return m;
  });
 }
 /** ③ is something nearer than the subject at its pixel? Subject meshes (the figure) are hidden for this render. */
 function occluded(subject:THREE.Vector3,exclude:THREE.Object3D[]){
  const cam=c.camera,ndc=subject.clone().project(cam);
  if(ndc.z>1||Math.abs(ndc.x)>.95||Math.abs(ndc.y)>.95)return null;        // not on screen → not judged
  const want=cam.position.distanceTo(subject);
  const r=withOverride(()=>{
   const vis=exclude.map(o=>o.visible);exclude.forEach(o=>{o.visible=false;});
   distMat.uniforms.uRef.value.copy(cam.position);c.renderer.setRenderTarget(viewRT);c.renderer.clear();c.renderer.render(c.scene,cam);
   c.renderer.readRenderTargetPixels(viewRT,0,0,192,108,viewBuf);exclude.forEach((o,i)=>{o.visible=vis[i];});
   const x=Math.min(191,Math.max(0,Math.round((ndc.x*.5+.5)*191))),y=Math.min(107,Math.max(0,Math.round((ndc.y*.5+.5)*107)));
   let near=Infinity;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=Math.min(191,Math.max(0,x+dx)),yy=Math.min(107,Math.max(0,y+dy));near=Math.min(near,viewBuf[(yy*192+xx)*4]);}
   return near;
  });
  if(!(r<want-.03))return{occ:false,by:'',gap:want-r};
  // name the blocker (rare): ray against the named, non-merged objects
  ray.set(cam.position,subject.clone().sub(cam.position).normalize());ray.far=want;
  const hit=ray.intersectObjects(c.named,true)[0];let n=hit?.object as THREE.Object3D|undefined,name='room';
  while(n){if(n.name){name=n.name;break;}n=n.parent??undefined;}
  return{occ:true,by:hit?name:'room (merged books/shell)',gap:want-r};
 }
 /** ① heart vertices outside the body (sampled every `stride`), for the current morph state. */
 function heartOutside(stride=9){
  syncTwin();c.heart.updateMatrixWorld(true);const pa=c.heart.geometry.getAttribute('position'),p=new THREE.Vector3();let out=0,n=0;
  for(let i=0;i<pa.count;i+=stride){p.fromBufferAttribute(pa,i).applyMatrix4(c.heart.matrixWorld);n++;if(!parityInside(p))out++;}
  return{out,n};
 }
 function cameraInBody(){syncTwin();return parityInside(c.camera.position.clone());}
 return{clearance,occluded,heartOutside,cameraInBody,dispose(){cubeRT.dispose();viewRT.dispose();distMat.dispose();}};
}
