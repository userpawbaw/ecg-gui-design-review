// D112: camera-only candidate. Fixed weather, footprint, density and cloud height.
import * as THREE from 'three';
// Fixed, asymmetric macro envelope over the borrowed weather detail. Baked once,
// sampled by the same globe UV at every altitude; no scroll-spawned cloud volume.
export function bakeHandoffWeather(renderer:THREE.WebGLRenderer,source:THREE.Texture,toECEF:THREE.Matrix4){
 const n=new THREE.Vector3(12000,8200,-4000).applyMatrix4(toECEF).normalize(),f=new THREE.Vector3(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z));
 let mx:number,my:number;
 if(f.y>Math.max(f.x,f.z)){mx=n.y>0?-n.x:n.x;my=n.z;}else if(f.x>Math.max(f.y,f.z)){mx=n.x>0?n.y:-n.y;my=n.z;}else{mx=n.x;my=n.z>0?n.y:-n.y;}
 const q=-2*mx*mx+2*my*my-3,u=Math.sqrt(Math.max(0,1.5+mx*mx-my*my-.5*Math.sqrt(-24*mx*mx+q*q)))*Math.sign(mx),v=Math.sqrt(6/(3-u*u))*my;
 const anchor=new THREE.Vector2(((u*.5+.5)*9)%1,((v*.5+.5)*9)%1);
 const target=new THREE.WebGLRenderTarget(2048,2048,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});target.texture.wrapS=target.texture.wrapT=THREE.RepeatWrapping;
 const material=new THREE.ShaderMaterial({uniforms:{source:{value:source},anchor:{value:anchor}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 p;uniform sampler2D source;uniform vec2 anchor;
 float band(vec2 centre,vec2 scale,float angle){vec2 d=fract(p-centre+.5)-.5;mat2 r=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));d=r*d;d.x+=.028*sin(d.y*22.);return 1.-smoothstep(.65,1.3,length(d/scale));}
 void main(){float e=max(band(anchor,vec2(.20,.065),.35),max(band(anchor+vec2(.32,.24),vec2(.26,.085),-.65),band(anchor+vec2(-.29,-.26),vec2(.23,.075),.65)));vec4 w=texture2D(source,p*6.);gl_FragColor=vec4(w.rg*e,w.b*(.20+.80*e),w.a);}`});
 const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));const old=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(scene,new THREE.Camera());renderer.setRenderTarget(old);(scene.children[0] as THREE.Mesh).geometry.dispose();material.dispose();
 return {target,anchor:anchor.toArray(),sourceRepeat:54,macroRepeat:9,role:'fixed macro bands × borrowed local weather; all camera heights'};
}
export const handoffFrames=[
 {p:.18,name:'북유럽 광역',pos:[220,820,650],look:[0,0,0]},
 {p:.235,name:'지역 확대',pos:[55,100,150],look:[0,1.8,0]},
 {p:.300,name:'구름 접근',pos:[15.52,11.40,22.21],look:[0,3.10,-.31]},
 {p:.365,name:'구름 아래 빛 커튼',pos:[0,7,1],look:[0,7,-4]},
 {p:.387,name:'가장자리 진입',pos:[6,8.15,-1],look:[12,8.4,-4]},
 {p:.410,name:'구름 내부 가림 시험',pos:[12,8.2,-4],look:[15,8.15,-6]},
];
export function handoffCamera(p:number,camera:THREE.PerspectiveCamera){
 const i=Math.max(0,Math.min(handoffFrames.length-2,handoffFrames.findIndex((a,j)=>j<handoffFrames.length-1&&p>=a.p&&p<handoffFrames[j+1].p)));
 const a=p>=.410?handoffFrames.at(-2)!:handoffFrames[i],b=p>=.410?handoffFrames.at(-1)!:handoffFrames[i+1];
 const t=THREE.MathUtils.smoothstep(p,a.p,b.p);
 camera.position.lerpVectors(new THREE.Vector3(...a.pos),new THREE.Vector3(...b.pos),t);
 const target=new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look),t);
 camera.near=Math.max(.05,camera.position.y*.025);camera.far=65000;camera.fov=THREE.MathUtils.lerp(36,47,THREE.MathUtils.smoothstep(p,.18,.265));camera.clearViewOffset();camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 return {stage:a.name,next:b.name,mix:t,archiveCutAllowed:false};
}
// Read the original resolved cloud+haze overlay alpha; no terrain pixels or added fog.
export function cloudCoverProbe(renderer:THREE.WebGLRenderer){
 const target=new THREE.WebGLRenderTarget(32,18,{depthBuffer:false});
 const material=new THREE.ShaderMaterial({uniforms:{map:{value:null}},vertexShader:'varying vec2 uvOut;void main(){uvOut=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'varying vec2 uvOut;uniform sampler2D map;void main(){float a=texture2D(map,uvOut).a;gl_FragColor=vec4(a,a,a,1.);}'});
 const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));const camera=new THREE.Camera(),bytes=new Uint8Array(32*18*4);
 return (texture:THREE.Texture|null)=>{if(!texture)return null;material.uniforms.map.value=texture;const old=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,32,18,bytes);renderer.setRenderTarget(old);let sum=0,min=1,opaque=0;for(let i=0;i<bytes.length;i+=4){const v=bytes[i]/255;sum+=v;min=Math.min(min,v);if(v>=.95)opaque++;}return {size:[32,18],meanAlpha:sum/(32*18),minAlpha:min,opaqueFraction:opaque/(32*18),fullOcclusion:opaque/(32*18)>=.98};};
}
