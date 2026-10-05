// D-069 / REF-001 EFX-001-02 rim/orbit adaptation + approved Powers-of-Ten A sequence.
// NASA imagery/elevation. Height is artistically exaggerated, not GIS/physical-scale evidence.
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const smooth=(a:number,b:number,x:number)=>{const v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v);};
export async function createArrival(){
 const loader=new THREE.TextureLoader();
 const [day,height,night,cloud]=await Promise.all([
 loader.loadAsync(new URL('./assets/earth/day.webp',import.meta.url).href),loader.loadAsync(new URL('./assets/earth/height.webp',import.meta.url).href),
 loader.loadAsync(new URL('../../v2/src/story/intro/assets/earth_night.jpg',import.meta.url).href),loader.loadAsync(new URL('../../v2/src/story/intro/assets/earth_clouds.jpg',import.meta.url).href)]);
 day.colorSpace=night.colorSpace=THREE.SRGBColorSpace;
 [day,height,night,cloud].forEach(t=>{t.anisotropy=4;t.wrapS=THREE.RepeatWrapping;});
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x030609);
 const planet=new THREE.Group();scene.add(planet);
 const geo=new THREE.SphereGeometry(1,384,192);
 const mat=new THREE.MeshStandardMaterial({map:day,bumpMap:height,bumpScale:.045,displacementMap:height,displacementScale:.032,roughness:.78,metalness:.06});
 mat.onBeforeCompile=s=>{s.uniforms.tNight={value:night};s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tNight;');s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += texture2D(tNight,vMapUv).rgb * .18;');};
 const earth=new THREE.Mesh(geo,mat);planet.add(earth);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.044,192,96),new THREE.MeshStandardMaterial({color:0xdce9ee,alphaMap:cloud,transparent:true,opacity:.48,roughness:1,depthWrite:false,alphaTest:.035}));planet.add(clouds);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.078,128,64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
 uniforms:{uSun:{value:new THREE.Vector3(-2,1.8,3).normalize()}},vertexShader:`varying vec3 vN,vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vN,vP;uniform vec3 uSun;void main(){vec3 n=normalize(vN),v=normalize(cameraPosition-vP);float f=pow(max(0.,1.-abs(dot(n,v))),3.);float lit=smoothstep(-.45,.7,dot(n,uSun));gl_FragColor=vec4(mix(vec3(.1,.19,.38),vec3(.43,.68,.92),lit)*f*1.2,f*.5);}`}));planet.add(atmosphere);
 const sun=new THREE.DirectionalLight(0xc9ddff,3.3);sun.position.set(-2,1.8,3);scene.add(sun);scene.add(new THREE.AmbientLight(0x40516b,.12));
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
 float fbm(vec3 p){return noise(p)*.55+noise(p*2.07)*.28+noise(p*4.13)*.17;}
 void main(){vec3 bg=texture2D(tDiffuse,vUv).rgb;if(uCover<.001){gl_FragColor=vec4(bg,1.);return;}
 vec2 uv=(vUv-.5)*vec2(uAspect,1.);float scale=mix(1.4,3.8,uProgress);vec3 ro=vec3(uv*scale,uProgress*4.+uTime*.025);vec3 ray=normalize(vec3(uv*.28,1.));float trans=1.;vec3 total=vec3(0.);
 for(int i=0;i<24;i++){vec3 p=ro+ray*(float(i)*.13);float den=smoothstep(.28,.74,fbm(p));float lit=clamp(.7+(fbm(p+vec3(-.18,.24,-.1))-den)*1.2,.25,1.);
 float a=1.-exp(-den*uCover*.55);vec3 c=mix(vec3(.22,.29,.39),vec3(.78,.83,.87),lit);total+=trans*a*c;trans*=1.-a;}
 // The edit is fully opaque at the peak. No hidden architecture morph under a partial fade.
 float seal=smoothstep(.93,1.,uCover);vec3 col=total+bg*trans;col=mix(col,total/max(1.-trans,.001),seal);gl_FragColor=vec4(col,1.);}`});
 function cover(p:number){return smooth(.25,.315,p)*(1-smooth(.335,.40,p));}
 function update(p:number,t:number,reduced:boolean,camera:THREE.PerspectiveCamera){
  const q=smooth(.10,.285,p);planet.rotation.set(-.9+q*.9,-.5+q*.45+(reduced?0:t*.003),.14+q*.3);clouds.rotation.y=reduced?0:t*.006;
  camera.position.lerpVectors(new THREE.Vector3(0,-.2,2.75),new THREE.Vector3(.4,.5,1.53),q);
  const target=new THREE.Vector3(-.6,.45,0).lerp(new THREE.Vector3(.08,.44,.28),q);camera.lookAt(target);camera.fov=36-q*7;camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();
  sun.position.lerpVectors(new THREE.Vector3(-2,1.8,3),new THREE.Vector3(-1.8,2,-1.5),smooth(.06,.23,p));sun.intensity=3.3;
  markerMat.opacity=.75*(1-smooth(.2,.28,p));
  cloudPass.uniforms.uCover.value=cover(p);cloudPass.uniforms.uProgress.value=smooth(.24,.4,p);cloudPass.uniforms.uTime.value=reduced?0:t;
  return target;
 }
 return {scene,planet,cloudPass,cover,update,source:'NASA Earth Observatory',dispose(){geo.dispose();mat.dispose();clouds.geometry.dispose();(clouds.material as THREE.Material).dispose();atmosphere.geometry.dispose();(atmosphere.material as THREE.Material).dispose();starsGeo.dispose();(stars.material as THREE.Material).dispose();[day,height,night,cloud].forEach(x=>x.dispose());cloudPass.dispose();}};
}
