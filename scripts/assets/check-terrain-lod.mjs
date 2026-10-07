import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';
import * as THREE from '../../prototype/spikes/a-climb/node_modules/three/build/three.module.js';
import {selectTerrainLevel} from '../../prototype/spikes/a-climb/terrain-selection.mjs';
const base=new URL('../../prototype/spikes/a-climb/public/terrain-lod/',import.meta.url),out=new URL('../../verification/a-terrain-lod-20261007/',import.meta.url),m=JSON.parse(fs.readFileSync(new URL('manifest.json',base),'utf8'));
let count=0,total=0;for(const tile of m.tiles)for(const level of tile.levels){const b=fs.readFileSync(new URL(level.file,base));if(crypto.createHash('sha256').update(b).digest('hex')!==level.sha256)throw Error('hash');const decoded=zlib.gunzipSync(b);if(decoded.length!==level.gpuBytes)throw Error('length');const index=new Uint32Array(decoded.buffer,decoded.byteOffset+level.vertices*32,level.indices);if(index.some(i=>i>=level.vertices))throw Error('index');count++;total+=b.length;}
const camera=new THREE.PerspectiveCamera(47,1088/870,.05,500),states=[];
for(const [name,pos] of [['broad',[35,45,70]],['approach',[18,14,25]],['ridge',[10,6,16]],['outside',[0,30,0]]]){
 camera.position.fromArray(pos);camera.lookAt(name==='outside'?new THREE.Vector3(0,500,0):new THREE.Vector3(0,1.8,name==='ridge'?-1:0));camera.updateMatrixWorld();const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));let visible=0,triangles=0,maxError=0,histogram=[0,0,0,0];const focal=870*1.5/(2*Math.tan(47*Math.PI/360));
 for(const tile of m.tiles){if(!frustum.intersectsBox(new THREE.Box3(new THREE.Vector3(...tile.min),new THREE.Vector3(...tile.max))))continue;visible++;const selection=selectTerrainLevel(tile,pos,focal,m.ssePixels);histogram[selection.level]++;triangles+=tile.levels[selection.level].indices/3;maxError=Math.max(maxError,selection.errorPixels);}
 if(maxError>m.ssePixels+1e-8)throw Error('screen error');states.push({name,visible,triangles,maxError,histogram,reductionComparedWithFullTiled:1-triangles/m.fullTiledTriangles});
}
if(states[3].visible!==0)throw Error('offscreen culling');
fs.writeFileSync(new URL('asset-selection-check.json',out),JSON.stringify({filesVerified:count,compressedGeometryBytes:total,heightGain:m.heightGain,fullTiledTriangles:m.fullTiledTriangles,states,scope:'CPU data/selection/frustum verification; not GPU timing or pixel fidelity'},null,2));console.log(JSON.stringify(states));
