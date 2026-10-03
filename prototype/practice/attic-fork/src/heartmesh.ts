// Anatomical heart mesh: HRA point cloud (assets/heart.glb, CC BY 4.0, surface samples) → solid occupancy → smooth iso-surface.
// Steps: splat points into a voxel grid → light blur closes the shell → flood fill from outside marks the exterior →
// interior = solid → blur the solid → marching cubes at 0.5 (three's MarchingCubes only used as the polygoniser).
// Why: the stacked paper cut-outs read as a craft object / "sliced meat" (user: "너무 데포르메", F-033 follow-up, D-048 P-E).
// Output is normalised: height 1 (y), centred at the origin; front axis +z (apex lower-right in the anterior view).
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';

function boxBlur(a:Float32Array,n:number,r:number){
 const t=new Float32Array(a.length),idx=(x:number,y:number,z:number)=>x+y*n+z*n*n,w=1/(2*r+1);
 for(let axis=0;axis<3;axis++){
  for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   let s=0;for(let k=-r;k<=r;k++){const c=axis===0?x+k:axis===1?y+k:z+k;if(c<0||c>=n)continue;s+=a[axis===0?idx(c,y,z):axis===1?idx(x,c,z):idx(x,y,c)];}
   t[idx(x,y,z)]=s*w;}
  a.set(t);}
}
export async function buildHeartGeometry(N=112):Promise<THREE.BufferGeometry>{
 const g=await new GLTFLoader().loadAsync('./assets/heart.glb');let P:Float32Array|null=null;
 g.scene.traverse(o=>{const m=o as any;if(!P&&m.geometry?.attributes?.position)P=m.geometry.attributes.position.array;});
 if(!P)throw Error('heart points missing');const pts=P as Float32Array,n=pts.length/3;
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;
 for(let i=0;i<n;i++){const x=pts[i*3],y=pts[i*3+1],z=pts[i*3+2];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);z0=Math.min(z0,z);z1=Math.max(z1,z);}
 const pad=7,ext=Math.max(x1-x0,y1-y0,z1-z0),k=(N-1-2*pad)/ext,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2,C=(N-1)/2;
 const vox=new Float32Array(N*N*N),I=(x:number,y:number,z:number)=>x+y*N+z*N*N;
 for(let i=0;i<n;i++){const fx=C+(pts[i*3]-cx)*k,fy=C+(pts[i*3+1]-cy)*k,fz=C+(pts[i*3+2]-cz)*k;
  const ix=Math.round(fx),iy=Math.round(fy),iz=Math.round(fz);if(ix>=0&&iy>=0&&iz>=0&&ix<N&&iy<N&&iz<N)vox[I(ix,iy,iz)]+=1;}
 boxBlur(vox,N,1);boxBlur(vox,N,1);boxBlur(vox,N,1);
 let mx=0;for(const v of vox)mx=Math.max(mx,v);
 const shell=new Uint8Array(N*N*N);for(let i=0;i<shell.length;i++)shell[i]=vox[i]>mx*.05?1:0;
 // flood fill the exterior from the grid corner (6-connected)
 const ext2=new Uint8Array(N*N*N),stack:number[]=[0];ext2[0]=1;
 while(stack.length){const c=stack.pop()!,x=c%N,y=((c/N)|0)%N,z=(c/(N*N))|0;
  for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const X=x+dx,Y=y+dy,Z=z+dz;if(X<0||Y<0||Z<0||X>=N||Y>=N||Z>=N)continue;const j=I(X,Y,Z);if(ext2[j]||shell[j])continue;ext2[j]=1;stack.push(j);}}
 const field=new Float32Array(N*N*N);for(let i=0;i<field.length;i++)field[i]=ext2[i]?0:1;
 boxBlur(field,N,1);boxBlur(field,N,1);
 const mc=new MarchingCubes(N,new THREE.MeshBasicMaterial(),false,false,400000);
 mc.isolation=.5;mc.field.set(field);mc.update();
 const cnt=(mc as any).count as number;
 const pos=(mc as any).positionArray.slice(0,cnt*3),nor=(mc as any).normalArray.slice(0,cnt*3);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 // MarchingCubes works in [-1,1]^3 with x,y,z as the grid axes → rescale to height 1, then smooth normals from the field gradient are kept
 geo.computeBoundingBox();const bb=geo.boundingBox!,sz=new THREE.Vector3();bb.getSize(sz);const c=new THREE.Vector3();bb.getCenter(c);
 geo.translate(-c.x,-c.y,-c.z);geo.scale(1/sz.y,1/sz.y,1/sz.y);
 return geo;
}
export function heartMaterial(){
 return new THREE.MeshPhysicalMaterial({color:0xa8262f,roughness:.42,metalness:0,clearcoat:1,clearcoatRoughness:.12,sheen:.4,sheenColor:new THREE.Color(0xff8c8c),sheenRoughness:.5,envMapIntensity:1.4,emissive:0x2a0508,emissiveIntensity:.35});
}
