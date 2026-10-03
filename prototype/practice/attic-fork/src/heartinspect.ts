// Inspect the point-cloud heart (HRA, CC BY 4.0): projections along each axis, to choose the front axis for the paper-cut layers.
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
(async()=>{
 const g=await new GLTFLoader().loadAsync('./assets/heart.glb');let pos:Float32Array|null=null;
 g.scene.traverse(o=>{const p=o as any;if(p.geometry&&p.geometry.attributes.position)pos=p.geometry.attributes.position.array;});
 if(!pos)return;const P=pos as Float32Array,n=P.length/3,S=300,out=document.getElementById('o')!;
 for(const [ax,u,v] of [['x',1,2],['y',0,2],['z',0,1]] as [string,number,number][]){
  const c=document.createElement('canvas');c.width=c.height=S;const ctx=c.getContext('2d')!;ctx.fillStyle='#111';ctx.fillRect(0,0,S,S);ctx.fillStyle='#e9b4a0';
  for(let i=0;i<n;i++){const a=P[i*3+u],b=P[i*3+v];ctx.fillRect(S/2+a/.09*S/2,S/2-b/.09*S/2,1.5,1.5);}
  ctx.fillStyle='#fff';ctx.fillText('project along '+ax+' (horizontal='+'xyz'[u]+' vertical='+'xyz'[v]+')',6,14);out.appendChild(c);
 }
})();
