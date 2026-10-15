// D138: resampled Disney VDB, true local density ray march. Artistic world scale.
import * as THREE from 'three';
export const regionalVolumeShader=`
uniform sampler3D regionalFine,regionalCoarse;
uniform float regionalEnabled,regionalMorph;
vec3 volumeCentre(int i){return i==0?vec3(-14000.,11200.,-9000.):vec3(22000.,10500.,-36000.);}
vec3 volumeSize(int i){return i==0?vec3(52000.,mix(3600.,8400.,regionalMorph),46000.):vec3(36000.,mix(3000.,6500.,regionalMorph),40000.);}
vec3 volumeUV(vec3 p,int i){vec3 q=(p-volumeCentre(i))/volumeSize(i);if(i==1)q.xz=vec2(-q.z,q.x);return q+.5;}
float volumeDensity(vec3 p,int i,float footprint){
 vec3 uv=volumeUV(p,i);if(any(lessThan(uv,vec3(0.)))||any(greaterThan(uv,vec3(1.))))return 0.;
 float c=texture(regionalCoarse,uv).r,f=texture(regionalFine,uv).r;
 float resolved=regionalMorph*(1.-smoothstep(280.,1600.,footprint));
 // Actual density field morphology; alpha is computed from integrated extinction.
 return mix(c*c,f*f,resolved);
}
vec4 volumeCluster(vec3 ray,int id){
 vec3 size=volumeSize(id),pos=volumeCentre(id);
 // Second footprint rotates 90 degrees in the ground plane.
 vec3 boxSize=id==1?size.zyx:size;
 vec3 a=(pos-boxSize*.5-eye)/ray,b=(pos+boxSize*.5-eye)/ray;
 vec3 lo=min(a,b),hi=max(a,b);float start=max(0.,max(max(lo.x,lo.y),lo.z)),end=min(min(hi.x,hi.y),hi.z);
 if(end<=start)return vec4(0.);
 float ds=(end-start)/192.,trans=1.;vec3 color=vec3(0.);
 for(int j=0;j<192;j++){
  float t=start+(float(j)+.5)*ds;vec3 p=eye+ray*t;float footprint=max(280.,t*pixelAngle);
  float d=volumeDensity(p,id,footprint);if(d<.0005)continue;
  float tau=0.;for(int k=1;k<=6;k++)tau+=volumeDensity(p+sunLocal*(float(k)*650.),id,footprint)*650.*.0017;
  // Density gradient, not an atlas's baked light: highlights follow the live sun.
  float h=430.;vec3 g=vec3(volumeDensity(p+vec3(h,0.,0.),id,footprint)-volumeDensity(p-vec3(h,0.,0.),id,footprint),volumeDensity(p+vec3(0.,h,0.),id,footprint)-volumeDensity(p-vec3(0.,h,0.),id,footprint),volumeDensity(p+vec3(0.,0.,h),id,footprint)-volumeDensity(p-vec3(0.,0.,h),id,footprint));
  vec3 normal=normalize(-g+vec3(0.,.00001,0.));float facing=max(0.,dot(normal,sunLocal));
  float direct=exp(-tau);vec3 light=vec3(.014,.018,.025)+vec3(.54,.52,.49)*direct*(.35+.65*facing)+vec3(.045)*exp(-tau*.28);
  float opacity=1.-exp(-d*.0017*ds);color+=trans*opacity*light;trans*=1.-opacity;if(trans<.008)break;
 }
 // Stable distance haze, no time-based/random sample jitter.
 float haze=(1.-exp(-start/850000.))*.35;float alpha=1.-trans;color=mix(color,vec3(.30,.40,.53)*.065*alpha,haze);
 return vec4(color,alpha);
}
vec4 regionalCloud(vec3 ray){
 if(regionalEnabled<.5)return vec4(0.);
 vec4 a=volumeCluster(ray,0),b=volumeCluster(ray,1);
 // Both clusters are geographically fixed. Sort by centre range for this constrained path.
 return distance(eye,volumeCentre(0))<distance(eye,volumeCentre(1))?a+b*(1.-a.a):b+a*(1.-b.a);
}
`;
export async function loadRegionalVolume(){
 const urls=[new URL('./assets/disney-volume/fine.r8',import.meta.url).href,new URL('./assets/disney-volume/coarse.r8',import.meta.url).href];
 return Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Regional density load ${r.status}`);const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length!==192*96*192)throw Error('Regional density dimensions');const t=new THREE.Data3DTexture(bytes,192,96,192);t.format=THREE.RedFormat;t.type=THREE.UnsignedByteType;t.internalFormat='R8';t.colorSpace=THREE.NoColorSpace;t.minFilter=t.magFilter=THREE.LinearFilter;t.wrapS=t.wrapT=t.wrapR=THREE.ClampToEdgeWrapping;t.unpackAlignment=1;t.needsUpdate=true;return t;}));
}
