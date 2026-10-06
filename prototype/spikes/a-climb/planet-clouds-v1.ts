import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
// World-space shell; NASA image is coverage, procedural 3D noise is density.
export async function createPlanetClouds(weather:THREE.Texture){
 const bytes=new Uint8Array(await (await fetch(new URL('./assets/planet-v2/cloud-noise.r8',import.meta.url))).arrayBuffer());
 const noise=new THREE.Data3DTexture(bytes,64,64,64);noise.format=THREE.RedFormat;noise.type=THREE.UnsignedByteType;noise.minFilter=noise.magFilter=THREE.LinearFilter;noise.wrapS=noise.wrapT=noise.wrapR=THREE.RepeatWrapping;noise.unpackAlignment=1;noise.needsUpdate=true;
 const material=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,uniforms:{tDiffuse:{value:null},tNoise:{value:noise},tWeather:{value:weather},uCover:{value:0},uProgress:{value:0},uTime:{value:0},uAspect:{value:1},uOn:{value:1},uBank:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()},uInvProj:{value:new THREE.Matrix4()},uCamWorld:{value:new THREE.Matrix4()},uPlanetInv:{value:new THREE.Matrix4()},uSun:{value:new THREE.Vector3()},uLightShadow:{value:1}},
 vertexShader:`out vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;precision highp sampler3D;
 uniform sampler2D tDiffuse,tWeather;uniform sampler3D tNoise;uniform float uCover,uTime,uProgress,uAspect,uOn,uLightShadow;uniform vec3 uCam,uSun,uBank;uniform mat4 uInvProj,uCamWorld,uPlanetInv;in vec2 vUv;out vec4 outColor;
 vec2 hit(vec3 o,vec3 d,float r){float b=dot(o,d),q=b*b-dot(o,o)+r*r;if(q<0.)return vec2(-1.);q=sqrt(q);return vec2(-b-q,-b+q);}
 float density(vec3 p){float r=length(p),h=(r-1.001)/.0055;vec3 q=mat3(uPlanetInv)*p;vec2 uv=vec2(fract(atan(q.z,-q.x)/6.2831853+1.),asin(clamp(q.y/r,-1.,1.))/3.14159265+.5);
 float weather=texture(tWeather,uv).r;float n=texture(tNoise,q*120.+vec3(uTime*.0007,0.,0.)).r;float detail=texture(tNoise,q*350.).r;
 float coverage=mix(weather,.86,smoothstep(.05,.6,uProgress));float d=smoothstep(.28,.9,coverage)*smoothstep(.25,.75,n+coverage*.23-detail*.14);float shell=d*smoothstep(0.,.18,h)*(1.-smoothstep(.65,1.,h));float bank=(1.-smoothstep(.035,.08,length(p-uBank)))*(.4+texture(tNoise,p*45.).r*.6)*uCover;return max(shell,bank);}
 void main(){vec3 bg=texture(tDiffuse,vUv).rgb;if(uOn<.5){outColor=vec4(0.,0.,0.,1.);return;}vec4 v=uInvProj*vec4(vUv*2.-1.,1.,1.);vec3 ray=normalize(mat3(uCamWorld)*(v.xyz/v.w));vec2 outer=hit(uCam,ray,1.0065),bank=hit(uCam-uBank,ray,.08);if(outer.y<=0.&&bank.y<=0.){outColor=vec4(0.,0.,0.,1.);return;}
 float start=max(0.,outer.x),end=outer.y;if(bank.y>0.&&uCover>.001){start=min(start,max(0.,bank.x));end=max(end,bank.y);}vec2 ground=hit(uCam,ray,1.0005);if(ground.x>0.)end=min(end,ground.x);float ds=(end-start)/56.;float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);float trans=1.;vec3 sum=vec3(0.);float mu=dot(ray,uSun);float g=.45,phase=(1.-g*g)/pow(1.+g*g-2.*g*mu,1.5);
 for(int i=0;i<56;i++){vec3 p=uCam+ray*(start+(float(i)+jitter)*ds);float den=density(p);if(den>.001){float optical=0.;for(int j=1;j<=5;j++)optical+=density(p+uSun*(float(j)*.0012))*.0012;float light=exp(-optical*900.*uLightShadow);float a=1.-exp(-den*ds*700.);vec3 color=vec3(.08,.13,.22)+vec3(.7,.65,.58)*light*(.5+phase*.25);sum+=trans*a*color;trans*=1.-a;if(trans<.008)break;}}
 vec3 col=sum+bg*trans;
 // Editorial cut under a fully opaque cloud, preserving the approved archive.
 float seal=smoothstep(.93,1.,uCover);col=mix(col,sum/max(1.-trans,.001),seal);outColor=vec4(mix(sum,sum/max(1.-trans,.001),seal),trans*(1.-seal));}`});
 const half=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
 const composite=new ShaderPass({uniforms:{tDiffuse:{value:null},tCloud:{value:half.texture}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse,tCloud;varying vec2 vUv;void main(){vec4 c=texture2D(tCloud,vUv);gl_FragColor=vec4(c.rgb+texture2D(tDiffuse,vUv).rgb*c.a,1.);}`});
 composite.uniforms.tCloud.value=half.texture;
 class CloudPass extends ShaderPass{
  override setSize(w:number,h:number){half.setSize(Math.max(1,Math.ceil(w/2)),Math.max(1,Math.ceil(h/2)));}
  override render(r:THREE.WebGLRenderer,write:THREE.WebGLRenderTarget,read:THREE.WebGLRenderTarget,dt:number){super.render(r,half,read,dt);composite.renderToScreen=this.renderToScreen;composite.render(r,write,read,dt);}
  override dispose(){super.dispose();half.dispose();composite.dispose();}
 }
 const pass=new CloudPass(material);
 return {pass,update(camera:THREE.Camera,planet:THREE.Object3D,sun:THREE.Vector3){pass.uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);pass.uniforms.uCamWorld.value.copy(camera.matrixWorld);pass.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);pass.uniforms.uPlanetInv.value.copy(planet.matrixWorld).invert();pass.uniforms.uSun.value.copy(sun);const radial=new THREE.Vector3(.3,.45,.842).normalize(),tangent=new THREE.Vector3(.82,.3,-.5).addScaledVector(radial,-new THREE.Vector3(.82,.3,-.5).dot(radial)).normalize();pass.uniforms.uBank.value.copy(radial).multiplyScalar(1.006).addScaledVector(tangent,.03);},dispose(){noise.dispose();pass.dispose();}};
}
