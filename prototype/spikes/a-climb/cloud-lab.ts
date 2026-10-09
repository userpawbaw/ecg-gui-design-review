// D104/D105 · REF-015 EFX-015-01/02. Pinned Takram optical chain + Basic settings trial.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer,EffectPass,RenderPass,ToneMappingEffect,ToneMappingMode,SMAAEffect,type Effect} from 'postprocessing';
import {AerialPerspectiveEffect,getSunDirectionECEF,PrecomputedTexturesLoader} from '@takram/three-atmosphere';
import {CloudsEffect} from '@takram/three-clouds';
import {DataTextureLoader,Ellipsoid,Geodetic,parseUint8Array,STBNLoader} from '@takram/three-geospatial';
import {DitheringEffect,LensFlareEffect} from '@takram/three-geospatial-effects';
import {createNorthernArrival} from './arrival-north';
import {OrbitalCloudEffect} from './cloud-orbital';
import {handoffCamera,handoffFrames,cloudCoverProbe,bakeHandoffWeather} from './cloud-handoff';
import {TerrainNormalPass} from './terrain-normal-pass';

const params=new URLSearchParams(location.search);
const detailTrial=params.get('cloudDetail')==='1';
const seamReview=params.get('terrainSeam')==='1';
const seamControl=document.createElement('label');seamControl.innerHTML='지형 패스 대조 <select aria-label="지형 패스 대조"><option value="matched">변형 법선·깊이 정합</option><option value="matchedbase">정합 법선 · 이전 색 인계</option><option value="legacy">이전 공통 법선</option><option value="offset">깊이 보정만</option><option value="albedo">색만 · 조명 OFF</option></select>';
const seamMode=seamControl.querySelector('select')!;
if(seamReview)document.getElementById('panel')!.append(seamControl);
const orbital=detailTrial||params.get('orbital')==='1';
const handoff=orbital||params.get('handoff')==='1';
let macroWeather:ReturnType<typeof bakeHandoffWeather>|null=null;
let handoffStage:ReturnType<typeof handoffCamera>|null=null,coverMeasure:ReturnType<ReturnType<typeof cloudCoverProbe>>=null;
if(handoff){document.title='A · 북유럽–구름 연속 인계 후보';}
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
const orbitalSelect=document.createElement('select');orbitalSelect.onchange=()=>gpuTimes.length=0;orbitalSelect.setAttribute('aria-label','궤도 구름 표현');orbitalSelect.innerHTML='<option value="coverage">위성 분포 · 평면 명암</option><option value="relief" selected>위성 분포 · 국소 입체 명암</option>';
if(orbital){const label=document.createElement('label');label.textContent='궤도 구름 표현 ';label.append(orbitalSelect);settings.prepend(label);document.title='A · 위성 분포 궤도 구름 시험';}
const detailSelect=document.createElement('select');detailSelect.setAttribute('aria-label','구름 자료 해상도');detailSelect.innerHTML='<option value="2k">같은 원본 · 2K 대조</option><option value="8k" selected>8K 원본 · 지역 R8</option>';
const cloudAmount=document.createElement('select');cloudAmount.setAttribute('aria-label','궤도 구름 양');cloudAmount.innerHTML='<option value="0">현재 양</option><option value=".07">소폭 증가</option><option value=".14">중간 증가</option>';
const cloudAmountLabel=document.createElement('label');cloudAmountLabel.textContent='궤도 구름 양 ';cloudAmountLabel.append(cloudAmount);if(orbital)settings.prepend(cloudAmountLabel);
cloudAmount.onchange=()=>{gpuTimes.length=0;};
const cloudAmountSet=document.createElement('button');cloudAmountSet.textContent='구름 양 3후보 저장';if(orbital)settings.prepend(cloudAmountSet);
const cloudPlacement=document.createElement('select');cloudPlacement.setAttribute('aria-label','구름 위치');cloudPlacement.innerHTML='<option value="original">기존 위치</option><option value="near">확대 지형 근처</option>';
const placementLabel=document.createElement('label');placementLabel.textContent='구름 위치 ';placementLabel.append(cloudPlacement);if(orbital)settings.prepend(placementLabel);
if(params.get('reviewRound')==='cloud-placement-20261009'){cloudPlacement.value='near';cloudAmount.value='.07';}
cloudPlacement.onchange=()=>{gpuTimes.length=0;};
const placementSet=document.createElement('button');placementSet.textContent='구름 위치 2후보 저장';if(orbital)settings.prepend(placementSet);
if(detailTrial){const label=document.createElement('label');label.textContent='구름 자료 해상도 ';label.append(detailSelect);settings.prepend(label);}
// D107: independent art-direction controls; original/main defaults stay intact.
const optics=document.createElement('details');optics.innerHTML='<summary>빛·분포 보완 시험</summary>'+[
 ['weatherX','날씨 위치 X',0,0,1,.01],['weatherY','날씨 위치 Y',0,0,1,.01],['sunElevation','태양 고도',16.1,5,60,1],['sunAzimuth','태양 방위',43.75,-180,180,1],['hazeFalloff','연무 고도 감쇠',.001,.0001,.002,.00005],['layerDepth','구름 두께 배율',1,.6,1.4,.1],['layerDensity','구름 밀도 배율',1,.5,1.5,.1]
].map(([id,label,value,min,max,step])=>`<label>${label} <input id="${id}" aria-label="${label}" type="number" value="${value}" min="${min}" max="${max}" step="${step}"></label>`).join('');settings.append(optics);
const weatherX=dom<HTMLInputElement>('weatherX'),sunElevation=dom<HTMLInputElement>('sunElevation'),sunAzimuth=dom<HTMLInputElement>('sunAzimuth'),hazeFalloff=dom<HTMLInputElement>('hazeFalloff');
const weatherY=dom<HTMLInputElement>('weatherY'),layerDepth=dom<HTMLInputElement>('layerDepth'),layerDensity=dom<HTMLInputElement>('layerDensity');
const shadowLabel=document.createElement('label');shadowLabel.innerHTML='<input id="groundShadow" type="checkbox" aria-label="지형 구름 그림자" checked> 지형 구름 그림자';optics.append(shadowLabel);
const groundShadow=dom<HTMLInputElement>('groundShadow');groundShadow.onchange=()=>{aerial.shadow=enabled.checked&&!orbital&&groundShadow.checked?clouds.atmosphereShadow:null;gpuTimes.length=0;};
const recipeLabel=document.createElement('label');recipeLabel.innerHTML='조명 후보 <select id="recipe" aria-label="조명 후보"><option value="baseline">이전 기준 · TAA</option><option value="curtain">커튼 광선 · 고도 연무</option></select>';settings.prepend(recipeLabel);
const recipe=dom<HTMLSelectElement>('recipe');
if(handoff){
 const label=document.createElement('label');label.innerHTML='연결 구도 <select id="handoffFrame" aria-label="연결 구도">'+(orbital?handoffFrames.slice(0,2):handoffFrames).map(f=>`<option value="${f.p}">${f.name}</option>`).join('')+'</select>';settings.prepend(label);
 const select=dom<HTMLSelectElement>('handoffFrame');select.value=orbital?'0.18':'0.3';select.onchange=()=>{wheelDriving=false;inputSource='handoff-pose';progress.value=select.value;gpuTimes.length=0;};
}

const diagnosticUI=document.createElement('details');diagnosticUI.innerHTML='<summary>하강 결함 분리 시험</summary><label>분리 설정 <select id="diagnostic" aria-label="하강 분리 설정"><option value="baseline">기준</option><option value="shadowOff">지형 그림자 OFF</option><option value="margin">그림자 깊이 여유 20km</option><option value="jitterOff">그림자 jitter OFF</option><option value="march">촘촘한 볼륨 샘플</option><option value="far">그림자 범위 200km</option></select></label><button id="diagnosticSet">분리 구도 저장</button>';
settings.append(diagnosticUI);
const diagnostic=dom<HTMLSelectElement>('diagnostic'),diagnosticSet=dom<HTMLButtonElement>('diagnosticSet');
for(const [value,text] of [['fast','그림자 현재 반영 10%'],['noHistory','그림자 시간 누적 OFF'],['cloudFilter','구름 현재 반영 5%']]){const option=document.createElement('option');option.value=value;option.textContent=text;diagnostic.add(option);}
function applyDiagnostic(){
 clouds.shadowMaps.margin=diagnostic.value==='margin'?20000:0;
 clouds.shadow.maxFar=diagnostic.value==='far'?200000:100000;
 clouds.shadow.temporalJitter=diagnostic.value!=='jitterOff';
 clouds.shadow.temporalPass=diagnostic.value!=='noHistory';
 clouds.shadowPass.resolveMaterial.uniforms.temporalAlpha.value=diagnostic.value==='fast'?.1:.01;
 clouds.cloudsPass.resolveMaterial.uniforms.temporalAlpha.value=diagnostic.value==='cloudFilter'?.05:.1;
 clouds.clouds.minStepSize=diagnostic.value==='march'?10:quality.value==='ultra'?10:quality.value==='low'?100:50;
 clouds.clouds.perspectiveStepScale=diagnostic.value==='march'?1.003:1.01;
 groundShadow.checked=diagnostic.value!=='shadowOff';
 aerial.shadow=enabled.checked&&!orbital&&groundShadow.checked?clouds.atmosphereShadow:null;gpuTimes.length=0;
}
diagnostic.onchange=applyDiagnostic;
function applyRecipe(value:string){
 recipe.value=value;coverage.value='.42';weatherRepeat.value=handoff?'9':'54';cluster.value='1.6';weatherX.value=weatherY.value='0';
 sunElevation.value=value==='curtain'?'15':'16.1';sunAzimuth.value=value==='curtain'?'0':'43.75';hazeFalloff.value=value==='curtain'?'.00018':'.001';layerDepth.value=value==='curtain'?'1.2':'1';layerDensity.value='1';
 groundShadow.checked=shafts.checked=true;clouds.lightShafts=true;aerial.shadow=enabled.checked&&!orbital?clouds.atmosphereShadow:null;applyWeather();applyOptics();applyDiagnostic();
}
recipe.onchange=()=>applyRecipe(recipe.value);
function applyOptics(){
 clouds.localWeatherOffset.set(Number(weatherX.value),Number(weatherY.value));clouds.clouds.hazeExponent=Number(hazeFalloff.value);
 if(activePose.startsWith('north')){
  clouds.cloudLayers[0].height=(look.value==='ref54'?650:1200)*Number(layerDepth.value);clouds.cloudLayers[1].height=(look.value==='ref54'?1200:1800)*Number(layerDepth.value);
  clouds.cloudLayers[0].densityScale=clouds.cloudLayers[1].densityScale=.2*Number(layerDensity.value);
  const el=THREE.MathUtils.degToRad(Number(sunElevation.value)),az=THREE.MathUtils.degToRad(Number(sunAzimuth.value));
  if(Number(sunElevation.value)===16.1&&Number(sunAzimuth.value)===43.75)aerial.sunDirection.copy(northSun);
  else aerial.sunDirection.set(-Math.sin(az)*Math.cos(el),Math.sin(el),-Math.cos(az)*Math.cos(el)).applyMatrix3(new THREE.Matrix3().setFromMatrix4(northToECEF));
  clouds.sunDirection.copy(aerial.sunDirection);
 }
 gpuTimes.length=0;
}
weatherX.oninput=weatherY.oninput=sunElevation.oninput=sunAzimuth.oninput=hazeFalloff.oninput=layerDepth.oninput=layerDensity.oninput=applyOptics;
dom('panel').style.maxHeight='calc(100vh - 64px)';dom('panel').style.overflowY='auto';
const save=dom<HTMLButtonElement>('save');
const captureSet=document.createElement('button');captureSet.textContent='기준 구도 저장';save.after(captureSet);
const motionReview=document.createElement('button');motionReview.textContent='정역 이동 검증';captureSet.after(motionReview);
const motionVideo=document.createElement('button');motionVideo.textContent='8초 이동 영상 저장';motionReview.after(motionVideo);
const seamSet=document.createElement('button');seamSet.textContent='지형 패스 6구도 대조 저장';if(seamReview)motionVideo.after(seamSet);
const framesFor=async(n:number)=>{for(let i=0;i<n;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));};
seamSet.onclick=async()=>{
  seamSet.disabled=save.disabled=captureSet.disabled=motionVideo.disabled=true;const old=seamMode.value,cloudOn=enabled.checked;wheelDriving=false;
 try{
  for(const on of [false,true])for(const mode of ['legacy','offset','matched']){
   seamMode.value=mode;enabled.checked=on;setCloudEnabled();
   for(const p of [.15,.165,.18,.20,.22,.235]){progress.value=String(p);seamSet.textContent=`저장 ${mode} ${on?'ON':'OFF'} ${p}`;await framesFor(65);gpuTimes.length=0;await framesFor(40);await saveFrame();}
  }
  seamMode.value='albedo';enabled.checked=false;setCloudEnabled();
  for(const p of [.15,.165,.18,.20,.22,.235]){progress.value=String(p);await framesFor(65);await saveFrame();}
  seamSet.textContent='지형 대조 42프레임 저장 완료';
 }catch(e){error.textContent=String(e);}
 finally{seamMode.value=old;enabled.checked=cloudOn;setCloudEnabled();seamSet.disabled=save.disabled=captureSet.disabled=motionVideo.disabled=false;}
};
if(handoff)motionVideo.textContent='24초 연결 영상 저장';
let capturePhase='fixed';
// D109: physical wheel input changes a target; damping uses elapsed time, not frame rate.
let wheelTarget=Number(progress.value),wheelCurrent=Number(progress.value),wheelDriving=false,wheelCount=0,wheelDelta=0;
let inputSource='pose',lastDrawTime=performance.now();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wheelHint=document.createElement('small');wheelHint.textContent='북유럽 화면에서 휠: 하강/상승 · 패널 안에서는 설정 스크롤';settings.before(wheelHint);
rendererWheelSetup();
function rendererWheelSetup(){
 document.addEventListener('wheel',e=>{
  if(!ready||!activePose.startsWith('north')||captureSet.disabled||motionReview.disabled||dom('panel').contains(e.target as Node)||e.ctrlKey)return;
  e.preventDefault();
  const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  if(!pixels)return;
  if(!wheelDriving)wheelTarget=wheelCurrent=Number(progress.value);
  wheelTarget=THREE.MathUtils.clamp(wheelTarget+pixels*.000025,Number(progress.min),Number(progress.max));
  wheelDriving=true;wheelCount++;wheelDelta=pixels;inputSource='wheel';gpuTimes.length=0;
 },{passive:false});
}
const basicOption=document.createElement('option');basicOption.value='basic3500';basicOption.textContent='Basic 조명 비교 · 3500m';pose.add(basicOption);
const basicLow=document.createElement('option');basicLow.value='basic300';basicLow.textContent='Basic 빛 커튼 · 300m';pose.add(basicLow);
const renderer=new THREE.WebGLRenderer({depth:false,logarithmicDepthBuffer:false,antialias:false});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
const measureCover=cloudCoverProbe(renderer);
if(handoff){progress.min=seamReview?'.10':'.18';progress.max=orbital?'.235':'.41';}
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
 if(orbital)return;
 if(e.property==='atmosphereOverlay')aerial.overlay=clouds.atmosphereOverlay;
 if(e.property==='atmosphereShadow')aerial.shadow=groundShadow.checked?clouds.atmosphereShadow:null;
 if(e.property==='atmosphereShadowLength')aerial.shadowLength=clouds.atmosphereShadowLength;
});
const composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType,multisampling:0});
const renderPass=new RenderPass(sourceScene,camera),normalPass=new TerrainNormalPass(sourceScene,camera);
normalPass.matched=seamReview;
aerial.normalBuffer=normalPass.texture;
composer.addPass(renderPass);composer.addPass(normalPass);
class OpticalPass extends EffectPass {
 configure(effects:Effect[]){this.setEffects(effects);this.recompile();}
 hasCloud(){return this.effects.includes(clouds);}
}
const opticalPass=new OpticalPass(camera,clouds,aerial);composer.addPass(opticalPass);
const orbitalEffect=new OrbitalCloudEffect();if(orbital)composer.addPass(new EffectPass(camera,orbitalEffect));
const lens=new LensFlareEffect(),tone=new ToneMappingEffect({mode:ToneMappingMode.AGX}),dither=new DitheringEffect(),smaa=new SMAAEffect();
composer.addPass(new EffectPass(camera,lens,tone));
const smaaPass=new EffectPass(camera,smaa);smaaPass.enabled=false;composer.addPass(smaaPass);
composer.addPass(new EffectPass(camera,dither));
aa.onchange=()=>{smaaPass.enabled=aa.checked;gpuTimes.length=0;};
function setCloudEnabled(){
 // CloudsEffect has no enabled property. The author's R3F scene conditionally mounts it.
 opticalPass.configure(enabled.checked&&!orbital?[clouds,aerial]:[aerial]);
 aerial.overlay=enabled.checked&&!orbital?clouds.atmosphereOverlay:null;
 aerial.shadow=enabled.checked&&!orbital&&groundShadow.checked?clouds.atmosphereShadow:null;
 aerial.shadowLength=enabled.checked&&!orbital?clouds.atmosphereShadowLength:null;
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
 wheelDriving=false;inputSource='pose';
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
 weatherRepeat.value=handoff?'9':look.value==='ref54'?'54':'100';applyWeather();
 clouds.shadow.maxFar=1e5;
 applyOptics();applyDiagnostic();
}
function applyWeather(){clouds.coverage=Number(coverage.value);clouds.localWeatherRepeat.setScalar(Number(weatherRepeat.value));clouds.cloudLayers[0].weatherExponent=clouds.cloudLayers[1].weatherExponent=Number(cluster.value);gpuTimes.length=0;}
coverage.oninput=weatherRepeat.oninput=applyWeather;
cluster.oninput=applyWeather;
look.onchange=()=>setPose(activePose);
shafts.onchange=()=>{clouds.lightShafts=shafts.checked;gpuTimes.length=0;};
cloudScale.onchange=()=>{clouds.resolutionScale=Number(cloudScale.value);gpuTimes.length=0;};
function state(){return{orbital:orbital?{source:detailTrial?'Solar System Scope listed cloud asset, pinned public mirror':'NASA cloud_combined_2048.jpg',sourceSha256:detailTrial?'c792eca228989d36ebb45d3ea6ff1198be5e21a25d70d2fbcb2124ffd14ba7f5':'daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793',coverageBoost:Number(cloudAmount.value),coverageMeaning:'display threshold offset, not measured cloud fraction',detailTrial:detailTrial?{mode:detailSelect.value,sourceSize:[8192,4096],cropSize:[4096,1536],globalSize:[2048,1024],cropUV:[.375,.5625,.5,.375],nominalR8MipMiB:10.667}:null,mode:orbitalSelect.value,sourcePlacement:{geoAnchor:[.523333333,.842388889],sourceCentre:cloudPlacement.value==='near'?[.671875,.8330078125]:[.64,.78],preset:cloudPlacement.value,scale:2},artisticPlacement:true,technique:'two spherical height proxies with finite-difference slope lighting; no measured height or multiple scattering',shadow:false,nearHandoff:false,range:[.18,.235]}:null,handoff:handoff?{stage:handoffStage,cover:coverMeasure,weatherFixed:!wind.checked,macroWeather:macroWeather?{anchor:macroWeather.anchor,sourceRepeat:macroWeather.sourceRepeat,macroRepeat:macroWeather.macroRepeat,role:macroWeather.role}:null,embeddedCloud:false,sourceMip:true,archiveIntegrated:false}:null,ready,contextLost:gl.isContextLost(),mode:activePose,source:orbital?'NASA shape-seeded orbital proxy, not measured cloud volume':'Takram clouds0.7.6 procedural weather, not JangaFX VDB',p:activePose.startsWith('north')?Number(progress.value):null,
 capturePhase,diagnostic:{name:diagnostic.value,shadowMargin:clouds.shadowMaps.margin,shadowFar:clouds.shadow.maxFar,shadowJitter:clouds.shadow.temporalJitter,shadowTemporal:clouds.shadow.temporalPass,shadowAlpha:clouds.shadowPass.resolveMaterial.uniforms.temporalAlpha.value,cloudAlpha:clouds.cloudsPass.resolveMaterial.uniforms.temporalAlpha.value,cascades:clouds.shadow.cascadeCount,mapSize:clouds.shadow.mapSize.toArray(),splitLambda:clouds.shadow.splitLambda,minStep:clouds.clouds.minStepSize,perspectiveStep:clouds.clouds.perspectiveStepScale},input:{source:inputSource,wheelCount,lastWheelPixels:wheelDelta,target:wheelDriving?wheelTarget:Number(progress.value),current:Number(progress.value),settled:!wheelDriving||Math.abs(wheelTarget-Number(progress.value))<.00011,reducedMotion},
 opticalTrial:{weatherX:clouds.localWeatherOffset.x,weatherY:clouds.localWeatherOffset.y,sunElevation:Number(sunElevation.value),sunAzimuth:Number(sunAzimuth.value),hazeExponent:clouds.clouds.hazeExponent,hazeDensityScale:clouds.clouds.hazeDensityScale,layerDepth:Number(layerDepth.value),layerDensity:Number(layerDensity.value),groundShadow:groundShadow.checked,groundShadowLinked:!!aerial.shadow},
 sourceLocation:activePose.startsWith('basic')?[30,35,activePose==='basic300'?300:3500]:activePose.startsWith('north')?[8.4,61.63,'camera metres in localCamera ×1000']:[0,67,activePose==='source500'?500:3500],sourceDate:activePose.startsWith('basic')?'2026-01-02T07:00:00Z':activePose.startsWith('north')?'fixed north scene sun vector':'2000-06-01T10:00:00Z',camera:camera.position.toArray(),localCamera:lastCamera,
 worldToECEF:aerial.worldToECEFMatrix.toArray(),sun:aerial.sunDirection.toArray(),layers:clouds.cloudLayers.map(l=>({altitude:l.altitude,height:l.height,densityScale:l.densityScale,shapeDetailAmount:l.shapeDetailAmount,weatherExponent:l.weatherExponent})),
 quality:quality.value,look:look.value,coverage:clouds.coverage,localWeatherRepeat:clouds.localWeatherRepeat.toArray(),localWeatherOffset:clouds.localWeatherOffset.toArray(),resolutionScale:clouds.resolutionScale,lightShafts:clouds.lightShafts,shadowMaxFar:clouds.shadow.maxFar,shadowLengthLinked:!!aerial.shadowLength,temporal:clouds.temporalUpscale,temporalUpscale:clouds.temporalUpscale,temporalAntialiasing:enabled.checked&&!orbital,clouds:enabled.checked,cloudPassAttached:opticalPass.hasCloud(),smaa:aa.checked,wind:wind.checked,
 terrain:north?.state().terrain,terrainLighting:'candidate albedo input + Takram Lambert sun/sky/BSM; main PBR unchanged',renderSize:[renderer.domElement.width,renderer.domElement.height],gpu:{available:!!timer,count:gpuTimes.length,p50:percentile(.5),p95:percentile(.95)},frames};}
quality.onchange=()=>{clouds.qualityPreset=quality.value as any;clouds.temporalUpscale=temporal.checked;clouds.lightShafts=shafts.checked;clouds.resolutionScale=Number(cloudScale.value);applyOptics();applyDiagnostic();gpuTimes.length=0;};
temporal.onchange=()=>{clouds.temporalUpscale=temporal.checked;gpuTimes.length=0;};enabled.onchange=setCloudEnabled;
async function ensureNorth(){
 if(north)return;
 error.textContent='북유럽 지형을 준비하는 중입니다.';
 north=await createNorthernArrival(renderer);north.setEffects({cloud:false,cloudShadow:false,atmosphere:false,embeddedCloud:!handoff,stars:!handoff});
 north.scene.scale.setScalar(1000);northScene.add(north.scene);error.textContent='';
}
pose.onchange=async()=>{pose.disabled=true;try{if(pose.value.startsWith('north'))await ensureNorth();setPose(pose.value);}catch(e){error.textContent=String(e);}finally{pose.disabled=false;}};progress.oninput=()=>{wheelDriving=false;inputSource='slider';gpuTimes.length=0;};
async function saveFrame(){
 if(!ready||gl.isContextLost()){error.textContent='렌더가 준비되지 않았거나 GPU 컨텍스트가 끊겨 정상 프레임을 저장할 수 없습니다.';return;}
 draw();
 if(handoff&&!orbital)coverMeasure=measureCover(clouds.atmosphereOverlay?.map??null);
 let shot=activePose+(activePose.startsWith('north')?'-'+Math.round(Number(progress.value)*1000):'')+'-'+look.value+'-r'+weatherRepeat.value+'-c'+Math.round(Number(coverage.value)*100)+'-e'+Math.round(Number(cluster.value)*10)+'-q'+quality.value+'-s'+Math.round(Number(cloudScale.value)*100)+(temporal.checked?'-upscale':'-fullres')+(enabled.checked?'-cloud':'-off')+(shafts.checked?'-shafts':'-nosh')+(aa.checked?'-smaa':'-noaa')+(params.get('reviewRound')?.startsWith('takram-parameters')?`-x${Math.round(Number(weatherX.value)*100)}-el${Math.round(Number(sunElevation.value)*100)}-az${Math.round(Number(sunAzimuth.value)*100)}-hz${Math.round(Number(hazeFalloff.value)*1e6)}`:'');
 if(params.get('reviewRound')?.startsWith('takram-parameters'))shot='p'+Math.round(Number(progress.value)*1000)+'-c'+Math.round(Number(coverage.value)*100)+'-x'+Math.round(Number(weatherX.value)*100)+'-el'+Math.round(Number(sunElevation.value)*100)+'-az'+Math.round(Number(sunAzimuth.value)*100)+'-hz'+Math.round(Number(hazeFalloff.value)*1e6)+(shafts.checked?'-on':'-off');
 if(params.get('reviewRound')?.startsWith('takram-beam'))shot='p'+Math.round(Number(progress.value)*1000)+'-x'+Math.round(Number(weatherX.value)*100)+'-y'+Math.round(Number(weatherY.value)*100)+'-az'+Math.round(Number(sunAzimuth.value))+'-el'+Math.round(Number(sunElevation.value))+'-h'+Math.round(Number(hazeFalloff.value)*1e6)+'-d'+Math.round(Number(layerDepth.value)*10)+'-n'+Math.round(Number(layerDensity.value)*10)+(shafts.checked?'-on':'-off')+(groundShadow.checked?'-gs':'-nogs');
 if(capturePhase!=='fixed')shot=capturePhase+'-'+shot;
 if(params.get('reviewRound')?.startsWith('takram-wheel'))shot='wheel-'+wheelCount+'-p'+Math.round(Number(progress.value)*10000)+'-'+inputSource;
 if(handoff)shot='handoff-p'+Math.round(Number(progress.value)*10000)+'-'+capturePhase;
 if(params.get('reviewRound')?.startsWith('takram-defect'))shot=diagnostic.value.toLowerCase()+'-p'+Math.round(Number(progress.value)*10000)+'-'+capturePhase;
 if(orbital)shot=(detailTrial?'detail-'+detailSelect.value:'orbital')+'-'+orbitalSelect.value+'-p'+Math.round(Number(progress.value)*10000);
 if(seamReview)shot='seam-'+seamMode.value+'-p'+Math.round(Number(progress.value)*10000)+(enabled.checked?'-on':'-off');
 if(params.get('reviewRound')==='cloud-amount-20261009')shot='amount-'+Math.round(Number(cloudAmount.value)*100)+'-p'+Math.round(Number(progress.value)*10000)+(seamMode.value!=='matched'||!enabled.checked?'-'+seamMode.value+(enabled.checked?'-on':'-off'):'');
 if(params.get('reviewRound')==='cloud-placement-20261009')shot='placement-'+cloudPlacement.value+'-p'+Math.round(Number(progress.value)*10000);
 const e=gl.getExtension('WEBGL_debug_renderer_info');
 const response=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:params.get('reviewRound')||'takram-audit',shot,image:renderer.domElement.toDataURL('image/png'),meta:{renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,state:state(),terrainSeam:seamReview?{mode:seamMode.value,matchedNormals:normalPass.matched,depthOffset:seamMode.value!=='legacy',north:north?.state()}:null,url:location.href}})});
 if(!response.ok){error.textContent=await response.text();throw Error(error.textContent);}save.textContent='프레임 저장 완료';
}
save.onclick=saveFrame;
placementSet.onclick=async()=>{
 const old={p:progress.value,placement:cloudPlacement.value};placementSet.disabled=true;wheelDriving=false;inputSource='placement-comparison';
 try{for(const p of [.18,.235])for(const placement of ['original','near']){progress.value=String(p);cloudPlacement.value=placement;await framesFor(70);gpuTimes.length=0;await framesFor(80);await saveFrame();}placementSet.textContent='구름 위치 저장 완료';}
 catch(e){error.textContent=String(e);}finally{progress.value=old.p;cloudPlacement.value=old.placement;placementSet.disabled=false;}
};
const colorSet=document.createElement('button');colorSet.textContent='색 인계 2구도 대조 저장';if(seamReview)settings.prepend(colorSet);
colorSet.onclick=async()=>{
 const old={p:progress.value,mode:seamMode.value,cloud:enabled.checked};colorSet.disabled=true;wheelDriving=false;inputSource='color-comparison';enabled.checked=false;setCloudEnabled();
 try{for(const p of [.15,.165])for(const mode of ['matchedbase','matched']){progress.value=String(p);seamMode.value=mode;await framesFor(70);gpuTimes.length=0;await framesFor(60);await saveFrame();}colorSet.textContent='색 인계 대조 저장 완료';}
 catch(e){error.textContent=String(e);}finally{progress.value=old.p;seamMode.value=old.mode;enabled.checked=old.cloud;setCloudEnabled();colorSet.disabled=false;}
};
cloudAmountSet.onclick=async()=>{
 const oldP=progress.value,oldAmount=cloudAmount.value;
 cloudAmountSet.disabled=save.disabled=captureSet.disabled=motionVideo.disabled=true;
 try{wheelDriving=false;inputSource='amount-comparison';
  for(const p of [.18,.235])for(const amount of ['0','.07','.14']){
   progress.value=String(p);cloudAmount.value=amount;cloudAmountSet.textContent=`구름 양 저장 · ${p} / ${amount}`;
   await framesFor(70);gpuTimes.length=0;await framesFor(80);await saveFrame();
  }cloudAmountSet.textContent='구름 양 3후보 저장 완료';
 }catch(e){error.textContent=String(e);}finally{progress.value=oldP;cloudAmount.value=oldAmount;cloudAmountSet.disabled=save.disabled=captureSet.disabled=motionVideo.disabled=false;}
};
motionVideo.onclick=async()=>{
 motionVideo.disabled=diagnosticSet.disabled=captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=diagnostic.disabled=true;
 let stream:MediaStream|undefined,recorder:MediaRecorder|undefined;
 try{
  if(!ready||gl.isContextLost())throw Error('Renderer not ready');
  if(!activePose.startsWith('north')){await ensureNorth();setPose('north300');}
  error.textContent='';wheelDriving=false;inputSource='recorded-camera-path';progress.value=handoff?'.18':'.265';
  const step=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));for(let i=0;i<60;i++)await step();
  const mime='video/webm;codecs=vp8';if(!MediaRecorder.isTypeSupported(mime))throw Error('WebM recording not supported');
  stream=renderer.domElement.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000});
  const chunks:BlobPart[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const stopped=new Promise<void>((resolve,reject)=>{recorder!.onstop=()=>resolve();recorder!.onerror=()=>reject(Error('MediaRecorder failed'));});
  recorder.start();motionVideo.textContent='정역 영상 녹화 중';const trace:{elapsed:number;p:number}[]=[];const start=performance.now(),duration=handoff&&!detailTrial?24000:8000,half=duration/2;let elapsed=0;
  do{
   if(gl.isContextLost())throw Error('GPU context lost');elapsed=Math.min(duration,performance.now()-start);
   const startP=seamReview?.10:handoff?.18:.265,endP=detailTrial?.235:handoff?.410:.365;progress.value=String(elapsed<=half?startP+(endP-startP)*elapsed/half:endP-(endP-startP)*(elapsed-half)/half);trace.push({elapsed,p:Number(progress.value)});await step();
  }while(elapsed<duration);
  recorder.stop();await stopped;
  const blob=new Blob(chunks,{type:'video/webm'});
  const video=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Video read failed'));reader.readAsDataURL(blob);});
  const response=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:params.get('reviewRound')||'takram-defect-video',shot:seamReview?'video-seam-'+seamMode.value:detailTrial?'video-detail-'+detailSelect.value:handoff?'video-handoff':'video-'+diagnostic.value.toLowerCase(),video,meta:{state:state(),terrainSeam:seamReview?{mode:seamMode.value,matchedNormals:normalPass.matched}:null,url:location.href,motion:{completed:true,nominalMs:duration,mime,trace,encodingAffectsPerformance:true}}})});
  if(!response.ok)throw Error(await response.text());motionVideo.textContent='이동 영상 저장 완료';
 }catch(e){error.textContent=String(e);motionVideo.textContent='영상 저장 실패';}
 finally{if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(t=>t.stop());motionVideo.disabled=diagnosticSet.disabled=captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=diagnostic.disabled=false;}
};
diagnosticSet.onclick=async()=>{
 diagnosticSet.disabled=captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=motionVideo.disabled=diagnostic.disabled=true;
 const step=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 try{
  await ensureNorth();setPose('north300');applyRecipe('curtain');wheelDriving=false;
  error.textContent='';for(const setting of params.get('singleDiagnostic')==='1'?[diagnostic.value]:['baseline','shadowOff','margin','jitterOff','march','far','fast','noHistory','cloudFilter']){
   diagnostic.value=setting;applyDiagnostic();
   for(const p of [.300,.345,.365]){
    progress.value=String(p);diagnosticSet.textContent=setting+' · '+p;
    for(let i=0;i<60;i++){if(gl.isContextLost())throw Error('GPU context lost');await step();}
    gpuTimes.length=0;for(let i=0;i<120&&(!timer||gpuTimes.length<60);i++)await step();
    await saveFrame();
   }
  }
  diagnostic.value='baseline';applyDiagnostic();diagnosticSet.textContent='분리 구도 저장 완료';
 }catch(e){error.textContent=String(e);}finally{diagnosticSet.disabled=captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=motionVideo.disabled=diagnostic.disabled=false;}
};
captureSet.onclick=async()=>{
 captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=motionVideo.disabled=diagnosticSet.disabled=true;
 const framesFor=async(n:number)=>{for(let i=0;i<n;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));};
 try{
  await ensureNorth();setPose('north300');
  for(const dataMode of detailTrial?['2k','8k']:[detailSelect.value]){
  detailSelect.value=dataMode;
  for(const mode of detailTrial?['relief']:orbital?['coverage','relief']:[orbitalSelect.value]){
  orbitalSelect.value=mode;
  for(const p of orbital?[.18,.235]:handoff?handoffFrames.map(f=>f.p):[.265,.285,.300,.320,.345,.365]){
   if(!ready||gl.isContextLost())throw new Error('GPU 컨텍스트 오류로 기준 캡처를 중단했습니다.');
   progress.value=String(p);captureSet.textContent=`기준 저장 · ${p}`;await framesFor(timer?60:16);gpuTimes.length=0;
   for(let i=0;i<(timer?180:16)&&gpuTimes.length<120;i++)await framesFor(1);
   await saveFrame();
  }
  }
  }
  captureSet.textContent='기준 구도 저장 완료';
 }finally{captureSet.disabled=save.disabled=pose.disabled=motionReview.disabled=motionVideo.disabled=diagnosticSet.disabled=false;}
};
motionReview.onclick=async()=>{
 motionReview.disabled=captureSet.disabled=save.disabled=pose.disabled=motionVideo.disabled=diagnosticSet.disabled=true;
 const step=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 try{
  await ensureNorth();setPose('north300');progress.value='.265';for(let i=0;i<60;i++)await step();
  for(const [phase,points] of [['forward',[.285,.300,.345,.365]],['reverse',[.345,.300,.285,.265]]] as const){
   capturePhase=phase;motionReview.textContent=phase==='forward'?'정방향 이동 중':'역방향 이동 중';
   for(const target of points){
    const start=Number(progress.value),t0=performance.now();let elapsed=0;
    do{if(gl.isContextLost())throw Error('GPU context lost');elapsed=Math.min(1,(performance.now()-t0)/800);progress.value=String(start+(target-start)*elapsed);await step();}while(elapsed<1);
    if(target!==.265&&target!==.365)await saveFrame();
   }
  }
  motionReview.textContent='정역 이동 검증 완료';
 }catch(e){error.textContent=String(e);}finally{capturePhase='fixed';motionReview.disabled=captureSet.disabled=save.disabled=pose.disabled=motionVideo.disabled=diagnosticSet.disabled=false;}
};
function draw(){
 if(!ready||gl.isContextLost())return;
 normalPass.matched=seamReview&&seamMode.value!=='legacy'&&seamMode.value!=='offset';
 if(seamReview){aerial.sunLight=aerial.skyLight=seamMode.value!=='albedo';}
 const now=performance.now(),elapsed=Math.min(.1,Math.max(0,(now-lastDrawTime)/1000));lastDrawTime=now;
 if(wheelDriving){const current=wheelCurrent,next=reducedMotion?wheelTarget:current+(wheelTarget-current)*(1-Math.exp(-elapsed/ .16));wheelCurrent=Math.abs(next-wheelTarget)<.00011?wheelTarget:next;progress.value=String(wheelCurrent);}
 if(activePose.startsWith('north')&&north){
  north.setEffects({colorHandoff:seamReview&&seamMode.value==='matched'});localCamera.aspect=camera.aspect;north.update(Math.min(.365,Number(progress.value)),2.4,true,localCamera);
  if(handoff){if(!seamReview||Number(progress.value)>=.18)handoffStage=handoffCamera(Number(progress.value),localCamera);
   else{localCamera.fov=36;localCamera.near=Math.max(.05,localCamera.position.y*.025);localCamera.updateProjectionMatrix();}
   // Source step starts at minStep + (perspectiveScale-1)*rayNear. At 1000km,
   // 1.01 skips a 0.8–1.4km slab. Keep near optics; continuously cap far overshoot.
   const farLod=THREE.MathUtils.smoothstep(localCamera.position.y,45,200);
   clouds.clouds.hazeDensityScale=3e-5*(1-farLod);
   clouds.clouds.perspectiveStepScale=THREE.MathUtils.lerp(1.01,1.0002,THREE.MathUtils.smoothstep(localCamera.position.y,100,600));
   // Same weather footprint; subpixel shape erosion has no useful silhouette at orbit distance.
   for(let i=0;i<2;i++){clouds.cloudLayers[i].shapeAmount=1;clouds.cloudLayers[i].shapeDetailAmount=1-farLod;}

  }
  // Existing and newly loaded LOD meshes must enter the optical pass as albedo,
  // not as already-lit PBR radiance. Retain texture and the source geometry/color handoff shader.
  north.scene.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;
   const original=(o.userData.opticalSource??o.material) as THREE.MeshStandardMaterial;
   if(!(original instanceof THREE.MeshStandardMaterial))return;
   o.userData.opticalSource=original;let albedo=albedoMaterials.get(original);
   if(!albedo){albedo=new THREE.MeshBasicMaterial({map:original.map,color:original.color,side:original.side,transparent:original.transparent,opacity:original.opacity,depthTest:original.depthTest,depthWrite:original.depthWrite});
    albedo.onBeforeCompile=(s,r)=>original.onBeforeCompile.call(original,s,r);albedo.customProgramCacheKey=()=>original.customProgramCacheKey()+'-takram-albedo';albedoMaterials.set(original,albedo);}
   // LOD maps can finish loading after conversion; keep the live source map and depth contract.
   albedo.map=original.map;
   albedo.polygonOffset=seamReview&&seamMode.value!=='legacy'&&original.polygonOffset;
   albedo.polygonOffsetFactor=original.polygonOffsetFactor;albedo.polygonOffsetUnits=original.polygonOffsetUnits;
   o.material=albedo;
  });
  lastCamera=localCamera.position.toArray() as [number,number,number];
  camera.position.copy(localCamera.position).multiplyScalar(1000);camera.quaternion.copy(localCamera.quaternion);
  camera.near=localCamera.near*1000;camera.far=localCamera.far*1000;camera.fov=localCamera.fov;camera.updateProjectionMatrix();
 }else controls.update();
 camera.updateMatrixWorld();if(orbital){orbitalEffect.setDetail(detailSelect.value);orbitalEffect.setCoverageBoost(Number(cloudAmount.value));orbitalEffect.setPlacement(cloudPlacement.value==='near');orbitalEffect.sync(camera,northToECEF,aerial.sunDirection,orbitalSelect.value,enabled.checked);}clouds.localWeatherVelocity.set(wind.checked ? .001 : 0,0);
 if(timer){
  if(gl.getParameter(timer.GPU_DISJOINT_EXT)){pending.forEach(q=>gl.deleteQuery(q));pending.length=0;gpuTimes.length=0;}
  else while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift()!;gpuTimes.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);if(gpuTimes.length>300)gpuTimes.shift();}
  if(pending.length<8){query=gl.createQuery();if(query)gl.beginQuery(timer.TIME_ELAPSED_EXT,query);}
 }
 composer.render();
 if(query){gl.endQuery(timer.TIME_ELAPSED_EXT);pending.push(query);query=null;}
 frames++;if(orbital&&frames%30===0){status.textContent=`${detailTrial?'구름 '+detailSelect.value+' · 지역 R8':'NASA 2048×1024'} · ${orbitalSelect.value==='relief'?'국소 입체 명암':'평면 명암'} · 원경 시험\nGPU composer ${percentile(.5)?.toFixed(2)??'—'}ms · ${renderer.domElement.width}×${renderer.domElement.height}\n${inputSource} · p${Number(progress.value).toFixed(4)} · 휠 ${wheelCount}\n근접 볼륨 / 그림자 / 서고 연결은 다음 단계`;return;}if(frames%30===0)status.textContent=`${activePose} · ${renderer.domElement.width}×${renderer.domElement.height} · ${quality.value}\nGPU composer ${percentile(.5)?.toFixed(2)??'—'}ms / ${gpuTimes.length} samples · ${clouds.temporalUpscale?'4×4 업스케일':'전체 해상도 TAA'} · ${enabled.checked?'구름 ON':'구름 OFF'}\n${activePose.startsWith('north')?'동일 DEM 1.5× · 광학 정합 검토':'원본 Vanilla 광학 chain · 구름 관찰 카메라'}\n${inputSource} · p${Number(progress.value).toFixed(4)} → ${(wheelDriving?wheelTarget:Number(progress.value)).toFixed(4)} · 휠 ${wheelCount}`;
}
async function init(){
 const [lut,w,t,s,d,b]=await Promise.all([
  new PrecomputedTexturesLoader({format:'binary',type:THREE.HalfFloatType},manager).loadAsync('local-lut'),
  new THREE.TextureLoader().loadAsync(weatherUrl),new THREE.TextureLoader().loadAsync(turbulenceUrl),
  dataLoader(128).loadAsync(shapeUrl),dataLoader(32).loadAsync(detailUrl),new STBNLoader().loadAsync(stbnUrl)
 ]);
 Object.assign(aerial,lut);Object.assign(clouds,lut);
 clouds.localWeatherTexture=textureSetup(w);
 if(handoff){macroWeather=bakeHandoffWeather(renderer,clouds.localWeatherTexture!,northToECEF);clouds.localWeatherTexture=macroWeather.target.texture;}clouds.turbulenceTexture=textureSetup(t);
 clouds.shapeTexture=textureSetup(s,true) as THREE.Data3DTexture;clouds.shapeDetailTexture=textureSetup(d,true) as THREE.Data3DTexture;
 clouds.stbnTexture=aerial.stbnTexture=b;
 if(detailTrial)await orbitalEffect.loadRegion(new URL('../../../assets/research/orbital-cloud-20261009/global-2k.r8',import.meta.url).href,new URL('../../../assets/research/orbital-cloud-20261009/north-front-8k.r8',import.meta.url).href);
 else if(orbital)await orbitalEffect.load(new URL('../../../assets/research/cloud-reference-20261008/nasa-cloud-only-2048.jpg',import.meta.url).href);
 if(params.get('pose')?.startsWith('north')||orbital)await ensureNorth();
 // Geometry/light transform uses metre local coordinates; optical ECEF transform carries only rotation+translation.
 quality.value=params.get('quality')||'high';clouds.qualityPreset=quality.value as any;
 const requestedCluster=Number(params.get('cluster')||'1');cluster.value=String(Number.isFinite(requestedCluster)?THREE.MathUtils.clamp(requestedCluster,1,3):1);
 temporal.checked=params.get('upscale')==='1';clouds.temporalUpscale=temporal.checked;clouds.lightShafts=shafts.checked;aa.checked=true;smaaPass.enabled=true;cloudScale.value=params.get('scale')||'.75';clouds.resolutionScale=Number(cloudScale.value);
 ready=true;setPose(params.get('pose')||'basic300');if(params.get('recipe')==='curtain')applyRecipe('curtain');if(['baseline','shadowOff','margin','jitterOff','march','far','fast','noHistory','cloudFilter'].includes(params.get('diagnostic')||'')){diagnostic.value=params.get('diagnostic')!;applyDiagnostic();}if(orbital){
 setCloudEnabled();progress.value='.18';motionReview.hidden=motionVideo.hidden=diagnosticUI.hidden=true;
 dom('panel').querySelector('strong')!.textContent='궤도 구름 · 위성 분포 시험';
 for(const c of [pose,quality,temporal,wind,look,coverage,weatherRepeat,cloudScale,cluster,shafts,weatherX,weatherY,hazeFalloff,layerDepth,layerDensity,groundShadow])c.parentElement!.style.display='none';
 const note=dom('panel').querySelectorAll('small');note[note.length-1].textContent='NASA 2K 형태 seed · 고도/밀도는 연출 근사. 광역 → 지역 확대만 구현. 근접 결·그림자·하강 인계는 다음 단계.';
 captureSet.textContent=detailTrial?'두 구도 × 해상도 비교 저장':'두 구도 × 명암 비교 저장';
 if(detailTrial){motionVideo.hidden=false;motionVideo.textContent='8초 원경 정역 영상 저장';}
 if(detailTrial)note[note.length-1].textContent='8K 미러 자료 · 같은 원본의 2K 대조. 지역 R8 + mipmaps. 고도/밀도는 근사이며 근경 인계는 다음 단계.';
 }renderer.setAnimationLoop(draw);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
init().catch(e=>{error.textContent=String(e.stack||e);console.error(e);});
