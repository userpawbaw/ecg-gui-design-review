// Backlit globe — REF-001 EFX-001-02 reproduced from its recorded parameters (not its code or textures):
// sphere + BackSide atmosphere shell ×1.04, fixed back-top sun (0.26, 1.39, −3), night side facing the camera,
// fresnel rim masked by sun orientation and a top "reach". Textures: NASA Blue/Black Marble + clouds (public domain).
// v2 (2026-10-09, user review of I-1): January Blue Marble (snowy north = bright polar band), GEBCO elevation for the relief,
// Black Marble 2016 8k lights with a saturating curve, fewer clouds and none lit on the night face, sun raised to widen the
// lit band; built by scripts/assets/build-globe-textures.py.
// G2: the rim breathes ±5 % with the same R-peak clock as the heart (decorative timing of the stored record).
import * as THREE from 'three';

const SUN=new THREE.Vector3(.26,1.85,-2.75).normalize();   // 2026-10-09: higher than REF's (.26,1.39,−3) so the lit polar band is as wide as in REF-001's frame
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

export function createGlobe(tex:{day:THREE.Texture,night:THREE.Texture,clouds:THREE.Texture,height:THREE.Texture}){
 const uniforms={uSun:{value:SUN.clone()},uOpacity:{value:1},uPulse:{value:0},uReach:{value:.635},
  uDay:{value:new THREE.Color('#a3afbd')},uTwilight:{value:new THREE.Color('#47649e')},
  tDay:{value:tex.day},tNight:{value:tex.night},tClouds:{value:tex.clouds},tHeight:{value:tex.height},uCloudShift:{value:0},
  uBump:{value:9},uCloudH:{value:.35},uCloudLo:{value:.42},uCloudAmt:{value:.8},uCloudShadow:{value:.55},uRimEdge:{value:5},
  uRelief:{value:5},uCapPow:{value:1.6},uCapGain:{value:1.7},uDayGain:{value:3.2},uCity:{value:1.05},uCityK:{value:6},uCityTint:{value:new THREE.Color(1.,.80,.52)},uNightSea:{value:new THREE.Color(.010,.016,.036)}};
 const surface=new THREE.ShaderMaterial({uniforms,vertexShader:vert,transparent:true,fragmentShader:/* glsl */`
  ${common}
  uniform sampler2D tDay,tNight,tClouds,tHeight;
  uniform float uCloudShift,uBump,uCloudH,uCloudLo,uCloudAmt,uCloudShadow,uRimEdge,uRelief,uCapPow,uCapGain,uDayGain,uCity,uCityK;uniform vec3 uNightSea,uCityTint;
  // fewer, denser clouds than the raw NASA composite (user 2026-10-09: "구름이 너무 많은 느낌")
  float cloudAt(vec2 uv){return uCloudAmt*smoothstep(uCloudLo,.95,texture2D(tClouds,uv+vec2(uCloudShift,0.)).r);}
  // relief height: GEBCO land/ice-sheet elevation (Greenland, Antarctica, ranges) + cloud tops. v1 used clouds + day
  // brightness only, which left the polar cap flat (user 2026-10-09: "극지방의 요철은 거의 보이지 않아")
  float hAt(vec2 uv){return texture2D(tHeight,uv).r+uCloudH*cloudAt(uv);}
  void main(){
   vec3 n0=normalize(vN),v=normalize(cameraPosition-vW);
   vec3 E=normalize(vE-dot(vE,n0)*n0),Nn=cross(n0,E);
   vec2 px=vec2(2./4096.,2./2048.);
   float h0=hAt(vUv),hu=hAt(vUv+vec2(px.x,0.))-h0,hv=hAt(vUv+vec2(0.,px.y))-h0;
   vec3 n=normalize(n0-uBump*(hu*E+hv*Nn));
   float fres=1.-abs(dot(v,n0)),sunOri=dot(n0,uSun);
   vec3 day=texture2D(tDay,vUv).rgb;
   float cl=cloudAt(vUv);
   vec3 sT=uSun-dot(uSun,n0)*n0;vec2 sUv=vec2(dot(sT,E),dot(sT,Nn))*.012;
   float shade=1.-uCloudShadow*cloudAt(vUv+sUv)*(1.-cl);
   vec3 surf=mix(day*shade,vec3(.93),cl);
   // lit day side: Lambert on the bumped normal, soft terminator, ocean glint (roughness ~.3)
   float lam=max(dot(n,uSun),0.)*smoothstep(-.12,.25,sunOri);
   float ocean=smoothstep(.02,.12,day.b-day.r)*(1.-cl);
   vec3 hv3=normalize(uSun+v);float spec=pow(max(dot(n,hv3),0.),80.)*ocean*1.2;
   vec3 lit=surf*lam*uDayGain+vec3(spec)*lam;
   // night side: Black Marble 2016 lights only (land already black in the texture). A saturating curve lifts faint towns
   // and caps the cities, so Europe reads as many similar points (REF-001) instead of a few blooming blobs; clouds only dim
   // the lights (no moonlit cloud streaks on the dark face); a deep navy sea instead of black
   float L=dot(texture2D(tNight,vUv).rgb,vec3(.4,.4,.2));
   vec3 city=uCity*(1.-exp(-L*uCityK))*mix(uCityTint,vec3(1.),smoothstep(.25,.9,L))*(1.-cl*.85);   // warm towns, whiter cores
   vec3 col=(city+uNightSea*(.6+.4*fres))*(1.-smoothstep(-.2,.15,sunOri))+lit;
   // backlit limb: thin scatter that lights the surface texture (relief-shaded), confined near the day side
   float cap=smoothstep(-.3,.6,sunOri)*pow(fres,uCapPow)*reachMask(n0)*(1.+uPulse);
   float rf=clamp(1.+uRelief*dot(n-n0,uSun),.25,2.2);
   col+=atmoColor(sunOri)*cap*(surf*1.6+.05)*rf*uCapGain;
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
