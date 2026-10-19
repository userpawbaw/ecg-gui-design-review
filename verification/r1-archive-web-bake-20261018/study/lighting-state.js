import * as THREE from 'three';
export const DEFAULTS = Object.freeze({ azimuth:225,elevation:35,strength:1,grain:.15,enabled:true,quality:'auto',frozen:true });
export function createLightingState(sun){
  const state={...DEFAULTS};
  const toSun=new THREE.Vector3();
  function update(){const a=THREE.MathUtils.degToRad(state.azimuth),e=THREE.MathUtils.degToRad(state.elevation);toSun.set(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));sun.position.copy(sun.target.position).addScaledVector(toSun,40);}
  function set(partial){
    for(const key of ['azimuth','elevation','strength','grain'])if(Number.isFinite(+partial[key])&&partial[key]!==undefined)state[key]=+partial[key];
    state.azimuth=((state.azimuth%360)+360)%360;state.elevation=THREE.MathUtils.clamp(state.elevation,5,85);state.strength=THREE.MathUtils.clamp(state.strength,0,2);state.grain=THREE.MathUtils.clamp(state.grain,0,.3);
    for(const key of ['enabled','frozen'])if(typeof partial[key]==='boolean')state[key]=partial[key];
    if(['auto','high','fast'].includes(partial.quality))state.quality=partial.quality;
    update();return state;
  }
  update();return {state,toSun,set,reset:()=>set(DEFAULTS)};
}
