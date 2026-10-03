// Hero book v2 — a hand-built hardcover (case binding), PBR, with sheet stacks and a bending page turn.
// Construction follows real case binding (BookPublish / iBookBinding / Hasier Goitia, IDEA-R1-SPACE-FORK §6.4):
//   boards larger than the text block (overhang) · joint groove beside the round spine · headband/tailband · endpapers
//   (kraft pastedown) · ribbon · gold-foil stamping (metal, low roughness) · cloth grain normal · page-edge lines on the block.
// Quality reference: Poly Haven decorative_book_set_01 (CC0), kept only as a side-by-side benchmark (registry: model-ph-…).
// Local frame: origin on the spine axis, x = toward the fore-edge, y = height, z = thickness (front cover at +z).
// Shelf pose rotation.y = π (spine to the camera); presentation pose rotation.y = π/2 (front cover to the camera, spine left).
// Open state: the front board swings about its hinge to the left and lies flush with the back board; the sheet stacks move
// (right stack shrinks, left stack grows) and N sheets bend over one by one (stagger) — the page turn.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {drawLeftPage,drawEcgPlate,PLATE,PLOT,paperBase,FONT,MONO} from './paper';
import {makeTrace,type Trace} from './trace';
import type {Ecg} from './ecg';

export const BOOK={H:.40,D:.27,T:.085};
export const SPREAD={DP:0,PWD:0,PHT:0};     // filled below (page-space dimensions the FX need)
const TB=.0075,OV=.010,HJ=.006,GAP=.0018;                     // board thickness · overhang · hinge offset · board↔block gap
const {H,D,T}=BOOK,R=T/2;
const HP=H-2*OV,DP=D-OV-HJ,TP=T-2*TB-2*GAP;                   // page block: height, width (per side), full thickness
const NS=4;                                                    // individually turning sheets
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const tl=new THREE.TextureLoader();
function tex(url:string,srgb:boolean,rep?:[number,number]){const t=tl.load(url);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(...rep);return t;}
function cv(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return{c,g:c.getContext('2d')!};}
function ctex(c:HTMLCanvasElement,srgb=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// crop a region of an image (u0..u1, v0..v1 in image fractions, v from the TOP) into a repeatable texture
function crop(url:string,u0:number,v0:number,u1:number,v1:number,srgb:boolean,w=1024,h=256):Promise<THREE.Texture>{
 return new Promise(res=>{const im=new Image();im.onload=()=>{const {c,g}=cv(w,h);g.drawImage(im,u0*im.width,v0*im.height,(u1-u0)*im.width,(v1-v0)*im.height,0,0,w,h);const t=ctex(c,srgb);t.wrapS=t.wrapT=THREE.RepeatWrapping;res(t);};im.src=url;});
}

// ---- gold foil: cover frame + emblem (front), spine bands + title (spine) -------------------------------------------------
function foilFront(){
 const {c,g}=cv(512,768);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(34,34,444,700);g.lineWidth=2;g.strokeRect(50,50,412,668);
 g.fillStyle='#fff';g.textAlign='center';g.font=`600 34px ${MONO}`;g.fillText('ECG SIGNAL STUDIO',256,150);
 g.lineWidth=5;g.lineJoin='round';g.beginPath();const y=400;g.moveTo(90,y);g.lineTo(190,y);g.lineTo(210,y-14);g.lineTo(228,y);g.lineTo(250,y+8);g.lineTo(268,y-96);g.lineTo(292,y+70);g.lineTo(312,y);g.lineTo(336,y-22);g.lineTo(358,y);g.lineTo(422,y);g.stroke();
 g.font=`600 52px ${MONO}`;g.fillText('S038',256,560);g.font=`500 22px ${MONO}`;g.fillText('D0 · 0 dB',256,604);
 return ctex(c);
}
function foilSpine(){
 const {c,g}=cv(256,768);g.strokeStyle='#fff';g.lineWidth=4;
 for(const y of [70,92,676,698]){g.beginPath();g.moveTo(10,y);g.lineTo(246,y);g.stroke();}
 g.save();g.translate(128,384);g.rotate(Math.PI/2);g.fillStyle='#fff';g.textAlign='center';g.font=`600 40px ${MONO}`;g.fillText('S038 · ECG',0,14);g.restore();
 return ctex(c);
}
function bandTex(){const {c,g}=cv(64,16);for(let i=0;i<8;i++){g.fillStyle=i%2?'#e9d8b5':'#9b3b33';g.fillRect(i*8,0,8,16);}const t=ctex(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function sheetTex(kind:'title'|'text'|'blank'|'verso',seed=1){
 const {c,g}=cv(600,800);paperBase(g,600,800);
 g.fillStyle='#4b3b2e';
 if(kind==='title'){g.textAlign='center';g.font=`700 38px ${FONT}`;g.fillText('저장된 기록',300,300);g.font=`500 18px ${MONO}`;g.fillStyle='#8a6f5a';g.fillText('D0 · S038 · ARCHIVED REPLAY',300,350);g.strokeStyle='#b09a82';g.beginPath();g.moveTo(240,380);g.lineTo(360,380);g.stroke();}
 else if(kind==='text'){let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};g.fillStyle='rgba(75,59,46,.55)';for(let y=90;y<720;y+=18){const w=380+rnd()*80;g.fillRect(80,y,y%126<20?w*.5:w,3.2);}}
 const gg=g.createLinearGradient(0,0,90,0);gg.addColorStop(0,'rgba(60,40,20,.22)');gg.addColorStop(1,'rgba(60,40,20,0)');g.fillStyle=gg;g.fillRect(0,0,90,800);
 return ctex(c);
}

export type HeroBook={group:THREE.Group,anchorL:THREE.Object3D,cover:THREE.Group,ribbon:THREE.Group,under:THREE.Object3D,
 set:(o:{open:number,turn:number,beat:number,time:number})=>void,glow:(v:number)=>void,attach:(e:Ecg)=>void,
 trace:(o:{t:number,mix:number,glow:number,flash:number,alpha?:number})=>void,materials:THREE.MeshStandardMaterial[]};

export async function makeHeroBook():Promise<HeroBook>{
 const group=new THREE.Group(),mats:THREE.MeshStandardMaterial[]=[];
 const reg=<M extends THREE.MeshStandardMaterial>(m:M)=>{mats.push(m);return m;};
 // textures (CC0, registry ids in the header)
 const lNor=tex('./assets/book/leather_nor.jpg',false,[2.6,3.6]),lRough=tex('./assets/book/leather_rough.jpg',false,[2.6,3.6]),lCol=tex('./assets/book/leather_color.jpg',true,[2.6,3.6]);
 const pNor=tex('./assets/book/paper_nor.jpg',false,[2,3]);
 const [edgeCol,edgeNor,endCol]=await Promise.all([
  crop('./assets/book/atlas_diff.jpg',.025,.02,.94,.295,true,1024,256),crop('./assets/book/atlas_nor.jpg',.025,.02,.94,.295,false,1024,256),
  crop('./assets/book/atlas_diff.jpg',.045,.35,.40,.86,true,512,768)]);
 // materials
 const CLOTH=new THREE.Color('#1f6b82').multiplyScalar(5.5);
 const cloth=reg(new THREE.MeshPhysicalMaterial({color:CLOTH,map:lCol,normalMap:lNor,normalScale:new THREE.Vector2(.9,.9),roughnessMap:lRough,roughness:1,metalness:0,sheen:.7,sheenColor:new THREE.Color('#8fd0e0'),sheenRoughness:.55,envMapIntensity:.55}));
 const endpaper=reg(new THREE.MeshStandardMaterial({map:endCol,normalMap:pNor,normalScale:new THREE.Vector2(.5,.5),roughness:.88,envMapIntensity:.3}));
 const foil=(map:THREE.Texture)=>new THREE.MeshStandardMaterial({color:0xf6cf70,metalness:.92,roughness:.42,alphaMap:map,alphaTest:.5,transparent:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,envMapIntensity:4.5});
 const edgeX=edgeCol.clone();edgeX.center.set(.5,.5);edgeX.rotation=Math.PI/2;edgeX.repeat.set(1,1);edgeX.needsUpdate=true;
 const edgeNX=edgeNor.clone();edgeNX.center.set(.5,.5);edgeNX.rotation=Math.PI/2;edgeNX.needsUpdate=true;
 const edgeY=reg(new THREE.MeshStandardMaterial({map:edgeCol,normalMap:edgeNor,normalScale:new THREE.Vector2(1.2,1.2),roughness:.9,envMapIntensity:.25}));
 const edgeXm=reg(new THREE.MeshStandardMaterial({map:edgeX,normalMap:edgeNX,normalScale:new THREE.Vector2(1.2,1.2),roughness:.9,envMapIntensity:.25}));
 const darkTop=reg(new THREE.MeshStandardMaterial({color:0x2a2218,roughness:1}));

 // boards (rounded edges), spine arc, joint strips ---------------------------------------------------------------------
 const BW=D-HJ;
 const boardGeo=()=>new RoundedBoxGeometry(BW,H,TB,3,.0028);
 // box face order: +x,-x,+y,-y,+z,-z
 const back=new THREE.Mesh(boardGeo(),[cloth,cloth,cloth,cloth,endpaper,cloth]);back.position.set(HJ+BW/2,0,-T/2+TB/2);back.castShadow=back.receiveShadow=true;group.add(back);
 const cover=new THREE.Group();cover.position.set(HJ,0,T/2-TB/2);group.add(cover);
 const front=new THREE.Mesh(boardGeo(),[cloth,cloth,cloth,cloth,cloth,endpaper]);front.position.set(BW/2,0,0);front.castShadow=front.receiveShadow=true;cover.add(front);
 const spineGeo=new THREE.CylinderGeometry(R,R,H,40,1,true,Math.PI,Math.PI);
 const spineGrp=new THREE.Group();group.add(spineGrp);
 const spine=new THREE.Mesh(spineGeo,cloth);spine.castShadow=spine.receiveShadow=true;spineGrp.add(spine);
 // gold foil on the front board and on the spine (separate shells slightly above the cloth)
 const foilF=new THREE.Mesh(new THREE.PlaneGeometry(BW-.03,H-.03),foil(foilFront()));foilF.position.set(BW/2,0,TB/2+.0004);cover.add(foilF);
 const foilS=new THREE.Mesh(new THREE.CylinderGeometry(R+.0007,R+.0007,H-.004,40,1,true,Math.PI,Math.PI),foil(foilSpine()));spineGrp.add(foilS);
 // raised bands on the spine
 for(const y of [-.115,-.045,.045,.115]){const b=new THREE.Mesh(new THREE.CylinderGeometry(R+.0018,R+.0018,.011,32,1,true,Math.PI,Math.PI),cloth);b.position.y=y;b.castShadow=true;spineGrp.add(b);}
 // joint strips (flat cloth between the spine arc and the board; the groove) — front strip bridges to the moving hinge
 const strip=new THREE.Mesh(new THREE.PlaneGeometry(1,H),cloth);group.add(strip);
 const stripB=new THREE.Mesh(new THREE.PlaneGeometry(HJ,H),cloth);stripB.position.set(HJ/2,0,-T/2+TB/2-TB/2+.0004);stripB.rotation.y=Math.PI;group.add(stripB);
 // page block (static shell while closed): head/tail/fore-edge show the page lines
 const blockMats=[edgeXm,edgeXm,edgeY,edgeY,darkTop,darkTop];
 const closedBlock=new THREE.Mesh(new THREE.BoxGeometry(DP,HP,TP),blockMats);closedBlock.position.set(HJ+DP/2,0,0);closedBlock.castShadow=closedBlock.receiveShadow=true;group.add(closedBlock);
 // headband / tailband
 const bandMat=reg(new THREE.MeshStandardMaterial({map:bandTex(),roughness:.7}));
 for(const s of [-1,1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.0034,.0034,TP*.96,10),bandMat);b.rotation.x=Math.PI/2;b.position.set(.0036,s*(HP/2+.0012),0);b.castShadow=true;group.add(b);}
 // ribbon (hangs out of the tail, sways with the beat once open)
 const ribbon=new THREE.Group();ribbon.position.set(.028,-HP/2,-.006);group.add(ribbon);
 const rm=new THREE.Mesh(new THREE.PlaneGeometry(.012,.17,1,10),reg(new THREE.MeshStandardMaterial({color:0x9d2f2d,roughness:.4,side:THREE.DoubleSide,envMapIntensity:.9})));rm.position.y=-.085;rm.castShadow=true;ribbon.add(rm);
 // spine glow teaser (kept from v1; the shelf beat tell)
 const glowMat=new THREE.MeshBasicMaterial({color:0xffc88a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const glowMesh=new THREE.Mesh(new THREE.PlaneGeometry(.14,H*1.15),glowMat);glowMesh.rotation.y=-Math.PI/2;glowMesh.position.set(-.02,0,0);group.add(glowMesh);
 // underglow anchor (rig puts a pulsing light + decal here)
 const under=new THREE.Object3D();under.position.set(D*.45,-H/2-.01,0);group.add(under);

 // ---- open spread: sheet stacks, pages, turning sheets ---------------------------------------------------------------------
 const open=new THREE.Group();open.visible=false;group.add(open);
 const zBase=-T/2+TB+GAP;                                       // top of the back board's endpaper
 const stackR=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),blockMats),stackL=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),blockMats);
 for(const s of [stackR,stackL]){s.castShadow=s.receiveShadow=true;open.add(s);}
 const pageMat=(map:THREE.Texture,rough?:THREE.Texture)=>reg(new THREE.MeshStandardMaterial({map,roughnessMap:rough??null,roughness:rough?1:.9,normalMap:pNor,normalScale:new THREE.Vector2(.35,.35),envMapIntensity:.35}));
 const PWD=DP-.006,PHT=HP-.006;SPREAD.DP=DP;SPREAD.PWD=PWD;SPREAD.PHT=PHT;
 const lc=document.createElement('canvas');lc.width=1200;lc.height=1600;
 const leftMat=pageMat(ctex(lc));
 const rcC=document.createElement('canvas'),rcR=document.createElement('canvas');rcC.width=rcR.width=1200;rcC.height=rcR.height=1600;
 const rightMat=pageMat(ctex(rcC));
 const pageL=new THREE.Mesh(new THREE.PlaneGeometry(PWD,PHT),leftMat),pageR=new THREE.Mesh(new THREE.PlaneGeometry(PWD,PHT),rightMat);
 pageL.receiveShadow=pageR.receiveShadow=true;open.add(pageL,pageR);
 // turning sheets: plane bent about the gutter in the vertex shader (cylindrical curl, free edge trails)
 const sheetGeo=(flip:boolean)=>{const g=new THREE.PlaneGeometry(PWD,PHT,36,1);g.translate(PWD/2,0,0);if(flip){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));}return g;};
 const bend={uTheta:{value:0},uCurl:{value:0}};
 const bendMat=(map:THREE.Texture,side:THREE.Side,u:{uTheta:{value:number},uCurl:{value:number}})=>{
  const m=reg(new THREE.MeshStandardMaterial({map,side,roughness:.9,envMapIntensity:.3}));
  m.onBeforeCompile=sh=>{sh.uniforms.uTheta=u.uTheta;sh.uniforms.uCurl=u.uCurl;
   sh.vertexShader='uniform float uTheta,uCurl;\n'+sh.vertexShader
    .replace('#include <beginnormal_vertex>',`float kc=uCurl*sin(uTheta),ua=uTheta-kc*position.x;
     vec3 objectNormal=vec3(-sin(ua),0.,cos(ua));
     #ifdef USE_TANGENT
     vec3 objectTangent=vec3(cos(ua),0.,sin(ua));
     #endif`)
    .replace('#include <begin_vertex>',`float bx,bz;
     if(abs(kc)<1e-4){bx=position.x*cos(uTheta);bz=position.x*sin(uTheta);}
     else{bx=(sin(uTheta)-sin(ua))/kc;bz=(cos(ua)-cos(uTheta))/kc;}
     vec3 transformed=vec3(bx,position.y,bz+position.z);`);};
  return m;};
 type Sheet={u:{uTheta:{value:number},uCurl:{value:number}},grp:THREE.Group};
 const sheets:Sheet[]=[];
 const kinds:Array<['title'|'text'|'blank','text'|'blank']>=[['title','text'],['text','blank'],['text','text'],['text','text']];
 for(let i=0;i<NS;i++){
  const u={uTheta:{value:0},uCurl:{value:0}},grp=new THREE.Group();
  const fm=bendMat(sheetTex(kinds[i][0],i+3),THREE.FrontSide,u),bm=bendMat(i===NS-1?leftMat.map as THREE.Texture:sheetTex(kinds[i][1],i+9),THREE.BackSide,u);   // the last sheet's back IS the left page
  const a=new THREE.Mesh(sheetGeo(false),fm),b=new THREE.Mesh(sheetGeo(true),bm);a.frustumCulled=b.frustumCulled=false;grp.add(a,b);
  grp.position.x=HJ;open.add(grp);sheets.push({u,grp});}
 const anchorL=new THREE.Object3D();open.add(anchorL);
 let traceObj:Trace|null=null;
 const attach=(e:Ecg)=>{
  const lg=lc.getContext('2d')!;drawLeftPage(lg);(leftMat.map as THREE.Texture).needsUpdate=true;
  drawEcgPlate(rcC.getContext('2d')!,rcR.getContext('2d')!,e);(rightMat.map as THREE.Texture).needsUpdate=true;
  const rr=ctex(rcR,false);rightMat.roughnessMap=rr;rightMat.roughness=1;rightMat.metalness=0;rightMat.needsUpdate=true;
  traceObj=makeTrace(e,{lift:0,pageW:1200});traceObj.group.scale.set(PWD/1200,-PHT/1600,1);
  traceObj.group.position.set(HJ+DP*0+(HJ*0)+.003,PHT/2,0);open.add(traceObj.group);};

 const sw=(a:number)=>Math.sin(a);
 return{group,anchorL,cover,ribbon,under,materials:mats,attach,
  trace:o=>{traceObj?.update(o);},
  glow:v=>{glowMat.opacity=v;},
  set:({open:op,turn,beat,time})=>{
   const o=smooth(op),isOpen=o>.001;
   closedBlock.visible=!isOpen;open.visible=isOpen;
   // cover: swings about the hinge to the left; the hinge drops from the front plane to the back plane while it opens
   cover.rotation.y=-Math.PI*o;cover.position.z=THREE.MathUtils.lerp(T/2-TB/2,-T/2+TB/2,smooth(o*1.15));
   // open: the spine arch turns to lie BEHIND the gutter (convex toward −z) instead of standing in front of the left page
   {const so=smooth(o*1.1);spineGrp.rotation.y=-Math.PI/2*so;spineGrp.position.set(HJ*so,0,(-T/2+TB)*so);strip.visible=stripB.visible=so<.5;}
   // joint strip bridges the spine arc end (0, +R) to the moving hinge
   {const ax=0,az=R,bx=HJ,bz=cover.position.z,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);strip.scale.x=len;strip.position.set((ax+bx)/2,0,(az+bz)/2+.0004);strip.rotation.y=-Math.atan2(dz,dx);}
   if(isOpen){
    // stacks: the first NS sheets leave the right stack for the left one; the rest keep their volume split by `turn`
    const tt=Math.max(0,Math.min(1,turn)),moved=.22*tt;           // fraction of the block that has moved to the left
    const tr=TP*(1-moved),tlft=TP*moved;
    stackR.scale.set(DP,HP,Math.max(tr,1e-4));stackR.position.set(HJ+DP/2,0,zBase+tr/2);
    stackL.scale.set(DP,HP,Math.max(tlft,1e-4));stackL.position.set(HJ-DP/2,0,zBase+tlft/2);stackL.visible=tlft>.0006;
    const zR=zBase+tr+.0004,zL=zBase+tlft+.0004;
    pageR.position.set(HJ+DP/2,0,zR);pageL.position.set(HJ-DP/2,0,zL);anchorL.position.set(HJ-DP/2,0,zL+.0006);
    // left page exists once any stack is on the left or the cover lies down (endpaper side)
    pageL.visible=tlft>.0006;
    for(let i=0;i<NS;i++){
     const k=sheets[i],p=smooth((tt*(1+.18*(NS-1))-i*.18)),th=Math.PI*p,zt=THREE.MathUtils.lerp(zR+(NS-1-i)*.00055,zL+i*.00055,smooth(p));
     k.u.uTheta.value=th;k.u.uCurl.value=1.7*sw(Math.min(Math.PI,th))*(1-.25*i/NS);k.grp.position.set(HJ,0,zt);k.grp.visible=p<.999?true:true;
    }
    // sheets lying on the left stack are the stack's top; hide the flat left page under the last sheet
    if(traceObj)traceObj.group.position.z=zR+.0006;
   }
   ribbon.rotation.z=Math.sin(time*2.1)*.05+beat*.18*o;
  }};
}
