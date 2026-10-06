// D-069 / REF-001 EFX-001-02 rim/orbit adaptation + approved Powers-of-Ten A sequence.
// NASA imagery/elevation. Height is artistically exaggerated, not GIS/physical-scale evidence.
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {createPlanetAtmosphere} from './planet-atmosphere';
import {createAntarcticTerrain} from './planet-terrain';
import {createPlanetClouds} from './planet-cloud-layers';
import {createPlanetClouds as createSculptClouds} from './planet-cloud-sculpt';
import {createPlanetClouds as createPhotoClouds} from './planet-cloud-photo';
import {createPlanetClouds as createCloudsV1} from './planet-clouds-v1';
const smooth=(a:number,b:number,x:number)=>{const v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v);};
export async function createArrival(renderer:THREE.WebGLRenderer,camera:THREE.PerspectiveCamera){
 const loader=new THREE.TextureLoader();
 const [day,height,roughness,night,cloud]=await Promise.all([
 loader.loadAsync(new URL('./assets/earth/day.webp',import.meta.url).href),loader.loadAsync(new URL('./assets/earth/relief.webp',import.meta.url).href),loader.loadAsync(new URL('./assets/earth/roughness.webp',import.meta.url).href),
 loader.loadAsync(new URL('../../v2/src/story/intro/assets/earth_night.jpg',import.meta.url).href),loader.loadAsync(new URL('../../v2/src/story/intro/assets/earth_clouds.jpg',import.meta.url).href)]);
 day.colorSpace=night.colorSpace=THREE.SRGBColorSpace;
 [day,height,roughness,night,cloud].forEach(t=>{t.anisotropy=4;t.wrapS=THREE.RepeatWrapping;});
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x030609);
 const planet=new THREE.Group();scene.add(planet);
 const geo=new THREE.SphereGeometry(1,384,192);
 const sunDir={value:new THREE.Vector3(-2.6,2.2,3).normalize()},localSun={value:new THREE.Vector3()},shadowOn={value:1},specularOn={value:1};
 const mat=new THREE.MeshStandardMaterial({map:day,bumpMap:height,bumpScale:.004,displacementMap:height,displacementScale:.0003,roughness:1,roughnessMap:roughness,metalness:0});
 mat.onBeforeCompile=s=>{
  s.uniforms.tNight={value:night};s.uniforms.tCloud={value:cloud};s.uniforms.tRoughness={value:roughness};s.uniforms.uSunDir=sunDir;s.uniforms.uLocalSun=localSun;s.uniforms.uCloudShadow=shadowOn;s.uniforms.uSpecular=specularOn;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vEarthWorld;').replace('#include <project_vertex>','#include <project_vertex>\nvEarthWorld=normalize((modelMatrix*vec4(transformed,1.)).xyz);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEarthWorld;uniform sampler2D tNight,tCloud,tRoughness;uniform vec3 uSunDir,uLocalSun;uniform float uCloudShadow,uSpecular;');
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directSpecular*=uSpecular*.22;reflectedLight.indirectSpecular*=uSpecular*.22;');
  // Offset cloud opacity gives an artistic surface shadow, not physical cloud ray tracing.
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n if(vMapUv.y<1./6.)discard; float oceanMask=1.-smoothstep(.35,.65,texture2D(tRoughness,vMapUv).g);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.015,.055,.13),oceanMask*.8);float cloudShade=texture2D(tCloud,vMapUv+uLocalSun.xy*.006).g;diffuseColor.rgb*=1.-cloudShade*.3*uCloudShadow;');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += texture2D(tNight,vMapUv).rgb * .12*(1.-smoothstep(-.22,.12,dot(normalize(vEarthWorld),uSunDir)));');
 };
 const earth=new THREE.Mesh(geo,mat);planet.add(earth);
 const terrain=await createAntarcticTerrain(day,roughness,cloud,localSun,shadowOn,specularOn);planet.add(terrain.mesh);
 const photoTrial=new URLSearchParams(location.search).get('cloudModel')==='photo';const sculptTrial=photoTrial||new URLSearchParams(location.search).get('cloudModel')==='sculpt';const layersTrial=sculptTrial||new URLSearchParams(location.search).get('cloudModel')==='layers';const volume=photoTrial?await createPhotoClouds(cloud,terrain.heightTexture):sculptTrial?await createSculptClouds(cloud,terrain.heightTexture):layersTrial?await createPlanetClouds(cloud,terrain.heightTexture):await createCloudsV1(cloud);const cloudPass=volume.pass;
 if('attachGround' in volume){const baseCompile=mat.onBeforeCompile;mat.onBeforeCompile=(s,r)=>{baseCompile.call(mat,s,r);s.fragmentShader=s.fragmentShader.replace('diffuseColor.rgb*=1.-cloudShade*.3*uCloudShadow;','');};volume.attachGround(mat);const capMat=terrain.mesh.material as THREE.MeshStandardMaterial,capCompile=capMat.onBeforeCompile;capMat.onBeforeCompile=(s,r)=>{capCompile.call(capMat,s,r);s.fragmentShader=s.fragmentShader.replace(/diffuseColor.rgb\s*\*=\s*1\.-[^;]*uCloudShadow;/g,'');};volume.attachGround(capMat);}
 const atmos=await createPlanetAtmosphere(renderer,camera);scene.add(atmos.sky);
 const sun=new THREE.DirectionalLight(0xffebd0,5.6);sun.position.set(-2.6,2.2,3);scene.add(sun);scene.add(new THREE.AmbientLight(0x91bbff,.18));
 const starsGeo=new THREE.BufferGeometry(),pts=[];let seed=821;const random=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<600;i++)pts.push((random()-.5)*45,(random()-.5)*25,-15-random()*10);
 starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x536b84,size:.022,transparent:true,opacity:.42,sizeAttenuation:true,depthWrite:false}));scene.add(stars);
 const marker=new THREE.Group();const normal=new THREE.Vector3(.15,.4,.9).normalize();marker.position.copy(normal).multiplyScalar(1.0035);marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);planet.add(marker);
 const markerMat=new THREE.MeshBasicMaterial({color:0xffce9b,transparent:true,opacity:.8,depthWrite:false});marker.add(new THREE.Mesh(new THREE.RingGeometry(.012,.017,48),markerMat));const dot=new THREE.Mesh(new THREE.CircleGeometry(.003,24),markerMat);dot.position.z=.001;marker.add(dot);
 // Screen sun and restrained optical flare, masked by analytic Earth ray
 // intersection. Terrain radius is conservatively included in the occluder.
 const flarePass=new ShaderPass({uniforms:{tDiffuse:{value:null},uSunUV:{value:new THREE.Vector2()},uStrength:{value:0},uAspect:{value:1},uCam:{value:new THREE.Vector3()},uInvProj:{value:new THREE.Matrix4()},uCamWorld:{value:new THREE.Matrix4()}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform sampler2D tDiffuse;uniform vec2 uSunUV;uniform float uStrength,uAspect;uniform vec3 uCam;uniform mat4 uInvProj,uCamWorld;varying vec2 vUv;
 void main(){vec3 bg=texture2D(tDiffuse,vUv).rgb;if(uStrength<.001){gl_FragColor=vec4(bg,1.);return;}
 vec4 view=uInvProj*vec4(vUv*2.-1.,1.,1.);vec3 ray=normalize(mat3(uCamWorld)*(view.xyz/view.w));float b=dot(uCam,ray),c=dot(uCam,uCam)-1.008;float disc=b*b-c;
 float mask=1.-smoothstep(-.004,.004,disc)*step(b,0.);
 vec2 d=(vUv-uSunUV)*vec2(uAspect,1.);float r=length(d);
 float core=1.-smoothstep(.005,.011,r);float halo=exp(-r*38.)*.52+exp(-r*11.)*.022;
 float streak=exp(-abs(d.y)*650.)*exp(-abs(d.x)*11.)*.13;
 vec2 axis=.5-uSunUV;float ghost=0.;for(int i=1;i<=3;i++){vec2 g=(vUv-(uSunUV+axis*float(i)*.53))*vec2(uAspect,1.);float rad=.025+.012*float(i);ghost+=exp(-abs(length(g)-rad)*220.)*.008;}
 vec3 light=vec3(5.,2.5,.9)*(core+halo+streak)*mask+vec3(.5,.7,.9)*ghost;
 gl_FragColor=vec4(bg+light*uStrength,1.);}`});
 let flareOn=true,cloudOn=true;
 function cover(p:number){return cloudOn?smooth(.25,.315,p)*(1-smooth(.335,.40,p)):0;}
 let atmosphereOn=true;
 function setEffects(opts:{flare?:boolean;cloud?:boolean;cloudShadow?:boolean;atmosphere?:boolean;specular?:boolean;thick?:boolean;thin?:boolean}){if(opts.flare!==undefined)flareOn=opts.flare;if(opts.cloud!==undefined)cloudOn=opts.cloud;if(opts.cloudShadow!==undefined)shadowOn.value=opts.cloudShadow?1:0;if(opts.atmosphere!==undefined)atmosphereOn=opts.atmosphere;if(opts.specular!==undefined)specularOn.value=opts.specular?1:0;if('setEffects' in volume)volume.setEffects(opts);cloudPass.uniforms.uOn.value=cloudOn?1:0;cloudPass.uniforms.uLightShadow.value=shadowOn.value;}
 function update(p:number,t:number,reduced:boolean,camera:THREE.PerspectiveCamera){
  const q=smooth(.10,.245,p);planet.rotation.set(-1.15+q*1.15,-.5+q*.45+(reduced?0:t*.003),.14+q*.3);
  const radial=new THREE.Vector3(.3,.45,.842).normalize(),tangent=new THREE.Vector3(.82,.3,-.5).addScaledVector(radial,-new THREE.Vector3(.82,.3,-.5).dot(radial)).normalize();
  const alt=!layersTrial?THREE.MathUtils.lerp(.16,.0025,smooth(.23,.315,p)):p<.30?Math.exp(THREE.MathUtils.lerp(Math.log(.16),Math.log(.0012),smooth(.23,.30,p))):THREE.MathUtils.lerp(.0012,.00065,smooth(.30,.315,p));
  const end=radial.clone().multiplyScalar(1+alt),pitch=layersTrial?THREE.MathUtils.lerp(.65,.22,smooth(.23,.303,p)):THREE.MathUtils.lerp(.65,.13,smooth(.23,.315,p));
  camera.far=layersTrial?12:40;
  camera.position.lerpVectors(new THREE.Vector3(0,-.12,3.1),end,q);camera.near=layersTrial?THREE.MathUtils.clamp((camera.position.length()-1)*.01,.000003,.02):.025;
  // D-080: stay outside the bank for an establishing side view before entry.
  // The former origin was already inside its front half and hid scale/sky cues.
  if(photoTrial)camera.position.addScaledVector(tangent,-.0004*smooth(.265,.289,p)*(1-smooth(.306,.323,p)));
  const orbitLook=end.clone().addScaledVector(tangent,Math.cos(pitch)).addScaledVector(radial,-Math.sin(pitch));
  const target=new THREE.Vector3(-.4,.14,0).lerp(orbitLook,q);if(sculptTrial){const bankTarget=radial.clone().multiplyScalar(1.00072).addScaledVector(tangent,.0004);const ray=target.clone().sub(camera.position).normalize(),bankRay=bankTarget.sub(camera.position).normalize();target.copy(camera.position).add(ray.lerp(bankRay,smooth(.265,.292,p)).normalize());}camera.up.set(0,1,0).lerp(radial,smooth(.10,.245,p)).normalize();camera.lookAt(target);camera.fov=36+q*16;camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const solarWorld=new THREE.Vector3(-.95,.82,.35).lerp(new THREE.Vector3(-.65,.75,.52),smooth(.10,.24,p)).normalize();
  sun.position.copy(solarWorld).multiplyScalar(5);sunDir.value.copy(solarWorld).normalize();planet.updateMatrixWorld(true);localSun.value.copy(sunDir.value).applyQuaternion(planet.quaternion.clone().invert());atmos.setSun(sunDir.value);atmos.setEnabled(atmosphereOn);
  volume.update(camera,planet,sunDir.value);
  const solar=solarWorld.clone().multiplyScalar(3).project(camera);
  flarePass.uniforms.uSunUV.value.set(solar.x*.5+.5,solar.y*.5+.5);flarePass.uniforms.uCam.value.copy(camera.position);flarePass.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);flarePass.uniforms.uCamWorld.value.copy(camera.matrixWorld);flarePass.uniforms.uAspect.value=camera.aspect;
  flarePass.uniforms.uStrength.value=flareOn?(1-smooth(.23,.28,p))*.9:0;
  markerMat.opacity=.75*(1-smooth(.2,.28,p));
  cloudPass.uniforms.uCover.value=cover(p);cloudPass.uniforms.uProgress.value=smooth(.24,.4,p);cloudPass.uniforms.uTime.value=reduced?0:t;
  return target;
 }
 function prepareCover(p:number,t:number,reduced:boolean,camera:THREE.PerspectiveCamera){const roomCamera=camera.clone();cloudPass.uniforms.uProgress.value=smooth(.24,.4,.319);cloudPass.uniforms.uTime.value=reduced?0:t;update(.319,t,reduced,camera);camera.copy(roomCamera);camera.updateMatrixWorld();cloudPass.uniforms.uCover.value=cover(p);cloudPass.uniforms.uProgress.value=smooth(.24,.4,p);}
 return {scene,planet,cloudPass,flarePass,atmospherePass:atmos.pass,cover,update,prepareCover,setEffects,state:()=>({model:'Bruneton LUT + REMA + world density',cloudModel:'state' in volume?volume.state():{model:'v1'},cloudLayersTrial:layersTrial,cloudSculptTrial:sculptTrial,cloudPhotoTrial:photoTrial,terrain:terrain.info,specular:specularOn.value,atmosphere:atmosphereOn,flare:flareOn,cloud:cloudOn,cloudShadow:shadowOn.value,sunUV:flarePass.uniforms.uSunUV.value.toArray(),strength:flarePass.uniforms.uStrength.value,sunDirection:sunDir.value.toArray()}),source:'NASA Earth Observatory',dispose(){geo.dispose();mat.dispose();terrain.dispose();volume.dispose();atmos.dispose();starsGeo.dispose();(stars.material as THREE.Material).dispose();marker.children.forEach(o=>(o as THREE.Mesh).geometry.dispose());markerMat.dispose();[day,height,roughness,night,cloud].forEach(x=>x.dispose());cloudPass.dispose();flarePass.dispose();}};
}
