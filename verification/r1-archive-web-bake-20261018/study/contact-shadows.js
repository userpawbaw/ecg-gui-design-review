import * as THREE from 'three';
import {curtainFieldGLSL} from './curtain-field.js';

// PCSS principle: finite-disc blocker search, then distance-dependent visibility filter.
// Authored here from the geometric model; no external shader source is bundled.
export const contactShadowGLSL=`
uniform sampler2D archiveLightDepth;
uniform mat4 archiveLightVP;
uniform vec2 archiveLightSpan;
uniform float archiveDepthRange, archiveSunTangent, archiveDepthBias;
varying vec3 vArchiveShadowWorld;
vec2 archiveDisk(int i,int count){float n=float(i)+.5;float r=sqrt(n/float(count));float a=n*2.39996323;return vec2(cos(a),sin(a))*r;}
float archiveVisibility(vec3 q){if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return 1.;return step(q.z-archiveDepthBias,texture2D(archiveLightDepth,q.xy).r);}
float archiveSoftShadow(){
 vec4 lp=archiveLightVP*vec4(vArchiveShadowWorld,1.);vec3 q=lp.xyz/lp.w*.5+.5;
 q.z-=.015/archiveDepthRange;
 if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return 1.;
 vec2 searchRadius=q.z*archiveDepthRange*archiveSunTangent/archiveLightSpan;
 float blocker=0.,count=0.;
 for(int i=0;i<16;i++){vec2 uv=q.xy+archiveDisk(i,16)*searchRadius;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))continue;float z=texture2D(archiveLightDepth,uv).r;if(z<q.z-archiveDepthBias){blocker+=z;count+=1.;}}
 if(count<.5)return 1.;
 float separation=max(0.,(q.z-blocker/count)*archiveDepthRange);
 vec2 radius=separation*archiveSunTangent/archiveLightSpan;
 float sum=0.;for(int i=0;i<32;i++)sum+=archiveVisibility(vec3(q.xy+archiveDisk(i,32)*radius,q.z));
 return sum/32.;
}
`;
export function installContactShadows(root,{lightRT,lightCamera,lightVP,depthBias,lighting,field}){
 const uniforms={...field.uniforms,archiveLightDepth:{value:lightRT.depthTexture},archiveLightVP:lightVP,archiveLightSpan:{value:new THREE.Vector2(1,1)},archiveDepthRange:{value:1},archiveSunTangent:{value:0},archiveDepthBias:depthBias};
 const originals=[];const seen=new Set();
 root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m)||!m.isMeshStandardMaterial)return;seen.add(m);const old=m.onBeforeCompile,key=m.customProgramCacheKey;originals.push({m,old,key});
 m.onBeforeCompile=function(shader,renderer){old.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec3 vArchiveShadowWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vArchiveShadowWorld = (modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader=curtainFieldGLSL+contactShadowGLSL+'\n'+shader.fragmentShader;
 const chunk=THREE.ShaderChunk.lights_fragment_begin;
 const call='getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] )';
 if(!chunk.includes(call))throw new Error('Three directional shadow contract changed');
 shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',chunk.replace(call,`(curtainCloud(vArchiveShadowWorld)*(archiveSunTangent > 0. ? mix(1.,archiveSoftShadow(),directionalLightShadow.shadowIntensity) : ${call}))`));};m.customProgramCacheKey=()=>key.call(m)+'_archive_pcss_curtain_v2';m.needsUpdate=true;
 }});
 return {uniforms,update(){uniforms.archiveLightSpan.value.set(lightCamera.right-lightCamera.left,lightCamera.top-lightCamera.bottom);uniforms.archiveDepthRange.value=lightCamera.far-lightCamera.near;uniforms.archiveSunTangent.value=Math.tan(THREE.MathUtils.degToRad(lighting.state.sunDiameter||0)*.5);},dispose(){for(const {m,old,key}of originals){m.onBeforeCompile=old;m.customProgramCacheKey=key;m.needsUpdate=true;}}};
}
