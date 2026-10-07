// D098 / D085: native Cycles VDB plates, not procedural clouds or AI video.
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const smooth=(a:number,b:number,p:number)=>{const t=THREE.MathUtils.clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
export function createCloudPath(){
 const textures:THREE.Texture[]=[];let ready=false,disposed=false,fault:string|null=null,currentFrame=0,blend=0;
 const fallback=new THREE.DataTexture(new Uint8Array([160,169,179,255]),1,1);fallback.needsUpdate=true;
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},uCover:{value:0},uProgress:{value:0},uTime:{value:0},uAspect:{value:16/9},uA:{value:fallback},uB:{value:fallback},uMix:{value:0},uReady:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse,uA,uB;uniform float uAspect,uMix,uCover,uReady;
 void main(){vec3 bg=texture2D(tDiffuse,vUv).rgb;vec2 scale=uAspect>16./9.?vec2(1.,(16./9.)/uAspect):vec2(uAspect/(16./9.),1.);vec2 uv=(vUv-.5)*scale+.5;vec3 a=texture2D(uA,uv).rgb,b=texture2D(uB,uv).rgb;gl_FragColor=vec4(mix(bg,mix(a,b,uMix),uCover*uReady),1.);}`});
 const loader=new THREE.TextureLoader(),base=new URL('./north-earth/cloud-path/',document.baseURI);
 // All frames must be ready before this path activates; never show a distant substitute frame.
 Promise.all(Array.from({length:40},async(_,i)=>{const t=await loader.loadAsync(new URL(`${String(i).padStart(3,'0')}.webp`,base).href);t.colorSpace=THREE.NoColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=THREE.LinearFilter;if(disposed)t.dispose();else textures[i]=t;})).then(()=>{if(!disposed){ready=true;pass.uniforms.uReady.value=1;}}).catch(e=>{fault=String(e);console.warn('VDB path unavailable',e);});
 function prepare(p:number){if(!ready)return;const frame=THREE.MathUtils.clamp((p-.284)/(.365-.284),0,1)*39;currentFrame=Math.floor(frame);blend=frame-currentFrame;pass.uniforms.uA.value=textures[currentFrame];pass.uniforms.uB.value=textures[Math.min(39,currentFrame+1)];pass.uniforms.uMix.value=blend;}
 return {pass,prepare,cover:(p:number)=>smooth(.278,.284,p)*(1-smooth(.385,.445,p)),state:()=>({ready,loaded:textures.filter(Boolean).length,frames:40,currentFrame,blend,fault,render:'Cycles physical VDB path bake',decodedRGBABytes:40*960*540*4,maxTextureRGBABytes:40*960*540*4,freeCamera:false}),dispose(){disposed=true;textures.forEach(t=>t.dispose());fallback.dispose();pass.dispose();}};
}
