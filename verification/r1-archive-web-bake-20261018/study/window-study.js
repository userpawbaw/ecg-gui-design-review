import * as THREE from 'three';
import {subtractWorldBoxes} from './ceiling-apertures.js';

// Self-authored study kit; actual metres. No Story geometry or source GLB edits.
export function createWindowStudy(root,apertures){
 const opening={x:[-3.9,-3.34],y:[2.65,4.84],z:[-4.7,-2.05]},variants=[];
 root.updateWorldMatrix(true,true);
 const meshes=[];root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&['plaster','window_frame','blind_slat'].includes(o.material.name))meshes.push(o);});
 for(const mesh of meshes){
  const roof=apertures.changes.find(c=>c.mesh===mesh),original=roof?.original||mesh.geometry,cutRoof=roof?.cut||original;
  mesh.geometry=original;const windowOnly=subtractWorldBoxes(mesh,[opening]);mesh.geometry=cutRoof;const both=roof?subtractWorldBoxes(mesh,[opening]):windowOnly;mesh.geometry=cutRoof;
  variants.push({mesh,original,cutRoof,windowOnly,both});
 }
 const group=new THREE.Group();group.name='left_window_study';root.add(group);
 // Group authored in world coordinates, independent of GLB node transforms.
 group.matrix.copy(new THREE.Matrix4().copy(root.matrixWorld).invert());group.matrixAutoUpdate=false;
 const paint=new THREE.MeshStandardMaterial({color:0xc7bdab,roughness:.73}),metal=new THREE.MeshStandardMaterial({color:0x453c31,roughness:.62}),leafMat=new THREE.MeshStandardMaterial({color:0x69704b,roughness:.85,side:THREE.DoubleSide});
 const objects=[],frames=[];
 function add(geometry,material,position,kind){const mesh=new THREE.Mesh(geometry,material);mesh.position.fromArray(position);mesh.castShadow=mesh.receiveShadow=true;mesh.name='window_study_'+kind;group.add(mesh);(kind==='frame'?frames:objects).push(mesh);return mesh;}
 function bevelBox(w,h,d){const b=.003,shape=new THREE.Shape();shape.moveTo(-w/2+b,-h/2+b);shape.lineTo(w/2-b,-h/2+b);shape.lineTo(w/2-b,h/2-b);shape.lineTo(-w/2+b,h/2-b);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,steps:1,curveSegments:1});g.translate(0,0,-d/2+b);return g;}
 for(const y of [2.65,4.84])add(bevelBox(.2,.075,2.8),paint,[-3.56,y,-3.375],'frame');
 for(const z of [-4.7,-3.375,-2.05])add(bevelBox(.17,2.19,.065),paint,[-3.56,3.745,z],'frame');
 add(bevelBox(.17,.065,2.65),paint,[-3.56,3.72,-3.375],'frame');
 // Circular wrought-iron insert and a diagonal brace create curved + straight silhouettes.
 const ring=add(new THREE.TorusGeometry(.38,.018,8,48),metal,[-3.52,4.18,-3.92],'ring');ring.rotation.y=Math.PI/2;
 for(const [y,h]of [[4.70,.28],[3.76,.08]])add(bevelBox(.028,h,.028),metal,[-3.52,y,-3.92],'ring_hanger');
 const brace=add(bevelBox(.065,.065,Math.hypot(1.325,1.07)),metal,[-3.53,3.185,-2.7125],'brace');brace.rotation.x=-Math.atan2(1.07,1.325);
 // An outdoor branch, separated from receivers, makes a broad soft organic shadow.
 const points=[[-4.25,1.8,-4.95],[-4.15,3.15,-4.55],[-4.2,3.75,-4.1],[-4.3,4.25,-3.5],[-4.38,4.75,-2.9]].map(p=>new THREE.Vector3(...p));
 add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.016,6,false),metal,[0,0,0],'branch');
 for(let i=0;i<9;i++){
  const t=.13+i*.087,p=new THREE.CatmullRomCurve3(points).getPoint(t),side=i%2?1:-1;
  const shape=new THREE.Shape();shape.moveTo(0,-.19);shape.bezierCurveTo(.15,-.08,.17,.13,0,.25);shape.bezierCurveTo(-.14,.12,-.12,-.1,0,-.19);
  const leaf=add(new THREE.ShapeGeometry(shape,8),leafMat,[p.x,p.y+.05,p.z+side*.17],'leaf');leaf.rotation.set(.35*side,Math.PI/2,.6*side);
 }
 let enabled=false,props=true;const setRoof=apertures.setEnabled.bind(apertures);
 function apply(){setRoof(apertures.enabled);for(const v of variants)v.mesh.geometry=enabled?(apertures.enabled?v.both:v.windowOnly):(apertures.enabled?v.cutRoof:v.original);for(const f of frames)f.visible=enabled;for(const p of objects)p.visible=enabled&&props;}
 apertures.setEnabled=value=>{setRoof(value);apply();};
 apply();
 return {opening,group,objects,frames,variants,get enabled(){return enabled;},get props(){return props;},setEnabled(v){enabled=!!v;apply();},setProps(v){props=!!v;apply();},dispose(){const unused=new Set();for(const v of variants)for(const geometry of [v.original,v.cutRoof,v.windowOnly,v.both])if(geometry!==v.mesh.geometry)unused.add(geometry);for(const g of unused)g.dispose();}};
}
