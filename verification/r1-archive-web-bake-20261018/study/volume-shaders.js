// D-148 / REF-016: project-owned archive.ts raymarch adapted for the independent study.
// External shader sources are referenced in the design, not copied into this module.
export const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const common = `
precision highp float;
varying vec2 vUv;
uniform sampler2D viewDepth;
uniform float cameraNear, cameraFar;
float linearDepth(float d){return cameraNear*cameraFar/(cameraFar+d*(cameraNear-cameraFar));}
`;
export const volumeShader = common + `
uniform sampler2D lightDepth;
uniform mat4 inverseProjection, cameraWorld, lightVP;
uniform vec3 cameraPositionWorld, boundsMin, boundsMax, toSun, sunColor, basisU, basisV;
uniform float sunIntensity, strength, grain, time, depthBias, sigmaT, sigmaS;
uniform int steps;
uniform float sunTangent,lightDepthRange;
uniform vec2 lightSpan;
float hash3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float valueNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float visibility(vec3 p){vec4 lp=lightVP*vec4(p,1.);vec3 q=lp.xyz/lp.w*.5+.5;
 if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return 0.;
 float blocker=texture2D(lightDepth,q.xy).r;
 if(sunTangent<=0.)return step(q.z-depthBias,blocker);
 // Four stable samples at a distance-dependent disc radius; surface uses 16+32 PCSS.
 vec2 radius=max(0.,q.z-blocker)*lightDepthRange*sunTangent/lightSpan;
 float v=0.;for(int i=0;i<4;i++){float a=(float(i)+.5)*2.39996323;vec2 uv=q.xy+vec2(cos(a),sin(a))*.7*radius;v+=step(q.z-depthBias,texture2D(lightDepth,uv).r);}return v*.25;}
void main(){
 float d=texture2D(viewDepth,vUv).r;
 vec4 view=inverseProjection*vec4(vUv*2.-1.,d*2.-1.,1.);view/=view.w;
 vec3 surface=(cameraWorld*view).xyz, ray=normalize(surface-cameraPositionWorld);
 float endRay=distance(surface,cameraPositionWorld),enter=0.,exit=min(endRay,cameraFar);
 // Slab intersection supports cameras inside/outside and exactly parallel rays.
 for(int axis=0;axis<3;axis++){
  float r=ray[axis],p=cameraPositionWorld[axis];
  if(abs(r)<.000001){if(p<boundsMin[axis]||p>boundsMax[axis]){gl_FragColor=vec4(0.,0.,0.,1.);return;}}
  else{float a=(boundsMin[axis]-p)/r,b=(boundsMax[axis]-p)/r;enter=max(enter,min(a,b));exit=min(exit,max(a,b));}
 }
 if(exit<=enter){gl_FragColor=vec4(0.,0.,0.,1.);return;}
 float ds=(exit-enter)/float(steps),transmittance=1.;vec3 radiance=vec3(0.);
 float jitter=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
 float g=.5,c=dot(toSun,ray),phase=(1.-g*g)/pow(1.+g*g-2.*g*c,1.5);
 for(int i=0;i<64;i++){
  if(i>=steps)break;
  vec3 p=cameraPositionWorld+ray*(enter+(float(i)+jitter)*ds);
  vec3 edge=min(p-boundsMin,boundsMax-p);float fade=smoothstep(0.,.22,min(edge.x,min(edge.y,edge.z)));
  vec3 q=vec3(dot(p,basisU)*3.,dot(p,basisV)*3.,dot(p,-toSun)*.3)+vec3(0.,time*.01,0.);
  float variation=1.+grain*(2.*valueNoise(q)-1.);
  float density=variation*fade;
  float attenuation=exp(-sigmaT*density*ds);
  float integrated=(1.-attenuation)*(sigmaS/max(sigmaT,.000001));
  radiance+=transmittance*integrated*visibility(p)*sunColor*sunIntensity*phase*strength;
  transmittance*=attenuation;
 }
 gl_FragColor=vec4(radiance,transmittance);
}`;
export const filterShader = common + `
uniform sampler2D volume;
uniform vec2 texel;
void main(){
 float center=linearDepth(texture2D(viewDepth,vUv).r);vec4 sum=vec4(0.);float total=0.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 uv=vUv+vec2(float(x),float(y))*texel;
  float neighbor=linearDepth(texture2D(viewDepth,uv).r);
  float w=exp(-float(x*x+y*y)*.5)*exp(-abs(center-neighbor)/max(.03,center*.015));
  sum+=texture2D(volume,uv)*w;total+=w;
 }
 gl_FragColor=sum/max(total,.000001);
}`;
export const compositeShader = common + `
uniform sampler2D sceneColor, volume;
uniform vec2 volumeSize;
void main(){
 vec3 scene=texture2D(sceneColor,vUv).rgb;
 float z=linearDepth(texture2D(viewDepth,vUv).r);
 vec2 coord=vUv*volumeSize-.5,base=floor(coord),f=fract(coord);
 vec4 sum=vec4(0.);float weight=0.;
 for(int y=0;y<=1;y++)for(int x=0;x<=1;x++){
  vec2 delta=vec2(float(x),float(y)),uv=(base+delta+.5)/volumeSize;
  float neighbor=linearDepth(texture2D(viewDepth,uv).r);
  vec2 w=mix(1.-f,f,delta);
  float v=w.x*w.y*exp(-abs(z-neighbor)/max(.025,z*.012));
  sum+=texture2D(volume,uv)*v;weight+=v;
 }
 vec4 fog=weight>.000001?sum/weight:vec4(0.,0.,0.,1.);
 gl_FragColor=vec4(scene*fog.a+fog.rgb,1.);
}`;
