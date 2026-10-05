// D-069 / REF-001 EFX-001-02 rim/orbit adaptation + approved Powers-of-Ten A sequence.
// NASA imagery/elevation. Height is artistically exaggerated, not GIS/physical-scale evidence.
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const smooth=(a:number,b:number,x:number)=>{const v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v);};
export async function createArrival(){
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
 const mat=new THREE.MeshStandardMaterial({map:day,bumpMap:height,bumpScale:.025,displacementMap:height,displacementScale:.042,roughness:1,roughnessMap:roughness,metalness:0});
 mat.onBeforeCompile=s=>{
  s.uniforms.tNight={value:night};s.uniforms.tCloud={value:cloud};s.uniforms.tRoughness={value:roughness};s.uniforms.uSunDir=sunDir;s.uniforms.uLocalSun=localSun;s.uniforms.uCloudShadow=shadowOn;s.uniforms.uSpecular=specularOn;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vEarthWorld;').replace('#include <project_vertex>','#include <project_vertex>\nvEarthWorld=normalize((modelMatrix*vec4(transformed,1.)).xyz);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEarthWorld;uniform sampler2D tNight,tCloud,tRoughness;uniform vec3 uSunDir,uLocalSun;uniform float uCloudShadow,uSpecular;');
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directSpecular*=uSpecular;reflectedLight.indirectSpecular*=uSpecular;');
  // Offset cloud opacity gives an artistic surface shadow, not physical cloud ray tracing.
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float oceanMask=1.-smoothstep(.35,.65,texture2D(tRoughness,vMapUv).g);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.015,.055,.13),oceanMask*.8);float cloudShade=texture2D(tCloud,vMapUv+uLocalSun.xy*.006).g;diffuseColor.rgb*=1.-cloudShade*.3*uCloudShadow;');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += texture2D(tNight,vMapUv).rgb * .12*(1.-smoothstep(-.22,.12,dot(normalize(vEarthWorld),uSunDir)));');
 };
 const earth=new THREE.Mesh(geo,mat);planet.add(earth);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.056,192,96),new THREE.MeshStandardMaterial({color:0xe8efff,alphaMap:cloud,bumpMap:cloud,bumpScale:.0015,transparent:true,opacity:.14,roughness:1,depthWrite:false}));planet.add(clouds);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.078,128,64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
 uniforms:{uSun:{value:new THREE.Vector3(-2,1.8,3).normalize()}},vertexShader:`varying vec3 vN,vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vN,vP;uniform vec3 uSun;void main(){vec3 n=normalize(vN),v=normalize(cameraPosition-vP);float f=pow(max(0.,1.-abs(dot(n,v))),5.);float lit=smoothstep(.2,.85,dot(n,uSun));gl_FragColor=vec4(mix(vec3(.13,.36,.88),vec3(1.4,.83,.35),lit)*f*.9,f*.45);}`}));planet.add(atmosphere);
 const sun=new THREE.DirectionalLight(0xffebd0,5.6);sun.position.set(-2.6,2.2,3);scene.add(sun);scene.add(new THREE.AmbientLight(0x91bbff,.18));
 const starsGeo=new THREE.BufferGeometry(),pts=[];let seed=821;const random=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<600;i++)pts.push((random()-.5)*45,(random()-.5)*25,-15-random()*10);
 starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x536b84,size:.022,transparent:true,opacity:.42,sizeAttenuation:true,depthWrite:false}));scene.add(stars);
 const marker=new THREE.Group();const normal=new THREE.Vector3(.15,.4,.9).normalize();marker.position.copy(normal).multiplyScalar(1.045);marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);planet.add(marker);
 const markerMat=new THREE.MeshBasicMaterial({color:0xffce9b,transparent:true,opacity:.8,depthWrite:false});marker.add(new THREE.Mesh(new THREE.RingGeometry(.012,.017,48),markerMat));const dot=new THREE.Mesh(new THREE.CircleGeometry(.003,24),markerMat);dot.position.z=.001;marker.add(dot);
 // Procedural cloud field is an artistic occlusion edit, not weather data.
 const cloudPass=new ShaderPass({uniforms:{tDiffuse:{value:null},uCover:{value:0},uTime:{value:0},uProgress:{value:0},uAspect:{value:1}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform sampler2D tDiffuse;uniform float uCover,uTime,uProgress,uAspect;varying vec2 vUv;
 float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);}
 float fbm(vec3 p){return noise(p)*.5+noise(p*2.07)*.27+noise(p*4.13)*.15+noise(p*8.31)*.08;}
 void main(){vec3 bg=texture2D(tDiffuse,vUv).rgb;if(uCover<.001){gl_FragColor=vec4(bg,1.);return;}
 vec2 uv=(vUv-.5)*vec2(uAspect,1.);float scale=mix(2.8,4.8,uProgress);vec3 ro=vec3(uv*scale,uProgress*4.+uTime*.025);vec3 ray=normalize(vec3(uv*.28,1.));float trans=1.;vec3 total=vec3(0.);vec3 lightDir=normalize(vec3(-.8,1.,-.5));
 for(int i=0;i<40;i++){vec3 p=ro+ray*(float(i)*.085);float den=smoothstep(.38,.7,fbm(p));
 float shadow=fbm(p+lightDir*.3)*.65+fbm(p+lightDir*.65)*.35;float lit=exp(-max(0.,shadow-.3)*7.);
 float edge=clamp((den-smoothstep(.38,.7,fbm(p+lightDir*.14)))*3.,0.,1.);
 float a=1.-exp(-den*uCover*.42);vec3 c=mix(vec3(.035,.065,.10),vec3(1.35,.87,.46),lit)+vec3(.48,.29,.12)*edge;
 total+=trans*a*c;trans*=1.-a;}
 // The edit is fully opaque at the peak. No hidden architecture morph under a partial fade.
 float seal=smoothstep(.93,1.,uCover);vec3 col=total+bg*trans;col=mix(col,total/max(1.-trans,.001),seal);gl_FragColor=vec4(col,1.);}`});
 // Screen sun and restrained optical flare, masked by analytic Earth ray
 // intersection. Terrain radius is conservatively included in the occluder.
 const flarePass=new ShaderPass({uniforms:{tDiffuse:{value:null},uSunUV:{value:new THREE.Vector2()},uStrength:{value:0},uAspect:{value:1},uCam:{value:new THREE.Vector3()},uInvProj:{value:new THREE.Matrix4()},uCamWorld:{value:new THREE.Matrix4()}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform sampler2D tDiffuse;uniform vec2 uSunUV;uniform float uStrength,uAspect;uniform vec3 uCam;uniform mat4 uInvProj,uCamWorld;varying vec2 vUv;
 void main(){vec3 bg=texture2D(tDiffuse,vUv).rgb;if(uStrength<.001){gl_FragColor=vec4(bg,1.);return;}
 vec4 view=uInvProj*vec4(vUv*2.-1.,1.,1.);vec3 ray=normalize(mat3(uCamWorld)*(view.xyz/view.w));float b=dot(uCam,ray),c=dot(uCam,uCam)-1.086;float disc=b*b-c;
 float mask=1.-smoothstep(-.004,.004,disc)*step(b,0.);
 vec2 d=(vUv-uSunUV)*vec2(uAspect,1.);float r=length(d);
 float core=1.-smoothstep(.005,.011,r);float halo=exp(-r*38.)*.52+exp(-r*11.)*.022;
 float streak=exp(-abs(d.y)*650.)*exp(-abs(d.x)*11.)*.13;
 vec2 axis=.5-uSunUV;float ghost=0.;for(int i=1;i<=3;i++){vec2 g=(vUv-(uSunUV+axis*float(i)*.53))*vec2(uAspect,1.);float rad=.025+.012*float(i);ghost+=exp(-abs(length(g)-rad)*220.)*.008;}
 vec3 light=vec3(5.,2.5,.9)*(core+halo+streak)*mask+vec3(.5,.7,.9)*ghost;
 gl_FragColor=vec4(bg+light*uStrength,1.);}`});
 let flareOn=true,cloudOn=true;
 function cover(p:number){return cloudOn?smooth(.25,.315,p)*(1-smooth(.335,.40,p)):0;}
 function setEffects(opts:{flare?:boolean;cloud?:boolean;cloudShadow?:boolean;atmosphere?:boolean;specular?:boolean}){if(opts.flare!==undefined)flareOn=opts.flare;if(opts.cloud!==undefined)cloudOn=opts.cloud;if(opts.cloudShadow!==undefined)shadowOn.value=opts.cloudShadow?1:0;clouds.visible=cloudOn;if(opts.atmosphere!==undefined)atmosphere.visible=opts.atmosphere;if(opts.specular!==undefined)specularOn.value=opts.specular?1:0;}
 function update(p:number,t:number,reduced:boolean,camera:THREE.PerspectiveCamera){
  const q=smooth(.10,.285,p);planet.rotation.set(-1.15+q*1.15,-.5+q*.45+(reduced?0:t*.003),.14+q*.3);clouds.rotation.y=reduced?0:t*.006;
  camera.position.lerpVectors(new THREE.Vector3(0,-.12,3.1),new THREE.Vector3(.4,.5,1.53),q);
  const target=new THREE.Vector3(-.4,.14,0).lerp(new THREE.Vector3(.08,.44,.28),q);camera.lookAt(target);camera.fov=36-q*7;camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),front=camera.position.clone().normalize();
  const solarWorld=right.multiplyScalar(-.95).addScaledVector(up,.83).addScaledVector(front,THREE.MathUtils.lerp(.4,-.4,smooth(.06,.23,p)));
  sun.position.copy(solarWorld).multiplyScalar(5);sunDir.value.copy(solarWorld).normalize();planet.updateMatrixWorld(true);localSun.value.copy(sunDir.value).applyQuaternion(planet.quaternion.clone().invert());(atmosphere.material as THREE.ShaderMaterial).uniforms.uSun.value.copy(sunDir.value);
  const solar=solarWorld.clone().project(camera);
  flarePass.uniforms.uSunUV.value.set(solar.x*.5+.5,solar.y*.5+.5);flarePass.uniforms.uCam.value.copy(camera.position);flarePass.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);flarePass.uniforms.uCamWorld.value.copy(camera.matrixWorld);flarePass.uniforms.uAspect.value=camera.aspect;
  flarePass.uniforms.uStrength.value=flareOn?(1-smooth(.23,.28,p))*.9:0;
  markerMat.opacity=.75*(1-smooth(.2,.28,p));
  cloudPass.uniforms.uCover.value=cover(p);cloudPass.uniforms.uProgress.value=smooth(.24,.4,p);cloudPass.uniforms.uTime.value=reduced?0:t;
  return target;
 }
 return {scene,planet,cloudPass,flarePass,cover,update,setEffects,state:()=>({flare:flareOn,cloud:cloudOn,cloudShadow:shadowOn.value,sunUV:flarePass.uniforms.uSunUV.value.toArray(),strength:flarePass.uniforms.uStrength.value,sunDirection:sunDir.value.toArray()}),source:'NASA Earth Observatory',dispose(){geo.dispose();mat.dispose();clouds.geometry.dispose();(clouds.material as THREE.Material).dispose();atmosphere.geometry.dispose();(atmosphere.material as THREE.Material).dispose();starsGeo.dispose();(stars.material as THREE.Material).dispose();marker.children.forEach(o=>(o as THREE.Mesh).geometry.dispose());markerMat.dispose();[day,height,roughness,night,cloud].forEach(x=>x.dispose());cloudPass.dispose();flarePass.dispose();}};
}
