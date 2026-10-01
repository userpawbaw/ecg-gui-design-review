// Person outline + heart (IDEA-R1-INTRO M2, H3, H2). Blender Studio human base mesh (CC0, featureless egg head) and the
// HRA reference heart (CC BY 4.0, Visible Human Male data, NLM), built in scripts/assets/build-intro-figure.py (P1, O-007).
// Both render as light only (rim or contour rings), so the heart is visible through the body. The morph line carries the globe rim into the body outline.
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

export type FigureData={height:number,heart:[number,number,number],silhouette:[number,number][]};
export const FEET_Y=-.633;   // body stands centred on the camera axis height (0.2) at z = 0

const rimVert=/* glsl */`
uniform float uA,uV,uMinY,uMaxY;uniform float uDeform;
varying vec3 vN,vW;varying float vH;
void main(){
 vec3 p=position;
 float h=clamp((p.y-uMinY)/(uMaxY-uMinY),0.,1.);vH=h;
 if(uDeform>0.){
  // H3 two-stage squeeze: atria (upper) lightly before R, ventricles (lower) strongly from R. Decorative timing.
  float wv=1.-smoothstep(.42,.66,h),wa=smoothstep(.46,.62,h)*(1.-smoothstep(.8,.95,h));
  float k=wv*uV*.11+wa*uA*.07;
  p.xz*=1.-k;
  float base=uMinY+.62*(uMaxY-uMinY);p.y=mix(p.y,base,wv*uV*.07);
 }
 vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;
}`;
const rimFrag=/* glsl */`
uniform vec3 uColor;uniform float uOpacity,uPow,uFill,uFlash,uMirror,uFeet;
uniform vec3 uHeart;uniform float uWaveT,uWaveAmp;
varying vec3 vN,vW;varying float vH;
void main(){
 vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
 float fres=pow(1.-abs(dot(n,v)),uPow);
 float back=.6+.4*smoothstep(-.3,.9,n.y);                  // backlight from above-behind: top edges brighter
 float rim=fres*back;
 // H2: conduction wave — a thin bright band leaves the heart at each R and fades as it travels
 float d=distance(vW,uHeart),front=uWaveT*1.5;
 float band=exp(-pow((d-front)/.045,2.))*exp(-uWaveT/.32)*uWaveAmp;
 float mf=uMirror>.5?.22*exp(-(uFeet-vW.y)/.32):1.;
 float a=(rim*(1.+uFlash)+uFill+band*(.35+fres))*uOpacity*mf;
 gl_FragColor=vec4(uColor*a,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

// H3 (IDEA-R1-INTRO §7.6, D-045): cross-section contour body — horizontal light rings at constant world height,
// brighter towards the silhouette, back faces dimmer (volume), revealed top-down by a scan line. No skin, no face.
const contourFrag=/* glsl */`
uniform vec3 uColor,uWarm;uniform float uOpacity,uFlash,uFeet,uDensity,uScan,uScanOn,uMirror;
uniform vec3 uHeart;uniform float uWaveT,uWaveAmp;
varying vec3 vN,vW;varying float vH;
void main(){
 vec3 n=normalize(vN),v=normalize(cameraPosition-vW);
 float fres=1.-abs(dot(n,v));
 // P2 floor reflection: the mirrored copy samples the pattern at the reflected point and fades with depth
 vec3 P=uMirror>.5?vec3(vW.x,2.*uFeet-vW.y,vW.z):vW;
 float mf=uMirror>.5?.22*exp(-(uFeet-vW.y)/.32):1.;
 float y=P.y-uFeet,d=y*uDensity,fw=max(fwidth(d),1e-4);
 float dist=min(fract(d),1.-fract(d));
 float ring=1.-smoothstep(.5*fw,1.6*fw,dist);
 ring*=.2+.7*fres*fres;
 float face=gl_FrontFacing?1.:.3;
 float rim=pow(fres,4.)*.1;                              // faint silhouette so gaps between rings still read as a body
 float reveal=smoothstep(uScan-.004,uScan+.012,y);        // visible above the scan line (top-down)
 float scanLine=exp(-pow((y-uScan)/.012,2.))*uScanOn*(.6+fres);
 float dh=distance(P,uHeart),front=uWaveT*1.5;
 float band=exp(-pow((dh-front)/.05,2.))*exp(-uWaveT/.32)*uWaveAmp;
 vec3 col=mix(uColor,uWarm,smoothstep(-.1,.9,n.y)*.55+(1.-reveal)*0.);   // warm backlight catches upward-facing rings
 // heart light: rings around the heart take its colour and brighten on each R (heart reads at full-body distance)
 float hl=exp(-dh*dh/.03);
 col=mix(col,vec3(1.,.36,.42),min(1.,hl*1.2));
 float a=(((ring*face*(1.+hl*(.8+2.2*uFlash))+rim)*(1.+uFlash*.4)+band*(.5+ring*2.))*reveal*uOpacity+scanLine*uOpacity)*mf;
 gl_FragColor=vec4(col*a,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function contourMaterial(){
 return new THREE.ShaderMaterial({vertexShader:rimVert,fragmentShader:contourFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  uniforms:{uColor:{value:new THREE.Color('#b9d6ff')},uWarm:{value:new THREE.Color('#ffc58f')},uOpacity:{value:0},uFlash:{value:0},uFeet:{value:FEET_Y},
   uDensity:{value:42},uScan:{value:2},uScanOn:{value:0},uMirror:{value:0},uHeart:{value:new THREE.Vector3()},uWaveT:{value:9},uWaveAmp:{value:0},
   uA:{value:0},uV:{value:0},uMinY:{value:-1},uMaxY:{value:1},uDeform:{value:0}}});
}

function rimMaterial(color:string,pow:number,fill:number,deform:boolean){
 return new THREE.ShaderMaterial({vertexShader:rimVert,fragmentShader:rimFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:0},uPow:{value:pow},uFill:{value:fill},uFlash:{value:0},
   uHeart:{value:new THREE.Vector3()},uWaveT:{value:9},uWaveAmp:{value:0},uA:{value:0},uV:{value:0},uMinY:{value:-1},uMaxY:{value:1},uDeform:{value:deform?1:0},uMirror:{value:0},uFeet:{value:FEET_Y}}});
}

export function createFigure(body:THREE.BufferGeometry,heart:THREE.BufferGeometry,data:FigureData,look:'v1'|'v2'='v2'){
 const group=new THREE.Group();group.position.set(0,FEET_Y,0);
 const bodyMat=look==='v2'?contourMaterial():rimMaterial('#9fb4d8',2.8,0,false);
 const bodyMesh=new THREE.Mesh(body,bodyMat);group.add(bodyMesh);
 heart.computeBoundingBox();const bb=heart.boundingBox!;
 const heartMat=rimMaterial('#ff7482',2.4,look==='v2'?.09:.018,true);
 heartMat.uniforms.uMinY.value=bb.min.y;heartMat.uniforms.uMaxY.value=bb.max.y;
 const heartMesh=new THREE.Mesh(heart,heartMat);heartMesh.position.set(...data.heart);
 // heart.glb (HRA reference organ) is already in body orientation: apex down, forward, to the person's left
 heartMesh.renderOrder=2;group.add(heartMesh);
 // depth pre-pass with the same beat deformation: the additive rim then shows only the nearest surface, not every
 // crease behind it (the anatomical heart has deep grooves between chambers)
 const heartDepthMat=new THREE.ShaderMaterial({vertexShader:rimVert,fragmentShader:'void main(){gl_FragColor=vec4(0.);}',uniforms:heartMat.uniforms,colorWrite:false,transparent:true});   // transparent list: drawn after the backdrop glow (renderOrder)
 const heartDepth=new THREE.Mesh(heart,heartDepthMat);heartDepth.renderOrder=1;heartMesh.add(heartDepth);
 const heartWorld=new THREE.Vector3(data.heart[0],data.heart[1]+FEET_Y,data.heart[2]);
 bodyMat.uniforms.uHeart.value.copy(heartWorld);   // conduction band + (v2) heart light centre

 // morph line: globe rim circle → body silhouette (REF-006 object constancy: the same points travel)
 const N=data.silhouette.length;
 const target=data.silhouette.map(([x,y])=>new THREE.Vector2(x,y+FEET_Y));
 const lineGeo=new LineGeometry();const pos=new Float32Array((N+1)*3);lineGeo.setPositions(pos);
 const lineMat=new LineMaterial({color:0xffffff,linewidth:1.6,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 lineMat.color.setRGB(1.5,1.65,1.9);
 const line=new Line2(lineGeo,lineMat);line.renderOrder=3;line.frustumCulled=false;
 const ease=(t:number)=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
 function setMorph(m:number,circle:{cx:number,cy:number,r:number},alpha:number){
  line.visible=alpha>.003;lineMat.opacity=alpha;if(!line.visible)return;
  for(let i=0;i<=N;i++){
   const j=i%N,u=Math.min(j,N-j)/(N/2),delay=u/3;               // head first, feet last (REF-006 1/3 delay)
   const k=ease(Math.min(1,Math.max(0,(m-delay)/(2/3))));
   const th=Math.PI/2-2*Math.PI*j/N;
   const cx=circle.cx+circle.r*Math.cos(th),cy=circle.cy+circle.r*Math.sin(th);
   pos[i*3]=cx+(target[j].x-cx)*k;pos[i*3+1]=cy+(target[j].y-cy)*k;pos[i*3+2]=0;
  }
  lineGeo.setPositions(pos);
 }
 function beat(p:{sincePrev:number,untilNext:number},amp:number){
  const s=p.sincePrev,u=p.untilNext;
  // ventricles: onset exactly at R (sweep draws the R peak on the same frame), fast attack, relax by ~T wave
  const V=s<.07?Math.sin(s/.07*Math.PI/2):s<.14?1:Math.max(0,1-(s-.14)/.24)**2;
  const A=u<.22&&u>.04?Math.sin((.22-u)/.18*Math.PI):0;       // atria ~120 ms before R (decorative)
  const hu=heartMat.uniforms;hu.uV.value=V*amp;hu.uA.value=A*amp*.8;hu.uFlash.value=Math.exp(-s/.12)*1.3*amp;
  bodyMat.uniforms.uWaveT.value=s;bodyMat.uniforms.uWaveAmp.value=amp;
  if(look==='v2')bodyMat.uniforms.uFlash.value=Math.exp(-s/.15)*amp;
 }
 // P2: floor reflection — the same meshes scaled −1 about the floor, sharing every uniform except uMirror
 function mirror(){
  const g=new THREE.Group();g.position.set(0,FEET_Y,0);g.scale.y=-1;
  const mm=(m:THREE.ShaderMaterial)=>{const c=m.clone();c.uniforms={...m.uniforms,uMirror:{value:1}};c.side=THREE.DoubleSide;return c;};
  const b=new THREE.Mesh(body,mm(bodyMat));b.renderOrder=0;
  const h=new THREE.Mesh(heart,mm(heartMat));h.position.copy(heartMesh.position);h.renderOrder=2;
  g.add(b,h);return{group:g,body:b,heart:h,dispose(){(b.material as THREE.Material).dispose();(h.material as THREE.Material).dispose();}};
 }
 return{group,line,bodyMat,look,mirror,heartMat,heartMesh,heartWorld,setMorph,beat,
  setResolution(w:number,h:number){lineMat.resolution.set(w,h);},
  dispose(){body.dispose();heart.dispose();bodyMat.dispose();heartMat.dispose();heartDepthMat.dispose();lineGeo.dispose();lineMat.dispose();}};
}
export type Figure=ReturnType<typeof createFigure>;
