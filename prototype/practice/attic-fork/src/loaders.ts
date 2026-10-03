// Shared loaders for the local-only originals (public/_original). Same decoders as the original site.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
export const O='./_original/assets/';
export function makeLoaders(renderer:THREE.WebGLRenderer){
 const draco=new DRACOLoader().setDecoderPath(O+'models/draco/');
 const gltf=new GLTFLoader().setDRACOLoader(draco);
 const ktx=new KTX2Loader().setTranscoderPath(O+'basis/').detectSupport(renderer);
 const tex=async(url:string)=>{const t=await ktx.loadAsync(url);t.colorSpace=THREE.SRGBColorSpace;return t;};
 return{gltf,ktx,tex};
}
