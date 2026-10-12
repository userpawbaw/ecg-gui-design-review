// D135 fixed-light, multi-elevation impostor. Not a runtime volume or measured weather.
import * as THREE from 'three';
import {Effect,BlendFunction} from 'postprocessing';
const fragment=`
uniform sampler2D atlas45,atlas32,atlas20;
uniform mat4 inverseProjection;
uniform mat3 viewRotation;
uniform vec3 eye;
uniform float amount;
vec4 atlasAt(vec2 uv,float el){
 vec4 a=texture2D(atlas20,uv),b=texture2D(atlas32,uv),c=texture2D(atlas45,uv);
 // Premultiplied blend avoids different silhouettes leaving dark transition edges.
 a.rgb*=a.a;b.rgb*=b.a;c.rgb*=c.a;
 return el<32.?mix(a,b,smoothstep(20.,32.,el)):mix(b,c,smoothstep(32.,45.,el));
}
vec4 cluster(vec3 ray,vec3 centre,float width){
 vec3 n=normalize(eye-centre),right=normalize(cross(vec3(0.,1.,0.),n)),up=cross(n,right);
 float den=dot(ray,n);if(den>-.0001)return vec4(0.);
 float t=dot(centre-eye,n)/den;if(t<0.)return vec4(0.);
 vec3 delta=eye+ray*t-centre;vec2 uv=vec2(dot(delta,right)/width,dot(delta,up)/(width*.75))+.5;
 if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec4(0.);
 float el=degrees(asin(clamp(n.y,-1.,1.)));
 vec4 c=atlasAt(uv,el);
 float edge=smoothstep(0.,.015,min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y)));
 // Artistic far haze attenuation only; actual atmosphere lighting is already baked.
 float haze=mix(.96,.70,smoothstep(180000.,950000.,t));
 return c*(edge*haze*amount);
}
void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
 if(amount<.0001){outputColor=inputColor;return;}
 vec4 v=inverseProjection*vec4(uv*2.-1.,1.,1.);vec3 ray=normalize(viewRotation*(v.xyz/v.w));
 vec4 farCloud=cluster(ray,vec3(28000.,10800.,-40000.),50000.);
 vec4 nearCloud=cluster(ray,vec3(-15000.,10800.,-16000.),80000.);
 vec4 c=nearCloud+farCloud*(1.-nearCloud.a);
 outputColor=vec4(inputColor.rgb*(1.-c.a)+c.rgb,inputColor.a);
}`;
export class DisneyAtlasEffect extends Effect{
 constructor(){super('DisneyAtlasEffect',fragment,{blendFunction:BlendFunction.NORMAL,uniforms:new Map<string,THREE.Uniform>([
 ['atlas45',new THREE.Uniform(null)],['atlas32',new THREE.Uniform(null)],['atlas20',new THREE.Uniform(null)],['inverseProjection',new THREE.Uniform(new THREE.Matrix4())],['viewRotation',new THREE.Uniform(new THREE.Matrix3())],['eye',new THREE.Uniform(new THREE.Vector3())],['amount',new THREE.Uniform(0)]])});}
 async load(){for(const elevation of [45,32,20]){
  const url=new URL(`./assets/disney-atlas/atlas-e${elevation}.png`,import.meta.url).href;
  const texture=await new THREE.TextureLoader().loadAsync(url);texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.generateMipmaps=true;
  this.uniforms.get(`atlas${elevation}`)!.value=texture;
 }}
 sync(camera:THREE.PerspectiveCamera,p:number,on:boolean){
  this.uniforms.get('inverseProjection')!.value.copy(camera.projectionMatrixInverse);
  this.uniforms.get('viewRotation')!.value.setFromMatrix4(camera.matrixWorld);this.uniforms.get('eye')!.value.copy(camera.position);
  // Already present at the far frame; continuous removal before near traversal, never scroll-spawned.
  this.uniforms.get('amount')!.value=on?1-THREE.MathUtils.smoothstep(p,.245,.285):0;
 }
 state(){return {technique:'fixed-light multi-elevation billboard impostor; not runtime volume',elevations:[45,32,20],atlasSize:[1024,768],clusters:[{centreMetres:[-15000,10800,-16000],widthMetres:80000},{centreMetres:[28000,10800,-40000],widthMetres:50000}],amount:this.uniforms.get('amount')!.value,fixedSun:{elevation:15,azimuth:0},sourceHeightScale:.28,ambientRgb:[.23,.23,.25],nearTraversal:false,shadow:false,display:'baked AgX +1EV sRGB decoded; composited after tone mapping',nominalRGBA8MipMiB:12};}
}
