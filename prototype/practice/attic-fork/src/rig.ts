// Lighting rig + post stack for the hero book (IDEA-R1-SPACE-FORK §6.3-2 "빛이 이야기를 한다"; docs/uiux_system/26 §4).
// The room is baked and unlit, so these lights only touch the PBR book (and heart): they are the book's own light story.
//   key   : one slit of light through the blinds (spot + slat cookie) — the book is pulled out of the shelf's shadow into it
//   lamp  : warm fill from the pendant lamp (breathes on R, Ha)
//   rim   : thin cool edge light from behind, outlines the boards
//   under : indirect light beneath the book, pulses with the beat (amber → mint as the noise clears)
//   catch : shadow catchers on the shelf board / back wall + a contact blob while it sits on the shelf
// Post: bloom (threshold above 1, so only HDR highlights and the additive trace glow) → vignette + grain → output.
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

export function blindsCookie(){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d')!;g.fillStyle='#000';g.fillRect(0,0,512,512);
 g.filter='blur(3px)';g.fillStyle='#fff';for(let y=-14;y<540;y+=46)g.fillRect(0,y,512,24);g.filter='none';
 const r=g.createRadialGradient(256,256,70,256,256,290);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.95)');g.fillStyle=r;g.fillRect(0,0,512,512);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;return t;
}
function envScene(){
 // tiny studio-in-an-attic for reflections: dark room, one warm window panel, one amber lamp, a cool bounce
 const s=new THREE.Scene(),room=new THREE.Mesh(new THREE.BoxGeometry(20,12,20),new THREE.MeshBasicMaterial({color:0x17120d,side:THREE.BackSide}));s.add(room);
 const panel=(w:number,h:number,col:number,k:number,p:[number,number,number])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);s.add(m);};
 panel(5,3.4,0xfff0d6,9,[-7,4,6]);panel(1.6,1.6,0xffb36b,5,[7,2,-5]);panel(8,1.2,0x7d93c9,1.2,[0,-3,8]);panel(10,10,0x2a2f46,.5,[0,8,0]);
 return s;
}
const VG={uniforms:{tDiffuse:{value:null as THREE.Texture|null},uTime:{value:0},uVig:{value:.7},uGrain:{value:.018}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uVig,uGrain;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+uTime)*43758.5453);}
 void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 q=vUv-.5;q.x*=1.1;float v=smoothstep(.95,.25,length(q)*1.25);c.rgb*=mix(1.-uVig,1.,v);
  float n=(h(vUv*vec2(1920.,1080.))+h(vUv*vec2(1311.,977.)+3.1))*.5-.5;c.rgb+=n*uGrain*(.4+.6*(1.-c.r));gl_FragColor=c;}`};

export type RigState={night:number,warm:number,lamp:number,beat:number,mix:number,pull:number,show:number,time:number,book:THREE.Object3D,under:THREE.Object3D,shelfY:number};
export function makeRig(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,opts:{post:boolean,shadow:boolean}){
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(envScene(),.04).texture;scene.environmentIntensity=.8;
 // key: window slit
 const key=new THREE.SpotLight(0xffe3b8,0,12,.21,.5,1.6);key.position.set(9.9,.55,2.5);key.target.position.set(7.62,-1.6,.2);key.map=blindsCookie();
 key.castShadow=opts.shadow;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.012;key.shadow.camera.near=.5;key.shadow.camera.far=9;
 scene.add(key,key.target);
 // lamp fill (warm pendant), rim (cool), hemisphere floor
 const lamp=new THREE.PointLight(0xffb36b,0,7,1.6);lamp.position.set(8.4,-.5,-1.9);scene.add(lamp);
 const rim=new THREE.DirectionalLight(0x9db8ff,0);rim.position.set(5.5,1.4,-2.4);rim.target.position.set(7.6,-1.6,.2);scene.add(rim,rim.target);
 const hemi=new THREE.HemisphereLight(0x44506f,0x1a1208,.0);scene.add(hemi);
 // under-book light + glow sprite
 const under=new THREE.PointLight(0xffb36b,0,1.0,2);scene.add(under);
 const dotC=document.createElement('canvas');dotC.width=dotC.height=128;const dg=dotC.getContext('2d')!;const gr=dg.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');dg.fillStyle=gr;dg.fillRect(0,0,128,128);
 const dotT=new THREE.CanvasTexture(dotC);
 const usp=new THREE.Sprite(new THREE.SpriteMaterial({map:dotT,color:0xffb36b,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));usp.renderOrder=3;scene.add(usp);
 // shadows: the room is baked/unlit, so the book's shadow is a soft blob projected along the key light onto the shelf fronts,
 // plus a contact blob on the shelf board while the book still sits there (ShadowMaterial catchers lit up outside the spot cone)
 const mkBlob=(w:number,h:number,r0:number)=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!;const q=g.createRadialGradient(64,64,r0,64,64,64);q.addColorStop(0,'rgba(0,0,0,.85)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(0,0,128,128);
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,toneMapped:false,opacity:0}));};
 const wallShadow=mkBlob(.9,1.0,20);wallShadow.rotation.y=Math.PI/2;wallShadow.renderOrder=2;scene.add(wallShadow);
 const blob=mkBlob(.5,.34,10);blob.rotation.x=-Math.PI/2;scene.add(blob);
 // post
 let composer:EffectComposer|null=null,bloom:UnrealBloomPass|null=null,vg:ShaderPass|null=null;
 if(opts.post){
  const size=renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt=new THREE.WebGLRenderTarget(size.x,size.y,{type:THREE.HalfFloatType,samples:4});
  composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(size.x,size.y),.5,.7,1.0);composer.addPass(bloom);
  vg=new ShaderPass(VG);composer.addPass(vg);composer.addPass(new OutputPass());
 }
 const wp=new THREE.Vector3(),tmp=new THREE.Color();
 const AMB=new THREE.Color(0xffb36b),MNT=new THREE.Color(0x67e7c3),MOON=new THREE.Color(0xa9c0ff),SUN=new THREE.Color(0xffd9a0),DAY=new THREE.Color(0xfff1da);
 return{
  resize(w:number,h:number,dpr:number){composer?.setPixelRatio(dpr);composer?.setSize(w,h);},
  render(s:RigState){
   // key: moonlight at night, gold at dawn, neutral by day; it exists for the presented book only (shelf stays in shadow)
   const k=s.show;tmp.copy(DAY).lerp(SUN,s.warm).lerp(MOON,s.night);key.color.copy(tmp);
   key.intensity=k*(14+16*(1-s.night*.5)+8*s.warm);
   lamp.intensity=(.8+2.4*s.lamp)*(1+.55*s.beat)*(.4+.6*s.show);
   rim.intensity=k*(.5+1.6*s.night)*.9;hemi.intensity=.45+.35*s.night;
   scene.environmentIntensity=.7+.5*(1-s.night*.5);
   // under-book indirect light: pulses with the beat; amber while noisy → mint as the noise clears
   s.under.getWorldPosition(wp);under.position.set(wp.x+.05,wp.y-.07,wp.z);usp.position.set(wp.x+.02,wp.y-.02,wp.z);
   under.color.copy(AMB).lerp(MNT,s.mix);(usp.material as THREE.SpriteMaterial).color.copy(under.color);
   const e=s.beat;under.intensity=(.08+.32*e)*(.4+.6*s.show)*(.5+.5*s.lamp);
   usp.scale.set(1.1+.3*e,.45+.15*e,1);(usp.material as THREE.SpriteMaterial).opacity=(.28+.62*e)*(.3+.7*s.show);
   // shadow blobs: contact blob on the shelf, soft wall shadow along the key light direction
   blob.position.set(6.62,s.shelfY+.003,-.05);(blob.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-s.pull*1.6);
   {s.book.getWorldPosition(wp);const d=key.target.position.clone().sub(key.position).normalize(),X=6.83,t=(X-wp.x)/d.x;
    wallShadow.position.set(X,wp.y+d.y*t,wp.z+d.z*t);wallShadow.scale.set(1+.25*Math.abs(t),1+.2*Math.abs(t),1);
    (wallShadow.material as THREE.MeshBasicMaterial).opacity=.5*Math.min(1,s.show*1.4)*(1-.3*s.night);}
   if(vg){vg.uniforms.uTime.value=(s.time*7.13)%100;}
   if(composer)composer.render();else renderer.render(scene,camera);
  },
  setBloom(strength:number,threshold:number){if(bloom){bloom.strength=strength;bloom.threshold=threshold;}},
  key,lamp,rim,under,usp,get composer(){return composer;}
 };
}
