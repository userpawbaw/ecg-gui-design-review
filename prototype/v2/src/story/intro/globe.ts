// Backlit globe — REF-001 EFX-001-02 reproduced from its recorded parameters (not its code or textures):
// sphere + BackSide atmosphere shell ×1.04, fixed back-top sun (0.26, 1.39, −3), night side facing the camera,
// fresnel rim masked by sun orientation and a top "reach". Textures: NASA Blue/Black Marble + clouds (public domain).
// G2: the rim breathes ±5 % with the same R-peak clock as the heart (decorative timing of the stored record).
import * as THREE from 'three';

const SUN=new THREE.Vector3(.26,1.39,-3).normalize();
const common=/* glsl */`
uniform vec3 uSun;uniform float uOpacity,uPulse,uReach;
uniform vec3 uDay,uTwilight;
varying vec3 vN,vW,vE,vNo;varying vec2 vUv;
vec3 atmoColor(float sunOri){return mix(uTwilight,uDay,smoothstep(-.25,.75,sunOri));}
float reachMask(vec3 n){return smoothstep(uReach-1.,1.,n.y*.8+dot(n,uSun)*.45);}
`;
const vert=/* glsl */`
varying vec3 vN,vW,vE,vNo;varying vec2 vUv;
void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);
 // east tangent of the lat/long sphere (u runs east), for the relief bump
 vE=normalize(mat3(modelMatrix)*normalize(vec3(normal.z,0.,-normal.x)+vec3(1e-5,0.,0.)));vNo=normal;
 gl_Position=projectionMatrix*viewMatrix*w;}`;

export function createGlobe(tex:{day:THREE.Texture,night:THREE.Texture,clouds:THREE.Texture}){
 const uniforms={uSun:{value:SUN.clone()},uOpacity:{value:1},uPulse:{value:0},uReach:{value:.635},
  uDay:{value:new THREE.Color('#a3afbd')},uTwilight:{value:new THREE.Color('#47649e')},
  tDay:{value:tex.day},tNight:{value:tex.night},tClouds:{value:tex.clouds},uCloudShift:{value:0},
  uBump:{value:6},uCloudShadow:{value:.5},uRimEdge:{value:4},uRelief:{value:4.5},uCapPow:{value:1.1},uCapGain:{value:2.8}};
 const surface=new THREE.ShaderMaterial({uniforms,vertexShader:vert,transparent:true,fragmentShader:/* glsl */`
  ${common}
  uniform sampler2D tDay,tNight,tClouds;uniform float uCloudShift,uBump,uCloudShadow,uRimEdge,uRelief,uCapPow,uCapGain;
  // I-1 (REVIEW-R1-WEB-20261008): relief under the backlit pole. Height = clouds (tops bulge) + land/ice brightness; its
  // gradient bends the normal, so the grazing back-top sun shades every ridge and cloud edge as in REF-001's polar cap
  float hAt(vec2 uv){vec3 d=texture2D(tDay,uv).rgb;float c=texture2D(tClouds,uv+vec2(uCloudShift,0.)).r;
   return .75*smoothstep(.1,.9,c)+.25*smoothstep(.15,.7,dot(d,vec3(.3,.5,.2)));}
  void main(){
   vec3 n0=normalize(vN),v=normalize(cameraPosition-vW);
   vec3 E=normalize(vE-dot(vE,n0)*n0),Nn=cross(n0,E);
   vec2 px=vec2(3./2048.,3./1024.);   // ~3 texels: relief, not texel noise
   float h0=hAt(vUv),hu=hAt(vUv+vec2(px.x,0.))-h0,hv=hAt(vUv+vec2(0.,px.y))-h0;
   vec3 n=normalize(n0-uBump*(hu*E+hv*Nn));
   float fres=1.-abs(dot(v,n0)),sunOri=dot(n0,uSun);
   vec3 day=texture2D(tDay,vUv).rgb;
   float cl=texture2D(tClouds,vUv+vec2(uCloudShift,0.)).r;
   // cloud shadow: the cloud a little toward the sun along the surface darkens the ground under it
   vec3 sT=uSun-dot(uSun,n0)*n0;vec2 sUv=vec2(dot(sT,E),dot(sT,Nn))*.012;
   float shade=1.-uCloudShadow*smoothstep(.2,.8,texture2D(tClouds,vUv+sUv+vec2(uCloudShift,0.)).r)*(1.-smoothstep(.15,.85,cl));
   day=mix(day*shade,vec3(.92),smoothstep(.15,.85,cl)*.85);
   // lit day side (Lambert on the bumped normal + a tight ocean glint near the terminator), roughness ≈ .3
   float lam=max(dot(n,uSun),0.)*smoothstep(-.15,.2,sunOri);
   float ocean=smoothstep(.02,.12,day.b-day.r)*(1.-cl);
   vec3 h=normalize(uSun+v);float spec=pow(max(dot(n,h),0.),80.)*ocean*1.4;
   vec3 lit=day*lam*2.6+vec3(spec);
   // night side: city lights (Black Marble), slightly lifted so the dark face still reads as a sphere
   vec3 night=texture2D(tNight,vUv).rgb;night=pow(night,vec3(2.4))*1.25*(1.-cl*.8)+vec3(.002,.003,.006);
   vec3 col=mix(night*.95,lit,smoothstep(-.25,.5,sunOri));
   // backlit cap: the light that used to be a flat added glow (fres², it washed the cap white) now lights the surface
   // texture, shaded by the relief (slopes facing the sun brighter, away darker) — REF-001's polar cap shows its ice,
   // coasts and cloud edges inside the bright limb; a thin edge glow stays on top
   float cap=smoothstep(-.5,1.,sunOri)*pow(fres,uCapPow)*reachMask(n0)*(1.+uPulse);
   float rf=clamp(1.+uRelief*dot(n-n0,uSun),.25,2.2);
   col+=atmoColor(sunOri)*cap*(day*1.9+.06)*rf*uCapGain;
   float rim=smoothstep(-.5,1.,sunOri)*pow(fres,uRimEdge)*reachMask(n0)*(1.+uPulse);
   col+=atmoColor(sunOri)*rim*1.6;
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
