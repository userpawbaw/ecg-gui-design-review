// D104/D105 · REF-015 EFX-015-01/02. Pinned Takram optical chain + Basic settings trial.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer,EffectPass,NormalPass,RenderPass,ToneMappingEffect,ToneMappingMode,SMAAEffect,type Effect} from 'postprocessing';
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
const aaLabel=document.createElement('label');aaLabel.innerHTML='<input type="checkbox" id="smaa" aria-label="원본 Basic SMAA"> 원본 Basic SMAA';wind.parentElement!.after(aaLabel);
const aa=dom<HTMLInputElement>('smaa');
temporal.setAttribute('aria-label','4×4 시간 업스케일');temporal.parentElement!.lastChild!.textContent=' 4×4 시간 업스케일';
const settings=document.createElement('div');settings.innerHTML=`<label>분포 비교<select id="look" aria-label="분포 비교"><option value="ref54">참고 이미지 · 54 / 0.42</option><option value="d104">이전 후보 · 100 / 0.40</option></select></label><label>구름 범위 <input id="coverage" aria-label="구름 범위" type="number" min="0" max="1" step=".01" value=".42"></label><label>날씨 반복 <input id="weatherRepeat" aria-label="날씨 반복" type="number" min="1" max="200" step="1" value="54"></label><label><input id="shafts" aria-label="빛 커튼" type="checkbox" checked> 빛 커튼</label><label>구름 해상도<select id="cloudScale" aria-label="구름 해상도"><option value="1">100%</option><option value=".75" selected>75%</option><option value=".5">50%</option></select></label>`;
aaLabel.after(settings);
const look=dom<HTMLSelectElement>('look'),coverage=dom<HTMLInputElement>('coverage'),weatherRepeat=dom<HTMLInputElement>('weatherRepeat'),shafts=dom<HTMLInputElement>('shafts'),cloudScale=dom<HTMLSelectElement>('cloudScale');
const safetyScale=document.createElement('option');safetyScale.value='.25';safetyScale.textContent='25% · 진단용';cloudScale.add(safetyScale);
const clusterLabel=document.createElement('label');clusterLabel.innerHTML='응집 대비 <input id="cluster" aria-label="응집 대비" type="number" min="1" max="3" step=".1" value="1">';settings.append(clusterLabel);
const cluster=dom<HTMLInputElement>('cluster');
// D107: independent art-direction controls; original/main defaults stay intact.
const optics=document.createElement('details');optics.innerHTML='<summary>빛·분포 보완 시험</summary>'+[
 ['weatherX','날씨 위치 X',0,0,1,.01],['sunElevation','태양 고도',16.1,5,60,1],['sunAzimuth','태양 방위',43.75,-180,180,1],['hazeFalloff','연무 고도 감쇠',.001,.0001,.002,.00005]
].map(([id,label,value,min,max,step])=>`<label>${label} <input id="${id}" aria-label="${label}" type="number" value="${value}" min="${min}" max="${max}" step="${step}"></label>`).join('');settings.append(optics);
const weatherX=dom<HTMLInputElement>('weatherX'),sunElevation=dom<HTMLInputElement>('sunElevation'),sunAzimuth=dom<HTMLInputElement>('sunAzimuth'),hazeFalloff=dom<HTMLInputElement>('hazeFalloff');
function applyOptics(){
 clouds.localWeatherOffset.x=Number(weatherX.value);clouds.clouds.hazeExponent=Number(hazeFalloff.value);
 if(activePose.startsWith('north')){
  const el=THREE.MathUtils.degToRad(Number(sunElevation.value)),az=THREE.MathUtils.degToRad(Number(sunAzimuth.value));
  if(Number(sunElevation.value)===16.1&&Number(sunAzimuth.value)===43.75)aerial.sunDirection.copy(northSun);
  else aerial.sunDirection.set(-Math.sin(az)*Math.cos(el),Math.sin(el),-Math.cos(az)*Math.cos(el)).applyMatrix3(new THREE.Matrix3().setFromMatrix4(northToECEF));
  clouds.sunDirection.copy(aerial.sunDirection);
 }
 gpuTimes.length=0;
}
weatherX.oninput=sunElevation.oninput=sunAzimuth.oninput=hazeFalloff.oninput=applyOptics;
dom('panel').style.maxHeight='calc(100vh - 64px)';dom('panel').style.overflowY='auto';
const save=dom<HTMLButtonElement>('save');
const captureSet=document.createElement('button');captureSet.textContent='기준 구도 저장';save.after(captureSet);
const basicOption=document.createElement('option');basicOption.value='basic3500';basicOption.textContent='Basic 조명 비교 · 3500m';pose.add(basicOption);
const basicLow=document.createElement('option');basicLow.value='basic300';basicLow.textContent='Basic 빛 커튼 · 300m';pose.add(basicLow);
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
class OpticalPass extends EffectPass {
 configure(effects:Effect[]){this.setEffects(effects);this.recompile();}
 hasCloud(){return this.effects.includes(clouds);}
}
const opticalPass=new OpticalPass(camera,clouds,aerial);composer.addPass(opticalPass);
const lens=new LensFlareEffect(),tone=new ToneMappingEffect({mode:ToneMappingMode.AGX}),dither=new DitheringEffect(),smaa=new SMAAEffect();
composer.addPass(new EffectPass(camera,lens,tone));
const smaaPass=new EffectPass(camera,smaa);smaaPass.enabled=false;composer.addPass(smaaPass);
composer.addPass(new EffectPass(camera,dither));
aa.onchange=()=>{smaaPass.enabled=aa.checked;gpuTimes.length=0;};
function setCloudEnabled(){
 // CloudsEffect has no enabled property. The author's R3F scene conditionally mounts it.
 opticalPass.configure(enabled.checked?[clouds,aerial]:[aerial]);
 aerial.overlay=enabled.checked?clouds.atmosphereOverlay:null;
 aerial.shadow=enabled.checked?clouds.atmosphereShadow:null;
 aerial.shadowLength=enabled.checked?clouds.atmosphereShadowLength:null;
 gpuTimes.length=0;
}

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
renderer.domElement.addEventListener('webglcontextlost',()=>{renderer.setAnimationLoop(null);ready=false;error.textContent='GPU 컨텍스트가 끊겼습니다. 정상 캡처는 중단했습니다. 페이지를 새로고침하고 낮은 구름 해상도에서 재검토하세요.';});
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
  if(look.value==='ref54'){
   // Shift the author's lower layers above the alpine DEM without inflating their thickness.
   // Camera ends at 7–7.5km: place the cloud base above it to expose under-cloud shafts.
   clouds.cloudLayers[0].altitude=8000;clouds.cloudLayers[0].height=650;clouds.cloudLayers[1].altitude=8250;clouds.cloudLayers[1].height=1200;
   clouds.cloudLayers[2].altitude=14750;
  }
  progress.value=value==='north265'?'.265':value==='north300'?'.300':'.345';
 }else{
  const basic=value.startsWith('basic'),h=value==='source500'?500:value==='basic300'?300:3500;
  const p=new Geodetic(basic?THREE.MathUtils.degToRad(30):0,THREE.MathUtils.degToRad(basic?35:67),h).toECEF();
  const frame=Ellipsoid.WGS84.getEastNorthUpFrame(p);
  const direction=new THREE.Vector3(0,1000,-130).applyMatrix3(new THREE.Matrix3().setFromMatrix4(frame));
  camera.position.copy(p);camera.up.copy(Ellipsoid.WGS84.getSurfaceNormal(p));
  controls.target.copy(p).add(direction);camera.near=10;camera.far=1e6;camera.fov=75;
  if(basic){
   // Match the author's useApplyLocation helper: rotate the default OrbitControls offset.
   const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),camera.up);
   camera.position.copy(p).add(new THREE.Vector3(0,0,1000).applyQuaternion(rotation));controls.target.copy(p);
   camera.near=1;camera.far=4e5;
  }
  camera.updateProjectionMatrix();controls.update();
  if(basic){getSunDirectionECEF(new Date('2026-01-02T07:00:00Z'),clouds.sunDirection);aerial.sunDirection.copy(clouds.sunDirection);}
 }
 coverage.value=look.value==='ref54'?'.42':value.startsWith('basic')?'.30':'.40';
 weatherRepeat.value=look.value==='ref54'?'54':'100';applyWeather();
 clouds.shadow.maxFar=1e5;
 applyOptics();
}
function applyWeather(){clouds.coverage=Number(coverage.value);clouds.localWeatherRepeat.setScalar(Number(weatherRepeat.value));clouds.cloudLayers[0].weatherExponent=clouds.cloudLayers[1].weatherExponent=Number(cluster.value);gpuTimes.length=0;}
coverage.oninput=weatherRepeat.oninput=applyWeather;
cluster.oninput=applyWeather;
look.onchange=()=>setPose(activePose);
shafts.onchange=()=>{clouds.lightShafts=shafts.checked;gpuTimes.length=0;};
cloudScale.onchange=()=>{clouds.resolutionScale=Number(cloudScale.value);gpuTimes.length=0;};
function state(){return{ready,contextLost:gl.isContextLost(),mode:activePose,source:'Takram clouds0.7.6 procedural weather, not JangaFX VDB',p:activePose.startsWith('north')?Number(progress.value):null,
 opticalTrial:{weatherX:clouds.localWeatherOffset.x,sunElevation:Number(sunElevation.value),sunAzimuth:Number(sunAzimuth.value),hazeExponent:clouds.clouds.hazeExponent,hazeDensityScale:clouds.clouds.hazeDensityScale},
 sourceLocation:activePose.startsWith('basic')?[30,35,activePose==='basic300'?300:3500]:activePose.startsWith('north')?[8.4,61.63,'camera metres in localCamera ×1000']:[0,67,activePose==='source500'?500:3500],sourceDate:activePose.startsWith('basic')?'2026-01-02T07:00:00Z':activePose.startsWith('north')?'fixed north scene sun vector':'2000-06-01T10:00:00Z',camera:camera.position.toArray(),localCamera:lastCamera,
 worldToECEF:aerial.worldToECEFMatrix.toArray(),sun:aerial.sunDirection.toArray(),layers:clouds.cloudLayers.map(l=>({altitude:l.altitude,height:l.height,densityScale:l.densityScale,shapeDetailAmount:l.shapeDetailAmount,weatherExponent:l.weatherExponent})),
 quality:quality.value,look:look.value,coverage:clouds.coverage,localWeatherRepeat:clouds.localWeatherRepeat.toArray(),localWeatherOffset:clouds.localWeatherOffset.toArray(),resolutionScale:clouds.resolutionScale,lightShafts:clouds.lightShafts,shadowMaxFar:clouds.shadow.maxFar,shadowLengthLinked:!!aerial.shadowLength,temporal:clouds.temporalUpscale,temporalUpscale:clouds.temporalUpscale,temporalAntialiasing:enabled.checked,clouds:enabled.checked,cloudPassAttached:opticalPass.hasCloud(),smaa:aa.checked,wind:wind.checked,
 terrain:north?.state().terrain,terrainLighting:'candidate albedo input + Takram Lambert sun/sky/BSM; main PBR unchanged',renderSize:[renderer.domElement.width,renderer.domElement.height],gpu:{available:!!timer,count:gpuTimes.length,p50:percentile(.5),p95:percentile(.95)},frames};}
quality.onchange=()=>{clouds.qualityPreset=quality.value as any;clouds.temporalUpscale=temporal.checked;clouds.lightShafts=shafts.checked;clouds.resolutionScale=Number(cloudScale.value);applyOptics();gpuTimes.length=0;};
temporal.onchange=()=>{clouds.temporalUpscale=temporal.checked;gpuTimes.length=0;};enabled.onchange=setCloudEnabled;
async function ensureNorth(){
 if(north)return;
 error.textContent='북유럽 지형을 준비하는 중입니다.';
 north=await createNorthernArrival(renderer);north.setEffects({cloud:false,cloudShadow:false,atmosphere:false});
 north.scene.scale.setScalar(1000);northScene.add(north.scene);error.textContent='';
}
pose.onchange=async()=>{pose.disabled=true;try{if(pose.value.startsWith('north'))await ensureNorth();setPose(pose.value);}catch(e){error.textContent=String(e);}finally{pose.disabled=false;}};progress.oninput=()=>{gpuTimes.length=0;};
async function saveFrame(){
 if(!ready||gl.isContextLost()){error.textContent='렌더가 준비되지 않았거나 GPU 컨텍스트가 끊겨 정상 프레임을 저장할 수 없습니다.';return;}
 draw();
 let shot=activePose+(activePose.startsWith('north')?'-'+Math.round(Number(progress.value)*1000):'')+'-'+look.value+'-r'+weatherRepeat.value+'-c'+Math.round(Number(coverage.value)*100)+'-e'+Math.round(Number(cluster.value)*10)+'-q'+quality.value+'-s'+Math.round(Number(cloudScale.value)*100)+(temporal.checked?'-upscale':'-fullres')+(enabled.checked?'-cloud':'-off')+(shafts.checked?'-shafts':'-nosh')+(aa.checked?'-smaa':'-noaa')+(params.get('reviewRound')?.startsWith('takram-parameters')?`-x${Math.round(Number(weatherX.value)*100)}-el${Math.round(Number(sunElevation.value)*100)}-az${Math.round(Number(sunAzimuth.value)*100)}-hz${Math.round(Number(hazeFalloff.value)*1e6)}`:'');
 if(params.get('reviewRound')?.startsWith('takram-parameters'))shot='p'+Math.round(Number(progress.value)*1000)+'-c'+Math.round(Number(coverage.value)*100)+'-x'+Math.round(Number(weatherX.value)*100)+'-el'+Math.round(Number(sunElevation.value)*100)+'-az'+Math.round(Number(sunAzimuth.value)*100)+'-hz'+Math.round(Number(hazeFalloff.value)*1e6)+(shafts.checked?'-on':'-off');
 const e=gl.getExtension('WEBGL_debug_renderer_info');
 const response=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:params.get('reviewRound')||'takram-audit',shot,image:renderer.domElement.toDataURL('image/png'),meta:{renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,state:state(),url:location.href}})});
 if(!response.ok){error.textContent=await response.text();return;}save.textContent='프레임 저장 완료';
}
save.onclick=saveFrame;
captureSet.onclick=async()=>{
 captureSet.disabled=save.disabled=pose.disabled=true;
 const framesFor=async(n:number)=>{for(let i=0;i<n;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));};
 try{
  await ensureNorth();setPose('north300');
  for(const p of [.265,.285,.300,.320,.345,.365]){
   if(!ready||gl.isContextLost())throw new Error('GPU 컨텍스트 오류로 기준 캡처를 중단했습니다.');
   progress.value=String(p);captureSet.textContent=`기준 저장 · ${p}`;await framesFor(timer?60:16);gpuTimes.length=0;
   for(let i=0;i<(timer?180:16)&&gpuTimes.length<120;i++)await framesFor(1);
   await saveFrame();
  }
  captureSet.textContent='기준 구도 저장 완료';
 }finally{captureSet.disabled=save.disabled=pose.disabled=false;}
};
function draw(){
 if(!ready||gl.isContextLost())return;
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
 frames++;if(frames%30===0)status.textContent=`${activePose} · ${renderer.domElement.width}×${renderer.domElement.height} · ${quality.value}\nGPU composer ${percentile(.5)?.toFixed(2)??'—'}ms / ${gpuTimes.length} samples · ${clouds.temporalUpscale?'4×4 업스케일':'전체 해상도 TAA'} · ${enabled.checked?'구름 ON':'구름 OFF'}\n${activePose.startsWith('north')?'동일 DEM 1.5× · 광학 정합 검토':'원본 Vanilla 광학 chain · 구름 관찰 카메라'}`;
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
 if(params.get('pose')?.startsWith('north'))await ensureNorth();
 // Geometry/light transform uses metre local coordinates; optical ECEF transform carries only rotation+translation.
 quality.value=params.get('quality')||'high';clouds.qualityPreset=quality.value as any;
 const requestedCluster=Number(params.get('cluster')||'1');cluster.value=String(Number.isFinite(requestedCluster)?THREE.MathUtils.clamp(requestedCluster,1,3):1);
 temporal.checked=params.get('upscale')==='1';clouds.temporalUpscale=temporal.checked;clouds.lightShafts=shafts.checked;aa.checked=true;smaaPass.enabled=true;cloudScale.value=params.get('scale')||'.75';clouds.resolutionScale=Number(cloudScale.value);
 ready=true;setPose(params.get('pose')||'basic300');renderer.setAnimationLoop(draw);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
init().catch(e=>{error.textContent=String(e.stack||e);console.error(e);});
