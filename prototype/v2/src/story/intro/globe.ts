// Backlit globe — REF-001 EFX-001-02 reproduced from its recorded parameters (not its code or textures):
// sphere + BackSide atmosphere shell ×1.04, fixed back-top sun (0.26, 1.39, −3), night side facing the camera,
// fresnel rim masked by sun orientation and a top "reach". Textures: NASA Blue/Black Marble + clouds (public domain).
// G2: the rim breathes ±5 % with the same R-peak clock as the heart (decorative timing of the stored record).
import * as THREE from 'three';

const SUN=new THREE.Vector3(.26,1.39,-3).normalize();
const common=/* glsl */`
uniform vec3 uSun;uniform float uOpacity,uPulse,uReach;
uniform vec3 uDay,uTwilight;
varying vec3 vN,vW;varying vec2 vUv;
vec3 atmoColor(float sunOri){return mix(uTwilight,uDay,smoothstep(-.25,.75,sunOri));}
float reachMask(vec3 n){return smoothstep(uReach-1.,1.,n.y*.8+dot(n,uSun)*.45);}
`;
const vert=/* glsl */`
varying vec3 vN,vW;varying vec2 vUv;
void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;

export function createGlobe(tex:{day:THREE.Texture,night:THREE.Texture,clouds:THREE.Texture}){
 const uniforms={uSun:{value:SUN.clone()},uOpacity:{value:1},uPulse:{value:0},uReach:{value:.635},
  uDay:{value:new THREE.Color('#a3afbd')},uTwilight:{value:new THREE.Color('#47649e')},
  tDay:{value:tex.day},tNight:{value:tex.night},tClouds:{value:tex.clouds},uCloudShift:{value:0}};
 const surface=new THREE.ShaderMaterial({uniforms,vertexShader:vert,transparent:true,fragmentShader:/* glsl */`
  ${common}
  uniform sampler2D tDay,tNight,tClouds;uniform float uCloudShift;
  void main(){
   vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
   float fres=1.-abs(dot(v,n)),sunOri=dot(n,uSun);
   vec3 day=texture2D(tDay,vUv).rgb;
   float cl=texture2D(tClouds,vUv+vec2(uCloudShift,0.)).r;
   day=mix(day,vec3(.92),smoothstep(.15,.85,cl)*.85);
   // lit day side (Lambert + a tight ocean glint near the terminator), roughness ≈ .3
   float lam=max(sunOri,0.);
   float ocean=smoothstep(.02,.12,day.b-day.r)*(1.-cl);
   vec3 h=normalize(uSun+v);float spec=pow(max(dot(n,h),0.),80.)*ocean*1.4;
   vec3 lit=day*lam*2.6+vec3(spec);
   // night side: city lights (Black Marble), slightly lifted so the dark face still reads as a sphere
   vec3 night=texture2D(tNight,vUv).rgb;night=pow(night,vec3(2.4))*1.25*(1.-cl*.8)+vec3(.002,.003,.006);
   vec3 col=mix(night*.95,lit,smoothstep(-.25,.5,sunOri));
   float rim=smoothstep(-.5,1.,sunOri)*fres*fres*reachMask(n)*(1.+uPulse);
   col+=atmoColor(sunOri)*rim*2.2;
   gl_FragColor=vec4(col,uOpacity);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const atmo=new THREE.ShaderMaterial({uniforms,vertexShader:vert,transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,fragmentShader:/* glsl */`
  ${common}
  void main(){
   vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
   float fres=1.-abs(dot(v,n)),sunOri=dot(n,uSun);             // n = outward normal (BackSide keeps it)
   float a=pow(clamp((1.-fres)/(1.-.73),0.,1.),3.);                // REF: remap(fresnel, .73→1, 1→0)³
   a*=smoothstep(-.35,.6,sunOri)*reachMask(n)*uOpacity*(1.+uPulse*1.5);
   gl_FragColor=vec4(atmoColor(sunOri)*a*1.6,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const geo=new THREE.SphereGeometry(1,96,96);
 const group=new THREE.Group(),spin=new THREE.Group();
 const globe=new THREE.Mesh(geo,surface),shell=new THREE.Mesh(geo,atmo);shell.scale.setScalar(1.04);
 spin.add(globe);group.add(spin,shell);globe.renderOrder=0;shell.renderOrder=1;spin.rotation.z=.18;   // slight axial tilt so rotation reads as a planet
 group.position.set(0,-1.32,0);group.scale.setScalar(1.3);
 return{group,spin,uniforms,dispose(){geo.dispose();surface.dispose();atmo.dispose();}};
}
export type Globe=ReturnType<typeof createGlobe>;
