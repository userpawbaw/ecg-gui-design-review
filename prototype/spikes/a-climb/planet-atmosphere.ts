// D-071: Takram 0.19.1 / Bruneton LUT, radiance before the existing OutputPass.
// Surface PBR is already lit: atmospheric sunLight/skyLight stay OFF.
import * as THREE from 'three';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {EffectPass} from 'postprocessing';
import {SkyMaterial,AerialPerspectiveEffect,PrecomputedTexturesLoader} from '@takram/three-atmosphere';
export async function createPlanetAtmosphere(renderer:THREE.WebGLRenderer,camera:THREE.Camera){
 const urls:Record<string,string>={
  'transmittance.exr':new URL('./assets/atmosphere/transmittance.exr',import.meta.url).href,
  'scattering.exr':new URL('./assets/atmosphere/scattering.exr',import.meta.url).href,
  'irradiance.exr':new URL('./assets/atmosphere/irradiance.exr',import.meta.url).href};
 const manager=new THREE.LoadingManager();manager.setURLModifier(url=>urls[url.split('/').pop()!]||url);
 const textures=await new PrecomputedTexturesLoader({type:THREE.HalfFloatType,format:'exr',higherOrderScattering:false},manager).loadAsync('lut');
 const skyMat=new SkyMaterial({sun:false,moon:false,ground:true,correctAltitude:false});Object.assign(skyMat,textures);
 // Art-directed blue radiance balance, applied to sky only; LUT optical paths stay intact.
 skyMat.fragmentShader=skyMat.fragmentShader.replace('#include <mrt_output>','outputColor.rgb *= vec3(1.1,2.2,5.0);\n #include <mrt_output>');
 // A's scene uses radius=1; the LUT model uses metre ECEF (bottom radius6360km).
 skyMat.worldToECEFMatrix.makeScale(6360000,6360000,6360000);
 const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2),skyMat);sky.frustumCulled=false;sky.renderOrder=-10;
 const effect=new AerialPerspectiveEffect(camera,{...textures,correctAltitude:false,correctGeometricError:false,sunLight:false,skyLight:false,sky:false,sun:false,moon:false,transmittance:true,inscatter:true});
 effect.worldToECEFMatrix.copy(skyMat.worldToECEFMatrix);
 const inner=new EffectPass(camera,effect);inner.initialize(renderer,false,THREE.HalfFloatType);
 class Bridge extends Pass{
  override setSize(w:number,h:number){inner.setSize(w,h);}
  override render(r:THREE.WebGLRenderer,write:THREE.WebGLRenderTarget,read:THREE.WebGLRenderTarget,dt:number){inner.setDepthTexture(read.depthTexture,THREE.BasicDepthPacking);inner.renderToScreen=this.renderToScreen;inner.render(r,read,write,dt,false);}
  override dispose(){inner.dispose();}
 }
 const pass=new Bridge();pass.enabled=false;
 return {sky,pass,setSun:(v:THREE.Vector3)=>{skyMat.sunDirection.copy(v);effect.sunDirection.copy(v);},setEnabled:(on:boolean)=>{sky.visible=on;pass.enabled=on;},dispose:()=>{pass.dispose();sky.geometry.dispose();skyMat.dispose();Object.values(textures).forEach(t=>t?.dispose());}};
}
