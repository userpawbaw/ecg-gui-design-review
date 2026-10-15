// D138: resampled Disney VDB, true local density ray march. Artistic world scale.
import * as THREE from 'three';
export const regionalVolumeShader=`
uniform sampler3D regionalFine,regionalCoarse;
uniform float regionalEnabled,regionalMorph,regionalJoined,regionalScattering;
float regionalGroundLimit=1.e12;
float regionalWeightedDistance=1.e12;
float cloudHG(float c,float g){return (1.-g*g)/pow(max(.001,1.+g*g-2.*g*c),1.5);}
float cloudPhase(float c,float k){return .8*cloudHG(c,.65*k)+.2*cloudHG(c,-.2*k);}
vec3 volumeCentre(int i){return i==0?vec3(-14000.,mix(11200.,10600.,regionalJoined),-9000.):vec3(22000.,mix(10500.,10200.,regionalJoined),-36000.);}
vec3 volumeSize(int i){return i==0?vec3(52000.,mix(mix(3600.,8400.,regionalMorph),5600.,regionalJoined),46000.):vec3(36000.,mix(mix(3000.,6500.,regionalMorph),4400.,regionalJoined),40000.);}
vec3 volumeUV(vec3 p,int i){vec3 q=(p-volumeCentre(i))/volumeSize(i);if(i==1)q.xz=vec2(-q.z,q.x);return q+.5;}
float volumeDensity(vec3 p,int i,float footprint){
 vec3 uv=volumeUV(p,i);if(any(lessThan(uv,vec3(0.)))||any(greaterThan(uv,vec3(1.))))return 0.;
 float c=texture(regionalCoarse,uv).r,f=texture(regionalFine,uv).r;
 float resolved=regionalMorph*(1.-smoothstep(280.,1600.,footprint));
 // Actual density field morphology; alpha is computed from integrated extinction.
 float d=mix(c*c,f*f,resolved);
 // D139: only the lower volume inherits the existing satellite footprint.
 // No rectangle/ellipse cut-out and no screen/time opacity ramp.
 if(regionalJoined>.5){float support=smoothstep(.22,.62,filteredDensity(geoUV(normalize(p-centre)),max(1800.,footprint)));float lower=1.-smoothstep(.12,.62,uv.y);d*=mix(1.,support,lower);}
 return d;
}
vec4 volumeCluster(vec3 ray,int id,out float meanDistance){
 meanDistance=1.e12;
 vec3 size=volumeSize(id),pos=volumeCentre(id);
 // Second footprint rotates 90 degrees in the ground plane.
 vec3 boxSize=id==1?size.zyx:size;
 vec3 a=(pos-boxSize*.5-eye)/ray,b=(pos+boxSize*.5-eye)/ray;
 vec3 lo=min(a,b),hi=max(a,b);float start=max(0.,max(max(lo.x,lo.y),lo.z)),end=min(regionalGroundLimit,min(min(hi.x,hi.y),hi.z));
 if(end<=start)return vec4(0.);
 float ds=(end-start)/192.,trans=1.,depthSum=0.;vec3 color=vec3(0.);
 for(int j=0;j<192;j++){
  float t=start+(float(j)+.5)*ds;vec3 p=eye+ray*t;float footprint=max(280.,t*pixelAngle);
  float d=volumeDensity(p,id,footprint);if(d<.0005)continue;
  float tau=0.;
  if(regionalScattering>.5){
   vec3 edge0=(pos-boxSize*.5-p)/sunLocal,edge1=(pos+boxSize*.5-p)/sunLocal;
   vec3 exits=max(edge0,edge1);float lightExit=max(0.,min(min(exits.x,exits.y),exits.z)),last=0.;
   // Six expanding segments cover the complete local light path, rather than 3.9km.
   for(int k=1;k<=6;k++){float next=lightExit*(pow(2.,float(k))-1.)/63.;tau+=volumeDensity(p+sunLocal*((last+next)*.5),id,max(900.,footprint))*(next-last)*.0017;last=next;}
  }else for(int k=1;k<=6;k++)tau+=volumeDensity(p+sunLocal*(float(k)*650.),id,footprint)*650.*.0017;
  // Density gradient, not an atlas's baked light: highlights follow the live sun.
  vec3 light;
  if(regionalScattering>.5){float scattered=0.,c=dot(ray,sunLocal);for(int n=0;n<3;n++){float k=pow(.5,float(n));scattered+=k*exp(-tau*k)*cloudPhase(c,k);}
   light=vec3(.014,.018,.025)+vec3(.31,.30,.28)*scattered;
  }else{float h=430.;vec3 g=vec3(volumeDensity(p+vec3(h,0.,0.),id,footprint)-volumeDensity(p-vec3(h,0.,0.),id,footprint),volumeDensity(p+vec3(0.,h,0.),id,footprint)-volumeDensity(p-vec3(0.,h,0.),id,footprint),volumeDensity(p+vec3(0.,0.,h),id,footprint)-volumeDensity(p-vec3(0.,0.,h),id,footprint));
  vec3 normal=normalize(-g+vec3(0.,.00001,0.));float facing=max(0.,dot(normal,sunLocal));
  float direct=exp(-tau);light=vec3(.014,.018,.025)+vec3(.54,.52,.49)*direct*(.35+.65*facing)+vec3(.045)*exp(-tau*.28);
  }
  float opacity=1.-exp(-d*.0017*ds);depthSum+=trans*opacity*t;color+=trans*opacity*light;trans*=1.-opacity;if(trans<.008)break;
 }
 // Stable distance haze, no time-based/random sample jitter.
 float haze=(1.-exp(-start/850000.))*.35;float alpha=1.-trans;meanDistance=alpha>.0001?depthSum/alpha:1.e12;color=mix(color,vec3(.30,.40,.53)*.065*alpha,haze);
 return vec4(color,alpha);
}
vec4 regionalCloud(vec3 ray){
 if(regionalEnabled<.5)return vec4(0.);
 float da,db;vec4 a=volumeCluster(ray,0,da),b=volumeCluster(ray,1,db);
 // Both clusters are geographically fixed. Sort by centre range for this constrained path.
 bool first=distance(eye,volumeCentre(0))<distance(eye,volumeCentre(1));
 vec4 nearC=first?a:b,farC=first?b:a;float nearD=first?da:db,farD=first?db:da;
 vec4 c=nearC+farC*(1.-nearC.a);regionalWeightedDistance=c.a>.0001?(nearD*nearC.a+farD*farC.a*(1.-nearC.a))/c.a:1.e12;return c;
}
`;
export async function loadRegionalVolume(){
 const urls=[new URL('./assets/disney-volume/fine.r8',import.meta.url).href,new URL('./assets/disney-volume/coarse.r8',import.meta.url).href];
 return Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Regional density load ${r.status}`);const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length!==192*96*192)throw Error('Regional density dimensions');const t=new THREE.Data3DTexture(bytes,192,96,192);t.format=THREE.RedFormat;t.type=THREE.UnsignedByteType;t.internalFormat='R8';t.colorSpace=THREE.NoColorSpace;t.minFilter=t.magFilter=THREE.LinearFilter;t.wrapS=t.wrapT=t.wrapR=THREE.ClampToEdgeWrapping;t.unpackAlignment=1;t.needsUpdate=true;return t;}));
}
