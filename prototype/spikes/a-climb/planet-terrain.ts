import * as THREE from 'three';
// REMA measured metres remain in the grid. Only the display mesh uses 5x height.
export async function createAntarcticTerrain(map:THREE.Texture,roughness:THREE.Texture,cloud:THREE.Texture,localSun:THREE.IUniform,shadowOn:THREE.IUniform,specularOn:THREE.IUniform){
 const response=await fetch(new URL('./assets/planet-v2/antarctic-height.f32.bin',import.meta.url));
 if(!response.ok||!response.body)throw new Error('REMA height unavailable');
 const heights=new Float32Array(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
 const halfHeights=new Uint16Array(heights.length);for(let i=0;i<heights.length;i++)halfHeights[i]=THREE.DataUtils.toHalfFloat(heights[i]);
 const heightTexture=new THREE.DataTexture(halfHeights,2048,512,THREE.RedFormat,THREE.HalfFloatType);heightTexture.minFilter=heightTexture.magFilter=THREE.LinearFilter;heightTexture.wrapS=THREE.RepeatWrapping;heightTexture.needsUpdate=true;
 const w=2048,h=512,geo=new THREE.SphereGeometry(1,512,192,0,Math.PI*2,Math.PI*5/6,Math.PI/6);
 // REMA has a polar no-data gap. Infill only the display mesh, never the source grid.
 const polarRing=Array.from(heights.slice(460*w,461*w)).filter(x=>x>0),polarDisplayHeight=polarRing.reduce((a,b)=>a+b,0)/polarRing.length;
 const pos=geo.getAttribute('position'),uv=geo.getAttribute('uv'),elevation=new Float32Array(pos.count);
 const sample=(u:number,v:number)=>{const x=((u%1+1)%1)*w-.5,y=THREE.MathUtils.clamp(v*h-.5,0,h-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const at=(a:number,b:number)=>heights[Math.min(h-1,b)*w+(a+w)%w];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy);};
 for(let i=0;i<pos.count;i++){
  // SphereGeometry UV longitude has the same orientation as NASA's full globe.
  const latitudeV=1-uv.getY(i),raw=sample(uv.getX(i),latitudeV),blend=THREE.MathUtils.smoothstep(latitudeV,.90,.94),metres=THREE.MathUtils.lerp(raw,polarDisplayHeight,blend),radius=1+metres/6360000*5;
  const p=new THREE.Vector3().fromBufferAttribute(pos,i).normalize().multiplyScalar(radius);pos.setXYZ(i,p.x,p.y,p.z);uv.setY(i,uv.getY(i)/6);
  elevation[i]=metres;
 }
 geo.computeVertexNormals();
 geo.setAttribute('elevation',new THREE.BufferAttribute(elevation,1));
 const mat=new THREE.MeshStandardMaterial({map,roughness:1,roughnessMap:roughness,metalness:0,color:0xffffff});
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,{tClass:{value:roughness},tCloud:{value:cloud},uLocalSun:localSun,uCloudShadow:shadowOn,uSpecular:specularOn});s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\n attribute float elevation;varying float vElevation;').replace('#include <begin_vertex>','#include <begin_vertex>\n vElevation=elevation;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n varying float vElevation;uniform sampler2D tClass,tCloud;uniform vec3 uLocalSun;uniform float uCloudShadow,uSpecular;').replace('#include <map_fragment>','#include <map_fragment>\n float oceanMask=1.-smoothstep(.35,.65,texture2D(tClass,vMapUv).g);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.015,.055,.13),oceanMask*.8);float iceMask=smoothstep(30.,150.,vElevation);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.9,1.),iceMask*.45);float cloudShade=texture2D(tCloud,vMapUv+uLocalSun.xy*.006).g;diffuseColor.rgb*=1.-cloudShade*.3*uCloudShadow;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,.38,iceMask);').replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directSpecular*=uSpecular*mix(.22,.65,iceMask);reflectedLight.indirectSpecular*=uSpecular*mix(.22,.65,iceMask);');};
 const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;
 return {mesh,heightTexture,dispose(){geo.dispose();mat.dispose();heightTexture.dispose();},info:{source:'REMA v2 1km EPSG3031',heightExaggeration:5,polarDisplayInfillMetres:polarDisplayHeight,vertices:pos.count}};
}
