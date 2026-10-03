// Warm lamp pools (additive light decals) + visible pendant lamps, faded in by tod.lamp.
// Additive decals are the cheap stand-in for relighting a baked room: they add warm light where a lamp would be.
import * as THREE from 'three';
function radial(size=256){
 const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!;
 const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
 r.addColorStop(0,'rgba(255,214,150,1)');r.addColorStop(.35,'rgba(255,180,100,.45)');r.addColorStop(1,'rgba(255,150,70,0)');
 g.fillStyle=r;g.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
// Ha strength (0 = off): ?ha=0..1.5
export let HA=1;export const setHA=(v:number)=>{HA=v;};
export type Lamps={group:THREE.Group,set:(level:number,time:number,beat?:number)=>void};
export function makeLamps():Lamps{
 const group=new THREE.Group(),tex=radial();
 const mats:THREE.MeshBasicMaterial[]=[],base:number[]=[];
 const pool=(x:number,y:number,z:number,w:number,h:number,axis:'floor'|'wall',a=1)=>{
  const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);mesh.position.set(x,y,z);
  if(axis==='floor')mesh.rotation.x=-Math.PI/2;else mesh.rotation.y=Math.PI/2;
  mesh.renderOrder=5;group.add(mesh);mats.push(m);base.push(a);return mesh;};
 // gallery (upper floor y=0, plinths at x≈4.4, z≈±2): floor pools + wall washes
 pool(4.4,.03,-2.0,3.6,3.6,'floor',.9);pool(4.4,.03,2.0,3.6,3.6,'floor',.9);pool(3.0,.03,0,4.2,4.2,'floor',.55);
 pool(1.43,3.0,0,5.5,4.2,'wall',.5);
 // lower room (measured by raycast: floor y=-3.43, back wall face x=6.24, shelf fronts x≈6.3–6.8, ceiling slab y=0)
 pool(8.2,-3.40,-1.9,3.4,3.4,'floor',.8);pool(8.2,-3.40,1.9,3.4,3.4,'floor',.7);pool(7.2,-3.40,0,3.0,3.0,'floor',.35);
 pool(6.84,-1.7,0,6.6,3.3,'wall',.85);pool(6.84,-1.0,0,3.4,1.6,'wall',.5);
 // pendant lamps (visible sources): small warm bulbs with a glow
 const bulb=new THREE.MeshBasicMaterial({color:0xffd9a0,toneMapped:false,transparent:true,opacity:0});mats.push(bulb);base.push(1);
 const shade=new THREE.MeshBasicMaterial({color:0x6b5b48,toneMapped:false,transparent:true,opacity:0});mats.push(shade);base.push(1);
 for(const [x,y,z,len] of [[4.4,3.2,-2.0,1.4],[4.4,3.2,2.0,1.4],[8.2,-.75,-1.9,.75],[8.2,-.75,1.9,.75]] as number[][]){
  const s=new THREE.Mesh(new THREE.ConeGeometry(.28,.22,20,1,true),shade);s.position.set(x,y+.12,z);group.add(s);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.07,12,12),bulb);b.position.set(x,y,z);group.add(b);
  const wire=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,len,4),shade);wire.position.set(x,y+.2+len/2,z);group.add(wire);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffcf90,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  glow.scale.set(1.4,1.4,1);glow.position.set(x,y,z);glow.renderOrder=6;group.add(glow);mats.push(glow.material as unknown as THREE.MeshBasicMaterial);base.push(.9);
 }
 // dust motes in the warm pools (Ha: they lift and brighten on every R)
 const N=700,pos=new Float32Array(N*3),seed=new Float32Array(N);
 const zones=[[4.4,1.6,-2.0,2.2,2.4,2.0],[4.4,1.6,2.0,2.2,2.4,2.0],[8.0,-1.8,-1.9,1.6,1.8,1.6],[8.0,-1.8,1.9,1.6,1.8,1.6],[7.2,-1.9,0,1.4,1.6,3.0]];
 for(let i=0;i<N;i++){const z=zones[i%zones.length];seed[i]=Math.random()*100;
  pos[i*3]=z[0]+(Math.random()-.5)*z[3]*2;pos[i*3+1]=z[1]+(Math.random()-.5)*z[4]*2;pos[i*3+2]=z[2]+(Math.random()-.5)*z[5]*2;}
 const home=pos.slice(),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const dm=new THREE.PointsMaterial({map:tex,size:.05,color:0xffe3b8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true,toneMapped:false});
 const dust=new THREE.Points(geo,dm);dust.renderOrder=7;dust.frustumCulled=false;group.add(dust);
 return{group,set:(level,time,beat=0)=>{
  const flick=1+.015*Math.sin(time*13.1)+.01*Math.sin(time*7.7),k=1+HA*.55*beat;
  mats.forEach((m,i)=>{m.opacity=Math.min(1,level*base[i]*flick*k);});
  dm.opacity=Math.min(1,level*(.55+.7*HA*beat));dm.size=.045+.03*HA*beat;
  const a=geo.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<N;i++){const s=seed[i];a.array[i*3]=home[i*3]+Math.sin(time*.21+s)*.18;a.array[i*3+1]=home[i*3+1]+Math.sin(time*.17+s*1.7)*.14+HA*beat*.06*Math.sin(s);a.array[i*3+2]=home[i*3+2]+Math.cos(time*.19+s)*.18;}
  a.needsUpdate=true;group.visible=level>.002;}};
}
