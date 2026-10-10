// D114: orbital-only 2.5D proxy. NASA luminance supplies shape, NOT measured density/height.
import * as THREE from 'three';
import {Effect,BlendFunction} from 'postprocessing';

const fragment=`
uniform sampler2D cloudMap, cloudDetailMap;
uniform float rawSource, detailAmount;
uniform mat4 inverseProjection;
uniform mat3 viewRotation, geographicRotation;
uniform vec3 eye, sunLocal;
uniform float relief, amount, coverageBoost;
uniform vec2 sourceCentre;
uniform float massMode, pixelAngle, lightContrast, whiteHighlight;
const float radius=6371000.;
const vec3 centre=vec3(0.,-6371000.,0.);
vec2 geoUV(vec3 n){
 vec3 g=geographicRotation*n;
 return vec2(atan(g.y,g.x)/6.28318530718+.5,asin(clamp(g.z,-1.,1.))/3.14159265359+.5);
}
// Fixed artistic placement of a satellite front; not today's northern weather.
float density(vec2 uv){
 vec2 source=(uv-vec2(.523333333,.842388889))*2.+sourceCentre;
 if(rawSource<.5)return texture2D(cloudMap,source).r;
 float coarse=texture2D(cloudMap,vec2(source.x,1.-source.y)).r;
 vec2 crop=(source-vec2(.375,.5625))/vec2(.5,.375);
 float edge=min(min(crop.x,1.-crop.x),min(crop.y,1.-crop.y));
 float fine=texture2D(cloudDetailMap,vec2(crop.x,1.-crop.y)).r;
 return mix(coarse,fine,detailAmount*smoothstep(0.,.05,edge));
}
float shell(vec3 ray,float h){
 vec3 o=eye-centre;float b=dot(o,ray),c=dot(o,o)-(radius+h)*(radius+h);
 float d=b*b-c;if(d<0.)return -1.;float t=-b-sqrt(d);return t>0.?t:-1.;
}
vec4 layer(vec3 ray,float h,float thick){
 float t=shell(ray,h);if(t<0.)return vec4(0.);
 vec3 n=normalize(eye+ray*t-centre);vec2 uv=geoUV(n);float d=density(uv);
 // Broad thin sheets remain translucent; only high coverage has an opaque top.
 float a=thick>.5?smoothstep(.48-coverageBoost,.90-coverageBoost*.5,d)*.94:smoothstep(.10-coverageBoost*.35,.70-coverageBoost*.35,d)*.06;
 vec3 geo=geographicRotation*n;
 vec3 e=normalize(vec3(-geo.y,geo.x,0.));vec3 north=normalize(cross(geo,e));
 float du=1./2048.,dv=1./1024.;
 float dx=(density(uv+vec2(du,0.))-density(uv-vec2(du,0.)));
 float dy=(density(uv+vec2(0.,dv))-density(uv-vec2(0.,dv)));
 // A bounded slope proxy: kilometres of relief are useful only in thick clusters.
 vec3 perturbed=normalize(geo-relief*thick*3.2*(dx*e+dy*north));
 vec3 sun=geographicRotation*sunLocal;
 float facing=max(0.,dot(perturbed,sun));
 float day=smoothstep(-.04,.16,dot(n,sunLocal));
 vec3 light=mix(vec3(.045,.065,.09),vec3(.32)+vec3(.68,.65,.59)*facing,day);
 float distanceHaze=1.-exp(-t/2200000.);
 light=mix(light,vec3(.30,.40,.53),distanceHaze*.35);
 // Radiance approximation composed after ground aerial lighting, before AGX.
 return vec4(light*.065,a*amount);
}
// D121: satellite-luminance authored height field, not measured cloud volume.
// Explicit footprint mip selection stays stable through divergent intersection steps.
float filteredDensity(vec2 uv,float footprint){
 vec2 source=(uv-vec2(.523333333,.842388889))*2.+sourceCentre;
 float coarse=textureLod(cloudMap,vec2(source.x,1.-source.y),max(0.,log2(footprint/9800.))).r;
 if(rawSource<.5)return textureLod(cloudMap,source,max(0.,log2(footprint/9800.))).r;
 vec2 crop=(source-vec2(.375,.5625))/vec2(.5,.375);
 float edge=min(min(crop.x,1.-crop.x),min(crop.y,1.-crop.y));
 float fine=textureLod(cloudDetailMap,vec2(crop.x,1.-crop.y),max(0.,log2(footprint/2450.))).r;
 return mix(coarse,fine,detailAmount*smoothstep(0.,.05,edge));
}
float cloudHeight(vec3 point,float footprint){
 float d=filteredDensity(geoUV(normalize(point-centre)),footprint);
 return 7000.+2400.*smoothstep(.48-coverageBoost,.94,d);
}
vec4 massLayer(vec3 ray){
 float front=shell(ray,9400.),back=shell(ray,7000.);
 if(front<0.||back<0.)return vec4(0.);
 float footprint=max(1400.,front*pixelAngle);
 // Ten deterministic brackets; no frame-random dithering or popping layer switch.
 for(int i=0;i<10;i++){
  float middle=(front+back)*.5;vec3 point=eye+ray*middle;
  if(length(point-centre)-radius>cloudHeight(point,footprint))front=middle;else back=middle;
 }
 float t=(front+back)*.5;vec3 point=eye+ray*t,n=normalize(point-centre);
 float d=filteredDensity(geoUV(n),footprint);
 float alpha=smoothstep(.48-coverageBoost,.90-coverageBoost*.5,d)*.94;
 vec3 east=normalize(cross(vec3(0.,0.,1.),n));vec3 north=normalize(cross(n,east));
 float delta=max(3000.,footprint);
 float dx=(cloudHeight(point+east*delta,footprint)-cloudHeight(point-east*delta,footprint))/(2.*delta);
 float dy=(cloudHeight(point+north*delta,footprint)-cloudHeight(point-north*delta,footprint))/(2.*delta);
 vec3 normal=normalize(n-east*dx-north*dy);
 float tau=0.;
 for(int i=1;i<=4;i++){
  vec3 lightPoint=point+sunLocal*(float(i)*1600.);
  float buried=cloudHeight(lightPoint,footprint)-(length(lightPoint-centre)-radius);
  tau+=smoothstep(-80.,550.,buried)*.5;
 }
 float facing=max(0.,dot(normal,sunLocal));float transmission=exp(-tau*mix(1.,1.65,lightContrast));
 float day=smoothstep(-.04,.16,dot(n,sunLocal));
 vec3 fill=mix(vec3(.25,.28,.33),vec3(.12,.15,.20),lightContrast);
 vec3 key=mix(vec3(.73,.70,.65),vec3(1.13,1.07,.97),lightContrast);
 vec3 lit=fill+key*facing*transmission;
 // Direct radiance increases independently: shadow fill and ground exposure stay fixed.
 vec3 radiance=fill*.065+key*facing*transmission*mix(.065,1.0,whiteHighlight);
 vec3 light=mix(vec3(.045,.065,.09)*.065,radiance,day);
 light=mix(light,vec3(.30,.40,.53)*.065,(1.-exp(-t/2200000.))*.35);
 return vec4(light,alpha*amount);
}
void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
 vec4 view=inverseProjection*vec4(uv*2.-1.,1.,1.);
 vec3 ray=normalize(viewRotation*(view.xyz/view.w));
 vec4 thin=layer(ray,12500.,0.);vec4 thick=massMode>.5?massLayer(ray):layer(ray,8500.,1.);
 vec3 color=mix(inputColor.rgb,thick.rgb,thick.a);
 color=mix(color,thin.rgb,thin.a);
 outputColor=vec4(color,inputColor.a);
}`;

export class OrbitalCloudEffect extends Effect{
 constructor(){super('OrbitalCloudProxy',fragment,{blendFunction:BlendFunction.NORMAL,uniforms:new Map<string,THREE.Uniform>([
  ['whiteHighlight',new THREE.Uniform(0)],['lightContrast',new THREE.Uniform(0)],['massMode',new THREE.Uniform(0)],['pixelAngle',new THREE.Uniform(.001)],['sourceCentre',new THREE.Uniform(new THREE.Vector2(.64,.78))],['rawSource',new THREE.Uniform(0)],['detailAmount',new THREE.Uniform(0)],['cloudDetailMap',new THREE.Uniform(null)],['cloudMap',new THREE.Uniform(null)],['inverseProjection',new THREE.Uniform(new THREE.Matrix4())],
  ['viewRotation',new THREE.Uniform(new THREE.Matrix3())],['geographicRotation',new THREE.Uniform(new THREE.Matrix3())],
  ['eye',new THREE.Uniform(new THREE.Vector3())],['sunLocal',new THREE.Uniform(new THREE.Vector3())],
  ['relief',new THREE.Uniform(1)],['amount',new THREE.Uniform(1)],['coverageBoost',new THREE.Uniform(0)]
 ])});}
 async load(url:string){
  const texture=await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace=THREE.NoColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=8;
  this.uniforms.get('cloudMap')!.value=texture;
 }
 async loadRegion(globalURL:string,detailURL:string){
  const data=await Promise.all([globalURL,detailURL].map(async url=>{
   const response=await fetch(url);if(!response.ok)throw Error(`Cloud R8 load ${response.status}`);return new Uint8Array(await response.arrayBuffer());
  }));
  const make=(bytes:Uint8Array,w:number,h:number)=>{
   if(bytes.length!==w*h)throw Error('Cloud R8 byte count mismatch');
   const t=new THREE.DataTexture(bytes,w,h,THREE.RedFormat,THREE.UnsignedByteType);
   t.internalFormat='R8';t.colorSpace=THREE.NoColorSpace;t.generateMipmaps=true;t.flipY=false;
   t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;
  };
  this.uniforms.get('cloudMap')!.value=make(data[0],2048,1024);
  this.uniforms.get('cloudDetailMap')!.value=make(data[1],4096,1536);
  this.uniforms.get('rawSource')!.value=1;
 }
 setDetail(value:string){this.uniforms.get('detailAmount')!.value=value==='8k'?1:0;}
 setCoverageBoost(value:number){this.uniforms.get('coverageBoost')!.value=THREE.MathUtils.clamp(value,0,.14);}
 setPlacement(near:boolean){this.uniforms.get('sourceCentre')!.value.set(near?.671875:.64,near?.8330078125:.78);}
 setWhiteHighlight(value:number){this.uniforms.get('whiteHighlight')!.value=THREE.MathUtils.clamp(value,0,1);}
 setLightContrast(on:boolean){this.uniforms.get('lightContrast')!.value=on?1:0;}
 setMass(on:boolean,height:number,camera:THREE.PerspectiveCamera){this.uniforms.get('massMode')!.value=on?1:0;this.uniforms.get('pixelAngle')!.value=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)*.5)/height;}
 sync(camera:THREE.PerspectiveCamera,toECEF:THREE.Matrix4,sunECEF:THREE.Vector3,mode:string,on:boolean){
  const basis=new THREE.Matrix3().setFromMatrix4(toECEF);
  this.uniforms.get('inverseProjection')!.value.copy(camera.projectionMatrixInverse);
  this.uniforms.get('viewRotation')!.value.setFromMatrix4(camera.matrixWorld);
  this.uniforms.get('geographicRotation')!.value.copy(basis);
  this.uniforms.get('eye')!.value.copy(camera.position);
  this.uniforms.get('sunLocal')!.value.copy(sunECEF).applyMatrix3(basis.clone().transpose()).normalize();
  this.uniforms.get('relief')!.value=mode==='relief'?1:0;
  this.uniforms.get('amount')!.value=on?1:0;
 }
}
