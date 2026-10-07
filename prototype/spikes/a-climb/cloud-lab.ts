// D104. Adapted from pinned Takram Clouds-Vanilla (MIT), optical chain intact.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer,EffectPass,NormalPass,RenderPass,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {AerialPerspectiveEffect,getSunDirectionECEF,PrecomputedTexturesLoader} from '@takram/three-atmosphere';
import {CloudsEffect} from '@takram/three-clouds';
import {DataTextureLoader,Ellipsoid,Geodetic,parseUint8Array,STBNLoader} from '@takram/three-geospatial';
import {DitheringEffect,LensFlareEffect} from '@takram/three-geospatial-effects';
import {createNorthernArrival} from './arrival-north';

const params=new URLSearchParams(location.search);
const dom=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const status=dom<HTMLOutputElement>('status'),error=dom<HTMLPreElement>('error');
const pose=dom<HTMLSelectElement>('pose'),quality=dom<HTMLSelectElement>('quality');
const progress=dom<HTMLInputElement>('progress'),temporal=dom<HTMLInputElement>('temporal');
const enabled=dom<HTMLInputElement>('enabled'),wind=dom<HTMLInputElement>('wind');
const save=dom<HTMLButtonElement>('save');
const captureSet=document.createElement('button');captureSet.textContent='기준 구도 저장';save.after(captureSet);
const basicOption=document.createElement('option');basicOption.value='basic3500';basicOption.textContent='Basic 조명 비교 · 3500m';pose.add(basicOption);
const renderer=new THREE.WebGLRenderer({depth:false,logarithmicDepthBuffer:false,antialias:false});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=10;
document.body.appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,10,1e6);
const sourceScene=new THREE.Scene(),northScene=new THREE.Scene();
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1e3;
const sourceLocation=new Geodetic(0,THREE.MathUtils.degToRad(67),500);
const sourcePosition=sourceLocation.toECEF(),sourceFrame=Ellipsoid.WGS84.getEastNorthUpFrame(sourcePosition);
const sourceGroup=new THREE.Group();sourceFrame.decompose(sourceGroup.position,sourceGroup.quaternion,sourceGroup.scale);sourceScene.add(sourceGroup);
const sourceKnot=new THREE.Mesh(new THREE.TorusKnotGeometry(200,60,256,64),new THREE.MeshBasicMaterial({color:'white'}));
// Keep the author's lighting probe without enclosing the free cloud-view camera in it.
sourceKnot.position.set(1500,0,0);sourceGroup.add(sourceKnot);
const sourceSun=getSunDirectionECEF(new Date('2000-06-01T10:00:00Z'),new THREE.Vector3());
const aerial=new AerialPerspectiveEffect(camera);aerial.sky=true;aerial.sunLight=true;aerial.skyLight=true;
const clouds=new CloudsEffect(camera);clouds.coverage=.4;clouds.qualityPreset='high';
clouds.events.addEventListener('change',e=>{
 if(e.property==='atmosphereOverlay')aerial.overlay=clouds.atmosphereOverlay;
 if(e.property==='atmosphereShadow')aerial.shadow=clouds.atmosphereShadow;
 if(e.property==='atmosphereShadowLength')aerial.shadowLength=clouds.atmosphereShadowLength;
});
const composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType,multisampling:0});
const renderPass=new RenderPass(sourceScene,camera),normalPass=new NormalPass(sourceScene,camera);
aerial.normalBuffer=normalPass.texture;
composer.addPass(renderPass);composer.addPass(normalPass);
composer.addPass(new EffectPass(camera,clouds,aerial));
composer.addPass(new EffectPass(camera,new LensFlareEffect(),new ToneMappingEffect({mode:ToneMappingMode.AGX}),new DitheringEffect()));

// Static URL literals are bundled by Vite; all source assets remain pinned research files.
const lutUrls:Record<string,string>={
 'transmittance.bin':new URL('../../../assets/research/cloud-reference-20261008/atmosphere-assets/transmittance.bin',import.meta.url).href,
 'irradiance.bin':new URL('../../../assets/research/cloud-reference-20261008/atmosphere-assets/irradiance.bin',import.meta.url).href,
 'scattering.bin':new URL('../../../assets/research/cloud-reference-20261008/atmosphere-assets/scattering.bin',import.meta.url).href,
 'higher_order_scattering.bin':new URL('../../../assets/research/cloud-reference-20261008/atmosphere-assets/higher_order_scattering.bin',import.meta.url).href
};
const weatherUrl=new URL('../../../assets/research/cloud-reference-20261008/takram-assets/local_weather.png',import.meta.url).href;
const turbulenceUrl=new URL('../../../assets/research/cloud-reference-20261008/takram-assets/turbulence.png',import.meta.url).href;
const shapeUrl=new URL('../../../assets/research/cloud-reference-20261008/takram-assets/shape.bin',import.meta.url).href;
const detailUrl=new URL('../../../assets/research/cloud-reference-20261008/takram-assets/shape_detail.bin',import.meta.url).href;
const stbnUrl=new URL('../../../assets/research/cloud-reference-20261008/takram-assets/stbn.bin',import.meta.url).href;
const manager=new THREE.LoadingManager();manager.setURLModifier(url=>lutUrls[url.split('/').pop()!]||url);
const dataLoader=(size:number)=>new DataTextureLoader(THREE.Data3DTexture,parseUint8Array,{width:size,height:size,depth:size});
function textureSetup(t:THREE.Texture,volume=false){
 t.minFilter=volume?THREE.LinearFilter:THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;
 if(volume){(t as THREE.Data3DTexture).wrapR=THREE.RepeatWrapping;t.format=THREE.RedFormat;}
 t.needsUpdate=true;return t;
}
let north:Awaited<ReturnType<typeof createNorthernArrival>>|undefined;
const albedoMaterials=new Map<THREE.Material,THREE.MeshBasicMaterial>();
const localCamera=new THREE.PerspectiveCamera();
const northLat=THREE.MathUtils.degToRad(61.63),northLon=THREE.MathUtils.degToRad(8.4);
const northECEF=new Geodetic(northLon,northLat,0).toECEF();
const east=new THREE.Vector3(-Math.sin(northLon),Math.cos(northLon),0);
const up=new THREE.Vector3(Math.cos(northLat)*Math.cos(northLon),Math.cos(northLat)*Math.sin(northLon),Math.sin(northLat));
const south=new THREE.Vector3(Math.sin(northLat)*Math.cos(northLon),Math.sin(northLat)*Math.sin(northLon),-Math.cos(northLat));
const northToECEF=new THREE.Matrix4().makeBasis(east,up,south).setPosition(northECEF);
const northSun=new THREE.Vector3(-.67,.28,-.70).normalize().applyMatrix3(new THREE.Matrix3().setFromMatrix4(northToECEF));
let ready=false,activePose='source500',lastCamera:[number,number,number]=[0,0,0],frames=0;
const gpuTimes:number[]=[];const gl=renderer.getContext() as WebGL2RenderingContext;
const timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');let query:WebGLQuery|null=null;
const pending:WebGLQuery[]=[];
const percentile=(p:number)=>{const a=[...gpuTimes].sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor(a.length*p))]??null;};
function setPose(value:string){
 activePose=value;pose.value=value;gpuTimes.length=0;
 const isNorth=value.startsWith('north');controls.enabled=!isNorth;
 renderPass.mainScene=normalPass.mainScene=isNorth?northScene:sourceScene;
 camera.up.set(0,1,0);
 aerial.worldToECEFMatrix.copy(isNorth?northToECEF:new THREE.Matrix4());clouds.worldToECEFMatrix.copy(aerial.worldToECEFMatrix);
 aerial.sunDirection.copy(isNorth?northSun:sourceSun);clouds.sunDirection.copy(aerial.sunDirection);
 clouds.cloudLayers.copy(clouds.cloudLayers.constructor.DEFAULT);
 if(isNorth){
  // Layer base above existing alpine DEM; preserve the author's density/shape parameters.
  clouds.cloudLayers[0].altitude=5000;clouds.cloudLayers[0].height=1200;
  clouds.cloudLayers[1].altitude=5700;clouds.cloudLayers[1].height=1800;
  clouds.cloudLayers[2].altitude=9500;
  progress.value=value==='north265'?'.265':value==='north300'?'.300':'.345';
 }else{
  const basic=value==='basic3500',h=value==='source500'?500:3500;
  const p=new Geodetic(basic?THREE.MathUtils.degToRad(30):0,THREE.MathUtils.degToRad(basic?35:67),h).toECEF();
  const frame=Ellipsoid.WGS84.getEastNorthUpFrame(p);
  const direction=new THREE.Vector3(0,1000,-130).applyMatrix3(new THREE.Matrix3().setFromMatrix4(frame));
  camera.position.copy(p);camera.up.copy(Ellipsoid.WGS84.getSurfaceNormal(p));
  controls.target.copy(p).add(direction);camera.near=10;camera.far=1e6;camera.fov=75;
  if(basic){
   // Match the author's useApplyLocation helper: rotate the default OrbitControls offset.
   const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),camera.up);
   camera.position.copy(p).add(new THREE.Vector3(0,0,1000).applyQuaternion(rotation));controls.target.copy(p);
  }
  camera.updateProjectionMatrix();controls.update();
  if(basic){clouds.coverage=.3;getSunDirectionECEF(new Date('2026-01-02T07:00:00Z'),clouds.sunDirection);aerial.sunDirection.copy(clouds.sunDirection);}
 }
 if(value!=='basic3500')clouds.coverage=.4;
}
function state(){return{ready,mode:activePose,source:'Takram clouds0.7.6 procedural weather, not JangaFX VDB',p:activePose.startsWith('north')?Number(progress.value):null,
 sourceLocation:activePose==='basic3500'?[30,35,3500]:[0,67,activePose==='source500'?500:3500],sourceDate:activePose==='basic3500'?'2026-01-02T07:00:00Z':'2000-06-01T10:00:00Z',camera:camera.position.toArray(),localCamera:lastCamera,
 worldToECEF:aerial.worldToECEFMatrix.toArray(),sun:aerial.sunDirection.toArray(),layers:clouds.cloudLayers.map(l=>({altitude:l.altitude,height:l.height,densityScale:l.densityScale,shapeDetailAmount:l.shapeDetailAmount})),
 quality:quality.value,coverage:clouds.coverage,temporal:clouds.temporalUpscale,clouds:clouds.enabled,wind:wind.checked,
 terrain:north?.state().terrain,terrainLighting:'candidate albedo input + Takram Lambert sun/sky/BSM; main PBR unchanged',renderSize:[renderer.domElement.width,renderer.domElement.height],gpu:{available:!!timer,count:gpuTimes.length,p50:percentile(.5),p95:percentile(.95)},frames};}
quality.onchange=()=>{clouds.qualityPreset=quality.value as any;clouds.temporalUpscale=temporal.checked;gpuTimes.length=0;};
temporal.onchange=()=>{clouds.temporalUpscale=temporal.checked;gpuTimes.length=0;};enabled.onchange=()=>{clouds.enabled=enabled.checked;gpuTimes.length=0;};
pose.onchange=()=>setPose(pose.value);progress.oninput=()=>{gpuTimes.length=0;};
async function saveFrame(){
 draw();
 const shot=activePose+(activePose.startsWith('north')?'-'+Math.round(Number(progress.value)*1000):'')+(temporal.checked?'-taa':'-raw')+(enabled.checked?'-cloud':'-off');
 const e=gl.getExtension('WEBGL_debug_renderer_info');
 const response=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:'takram-lab',shot,image:renderer.domElement.toDataURL('image/png'),meta:{renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,state:state(),url:location.href}})});
 if(!response.ok){error.textContent=await response.text();return;}save.textContent='프레임 저장 완료';
}
save.onclick=saveFrame;
captureSet.onclick=async()=>{
 captureSet.disabled=save.disabled=pose.disabled=true;
 const framesFor=async(n:number)=>{for(let i=0;i<n;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));};
 try{
  for(const name of ['source500','source3500','basic3500','north265','north300','north345']){
   setPose(name);captureSet.textContent=`기준 저장 · ${name}`;await framesFor(60);gpuTimes.length=0;
   for(let i=0;i<180&&gpuTimes.length<120;i++)await framesFor(1);
   await saveFrame();
  }
  captureSet.textContent='기준 구도 저장 완료';
 }finally{captureSet.disabled=save.disabled=pose.disabled=false;}
};
function draw(){
 if(!ready)return;
 if(activePose.startsWith('north')&&north){
  localCamera.aspect=camera.aspect;north.update(Number(progress.value),2.4,true,localCamera);
  // Existing and newly loaded LOD meshes must enter the optical pass as albedo,
  // not as already-lit PBR radiance. Retain texture and the source geometry/color handoff shader.
  north.scene.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material)||!(o.material instanceof THREE.MeshStandardMaterial))return;
   const original=o.material;let albedo=albedoMaterials.get(original);
   if(!albedo){albedo=new THREE.MeshBasicMaterial({map:original.map,color:original.color,side:original.side,transparent:original.transparent,opacity:original.opacity,depthTest:original.depthTest,depthWrite:original.depthWrite});
    albedo.onBeforeCompile=(s,r)=>original.onBeforeCompile.call(original,s,r);albedo.customProgramCacheKey=()=>original.customProgramCacheKey()+'-takram-albedo';albedoMaterials.set(original,albedo);}
   o.material=albedo;
  });
  lastCamera=localCamera.position.toArray() as [number,number,number];
  camera.position.copy(localCamera.position).multiplyScalar(1000);camera.quaternion.copy(localCamera.quaternion);
  camera.near=localCamera.near*1000;camera.far=localCamera.far*1000;camera.fov=localCamera.fov;camera.updateProjectionMatrix();
 }else controls.update();
 camera.updateMatrixWorld();clouds.localWeatherVelocity.set(wind.checked ? .001 : 0,0);
 if(timer){
  if(gl.getParameter(timer.GPU_DISJOINT_EXT)){pending.forEach(q=>gl.deleteQuery(q));pending.length=0;gpuTimes.length=0;}
  else while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift()!;gpuTimes.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);if(gpuTimes.length>300)gpuTimes.shift();}
  if(pending.length<8){query=gl.createQuery();if(query)gl.beginQuery(timer.TIME_ELAPSED_EXT,query);}
 }
 composer.render();
 if(query){gl.endQuery(timer.TIME_ELAPSED_EXT);pending.push(query);query=null;}
 frames++;if(frames%30===0)status.textContent=`${activePose} · ${renderer.domElement.width}×${renderer.domElement.height} · ${quality.value}\nGPU composer ${percentile(.5)?.toFixed(2)??'—'}ms / ${gpuTimes.length} samples · ${clouds.temporalUpscale?'시간 누적 ON':'시간 누적 OFF'}\n${activePose.startsWith('north')?'동일 DEM 1.5× · 광학 정합 검토':'원본 Vanilla 광학 chain · 구름 관찰 카메라'}`;
}
async function init(){
 const [lut,w,t,s,d,b]=await Promise.all([
  new PrecomputedTexturesLoader({format:'binary',type:THREE.HalfFloatType},manager).loadAsync('local-lut'),
  new THREE.TextureLoader().loadAsync(weatherUrl),new THREE.TextureLoader().loadAsync(turbulenceUrl),
  dataLoader(128).loadAsync(shapeUrl),dataLoader(32).loadAsync(detailUrl),new STBNLoader().loadAsync(stbnUrl)
 ]);
 Object.assign(aerial,lut);Object.assign(clouds,lut);
 clouds.localWeatherTexture=textureSetup(w);clouds.turbulenceTexture=textureSetup(t);
 clouds.shapeTexture=textureSetup(s,true) as THREE.Data3DTexture;clouds.shapeDetailTexture=textureSetup(d,true) as THREE.Data3DTexture;
 clouds.stbnTexture=aerial.stbnTexture=b;
 north=await createNorthernArrival(renderer);north.setEffects({cloud:false,cloudShadow:false,atmosphere:false});
 north.scene.scale.setScalar(1000);northScene.add(north.scene);
 // Geometry/light transform uses metre local coordinates; optical ECEF transform carries only rotation+translation.
 ready=true;setPose(params.get('pose')||'source500');renderer.setAnimationLoop(draw);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
init().catch(e=>{error.textContent=String(e.stack||e);console.error(e);});
