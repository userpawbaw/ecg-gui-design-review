// Person outline + heart (IDEA-R1-INTRO M2, H3, H2). MakeHuman base mesh (CC0) and a metaball heart built in
// scripts/assets/build-intro.py. Both render only as rim light (fresnel), so the figure reads as a backlit outline
// with no face; the heart is visible through the body. The morph line carries the globe rim into the body outline.
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
uniform vec3 uColor;uniform float uOpacity,uPow,uFill,uFlash;
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
 float a=(rim*(1.+uFlash)+uFill+band*(.35+fres))*uOpacity;
 gl_FragColor=vec4(uColor*a,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

function rimMaterial(color:string,pow:number,fill:number,deform:boolean){
 return new THREE.ShaderMaterial({vertexShader:rimVert,fragmentShader:rimFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:0},uPow:{value:pow},uFill:{value:fill},uFlash:{value:0},
   uHeart:{value:new THREE.Vector3()},uWaveT:{value:9},uWaveAmp:{value:0},uA:{value:0},uV:{value:0},uMinY:{value:-1},uMaxY:{value:1},uDeform:{value:deform?1:0}}});
}

export function createFigure(body:THREE.BufferGeometry,heart:THREE.BufferGeometry,data:FigureData){
 const group=new THREE.Group();group.position.set(0,FEET_Y,0);
 const bodyMat=rimMaterial('#9fb4d8',2.8,0,false);
 const bodyMesh=new THREE.Mesh(body,bodyMat);group.add(bodyMesh);
 heart.computeBoundingBox();const bb=heart.boundingBox!;
 const heartMat=rimMaterial('#ff7482',2.4,.018,true);
 heartMat.uniforms.uMinY.value=bb.min.y;heartMat.uniforms.uMaxY.value=bb.max.y;
 const heartMesh=new THREE.Mesh(heart,heartMat);heartMesh.position.set(...data.heart);
 heartMesh.rotation.set(.1,-.35,-.28);           // apex points down, forward and to the person's left
 heartMesh.renderOrder=2;group.add(heartMesh);
 const heartWorld=new THREE.Vector3(data.heart[0],data.heart[1]+FEET_Y,data.heart[2]);
 bodyMat.uniforms.uHeart.value.copy(heartWorld);

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
 }
 return{group,line,bodyMat,heartMat,heartMesh,heartWorld,setMorph,beat,
  setResolution(w:number,h:number){lineMat.resolution.set(w,h);},
  dispose(){body.dispose();heart.dispose();bodyMat.dispose();heartMat.dispose();lineGeo.dispose();lineMat.dispose();}};
}
export type Figure=ReturnType<typeof createFigure>;
