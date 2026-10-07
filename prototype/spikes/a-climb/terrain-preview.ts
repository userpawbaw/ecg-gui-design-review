import * as THREE from 'three';
import {createRegionalTerrain} from './terrain-regional';
async function start(){
 const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas')!,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x253947);const camera=new THREE.PerspectiveCamera(47,1,.05,500),region=await createRegionalTerrain(renderer);scene.add(region.group);
 const sun=new THREE.DirectionalLight(0xffe0b8,3);sun.position.set(-67,28,-70);scene.add(sun,new THREE.HemisphereLight(0xb8d4ed,0x3c4142,1.2));sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:250});sun.shadow.normalBias=.06;
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
 const poses=[new THREE.Vector3(35,45,70),new THREE.Vector3(18,14,25),new THREE.Vector3(10,6,16)];let smooth=0,lastUpdate=0;
 function frame(t:number){const p=Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));smooth+=(p-smooth)*.075;const q=smooth*2,i=Math.min(1,Math.floor(q)),v=q-i;camera.position.lerpVectors(poses[i],poses[i+1],v);camera.lookAt(0,1.8,-v);camera.updateMatrixWorld();region.update(camera,innerHeight*renderer.getPixelRatio());renderer.render(scene,camera);
  if(t-lastUpdate>250){document.getElementById('metrics')!.textContent=JSON.stringify(region.state(),null,2);lastUpdate=t;}requestAnimationFrame(frame);
 }document.querySelectorAll<HTMLButtonElement>('button[data-p]').forEach(b=>b.onclick=()=>scrollTo(0,Number(b.dataset.p)*(document.documentElement.scrollHeight-innerHeight)));
 document.getElementById('save')!.onclick=async()=>{renderer.render(scene,camera);const shot=smooth<.25?'broad':smooth<.75?'approach':'ridge';const r=await fetch('/__cloud_review_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({round:'terrain-lod',shot,image:renderer.domElement.toDataURL('image/png'),meta:{...region.state(),camera:camera.position.toArray(),progress:smooth,renderer:renderer.info.render,viewport:[innerWidth,innerHeight]}})});if(!r.ok)throw Error('capture save '+r.status);document.getElementById('save')!.textContent='저장됨';};
 (window as any).__terrain={region,camera,renderer,scene};requestAnimationFrame(frame);addEventListener('pagehide',()=>{region.dispose();renderer.dispose();},{once:true});
}start().catch(e=>{document.getElementById('metrics')!.textContent=String(e);});
