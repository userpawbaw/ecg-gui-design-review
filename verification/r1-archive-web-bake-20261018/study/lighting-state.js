import * as THREE from 'three';
export const DEFAULTS = Object.freeze({ curtainMode:'legacy',phaseG:.15,airDensity:.032,beamGain:1.8,flowSpeed:.16,sway:.75,cloudContrast:.55,cloudScale:1.2,sunDiameter:0,azimuth:225,elevation:35,strength:1,grain:.15,enabled:true,quality:'auto',frozen:true });
export function createLightingState(sun){
  const state={...DEFAULTS};
  const toSun=new THREE.Vector3();
  function update(){const a=THREE.MathUtils.degToRad(state.azimuth),e=THREE.MathUtils.degToRad(state.elevation);toSun.set(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));sun.position.copy(sun.target.position).addScaledVector(toSun,40);}
  function set(partial){
    for(const key of ['azimuth','elevation','strength','grain','sunDiameter','phaseG','airDensity','beamGain','flowSpeed','sway','cloudContrast','cloudScale'])if(Number.isFinite(+partial[key])&&partial[key]!==undefined)state[key]=+partial[key];
    if(['legacy','sun','flow'].includes(partial.curtainMode))state.curtainMode=partial.curtainMode;
    for(const [key,min,max]of [['phaseG',0,.6],['airDensity',.005,.08],['beamGain',0,6],['flowSpeed',0,.6],['sway',0,1.5],['cloudContrast',0,1],['cloudScale',.3,3]])state[key]=THREE.MathUtils.clamp(state[key],min,max);
    state.sunDiameter=THREE.MathUtils.clamp(state.sunDiameter,0,2);
    state.azimuth=((state.azimuth%360)+360)%360;state.elevation=THREE.MathUtils.clamp(state.elevation,5,85);state.strength=THREE.MathUtils.clamp(state.strength,0,2);state.grain=THREE.MathUtils.clamp(state.grain,0,.3);
    for(const key of ['enabled','frozen'])if(typeof partial[key]==='boolean')state[key]=partial[key];
    if(['auto','high','fast'].includes(partial.quality))state.quality=partial.quality;
    update();return state;
  }
  update();return {state,toSun,set,reset:()=>set(DEFAULTS)};
}
