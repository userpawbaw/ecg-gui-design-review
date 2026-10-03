// The page world: what the book opens onto (our own scene, own lighting — the seam from the baked original is hidden by the book).
//  right page = ECG paper with the STORED trace sweeping (input → output cross-fade as the noise clears)
//  left page  = Hb: the anatomical heart as stacked paper cut-outs that pops up and beats on the stored R peaks
//  light      = one warm lamp (pulses on R: Ha) + the dawn sun through blinds (cookie), added as the noise clears
// Data contract: waveform = stored samples at their stored time (250 Hz); heart/lamp are functions of the same clock.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {type Ecg,pulse,idxAt} from './ecg';
import {HA} from './lamps';
import {PAGE_W,PAGE_H,drawLeftPage,drawEcgPaperStatic} from './paper';
import {makeTrace} from './trace';

const W=1.5,HP=2.0;                 // page width / height (scene units)
const WIN=4;                        // seconds across the right page
const FONT='"Pretendard","Malgun Gothic","Apple SD Gothic Neo",sans-serif',MONO='"IBM Plex Mono",ui-monospace,Consolas,monospace';
export type PWState={t:number,prog:number,mix:number,sun:number,px:number,py:number};
export type PageWorld={resize:()=>void,render:(s:PWState)=>void,finish:()=>void};

const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function canvasTex(w:number,h:number,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return{c,g:c.getContext('2d')!,t};}

function woodTexture(){
 const {c,g,t}=canvasTex(1024,1024);g.fillStyle='#2b1d13';g.fillRect(0,0,1024,1024);
 for(let i=0;i<260;i++){const y=Math.random()*1024;g.strokeStyle=`rgba(${60+Math.random()*40},${35+Math.random()*25},${18+Math.random()*14},${.12+Math.random()*.2})`;g.lineWidth=.6+Math.random()*2.2;g.beginPath();g.moveTo(0,y);
  for(let x=0;x<=1024;x+=64)g.lineTo(x,y+Math.sin(x*.01+i)*4+Math.random()*1.5);g.stroke();}
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;
}

function leftPage(){const {c,g,t}=canvasTex(1200,1600);drawLeftPage(g);t.needsUpdate=true;return t;}
function ecgPage(ecg:Ecg){const {c,g,t}=canvasTex(1200,1600);drawEcgPaperStatic(g,ecg);t.needsUpdate=true;return{tex:t};}

// anatomical point cloud (HRA, CC BY 4.0) → N depth layers of paper cut-outs. Layer k = silhouette of all points with z ≥ z_k
// (back layers large, front layers small), mask closed by blur+threshold.
export async function paperHeart():Promise<{group:THREE.Group,layers:THREE.Mesh[],height:number}>{
 const g=await new GLTFLoader().loadAsync('./assets/heart.glb');let P:Float32Array|null=null;
 g.scene.traverse(o=>{const m=o as any;if(!P&&m.geometry?.attributes?.position)P=m.geometry.attributes.position.array;});
 if(!P)throw Error('heart points missing');const pts=P as Float32Array,n=pts.length/3;
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;
 for(let i=0;i<n;i++){const x=pts[i*3],y=pts[i*3+1],z=pts[i*3+2];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);z0=Math.min(z0,z);z1=Math.max(z1,z);}
 const N=18,S=512,pad=28,ext=Math.max(x1-x0,y1-y0),k=(S-2*pad)/ext,cx=(x0+x1)/2,cy=(y0+y1)/2;
 const height=.88,scale=height/(y1-y0),planeSize=S/k*scale,group=new THREE.Group(),layers:THREE.Mesh[]=[];
 for(let L=0;L<N;L++){
  const zk=z0+(z1-z0)*(L/(N+1));
  const a=document.createElement('canvas');a.width=a.height=S;const ag=a.getContext('2d')!;ag.fillStyle='#fff';
  for(let i=0;i<n;i++){if(pts[i*3+2]<zk)continue;ag.beginPath();ag.arc(S/2+(pts[i*3]-cx)*k,S/2-(pts[i*3+1]-cy)*k,3.4,0,6.3);ag.fill();}
  const b=document.createElement('canvas');b.width=b.height=S;const bg=b.getContext('2d')!;bg.filter='blur(7px)';bg.drawImage(a,0,0);
  const id=bg.getImageData(0,0,S,S);for(let i=0;i<S*S;i++){const v=id.data[i*4+3]>34?255:0;id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255;}
  bg.filter='none';bg.putImageData(id,0,0);const m=document.createElement('canvas');m.width=m.height=S;const mg=m.getContext('2d')!;mg.filter='blur(1.4px)';mg.drawImage(b,0,0);
  const alpha=new THREE.CanvasTexture(m);alpha.colorSpace=THREE.NoColorSpace;
  // colour: deep red at the back → warm coral at the front; alternate tone per layer (cardboard stripes) and a lighter cut edge
  const cc=document.createElement('canvas');cc.width=cc.height=S;const cg=cc.getContext('2d')!;const u=L/(N-1);
  const base=new THREE.Color(0x8f2f37).lerp(new THREE.Color(0xffb7a0),Math.pow(u,.8)).multiplyScalar(L%2?1:.9);
  const rg=cg.createRadialGradient(S*.45,S*.4,S*.05,S/2,S/2,S*.62);rg.addColorStop(0,'#'+base.clone().multiplyScalar(1.15).getHexString());rg.addColorStop(1,'#'+base.clone().multiplyScalar(.82).getHexString());
  cg.fillStyle=rg;cg.fillRect(0,0,S,S);
  {const cd=cg.getImageData(0,0,S,S),md=id.data,E=3;     // cut edge: mask pixels with an outside neighbour within E px get lighter
   for(let y=E;y<S-E;y++)for(let x=E;x<S-E;x++){const i=y*S+x;if(md[i*4]<128)continue;
    if(md[(i-E)*4]<128||md[(i+E)*4]<128||md[(i-E*S)*4]<128||md[(i+E*S)*4]<128){cd.data[i*4]=Math.min(255,cd.data[i*4]*1.28+14);cd.data[i*4+1]=Math.min(255,cd.data[i*4+1]*1.3+12);cd.data[i*4+2]=Math.min(255,cd.data[i*4+2]*1.28+10);}}
   cg.putImageData(cd,0,0);}
  const col=new THREE.CanvasTexture(cc);col.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:col,alphaMap:alpha,alphaTest:.5,side:THREE.DoubleSide,roughness:.9,metalness:0,emissive:0xffffff,emissiveMap:col,emissiveIntensity:.2});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(planeSize,planeSize),mat);
  mesh.position.z=(L-(N-1)/2)*.019;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);layers.push(mesh);
 }
 return{group,layers,height};
}

function blindsCookie(){
 const {c,g,t}=canvasTex(512,512,false);g.fillStyle='#000';g.fillRect(0,0,512,512);
 for(let y=-20;y<540;y+=46){g.fillStyle='#fff';g.fillRect(0,y,512,22);}
 const r=g.createRadialGradient(256,256,60,256,256,300);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.9)');g.fillStyle=r;g.fillRect(0,0,512,512);
 t.needsUpdate=true;return t;
}

export async function makePageWorld(canvas:HTMLCanvasElement,ecg:Ecg):Promise<PageWorld>{
 const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.shadowMap.enabled=!new URLSearchParams(location.search).has('noshadow');r.shadowMap.type=THREE.PCFShadowMap;
 r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x120e0a);scene.fog=new THREE.Fog(0x120e0a,5,12);
 const camera=new THREE.PerspectiveCamera(34,1,.05,40);

 // table
 const table=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshStandardMaterial({map:woodTexture(),roughness:.7}));
 table.rotation.x=-Math.PI/2;table.position.y=-.24;table.receiveShadow=true;scene.add(table);
 // book: cloth boards, page blocks, two curved pages
 const cloth=new THREE.MeshStandardMaterial({color:0x1f4a57,roughness:.85});
 const boards=new THREE.Mesh(new THREE.BoxGeometry(2*W+.16,.05,HP+.16),cloth);boards.position.y=-.2;boards.castShadow=boards.receiveShadow=true;scene.add(boards);
 const lineTex=(()=>{const {c,g,t}=canvasTex(64,256);g.fillStyle='#efe5d0';g.fillRect(0,0,64,256);for(let y=0;y<256;y+=2){g.fillStyle=`rgba(120,100,70,${.10+.12*Math.random()})`;g.fillRect(0,y,64,1);}t.needsUpdate=true;return t;})();
 for(const s of [-1,1]){const blk=new THREE.Mesh(new THREE.BoxGeometry(W,.14,HP),new THREE.MeshStandardMaterial({map:lineTex,roughness:.95}));blk.position.set(s*W/2,-.1,0);blk.castShadow=blk.receiveShadow=true;scene.add(blk);}
 const pageGeo=(side:number)=>{const g=new THREE.PlaneGeometry(W,HP,48,1);g.rotateX(-Math.PI/2);g.translate(side*W/2,0,0);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const u=Math.abs(p.getX(i))/W;p.setY(i,.06*(1-Math.pow(1-u,2.2)));}g.computeVertexNormals();return g;};
 const left=leftPage(),ecgp=ecgPage(ecg);
 const pl=new THREE.Mesh(pageGeo(-1),new THREE.MeshStandardMaterial({map:left,roughness:.95}));pl.receiveShadow=true;scene.add(pl);
 const pr=new THREE.Mesh(pageGeo(1),new THREE.MeshStandardMaterial({map:ecgp.tex,roughness:.95}));pr.receiveShadow=true;scene.add(pr);
 // stored trace on the curved right page (GPU): canvas px → world scale s, lifted by the page curve (0.06 at the outer edge)
 const trS=W/1200,trace=makeTrace(ecg,{lift:.06/trS,pageW:1200});trace.group.scale.setScalar(trS);trace.group.rotation.x=Math.PI/2;trace.group.position.set(0,.004,-HP/2);scene.add(trace.group);
 // heart: paper cut-outs hinged at the bottom edge of the left page centre
 const heart=await paperHeart();
 const hinge=new THREE.Group();hinge.position.set(-W/2,.035,.55);scene.add(hinge);
 heart.group.position.y=heart.height/2;hinge.add(heart.group);
 // paper foot (the glued tab)
 const foot=new THREE.Mesh(new THREE.BoxGeometry(.55,.012,.07),new THREE.MeshStandardMaterial({color:0xe8d9bd,roughness:.95}));foot.position.set(-W/2,.04,.55);foot.castShadow=foot.receiveShadow=true;scene.add(foot);
 // bookmark ribbon on the table
 const ribbon=new THREE.Mesh(new THREE.PlaneGeometry(.05,.9),new THREE.MeshStandardMaterial({color:0x9d3b35,roughness:.8,side:THREE.DoubleSide}));
 ribbon.rotation.x=-Math.PI/2;ribbon.position.set(.18,-.19,HP/2+.42);ribbon.receiveShadow=true;scene.add(ribbon);

 // lights: warm lamp (pulses on R: Ha) + dawn sun through blinds (cookie) + soft fill
 scene.add(new THREE.HemisphereLight(0xb8c4e8,0x3b2a1c,.55));
 const lamp=new THREE.SpotLight(0xffc386,60,14,.95,.75,1.6);lamp.position.set(2.5,3.3,1.7);lamp.target.position.set(-.2,0,.1);
 lamp.castShadow=false; // shadow budget: only the sun casts (F-034)
 scene.add(lamp,lamp.target);
 const sunL=new THREE.SpotLight(0xffe0aa,0,16,.62,.18,1.2);sunL.position.set(-3.1,3.7,-1.6);sunL.target.position.set(-.1,0,.2);sunL.map=blindsCookie();
 sunL.castShadow=true;sunL.shadow.mapSize.set(1024,1024);sunL.shadow.bias=-.0006;scene.add(sunL,sunL.target);
 // dust motes in the light
 const N=520,pos=new Float32Array(N*3),seed=new Float32Array(N);for(let i=0;i<N;i++){seed[i]=Math.random()*100;pos[i*3]=(Math.random()-.5)*4.2;pos[i*3+1]=.1+Math.random()*2.0;pos[i*3+2]=(Math.random()-.5)*3.0;}
 const home=pos.slice(),dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const dot=(()=>{const {c,g,t}=canvasTex(64,64);const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,230,190,1)');gr.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);t.needsUpdate=true;return t;})();
 const dm=new THREE.PointsMaterial({map:dot,size:.035,color:0xffe3b8,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false});scene.add(new THREE.Points(dg,dm));

 const resize=()=>{r.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};resize();
 (window as any).__pw={scene,camera,hinge,heart,lamp,sunL,r,override:false};
 const tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3();
 return{resize,finish:()=>{const gl=r.getContext(),b=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,b);},render:({t,prog,mix,sun,px,py})=>{
  const beat=pulse(ecg,t,.28);
  // Hb: pop up (flat → upright with a small overshoot), beat = layers separate and the whole heart swells on each R
  const u=Math.max(0,Math.min(1,(prog-.18)/.55)),up=1+2.70158*Math.pow(u-1,3)+1.70158*Math.pow(u-1,2); // easeOutBack: a small overshoot toward the camera, then settles
  hinge.rotation.x=-(Math.PI/2)*(1-up)*.98;
  heart.layers.forEach((m,i)=>{const c=i-(heart.layers.length-1)/2;m.position.z=c*(.019+.008*HA*beat);});
  const sc=1+.07*HA*beat;heart.group.scale.set(sc,sc,sc);
  // Ha: lamp breathes on R, dawn sun fades in as the noise clears
  lamp.intensity=60*(1+.32*HA*beat)*(1-.25*sun);sunL.intensity=95*sun;
  const a=dg.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<N;i++){const s=seed[i];a.array[i*3]=home[i*3]+Math.sin(t*.2+s)*.16;a.array[i*3+1]=home[i*3+1]+Math.sin(t*.15+s*1.7)*.12+HA*beat*.05*Math.sin(s);a.array[i*3+2]=home[i*3+2]+Math.cos(t*.18+s)*.16;}
  a.needsUpdate=true;dm.size=.03+.02*HA*beat;dm.opacity=.45+.4*sun+.25*HA*beat;
  ribbon.rotation.z=Math.sin(t*1.7)*.02+beat*.05;
  // camera: straight down on the spread → tilts back to show the table, the pop-up and the light
  const k=smooth(prog*1.15);tmpA.set(THREE.MathUtils.lerp(0,.25,k),THREE.MathUtils.lerp(3.15,2.3,k),THREE.MathUtils.lerp(.0001,2.45,k));
  if(!(window as any).__pw.override){tmpA.x+=px*.18;tmpA.z+=py*.12;camera.position.copy(tmpA);tmpB.set(0,THREE.MathUtils.lerp(0,.18,k),THREE.MathUtils.lerp(0,-.12,k));camera.lookAt(tmpB);}
  trace.update({t,mix,glow:Math.min(1,beat*HA),flash:0});
  r.render(scene,camera);
 }};
}
