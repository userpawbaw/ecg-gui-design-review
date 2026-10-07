import * as THREE from 'three';
import {selectTerrainLevel} from './terrain-selection.mjs';
type Level={level:number;file:string;vertices:number;indices:number;gpuBytes:number;errorKm:number};
type Tile={id:string;min:number[];max:number[];levels:Level[]};
type Resident={geometry:THREE.BufferGeometry;last:number;bytes:number};
const base=new URL('./terrain-lod/',document.baseURI);
export async function createRegionalTerrain(renderer:THREE.WebGLRenderer){
 const response=await fetch(new URL('manifest.json',base));if(!response.ok)throw Error('Terrain manifest unavailable');const manifest=await response.json();
 const group=new THREE.Group(),loader=new THREE.TextureLoader(),low=await loader.loadAsync(new URL('broad-low.jpg',base).href);
 low.colorSpace=THREE.SRGBColorSpace;low.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const nearUV=new THREE.Vector4(...manifest.nearUV),nearTexture={value:low},nearEnabled={value:0};
 const material=new THREE.MeshStandardMaterial({map:low,roughness:.87,metalness:0});
 material.onBeforeCompile=s=>{s.uniforms.regionNear=nearTexture;s.uniforms.regionNearEnabled=nearEnabled;s.uniforms.regionUV={value:nearUV};s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D regionNear;uniform vec4 regionUV;uniform float regionNearEnabled;').replace('#include <map_fragment>',`#include <map_fragment>
 vec2 q=(vMapUv-regionUV.xy)/(regionUV.zw-regionUV.xy);float e=min(min(q.x,q.y),min(1.-q.x,1.-q.y));float regionMix=clamp(e/.05,0.,1.)*regionNearEnabled;
 diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(regionNear,q).rgb,regionMix);`);};
 const meshes=new Map<string,THREE.Mesh>(),cache=new Map<string,Resident>(),pending=new Set<string>(),failed=new Set<string>(),requested: {tile:Tile;level:Level}[]=[];
 const frustum=new THREE.Frustum(),pv=new THREE.Matrix4();let active=0,clock=0,disposed=false,highStarted=false,highTextures:THREE.Texture[]=[];let faults:string[]=[];
 let metrics={visibleTiles:0,drawTriangles:0,residentGpuBytes:0,queued:0,pending:0,fullSurfaceTriangles:manifest.fullSurfaceTriangles,fullTiledTriangles:manifest.fullTiledTriangles,heightGain:1.5,maxErrorPixels:0,highTextures:false,errors:faults};
 function pump(){while(active<4&&requested.length){const request=requested.shift()!,{tile,level}=request,key=tile.id+':'+level.level;active++;
  fetch(new URL(level.file,base)).then(async r=>{if(!r.ok)throw Error('Terrain tile '+key+' unavailable: '+r.status);const bytes=await r.arrayBuffer(),header=new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));let decoded=bytes;
   // Static hosts may serve .gz with Content-Encoding:gzip, which fetch has already decoded.
   if(header[0]===31&&header[1]===139)decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   if(decoded.byteLength!==level.gpuBytes)throw Error('Invalid tile byte length '+key+': '+decoded.byteLength);return decoded;}).then(buffer=>{
   if(disposed)return;const g=new THREE.BufferGeometry(),interleaved=new THREE.InterleavedBuffer(new Float32Array(buffer,0,level.vertices*8),8);
   g.setAttribute('position',new THREE.InterleavedBufferAttribute(interleaved,3,0));g.setAttribute('normal',new THREE.InterleavedBufferAttribute(interleaved,3,3));g.setAttribute('uv',new THREE.InterleavedBufferAttribute(interleaved,2,6));g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,level.vertices*32,level.indices),1));g.computeBoundingBox();g.computeBoundingSphere();cache.set(key,{geometry:g,last:clock,bytes:level.gpuBytes});
  }).catch(e=>{failed.add(key);faults.push(key+': '+String(e));}).finally(()=>{active--;pending.delete(key);pump();});
 }}
 function request(tile:Tile,index:number){const key=tile.id+':'+index;if(cache.has(key)||pending.has(key)||failed.has(key)||disposed)return;pending.add(key);requested.push({tile,level:tile.levels[index]});pump();}
 function loadHigh(){if(highStarted||disposed)return;highStarted=true;
  Promise.all([loader.loadAsync(new URL('broad.jpg',base).href),loader.loadAsync(new URL('near.jpg',base).href)]).then(textures=>{if(disposed){textures.forEach(t=>t.dispose());return;}highTextures=textures;textures.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});material.map=textures[0];material.needsUpdate=true;nearTexture.value=textures[1];metrics.highTextures=true;}).catch(e=>{faults.push(String(e));});
 }
 return {group,manifest,state:()=>({...metrics,errors:[...faults]}),update(camera:THREE.PerspectiveCamera,pixelHeight:number){
  if(disposed)return;clock++;if(metrics.highTextures)nearEnabled.value=Math.min(1,nearEnabled.value+.06);camera.updateMatrixWorld();pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(pv);
  const focal=pixelHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))),position=camera.position.toArray(),used=new Set<string>();let triangles=0,visible=0,maxError=0;
  for(const tile of manifest.tiles as Tile[]){let mesh=meshes.get(tile.id);const box=new THREE.Box3(new THREE.Vector3(...tile.min),new THREE.Vector3(...tile.max));
   if(!frustum.intersectsBox(box)){if(mesh)mesh.visible=false;continue;}visible++;
   const current=mesh?.userData.level??-1,selection=selectTerrainLevel(tile,position,focal,manifest.ssePixels,current);request(tile,0);request(tile,selection.level);
   // Prepare the next refinement before crossing the threshold; keep four downloads in flight at most.
   if(selection.level<3&&selection.errorPixels>manifest.ssePixels*.7)request(tile,selection.level+1);
   if(selection.level>=2)loadHigh();let chosen=-1;
   // Keep the nearest ready level while a requested tile loads; never display a hole on refinement.
   for(let l=selection.level;l>=0;l--)if(cache.has(tile.id+':'+l)){chosen=l;break;}
   if(chosen<0&&current>=0&&cache.has(tile.id+':'+current))chosen=current;
   if(chosen<0)continue;const key=tile.id+':'+chosen,resident=cache.get(key)!;resident.last=clock;used.add(key);
   if(!mesh){mesh=new THREE.Mesh(resident.geometry,material);mesh.name='Regional terrain '+tile.id;mesh.frustumCulled=true;mesh.castShadow=mesh.receiveShadow=true;meshes.set(tile.id,mesh);group.add(mesh);}
   mesh.geometry=resident.geometry;mesh.visible=true;mesh.userData.level=chosen;triangles+=tile.levels[chosen].indices/3;maxError=Math.max(maxError,tile.levels[chosen].errorKm*focal/selection.distance);
  }
  // Keep nearby out-of-view tiles as shadow casters. Three.js separately culls camera draws and light-space draws.
  for(const [id,mesh] of meshes)if(!mesh.visible){const tile=manifest.tiles.find((t:Tile)=>t.id===id) as Tile;const distance=selectTerrainLevel(tile,position,focal).distance;if(distance<55){mesh.visible=true;used.add(id+':'+mesh.userData.level);}}
  let bytes=[...cache.values()].reduce((n,r)=>n+r.bytes,0);
  for(const [key,r] of [...cache.entries()].sort((a,b)=>a[1].last-b[1].last))if(bytes>manifest.cacheGpuBytes&&!used.has(key)){r.geometry.dispose();cache.delete(key);bytes-=r.bytes;const [id]=key.split(':');const mesh=meshes.get(id);if(mesh?.geometry===r.geometry){group.remove(mesh);meshes.delete(id);}}
  metrics={...metrics,visibleTiles:visible,drawTriangles:triangles,residentGpuBytes:bytes,pending:pending.size,queued:requested.length,maxErrorPixels:maxError};
 },dispose(){disposed=true;requested.length=0;cache.forEach(r=>r.geometry.dispose());cache.clear();material.dispose();low.dispose();highTextures.forEach(t=>t.dispose());group.clear();}};
}
