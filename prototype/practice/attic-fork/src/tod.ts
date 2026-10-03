// Time of day for the baked original (F-032). Baked 'beauty' textures can't be relit, so each moment is
// grade (night curve + warm tint) + sky gradient + lamp pools. Keyframes on tod ∈ [0,1): day · dusk · night · dawn.
import * as THREE from 'three';
export type Tod={night:number,warm:number,lamp:number,top:THREE.Color,bot:THREE.Color,exposure:number};
const C=(h:number)=>new THREE.Color(h);
// order: day 0, dusk .25, night .5, dawn .75, day 1
const K=[
 {t:0,   night:0,   warm:0,   lamp:0,   top:C(0xb1c1cb),bot:C(0xc2bfae),exposure:1},
 {t:.25, night:.38, warm:1,   lamp:.55, top:C(0x56679a),bot:C(0xee9a62),exposure:.88},
 {t:.5,  night:1,   warm:0,   lamp:1,   top:C(0x070d26),bot:C(0x1d2748),exposure:1},
 {t:.75, night:.42, warm:.85, lamp:.5,  top:C(0x7f9bc8),bot:C(0xf4c398),exposure:.92},
 {t:1,   night:0,   warm:0,   lamp:0,   top:C(0xb1c1cb),bot:C(0xc2bfae),exposure:1},
];
const ease=(x:number)=>x*x*(3-2*x);
export function sample(tod:number,out?:Tod):Tod{
 const t=((tod%1)+1)%1;let i=0;while(i<K.length-2&&t>K[i+1].t)i++;
 const a=K[i],b=K[i+1],u=ease((t-a.t)/(b.t-a.t));
 const o=out??{night:0,warm:0,lamp:0,top:new THREE.Color(),bot:new THREE.Color(),exposure:1};
 o.night=THREE.MathUtils.lerp(a.night,b.night,u);o.warm=THREE.MathUtils.lerp(a.warm,b.warm,u);o.lamp=THREE.MathUtils.lerp(a.lamp,b.lamp,u);
 o.exposure=THREE.MathUtils.lerp(a.exposure,b.exposure,u);o.top.copy(a.top).lerp(b.top,u);o.bot.copy(a.bot).lerp(b.bot,u);return o;
}
// shared uniforms (one object, referenced by every patched material + the sky + the lamps)
export const U={uNight:{value:0},uWarm:{value:0},uExposure:{value:1}};
export const GRADE_GLSL=`
 vec3 nc=pow(max(outgoingLight,vec3(0.)),vec3(1.85))*vec3(.26,.34,.62)+vec3(.006,.010,.028);
 vec3 wc=outgoingLight*mix(vec3(1.),vec3(1.20,.86,.60),uWarm)*uExposure;
 outgoingLight=mix(wc,nc,uNight);
`;
export function apply(t:Tod){U.uNight.value=t.night;U.uWarm.value=t.warm;U.uExposure.value=t.exposure;}

/** Apply the day/night grade to any MeshBasicMaterial (baked room textures, hero book). `lampWarm` adds the lamp-lit warmth at night. */
export function graded(mat:THREE.MeshBasicMaterial,lampWarm=0):THREE.MeshBasicMaterial{
 mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  const lit=lampWarm>0?`
outgoingLight=mix(outgoingLight,outgoingLight*vec3(1.9,1.45,1.0)+vec3(.02,.012,.004),uNight*${lampWarm.toFixed(2)});`:'';
  sh.fragmentShader='uniform float uNight;uniform float uWarm;uniform float uExposure;\n'+
   sh.fragmentShader.replace('#include <opaque_fragment>',GRADE_GLSL+lit+'\n#include <opaque_fragment>');};
 return mat;
}
