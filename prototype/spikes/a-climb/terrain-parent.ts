import * as THREE from 'three';
import {terrainSourceGLSL} from './terrain-source';
export async function createTerrainParent(macro:THREE.Texture,broad:THREE.Texture,day:THREE.Texture,packed:THREE.Texture){
 const base=new URL('./north-earth/',document.baseURI),m=await (await fetch(new URL('parent-height.json',base))).json(),raw=new Uint16Array(await (await fetch(new URL('parent-height.bin',base))).arrayBuffer());
 if(raw.length!==m.size*m.size)throw Error('Invalid parent height size');
 const lat0=61.63,lon0=8.4,kx=111.32*Math.cos(THREE.MathUtils.degToRad(lat0)),ky=111.32,n=m.size,b=m.bounds;
 const smooth=(a:number,c:number,x:number)=>{const t=THREE.MathUtils.clamp((x-a)/(c-a),0,1);return t*t*(3-2*t);};
 function sample(x:number,z:number){const lon=x/kx+lon0,lat=lat0-z/ky,u=THREE.MathUtils.clamp((lon-b[0])/(b[2]-b[0])*(n-1),0,n-1.001),v=THREE.MathUtils.clamp((b[3]-lat)/(b[3]-b[1])*(n-1),0,n-1.001),i=Math.floor(u),j=Math.floor(v),a=u-i,c=v-j;
  const h=((raw[j*n+i]*(1-a)+raw[j*n+i+1]*a)*(1-c)+(raw[(j+1)*n+i]*(1-a)+raw[(j+1)*n+i+1]*a)*c)*.0015;
  return h-(x*x+z*z)/(2*6371);
 }
 function normal(x:number,z:number){const step=.8;return new THREE.Vector3(-(sample(x+step,z)-sample(x-step,z))/(2*step),1,-(sample(x,z+step)-sample(x,z-step))/(2*step)).normalize();}
 // D098: evaluate normals on the actual deformed surface, rather than lerping unrelated normals.
 const geometry=new THREE.PlaneGeometry(1,1,256,256),pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 const sphere=new Float32Array(pos.count*3),tangent=new Float32Array(pos.count*3),weights=new Float32Array(pos.count),regionWeights=new Float32Array(pos.count),la0=THREE.MathUtils.degToRad(lat0);
 for(let i=0;i<pos.count;i++){
  const u=uv.getX(i),v=uv.getY(i),lon=b[0]+u*(b[2]-b[0]),lat=b[1]+v*(b[3]-b[1]),x=(lon-lon0)*kx,z=(lat0-lat)*ky,la=THREE.MathUtils.degToRad(lat),delta=THREE.MathUtils.degToRad(lon-lon0);
  sphere.set([6371*Math.cos(la)*Math.sin(delta),6371*(Math.sin(la)*Math.sin(la0)+Math.cos(la)*Math.cos(la0)*Math.cos(delta))-6371,6371*(Math.sin(la0)*Math.cos(la)*Math.cos(delta)-Math.cos(la0)*Math.sin(la))],i*3);
  const edge=Math.min(u,v,1-u,1-v),rU=(lon-7.1)/2.6,rV=(lat-61)/1.2,re=Math.min(rU,rV,1-rU,1-rV),inner=smooth(-.35,0,re),curve=-(x*x+z*z)/(2*6371);
  tangent.set([THREE.MathUtils.lerp(sphere[i*3],x,inner),THREE.MathUtils.lerp(sphere[i*3+1],curve,inner)+(sample(x,z)-curve),THREE.MathUtils.lerp(sphere[i*3+2],z,inner)],i*3);
  weights[i]=smooth(0,.12,edge);regionWeights[i]=smooth(0,.20,re);
 }
 // Surface derivatives are linear in the morph weights; their cross product gives the actual deformed normal on the GPU.
 const deltas=new Float32Array(pos.count*3),contact=new Float32Array(pos.count*4);
 for(let i=0;i<pos.count;i++){const k=i*3,w=weights[i];for(let axis=0;axis<3;axis++)deltas[k+axis]=(tangent[k+axis]-sphere[k+axis])*w;pos.setXYZ(i,sphere[k],sphere[k+1],sphere[k+2]);const len=Math.hypot(sphere[k],sphere[k+1]+6371,sphere[k+2]);contact.set([sphere[k]/len,(sphere[k+1]+6371)/len,sphere[k+2]/len,w],i*4);}
 const du=new Float32Array(pos.count*3),dv=new Float32Array(pos.count*3),deltaU=new Float32Array(pos.count*3),deltaV=new Float32Array(pos.count*3),detailGrad=new Float32Array(pos.count*2),side=257;
 for(let i=0;i<pos.count;i++){
  const col=i%side,row=Math.floor(i/side),left=col>0?i-1:i,right=col<side-1?i+1:i,up=row>0?i-side:i,down=row<side-1?i+side:i;
  for(let k=0;k<3;k++){du[i*3+k]=sphere[right*3+k]-sphere[left*3+k];dv[i*3+k]=sphere[down*3+k]-sphere[up*3+k];deltaU[i*3+k]=deltas[right*3+k]-deltas[left*3+k];deltaV[i*3+k]=deltas[down*3+k]-deltas[up*3+k];}
  detailGrad[i*2]=-4*(regionWeights[right]-regionWeights[left]);detailGrad[i*2+1]=-4*(regionWeights[down]-regionWeights[up]);
 }
 for(const [name,array,itemSize] of [['terrainDelta',deltas,3],['surfaceU',du,3],['surfaceV',dv,3],['deltaU',deltaU,3],['deltaV',deltaV,3],['detailGradient',detailGrad,2],['sphereContact',contact,4],['dropWeight',regionWeights,1]] as const)geometry.setAttribute(name,new THREE.BufferAttribute(array,itemSize));
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.boundingBox!.expandByScalar(8);geometry.boundingSphere=geometry.boundingBox!.getBoundingSphere(new THREE.Sphere());
 const embeddedCloud={value:1},colorHandoff={value:0},mapGain={value:1},detailHold={value:0},sourceMatch={value:0};const amount={value:0},detail={value:0},mat=new THREE.MeshPhysicalMaterial({map:macro,roughness:1,specularIntensity:.16,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,{parentAmount:amount,detailAmount:detail,parentBroad:{value:broad},parentDay:{value:day},parentPacked:{value:packed},parentEmbeddedCloud:embeddedCloud,parentColorHandoff:colorHandoff,parentMapGain:mapGain,parentDetailHold:detailHold,parentSourceMatch:sourceMatch});
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
   attribute vec3 terrainDelta,surfaceU,surfaceV,deltaU,deltaV;attribute vec2 detailGradient;attribute vec4 sphereContact;attribute float dropWeight;uniform float parentAmount,detailAmount;
  `).replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   vec3 actualU=surfaceU+parentAmount*deltaU,actualV=surfaceV+parentAmount*deltaV;
   actualU.y+=detailAmount*detailGradient.x;actualV.y+=detailAmount*detailGradient.y;
   objectNormal=normalize(mix(sphereContact.xyz,normalize(cross(actualV,actualU)),sphereContact.w));
  `).replace('#include <begin_vertex>',`#include <begin_vertex>
   transformed+=parentAmount*terrainDelta;transformed.y-=4.*detailAmount*dropWeight;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D parentBroad,parentDay,parentPacked;uniform float parentEmbeddedCloud,parentColorHandoff,parentAmount,parentMapGain,parentDetailHold,parentSourceMatch;'+terrainSourceGLSL).replace('#include <map_fragment>',`#include <map_fragment>
   vec2 ll=vec2(vMapUv.x*16.,56.+vMapUv.y*12.),guv=(ll+vec2(180.,90.))/vec2(360.,180.);float edge=min(min(vMapUv.x,vMapUv.y),min(1.-vMapUv.x,1.-vMapUv.y));
   vec3 globalColor=texture2D(parentDay,guv).rgb*parentMapGain;float colorPhase=mix(1.,parentAmount,parentColorHandoff);float spatialBlend=smoothstep(0.,mix(.12,.22,parentColorHandoff),edge);float macroBlend=spatialBlend*colorPhase;
   vec2 r=(ll-vec2(7.1,61.))/vec2(2.6,1.2);float re=min(min(r.x,r.y),min(1.-r.x,1.-r.y));float regionBlend=smoothstep(0.,.18,re)*colorPhase;
   vec3 mappedColor=mix(globalColor,diffuseColor.rgb,macroBlend);
   float cloudMask=texture2D(parentPacked,guv).b*(1.-max(regionBlend,macroBlend));
   mappedColor=mix(mappedColor,vec3(.9,.94,1.),cloudMask*.60*parentEmbeddedCloud);
   diffuseColor.rgb=mappedColor;
   diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(parentBroad,r).rgb,regionBlend);
   // D123 revision: retain source detail without restoring the rejected dark macro colour block.
   float regionSpatial=smoothstep(0.,.18,re);
   vec3 highColor=mix(texture2D(map,vMapUv).rgb,texture2D(parentBroad,r).rgb,regionSpatial);
   vec3 highBlur=mix(texture2D(map,vMapUv,4.).rgb,texture2D(parentBroad,r,4.).rgb,regionSpatial);
   float highLuma=dot(highColor,vec3(.2126,.7152,.0722)),blurLuma=dot(highBlur,vec3(.2126,.7152,.0722));
   float sourceDetail=clamp(highLuma/max(.025,blurLuma),.6,1.7);
   diffuseColor.rgb*=mix(1.,sourceDetail,parentDetailHold*(1.-colorPhase)*spatialBlend);
   if(parentSourceMatch>.5)diffuseColor.rgb=continuousTerrainSource(parentDay,map,parentBroad,guv,parentMapGain);
  `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   vec2 roughUV=(vec2(vMapUv.x*16.,56.+vMapUv.y*12.)+vec2(180.,90.))/vec2(360.,180.);
   roughnessFactor=clamp(texture2D(parentPacked,roughUV).g,.32,.95);
  `);
 };
 const mesh=new THREE.Mesh(geometry,mat);mesh.name='Northern coarse parent terrain';mesh.renderOrder=1;mesh.receiveShadow=true;
 return {mesh,sample,normal,macro,bounds:b,setSourceMatch(on:boolean){sourceMatch.value=on?1:0;},setDetailHold(on:boolean){detailHold.value=on?1:0;},setMapGain(value:number){mapGain.value=value;},setColorHandoff(on:boolean){colorHandoff.value=on?1:0;},setEmbeddedCloud(on:boolean){embeddedCloud.value=on?1:0;},set(p:number,d:number){amount.value=p;detail.value=d;mesh.visible=p>0;},state:()=>({detailHold:detailHold.value,mapGain:mapGain.value,source:m.source,bounds:b,triangles:256*256*2,reveal:amount.value,detail:detail.value,normalModel:'GPU derivatives of actual deformed surface + analytic sphere contact',cpuGeometryUpdatesPerFrame:0}),dispose(){geometry.dispose();mat.dispose();}};
}
