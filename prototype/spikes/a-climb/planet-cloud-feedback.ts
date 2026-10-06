import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
// D-081: stopped, unadopted global-volume experiment. This is NOT the proposed
// far texture / mid 2.5D / selected near-volume route. It retained visible artifacts.
// NASA coverage + synthetic height/erosion, not measured weather.
export async function createPlanetClouds(weather:THREE.Texture){
 const bytes=new Uint8Array(await (await fetch(new URL('./assets/planet-v2/cloud-noise.r8',import.meta.url))).arrayBuffer());
 const shapeBytes=new Uint8Array(await (await fetch(new URL('./assets/cloud-layers/shape-erosion.rgba8',import.meta.url))).arrayBuffer());const shape=new THREE.Data3DTexture(shapeBytes,64,64,64);shape.format=THREE.RGBAFormat;shape.type=THREE.UnsignedByteType;shape.minFilter=shape.magFilter=THREE.LinearFilter;shape.wrapS=shape.wrapT=shape.wrapR=THREE.RepeatWrapping;shape.unpackAlignment=1;shape.needsUpdate=true;
 const noise=new THREE.Data3DTexture(bytes,64,64,64);noise.format=THREE.RedFormat;noise.type=THREE.UnsignedByteType;noise.minFilter=noise.magFilter=THREE.LinearFilter;noise.wrapS=noise.wrapT=noise.wrapR=THREE.RepeatWrapping;noise.unpackAlignment=1;noise.needsUpdate=true;
 const material=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,uniforms:{tDiffuse:{value:null},tNoise:{value:noise},tShape:{value:shape},tWeather:{value:weather},uCover:{value:0},uProgress:{value:0},uTime:{value:0},uAspect:{value:1},uOn:{value:1},uBank:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()},uInvProj:{value:new THREE.Matrix4()},uCamWorld:{value:new THREE.Matrix4()},uPlanetInv:{value:new THREE.Matrix4()},uSun:{value:new THREE.Vector3()},uLightShadow:{value:1}},
 vertexShader:`out vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;precision highp sampler3D;
 uniform sampler2D tDiffuse,tWeather;uniform sampler3D tNoise,tShape;uniform float uCover,uTime,uProgress,uAspect,uOn,uLightShadow;uniform vec3 uCam,uSun,uBank;uniform mat4 uInvProj,uCamWorld,uPlanetInv;in vec2 vUv;out vec4 outColor;
 vec2 hit(vec3 o,vec3 d,float r){float b=dot(o,d),q=b*b-dot(o,o)+r*r;if(q<0.)return vec2(-1.);q=sqrt(q);return vec2(-b-q,-b+q);}

 float density(vec3 p){
 float r=length(p),alt=r-1.;vec3 q=mat3(uPlanetInv)*p;
 vec2 uv=vec2(fract(atan(q.z,-q.x)/6.2831853+1.),asin(clamp(q.y/r,-1.,1.))/3.14159265+.5);
 // Use a filtered coverage envelope, not the original high-frequency white pixels.
 float w=textureLod(tWeather,uv,1.4).r;

 vec4 shape=texture(tShape,q*180.);
 float large=texture(tShape,q*70.).r,medium=1.-shape.b;
 float coverage=pow(clamp(w*1.15,0.,1.),1.5);
 float base=.00042,top=.00095+.00105*large+.00032*medium;
 float h=(alt-base)/max(top-base,.0001);
 float profile=smoothstep(0.,.14,h)*(1.-smoothstep(.44,1.,h));
 float macro=shape.r*.70+medium*.30;
 // Weather controls broad occurrence; 3D form defines the actual body and voids.
 float body=max(0.,macro*profile-(1.-coverage)*.52);
 float erosion=texture(tShape,q*720.).g;
 float thick=max(0.,body-erosion*.10)*.58;
 float thinH=(alt-.0018)/.00044;
 float thin=sin(clamp(thinH,0.,1.)*3.14159265)*smoothstep(.40,.74,w)*smoothstep(.32,.65,texture(tNoise,vec3(q.x*18.+q.z*6.,q.y*75.,q.z*85.)).r)*.045;
 return thick+thin;
 }
 void main(){vec3 bg=texture(tDiffuse,vUv).rgb;if(uOn<.5){outColor=vec4(0.,0.,0.,1.);return;}vec4 v=uInvProj*vec4(vUv*2.-1.,1.,1.);vec3 ray=normalize(mat3(uCamWorld)*(v.xyz/v.w));vec2 outer=hit(uCam,ray,1.0025),bank=hit(uCam-uBank,ray,.08);if(outer.y<=0.&&bank.y<=0.){outColor=vec4(0.,0.,0.,1.);return;}
 float start=max(0.,outer.x),end=outer.y;vec2 ground=hit(uCam,ray,1.00025);if(ground.x>0.)end=min(end,ground.x);float ds=(end-start)/112.;float jitter=.5;float trans=1.;vec3 sum=vec3(0.);float mu=dot(ray,uSun);float g=.45,phase=(1.-g*g)/pow(1.+g*g-2.*g*mu,1.5);
 for(int i=0;i<112;i++){vec3 p=uCam+ray*(start+(float(i)+jitter)*ds);float den=density(p);if(den>.001){float optical=0.;for(int j=1;j<=8;j++)optical+=density(p+uSun*(float(j)*.00009))*.00009;float light=exp(-optical*5800.*uLightShadow);float a=1.-exp(-den*ds*5800.);float day=smoothstep(-.12,.08,dot(normalize(p),uSun));float powder=1.-exp(-den*2.);vec3 ambient=vec3(.025,.045,.075)+vec3(.06,.08,.11)*exp(-optical*800.);vec3 color=ambient+vec3(.62,.57,.48)*day*(light*(.58+min(phase,5.)*.055)+exp(-optical*1400.)*.13*powder);sum+=trans*a*color;trans*=1.-a;if(trans<.008)break;}}
 vec3 col=sum+bg*trans;
 // Editorial cut under a fully opaque cloud, preserving the approved archive.
 float seal=smoothstep(.93,1.,uCover);col=mix(col,sum/max(1.-trans,.001),seal);outColor=vec4(mix(sum,sum/max(1.-trans,.001),seal),trans*(1.-seal));}`});
 const half=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
 const composite=new ShaderPass({uniforms:{tDiffuse:{value:null},tCloud:{value:half.texture}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse,tCloud;varying vec2 vUv;void main(){vec4 c=texture2D(tCloud,vUv);gl_FragColor=vec4(c.rgb+texture2D(tDiffuse,vUv).rgb*c.a,1.);}`});
 composite.uniforms.tCloud.value=half.texture;
 class CloudPass extends ShaderPass{
  override setSize(w:number,h:number){half.setSize(w,h);}
  override render(r:THREE.WebGLRenderer,write:THREE.WebGLRenderTarget,read:THREE.WebGLRenderTarget,dt:number){super.render(r,half,read,dt);composite.renderToScreen=this.renderToScreen;composite.render(r,write,read,dt);}
  override dispose(){super.dispose();half.dispose();composite.dispose();}
 }
 const pass=new CloudPass(material);
 return {pass,state:()=>({model:"feedback1 layered coverage-height volume",viewSamples:112,lightSamples:8,fullResolution:true}),update(camera:THREE.Camera,planet:THREE.Object3D,sun:THREE.Vector3){pass.uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);pass.uniforms.uCamWorld.value.copy(camera.matrixWorld);pass.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);pass.uniforms.uPlanetInv.value.copy(planet.matrixWorld).invert();pass.uniforms.uSun.value.copy(sun);const radial=new THREE.Vector3(.3,.45,.842).normalize(),tangent=new THREE.Vector3(.82,.3,-.5).addScaledVector(radial,-new THREE.Vector3(.82,.3,-.5).dot(radial)).normalize();pass.uniforms.uBank.value.copy(radial).multiplyScalar(1.006).addScaledVector(tangent,.03);},dispose(){shape.dispose();noise.dispose();pass.dispose();}};
}
