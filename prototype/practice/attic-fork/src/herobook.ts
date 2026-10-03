// The hero book that sits on the original bookcase (middle row) and is the portal into the page world.
// Local frame: origin at the spine centre, x = from spine toward the fore-edge (page depth), y = height, z = thickness.
// Shelf pose: rotation.y = π (spine faces the camera, pages run into the wall). Presentation pose: rotation.y = π/2
// (front cover faces the camera, spine on the left). The front cover is a pivot group opened by rotation.y ∈ [0,−π].
import * as THREE from 'three';
import {graded} from './tod';
import {drawLeftPage,drawEcgPaperStatic} from './paper';
import {makeTrace,type Trace} from './trace';
import type {Ecg} from './ecg';
export const BOOK={H:.40,D:.27,T:.085};
function cloth(label:boolean,bands:boolean){
 const c=document.createElement('canvas');c.width=256;c.height=384;const g=c.getContext('2d')!;
 g.fillStyle='#1f4a57';g.fillRect(0,0,256,384);
 for(let i=0;i<5000;i++){g.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},${Math.random()<.5?255:0},.035)`;g.fillRect(Math.random()*256,Math.random()*384,1.5,1.5);}
 const edge=g.createLinearGradient(0,0,256,0);edge.addColorStop(0,'rgba(0,0,0,.35)');edge.addColorStop(.12,'rgba(0,0,0,0)');edge.addColorStop(.9,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=edge;g.fillRect(0,0,256,384);
 g.strokeStyle='#c9a45c';g.lineWidth=3;g.strokeRect(16,16,224,352);g.lineWidth=1.2;g.strokeRect(24,24,208,336);
 if(bands){g.lineWidth=3;for(const y of [70,92,292,314]){g.beginPath();g.moveTo(14,y);g.lineTo(242,y);g.stroke();}}
 if(label){g.fillStyle='#c9a45c';g.fillRect(58,128,140,86);g.fillStyle='#1f4a57';g.font='600 30px ui-monospace,Consolas,monospace';g.textAlign='center';g.fillText('S038',128,182);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function paperLines(){
 const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d')!;g.fillStyle='#efe5d0';g.fillRect(0,0,64,256);
 for(let y=0;y<256;y+=2){g.fillStyle=`rgba(120,100,70,${.10+.10*Math.random()})`;g.fillRect(0,y,64,1);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export type HeroBook={group:THREE.Group,cover:THREE.Group,ribbon:THREE.Group,set:(open:number,beat:number,time:number)=>void,glow:(v:number)=>void,attach:(e:Ecg)=>void,trace:(time:number,mix:number,glow:number)=>void};
export function makeHeroBook():HeroBook{
 const {H,D,T}=BOOK,group=new THREE.Group();
 const face=(map:THREE.Texture|null,color:number,shade:number)=>graded(new THREE.MeshBasicMaterial({map,color:new THREE.Color(color).multiplyScalar(shade),toneMapped:false}),.3);
 const clothFront=cloth(true,false),clothSpine=cloth(false,true),clothPlain=cloth(false,false),lines=paperLines();
 // per-face shade fakes volume under unlit materials: [+x,-x,+y,-y,+z,-z]
 const clothBox=(w:number,h:number,d:number,outer:number)=>{
  const mk=(s:number,m:THREE.Texture)=>face(m,0xffffff,s);
  const mats=[mk(.8,clothPlain),mk(.7,clothPlain),mk(1,clothPlain),mk(.55,clothPlain),mk(.95,clothPlain),mk(.9,clothPlain)];
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats);};
 // spine panel
 const spineMats=[0,1,2,3,4,5].map(i=>face(i===1?clothSpine:clothPlain,0xffffff,[.8,1,1,.55,.95,.9][i]));
 const spine=new THREE.Mesh(new THREE.BoxGeometry(.012,H,T+.012),spineMats);spine.position.set(-.006,0,0);group.add(spine);
 // back cover + page block
 const back=clothBox(D,H,.012,0);back.position.set(D/2,0,-T/2+.006);group.add(back);
 const pageMat=face(lines,0xffffff,1),pagesDark=face(lines,0xffffff,.78);
 const pages=new THREE.Mesh(new THREE.BoxGeometry(D-.012,H-.016,T-.024),[pageMat,pagesDark,pageMat,pagesDark,face(lines,0xffffff,.95),face(lines,0xffffff,.9)]);pages.position.set(D/2,0,0);group.add(pages);
 // front cover (pivot at the spine hinge)
 const cover=new THREE.Group();cover.position.set(0,0,T/2-.006);group.add(cover);
 const inner=face(null,0xe9dcc0,.9);
 const cm=new THREE.Mesh(new THREE.BoxGeometry(D,H,.012),[face(clothPlain,0xffffff,.8),face(clothPlain,0xffffff,.7),face(clothPlain,0xffffff,1),face(clothPlain,0xffffff,.55),face(clothFront,0xffffff,1),inner]);
 cm.position.set(D/2,0,0);cover.add(cm);
 // bookmark ribbon (twitches on the beat once the book is open)
 const ribbon=new THREE.Group();ribbon.position.set(D*.55,-H/2+.004,.004);group.add(ribbon);
 const rm=new THREE.Mesh(new THREE.PlaneGeometry(.014,.17),graded(new THREE.MeshBasicMaterial({color:0x9d3b35,side:THREE.DoubleSide,toneMapped:false}),.3));rm.position.y=-.085;ribbon.add(rm);
 // spine glow (the beat teaser while it still sits on the shelf)
 const glowMat=new THREE.MeshBasicMaterial({color:0xffc88a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const glowMesh=new THREE.Mesh(new THREE.PlaneGeometry(.14,H*1.15),glowMat);glowMesh.rotation.y=-Math.PI/2;glowMesh.position.set(-.02,0,0);group.add(glowMesh);
 // first spread: the cover's inner face (left) and the first page (right) carry the same paper as the page world
 let traceObj:Trace|null=null;
 const attach=(e:Ecg)=>{
  const lc=document.createElement('canvas');lc.width=1200;lc.height=1600;drawLeftPage(lc.getContext('2d')!);
  const lt=new THREE.CanvasTexture(lc);lt.colorSpace=THREE.SRGBColorSpace;lt.anisotropy=8;
  (cm.material as THREE.MeshBasicMaterial[])[5]=face(lt,0xffffff,.95);
  // right page: STATIC paper (drawn once) + the stored trace on the GPU (no per-frame canvas, F-034)
  const rc=document.createElement('canvas');rc.width=1200;rc.height=1600;drawEcgPaperStatic(rc.getContext('2d')!,e);
  const rt=new THREE.CanvasTexture(rc);rt.colorSpace=THREE.SRGBColorSpace;rt.anisotropy=8;
  const pw=D-.016,ph=H-.02;
  const pg=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),face(rt,0xffffff,1));pg.position.set(D/2,0,T/2-.0105);group.add(pg);
  traceObj=makeTrace(e,{lift:0,pageW:1200});traceObj.group.scale.set(pw/1200,-ph/1600,1);traceObj.group.position.set(D/2-pw/2,ph/2,T/2-.0085);group.add(traceObj.group);};
 return{group,cover,ribbon,attach,
  trace:(time,mix,glow)=>{traceObj?.update({t:time,mix,glow});},
  set:(open,beat,time)=>{cover.rotation.y=-Math.PI*open;ribbon.rotation.z=Math.sin(time*2.1)*.04+beat*.22*open;},
  glow:v=>{glowMat.opacity=v;}};
}
