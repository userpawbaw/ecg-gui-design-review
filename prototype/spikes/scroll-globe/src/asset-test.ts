import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {EXRLoader} from 'three/examples/jsm/loaders/EXRLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import Lenis from 'lenis';
import './style.css';
// Assets come from the repository asset database (assets/registry.json → assets/processed/).
import modelUrl from '../../../../assets/processed/model-waterbottle.glb?url';
import hdriUrl from '../../../../assets/processed/hdri-studio-512.exr?url';

const state={ready:false,speed:0,angle:0,velocity:0,frames:[] as number[]};(window as any).__assetTest=state;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=document.getElementById('gl') as HTMLCanvasElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x070809);
const camera=new THREE.PerspectiveCamera(30,1,.01,100);camera.position.set(0,0,1.25);
const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};addEventListener('resize',resize);resize();

const pivot=new THREE.Group();scene.add(pivot);
const [env,gltf]=await Promise.all([new EXRLoader().loadAsync(hdriUrl),new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl)]);
env.mapping=THREE.EquirectangularReflectionMapping;scene.environment=env;
const model=gltf.scene;const box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3()).length();
model.position.sub(box.getCenter(new THREE.Vector3()));pivot.scale.setScalar(.55/size);pivot.add(model);pivot.rotation.z=.18;
document.getElementById('credits')!.textContent='Model: WaterBottle © Microsoft, CC0 (Khronos glTF-Sample-Assets) · HDRI: @pmndrs/assets studio (Poly Haven selection, CC0)';

// Velocity-coupled rotation with damping and a non-zero idle speed (moto-card §14.2 model).
const BASE=reduced?0:.35, GAIN=reduced?0:.004, LAMBDA=3.5; // rad/s, rad per px, 1/s (τ≈0.29 s)
const lenis=reduced?null:new Lenis({lerp:.085});
document.getElementById('mode')!.textContent=reduced?'REDUCED MOTION':'LENIS + DAMPED SPIN';
let last=0;
renderer.setAnimationLoop(now=>{const dt=last?Math.min(.05,(now-last)/1000):0;if(last)state.frames.push(now-last);last=now;
 lenis?.raf(now);state.velocity=lenis?Math.abs(lenis.velocity)*60:0;           // px/s
 const target=BASE+GAIN*state.velocity;state.speed=THREE.MathUtils.damp(state.speed,target,LAMBDA,dt);
 state.angle+=state.speed*dt;pivot.rotation.y=state.angle;renderer.render(scene,camera);state.ready=true;});
