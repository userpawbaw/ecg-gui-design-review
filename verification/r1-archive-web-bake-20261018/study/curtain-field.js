import * as THREE from 'three';

// D-152: authored world/light-space domain warp, not a curl fluid solver.
// Shared by PBR sunlight and volume so cloud shadows follow the same field.
export const curtainFieldGLSL = `
uniform float cfMode,cfTime,cfSpeed,cfSway,cfCloudContrast,cfCloudScale;
uniform vec3 cfBasisU,cfBasisV;
float cfHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float cfNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(cfHash(i),cfHash(i+vec3(1,0,0)),f.x),mix(cfHash(i+vec3(0,1,0)),cfHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(cfHash(i+vec3(0,0,1)),cfHash(i+vec3(1,0,1)),f.x),mix(cfHash(i+vec3(0,1,1)),cfHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float curtainCloud(vec3 p){
 if(cfMode<.5)return 1.;
 vec2 q=vec2(dot(p,cfBasisU),dot(p,cfBasisV))*cfCloudScale;
 vec2 drift=vec2(.13,-.07)*cfTime*cfSpeed;
 float n=cfNoise(vec3(q*.7+drift,2.37));
 float cloud=.12+.88*smoothstep(.25,.72,n);
 return mix(1.,cloud,cfCloudContrast);
}
float curtainDensity(vec3 p,vec3 toSun){
 vec3 q=vec3(dot(p,cfBasisU),dot(p,cfBasisV),dot(p,-toSun));
 float t=cfTime*cfSpeed;
 float bend=cfSway*(.65*sin(q.y*1.6+t*.7+sin(q.z*.9-t*.6))+.35*sin(q.z*1.1+t*.9));
 float folded=(q.x+bend-t*.38)*6.+sin(q.y*2.4-t*1.7)+.4*sin(q.z*2.-t);
 float ridge=pow(.5+.5*sin(folded),4.);
 return .04+2.3*ridge;
}
`;
export function createCurtainField(lighting){
 const uniforms={cfMode:{value:0},cfTime:{value:0},cfSpeed:{value:.16},cfSway:{value:.75},cfCloudContrast:{value:.55},cfCloudScale:{value:1.2},cfBasisU:{value:new THREE.Vector3()},cfBasisV:{value:new THREE.Vector3()}};
 const worldUp=new THREE.Vector3(0,1,0);
 return {uniforms,update(time){const s=lighting.state;
 // Elevation is clamped to85°; a fixed up axis avoids a visible basis flip near76°.
 uniforms.cfBasisU.value.crossVectors(lighting.toSun,worldUp);if(uniforms.cfBasisU.value.lengthSq()<1e-8)uniforms.cfBasisU.value.set(1,0,0);else uniforms.cfBasisU.value.normalize();uniforms.cfBasisV.value.crossVectors(lighting.toSun,uniforms.cfBasisU.value).normalize();uniforms.cfMode.value=s.curtainMode==='flow'?2:s.curtainMode==='sun'?1:0;uniforms.cfTime.value=Number.isFinite(time)?Math.max(0,time):0;uniforms.cfSpeed.value=s.flowSpeed??.16;uniforms.cfSway.value=s.sway??.75;uniforms.cfCloudContrast.value=s.cloudContrast??.55;uniforms.cfCloudScale.value=s.cloudScale??1.2;},get phaseG(){return lighting.state.curtainMode==='legacy'?.5:THREE.MathUtils.clamp(lighting.state.phaseG??.15,0,.6);}};
}

// An elapsed clock whose freeze/pause/hidden transitions keep the last field state.
export function createCurtainClock(){
 let time=0,last=null;
 return {sample(now,running){if(last!==null&&running)time+=Math.max(0,(now-last)/1000);last=now;return time;},suspend(){last=null;},setTime(value){if(!Number.isFinite(value)||value<0||value>86400)throw new Error('Invalid animation time');time=value;last=null;},get time(){return time;}};
}
